import { AppointmentStatus, OrderStatus, Prisma, SubscriptionStatus } from "@prisma/client";
import prisma from "../../../lib/prisma";
import { resolveAdminPeriodRange, type AdminPeriodInput } from "./period";

export type AdminDashboardKpisInput = AdminPeriodInput;

type RevenueKpi = {
  current: number;
  previous: number;
  deltaPercent: number;
  avgTicket: number;
};

type OrdersKpi = {
  total: number;
  paid: number;
  byStatus: Record<OrderStatus, number>;
};

type AppointmentsKpi = {
  scheduledToday: number;
  totalInPeriod: number;
  byStatus: Record<AppointmentStatus, number>;
};

type SubscriptionsKpi = {
  activeTotal: number;
  newInPeriod: number;
  byStatus: Record<SubscriptionStatus, number>;
};

type CustomersKpi = {
  newInPeriod: number;
};

export type AdminDashboardKpis = {
  period: {
    from: string;
    to: string;
    days: number;
  };
  revenue: RevenueKpi;
  orders: OrdersKpi;
  appointments: AppointmentsKpi;
  subscriptions: SubscriptionsKpi;
  customers: CustomersKpi;
};

const ORDER_STATUS_LIST: OrderStatus[] = ["PENDENTE", "PAGO", "ENVIADO", "ENTREGUE", "CANCELADO"];
const APPOINTMENT_STATUS_LIST: AppointmentStatus[] = ["PENDENTE", "CONFIRMADO", "CANCELADO"];
const SUBSCRIPTION_STATUS_LIST: SubscriptionStatus[] = [
  "ATIVA",
  "PENDENTE",
  "CANCELADA",
  "INADIMPLENTE",
];

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

const decimalToNumber = (value: Prisma.Decimal | null | undefined): number => {
  if (!value) return 0;
  const normalized = value.toNumber();
  return Number.isFinite(normalized) ? normalized : 0;
};

const emptyStatusMap = <T extends string>(statuses: readonly T[]): Record<T, number> => {
  return statuses.reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as Record<T, number>
  );
};

export const getAdminDashboardKpis = async (
  input: AdminDashboardKpisInput = {}
): Promise<AdminDashboardKpis> => {
  const range = resolveAdminPeriodRange(input);
  const periodWhere = { gte: range.from, lte: range.to };
  const previousWhere = { gte: range.previousFrom, lte: range.previousTo };
  const todayStart = toStartOfDay(new Date());
  const todayEnd = toEndOfDay(new Date());

  const [
    paidRevenueCurrent,
    paidRevenuePrevious,
    ordersByStatusRows,
    appointmentsByStatusRows,
    subscriptionsByStatusRows,
    appointmentsToday,
    subscriptionsNewInPeriod,
    subscriptionsActive,
    customersNewInPeriod,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { createdAt: periodWhere, status: "PAGO" },
      _sum: { total: true },
      _avg: { total: true },
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: previousWhere, status: "PAGO" },
      _sum: { total: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: periodWhere },
      _count: { _all: true },
    }),
    prisma.appointment.groupBy({
      by: ["status"],
      where: { start: periodWhere },
      _count: { _all: true },
    }),
    prisma.subscription.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.appointment.count({
      where: {
        start: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    }),
    prisma.subscription.count({
      where: {
        createdAt: periodWhere,
      },
    }),
    prisma.subscription.count({
      where: {
        status: "ATIVA",
      },
    }),
    prisma.customer.count({
      where: {
        createdAt: periodWhere,
      },
    }),
  ]);

  const ordersByStatus = emptyStatusMap(ORDER_STATUS_LIST);
  for (const row of ordersByStatusRows) {
    ordersByStatus[row.status] = row._count._all;
  }

  const appointmentsByStatus = emptyStatusMap(APPOINTMENT_STATUS_LIST);
  for (const row of appointmentsByStatusRows) {
    appointmentsByStatus[row.status] = row._count._all;
  }

  const subscriptionsByStatus = emptyStatusMap(SUBSCRIPTION_STATUS_LIST);
  for (const row of subscriptionsByStatusRows) {
    subscriptionsByStatus[row.status] = row._count._all;
  }

  const revenueCurrent = decimalToNumber(paidRevenueCurrent._sum.total);
  const revenuePrevious = decimalToNumber(paidRevenuePrevious._sum.total);
  const deltaPercent =
    revenuePrevious > 0 ? ((revenueCurrent - revenuePrevious) / revenuePrevious) * 100 : 0;
  const ordersTotal = ORDER_STATUS_LIST.reduce((acc, status) => acc + ordersByStatus[status], 0);
  const appointmentsTotal = APPOINTMENT_STATUS_LIST.reduce(
    (acc, status) => acc + appointmentsByStatus[status],
    0
  );

  return {
    period: {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      days: range.days,
    },
    revenue: {
      current: revenueCurrent,
      previous: revenuePrevious,
      deltaPercent,
      avgTicket: decimalToNumber(paidRevenueCurrent._avg.total),
    },
    orders: {
      total: ordersTotal,
      paid: ordersByStatus.PAGO,
      byStatus: ordersByStatus,
    },
    appointments: {
      scheduledToday: appointmentsToday,
      totalInPeriod: appointmentsTotal,
      byStatus: appointmentsByStatus,
    },
    subscriptions: {
      activeTotal: subscriptionsActive,
      newInPeriod: subscriptionsNewInPeriod,
      byStatus: subscriptionsByStatus,
    },
    customers: {
      newInPeriod: customersNewInPeriod,
    },
  };
};
