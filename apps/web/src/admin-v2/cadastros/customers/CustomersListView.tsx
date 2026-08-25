import { useCallback, useEffect, useMemo, useState } from "react";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { fetchCustomers, createCustomer, updateCustomer } from "../../shared/api";
import { CustomerFormModal } from "./components/CustomerFormModal";
import type { Customer, CustomerInput } from "./types";

/**
 * Admin V2 (PLAN-0026, Onda 12) — Cadastro de Clientes, tier G, primeira das 3 telas do
 * desmembramento de "Pessoas" (`DECISION-014` regra #3 — legado tinha Clientes/
 * Profissionais/Usuários numa mega-tela só, `admin-people`, 1728 linhas de `behavior.ts` +
 * 967 de markup). Reusa `/api/customers` sem alteração. **Sem exclusão** — o backend não
 * expõe `DELETE /customers/:id` (confirmado no RAG); mesma limitação do legado, que também
 * não tinha botão de excluir cliente.
 *
 * Filtro por estado (UF) populado dinamicamente a partir dos dados reais, mesmo padrão do
 * legado (não hardcoded). Paginação numerada do legado não reproduzida — mesmo padrão das
 * demais telas do Admin V2.
 */

type ListState = { loading: boolean; data: Customer[] | null; error: string | null };
type FormModalState = { mode: "create" } | { mode: "edit"; customer: Customer } | null;
type MutationState = { submitting: boolean; error: string | null };

export function CustomersListView() {
  const [state, setState] = useState<ListState>({ loading: true, data: null, error: null });
  const [formModal, setFormModal] = useState<FormModalState>(null);
  const [mutation, setMutation] = useState<MutationState>({ submitting: false, error: null });
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchCustomers({ token });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar os clientes.";
      logger.warn("Falha ao carregar Clientes (Admin V2)", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, []);

  useEffect(() => {
    // ERR-0084 — mesmo fix do ERR-0083: adia a chamada em 1 tick pra sair do
    // commit síncrono do efeito (react-hooks/set-state-in-effect).
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const states = useMemo(() => {
    const set = new Set<string>();
    for (const c of state.data ?? []) {
      const value = (c.state ?? "").trim().toUpperCase();
      if (value) set.add(value);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [state.data]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (state.data ?? []).filter((c) => {
      const matchesQuery =
        !query ||
        c.name.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query) ||
        (c.phone2 ?? "").toLowerCase().includes(query) ||
        (c.email ?? "").toLowerCase().includes(query) ||
        (c.city ?? "").toLowerCase().includes(query) ||
        (c.neighborhood ?? "").toLowerCase().includes(query);
      const matchesState = !stateFilter || (c.state ?? "").trim().toUpperCase() === stateFilter;
      return matchesQuery && matchesState;
    });
  }, [state.data, search, stateFilter]);

  const handleSubmit = useCallback(
    async (input: CustomerInput) => {
      const token = getToken();
      if (!token || !formModal) return;
      setMutation({ submitting: true, error: null });
      try {
        if (formModal.mode === "edit") {
          await updateCustomer({ token, id: formModal.customer.id, input });
        } else {
          await createCustomer({ token, input });
        }
        setFormModal(null);
        setMutation({ submitting: false, error: null });
        void load();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao salvar o cliente.";
        logger.warn("Falha ao salvar cliente (Admin V2)", { error: message });
        setMutation({ submitting: false, error: message });
      }
    },
    [formModal, load]
  );

  if (state.loading && !state.data) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando clientes…</p>;
  }

  if (state.error && !state.data) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar os clientes.</p>
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

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-forest">Clientes</h1>
          <p className="text-base text-stone-600 dark:text-stone-400">
            contatos e cadastros de clientes, com vínculo opcional a uma conta de login · {filtered.length}/{state.data.length}{" "}
            cliente(s)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormModal({ mode: "create" })}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
        >
          + Novo cliente
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, telefone, email ou cidade…"
          className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green sm:col-span-2"
        />
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
        >
          <option value="">Todos os estados</option>
          {states.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-500 dark:text-stone-400">
          Nenhum cliente encontrado.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#cfe7d1] bg-white dark:border-forest-green dark:bg-forest">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#cfe7d1] text-xs font-bold uppercase tracking-wider text-stone-500 dark:border-forest-green dark:text-stone-400">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Cidade / UF</th>
                <th className="px-4 py-3">Conta vinculada</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id} className="border-b border-stone-100 last:border-0 dark:border-forest-green/40">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-forest">{customer.name}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">CLI-{customer.id}</p>
                  </td>
                  <td className="px-4 py-3 text-forest">
                    {customer.phone}
                    {customer.phone2 && <span className="block text-xs text-stone-500 dark:text-stone-400">{customer.phone2}</span>}
                  </td>
                  <td className="px-4 py-3 text-forest">{customer.email ?? "—"}</td>
                  <td className="px-4 py-3 text-forest">
                    {customer.city ? `${customer.city}${customer.state ? ` / ${customer.state}` : ""}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-forest">{customer.user ? `${customer.user.name} (${customer.user.email})` : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setFormModal({ mode: "edit", customer })}
                      title="Editar"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-forest hover:bg-primary/10"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formModal && (
        <CustomerFormModal
          editing={formModal.mode === "edit" ? formModal.customer : null}
          submitting={mutation.submitting}
          error={mutation.error}
          onCancel={() => {
            setFormModal(null);
            setMutation({ submitting: false, error: null });
          }}
          onSubmit={(input) => void handleSubmit(input)}
        />
      )}
    </div>
  );
}
