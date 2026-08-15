import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMoneyOverview } from "./rules";
import type { MoneyInputs } from "./types";
import type { SalesInsights } from "../../admin/kpis/dashboardSalesInsights";
import type { ServicePerformanceList } from "../service-performance/types";
import type { SubscriptionHealth } from "../subscriptions/types";

const PERIOD = { from: "2026-07-01T00:00:00.000Z", to: "2026-07-30T23:59:59.999Z", days: 30 };

const emptySalesInsights = (overrides: Partial<SalesInsights["totals"]> = {}): SalesInsights => ({
  period: PERIOD,
  filters: { unitId: null, sellerUserId: null },
  totals: { revenue: 0, ordersPaid: 0, avgTicket: 0, itemsSold: 0, cmv: 0, grossProfit: 0, marginPercent: 0, ...overrides },
  byChannel: [],
  topProducts: [],
  topSellers: [],
  topCustomers: [],
});

const emptyServicePerformance = (): ServicePerformanceList => ({
  period: PERIOD,
  totalAvailableMinutes: 0,
  totalBookedMinutes: 0,
  totalMargin: 0,
  demandMedian: 0,
  marginPerHourMedian: null,
  services: [],
});

const emptySubscriptionHealth = (): SubscriptionHealth => ({
  period: PERIOD,
  counts: { ENTRANDO: 0, SAUDAVEL: 0, ATENCAO: 0, SAINDO: 0 },
  churn: { count: 0, ratePercent: null, explanation: "" },
  subscriptions: [],
});

const baseInputs = (overrides: Partial<MoneyInputs> = {}): MoneyInputs => ({
  salesInsightsNetwork: emptySalesInsights(),
  salesInsightsByUnit: [],
  servicePerformance: emptyServicePerformance(),
  subscriptionHealth: emptySubscriptionHealth(),
  professionalRevenue: [],
  ...overrides,
});

test("buildMoneyOverview: baseline vazio não quebra e devolve cascata zerada", () => {
  const overview = buildMoneyOverview(baseInputs());
  assert.equal(overview.waterfall.length, 3);
  assert.equal(overview.waterfall[0].amount, 0);
  assert.equal(overview.waterfall[2].amount, 0);
  assert.equal(overview.sources.length, 3);
  assert.equal(overview.byUnit.length, 0);
});

test("buildMoneyOverview: cascata soma as 3 origens e subtrai o custo direto corretamente", () => {
  const overview = buildMoneyOverview(
    baseInputs({
      salesInsightsNetwork: emptySalesInsights({ revenue: 1000, cmv: 400 }),
      servicePerformance: {
        ...emptyServicePerformance(),
        services: [
          {
            serviceId: 1,
            name: "Corte",
            quadrant: "ESTRELA",
            appointments: 5,
            bookedMinutes: 300,
            revenue: 500,
            cost: 100,
            marginPercent: 80,
            revenuePerHour: 100,
            marginPerHour: 80,
            occupancyPercent: 50,
            marginSharePercent: null,
            byUnit: [],
          },
        ],
      },
      subscriptionHealth: {
        ...emptySubscriptionHealth(),
        subscriptions: [
          {
            subscriptionId: 1,
            membershipName: "VIP",
            membershipPrice: 200,
            customerName: "Cliente A",
            customerEmail: null,
            customerPhone: null,
            status: "ATIVA",
            state: "SAUDAVEL",
            reason: "",
            startedAt: PERIOD.from,
            cancelledAt: null,
            approvedPaymentsCurrentPeriod: 1,
            approvedPaymentsPreviousPeriod: 1,
          },
        ],
      },
    })
  );

  assert.equal(overview.sources[0].revenue, 1000); // Produtos
  assert.equal(overview.sources[1].revenue, 500); // Serviços
  assert.equal(overview.sources[2].revenue, 200); // Assinaturas
  assert.equal(overview.waterfall[0].amount, 1700); // Receita
  assert.equal(overview.waterfall[1].amount, 500); // Custo Direto (400 + 100)
  assert.equal(overview.waterfall[2].amount, 1200); // Margem Bruta
});

