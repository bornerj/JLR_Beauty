import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { getToken } from "../../../../lib/auth";
import { logger } from "../../../../utils/logger";
import { resolveUploadedAssetUrl } from "../../../../lib/assetUrls";
import { fetchServiceCategories, fetchServiceStatuses, uploadAsset } from "../../../shared/api";
import { CategoryStatusManagerModal } from "./CategoryStatusManagerModal";
import type { Service, ServiceInput, ServiceCategory, ServiceStatusOption } from "../types";

/**
 * Admin V2 (PLAN-0026, Onda 8) — modal de criar/editar Serviço. Campos e validação client-
 * side espelham o form legado (`admin-services/AdminServicesView.tsx` +
 * `admin-services/behavior.ts`), reescrito como React declarativo em vez de
 * `querySelector`/`addEventListener` manual. Categoria/Status carregados de verdade da API
 * (`/service-categories`/`/service-statuses`), não hardcoded como o `<option>` estático que
 * aparecia no JSX legado (a lista real de opções nunca era só essas 4/3 fixas).
 *
 * PLAN-0027 Item 9 (`ERR-0059`): ID do serviço (`Service.id`, somente leitura) adicionado
 * como primeiro campo do form — mesmo achado do Item 5 (Clientes), a grid mostrava `SRV-{id}`
 * mas o form de edição não expunha o ID em lugar nenhum.
 *
 * PLAN-0028 Caso B (`ERR-0062`): bloco "Destaque na Home" adicionado — só aparece quando
 * "Destaque (flip-cards)" está marcado, pra não poluir o form dos ~67 serviços sem Destaque.
 * Alimenta `GET /public/services/featured`, que substitui os media slots/page texts
 * estáticos que a Home usava antes pra esses 9 cards.
 */

const IMAGE_UPLOAD_MAX_SIZE_BYTES = 5 * 1024 * 1024;

type FormState = {
  name: string;
  description: string;
  price: string;
  cost: string;
  durationMin: string;
  commissionPercent: string;
  serviceCategoryId: string;
  serviceStatusId: string;
  isFeatured: boolean;
  imageUrl: string;
  highlightLabel: string;
  highlightTagline: string;
  highlightBackLabel: string;
  highlightDescription: string;
  highlightOrder: string;
};

const emptyForm = (): FormState => ({
  name: "",
  description: "",
  price: "",
  cost: "",
  durationMin: "",
  commissionPercent: "",
  serviceCategoryId: "",
  serviceStatusId: "",
  isFeatured: false,
  imageUrl: "",
  highlightLabel: "",
  highlightTagline: "",
  highlightBackLabel: "",
  highlightDescription: "",
  highlightOrder: "",
});

const fromService = (service: Service): FormState => ({
  name: service.name,
  description: service.description ?? "",
  price: service.price,
  cost: service.cost ?? "",
  durationMin: service.durationMin ? String(service.durationMin) : "",
  commissionPercent: service.commissionPercent !== null ? String(service.commissionPercent) : "",
  serviceCategoryId: service.serviceCategory ? String(service.serviceCategory.id) : "",
  serviceStatusId: service.serviceStatus ? String(service.serviceStatus.id) : "",
  isFeatured: service.isFeatured,
  imageUrl: service.imageUrl ?? "",
  highlightLabel: service.highlightLabel ?? "",
  highlightTagline: service.highlightTagline ?? "",
  highlightBackLabel: service.highlightBackLabel ?? "",
  highlightDescription: service.highlightDescription ?? "",
  highlightOrder: service.highlightOrder !== null ? String(service.highlightOrder) : "",
});

