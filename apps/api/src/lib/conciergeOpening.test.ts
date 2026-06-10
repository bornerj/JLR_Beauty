import assert from "node:assert/strict";
import test from "node:test";
import { buildOpeningGreeting, getGreetingByHour } from "./conciergeOpening";

test("getGreetingByHour returns Bom Dia between 05:00 and 11:59", () => {
  assert.equal(getGreetingByHour(new Date(2026, 1, 14, 5, 0, 0)), "Bom Dia");
  assert.equal(getGreetingByHour(new Date(2026, 1, 14, 11, 59, 59)), "Bom Dia");
});

test("getGreetingByHour returns Boa Tarde between 12:00 and 17:59", () => {
  assert.equal(getGreetingByHour(new Date(2026, 1, 14, 12, 0, 0)), "Boa Tarde");
  assert.equal(getGreetingByHour(new Date(2026, 1, 14, 17, 59, 59)), "Boa Tarde");
});

test("getGreetingByHour returns Boa Noite outside day and afternoon windows", () => {
  assert.equal(getGreetingByHour(new Date(2026, 1, 14, 18, 0, 0)), "Boa Noite");
  assert.equal(getGreetingByHour(new Date(2026, 1, 14, 4, 59, 59)), "Boa Noite");
});

test("buildOpeningGreeting composes greeting + welcome + treatment question", () => {
  assert.equal(
    buildOpeningGreeting(new Date(2026, 1, 14, 9, 30, 0)),
    "Bom Dia! Seja bem vinda.\nQual tratamento deseja fazer hoje?"
  );
});

test("buildOpeningGreeting composes greeting with first name when customer already exists", () => {
  assert.equal(
    buildOpeningGreeting(new Date(2026, 1, 14, 20, 30, 0), "Fulano de Tal"),
    "Boa Noite Fulano, seja bem vinda.\nQual tratamento deseja fazer hoje?"
  );
});