test("buildMoneyOverview: assinatura cancelada não entra no MRR nem no byPlan", () => {
  const overview = buildMoneyOverview(
    baseInputs({
      subscriptionHealth: {
        ...emptySubscriptionHealth(),
        subscriptions: [
          {
            subscriptionId: 1,
            membershipName: "VIP",
            membershipPrice: 200,
            customerName: null,
            customerEmail: null,
            customerPhone: null,
            status: "CANCELADA",
            state: "SAINDO",
            reason: "",
            startedAt: PERIOD.from,
            cancelledAt: PERIOD.to,
            approvedPaymentsCurrentPeriod: 0,
            approvedPaymentsPreviousPeriod: 0,
          },
          {
            subscriptionId: 2,
            membershipName: "VIP",
            membershipPrice: 200,
            customerName: null,
            customerEmail: null,
            customerPhone: null,
            status: "ATIVA",
            state: "SAUDAVEL",
            reason: "",
            startedAt: PERIOD.from,
            cancelledAt: null,
            approvedPaymentsCurrentPeriod: 1,
            approvedPaymentsPreviousPeriod: 1,
          },
        ],
      },
    })
  );
  assert.equal(overview.sources[2].revenue, 200);
  assert.equal(overview.byPlan.length, 1);
  assert.equal(overview.byPlan[0].activeCount, 1);
  assert.equal(overview.byPlan[0].mrr, 200);
});

test("buildMoneyOverview: byUnit soma produto + serviço da mesma unidade e calcula margem", () => {
  const overview = buildMoneyOverview(
    baseInputs({
      salesInsightsByUnit: [
        { unitId: 1, unitName: "Unidade A", insights: emptySalesInsights({ revenue: 800, cmv: 300 }) },
      ],
      servicePerformance: {
        ...emptyServicePerformance(),
        services: [
          {
            serviceId: 1,
            name: "Corte",
            quadrant: "ESTRELA",
            appointments: 1,
            bookedMinutes: 60,
            revenue: 200,
            cost: 50,
            marginPercent: 75,
            revenuePerHour: 200,
            marginPerHour: 150,
            occupancyPercent: 10,
            marginSharePercent: null,
            byUnit: [{ unitId: 1, unitName: "Unidade A", appointments: 1, bookedMinutes: 60, revenue: 200, cost: 50, marginPerHour: 150 }],
          },
        ],
      },
    })
  );

  assert.equal(overview.byUnit.length, 1);
  assert.equal(overview.byUnit[0].revenue, 1000); // 800 + 200
  assert.equal(overview.byUnit[0].cost, 350); // 300 + 50
  assert.equal(overview.byUnit[0].marginPercent, 65); // (1000-350)/1000*100
});

test("buildMoneyOverview: unidade sem nenhuma receita fica com marginPercent null", () => {
  const overview = buildMoneyOverview(
    baseInputs({
      salesInsightsByUnit: [{ unitId: 1, unitName: "Unidade A", insights: emptySalesInsights() }],
    })
  );
  assert.equal(overview.byUnit[0].revenue, 0);
  assert.equal(overview.byUnit[0].marginPercent, null);
});

test("buildMoneyOverview: byService ordena por receita e calcula profit", () => {
  const overview = buildMoneyOverview(
    baseInputs({
      servicePerformance: {
        ...emptyServicePerformance(),
        services: [
          { serviceId: 1, name: "Baixo", quadrant: "FRACO", appointments: 1, bookedMinutes: 30, revenue: 100, cost: 20, marginPercent: 80, revenuePerHour: 200, marginPerHour: 160, occupancyPercent: 5, marginSharePercent: null, byUnit: [] },
          { serviceId: 2, name: "Alto", quadrant: "ESTRELA", appointments: 5, bookedMinutes: 300, revenue: 900, cost: 300, marginPercent: 66.7, revenuePerHour: 180, marginPerHour: 120, occupancyPercent: 50, marginSharePercent: null, byUnit: [] },
        ],
      },
    })
  );
  assert.equal(overview.byService[0].name, "Alto");
  assert.equal(overview.byService[0].profit, 600);
  assert.equal(overview.byService[1].name, "Baixo");
});

test("buildMoneyOverview: byProfessional é repassado ordenado por receita desc", () => {
  const overview = buildMoneyOverview(
    baseInputs({
      professionalRevenue: [
        { professionalId: 1, name: "Ana", revenue: 300, cost: 50, appointments: 3 },
        { professionalId: 2, name: "Bia", revenue: 900, cost: 100, appointments: 6 },
      ],
    })
  );
  assert.equal(overview.byProfessional[0].name, "Bia");
  assert.equal(overview.byProfessional[1].name, "Ana");
});

test("buildMoneyOverview: sempre devolve omittedNote explicando a ausência do degrau de descontos", () => {
  const overview = buildMoneyOverview(baseInputs());
  assert.ok(overview.omittedNote.length > 0);
});
