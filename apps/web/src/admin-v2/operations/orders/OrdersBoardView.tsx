import { useCallback, useEffect, useMemo, useState } from "react";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { useAdminScope } from "../../shell/adminScope";
import {
  confirmOrderPayment,
  fetchOrdersBoard,
  fetchOrdersFlow,
  fetchSetting,
  updateOrderFulfillmentStatus,
} from "../../shared/api";
import { formatCurrencyBRL, formatDateInputBR } from "../../shared/format";
import { KanbanColumnHeader } from "../../shell/KanbanColumnHeader";
import { KanbanDndProvider, KanbanDroppableColumn, KanbanDraggableCard } from "../../shell/kanban/KanbanDndBoard";
import type { OrdersBoard, OrdersFlow } from "./types";
import { OrderCardView } from "./components/OrderCardView";
import { OrderFlowTimeline } from "./components/OrderFlowTimeline";
import { ConfirmPaymentModal } from "./components/ConfirmPaymentModal";
import { ConfirmDispatchModal, type DispatchOutcome } from "./components/ConfirmDispatchModal";

/**
 * Admin V2 (PLAN-0022, Onda 3) — Board Operacional de Pedidos (RETROFIT-004).
 * Pergunta que a tela fecha: "onde os pedidos estão travando?"
 *
 * PLAN-0030 — fluxo real de 5 etapas sequenciais (Recebido → Pago → Em Separação → Pronto →
 * Despachado/Entregue), substituindo o desenho anterior do PLAN-0029 (achado ao vivo: mover
 * fulfillmentStatus sozinho não tirava o card de "Entraram", porque a coluna era decidida por
 * `Order.status`, não por fulfillment — ver `columnFor()`, `operational-orders/service.ts`).
 * Cada etapa só aceita a anterior imediata como origem — nunca pula etapa.
 * - Recebido→Pago: abre `ConfirmPaymentModal` (nome+data de quem confirmou — não existe
 *   integração de meio de pagamento cobrindo esse trecho do fluxo ainda). Fica atrás da flag
 *   `operations.manualPaymentConfirmationEnabled` (`Setting`, default ligada): quando uma
 *   integração real existir, desliga a flag e a coluna "Pago" para de aceitar drop manual.
 * - Pago→Em Separação, Em Separação→Pronto: drag direto, sem modal (mesmo padrão de sempre).
 * - Pronto→Despachado/Entregue: abre `ConfirmDispatchModal` (Entregue confirma direto;
 *   Despachado pede meio + data editável, aceita registro retroativo).
 * - Despachado/Entregue: um pedido já `ENVIADO` (falta só confirmar entrega) continua
 *   arrastável — soltar de volta na própria coluna marca `ENTREGUE` direto, sem modal.
 *
 * "Atenção" (2026-08-18, achado do usuário) — chegou a ser uma 6ª coluna exclusiva (mesma
 * sessão, mais cedo), mas o usuário reportou que os pedidos pareciam "nunca mover": o alerta
 * tinha prioridade sobre a etapa real, então um card avançava de verdade (confirmado no
 * banco) e mesmo assim reaparecia no mesmo lugar, porque continuava flagueado. Resolvido
 * removendo a exclusividade: todo pedido sempre aparece na sua coluna real (`columnFor()`,
 * backend), e os flagueados (`operationalState !== "NORMAL"`) só ganham um aviso inline no
 * card (`OrderCardView.tsx`, já existia) + entram no resumo `board.columns.atencao`
 * (agregado, não mais uma coluna do kanban) mostrado no banner abaixo. `BLOCKED` (estoque
 * insuficiente) continua sem drag — não se resolve avançando etapa — e mantém o link "Ver no
 * Admin →" no card.
 */

type OrdersState = { loading: boolean; board: OrdersBoard | null; flow: OrdersFlow | null; error: string | null };

type RealColumn = Exclude<keyof OrdersBoard["columns"], "atencao">;

