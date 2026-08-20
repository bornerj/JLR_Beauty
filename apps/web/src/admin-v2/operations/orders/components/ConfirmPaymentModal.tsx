import { useState } from "react";

/**
 * Admin V2 (PLAN-0030) — modal da transição Recebido→Pago no Board Operacional de Pedidos.
 * Não existe hoje uma integração de meio de pagamento cobrindo esse trecho do fluxo (vendas
 * balcão/manuais, PIX fora do Stripe etc.) — por isso a confirmação é manual: pede nome e data
 * de quem confirmou o recebimento, gravados como texto no histórico do pedido (mesmo padrão do
 * `StageChangeReasonModal` de Franquias — motivo/contexto livre em vez de campo estruturado
 * novo). Quando uma integração real cobrir esse trecho, a flag
 * `operations.manualPaymentConfirmationEnabled` desativa esta coluna pra drop manual.
 */

export function ConfirmPaymentModal({
  orderId,
  submitting,
  error,
  onCancel,
  onConfirm,
}: {
  orderId: number;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (args: { confirmedByName: string; confirmedAt: string }) => void;
}) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const trimmedName = name.trim();
  const canConfirm = trimmedName.length > 0 && date.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl dark:bg-forest">
        <h3 className="text-lg font-bold text-forest">Confirmar pagamento</h3>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Pedido <strong className="text-forest">PV-{orderId}</strong> — sem integração de meio de pagamento
          ativa aqui ainda, confirme quem recebeu.
        </p>

        <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
          Confirmado por
        </label>
        <input
          type="text"
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={submitting}
          placeholder="nome de quem recebeu o pagamento"
          className="mt-1.5 w-full rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 dark:bg-forest-green"
        />

        <label className="mt-3 block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
          Data da confirmação
        </label>
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          disabled={submitting}
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
            onClick={() => onConfirm({ confirmedByName: trimmedName, confirmedAt: date })}
            disabled={submitting || !canConfirm}
            className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Confirmando…" : "Confirmar pagamento"}
          </button>
        </div>
      </div>
    </div>
  );
}
