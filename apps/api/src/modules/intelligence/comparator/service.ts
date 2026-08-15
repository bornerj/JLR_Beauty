import prisma from "../../../lib/prisma";
import { getSalesInsights } from "../../admin/kpis/dashboardSalesInsights";
import { resolveAdminPeriodRange, type AdminPeriodInput } from "../../admin/kpis/period";
import { getCapacityHeatmap } from "../capacity/service";
import { getUnitsHealth } from "../unit-health/service";
import { buildUnitComparator } from "./rules";
import type { ComparatorUnitRow, UnitComparator, UnitOccupancyRaw } from "./types";

const round1 = (value: number): number => Math.round(value * 10) / 10;

/**
 * Admin V2 (PLAN-0023, Onda 4) — Comparador Visual de Unidades (RETROFIT-014).
 * Reusa integralmente o Health Score (Onda 1: `getUnitsHealth`, dá receita/margem/
 * tendência/ocupação/recorrência de graça) + `getSalesInsights` (PLAN-0020, só pra
 * `avgTicket` por unidade, único dado que faltava) + `getCapacityHeatmap` (Onda 4, só pra
 * `unitRevenuePerBookedHour`, necessário para a estimativa de R$ do gap de Ocupação).
 * Nenhuma query nova além do já existente — não recalcula nada.
 */
export const getUnitComparator = async (input: AdminPeriodInput): Promise<UnitComparator> => {
  const range = resolveAdminPeriodRange(input);
  const periodArgs = { from: range.from.toISOString(), to: range.to.toISOString() };

  const units = await prisma.unit.findMany({ select: { id: true, name: true }, orderBy: { id: "asc" } });

  const [unitsHealth, salesInsightsByUnit, heatmaps, networkSalesInsights] = await Promise.all([
    getUnitsHealth(input),
    Promise.all(units.map((unit) => getSalesInsights({ ...periodArgs, unitId: unit.id }))),
    Promise.all(units.map((unit) => getCapacityHeatmap({ ...input, unitId: unit.id }))),
    getSalesInsights(periodArgs),
  ]);

  const comparatorUnits: ComparatorUnitRow[] = units.map((unit, index) => {
    const health = unitsHealth.find((h) => h.unitId === unit.id);
    return {
      unitId: unit.id,
      unitName: unit.name,
      revenue: health?.raw.revenue ?? 0,
      revenueTrendPercent: round1(health?.raw.revenueTrendPercent ?? 0),
      marginPercent: round1(health?.raw.marginPercent ?? 0),
      occupancyRate: round1(health?.occupancy.occupancyRate ?? 0),
      avgTicket: salesInsightsByUnit[index].totals.avgTicket,
      recurrenceRate: round1(health?.raw.recurrenceRate ?? 0),
    };
  });

  const occupancyRaw: UnitOccupancyRaw[] = units.map((unit, index) => {
    const health = unitsHealth.find((h) => h.unitId === unit.id);
    return {
      unitId: unit.id,
      availableMinutes: health?.occupancy.availableMinutes ?? 0,
      bookedMinutes: health?.occupancy.bookedMinutes ?? 0,
      unitRevenuePerBookedHour: heatmaps[index].unitRevenuePerBookedHour,
    };
  });

  return buildUnitComparator({
    period: { from: range.from.toISOString(), to: range.to.toISOString(), days: range.days },
    units: comparatorUnits,
    occupancyRaw,
    networkRevenue: networkSalesInsights.totals.revenue,
    networkMarginPercent: networkSalesInsights.totals.marginPercent,
    networkAvgTicket: networkSalesInsights.totals.avgTicket,
  });
};
