import type { ComparatorGap, ComparatorInputs, ComparatorMetricKey, ComparatorNetworkRow, UnitComparator } from "./types";

const round1 = (value: number): number => Math.round(value * 10) / 10;
const round2 = (value: number): number => Math.round(value * 100) / 100;

type MetricDef = { key: ComparatorMetricKey; label: string };

const METRICS: MetricDef[] = [
  { key: "revenue", label: "Receita" },
  { key: "marginPercent", label: "Margem" },
  { key: "occupancyRate", label: "Ocupação" },
  { key: "avgTicket", label: "Ticket Médio" },
  { key: "recurrenceRate", label: "Recorrência" },
];

/**
 * Admin V2 (PLAN-0023, Onda 4) — função pura do Comparador de Unidades (RETROFIT-014).
 * Não recalcula nada: as 5 dimensões por unidade já vêm prontas do Health Score (Onda 1)
 * + `avgTicket` (PLAN-0020). Só (a) monta a linha "Rede", (b) acha a métrica com maior
 * diferença relativa entre unidades e (c) — só quando essa métrica é Ocupação — traduz o
 * gap para R$, reusando a mesma fórmula do drill-down de horário da Onda 4.
 */
export const buildUnitComparator = (inputs: ComparatorInputs): UnitComparator => {
  const { period, units, occupancyRaw, networkRevenue, networkMarginPercent, networkAvgTicket } = inputs;

  const totalAvailableMinutes = occupancyRaw.reduce((sum, u) => sum + u.availableMinutes, 0);
  const totalBookedMinutes = occupancyRaw.reduce((sum, u) => sum + u.bookedMinutes, 0);
  const networkOccupancyRate = totalAvailableMinutes > 0 ? round1((totalBookedMinutes / totalAvailableMinutes) * 100) : 0;

  // Recorrência da rede: média simples das taxas por unidade (não ponderada por volume de
  // clientes) — decisão documentada, mesma simplicidade já aceita na Onda 1 para este proxy.
  const networkRecurrenceRate =
    units.length > 0 ? round1(units.reduce((sum, u) => sum + u.recurrenceRate, 0) / units.length) : 0;

  const network: ComparatorNetworkRow = {
    unitName: "Rede",
    revenue: networkRevenue,
    marginPercent: networkMarginPercent,
    occupancyRate: networkOccupancyRate,
    avgTicket: networkAvgTicket,
    recurrenceRate: networkRecurrenceRate,
  };

  if (units.length < 2) {
    return { period, units, network, biggestGap: null };
  }

  const networkByMetric: Record<ComparatorMetricKey, number> = {
    revenue: network.revenue,
    marginPercent: network.marginPercent,
    occupancyRate: network.occupancyRate,
    avgTicket: network.avgTicket,
    recurrenceRate: network.recurrenceRate,
  };

  let biggestGap: ComparatorGap | null = null;
  let biggestSpread = -1;

  for (const metric of METRICS) {
    const values = units.map((unit) => ({ unit, value: unit[metric.key] }));
    const best = values.reduce((a, b) => (b.value > a.value ? b : a));
    const worst = values.reduce((a, b) => (b.value < a.value ? b : a));
    if (best.unit.unitId === worst.unit.unitId) continue; // todas as unidades empatadas nesta métrica

    const networkValue = networkByMetric[metric.key];
    const spread = networkValue > 0 ? Math.abs(((best.value - worst.value) / networkValue) * 100) : 0;
    if (spread <= biggestSpread) continue;
    biggestSpread = spread;

    let estimatedRevenueDifference: ComparatorGap["estimatedRevenueDifference"] = null;
    if (metric.key === "occupancyRate") {
      const worstRaw = occupancyRaw.find((raw) => raw.unitId === worst.unit.unitId);
      if (worstRaw && worstRaw.unitRevenuePerBookedHour !== null && worstRaw.availableMinutes > 0 && best.value > worst.value) {
        const extraMinutes = worstRaw.availableMinutes * ((best.value - worst.value) / 100);
        estimatedRevenueDifference = {
          amount: round2((extraMinutes / 60) * worstRaw.unitRevenuePerBookedHour),
          explanation: `se ${worst.unit.unitName} ocupasse a agenda na mesma taxa de ${best.unit.unitName} (${round1(best.value)}% vs ${round1(worst.value)}%), geraria essa receita a mais pela própria taxa média de receita/hora reservada de ${worst.unit.unitName} — mesma fórmula do drill-down de horário da Onda 4`,
        };
      }
    }

    biggestGap = {
      metric: metric.key,
      metricLabel: metric.label,
      bestUnitName: best.unit.unitName,
      bestValue: best.value,
      worstUnitName: worst.unit.unitName,
      worstValue: worst.value,
      relativeSpreadPercent: round1(spread),
      estimatedRevenueDifference,
      explanation: estimatedRevenueDifference
        ? estimatedRevenueDifference.explanation
        : `maior diferença relativa entre unidades está em "${metric.label}" — sem fórmula confiável de tradução para R$ para esta métrica ainda (só Ocupação tem essa conversão hoje)`,
    };
  }

  return { period, units, network, biggestGap };
};
