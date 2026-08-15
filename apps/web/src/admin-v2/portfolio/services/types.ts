/** Admin V2 (PLAN-0022, Onda 6) — Performance de Serviços (RETROFIT-007). Espelha apps/api/src/modules/intelligence/service-performance/types.ts. */

export type ServiceQuadrant = "ESTRELA" | "JOIA" | "ARMADILHA" | "FRACO" | "SEM_DEMANDA";

export type ServiceUnitBreakdown = {
  unitId: number;
  unitName: string;
  appointments: number;
  bookedMinutes: number;
  revenue: number;
  cost: number;
  marginPerHour: number | null;
};

export type ServicePerformance = {
  serviceId: number;
  name: string;
  quadrant: ServiceQuadrant;
  appointments: number;
  bookedMinutes: number;
  revenue: number;
  cost: number;
  marginPercent: number | null;
  revenuePerHour: number | null;
  marginPerHour: number | null;
  occupancyPercent: number;
  marginSharePercent: number | null;
  byUnit: ServiceUnitBreakdown[];
};

export type ServicePerformanceList = {
  period: { from: string; to: string; days: number };
  totalAvailableMinutes: number;
  totalBookedMinutes: number;
  totalMargin: number;
  demandMedian: number;
  marginPerHourMedian: number | null;
  services: ServicePerformance[];
};
