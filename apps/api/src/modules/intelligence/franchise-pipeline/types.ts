/**
 * Admin V2 (PLAN-0022, Onda 9) — Pipeline de Franquias (RETROFIT-010).
 * Contrato único do módulo (mesmo padrão de `customers/types.ts`,
 * `subscriptions/types.ts`): `metrics.ts` (puro) e `service.ts` (Prisma) importam daqui.
 *
 * Distinto de "franquia em operação" (`Unit`, já coberta pelas Ondas 1-8) — este é o
 * pipeline COMERCIAL (venda da franquia, antes de virar unidade), sobre `FranchiseLead`.
 * Escrita via `moveLeadStage` (RETROFIT-010b) — movimento de etapa no frontend é
 * drag-and-drop desde o `PLAN-0029` (`DECISION-015`, substitui a regra "usuário nunca
 * arrasta" original desta onda); a regra de negócio em si (movimento livre entre
 * qualquer etapa, motivo obrigatório) não mudou, só o gatilho de UI.
 */
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
  /** Média histórica (`FranchiseLeadStageHistory`) de dias gastos nesta etapa antes de avançar — o "esperado". Null sem nenhuma transição histórica ainda. */
  avgDaysToComplete: number | null;
  /** Média de dias dos leads que estão PARADOS nesta etapa agora — o "real". Null sem nenhum lead na etapa. */
  avgDaysInStageNow: number | null;
  /** `avgDaysInStageNow > avgDaysToComplete` — etapa mais lenta que o próprio histórico já mostrou ser normal. */
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
  /** `daysInStage` acima do esperado para a etapa (ou do limiar de segurança, sem histórico ainda). */
  isStalled: boolean;
  /** Motivo/evento da mudança que trouxe o lead pra etapa atual (`FranchiseLeadStageHistory.reason`,
   * PLAN-0025 item 3). Null quando a etapa atual é a de criação (nunca mudou) ou a transição é
   * anterior ao campo `reason` existir. */
  reason: string | null;
};

export type FranchisePipeline = {
  stages: PipelineStageSummary[];
  leads: PipelineLead[];
};

/** Snapshot já normalizado de um lead (Decimal convertido, datas resolvidas), entrada pura de `metrics.ts`. */
export type LeadSnapshot = {
  leadId: number;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  stage: FranchiseStage;
  estimatedValue: number | null;
  stageChangedAt: Date;
  createdAt: Date;
  reason: string | null;
};

/** Uma transição de etapa já normalizada, entrada pura de `metrics.ts`. */
export type StageHistoryEdge = {
  leadId: number;
  fromStage: FranchiseStage | null;
  toStage: FranchiseStage;
  changedAt: Date;
};
