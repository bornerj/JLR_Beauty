import assert from "node:assert/strict";
import { test } from "node:test";
import { buildRadarFindings } from "./rules";
import type { RadarInputs } from "./types";

/** Admin V2 (PLAN-0023, Onda 1) — testes das regras do Radar Executivo (RETROFIT-011). */

const PERIOD = { from: "2026-08-01T00:00:00.000Z", to: "2026-08-30T23:59:59.999Z", days: 30 };

/** Baseline neutro — nenhuma regra dispara. Cada teste sobrescreve só o que precisa. */
const baseInputs = (): RadarInputs => ({
  panorama: {
    period: PERIOD,
    scope: { unitIds: "all" },
    network: { units: 1, takeoff: 0, healthy: 1, attention: 0, critical: 0 },
    operations: { ordersNeedingAttention: 0, stockAlerts: 0, stockValue: 0, lowOccupancyUnits: 0 },
    financial: { revenue: 1000, revenueTrendPercent: 0, marginPercent: 50, marginTrendPp: 0 },
    customers: { newInPeriod: 0, recurrenceRate: 0, atRisk: 0 },
    attention: [],
    opportunities: [],
  },
  networkBoard: { period: PERIOD, columns: { takeoff: [], healthy: [], attention: [], critical: [] } },
  ordersBoard: {
    period: PERIOD,
    columns: {
      entraram: { count: 0, totalValue: 0, orders: [] },
      emPreparacao: { count: 0, totalValue: 0, orders: [] },
      atencao: { count: 0, totalValue: 0, orders: [] },
      prontos: { count: 0, totalValue: 0, orders: [] },
    },
  },
  portfolioProducts: { period: PERIOD, volumeMedian: 0, marginMedian: null, products: [] },
  servicePerformance: {
    period: PERIOD,
    totalAvailableMinutes: 0,
    totalBookedMinutes: 0,
    totalMargin: 0,
    demandMedian: 0,
    marginPerHourMedian: null,
    services: [],
  },
  customerFlow: { period: PERIOD, counts: { NOVO: 0, ATIVO: 0, RECORRENTE: 0, EM_RISCO: 0, INATIVO: 0 }, customers: [] },
  subscriptionHealth: {
    period: PERIOD,
    counts: { ENTRANDO: 0, SAUDAVEL: 0, ATENCAO: 0, SAINDO: 0 },
    churn: { count: 0, ratePercent: null, explanation: "" },
    subscriptions: [],
  },
  franchisePipeline: { stages: [], leads: [] },
});

test("buildRadarFindings — baseline neutro não gera nenhum achado", () => {
  assert.deepEqual(buildRadarFindings(baseInputs()), []);
});

test("buildRadarFindings — unidade crítica vira achado CRITICO com link pro diagnóstico", () => {
  const inputs = baseInputs();
  inputs.networkBoard.columns.critical = [
    {
      unitId: 7,
      unitName: "Loja Teste",
      state: "CRITICAL",
      score: 20,
      revenue: 0,
      revenueTrendPercent: 0,
      marginPercent: 0,
      occupancyRate: 0,
      primaryStrength: { key: "profitability", label: "Rentabilidade" },
      primaryWeakness: { key: "occupancy", label: "Ocupação" },
    },
  ];
  const result = buildRadarFindings(inputs);
  assert.equal(result.length, 1);
  assert.equal(result[0].severity, "CRITICO");
  assert.equal(result[0].actionPath, "/admin-v2/rede/7");
  assert.match(result[0].message, /Loja Teste/);
});

test("buildRadarFindings — coluna Atenção do board de pedidos: baixo volume vira ATENCAO, alto volume vira CRITICO", () => {
  const low = baseInputs();
  low.ordersBoard.columns.atencao = { count: 3, totalValue: 500, orders: [] };
  assert.equal(buildRadarFindings(low)[0].severity, "ATENCAO");

  const high = baseInputs();
  high.ordersBoard.columns.atencao = { count: 12, totalValue: 5000, orders: [] };
  assert.equal(buildRadarFindings(high)[0].severity, "CRITICO");
});

test("buildRadarFindings — produtos Armadilha viram 1 achado agregado, não 1 por item", () => {
  const inputs = baseInputs();
  inputs.portfolioProducts.products = [
    { productId: 1, name: "A", quadrant: "ARMADILHA", quantitySold: 10, revenue: 100, cmv: 90, marginPercent: 10, capitalParked: 0, byUnit: [] },
    { productId: 2, name: "B", quadrant: "ARMADILHA", quantitySold: 8, revenue: 80, cmv: 70, marginPercent: 12, capitalParked: 0, byUnit: [] },
    { productId: 3, name: "C", quadrant: "ESTRELA", quantitySold: 5, revenue: 500, cmv: 100, marginPercent: 80, capitalParked: 0, byUnit: [] },
  ];
  const result = buildRadarFindings(inputs);
  assert.equal(result.length, 1);
  assert.match(result[0].message, /^2 produto/);
  assert.equal(result[0].actionPath, "/admin-v2/operacao/produtos");
});

