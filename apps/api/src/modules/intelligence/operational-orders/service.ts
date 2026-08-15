import { Prisma } from "@prisma/client";
import prisma from "../../../lib/prisma";
import { resolveAdminPeriodRange, type AdminPeriodInput } from "../../admin/kpis/period";
import { classifyOrder } from "./classifier";
import type { FlowTransition, OperationalOrderCard, OrdersBoard, OrdersBoardColumn, OrdersFlow } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 3) — Board Operacional de Pedidos (RETROFIT-004).
 * Agrega `Order` do período, classifica cada um via `classifier.ts` (puro, sem
 * side-effect — o estado operacional nunca é gravado, só calculado na resposta) e
 * distribui nas 4 colunas do board; `getOrdersFlow` mede o tempo real entre etapas do
 * fulfillment a partir dos timestamps já existentes no schema.
 */

/** Amostra máxima retornada por coluna. `count`/`totalValue` sempre refletem TODOS os pedidos da coluna, não só a amostra. */
const MAX_SAMPLE_PER_COLUMN = 20;

/** Limiar (minutos) a partir do qual uma transição do fluxo é sinalizada como gargalo. Documentado aqui, não configurável em runtime (mesmo padrão de `classifier.ts`). */
const BOTTLENECK_THRESHOLD_MINUTES = 240;

const READY_FULFILLMENT_STATUSES = ["DESPACHADO", "ENVIADO", "ENTREGUE"] as const;

/**
 * Pedidos cancelados saem do funil operacional: não estão "travando" em etapa nenhuma,
 * não precisam de atenção, e cairiam por eliminação em "Em preparação" (não são
 * PENDENTE puro nem têm fulfillmentStatus pronto) — o que seria enganoso no board e
 * distorceria a média de tempo por etapa no fluxo. Exclusão vale para as duas funções
 * desta onda (ajuste consciente, não estava explícito no texto original da Onda 3).
 */
const ACTIVE_ORDER_FILTER = { status: { not: "CANCELADO" } } as const;

