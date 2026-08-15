import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyServicePerformance, median } from "./classifier";
import type { ServiceTotals } from "./types";

/** Admin V2 (PLAN-0022, Onda 6) — testes da matriz demanda×margem/hora (RETROFIT-007). */

const service = (overrides: Partial<ServiceTotals> = {}): ServiceTotals => ({
  serviceId: 1,
  name: "Serviço",
  appointments: 0,
  bookedMinutes: 0,
  revenue: 0,
  cost: 0,
  byUnit: [],
  ...overrides,
});

test("median — ímpar, par e vazio", () => {
  assert.equal(median([]), 0);
  assert.equal(median([5]), 5);
  assert.equal(median([1, 3, 2]), 2);
  assert.equal(median([1, 2, 3, 4]), 2.5);
});

test("classifyServicePerformance — serviço sem nenhum agendamento vira SEM_DEMANDA, nunca fabrica margem/hora", () => {
  const result = classifyServicePerformance([service({ serviceId: 1, name: "Parado" })], 1000);
  const item = result.services[0];
  assert.equal(item.quadrant, "SEM_DEMANDA");
  assert.equal(item.marginPerHour, null);
  assert.equal(item.occupancyPercent, 0);
});

test("classifyServicePerformance — alta demanda + alta margem/hora vira ESTRELA", () => {
  // 600min ocupam 60% de 1000min disponíveis; margem/hora = (6000-1200)/(600/60) = 480
  const a = service({ serviceId: 1, name: "A", appointments: 10, bookedMinutes: 600, revenue: 6000, cost: 1200 });
  // 60min ocupam 6%; margem/hora = (300-270)/(60/60) = 30
  const b = service({ serviceId: 2, name: "B", appointments: 2, bookedMinutes: 60, revenue: 300, cost: 270 });
  const result = classifyServicePerformance([a, b], 1000);
  const star = result.services.find((s) => s.serviceId === 1)!;
  assert.equal(star.quadrant, "ESTRELA");
});

test("classifyServicePerformance — alta demanda + baixa margem/hora vira ARMADILHA (ocupa muito, rende pouco/hora)", () => {
  const busyCheap = service({ serviceId: 1, name: "OcupaMuitoRendePouco", appointments: 20, bookedMinutes: 800, revenue: 4000, cost: 3800 }); // margem/hora=15
  const reference = service({ serviceId: 2, name: "Referencia", appointments: 2, bookedMinutes: 60, revenue: 600, cost: 100 }); // margem/hora=500
  const result = classifyServicePerformance([busyCheap, reference], 1000);
  const trap = result.services.find((s) => s.serviceId === 1)!;
  assert.equal(trap.quadrant, "ARMADILHA");
});

test("classifyServicePerformance — baixa demanda + alta margem/hora vira JOIA", () => {
  const rare = service({ serviceId: 1, name: "Joia", appointments: 1, bookedMinutes: 30, revenue: 500, cost: 50 }); // margem/hora=900
  const common = service({ serviceId: 2, name: "Comum", appointments: 20, bookedMinutes: 700, revenue: 3500, cost: 2800 }); // margem/hora=60
  const result = classifyServicePerformance([rare, common], 1000);
  const jewel = result.services.find((s) => s.serviceId === 1)!;
  assert.equal(jewel.quadrant, "JOIA");
});

test("classifyServicePerformance — baixa demanda + baixa margem/hora vira FRACO", () => {
  const weak = service({ serviceId: 1, name: "Fraco", appointments: 1, bookedMinutes: 20, revenue: 50, cost: 45 }); // margem/hora=15
  const strong = service({ serviceId: 2, name: "Forte", appointments: 10, bookedMinutes: 500, revenue: 5000, cost: 2000 }); // margem/hora=360
  const result = classifyServicePerformance([weak, strong], 1000);
  const item = result.services.find((s) => s.serviceId === 1)!;
  assert.equal(item.quadrant, "FRACO");
});

test("classifyServicePerformance — occupancyPercent/margem total batem com os totais agregados (consistência Onda 4/5)", () => {
  const a = service({ serviceId: 1, appointments: 5, bookedMinutes: 300, revenue: 3000, cost: 1000 });
  const b = service({ serviceId: 2, appointments: 5, bookedMinutes: 200, revenue: 2000, cost: 500 });
  const result = classifyServicePerformance([a, b], 1000);
  assert.equal(result.totalBookedMinutes, 500);
  assert.equal(result.totalMargin, (3000 - 1000) + (2000 - 500));
  const svcA = result.services.find((s) => s.serviceId === 1)!;
  assert.equal(svcA.occupancyPercent, 30); // 300/1000*100
  assert.equal(svcA.marginSharePercent, round1(((3000 - 1000) / result.totalMargin) * 100));
});

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