const COLUMN_ORDER: RealColumn[] = ["recebido", "pago", "emSeparacao", "pronto", "despachadoEntregue"];
const COLUMN_LABELS: Record<RealColumn, string> = {
  recebido: "Receb",
  pago: "Pago",
  emSeparacao: "Em Separação",
  pronto: "Pronto",
  despachadoEntregue: "Desp/Entr",
};
/** Colunas cujos cards podem ser pegos (arrastados) sempre — `despachadoEntregue` tem regra própria (só card `ENVIADO`, ver `cardDraggable` no render). */
const CARD_DRAGGABLE_COLUMNS = new Set<RealColumn>(["recebido", "pago", "emSeparacao", "pronto"]);
/** Colunas aptas a receber um drop — `pago` ainda depende da flag de confirmação manual (ver `manualPaymentConfirmationEnabled`). */
const COLUMN_DROPPABLE_BASE = new Set<RealColumn>(["pago", "emSeparacao", "pronto", "despachadoEntregue"]);
/** Próxima coluna real de cada etapa — nunca pula etapa. "despachadoEntregue" não tem próxima (etapa final; ver caso especial de confirmar `ENTREGUE` no `handleCardDrop`). */
const NEXT_COLUMN: Partial<Record<RealColumn, "pago" | "emSeparacao" | "pronto" | "despachadoEntregue">> = {
  recebido: "pago",
  pago: "emSeparacao",
  emSeparacao: "pronto",
  pronto: "despachadoEntregue",
};
/** `fulfillmentStatus` gravado nas transições sem modal (sem mudança de payload) — inclui confirmar `ENTREGUE` de um pedido já `ENVIADO`. */
const FULFILLMENT_STATUS_BY_COLUMN: Record<"emSeparacao" | "pronto" | "despachadoEntregue", "SEPARANDO" | "DESPACHADO" | "ENTREGUE"> = {
  emSeparacao: "SEPARANDO",
  pronto: "DESPACHADO",
  despachadoEntregue: "ENTREGUE",
};

const MANUAL_PAYMENT_CONFIRMATION_SETTING_KEY = "operations.manualPaymentConfirmationEnabled";

type PendingOrder = { orderId: number } | null;

