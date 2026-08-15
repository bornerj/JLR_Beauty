/** Admin V2 (PLAN-0022, Onda 9) — Pipeline de Franquias (RETROFIT-010). Espelha apps/api/src/modules/intelligence/franchise-pipeline/types.ts. */

export const FRANCHISE_STAGES = [
  "INTERESSADO",
  "QUALIFICADO",
  "REUNIAO",
  "PROPOSTA",
  "NEGOCIACAO",
  "CONTRATO",
  "IMPLANTACAO",
] as const;

export type FranchiseStage = (typeof FRANCHISE_STAGES)[number];

export type PipelineStageSummary = {
  stage: FranchiseStage;
  count: number;
  estimatedValueTotal: number;
  avgDaysToComplete: number | null;
  avgDaysInStageNow: number | null;
  isBottleneck: boolean;
};

export type PipelineLead = {
  leadId: number;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  stage: FranchiseStage;
  estimatedValue: number | null;
  stageChangedAt: string;
  daysInStage: number;
  isStalled: boolean;
};

export type FranchisePipeline = {
  stages: PipelineStageSummary[];
  leads: PipelineLead[];
};
