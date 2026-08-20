import { formatCurrencyBRL } from "../../../shared/format";
import { PAYMENT_STATUS_LABEL, STATUS_BADGE_CLASS, STATUS_LABEL } from "../listTypes";
import type { OrderListRow } from "../listTypes";

/**
 * Admin V2 (PLAN-0031) — drawer de detalhe do pedido, somente leitura (migração de
 * `openOrderDetails()`, `admin-orders/behavior.ts:468-551`). Mostra tudo que o legado mostrava:
 * status/fulfillment, cliente, envio, itens (sem edição — o legado também não deixa editar
 * item aqui), pagamentos e histórico completo de status.
 *
 * PLAN-0032 ocorrência #4 (`@frontend-specialist`) — reformulação visual: usuário reportou
 * a tela "branca, pálida" (texto solto direto sobre fundo branco, sem nenhuma separação de
 * seção). Aplicados só os princípios universais da skill `frontend-design` (chunking/Miller's
 * Law, hierarquia 60-30-10, Von Restorff no dado mais importante) — deliberadamente **sem**
 * o mandato "radical/brutalista" do agente (Bento ban, geometria extrema, animação
 * obrigatória): este é um modal de leitura denso dentro de uma suite de 30+ telas do Admin V2
 * já em produção, `DECISION-013` regra #6 exige preservar os tokens de marca existentes, e
 * qualquer linguagem visual nova aqui ficaria inconsistente com o resto do painel (Risco de
 * Consistência alto no DFII se fosse radical). Nenhum token novo — 100% reuso do vocabulário
 * já estabelecido no Admin V2 (`border-gold/30 bg-cream-sidebar` das KPI tiles, `bg-primary/5`
 * dos badges/realces, `bg-state-*` dos status).
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

        <div className="flex-1 space-y-4 overflow-y-auto bg-stone-50/60 px-5 py-4 dark:bg-black/10">
          {/* Faixa de destaque — status + total, o dado mais importante do modal (Von Restorff),
              única superfície com a cor da marca (primary), o resto fica neutro por baixo dela. */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 dark:border-primary/40 dark:bg-primary/10">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[order.status] ?? "bg-stone-200 text-stone-700"}`}>
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[order.fulfillmentStatus] ?? "bg-stone-200 text-stone-700"}`}>
                {STATUS_LABEL[order.fulfillmentStatus] ?? order.fulfillmentStatus}
              </span>
            </div>
            <span className="text-xl font-bold text-forest">{formatCurrencyBRL(Number(order.total))}</span>
          </div>

          {/* Cliente — chunked num card próprio (Miller's Law: cada bloco de informação separado,
              nunca texto corrido) em vez de flutuar solto sobre o branco. */}
          <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-forest-green/40 dark:bg-forest">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Cliente</p>
            <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm text-stone-600 sm:grid-cols-2 dark:text-stone-400">
              <p><span className="font-semibold text-forest">Cliente:</span> {order.customerName ?? "—"}</p>
              <p><span className="font-semibold text-forest">E-mail:</span> {order.customerEmail ?? "—"}</p>
              <p><span className="font-semibold text-forest">Telefone:</span> {order.customerPhone ?? "—"}</p>
              <p><span className="font-semibold text-forest">Canal:</span> {order.channel}</p>
              <p><span className="font-semibold text-forest">Criado em:</span> {formatDateTime(order.createdAt)}</p>
              <p><span className="font-semibold text-forest">Atualizado em:</span> {formatDateTime(order.updatedAt)}</p>
            </div>
          </div>

          {(order.shipmentCarrier || order.shipmentTrackingCode || order.fulfillmentNotes) && (
            <div className="rounded-lg border border-stone-200 bg-white p-4 text-sm dark:border-forest-green/40 dark:bg-forest">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Envio</p>
              {order.shipmentCarrier && <p className="text-forest">Transportadora: {order.shipmentCarrier}</p>}
              {order.shipmentTrackingCode && <p className="text-forest">Rastreio: {order.shipmentTrackingCode}</p>}
              {order.fulfillmentNotes && <p className="text-stone-600 dark:text-stone-400">Notas: {order.fulfillmentNotes}</p>}
            </div>
          )}

          <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-forest-green/40 dark:bg-forest">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Itens</p>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="rounded-lg bg-cream-sidebar text-xs text-stone-500 dark:bg-forest-green/40 dark:text-stone-400">
                  <th className="rounded-l-lg py-1.5 pl-2">Item</th>
                  <th className="py-1.5 text-right">Qtd</th>
                  <th className="py-1.5 text-right">Preço unit.</th>
                  <th className="rounded-r-lg py-1.5 pr-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-2 text-stone-500 dark:text-stone-400">Nenhum item.</td>
                  </tr>
                ) : (
                  order.items.map((item) => (
                    <tr key={item.id} className="border-b border-stone-100 last:border-0 dark:border-forest-green/40">
                      <td className="py-1.5 pl-2 text-forest">{itemLabel(item)}</td>
                      <td className="py-1.5 text-right text-forest">{item.quantity}</td>
                      <td className="py-1.5 text-right text-forest">{formatCurrencyBRL(Number(item.unitPrice))}</td>
                      <td className="py-1.5 pr-2 text-right font-semibold text-forest">{formatCurrencyBRL(Number(item.unitPrice) * item.quantity)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-forest-green/40 dark:bg-forest">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Pagamentos</p>
            {order.payments.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">Nenhum pagamento vinculado.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-cream-sidebar text-xs text-stone-500 dark:bg-forest-green/40 dark:text-stone-400">
                    <th className="rounded-l-lg py-1.5 pl-2">Status</th>
                    <th className="py-1.5">Método</th>
                    <th className="py-1.5 text-right">Valor</th>
                    <th className="rounded-r-lg py-1.5 pr-2 text-right">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {order.payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-stone-100 last:border-0 dark:border-forest-green/40">
                      <td className="py-1.5 pl-2 text-forest">{PAYMENT_STATUS_LABEL[payment.status] ?? payment.status}</td>
                      <td className="py-1.5 text-forest">{payment.method ?? payment.provider}</td>
                      <td className="py-1.5 text-right text-forest">{formatCurrencyBRL(Number(payment.amount))}</td>
                      <td className="py-1.5 pr-2 text-right text-stone-500 dark:text-stone-400">{formatDateTime(payment.paidAt ?? payment.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-forest-green/40 dark:bg-forest">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Histórico de status</p>
            {order.statusHistory.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">Sem histórico registrado.</p>
            ) : (
              <ul className="flex flex-col gap-2.5 border-l-2 border-gold/40 text-sm dark:border-forest-green">
                {order.statusHistory.map((entry) => (
                  <li key={entry.id} className="relative pl-4 text-stone-600 dark:text-stone-400">
                    <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
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