export function OrdersBoardView() {
  const { scope } = useAdminScope();
  const [state, setState] = useState<OrdersState>({ loading: true, board: null, flow: null, error: null });
  const [manualPaymentConfirmationEnabled, setManualPaymentConfirmationEnabled] = useState(true);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, board: null, flow: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const unitIds = scope.unitId ? [scope.unitId] : undefined;
      const [board, flow, flagSetting] = await Promise.all([
        fetchOrdersBoard({ token, days: scope.days, unitIds }),
        fetchOrdersFlow({ token, days: scope.days, unitIds }),
        fetchSetting({ token, key: MANUAL_PAYMENT_CONFIRMATION_SETTING_KEY }),
      ]);
      setState({ loading: false, board, flow, error: null });
      setManualPaymentConfirmationEnabled(flagSetting?.value !== false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar a Operação.";
      logger.warn("Falha ao carregar Board Operacional de Pedidos (Admin V2)", { error: message });
      setState((prev) => ({ loading: false, board: prev.board, flow: prev.flow, error: message }));
    }
  }, [scope.days, scope.unitId]);

  useEffect(() => {
    void load();
  }, [load]);

  // ERR-0080: Set em vez de um único id — um id global permitia que arrastar um 2º
  // card destravasse o 1º antes do PATCH dele terminar (condição de corrida).
  const [movingOrderIds, setMovingOrderIds] = useState<Set<number>>(() => new Set());
  const [moveError, setMoveError] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PendingOrder>(null);
  const [pendingDispatch, setPendingDispatch] = useState<PendingOrder>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  /** `orderId -> coluna real` (pra saber a origem do drop). */
  const columnByOrderId = useMemo(() => {
    const columnMap = new Map<number, RealColumn>();
    if (state.board) {
      for (const columnKey of COLUMN_ORDER) {
        for (const order of state.board.columns[columnKey].orders) {
          columnMap.set(order.orderId, columnKey);
        }
      }
    }
    return columnMap;
  }, [state.board]);

  const moveOrderDirect = useCallback(
    async (orderId: number, targetColumn: "emSeparacao" | "pronto" | "despachadoEntregue") => {
      const token = getToken();
      if (!token) {
        setMoveError("Sessão expirada. Faça login novamente.");
        return;
      }
      setMovingOrderIds((current) => new Set(current).add(orderId));
      setMoveError(null);
      try {
        await updateOrderFulfillmentStatus({ token, orderId, fulfillmentStatus: FULFILLMENT_STATUS_BY_COLUMN[targetColumn] });
        await load();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao mover o pedido.";
        logger.warn("Falha ao mover pedido no Board Operacional (Admin V2)", { error: message, orderId, targetColumn });
        setMoveError(message);
      } finally {
        setMovingOrderIds((current) => {
          const next = new Set(current);
          next.delete(orderId);
          return next;
        });
      }
    },
    [load]
  );

  const handleCardDrop = useCallback(
    (cardId: string, columnId: string) => {
      const orderId = Number(cardId);
      const targetColumn = columnId as RealColumn;
      if (!Number.isFinite(orderId) || !COLUMN_DROPPABLE_BASE.has(targetColumn)) return;
      if (targetColumn === "pago" && !manualPaymentConfirmationEnabled) return;

      const originColumn = columnByOrderId.get(orderId);
      if (!originColumn) return;

      // Pedido já `ENVIADO` (etapa final "despachadoEntregue") só falta confirmar entrega —
      // soltar de volta na própria coluna marca `ENTREGUE`, sem modal.
      if (originColumn === "despachadoEntregue" && targetColumn === "despachadoEntregue") {
        void moveOrderDirect(orderId, "despachadoEntregue");
        return;
      }
      if (originColumn === targetColumn) return;
      if (NEXT_COLUMN[originColumn] !== targetColumn) return;

      if (targetColumn === "pago") {
        setPendingPayment({ orderId });
        return;
      }
      if (targetColumn === "despachadoEntregue") {
        setPendingDispatch({ orderId });
        return;
      }
      void moveOrderDirect(orderId, targetColumn as "emSeparacao" | "pronto");
    },
    [columnByOrderId, manualPaymentConfirmationEnabled, moveOrderDirect]
  );

  const cancelPendingPayment = useCallback(() => {
    setPendingPayment(null);
    setModalError(null);
  }, []);

  const confirmPendingPayment = useCallback(
    async (args: { confirmedByName: string; confirmedAt: string }) => {
      if (!pendingPayment) return;
      const token = getToken();
      if (!token) {
        setModalError("Sessão expirada. Faça login novamente.");
        return;
      }
      setModalSubmitting(true);
      setModalError(null);
      try {
        const note = `Pagamento confirmado manualmente por ${args.confirmedByName} em ${formatDateInputBR(args.confirmedAt)}`;
        await confirmOrderPayment({ token, orderId: pendingPayment.orderId, note });
        await load();
        setPendingPayment(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao confirmar o pagamento.";
        logger.warn("Falha ao confirmar pagamento manual (Admin V2)", { error: message, orderId: pendingPayment.orderId });
        setModalError(message);
      } finally {
        setModalSubmitting(false);
      }
    },
    [pendingPayment, load]
  );

  const cancelPendingDispatch = useCallback(() => {
    setPendingDispatch(null);
    setModalError(null);
  }, []);

  const confirmPendingDispatch = useCallback(
    async (outcome: DispatchOutcome) => {
      if (!pendingDispatch) return;
      const token = getToken();
      if (!token) {
        setModalError("Sessão expirada. Faça login novamente.");
        return;
      }
      setModalSubmitting(true);
      setModalError(null);
      try {
        if (outcome.kind === "ENTREGUE") {
          await updateOrderFulfillmentStatus({ token, orderId: pendingDispatch.orderId, fulfillmentStatus: "ENTREGUE" });
        } else {
          await updateOrderFulfillmentStatus({
            token,
            orderId: pendingDispatch.orderId,
            fulfillmentStatus: "ENVIADO",
            shipmentCarrier: outcome.carrier,
            shippedAt: new Date(outcome.date).toISOString(),
          });
        }
        await load();
        setPendingDispatch(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao registrar o despacho/entrega.";
        logger.warn("Falha ao confirmar despacho/entrega (Admin V2)", { error: message, orderId: pendingDispatch.orderId });
        setModalError(message);
      } finally {
        setModalSubmitting(false);
      }
    },
    [pendingDispatch, load]
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
  const attention = board.columns.atencao;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-forest">Operação</h1>
        <p className="text-base text-stone-600 dark:text-stone-400">onde os pedidos estão travando · últimos {board.period.days} dia(s)</p>
      </div>

      {attention.count > 0 && (
        <p className="rounded-lg border border-state-attention/40 bg-state-attention/10 px-3 py-2 text-sm font-semibold text-state-attention">
          ⚠ {attention.count} pedido(s) precisam de atenção · {formatCurrencyBRL(attention.totalValue)} em jogo — o motivo aparece
          em cada card abaixo.
        </p>
      )}

      {moveError && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{moveError}</p>
      )}

      <KanbanDndProvider onCardDrop={handleCardDrop}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {COLUMN_ORDER.map((columnKey) => {
            const column = board.columns[columnKey];
            const hiddenCount = column.count - column.orders.length;
            const columnDroppable =
              COLUMN_DROPPABLE_BASE.has(columnKey) && (columnKey !== "pago" || manualPaymentConfirmationEnabled);
            return (
              <div key={columnKey} className="flex flex-col gap-3">
                <KanbanColumnHeader>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-bold uppercase tracking-wider text-forest">
                      {COLUMN_LABELS[columnKey]} · {column.count}
                    </p>
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-400">{formatCurrencyBRL(column.totalValue)}</p>
                </KanbanColumnHeader>
                <KanbanDroppableColumn columnId={columnKey} droppable={columnDroppable} className="flex flex-col gap-2 p-1">
                  {column.orders.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-stone-200 p-3 text-sm text-stone-500 dark:text-stone-400">
                      Nenhum pedido nesta coluna.
                    </p>
                  ) : (
                    column.orders.map((card) => {
                      // `BLOCKED` (estoque insuficiente) nunca arrasta — não se resolve avançando
                      // etapa. Em "despachadoEntregue" só o pedido já `ENVIADO` arrasta (confirma
                      // entrega); os demais são etapa final.
                      const cardDraggable =
                        card.operationalState === "BLOCKED"
                          ? false
                          : columnKey === "despachadoEntregue"
                            ? card.fulfillmentStatus === "ENVIADO"
                            : CARD_DRAGGABLE_COLUMNS.has(columnKey);
                      return (
                        <KanbanDraggableCard
                          key={card.orderId}
                          cardId={String(card.orderId)}
                          draggable={cardDraggable}
                          disabled={movingOrderIds.has(card.orderId)}
                        >
                          <OrderCardView card={card} />
                        </KanbanDraggableCard>
                      );
                    })
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

      {pendingPayment && (
        <ConfirmPaymentModal
          orderId={pendingPayment.orderId}
          submitting={modalSubmitting}
          error={modalError}
          onCancel={cancelPendingPayment}
          onConfirm={(args) => void confirmPendingPayment(args)}
        />
      )}

      {pendingDispatch && (
        <ConfirmDispatchModal
          orderId={pendingDispatch.orderId}
          submitting={modalSubmitting}
          error={modalError}
          onCancel={cancelPendingDispatch}
          onConfirm={(outcome) => void confirmPendingDispatch(outcome)}
        />
      )}

      {state.flow && <OrderFlowTimeline transitions={state.flow.transitions} />}
    </div>
  );
}
