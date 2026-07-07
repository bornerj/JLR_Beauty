import { Prisma } from "@prisma/client";
import prisma from "../../../lib/prisma";
import { resolveAdminPeriodRange, type AdminPeriodInput } from "./period";

/**
 * PLAN-0020 — BI mínimo funcional com escopo por papel.
 * Todos os números derivam de pedidos PAGO no período, filtráveis por
 * unidade e/ou vendedor — o RECORTE é imposto pela rota (S4), aqui só filtra.
 */

export type SalesInsightsInput = AdminPeriodInput & {
  unitId?: number;
  sellerUserId?: number;
};

export type SalesInsights = {
  period: { from: string; to: string; days: number };
  filters: { unitId: number | null; sellerUserId: number | null };
  totals: {
    revenue: number;
    ordersPaid: number;
    avgTicket: number;
    itemsSold: number;
    cmv: number;
    grossProfit: number;
    marginPercent: number;
  };
  byChannel: Array<{ channel: string; revenue: number; orders: number }>;
  topProducts: Array<{
    productId: number;
    name: string;
    quantity: number;
    revenue: number;
    cmv: number;
    profit: number;
  }>;
  topSellers: Array<{
    userId: number;
    name: string;
    revenue: number;
    orders: number;
  }>;
  topCustomers: Array<{ customer: string; revenue: number; orders: number }>;
};

