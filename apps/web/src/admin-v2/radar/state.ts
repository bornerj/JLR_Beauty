import type { RadarSeverity } from "./types";

/**
 * Admin V2 (PLAN-0023, Onda 1) — rótulos e cor semântica do Radar Executivo
 * (RETROFIT-011). Mesmo vocabulário de cor do resto do Admin V2: crítico = vermelho,
 * atenção = âmbar, oportunidade = o teal da marca (positivo, nunca alerta).
 */

export const SEVERITY_LABELS: Record<RadarSeverity, string> = {
  CRITICO: "Crítico",
  ATENCAO: "Atenção",
  OPORTUNIDADE: "Oportunidade",
};

export const SEVERITY_TEXT_CLASS: Record<RadarSeverity, string> = {
  CRITICO: "text-state-critical",
  ATENCAO: "text-state-attention",
  OPORTUNIDADE: "text-state-healthy",
};

export const SEVERITY_DOT_CLASS: Record<RadarSeverity, string> = {
  CRITICO: "bg-state-critical",
  ATENCAO: "bg-state-attention",
  OPORTUNIDADE: "bg-state-healthy",
};

export const SEVERITY_ORDER: RadarSeverity[] = ["CRITICO", "ATENCAO", "OPORTUNIDADE"];
