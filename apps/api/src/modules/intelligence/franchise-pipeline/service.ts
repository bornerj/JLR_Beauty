import { Prisma } from "@prisma/client";
import prisma from "../../../lib/prisma";
import { buildPipeline } from "./metrics";
import type { FranchisePipeline, FranchiseStage, LeadSnapshot, StageHistoryEdge } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 9 + RETROFIT-010b) — Pipeline de Franquias (RETROFIT-010).
 * Camada de acesso a dados: `FranchiseLead` + `FranchiseLeadStageHistory` reais.
 * `getFranchisePipeline` é só leitura; `moveLeadStage` (RETROFIT-010b) é a única escrita
 * do módulo — move um lead para outra etapa e grava a transição no histórico, mesma
 * fonte que `metrics.ts` usa para calcular "tempo médio esperado".
 */

const decimalToNumber = (value: Prisma.Decimal | null | undefined): number | null => {
  if (!value) return null;
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
};

export const getFranchisePipeline = async (): Promise<FranchisePipeline> => {
  const [leads, history] = await Promise.all([
    prisma.franchiseLead.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        stage: true,
        estimatedValue: true,
        stageChangedAt: true,
        createdAt: true,
      },
    }),
    prisma.franchiseLeadStageHistory.findMany({
      select: { leadId: true, fromStage: true, toStage: true, changedAt: true, reason: true },
    }),
  ]);

  // Item novo (achado do usuário, 2026-08-17): motivo/evento da última mudança de etapa
  // não aparecia em lugar nenhum do card — só ficava gravado no histórico (PLAN-0025).
  // `history` já vem ordenado por nenhuma garantia específica, então pegamos o registro
  // mais recente (`changedAt` maior) por lead — corresponde ao motivo da transição que
  // trouxe o lead pra etapa atual.
  const latestReasonByLead = new Map<number, { changedAt: Date; reason: string | null }>();
  for (const edge of history) {
    const current = latestReasonByLead.get(edge.leadId);
    if (!current || edge.changedAt > current.changedAt) {
      latestReasonByLead.set(edge.leadId, { changedAt: edge.changedAt, reason: edge.reason });
    }
  }

  const leadSnapshots: LeadSnapshot[] = leads.map((lead) => ({
    leadId: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    city: lead.city,
    stage: lead.stage,
    estimatedValue: decimalToNumber(lead.estimatedValue),
    // `stageChangedAt` é nullable no schema (leads pré-existentes à migração da Onda 9
    // não têm esse dado) — sem histórico de mudança real, o melhor honesto é assumir
    // que a etapa atual vale desde a criação do lead (`createdAt`), nunca `now()` (o que
    // faria um lead parado há meses parecer "acabou de chegar").
    stageChangedAt: lead.stageChangedAt ?? lead.createdAt,
    createdAt: lead.createdAt,
    reason: latestReasonByLead.get(lead.id)?.reason ?? null,
  }));

  const historyEdges: StageHistoryEdge[] = history.map((edge) => ({
    leadId: edge.leadId,
    fromStage: edge.fromStage,
    toStage: edge.toStage,
    changedAt: edge.changedAt,
  }));

  return buildPipeline(leadSnapshots, historyEdges, new Date());
};

/**
 * RETROFIT-010b — move um lead para `newStage`. Movimento livre entre qualquer par de
 * etapas (não só a próxima adjacente): pipelines comerciais reais recuam (proposta que
 * esfria, volta a "Qualificado") ou pulam etapas (relação antiga, já chega em
 * "Negociação") — restringir a só adjacentes obrigaria o usuário a clicar várias vezes
 * pra corrigir um lançamento errado, sem nenhum ganho de integridade real.
 *
 * `findUniqueOrThrow` lança `P2025` (tratado como 404 na rota) se o lead não existir.
 * Sem-op honesto quando a etapa pedida já é a atual — não grava uma transição fantasma
 * no histórico (poluiria a média de "tempo médio esperado" com uma duração de 0 dias).
 */
export const moveLeadStage = async (
  leadId: number,
  newStage: FranchiseStage,
  reason?: string
): Promise<FranchisePipeline> => {
  const lead = await prisma.franchiseLead.findUniqueOrThrow({ where: { id: leadId }, select: { id: true, stage: true } });

  if (lead.stage !== newStage) {
    const changedAt = new Date();
    await prisma.$transaction([
      prisma.franchiseLead.update({ where: { id: leadId }, data: { stage: newStage, stageChangedAt: changedAt } }),
      prisma.franchiseLeadStageHistory.create({
        data: { leadId, fromStage: lead.stage, toStage: newStage, changedAt, reason: reason ?? null },
      }),
    ]);
  }

  return getFranchisePipeline();
};
