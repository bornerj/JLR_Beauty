import { Prisma } from "@prisma/client";
import prisma from "../../../lib/prisma";
import { addDays, clockToMinutes, parseIsoDateStart } from "../../../lib/routeHelpers";
import { resolveAdminPeriodRange, type AdminPeriodInput } from "../../admin/kpis/period";
import { buildCapacityDays, dateKey, overlapMinutes } from "./heatmap";
import type { AppointmentRow, CapacityHeatmap, ShiftRow, SlotDetail, SlotProfessional } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 4) — Mapa de Capacidade da Agenda (RETROFIT-005).
 * Camada de acesso a dados: busca `ProfessionalShift`/`Appointment` reais e delega a
 * matemática de agregação para `heatmap.ts` (mesma separação `classifier.ts`/`service.ts`
 * da Onda 3). Nenhuma escrita — é só leitura analítica sobre agenda já existente.
 */

const round1 = (value: number): number => Math.round(value * 10) / 10;
const round2 = (value: number): number => Math.round(value * 100) / 100;

const decimalToNumber = (value: Prisma.Decimal | null | undefined): number => {
  if (!value) return 0;
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : 0;
};

const fetchShiftRows = async (unitId: number, from: Date, to: Date): Promise<ShiftRow[]> => {
  const shifts = await prisma.professionalShift.findMany({
    where: { unitId, isActive: true, workDate: { gte: from, lte: to } },
    select: {
      professionalId: true,
      workDate: true,
      hourStart: true,
      hourFinish: true,
      professional: { select: { name: true } },
    },
  });

  const rows: ShiftRow[] = [];
  for (const shift of shifts) {
    const startMinutes = clockToMinutes(shift.hourStart);
    const endMinutes = clockToMinutes(shift.hourFinish);
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) continue;
    rows.push({
      professionalId: shift.professionalId,
      professionalName: shift.professional.name,
      workDate: shift.workDate,
      startMinutes,
      endMinutes,
    });
  }
  return rows;
};

/** `end` sempre resolvido: quando o agendamento não tem `end` preenchido, cai para `Service.durationMin` — mesmo fallback de `capacity/calculator.ts` (Onda 1). */
const fetchAppointmentRows = async (unitId: number, from: Date, to: Date): Promise<AppointmentRow[]> => {
  const appointments = await prisma.appointment.findMany({
    where: { unitId, status: { not: "CANCELADO" }, start: { gte: from, lte: to } },
    select: {
      id: true,
      professionalId: true,
      clientName: true,
      start: true,
      end: true,
      professional: { select: { name: true } },
      service: { select: { name: true, price: true, durationMin: true } },
    },
  });

  return appointments.map((appointment) => ({
    id: appointment.id,
    professionalId: appointment.professionalId,
    professionalName: appointment.professional.name,
    clientName: appointment.clientName,
    serviceName: appointment.service.name,
    servicePrice: decimalToNumber(appointment.service.price),
    start: appointment.start,
    end: appointment.end ?? new Date(appointment.start.getTime() + (appointment.service.durationMin ?? 0) * 60000),
  }));
};

export const getCapacityHeatmap = async (
  input: AdminPeriodInput & { unitId: number }
): Promise<CapacityHeatmap> => {
  const range = resolveAdminPeriodRange(input);
  const unit = await prisma.unit.findUniqueOrThrow({ where: { id: input.unitId }, select: { id: true, name: true } });

  const [shifts, appointments] = await Promise.all([
    fetchShiftRows(unit.id, range.from, range.to),
    fetchAppointmentRows(unit.id, range.from, range.to),
  ]);

  const { days, hourRange, unitRevenuePerBookedHour } = buildCapacityDays(shifts, appointments, range.from, range.to);

  return {
    unitId: unit.id,
    unitName: unit.name,
    period: { from: range.from.toISOString(), to: range.to.toISOString(), days: range.days },
    hourRange,
    unitRevenuePerBookedHour,
    days,
  };
};

type ProfessionalAccumulator = Omit<SlotProfessional, "isIdle">;

/**
 * Detalhamento de um horário específico (drill-down do heatmap). Recalcula a mesma
 * grade (`getCapacityHeatmap`) para achar `unitRevenuePerBookedHour` — a taxa de
 * referência honesta usada quando o próprio horário não tem reserva nenhuma (ver
 * `lostRevenueEstimate` abaixo) — e busca separadamente o detalhamento por profissional
 * do dia/hora pedido, granularidade que a grade não guarda.
 */
