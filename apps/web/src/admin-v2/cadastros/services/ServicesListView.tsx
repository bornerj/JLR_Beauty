import { useCallback, useEffect, useMemo, useState } from "react";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { fetchServices, createService, updateService, deleteService } from "../../shared/api";
import { formatCurrencyBRL } from "../../shared/format";
import { DeleteConfirmModal } from "../../shell/DeleteConfirmModal";
import { ServiceFormModal } from "./components/ServiceFormModal";
import type { Service, ServiceInput, ServiceStatusColor } from "./types";

/**
 * Admin V2 (PLAN-0026, Onda 8) — Cadastro de Serviços, tier M (primeira onda com
 * `behavior.ts` imperativo no legado, 416 linhas + 250 de markup, reescrita como React
 * declarativo). Reusa `/api/services` sem alteração (`DECISION-014` regra #2). Busca +
 * filtro de categoria/status preservados (regra de negócio real, necessária com 70+
 * serviços); pilha de paginação numerada do legado não reproduzida — tabela rolável, mesmo
 * padrão já usado nas demais telas do Admin V2 (nenhuma outra tem paginação).
 */

const COLOR_BADGE_CLASS: Record<ServiceStatusColor, string> = {
  VERDE: "bg-state-healthy/15 text-state-healthy",
  AMARELO: "bg-state-attention/15 text-state-attention",
  VERMELHO: "bg-state-critical/15 text-state-critical",
  CINZA: "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300",
};

type ListState = { loading: boolean; data: Service[] | null; error: string | null };
type FormModalState = { mode: "create" } | { mode: "edit"; service: Service } | null;
type DeleteModalState = { service: Service } | null;
type MutationState = { submitting: boolean; error: string | null };

