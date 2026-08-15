/** Admin V2 (PLAN-0023, Onda 6) — Insight Engine (RETROFIT-018). Espelha apps/api/src/modules/intelligence/insights/types.ts. */

export type InsightSource = "radar" | "gargalos" | "comparador";

export type InsightPriority = "CRITICO" | "ATENCAO" | "OPORTUNIDADE";

export type InsightImpact = { amount: number; explanation: string } | null;

/** RETROFIT-019 — sugestão de próximo passo em texto; `actionPath: null` quando não existe uma tela real pra essa ação ainda. */
export type RecommendedAction = {
  label: string;
  actionPath: string | null;
};

export type Insight = {
  id: string;
  source: InsightSource;
  priority: InsightPriority;
  category: string;
  message: string;
  impact: InsightImpact;
  actionLabel: string;
  actionPath: string;
  recommendedActions: RecommendedAction[];
};

export type InsightFeed = {
  period: { from: string; to: string; days: number };
  generatedAt: string;
  totalKnownImpact: number;
  insights: Insight[];
};
