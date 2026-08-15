import assert from "node:assert/strict";
import { test } from "node:test";
import { buildUnitComparator } from "./rules";
import type { ComparatorInputs, ComparatorUnitRow, UnitOccupancyRaw } from "./types";

const PERIOD = { from: "2026-07-01T00:00:00.000Z", to: "2026-07-30T23:59:59.999Z", days: 30 };

const unit = (overrides: Partial<ComparatorUnitRow> & { unitId: number; unitName: string }): ComparatorUnitRow => ({
  revenue: 0,
  revenueTrendPercent: 0,
  marginPercent: 0,
  occupancyRate: 0,
  avgTicket: 0,
  recurrenceRate: 0,
  ...overrides,
});

const occ = (overrides: Partial<UnitOccupancyRaw> & { unitId: number }): UnitOccupancyRaw => ({
  availableMinutes: 0,
  bookedMinutes: 0,
  unitRevenuePerBookedHour: null,
  ...overrides,
});

const baseInputs = (overrides: Partial<ComparatorInputs> = {}): ComparatorInputs => ({
  period: PERIOD,
  units: [],
  occupancyRaw: [],
  networkRevenue: 0,
  networkMarginPercent: 0,
  networkAvgTicket: 0,
  ...overrides,
});

test("buildUnitComparator: com menos de 2 unidades, biggestGap é null (nada pra comparar)", () => {
  const result = buildUnitComparator(baseInputs({ units: [unit({ unitId: 1, unitName: "Única" })] }));
  assert.equal(result.biggestGap, null);
  assert.equal(result.network.unitName, "Rede");
});

test("buildUnitComparator: zero unidades também não quebra", () => {
  const result = buildUnitComparator(baseInputs());
  assert.equal(result.biggestGap, null);
  assert.equal(result.units.length, 0);
});

test("buildUnitComparator: acha a métrica com maior spread relativo à rede", () => {
  const result = buildUnitComparator(
    baseInputs({
      units: [
        unit({ unitId: 1, unitName: "A", revenue: 1000, marginPercent: 20, occupancyRate: 50 }),
        unit({ unitId: 2, unitName: "B", revenue: 1100, marginPercent: 60, occupancyRate: 55 }), // margem varia muito mais (relativo) que receita/ocupação
      ],
      networkRevenue: 2100,
      networkMarginPercent: 40,
    })
  );
  assert.ok(result.biggestGap);
  assert.equal(result.biggestGap?.metric, "marginPercent");
  assert.equal(result.biggestGap?.bestUnitName, "B");
  assert.equal(result.biggestGap?.worstUnitName, "A");
});

test("buildUnitComparator: gap de Ocupação ganha estimativa de R$; outras métricas não", () => {
  const result = buildUnitComparator(
    baseInputs({
      units: [
        unit({ unitId: 1, unitName: "Fraca", occupancyRate: 40 }),
        unit({ unitId: 2, unitName: "Forte", occupancyRate: 90 }),
      ],
      occupancyRaw: [
        occ({ unitId: 1, availableMinutes: 6000, bookedMinutes: 2400, unitRevenuePerBookedHour: 120 }),
        occ({ unitId: 2, availableMinutes: 6000, bookedMinutes: 5400, unitRevenuePerBookedHour: 150 }),
      ],
    })
  );
  assert.equal(result.biggestGap?.metric, "occupancyRate");
  assert.ok(result.biggestGap?.estimatedRevenueDifference);
  // extraMinutes = 6000 * (90-40)/100 = 3000; amount = 3000/60 * 120 = 6000
  assert.equal(result.biggestGap?.estimatedRevenueDifference?.amount, 6000);
});

test("buildUnitComparator: gap que não é Ocupação nunca fabrica uma estimativa de R$", () => {
  const result = buildUnitComparator(
    baseInputs({
      units: [
        unit({ unitId: 1, unitName: "A", avgTicket: 50 }),
        unit({ unitId: 2, unitName: "B", avgTicket: 500 }),
      ],
      networkAvgTicket: 275,
    })
  );
  assert.equal(result.biggestGap?.metric, "avgTicket");
  assert.equal(result.biggestGap?.estimatedRevenueDifference, null);
  assert.ok(result.biggestGap?.explanation.includes("sem fórmula confiável"));
});

test("buildUnitComparator: métrica empatada entre todas as unidades é ignorada no ranking do gap", () => {
  const result = buildUnitComparator(
    baseInputs({
      units: [
        unit({ unitId: 1, unitName: "A", revenue: 500, marginPercent: 30 }),
        unit({ unitId: 2, unitName: "B", revenue: 500, marginPercent: 55 }),
      ],
      networkRevenue: 1000,
      networkMarginPercent: 42.5,
    })
  );
  // receita empatada -> não pode ser o gap vencedor mesmo sendo avaliada primeiro
  assert.notEqual(result.biggestGap?.metric, "revenue");
  assert.equal(result.biggestGap?.metric, "marginPercent");
});

test("buildUnitComparator: ocupação da rede é bookedMinutes/availableMinutes agregados, não média das unidades", () => {
  const result = buildUnitComparator(
    baseInputs({
      units: [
        unit({ unitId: 1, unitName: "A", occupancyRate: 100 }),
        unit({ unitId: 2, unitName: "B", occupancyRate: 0 }),
      ],
      occupancyRaw: [
        occ({ unitId: 1, availableMinutes: 1000, bookedMinutes: 1000 }),
        occ({ unitId: 2, availableMinutes: 9000, bookedMinutes: 0 }),
      ],
    })
  );
  // (1000+0)/(1000+9000)*100 = 10%, não a média simples 50%
  assert.equal(result.network.occupancyRate, 10);
});

test("buildUnitComparator: recorrência da rede é média simples entre unidades", () => {
  const result = buildUnitComparator(
    baseInputs({
      units: [
        unit({ unitId: 1, unitName: "A", recurrenceRate: 20 }),
        unit({ unitId: 2, unitName: "B", recurrenceRate: 80 }),
      ],
    })
  );
  assert.equal(result.network.recurrenceRate, 50);
});
