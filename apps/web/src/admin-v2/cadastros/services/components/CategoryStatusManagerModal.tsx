import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../../../lib/auth";
import { logger } from "../../../../utils/logger";
import {
  fetchServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  fetchServiceStatuses,
  createServiceStatus,
  updateServiceStatus,
  deleteServiceStatus,
} from "../../../shared/api";
import type { ServiceCategory, ServiceStatusOption, ServiceCategoryStatus, ServiceStatusColor } from "../types";

/**
 * Admin V2 (PLAN-0026, Onda 8) — gerenciador rápido de Categorias/Status de Serviço, aberto
 * a partir do form de Serviço (botão "+" junto do dropdown, mesmo padrão do legado). Reusa
 * `/api/service-categories`/`/api/service-statuses` sem alteração. Genérico por `kind` —
 * mesmo componente serve os dois, e fica pronto pra Produtos reusar na Onda 11 (categorias/
 * status de produto usam o mesmo desenho de endpoint no backend).
 *
 * "Em uso, não pode excluir" é decidido pelo **backend** (409 no DELETE) — não recalculado
 * no cliente cruzando com a lista de serviços; o erro do backend já é a fonte da verdade,
 * simplifica o componente e evita replicar a regra em dois lugares.
 */

const CATEGORY_STATUS_OPTIONS: { value: ServiceCategoryStatus; label: string }[] = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
];

const COLOR_OPTIONS: { value: ServiceStatusColor; label: string; badgeClass: string }[] = [
  { value: "VERDE", label: "Verde", badgeClass: "bg-state-healthy/15 text-state-healthy" },
  { value: "AMARELO", label: "Amarelo", badgeClass: "bg-state-attention/15 text-state-attention" },
  { value: "VERMELHO", label: "Vermelho", badgeClass: "bg-state-critical/15 text-state-critical" },
  { value: "CINZA", label: "Cinza", badgeClass: "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300" },
];

const categoryBadgeClass = (status: ServiceCategoryStatus): string =>
  status === "ACTIVE" ? "bg-state-healthy/15 text-state-healthy" : "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300";

const colorBadgeClass = (color: ServiceStatusColor): string =>
  COLOR_OPTIONS.find((opt) => opt.value === color)?.badgeClass ?? COLOR_OPTIONS[0].badgeClass;

type Item = ServiceCategory | ServiceStatusOption;

export function CategoryStatusManagerModal({
  kind,
  onClose,
  onChanged,
}: {
  kind: "category" | "status";
  onClose: () => void;
  /** disparado após qualquer criação/edição/exclusão bem-sucedida, pra recarregar os dropdowns do form. */
  onChanged: () => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [statusValue, setStatusValue] = useState<ServiceCategoryStatus>("ACTIVE");
  const [colorValue, setColorValue] = useState<ServiceStatusColor>("VERDE");

  const title = kind === "category" ? "Categorias de Serviço" : "Status de Serviço";

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
      const data = kind === "category" ? await fetchServiceCategories({ token }) : await fetchServiceStatuses({ token });
      setItems(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar.";
      logger.warn("Falha ao carregar categorias/status de serviço (Admin V2)", { error: message, kind });
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setStatusValue("ACTIVE");
    setColorValue("VERDE");
  };

  const handleEdit = (item: Item) => {
    setEditingId(item.id);
    setName(item.name);
    if (kind === "category") setStatusValue((item as ServiceCategory).status);
    else setColorValue((item as ServiceStatusOption).color);
  };

  const handleSave = async () => {
    const token = getToken();
    if (!token || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const input = kind === "category" ? { name: name.trim(), status: statusValue } : { name: name.trim(), color: colorValue };
      if (editingId) {
        if (kind === "category") await updateServiceCategory({ token, id: editingId, input });
        else await updateServiceStatus({ token, id: editingId, input });
      } else {
        if (kind === "category") await createServiceCategory({ token, input });
        else await createServiceStatus({ token, input });
      }
      resetForm();
      await load();
      onChanged();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar.";
      logger.warn("Falha ao salvar categoria/status de serviço (Admin V2)", { error: message, kind });
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
      if (kind === "category") await deleteServiceCategory({ token, id });
      else await deleteServiceStatus({ token, id });
      if (editingId === id) resetForm();
      await load();
      onChanged();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao excluir.";
      logger.warn("Falha ao excluir categoria/status de serviço (Admin V2)", { error: message, kind });
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-forest">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-forest">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/40 text-forest hover:bg-primary/5"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="mt-4 flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={kind === "category" ? "Ex.: Cabelos" : "Ex.: Ativo"}
              className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
            />
          </div>
          {kind === "category" ? (
            <select
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value as ServiceCategoryStatus)}
              className="rounded-lg border border-gold/40 bg-white px-2 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
            >
              {CATEGORY_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={colorValue}
              onChange={(e) => setColorValue(e.target.value as ServiceStatusColor)}
              className="rounded-lg border border-gold/40 bg-white px-2 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
            >
              {COLOR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
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
            <p className="text-sm text-stone-500 dark:text-stone-400">Nada cadastrado ainda.</p>
          )}
          {!loading &&
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-gold/30 bg-primary/5 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-forest">{item.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      kind === "category"
                        ? categoryBadgeClass((item as ServiceCategory).status)
                        : colorBadgeClass((item as ServiceStatusOption).color)
                    }`}
                  >
                    {kind === "category"
                      ? CATEGORY_STATUS_OPTIONS.find((opt) => opt.value === (item as ServiceCategory).status)?.label
                      : (item as ServiceStatusOption).color}
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
