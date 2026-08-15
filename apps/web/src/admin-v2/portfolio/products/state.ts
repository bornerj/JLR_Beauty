import type { ProductQuadrant } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 5) — rótulos e cor semântica da matriz margem×volume
 * (RETROFIT-006). Cor carrega só um significado (governança #8): Estrela/Joia são bons
 * sinais, Armadilha é o pior (drena esforço por pouco retorno), Fraco pede revisão,
 * Sem venda é neutro (falta de dado, não um alerta em si — o capital parado é que importa).
 */

export const QUADRANT_LABELS: Record<ProductQuadrant, string> = {
  ESTRELA: "Estrela",
  JOIA: "Joia",
  ARMADILHA: "Armadilha",
  FRACO: "Fraco",
  SEM_VENDA: "Sem venda",
};

export const QUADRANT_DESCRIPTIONS: Record<ProductQuadrant, string> = {
  ESTRELA: "vende bem e dá lucro",
  JOIA: "vende pouco, mas com margem alta — oportunidade pouco explorada",
  ARMADILHA: "vende muito, mas remunera pouco (ou dá prejuízo)",
  FRACO: "vende pouco e dá pouco lucro",
  SEM_VENDA: "sem nenhuma venda no período selecionado",
};

export const QUADRANT_TEXT_CLASS: Record<ProductQuadrant, string> = {
  ESTRELA: "text-state-healthy",
  JOIA: "text-state-info",
  ARMADILHA: "text-state-critical",
  FRACO: "text-state-attention",
  SEM_VENDA: "text-stone-500 dark:text-stone-400",
};

export const QUADRANT_DOT_CLASS: Record<ProductQuadrant, string> = {
  ESTRELA: "bg-state-healthy",
  JOIA: "bg-state-info",
  ARMADILHA: "bg-state-critical",
  FRACO: "bg-state-attention",
  SEM_VENDA: "bg-stone-300",
};

export const QUADRANT_ORDER: ProductQuadrant[] = ["ARMADILHA", "ESTRELA", "JOIA", "FRACO", "SEM_VENDA"];
