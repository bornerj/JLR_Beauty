import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { getToken } from "../../../../lib/auth";
import { logger } from "../../../../utils/logger";
import { resolveUploadedAssetUrl } from "../../../../lib/assetUrls";
import {
  fetchProductCategories,
  fetchProductStatuses,
  fetchInventoryUnits,
  fetchCrossUnitStock,
  uploadAsset,
} from "../../../shared/api";
import { CategoryStatusManagerModal } from "../../services/components/CategoryStatusManagerModal";
import { StockMoveModal } from "./StockMoveModal";
import { StockHistoryModal } from "./StockHistoryModal";
import type { Product, ProductInput, ProductCategory, ProductStatusOption, InventoryUnit, CrossUnitStockRow } from "../types";

/**
 * Admin V2 (PLAN-0026, Onda 11) — modal de criar/editar Produto, a tela mais pesada do
 * plano (upload de imagem, benefícios, min/max de estoque, estoque real por unidade).
 * Campos e regras espelham o form legado (`admin-products/AdminProductsView.tsx` +
 * `admin-products/behavior.ts`, 973 linhas imperativas), reescrito como React declarativo.
 *
 * **Estoque inicial só na criação** (regra do backend, `PLAN-0020`: `PATCH` nunca mexe em
 * estoque, só `POST` com `initialStock`+`initialStockUnitId`). No modo edição, o painel
 * "Estoque por unidade" mostra o saldo real de cada unidade (`/inventory/cross-unit`) e
 * abre os modais de Movimentar/Histórico — mesma UX do legado.
 */

const IMAGE_UPLOAD_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_BENEFITS = 5;

type FormState = {
  name: string;
  description: string;
  sku: string;
  price: string;
  costPrice: string;
  minStock: string;
  maxStock: string;
  productCategoryId: string;
  productStatusId: string;
  isFeatured: boolean;
  imageUrl: string;
  benefits: string[];
  initialStock: string;
  initialStockUnitId: string;
};

const emptyForm = (): FormState => ({
  name: "",
  description: "",
  sku: "",
  price: "",
  costPrice: "",
  minStock: "",
  maxStock: "",
  productCategoryId: "",
  productStatusId: "",
  isFeatured: false,
  imageUrl: "",
  benefits: [],
  initialStock: "",
  initialStockUnitId: "",
});

const fromProduct = (product: Product): FormState => ({
  name: product.name,
  description: product.description ?? "",
  sku: product.sku ?? "",
  price: product.price,
  costPrice: product.costPrice ?? "",
  minStock: String(product.minStock ?? 0),
  maxStock: product.maxStock !== null ? String(product.maxStock) : "",
  productCategoryId: product.productCategory ? String(product.productCategory.id) : "",
  productStatusId: product.productStatus ? String(product.productStatus.id) : "",
  isFeatured: product.isFeatured,
  imageUrl: product.imageUrl ?? "",
  benefits: Array.isArray(product.benefits) ? product.benefits.filter(Boolean) : [],
  initialStock: "",
  initialStockUnitId: "",
});

