import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { fetchFranchisePipeline, moveFranchiseLeadStage } from "../../shared/api";
import { formatCurrencyBRL } from "../../shared/format";
import { KanbanColumnHeader } from "../../shell/KanbanColumnHeader";
import { KanbanDndProvider, KanbanDroppableColumn, KanbanDraggableCard } from "../../shell/kanban/KanbanDndBoard";
import { STAGE_LABELS } from "./state";
import { LeadCard } from "./components/LeadCard";
import { StageChangeReasonModal } from "./components/StageChangeReasonModal";
import { FRANCHISE_STAGES } from "./types";
import type { FranchisePipeline, FranchiseStage } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 9 + RETROFIT-010b; motivo obrigatório desde PLAN-0025) —
 * Pipeline de Franquias (RETROFIT-010). Pergunta que a tela fecha: "onde estão as
 * oportunidades comerciais de franquia?" Kanban comercial clássico, com alerta visual
 * quando uma etapa está mais lenta que o tempo médio histórico esperado. Distinto de
 * "franquia em operação" (`Unit`, Ondas 1-8) — este é o funil de VENDA, antes de virar
 * unidade.
 *
 * PLAN-0029 (`DECISION-015`) — reverte a decisão de RETROFIT-010b ("usuário nunca arrasta, mesmo padrão do
 * Mapa da Rede"): movimentação de etapa passa a ser drag-and-drop entre qualquer par de
 * colunas (movimento livre, mesma regra de negócio do `moveLeadStage` no backend, inalterada
 * — nunca só a etapa adjacente). Arrastar e soltar só abre o mesmo modal de motivo
 * obrigatório de antes (`StageChangeReasonModal`, PLAN-0025 item 3) — a escrita real só
 * acontece se o usuário confirmar lá; soltar na própria coluna atual não faz nada.
 */

type PipelineState = { loading: boolean; data: FranchisePipeline | null; error: string | null };
type PendingChange = { leadId: number; leadName: string; targetStage: FranchiseStage } | null;
type MoveState = { leadId: number; submitting: boolean; error: string | null } | null;

export function PipelineBoardView() {
  const [state, setState] = useState<PipelineState>({ loading: true, data: null, error: null });
  const [pendingChange, setPendingChange] = useState<PendingChange>(null);
  const [moveState, setMoveState] = useState<MoveState>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchFranchisePipeline({ token });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar o pipeline de franquias.";
      logger.warn("Falha ao carregar Pipeline de Franquias (Admin V2)", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, []);

  useEffect(() => {
    // ERR-0083 — adia a chamada em 1 tick: load() faz setState antes do primeiro
    // await, o que roda de forma síncrona dentro do próprio efeito (react-hooks/set-state-in-effect).
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const cancelPendingChange = useCallback(() => {
    setPendingChange(null);
    setMoveState(null);
  }, []);

  const confirmPendingChange = useCallback(
    async (reason: string) => {
      if (!pendingChange) return;
      const { leadId, targetStage } = pendingChange;
      const token = getToken();
      if (!token) {
        setMoveState({ leadId, submitting: false, error: "Sessão expirada. Faça login novamente." });
        return;
      }
      setMoveState({ leadId, submitting: true, error: null });
      try {
        const data = await moveFranchiseLeadStage({ token, leadId, stage: targetStage, reason });
        setState({ loading: false, data, error: null });
        setPendingChange(null);
        setMoveState(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao mover o lead de etapa.";
        logger.warn("Falha ao mover etapa de lead de franquia (Admin V2)", { error: message, leadId, stage: targetStage });
        setMoveState({ leadId, submitting: false, error: message });
      }
    },
    [pendingChange]
  );

  const handleCardDrop = useCallback(
    (cardId: string, columnId: string) => {
      const leadId = Number(cardId);
      const targetStage = columnId as FranchiseStage;
      const lead = state.data?.leads.find((candidate) => candidate.leadId === leadId);
      if (!lead || lead.stage === targetStage) return;
      setPendingChange({ leadId, leadName: lead.name, targetStage });
    },
    [state.data]
  );

  if (state.loading && !state.data) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando pipeline de franquias…</p>;
  }

  if (state.error && !state.data) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar o pipeline de franquias.</p>
        <p className="text-sm text-stone-600 dark:text-stone-400">{state.error}</p>
        <div>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!state.data) return null;
  const pipeline = state.data;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-forest">Crescimento — Franquias</h1>
        <p className="text-base text-stone-600 dark:text-stone-400">onde estão as oportunidades comerciais de franquia</p>
      </div>

      <KanbanDndProvider onCardDrop={handleCardDrop}>
      <div className="overflow-x-auto">
        <div className="flex gap-3" style={{ minWidth: `${FRANCHISE_STAGES.length * 260}px` }}>
          {pipeline.stages.map((stageSummary) => {
            const leads = pipeline.leads.filter((lead) => lead.stage === stageSummary.stage);
            return (
              <div key={stageSummary.stage} className="flex w-64 flex-shrink-0 flex-col gap-3">
                <KanbanColumnHeader className={stageSummary.isBottleneck ? "border-state-critical/60" : undefined}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-forest">{STAGE_LABELS[stageSummary.stage]}</p>
                    <p className="text-sm font-bold text-forest">{stageSummary.count}</p>
                  </div>
                  {stageSummary.estimatedValueTotal > 0 && (
                    <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{formatCurrencyBRL(stageSummary.estimatedValueTotal)} potencial</p>
                  )}
                  {stageSummary.avgDaysToComplete !== null && (
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">tempo médio esperado: {Math.round(stageSummary.avgDaysToComplete)}d</p>
                  )}
                  {stageSummary.isBottleneck && (
                    <p className="mt-1.5 text-[11px] font-bold text-state-critical">
                      ⚠ mais lento que o normal ({Math.round(stageSummary.avgDaysInStageNow ?? 0)}d parado em média)
                    </p>
                  )}
                </KanbanColumnHeader>

                <KanbanDroppableColumn columnId={stageSummary.stage} droppable className="flex flex-col gap-2 p-1">
                  {leads.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-stone-200 p-3 text-center text-xs text-stone-500 dark:text-stone-400">
                      nenhum lead nesta etapa
                    </p>
                  ) : (
                    leads.map((lead) => (
                      <KanbanDraggableCard
                        key={lead.leadId}
                        cardId={String(lead.leadId)}
                        draggable
                        disabled={pendingChange !== null || moveState !== null}
                      >
                        <LeadCard lead={lead} moving={pendingChange?.leadId === lead.leadId} />
                      </KanbanDraggableCard>
                    ))
                  )}
                </KanbanDroppableColumn>
              </div>
            );
          })}
        </div>
      </div>
      </KanbanDndProvider>

      {pendingChange && (
        <StageChangeReasonModal
          leadName={pendingChange.leadName}
          targetStage={pendingChange.targetStage}
          submitting={moveState?.submitting ?? false}
          error={moveState?.leadId === pendingChange.leadId ? moveState.error : null}
          onCancel={cancelPendingChange}
          onConfirm={(reason) => void confirmPendingChange(reason)}
        />
      )}
    </div>
  );
}
