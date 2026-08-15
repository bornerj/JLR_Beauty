import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { useAdminScope } from "../../shell/adminScope";
import { fetchOrdersBoard, fetchOrdersFlow } from "../../shared/api";
import { formatCurrencyBRL } from "../../shared/format";
import type { OrdersBoard, OrdersFlow } from "./types";
import { OrderCardView } from "./components/OrderCardView";
import { OrderFlowTimeline } from "./components/OrderFlowTimeline";

/**
 * Admin V2 (PLAN-0022, Onda 3) — Board Operacional de Pedidos (RETROFIT-004).
 * Pergunta que a tela fecha: "onde os pedidos estão travando?"
 */

type OrdersState = { loading: boolean; board: OrdersBoard | null; flow: OrdersFlow | null; error: string | null };

const COLUMN_ORDER: Array<keyof OrdersBoard["columns"]> = ["entraram", "emPreparacao", "atencao", "prontos"];
const COLUMN_LABELS: Record<keyof OrdersBoard["columns"], string> = {
  entraram: "Entraram",
  emPreparacao: "Em preparação",
  atencao: "Atenção",
  prontos: "Prontos",
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {COLUMN_ORDER.map((columnKey) => {
          const column = board.columns[columnKey];
          const hiddenCount = column.count - column.orders.length;
          return (
            <div key={columnKey} className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  {COLUMN_LABELS[columnKey]} · {column.count}
                </p>
                <p className="text-sm text-stone-500 dark:text-stone-400">{formatCurrencyBRL(column.totalValue)}</p>
              </div>
              <div className="flex flex-col gap-2">
                {column.orders.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-stone-200 p-3 text-sm text-stone-500 dark:text-stone-400">
                    Nenhum pedido nesta coluna.
                  </p>
                ) : (
                  column.orders.map((card) => <OrderCardView key={card.orderId} card={card} />)
                )}
                {hiddenCount > 0 && (
                  <p className="text-center text-xs text-stone-500 dark:text-stone-400">
                    +{hiddenCount} pedido(s) não mostrados nesta amostra
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {state.flow && <OrderFlowTimeline transitions={state.flow.transitions} />}
    </div>
  );
}
