import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../../../lib/auth";
import { logger } from "../../../../utils/logger";
import {
  fetchProfessionalCommissionProfiles,
  createProfessionalCommissionProfile,
  updateProfessionalCommissionProfile,
  deleteProfessionalCommissionProfile,
} from "../../../shared/api";
import type { ProfessionalCommissionProfile } from "../types";

/**
 * Admin V2 (PLAN-0026, Onda 13) — gerenciador de Perfis de Comissão, aberto a partir do form
 * de edição de Profissional (mesmo padrão do `CategoryStatusManagerModal`, Ondas 8/11: form
 * inline + lista + exclusão direta, sem confirmação nested — "em uso, não pode excluir" é
 * decidido pelo **backend** via 409, não recalculado no cliente). Reusa
 * `/api/professional-commission-profiles` sem alteração.
 */

const STATUS_OPTIONS: { value: "ACTIVE" | "INACTIVE"; label: string }[] = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
];

export function CommissionProfileManagerModal({
  onClose,
  onChanged,
}: {
  onClose: () => void;
  /** disparado após qualquer criação/edição/exclusão bem-sucedida, pra recarregar o dropdown do form de profissional. */
  onChanged: () => void;
}) {
  const [items, setItems] = useState<ProfessionalCommissionProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [percent, setPercent] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

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
      const data = await fetchProfessionalCommissionProfiles({ token });
      setItems(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar perfis de comissão.";
      logger.warn("Falha ao carregar perfis de comissão (Admin V2)", { error: message });
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
    setName("");
    setPercent("");
    setStatus("ACTIVE");
  };

  const handleEdit = (item: ProfessionalCommissionProfile) => {
    setEditingId(item.id);
    setName(item.name);
    setPercent(item.commissionPercent);
    setStatus(item.status);
  };

  const handleSave = async () => {
    const token = getToken();
    const trimmedName = name.trim();
    const percentValue = Number(percent.replace(",", "."));
    if (!token || !trimmedName) return;
    if (!Number.isFinite(percentValue) || percentValue < 0 || percentValue > 100) {
      setError("Informe uma comissão entre 0 e 100.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const input = { name: trimmedName, commissionPercent: percentValue, status };
      if (editingId) {
        await updateProfessionalCommissionProfile({ token, id: editingId, input });
      } else {
        await createProfessionalCommissionProfile({ token, input });
      }
      resetForm();
      await load();
      onChanged();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar perfil de comissão.";
      logger.warn("Falha ao salvar perfil de comissão (Admin V2)", { error: message });
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
      await deleteProfessionalCommissionProfile({ token, id });
      if (editingId === id) resetForm();
      await load();
      onChanged();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao excluir perfil de comissão.";
      logger.warn("Falha ao excluir perfil de comissão (Admin V2)", { error: message });
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-forest">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-forest">Perfis de comissão</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/40 text-forest hover:bg-primary/5"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_100px_100px] items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Perfil</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Sênior"
              className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Comissão (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
            />
          </div>
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
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={submitting || !name.trim()}
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
            <p className="text-sm text-stone-500 dark:text-stone-400">Nenhum perfil de comissão cadastrado ainda.</p>
          )}
          {!loading &&
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-gold/30 bg-primary/5 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-forest">{item.name}</span>
                  <span className="text-xs text-stone-600 dark:text-stone-400">{item.commissionPercent}%</span>
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
