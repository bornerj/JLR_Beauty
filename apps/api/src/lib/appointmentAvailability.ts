import { Prisma } from "@prisma/client";
import prisma from "./prisma";

export type AvailabilityPeriod = "MORNING" | "AFTERNOON" | "EVENING";

type PeriodRange = {
  key: AvailabilityPeriod;
  startMinute: number;
  endMinute: number;
  label: string;
};

type SlotDescriptor = {
  slotStart: Date;
  slotKey: string;
};

type SlotOption = {
  slotLabel: string;
  slotIso: string;
  hourIni: string;
  hourFinish: string;
  professionalsAvailable: number;
  period: AvailabilityPeriod;
};

type AvailableProfessionalOption = {
  id: number;
  name: string;
};

type ServiceAvailabilitySummary = {
  unitId: number;
  serviceId: number;
  dateIso: string;
  durationMin: number;
  slotDurationMin: number;
  unitHourStart: string;
  unitHourFinish: string;
  totalStarts: number;
  availableStarts: number;
  periods: Array<{
    period: AvailabilityPeriod;
    label: string;
    totalStarts: number;
    availableStarts: number;
  }>;
  slots: SlotOption[];
};

export type CreateRemoteAppointmentInput = {
  unitId: number;
  serviceId: number;
  dateIso: string;
  slotLabel: string;
  clientName: string;
  clientPhone: string;
  clientId?: number | null;
  notes?: string | null;
  orderId?: number | null;
  preferredProfessionalId?: number | null;
  strictPreferredProfessional?: boolean;
};

export type CreateRemoteAppointmentResult =
  | {
      ok: true;
      appointment: {
        id: number;
        unitId: number;
        professionalId: number;
        serviceId: number;
        start: Date;
        end: Date | null;
        clientName: string;
        clientPhone: string;
      };
    }
  | {
      ok: false;
      reason:
        | "invalid_date"
        | "invalid_slot"
        | "unit_not_found"
        | "service_not_found"
        | "service_duration_invalid"
        | "outside_unit_hours"
        | "no_professional_available"
        | "slot_unavailable";
    };

const SLOT_DURATION_MIN = 30;
const DEFAULT_SCHEDULE_DAYS = 14;
const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"] as const;

const PERIOD_RANGES: PeriodRange[] = [
  { key: "MORNING", startMinute: 0, endMinute: 12 * 60, label: "Manha" },
  { key: "AFTERNOON", startMinute: 12 * 60, endMinute: 18 * 60, label: "Tarde" },
  { key: "EVENING", startMinute: 18 * 60, endMinute: 24 * 60, label: "Noite" },
];

const sanitizePhone = (value: string): string => value.replace(/\D/g, "");

