import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../lib/auth";
import { logger } from "../../utils/logger";
import { useAdminScope } from "../shell/adminScope";
import { fetchBottlenecksRanking } from "../shared/api";
import { formatCurrencyBRL } from "../shared/format";
import { KnownImpactBanner } from "../shared/KnownImpactBanner";
import type { BottlenecksRanking } from "./types";

/**
 * Admin V2 (PLAN-0023, Onda 2) — "O que está travando?" / Gargalos (RETROFIT-012).
 * Pergunta que a tela fecha: "o que impede o negócio de performar melhor?"
 * Diferente do Radar (Onda 1, lista TUDO): aqui só entra o que tem uma tradução honesta
 * pra R$ — ranking por impacto, maior primeiro; sem impacto conhecido nunca é escondido,
 * só vai pro fim da lista (governança #6). Sempre de rede inteira.
 */

type GargalosState = { loading: boolean; data: BottlenecksRanking | null; error: string | null };

export function GargalosView() {
  const { scope } = useAdminScope();
  const navigate = useNavigate();
  const [state, setState] = useState<GargalosState>({ loading: true, data: null, error: null });

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchBottlenecksRanking({ token, days: scope.days });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar o ranking de gargalos.";
      logger.warn("Falha ao carregar Gargalos (Admin V2)", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, [scope.days]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.loading && !state.data) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando ranking de gargalos…</p>;
  }

  if (state.error && !state.data) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar o ranking de gargalos.</p>
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
  const ranking = state.data;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-forest">Gargalos</h1>
        <p className="text-base text-stone-600 dark:text-stone-400">o que impede o negócio de performar melhor · últimos {ranking.period.days} dia(s)</p>
      </div>

      <KnownImpactBanner totalImpact={ranking.totalImpact} itemLabel="gargalos" />

      {ranking.bottlenecks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-500 dark:text-stone-400">
          Nenhum gargalo no recorte selecionado.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {ranking.bottlenecks.map((bottleneck, index) => (
            <div
              key={bottleneck.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#cfe7d1] bg-white p-3 dark:border-forest-green dark:bg-forest"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-lg font-bold text-stone-300 dark:text-stone-600">{index + 1}</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">{bottleneck.category}</p>
                  <p className="text-sm text-forest">{bottleneck.message}</p>
                  {bottleneck.impact ? (
                    <p className="mt-1 text-sm font-semibold text-state-critical">
                      {formatCurrencyBRL(bottleneck.impact.amount)}{" "}
                      <span className="text-xs font-normal text-stone-500 dark:text-stone-400">— {bottleneck.impact.explanation}</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-stone-400">impacto em R$ ainda não estimável para este caso</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(bottleneck.actionPath)}
                className="flex-shrink-0 rounded-full border border-primary/60 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
              >
                {bottleneck.actionLabel}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
