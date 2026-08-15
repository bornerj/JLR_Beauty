/**
 * Admin V2 (PLAN-0023, Onda 4) — Comparador Visual de Unidades (RETROFIT-014).
 * Contrato único do módulo (mesmo padrão de `radar/types.ts`, `gargalos/types.ts` e
 * `money/types.ts`): `rules.ts` (puro) e `service.ts` (Prisma) importam daqui.
 */

/** As 5 dimensões do mockup original (`retrofit/RETROFIT-014.md`) — todas já calculadas pela Onda 1 (Health Score) + `avgTicket` do PLAN-0020. */
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

/** Mesmas 5 dimensões, agregadas para a rede inteira — coluna "REDE" do mockup. */
export type ComparatorNetworkRow = {
  unitName: "Rede";
  revenue: number;
  marginPercent: number;
  occupancyRate: number;
  avgTicket: number;
  recurrenceRate: number;
};

export type ComparatorRevenueDifference = { amount: number; explanation: string } | null;

/**
 * A métrica com maior diferença relativa entre a melhor e a pior unidade do escopo
 * (governança #6 — nunca só o rótulo, sempre a composição). `estimatedRevenueDifference`
 * só é calculado quando a métrica é Ocupação (única com fórmula de conversão pra R$ já
 * validada, reusada do drill-down de horário da Onda 4) — nas demais fica `null` com
 * explicação honesta de por que não foi estimado.
 */
export type ComparatorGap = {
  metric: ComparatorMetricKey;
  metricLabel: string;
  bestUnitName: string;
  bestValue: number;
  worstUnitName: string;
  worstValue: number;
  /** (melhor - pior) / valor da rede nesta métrica, em % — só para RANKEAR qual métrica tem a maior diferença, não é ela própria a explicação. */
  relativeSpreadPercent: number;
  estimatedRevenueDifference: ComparatorRevenueDifference;
  explanation: string;
};

export type UnitComparator = {
  period: { from: string; to: string; days: number };
  units: ComparatorUnitRow[];
  network: ComparatorNetworkRow;
  /** null quando o escopo tem menos de 2 unidades — não há o que comparar. */
  biggestGap: ComparatorGap | null;
};

/** Totais brutos de ocupação de uma unidade no período — usados só para a estimativa de R$ do gap de Ocupação. */
export type UnitOccupancyRaw = {
  unitId: number;
  availableMinutes: number;
  bookedMinutes: number;
  /** Mesmo campo de `CapacityHeatmap.unitRevenuePerBookedHour` (Onda 4) — null quando a unidade não teve nenhuma reserva no período. */
  unitRevenuePerBookedHour: number | null;
};

/** Entradas já buscadas do Prisma pelo `service.ts`, delegadas para a função pura `buildUnitComparator()`. */
export type ComparatorInputs = {
  period: { from: string; to: string; days: number };
  units: ComparatorUnitRow[];
  occupancyRaw: UnitOccupancyRaw[];
  networkRevenue: number;
  networkMarginPercent: number;
  networkAvgTicket: number;
};
