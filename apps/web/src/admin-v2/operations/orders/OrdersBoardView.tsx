import { useCallback, useEffect, useMemo, useState } from "react";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { useAdminScope } from "../../shell/adminScope";
import { fetchOrdersBoard, fetchOrdersFlow, updateOrderFulfillmentStatus } from "../../shared/api";
import { formatCurrencyBRL } from "../../shared/format";
import { KanbanColumnHeader } from "../../shell/KanbanColumnHeader";
import { KanbanDndProvider, KanbanDroppableColumn, KanbanDraggableCard } from "../../shell/kanban/KanbanDndBoard";
import type { OrdersBoard, OrdersFlow } from "./types";
import { OrderCardView } from "./components/OrderCardView";
import { OrderFlowTimeline } from "./components/OrderFlowTimeline";

/**
 * Admin V2 (PLAN-0022, Onda 3) — Board Operacional de Pedidos (RETROFIT-004).
 * Pergunta que a tela fecha: "onde os pedidos estão travando?"
 *
 * PLAN-0029 — drag-and-drop adicionado entre `emPreparacao` ↔ `prontos`. `entraram` e
 * `atencao` ficam fixas (não-arrastáveis, nem origem nem destino): a coluna não é um campo
 * salvo, é calculada (`columnFor()`, `operational-orders/service.ts`) a partir de
 * `status`+`fulfillmentStatus`+um alerta de tempo — "Entraram" só sai de lá quando o
 * pagamento é confirmado (nunca por ação manual de arrastar) e "Atenção" é um alerta, não
 * uma etapa que o usuário escolhe. Soltar em "Prontos" sempre grava `fulfillmentStatus =
 * DESPACHADO` (o primeiro dos 3 status "prontos" — Enviado/Entregue continuam pela tela de
 * detalhe do pedido); soltar de volta em "Em preparação" grava `SEPARANDO` (meio-termo
 * razoável entre os 3 sub-estados que essa coluna agrega). Decisões do usuário, `PLAN-0029`.
 */

type OrdersState = { loading: boolean; board: OrdersBoard | null; flow: OrdersFlow | null; error: string | null };

const COLUMN_ORDER: Array<keyof OrdersBoard["columns"]> = ["entraram", "emPreparacao", "atencao", "prontos"];
const COLUMN_LABELS: Record<keyof OrdersBoard["columns"], string> = {
  entraram: "Entraram",
  emPreparacao: "Em preparação",
  atencao: "Atenção",
  prontos: "Prontos",
};
/** Colunas onde o usuário pode arrastar um card pra fora (pegar) ou soltar (largar) — as outras (`entraram`/`atencao`) são fixas. */
const DRAGGABLE_COLUMNS = new Set<keyof OrdersBoard["columns"]>(["emPreparacao", "prontos"]);
/** `fulfillmentStatus` gravado quando um pedido é solto em cada coluna arrastável. */
const FULFILLMENT_STATUS_BY_COLUMN: Record<"emPreparacao" | "prontos", "SEPARANDO" | "DESPACHADO"> = {
  emPreparacao: "SEPARANDO",
  prontos: "DESPACHADO",
};

