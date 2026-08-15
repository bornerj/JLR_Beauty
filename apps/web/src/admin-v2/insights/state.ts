import type { Insight, InsightPriority } from "./types";

/**
 * Admin V2 (PLAN-0023, Onda 6) — rótulos e cor semântica do Insight Engine
 * (RETROFIT-018). Mesmo vocabulário do Radar (Onda 1): crítico = vermelho, atenção =
 * âmbar, oportunidade = o teal da marca (positivo, nunca alerta).
 */

export const PRIORITY_LABELS: Record<InsightPriority, string> = {
  CRITICO: "Crítico",
  ATENCAO: "Atenção",
  OPORTUNIDADE: "Oportunidade",
};

export const PRIORITY_TEXT_CLASS: Record<InsightPriority, string> = {
  CRITICO: "text-state-critical",
  ATENCAO: "text-state-attention",
  OPORTUNIDADE: "text-state-healthy",
};

export const PRIORITY_DOT_CLASS: Record<InsightPriority, string> = {
  CRITICO: "bg-state-critical",
  ATENCAO: "bg-state-attention",
  OPORTUNIDADE: "bg-state-healthy",
};

export const PRIORITY_ORDER: InsightPriority[] = ["CRITICO", "ATENCAO", "OPORTUNIDADE"];

export const SOURCE_LABELS: Record<Insight["source"], string> = {
  radar: "Radar",
  gargalos: "Gargalos",
  comparador: "Comparador",
};