test("buildRadarFindings — churn de assinatura vira CRITICO", () => {
  const inputs = baseInputs();
  inputs.subscriptionHealth.churn = { count: 2, ratePercent: 20, explanation: "" };
  const result = buildRadarFindings(inputs);
  assert.equal(result.length, 1);
  assert.equal(result[0].severity, "CRITICO");
  assert.equal(result[0].actionPath, "/admin-v2/clientes/assinaturas");
});

test("buildRadarFindings — gargalo de etapa do pipeline de franquias vira ATENCAO com nome da etapa", () => {
  const inputs = baseInputs();
  inputs.franchisePipeline.stages = [
    { stage: "QUALIFICADO", count: 2, estimatedValueTotal: 0, avgDaysToComplete: 5, avgDaysInStageNow: 12, isBottleneck: true },
  ];
  const result = buildRadarFindings(inputs);
  assert.equal(result.length, 1);
  assert.match(result[0].message, /QUALIFICADO/);
  assert.equal(result[0].actionPath, "/admin-v2/crescimento");
});

test("buildRadarFindings — queda de receita vira ATENCAO, alta vira OPORTUNIDADE", () => {
  const drop = baseInputs();
  drop.panorama.financial.revenueTrendPercent = -15;
  const dropResult = buildRadarFindings(drop);
  assert.equal(dropResult.length, 1);
  assert.equal(dropResult[0].severity, "ATENCAO");

  const growth = baseInputs();
  growth.panorama.financial.revenueTrendPercent = 20;
  const growthResult = buildRadarFindings(growth);
  assert.equal(growthResult.length, 1);
  assert.equal(growthResult[0].severity, "OPORTUNIDADE");
});

test("buildRadarFindings — pequena variação de receita não dispara nada (dentro do limiar)", () => {
  const inputs = baseInputs();
  inputs.panorama.financial.revenueTrendPercent = 3;
  assert.deepEqual(buildRadarFindings(inputs), []);
});

test("buildRadarFindings — oportunidade de reativação do Panorama vira OPORTUNIDADE", () => {
  const inputs = baseInputs();
  inputs.panorama.opportunities = [{ type: "REACTIVATION", description: "12 clientes inativos há 90 dias", estimatedValue: 3000 }];
  const result = buildRadarFindings(inputs);
  assert.equal(result.length, 1);
  assert.equal(result[0].severity, "OPORTUNIDADE");
  assert.match(result[0].message, /3.000|3\.000,00/);
});

test("buildRadarFindings — ordena por severidade: CRITICO antes de ATENCAO antes de OPORTUNIDADE", () => {
  const inputs = baseInputs();
  inputs.panorama.opportunities = [{ type: "REACTIVATION", description: "x", estimatedValue: 1 }];
  inputs.customerFlow.counts.EM_RISCO = 1;
  inputs.subscriptionHealth.churn = { count: 1, ratePercent: 10, explanation: "" };
  const result = buildRadarFindings(inputs);
  assert.equal(result.length, 3);
  assert.equal(result[0].severity, "CRITICO");
  assert.equal(result[1].severity, "ATENCAO");
  assert.equal(result[2].severity, "OPORTUNIDADE");
});

test("buildRadarFindings — todo achado sai com actionPath e actionLabel não vazios (governança #7)", () => {
  const inputs = baseInputs();
  inputs.networkBoard.columns.critical = [
    {
      unitId: 1,
      unitName: "U",
      state: "CRITICAL",
      score: 10,
      revenue: 0,
      revenueTrendPercent: 0,
      marginPercent: 0,
      occupancyRate: 0,
      primaryStrength: { key: "profitability", label: "Rentabilidade" },
      primaryWeakness: { key: "occupancy", label: "Ocupação" },
    },
  ];
  inputs.ordersBoard.columns.atencao = { count: 1, totalValue: 10, orders: [] };
  inputs.customerFlow.counts.EM_RISCO = 1;
  inputs.subscriptionHealth.churn = { count: 1, ratePercent: 5, explanation: "" };
  inputs.franchisePipeline.leads = [
    { leadId: 1, name: "L", email: null, phone: null, city: null, stage: "INTERESSADO", estimatedValue: null, stageChangedAt: PERIOD.from, daysInStage: 30, isStalled: true },
  ];
  const result = buildRadarFindings(inputs);
  assert.ok(result.length > 0);
  for (const finding of result) {
    assert.ok(finding.actionPath.startsWith("/admin-v2"), `achado ${finding.id} sem actionPath válido`);
    assert.ok(finding.actionLabel.length > 0, `achado ${finding.id} sem actionLabel`);
    assert.ok(finding.message.length > 0, `achado ${finding.id} sem message`);
  }
});
