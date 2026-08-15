import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyCustomer } from "./classifier";
import type { ClassificationPeriod, CustomerRawSignals } from "./types";

/** Admin V2 (PLAN-0022, Onda 7) — testes da classificação de fluxo de clientes (RETROFIT-008). */

const PERIOD: ClassificationPeriod = {
  currentFrom: new Date("2026-08-01T00:00:00"),
  currentTo: new Date("2026-08-31T23:59:59"),
  previousFrom: new Date("2026-07-01T00:00:00"),
  previousTo: new Date("2026-07-31T23:59:59"),
};

const signals = (overrides: Partial<CustomerRawSignals> = {}): CustomerRawSignals => ({
  key: "cliente@teste.com",
  name: "Cliente Teste",
  email: "cliente@teste.com",
  phone: null,
  firstActivityAt: new Date("2026-01-01T00:00:00"),
  lastActivityAt: new Date("2026-08-15T00:00:00"),
  activityCountTotal: 3,
  activityCountCurrentPeriod: 1,
  activityCountPreviousPeriod: 1,
  hasRecentCancellation: false,
  isSubscriptionDelinquent: false,
  ...overrides,
});

test("classifyCustomer — primeira atividade no período atual vira NOVO, mesmo com outros sinais presentes", () => {
  const result = classifyCustomer(
    signals({ firstActivityAt: new Date("2026-08-10T00:00:00"), activityCountTotal: 1, activityCountPreviousPeriod: 0, hasRecentCancellation: true }),
    PERIOD
  );
  assert.equal(result.state, "NOVO");
});

test("classifyCustomer — cancelamento recente vira EM_RISCO mesmo com atividade normal nos dois períodos", () => {
  const result = classifyCustomer(signals({ hasRecentCancellation: true }), PERIOD);
  assert.equal(result.state, "EM_RISCO");
  assert.match(result.reason, /cancelad/i);
});

test("classifyCustomer — assinatura inadimplente vira EM_RISCO", () => {
  const result = classifyCustomer(signals({ isSubscriptionDelinquent: true }), PERIOD);
  assert.equal(result.state, "EM_RISCO");
  assert.match(result.reason, /inadimplente/i);
});

test("classifyCustomer — ativo no período anterior e sumiu no atual vira EM_RISCO (atraso de ciclo)", () => {
  const result = classifyCustomer(signals({ activityCountCurrentPeriod: 0, activityCountPreviousPeriod: 2 }), PERIOD);
  assert.equal(result.state, "EM_RISCO");
  assert.match(result.reason, /ciclo de retorno atrasado/i);
});

test("classifyCustomer — queda de frequência entre períodos (ativo nos dois, mas menos) vira EM_RISCO", () => {
  const result = classifyCustomer(signals({ activityCountCurrentPeriod: 1, activityCountPreviousPeriod: 5 }), PERIOD);
  assert.equal(result.state, "EM_RISCO");
  assert.match(result.reason, /Frequência caiu/);
});

test("classifyCustomer — sem atividade nos dois períodos vira INATIVO", () => {
  const result = classifyCustomer(signals({ activityCountCurrentPeriod: 0, activityCountPreviousPeriod: 0 }), PERIOD);
  assert.equal(result.state, "INATIVO");
});

test("classifyCustomer — cancelamento recente tem prioridade sobre INATIVO quando os dois seriam verdade", () => {
  const result = classifyCustomer(
    signals({ activityCountCurrentPeriod: 0, activityCountPreviousPeriod: 0, hasRecentCancellation: true }),
    PERIOD
  );
  assert.equal(result.state, "EM_RISCO"); // sinal específico e acionável vence "sumiu genérico"
});

test("classifyCustomer — atividade nos dois períodos sem sinal de risco vira RECORRENTE", () => {
  const result = classifyCustomer(signals({ activityCountCurrentPeriod: 2, activityCountPreviousPeriod: 1 }), PERIOD);
  assert.equal(result.state, "RECORRENTE");
});

test("classifyCustomer — ativo só no período atual (sem histórico no anterior) vira ATIVO, não RECORRENTE", () => {
  const result = classifyCustomer(signals({ activityCountCurrentPeriod: 1, activityCountPreviousPeriod: 0 }), PERIOD);
  assert.equal(result.state, "ATIVO");
});

test("classifyCustomer — reason nunca é vazio, para qualquer estado (governança #6)", () => {
  const cases: Array<Partial<CustomerRawSignals>> = [
    { firstActivityAt: new Date("2026-08-05T00:00:00") },
    { hasRecentCancellation: true },
    { activityCountCurrentPeriod: 0, activityCountPreviousPeriod: 2 },
    { activityCountCurrentPeriod: 0, activityCountPreviousPeriod: 0 },
    { activityCountCurrentPeriod: 2, activityCountPreviousPeriod: 1 },
    { activityCountCurrentPeriod: 1, activityCountPreviousPeriod: 0 },
  ];
  for (const overrides of cases) {
    const result = classifyCustomer(signals(overrides), PERIOD);
    assert.ok(result.reason.length > 0, `estado ${result.state} sem reason`);
  }
});
