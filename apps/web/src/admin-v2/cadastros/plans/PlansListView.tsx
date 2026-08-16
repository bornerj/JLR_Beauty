import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { fetchMemberships, createMembership, updateMembership, deleteMembership } from "../../shared/api";
import { DeleteConfirmModal } from "../../shell/DeleteConfirmModal";
import { PlanCard } from "./components/PlanCard";
import { PlanFormModal } from "./components/PlanFormModal";
import type { Membership, MembershipInput } from "./types";

/**
 * Admin V2 (PLAN-0026, Onda 1) — Cadastro de Planos, primeira tela nativa de Cadastros
 * (`DECISION-014`). Reusa `/api/memberships` sem alteração — só a interação vira React
 * declarativo em vez do `querySelector`/`addEventListener` manual do legado
 * (`admin-core/behavior.ts`).
 */

type ListState = { loading: boolean; data: Membership[] | null; error: string | null };
type FormModalState = { mode: "create" } | { mode: "edit"; membership: Membership } | null;
type DeleteModalState = { membership: Membership } | null;
type MutationState = { submitting: boolean; error: string | null };

export function PlansListView() {
  const [state, setState] = useState<ListState>({ loading: true, data: null, error: null });
  const [formModal, setFormModal] = useState<FormModalState>(null);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>(null);
  const [mutation, setMutation] = useState<MutationState>({ submitting: false, error: null });

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchMemberships({ token });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar os planos.";
      logger.warn("Falha ao carregar Planos (Admin V2)", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = useCallback(
    async (input: MembershipInput) => {
      const token = getToken();
      if (!token || !formModal) return;
      setMutation({ submitting: true, error: null });
      try {
        if (formModal.mode === "edit") {
          await updateMembership({ token, id: formModal.membership.id, input });
        } else {
          await createMembership({ token, input });
        }
        setFormModal(null);
        setMutation({ submitting: false, error: null });
        void load();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao salvar o plano.";
        logger.warn("Falha ao salvar plano (Admin V2)", { error: message });
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
      await deleteMembership({ token, id: deleteModal.membership.id });
      setDeleteModal(null);
      setMutation({ submitting: false, error: null });
      void load();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao excluir o plano.";
      logger.warn("Falha ao excluir plano (Admin V2)", { error: message });
      setMutation({ submitting: false, error: message });
    }
  }, [deleteModal, load]);

  if (state.loading && !state.data) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando planos…</p>;
  }

  if (state.error && !state.data) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar os planos.</p>
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
  const memberships = state.data;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-forest">Planos</h1>
          <p className="text-base text-stone-600 dark:text-stone-400">
            crie planos com nome, título, valor mensal e lista de benefícios · {memberships.length} plano(s)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormModal({ mode: "create" })}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
        >
          + Novo plano
        </button>
      </div>

      {memberships.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-500 dark:text-stone-400">
          Nenhum plano cadastrado ainda.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {memberships.map((membership) => (
            <PlanCard
              key={membership.id}
              membership={membership}
              onEdit={() => setFormModal({ mode: "edit", membership })}
              onDelete={() => setDeleteModal({ membership })}
            />
          ))}
        </div>
      )}

      {formModal && (
        <PlanFormModal
          editing={formModal.mode === "edit" ? formModal.membership : null}
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
          title={`Excluir "${deleteModal.membership.name}"?`}
          description="Essa ação não pode ser desfeita. Assinaturas já vinculadas a este plano não são afetadas retroativamente, mas o plano deixa de existir pra novas vendas."
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
