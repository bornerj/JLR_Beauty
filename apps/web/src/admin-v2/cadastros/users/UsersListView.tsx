import { useCallback, useEffect, useMemo, useState } from "react";
import { getToken, getUser } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { fetchUsers, createUser, updateUser, deleteUser } from "../../shared/api";
import { formatDateTimeBR } from "../../shared/format";
import { DeleteConfirmModal } from "../../shell/DeleteConfirmModal";
import { UserFormModal } from "./components/UserFormModal";
import { USER_ROLES, USER_ROLE_LABELS, USER_STATUSES, USER_STATUS_LABELS } from "./types";
import type { User, UserCreateInput, UserUpdateInput } from "./types";

/**
 * Admin V2 (PLAN-0026, Onda 14) — Cadastro de Usuários, tier G, terceira e última tela do
 * desmembramento de "Pessoas" (`DECISION-014` regra #3) — fecha o plano inteiro (14/14
 * ondas). Reusa `/api/users` sem alteração; única entidade das 3 com CRUD completo
 * (Clientes não tem `DELETE`, Profissionais não tem `POST`).
 *
 * **Simplificação documentada**: a tabela legada (`admin-core/behavior.ts`) tem 14 colunas,
 * incluindo uma coluna só com a URL crua do avatar (redundante — o avatar já aparece como
 * imagem na coluna do usuário) e o papel repetido em 2 colunas. Reduzida pra 9 colunas sem
 * perder nenhuma informação real, mesmo espírito das simplificações das Ondas 8/11
 * (paginação numérada, cards fabricados). Também sem modal de "preview" somente-leitura
 * separado — o modal de edição já mostra/edita todos os campos, mesmo padrão de todas as
 * outras 13 ondas do plano.
 *
 * **Segurança espelhada do backend**: excluir a própria conta é bloqueado no backend (403) —
 * botão de excluir desabilitado na própria linha, sem esperar o erro. Atribuir o papel
 * `MASTER` só é permitido a quem já é `MASTER` — ver `UserFormModal`.
 */

type ListState = { loading: boolean; data: User[] | null; error: string | null };
type FormModalState = { mode: "create" } | { mode: "edit"; user: User } | null;
type MutationState = { submitting: boolean; error: string | null };
type DeleteState = { user: User; submitting: boolean; error: string | null } | null;

