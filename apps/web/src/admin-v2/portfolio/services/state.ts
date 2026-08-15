import type { ServiceQuadrant } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 6) — rótulos e cor semântica da matriz demanda×margem/hora
 * (RETROFIT-007). Mesmo framework visual do Portfólio de Produtos (Onda 5): Estrela/Joia
 * são bons sinais, Armadilha é o pior (ocupa muita agenda, rende pouco por hora), Fraco
 * pede revisão, Sem demanda é neutro.
 */

export const QUADRANT_LABELS: Record<ServiceQuadrant, string> = {
  ESTRELA: "Estrela",
  JOIA: "Joia",
  ARMADILHA: "Armadilha",
  FRACO: "Fraco",
  SEM_DEMANDA: "Sem demanda",
};

export const QUADRANT_DESCRIPTIONS: Record<ServiceQuadrant, string> = {
  ESTRELA: "ocupa bastante a agenda e rende bem por hora — o melhor uso possível da capacidade",
  JOIA: "pouco demandado, mas quando acontece rende muito bem por hora — oportunidade de crescer a demanda",
  ARMADILHA: "ocupa muita agenda, mas rende pouco por hora",
  FRACO: "pouco demandado e rende pouco por hora",
  SEM_DEMANDA: "sem nenhum agendamento no período selecionado",
};

export const QUADRANT_TEXT_CLASS: Record<ServiceQuadrant, string> = {
  ESTRELA: "text-state-healthy",
  JOIA: "text-state-info",
  ARMADILHA: "text-state-critical",
  FRACO: "text-state-attention",
  SEM_DEMANDA: "text-stone-500 dark:text-stone-400",
};

export const QUADRANT_DOT_CLASS: Record<ServiceQuadrant, string> = {
  ESTRELA: "bg-state-healthy",
  JOIA: "bg-state-info",
  ARMADILHA: "bg-state-critical",
  FRACO: "bg-state-attention",
  SEM_DEMANDA: "bg-stone-300",
};

export const QUADRANT_ORDER: ServiceQuadrant[] = ["ARMADILHA", "ESTRELA", "JOIA", "FRACO", "SEM_DEMANDA"];
