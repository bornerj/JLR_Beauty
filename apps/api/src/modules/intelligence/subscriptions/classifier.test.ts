import assert from "node:assert/strict";
import { test } from "node:test";
import { classifySubscription } from "./classifier";
import type { ClassificationPeriod, SubscriptionRawSignals } from "./types";

/** Admin V2 (PLAN-0022, Onda 8) — testes da classificação de saúde de assinaturas (RETROFIT-009). */

const PERIOD: ClassificationPeriod = {
  currentFrom: new Date("2026-08-01T00:00:00"),
  currentTo: new Date("2026-08-31T23:59:59"),
  previousFrom: new Date("2026-07-01T00:00:00"),
  previousTo: new Date("2026-07-31T23:59:59"),
};

const signals = (overrides: Partial<SubscriptionRawSignals> = {}): SubscriptionRawSignals => ({
  subscriptionId: 1,
  membershipName: "Plano Premium",
  customerName: "Cliente Teste",
  customerEmail: "cliente@teste.com",
  customerPhone: null,
  status: "ATIVA",
  startedAt: new Date("2026-01-01T00:00:00"),
  cancelledAt: null,
  hasFailedPaymentCurrentPeriod: false,
  approvedPaymentsCurrentPeriod: 1,
  approvedPaymentsPreviousPeriod: 1,
  ...overrides,
});

test("classifySubscription — status CANCELADA vira SAINDO, sempre (critério de aceitação: churn bate com o status)", () => {
  const result = classifySubscription(signals({ status: "CANCELADA", cancelledAt: new Date("2026-08-10T00:00:00") }), PERIOD);
  assert.equal(result.state, "SAINDO");
});

test("classifySubscription — CANCELADA sem cancelledAt ainda vira SAINDO (nunca esconde o status real)", () => {
  const result = classifySubscription(signals({ status: "CANCELADA", cancelledAt: null }), PERIOD);
  assert.equal(result.state, "SAINDO");
});

test("classifySubscription — status PENDENTE vira ENTRANDO independente de startedAt", () => {
  const result = classifySubscription(signals({ status: "PENDENTE", startedAt: new Date("2020-01-01T00:00:00") }), PERIOD);
  assert.equal(result.state, "ENTRANDO");
});

test("classifySubscription — ATIVA iniciada no período atual vira ENTRANDO", () => {
  const result = classifySubscription(signals({ status: "ATIVA", startedAt: new Date("2026-08-15T00:00:00") }), PERIOD);
  assert.equal(result.state, "ENTRANDO");
});

test("classifySubscription — status INADIMPLENTE vira ATENCAO", () => {
  const result = classifySubscription(signals({ status: "INADIMPLENTE" }), PERIOD);
  assert.equal(result.state, "ATENCAO");
  assert.match(result.reason, /inadimplente/i);
});

test("classifySubscription — cobrança recusada no período vira ATENCAO", () => {
  const result = classifySubscription(signals({ hasFailedPaymentCurrentPeriod: true }), PERIOD);
  assert.equal(result.state, "ATENCAO");
  assert.match(result.reason, /recusada/i);
});

test("classifySubscription — queda de cobranças aprovadas vira ATENCAO", () => {
  const result = classifySubscription(signals({ approvedPaymentsCurrentPeriod: 0, approvedPaymentsPreviousPeriod: 1 }), PERIOD);
  assert.equal(result.state, "ATENCAO");
  assert.match(result.reason, /Uso caiu/);
});

test("classifySubscription — ATIVA sem sinal de risco vira SAUDAVEL", () => {
  const result = classifySubscription(signals(), PERIOD);
  assert.equal(result.state, "SAUDAVEL");
});

test("classifySubscription — INADIMPLENTE tem prioridade sobre queda de uso quando os dois seriam verdade", () => {
  const result = classifySubscription(
    signals({ status: "INADIMPLENTE", approvedPaymentsCurrentPeriod: 0, approvedPaymentsPreviousPeriod: 3 }),
    PERIOD
  );
  assert.equal(result.state, "ATENCAO");
  assert.match(result.reason, /inadimplente/i);
});

test("classifySubscription — reason nunca é vazio, para qualquer estado (governança #6)", () => {
  const cases: Array<Partial<SubscriptionRawSignals>> = [
    { status: "CANCELADA" },
    { status: "PENDENTE" },
    { status: "ATIVA", startedAt: new Date("2026-08-05T00:00:00") },
    { status: "INADIMPLENTE" },
    { hasFailedPaymentCurrentPeriod: true },
    { approvedPaymentsCurrentPeriod: 0, approvedPaymentsPreviousPeriod: 2 },
    {},
  ];
  for (const overrides of cases) {
    const result = classifySubscription(signals(overrides), PERIOD);
    assert.ok(result.reason.length > 0, `estado ${result.state} sem reason`);
  }
});