const decimalToNumber = (value: Prisma.Decimal | null | undefined): number => {
  if (!value) return 0;
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : 0;
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

const emptyColumn = (): OrdersBoardColumn => ({ count: 0, totalValue: 0, orders: [] });

const pushToColumn = (column: OrdersBoardColumn, card: OperationalOrderCard): void => {
  column.count += 1;
  column.totalValue = round2(column.totalValue + card.total);
  if (column.orders.length < MAX_SAMPLE_PER_COLUMN) column.orders.push(card);
};

type BoardOrderRow = {
  id: number;
  publicCode: string | null;
  total: Prisma.Decimal;
  status: string;
  fulfillmentStatus: string;
  paymentConfirmedAt: Date | null;
  fulfillmentNotes: string | null;
  createdAt: Date;
};

const toCard = (order: BoardOrderRow, now: Date): OperationalOrderCard => {
  const classification = classifyOrder(order, now);
  return {
    orderId: order.id,
    publicCode: order.publicCode,
    total: decimalToNumber(order.total),
    status: order.status,
    fulfillmentStatus: order.fulfillmentStatus,
    operationalState: classification.state,
    reason: classification.reason,
    ageMinutes: Math.max(0, Math.round((now.getTime() - order.createdAt.getTime()) / 60000)),
  };
};

/**
 * Distribui um pedido já classificado numa das 4 colunas do board:
 * `atencao` tem prioridade sobre o estágio natural (governança #4 do PLAN-0022 — o
 * estado derivado nunca é escondido atrás do estágio "normal" do fulfillment).
 */
const columnFor = (order: BoardOrderRow, card: OperationalOrderCard): keyof OrdersBoard["columns"] => {
  if (order.status === "PENDENTE") return "entraram";
  if (card.operationalState !== "NORMAL") return "atencao";
  if (READY_FULFILLMENT_STATUSES.includes(order.fulfillmentStatus as (typeof READY_FULFILLMENT_STATUSES)[number])) {
    return "prontos";
  }
  return "emPreparacao";
};

export const getOrdersBoard = async (
  input: AdminPeriodInput & { unitIds?: number[] }
): Promise<OrdersBoard> => {
  const range = resolveAdminPeriodRange(input);
  const now = new Date();

  const orders = await prisma.order.findMany({
    where: {
      ...ACTIVE_ORDER_FILTER,
      createdAt: { gte: range.from, lte: range.to },
      ...(input.unitIds && input.unitIds.length ? { unitId: { in: input.unitIds } } : {}),
    },
    select: {
      id: true,
      publicCode: true,
      total: true,
      status: true,
      fulfillmentStatus: true,
      paymentConfirmedAt: true,
      fulfillmentNotes: true,
      createdAt: true,
    },
    // Mais antigos primeiro — mesma ordem exigida para a amostra de cada coluna.
    orderBy: { createdAt: "asc" },
  });

  const columns: OrdersBoard["columns"] = {
    entraram: emptyColumn(),
    emPreparacao: emptyColumn(),
    atencao: emptyColumn(),
    prontos: emptyColumn(),
  };

  for (const order of orders) {
    const card = toCard(order, now);
    pushToColumn(columns[columnFor(order, card)], card);
  }

  return {
    period: { from: range.from.toISOString(), to: range.to.toISOString(), days: range.days },
    columns,
  };
};

type FlowOrderRow = {
  createdAt: Date;
  paymentConfirmedAt: Date | null;
  separatedAt: Date | null;
  packedAt: Date | null;
  dispatchedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
};

type FlowStep = { from: keyof FlowOrderRow; to: keyof FlowOrderRow; fromLabel: string; toLabel: string };

/** As 6 transições reais do schema de fulfillment (RETROFIT-004), na ordem operacional. */
const FLOW_STEPS: FlowStep[] = [
  { from: "createdAt", to: "paymentConfirmedAt", fromLabel: "Criado", toLabel: "Pagamento confirmado" },
  { from: "paymentConfirmedAt", to: "separatedAt", fromLabel: "Pagamento confirmado", toLabel: "Separado" },
  { from: "separatedAt", to: "packedAt", fromLabel: "Separado", toLabel: "Embalado" },
  { from: "packedAt", to: "dispatchedAt", fromLabel: "Embalado", toLabel: "Despachado" },
  { from: "dispatchedAt", to: "shippedAt", fromLabel: "Despachado", toLabel: "Enviado" },
  { from: "shippedAt", to: "deliveredAt", fromLabel: "Enviado", toLabel: "Entregue" },
];

const computeTransition = (orders: FlowOrderRow[], step: FlowStep): FlowTransition => {
  let totalMinutes = 0;
  let sampleSize = 0;
  for (const order of orders) {
    const fromValue = order[step.from];
    const toValue = order[step.to];
    if (!fromValue || !toValue) continue;
    const minutes = (toValue.getTime() - fromValue.getTime()) / 60000;
    // Timestamp fora de ordem é dado inconsistente (correção manual, import antigo, etc.)
    // — a amostra é descartada, nunca fabricado um valor negativo na média.
    if (minutes < 0) continue;
    totalMinutes += minutes;
    sampleSize += 1;
  }
  const averageMinutes = sampleSize > 0 ? Math.round(totalMinutes / sampleSize) : null;
  return {
    from: step.fromLabel,
    to: step.toLabel,
    averageMinutes,
    sampleSize,
    isBottleneck: averageMinutes !== null && averageMinutes >= BOTTLENECK_THRESHOLD_MINUTES,
  };
};

export const getOrdersFlow = async (
  input: AdminPeriodInput & { unitIds?: number[] }
): Promise<OrdersFlow> => {
  const range = resolveAdminPeriodRange(input);

  const orders = await prisma.order.findMany({
    where: {
      ...ACTIVE_ORDER_FILTER,
      createdAt: { gte: range.from, lte: range.to },
      ...(input.unitIds && input.unitIds.length ? { unitId: { in: input.unitIds } } : {}),
    },
    select: {
      createdAt: true,
      paymentConfirmedAt: true,
      separatedAt: true,
      packedAt: true,
      dispatchedAt: true,
      shippedAt: true,
      deliveredAt: true,
    },
  });

  return {
    period: { from: range.from.toISOString(), to: range.to.toISOString(), days: range.days },
    transitions: FLOW_STEPS.map((step) => computeTransition(orders, step)),
  };
};
