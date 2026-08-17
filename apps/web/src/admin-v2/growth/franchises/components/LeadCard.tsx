import { formatCurrencyBRL } from "../../../shared/format";
import type { PipelineLead } from "../types";

/**
 * Admin V2 (PLAN-0022, Onda 9 + RETROFIT-010b; motivo obrigatório desde PLAN-0025) —
 * cartão de lead no Kanban comercial (RETROFIT-010).
 *
 * PLAN-0029 (`DECISION-015`) — reverte a decisão de RETROFIT-010b ("usuário nunca arrasta"): a mudança de
 * etapa agora é drag-and-drop (o card em si, arrastável via `KanbanDraggableCard` em
 * `PipelineBoardView.tsx`), não mais um `<select>` no card. Movimento livre entre qualquer
 * etapa continua valendo (não só a próxima) — justificativa em `moveLeadStage` no backend,
 * inalterada. Soltar o card só sinaliza a intenção — `PipelineBoardView` abre o modal de
 * motivo obrigatório antes de confirmar de verdade; cancelar o modal reverte a UI sozinho
 * (o board sempre renderiza a partir de `lead.stage`, nunca de um estado otimista).
 *
 * Achado do usuário (2026-08-17): o motivo virava obrigatório na troca de etapa, mas nunca
 * aparecia de volta no card — ficava só no histórico. Agora exibido como uma linha "Motivo"
 * com tooltip nativo (`title`, mesmo padrão já usado em outros campos do Admin V2) — passa o
 * mouse e o texto completo aparece, sem precisar de um componente de tooltip customizado.
 */

export function LeadCard({ lead, moving }: { lead: PipelineLead; /** true enquanto existe uma troca de etapa pendente/em andamento pra este lead (modal de motivo aberto ou submetendo) — dá feedback visual de "em trânsito". */ moving: boolean }) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-lg border bg-white p-3 transition-opacity dark:bg-forest ${
        lead.isStalled ? "border-state-attention/50 bg-state-attention/5" : "border-[#cfe7d1] dark:border-forest-green"
      } ${moving ? "opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-forest">{lead.name}</p>
        {lead.isStalled && (
          <span className="flex-shrink-0 rounded-full bg-state-attention/15 px-2 py-0.5 text-[10px] font-bold text-state-attention">
            parado
          </span>
        )}
      </div>
      {lead.city && <p className="text-sm text-stone-600 dark:text-stone-400">{lead.city}</p>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-600 dark:text-stone-400">
        {lead.estimatedValue !== null && <span className="font-semibold text-forest">{formatCurrencyBRL(lead.estimatedValue)}</span>}
        <span>há {Math.round(lead.daysInStage)}d nesta etapa</span>
      </div>

      {lead.reason && (
        <p
          title={lead.reason}
          className="w-fit cursor-help truncate text-xs font-semibold uppercase tracking-wider text-gold-accent underline decoration-dotted underline-offset-2"
        >
          Motivo
        </p>
      )}
    </div>
  );
}
