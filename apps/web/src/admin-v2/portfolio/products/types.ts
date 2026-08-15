/** Admin V2 (PLAN-0022, Onda 5) — Portfólio Vivo de Produtos (RETROFIT-006). Espelha apps/api/src/modules/intelligence/portfolio/types.ts. */

export type ProductQuadrant = "ESTRELA" | "JOIA" | "ARMADILHA" | "FRACO" | "SEM_VENDA";

export type ProductUnitBreakdown = {
  unitId: number;
  unitName: string;
  quantitySold: number;
  revenue: number;
  cmv: number;
  marginPercent: number | null;
  capitalParked: number;
};

export type PortfolioProduct = {
  productId: number;
  name: string;
  quadrant: ProductQuadrant;
  quantitySold: number;
  revenue: number;
  cmv: number;
  marginPercent: number | null;
  capitalParked: number;
  byUnit: ProductUnitBreakdown[];
};

export type PortfolioProducts = {
  period: { from: string; to: string; days: number };
  volumeMedian: number;
  marginMedian: number | null;
  products: PortfolioProduct[];
};
