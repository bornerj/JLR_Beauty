import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCapacityDays, dateKey, overlapMinutes } from "./heatmap";
import type { AppointmentRow, ShiftRow } from "./types";

/** Admin V2 (PLAN-0022, Onda 4) — testes da agregação pura dia×hora (RETROFIT-005). */

const day = (isoDate: string): Date => new Date(`${isoDate}T00:00:00`);
const at = (isoDate: string, time: string): Date => new Date(`${isoDate}T${time}:00`);

const shift = (overrides: Partial<ShiftRow> = {}): ShiftRow => ({
  professionalId: 1,
  professionalName: "Ana",
  workDate: day("2026-08-10"),
  startMinutes: 9 * 60,
  endMinutes: 18 * 60,
  ...overrides,
});

const appointment = (overrides: Partial<AppointmentRow> = {}): AppointmentRow => ({
  id: 1,
  professionalId: 1,
  professionalName: "Ana",
  clientName: "Cliente",
  serviceName: "Corte",
  servicePrice: 100,
  start: at("2026-08-10", "10:00"),
  end: at("2026-08-10", "11:00"),
  ...overrides,
});

test("overlapMinutes — sem sobreposição", () => {
  assert.equal(overlapMinutes(0, 60, 60, 120), 0);
  assert.equal(overlapMinutes(120, 180, 0, 60), 0);
});

test("overlapMinutes — sobreposição total e parcial", () => {
  assert.equal(overlapMinutes(0, 60, 0, 60), 60);
  assert.equal(overlapMinutes(0, 90, 60, 120), 30);
  assert.equal(overlapMinutes(30, 90, 0, 60), 30);
});

test("dateKey — formata em horário local, não UTC", () => {
  assert.equal(dateKey(day("2026-08-10")), "2026-08-10");
});

test("buildCapacityDays — sem nenhuma escala no período devolve grade vazia (nunca fabrica disponibilidade)", () => {
  const result = buildCapacityDays([], [], day("2026-08-10"), day("2026-08-10"));
  assert.deepEqual(result, { days: [], hourRange: null, unitRevenuePerBookedHour: null });
});

test("buildCapacityDays — 1 escala sem reservas: disponível > 0, ocupação 0, revenuePerBookedHour null", () => {
  const result = buildCapacityDays([shift()], [], day("2026-08-10"), day("2026-08-10"));
  assert.equal(result.days.length, 1);
  assert.deepEqual(result.hourRange, { start: 9, end: 18 });
  assert.equal(result.unitRevenuePerBookedHour, null);

  const slot10h = result.days[0].slots.find((s) => s.hour === 10);
  assert.ok(slot10h);
  assert.equal(slot10h!.availableMinutes, 60);
  assert.equal(slot10h!.bookedMinutes, 0);
  assert.equal(slot10h!.occupancyRate, 0);
  assert.equal(slot10h!.revenuePerBookedHour, null);
  assert.equal(slot10h!.revenuePerAvailableHour, 0); // capacidade existe, receita realizada é 0 — não é null, é um fato calculado
});

test("buildCapacityDays — agendamento contido em 1 hora: ocupação e receita batem no bucket certo", () => {
  const result = buildCapacityDays([shift()], [appointment()], day("2026-08-10"), day("2026-08-10"));
  const slot10h = result.days[0].slots.find((s) => s.hour === 10)!;
  assert.equal(slot10h.bookedMinutes, 60);
  assert.equal(slot10h.occupancyRate, 100);
  assert.equal(slot10h.revenueActual, 100);
  assert.equal(slot10h.revenuePerBookedHour, 100);
  assert.equal(result.unitRevenuePerBookedHour, 100);

  const slot9h = result.days[0].slots.find((s) => s.hour === 9)!;
  assert.equal(slot9h.bookedMinutes, 0);
});

test("buildCapacityDays — agendamento cruzando 2 horas prorateia a receita proporcionalmente", () => {
  const appt = appointment({ start: at("2026-08-10", "10:30"), end: at("2026-08-10", "11:30"), servicePrice: 120 });
  const result = buildCapacityDays([shift()], [appt], day("2026-08-10"), day("2026-08-10"));

  const slot10h = result.days[0].slots.find((s) => s.hour === 10)!;
  const slot11h = result.days[0].slots.find((s) => s.hour === 11)!;
  assert.equal(slot10h.bookedMinutes, 30);
  assert.equal(slot11h.bookedMinutes, 30);
  assert.equal(slot10h.revenueActual, 60);
  assert.equal(slot11h.revenueActual, 60);
  assert.equal(slot10h.revenueActual + slot11h.revenueActual, 120); // soma bate com o preço cheio do serviço
});

test("buildCapacityDays — 2 profissionais na mesma hora somam disponibilidade", () => {
  const result = buildCapacityDays(
    [shift({ professionalId: 1 }), shift({ professionalId: 2, professionalName: "Bia" })],
    [],
    day("2026-08-10"),
    day("2026-08-10")
  );
  const slot10h = result.days[0].slots.find((s) => s.hour === 10)!;
  assert.equal(slot10h.availableMinutes, 120);
});

test("buildCapacityDays — intervalo de vários dias gera 1 entrada por dia, mesmo sem escala num dia específico", () => {
  const result = buildCapacityDays([shift()], [], day("2026-08-10"), day("2026-08-12"));
  assert.equal(result.days.length, 3);
  assert.deepEqual(
    result.days.map((d) => d.date),
    ["2026-08-10", "2026-08-11", "2026-08-12"]
  );
  // dias 11 e 12 não têm escala própria nesta massa de teste: disponível 0 em todos os slots.
  assert.ok(result.days[1].slots.every((s) => s.availableMinutes === 0));
});
