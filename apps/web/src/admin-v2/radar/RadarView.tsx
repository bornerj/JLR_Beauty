import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../lib/auth";
import { logger } from "../../utils/logger";
import { useAdminScope } from "../shell/adminScope";
import { fetchRadarBriefing } from "../shared/api";
import { SEVERITY_DOT_CLASS, SEVERITY_LABELS, SEVERITY_ORDER, SEVERITY_TEXT_CLASS } from "./state";
import type { RadarBriefing } from "./types";

/**
 * Admin V2 (PLAN-0023, Onda 1) — Radar Executivo (RETROFIT-011).
 * Pergunta que a tela fecha: "o que mudou e merece atenção hoje?"
 * Cruza os 8 domínios já entregues no PLAN-0022 (Ondas 1-9) num único briefing
 * acionável — cada achado sempre tem um botão que leva para a tela de origem
 * (governança #7). Sempre de rede inteira, mesmo escopo do Panorama.
 */

type RadarState = { loading: boolean; data: RadarBriefing | null; error: string | null };

export function RadarView() {
  const { scope } = useAdminScope();
  const navigate = useNavigate();
  const [state, setState] = useState<RadarState>({ loading: true, data: null, error: null });

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchRadarBriefing({ token, days: scope.days });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar o radar executivo.";
      logger.warn("Falha ao carregar Radar Executivo (Admin V2)", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, [scope.days]);

  useEffect(() => {
    // ERR-0083 — adia a chamada em 1 tick: load() faz setState antes do primeiro
    // await, o que roda de forma síncrona dentro do próprio efeito (react-hooks/set-state-in-effect).
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (state.loading && !state.data) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando radar executivo…</p>;
  }

  if (state.error && !state.data) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar o radar executivo.</p>
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
  const briefing = state.data;

  if (briefing.findings.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-3xl font-bold text-forest">Radar Executivo</h1>
          <p className="text-base text-stone-600 dark:text-stone-400">o que mudou e merece atenção · últimos {briefing.period.days} dia(s)</p>
        </div>
        <div className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-500 dark:text-stone-400">
          Nenhum achado no recorte selecionado — nada precisa de atenção agora.
        </div>
      </div>
    );
  }

  const grouped = SEVERITY_ORDER.map((severity) => ({
    severity,
    items: briefing.findings.filter((finding) => finding.severity === severity),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-forest">Radar Executivo</h1>
        <p className="text-base text-stone-600 dark:text-stone-400">o que mudou e merece atenção · últimos {briefing.period.days} dia(s)</p>
      </div>

      <div className="flex flex-col gap-6">
        {grouped.map((group) => (
          <section key={group.severity}>
            <h2 className={`mb-2 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider ${SEVERITY_TEXT_CLASS[group.severity]}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_DOT_CLASS[group.severity]}`} />
              {SEVERITY_LABELS[group.severity]} · {group.items.length}
            </h2>
            <div className="flex flex-col gap-2">
              {group.items.map((finding) => (
                <div
                  key={finding.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#cfe7d1] bg-white p-3 dark:border-forest-green dark:bg-forest"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">{finding.category}</p>
                    <p className="text-sm text-forest">{finding.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(finding.actionPath)}
                    className="flex-shrink-0 rounded-full border border-primary/60 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
                  >
                    {finding.actionLabel}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
