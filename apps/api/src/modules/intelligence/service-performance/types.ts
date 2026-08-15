/**
 * Admin V2 (PLAN-0022, Onda 6) — Performance de Serviços (RETROFIT-007).
 * Contrato único do módulo (mesmo padrão de `portfolio/types.ts`): `classifier.ts`
 * (puro) e `service.ts` (Prisma) importam daqui.
 */

/**
 * Matriz demanda×margem/hora — mesmo framework de "quadrante relativo à mediana do
 * recorte" do Portfólio de Produtos (Onda 5), adaptado para agenda em vez de estoque.
 * `SEM_DEMANDA` (5º estado, mesmo raciocínio honesto do `SEM_VENDA` da Onda 5): serviço
 * cadastrado mas sem nenhum agendamento no período — sem dado de margem/hora para
 * classificar contra a mediana.
 */
export type ServiceQuadrant = "ESTRELA" | "JOIA" | "ARMADILHA" | "FRACO" | "SEM_DEMANDA";

export type ServiceUnitBreakdown = {
  unitId: number;
  unitName: string;
  appointments: number;
  bookedMinutes: number;
  revenue: number;
  cost: number;
  /** null quando a unidade não teve nenhum agendamento deste serviço no período. */
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
  /** % da capacidade TOTAL da agenda do escopo (reuso do cálculo de ocupação da Onda 4) ocupada por este serviço. */
  occupancyPercent: number;
  /** % da margem total gerada por todos os serviços do escopo, atribuída a este. */
  marginSharePercent: number | null;
  byUnit: ServiceUnitBreakdown[];
};

export type ServicePerformanceList = {
  period: { from: string; to: string; days: number };
  totalAvailableMinutes: number;
  totalBookedMinutes: number;
  totalMargin: number;
  /** Mediana de `occupancyPercent` entre serviços com demanda — explica a classificação (governança #6). */
  demandMedian: number;
  /** Mediana de `marginPerHour` entre serviços com demanda; null se nenhum serviço teve agendamento. */
  marginPerHourMedian: number | null;
  services: ServicePerformance[];
};

/** Totais já agregados de um serviço, entrada do classificador puro (`classifier.ts`). */
export type ServiceTotals = {
  serviceId: number;
  name: string;
  appointments: number;
  bookedMinutes: number;
  revenue: number;
  cost: number;
  byUnit: ServiceUnitBreakdown[];
};
