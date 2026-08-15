import { useState } from "react";
import { formatCurrencyBRL } from "../../../shared/format";
import { QUADRANT_DESCRIPTIONS, QUADRANT_DOT_CLASS, QUADRANT_LABELS, QUADRANT_TEXT_CLASS } from "../state";
import type { PortfolioProduct } from "../types";

/**
 * Admin V2 (PLAN-0022, Onda 5) — cartão de produto do Portfólio Vivo (RETROFIT-006).
 * Destaca "vende muito, remunera pouco" (Armadilha) e capital parado — nunca esconde o
 * dado bruto atrás só do rótulo do quadrante (governança #6, explicabilidade).
 */

export function ProductCard({ product }: { product: PortfolioProduct }) {
  const [expanded, setExpanded] = useState(false);
  const hasUnitBreakdown = product.byUnit.length > 1;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[#cfe7d1] bg-white p-3 dark:border-forest-green dark:bg-forest">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-forest">{product.name}</p>
        <span
          title={QUADRANT_DESCRIPTIONS[product.quadrant]}
          className={`flex flex-shrink-0 items-center gap-1.5 text-xs font-bold ${QUADRANT_TEXT_CLASS[product.quadrant]}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${QUADRANT_DOT_CLASS[product.quadrant]}`} />
          {QUADRANT_LABELS[product.quadrant]}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600 dark:text-stone-400">
        <span>
          Vendidos <strong className="text-forest">{product.quantitySold}</strong>
        </span>
        <span>
          Receita <strong className="text-forest">{formatCurrencyBRL(product.revenue)}</strong>
        </span>
        {product.marginPercent !== null ? (
          <span>
            Margem{" "}
            <strong className={product.marginPercent >= 0 ? "text-forest" : "text-state-critical"}>
              {product.marginPercent.toFixed(1)}%
            </strong>
          </span>
        ) : (
          <span className="text-stone-500 dark:text-stone-400">sem venda no período</span>
        )}
        {product.capitalParked > 0 && (
          <span>
            Capital parado <strong className="text-forest">{formatCurrencyBRL(product.capitalParked)}</strong>
          </span>
        )}
      </div>

      {hasUnitBreakdown && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            {expanded ? "ocultar por unidade" : `ver por unidade (${product.byUnit.length})`}
          </button>
          {expanded && (
            <div className="mt-2 flex flex-col divide-y divide-stone-100 dark:divide-forest-green">
              {product.byUnit.map((unit) => (
                <div key={unit.unitId} className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-xs">
                  <span className="font-semibold text-forest">{unit.unitName}</span>
                  <span className="text-stone-600 dark:text-stone-400">
                    {unit.quantitySold} vendido(s) · {formatCurrencyBRL(unit.revenue)}
                    {unit.marginPercent !== null && (
                      <>
                        {" "}
                        ·{" "}
                        <span className={unit.marginPercent >= 0 ? "text-forest" : "text-state-critical"}>
                          {unit.marginPercent.toFixed(1)}%
                        </span>
                      </>
                    )}
                    {unit.capitalParked > 0 && <> · {formatCurrencyBRL(unit.capitalParked)} parado</>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