export function UsersListView() {
  const [state, setState] = useState<ListState>({ loading: true, data: null, error: null });
  const [formModal, setFormModal] = useState<FormModalState>(null);
  const [mutation, setMutation] = useState<MutationState>({ submitting: false, error: null });
  const [deleteState, setDeleteState] = useState<DeleteState>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const currentUserId = getUser()?.id;

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchUsers({ token });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar os usuários.";
      logger.warn("Falha ao carregar Usuários (Admin V2)", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (state.data ?? []).filter((u) => {
      const matchesQuery =
        !query ||
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        (u.phone ?? "").toLowerCase().includes(query);
      const matchesRole = !roleFilter || u.role === roleFilter;
      const matchesStatus = !statusFilter || u.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [state.data, search, roleFilter, statusFilter]);

  const handleSubmit = useCallback(
    async (input: UserCreateInput | UserUpdateInput) => {
      const token = getToken();
      if (!token || !formModal) return;
      setMutation({ submitting: true, error: null });
      try {
        if (formModal.mode === "edit") {
          await updateUser({ token, id: formModal.user.id, input: input as UserUpdateInput });
        } else {
          await createUser({ token, input: input as UserCreateInput });
        }
        setFormModal(null);
        setMutation({ submitting: false, error: null });
        void load();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao salvar o usuário.";
        logger.warn("Falha ao salvar usuário (Admin V2)", { error: message });
        setMutation({ submitting: false, error: message });
      }
    },
    [formModal, load]
  );

  const handleDelete = useCallback(async () => {
    const token = getToken();
    if (!token || !deleteState) return;
    setDeleteState({ ...deleteState, submitting: true, error: null });
    try {
      await deleteUser({ token, id: deleteState.user.id });
      setDeleteState(null);
      void load();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao excluir o usuário.";
      logger.warn("Falha ao excluir usuário (Admin V2)", { error: message });
      setDeleteState((prev) => (prev ? { ...prev, submitting: false, error: message } : prev));
    }
  }, [deleteState, load]);

  if (state.loading && !state.data) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando usuários…</p>;
  }

  if (state.error && !state.data) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar os usuários.</p>
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
          <h1 className="text-3xl font-bold text-forest">Usuários</h1>
          <p className="text-base text-stone-600 dark:text-stone-400">
            contas de acesso ao site e ao painel, com papel e status de conta · {filtered.length}/{state.data.length} usuário(s)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormModal({ mode: "create" })}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
        >
          + Novo usuário
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail ou telefone…"
          className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green sm:col-span-2"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
        >
          <option value="">Todos os papéis</option>
          {USER_ROLES.map((role) => (
            <option key={role} value={role}>
              {USER_ROLE_LABELS[role]}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
        >
          <option value="">Todos os status</option>
          {USER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {USER_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-500 dark:text-stone-400">
          Nenhum usuário encontrado.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#cfe7d1] bg-white dark:border-forest-green dark:bg-forest">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#cfe7d1] text-xs font-bold uppercase tracking-wider text-stone-500 dark:border-forest-green dark:text-stone-400">
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Cidade / Bairro</th>
                <th className="px-4 py-3">Papel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Verificado</th>
                <th className="px-4 py-3">Último acesso</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-stone-100 last:border-0 dark:border-forest-green/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {user.name.trim().charAt(0).toUpperCase() || "U"}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-forest">{user.name}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">USR-{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-forest">{user.email}</td>
                  <td className="px-4 py-3 text-forest">
                    {user.phone ?? "—"}
                    {user.phone2 && <span className="block text-xs text-stone-500 dark:text-stone-400">{user.phone2}</span>}
                  </td>
                  <td className="px-4 py-3 text-forest">
                    {user.city ? `${user.city}${user.neighborhood ? ` / ${user.neighborhood}` : ""}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {USER_ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        user.status === "ATIVO"
                          ? "bg-state-healthy/15 text-state-healthy"
                          : user.status === "INATIVO"
                            ? "bg-state-attention/15 text-state-attention"
                            : user.status === "SUSPENSO"
                              ? "bg-state-attention/15 text-state-attention"
                              : "bg-state-critical/15 text-state-critical"
                      }`}
                    >
                      {user.status ? (USER_STATUS_LABELS[user.status] ?? user.status) : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-forest">{user.emailVerified ? "Sim" : "Não"}</td>
                  <td className="px-4 py-3 text-forest">{formatDateTimeBR(user.lastAccessAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setFormModal({ mode: "edit", user })}
                      title="Editar"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-forest hover:bg-primary/10"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteState({ user, submitting: false, error: null })}
                      disabled={user.id === currentUserId}
                      title={user.id === currentUserId ? "Não é possível excluir a própria conta" : "Excluir"}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-state-critical hover:bg-state-critical/10 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formModal && (
        <UserFormModal
          editing={formModal.mode === "edit" ? formModal.user : null}
          submitting={mutation.submitting}
          error={mutation.error}
          onCancel={() => {
            setFormModal(null);
            setMutation({ submitting: false, error: null });
          }}
          onSubmit={(input) => void handleSubmit(input)}
        />
      )}

      {deleteState && (
        <DeleteConfirmModal
          title="Excluir usuário"
          description={`Tem certeza que deseja excluir "${deleteState.user.name}"? Essa ação não pode ser desfeita.`}
          submitting={deleteState.submitting}
          error={deleteState.error}
          onCancel={() => setDeleteState(null)}
          onConfirm={() => void handleDelete()}
        />
      )}
    </div>
  );
}
