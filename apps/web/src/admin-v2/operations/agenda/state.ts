/**
 * Admin V2 (PLAN-0022, Onda 4) — leitura visual da ocupação por horário (RETROFIT-005).
 * Cor carrega só um significado (governança #8 do plano): quanto mais ociosa a hora,
 * mais "atenção" a cor pede — nunca decorativo.
 */

export type OccupancyLevel = "NONE" | "CRITICAL" | "ATTENTION" | "HEALTHY";

export const occupancyLevel = (availableMinutes: number, occupancyRate: number): OccupancyLevel => {
  if (availableMinutes <= 0) return "NONE";
  if (occupancyRate < 30) return "CRITICAL";
  if (occupancyRate < 60) return "ATTENTION";
  return "HEALTHY";
};

export const OCCUPANCY_LEVEL_LABELS: Record<OccupancyLevel, string> = {
  NONE: "Sem escala",
  CRITICAL: "Ociosa",
  ATTENTION: "Parcial",
  HEALTHY: "Ocupada",
};

export const OCCUPANCY_CELL_CLASS: Record<OccupancyLevel, string> = {
  NONE: "bg-stone-50 text-stone-400 dark:bg-forest-green/20 dark:text-stone-500",
  CRITICAL: "bg-state-critical/20 text-forest hover:bg-state-critical/30",
  ATTENTION: "bg-state-attention/20 text-forest hover:bg-state-attention/30",
  HEALTHY: "bg-state-healthy/25 text-forest hover:bg-state-healthy/35",
};

export const OCCUPANCY_DOT_CLASS: Record<OccupancyLevel, string> = {
  NONE: "bg-stone-300",
  CRITICAL: "bg-state-critical",
  ATTENTION: "bg-state-attention",
  HEALTHY: "bg-state-healthy",
};
