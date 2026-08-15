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

/**
 * PLAN-0025 (item 6): opacidades aumentadas (`/20`-`/25` -> `/40`-`/55`) — no contraste
 * anterior, os 3 níveis ficavam próximos demais do branco da tabela e do "sem escala"
 * (`bg-stone-50`), difíceis de distinguir à primeira vista. Mesma lógica de negócio
 * (vermelho = ocioso/perdendo receita, verde = ocupado) — decisão explícita do usuário de
 * manter, só revisar o contraste visual.
 */
export const OCCUPANCY_CELL_CLASS: Record<OccupancyLevel, string> = {
  NONE: "bg-stone-50 text-stone-400 dark:bg-forest-green/20 dark:text-stone-500",
  CRITICAL: "bg-state-critical/40 text-forest hover:bg-state-critical/50",
  ATTENTION: "bg-state-attention/40 text-forest hover:bg-state-attention/50",
  HEALTHY: "bg-state-healthy/45 text-forest hover:bg-state-healthy/55",
};

export const OCCUPANCY_DOT_CLASS: Record<OccupancyLevel, string> = {
  NONE: "bg-stone-300",
  CRITICAL: "bg-state-critical",
  ATTENTION: "bg-state-attention",
  HEALTHY: "bg-state-healthy",
};
