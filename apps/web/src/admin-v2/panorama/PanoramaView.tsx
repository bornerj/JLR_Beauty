import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../lib/auth";
import { logger } from "../../utils/logger";
import { useAdminScope } from "../shell/adminScope";
import { fetchPanorama } from "../shared/api";
import type { PanoramaSnapshot } from "./types";
import {
  CustomerSummaryCard,
  FinancialSummaryCard,
  NetworkSummaryCard,
  OperationsSummaryCard,
} from "./components/PanoramaCards";
import { AttentionFeed, OpportunitiesFeed } from "./components/PanoramaSignals";

/**
 * Admin V2 (PLAN-0022, Onda 1) — Panorama Vivo (RETROFIT-001).
 * Tela inicial: "o que está acontecendo no negócio agora?". Não é o destino, é o
 * começo da exploração (governança #1/#8 do plano) — cada bloco aponta drill-down.
 */

type PanoramaState = {
  loading: boolean;
  data: PanoramaSnapshot | null;
  error: string | null;
};

export function PanoramaView() {
  const { scope } = useAdminScope();
  const navigate = useNavigate();
  const [state, setState] = useState<PanoramaState>({ loading: true, data: null, error: null });

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchPanorama({
        token,
        days: scope.days,
        unitIds: scope.unitId ? [scope.unitId] : undefined,
      });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar o Panorama.";
      logger.warn("Falha ao carregar Panorama do Admin V2", { error: message });
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
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando panorama…</p>;
  }

  if (state.error && !state.data) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar o Panorama.</p>
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
  const panorama = state.data;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-forest">Panorama</h1>
          <p className="text-base text-stone-600 dark:text-stone-400">
            {panorama.scope.unitIds === "all" ? "Rede inteira" : "Unidade selecionada"} · últimos{" "}
            {panorama.period.days} dia(s)
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate("/admin-v2/radar")}
            className="rounded-full border border-primary/60 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
          >
            Ver radar executivo →
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin-v2/gargalos")}
            className="rounded-full border border-state-critical/60 px-3 py-1.5 text-xs font-semibold text-state-critical hover:bg-state-critical/10"
          >
            Ver gargalos →
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin-v2/insights")}
            className="rounded-full border border-gold px-3 py-1.5 text-xs font-semibold text-forest hover:bg-gold/10"
          >
            Ver insights →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <NetworkSummaryCard network={panorama.network} onDrillDown={() => navigate("/admin-v2/rede")} />
        <OperationsSummaryCard operations={panorama.operations} onDrillDown={() => navigate("/admin-v2/operacao")} />
        <FinancialSummaryCard financial={panorama.financial} />
        <CustomerSummaryCard customers={panorama.customers} onDrillDown={() => navigate("/admin-v2/clientes")} />
      </div>

      <AttentionFeed signals={panorama.attention} />
      <OpportunitiesFeed opportunities={panorama.opportunities} onViewCustomers={() => navigate("/admin-v2/clientes")} />
    </div>
  );
}
