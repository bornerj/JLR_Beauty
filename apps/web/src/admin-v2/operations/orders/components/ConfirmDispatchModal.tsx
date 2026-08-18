import { useState } from "react";

/**
 * Admin V2 (PLAN-0030) — modal da transição Pronto→Despachado/Entregue no Board Operacional
 * de Pedidos (etapa final, sem marketplace/delivery de verdade por trás — projeto simples de
 * propósito). Pergunta primeiro qual dos dois aconteceu:
 * - "Entregue" (ex.: retirada no balcão): confirma direto, sem campo extra.
 * - "Despachado" (ex.: envio via transportadora): pede o meio (texto livre, ex. "Correios") e
 *   a data — editável, aceita registro retroativo (`shippedAt` no PATCH, PLAN-0030).
 */

export type DispatchOutcome = { kind: "ENTREGUE" } | { kind: "DESPACHADO"; carrier: string; date: string };

export function ConfirmDispatchModal({
  publicCode,
  submitting,
  error,
  onCancel,
  onConfirm,
}: {
  publicCode: string | null;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (outcome: DispatchOutcome) => void;
}) {
  const [kind, setKind] = useState<"ENTREGUE" | "DESPACHADO" | null>(null);
  const [carrier, setCarrier] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const trimmedCarrier = carrier.trim();

  const canConfirm = kind === "ENTREGUE" || (kind === "DESPACHADO" && trimmedCarrier.length > 0 && date.length > 0);

  const handleConfirm = () => {
    if (kind === "ENTREGUE") onConfirm({ kind: "ENTREGUE" });
    if (kind === "DESPACHADO") onConfirm({ kind: "DESPACHADO", carrier: trimmedCarrier, date });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl dark:bg-forest">
        <h3 className="text-lg font-bold text-forest">Despachado ou entregue?</h3>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Pedido <strong className="text-forest">{publicCode ?? "—"}</strong>
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setKind("ENTREGUE")}
            disabled={submitting}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-wider ${
              kind === "ENTREGUE"
                ? "border-primary bg-primary/10 text-primary"
                : "border-stone-200 text-stone-600 hover:bg-stone-50 dark:text-stone-400"
            }`}
          >
            Entregue
          </button>
          <button
            type="button"
            onClick={() => setKind("DESPACHADO")}
            disabled={submitting}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-wider ${
              kind === "DESPACHADO"
                ? "border-primary bg-primary/10 text-primary"
                : "border-stone-200 text-stone-600 hover:bg-stone-50 dark:text-stone-400"
            }`}
          >
            Despachado
          </button>
        </div>

        {kind === "DESPACHADO" && (
          <>
            <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              Meio de envio
            </label>
            <input
              type="text"
              autoFocus
              value={carrier}
              onChange={(event) => setCarrier(event.target.value)}
              disabled={submitting}
              placeholder="ex.: Correios, motoboy…"
              className="mt-1.5 w-full rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 dark:bg-forest-green"
            />
            <label className="mt-3 block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              Data do despacho
            </label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              disabled={submitting}
              className="mt-1.5 w-full rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 dark:bg-forest-green"
            />
          </>
        )}

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
            onClick={handleConfirm}
            disabled={submitting || !canConfirm}
            className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Confirmando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