export function OrdersBoardView() {
  const { scope } = useAdminScope();
  const [state, setState] = useState<OrdersState>({ loading: true, board: null, flow: null, error: null });

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, board: null, flow: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const unitIds = scope.unitId ? [scope.unitId] : undefined;
      const [board, flow] = await Promise.all([
        fetchOrdersBoard({ token, days: scope.days, unitIds }),
        fetchOrdersFlow({ token, days: scope.days, unitIds }),
      ]);
      setState({ loading: false, board, flow, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar a Operação.";
      logger.warn("Falha ao carregar Board Operacional de Pedidos (Admin V2)", { error: message });
      setState((prev) => ({ loading: false, board: prev.board, flow: prev.flow, error: message }));
    }
  }, [scope.days, scope.unitId]);

  useEffect(() => {
    void load();
  }, [load]);

  const [movingOrderId, setMovingOrderId] = useState<number | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  /** `orderId -> coluna atual`, pra saber a origem do card solto (evita PATCH quando solta na própria coluna) e validar que a coluna de destino aceita drop. */
  const columnByOrderId = useMemo(() => {
    const map = new Map<number, keyof OrdersBoard["columns"]>();
    if (!state.board) return map;
    for (const columnKey of COLUMN_ORDER) {
      for (const order of state.board.columns[columnKey].orders) {
        map.set(order.orderId, columnKey);
      }
    }
    return map;
  }, [state.board]);

  const handleCardDrop = useCallback(
    async (cardId: string, columnId: string) => {
      const orderId = Number(cardId);
      const targetColumn = columnId as keyof OrdersBoard["columns"];
      if (!Number.isFinite(orderId) || !DRAGGABLE_COLUMNS.has(targetColumn)) return;
      const originColumn = columnByOrderId.get(orderId);
      if (!originColumn || originColumn === targetColumn) return;

      const token = getToken();
      if (!token) {
        setMoveError("Sessão expirada. Faça login novamente.");
        return;
      }
      setMovingOrderId(orderId);
      setMoveError(null);
      try {
        await updateOrderFulfillmentStatus({
          token,
          orderId,
          fulfillmentStatus: FULFILLMENT_STATUS_BY_COLUMN[targetColumn as "emPreparacao" | "prontos"],
        });
        await load();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao mover o pedido.";
        logger.warn("Falha ao mover pedido no Board Operacional (Admin V2)", { error: message, orderId, targetColumn });
        setMoveError(message);
      } finally {
        setMovingOrderId(null);
      }
    },
    [columnByOrderId, load]
  );

  if (state.loading && !state.board) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando operação…</p>;
  }

  if (state.error && !state.board) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar a Operação.</p>
        <p className="text-sm text-stone-600 dark:text-stone-400">{state.error}</p>
        <div>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!state.board) return null;
  const board = state.board;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-forest">Operação</h1>
        <p className="text-base text-stone-600 dark:text-stone-400">onde os pedidos estão travando · últimos {board.period.days} dia(s)</p>
      </div>

      {moveError && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{moveError}</p>
      )}

      <KanbanDndProvider onCardDrop={(cardId, columnId) => void handleCardDrop(cardId, columnId)}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {COLUMN_ORDER.map((columnKey) => {
            const column = board.columns[columnKey];
            const hiddenCount = column.count - column.orders.length;
            const draggable = DRAGGABLE_COLUMNS.has(columnKey);
            return (
              <div key={columnKey} className="flex flex-col gap-3">
                <KanbanColumnHeader>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-bold uppercase tracking-wider text-forest">
                      {COLUMN_LABELS[columnKey]} · {column.count}
                    </p>
                    <p className="text-sm text-stone-600 dark:text-stone-400">{formatCurrencyBRL(column.totalValue)}</p>
                  </div>
                </KanbanColumnHeader>
                <KanbanDroppableColumn columnId={columnKey} droppable={draggable} className="flex flex-col gap-2 p-1">
                  {column.orders.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-stone-200 p-3 text-sm text-stone-500 dark:text-stone-400">
                      Nenhum pedido nesta coluna.
                    </p>
                  ) : (
                    column.orders.map((card) => (
                      <KanbanDraggableCard
                        key={card.orderId}
                        cardId={String(card.orderId)}
                        draggable={draggable}
                        disabled={movingOrderId === card.orderId}
                      >
                        <OrderCardView card={card} />
                      </KanbanDraggableCard>
                    ))
                  )}
                  {hiddenCount > 0 && (
                    <p className="text-center text-xs text-stone-500 dark:text-stone-400">
                      +{hiddenCount} pedido(s) não mostrados nesta amostra
                    </p>
                  )}
                </KanbanDroppableColumn>
              </div>
            );
          })}
        </div>
      </KanbanDndProvider>

      {state.flow && <OrderFlowTimeline transitions={state.flow.transitions} />}
    </div>
  );
}
