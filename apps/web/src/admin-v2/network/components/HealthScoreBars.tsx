import type { HealthComponentKey, HealthComponents } from "../types";

/** Admin V2 (PLAN-0022, Onda 2) — decomposição do Health Score (regra de explicabilidade do plano). */

const ORDER: HealthComponentKey[] = ["profitability", "growth", "occupancy", "recurrence", "inventory", "subscriptions"];

const barColor = (value: number): string => {
  if (value >= 65) return "bg-state-healthy";
  if (value >= 40) return "bg-state-attention";
  return "bg-state-critical";
};

export function HealthScoreBars({
  components,
  labels,
}: {
  components: HealthComponents;
  labels: Record<HealthComponentKey, string>;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {ORDER.map((key) => {
        const value = components[key];
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-xs font-semibold text-forest">{labels[key]}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-100">
              <div className={`h-full rounded-full ${barColor(value)}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
            </div>
            <span className="w-9 shrink-0 text-right text-xs font-bold text-forest">{Math.round(value)}</span>
          </div>
        );
      })}
    </div>
  );
}
