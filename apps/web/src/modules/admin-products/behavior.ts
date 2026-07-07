import type { Cleanup } from "../../shared/dom";
import { on } from "../../shared/dom";

type ApiJsonFn = <T = unknown>(path: string, options?: RequestInit) => Promise<T>;
type AddCleanupFn = (cleanup: Cleanup) => void;
type EscapeHtmlFn = (value: string) => string;
type FormatDateFn = (value?: string | null) => string;
type StatusBadgeByColorFn = (color?: string | null) => string;
type ParseCurrencyValueFn = (value: string) => number | null;
type FormatCurrencyValueFn = (value: number) => string;

type ProductRow = {
  id: number;
  name: string;
  description?: string | null;
  sku?: string | null;
  stock?: number | null;
  price: number;
  costPrice?: number | string | null;
  minStock?: number | null;
  imageUrl?: string | null;
  benefits?: string[] | null;
  isFeatured?: boolean | null;
  productCategory?: { id: number; name: string } | null;
  productStatus?: { id: number; name: string; color?: string | null } | null;
  createdAt?: string;
  updatedAt?: string;
};

type UnitRow = { id: number; name: string; kind: string; isOnline: boolean };

type CrossUnitRow = { unitId: number; unitName: string; isOnline: boolean; available: number };

type MovementRow = {
  id: number;
  type: string;
  quantity: number;
  balanceAfter: number;
  reason?: string | null;
  createdAt: string;
  createdBy?: { id: number; name: string } | null;
};

const MOVEMENT_TYPE_LABEL: Record<string, string> = {
  ENTRADA_COMPRA: "Entrada",
  SAIDA_VENDA: "Venda",
  USO_SALAO: "Uso salão",
  PERDA: "Perda",
  AJUSTE: "Ajuste",
  DEVOLUCAO: "Devolução",
};

type InitAdminProductsBehaviorParams = {
  addCleanup: AddCleanupFn;
  apiJson: ApiJsonFn;
  escapeHtml: EscapeHtmlFn;
  formatDate: FormatDateFn;
  statusBadgeByColor: StatusBadgeByColorFn;
  parseCurrencyValue: ParseCurrencyValueFn;
  formatCurrencyValue: FormatCurrencyValueFn;
};

const API_URL = import.meta.env.VITE_API_URL || "";
const FALLBACK_PRODUCT_IMAGE = "/images/products/jlr_argan.webp";

const getApiOrigin = (): string => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return API_URL;
  }
};

const resolveProductImageUrl = (value?: string | null): string => {
  const raw = (value || "").trim();
  if (!raw) return FALLBACK_PRODUCT_IMAGE;
  if (/^[a-z]:\\/i.test(raw)) return FALLBACK_PRODUCT_IMAGE;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("/images/")) return raw;
  if (raw.startsWith("images/")) return `/${raw}`;
  if (raw.startsWith("./images/")) return `/${raw.slice(2)}`;
  if (raw.startsWith("/uploads/")) return `${getApiOrigin()}${raw}`;
  if (raw.startsWith("uploads/")) return `${getApiOrigin()}/${raw}`;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(?::\d+)?(\/|$)/i.test(raw)) return `https://${raw}`;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
        return `${getApiOrigin()}${parsed.pathname}${parsed.search}`;
      }
      if (parsed.protocol === "http:" && parsed.hostname.endsWith("railway.app")) {
        return raw.replace(/^http:/i, "https:");
      }
      return raw;
    } catch {
      return raw;
    }
  }
  return raw;
};

