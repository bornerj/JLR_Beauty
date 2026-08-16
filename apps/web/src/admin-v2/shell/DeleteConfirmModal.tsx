/**
 * Admin V2 (PLAN-0026) — modal pequeno de confirmação de exclusão, compartilhado entre as
 * telas nativas de Cadastros. Mesmo padrão do `StageChangeReasonModal` (PLAN-0025): nunca
 * `window.confirm()` nativo (bloqueia automação/Playwright e foge do visual do V2).
 */

export function DeleteConfirmModal({
  title,
  description,
  submitting,
  error,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl dark:bg-forest">
        <h3 className="text-lg font-bold text-forest">{title}</h3>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{description}</p>
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
            onClick={onConfirm}
            disabled={submitting}
            className="rounded-full bg-state-critical px-3 py-1.5 text-xs font-semibold text-white hover:bg-state-critical/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Excluindo…" : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
