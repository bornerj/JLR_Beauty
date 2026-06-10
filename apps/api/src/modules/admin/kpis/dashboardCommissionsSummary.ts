import { AppointmentStatus, Prisma } from "@prisma/client";
import prisma from "../../../lib/prisma";
import { resolveAdminPeriodRange, type AdminPeriodInput } from "./period";

export type AdminDashboardCommissionPaymentStatus = "PAGO" | "PENDENTE";

export type AdminDashboardCommissionsSummaryInput = AdminPeriodInput;

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

type AggregatedProfessional = {
  professionalId: number;
  professionalName: string;
  roleLabel: string;
  unitName: string;
  servicesPerformed: number;
  totalSales: number;
  commissionPercentSum: number;
  commissionPercentCount: number;
  commissionTotal: number;
  paidItems: number;
  pendingItems: number;
};

const decimalToNumber = (value: Prisma.Decimal | null | undefined): number => {
  if (!value) return 0;
  const normalized = value.toNumber();
  return Number.isFinite(normalized) ? normalized : 0;
};

const isAppointmentPaid = (appointment: {
  order: { status: string; payments: Array<{ status: string }> } | null;
}): boolean => {
  if (!appointment.order) return false;
  if (appointment.order.status === "PAGO") return true;
  return appointment.order.payments.some((payment) => payment.status === "APROVADO");
};

const shouldCountForCommission = (status: AppointmentStatus): boolean => {
  return status === "CONFIRMADO";
};

export const getAdminDashboardCommissionsSummary = async (
  input: AdminDashboardCommissionsSummaryInput = {}
): Promise<AdminDashboardCommissionsSummary> => {
  const range = resolveAdminPeriodRange(input);
  const appointments = await prisma.appointment.findMany({
    where: {
      start: {
        gte: range.from,
        lte: range.to,
      },
      status: {
        in: ["CONFIRMADO", "PENDENTE"],
      },
    },
    include: {
      professional: {
        select: {
          id: true,
          name: true,
          commissionPercent: true,
          unit: {
            select: {
              name: true,
            },
          },
        },
      },
      service: {
        select: {
          price: true,
          commissionPercent: true,
        },
      },
      order: {
        select: {
          status: true,
          payments: {
            select: {
              status: true,
            },
          },
        },
      },
    },
  });

  const aggregated = new Map<number, AggregatedProfessional>();

  for (const appointment of appointments) {
    const professionalId = appointment.professional.id;
    const current = aggregated.get(professionalId) || {
      professionalId,
      professionalName: appointment.professional.name,
      roleLabel: "Profissional",
      unitName: appointment.professional.unit?.name || "-",
      servicesPerformed: 0,
      totalSales: 0,
      commissionPercentSum: 0,
      commissionPercentCount: 0,
      commissionTotal: 0,
      paidItems: 0,
      pendingItems: 0,
    };

    const saleValue = decimalToNumber(appointment.service.price);
    const professionalPercent = appointment.professional.commissionPercent;
    const servicePercent = appointment.service.commissionPercent;
    const commissionPercent =
      professionalPercent !== null && professionalPercent !== undefined
        ? decimalToNumber(professionalPercent)
        : Number(servicePercent || 0);
    const commissionValue =
      shouldCountForCommission(appointment.status) && commissionPercent > 0
        ? saleValue * (commissionPercent / 100)
        : 0;

    current.servicesPerformed += 1;
    current.totalSales += saleValue;
    current.commissionPercentSum += commissionPercent;
    current.commissionPercentCount += 1;
    current.commissionTotal += commissionValue;
    if (isAppointmentPaid(appointment)) {
      current.paidItems += 1;
    } else {
      current.pendingItems += 1;
    }

    aggregated.set(professionalId, current);
  }

  const rows = Array.from(aggregated.values())
    .map<AdminDashboardCommissionRow>((item) => ({
      professionalId: item.professionalId,
      professionalName: item.professionalName,
      roleLabel: item.roleLabel,
      unitName: item.unitName,
      servicesPerformed: item.servicesPerformed,
      totalSales: item.totalSales,
      commissionPercent:
        item.commissionPercentCount > 0 ? item.commissionPercentSum / item.commissionPercentCount : 0,
      commissionTotal: item.commissionTotal,
      paymentStatus: item.pendingItems > 0 ? "PENDENTE" : "PAGO",
    }))
    .sort((a, b) => b.commissionTotal - a.commissionTotal);

  const paidProfessionals = rows.filter((row) => row.paymentStatus === "PAGO").length;
  const pendingProfessionals = rows.filter((row) => row.paymentStatus === "PENDENTE").length;

  return {
    period: {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      days: range.days,
    },
    totals: {
      professionals: rows.length,
      services: rows.reduce((acc, item) => acc + item.servicesPerformed, 0),
      totalSales: rows.reduce((acc, item) => acc + item.totalSales, 0),
      totalCommissions: rows.reduce((acc, item) => acc + item.commissionTotal, 0),
      paidProfessionals,
      pendingProfessionals,
    },
    rows,
  };
};