export const initAdminProductsBehavior = ({
  addCleanup,
  apiJson,
  escapeHtml,
  formatDate,
  statusBadgeByColor,
  parseCurrencyValue,
  formatCurrencyValue,
}: InitAdminProductsBehaviorParams): { refresh: () => Promise<void> } => {
  const productForm = document.querySelector("[data-product-form]") as HTMLFormElement | null;
  const productEntrySection = document.querySelector(
    "[data-product-entry-section]"
  ) as HTMLElement | null;
  const productFeedback = document.querySelector("[data-product-feedback]") as HTMLElement | null;
  const productName = document.querySelector("[data-product-name]") as HTMLInputElement | null;
  const productCategory = document.querySelector("[data-product-category]") as HTMLSelectElement | null;
  const productSku = document.querySelector("[data-product-sku]") as HTMLInputElement | null;
  const productPrice = document.querySelector("[data-product-price]") as HTMLInputElement | null;
  const productStatus = document.querySelector("[data-product-status]") as HTMLSelectElement | null;
  const productFeatured = document.querySelector("[data-product-featured]") as HTMLInputElement | null;
  const productDescription = document.querySelector(
    "[data-product-description]"
  ) as HTMLTextAreaElement | null;
  const productBenefits = document.querySelectorAll("[data-product-benefit]");
  const productImage = document.querySelector("[data-product-image]") as HTMLInputElement | null;
  const productImagePreview = document.querySelector(
    "[data-product-image-preview]"
  ) as HTMLImageElement | null;
  const productImagePlaceholder = document.querySelector(
    "[data-product-image-placeholder]"
  ) as HTMLElement | null;
  const productCostPrice = document.querySelector(
    "[data-product-cost-price]"
  ) as HTMLInputElement | null;
  const productMinStock = document.querySelector(
    "[data-product-min-stock]"
  ) as HTMLInputElement | null;
  const productInitialStock = document.querySelector(
    "[data-product-initial-stock]"
  ) as HTMLInputElement | null;
  const productInitialUnit = document.querySelector(
    "[data-product-initial-unit]"
  ) as HTMLSelectElement | null;
  const productInitialStockWrap = document.querySelector(
    "[data-product-initial-stock-wrap]"
  ) as HTMLElement | null;
  const productInitialUnitWrap = document.querySelector(
    "[data-product-initial-unit-wrap]"
  ) as HTMLElement | null;
  const productStockPanel = document.querySelector(
    "[data-product-stock-panel]"
  ) as HTMLElement | null;
  const productStockRows = document.querySelector(
    "[data-product-stock-rows]"
  ) as HTMLElement | null;
  const stockMoveModal = document.querySelector("[data-stock-move-modal]") as HTMLElement | null;
  const stockMoveTitle = document.querySelector("[data-stock-move-title]") as HTMLElement | null;
  const stockMoveType = document.querySelector("[data-stock-move-type]") as HTMLSelectElement | null;
  const stockMoveUnit = document.querySelector("[data-stock-move-unit]") as HTMLSelectElement | null;
  const stockMoveQuantity = document.querySelector(
    "[data-stock-move-quantity]"
  ) as HTMLInputElement | null;
  const stockMoveQtyLabel = document.querySelector(
    "[data-stock-move-qty-label]"
  ) as HTMLElement | null;
  const stockMoveCost = document.querySelector("[data-stock-move-cost]") as HTMLInputElement | null;
  const stockMoveCostWrap = document.querySelector(
    "[data-stock-move-cost-wrap]"
  ) as HTMLElement | null;
  const stockMoveReason = document.querySelector(
    "[data-stock-move-reason]"
  ) as HTMLInputElement | null;
  const stockMoveError = document.querySelector("[data-stock-move-error]") as HTMLElement | null;
  const stockMoveSave = document.querySelector("[data-stock-move-save]") as HTMLButtonElement | null;
  const stockMoveOpen = document.querySelector("[data-stock-move-open]") as HTMLButtonElement | null;
  const stockHistoryModal = document.querySelector(
    "[data-stock-history-modal]"
  ) as HTMLElement | null;
  const stockHistoryTitle = document.querySelector(
    "[data-stock-history-title]"
  ) as HTMLElement | null;
  const stockHistoryUnit = document.querySelector(
    "[data-stock-history-unit]"
  ) as HTMLSelectElement | null;
  const stockHistoryBody = document.querySelector(
    "[data-stock-history-body]"
  ) as HTMLElement | null;
  const stockHistoryOpen = document.querySelector(
    "[data-stock-history-open]"
  ) as HTMLButtonElement | null;
  const productSave = document.querySelector("[data-product-save]") as HTMLButtonElement | null;
  const productClear = document.querySelector("[data-product-clear]") as HTMLButtonElement | null;
  const productNew = document.querySelector("[data-product-new]") as HTMLButtonElement | null;
  const productsSearch = document.querySelector("[data-products-search]") as HTMLInputElement | null;
  const productsCategoryFilter = document.querySelector(
    "[data-products-category-filter]"
  ) as HTMLSelectElement | null;
  const productsStatusFilter = document.querySelector(
    "[data-products-status-filter]"
  ) as HTMLSelectElement | null;
  const productsClearFilters = document.querySelector(
    "[data-products-clear-filters]"
  ) as HTMLButtonElement | null;
  const productsTableBody = document.querySelector("[data-products-table-body]") as HTMLElement | null;
  const productsPageFirst = document.querySelector(
    "[data-products-page-first]"
  ) as HTMLButtonElement | null;
  const productsPagePrev = document.querySelector(
    "[data-products-page-prev]"
  ) as HTMLButtonElement | null;
  const productsPageNext = document.querySelector(
    "[data-products-page-next]"
  ) as HTMLButtonElement | null;
  const productsPageLast = document.querySelector(
    "[data-products-page-last]"
  ) as HTMLButtonElement | null;
  const productsPageSizeSelect = document.querySelector(
    "[data-products-page-size]"
  ) as HTMLSelectElement | null;
  const productsPaginationPage = document.querySelector(
    "[data-products-pagination-page]"
  ) as HTMLElement | null;
  const productsPaginationRange = document.querySelector(
    "[data-products-pagination-range]"
  ) as HTMLElement | null;

  let productsCache: ProductRow[] = [];
  let activeProductId: number | null = null;
  let activeProductName = "";
  let unitsCache: UnitRow[] = [];
  let productsPage = 1;
  let productsPageSize = 10;

  const fillUnitSelect = (select: HTMLSelectElement | null, placeholder: string): void => {
    if (!select) return;
    const current = select.value;
    select.innerHTML = "";
    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = placeholder;
    select.appendChild(placeholderOption);
    for (const unit of unitsCache) {
      const option = document.createElement("option");
      option.value = String(unit.id);
      option.textContent = unit.isOnline ? `${unit.name} (online)` : unit.name;
      select.appendChild(option);
    }
    if (current && unitsCache.some((unit) => String(unit.id) === current)) {
      select.value = current;
    }
  };

  const loadUnits = async (): Promise<void> => {
    try {
      const response = await apiJson<{ scope: string; units: UnitRow[] }>("/inventory/units");
      unitsCache = response.units || [];
    } catch {
      unitsCache = [];
    }
    fillUnitSelect(productInitialUnit, "Selecione a unidade");
    fillUnitSelect(stockMoveUnit, "Selecione a unidade");
    fillUnitSelect(stockHistoryUnit, "Unidade");
  };

  const updateStockPanel = async (productId: number): Promise<void> => {
    if (!productStockPanel || !productStockRows) return;
    productStockPanel.classList.remove("hidden");
    productStockPanel.classList.add("flex");
    productStockRows.innerHTML = `<p class="text-text-muted">Carregando saldos...</p>`;
    try {
      const rows = await apiJson<CrossUnitRow[]>(`/inventory/cross-unit?productId=${productId}`);
      if (!rows.length) {
        productStockRows.innerHTML = `<p class="text-text-muted">Sem saldo registrado em nenhuma unidade.</p>`;
        return;
      }
      productStockRows.innerHTML = rows
        .map((row) => {
          const badge =
            row.available <= 0
              ? `<span class="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold">Esgotado</span>`
              : `<span class="font-semibold text-forest-green">${row.available}</span>`;
          return `<div class="flex items-center justify-between gap-2 border-b border-[#f4f0e7] py-1">
            <span class="text-text-muted">${escapeHtml(row.unitName)}${row.isOnline ? " 🌐" : ""}</span>
            ${badge}
          </div>`;
        })
        .join("");
    } catch {
      productStockRows.innerHTML = `<p class="text-red-600">Falha ao carregar saldos.</p>`;
    }
  };

  const hideStockPanel = (): void => {
    if (!productStockPanel) return;
    productStockPanel.classList.add("hidden");
    productStockPanel.classList.remove("flex");
  };

  const setInitialStockVisible = (visible: boolean): void => {
    productInitialStockWrap?.classList.toggle("hidden", !visible);
    productInitialUnitWrap?.classList.toggle("hidden", !visible);
  };

  if (productsPageSizeSelect) {
    const initialSize = Number(productsPageSizeSelect.value);
    if (Number.isFinite(initialSize) && initialSize > 0) {
      productsPageSize = initialSize;
    }
  }

  const updateProductImagePreview = (): void => {
    if (!productImagePreview || !productImagePlaceholder) return;
    const raw = (productImage?.value || "").trim();
    if (raw) {
      productImagePreview.src = resolveProductImageUrl(raw);
      productImagePreview.classList.remove("hidden");
      productImagePlaceholder.classList.add("hidden");
    } else {
      productImagePreview.removeAttribute("src");
      productImagePreview.classList.add("hidden");
      productImagePlaceholder.classList.remove("hidden");
    }
  };

  if (productImagePreview && productImagePlaceholder) {
    productImagePreview.addEventListener("error", () => {
      productImagePreview.classList.add("hidden");
      productImagePlaceholder.classList.remove("hidden");
    });
  }

  const resetProductForm = (): void => {
    if (productForm) productForm.reset();
    productBenefits.forEach((input) => {
      if (input instanceof HTMLInputElement) input.value = "";
    });
    if (productImage) productImage.value = "";
    if (productCostPrice) productCostPrice.value = "";
    if (productMinStock) productMinStock.value = "";
    if (productInitialStock) productInitialStock.value = "";
    if (productInitialUnit) productInitialUnit.value = "";
    updateProductImagePreview();
    hideStockPanel();
    setInitialStockVisible(true);
    activeProductId = null;
    activeProductName = "";
    if (productSave) productSave.textContent = "Salvar produto";
  };

  const FEEDBACK_TONE_CLASSES = [
    "text-stone-500",
    "text-green-700",
    "text-red-700",
    "text-red-600",
    "bg-red-50",
    "bg-green-50",
    "border",
    "border-red-200",
    "border-green-200",
    "rounded-lg",
    "px-3",
    "py-2",
    "text-sm",
    "font-semibold",
  ];

  const setProductFeedback = (
    message: string,
    tone: "info" | "success" | "error" = "info"
  ): void => {
    if (!productFeedback) return;
    productFeedback.classList.remove(...FEEDBACK_TONE_CLASSES);
    if (!message) {
      productFeedback.textContent = "";
      productFeedback.classList.add("hidden");
      return;
    }
    productFeedback.textContent = message;
    productFeedback.classList.remove("hidden");
    if (tone === "error") {
      // Erro em destaque (banner) + rola até ele — validação do usuário 2026-07-07:
      // "Sessão expirada" ficava invisível ao salvar.
      productFeedback.classList.add(
        "text-red-700",
        "bg-red-50",
        "border",
        "border-red-200",
        "rounded-lg",
        "px-3",
        "py-2",
        "text-sm",
        "font-semibold"
      );
      productFeedback.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (tone === "success") {
      productFeedback.classList.add("text-green-700", "text-sm", "font-semibold");
      return;
    }
    productFeedback.classList.add("text-stone-500");
  };

  const parseOptionalSelectId = (rawValue?: string | null): number | undefined => {
    const value = (rawValue || "").trim();
    if (!value) return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
    return parsed;
  };

  const scrollToProductEntry = (): void => {
    const target = productEntrySection || productForm;
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderProducts = (list: ProductRow[]): void => {
    if (!productsTableBody) return;
    if (!list.length) {
      productsTableBody.innerHTML =
        '<tr><td class="table-cell" colspan="17">Nenhum produto encontrado.</td></tr>';
      return;
    }
    productsTableBody.innerHTML = list
      .map((product) => {
        const category = product.productCategory?.name || "-";
        const categoryId = product.productCategory?.id ? String(product.productCategory.id) : "-";
        const statusName = product.productStatus?.name || "-";
        const statusId = product.productStatus?.id ? String(product.productStatus.id) : "-";
        const statusClass = statusBadgeByColor(product.productStatus?.color);
        const priceLabel = formatCurrencyValue(product.price || 0);
        const stockValue = product.stock ?? 0;
        const stockLabel = stockValue;
        const patrimonyLabel = formatCurrencyValue((Number(product.price) || 0) * stockValue);
        const description = escapeHtml(product.description || "-");
        const imageUrl = product.imageUrl ? escapeHtml(product.imageUrl) : "-";
        const resolvedImageUrl = resolveProductImageUrl(product.imageUrl);
        const benefitsLabel = Array.isArray(product.benefits)
          ? product.benefits.filter(Boolean).join(", ") || "-"
          : "-";
        const featuredLabel = product.isFeatured ? "Sim" : "Nao";
        const featuredStyle = product.isFeatured
          ? "background:#dff4e3;color:#166534;border-color:#b9e5c1;"
          : "background:#f3f4f6;color:#374151;border-color:#e5e7eb;";
        const createdLabel = formatDate(product.createdAt);
        const updatedLabel = formatDate(product.updatedAt);
        return `
        <tr data-product-row data-product-id="${product.id}" class="group hover:bg-[#f6f8f6] transition-colors">
            <td class="table-cell">
                <button class="text-xs text-primary font-semibold hover:underline" type="button" data-product-action="edit">
                    PRD-${product.id}
                </button>
            </td>
            <td class="table-cell">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        ${
                          product.imageUrl
                            ? `<img alt="Produto" class="h-10 w-10 rounded-xl object-cover border border-[#cfe7d1]" src="${escapeHtml(
                                resolvedImageUrl
                              )}" onerror="this.onerror=null;this.src='${FALLBACK_PRODUCT_IMAGE}'">`
                            : `<div class="h-10 w-10 rounded-xl bg-[#f6f8f6] border border-[#cfe7d1] flex items-center justify-center"><span class="material-symbols-outlined text-primary">inventory_2</span></div>`
                        }
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-forest-green font-body">${product.name}</div>
                        <div class="text-xs text-text-muted font-body">SKU: ${product.sku || "-"}</div>
                    </div>
                </div>
            </td>
            <td class="table-cell"><span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border" style="${featuredStyle}">${featuredLabel}</span></td>
            <td class="table-cell product-description-cell" style="width:140px;min-width:140px;max-width:140px;">
                <span class="product-description-text text-xs text-gray-900 font-body" title="${description}">${description}</span>
            </td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${product.sku || "-"}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${category}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${categoryId}</span></td>
            <td class="table-cell"><span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${statusName}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${statusId}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${stockLabel}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${priceLabel}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${patrimonyLabel}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${imageUrl}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${benefitsLabel}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${createdLabel}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${updatedLabel}</span></td>
            <td class="table-cell text-right">
                <div class="inline-flex items-center gap-2">
                    <button class="p-2 rounded-lg text-forest-green hover:bg-[#f6f8f6]" title="Editar" type="button" data-product-action="edit">
                        <span class="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button class="p-2 rounded-lg text-red-500 hover:bg-red-50" title="Excluir" type="button" data-product-action="delete">
                        <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            </td>
        </tr>
      `;
      })
      .join("");
  };

  const updateProductPagination = (list: ProductRow[]): void => {
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / productsPageSize));
    if (productsPage > totalPages) productsPage = totalPages;
    if (productsPage < 1) productsPage = 1;
    const startIndex = total === 0 ? 0 : (productsPage - 1) * productsPageSize + 1;
    const endIndex = Math.min(productsPage * productsPageSize, total);
    if (productsPaginationRange) {
      productsPaginationRange.textContent =
        total === 0
          ? "Nenhum produto encontrado"
          : `Mostrando ${startIndex}-${endIndex} de ${total} produtos`;
    }
    if (productsPaginationPage) {
      productsPaginationPage.textContent = `Pagina ${productsPage} de ${totalPages}`;
    }
    if (productsPageFirst) {
      productsPageFirst.disabled = productsPage <= 1;
      productsPageFirst.classList.toggle("opacity-50", productsPage <= 1);
    }
    if (productsPagePrev) {
      productsPagePrev.disabled = productsPage <= 1;
      productsPagePrev.classList.toggle("opacity-50", productsPage <= 1);
    }
    if (productsPageNext) {
      productsPageNext.disabled = productsPage >= totalPages;
      productsPageNext.classList.toggle("opacity-50", productsPage >= totalPages);
    }
    if (productsPageLast) {
      productsPageLast.disabled = productsPage >= totalPages;
      productsPageLast.classList.toggle("opacity-50", productsPage >= totalPages);
    }
    const sliceStart = (productsPage - 1) * productsPageSize;
    const sliceEnd = sliceStart + productsPageSize;
    const pageItems = total === 0 ? [] : list.slice(sliceStart, sliceEnd);
    renderProducts(pageItems);
  };

  const applyProductFilters = (resetPage = false): void => {
    if (resetPage) productsPage = 1;
    const query = productsSearch?.value.trim().toLowerCase() || "";
    const categoryId = productsCategoryFilter?.value || "";
    const statusId = productsStatusFilter?.value || "";
    const filtered = productsCache.filter((product) => {
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.sku || "").toLowerCase().includes(query);
      const matchesCategory = !categoryId || String(product.productCategory?.id || "") === categoryId;
      const matchesStatus = !statusId || String(product.productStatus?.id || "") === statusId;
      return matchesQuery && matchesCategory && matchesStatus;
    });
    updateProductPagination(filtered);
  };

  const fetchProducts = async (): Promise<void> => {
    productsCache = await apiJson<ProductRow[]>("/products");
    applyProductFilters(true);
  };

  if (productSave) {
    addCleanup(
      on(productSave, "click", async () => {
        const name = productName?.value.trim() || "";
        const price = parseCurrencyValue(productPrice?.value || "");
        if (!name) {
          setProductFeedback("Informe o nome do produto antes de salvar.", "error");
          return;
        }
        if (price === null) {
          setProductFeedback("Informe um preco valido para salvar o produto.", "error");
          if (productPrice) productPrice.focus();
          return;
        }
        if (price <= 0) {
          setProductFeedback("O preco de venda deve ser maior que zero.", "error");
          if (productPrice) productPrice.focus();
          return;
        }
        const costPriceRaw = productCostPrice?.value.trim() || "";
        const costPriceParsed = costPriceRaw ? parseCurrencyValue(costPriceRaw) : null;
        if (costPriceRaw && costPriceParsed === null) {
          setProductFeedback("Informe um preco de custo valido.", "error");
          if (productCostPrice) productCostPrice.focus();
          return;
        }
        const minStockRaw = productMinStock?.value.trim() || "";
        const minStockParsed = minStockRaw ? Number(minStockRaw) : undefined;
        if (minStockRaw && (!Number.isInteger(minStockParsed) || (minStockParsed as number) < 0)) {
          setProductFeedback("Informe um estoque minimo valido.", "error");
          if (productMinStock) productMinStock.focus();
          return;
        }
        const initialStockRaw = productInitialStock?.value.trim() || "";
        const initialStockParsed = initialStockRaw ? Number(initialStockRaw) : undefined;
        const initialUnitId = productInitialUnit?.value
          ? Number(productInitialUnit.value)
          : undefined;
        if (!activeProductId && initialStockParsed && initialStockParsed > 0 && !initialUnitId) {
          setProductFeedback("Selecione a unidade do estoque inicial.", "error");
          if (productInitialUnit) productInitialUnit.focus();
          return;
        }

        const benefits = Array.from(productBenefits)
          .map((input) => (input as HTMLInputElement).value.trim())
          .filter((value) => value);
        const productCategoryId = parseOptionalSelectId(productCategory?.value);
        const productStatusId = parseOptionalSelectId(productStatus?.value);
        const payload: Record<string, unknown> = {
          name,
          description: productDescription?.value.trim() || "",
          sku: productSku?.value.trim() || undefined,
          price,
          costPrice: costPriceParsed ?? undefined,
          minStock: minStockParsed,
          benefits,
          productCategoryId,
          productStatusId,
          isFeatured: Boolean(productFeatured?.checked),
          imageUrl: productImage?.value.trim() || undefined,
        };
        if (!activeProductId && initialStockParsed && initialStockParsed > 0) {
          payload.initialStock = initialStockParsed;
          payload.initialStockUnitId = initialUnitId;
        }
        const isUpdate = Boolean(activeProductId);
        productSave.disabled = true;
        productSave.classList.add("opacity-70", "cursor-not-allowed");
        productSave.textContent = isUpdate ? "Atualizando..." : "Salvando...";
        setProductFeedback(
          isUpdate ? "Atualizando produto, aguarde..." : "Salvando produto, aguarde...",
          "info"
        );
        try {
          if (activeProductId) {
            await apiJson(`/products/${activeProductId}`, {
              method: "PATCH",
              body: JSON.stringify(payload),
            });
          } else {
            await apiJson("/products", {
              method: "POST",
              body: JSON.stringify(payload),
            });
          }
          await fetchProducts();
          resetProductForm();
          setProductFeedback(
            isUpdate ? "Produto atualizado com sucesso." : "Produto salvo com sucesso.",
            "success"
          );
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Falha ao salvar o produto. Tente novamente.";
          setProductFeedback(message, "error");
        } finally {
          productSave.disabled = false;
          productSave.classList.remove("opacity-70", "cursor-not-allowed");
          productSave.textContent = activeProductId ? "Atualizar produto" : "Salvar produto";
        }
      })
    );
  }

  if (productClear) {
    addCleanup(on(productClear, "click", () => resetProductForm()));
  }

  if (productNew) {
    addCleanup(
      on(productNew, "click", () => {
        resetProductForm();
        scrollToProductEntry();
        if (productName) productName.focus({ preventScroll: true });
      })
    );
  }

  if (productsSearch) {
    addCleanup(on(productsSearch, "input", () => applyProductFilters(true)));
  }
  if (productsCategoryFilter) {
    addCleanup(on(productsCategoryFilter, "change", () => applyProductFilters(true)));
  }
  if (productsStatusFilter) {
    addCleanup(on(productsStatusFilter, "change", () => applyProductFilters(true)));
  }
  if (productsClearFilters) {
    addCleanup(
      on(productsClearFilters, "click", () => {
        if (productsSearch) productsSearch.value = "";
        if (productsCategoryFilter) productsCategoryFilter.value = "";
        if (productsStatusFilter) productsStatusFilter.value = "";
        applyProductFilters(true);
      })
    );
  }
  if (productsPageSizeSelect) {
    addCleanup(
      on(productsPageSizeSelect, "change", () => {
        const nextSize = Number(productsPageSizeSelect.value);
        productsPageSize = Number.isFinite(nextSize) && nextSize > 0 ? nextSize : 10;
        productsPage = 1;
        applyProductFilters();
      })
    );
  }
  if (productsPageFirst) {
    addCleanup(
      on(productsPageFirst, "click", () => {
        if (productsPage <= 1) return;
        productsPage = 1;
        applyProductFilters();
      })
    );
  }
  if (productsPagePrev) {
    addCleanup(
      on(productsPagePrev, "click", () => {
        if (productsPage <= 1) return;
        productsPage -= 1;
        applyProductFilters();
      })
    );
  }
  if (productsPageNext) {
    addCleanup(
      on(productsPageNext, "click", () => {
        productsPage += 1;
        applyProductFilters();
      })
    );
  }
  if (productsPageLast) {
    addCleanup(
      on(productsPageLast, "click", () => {
        productsPage = Number.MAX_SAFE_INTEGER;
        applyProductFilters();
      })
    );
  }
  if (productsTableBody) {
    addCleanup(
      on(productsTableBody, "click", async (event) => {
        const target = event.target as HTMLElement | null;
        const row = target?.closest("[data-product-row]") as HTMLElement | null;
        if (!row) return;
        const productId = Number(row.getAttribute("data-product-id"));
        const action = target?.closest("[data-product-action]")?.getAttribute("data-product-action");
        const product = productsCache.find((item) => item.id === productId);
        if (!product) return;
        if (action === "edit") {
          activeProductId = product.id;
          activeProductName = product.name || "";
          if (productName) productName.value = product.name || "";
          if (productSku) productSku.value = product.sku || "";
          if (productPrice) productPrice.value = formatCurrencyValue(product.price || 0);
          if (productCostPrice) {
            productCostPrice.value =
              product.costPrice !== null && product.costPrice !== undefined
                ? formatCurrencyValue(Number(product.costPrice) || 0)
                : "";
          }
          if (productMinStock) {
            productMinStock.value = product.minStock ? String(product.minStock) : "";
          }
          setInitialStockVisible(false);
          void updateStockPanel(product.id);
          if (productCategory && product.productCategory) {
            productCategory.value = String(product.productCategory.id);
          }
          if (productStatus && product.productStatus) {
            productStatus.value = String(product.productStatus.id);
          }
          if (productFeatured) productFeatured.checked = Boolean(product.isFeatured);
          if (productDescription) productDescription.value = product.description || "";
          if (productImage) productImage.value = product.imageUrl || "";
          updateProductImagePreview();
          productBenefits.forEach((input, index) => {
            if (input instanceof HTMLInputElement) {
              input.value = product.benefits?.[index] || "";
            }
          });
          if (productSave) productSave.textContent = "Atualizar produto";
          setProductFeedback(
            `Produto PRD-${product.id} carregado para atualizacao.`,
            "info"
          );
          scrollToProductEntry();
        } else if (action === "delete") {
          await apiJson(`/products/${product.id}`, { method: "DELETE" });
          await fetchProducts();
          resetProductForm();
        }
      })
    );
  }

  if (productImage) {
    addCleanup(on(productImage, "change", updateProductImagePreview));
  }
  updateProductImagePreview();

  // ── Movimentação de estoque (PLAN-0020) ──────────────────────────────────

  const setStockMoveError = (message: string): void => {
    if (!stockMoveError) return;
    stockMoveError.textContent = message;
    stockMoveError.classList.toggle("hidden", !message);
  };

  const toggleModal = (modal: HTMLElement | null, open: boolean): void => {
    if (!modal) return;
    modal.classList.toggle("hidden", !open);
    modal.classList.toggle("flex", open);
  };

  const syncMoveTypeUi = (): void => {
    const type = stockMoveType?.value || "entry";
    if (stockMoveCostWrap) stockMoveCostWrap.classList.toggle("hidden", type !== "entry");
    if (stockMoveQtyLabel) {
      stockMoveQtyLabel.textContent = type === "adjust" ? "Saldo alvo (contagem)" : "Quantidade";
    }
  };

  if (stockMoveType) {
    addCleanup(on(stockMoveType, "change", syncMoveTypeUi));
  }

  if (stockMoveOpen) {
    addCleanup(
      on(stockMoveOpen, "click", () => {
        if (!activeProductId) return;
        if (stockMoveTitle) stockMoveTitle.textContent = activeProductName || "Produto";
        if (stockMoveQuantity) stockMoveQuantity.value = "";
        if (stockMoveCost) stockMoveCost.value = "";
        if (stockMoveReason) stockMoveReason.value = "";
        setStockMoveError("");
        syncMoveTypeUi();
        toggleModal(stockMoveModal, true);
      })
    );
  }

  document.querySelectorAll("[data-stock-move-cancel]").forEach((button) => {
    addCleanup(on(button, "click", () => toggleModal(stockMoveModal, false)));
  });

  if (stockMoveSave) {
    addCleanup(
      on(stockMoveSave, "click", async () => {
        if (!activeProductId) return;
        const type = stockMoveType?.value || "entry";
        const unitId = stockMoveUnit?.value ? Number(stockMoveUnit.value) : null;
        const quantityRaw = stockMoveQuantity?.value.trim() || "";
        const quantity = quantityRaw ? Number(quantityRaw) : NaN;
        const reason = stockMoveReason?.value.trim() || "";
        if (!unitId) {
          setStockMoveError("Selecione a unidade.");
          return;
        }
        if (!Number.isInteger(quantity) || quantity < 0 || (type !== "adjust" && quantity < 1)) {
          setStockMoveError("Informe uma quantidade valida.");
          return;
        }
        if (type === "adjust" && reason.length < 3) {
          setStockMoveError("Ajuste de inventario exige uma razao (minimo 3 caracteres).");
          return;
        }
        const costRaw = stockMoveCost?.value.trim() || "";
        const cost = costRaw ? parseCurrencyValue(costRaw) : null;
        if (type === "entry" && costRaw && cost === null) {
          setStockMoveError("Custo unitario invalido.");
          return;
        }
        const endpoint =
          type === "adjust"
            ? `/units/${unitId}/products/${activeProductId}/stock/adjust`
            : `/units/${unitId}/products/${activeProductId}/stock/${type}`;
        const body =
          type === "adjust"
            ? { targetStock: quantity, reason }
            : {
                quantity,
                unitCost: type === "entry" && cost !== null ? cost : undefined,
                reason: reason || undefined,
              };
        stockMoveSave.disabled = true;
        setStockMoveError("");
        try {
          await apiJson(endpoint, { method: "POST", body: JSON.stringify(body) });
          toggleModal(stockMoveModal, false);
          await fetchProducts();
          await updateStockPanel(activeProductId);
          setProductFeedback("Movimento de estoque registrado.", "success");
        } catch (error) {
          setStockMoveError(
            error instanceof Error ? error.message : "Falha ao registrar movimento."
          );
        } finally {
          stockMoveSave.disabled = false;
        }
      })
    );
  }

  // ── Histórico de movimentação ────────────────────────────────────────────

  const loadHistory = async (): Promise<void> => {
    if (!activeProductId || !stockHistoryBody) return;
    const unitId = stockHistoryUnit?.value ? Number(stockHistoryUnit.value) : null;
    if (!unitId) {
      stockHistoryBody.innerHTML = `<tr><td class="table-cell" colspan="6">Selecione uma unidade.</td></tr>`;
      return;
    }
    stockHistoryBody.innerHTML = `<tr><td class="table-cell" colspan="6">Carregando...</td></tr>`;
    try {
      const movements = await apiJson<MovementRow[]>(
        `/units/${unitId}/products/${activeProductId}/movements`
      );
      if (!movements.length) {
        stockHistoryBody.innerHTML = `<tr><td class="table-cell" colspan="6">Sem movimentos nesta unidade.</td></tr>`;
        return;
      }
      stockHistoryBody.innerHTML = movements
        .map((movement) => {
          const label = MOVEMENT_TYPE_LABEL[movement.type] || movement.type;
          const inbound = movement.type === "ENTRADA_COMPRA" || movement.type === "DEVOLUCAO";
          const sign = movement.type === "AJUSTE" ? "±" : inbound ? "+" : "−";
          return `<tr>
            <td class="table-cell whitespace-nowrap">${formatDate(movement.createdAt)}</td>
            <td class="table-cell">${escapeHtml(label)}</td>
            <td class="table-cell text-right">${sign}${movement.quantity}</td>
            <td class="table-cell text-right font-semibold">${movement.balanceAfter}</td>
            <td class="table-cell">${escapeHtml(movement.reason || "-")}</td>
            <td class="table-cell">${escapeHtml(movement.createdBy?.name || "-")}</td>
          </tr>`;
        })
        .join("");
    } catch {
      stockHistoryBody.innerHTML = `<tr><td class="table-cell text-red-600" colspan="6">Falha ao carregar historico.</td></tr>`;
    }
  };

  if (stockHistoryOpen) {
    addCleanup(
      on(stockHistoryOpen, "click", () => {
        if (!activeProductId) return;
        if (stockHistoryTitle) stockHistoryTitle.textContent = activeProductName || "Produto";
        toggleModal(stockHistoryModal, true);
        void loadHistory();
      })
    );
  }
  if (stockHistoryUnit) {
    addCleanup(on(stockHistoryUnit, "change", () => void loadHistory()));
  }
  document.querySelectorAll("[data-stock-history-close]").forEach((button) => {
    addCleanup(on(button, "click", () => toggleModal(stockHistoryModal, false)));
  });

  loadUnits().catch(() => undefined);
  fetchProducts().catch(() => undefined);

  return { refresh: fetchProducts };
};
