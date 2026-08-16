import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../../../lib/auth";
import { logger } from "../../../../utils/logger";
import {
  fetchProfessionalWorkProfiles,
  createProfessionalWorkProfile,
  updateProfessionalWorkProfile,
  deleteProfessionalWorkProfile,
} from "../../../shared/api";
import { WORK_PROFILE_PERMISSION_GROUPS } from "../types";
import type { ProfessionalWorkProfile, ProfessionalWorkProfilePermissions } from "../types";

/**
 * Admin V2 (PLAN-0026, Onda 13) — gerenciador de Perfis de Trabalho, aberto a partir do form
 * de edição de Profissional. Mesmo padrão de manager do `CommissionProfileManagerModal`
 * (form inline + lista + exclusão direta, backend decide "em uso" via 409). 14 permissões
 * booleanas agrupadas em 3 blocos, mesmos rótulos e agrupamento do legado
 * (`admin-people/components/AdminPeopleView.tsx`). Reusa `/api/professional-work-profiles`
 * sem alteração.
 */

const STATUS_OPTIONS: { value: "ACTIVE" | "INACTIVE"; label: string }[] = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
];

const emptyPermissions = (): ProfessionalWorkProfilePermissions => ({
  canScheduleAppointments: false,
  canAccessOtherProfessionalsAgenda: false,
  canViewServiceValues: false,
  canViewCustomerContact: false,
  canAccessMenuClientsAnamnese: false,
  canAccessMenuServices: false,
  canAccessMenuProducts: false,
  canAccessMenuExpenses: false,
  canViewCommissionsToReceive: false,
  canViewCommissionPayments: false,
  canEditAppointments: false,
  canDeleteAppointments: false,
  canCreateServiceInAppointment: false,
  canViewGrossCommissionsToPay: false,
});

const activePermissionCount = (item: ProfessionalWorkProfile): number =>
  WORK_PROFILE_PERMISSION_GROUPS.flatMap((group) => group.items).filter((perm) => item[perm.key]).length;

export function WorkProfileManagerModal({
  onClose,
  onChanged,
}: {
  onClose: () => void;
  /** disparado após qualquer criação/edição/exclusão bem-sucedida, pra recarregar o dropdown do form de profissional. */
  onChanged: () => void;
}) {
  const [items, setItems] = useState<ProfessionalWorkProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [permissions, setPermissions] = useState<ProfessionalWorkProfilePermissions>(emptyPermissions());

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError("Sessão expirada. Faça login novamente.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProfessionalWorkProfiles({ token });
      setItems(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar perfis de trabalho.";
      logger.warn("Falha ao carregar perfis de trabalho (Admin V2)", { error: message });
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setStatus("ACTIVE");
    setPermissions(emptyPermissions());
  };

  const handleEdit = (item: ProfessionalWorkProfile) => {
    setEditingId(item.id);
    setTitle(item.title);
    setStatus(item.status);
    setPermissions({
      canScheduleAppointments: item.canScheduleAppointments,
      canAccessOtherProfessionalsAgenda: item.canAccessOtherProfessionalsAgenda,
      canViewServiceValues: item.canViewServiceValues,
      canViewCustomerContact: item.canViewCustomerContact,
      canAccessMenuClientsAnamnese: item.canAccessMenuClientsAnamnese,
      canAccessMenuServices: item.canAccessMenuServices,
      canAccessMenuProducts: item.canAccessMenuProducts,
      canAccessMenuExpenses: item.canAccessMenuExpenses,
      canViewCommissionsToReceive: item.canViewCommissionsToReceive,
      canViewCommissionPayments: item.canViewCommissionPayments,
      canEditAppointments: item.canEditAppointments,
      canDeleteAppointments: item.canDeleteAppointments,
      canCreateServiceInAppointment: item.canCreateServiceInAppointment,
      canViewGrossCommissionsToPay: item.canViewGrossCommissionsToPay,
    });
  };

  const handleSave = async () => {
    const token = getToken();
    const trimmedTitle = title.trim();
    if (!token || !trimmedTitle) return;
    setSubmitting(true);
    setError(null);
    try {
      const input = { title: trimmedTitle, status, ...permissions };
      if (editingId) {
        await updateProfessionalWorkProfile({ token, id: editingId, input });
      } else {
        await createProfessionalWorkProfile({ token, input });
      }
      resetForm();
      await load();
      onChanged();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar perfil de trabalho.";
      logger.warn("Falha ao salvar perfil de trabalho (Admin V2)", { error: message });
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteProfessionalWorkProfile({ token, id });
      if (editingId === id) resetForm();
      await load();
      onChanged();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao excluir perfil de trabalho.";
      logger.warn("Falha ao excluir perfil de trabalho (Admin V2)", { error: message });
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-forest">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-forest">Perfis de trabalho</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/40 text-forest hover:bg-primary/5"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_140px] gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Recepção"
              className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
              className="rounded-lg border border-gold/40 bg-white px-2 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-gold/30 bg-primary/5 p-4">
          {WORK_PROFILE_PERMISSION_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">{group.title}</h4>
              {group.items.map((perm) => (
                <label key={perm.key} className="flex items-center justify-between gap-4 py-0.5 text-sm text-forest">
                  <span>{perm.label}</span>
                  <input
                    type="checkbox"
                    checked={permissions[perm.key]}
                    onChange={(e) => setPermissions({ ...permissions, [perm.key]: e.target.checked })}
                    className="h-4 w-4 accent-primary"
                  />
                </label>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={submitting || !title.trim()}
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Salvando…" : editingId ? "Atualizar" : "Adicionar"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 dark:text-stone-400"
            >
              Cancelar
            </button>
          )}
        </div>

        {error && <p className="mt-3 text-xs font-semibold text-state-critical">{error}</p>}

        <div className="mt-4 flex flex-col gap-2">
          {loading && <p className="text-sm text-stone-600 dark:text-stone-400">Carregando…</p>}
          {!loading && items.length === 0 && (
            <p className="text-sm text-stone-500 dark:text-stone-400">Nenhum perfil de trabalho cadastrado ainda.</p>
          )}
          {!loading &&
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-gold/30 bg-primary/5 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-forest">{item.title}</span>
                  <span className="text-xs text-stone-600 dark:text-stone-400">{activePermissionCount(item)} permissões ativas</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      item.status === "ACTIVE"
                        ? "bg-state-healthy/15 text-state-healthy"
                        : "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300"
                    }`}
                  >
                    {item.status === "ACTIVE" ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    disabled={submitting}
                    title="Editar"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-forest hover:bg-primary/10"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(item.id)}
                    disabled={submitting}
                    title="Excluir"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-state-critical hover:bg-state-critical/10"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
