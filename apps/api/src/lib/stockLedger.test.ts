import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "@prisma/client";
import { applyStockAdjustment, applyStockMovement, sellStockDirect, StockError } from "./stockLedger";
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

// ERR-0071 — AJUSTE pra cima não pode passar por "saída" internamente nem
// disparar insufficient_stock quando o alvo é mais que o dobro do saldo atual.
test("applyStockAdjustment: ajuste pra cima grava balanceAfter = targetStock, sem passar por saldo negativo intermediário", async () => {
  const { db, tx } = setup(5);
  const result = await applyStockAdjustment(tx, {
    productId: PRODUCT_ID,
    unitId: UNIT_ID,
    targetStock: 100, // mais que o dobro do saldo atual (5) — caso que quebrava antes
    reason: "contagem fisica",
  });
  assert.equal(result.balanceAfter, 100);
  assert.equal(result.changed, true);
  assert.equal(db.findRow(PRODUCT_ID, UNIT_ID)?.stock, 100);
  const last = db.movements[db.movements.length - 1];
  assert.equal(last?.type, "AJUSTE");
  assert.equal(last?.balanceAfter, 100);
  assert.equal(last?.quantity, 95);
});

test("applyStockAdjustment: ajuste pra baixo grava balanceAfter = targetStock", async () => {
  const { db, tx } = setup(20);
  const result = await applyStockAdjustment(tx, {
    productId: PRODUCT_ID,
    unitId: UNIT_ID,
    targetStock: 3,
    reason: "contagem fisica",
  });
  assert.equal(result.balanceAfter, 3);
  assert.equal(db.findRow(PRODUCT_ID, UNIT_ID)?.stock, 3);
  const last = db.movements[db.movements.length - 1];
  assert.equal(last?.quantity, 17);
});

test("applyStockAdjustment: alvo igual ao saldo atual não gera movimento", async () => {
  const { db, tx } = setup(8);
  const result = await applyStockAdjustment(tx, {
    productId: PRODUCT_ID,
    unitId: UNIT_ID,
    targetStock: 8,
    reason: "contagem fisica",
  });
  assert.equal(result.changed, false);
  assert.equal(result.movementId, null);
  assert.equal(db.movements.length, 0);
});

test("applyStockAdjustment: sincroniza Product.stock (cache global) após o ajuste", async () => {
  const { db, tx } = setup(5);
  await applyStockAdjustment(tx, { productId: PRODUCT_ID, unitId: UNIT_ID, targetStock: 50, reason: "contagem" });
  assert.equal(db.products.find((p) => p.id === PRODUCT_ID)?.stock, 50);
});

// Validação de consistência do ledger (pedido do usuário, PLAN-0032 ocorrência #1):
// para toda a cadeia de movimentos de uma unidade, saldo anterior + delta assinado
// = balanceAfter, encadeado do mais antigo ao mais novo, terminando no saldo real.
function assertLedgerChainConsistent(
  movements: Array<{ type: string; quantity: number; balanceAfter: number }>,
  finalRealStock: number
) {
  const INBOUND = new Set(["ENTRADA_COMPRA", "DEVOLUCAO"]);
  let expected = 0;
  for (const m of movements) {
    if (m.type === "AJUSTE") {
      expected = m.balanceAfter; // AJUSTE define o alvo diretamente, não soma/subtrai
    } else {
      expected += INBOUND.has(m.type) ? m.quantity : -m.quantity;
    }
    assert.equal(m.balanceAfter, expected, `movimento fora da cadeia: esperado ${expected}, gravado ${m.balanceAfter}`);
  }
  assert.equal(expected, finalRealStock, "saldo final do ledger diverge do saldo real da unidade");
}

test("consistência do ledger: entrada + venda + ajuste pra cima encadeiam corretamente", async () => {
  const { db, tx } = setup(0);
  await applyStockMovement(tx, { productId: PRODUCT_ID, unitId: UNIT_ID, type: "ENTRADA_COMPRA", quantity: 20 });
  await applyStockMovement(tx, { productId: PRODUCT_ID, unitId: UNIT_ID, type: "SAIDA_VENDA", quantity: 3 });
  await applyStockAdjustment(tx, { productId: PRODUCT_ID, unitId: UNIT_ID, targetStock: 50, reason: "contagem" });
  const finalStock = db.findRow(PRODUCT_ID, UNIT_ID)?.stock ?? -1;
  assertLedgerChainConsistent(db.movements, finalStock);
  assert.equal(finalStock, 50);
});
