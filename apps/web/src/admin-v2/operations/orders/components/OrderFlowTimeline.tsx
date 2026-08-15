import { formatMinutes } from "../../../shared/format";
import type { FlowTransition } from "../types";

/**
 * Admin V2 (PLAN-0022, Onda 3) — fluxo real do fulfillment (RETROFIT-004): tempo médio
 * entre cada etapa no período selecionado, com gargalo sinalizado pelo próprio backend
 * (média ≥240min), nunca calculado no frontend (governança #2 do PLAN-0022).
 */

export function OrderFlowTimeline({ transitions }: { transitions: FlowTransition[] }) {
  return (
    <section className="rounded-xl border border-[#cfe7d1] bg-white p-5 dark:border-forest-green dark:bg-forest">
      <p className="text-sm font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Fluxo do pedido</p>
      <p className="mb-4 mt-1 text-sm text-stone-500 dark:text-stone-400">
        Tempo médio entre cada etapa do fulfillment, no período selecionado.
      </p>
      <div className="flex flex-col divide-y divide-stone-100 dark:divide-forest-green">
        {transitions.map((transition) => (
          <div
            key={`${transition.from}-${transition.to}`}
            className="flex flex-wrap items-center justify-between gap-2 py-2.5"
          >
            <div className="flex items-center gap-2 text-sm text-forest">
              <span>{transition.from}</span>
              <span aria-hidden="true" className="text-stone-300">
                →
              </span>
              <span>{transition.to}</span>
            </div>
            {transition.sampleSize === 0 ? (
              <span className="text-sm text-stone-500 dark:text-stone-400">sem amostra no período</span>
            ) : (
              <span
                className={`text-sm font-semibold ${
                  transition.isBottleneck ? "text-state-critical" : "text-forest"
                }`}
              >
                {formatMinutes(transition.averageMinutes ?? 0)}
                {transition.isBottleneck ? " ⚠ gargalo" : ""}
                <span className="ml-1.5 text-sm font-normal text-stone-500 dark:text-stone-400">
                  ({transition.sampleSize} pedido{transition.sampleSize === 1 ? "" : "s"})
                </span>
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
