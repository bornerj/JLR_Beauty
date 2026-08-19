import { useState } from "react";
import {
  FULFILLMENT_STATUS_OPTIONS,
  ORDER_STATUS_OPTIONS,
  PROGRESSING_FULFILLMENT_STATUSES,
  PROGRESSING_ORDER_STATUSES,
  STATUS_LABEL,
  requiresApprovedPayment,
} from "../listTypes";
import type { OrderListRow } from "../listTypes";

/**
 * Admin V2 (PLAN-0031) — modal de edição de status/fulfillment (migração de
 * `openOrderStatusModal()`, `admin-orders/behavior.ts:553-594`). Dois blocos independentes,
 * como no legado: status do pedido (cancelar é uma opção aqui, não um botão à parte) e
 * fulfillment (+ transportadora/rastreio/notas). Opções que avançam etapa ficam desabilitadas
 * quando o pedido tem pagamento vinculado não aprovado — mesma regra replicada no backend
 * (`requiresApprovedPayment`, os dois endpoints já validam de novo, isto é só UX).
 */

export function OrderEditModal({
  order,
  submitting,
  error,
  onCancel,
  onSaveStatus,
  onSaveFulfillment,
}: {
  order: OrderListRow;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSaveStatus: (status: string) => void;
  onSaveFulfillment: (args: { fulfillmentStatus: string; shipmentCarrier: string; shipmentTrackingCode: string; fulfillmentNotes: string }) => void;
}) {
  const [status, setStatus] = useState(order.status);
  const [fulfillmentStatus, setFulfillmentStatus] = useState(order.fulfillmentStatus);
  const [carrier, setCarrier] = useState(order.shipmentCarrier ?? "");
  const [tracking, setTracking] = useState(order.shipmentTrackingCode ?? "");
  const [notes, setNotes] = useState(order.fulfillmentNotes ?? "");

  const blocked = requiresApprovedPayment(order.payments);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-2xl dark:bg-forest">
        <h3 className="text-lg font-bold text-forest">Atualizar pedido PV-{order.id}</h3>
        {blocked && (
          <p className="mt-1.5 text-xs font-semibold text-state-critical">
            Pagamento vinculado ainda não aprovado — etapas que avançam ficam bloqueadas até a aprovação.
          </p>
        )}

        <div className="mt-4 rounded-lg border border-stone-100 p-3 dark:border-forest-green/40">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Status do pedido</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            disabled={submitting}
            className="mt-1.5 w-full rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 dark:bg-forest-green"
          >
            {ORDER_STATUS_OPTIONS.map((value) => (
              <option key={value} value={value} disabled={blocked && PROGRESSING_ORDER_STATUSES.has(value)}>
                {STATUS_LABEL[value] ?? value}
              </option>
            ))}
          </select>
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => onSaveStatus(status)}
              disabled={submitting || status === order.status}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Salvando…" : "Salvar status"}
            </button>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-stone-100 p-3 dark:border-forest-green/40">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Fulfillment</label>
          <select
            value={fulfillmentStatus}
            onChange={(event) => setFulfillmentStatus(event.target.value)}
            disabled={submitting}
            className="mt-1.5 w-full rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 dark:bg-forest-green"
          >
            {FULFILLMENT_STATUS_OPTIONS.map((value) => (
              <option key={value} value={value} disabled={blocked && PROGRESSING_FULFILLMENT_STATUSES.has(value)}>
                {STATUS_LABEL[value] ?? value}
              </option>
            ))}
          </select>

          <label className="mt-2.5 block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Transportadora</label>
          <input
            type="text"
            value={carrier}
            onChange={(event) => setCarrier(event.target.value)}
            disabled={submitting}
            placeholder="ex.: Correios, motoboy…"
            className="mt-1.5 w-full rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 dark:bg-forest-green"
          />

          <label className="mt-2.5 block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Código de rastreio</label>
          <input
            type="text"
            value={tracking}
            onChange={(event) => setTracking(event.target.value)}
            disabled={submitting}
            className="mt-1.5 w-full rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 dark:bg-forest-green"
          />

          <label className="mt-2.5 block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Notas</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={submitting}
            className="mt-1.5 w-full rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 dark:bg-forest-green"
          />

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => onSaveFulfillment({ fulfillmentStatus, shipmentCarrier: carrier, shipmentTrackingCode: tracking, fulfillmentNotes: notes })}
              disabled={submitting}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Salvando…" : "Salvar fulfillment"}
            </button>
          </div>
        </div>

        {error && <p className="mt-3 text-xs font-semibold text-state-critical">{error}</p>}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-full border border-stone-200 px-4 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50 dark:text-stone-400"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
