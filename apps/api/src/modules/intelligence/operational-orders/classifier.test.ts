import assert from "node:assert/strict";
import test from "node:test";
import { classifyOrder } from "./classifier";

const hoursAgo = (hours: number, from: Date): Date => new Date(from.getTime() - hours * 60 * 60 * 1000);

const NOW = new Date("2026-08-13T12:00:00.000Z");

test("classifyOrder: pedido nao pago (sem paymentConfirmedAt) e NORMAL, mesmo se antigo", () => {
  const result = classifyOrder(
    { status: "PENDENTE", fulfillmentStatus: "PENDENTE", paymentConfirmedAt: null, fulfillmentNotes: null },
    NOW
  );
  assert.equal(result.state, "NORMAL");
  assert.equal(result.reason, null);
});

test("classifyOrder: pedido entregue e sempre NORMAL, mesmo pago ha muito tempo", () => {
  const result = classifyOrder(
    {
      status: "PAGO",
      fulfillmentStatus: "ENTREGUE",
      paymentConfirmedAt: hoursAgo(200, NOW),
      fulfillmentNotes: null,
    },
    NOW
  );
  assert.equal(result.state, "NORMAL");
});

test("classifyOrder: pedido cancelado e sempre NORMAL", () => {
  const result = classifyOrder(
    {
      status: "PAGO",
      fulfillmentStatus: "CANCELADO",
      paymentConfirmedAt: hoursAgo(200, NOW),
      fulfillmentNotes: null,
    },
    NOW
  );
  assert.equal(result.state, "NORMAL");
});

test("classifyOrder: pago ha menos de 12h e NORMAL", () => {
  const result = classifyOrder(
    { status: "PAGO", fulfillmentStatus: "PENDENTE", paymentConfirmedAt: hoursAgo(5, NOW), fulfillmentNotes: null },
    NOW
  );
  assert.equal(result.state, "NORMAL");
});

test("classifyOrder: pago ha 13h vira ATTENTION (limiar de 12h)", () => {
  const result = classifyOrder(
    { status: "PAGO", fulfillmentStatus: "SEPARANDO", paymentConfirmedAt: hoursAgo(13, NOW), fulfillmentNotes: null },
    NOW
  );
  assert.equal(result.state, "ATTENTION");
  assert.ok(result.reason && result.reason.includes("13h"));
});

test("classifyOrder: pago ha 30h e separacao nunca comecou (PENDENTE) vira STALLED", () => {
  const result = classifyOrder(
    { status: "PAGO", fulfillmentStatus: "PENDENTE", paymentConfirmedAt: hoursAgo(30, NOW), fulfillmentNotes: null },
    NOW
  );
  assert.equal(result.state, "STALLED");
  assert.ok(result.reason && result.reason.includes("separação"));
});

test("classifyOrder: pago ha 30h mas ja separou (SEPARANDO) NAO e STALLED, cai em ATTENTION", () => {
  const result = classifyOrder(
    { status: "PAGO", fulfillmentStatus: "SEPARANDO", paymentConfirmedAt: hoursAgo(30, NOW), fulfillmentNotes: null },
    NOW
  );
  assert.equal(result.state, "ATTENTION");
});

test("classifyOrder: pago ha 80h vira OVERDUE independente do fulfillmentStatus (exceto entregue/cancelado)", () => {
  const result = classifyOrder(
    { status: "PAGO", fulfillmentStatus: "EMBALADO", paymentConfirmedAt: hoursAgo(80, NOW), fulfillmentNotes: null },
    NOW
  );
  assert.equal(result.state, "OVERDUE");
});

test("classifyOrder: fulfillmentNotes com [ESTOQUE] e sempre BLOCKED, mesmo pago ha pouco tempo", () => {
  const result = classifyOrder(
    {
      status: "PAGO",
      fulfillmentStatus: "PENDENTE",
      paymentConfirmedAt: hoursAgo(1, NOW),
      fulfillmentNotes: "[ESTOQUE] resolver manualmente",
    },
    NOW
  );
  assert.equal(result.state, "BLOCKED");
});

test("classifyOrder: BLOCKED tem prioridade sobre OVERDUE quando os dois se aplicariam", () => {
  const result = classifyOrder(
    {
      status: "PAGO",
      fulfillmentStatus: "PENDENTE",
      paymentConfirmedAt: hoursAgo(100, NOW),
      fulfillmentNotes: "[ESTOQUE] resolver manualmente",
    },
    NOW
  );
  assert.equal(result.state, "BLOCKED");
});

test("classifyOrder: sempre devolve um motivo textual quando o estado nao e NORMAL (regra de explicabilidade)", () => {
  const states = [
    { status: "PAGO", fulfillmentStatus: "SEPARANDO", paymentConfirmedAt: hoursAgo(13, NOW), fulfillmentNotes: null },
    { status: "PAGO", fulfillmentStatus: "PENDENTE", paymentConfirmedAt: hoursAgo(30, NOW), fulfillmentNotes: null },
    { status: "PAGO", fulfillmentStatus: "EMBALADO", paymentConfirmedAt: hoursAgo(80, NOW), fulfillmentNotes: null },
  ];
  for (const order of states) {
    const result = classifyOrder(order, NOW);
    assert.notEqual(result.state, "NORMAL");
    assert.ok(typeof result.reason === "string" && result.reason.length > 0);
  }
});
