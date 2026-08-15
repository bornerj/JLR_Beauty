import type { AppointmentRow, CapacityDay, CapacitySlot, ShiftRow } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 4) — Mapa de Capacidade da Agenda (RETROFIT-005).
 * Lógica pura de agregação dia×hora, sem acesso a banco (mesmo padrão de
 * `operational-orders/classifier.ts`): recebe linhas já buscadas por `service.ts` e
 * devolve a grade pronta para a API. Nunca calcula no-show — campo inexistente no
 * schema atual (`AppointmentStatus` só tem PENDENTE/CONFIRMADO/CANCELADO), fora de
 * escopo desta onda (ver matriz de reuso do PLAN-0022).
 */

const MINUTES_PER_HOUR = 60;

const round1 = (value: number): number => Math.round(value * 10) / 10;
const round2 = (value: number): number => Math.round(value * 100) / 100;

/** Sobreposição em minutos entre dois intervalos [aStart,aEnd) e [bStart,bEnd), nunca negativa. */
export const overlapMinutes = (aStart: number, aEnd: number, bStart: number, bEnd: number): number =>
  Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));

/** Chave de data local (YYYY-MM-DD) — mesma convenção de `workDate`/`Appointment.start` no resto do schema (horário local, não UTC; ver `parseIsoDateStart` em routeHelpers.ts). */
export const dateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const startOfDay = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const eachDay = (from: Date, to: Date): Date[] => {
  const days: Date[] = [];
  let cursor = startOfDay(from);
  const end = startOfDay(to);
  while (cursor.getTime() <= end.getTime()) {
    days.push(cursor);
    const next = new Date(cursor);
    next.setDate(next.getDate() + 1);
    cursor = next;
  }
  return days;
};

/** Duração real do agendamento em minutos (`end` já vem com fallback de `Service.durationMin` aplicado por `service.ts`). */
const appointmentDurationMinutes = (appointment: AppointmentRow): number =>
  Math.max(0, (appointment.end.getTime() - appointment.start.getTime()) / 60000);

const minutesOfDay = (date: Date): number => date.getHours() * 60 + date.getMinutes();

export type CapacityGridResult = {
  days: CapacityDay[];
  hourRange: { start: number; end: number } | null;
  unitRevenuePerBookedHour: number | null;
};

/**
 * Constrói a grade dia×hora para o período. `shifts`/`appointments` já filtrados pela
 * unidade e pelo intervalo `[from, to]` (feito em `service.ts`).
 */
export const buildCapacityDays = (
  shifts: ShiftRow[],
  appointments: AppointmentRow[],
  from: Date,
  to: Date
): CapacityGridResult => {
  if (shifts.length === 0) {
    // Sem nenhuma escala cadastrada no período: nenhuma grade honesta para desenhar
    // (governança #6 — não fabricar disponibilidade que não existe no schema).
    return { days: [], hourRange: null, unitRevenuePerBookedHour: null };
  }

  let hourStart = 23;
  let hourEnd = 0;
  for (const shift of shifts) {
    hourStart = Math.min(hourStart, Math.floor(shift.startMinutes / MINUTES_PER_HOUR));
    hourEnd = Math.max(hourEnd, Math.ceil(shift.endMinutes / MINUTES_PER_HOUR));
  }
  hourEnd = Math.min(24, Math.max(hourEnd, hourStart + 1));

  const shiftsByDay = new Map<string, ShiftRow[]>();
  for (const shift of shifts) {
    const key = dateKey(shift.workDate);
    const list = shiftsByDay.get(key);
    if (list) list.push(shift);
    else shiftsByDay.set(key, [shift]);
  }

  const appointmentsByDay = new Map<string, AppointmentRow[]>();
  for (const appointment of appointments) {
    const key = dateKey(appointment.start);
    const list = appointmentsByDay.get(key);
    if (list) list.push(appointment);
    else appointmentsByDay.set(key, [appointment]);
  }

  let totalBookedMinutes = 0;
  let totalRevenueActual = 0;

  const days: CapacityDay[] = eachDay(from, to).map((date) => {
    const key = dateKey(date);
    const dayShifts = shiftsByDay.get(key) ?? [];
    const dayAppointments = appointmentsByDay.get(key) ?? [];

    const slots: CapacitySlot[] = [];
    for (let hour = hourStart; hour < hourEnd; hour += 1) {
      const slotStart = hour * MINUTES_PER_HOUR;
      const slotEnd = slotStart + MINUTES_PER_HOUR;

      let availableMinutes = 0;
      for (const shift of dayShifts) {
        availableMinutes += overlapMinutes(shift.startMinutes, shift.endMinutes, slotStart, slotEnd);
      }

      let bookedMinutes = 0;
      let revenueActual = 0;
      for (const appointment of dayAppointments) {
        const apptStart = minutesOfDay(appointment.start);
        const apptEnd = minutesOfDay(appointment.end);
        const overlap = overlapMinutes(apptStart, apptEnd, slotStart, slotEnd);
        if (overlap <= 0) continue;
        bookedMinutes += overlap;
        const totalDuration = appointmentDurationMinutes(appointment);
        if (totalDuration > 0) {
          revenueActual += appointment.servicePrice * (overlap / totalDuration);
        }
      }

      totalBookedMinutes += bookedMinutes;
      totalRevenueActual += revenueActual;

      const occupancyRate = availableMinutes > 0 ? Math.min(100, (bookedMinutes / availableMinutes) * 100) : 0;

      slots.push({
        hour,
        availableMinutes: Math.round(availableMinutes),
        bookedMinutes: Math.round(bookedMinutes),
        occupancyRate: round1(occupancyRate),
        revenueActual: round2(revenueActual),
        revenuePerAvailableHour: availableMinutes > 0 ? round2(revenueActual / (availableMinutes / 60)) : null,
        revenuePerBookedHour: bookedMinutes > 0 ? round2(revenueActual / (bookedMinutes / 60)) : null,
      });
    }

    return { date: key, weekday: date.getDay(), slots };
  });

  const unitRevenuePerBookedHour =
    totalBookedMinutes > 0 ? round2(totalRevenueActual / (totalBookedMinutes / 60)) : null;

  return { days, hourRange: { start: hourStart, end: hourEnd }, unitRevenuePerBookedHour };
};
