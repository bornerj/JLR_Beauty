import prisma from "../../../lib/prisma";
import { clockToMinutes } from "../../../lib/routeHelpers";

/**
 * Admin V2 (PLAN-0022) — cálculo de ocupação de agenda por unidade/período.
 *
 * Nasce na Onda 1 (pré-requisito do Health Score — ver "Nota de sequenciamento" do
 * PLAN-0022) com granularidade agregada (uma taxa por unidade/período). A Onda 4
 * ("Mapa de Capacidade da Agenda") ESTENDE este mesmo arquivo com granularidade
 * dia×hora — não duplica a lógica.
 *
 * availableMinutes vem de ProfessionalShift (escalas ativas no período).
 * bookedMinutes vem de Appointment, excluindo CANCELADO; quando `end` não foi
 * preenchido, usa a duração padrão do serviço (`Service.durationMin`) como fallback.
 */

export type UnitOccupancy = {
  availableMinutes: number;
  bookedMinutes: number;
  occupancyRate: number; // 0-100
};

export const calculateUnitOccupancy = async (
  unitId: number,
  from: Date,
  to: Date
): Promise<UnitOccupancy> => {
  const [shifts, appointments] = await Promise.all([
    prisma.professionalShift.findMany({
      where: { unitId, isActive: true, workDate: { gte: from, lte: to } },
      select: { hourStart: true, hourFinish: true },
    }),
    prisma.appointment.findMany({
      where: { unitId, status: { not: "CANCELADO" }, start: { gte: from, lte: to } },
      select: { start: true, end: true, service: { select: { durationMin: true } } },
    }),
  ]);

  let availableMinutes = 0;
  for (const shift of shifts) {
    const startMin = clockToMinutes(shift.hourStart);
    const endMin = clockToMinutes(shift.hourFinish);
    if (startMin === null || endMin === null || endMin <= startMin) continue;
    availableMinutes += endMin - startMin;
  }

  let bookedMinutes = 0;
  for (const appointment of appointments) {
    if (appointment.end) {
      bookedMinutes += Math.max(0, (appointment.end.getTime() - appointment.start.getTime()) / 60000);
    } else {
      bookedMinutes += appointment.service?.durationMin ?? 0;
    }
  }

  const occupancyRate =
    availableMinutes > 0 ? Math.min(100, (bookedMinutes / availableMinutes) * 100) : 0;

  return {
    availableMinutes: Math.round(availableMinutes),
    bookedMinutes: Math.round(bookedMinutes),
    occupancyRate: Math.round(occupancyRate * 10) / 10,
  };
};
