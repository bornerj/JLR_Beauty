import { Prisma } from "@prisma/client";
import prisma from "../../../lib/prisma";
import { resolveAdminPeriodRange, type AdminPeriodInput } from "../../admin/kpis/period";
import { calculateUnitOccupancy } from "../capacity/calculator";
import { classifyServicePerformance } from "./classifier";
import type { ServicePerformanceList, ServiceTotals, ServiceUnitBreakdown } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 6) — Performance de Serviços (RETROFIT-007).
 * Camada de acesso a dados: agenda real (`Appointment`, excluindo `CANCELADO`, mesmo
 * fallback de `Service.durationMin` quando `end` não preenchido — convenção da Onda 1/4)
 * e a capacidade total do escopo via `calculateUnitOccupancy` (reuso direto da Onda 4,
 * não recalculado do zero). Nenhuma escrita.
 */

const round2 = (value: number): number => Math.round(value * 100) / 100;

const decimalToNumber = (value: Prisma.Decimal | null | undefined): number => {
  if (!value) return 0;
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : 0;
};

type Accumulator = {
  name: string;
  appointments: number;
  bookedMinutes: number;
  revenue: number;
  cost: number;
  byUnit: Map<number, { unitId: number; unitName: string; appointments: number; bookedMinutes: number; revenue: number; cost: number }>;
};

const ensureService = (map: Map<number, Accumulator>, serviceId: number, name: string): Accumulator => {
  const existing = map.get(serviceId);
  if (existing) return existing;
  const created: Accumulator = { name, appointments: 0, bookedMinutes: 0, revenue: 0, cost: 0, byUnit: new Map() };
  map.set(serviceId, created);
  return created;
};

const ensureUnit = (acc: Accumulator, unitId: number, unitName: string) => {
  const existing = acc.byUnit.get(unitId);
  if (existing) return existing;
  const created = { unitId, unitName, appointments: 0, bookedMinutes: 0, revenue: 0, cost: 0 };
  acc.byUnit.set(unitId, created);
  return created;
};

export const getServicePerformance = async (
  input: AdminPeriodInput & { unitIds?: number[] }
): Promise<ServicePerformanceList> => {
  const range = resolveAdminPeriodRange(input);

  const scopedUnitIds =
    input.unitIds && input.unitIds.length > 0
      ? input.unitIds
      : (await prisma.unit.findMany({ select: { id: true } })).map((unit) => unit.id);

  const [occupancies, services, appointments] = await Promise.all([
    Promise.all(scopedUnitIds.map((unitId) => calculateUnitOccupancy(unitId, range.from, range.to))),
    // Todo serviço cadastrado entra na lista, mesmo sem agendamento no período — um
    // serviço nunca usado é, em si, um sinal (SEM_DEMANDA), mesma filosofia do
    // Portfólio de Produtos listar produtos sem venda (Onda 5).
    prisma.service.findMany({ select: { id: true, name: true } }),
    prisma.appointment.findMany({
      where: {
        status: { not: "CANCELADO" },
        start: { gte: range.from, lte: range.to },
        unitId: { in: scopedUnitIds },
      },
      select: {
        serviceId: true,
        unitId: true,
        start: true,
        end: true,
        unit: { select: { name: true } },
        service: { select: { name: true, price: true, cost: true, durationMin: true } },
      },
    }),
  ]);

  const totalAvailableMinutes = occupancies.reduce((sum, occupancy) => sum + occupancy.availableMinutes, 0);

  const serviceMap = new Map<number, Accumulator>();
  for (const svc of services) ensureService(serviceMap, svc.id, svc.name);

  for (const appointment of appointments) {
    const bookedMinutes = appointment.end
      ? Math.max(0, (appointment.end.getTime() - appointment.start.getTime()) / 60000)
      : (appointment.service.durationMin ?? 0);
    const revenue = decimalToNumber(appointment.service.price);
    const cost = decimalToNumber(appointment.service.cost);

    const acc = ensureService(serviceMap, appointment.serviceId, appointment.service.name);
    acc.appointments += 1;
    acc.bookedMinutes += bookedMinutes;
    acc.revenue += revenue;
    acc.cost += cost;

    const unitEntry = ensureUnit(acc, appointment.unitId, appointment.unit.name);
    unitEntry.appointments += 1;
    unitEntry.bookedMinutes += bookedMinutes;
    unitEntry.revenue += revenue;
    unitEntry.cost += cost;
  }

  const totals: ServiceTotals[] = Array.from(serviceMap.entries()).map(([serviceId, acc]) => ({
    serviceId,
    name: acc.name,
    appointments: acc.appointments,
    bookedMinutes: acc.bookedMinutes,
    revenue: acc.revenue,
    cost: acc.cost,
    byUnit: Array.from(acc.byUnit.values())
      .map(
        (unit): ServiceUnitBreakdown => ({
          unitId: unit.unitId,
          unitName: unit.unitName,
          appointments: unit.appointments,
          bookedMinutes: Math.round(unit.bookedMinutes),
          revenue: round2(unit.revenue),
          cost: round2(unit.cost),
          marginPerHour: unit.bookedMinutes > 0 ? round2((unit.revenue - unit.cost) / (unit.bookedMinutes / 60)) : null,
        })
      )
      .sort((a, b) => b.revenue - a.revenue),
  }));

  const { services: classified, totalBookedMinutes, totalMargin, demandMedian, marginPerHourMedian } =
    classifyServicePerformance(totals, totalAvailableMinutes);

  const sorted = [...classified].sort((a, b) => b.occupancyPercent - a.occupancyPercent);

  return {
    period: { from: range.from.toISOString(), to: range.to.toISOString(), days: range.days },
    totalAvailableMinutes: Math.round(totalAvailableMinutes),
    totalBookedMinutes: Math.round(totalBookedMinutes),
    totalMargin,
    demandMedian,
    marginPerHourMedian,
    services: sorted,
  };
};
