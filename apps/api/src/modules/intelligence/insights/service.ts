import { getRadarBriefing } from "../radar/service";
import { getBottlenecksRanking } from "../gargalos/service";
import { getUnitComparator } from "../comparator/service";
import type { AdminPeriodInput } from "../../admin/kpis/period";
import { resolveAdminPeriodRange } from "../../admin/kpis/period";
import { buildInsightFeed, sumKnownImpact } from "./rules";
import type { InsightFeed } from "./types";

/**
 * Admin V2 (PLAN-0023, Onda 6) — Insight Engine (RETROFIT-018).
 * Busca Radar (Onda 1), Gargalos (Onda 2) e Comparador (Onda 4) em `Promise.all` (nunca
 * cascata) e delega a consolidação/deduplicação para `rules.ts`.
 */
export const getInsightFeed = async (input: AdminPeriodInput): Promise<InsightFeed> => {
  const range = resolveAdminPeriodRange(input);

  const [radar, gargalos, comparator] = await Promise.all([
    getRadarBriefing(input),
    getBottlenecksRanking(input),
    getUnitComparator(input),
  ]);

  const insights = buildInsightFeed({ radar, gargalos, comparator });

  return {
    period: { from: range.from.toISOString(), to: range.to.toISOString(), days: range.days },
    generatedAt: new Date().toISOString(),
    totalKnownImpact: sumKnownImpact(insights),
    insights,
  };
};