export function ProductFormModal({
  editing,
  submitting,
  error,
  onCancel,
  onSubmit,
}: {
  /** `null` = criando um produto novo; um `Product` = editando esse produto. */
  editing: Product | null;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (input: ProductInput) => void;
}) {
  const [form, setForm] = useState<FormState>(editing ? fromProduct(editing) : emptyForm());
  const [localError, setLocalError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [statuses, setStatuses] = useState<ProductStatusOption[]>([]);
  const [units, setUnits] = useState<InventoryUnit[]>([]);
  const [managerOpen, setManagerOpen] = useState<"category" | "status" | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stockRows, setStockRows] = useState<CrossUnitStockRow[] | null>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const loadOptions = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const [fetchedCategories, fetchedStatuses, fetchedUnits] = await Promise.all([
        fetchProductCategories({ token }),
        fetchProductStatuses({ token }),
        fetchInventoryUnits({ token }),
      ]);
      setCategories(fetchedCategories);
      setStatuses(fetchedStatuses);
      setUnits(fetchedUnits);
    } catch (err) {
      logger.warn("Falha ao carregar categorias/status/unidades de produto (Admin V2)", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  const loadStockPanel = useCallback(async () => {
    if (!editing) return;
    const token = getToken();
    if (!token) return;
    setStockLoading(true);
    try {
      const rows = await fetchCrossUnitStock({ token, productId: editing.id });
      setStockRows(rows);
    } catch (err) {
      logger.warn("Falha ao carregar saldos de estoque (Admin V2)", {
        error: err instanceof Error ? err.message : String(err),
        productId: editing.id,
      });
      setStockRows(null);
    } finally {
      setStockLoading(false);
    }
  }, [editing]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    void loadStockPanel();
  }, [loadStockPanel]);

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

  const setBenefit = (index: number, value: string) => {
    const next = [...form.benefits];
    next[index] = value;
    setForm({ ...form, benefits: next });
  };
  const addBenefit = () => {
    if (form.benefits.length >= MAX_BENEFITS) return;
    setForm({ ...form, benefits: [...form.benefits, ""] });
  };
  const removeBenefit = (index: number) => setForm({ ...form, benefits: form.benefits.filter((_, i) => i !== index) });

  const handleSubmit = () => {
    const name = form.name.trim();
    const price = form.price.trim() ? Number(form.price) : NaN;
    if (!name) {
      setLocalError("Informe o nome do produto.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setLocalError("Informe um preço de venda válido (maior que zero).");
      return;
    }
    const costPrice = form.costPrice.trim() ? Number(form.costPrice) : undefined;
    const minStock = form.minStock.trim() ? Number(form.minStock) : undefined;
    const maxStock = form.maxStock.trim() ? Number(form.maxStock) : null;
    const initialStock = !editing && form.initialStock.trim() ? Number(form.initialStock) : undefined;
    if (initialStock !== undefined && initialStock > 0 && !form.initialStockUnitId) {
      setLocalError("Selecione a unidade do estoque inicial.");
      return;
    }

    setLocalError(null);
    onSubmit({
      name,
      description: form.description.trim() || undefined,
      sku: form.sku.trim() || undefined,
      price,
      costPrice,
      minStock,
      maxStock,
      productCategoryId: form.productCategoryId ? Number(form.productCategoryId) : undefined,
      productStatusId: form.productStatusId ? Number(form.productStatusId) : undefined,
      isFeatured: form.isFeatured,
      imageUrl: form.imageUrl.trim() || undefined,
      benefits: form.benefits.map((b) => b.trim()).filter(Boolean),
      initialStock,
      initialStockUnitId: initialStock !== undefined && form.initialStockUnitId ? Number(form.initialStockUnitId) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-forest">
        <h3 className="text-xl font-bold text-forest">{editing ? "Editar produto" : "Novo produto"}</h3>

        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Nome do produto</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Shampoo Argan Premium"
                className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Categoria</label>
                <div className="flex items-center gap-2">
                  <select
                    value={form.productCategoryId}
                    onChange={(e) => setForm({ ...form, productCategoryId: e.target.value })}
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
                    title="Gerenciar categorias de produto"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">SKU</label>
                <input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="JLR-ARG-01"
                  className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Preço de venda</label>
                <input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0,00"
                  className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Preço de custo</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                  placeholder="0,00 (p/ CMV e margem)"
                  className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Estoque mínimo</label>
                <input
                  type="number"
                  min={0}
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                  placeholder="Alerta de reposição"
                  className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
                />
              </div>
            </div>

            {!editing && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Estoque inicial</label>
                  <input
                    type="number"
                    min={0}
                    value={form.initialStock}
                    onChange={(e) => setForm({ ...form, initialStock: e.target.value })}
                    placeholder="Somente no cadastro"
                    className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Unidade do estoque</label>
                  <select
                    value={form.initialStockUnitId}
                    onChange={(e) => setForm({ ...form, initialStockUnitId: e.target.value })}
                    className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
                  >
                    <option value="">Selecione a unidade</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.isOnline ? `${unit.name} (online)` : unit.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {editing && (
              <div className="flex flex-col gap-3 rounded-xl border border-gold/40 bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-forest">Estoque por unidade</h4>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setMoveModalOpen(true)}
                      className="rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-primary/90"
                    >
                      Movimentar
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryModalOpen(true)}
                      className="rounded-lg border border-gold/40 px-2.5 py-1.5 text-[11px] font-semibold text-forest hover:bg-primary/10"
                    >
                      Histórico
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  {stockLoading && <p className="text-stone-500 dark:text-stone-400">Carregando saldos…</p>}
                  {!stockLoading && stockRows && stockRows.length === 0 && (
                    <p className="text-stone-500 dark:text-stone-400">Sem saldo registrado em nenhuma unidade.</p>
                  )}
                  {!stockLoading &&
                    stockRows?.map((row) => (
                      <div key={row.unitId} className="flex items-center justify-between gap-2 border-b border-gold/20 py-1 last:border-0">
                        <span className="text-stone-600 dark:text-stone-400">
                          {row.unitName}
                          {row.isOnline ? " 🌐" : ""}
                        </span>
                        {row.available <= 0 ? (
                          <span className="rounded bg-state-critical/15 px-1.5 py-0.5 font-semibold text-state-critical">Esgotado</span>
                        ) : (
                          <span className="font-semibold text-forest">{row.available}</span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Status</label>
                <div className="flex items-center gap-2">
                  <select
                    value={form.productStatusId}
                    onChange={(e) => setForm({ ...form, productStatusId: e.target.value })}
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
                    title="Gerenciar status de produto"
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
                Mostrar na vitrine
              </label>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Descrição</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalhes do produto, benefícios e modo de uso."
                className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  Benefícios (até {MAX_BENEFITS})
                </label>
              </div>
              {form.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={benefit}
                    onChange={(e) => setBenefit(index, e.target.value)}
                    placeholder={`Benefício ${index + 1}`}
                    className="w-full rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
                  />
                  <button
                    type="button"
                    onClick={() => removeBenefit(index)}
                    title="Remover benefício"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">remove</span>
                  </button>
                </div>
              ))}
              {form.benefits.length < MAX_BENEFITS && (
                <button
                  type="button"
                  onClick={addBenefit}
                  className="flex items-center justify-center gap-2 rounded-lg border border-stone-200 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Adicionar benefício
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Imagem do produto</label>
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
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Pré-visualização</label>
            <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-gold/40 bg-primary/5">
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="Imagem do produto" className="h-full w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-stone-400">
                  <span className="material-symbols-outlined text-5xl">image</span>
                  <span className="text-xs">Sem imagem</span>
                </div>
              )}
            </div>
          </div>
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
            {submitting ? "Salvando…" : editing ? "Atualizar produto" : "Salvar produto"}
          </button>
        </div>
      </div>

      {managerOpen && (
        <CategoryStatusManagerModal
          kind={managerOpen}
          entity="product"
          onClose={() => setManagerOpen(null)}
          onChanged={() => void loadOptions()}
        />
      )}

      {editing && moveModalOpen && (
        <StockMoveModal
          productId={editing.id}
          productName={editing.name}
          units={units}
          onClose={() => setMoveModalOpen(false)}
          onSaved={() => {
            setMoveModalOpen(false);
            void loadStockPanel();
          }}
        />
      )}

      {editing && historyModalOpen && (
        <StockHistoryModal productId={editing.id} productName={editing.name} units={units} onClose={() => setHistoryModalOpen(false)} />
      )}
    </div>
  );
}
