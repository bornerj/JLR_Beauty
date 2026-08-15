import { formatCurrencyBRL } from "../../shared/format";
import type { PanoramaAttentionSignal, PanoramaOpportunity } from "../types";

/** Admin V2 (PLAN-0022, Onda 1) — "O que merece sua atenção" + oportunidades (RETROFIT-001/011). */

const LEVEL_STYLE: Record<PanoramaAttentionSignal["level"], { dot: string; icon: string }> = {
  critical: { dot: "bg-state-critical", icon: "🔴" },
  attention: { dot: "bg-state-attention", icon: "🟡" },
  positive: { dot: "bg-state-healthy", icon: "🟢" },
};

export function AttentionFeed({ signals }: { signals: PanoramaAttentionSignal[] }) {
  if (signals.length === 0) {
    return (
      <section className="rounded-xl border border-[#cfe7d1] bg-white p-5 dark:border-forest-green dark:bg-forest">
        <p className="text-sm font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">O que merece sua atenção</p>
        <p className="mt-2 text-base text-stone-600 dark:text-stone-400">Nenhum sinal relevante no período selecionado.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[#cfe7d1] bg-white p-5 dark:border-forest-green dark:bg-forest">
      <p className="text-sm font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">O que merece sua atenção</p>
      <ul className="mt-3 flex flex-col gap-2">
        {signals.map((signal, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-forest">
            <span aria-hidden="true">{LEVEL_STYLE[signal.level].icon}</span>
            <span>{signal.message}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function OpportunitiesFeed({
  opportunities,
  onViewCustomers,
}: {
  opportunities: PanoramaOpportunity[];
  onViewCustomers: () => void;
}) {
  if (opportunities.length === 0) return null;

  return (
    <section className="rounded-xl border border-state-info/40 bg-state-info/5 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-state-info">Oportunidade</p>
      <ul className="mt-3 flex flex-col gap-3">
        {opportunities.map((opportunity, index) => (
          <li key={index} className="flex flex-col gap-1">
            <p className="text-sm text-forest">💡 {opportunity.description}</p>
            <p className="text-sm font-bold text-forest">
              Potencial estimado: {formatCurrencyBRL(opportunity.estimatedValue)}
            </p>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={onViewCustomers}
                className="rounded-full border border-primary/60 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/10"
              >
                Ver clientes
              </button>
              <button
                type="button"
                disabled
                title="Criar campanha — em breve (nenhuma tela de campanhas existe ainda)"
                className="cursor-not-allowed rounded-full border border-stone-200 px-3 py-1.5 text-sm font-semibold text-stone-500 dark:text-stone-400"
              >
                Criar campanha · em breve
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
