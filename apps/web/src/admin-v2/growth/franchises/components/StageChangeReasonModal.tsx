import { useState } from "react";
import { STAGE_LABELS } from "../state";
import type { FranchiseStage } from "../types";

/**
 * Admin V2 (PLAN-0025, item 3) — modal pequeno pedindo o motivo/evento antes de confirmar
 * a mudança de etapa de um lead. Some sozinho ao confirmar; Cancelar reverte o `<select>`
 * do card sem chamar a API. Erro de envio mantém o modal aberto (não perde o texto digitado).
 */

export function StageChangeReasonModal({
  leadName,
  targetStage,
  submitting,
  error,
  onCancel,
  onConfirm,
}: {
  leadName: string;
  targetStage: FranchiseStage;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl dark:bg-forest">
        <h3 className="text-lg font-bold text-forest">Mover {leadName}</h3>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Nova etapa: <strong className="text-forest">{STAGE_LABELS[targetStage]}</strong>
        </p>
        <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
          Motivo ou evento que motivou a mudança
        </label>
        <textarea
          autoFocus
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          disabled={submitting}
          placeholder="ex.: reunião realizada em 15/08, proposta enviada por e-mail…"
          className="mt-1.5 w-full rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 dark:bg-forest-green"
        />
        {error && <p className="mt-2 text-xs font-semibold text-state-critical">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50 dark:text-stone-400"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(trimmed)}
            disabled={submitting || trimmed.length === 0}
            className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Movendo…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
