import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyPortfolio, median } from "./classifier";
import type { ProductTotals } from "./types";

/** Admin V2 (PLAN-0022, Onda 5) — testes da matriz margem×volume (RETROFIT-006). */

const product = (overrides: Partial<ProductTotals> = {}): ProductTotals => ({
  productId: 1,
  name: "Produto",
  quantitySold: 0,
  revenue: 0,
  cmv: 0,
  capitalParked: 0,
  byUnit: [],
  ...overrides,
});

test("median — ímpar, par e vazio", () => {
  assert.equal(median([]), 0);
  assert.equal(median([5]), 5);
  assert.equal(median([1, 3, 2]), 2);
  assert.equal(median([1, 2, 3, 4]), 2.5);
});

test("classifyPortfolio — produto sem nenhuma venda vira SEM_VENDA, nunca fabrica margem", () => {
  const result = classifyPortfolio([
    product({ productId: 1, name: "Parado", quantitySold: 0, capitalParked: 500 }),
  ]);
  const item = result.products[0];
  assert.equal(item.quadrant, "SEM_VENDA");
  assert.equal(item.marginPercent, null);
  assert.equal(item.revenue, 0);
  assert.equal(item.capitalParked, 500); // capital parado nunca some, mesmo sem venda
});

test("classifyPortfolio — alto volume + alta margem vira ESTRELA", () => {
  const result = classifyPortfolio([
    product({ productId: 1, name: "A", quantitySold: 100, revenue: 10000, cmv: 4000 }), // margem 60%
    product({ productId: 2, name: "B", quantitySold: 10, revenue: 1000, cmv: 800 }), // margem 20%
  ]);
  const a = result.products.find((p) => p.productId === 1)!;
  assert.equal(a.quadrant, "ESTRELA");
  assert.equal(a.marginPercent, 60);
});

test("classifyPortfolio — alto volume + baixa margem vira ARMADILHA (critério de aceitação da Onda 5)", () => {
  const result = classifyPortfolio([
    product({ productId: 1, name: "VendeMuitoMargemBaixa", quantitySold: 500, revenue: 5000, cmv: 4800 }), // margem 4%
    product({ productId: 2, name: "Referencia", quantitySold: 20, revenue: 2000, cmv: 1000 }), // margem 50%
  ]);
  const trap = result.products.find((p) => p.productId === 1)!;
  assert.equal(trap.quadrant, "ARMADILHA");
  assert.ok(trap.quantitySold > result.volumeMedian || trap.quantitySold === result.volumeMedian);
});

test("classifyPortfolio — baixo volume + alta margem vira JOIA", () => {
  const result = classifyPortfolio([
    product({ productId: 1, name: "Joia", quantitySold: 2, revenue: 1000, cmv: 300 }), // margem 70%
    product({ productId: 2, name: "Volume", quantitySold: 200, revenue: 8000, cmv: 6000 }), // margem 25%
  ]);
  const jewel = result.products.find((p) => p.productId === 1)!;
  assert.equal(jewel.quadrant, "JOIA");
});

test("classifyPortfolio — baixo volume + baixa margem vira FRACO", () => {
  const result = classifyPortfolio([
    product({ productId: 1, name: "Fraco", quantitySold: 3, revenue: 300, cmv: 290 }), // margem ~3.3%
    product({ productId: 2, name: "Referencia", quantitySold: 50, revenue: 5000, cmv: 2000 }), // margem 60%
  ]);
  const weak = result.products.find((p) => p.productId === 1)!;
  assert.equal(weak.quadrant, "FRACO");
});

test("classifyPortfolio — margem negativa (custo > preço) é real, não é clampada, e pesa para BAIXO", () => {
  const result = classifyPortfolio([
    product({ productId: 1, name: "Prejuizo", quantitySold: 300, revenue: 3000, cmv: 3600 }), // margem -20%
    product({ productId: 2, name: "Referencia", quantitySold: 10, revenue: 1000, cmv: 500 }), // margem 50%
  ]);
  const loss = result.products.find((p) => p.productId === 1)!;
  assert.equal(loss.marginPercent, -20);
  assert.equal(loss.quadrant, "ARMADILHA"); // alto volume + margem negativa
});

test("classifyPortfolio — volumeMedian/marginMedian ignoram produtos SEM_VENDA", () => {
  const result = classifyPortfolio([
    product({ productId: 1, name: "Vendido", quantitySold: 40, revenue: 4000, cmv: 2000 }),
    product({ productId: 2, name: "Parado", quantitySold: 0, capitalParked: 1000 }),
  ]);
  assert.equal(result.volumeMedian, 40); // só o produto vendido entra na mediana
  assert.equal(result.marginMedian, 50);
});

test("classifyPortfolio — byUnit é preservado sem transformação (drill-down por unidade)", () => {
  const byUnit = [{ unitId: 1, unitName: "Loja A", quantitySold: 5, revenue: 500, cmv: 200, marginPercent: 60, capitalParked: 100 }];
  const result = classifyPortfolio([product({ productId: 1, quantitySold: 5, revenue: 500, cmv: 200, byUnit })]);
  assert.deepEqual(result.products[0].byUnit, byUnit);
});
