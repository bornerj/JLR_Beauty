import { formatCurrencyBRL, formatMinutes } from "../../../shared/format";
import { ORDER_STATE_DOT_CLASS, ORDER_STATE_TEXT_CLASS } from "../state";
import type { OperationalOrderCard } from "../types";

/**
 * Admin V2 (PLAN-0022, Onda 3) — cartão de pedido no board operacional.
 * Sem drill-down: o Admin legado não suporta deep-link para o pedido específico
 * (mesmo achado já registrado na Onda 2 para "Ver agenda/clientes/produtos") — o card é
 * só leitura nesta versão, nunca um link morto.
 */

export function OrderCardView({ card }: { card: OperationalOrderCard }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-[#cfe7d1] bg-white p-3 dark:border-forest-green dark:bg-forest">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-forest">{card.publicCode ?? `#${card.orderId}`}</p>
        <p className="text-sm font-semibold text-forest">{formatCurrencyBRL(card.total)}</p>
      </div>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        {card.status} · {card.fulfillmentStatus} · há {formatMinutes(card.ageMinutes)}
      </p>
      {card.reason && (
        <p className={`flex items-center gap-1.5 text-xs font-medium ${ORDER_STATE_TEXT_CLASS[card.operationalState]}`}>
          <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${ORDER_STATE_DOT_CLASS[card.operationalState]}`} />
          {card.reason}
        </p>
      )}
    </div>
  );
}
