/** Admin V2 (PLAN-0023, Onda 2) — Gargalos (RETROFIT-012). Espelha apps/api/src/modules/intelligence/gargalos/types.ts. */

export type BottleneckImpact = { amount: number; explanation: string } | null;

export type Bottleneck = {
  id: string;
  category: string;
  message: string;
  impact: BottleneckImpact;
  actionLabel: string;
  actionPath: string;
};

export type BottlenecksRanking = {
  period: { from: string; to: string; days: number };
  generatedAt: string;
  totalImpact: number;
  bottlenecks: Bottleneck[];
};
