import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { useAdminScope } from "../../shell/adminScope";
import { fetchPortfolioProducts } from "../../shared/api";
import { QUADRANT_DESCRIPTIONS, QUADRANT_LABELS, QUADRANT_ORDER } from "./state";
import { ProductCard } from "./components/ProductCard";
import type { PortfolioProducts } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 5) — Portfólio Vivo de Produtos (RETROFIT-006).
 * Pergunta que a tela fecha: "o que vende e o que realmente dá dinheiro?"
 */

type PortfolioState = { loading: boolean; data: PortfolioProducts | null; error: string | null };

export function ProductMatrixView() {
  const { scope } = useAdminScope();
  const [state, setState] = useState<PortfolioState>({ loading: true, data: null, error: null });

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const unitIds = scope.unitId ? [scope.unitId] : undefined;
      const data = await fetchPortfolioProducts({ token, days: scope.days, unitIds });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar o portfólio de produtos.";
      logger.warn("Falha ao carregar Portfólio Vivo de Produtos (Admin V2)", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, [scope.days, scope.unitId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.loading && !state.data) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando portfólio de produtos…</p>;
  }

  if (state.error && !state.data) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar o portfólio de produtos.</p>
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
  const portfolio = state.data;

  if (portfolio.products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-base text-stone-600 dark:text-stone-400">
        Nenhum produto com venda ou estoque no recorte selecionado.
      </div>
    );
  }

  const grouped = QUADRANT_ORDER.map((quadrant) => ({
    quadrant,
    items: portfolio.products.filter((product) => product.quadrant === quadrant),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-forest">Portfólio — Produtos</h1>
        <p className="text-base text-stone-600 dark:text-stone-400">
          o que vende e o que realmente dá dinheiro · últimos {portfolio.period.days} dia(s)
        </p>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Classificação relativa ao próprio recorte: mediana de venda {portfolio.volumeMedian} unidade(s)
          {portfolio.marginMedian !== null && <> · mediana de margem {portfolio.marginMedian.toFixed(1)}%</>}
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
              {group.items.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
