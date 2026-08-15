/**
 * Admin V2 (PLAN-0022, Onda 5) — Portfólio Vivo de Produtos (RETROFIT-006).
 * Contrato único do módulo (mesmo padrão de `operational-orders/types.ts` e
 * `capacity/types.ts`): `classifier.ts` (puro) e `service.ts` (Prisma) importam daqui.
 */

/**
 * Matriz margem×volume. `SEM_VENDA` é um 5º estado, não previsto no texto original da
 * onda (que só definia Joias/Estrelas/Fracos/Armadilhas) — adicionado porque um produto
 * sem nenhuma venda no período não tem margem para classificar contra a mediana; forçá-lo
 * em "Fraco" fabricaria um dado que não existe (governança #6). Continua aparecendo na
 * lista, com `capitalParked` em destaque — é o sinal mais importante justamente para ele.
 */
export type ProductQuadrant = "ESTRELA" | "JOIA" | "ARMADILHA" | "FRACO" | "SEM_VENDA";

export type ProductUnitBreakdown = {
  unitId: number;
  unitName: string;
  quantitySold: number;
  revenue: number;
  cmv: number;
  /** null só quando a unidade não teve nenhuma venda deste produto no período (só estoque parado). */
  marginPercent: number | null;
  /** estoque físico atual × custo, nesta unidade. */
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
  /** Mediana de quantidade vendida entre os produtos com venda no período — explica a classificação (governança #6, nunca só o rótulo). */
  volumeMedian: number;
  /** Mediana de margem entre os produtos com venda e receita > 0; null quando nenhum produto vendido teve receita. */
  marginMedian: number | null;
  products: PortfolioProduct[];
};

/** Totais já agregados de um produto, entrada do classificador puro (`classifier.ts`). */
export type ProductTotals = {
  productId: number;
  name: string;
  quantitySold: number;
  revenue: number;
  cmv: number;
  capitalParked: number;
  byUnit: ProductUnitBreakdown[];
};
