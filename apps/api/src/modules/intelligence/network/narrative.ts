import type { HealthState } from "../unit-health/types";
import type { HealthImpactEstimate } from "./types";

const round1 = (value: number): number => Math.round(value * 10) / 10;

const formatCurrencyBRL = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const STATE_LABEL: Record<HealthState, string> = {
  TAKEOFF: "decolando",
  HEALTHY: "saudável",
  ATTENTION: "em atenção",
  CRITICAL: "crítica",
};

export type NarrativeInputs = {
  unitName: string;
  state: HealthState;
  score: number;
  primaryStrengthLabel: string;
  primaryWeaknessLabel: string;
  impactEstimate: HealthImpactEstimate;
  revenueTrendPercent: number;
};

/**
 * Admin V2 (PLAN-0023, Onda 5) — evolução do Health Score (RETROFIT-017): narrativa.
 * Função pura, monta uma frase determinística a partir de dados JÁ decompostos pelo
 * score (state/primaryStrength/primaryWeakness/impactEstimate) — não calcula nada novo,
 * só compõe texto. Mesmo princípio de "nunca só o número" (governança #6) aplicado à
 * prosa: toda frase cita a fonte do dado que está resumindo.
 */
export const buildUnitNarrative = (inputs: NarrativeInputs): string => {
  const {
    unitName,
    state,
    score,
    primaryStrengthLabel,
    primaryWeaknessLabel,
    impactEstimate,
    revenueTrendPercent,
  } = inputs;

  const trendPhrase =
    revenueTrendPercent > 0
      ? `receita crescendo ${round1(revenueTrendPercent)}% vs. o período anterior`
      : revenueTrendPercent < 0
        ? `receita caindo ${round1(Math.abs(revenueTrendPercent))}% vs. o período anterior`
        : "receita estável vs. o período anterior";

  const weaknessPhrase = impactEstimate
    ? `${primaryWeaknessLabel} é o principal problema — estimativa de ${formatCurrencyBRL(impactEstimate.amount)} (${impactEstimate.explanation})`
    : `${primaryWeaknessLabel} é o principal problema, ainda sem uma estimativa confiável de impacto em R$`;

  return `${unitName} está ${STATE_LABEL[state]} (score ${score}/100), com ${trendPhrase}. ${weaknessPhrase}. Em contrapartida, ${primaryStrengthLabel.toLowerCase()} é o que mais sustenta o resultado.`;
};
