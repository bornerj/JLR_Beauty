import { formatCurrencyBRL } from "./format";

/**
 * Achado #13 do relatório do code-archaeologist (2026-08-24) — bloco extraído de
 * `GargalosView.tsx`/`InsightsView.tsx`, onde era duplicado byte-a-byte (mesmo
 * vocabulário visual do Radar). `itemLabel` é a única variação real entre as 2 telas
 * ("gargalos"/"insights").
 */
export function KnownImpactBanner({ totalImpact, itemLabel }: { totalImpact: number; itemLabel: string }) {
  if (totalImpact <= 0) return null;
  return (
    <div className="rounded-xl border border-state-critical/30 bg-state-critical/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-state-critical">Impacto total conhecido</p>
      <p className="mt-1 text-3xl font-bold text-forest">{formatCurrencyBRL(totalImpact)}</p>
      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
        soma só dos {itemLabel} com estimativa de R$ disponível — os demais aparecem na lista sem número, nunca escondidos
      </p>
    </div>
  );
}
