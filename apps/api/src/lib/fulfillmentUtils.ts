import { Prisma, type FulfillmentStatus, type OrderStatus } from "@prisma/client";
import { applyStockMovement } from "./stockLedger";
import { releaseOrderReservations, confirmOrderReservations } from "./stockReservation";
import { syncCustomerFromContact } from "./customerSync";
import { logger } from "../utils/logger";

export const getNextFulfillmentStatus = (
  current: FulfillmentStatus
): FulfillmentStatus | null => {
  if (current === "PENDENTE") return "SEPARANDO";
  if (current === "SEPARANDO") return "EMBALADO";
  if (current === "EMBALADO") return "DESPACHADO";
  if (current === "DESPACHADO") return "ENVIADO";
  if (current === "ENVIADO") return "ENTREGUE";
  return null;
};

export const appendOrderStatusHistory = async (
  tx: Prisma.TransactionClient,
  params: {
    orderId: number;
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    source: string;
    note?: string;
  }
): Promise<void> => {
  if (params.fromStatus === params.toStatus) return;
  await tx.orderStatusHistory.create({
    data: {
      orderId: params.orderId,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      source: params.source,
      note: params.note,
    },
  });
};

/** Unidade de fallback para pedidos antigos sem unitId: a Loja Online. */
const resolveOrderUnitId = async (
  tx: Prisma.TransactionClient,
  orderUnitId: number | null
): Promise<number | null> => {
  if (orderUnitId) return orderUnitId;
  const online = await tx.unit.findFirst({
    where: { isOnline: true },
    orderBy: { id: "asc" },
    select: { id: true },
  });
  return online?.id ?? null;
};

/**
 * Estorno de estoque de um pedido cuja baixa REAL já aconteceu (pedido pago):
 * gera DEVOLUCAO no ledger, por unidade do pedido (PLAN-0020).
 */
export const restockOrderProducts = async (
  tx: Prisma.TransactionClient,
  orderId: number,
  params?: { source?: string; userId?: number | null }
): Promise<void> => {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { unitId: true },
  });
  const unitId = await resolveOrderUnitId(tx, order?.unitId ?? null);
  if (!unitId) return;

  const productItems = await tx.orderItem.findMany({
    where: { orderId, productId: { not: null } },
    select: { productId: true, quantity: true },
  });
  for (const item of productItems) {
    await applyStockMovement(tx, {
      productId: item.productId as number,
      unitId,
      type: "DEVOLUCAO",
      quantity: item.quantity,
      refOrderId: orderId,
      userId: params?.userId ?? null,
      reason: params?.source ? `estorno (${params.source})` : "estorno de pedido",
    });
  }
};

export const cancelOrderWithOptionalRestock = async (
  tx: Prisma.TransactionClient,
  params: {
    orderId: number;
    source: string;
    note?: string;
    forceRestock?: boolean;
    userId?: number | null;
  }
) => {
  const existing = await tx.order.findUnique({
    where: { id: params.orderId },
    select: { id: true, status: true },
  });
  if (!existing) return null;

  if (existing.status === "CANCELADO") return existing;

  // Reservas ativas do pedido (estoque ainda não baixado) sempre são liberadas.
  await releaseOrderReservations(tx, existing.id);

  // Baixa REAL só acontece a partir de PAGO — devolução via ledger apenas nesses casos.
  const stockWasDebited = existing.status !== "PENDENTE";
  const canRestock =
    stockWasDebited &&
    (params.forceRestock === true ||
      (existing.status !== "ENVIADO" && existing.status !== "ENTREGUE"));
  if (canRestock) {
    await restockOrderProducts(tx, existing.id, {
      source: params.source,
      userId: params.userId,
    });
  }

  const updated = await tx.order.update({
    where: { id: existing.id },
    data: {
      status: "CANCELADO",
      fulfillmentStatus: "CANCELADO",
    },
  });

  await appendOrderStatusHistory(tx, {
    orderId: existing.id,
    fromStatus: existing.status,
    toStatus: "CANCELADO",
    source: params.source,
    note: params.note,
  });

  return updated;
};

export const markOrderAsPaid = async (
  tx: Prisma.TransactionClient,
  params: {
    orderId: number;
    source: string;
    note?: string;
  }
) => {
  const existing = await tx.order.findUnique({
    where: { id: params.orderId },
    select: { id: true, status: true, fulfillmentStatus: true, fulfillmentNotes: true },
  });
  if (!existing) return null;

  // PLAN-0020: a baixa REAL do estoque acontece na confirmação do pagamento —
  // confirma as reservas do pedido (re-checa disponibilidade se alguma expirou).
  // Venda de balcão (baixa direta, sem reservas) é no-op aqui.
  const reservationResult = await confirmOrderReservations(tx, existing.id);
  if (reservationResult.failures.length) {
    const detail = reservationResult.failures
      .map((failure) => `produto ${failure.productId}: ${failure.detail}`)
      .join("; ");
    logger.warn("Pagamento confirmado com estoque indisponivel na re-checagem", {
      orderId: existing.id,
      failures: reservationResult.failures,
    });
    const notePrefix = existing.fulfillmentNotes ? `${existing.fulfillmentNotes}\n` : "";
    await tx.order.update({
      where: { id: existing.id },
      data: {
        fulfillmentNotes: `${notePrefix}[ESTOQUE] indisponivel na confirmacao pos-expiracao — resolver manualmente (estorno ou reposicao): ${detail}`,
      },
    });
  }

  const fulfillmentStatus: FulfillmentStatus =
    existing.fulfillmentStatus === "CANCELADO" ? "PENDENTE" : existing.fulfillmentStatus;
  const updated = await tx.order.update({
    where: { id: existing.id },
    data: {
      status: "PAGO",
      paymentConfirmedAt: new Date(),
      fulfillmentStatus,
    },
  });

  await appendOrderStatusHistory(tx, {
    orderId: existing.id,
    fromStatus: existing.status,
    toStatus: "PAGO",
    source: params.source,
    note: params.note,
  });

  // PLAN-0027 (Item 1): pedido pago confirma um cliente real — materializa em Customer.
  await syncCustomerFromContact(tx, {
    name: updated.customerName,
    phone: updated.customerPhone,
    email: updated.customerEmail,
  });

  return updated;
};
