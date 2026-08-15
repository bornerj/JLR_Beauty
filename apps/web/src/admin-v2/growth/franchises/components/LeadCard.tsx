import { formatCurrencyBRL } from "../../../shared/format";
import { STAGE_LABELS } from "../state";
import { FRANCHISE_STAGES } from "../types";
import type { FranchiseStage, PipelineLead } from "../types";

/**
 * Admin V2 (PLAN-0022, Onda 9 + RETROFIT-010b) — cartão de lead no Kanban comercial
 * (RETROFIT-010). O board continua "usuário nunca arrasta" (mesmo padrão do Mapa da
 * Rede, Onda 2) — a movimentação de etapa é um seletor explícito, não drag-and-drop.
 * Movimento livre entre qualquer etapa (não só a próxima) — justificativa em
 * `moveLeadStage` no backend.
 */

export function LeadCard({
  lead,
  moving,
  moveError,
  onMoveStage,
}: {
  lead: PipelineLead;
  moving: boolean;
  moveError: string | null;
  onMoveStage: (stage: FranchiseStage) => void;
}) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-lg border bg-white p-3 dark:bg-forest ${
        lead.isStalled ? "border-state-attention/50 bg-state-attention/5" : "border-[#cfe7d1] dark:border-forest-green"
      }`}
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

      <select
        aria-label={`Mover ${lead.name} para outra etapa`}
        value={lead.stage}
        disabled={moving}
        onChange={(event) => onMoveStage(event.target.value as FranchiseStage)}
        className="mt-1 rounded-lg border border-gold/40 bg-white px-2 py-1 text-xs font-semibold text-forest disabled:opacity-50 dark:bg-forest"
      >
        {FRANCHISE_STAGES.map((stage) => (
          <option key={stage} value={stage}>
            {STAGE_LABELS[stage]}
          </option>
        ))}
      </select>
      {moveError && <p className="text-[11px] font-semibold text-state-critical">{moveError}</p>}
    </div>
  );
}