const decimalToNumber = (value: Prisma.Decimal | null | undefined): number => {
  if (!value) return 0;
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : 0;
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

export const getSalesInsights = async (input: SalesInsightsInput): Promise<SalesInsights> => {
  const range = resolveAdminPeriodRange(input);

  const orders = await prisma.order.findMany({
    where: {
      status: "PAGO",
      createdAt: { gte: range.from, lte: range.to },
      ...(input.unitId ? { unitId: input.unitId } : {}),
      ...(input.sellerUserId ? { soldByUserId: input.sellerUserId } : {}),
    },
    select: {
      id: true,
      total: true,
      channel: true,
      customerName: true,
      customerEmail: true,
      soldBy: { select: { id: true, name: true } },
      items: {
        select: {
          quantity: true,
          unitPrice: true,
          unitCost: true,
          productId: true,
          product: { select: { name: true } },
        },
      },
    },
  });

  let revenue = 0;
  let itemsSold = 0;
  let cmv = 0;
  const channelMap = new Map<string, { revenue: number; orders: number }>();
  const productMap = new Map<
    number,
    { name: string; quantity: number; revenue: number; cmv: number }
  >();
  const sellerMap = new Map<number, { name: string; revenue: number; orders: number }>();
  const customerMap = new Map<string, { revenue: number; orders: number }>();

  for (const order of orders) {
    const orderTotal = decimalToNumber(order.total);
    revenue += orderTotal;

    const channelEntry = channelMap.get(order.channel) || { revenue: 0, orders: 0 };
    channelEntry.revenue += orderTotal;
    channelEntry.orders += 1;
    channelMap.set(order.channel, channelEntry);

    if (order.soldBy) {
      const sellerEntry = sellerMap.get(order.soldBy.id) || {
        name: order.soldBy.name,
        revenue: 0,
        orders: 0,
      };
      sellerEntry.revenue += orderTotal;
      sellerEntry.orders += 1;
      sellerMap.set(order.soldBy.id, sellerEntry);
    }

    const customerKey =
      (order.customerEmail || "").trim().toLowerCase() ||
      (order.customerName || "").trim() ||
      "(sem identificação)";
    const customerEntry = customerMap.get(customerKey) || { revenue: 0, orders: 0 };
    customerEntry.revenue += orderTotal;
    customerEntry.orders += 1;
    customerMap.set(customerKey, customerEntry);

    for (const item of order.items) {
      const quantity = Number(item.quantity || 0);
      itemsSold += quantity;
      const itemCost = decimalToNumber(item.unitCost) * quantity;
      cmv += itemCost;
      if (item.productId && item.product) {
        const productEntry = productMap.get(item.productId) || {
          name: item.product.name,
          quantity: 0,
          revenue: 0,
          cmv: 0,
        };
        productEntry.quantity += quantity;
        productEntry.revenue += decimalToNumber(item.unitPrice) * quantity;
        productEntry.cmv += itemCost;
        productMap.set(item.productId, productEntry);
      }
    }
  }

  const grossProfit = revenue - cmv;
  const topProducts = Array.from(productMap.entries())
    .map(([productId, entry]) => ({
      productId,
      name: entry.name,
      quantity: entry.quantity,
      revenue: round2(entry.revenue),
      cmv: round2(entry.cmv),
      profit: round2(entry.revenue - entry.cmv),
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  const topSellers = Array.from(sellerMap.entries())
    .map(([userId, entry]) => ({
      userId,
      name: entry.name,
      revenue: round2(entry.revenue),
      orders: entry.orders,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const topCustomers = Array.from(customerMap.entries())
    .map(([customer, entry]) => ({
      customer,
      revenue: round2(entry.revenue),
      orders: entry.orders,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    period: {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      days: range.days,
    },
    filters: {
      unitId: input.unitId ?? null,
      sellerUserId: input.sellerUserId ?? null,
    },
    totals: {
      revenue: round2(revenue),
      ordersPaid: orders.length,
      avgTicket: orders.length ? round2(revenue / orders.length) : 0,
      itemsSold,
      cmv: round2(cmv),
      grossProfit: round2(grossProfit),
      marginPercent: revenue > 0 ? round2((grossProfit / revenue) * 100) : 0,
    },
    byChannel: Array.from(channelMap.entries()).map(([channel, entry]) => ({
      channel,
      revenue: round2(entry.revenue),
      orders: entry.orders,
    })),
    topProducts,
    topSellers,
    topCustomers,
  };
};

export type InventoryOverview = {
  units: Array<{
    unitId: number;
    unitName: string;
    isOnline: boolean;
    items: number;
    stockValue: number;
    outOfStock: number;
    lowStock: number;
    excessStock: number;
  }>;
  consolidated: {
    stockValue: number;
    outOfStock: number;
    lowStock: number;
    excessStock: number;
  };
};

/** Resumo de estoque por unidade + consolidado (filtrável por escopo de unidades). */
export const getInventoryOverview = async (unitIds?: number[]): Promise<InventoryOverview> => {
  const rows = await prisma.productStock.findMany({
    where: unitIds && unitIds.length ? { unitId: { in: unitIds } } : {},
    select: {
      unitId: true,
      stock: true,
      unit: { select: { name: true, isOnline: true } },
      product: { select: { price: true, minStock: true, maxStock: true } },
    },
  });
  const unitMap = new Map<
    number,
    {
      unitName: string;
      isOnline: boolean;
      items: number;
      stockValue: number;
      outOfStock: number;
      lowStock: number;
      excessStock: number;
    }
  >();
  for (const row of rows) {
    const entry = unitMap.get(row.unitId) || {
      unitName: row.unit.name,
      isOnline: row.unit.isOnline,
      items: 0,
      stockValue: 0,
      outOfStock: 0,
      lowStock: 0,
      excessStock: 0,
    };
    entry.items += 1;
    entry.stockValue += decimalToNumber(row.product.price) * row.stock;
    if (row.stock <= 0) entry.outOfStock += 1;
    else if (row.stock <= row.product.minStock) entry.lowStock += 1;
    if (row.product.maxStock !== null && row.stock >= row.product.maxStock) {
      entry.excessStock += 1;
    }
    unitMap.set(row.unitId, entry);
  }
  const units = Array.from(unitMap.entries()).map(([unitId, entry]) => ({
    unitId,
    unitName: entry.unitName,
    isOnline: entry.isOnline,
    items: entry.items,
    stockValue: round2(entry.stockValue),
    outOfStock: entry.outOfStock,
    lowStock: entry.lowStock,
    excessStock: entry.excessStock,
  }));
  return {
    units,
    consolidated: {
      stockValue: round2(units.reduce((acc, unit) => acc + unit.stockValue, 0)),
      outOfStock: units.reduce((acc, unit) => acc + unit.outOfStock, 0),
      lowStock: units.reduce((acc, unit) => acc + unit.lowStock, 0),
      excessStock: units.reduce((acc, unit) => acc + unit.excessStock, 0),
    },
  };
};
