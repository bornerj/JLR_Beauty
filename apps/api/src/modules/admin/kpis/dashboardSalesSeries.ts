import { Prisma } from "@prisma/client";
import prisma from "../../../lib/prisma";
import { resolveAdminPeriodRange, type AdminPeriodInput } from "./period";

export type AdminDashboardSalesScope = "SERVICES" | "PRODUCTS" | "SUBSCRIPTIONS" | "ALL";

export type AdminDashboardSalesSeriesInput = AdminPeriodInput & {
  scope?: AdminDashboardSalesScope;
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

const dateKey = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const decimalToNumber = (value: Prisma.Decimal): number => {
  const normalized = value.toNumber();
  return Number.isFinite(normalized) ? normalized : 0;
};

const matchesScope = (
  scope: AdminDashboardSalesScope,
  item: { productId: number | null; serviceId: number | null; membershipId: number | null }
): boolean => {
  if (scope === "ALL") return true;
  if (scope === "SERVICES") return item.serviceId !== null;
  if (scope === "PRODUCTS") return item.productId !== null;
  if (scope === "SUBSCRIPTIONS") return item.membershipId !== null;
  return false;
};

export const getAdminDashboardSalesSeries = async (
  input: AdminDashboardSalesSeriesInput = {}
): Promise<AdminDashboardSalesSeries> => {
  const scope: AdminDashboardSalesScope = input.scope || "SERVICES";
  const range = resolveAdminPeriodRange(input);
  const pointsMap = new Map<string, number>();
  const labelsMap = new Map<string, string>();

  const cursor = new Date(range.from);
  while (cursor.getTime() <= range.to.getTime()) {
    const key = dateKey(cursor);
    pointsMap.set(key, 0);
    labelsMap.set(key, String(cursor.getDate()));
    cursor.setDate(cursor.getDate() + 1);
  }

  const paidOrders = await prisma.order.findMany({
    where: {
      status: "PAGO",
      createdAt: {
        gte: range.from,
        lte: range.to,
      },
    },
    select: {
      id: true,
      createdAt: true,
      items: {
        select: {
          quantity: true,
          unitPrice: true,
          productId: true,
          serviceId: true,
          membershipId: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  let gross = 0;
  let itemsSold = 0;
  let ordersPaidWithScope = 0;

  for (const order of paidOrders) {
    const key = dateKey(order.createdAt);
    let orderMatched = false;
    for (const item of order.items) {
      if (!matchesScope(scope, item)) continue;
      const quantity = Number(item.quantity || 0);
      const value = decimalToNumber(item.unitPrice) * quantity;
      pointsMap.set(key, (pointsMap.get(key) || 0) + value);
      gross += value;
      itemsSold += quantity;
      orderMatched = true;
    }
    if (orderMatched) {
      ordersPaidWithScope += 1;
    }
  }

  const points = Array.from(pointsMap.entries()).map(([date, value]) => ({
    date,
    label: labelsMap.get(date) || date,
    value,
  }));

  return {
    period: {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      days: range.days,
    },
    scope,
    totals: {
      gross,
      ordersPaid: ordersPaidWithScope,
      itemsSold,
    },
    points,
  };
};