const toIsoDate = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseIsoDate = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return null;
  const parsed = new Date(`${value.trim()}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const parseClockToMinutes = (value: string): number | null => {
  const normalized = value.trim();
  const matched = normalized.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!matched) return null;
  const hour = Number(matched[1]);
  const minute = Number(matched[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
};

const toClockLabel = (value: Date): string => {
  return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
};

const dateWithMinuteOffset = (baseDate: Date, minutesFromStart: number): Date => {
  const output = new Date(baseDate);
  output.setHours(0, 0, 0, 0);
  output.setMinutes(minutesFromStart);
  return output;
};

const addMinutes = (value: Date, minutes: number): Date => {
  const next = new Date(value);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
};

const ceilToSlotCount = (durationMin: number): number => {
  const clamped = Math.max(1, durationMin);
  return Math.ceil(clamped / SLOT_DURATION_MIN);
};

const toPeriod = (minuteOfDay: number): AvailabilityPeriod => {
  const period = PERIOD_RANGES.find(
    (entry) => minuteOfDay >= entry.startMinute && minuteOfDay < entry.endMinute
  );
  return period?.key || "EVENING";
};

const getPeriodLabel = (period: AvailabilityPeriod): string => {
  return PERIOD_RANGES.find((entry) => entry.key === period)?.label || period;
};

const buildScheduleDates = (days = DEFAULT_SCHEDULE_DAYS): Array<{ isoDate: string; label: string }> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const output: Array<{ isoDate: string; label: string }> = [];
  for (let offset = 0; offset < days; offset += 1) {
    const next = new Date(today);
    next.setDate(today.getDate() + offset);
    const weekday = WEEKDAY_LABELS[next.getDay()] || "";
    output.push({
      isoDate: toIsoDate(next),
      label: `${next.toLocaleDateString("pt-BR")} (${weekday})`,
    });
  }
  return output;
};

const isPrismaKnownError = (error: unknown): error is Prisma.PrismaClientKnownRequestError => {
  return error instanceof Prisma.PrismaClientKnownRequestError;
};

const resolveDurationMin = (duration: number | null | undefined): number => {
  const parsed = Number(duration || 0);
  if (!Number.isFinite(parsed) || parsed <= 0) return SLOT_DURATION_MIN;
  return Math.round(parsed);
};

const buildCandidateStarts = (
  dayDate: Date,
  unitHourStart: string,
  unitHourFinish: string,
  durationMin: number
): SlotDescriptor[] => {
  const startMinute = parseClockToMinutes(unitHourStart);
  const finishMinute = parseClockToMinutes(unitHourFinish);
  if (startMinute === null || finishMinute === null || finishMinute <= startMinute) return [];

  const lastStartMinute = finishMinute - durationMin;
  if (lastStartMinute < startMinute) return [];

  const options: SlotDescriptor[] = [];
  for (let minute = startMinute; minute <= lastStartMinute; minute += SLOT_DURATION_MIN) {
    const slotStart = dateWithMinuteOffset(dayDate, minute);
    options.push({ slotStart, slotKey: slotStart.toISOString() });
  }
  return options;
};

const expandToSlotKeys = (slotStart: Date, durationMin: number): string[] => {
  const slotCount = ceilToSlotCount(durationMin);
  const keys: string[] = [];
  for (let index = 0; index < slotCount; index += 1) {
    const chunkStart = addMinutes(slotStart, index * SLOT_DURATION_MIN);
    keys.push(chunkStart.toISOString());
  }
  return keys;
};

type ShiftWindow = {
  startMinute: number;
  endMinute: number;
};

const doesWindowCoverRange = (
  windows: ShiftWindow[],
  requestedStartMinute: number,
  requestedEndMinute: number
): boolean => {
  return windows.some(
    (window) => requestedStartMinute >= window.startMinute && requestedEndMinute <= window.endMinute
  );
};

type PrismaDbClient = typeof prisma | Prisma.TransactionClient;

const getEligibleProfessionalIds = async (
  db: PrismaDbClient,
  unitId: number,
  serviceId: number
): Promise<number[]> => {
  const linked = await db.professional.findMany({
    where: {
      unitId,
      professionalServices: {
        some: {
          serviceId,
        },
      },
    },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  if (linked.length > 0) {
    return linked.map((row) => row.id);
  }

  const fallback = await db.professional.findMany({
    where: { unitId },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  return fallback.map((row) => row.id);
};

const getShiftWindowsForDate = async (params: {
  db: PrismaDbClient;
  unitId: number;
  professionalIds: number[];
  dayStart: Date;
  dayEnd: Date;
}): Promise<Map<number, ShiftWindow[]>> => {
  const map = new Map<number, ShiftWindow[]>();
  params.professionalIds.forEach((professionalId) => map.set(professionalId, []));
  if (!params.professionalIds.length) return map;

  const rows = await params.db.professionalShift.findMany({
    where: {
      unitId: params.unitId,
      professionalId: { in: params.professionalIds },
      isActive: true,
      workDate: {
        gte: params.dayStart,
        lt: params.dayEnd,
      },
    },
    select: {
      professionalId: true,
      hourStart: true,
      hourFinish: true,
    },
  });

  rows.forEach((row) => {
    const startMinute = parseClockToMinutes(row.hourStart);
    const endMinute = parseClockToMinutes(row.hourFinish);
    if (startMinute === null || endMinute === null || endMinute <= startMinute) return;
    const list = map.get(row.professionalId);
    if (!list) return;
    list.push({ startMinute, endMinute });
  });

  return map;
};

const buildLegacyAppointmentSlotKeys = (appointment: {
  professionalId: number;
  start: Date;
  end: Date | null;
  service?: { durationMin: number | null } | null;
}): Array<{ professionalId: number; slotKey: string }> => {
  const start = appointment.start;
  const resolvedDuration = resolveDurationMin(
    appointment.end
      ? Math.round((appointment.end.getTime() - appointment.start.getTime()) / 60000)
      : appointment.service?.durationMin ?? SLOT_DURATION_MIN
  );
  const keys = expandToSlotKeys(start, resolvedDuration);
  return keys.map((slotKey) => ({ professionalId: appointment.professionalId, slotKey }));
};

const listBlockedSlots = async (params: {
  db: PrismaDbClient;
  unitId: number;
  professionalIds: number[];
  dayStart: Date;
  dayEnd: Date;
}): Promise<Map<number, Set<string>>> => {
  const map = new Map<number, Set<string>>();
  params.professionalIds.forEach((professionalId) => {
    map.set(professionalId, new Set<string>());
  });

  if (!params.professionalIds.length) return map;

  const [slotRows, legacyAppointments] = await Promise.all([
    params.db.appointmentSlot.findMany({
      where: {
        unitId: params.unitId,
        professionalId: { in: params.professionalIds },
        appointment: {
          status: { not: "CANCELADO" },
        },
        slotStart: {
          gte: params.dayStart,
          lt: params.dayEnd,
        },
      },
      select: {
        professionalId: true,
        slotStart: true,
      },
    }),
    params.db.appointment.findMany({
      where: {
        unitId: params.unitId,
        professionalId: { in: params.professionalIds },
        status: { not: "CANCELADO" },
        start: { lt: params.dayEnd },
        OR: [{ end: null }, { end: { gt: params.dayStart } }],
      },
      select: {
        id: true,
        professionalId: true,
        start: true,
        end: true,
        slots: {
          select: { id: true },
          take: 1,
        },
        service: {
          select: { durationMin: true },
        },
      },
    }),
  ]);

  slotRows.forEach((row) => {
    const set = map.get(row.professionalId);
    if (!set) return;
    set.add(row.slotStart.toISOString());
  });

  legacyAppointments.forEach((appointment) => {
    if (appointment.slots.length > 0) return;
    const expanded = buildLegacyAppointmentSlotKeys(appointment);
    expanded.forEach((row) => {
      const set = map.get(row.professionalId);
      if (!set) return;
      set.add(row.slotKey);
    });
  });

  return map;
};

export const listServiceAvailability = async (params: {
  unitId: number;
  serviceId: number;
  dateIso: string;
  period?: AvailabilityPeriod;
}): Promise<ServiceAvailabilitySummary | null> => {
  const dayDate = parseIsoDate(params.dateIso);
  if (!dayDate) return null;

  const [unit, service] = await Promise.all([
    prisma.unit.findUnique({
      where: { id: params.unitId },
      select: { id: true, hourStart: true, hourFinish: true },
    }),
    prisma.service.findUnique({
      where: { id: params.serviceId },
      select: { id: true, durationMin: true },
    }),
  ]);
  if (!unit || !service) return null;

  const durationMin = resolveDurationMin(service.durationMin);
  const candidates = buildCandidateStarts(dayDate, unit.hourStart, unit.hourFinish, durationMin);
  const professionalIds = await getEligibleProfessionalIds(prisma, params.unitId, params.serviceId);

  const dayStart = new Date(dayDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const shiftWindowsMap = await getShiftWindowsForDate({
    db: prisma,
    unitId: params.unitId,
    professionalIds,
    dayStart,
    dayEnd,
  });
  const blockedMap = await listBlockedSlots({
    db: prisma,
    unitId: params.unitId,
    professionalIds,
    dayStart,
    dayEnd,
  });

  const periodStats = new Map<
    AvailabilityPeriod,
    { period: AvailabilityPeriod; label: string; totalStarts: number; availableStarts: number }
  >();
  PERIOD_RANGES.forEach((range) => {
    periodStats.set(range.key, {
      period: range.key,
      label: range.label,
      totalStarts: 0,
      availableStarts: 0,
    });
  });

  const slots: SlotOption[] = [];
  let totalStarts = 0;
  for (const candidate of candidates) {
    const minuteOfDay = candidate.slotStart.getHours() * 60 + candidate.slotStart.getMinutes();
    const endMinuteOfDay = minuteOfDay + durationMin;
    const period = toPeriod(minuteOfDay);
    const stats = periodStats.get(period);

    if (params.period && period !== params.period) {
      continue;
    }

    const professionalsByShift = professionalIds.filter((professionalId) => {
      const windows = shiftWindowsMap.get(professionalId) || [];
      return doesWindowCoverRange(windows, minuteOfDay, endMinuteOfDay);
    });
    if (!professionalsByShift.length) {
      continue;
    }
    totalStarts += 1;
    if (stats) stats.totalStarts += 1;

    const neededKeys = expandToSlotKeys(candidate.slotStart, durationMin);
    let freeCount = 0;
    for (const professionalId of professionalsByShift) {
      const blocked = blockedMap.get(professionalId) || new Set<string>();
      const collides = neededKeys.some((slotKey) => blocked.has(slotKey));
      if (!collides) freeCount += 1;
    }
    if (freeCount <= 0) continue;

    if (stats) stats.availableStarts += 1;
    const realEnd = addMinutes(candidate.slotStart, durationMin);
    slots.push({
      slotLabel: toClockLabel(candidate.slotStart),
      slotIso: candidate.slotStart.toISOString(),
      hourIni: toClockLabel(candidate.slotStart),
      hourFinish: toClockLabel(realEnd),
      professionalsAvailable: freeCount,
      period,
    });
  }

  const allAvailableStarts = slots.length;
  const allTotalStarts = totalStarts;
  return {
    unitId: params.unitId,
    serviceId: params.serviceId,
    dateIso: params.dateIso,
    durationMin,
    slotDurationMin: SLOT_DURATION_MIN,
    unitHourStart: unit.hourStart,
    unitHourFinish: unit.hourFinish,
    totalStarts: allTotalStarts,
    availableStarts: allAvailableStarts,
    periods: Array.from(periodStats.values()),
    slots,
  };
};

const hasOverlappingLegacyAppointment = async (params: {
  db: PrismaDbClient;
  unitId: number;
  professionalId: number;
  windowStart: Date;
  windowEnd: Date;
}): Promise<boolean> => {
  const rows = await params.db.appointment.findMany({
    where: {
      unitId: params.unitId,
      professionalId: params.professionalId,
      status: { not: "CANCELADO" },
      start: { lt: params.windowEnd },
      OR: [{ end: null }, { end: { gt: params.windowStart } }],
    },
    select: {
      id: true,
      start: true,
      end: true,
      service: {
        select: { durationMin: true },
      },
    },
  });

  return rows.some((row) => {
    const computedEnd = row.end || addMinutes(row.start, resolveDurationMin(row.service?.durationMin));
    return row.start < params.windowEnd && computedEnd > params.windowStart;
  });
};

export const createRemoteAppointment = async (
  input: CreateRemoteAppointmentInput
): Promise<CreateRemoteAppointmentResult> => {
  const dayDate = parseIsoDate(input.dateIso);
  if (!dayDate) return { ok: false, reason: "invalid_date" };

  const slotMinute = parseClockToMinutes(input.slotLabel);
  if (slotMinute === null || slotMinute % SLOT_DURATION_MIN !== 0) {
    return { ok: false, reason: "invalid_slot" };
  }

  const [unit, service] = await Promise.all([
    prisma.unit.findUnique({
      where: { id: input.unitId },
      select: { id: true, hourStart: true, hourFinish: true },
    }),
    prisma.service.findUnique({
      where: { id: input.serviceId },
      select: { id: true, durationMin: true },
    }),
  ]);
  if (!unit) return { ok: false, reason: "unit_not_found" };
  if (!service) return { ok: false, reason: "service_not_found" };

  const durationMin = resolveDurationMin(service.durationMin);
  if (!Number.isFinite(durationMin) || durationMin <= 0) {
    return { ok: false, reason: "service_duration_invalid" };
  }

  const unitStartMinute = parseClockToMinutes(unit.hourStart);
  const unitFinishMinute = parseClockToMinutes(unit.hourFinish);
  if (unitStartMinute === null || unitFinishMinute === null) {
    return { ok: false, reason: "outside_unit_hours" };
  }

  const start = dateWithMinuteOffset(dayDate, slotMinute);
  const end = addMinutes(start, durationMin);
  const dayStart = new Date(dayDate);
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const endMinute = end.getHours() * 60 + end.getMinutes();
  if (slotMinute < unitStartMinute || endMinute > unitFinishMinute) {
    return { ok: false, reason: "outside_unit_hours" };
  }

  const eligible = await getEligibleProfessionalIds(prisma, input.unitId, input.serviceId);
  if (!eligible.length) {
    return { ok: false, reason: "no_professional_available" };
  }
  if (
    input.strictPreferredProfessional &&
    input.preferredProfessionalId &&
    !eligible.includes(input.preferredProfessionalId)
  ) {
    return { ok: false, reason: "no_professional_available" };
  }

  const shiftWindowsMap = await getShiftWindowsForDate({
    db: prisma,
    unitId: input.unitId,
    professionalIds: eligible,
    dayStart,
    dayEnd,
  });
  const startMinute = start.getHours() * 60 + start.getMinutes();
  const endMinuteOfDay = startMinute + durationMin;

  const orderedProfessionals = Array.from(new Set<number>([
    ...(input.preferredProfessionalId && eligible.includes(input.preferredProfessionalId)
      ? [input.preferredProfessionalId]
      : []),
    ...(input.strictPreferredProfessional ? [] : eligible),
  ]));

  const slotStarts = expandToSlotKeys(start, durationMin).map((slotKey) => new Date(slotKey));
  const slotEnds = slotStarts.map((slotStart) => addMinutes(slotStart, SLOT_DURATION_MIN));

  const normalizedPhone = sanitizePhone(input.clientPhone);
  if (!normalizedPhone) {
    return { ok: false, reason: "invalid_slot" };
  }

  for (const professionalId of orderedProfessionals) {
    const windows = shiftWindowsMap.get(professionalId) || [];
    const inShift = doesWindowCoverRange(windows, startMinute, endMinuteOfDay);
    if (!inShift) {
      if (input.preferredProfessionalId && professionalId === input.preferredProfessionalId) {
        return { ok: false, reason: "no_professional_available" };
      }
      continue;
    }
    try {
      const created = await prisma.$transaction(async (tx) => {
        const [slotConflicts, legacyConflict] = await Promise.all([
          tx.appointmentSlot.findMany({
            where: {
              unitId: input.unitId,
              professionalId,
              appointment: {
                status: { not: "CANCELADO" },
              },
              slotStart: { in: slotStarts },
            },
            select: { id: true },
          }),
          hasOverlappingLegacyAppointment({
            db: tx,
            unitId: input.unitId,
            professionalId,
            windowStart: start,
            windowEnd: end,
          }),
        ]);
        if (slotConflicts.length > 0 || legacyConflict) {
          throw new Error("slot_unavailable");
        }

        const appointment = await tx.appointment.create({
          data: {
            unitId: input.unitId,
            professionalId,
            serviceId: input.serviceId,
            clientId: input.clientId ?? null,
            orderId: input.orderId ?? null,
            start,
            end,
            clientName: input.clientName.trim(),
            clientPhone: normalizedPhone,
            notes: input.notes?.trim() || null,
            status: "PENDENTE",
          },
          select: {
            id: true,
            unitId: true,
            professionalId: true,
            serviceId: true,
            start: true,
            end: true,
            clientName: true,
            clientPhone: true,
          },
        });

        try {
          await tx.appointmentSlot.createMany({
            data: slotStarts.map((slotStart, index) => ({
              appointmentId: appointment.id,
              unitId: input.unitId,
              professionalId,
              slotStart,
              slotEnd: slotEnds[index],
            })),
          });
        } catch (error) {
          if (isPrismaKnownError(error) && error.code === "P2002") {
            throw new Error("slot_unavailable");
          }
          throw error;
        }

        return appointment;
      });

      return { ok: true, appointment: created };
    } catch (error) {
      if (error instanceof Error && error.message === "slot_unavailable") {
        if (input.strictPreferredProfessional && input.preferredProfessionalId === professionalId) {
          return { ok: false, reason: "slot_unavailable" };
        }
        continue;
      }
      throw error;
    }
  }

  return { ok: false, reason: "slot_unavailable" };
};

export const listAvailableProfessionalsForSlot = async (params: {
  unitId: number;
  dateIso: string;
  serviceId: number;
  slotLabel: string;
}): Promise<AvailableProfessionalOption[]> => {
  const dayDate = parseIsoDate(params.dateIso);
  const slotMinute = parseClockToMinutes(params.slotLabel);
  if (!dayDate || slotMinute === null || slotMinute % SLOT_DURATION_MIN !== 0) {
    return [];
  }

  const [unit, service] = await Promise.all([
    prisma.unit.findUnique({
      where: { id: params.unitId },
      select: { id: true, hourStart: true, hourFinish: true },
    }),
    prisma.service.findUnique({
      where: { id: params.serviceId },
      select: { id: true, durationMin: true },
    }),
  ]);
  if (!unit || !service) return [];

  const durationMin = resolveDurationMin(service.durationMin);
  const start = dateWithMinuteOffset(dayDate, slotMinute);
  const end = addMinutes(start, durationMin);

  const unitStartMinute = parseClockToMinutes(unit.hourStart);
  const unitFinishMinute = parseClockToMinutes(unit.hourFinish);
  const endMinute = end.getHours() * 60 + end.getMinutes();
  if (
    unitStartMinute === null ||
    unitFinishMinute === null ||
    slotMinute < unitStartMinute ||
    endMinute > unitFinishMinute
  ) {
    return [];
  }

  const professionals = await prisma.professional.findMany({
    where: {
      id: {
        in: await getEligibleProfessionalIds(prisma, params.unitId, params.serviceId),
      },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  if (!professionals.length) return [];

  const professionalIds = professionals.map((row) => row.id);
  const dayStart = new Date(dayDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const shiftWindowsMap = await getShiftWindowsForDate({
    db: prisma,
    unitId: params.unitId,
    professionalIds,
    dayStart,
    dayEnd,
  });
  const blockedMap = await listBlockedSlots({
    db: prisma,
    unitId: params.unitId,
    professionalIds,
    dayStart,
    dayEnd,
  });

  const slotKeys = expandToSlotKeys(start, durationMin);
  const requestedStartMinute = start.getHours() * 60 + start.getMinutes();
  const requestedEndMinute = requestedStartMinute + durationMin;

  return professionals.filter((professional) => {
    const windows = shiftWindowsMap.get(professional.id) || [];
    if (!doesWindowCoverRange(windows, requestedStartMinute, requestedEndMinute)) return false;
    const blocked = blockedMap.get(professional.id) || new Set<string>();
    const collides = slotKeys.some((slotKey) => blocked.has(slotKey));
    return !collides;
  });
};

export const listPublicConciergeContext = async (): Promise<{
  units: Array<{ id: number; name: string; hourStart: string; hourFinish: string }>;
  dates: Array<{ isoDate: string; label: string }>;
  periods: Array<{ key: AvailabilityPeriod; label: string }>;
}> => {
  const units = await prisma.unit.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      hourStart: true,
      hourFinish: true,
    },
  });

  return {
    units,
    dates: buildScheduleDates(),
    periods: PERIOD_RANGES.map((period) => ({ key: period.key, label: period.label })),
  };
};

export const listPublicServicesByCategory = async (params: {
  unitId: number;
  dateIso: string;
}): Promise<
  Array<{
    id: number;
    name: string;
    services: Array<{
      id: number;
      name: string;
      durationMin: number;
      availableStarts: number;
      totalStarts: number;
    }>;
  }>
> => {
  const categories = await prisma.serviceCategory.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      services: {
        where: {
          OR: [
            { serviceStatus: null },
            { serviceStatus: { name: { in: ["Ativo", "ACTIVE"] } } },
          ],
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          durationMin: true,
        },
      },
    },
  });

  const output: Array<{
    id: number;
    name: string;
    services: Array<{
      id: number;
      name: string;
      durationMin: number;
      availableStarts: number;
      totalStarts: number;
    }>;
  }> = [];

  for (const category of categories) {
    const services: Array<{
      id: number;
      name: string;
      durationMin: number;
      availableStarts: number;
      totalStarts: number;
    }> = [];
    for (const service of category.services) {
      const summary = await listServiceAvailability({
        unitId: params.unitId,
        serviceId: service.id,
        dateIso: params.dateIso,
      });
      if (!summary) continue;
      services.push({
        id: service.id,
        name: service.name,
        durationMin: resolveDurationMin(service.durationMin),
        availableStarts: summary.availableStarts,
        totalStarts: summary.totalStarts,
      });
    }
    output.push({
      id: category.id,
      name: category.name,
      services,
    });
  }

  return output;
};

export const listPublicServiceCatalogByCategory = async (): Promise<
  Array<{
    id: number;
    name: string;
    services: Array<{
      id: number;
      name: string;
      durationMin: number;
      price: string;
    }>;
  }>
> => {
  const categories = await prisma.serviceCategory.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      services: {
        where: {
          OR: [{ serviceStatus: null }, { serviceStatus: { name: { in: ["Ativo", "ACTIVE"] } } }],
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          durationMin: true,
          price: true,
        },
      },
    },
  });

  return categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      services: category.services.map((service) => ({
        id: service.id,
        name: service.name,
        durationMin: resolveDurationMin(service.durationMin),
        price: service.price.toString(),
      })),
    }))
    .filter((category) => category.services.length > 0);
};

export const listPublicPeriodsForService = async (params: {
  unitId: number;
  dateIso: string;
  serviceId: number;
}): Promise<Array<{ key: AvailabilityPeriod; label: string; availableStarts: number; totalStarts: number }>> => {
  const summary = await listServiceAvailability({
    unitId: params.unitId,
    dateIso: params.dateIso,
    serviceId: params.serviceId,
  });
  if (!summary) return [];
  return summary.periods.map((period) => ({
    key: period.period,
    label: period.label,
    availableStarts: period.availableStarts,
    totalStarts: period.totalStarts,
  }));
};

export const listPublicSlotsForService = async (params: {
  unitId: number;
  dateIso: string;
  serviceId: number;
  period: AvailabilityPeriod;
}): Promise<Array<{ slotLabel: string; hourIni: string; hourFinish: string; professionalsAvailable: number }>> => {
  const summary = await listServiceAvailability({
    unitId: params.unitId,
    dateIso: params.dateIso,
    serviceId: params.serviceId,
    period: params.period,
  });
  if (!summary) return [];
  return summary.slots.map((slot) => ({
    slotLabel: slot.slotLabel,
    hourIni: slot.hourIni,
    hourFinish: slot.hourFinish,
    professionalsAvailable: slot.professionalsAvailable,
  }));
};
