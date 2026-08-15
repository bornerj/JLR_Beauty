import type { ServicePerformance, ServiceQuadrant, ServiceTotals } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 6) — Performance de Serviços (RETROFIT-007).
 * Matriz demanda×margem/hora, pura (sem Prisma, testável isolada — mesmo padrão de
 * `portfolio/classifier.ts`). "Alto"/"baixo" são sempre relativos à MEDIANA do próprio
 * recorte pedido, nunca um número fixo (mesma justificativa do Portfólio de Produtos).
 */

const round1 = (value: number): number => Math.round(value * 10) / 10;
const round2 = (value: number): number => Math.round(value * 100) / 100;

export const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export type ServicePerformanceClassification = {
  services: ServicePerformance[];
  totalBookedMinutes: number;
  totalMargin: number;
  demandMedian: number;
  marginPerHourMedian: number | null;
};

export const classifyServicePerformance = (
  totals: ServiceTotals[],
  totalAvailableMinutes: number
): ServicePerformanceClassification => {
  const totalBookedMinutes = totals.reduce((sum, t) => sum + t.bookedMinutes, 0);
  const totalMargin = totals.reduce((sum, t) => sum + (t.revenue - t.cost), 0);

  const demanded = totals.filter((t) => t.appointments > 0);
  const occupancyOf = (t: ServiceTotals): number =>
    totalAvailableMinutes > 0 ? (t.bookedMinutes / totalAvailableMinutes) * 100 : 0;
  const marginPerHourOf = (t: ServiceTotals): number | null =>
    t.bookedMinutes > 0 ? (t.revenue - t.cost) / (t.bookedMinutes / 60) : null;

  const demandMedian = round1(median(demanded.map(occupancyOf)));
  const marginPerHourValues = demanded
    .map(marginPerHourOf)
    .filter((value): value is number => value !== null);
  const marginPerHourMedian = marginPerHourValues.length > 0 ? round2(median(marginPerHourValues)) : null;

  const services: ServicePerformance[] = totals.map((totalsRow) => {
    const occupancyPercent = round1(occupancyOf(totalsRow));
    const marginPerHourRaw = marginPerHourOf(totalsRow);
    const marginSharePercent = totalMargin > 0 ? round1(((totalsRow.revenue - totalsRow.cost) / totalMargin) * 100) : null;

    if (totalsRow.appointments === 0) {
      return {
        serviceId: totalsRow.serviceId,
        name: totalsRow.name,
        quadrant: "SEM_DEMANDA",
        appointments: 0,
        bookedMinutes: 0,
        revenue: 0,
        cost: 0,
        marginPercent: null,
        revenuePerHour: null,
        marginPerHour: null,
        occupancyPercent: 0,
        marginSharePercent,
        byUnit: totalsRow.byUnit,
      };
    }

    const revenuePerHour = round2(totalsRow.revenue / (totalsRow.bookedMinutes / 60));
    const marginPerHour = marginPerHourRaw !== null ? round2(marginPerHourRaw) : null;
    const marginPercent = totalsRow.revenue > 0 ? round1(((totalsRow.revenue - totalsRow.cost) / totalsRow.revenue) * 100) : 0;

    const highDemand = occupancyPercent >= demandMedian;
    // marginPerHourMedian só é null no caso degenerado de nenhum serviço demandado ter
    // bookedMinutes>0 (impossível se appointments>0, guarda defensiva mesmo assim) —
    // corte conservador é "baixa margem/hora".
    const highMarginPerHour = marginPerHourMedian !== null && marginPerHour !== null ? marginPerHour >= marginPerHourMedian : false;

    let quadrant: ServiceQuadrant;
    if (highDemand && highMarginPerHour) quadrant = "ESTRELA";
    else if (highDemand && !highMarginPerHour) quadrant = "ARMADILHA";
    else if (!highDemand && highMarginPerHour) quadrant = "JOIA";
    else quadrant = "FRACO";

    return {
      serviceId: totalsRow.serviceId,
      name: totalsRow.name,
      quadrant,
      appointments: totalsRow.appointments,
      bookedMinutes: Math.round(totalsRow.bookedMinutes),
      revenue: round2(totalsRow.revenue),
      cost: round2(totalsRow.cost),
      marginPercent,
      revenuePerHour,
      marginPerHour,
      occupancyPercent,
      marginSharePercent,
      byUnit: totalsRow.byUnit,
    };
  });

  return { services, totalBookedMinutes, totalMargin: round2(totalMargin), demandMedian, marginPerHourMedian };
};
