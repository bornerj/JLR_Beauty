import type { OperationalOrderState } from "./types";

/** Admin V2 (PLAN-0022, Onda 3) — rótulos e cor semântica por estado operacional do pedido. */

export const ORDER_STATE_LABELS: Record<OperationalOrderState, string> = {
  NORMAL: "Normal",
  ATTENTION: "Atenção",
  STALLED: "Parado",
  OVERDUE: "Atrasado",
  BLOCKED: "Bloqueado",
};

export const ORDER_STATE_TEXT_CLASS: Record<OperationalOrderState, string> = {
  NORMAL: "text-stone-600 dark:text-stone-400",
  ATTENTION: "text-state-attention",
  STALLED: "text-state-attention",
  OVERDUE: "text-state-critical",
  BLOCKED: "text-state-critical",
};

export const ORDER_STATE_DOT_CLASS: Record<OperationalOrderState, string> = {
  NORMAL: "bg-stone-300",
  ATTENTION: "bg-state-attention",
  STALLED: "bg-state-attention",
  OVERDUE: "bg-state-critical",
  BLOCKED: "bg-state-critical",
};
