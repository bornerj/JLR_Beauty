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
import type { OperationalOrderCard, OrdersBoard, OrdersFlow } from "./types";
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
 * "Atenção" continua fixa (alerta automático de atraso, nem origem nem destino de drag).
 * Cada etapa só aceita a anterior imediata como origem — nunca pula etapa.
 * - Recebido→Pago: abre `ConfirmPaymentModal` (nome+data de quem confirmou — não existe
 *   integração de meio de pagamento cobrindo esse trecho do fluxo ainda). Fica atrás da flag
 *   `operations.manualPaymentConfirmationEnabled` (`Setting`, default ligada): quando uma
 *   integração real existir, desliga a flag e a coluna "Pago" para de aceitar drop manual.
 * - Pago→Em Separação, Em Separação→Pronto: drag direto, sem modal (mesmo padrão de sempre).
 * - Pronto→Despachado/Entregue: abre `ConfirmDispatchModal` (Entregue confirma direto;
 *   Despachado pede meio + data editável, aceita registro retroativo).
 *
 * Ajuste do usuário (2026-08-18) — cards em "Atenção" (alerta de tempo, não uma 6ª etapa: o
 * pedido continua em algum ponto real das 5 etapas, só demorou além do limiar) ficavam sem
 * jeito de agir. Resolvido reaproveitando o mesmo mecanismo de drag: um card em "Atenção" usa
 * `naturalColumnFor()` (mesma lógica do `columnFor()` do backend, sem a prioridade do alerta)
 * pra descobrir sua coluna real, e só pode ser solto no próximo passo dessa coluna real —
 * mesmos modais, mesma validação de "nunca pula etapa". Uma vez movido, sai do alerta (ou
 * continua lá, com o novo status, se ainda demorar). Caso especial: pedido já `ENVIADO`
 * (coluna real "despachadoEntregue") que ainda não foi confirmado como entregue não tem
 * "próximo passo" — soltar de volta na própria coluna "despachadoEntregue" marca `ENTREGUE`
 * direto (sem modal, não precisa de campo novo). `BLOCKED` (estoque insuficiente) é diferente
 * — não é um problema de tempo, não se resolve avançando etapa — por isso fica sempre fixo
 * (nunca arrastável) e ganha um link fixo pro Admin legado no card (`OrderCardView.tsx`).
 */

type OrdersState = { loading: boolean; board: OrdersBoard | null; flow: OrdersFlow | null; error: string | null };

const COLUMN_ORDER: Array<keyof OrdersBoard["columns"]> = [
  "recebido",
  "pago",
  "emSeparacao",
  "pronto",
  "despachadoEntregue",
  "atencao",
];
const COLUMN_LABELS: Record<keyof OrdersBoard["columns"], string> = {
  recebido: "Receb",
  pago: "Pago",
  emSeparacao: "Em Sep",
  pronto: "Pronto",
  despachadoEntregue: "Desp/Entr",
  atencao: "Atenção",
};
/** Colunas cujos cards podem ser pegos (arrastados) fora de "Atenção" — `despachadoEntregue` é etapa final (não sai de lá por drag normal). Cards de "Atenção" têm sua própria regra (ver `cardDraggable` no render — tudo, menos `BLOCKED`). */
const CARD_DRAGGABLE_COLUMNS = new Set<keyof OrdersBoard["columns"]>(["recebido", "pago", "emSeparacao", "pronto"]);
/** Colunas estruturalmente aptas a receber um drop — `pago` ainda depende da flag de confirmação manual (ver `manualPaymentConfirmationEnabled`). */
const COLUMN_DROPPABLE_BASE = new Set<keyof OrdersBoard["columns"]>(["pago", "emSeparacao", "pronto", "despachadoEntregue"]);
/** Próxima coluna real de cada etapa — nunca pula etapa. Usado tanto pro drag normal quanto
 * pro drag a partir de "Atenção" (que usa a coluna real do card, via `naturalColumnFor()`, no
 * lugar da coluna exibida). "despachadoEntregue" não tem próxima — é tratado como caso
 * especial (marcar `ENTREGUE`) quando a origem real já é ela mesma. */
const NEXT_COLUMN: Partial<Record<keyof OrdersBoard["columns"], "pago" | "emSeparacao" | "pronto" | "despachadoEntregue">> = {
  recebido: "pago",
  pago: "emSeparacao",
  emSeparacao: "pronto",
  pronto: "despachadoEntregue",
};
/** `fulfillmentStatus` gravado nas transições sem modal (sem mudança de payload) — inclui o caso especial de "Atenção" (`despachadoEntregue` já `ENVIADO`, só falta confirmar `ENTREGUE`). */
const FULFILLMENT_STATUS_BY_COLUMN: Record<"emSeparacao" | "pronto" | "despachadoEntregue", "SEPARANDO" | "DESPACHADO" | "ENTREGUE"> = {
  emSeparacao: "SEPARANDO",
  pronto: "DESPACHADO",
  despachadoEntregue: "ENTREGUE",
};

