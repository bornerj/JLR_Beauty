import type { PortfolioProduct, ProductQuadrant, ProductTotals } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 5) — Portfólio Vivo de Produtos (RETROFIT-006).
 * Matriz margem×volume, pura (sem Prisma, testável isolada — mesmo padrão de
 * `operational-orders/classifier.ts` e `capacity/heatmap.ts`).
 *
 * "Alto"/"baixo" são sempre relativos à MEDIANA do próprio recorte pedido (período +
 * unidades), nunca um número fixo — não existe uma "boa margem %" universal que sirva
 * para qualquer catálogo/negócio; a mediana do próprio conjunto é o único corte honesto
 * disponível sem inventar um limiar arbitrário.
 */

const round1 = (value: number): number => Math.round(value * 10) / 10;
const round2 = (value: number): number => Math.round(value * 100) / 100;

export const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** 0% quando não há receita (produto sem venda, ou vendido a R$0 — caso degenerado) — nunca null aqui, null é reservado para "sem dado nenhum" em `classifyPortfolio`. */
const marginPercentOf = (revenue: number, cmv: number): number => (revenue > 0 ? ((revenue - cmv) / revenue) * 100 : 0);

export type PortfolioClassification = {
  products: PortfolioProduct[];
  volumeMedian: number;
  marginMedian: number | null;
};

export const classifyPortfolio = (totals: ProductTotals[]): PortfolioClassification => {
  const sold = totals.filter((t) => t.quantitySold > 0);
  const volumeMedian = round1(median(sold.map((t) => t.quantitySold)));

  const marginValues = sold.filter((t) => t.revenue > 0).map((t) => marginPercentOf(t.revenue, t.cmv));
  const marginMedian = marginValues.length > 0 ? round1(median(marginValues)) : null;

  const products: PortfolioProduct[] = totals.map((totalsRow) => {
    if (totalsRow.quantitySold === 0) {
      const quadrant: ProductQuadrant = "SEM_VENDA";
      return {
        productId: totalsRow.productId,
        name: totalsRow.name,
        quadrant,
        quantitySold: 0,
        revenue: 0,
        cmv: 0,
        marginPercent: null,
        capitalParked: round2(totalsRow.capitalParked),
        byUnit: totalsRow.byUnit,
      };
    }

    const marginPercent = round1(marginPercentOf(totalsRow.revenue, totalsRow.cmv));
    const highVolume = totalsRow.quantitySold >= volumeMedian;
    // marginMedian só é null no caso degenerado de todo produto vendido ter tido receita
    // R$0 — sem nenhuma referência de margem positiva, o corte conservador é "baixa margem".
    const highMargin = marginMedian !== null ? marginPercent >= marginMedian : false;

    let quadrant: ProductQuadrant;
    if (highVolume && highMargin) quadrant = "ESTRELA";
    else if (highVolume && !highMargin) quadrant = "ARMADILHA";
    else if (!highVolume && highMargin) quadrant = "JOIA";
    else quadrant = "FRACO";

    return {
      productId: totalsRow.productId,
      name: totalsRow.name,
      quadrant,
      quantitySold: totalsRow.quantitySold,
      revenue: round2(totalsRow.revenue),
      cmv: round2(totalsRow.cmv),
      marginPercent,
      capitalParked: round2(totalsRow.capitalParked),
      byUnit: totalsRow.byUnit,
    };
  });

  return { products, volumeMedian, marginMedian };
};
