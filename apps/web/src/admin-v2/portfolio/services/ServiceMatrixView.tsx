import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { useAdminScope } from "../../shell/adminScope";
import { fetchServicePerformance } from "../../shared/api";
import { formatCurrencyBRL } from "../../shared/format";
import { QUADRANT_DESCRIPTIONS, QUADRANT_LABELS, QUADRANT_ORDER } from "./state";
import { ServiceCard } from "./components/ServiceCard";
import type { ServicePerformanceList } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 6) — Performance de Serviços (RETROFIT-007).
 * Pergunta que a tela fecha: "quais serviços utilizam melhor a capacidade da agenda?"
 */

type ServicesState = { loading: boolean; data: ServicePerformanceList | null; error: string | null };

export function ServiceMatrixView() {
  const { scope } = useAdminScope();
  const [state, setState] = useState<ServicesState>({ loading: true, data: null, error: null });

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const unitIds = scope.unitId ? [scope.unitId] : undefined;
      const data = await fetchServicePerformance({ token, days: scope.days, unitIds });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar a performance de serviços.";
      logger.warn("Falha ao carregar Performance de Serviços (Admin V2)", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, [scope.days, scope.unitId]);

  useEffect(() => {
    // ERR-0083 — adia a chamada em 1 tick: load() faz setState antes do primeiro
    // await, o que roda de forma síncrona dentro do próprio efeito (react-hooks/set-state-in-effect).
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (state.loading && !state.data) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando performance de serviços…</p>;
  }

  if (state.error && !state.data) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar a performance de serviços.</p>
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
  const performance = state.data;

  if (performance.services.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-base text-stone-600 dark:text-stone-400">
        Nenhum serviço cadastrado para o recorte selecionado.
      </div>
    );
  }

  const grouped = QUADRANT_ORDER.map((quadrant) => ({
    quadrant,
    items: performance.services.filter((service) => service.quadrant === quadrant),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-forest">Portfólio — Serviços</h1>
        <p className="text-base text-stone-600 dark:text-stone-400">
          quais serviços utilizam melhor a capacidade da agenda · últimos {performance.period.days} dia(s)
        </p>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Margem total do período {formatCurrencyBRL(performance.totalMargin)} · classificação relativa ao próprio
          recorte: mediana de ocupação {performance.demandMedian.toFixed(1)}%
          {performance.marginPerHourMedian !== null && (
            <> · mediana de margem/hora {formatCurrencyBRL(performance.marginPerHourMedian)}</>
          )}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {grouped.map((group) => (
          <section key={group.quadrant}>
            <div className="mb-2 flex items-baseline gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-forest">
                {QUADRANT_LABELS[group.quadrant]} · {group.items.length}
              </h2>
              <span className="text-sm text-stone-500 dark:text-stone-400">{QUADRANT_DESCRIPTIONS[group.quadrant]}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((service) => (
                <ServiceCard key={service.serviceId} service={service} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
