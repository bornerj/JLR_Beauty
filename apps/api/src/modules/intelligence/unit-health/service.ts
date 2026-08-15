import prisma from "../../../lib/prisma";
import { getInventoryOverview, getSalesInsights } from "../../admin/kpis";
import { resolveAdminPeriodRange, type AdminPeriodInput } from "../../admin/kpis/period";
import { calculateUnitOccupancy, type UnitOccupancy } from "../capacity/calculator";
import { computeHealthScore } from "./scoring";
import type { UnitHealthRawMetrics, UnitHealthScore } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 1) — agregação do Health Score por unidade.
 * Reutiliza integralmente o BI do PLAN-0020 (getSalesInsights/getInventoryOverview),
 * não recalcula margem/CMV do zero.
 */

const round1 = (value: number): number => Math.round(value * 10) / 10;

/**
 * Assinaturas (Subscription) não têm `unitId` no schema atual — é um domínio de rede,
 * não por unidade física. Para não fabricar uma vinculação que não existe, o componente
 * "Assinaturas" do Health Score usa a taxa de ativação DA REDE INTEIRA para todas as
 * unidades (peso baixo, 5%, então o impacto da aproximação é limitado). Documentado
 * explicitamente na matriz de reuso do PLAN-0022.
 */
export const getNetworkSubscriptionActiveRate = async (): Promise<number> => {
  const [active, total] = await Promise.all([
    prisma.subscription.count({ where: { status: "ATIVA" } }),
    prisma.subscription.count(),
  ]);
  return total > 0 ? Math.min(100, (active / total) * 100) : 100;
};

/**
 * Proxy de recorrência: % de clientes com >=2 pedidos PAGO na unidade/período sobre o
 * total de clientes distintos no período (chave = email > telefone > nome, mesmo padrão
 * de identificação usado em `dashboardSalesInsights.ts`). Não é resolução de identidade
 * de CRM completa — é o suficiente para um componente de 15% de peso na v1.
 */
const calculateUnitRecurrenceRate = async (unitId: number, from: Date, to: Date): Promise<number> => {
  const orders = await prisma.order.findMany({
    where: { unitId, status: "PAGO", createdAt: { gte: from, lte: to } },
    select: { customerEmail: true, customerPhone: true, customerName: true },
  });
  if (orders.length === 0) return 0;

  const countByCustomer = new Map<string, number>();
  for (const order of orders) {
    const key =
      (order.customerEmail || "").trim().toLowerCase() ||
      (order.customerPhone || "").trim() ||
      (order.customerName || "").trim() ||
      "(sem identificacao)";
    countByCustomer.set(key, (countByCustomer.get(key) || 0) + 1);
  }
  const distinctCustomers = countByCustomer.size;
  const returningCustomers = Array.from(countByCustomer.values()).filter((count) => count >= 2).length;
  return distinctCustomers > 0 ? Math.min(100, (returningCustomers / distinctCustomers) * 100) : 0;
};

const calculateUnitInventoryHealthRate = async (unitId: number): Promise<number> => {
  const overview = await getInventoryOverview([unitId]);
  const unit = overview.units[0];
  if (!unit || unit.items === 0) return 100; // unidade sem produtos cadastrados -> neutro, não penaliza
  const healthy = unit.items - unit.outOfStock - unit.lowStock;
  return Math.min(100, Math.max(0, (healthy / unit.items) * 100));
};

export type UnitHealthResult = UnitHealthScore & {
  unitId: number;
  unitName: string;
  /** Métricas brutas (não normalizadas) por trás do score — usadas pelos cards da Rede e pelo Diagnóstico. */
  raw: UnitHealthRawMetrics;
  /** Minutos de agenda por trás do componente de ocupação — usado para estimar impacto financeiro (Onda 2). */
  occupancy: UnitOccupancy;
};

/** Calcula o Health Score de uma única unidade (usado pelo Diagnóstico da Unidade — Onda 2). */
export const getUnitHealth = async (
  input: AdminPeriodInput & { unitId: number }
): Promise<UnitHealthResult> => {
  const subscriptionActiveRate = await getNetworkSubscriptionActiveRate();
  const unit = await prisma.unit.findUniqueOrThrow({
    where: { id: input.unitId },
    select: { id: true, name: true },
  });
  const health = await computeUnitHealthMetrics(input, subscriptionActiveRate);
  return { ...health, unitId: unit.id, unitName: unit.name };
};

/** Calcula o Health Score de todas as unidades no escopo (usado pelo Panorama e pela Rede). */
export const getUnitsHealth = async (
  input: AdminPeriodInput & { unitIds?: number[] }
): Promise<UnitHealthResult[]> => {
  const units = await prisma.unit.findMany({
    where: input.unitIds && input.unitIds.length > 0 ? { id: { in: input.unitIds } } : {},
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  });
  const subscriptionActiveRate = await getNetworkSubscriptionActiveRate();
  return Promise.all(
    units.map(async (unit) => {
      const health = await computeUnitHealthMetrics({ ...input, unitId: unit.id }, subscriptionActiveRate);
      return { ...health, unitId: unit.id, unitName: unit.name };
    })
  );
};

type ComputedHealth = UnitHealthScore & { raw: UnitHealthRawMetrics; occupancy: UnitOccupancy };

const computeUnitHealthMetrics = async (
  input: AdminPeriodInput & { unitId: number },
  subscriptionActiveRate: number
): Promise<ComputedHealth> => {
  const { unitId } = input;
  const range = resolveAdminPeriodRange(input);

  const [currentInsights, previousInsights, occupancy, inventoryHealthRate, recurrenceRate] =
    await Promise.all([
      getSalesInsights({ unitId, from: range.from.toISOString(), to: range.to.toISOString() }),
      getSalesInsights({
        unitId,
        from: range.previousFrom.toISOString(),
        to: range.previousTo.toISOString(),
      }),
      calculateUnitOccupancy(unitId, range.from, range.to),
      calculateUnitInventoryHealthRate(unitId),
      calculateUnitRecurrenceRate(unitId, range.from, range.to),
    ]);

  const revenuePrevious = previousInsights.totals.revenue;
  const revenueTrendPercent =
    revenuePrevious > 0
      ? round1(((currentInsights.totals.revenue - revenuePrevious) / revenuePrevious) * 100)
      : 0;

  const raw: UnitHealthRawMetrics = {
    revenue: currentInsights.totals.revenue,
    marginPercent: currentInsights.totals.marginPercent,
    revenueTrendPercent,
    occupancyRate: occupancy.occupancyRate,
    recurrenceRate,
    inventoryHealthRate,
    subscriptionActiveRate,
  };

  const score = computeHealthScore(raw);
  return { ...score, raw, occupancy };
};
