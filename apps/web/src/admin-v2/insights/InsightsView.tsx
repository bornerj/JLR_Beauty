import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../lib/auth";
import { logger } from "../../utils/logger";
import { useAdminScope } from "../shell/adminScope";
import { fetchInsightFeed } from "../shared/api";
import { formatCurrencyBRL } from "../shared/format";
import { KnownImpactBanner } from "../shared/KnownImpactBanner";
import { PRIORITY_DOT_CLASS, PRIORITY_LABELS, PRIORITY_ORDER, PRIORITY_TEXT_CLASS, SOURCE_LABELS } from "./state";
import type { InsightFeed } from "./types";

/**
 * Admin V2 (PLAN-0023, Onda 6) — Insight Engine (RETROFIT-018).
 * Pergunta que a tela fecha: "o que devo saber sem perguntar?"
 * Consolida Radar (Onda 1) + Gargalos (Onda 2) + maior achado do Comparador (Onda 4) num
 * único feed ranqueado (crítico > atenção > oportunidade, depois por R$ conhecido) —
 * quando Radar e Gargalos descrevem o mesmo fato (mesma categoria), só a versão do
 * Gargalos entra (carrega o R$, o Radar não). Sempre de rede inteira.
 */

type InsightsState = { loading: boolean; data: InsightFeed | null; error: string | null };

export function InsightsView() {
  const { scope } = useAdminScope();
  const navigate = useNavigate();
  const [state, setState] = useState<InsightsState>({ loading: true, data: null, error: null });

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchInsightFeed({ token, days: scope.days });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar o feed de insights.";
      logger.warn("Falha ao carregar Insights (Admin V2)", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, [scope.days]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.loading && !state.data) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando insights…</p>;
  }

  if (state.error && !state.data) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar o feed de insights.</p>
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
  const feed = state.data;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-forest">Insights</h1>
        <p className="text-base text-stone-600 dark:text-stone-400">o que devo saber sem perguntar · últimos {feed.period.days} dia(s)</p>
      </div>

      <KnownImpactBanner totalImpact={feed.totalKnownImpact} itemLabel="insights" />

      {feed.insights.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-500 dark:text-stone-400">
          Nenhum insight no recorte selecionado — nada precisa de atenção agora.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {PRIORITY_ORDER.map((priority) => {
            const items = feed.insights.filter((insight) => insight.priority === priority);
            if (items.length === 0) return null;
            return (
              <section key={priority}>
                <h2 className={`mb-2 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider ${PRIORITY_TEXT_CLASS[priority]}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT_CLASS[priority]}`} />
                  {PRIORITY_LABELS[priority]} · {items.length}
                </h2>
                <div className="flex flex-col gap-2">
                  {items.map((insight) => (
                    <div
                      key={insight.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#cfe7d1] bg-white p-3 dark:border-forest-green dark:bg-forest"
                    >
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                          {insight.category} · <span className="text-stone-400">{SOURCE_LABELS[insight.source]}</span>
                        </p>
                        <p className="text-sm text-forest">{insight.message}</p>
                        {insight.impact && (
                          <p className="mt-1 text-sm font-semibold text-state-critical">
                            {formatCurrencyBRL(insight.impact.amount)}{" "}
                            <span className="text-xs font-normal text-stone-500 dark:text-stone-400">— {insight.impact.explanation}</span>
                          </p>
                        )}
                        {insight.recommendedActions.length > 0 && (
                          <ul className="mt-2 flex flex-col gap-1">
                            {insight.recommendedActions.map((action, index) => (
                              <li key={index} className="flex items-start gap-1.5 text-xs text-stone-600 dark:text-stone-400">
                                <span className="mt-0.5 text-stone-400">→</span>
                                {action.actionPath ? (
                                  <button
                                    type="button"
                                    onClick={() => navigate(action.actionPath!)}
                                    className="text-left text-primary underline decoration-dotted underline-offset-2 hover:text-primary/80"
                                  >
                                    {action.label}
                                  </button>
                                ) : (
                                  <span>{action.label}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(insight.actionPath)}
                        className="flex-shrink-0 rounded-full border border-primary/60 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
                      >
                        {insight.actionLabel}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
