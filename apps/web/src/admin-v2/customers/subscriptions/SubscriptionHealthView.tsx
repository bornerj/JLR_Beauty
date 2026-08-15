import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { useAdminScope } from "../../shell/adminScope";
import { fetchSubscriptionHealth } from "../../shared/api";
import { formatSignedPercent } from "../../shared/format";
import { STATE_DOT_CLASS, STATE_LABELS, STATE_ORDER, STATE_TEXT_CLASS } from "./state";
import { SubscriptionRow } from "./components/SubscriptionRow";
import type { SubscriptionHealth, SubscriptionState } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 8) — Assinaturas como Saúde da Base (RETROFIT-009).
 * Pergunta que a tela fecha: "a base de assinaturas está crescendo ou deteriorando?"
 * Sempre de rede inteira — `Subscription` não tem `unitId` no schema (mesma nota da
 * Onda 1) — o seletor de unidade da topbar não se aplica aqui.
 */

type HealthState = { loading: boolean; data: SubscriptionHealth | null; error: string | null };

export function SubscriptionHealthView() {
  const { scope } = useAdminScope();
  const [state, setState] = useState<HealthState>({ loading: true, data: null, error: null });
  const [selected, setSelected] = useState<SubscriptionState>("ATENCAO");

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchSubscriptionHealth({ token, days: scope.days });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar a saúde de assinaturas.";
      logger.warn("Falha ao carregar Saúde de Assinaturas (Admin V2)", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, [scope.days]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.loading && !state.data) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando saúde de assinaturas…</p>;
  }

  if (state.error && !state.data) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar a saúde de assinaturas.</p>
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
  const health = state.data;
  const visibleSubscriptions = health.subscriptions.filter((subscription) => subscription.state === selected);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-forest">Assinaturas</h1>
        <p className="text-base text-stone-600 dark:text-stone-400">a base está crescendo ou deteriorando · últimos {health.period.days} dia(s)</p>
      </div>

      <div className="rounded-xl border border-state-critical/30 bg-state-critical/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-state-critical">Churn no período</p>
        <p className="mt-1 text-3xl font-bold text-forest">
          {health.churn.count}
          {health.churn.ratePercent !== null && (
            <span className="ml-2 text-base font-semibold text-state-critical">{formatSignedPercent(-health.churn.ratePercent)}</span>
          )}
        </p>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{health.churn.explanation}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATE_ORDER.map((stateKey) => {
          const isActive = selected === stateKey;
          return (
            <button
              key={stateKey}
              type="button"
              onClick={() => setSelected(stateKey)}
              className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${
                isActive ? "border-primary bg-primary/5" : "border-[#cfe7d1] bg-white hover:bg-primary/5 dark:border-forest-green dark:bg-forest"
              }`}
            >
              <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${STATE_TEXT_CLASS[stateKey]}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${STATE_DOT_CLASS[stateKey]}`} />
                {STATE_LABELS[stateKey]}
              </span>
              <span className="text-3xl font-bold text-forest">{health.counts[stateKey]}</span>
            </button>
          );
        })}
      </div>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-forest">
          {STATE_LABELS[selected]} · {visibleSubscriptions.length}
        </h2>
        {visibleSubscriptions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-200 p-4 text-sm text-stone-500 dark:text-stone-400">
            Nenhuma assinatura neste estado no recorte selecionado.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleSubscriptions.map((subscription) => (
              <SubscriptionRow key={subscription.subscriptionId} subscription={subscription} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
