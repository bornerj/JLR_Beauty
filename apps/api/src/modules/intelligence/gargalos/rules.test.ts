import assert from "node:assert/strict";
import { test } from "node:test";
import { rankBottlenecks, sumKnownImpact } from "./rules";
import type { RankInputs } from "./types";

/** Admin V2 (PLAN-0023, Onda 2) — testes do ranking de gargalos (RETROFIT-012). */

const PERIOD = { from: "2026-08-01T00:00:00.000Z", to: "2026-08-30T23:59:59.999Z", days: 30 };

const baseInputs = (): RankInputs => ({
  ordersBoard: {
    period: PERIOD,
    columns: {
      entraram: { count: 0, totalValue: 0, orders: [] },
      emPreparacao: { count: 0, totalValue: 0, orders: [] },
      atencao: { count: 0, totalValue: 0, orders: [] },
      prontos: { count: 0, totalValue: 0, orders: [] },
    },
  },
  capacityHeatmaps: [],
  portfolioProducts: { period: PERIOD, volumeMedian: 0, marginMedian: null, products: [] },
  subscriptionHealth: {
    period: PERIOD,
    counts: { ENTRANDO: 0, SAUDAVEL: 0, ATENCAO: 0, SAINDO: 0 },
    churn: { count: 0, ratePercent: null, explanation: "" },
    subscriptions: [],
  },
  franchisePipeline: { stages: [], leads: [] },
});

test("rankBottlenecks — baseline neutro não gera nenhum gargalo", () => {
  assert.deepEqual(rankBottlenecks(baseInputs()), []);
});

test("rankBottlenecks — pedidos travados vira gargalo com impacto = totalValue da coluna Atenção", () => {
  const inputs = baseInputs();
  inputs.ordersBoard.columns.atencao = { count: 5, totalValue: 1500, orders: [] };
  const result = rankBottlenecks(inputs);
  assert.equal(result.length, 1);
  assert.equal(result[0].impact?.amount, 1500);
  assert.equal(result[0].actionPath, "/admin-v2/operacao");
});

test("rankBottlenecks — agenda: soma minutos ociosos × taxa de referência de todos os slots de todas as unidades", () => {
  const inputs = baseInputs();
  inputs.capacityHeatmaps = [
    {
      unitId: 1,
      unitName: "Unidade A",
      period: PERIOD,
      hourRange: { start: 9, end: 10 },
      unitRevenuePerBookedHour: 100,
      days: [
        {
          date: "2026-08-10",
          weekday: 1,
          // 60min disponíveis, 0 reservados -> 60min ociosos × R$100/h (fallback da unidade) = R$100
          slots: [{ hour: 9, availableMinutes: 60, bookedMinutes: 0, occupancyRate: 0, revenueActual: 0, revenuePerAvailableHour: 0, revenuePerBookedHour: null }],
        },
      ],
    },
  ];
  const result = rankBottlenecks(inputs);
  assert.equal(result.length, 1);
  assert.equal(result[0].impact?.amount, 100);
  assert.match(result[0].message, /Unidade A/);
});

test("rankBottlenecks — agenda: horário com taxa própria usa a taxa do próprio horário, não a média da unidade", () => {
  const inputs = baseInputs();
  inputs.capacityHeatmaps = [
    {
      unitId: 1,
      unitName: "Unidade A",
      period: PERIOD,
      hourRange: { start: 9, end: 11 },
      unitRevenuePerBookedHour: 100,
      days: [
        {
          date: "2026-08-10",
          weekday: 1,
          slots: [
            // 30min ociosos, taxa própria R$200/h -> R$100
            { hour: 9, availableMinutes: 60, bookedMinutes: 30, occupancyRate: 50, revenueActual: 100, revenuePerAvailableHour: 100, revenuePerBookedHour: 200 },
          ],
        },
      ],
    },
  ];
  const result = rankBottlenecks(inputs);
  assert.equal(result[0].impact?.amount, 100); // 0.5h * 200, não 0.5h * 100 (média da unidade)
});

test("rankBottlenecks — agenda: totalmente ocupado (sem ociosidade) não gera gargalo", () => {
  const inputs = baseInputs();
  inputs.capacityHeatmaps = [
    {
      unitId: 1,
      unitName: "Unidade A",
      period: PERIOD,
      hourRange: { start: 9, end: 10 },
      unitRevenuePerBookedHour: 100,
      days: [
        {
          date: "2026-08-10",
          weekday: 1,
          slots: [{ hour: 9, availableMinutes: 60, bookedMinutes: 60, occupancyRate: 100, revenueActual: 100, revenuePerAvailableHour: 100, revenuePerBookedHour: 100 }],
        },
      ],
    },
  ];
  assert.deepEqual(rankBottlenecks(inputs), []);
});

