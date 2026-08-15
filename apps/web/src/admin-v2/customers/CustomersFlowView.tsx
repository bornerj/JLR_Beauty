import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../lib/auth";
import { logger } from "../../utils/logger";
import { useAdminScope } from "../shell/adminScope";
import { fetchCustomerFlow } from "../shared/api";
import { STATE_DOT_CLASS, STATE_LABELS, STATE_ORDER, STATE_TEXT_CLASS } from "./state";
import { CustomerRow } from "./components/CustomerRow";
import type { CustomerFlow, CustomerState } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 7) — Clientes como Fluxo de Relacionamento (RETROFIT-008).
 * Pergunta que a tela fecha: "quem está entrando, ficando ou indo embora?"
 * Critério de aceitação: clique em "Em risco" mostra a lista com o motivo específico de
 * cada cliente — por isso o estado selecionado abre a lista completa com `reason`
 * visível em cada linha, nunca só a contagem.
 */

type FlowState = { loading: boolean; data: CustomerFlow | null; error: string | null };

export function CustomersFlowView() {
  const { scope } = useAdminScope();
  const [state, setState] = useState<FlowState>({ loading: true, data: null, error: null });
  const [selected, setSelected] = useState<CustomerState>("EM_RISCO");

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const unitIds = scope.unitId ? [scope.unitId] : undefined;
      const data = await fetchCustomerFlow({ token, days: scope.days, unitIds });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar o fluxo de clientes.";
      logger.warn("Falha ao carregar Fluxo de Clientes (Admin V2)", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, [scope.days, scope.unitId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.loading && !state.data) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando fluxo de clientes…</p>;
  }

  if (state.error && !state.data) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar o fluxo de clientes.</p>
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
  const flow = state.data;
  const visibleCustomers = flow.customers.filter((customer) => customer.state === selected);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-forest">Clientes</h1>
        <p className="text-base text-stone-600 dark:text-stone-400">quem está entrando, ficando ou indo embora · últimos {flow.period.days} dia(s)</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
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
              <span className="text-3xl font-bold text-forest">{flow.counts[stateKey]}</span>
            </button>
          );
        })}
      </div>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-forest">
          {STATE_LABELS[selected]} · {visibleCustomers.length}
        </h2>
        {visibleCustomers.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-200 p-4 text-sm text-stone-500 dark:text-stone-400">
            Nenhum cliente neste estado no recorte selecionado.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleCustomers.map((customer) => (
              <CustomerRow key={customer.key} customer={customer} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