const parseDecimal = (value: string | null): number | null => {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function ServicesListView() {
  const [state, setState] = useState<ListState>({ loading: true, data: null, error: null });
  const [formModal, setFormModal] = useState<FormModalState>(null);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>(null);
  const [mutation, setMutation] = useState<MutationState>({ submitting: false, error: null });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchServices({ token });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar os serviços.";
      logger.warn("Falha ao carregar Serviços (Admin V2)", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of state.data ?? []) {
      if (s.serviceCategory) map.set(s.serviceCategory.id, s.serviceCategory.name);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [state.data]);

  const statuses = useMemo(() => {
    const map = new Map<number, { name: string; color: ServiceStatusColor | null }>();
    for (const s of state.data ?? []) {
      if (s.serviceStatus) map.set(s.serviceStatus.id, { name: s.serviceStatus.name, color: s.serviceStatus.color });
    }
    return Array.from(map.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name, "pt-BR"));
  }, [state.data]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (state.data ?? []).filter((s) => {
      const matchesQuery = !query || s.name.toLowerCase().includes(query) || (s.description ?? "").toLowerCase().includes(query);
      const matchesCategory = !categoryFilter || String(s.serviceCategory?.id ?? "") === categoryFilter;
      const matchesStatus = !statusFilter || String(s.serviceStatus?.id ?? "") === statusFilter;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [state.data, search, categoryFilter, statusFilter]);

  const handleSubmit = useCallback(
    async (input: ServiceInput) => {
      const token = getToken();
      if (!token || !formModal) return;
      setMutation({ submitting: true, error: null });
      try {
        if (formModal.mode === "edit") {
          await updateService({ token, id: formModal.service.id, input });
        } else {
          await createService({ token, input });
        }
        setFormModal(null);
        setMutation({ submitting: false, error: null });
        void load();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao salvar o serviço.";
        logger.warn("Falha ao salvar serviço (Admin V2)", { error: message });
        setMutation({ submitting: false, error: message });
      }
    },
    [formModal, load]
  );

  const handleDelete = useCallback(async () => {
    const token = getToken();
    if (!token || !deleteModal) return;
    setMutation({ submitting: true, error: null });
    try {
      await deleteService({ token, id: deleteModal.service.id });
      setDeleteModal(null);
      setMutation({ submitting: false, error: null });
      void load();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao excluir o serviço.";
      logger.warn("Falha ao excluir serviço (Admin V2)", { error: message });
      setMutation({ submitting: false, error: message });
    }
  }, [deleteModal, load]);

  if (state.loading && !state.data) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando serviços…</p>;
  }

  if (state.error && !state.data) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar os serviços.</p>
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
          <h1 className="text-3xl font-bold text-forest">Serviços</h1>
          <p className="text-base text-stone-600 dark:text-stone-400">
            catálogo de serviços oferecidos, com categoria, status, preço e comissão · {filtered.length}/{state.data.length}{" "}
            serviço(s)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormModal({ mode: "create" })}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
        >
          + Novo serviço
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou descrição…"
          className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
        >
          <option value="">Todas as categorias</option>
          {categories.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
        >
          <option value="">Todos os status</option>
          {statuses.map(([id, s]) => (
            <option key={id} value={id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-500 dark:text-stone-400">
          Nenhum serviço encontrado.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#cfe7d1] bg-white dark:border-forest-green dark:bg-forest">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#cfe7d1] text-xs font-bold uppercase tracking-wider text-stone-500 dark:border-forest-green dark:text-stone-400">
                <th className="px-4 py-3">Serviço</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Duração</th>
                <th className="px-4 py-3">Comissão</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Custo</th>
                <th className="px-4 py-3">Destaque</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((service) => {
                const price = parseDecimal(service.price);
                const cost = parseDecimal(service.cost);
                return (
                  <tr key={service.id} className="border-b border-stone-100 last:border-0 dark:border-forest-green/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gold/30 bg-primary/5">
                          {service.imageUrl ? (
                            <img src={service.imageUrl} alt={service.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-primary">spa</span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-forest">{service.name}</p>
                          <p className="text-xs text-stone-500 dark:text-stone-400">SRV-{service.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-forest">{service.serviceCategory?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      {service.serviceStatus ? (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${COLOR_BADGE_CLASS[service.serviceStatus.color ?? "CINZA"]}`}
                        >
                          {service.serviceStatus.name}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-forest">{service.durationMin ? `${service.durationMin} min` : "—"}</td>
                    <td className="px-4 py-3 text-forest">
                      {service.commissionPercent !== null ? `${service.commissionPercent}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-forest">{price !== null ? formatCurrencyBRL(price) : "—"}</td>
                    <td className="px-4 py-3 text-forest">{cost !== null ? formatCurrencyBRL(cost) : "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          service.isFeatured
                            ? "bg-state-healthy/15 text-state-healthy"
                            : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                        }`}
                      >
                        {service.isFeatured ? "Sim" : "Não"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormModal({ mode: "edit", service })}
                          title="Editar"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-forest hover:bg-primary/10"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteModal({ service })}
                          title="Excluir"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-state-critical hover:bg-state-critical/10"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {formModal && (
        <ServiceFormModal
          editing={formModal.mode === "edit" ? formModal.service : null}
          submitting={mutation.submitting}
          error={mutation.error}
          onCancel={() => {
            setFormModal(null);
            setMutation({ submitting: false, error: null });
          }}
          onSubmit={(input) => void handleSubmit(input)}
        />
      )}

      {deleteModal && (
        <DeleteConfirmModal
          title={`Excluir "${deleteModal.service.name}"?`}
          description="Essa ação não pode ser desfeita. Agendamentos e pedidos já feitos com este serviço não são afetados retroativamente, mas ele deixa de existir pra novos agendamentos."
          submitting={mutation.submitting}
          error={mutation.error}
          onCancel={() => {
            setDeleteModal(null);
            setMutation({ submitting: false, error: null });
          }}
          onConfirm={() => void handleDelete()}
        />
      )}
    </div>
  );
}