test("rankBottlenecks — produtos Armadilha sem capital parado ainda aparece, mas com impact null (fim do ranking)", () => {
  const inputs = baseInputs();
  inputs.portfolioProducts.products = [
    { productId: 1, name: "A", quadrant: "ARMADILHA", quantitySold: 10, revenue: 100, cmv: 90, marginPercent: 10, capitalParked: 0, byUnit: [] },
  ];
  const result = rankBottlenecks(inputs);
  assert.equal(result.length, 1);
  assert.equal(result[0].impact, null);
});

test("rankBottlenecks — assinaturas: MRR em risco soma o preço do plano de Saindo + Atenção, ignora Saudável/Entrando", () => {
  const inputs = baseInputs();
  inputs.subscriptionHealth.subscriptions = [
    { subscriptionId: 1, membershipName: "Gold", membershipPrice: 189, customerName: null, customerEmail: null, customerPhone: null, status: "CANCELADA", state: "SAINDO", reason: "", startedAt: PERIOD.from, cancelledAt: PERIOD.from, approvedPaymentsCurrentPeriod: 0, approvedPaymentsPreviousPeriod: 1 },
    { subscriptionId: 2, membershipName: "Silver", membershipPrice: 99, customerName: null, customerEmail: null, customerPhone: null, status: "ATIVA", state: "ATENCAO", reason: "", startedAt: PERIOD.from, cancelledAt: null, approvedPaymentsCurrentPeriod: 0, approvedPaymentsPreviousPeriod: 1 },
    { subscriptionId: 3, membershipName: "Platinum", membershipPrice: 299, customerName: null, customerEmail: null, customerPhone: null, status: "ATIVA", state: "SAUDAVEL", reason: "", startedAt: PERIOD.from, cancelledAt: null, approvedPaymentsCurrentPeriod: 1, approvedPaymentsPreviousPeriod: 1 },
  ];
  const result = rankBottlenecks(inputs);
  assert.equal(result.length, 1);
  assert.equal(result[0].impact?.amount, 189 + 99);
});

test("rankBottlenecks — franquias: soma o valor potencial só dos leads parados", () => {
  const inputs = baseInputs();
  inputs.franchisePipeline.leads = [
    { leadId: 1, name: "A", email: null, phone: null, city: null, stage: "PROPOSTA", estimatedValue: 50000, stageChangedAt: PERIOD.from, daysInStage: 30, isStalled: true, reason: null },
    { leadId: 2, name: "B", email: null, phone: null, city: null, stage: "INTERESSADO", estimatedValue: 20000, stageChangedAt: PERIOD.from, daysInStage: 2, isStalled: false, reason: null },
  ];
  const result = rankBottlenecks(inputs);
  assert.equal(result.length, 1);
  assert.equal(result[0].impact?.amount, 50000);
});

test("rankBottlenecks — ordena por impacto decrescente, gargalos sem impacto conhecido vão pro fim (nunca escondidos)", () => {
  const inputs = baseInputs();
  inputs.ordersBoard.columns.atencao = { count: 1, totalValue: 100, orders: [] };
  inputs.franchisePipeline.leads = [{ leadId: 1, name: "A", email: null, phone: null, city: null, stage: "PROPOSTA", estimatedValue: 9000, stageChangedAt: PERIOD.from, daysInStage: 30, isStalled: true, reason: null }];
  inputs.portfolioProducts.products = [
    { productId: 1, name: "A", quadrant: "ARMADILHA", quantitySold: 10, revenue: 100, cmv: 90, marginPercent: 10, capitalParked: 0, byUnit: [] },
  ];
  const result = rankBottlenecks(inputs);
  assert.equal(result.length, 3);
  assert.equal(result[0].impact?.amount, 9000);
  assert.equal(result[1].impact?.amount, 100);
  assert.equal(result[2].impact, null);
});

test("sumKnownImpact — soma só os impactos conhecidos, ignora os null", () => {
  const inputs = baseInputs();
  inputs.ordersBoard.columns.atencao = { count: 1, totalValue: 100, orders: [] };
  inputs.portfolioProducts.products = [
    { productId: 1, name: "A", quadrant: "ARMADILHA", quantitySold: 10, revenue: 100, cmv: 90, marginPercent: 10, capitalParked: 0, byUnit: [] },
  ];
  const result = rankBottlenecks(inputs);
  assert.equal(sumKnownImpact(result), 100);
});
