import { FRANCHISE_STAGES } from "./types";
import type { FranchisePipeline, FranchiseStage, LeadSnapshot, PipelineLead, PipelineStageSummary, StageHistoryEdge } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 9) — Pipeline de Franquias (RETROFIT-010).
 * Lógica pura de agregação (sem Prisma, testável isolada — mesmo padrão de
 * `customers/classifier.ts`/`subscriptions/classifier.ts`).
 *
 * "Tempo médio esperado" nunca é um número fixo inventado — é a MÉDIA HISTÓRICA real de
 * quanto tempo os leads já levaram para sair de cada etapa (`FranchiseLeadStageHistory`).
 * Só quando uma etapa ainda não tem nenhuma transição histórica (pipeline muito novo) o
 * cálculo cai para um limiar de segurança fixo e documentado.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Usado só quando a etapa ainda não tem nenhuma transição histórica para servir de referência (pipeline recém-criado). */
export const STALLED_FALLBACK_DAYS = 14;

const round1 = (value: number): number => Math.round(value * 10) / 10;

const daysBetween = (from: Date, to: Date): number => Math.max(0, (to.getTime() - from.getTime()) / MS_PER_DAY);

const average = (values: number[]): number | null => {
  if (values.length === 0) return null;
  return round1(values.reduce((sum, value) => sum + value, 0) / values.length);
};

export const buildPipeline = (leads: LeadSnapshot[], history: StageHistoryEdge[], now: Date): FranchisePipeline => {
  // 1) Duração histórica gasta em cada etapa: para cada lead, ordena as transições por
  // data e mede o intervalo entre "quando entrou na etapa" (transição anterior, ou
  // `createdAt` se for a primeira) e "quando saiu" (a própria transição).
  const historyByLead = new Map<number, StageHistoryEdge[]>();
  for (const edge of history) {
    const list = historyByLead.get(edge.leadId);
    if (list) list.push(edge);
    else historyByLead.set(edge.leadId, [edge]);
  }

  const durationsByStage = new Map<FranchiseStage, number[]>();
  const pushDuration = (stage: FranchiseStage, days: number) => {
    const list = durationsByStage.get(stage);
    if (list) list.push(days);
    else durationsByStage.set(stage, [days]);
  };

  const leadById = new Map(leads.map((lead) => [lead.leadId, lead]));
  for (const [leadId, edges] of historyByLead.entries()) {
    const lead = leadById.get(leadId);
    const sorted = [...edges].sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());
    let previousChangedAt = lead?.createdAt ?? sorted[0].changedAt;
    for (const edge of sorted) {
      if (edge.fromStage !== null) {
        pushDuration(edge.fromStage, daysBetween(previousChangedAt, edge.changedAt));
      }
      previousChangedAt = edge.changedAt;
    }
  }

  const avgDaysToCompleteByStage = new Map<FranchiseStage, number | null>();
  for (const stage of FRANCHISE_STAGES) {
    avgDaysToCompleteByStage.set(stage, average(durationsByStage.get(stage) ?? []));
  }

  // 2) Leads parados agora: dias na etapa atual + sinalização de atraso.
  const daysInStageByStage = new Map<FranchiseStage, number[]>();
  const pipelineLeads: PipelineLead[] = leads.map((lead) => {
    const daysInStage = round1(daysBetween(lead.stageChangedAt, now));
    const list = daysInStageByStage.get(lead.stage);
    if (list) list.push(daysInStage);
    else daysInStageByStage.set(lead.stage, [daysInStage]);

    const expected = avgDaysToCompleteByStage.get(lead.stage) ?? null;
    const threshold = expected ?? STALLED_FALLBACK_DAYS;

    return {
      leadId: lead.leadId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      city: lead.city,
      stage: lead.stage,
      estimatedValue: lead.estimatedValue,
      stageChangedAt: lead.stageChangedAt.toISOString(),
      daysInStage,
      isStalled: daysInStage > threshold,
      reason: lead.reason,
    };
  });

  // 3) Resumo por etapa.
  const stages: PipelineStageSummary[] = FRANCHISE_STAGES.map((stage) => {
    const stageLeads = leads.filter((lead) => lead.stage === stage);
    const estimatedValueTotal = stageLeads.reduce((sum, lead) => sum + (lead.estimatedValue ?? 0), 0);
    const avgDaysToComplete = avgDaysToCompleteByStage.get(stage) ?? null;
    const avgDaysInStageNow = average(daysInStageByStage.get(stage) ?? []);
    const isBottleneck = avgDaysInStageNow !== null && avgDaysToComplete !== null && avgDaysInStageNow > avgDaysToComplete;

    return {
      stage,
      count: stageLeads.length,
      estimatedValueTotal: round1(estimatedValueTotal),
      avgDaysToComplete,
      avgDaysInStageNow,
      isBottleneck,
    };
  });

  return { stages, leads: pipelineLeads };
};
