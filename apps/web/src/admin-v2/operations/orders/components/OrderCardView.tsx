import { Link } from "react-router-dom";
import { formatCurrencyBRL, formatMinutes } from "../../../shared/format";
import { ORDER_STATE_DOT_CLASS, ORDER_STATE_TEXT_CLASS } from "../state";
import type { OperationalOrderCard } from "../types";

/**
 * Admin V2 (PLAN-0022, Onda 3) — cartão de pedido no board operacional.
 *
 * PLAN-0030 — card `BLOCKED` (estoque insuficiente) não é resolvido avançando etapa (não é
 * um problema de tempo, é um problema real) — por isso, em vez de virar arrastável como os
 * demais cards de "Atenção", ganha um link fixo. O ID mostrado é `PV-{id}`, mesmo formato
 * exibido na Lista de Pedidos (ver ajuste abaixo).
 *
 * Ajuste do usuário (2026-08-18) — o card mostrava `card.publicCode` (código público longo,
 * ex. `PV-MSRI9DTA-33H4`, usado só pro rastreio do cliente/checkout), diferente do ID curto
 * (`PV-{id}`, ex. `PV-39`) usado em toda a tela de Pedidos e Vendas — inconsistência confundia
 * ao cruzar as duas telas. Corrigido pra usar o mesmo `PV-{id}`.
 *
 * PLAN-0031 — o link "Ver no Admin →" apontava pro admin legado (`/admin#vendas`, sem
 * deep-link pro pedido específico — achado documentado desde a Onda 2). Agora que a Lista de
 * Pedidos existe nativa no Admin V2 (`OrdersListView.tsx`), o link aponta pra lá com
 * `?highlight={id}` — abre o detalhe do pedido específico direto, uma melhoria real sobre o
 * que o legado nunca ofereceu.
 */

export function OrderCardView({ card }: { card: OperationalOrderCard }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-[#cfe7d1] bg-white p-3 dark:border-forest-green dark:bg-forest">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-forest">PV-{card.orderId}</p>
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
      {card.operationalState === "BLOCKED" && (
        <Link
          to={`/admin-v2/operacao/lista?highlight=${card.orderId}`}
          className="text-xs font-bold text-primary underline underline-offset-2 hover:text-primary/80"
        >
          Ver detalhes →
        </Link>
      )}
    </div>
  );
}
