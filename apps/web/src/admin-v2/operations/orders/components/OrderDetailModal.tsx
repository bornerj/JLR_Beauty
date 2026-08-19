import { formatCurrencyBRL } from "../../../shared/format";
import { PAYMENT_STATUS_LABEL, STATUS_BADGE_CLASS, STATUS_LABEL } from "../listTypes";
import type { OrderListRow } from "../listTypes";

/**
 * Admin V2 (PLAN-0031) — drawer de detalhe do pedido, somente leitura (migração de
 * `openOrderDetails()`, `admin-orders/behavior.ts:468-551`). Mostra tudo que o legado mostrava:
 * status/fulfillment, cliente, envio, itens (sem edição — o legado também não deixa editar
 * item aqui), pagamentos e histórico completo de status.
 */

const formatDateTime = (value: string | null): string => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const itemLabel = (item: OrderListRow["items"][number]): string => {
  if (item.product) return item.product.name;
  if (item.service) return item.service.name;
  if (item.membership) return item.membership.title ?? item.membership.name;
  return "—";
};

export function OrderDetailModal({ order, onClose }: { order: OrderListRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl dark:bg-forest">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4 dark:border-forest-green/40">
          <h3 className="text-lg font-bold text-forest">
            Pedido PV-{order.id}
            {order.publicCode ? <span className="ml-2 text-sm font-normal text-stone-500 dark:text-stone-400">({order.publicCode})</span> : null}
          </h3>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-stone-500 hover:text-forest dark:text-stone-400">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[order.status] ?? "bg-stone-200 text-stone-700"}`}>
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[order.fulfillmentStatus] ?? "bg-stone-200 text-stone-700"}`}>
              {STATUS_LABEL[order.fulfillmentStatus] ?? order.fulfillmentStatus}
            </span>
            <span className="text-sm font-semibold text-forest">{formatCurrencyBRL(Number(order.total))}</span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-stone-600 sm:grid-cols-2 dark:text-stone-400">
            <p><span className="font-semibold text-forest">Cliente:</span> {order.customerName ?? "—"}</p>
            <p><span className="font-semibold text-forest">E-mail:</span> {order.customerEmail ?? "—"}</p>
            <p><span className="font-semibold text-forest">Telefone:</span> {order.customerPhone ?? "—"}</p>
            <p><span className="font-semibold text-forest">Canal:</span> {order.channel}</p>
            <p><span className="font-semibold text-forest">Criado em:</span> {formatDateTime(order.createdAt)}</p>
            <p><span className="font-semibold text-forest">Atualizado em:</span> {formatDateTime(order.updatedAt)}</p>
          </div>

          {(order.shipmentCarrier || order.shipmentTrackingCode || order.fulfillmentNotes) && (
            <div className="mt-3 rounded-lg border border-stone-100 p-3 text-sm dark:border-forest-green/40">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Envio</p>
              {order.shipmentCarrier && <p className="text-forest">Transportadora: {order.shipmentCarrier}</p>}
              {order.shipmentTrackingCode && <p className="text-forest">Rastreio: {order.shipmentTrackingCode}</p>}
              {order.fulfillmentNotes && <p className="text-stone-600 dark:text-stone-400">Notas: {order.fulfillmentNotes}</p>}
            </div>
          )}

          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Itens</p>
          <table className="mt-1.5 w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-stone-500 dark:text-stone-400">
                <th className="py-1">Item</th>
                <th className="py-1 text-right">Qtd</th>
                <th className="py-1 text-right">Preço unit.</th>
                <th className="py-1 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-2 text-stone-500 dark:text-stone-400">Nenhum item.</td>
                </tr>
              ) : (
                order.items.map((item) => (
                  <tr key={item.id} className="border-t border-stone-100 dark:border-forest-green/40">
                    <td className="py-1.5 text-forest">{itemLabel(item)}</td>
                    <td className="py-1.5 text-right text-forest">{item.quantity}</td>
                    <td className="py-1.5 text-right text-forest">{formatCurrencyBRL(Number(item.unitPrice))}</td>
                    <td className="py-1.5 text-right font-semibold text-forest">{formatCurrencyBRL(Number(item.unitPrice) * item.quantity)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Pagamentos</p>
          {order.payments.length === 0 ? (
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Nenhum pagamento vinculado.</p>
          ) : (
            <table className="mt-1.5 w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-stone-500 dark:text-stone-400">
                  <th className="py-1">Status</th>
                  <th className="py-1">Método</th>
                  <th className="py-1 text-right">Valor</th>
                  <th className="py-1 text-right">Data</th>
                </tr>
              </thead>
              <tbody>
                {order.payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-stone-100 dark:border-forest-green/40">
                    <td className="py-1.5 text-forest">{PAYMENT_STATUS_LABEL[payment.status] ?? payment.status}</td>
                    <td className="py-1.5 text-forest">{payment.method ?? payment.provider}</td>
                    <td className="py-1.5 text-right text-forest">{formatCurrencyBRL(Number(payment.amount))}</td>
                    <td className="py-1.5 text-right text-stone-500 dark:text-stone-400">{formatDateTime(payment.paidAt ?? payment.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Histórico de status</p>
          {order.statusHistory.length === 0 ? (
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Sem histórico registrado.</p>
          ) : (
            <ul className="mt-1.5 flex flex-col gap-1 text-sm">
              {order.statusHistory.map((entry) => (
                <li key={entry.id} className="text-stone-600 dark:text-stone-400">
                  <span className="font-semibold text-forest">
                    {entry.fromStatus ? `${STATUS_LABEL[entry.fromStatus] ?? entry.fromStatus} → ` : ""}
                    {STATUS_LABEL[entry.toStatus] ?? entry.toStatus}
                  </span>{" "}
                  ({entry.source}){entry.note ? ` — ${entry.note}` : ""} · {formatDateTime(entry.createdAt)}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end border-t border-stone-100 px-5 py-3 dark:border-forest-green/40">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone-200 px-4 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 dark:text-stone-400"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
