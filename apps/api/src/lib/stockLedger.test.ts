import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "@prisma/client";
import { applyStockMovement, sellStockDirect, StockError } from "./stockLedger";
import { FakeStockDb } from "./testHelpers/fakeStockTx";

const PRODUCT_ID = 1;
const UNIT_ID = 1;

function setup(initialStock: number, initialReserved = 0) {
  const db = new FakeStockDb();
  db.seedProductStock({ productId: PRODUCT_ID, unitId: UNIT_ID, stock: initialStock, reserved: initialReserved });
  db.seedProduct({ id: PRODUCT_ID, stock: initialStock, costPrice: null });
  return { db, tx: db.tx as unknown as Prisma.TransactionClient };
}

test("applyStockMovement: ENTRADA_COMPRA soma ao saldo e gera balanceAfter correto", async () => {
  const { db, tx } = setup(10);
  const result = await applyStockMovement(tx, {
    productId: PRODUCT_ID,
    unitId: UNIT_ID,
    type: "ENTRADA_COMPRA",
    quantity: 5,
  });
  assert.equal(result.balanceAfter, 15);
  assert.equal(db.findRow(PRODUCT_ID, UNIT_ID)?.stock, 15);
  assert.equal(db.movements[db.movements.length - 1]?.type, "ENTRADA_COMPRA");
});

test("applyStockMovement: SAIDA_VENDA subtrai do saldo", async () => {
  const { tx } = setup(10);
  const result = await applyStockMovement(tx, {
    productId: PRODUCT_ID,
    unitId: UNIT_ID,
    type: "SAIDA_VENDA",
    quantity: 4,
  });
  assert.equal(result.balanceAfter, 6);
});

test("applyStockMovement: bloqueia saldo negativo (insufficient_stock)", async () => {
  const { tx } = setup(3);
  await assert.rejects(
    applyStockMovement(tx, { productId: PRODUCT_ID, unitId: UNIT_ID, type: "SAIDA_VENDA", quantity: 10 }),
    (error: unknown) => error instanceof StockError && error.code === "insufficient_stock"
  );
});

test("applyStockMovement: rejeita quantidade zero, negativa ou não-inteira", async () => {
  const { tx } = setup(10);
  for (const quantity of [0, -1, 1.5]) {
    await assert.rejects(
      applyStockMovement(tx, { productId: PRODUCT_ID, unitId: UNIT_ID, type: "ENTRADA_COMPRA", quantity }),
      (error: unknown) => error instanceof StockError && error.code === "invalid_quantity"
    );
  }
});

test("applyStockMovement: sincroniza Product.stock (cache global) após o movimento", async () => {
  const { db, tx } = setup(10);
  await applyStockMovement(tx, { productId: PRODUCT_ID, unitId: UNIT_ID, type: "ENTRADA_COMPRA", quantity: 5 });
  assert.equal(db.products.find((p) => p.id === PRODUCT_ID)?.stock, 15);
});

test("sellStockDirect: vende quando há disponível suficiente (stock - reserved)", async () => {
  const { db, tx } = setup(10, 3); // disponível = 7
  await sellStockDirect(tx, { productId: PRODUCT_ID, unitId: UNIT_ID, quantity: 7 });
  assert.equal(db.findRow(PRODUCT_ID, UNIT_ID)?.stock, 3);
});

test("sellStockDirect: bloqueia overselling quando reservado reduz o disponível", async () => {
  const { tx } = setup(10, 8); // disponível = 2
  await assert.rejects(
    sellStockDirect(tx, { productId: PRODUCT_ID, unitId: UNIT_ID, quantity: 3 }),
    (error: unknown) => error instanceof StockError && error.code === "insufficient_available"
  );
});
