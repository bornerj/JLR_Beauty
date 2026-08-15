/** Admin V2 (PLAN-0023, Onda 1) — Radar Executivo (RETROFIT-011). Espelha apps/api/src/modules/intelligence/radar/types.ts. */

export type RadarSeverity = "CRITICO" | "ATENCAO" | "OPORTUNIDADE";

export type RadarFinding = {
  id: string;
  severity: RadarSeverity;
  category: string;
  message: string;
  actionLabel: string;
  actionPath: string;
};

export type RadarBriefing = {
  period: { from: string; to: string; days: number };
  generatedAt: string;
  findings: RadarFinding[];
};
