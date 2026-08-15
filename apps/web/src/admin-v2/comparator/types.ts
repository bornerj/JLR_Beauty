/** Admin V2 (PLAN-0023, Onda 4) — Comparador (RETROFIT-014). Espelha apps/api/src/modules/intelligence/comparator/types.ts. */

export type ComparatorMetricKey = "revenue" | "marginPercent" | "occupancyRate" | "avgTicket" | "recurrenceRate";

export type ComparatorUnitRow = {
  unitId: number;
  unitName: string;
  revenue: number;
  revenueTrendPercent: number;
  marginPercent: number;
  occupancyRate: number;
  avgTicket: number;
  recurrenceRate: number;
};

export type ComparatorNetworkRow = {
  unitName: "Rede";
  revenue: number;
  marginPercent: number;
  occupancyRate: number;
  avgTicket: number;
  recurrenceRate: number;
};

export type ComparatorRevenueDifference = { amount: number; explanation: string } | null;

export type ComparatorGap = {
  metric: ComparatorMetricKey;
  metricLabel: string;
  bestUnitName: string;
  bestValue: number;
  worstUnitName: string;
  worstValue: number;
  relativeSpreadPercent: number;
  estimatedRevenueDifference: ComparatorRevenueDifference;
  explanation: string;
};

export type UnitComparator = {
  period: { from: string; to: string; days: number };
  units: ComparatorUnitRow[];
  network: ComparatorNetworkRow;
  biggestGap: ComparatorGap | null;
};
