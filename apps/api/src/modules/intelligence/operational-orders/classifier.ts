import type { OperationalOrderState } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 3) — classificador de estado operacional derivado.
 * Nunca substitui `Order.status`/`Order.fulfillmentStatus` (governança #4 do plano) —
 * é sempre um campo calculado a mais, recalculado a cada request, nunca gravado.
 * Limiares em horas, documentados aqui, ajustáveis só via novo PR (nunca runtime).
 */

const HOUR_MS = 60 * 60 * 1000;

export const ATTENTION_THRESHOLD_HOURS = 12;
export const STALLED_THRESHOLD_HOURS = 24;
export const OVERDUE_THRESHOLD_HOURS = 72;

const DONE_FULFILLMENT_STATUSES = ["ENTREGUE", "CANCELADO"] as const;

export type ClassifiableOrder = {
  status: string;
  fulfillmentStatus: string;
  paymentConfirmedAt: Date | null;
  fulfillmentNotes: string | null;
};

export type OrderClassification = { state: OperationalOrderState; reason: string | null };

export const classifyOrder = (order: ClassifiableOrder, now: Date = new Date()): OrderClassification => {
  // BLOCKED tem prioridade sobre qualquer limiar de tempo — é um sinal explícito já
  // presente no dado (padrão herdado do PLAN-0020: `fulfillmentNotes` com "[ESTOQUE]").
  if (order.fulfillmentNotes && order.fulfillmentNotes.includes("[ESTOQUE]")) {
    return {
      state: "BLOCKED",
      reason: "Estoque insuficiente para concluir o pedido — resolução manual necessária.",
    };
  }

  if (order.status !== "PAGO" || !order.paymentConfirmedAt) {
    return { state: "NORMAL", reason: null };
  }
  if (DONE_FULFILLMENT_STATUSES.includes(order.fulfillmentStatus as (typeof DONE_FULFILLMENT_STATUSES)[number])) {
    return { state: "NORMAL", reason: null };
  }

  const hoursSincePaid = (now.getTime() - order.paymentConfirmedAt.getTime()) / HOUR_MS;
  const hoursLabel = Math.round(hoursSincePaid);

  if (hoursSincePaid >= OVERDUE_THRESHOLD_HOURS) {
    return { state: "OVERDUE", reason: `Pagamento aprovado há ${hoursLabel}h e o pedido ainda não foi entregue.` };
  }
  if (hoursSincePaid >= STALLED_THRESHOLD_HOURS && order.fulfillmentStatus === "PENDENTE") {
    return {
      state: "STALLED",
      reason: `Pagamento aprovado há ${hoursLabel}h, mas a separação ainda não começou.`,
    };
  }
  if (hoursSincePaid >= ATTENTION_THRESHOLD_HOURS) {
    return { state: "ATTENTION", reason: `Pagamento aprovado há ${hoursLabel}h sem concluir o fulfillment.` };
  }
  return { state: "NORMAL", reason: null };
};
