import { Prisma, type SalesChannel } from "@prisma/client";
import prisma from "./prisma";
import { logger } from "../utils/logger";
import { applyStockMovement, lockProductStockRow, StockError } from "./stockLedger";

/**
 * Reserva de estoque com TTL (PLAN-0020).
 *
 * Camadas: REAL (ProductStock.stock) / RESERVADO (ProductStock.reserved) /
 * DISPONÍVEL (stock - reserved).
 * - Reservar: prende DISPONÍVEL (reserved += qtd). NÃO gera StockMovement.
 * - Confirmar: solta a reserva e dá baixa REAL (SAIDA_VENDA no ledger).
 *   Se a reserva expirou, re-checa DISPONÍVEL na hora (decisão PLAN-0020).
 * - Liberar/expirar: devolve o DISPONÍVEL (reserved -= qtd), sem movimento real.
 */

const DEFAULT_TTL_MINUTES = 20;
const DEFAULT_SWEEP_INTERVAL_MS = 60_000;

export const getReservationTtlMinutes = (): number => {
  const parsed = Number(process.env.RESERVATION_TTL_MINUTES);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_TTL_MINUTES;
  return Math.floor(parsed);
};

export type ReserveStockInput = {
  productId: number;
  unitId: number;
  quantity: number;
  channel: SalesChannel;
  orderId?: number | null;
  userId?: number | null;
};

/** Cria uma reserva ACTIVE prendendo o DISPONÍVEL. Chamar dentro de transação. */
export const reserveStock = async (
  tx: Prisma.TransactionClient,
  input: ReserveStockInput
): Promise<{ reservationId: number; expiresAt: Date }> => {
  const row = await lockProductStockRow(tx, input.productId, input.unitId);
  const available = row.stock - row.reserved;
  if (available < input.quantity) {
    throw new StockError(
      "insufficient_available",
      `disponivel insuficiente (disponivel ${available}, solicitado ${input.quantity})`
    );
  }
  const expiresAt = new Date(Date.now() + getReservationTtlMinutes() * 60_000);
  await tx.productStock.update({
    where: { id: row.id },
    data: { reserved: row.reserved + input.quantity },
  });
  const reservation = await tx.stockReservation.create({
    data: {
      productId: input.productId,
      unitId: input.unitId,
      quantity: input.quantity,
      status: "ACTIVE",
      channel: input.channel,
      expiresAt,
      orderId: input.orderId || null,
      createdByUserId: input.userId || null,
    },
    select: { id: true },
  });
  return { reservationId: reservation.id, expiresAt };
};

/**
 * Solta uma reserva (RELEASED/EXPIRED): reserved -= qtd, sem movimento real.
 * Idempotente — só age se a reserva ainda estiver ACTIVE.
 */
export const releaseReservation = async (
  tx: Prisma.TransactionClient,
  reservationId: number,
  outcome: "RELEASED" | "EXPIRED"
): Promise<boolean> => {
  const reservation = await tx.stockReservation.findUnique({
    where: { id: reservationId },
    select: { id: true, status: true, productId: true, unitId: true, quantity: true },
  });
  if (!reservation || reservation.status !== "ACTIVE") return false;

  const row = await lockProductStockRow(tx, reservation.productId, reservation.unitId);
  await tx.productStock.update({
    where: { id: row.id },
    data: { reserved: Math.max(0, row.reserved - reservation.quantity) },
  });
  await tx.stockReservation.update({
    where: { id: reservation.id },
    data: { status: outcome, releasedAt: new Date() },
  });
  return true;
};

export type ConfirmResult =
  | { ok: true }
  | { ok: false; code: "insufficient_available" | "not_found" | "already_final"; detail: string };

/**
 * Confirma uma reserva: baixa REAL (SAIDA_VENDA) + solta o reservado.
 * Reserva expirada: re-checa DISPONÍVEL e confirma se ainda houver estoque
 * (decisão PLAN-0020 — "re-checar disponibilidade"); sem estoque → falha tratada.
 */
