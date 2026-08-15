import type { CustomerState } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 7) — rótulos e cor semântica do fluxo de clientes
 * (RETROFIT-008). Novo/Ativo/Recorrente são bons sinais, Em risco pede atenção,
 * Inativo é neutro (não é uma emergência, é um estado de fato).
 */

export const STATE_LABELS: Record<CustomerState, string> = {
  NOVO: "Novos",
  ATIVO: "Ativos",
  RECORRENTE: "Recorrentes",
  EM_RISCO: "Em risco",
  INATIVO: "Inativos",
};

export const STATE_TEXT_CLASS: Record<CustomerState, string> = {
  NOVO: "text-state-info",
  ATIVO: "text-state-healthy",
  RECORRENTE: "text-state-healthy",
  EM_RISCO: "text-state-attention",
  INATIVO: "text-stone-500 dark:text-stone-400",
};

export const STATE_DOT_CLASS: Record<CustomerState, string> = {
  NOVO: "bg-state-info",
  ATIVO: "bg-state-healthy",
  RECORRENTE: "bg-state-healthy",
  EM_RISCO: "bg-state-attention",
  INATIVO: "bg-stone-300",
};

export const STATE_ORDER: CustomerState[] = ["EM_RISCO", "NOVO", "ATIVO", "RECORRENTE", "INATIVO"];
