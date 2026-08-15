import { attachRecommendedActions } from "./recommendations";
import type { Insight, InsightInputs, InsightPriority } from "./types";

const round2 = (value: number): number => Math.round(value * 100) / 100;

const PRIORITY_RANK: Record<InsightPriority, number> = { CRITICO: 0, ATENCAO: 1, OPORTUNIDADE: 2 };

/**
 * Admin V2 (PLAN-0023, Onda 6) — função pura do Insight Engine (RETROFIT-018).
 * Consolida Radar + Gargalos + o maior achado do Comparador num único feed. Não
 * reclassifica nada — cada achado já vem com sua própria severidade/impacto calculados
 * pelo módulo de origem; esta função só decide o que entra, o que é duplicata (mesma
 * categoria em Radar e Gargalos) e a ordem final.
 */
type InsightDraft = Omit<Insight, "recommendedActions">;

export const buildInsightFeed = (inputs: InsightInputs): Insight[] => {
  const { radar, gargalos, comparator } = inputs;

  // Categorias que o Gargalos já cobre com R$ — o achado do Radar da mesma categoria é
  // descartado (mesmo fato, o Gargalos descreve melhor: com impacto financeiro).
  const gargalosCategories = new Set(gargalos.bottlenecks.map((b) => b.category));

  const fromRadar: InsightDraft[] = radar.findings
    .filter((finding) => !gargalosCategories.has(finding.category))
    .map((finding) => ({
      id: `radar-${finding.id}`,
      source: "radar" as const,
      priority: finding.severity,
      category: finding.category,
      message: finding.message,
      impact: null,
      actionLabel: finding.actionLabel,
      actionPath: finding.actionPath,
    }));

  const fromGargalos: InsightDraft[] = gargalos.bottlenecks.map((bottleneck) => ({
    id: `gargalos-${bottleneck.id}`,
    source: "gargalos" as const,
    priority: "ATENCAO" as const,
    category: bottleneck.category,
    message: bottleneck.message,
    impact: bottleneck.impact,
    actionLabel: bottleneck.actionLabel,
    actionPath: bottleneck.actionPath,
  }));

  const fromComparator: InsightDraft[] = [];
  if (comparator.biggestGap) {
    const gap = comparator.biggestGap;
    fromComparator.push({
      id: "comparador-biggest-gap",
      source: "comparador",
      priority: "ATENCAO",
      category: "Comparador",
      message: `Maior diferença entre unidades é em ${gap.metricLabel}: ${gap.worstUnitName} vs. ${gap.bestUnitName}.`,
      impact: gap.estimatedRevenueDifference,
      actionLabel: "Ver comparador",
      actionPath: "/admin-v2/comparador",
    });
  }

  const all = [...fromRadar, ...fromGargalos, ...fromComparator];

  const sorted = all.sort((a, b) => {
    const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    const aAmount = a.impact?.amount ?? -1;
    const bAmount = b.impact?.amount ?? -1;
    return bAmount - aAmount;
  });

  return attachRecommendedActions(sorted);
};

export const sumKnownImpact = (insights: Insight[]): number =>
  round2(insights.reduce((sum, insight) => sum + (insight.impact?.amount ?? 0), 0));
