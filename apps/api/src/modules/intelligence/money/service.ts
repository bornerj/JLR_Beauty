import { Prisma } from "@prisma/client";
import prisma from "../../../lib/prisma";
import { getSalesInsights } from "../../admin/kpis/dashboardSalesInsights";
import { resolveAdminPeriodRange, type AdminPeriodInput } from "../../admin/kpis/period";
import { getServicePerformance } from "../service-performance/service";
import { getSubscriptionHealth } from "../subscriptions/service";
import { buildMoneyOverview } from "./rules";
import type { MoneyOverview, ProfessionalRevenueEntry } from "./types";

const round2 = (value: number): number => Math.round(value * 100) / 100;

const decimalToNumber = (value: Prisma.Decimal | null | undefined): number => {
  if (!value) return 0;
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : 0;
};

/**
 * Receita/custo de serviço agrupada por profissional. Única query nova desta onda — mesma
 * fonte (`Appointment`, status != CANCELADO, período, preço/custo do `Service`) já usada
 * pela Onda 6 (`service-performance/service.ts`), só agrupada por `professionalId` em vez
 * de `serviceId`. Não recalcula nada que já exista, só reagrupa.
 */
const getProfessionalRevenue = async (from: Date, to: Date): Promise<ProfessionalRevenueEntry[]> => {
  const appointments = await prisma.appointment.findMany({
    where: { status: { not: "CANCELADO" }, start: { gte: from, lte: to } },
    select: {
      professionalId: true,
      professional: { select: { name: true } },
      service: { select: { price: true, cost: true } },
    },
  });

  const map = new Map<number, ProfessionalRevenueEntry>();
  for (const appointment of appointments) {
    const entry = map.get(appointment.professionalId) ?? {
      professionalId: appointment.professionalId,
      name: appointment.professional.name,
      revenue: 0,
      cost: 0,
      appointments: 0,
    };
    entry.revenue = round2(entry.revenue + decimalToNumber(appointment.service.price));
    entry.cost = round2(entry.cost + decimalToNumber(appointment.service.cost));
    entry.appointments += 1;
    map.set(appointment.professionalId, entry);
  }
  return Array.from(map.values());
};

/**
 * Admin V2 (PLAN-0023, Onda 3) — "Onde está o dinheiro?" (RETROFIT-013).
 * Busca os 3 módulos de origem (Produtos — Onda 5/PLAN-0020, Serviços — Onda 6,
 * Assinaturas — Onda 8) em `Promise.all`, nunca em cascata, mais a agregação nova por
 * profissional, e delega a combinação para `rules.ts` (função pura).
 */
export const getMoneyOverview = async (input: AdminPeriodInput): Promise<MoneyOverview> => {
  const range = resolveAdminPeriodRange(input);
  const periodArgs = { from: range.from.toISOString(), to: range.to.toISOString() };

  const units = await prisma.unit.findMany({ select: { id: true, name: true } });

  const [salesInsightsNetwork, salesInsightsByUnitRaw, servicePerformance, subscriptionHealth, professionalRevenue] =
    await Promise.all([
      getSalesInsights(periodArgs),
      Promise.all(units.map((unit) => getSalesInsights({ ...periodArgs, unitId: unit.id }))),
      getServicePerformance(periodArgs),
      getSubscriptionHealth(input),
      getProfessionalRevenue(range.from, range.to),
    ]);

  const salesInsightsByUnit = units.map((unit, index) => ({
    unitId: unit.id,
    unitName: unit.name,
    insights: salesInsightsByUnitRaw[index],
  }));

  return buildMoneyOverview({
    salesInsightsNetwork,
    salesInsightsByUnit,
    servicePerformance,
    subscriptionHealth,
    professionalRevenue,
  });
};
