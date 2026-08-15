/**
 * Admin V2 (PLAN-0022, Onda 9) — Pipeline de Franquias (RETROFIT-010).
 * Contrato único do módulo (mesmo padrão de `customers/types.ts`,
 * `subscriptions/types.ts`): `metrics.ts` (puro) e `service.ts` (Prisma) importam daqui.
 *
 * Distinto de "franquia em operação" (`Unit`, já coberta pelas Ondas 1-8) — este é o
 * pipeline COMERCIAL (venda da franquia, antes de virar unidade), sobre `FranchiseLead`.
 * Só leitura — este onda não adiciona nenhuma rota de escrita para mover um lead de
 * etapa (o board é um Kanban "usuário nunca arrasta", mesmo padrão do Mapa da Rede da
 * Onda 2 — colunas ordenadas pelo backend, não drag-and-drop).
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
};

/** Uma transição de etapa já normalizada, entrada pura de `metrics.ts`. */
export type StageHistoryEdge = {
  leadId: number;
  fromStage: FranchiseStage | null;
  toStage: FranchiseStage;
  changedAt: Date;
};
