import { Prisma, type FulfillmentStatus, type OrderStatus } from "@prisma/client";

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

export const restockOrderProducts = async (
  tx: Prisma.TransactionClient,
  orderId: number
): Promise<void> => {
  const productItems = await tx.orderItem.findMany({
    where: { orderId, productId: { not: null } },
    select: { productId: true, quantity: true },
  });
  if (!productItems.length) return;
  await Promise.all(
    productItems.map((item) =>
      tx.product.update({
        where: { id: item.productId as number },
        data: { stock: { increment: item.quantity } },
      })
    )
  );
};

export const cancelOrderWithOptionalRestock = async (
  tx: Prisma.TransactionClient,
  params: {
    orderId: number;
    source: string;
    note?: string;
    forceRestock?: boolean;
  }
) => {
  const existing = await tx.order.findUnique({
    where: { id: params.orderId },
    select: { id: true, status: true },
  });
  if (!existing) return null;

  if (existing.status === "CANCELADO") return existing;

  const canRestock =
    params.forceRestock === true ||
    (existing.status !== "ENVIADO" && existing.status !== "ENTREGUE");
  if (canRestock) {
    await restockOrderProducts(tx, existing.id);
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
    select: { id: true, status: true, fulfillmentStatus: true },
  });
  if (!existing) return null;

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

  return updated;
};