export const getSlotDetail = async (
  input: AdminPeriodInput & { unitId: number; date: string; hour: number }
): Promise<SlotDetail> => {
  if (!Number.isInteger(input.hour) || input.hour < 0 || input.hour > 23) {
    throw new Error("invalid_hour");
  }
  const dayStart = parseIsoDateStart(input.date);
  if (!dayStart) {
    throw new Error("invalid_date");
  }
  const dayEnd = new Date(addDays(dayStart, 1).getTime() - 1);

  const [heatmap, shifts, appointments] = await Promise.all([
    getCapacityHeatmap(input),
    fetchShiftRows(input.unitId, dayStart, dayEnd),
    fetchAppointmentRows(input.unitId, dayStart, dayEnd),
  ]);

  const slotStart = input.hour * 60;
  const slotEnd = slotStart + 60;

  const professionalsMap = new Map<number, ProfessionalAccumulator>();
  const ensureProfessional = (id: number, name: string): ProfessionalAccumulator => {
    const existing = professionalsMap.get(id);
    if (existing) return existing;
    const created: ProfessionalAccumulator = { professionalId: id, professionalName: name, scheduledMinutes: 0, bookedMinutes: 0, appointments: [] };
    professionalsMap.set(id, created);
    return created;
  };

  let availableMinutes = 0;
  for (const shift of shifts) {
    const overlap = overlapMinutes(shift.startMinutes, shift.endMinutes, slotStart, slotEnd);
    if (overlap <= 0) continue;
    availableMinutes += overlap;
    ensureProfessional(shift.professionalId, shift.professionalName).scheduledMinutes += overlap;
  }

  let bookedMinutes = 0;
  let revenueActual = 0;
  for (const appointment of appointments) {
    const apptStart = appointment.start.getHours() * 60 + appointment.start.getMinutes();
    const apptEnd = appointment.end.getHours() * 60 + appointment.end.getMinutes();
    const overlap = overlapMinutes(apptStart, apptEnd, slotStart, slotEnd);
    if (overlap <= 0) continue;
    bookedMinutes += overlap;
    const totalDuration = Math.max(0, (appointment.end.getTime() - appointment.start.getTime()) / 60000);
    const apptRevenue = totalDuration > 0 ? appointment.servicePrice * (overlap / totalDuration) : 0;
    revenueActual += apptRevenue;

    const professional = ensureProfessional(appointment.professionalId, appointment.professionalName);
    professional.bookedMinutes += overlap;
    professional.appointments.push({
      appointmentId: appointment.id,
      clientName: appointment.clientName,
      serviceName: appointment.serviceName,
      start: appointment.start.toISOString(),
      end: appointment.end.toISOString(),
    });
  }

  const occupancyRate = availableMinutes > 0 ? Math.min(100, (bookedMinutes / availableMinutes) * 100) : 0;
  const revenuePerBookedHour = bookedMinutes > 0 ? round2(revenueActual / (bookedMinutes / 60)) : null;

  const idleMinutes = Math.max(0, availableMinutes - bookedMinutes);
  const referenceRate = revenuePerBookedHour ?? heatmap.unitRevenuePerBookedHour;
  const lostRevenueEstimate =
    idleMinutes > 0 && referenceRate !== null && referenceRate > 0
      ? {
          amount: round2((idleMinutes / 60) * referenceRate),
          explanation:
            revenuePerBookedHour !== null
              ? "minutos ociosos neste horário × receita/hora reservada do próprio horário"
              : "minutos ociosos neste horário × receita média/hora reservada da unidade no período selecionado (este horário não teve nenhuma reserva própria para calcular uma taxa sua)",
        }
      : null;

  const professionals: SlotProfessional[] = Array.from(professionalsMap.values())
    .map((entry) => ({ ...entry, isIdle: entry.scheduledMinutes > 0 && entry.bookedMinutes === 0 }))
    .sort((a, b) => a.professionalName.localeCompare(b.professionalName, "pt-BR"));

  return {
    unitId: heatmap.unitId,
    unitName: heatmap.unitName,
    date: dateKey(dayStart),
    hour: input.hour,
    availableMinutes: Math.round(availableMinutes),
    bookedMinutes: Math.round(bookedMinutes),
    occupancyRate: round1(occupancyRate),
    revenuePerBookedHour,
    lostRevenueEstimate,
    professionals,
  };
};
