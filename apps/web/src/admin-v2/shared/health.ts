import type { HealthState } from "../network/types";

/** Admin V2 (PLAN-0022) — rótulos e cor semântica por estado de saúde, reusados por Rede/Diagnóstico/Panorama. */

export const STATE_LABELS: Record<HealthState, string> = {
  TAKEOFF: "Decolando",
  HEALTHY: "Saudável",
  ATTENTION: "Atenção",
  CRITICAL: "Crítico",
};

export const STATE_TEXT_CLASS: Record<HealthState, string> = {
  TAKEOFF: "text-state-healthy",
  HEALTHY: "text-state-healthy",
  ATTENTION: "text-state-attention",
  CRITICAL: "text-state-critical",
};

export const STATE_DOT_CLASS: Record<HealthState, string> = {
  TAKEOFF: "bg-state-healthy",
  HEALTHY: "bg-state-healthy",
  ATTENTION: "bg-state-attention",
  CRITICAL: "bg-state-critical",
};

export const STATE_BADGE_ICON: Record<HealthState, string> = {
  TAKEOFF: "🟢",
  HEALTHY: "🟢",
  ATTENTION: "🟡",
  CRITICAL: "🔴",
};
