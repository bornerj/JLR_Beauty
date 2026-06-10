export type OrderStatusKpi = "PENDENTE" | "PAGO" | "ENVIADO" | "ENTREGUE" | "CANCELADO";
export type AppointmentStatusKpi = "PENDENTE" | "CONFIRMADO" | "CANCELADO";
export type SubscriptionStatusKpi = "ATIVA" | "PENDENTE" | "CANCELADA" | "INADIMPLENTE";
export type AdminDashboardSalesScope = "SERVICES" | "PRODUCTS" | "SUBSCRIPTIONS" | "ALL";

export type AdminDashboardKpis = {
  period: {
    from: string;
    to: string;
    days: number;
  };
  revenue: {
    current: number;
    previous: number;
    deltaPercent: number;
    avgTicket: number;
  };
  orders: {
    total: number;
    paid: number;
    byStatus: Record<OrderStatusKpi, number>;
  };
  appointments: {
    scheduledToday: number;
    totalInPeriod: number;
    byStatus: Record<AppointmentStatusKpi, number>;
  };
  subscriptions: {
    activeTotal: number;
    newInPeriod: number;
    byStatus: Record<SubscriptionStatusKpi, number>;
  };
  customers: {
    newInPeriod: number;
  };
};

export type AdminDashboardSalesSeriesPoint = {
  date: string;
  label: string;
  value: number;
};

export type AdminDashboardSalesSeries = {
  period: {
    from: string;
    to: string;
    days: number;
  };
  scope: AdminDashboardSalesScope;
  totals: {
    gross: number;
    ordersPaid: number;
    itemsSold: number;
  };
  points: AdminDashboardSalesSeriesPoint[];
};

export type AdminDashboardAgendaDay = {
  date: string;
  label: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  totalAppointments: number;
};

export type AdminDashboardAgendaAppointment = {
  id: number;
  startIso: string;
  timeLabel: string;
  status: AppointmentStatusKpi;
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
    days: AdminDashboardAgendaDay[];
  };
  summary: {
    total: number;
    byStatus: Record<AppointmentStatusKpi, number>;
  };
  appointments: AdminDashboardAgendaAppointment[];
};

export type AdminDashboardCommissionPaymentStatus = "PAGO" | "PENDENTE";

export type AdminDashboardCommissionRow = {
  professionalId: number;
  professionalName: string;
  roleLabel: string;
  unitName: string;
  servicesPerformed: number;
  totalSales: number;
  commissionPercent: number;
  commissionTotal: number;
  paymentStatus: AdminDashboardCommissionPaymentStatus;
};

export type AdminDashboardCommissionsSummary = {
  period: {
    from: string;
    to: string;
    days: number;
  };
  totals: {
    professionals: number;
    services: number;
    totalSales: number;
    totalCommissions: number;
    paidProfessionals: number;
    pendingProfessionals: number;
  };
  rows: AdminDashboardCommissionRow[];
};
