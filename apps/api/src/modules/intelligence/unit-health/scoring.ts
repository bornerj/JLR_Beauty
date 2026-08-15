import {
  HEALTH_WEIGHTS,
  type HealthComponentKey,
  type HealthComponents,
  type HealthState,
  type UnitHealthRawMetrics,
  type UnitHealthScore,
} from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 1) — Health Score v1.
 *
 * Fórmula fixa (DECISION-013): Rentabilidade 30% / Crescimento 20% / Ocupação 20% /
 * Recorrência 15% / Estoque 10% / Assinaturas 5%. Sem pesos configuráveis nesta fase.
 *
 * Cada métrica bruta é normalizada para uma faixa 0-100 antes de ponderar — os limiares
 * abaixo são heurísticas v1, documentadas e ajustáveis só via novo PR (nunca em runtime),
 * conforme a Governança do PLAN-0022 (regra #4: estados derivados nunca viram config solta).
 */

const clamp = (value: number, min = 0, max = 100): number => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

/** Margem de 0% -> 0, margem de 40%+ -> 100 (40% tratado como teto "excelente" para este negócio). */
const normalizeProfitability = (marginPercent: number): number => clamp((marginPercent / 40) * 100);

/** Tendência de receita: 0% (estável) -> 50; +25% -> 100; -25% -> 0. */
const normalizeGrowth = (revenueTrendPercent: number): number => clamp(50 + revenueTrendPercent * 2);

/** Ocupação e recorrência e estoque e assinaturas já chegam como taxas 0-100. */
const normalizeRate = (rate: number): number => clamp(rate);

export const normalizeHealthComponents = (raw: UnitHealthRawMetrics): HealthComponents => ({
  profitability: normalizeProfitability(raw.marginPercent),
  growth: normalizeGrowth(raw.revenueTrendPercent),
  occupancy: normalizeRate(raw.occupancyRate),
  recurrence: normalizeRate(raw.recurrenceRate),
  inventory: normalizeRate(raw.inventoryHealthRate),
  subscriptions: normalizeRate(raw.subscriptionActiveRate),
});

const round1 = (value: number): number => Math.round(value * 10) / 10;

const resolveState = (score: number, growthComponent: number): HealthState => {
  if (score >= 80 && growthComponent >= 65) return "TAKEOFF";
  if (score >= 65) return "HEALTHY";
  if (score >= 40) return "ATTENTION";
  return "CRITICAL";
};

const resolveExtremes = (
  components: HealthComponents
): { primaryWeakness: HealthComponentKey; primaryStrength: HealthComponentKey } => {
  const entries = Object.entries(components) as Array<[HealthComponentKey, number]>;
  let weakest = entries[0];
  let strongest = entries[0];
  for (const entry of entries) {
    if (entry[1] < weakest[1]) weakest = entry;
    if (entry[1] > strongest[1]) strongest = entry;
  }
  return { primaryWeakness: weakest[0], primaryStrength: strongest[0] };
};

export const computeHealthScore = (raw: UnitHealthRawMetrics): UnitHealthScore => {
  const components = normalizeHealthComponents(raw);
  const weightedScore = (Object.keys(HEALTH_WEIGHTS) as HealthComponentKey[]).reduce(
    (acc, key) => acc + components[key] * HEALTH_WEIGHTS[key],
    0
  );
  const score = round1(clamp(weightedScore));
  const { primaryWeakness, primaryStrength } = resolveExtremes(components);

  return {
    score,
    state: resolveState(score, components.growth),
    components: {
      profitability: round1(components.profitability),
      growth: round1(components.growth),
      occupancy: round1(components.occupancy),
      recurrence: round1(components.recurrence),
      inventory: round1(components.inventory),
      subscriptions: round1(components.subscriptions),
    },
    primaryWeakness,
    primaryStrength,
  };
};

export const HEALTH_COMPONENT_LABELS: Record<HealthComponentKey, string> = {
  profitability: "Rentabilidade",
  growth: "Crescimento",
  occupancy: "Ocupação",
  recurrence: "Recorrência",
  inventory: "Estoque",
  subscriptions: "Assinaturas",
};
