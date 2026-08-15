/** Admin V2 (PLAN-0022, Onda 4) — Mapa de Capacidade da Agenda (RETROFIT-005). Espelha apps/api/src/modules/intelligence/capacity/types.ts. */

export type CapacitySlot = {
  hour: number;
  availableMinutes: number;
  bookedMinutes: number;
  occupancyRate: number;
  revenueActual: number;
  revenuePerAvailableHour: number | null;
  revenuePerBookedHour: number | null;
};

export type CapacityDay = {
  date: string;
  weekday: number;
  slots: CapacitySlot[];
};

export type CapacityHeatmap = {
  unitId: number;
  unitName: string;
  period: { from: string; to: string; days: number };
  hourRange: { start: number; end: number } | null;
  unitRevenuePerBookedHour: number | null;
  days: CapacityDay[];
};

export type SlotAppointment = {
  appointmentId: number;
  clientName: string;
  serviceName: string;
  start: string;
  end: string;
};

export type SlotProfessional = {
  professionalId: number;
  professionalName: string;
  scheduledMinutes: number;
  bookedMinutes: number;
  isIdle: boolean;
  appointments: SlotAppointment[];
};

export type SlotDetail = {
  unitId: number;
  unitName: string;
  date: string;
  hour: number;
  availableMinutes: number;
  bookedMinutes: number;
  occupancyRate: number;
  revenuePerBookedHour: number | null;
  lostRevenueEstimate: { amount: number; explanation: string } | null;
  professionals: SlotProfessional[];
};
