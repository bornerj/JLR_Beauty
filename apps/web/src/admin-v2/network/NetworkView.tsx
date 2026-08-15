import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../lib/auth";
import { logger } from "../../utils/logger";
import { useAdminScope } from "../shell/adminScope";
import { fetchNetworkBoard } from "../shared/api";
import { STATE_LABELS } from "../shared/health";
import type { NetworkBoard } from "./types";
import { NetworkUnitCardView } from "./components/NetworkUnitCardView";

/**
 * Admin V2 (PLAN-0022, Onda 2) — Mapa Vivo da Rede (RETROFIT-002).
 * Kanban de 4 colunas — as unidades mudam de coluna sozinhas conforme os dados do
 * negócio (governança do PLAN-0022: "o usuário não arrasta, o negócio muda de lugar").
 */

type NetworkState = { loading: boolean; data: NetworkBoard | null; error: string | null };

const COLUMN_ORDER: Array<keyof NetworkBoard["columns"]> = ["takeoff", "healthy", "attention", "critical"];
const COLUMN_STATE_KEY = { takeoff: "TAKEOFF", healthy: "HEALTHY", attention: "ATTENTION", critical: "CRITICAL" } as const;

export function NetworkView() {
  const { scope } = useAdminScope();
  const [state, setState] = useState<NetworkState>({ loading: true, data: null, error: null });

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchNetworkBoard({
        token,
        days: scope.days,
        unitIds: scope.unitId ? [scope.unitId] : undefined,
      });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar a Rede.";
      logger.warn("Falha ao carregar Mapa da Rede do Admin V2", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, [scope.days, scope.unitId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.loading && !state.data) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando rede…</p>;
  }

  if (state.error && !state.data) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar a Rede.</p>
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
  const board = state.data;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-forest">Rede</h1>
        <p className="text-base text-stone-600 dark:text-stone-400">últimos {board.period.days} dia(s)</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {COLUMN_ORDER.map((columnKey) => {
          const cards = board.columns[columnKey];
          return (
            <div key={columnKey} className="flex flex-col gap-3">
              <p className="text-sm font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                {STATE_LABELS[COLUMN_STATE_KEY[columnKey]]} · {cards.length}
              </p>
              <div className="flex flex-col gap-2">
                {cards.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-stone-200 p-3 text-sm text-stone-500 dark:text-stone-400">
                    Nenhuma unidade nesta faixa.
                  </p>
                ) : (
                  cards.map((card) => <NetworkUnitCardView key={card.unitId} card={card} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