/** Mesma lógica do `columnFor()` (`operational-orders/service.ts`), sem a prioridade do alerta — descobre em qual das 5 etapas reais um card estaria se não estivesse em "Atenção". */
const naturalColumnFor = (card: OperationalOrderCard): keyof OrdersBoard["columns"] => {
  if (card.status === "PENDENTE") return "recebido";
  if (card.status === "PAGO" && card.fulfillmentStatus === "PENDENTE") return "pago";
  if (card.fulfillmentStatus === "DESPACHADO") return "pronto";
  if (card.fulfillmentStatus === "ENVIADO" || card.fulfillmentStatus === "ENTREGUE") return "despachadoEntregue";
  return "emSeparacao";
};

const MANUAL_PAYMENT_CONFIRMATION_SETTING_KEY = "operations.manualPaymentConfirmationEnabled";

type PendingOrder = { orderId: number; publicCode: string | null } | null;

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

  const [movingOrderId, setMovingOrderId] = useState<number | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PendingOrder>(null);
  const [pendingDispatch, setPendingDispatch] = useState<PendingOrder>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  /** `orderId -> coluna exibida` + `orderId -> card` (pra origem do drop, a coluna real de cards em "Atenção", e os modais). */
  const { columnByOrderId, cardByOrderId } = useMemo(() => {
    const columnMap = new Map<number, keyof OrdersBoard["columns"]>();
    const cardMap = new Map<number, OperationalOrderCard>();
    if (state.board) {
      for (const columnKey of COLUMN_ORDER) {
        for (const order of state.board.columns[columnKey].orders) {
          columnMap.set(order.orderId, columnKey);
          cardMap.set(order.orderId, order);
        }
      }
    }
    return { columnByOrderId: columnMap, cardByOrderId: cardMap };
  }, [state.board]);

  const moveOrderDirect = useCallback(
    async (orderId: number, targetColumn: "emSeparacao" | "pronto" | "despachadoEntregue") => {
      const token = getToken();
      if (!token) {
        setMoveError("Sessão expirada. Faça login novamente.");
        return;
      }
      setMovingOrderId(orderId);
      setMoveError(null);
      try {
        await updateOrderFulfillmentStatus({ token, orderId, fulfillmentStatus: FULFILLMENT_STATUS_BY_COLUMN[targetColumn] });
        await load();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao mover o pedido.";
        logger.warn("Falha ao mover pedido no Board Operacional (Admin V2)", { error: message, orderId, targetColumn });
        setMoveError(message);
      } finally {
        setMovingOrderId(null);
      }
    },
    [load]
  );

  const handleCardDrop = useCallback(
    (cardId: string, columnId: string) => {
      const orderId = Number(cardId);
      const targetColumn = columnId as keyof OrdersBoard["columns"];
      if (!Number.isFinite(orderId) || !COLUMN_DROPPABLE_BASE.has(targetColumn)) return;
      if (targetColumn === "pago" && !manualPaymentConfirmationEnabled) return;

      const originColumn = columnByOrderId.get(orderId);
      const card = cardByOrderId.get(orderId);
      if (!originColumn || !card || originColumn === targetColumn) return;

      // Card em "Atenção" usa a coluna real dele (não a exibida) pra decidir se o drop é válido.
      const effectiveOrigin = originColumn === "atencao" ? naturalColumnFor(card) : originColumn;

      // Caso especial: pedido já `ENVIADO` (etapa real já é "despachadoEntregue") só flagueado em
      // "Atenção" por demora — soltar de volta na própria coluna marca `ENTREGUE`, sem modal.
      if (effectiveOrigin === "despachadoEntregue" && targetColumn === "despachadoEntregue") {
        void moveOrderDirect(orderId, "despachadoEntregue");
        return;
      }
      if (NEXT_COLUMN[effectiveOrigin] !== targetColumn) return;

      const publicCode = card.publicCode;
      if (targetColumn === "pago") {
        setPendingPayment({ orderId, publicCode });
        return;
      }
      if (targetColumn === "despachadoEntregue") {
        setPendingDispatch({ orderId, publicCode });
        return;
      }
      void moveOrderDirect(orderId, targetColumn as "emSeparacao" | "pronto");
    },
    [columnByOrderId, cardByOrderId, manualPaymentConfirmationEnabled, moveOrderDirect]
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

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-forest">Operação</h1>
        <p className="text-base text-stone-600 dark:text-stone-400">onde os pedidos estão travando · últimos {board.period.days} dia(s)</p>
      </div>

      {moveError && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{moveError}</p>
      )}

      <KanbanDndProvider onCardDrop={handleCardDrop}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                      // "Atenção" não tem regra fixa por coluna — todo card é arrastável, exceto
                      // `BLOCKED` (estoque insuficiente não se resolve avançando etapa).
                      const cardDraggable =
                        columnKey === "atencao" ? card.operationalState !== "BLOCKED" : CARD_DRAGGABLE_COLUMNS.has(columnKey);
                      return (
                        <KanbanDraggableCard
                          key={card.orderId}
                          cardId={String(card.orderId)}
                          draggable={cardDraggable}
                          disabled={movingOrderId === card.orderId}
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
          publicCode={pendingPayment.publicCode}
          submitting={modalSubmitting}
          error={modalError}
          onCancel={cancelPendingPayment}
          onConfirm={(args) => void confirmPendingPayment(args)}
        />
      )}

      {pendingDispatch && (
        <ConfirmDispatchModal
          publicCode={pendingDispatch.publicCode}
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
