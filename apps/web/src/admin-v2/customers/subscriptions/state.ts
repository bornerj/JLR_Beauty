import type { SubscriptionState } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 8) — rótulos e cor semântica da saúde de assinaturas
 * (RETROFIT-009). Entrando/Saudável são bons sinais, Atenção pede revisão, Saindo é o
 * churn (crítico).
 */

export const STATE_LABELS: Record<SubscriptionState, string> = {
  ENTRANDO: "Entrando",
  SAUDAVEL: "Saudáveis",
  ATENCAO: "Atenção",
  SAINDO: "Saindo",
};

export const STATE_TEXT_CLASS: Record<SubscriptionState, string> = {
  ENTRANDO: "text-state-info",
  SAUDAVEL: "text-state-healthy",
  ATENCAO: "text-state-attention",
  SAINDO: "text-state-critical",
};

export const STATE_DOT_CLASS: Record<SubscriptionState, string> = {
  ENTRANDO: "bg-state-info",
  SAUDAVEL: "bg-state-healthy",
  ATENCAO: "bg-state-attention",
  SAINDO: "bg-state-critical",
};

export const STATE_ORDER: SubscriptionState[] = ["ATENCAO", "SAINDO", "ENTRANDO", "SAUDAVEL"];
