import { AppointmentStatus } from "@prisma/client";
import prisma from "../../../lib/prisma";

export type AdminDashboardAgendaSummaryInput = {
  month?: string;
  date?: string;
};

type CalendarDay = {
  date: string;
  label: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  totalAppointments: number;
};

type AgendaAppointmentRow = {
  id: number;
  startIso: string;
  timeLabel: string;
  status: AppointmentStatus;
  clientName: string;
  serviceName: string;
  professionalName: string;
  unitName: string;
};

export type AdminDashboardAgendaSummary = {
  month: {
    key: string;
    label: string;
    from: string;
    to: string;
  };
  selectedDate: {
    iso: string;
    label: string;
  };
  calendar: {
    days: CalendarDay[];
  };
  summary: {
    total: number;
    byStatus: Record<AppointmentStatus, number>;
  };
  appointments: AgendaAppointmentRow[];
};

const APPOINTMENT_STATUS_LIST: AppointmentStatus[] = ["PENDENTE", "CONFIRMADO", "CANCELADO"];

const toStartOfDay = (value: Date): Date => {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
};

const toEndOfDay = (value: Date): Date => {
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next;
};

const dateKey = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseMonthStart = (monthRaw: string | undefined): Date => {
  if (!monthRaw) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const normalized = monthRaw.trim();
  if (!/^\d{4}-\d{2}$/.test(normalized)) {
    throw new Error("invalid_month");
  }
  const parsed = new Date(`${normalized}-01T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("invalid_month");
  }
  return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
};

const parseSelectedDate = (dateRaw: string | undefined, monthStart: Date): Date => {
  if (!dateRaw) {
    const today = new Date();
    if (
      today.getFullYear() === monthStart.getFullYear() &&
      today.getMonth() === monthStart.getMonth()
    ) {
      return today;
    }
    return monthStart;
  }
  const normalized = dateRaw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error("invalid_date");
  }
  const parsed = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("invalid_date");
  }
  if (
    parsed.getFullYear() !== monthStart.getFullYear() ||
    parsed.getMonth() !== monthStart.getMonth()
  ) {
    throw new Error("invalid_date");
  }
  return parsed;
};

const emptyStatusMap = (): Record<AppointmentStatus, number> => {
  return APPOINTMENT_STATUS_LIST.reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as Record<AppointmentStatus, number>
  );
};

export const getAdminDashboardAgendaSummary = async (
  input: AdminDashboardAgendaSummaryInput = {}
): Promise<AdminDashboardAgendaSummary> => {
  const monthStart = parseMonthStart(input.month);
  const monthEnd = toEndOfDay(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0));
  const selectedDate = parseSelectedDate(input.date, monthStart);
  const selectedStart = toStartOfDay(selectedDate);
  const selectedEnd = toEndOfDay(selectedDate);

  const calendarStart = toStartOfDay(new Date(monthStart));
  calendarStart.setDate(monthStart.getDate() - monthStart.getDay());
  const calendarEnd = toEndOfDay(new Date(monthEnd));
  calendarEnd.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));

  const [calendarRows, selectedRows] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        start: {
          gte: calendarStart,
          lte: calendarEnd,
        },
      },
      select: {
        start: true,
      },
      orderBy: {
        start: "asc",
      },
    }),
    prisma.appointment.findMany({
      where: {
        start: {
          gte: selectedStart,
          lte: selectedEnd,
        },
      },
      include: {
        service: {
          select: { name: true },
        },
        professional: {
          select: { name: true },
        },
        unit: {
          select: { name: true },
        },
      },
      orderBy: {
        start: "asc",
      },
      take: 30,
    }),
  ]);

  const dayTotals = new Map<string, number>();
  for (const row of calendarRows) {
    const key = dateKey(row.start);
    dayTotals.set(key, (dayTotals.get(key) || 0) + 1);
  }

  const todayKey = dateKey(new Date());
  const selectedKey = dateKey(selectedDate);
  const calendarDays: CalendarDay[] = [];
  const cursor = new Date(calendarStart);
  while (cursor.getTime() <= calendarEnd.getTime()) {
    const key = dateKey(cursor);
    calendarDays.push({
      date: key,
      label: String(cursor.getDate()),
      inCurrentMonth:
        cursor.getFullYear() === monthStart.getFullYear() &&
        cursor.getMonth() === monthStart.getMonth(),
      isToday: key === todayKey,
      isSelected: key === selectedKey,
      totalAppointments: dayTotals.get(key) || 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const statusMap = emptyStatusMap();
  const appointments: AgendaAppointmentRow[] = selectedRows.map((row) => {
    statusMap[row.status] = (statusMap[row.status] || 0) + 1;
    return {
      id: row.id,
      startIso: row.start.toISOString(),
      timeLabel: row.start.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: row.status,
      clientName: row.clientName,
      serviceName: row.service.name,
      professionalName: row.professional.name,
      unitName: row.unit.name,
    };
  });

  return {
    month: {
      key: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`,
      label: monthStart.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      }),
      from: monthStart.toISOString(),
      to: monthEnd.toISOString(),
    },
    selectedDate: {
      iso: selectedStart.toISOString(),
      label: selectedStart.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      }),
    },
    calendar: {
      days: calendarDays,
    },
    summary: {
      total: appointments.length,
      byStatus: statusMap,
    },
    appointments,
  };
};