export function ServiceFormModal({
  editing,
  submitting,
  error,
  onCancel,
  onSubmit,
}: {
  /** `null` = criando um serviço novo; um `Service` = editando esse serviço. */
  editing: Service | null;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (input: ServiceInput) => void;
}) {
  const [form, setForm] = useState<FormState>(editing ? fromService(editing) : emptyForm());
  const [localError, setLocalError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [statuses, setStatuses] = useState<ServiceStatusOption[]>([]);
  const [managerOpen, setManagerOpen] = useState<"category" | "status" | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadOptions = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const [fetchedCategories, fetchedStatuses] = await Promise.all([
        fetchServiceCategories({ token }),
        fetchServiceStatuses({ token }),
      ]);
      setCategories(fetchedCategories);
      setStatuses(fetchedStatuses);
    } catch (err) {
      logger.warn("Falha ao carregar categorias/status de serviço (Admin V2)", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLocalError("Selecione um arquivo de imagem válido (PNG, JPG, WEBP, etc).");
      return;
    }
    if (file.size > IMAGE_UPLOAD_MAX_SIZE_BYTES) {
      setLocalError("A imagem excede 5MB. Envie um arquivo menor.");
      return;
    }
    const token = getToken();
    if (!token) {
      setLocalError("Sessão expirada. Faça login novamente.");
      return;
    }
    setUploading(true);
    setLocalError(null);
    try {
      const uploadedUrl = await uploadAsset({ token, file });
      const resolved = resolveUploadedAssetUrl(uploadedUrl) || uploadedUrl;
      setForm((current) => ({ ...current, imageUrl: resolved }));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Falha ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    const name = form.name.trim();
    const price = form.price.trim() ? Number(form.price) : NaN;
    const duration = form.durationMin.trim() ? Number(form.durationMin) : NaN;
    if (!name) {
      setLocalError("Informe o nome do serviço.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setLocalError("Informe um preço válido.");
      return;
    }
    if (!Number.isFinite(duration) || duration < 1) {
      setLocalError("Informe uma duração válida (em minutos).");
      return;
    }
    const cost = form.cost.trim() ? Number(form.cost) : undefined;
    if (cost !== undefined && !Number.isFinite(cost)) {
      setLocalError("Informe um custo válido.");
      return;
    }
    const commissionPercent = form.commissionPercent.trim() ? Number(form.commissionPercent) : undefined;
    if (commissionPercent !== undefined && (!Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100)) {
      setLocalError("Comissão deve estar entre 0 e 100%.");
      return;
    }

    const highlightOrderRaw = form.highlightOrder.trim();
    const highlightOrder = highlightOrderRaw ? Number(highlightOrderRaw) : undefined;
    if (highlightOrderRaw && (!Number.isInteger(highlightOrder) || (highlightOrder as number) < 1)) {
      setLocalError("Ordem no destaque deve ser um número inteiro positivo.");
      return;
    }

    setLocalError(null);
    onSubmit({
      name,
      description: form.description.trim() || undefined,
      price,
      cost,
      durationMin: duration,
      commissionPercent,
      serviceCategoryId: form.serviceCategoryId ? Number(form.serviceCategoryId) : undefined,
      serviceStatusId: form.serviceStatusId ? Number(form.serviceStatusId) : undefined,
      isFeatured: form.isFeatured,
      imageUrl: form.imageUrl.trim() || undefined,
      highlightLabel: form.highlightLabel.trim() || undefined,
      highlightTagline: form.highlightTagline.trim() || undefined,
      highlightBackLabel: form.highlightBackLabel.trim() || undefined,
      highlightDescription: form.highlightDescription.trim() || undefined,
      highlightOrder,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-forest">
        <h3 className="text-xl font-bold text-forest">{editing ? "Editar serviço" : "Novo serviço"}</h3>
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-[110px_1fr] gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">ID</label>
              <input
                value={editing ? `SRV-${editing.id}` : "gerado ao salvar"}
                disabled
                readOnly
                className="rounded-lg border border-gold/40 bg-stone-50 px-3 py-2 text-sm text-stone-500 dark:bg-forest-green/40 dark:text-stone-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Nome do serviço
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Escova Premium"
                className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Descrição</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Resumo rápido do serviço e benefícios principais."
              className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Categoria</label>
              <div className="flex items-center gap-2">
                <select
                  value={form.serviceCategoryId}
                  onChange={(e) => setForm({ ...form, serviceCategoryId: e.target.value })}
                  className="w-full rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
                >
                  <option value="">Selecione</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setManagerOpen("category")}
                  title="Gerenciar categorias de serviço"
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Duração (min)
              </label>
              <input
                type="number"
                min={1}
                value={form.durationMin}
                onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
                placeholder="60"
                className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Preço (R$)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0,00"
                className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Custo (R$)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                placeholder="0,00"
                className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Comissão (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.commissionPercent}
                onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })}
                placeholder="15"
                className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Status</label>
              <div className="flex items-center gap-2">
                <select
                  value={form.serviceStatusId}
                  onChange={(e) => setForm({ ...form, serviceStatusId: e.target.value })}
                  className="w-full rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
                >
                  <option value="">Selecione</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setManagerOpen("status")}
                  title="Gerenciar status de serviço"
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 self-end rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest dark:bg-forest-green">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="accent-primary"
              />
              Destaque (flip-cards)
            </label>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              Imagem do serviço
            </label>
            <div className="flex items-center gap-2">
              <input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="URL da imagem ou envie um arquivo"
                className="w-full rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  void handleUpload(event);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="h-9 flex-shrink-0 rounded-lg border border-primary/30 bg-primary/10 px-3 text-xs font-semibold text-primary hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "Enviando…" : "Upload"}
              </button>
            </div>
          </div>

          {form.isFeatured && (
            <div className="flex flex-col gap-3 rounded-lg border border-gold/40 bg-primary/5 p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Destaque na Home (flip-card)
              </p>
              <p className="-mt-2 text-xs text-stone-600 dark:text-stone-400">
                Conteúdo exibido no flip-card deste serviço na Home pública. Rótulo e descrição de marketing — podem ser
                diferentes do nome/descrição operacional acima.
              </p>
              <div className="grid grid-cols-[1fr_1fr_110px] gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    Rótulo (frente)
                  </label>
                  <input
                    value={form.highlightLabel}
                    onChange={(e) => setForm({ ...form, highlightLabel: e.target.value })}
                    placeholder="Ex.: Lashes"
                    className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    Rótulo (verso)
                  </label>
                  <input
                    value={form.highlightBackLabel}
                    onChange={(e) => setForm({ ...form, highlightBackLabel: e.target.value })}
                    placeholder="Ex.: Extensão de Cílios"
                    className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    Ordem
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.highlightOrder}
                    onChange={(e) => setForm({ ...form, highlightOrder: e.target.value })}
                    placeholder="1"
                    title="Posição do card na grade de Destaque (1 a 9). Deixe em branco pra ordenar por nome."
                    className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  Tagline (frente)
                </label>
                <input
                  value={form.highlightTagline}
                  onChange={(e) => setForm({ ...form, highlightTagline: e.target.value })}
                  placeholder="Frase curta abaixo do rótulo, ex.: Corte preciso e tratamentos restauradores"
                  className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  Descrição (verso)
                </label>
                <textarea
                  rows={2}
                  value={form.highlightDescription}
                  onChange={(e) => setForm({ ...form, highlightDescription: e.target.value })}
                  placeholder="Texto exibido no verso do card, ao passar o mouse/tocar."
                  className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
                />
              </div>
            </div>
          )}
        </div>

        {(localError || error) && <p className="mt-3 text-xs font-semibold text-state-critical">{localError || error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-full border border-stone-200 px-4 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50 dark:text-stone-400"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Salvando…" : editing ? "Atualizar serviço" : "Salvar serviço"}
          </button>
        </div>
      </div>

      {managerOpen && (
        <CategoryStatusManagerModal kind={managerOpen} onClose={() => setManagerOpen(null)} onChanged={() => void loadOptions()} />
      )}
    </div>
  );
}
