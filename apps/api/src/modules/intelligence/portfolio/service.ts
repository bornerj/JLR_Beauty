import { Prisma } from "@prisma/client";
import prisma from "../../../lib/prisma";
import { resolveAdminPeriodRange, type AdminPeriodInput } from "../../admin/kpis/period";
import { classifyPortfolio } from "./classifier";
import type { PortfolioProducts, ProductTotals, ProductUnitBreakdown } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 5) — Portfólio Vivo de Produtos (RETROFIT-006).
 * Camada de acesso a dados: agrega vendas reais (`OrderItem`/`Order` PAGO no período,
 * mesma convenção de `dashboardSalesInsights.ts` — mas sem o corte de top 10, aqui é o
 * portfólio inteiro) e capital parado (`ProductStock.stock × Product.costPrice`), então
 * delega a classificação para `classifier.ts` (puro). Nenhuma escrita.
 *
 * Nota sobre o texto original da onda: o plano cita `ProductStock.quantity` — o campo
 * real no schema é `ProductStock.stock` (ver Onda 1 do PLAN-0020); usado aqui.
 */

const round2 = (value: number): number => Math.round(value * 100) / 100;

const decimalToNumber = (value: Prisma.Decimal | null | undefined): number => {
  if (!value) return 0;
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : 0;
};

type Accumulator = {
  name: string;
  quantitySold: number;
  revenue: number;
  cmv: number;
  capitalParked: number;
  byUnit: Map<number, ProductUnitBreakdown>;
};

const ensureProduct = (map: Map<number, Accumulator>, productId: number, name: string): Accumulator => {
  const existing = map.get(productId);
  if (existing) return existing;
  const created: Accumulator = { name, quantitySold: 0, revenue: 0, cmv: 0, capitalParked: 0, byUnit: new Map() };
  map.set(productId, created);
  return created;
};

const ensureUnit = (acc: Accumulator, unitId: number, unitName: string): ProductUnitBreakdown => {
  const existing = acc.byUnit.get(unitId);
  if (existing) return existing;
  const created: ProductUnitBreakdown = { unitId, unitName, quantitySold: 0, revenue: 0, cmv: 0, marginPercent: null, capitalParked: 0 };
  acc.byUnit.set(unitId, created);
  return created;
};

export const getPortfolioProducts = async (
  input: AdminPeriodInput & { unitIds?: number[] }
): Promise<PortfolioProducts> => {
  const range = resolveAdminPeriodRange(input);
  const unitScope = input.unitIds && input.unitIds.length > 0 ? { in: input.unitIds } : undefined;

  const [orderItems, stockRows] = await Promise.all([
    prisma.orderItem.findMany({
      where: {
        productId: { not: null },
        order: {
          status: "PAGO",
          createdAt: { gte: range.from, lte: range.to },
          ...(unitScope ? { unitId: unitScope } : {}),
        },
      },
      select: {
        productId: true,
        quantity: true,
        unitPrice: true,
        unitCost: true,
        product: { select: { name: true } },
        order: { select: { unitId: true, unit: { select: { name: true } } } },
      },
    }),
    prisma.productStock.findMany({
      where: unitScope ? { unitId: unitScope } : {},
      select: {
        productId: true,
        unitId: true,
        stock: true,
        product: { select: { name: true, costPrice: true } },
        unit: { select: { name: true } },
      },
    }),
  ]);

  const productMap = new Map<number, Accumulator>();

  for (const item of orderItems) {
    if (!item.productId || !item.product) continue;
    const quantity = Number(item.quantity || 0);
    const revenue = decimalToNumber(item.unitPrice) * quantity;
    const cmv = decimalToNumber(item.unitCost) * quantity;

    const acc = ensureProduct(productMap, item.productId, item.product.name);
    acc.quantitySold += quantity;
    acc.revenue += revenue;
    acc.cmv += cmv;

    // Pedidos legados sem unidade atribuída (unitId nullable no schema) entram nos
    // totais do produto mas não têm como aparecer no drill-down por unidade — não fabrica
    // uma atribuição de unidade que o dado não tem.
    if (item.order.unitId !== null && item.order.unit) {
      const unitEntry = ensureUnit(acc, item.order.unitId, item.order.unit.name);
      unitEntry.quantitySold += quantity;
      unitEntry.revenue += revenue;
      unitEntry.cmv += cmv;
    }
  }

  for (const row of stockRows) {
    const acc = ensureProduct(productMap, row.productId, row.product.name);
    const capital = row.stock * decimalToNumber(row.product.costPrice);
    acc.capitalParked += capital;

    const unitEntry = ensureUnit(acc, row.unitId, row.unit.name);
    unitEntry.capitalParked += capital;
  }

  const totals: ProductTotals[] = Array.from(productMap.entries()).map(([productId, acc]) => ({
    productId,
    name: acc.name,
    quantitySold: acc.quantitySold,
    revenue: acc.revenue,
    cmv: acc.cmv,
    capitalParked: acc.capitalParked,
    byUnit: Array.from(acc.byUnit.values())
      .map((unit) => ({
        ...unit,
        revenue: round2(unit.revenue),
        cmv: round2(unit.cmv),
        capitalParked: round2(unit.capitalParked),
        marginPercent: unit.revenue > 0 ? round2(((unit.revenue - unit.cmv) / unit.revenue) * 100) : unit.quantitySold > 0 ? 0 : null,
      }))
      .sort((a, b) => b.revenue - a.revenue),
  }));

  const { products, volumeMedian, marginMedian } = classifyPortfolio(totals);
  const sorted = [...products].sort((a, b) => b.revenue - a.revenue || b.capitalParked - a.capitalParked);

  return {
    period: { from: range.from.toISOString(), to: range.to.toISOString(), days: range.days },
    volumeMedian,
    marginMedian,
    products: sorted,
  };
};
