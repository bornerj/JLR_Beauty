import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../lib/auth";
import { logger } from "../../utils/logger";
import { useAdminScope } from "../shell/adminScope";
import { fetchUnitComparator } from "../shared/api";
import { formatCurrencyBRL } from "../shared/format";
import type { ComparatorMetricKey, UnitComparator } from "./types";

/**
 * Admin V2 (PLAN-0023, Onda 4) — Comparador Visual de Unidades (RETROFIT-014).
 * Pergunta que a tela fecha: "por que uma unidade performa melhor que outra?"
 * Tabela Unidade × 5 dimensões (mockup `retrofit/RETROFIT-014.md`) + a métrica com maior
 * diferença relativa em destaque — a comparação aponta a causa, não só mostra colunas.
 */

type ComparatorState = { loading: boolean; data: UnitComparator | null; error: string | null };

const METRIC_LABELS: Record<ComparatorMetricKey, string> = {
  revenue: "Receita",
  marginPercent: "Margem",
  occupancyRate: "Ocupação",
  avgTicket: "Ticket Médio",
  recurrenceRate: "Recorrência",
};

const formatMetric = (key: ComparatorMetricKey, value: number): string => {
  if (key === "revenue" || key === "avgTicket") return formatCurrencyBRL(value);
  return `${value.toFixed(1)}%`;
};

export function ComparatorView() {
  const { scope } = useAdminScope();
  const [state, setState] = useState<ComparatorState>({ loading: true, data: null, error: null });

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchUnitComparator({ token, days: scope.days });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar o comparador de unidades.";
      logger.warn("Falha ao carregar Comparador (Admin V2)", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, [scope.days]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.loading && !state.data) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando comparador de unidades…</p>;
  }

  if (state.error && !state.data) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar o comparador de unidades.</p>
        <p className="text-sm text-stone-600 dark:text-stone-400">{state.error}</p>
        <div>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!state.data) return null;
  const comparator = state.data;
  const metrics: ComparatorMetricKey[] = ["revenue", "marginPercent", "occupancyRate", "avgTicket", "recurrenceRate"];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-forest">Comparar Unidades</h1>
        <p className="text-base text-stone-600 dark:text-stone-400">por que uma unidade performa melhor que outra · últimos {comparator.period.days} dia(s)</p>
      </div>

      {comparator.units.length < 2 ? (
        <div className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-500 dark:text-stone-400">
          É preciso pelo menos 2 unidades cadastradas para comparar.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-[#cfe7d1] bg-white dark:border-forest-green dark:bg-forest">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#cfe7d1] text-xs font-bold uppercase tracking-wider text-stone-500 dark:border-forest-green dark:text-stone-400">
                  <th className="px-3 py-2">Métrica</th>
                  {comparator.units.map((unit) => (
                    <th key={unit.unitId} className="px-3 py-2">{unit.unitName}</th>
                  ))}
                  <th className="px-3 py-2">Rede</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric) => (
                  <tr key={metric} className="border-b border-stone-100 last:border-0 dark:border-forest-green/40">
                    <td className="px-3 py-2 font-semibold text-forest">{METRIC_LABELS[metric]}</td>
                    {comparator.units.map((unit) => (
                      <td key={unit.unitId} className="px-3 py-2">{formatMetric(metric, unit[metric])}</td>
                    ))}
                    <td className="px-3 py-2 font-semibold text-stone-600 dark:text-stone-400">{formatMetric(metric, comparator.network[metric])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {comparator.biggestGap && (
            <div className="rounded-xl border border-state-critical/30 bg-state-critical/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-state-critical">Maior Diferença</p>
              <p className="mt-1 text-lg font-semibold text-forest">
                {comparator.biggestGap.metricLabel}: {comparator.biggestGap.worstUnitName} {formatMetric(comparator.biggestGap.metric, comparator.biggestGap.worstValue)}{" "}
                vs {comparator.biggestGap.bestUnitName} {formatMetric(comparator.biggestGap.metric, comparator.biggestGap.bestValue)}
              </p>
              {comparator.biggestGap.estimatedRevenueDifference ? (
                <>
                  <p className="mt-1 text-2xl font-bold text-forest">{formatCurrencyBRL(comparator.biggestGap.estimatedRevenueDifference.amount)}</p>
                  <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{comparator.biggestGap.estimatedRevenueDifference.explanation}</p>
                </>
              ) : (
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{comparator.biggestGap.explanation}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
