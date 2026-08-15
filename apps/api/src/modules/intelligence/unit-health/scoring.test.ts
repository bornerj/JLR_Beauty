import assert from "node:assert/strict";
import test from "node:test";
import { computeHealthScore } from "./scoring";
import type { UnitHealthRawMetrics } from "./types";

const baseMetrics: UnitHealthRawMetrics = {
  revenue: 10000,
  marginPercent: 20,
  revenueTrendPercent: 0,
  occupancyRate: 50,
  recurrenceRate: 50,
  inventoryHealthRate: 100,
  subscriptionActiveRate: 84,
};

test("computeHealthScore: unidade mediana em tudo cai em ATTENTION, nunca em CRITICAL/TAKEOFF", () => {
  const result = computeHealthScore(baseMetrics);
  assert.equal(result.state, "ATTENTION");
  assert.ok(result.score >= 40 && result.score < 65, `score fora da faixa esperada: ${result.score}`);
});

test("computeHealthScore: unidade excelente em tudo bate TAKEOFF", () => {
  const result = computeHealthScore({
    revenue: 50000,
    marginPercent: 45,
    revenueTrendPercent: 20,
    occupancyRate: 95,
    recurrenceRate: 90,
    inventoryHealthRate: 100,
    subscriptionActiveRate: 90,
  });
  assert.equal(result.state, "TAKEOFF");
  assert.ok(result.score >= 80);
});

test("computeHealthScore: unidade péssima em tudo bate CRITICAL", () => {
  const result = computeHealthScore({
    revenue: 1000,
    marginPercent: 2,
    revenueTrendPercent: -25,
    occupancyRate: 10,
    recurrenceRate: 5,
    inventoryHealthRate: 20,
    subscriptionActiveRate: 30,
  });
  assert.equal(result.state, "CRITICAL");
  assert.ok(result.score < 40);
});

test("computeHealthScore: componentes fora de 0-100 (dados inconsistentes) são sempre clampados", () => {
  const result = computeHealthScore({
    revenue: -1000, // receita negativa (estorno líquido) — não afeta normalização, só exibição
    marginPercent: -50, // margem negativa (prejuízo) — não pode gerar componente negativo
    revenueTrendPercent: 500, // outlier extremo — não pode estourar 100
    occupancyRate: 150, // taxa inválida vinda de um cálculo com bug upstream
    recurrenceRate: -10,
    inventoryHealthRate: 1000,
    subscriptionActiveRate: NaN,
  });
  for (const value of Object.values(result.components)) {
    assert.ok(value >= 0 && value <= 100, `componente fora de [0,100]: ${value}`);
  }
  assert.ok(result.score >= 0 && result.score <= 100);
});

test("computeHealthScore: regra de explicabilidade — sempre devolve score + state + components decompostos", () => {
  const result = computeHealthScore(baseMetrics);
  assert.ok(typeof result.score === "number");
  assert.ok(typeof result.state === "string");
  assert.equal(Object.keys(result.components).length, 6);
});

test("computeHealthScore: aponta corretamente o principal problema e a principal força", () => {
  const result = computeHealthScore({
    revenue: 30000,
    marginPercent: 45, // profitability alto
    revenueTrendPercent: 20, // growth alto
    occupancyRate: 95, // occupancy alto
    recurrenceRate: 95, // recurrence alto
    inventoryHealthRate: 95, // inventory alto
    subscriptionActiveRate: 5, // subscriptions muito baixo — deve ser a fraqueza
  });
  assert.equal(result.primaryWeakness, "subscriptions");
  assert.notEqual(result.primaryStrength, "subscriptions");
});

test("computeHealthScore: pesos somam 100% (regra fixa da DECISION-013, nunca deve ser alterada silenciosamente)", () => {
  // Duas unidades idênticas exceto por um componente de peso alto (profitability, 30%)
  // vs. um componente de peso baixo (subscriptions, 5%) devem divergir proporcionalmente.
  const highWeightBoost = computeHealthScore({ ...baseMetrics, marginPercent: 40 });
  const lowWeightBoost = computeHealthScore({ ...baseMetrics, subscriptionActiveRate: 100 });
  const baseline = computeHealthScore(baseMetrics);
  const highWeightDelta = highWeightBoost.score - baseline.score;
  const lowWeightDelta = lowWeightBoost.score - baseline.score;
  assert.ok(
    highWeightDelta > lowWeightDelta,
    `melhorar profitability (peso 30%) deveria valer mais que melhorar subscriptions (peso 5%): ${highWeightDelta} vs ${lowWeightDelta}`
  );
});
