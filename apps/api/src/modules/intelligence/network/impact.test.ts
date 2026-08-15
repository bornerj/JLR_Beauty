import assert from "node:assert/strict";
import { test } from "node:test";
import { estimateWeaknessImpact } from "./impact";

test("estimateWeaknessImpact: ocupação com horas ociosas e receita real → estimativa positiva", () => {
  const result = estimateWeaknessImpact({
    weaknessKey: "occupancy",
    occupancy: { availableMinutes: 6000, bookedMinutes: 2400 },
    revenue: 4800,
  });
  // revenuePerBookedHour = 4800 / (2400/60) = 120; idleMinutes = 3600 -> (3600/60)*120 = 7200
  assert.deepEqual(result, {
    amount: 7200,
    explanation: "horas ociosas da agenda × receita média por hora reservada no período selecionado",
  });
});

test("estimateWeaknessImpact: ocupação sem minutos ociosos → null (não fabrica número)", () => {
  const result = estimateWeaknessImpact({
    weaknessKey: "occupancy",
    occupancy: { availableMinutes: 1000, bookedMinutes: 1000 },
    revenue: 1000,
  });
  assert.equal(result, null);
});

test("estimateWeaknessImpact: ocupação sem nenhuma reserva (bookedMinutes 0) → null", () => {
  const result = estimateWeaknessImpact({
    weaknessKey: "occupancy",
    occupancy: { availableMinutes: 1000, bookedMinutes: 0 },
    revenue: 0,
  });
  assert.equal(result, null);
});

for (const weaknessKey of ["profitability", "growth", "recurrence", "inventory", "subscriptions"] as const) {
  test(`estimateWeaknessImpact: ${weaknessKey} nunca fabrica número — sempre null`, () => {
    const result = estimateWeaknessImpact({
      weaknessKey,
      occupancy: { availableMinutes: 6000, bookedMinutes: 1000 },
      revenue: 5000,
    });
    assert.equal(result, null);
  });
}
