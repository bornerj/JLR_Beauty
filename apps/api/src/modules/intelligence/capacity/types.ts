/**
 * Admin V2 (PLAN-0022, Onda 4) — Mapa de Capacidade da Agenda (RETROFIT-005).
 * Contrato de tipos único do módulo (mesmo padrão de `operational-orders/types.ts`):
 * `heatmap.ts` (puro) e `service.ts` (Prisma) importam daqui, nunca duplicam.
 */

/** Linha de escala já normalizada (hourStart/hourFinish convertidos para minutos via `clockToMinutes`). */
export type ShiftRow = {
  professionalId: number;
  professionalName: string;
  workDate: Date;
  startMinutes: number;
  endMinutes: number;
};

/**
 * Linha de agendamento já normalizada: `end` sempre preenchido (fallback via
 * `Service.durationMin` aplicado em `service.ts`, mesmo padrão de `capacity/calculator.ts`
 * da Onda 1) e `servicePrice` já convertido de `Prisma.Decimal` para `number`.
 */
export type AppointmentRow = {
  id: number;
  professionalId: number;
  professionalName: string;
  clientName: string;
  serviceName: string;
  servicePrice: number;
  start: Date;
  end: Date;
};

export type CapacitySlot = {
  hour: number; // 0-23, início do bucket
  availableMinutes: number;
  bookedMinutes: number;
  occupancyRate: number; // 0-100
  revenueActual: number;
  /** receita realizada / hora de capacidade disponível (inclui horas ociosas no denominador) — 0 quando não há receita, null só quando não há capacidade disponível nenhuma. */
  revenuePerAvailableHour: number | null;
  /** receita realizada / hora efetivamente reservada — null quando não houve nenhuma reserva neste horário. */
  revenuePerBookedHour: number | null;
};

export type CapacityDay = {
  date: string; // YYYY-MM-DD
  weekday: number; // 0 (domingo) - 6 (sábado)
  slots: CapacitySlot[];
};

export type CapacityHeatmap = {
  unitId: number;
  unitName: string;
  period: { from: string; to: string; days: number };
  /** Grade de horas comuns a todos os dias (menor início / maior fim de escala no período); null quando não há nenhuma escala cadastrada. */
  hourRange: { start: number; end: number } | null;
  /** Receita média por hora reservada na unidade, no período inteiro — usada como taxa de referência honesta no drill-down de um horário sem reservas próprias (ver `service.ts`). */
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
  /** Escalado neste horário mas sem nenhum minuto reservado. */
  isIdle: boolean;
  appointments: SlotAppointment[];
};

export type SlotLostRevenueEstimate = { amount: number; explanation: string } | null;

export type SlotDetail = {
  unitId: number;
  unitName: string;
  date: string;
  hour: number;
  availableMinutes: number;
  bookedMinutes: number;
  occupancyRate: number;
  revenuePerBookedHour: number | null;
  /**
   * Estimativa honesta de receita perdida (governança #6 do PLAN-0022 — nunca só o
   * número, sempre a explicação da composição). Null quando não há minutos ociosos ou
   * quando não existe nenhuma taxa de referência (nem do próprio horário, nem da média
   * da unidade no período) para calcular algo que não seja fabricado.
   */
  lostRevenueEstimate: SlotLostRevenueEstimate;
  professionals: SlotProfessional[];
};
