import prisma from "../../../lib/prisma";
import { getInventoryOverview, getSalesInsights } from "../../admin/kpis";
import { resolveAdminPeriodRange, type AdminPeriodInput } from "../../admin/kpis/period";
import { HEALTH_COMPONENT_LABELS } from "../unit-health/scoring";
import { getUnitsHealth } from "../unit-health/service";
import type {
  PanoramaAttentionSignal,
  PanoramaOpportunity,
  PanoramaSnapshot,
} from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 1) — agregador do Panorama Vivo.
 * A API acompanha a hierarquia da navegação (governança #8 do PLAN-0022): esta função
 * monta a tela inicial inteira numa única chamada, sem o frontend precisar de N requests.
 */

const round1 = (value: number): number => Math.round(value * 10) / 10;

const ATTENTION_FULFILLMENT_STATUSES = ["PENDENTE", "SEPARANDO", "EMBALADO", "DESPACHADO"] as const;
/** Pago há mais de 24h sem terminar o fulfillment -> entra na contagem de atenção do Panorama. */
const ORDER_ATTENTION_HOURS = 24;
/** Janela olhada para trás em busca de clientes que já foram recorrentes e sumiram. */
const LAPSED_LOOKBACK_DAYS = 90;

const customerIdentityKey = (order: {
  customerEmail: string | null;
  customerPhone: string | null;
  customerName: string | null;
}): string =>
  (order.customerEmail || "").trim().toLowerCase() ||
  (order.customerPhone || "").trim() ||
  (order.customerName || "").trim() ||
  "(sem identificacao)";

const countByIdentity = (
  orders: Array<{ customerEmail: string | null; customerPhone: string | null; customerName: string | null }>
): Map<string, number> => {
  const map = new Map<string, number>();
  for (const order of orders) {
    const key = customerIdentityKey(order);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
};

const countOrdersNeedingAttention = async (unitIds: number[] | undefined): Promise<number> => {
  const staleBefore = new Date(Date.now() - ORDER_ATTENTION_HOURS * 60 * 60 * 1000);
  return prisma.order.count({
    where: {
      status: "PAGO",
      fulfillmentStatus: { in: [...ATTENTION_FULFILLMENT_STATUSES] },
      paymentConfirmedAt: { lte: staleBefore },
      ...(unitIds && unitIds.length ? { unitId: { in: unitIds } } : {}),
    },
  });
};

/**
 * Recorrência da rede + clientes "em risco": proxy baseado em pedidos PAGO, mesma chave de
 * identidade (email > telefone > nome) usada em `dashboardSalesInsights.ts` e no Health
 * Score por unidade. "Em risco" = já foi recorrente (>=2 pedidos) nos últimos
 * `LAPSED_LOOKBACK_DAYS` antes do período, mas não comprou nada dentro do período atual.
 */
const calculateCustomerSignals = async (
  from: Date,
  to: Date,
  unitIds: number[] | undefined
): Promise<{ newInPeriod: number; recurrenceRate: number; atRisk: number }> => {
  const lapsedWindowStart = new Date(from.getTime() - LAPSED_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const unitFilter = unitIds && unitIds.length ? { unitId: { in: unitIds } } : {};

  const [newInPeriod, currentOrders, historicalOrders] = await Promise.all([
    prisma.customer.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.order.findMany({
      where: { status: "PAGO", createdAt: { gte: from, lte: to }, ...unitFilter },
      select: { customerEmail: true, customerPhone: true, customerName: true },
    }),
    prisma.order.findMany({
      where: { status: "PAGO", createdAt: { gte: lapsedWindowStart, lt: from }, ...unitFilter },
      select: { customerEmail: true, customerPhone: true, customerName: true },
    }),
  ]);

  const currentCounts = countByIdentity(currentOrders);
  const historicalCounts = countByIdentity(historicalOrders);

  const distinctCurrent = currentCounts.size;
  const returning = Array.from(currentCounts.values()).filter((count) => count >= 2).length;
  const recurrenceRate = distinctCurrent > 0 ? Math.min(100, (returning / distinctCurrent) * 100) : 0;

  let atRisk = 0;
  for (const [key, count] of historicalCounts.entries()) {
    if (count >= 2 && !currentCounts.has(key)) atRisk += 1;
  }

  return { newInPeriod, recurrenceRate: round1(recurrenceRate), atRisk };
};

const buildAttentionSignals = (
  unitsHealth: Awaited<ReturnType<typeof getUnitsHealth>>,
  ordersNeedingAttention: number
): PanoramaAttentionSignal[] => {
  const signals: PanoramaAttentionSignal[] = [];

  const worstUnit = [...unitsHealth].sort((a, b) => a.score - b.score)[0];
  if (worstUnit && (worstUnit.state === "CRITICAL" || worstUnit.state === "ATTENTION")) {
    const weaknessLabel = HEALTH_COMPONENT_LABELS[worstUnit.primaryWeakness];
    signals.push({
      level: worstUnit.state === "CRITICAL" ? "critical" : "attention",
      message: `${worstUnit.unitName} está em ${
        worstUnit.state === "CRITICAL" ? "estado crítico" : "atenção"
      } (score ${worstUnit.score}) — principal causa: ${weaknessLabel}.`,
    });
  }

  if (ordersNeedingAttention > 0) {
    signals.push({
      level: "attention",
      message: `${ordersNeedingAttention} pedido(s) pago(s) há mais de ${ORDER_ATTENTION_HOURS}h sem concluir o fulfillment.`,
    });
  }

  const bestUnit = [...unitsHealth].sort((a, b) => b.score - a.score)[0];
  if (bestUnit && (bestUnit.state === "TAKEOFF" || bestUnit.state === "HEALTHY")) {
    const strengthLabel = HEALTH_COMPONENT_LABELS[bestUnit.primaryStrength];
    signals.push({
      level: "positive",
      message: `${bestUnit.unitName} está ${
        bestUnit.state === "TAKEOFF" ? "decolando" : "saudável"
      } (score ${bestUnit.score}) — principal força: ${strengthLabel}.`,
    });
  }

  return signals;
};

const buildOpportunities = (
  atRisk: number,
  avgTicket: number
): PanoramaOpportunity[] => {
  if (atRisk <= 0) return [];
  return [
    {
      type: "REACTIVATION",
      description: `${atRisk} cliente(s) recorrente(s) estão fora do ciclo esperado de retorno.`,
      estimatedValue: Math.round(atRisk * avgTicket * 100) / 100,
    },
  ];
};

export const getPanorama = async (
  input: AdminPeriodInput & { unitIds?: number[] }
): Promise<PanoramaSnapshot> => {
  const range = resolveAdminPeriodRange(input);
  const unitIds = input.unitIds && input.unitIds.length > 0 ? input.unitIds : undefined;
  // getSalesInsights só filtra por uma unidade por vez (PLAN-0020). Com 0 ou >1 unidades
  // selecionadas, o financeiro do Panorama consolida a rede inteira; filtro fino por
  // unidade única funciona normalmente. Comparação lado a lado de múltiplas unidades
  // fica para o Comparador de Unidades (RETROFIT-014, onda futura).
  const singleUnitId = unitIds && unitIds.length === 1 ? unitIds[0] : undefined;

  const [unitsHealth, currentInsights, previousInsights, inventoryOverview, ordersNeedingAttention, customerSignals] =
    await Promise.all([
      getUnitsHealth({ ...input, unitIds }),
      getSalesInsights({ from: range.from.toISOString(), to: range.to.toISOString(), unitId: singleUnitId }),
      getSalesInsights({
        from: range.previousFrom.toISOString(),
        to: range.previousTo.toISOString(),
        unitId: singleUnitId,
      }),
      getInventoryOverview(unitIds),
      countOrdersNeedingAttention(unitIds ?? undefined),
      calculateCustomerSignals(range.from, range.to, unitIds),
    ]);

  const network = unitsHealth.reduce(
    (acc, unit) => {
      acc.units += 1;
      if (unit.state === "TAKEOFF") acc.takeoff += 1;
      else if (unit.state === "HEALTHY") acc.healthy += 1;
      else if (unit.state === "ATTENTION") acc.attention += 1;
      else acc.critical += 1;
      return acc;
    },
    { units: 0, takeoff: 0, healthy: 0, attention: 0, critical: 0 }
  );

  const lowOccupancyUnits = unitsHealth.filter((unit) => unit.components.occupancy < 50).length;

  const revenuePrevious = previousInsights.totals.revenue;
  const revenueTrendPercent =
    revenuePrevious > 0
      ? round1(((currentInsights.totals.revenue - revenuePrevious) / revenuePrevious) * 100)
      : 0;
  const marginTrendPp = round1(currentInsights.totals.marginPercent - previousInsights.totals.marginPercent);

  const attention = buildAttentionSignals(unitsHealth, ordersNeedingAttention);
  const opportunities = buildOpportunities(customerSignals.atRisk, currentInsights.totals.avgTicket);

  return {
    period: { from: range.from.toISOString(), to: range.to.toISOString(), days: range.days },
    scope: { unitIds: unitIds ?? "all" },
    network,
    operations: {
      ordersNeedingAttention,
      stockAlerts: inventoryOverview.consolidated.outOfStock + inventoryOverview.consolidated.lowStock,
      lowOccupancyUnits,
    },
    financial: {
      revenue: currentInsights.totals.revenue,
      revenueTrendPercent,
      marginPercent: currentInsights.totals.marginPercent,
      marginTrendPp,
    },
    customers: customerSignals,
    attention,
    opportunities,
  };
};