export const confirmReservation = async (
  tx: Prisma.TransactionClient,
  reservationId: number,
  params?: { userId?: number | null; unitCost?: number | null }
): Promise<ConfirmResult> => {
  const reservation = await tx.stockReservation.findUnique({
    where: { id: reservationId },
    select: {
      id: true,
      status: true,
      productId: true,
      unitId: true,
      quantity: true,
      orderId: true,
      expiresAt: true,
    },
  });
  if (!reservation) return { ok: false, code: "not_found", detail: "reserva nao encontrada" };
  if (reservation.status === "CONFIRMED") return { ok: true };
  if (reservation.status === "RELEASED") {
    return { ok: false, code: "already_final", detail: "reserva ja liberada" };
  }

  const row = await lockProductStockRow(tx, reservation.productId, reservation.unitId);
  const stillActive = reservation.status === "ACTIVE";

  if (stillActive) {
    // Solta o reservado e baixa o real na mesma transação travada.
    await tx.productStock.update({
      where: { id: row.id },
      data: { reserved: Math.max(0, row.reserved - reservation.quantity) },
    });
  } else {
    // EXPIRED (sweeper já devolveu o disponível): re-checa disponibilidade agora.
    const available = row.stock - row.reserved;
    if (available < reservation.quantity) {
      return {
        ok: false,
        code: "insufficient_available",
        detail: `disponivel insuficiente na confirmacao pos-expiracao (disponivel ${available}, solicitado ${reservation.quantity})`,
      };
    }
  }

  await applyStockMovement(tx, {
    productId: reservation.productId,
    unitId: reservation.unitId,
    type: "SAIDA_VENDA",
    quantity: reservation.quantity,
    refOrderId: reservation.orderId,
    userId: params?.userId ?? null,
    unitCost: params?.unitCost ?? null,
    reason: stillActive ? "venda" : "venda (reserva expirada, re-checada)",
  });

  await tx.stockReservation.update({
    where: { id: reservation.id },
    data: { status: "CONFIRMED", confirmedAt: new Date() },
  });
  return { ok: true };
};

/** Libera todas as reservas ACTIVE de um pedido (cancelamento/expiração de checkout). */
export const releaseOrderReservations = async (
  tx: Prisma.TransactionClient,
  orderId: number
): Promise<number> => {
  const reservations = await tx.stockReservation.findMany({
    where: { orderId, status: "ACTIVE" },
    select: { id: true },
  });
  let released = 0;
  for (const reservation of reservations) {
    if (await releaseReservation(tx, reservation.id, "RELEASED")) released += 1;
  }
  return released;
};

/**
 * Confirma todas as reservas de um pedido (pagamento aprovado).
 * Retorna itens que falharam na re-checagem pós-expiração para tratamento.
 */
export const confirmOrderReservations = async (
  tx: Prisma.TransactionClient,
  orderId: number,
  params?: { userId?: number | null }
): Promise<{ confirmed: number; failures: Array<{ productId: number; detail: string }> }> => {
  const reservations = await tx.stockReservation.findMany({
    where: { orderId, status: { in: ["ACTIVE", "EXPIRED"] } },
    select: { id: true, productId: true },
  });
  let confirmed = 0;
  const failures: Array<{ productId: number; detail: string }> = [];
  for (const reservation of reservations) {
    const product = await tx.product.findUnique({
      where: { id: reservation.productId },
      select: { costPrice: true },
    });
    const result = await confirmReservation(tx, reservation.id, {
      userId: params?.userId,
      unitCost: product?.costPrice ? Number(product.costPrice) : null,
    });
    if (result.ok) {
      confirmed += 1;
    } else {
      failures.push({ productId: reservation.productId, detail: result.detail });
    }
  }
  return { confirmed, failures };
};

/** Job varredor: expira reservas ACTIVE vencidas (idempotente, resiliente a restart). */
export const releaseExpiredReservationsOnce = async (): Promise<number> => {
  const expired = await prisma.stockReservation.findMany({
    where: { status: "ACTIVE", expiresAt: { lt: new Date() } },
    select: { id: true },
    take: 200,
  });
  let released = 0;
  for (const reservation of expired) {
    try {
      await prisma.$transaction(async (tx) => {
        if (await releaseReservation(tx, reservation.id, "EXPIRED")) released += 1;
      });
    } catch (error) {
      logger.error("Falha ao expirar reserva de estoque", {
        reservationId: reservation.id,
        error: error instanceof Error ? error.message : "erro inesperado",
      });
    }
  }
  if (released > 0) {
    logger.info("Reservas de estoque expiradas liberadas", { released });
  }
  return released;
};

export const startReservationSweeper = (): void => {
  const parsed = Number(process.env.RESERVATION_SWEEP_INTERVAL_MS);
  const intervalMs =
    Number.isFinite(parsed) && parsed >= 5_000 ? Math.floor(parsed) : DEFAULT_SWEEP_INTERVAL_MS;

  logger.info("Stock reservation sweeper initialized", {
    ttlMinutes: getReservationTtlMinutes(),
    intervalMs,
  });

  void releaseExpiredReservationsOnce().catch((error) => {
    logger.error("Reservation sweep failed on startup", {
      error: error instanceof Error ? error.message : "erro inesperado",
    });
  });

  setInterval(() => {
    void releaseExpiredReservationsOnce().catch((error) => {
      logger.error("Reservation sweep failed", {
        error: error instanceof Error ? error.message : "erro inesperado",
      });
    });
  }, intervalMs);
};
