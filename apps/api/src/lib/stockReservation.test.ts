import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "@prisma/client";
import { confirmReservation, releaseReservation, reserveStock } from "./stockReservation";
import { FakeStockDb } from "./testHelpers/fakeStockTx";

const PRODUCT_ID = 1;
const UNIT_ID = 1;

function setup(initialStock: number, initialReserved = 0) {
  const db = new FakeStockDb();
  db.seedProductStock({ productId: PRODUCT_ID, unitId: UNIT_ID, stock: initialStock, reserved: initialReserved });
  db.seedProduct({ id: PRODUCT_ID, stock: initialStock, costPrice: null });
  return { db, tx: db.tx as unknown as Prisma.TransactionClient };
}

test("reserveStock: prende o disponível sem tocar no REAL", async () => {
  const { db, tx } = setup(10);
  await reserveStock(tx, { productId: PRODUCT_ID, unitId: UNIT_ID, quantity: 4, channel: "SITE" });
  const row = db.findRow(PRODUCT_ID, UNIT_ID)!;
  assert.equal(row.stock, 10, "REAL não muda ao reservar");
  assert.equal(row.reserved, 4, "RESERVADO sobe");
  assert.equal(db.movements.length, 0, "reservar não gera StockMovement");
});

test("reserveStock: rejeita quando disponível é insuficiente", async () => {
  const { tx } = setup(10, 8); // disponível = 2
  await assert.rejects(
    reserveStock(tx, { productId: PRODUCT_ID, unitId: UNIT_ID, quantity: 5, channel: "SITE" }),
    (error: unknown) => (error as { code?: string }).code === "insufficient_available"
  );
});

test("confirmReservation: reserva ACTIVE gera SAIDA_VENDA e baixa o REAL", async () => {
  const { db, tx } = setup(10);
  const { reservationId } = await reserveStock(tx, {
    productId: PRODUCT_ID,
    unitId: UNIT_ID,
    quantity: 4,
    channel: "SITE",
  });
  const result = await confirmReservation(tx, reservationId);
  assert.equal(result.ok, true);
  const row = db.findRow(PRODUCT_ID, UNIT_ID)!;
  assert.equal(row.stock, 6, "REAL baixou");
  assert.equal(row.reserved, 0, "RESERVADO voltou a zero");
  assert.equal(db.movements[db.movements.length - 1]?.type, "SAIDA_VENDA");
});

test("releaseReservation: devolve o disponível sem gerar movimento real", async () => {
  const { db, tx } = setup(10);
  const { reservationId } = await reserveStock(tx, {
    productId: PRODUCT_ID,
    unitId: UNIT_ID,
    quantity: 4,
    channel: "ADMIN",
  });
  const released = await releaseReservation(tx, reservationId, "RELEASED");
  assert.equal(released, true);
  const row = db.findRow(PRODUCT_ID, UNIT_ID)!;
  assert.equal(row.reserved, 0);
  assert.equal(row.stock, 10);
  assert.equal(db.movements.length, 0);
});

test("releaseReservation: idempotente — segunda chamada não repete o efeito", async () => {
  const { tx } = setup(10);
  const { reservationId } = await reserveStock(tx, {
    productId: PRODUCT_ID,
    unitId: UNIT_ID,
    quantity: 4,
    channel: "ADMIN",
  });
  await releaseReservation(tx, reservationId, "EXPIRED");
  const secondCall = await releaseReservation(tx, reservationId, "EXPIRED");
  assert.equal(secondCall, false, "reserva já não está mais ACTIVE");
});

test("confirmReservation pós-expiração: re-checa disponibilidade e confirma se ainda houver estoque", async () => {
  const { db, tx } = setup(10);
  const { reservationId } = await reserveStock(tx, {
    productId: PRODUCT_ID,
    unitId: UNIT_ID,
    quantity: 4,
    channel: "SITE",
  });
  // Simula o sweeper expirando a reserva antes da confirmação chegar.
  await releaseReservation(tx, reservationId, "EXPIRED");

  const result = await confirmReservation(tx, reservationId);
  assert.equal(result.ok, true, "ainda há disponível suficiente, confirma mesmo expirada");
  const row = db.findRow(PRODUCT_ID, UNIT_ID)!;
  assert.equal(row.stock, 6);
});

test("confirmReservation pós-expiração: falha tratada quando não há mais disponível (nunca vende o que não tem)", async () => {
  const { db, tx } = setup(10);
  const { reservationId } = await reserveStock(tx, {
    productId: PRODUCT_ID,
    unitId: UNIT_ID,
    quantity: 4,
    channel: "SITE",
  });
  await releaseReservation(tx, reservationId, "EXPIRED");
  // Outra venda consome o disponível que a primeira reserva liberou.
  await reserveStock(tx, { productId: PRODUCT_ID, unitId: UNIT_ID, quantity: 10, channel: "ADMIN" });

  const result = await confirmReservation(tx, reservationId);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "insufficient_available");
  assert.equal(db.findRow(PRODUCT_ID, UNIT_ID)?.stock, 10, "REAL não muda quando a confirmação falha");
});

test("confirmReservation: reserva RELEASED não pode mais ser confirmada", async () => {
  const { tx } = setup(10);
  const { reservationId } = await reserveStock(tx, {
    productId: PRODUCT_ID,
    unitId: UNIT_ID,
    quantity: 4,
    channel: "SITE",
  });
  await releaseReservation(tx, reservationId, "RELEASED");
  const result = await confirmReservation(tx, reservationId);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "already_final");
});
