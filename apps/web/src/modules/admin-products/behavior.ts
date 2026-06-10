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
  imageUrl?: string | null;
  benefits?: string[] | null;
  isFeatured?: boolean | null;
  productCategory?: { id: number; name: string } | null;
  productStatus?: { id: number; name: string; color?: string | null } | null;
  createdAt?: string;
  updatedAt?: string;
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
  const productStock = document.querySelector("[data-product-stock]") as HTMLInputElement | null;
  const productStatus = document.querySelector("[data-product-status]") as HTMLSelectElement | null;
  const productFeatured = document.querySelector("[data-product-featured]") as HTMLInputElement | null;
  const productDescription = document.querySelector(
    "[data-product-description]"
  ) as HTMLTextAreaElement | null;
  const productBenefits = document.querySelectorAll("[data-product-benefit]");
  const productImage = document.querySelector("[data-product-image]") as HTMLInputElement | null;
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
  let productsPage = 1;
  let productsPageSize = 10;

  if (productsPageSizeSelect) {
    const initialSize = Number(productsPageSizeSelect.value);
    if (Number.isFinite(initialSize) && initialSize > 0) {
      productsPageSize = initialSize;
    }
  }

  const resetProductForm = (): void => {
    if (productForm) productForm.reset();
    productBenefits.forEach((input) => {
      if (input instanceof HTMLInputElement) input.value = "";
    });
    if (productImage) productImage.value = "";
    activeProductId = null;
    if (productSave) productSave.textContent = "Salvar produto";
  };

  const setProductFeedback = (
    message: string,
    tone: "info" | "success" | "error" = "info"
  ): void => {
    if (!productFeedback) return;
    if (!message) {
      productFeedback.textContent = "";
      productFeedback.classList.add("hidden");
      productFeedback.classList.remove("text-stone-500", "text-green-700", "text-red-600");
      return;
    }
    productFeedback.textContent = message;
    productFeedback.classList.remove("hidden");
    productFeedback.classList.remove("text-stone-500", "text-green-700", "text-red-600");
    if (tone === "success") {
      productFeedback.classList.add("text-green-700");
      return;
    }
    if (tone === "error") {
      productFeedback.classList.add("text-red-600");
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
        const stockRaw = productStock?.value.trim() || "";
        const stockParsed = stockRaw ? Number(stockRaw) : undefined;
        if (
          stockRaw &&
          (stockParsed === undefined || !Number.isFinite(stockParsed) || stockParsed < 0)
        ) {
          setProductFeedback("Informe um estoque valido (numero maior ou igual a zero).", "error");
          if (productStock) productStock.focus();
          return;
        }

        const benefits = Array.from(productBenefits)
          .map((input) => (input as HTMLInputElement).value.trim())
          .filter((value) => value);
        const productCategoryId = parseOptionalSelectId(productCategory?.value);
        const productStatusId = parseOptionalSelectId(productStatus?.value);
        const payload = {
          name,
          description: productDescription?.value.trim() || "",
          sku: productSku?.value.trim() || undefined,
          stock: stockParsed,
          price,
          benefits,
          productCategoryId,
          productStatusId,
          isFeatured: Boolean(productFeatured?.checked),
          imageUrl: productImage?.value.trim() || undefined,
        };
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
    addCleanup(on(productNew, "click", () => resetProductForm()));
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
          if (productName) productName.value = product.name || "";
          if (productSku) productSku.value = product.sku || "";
          if (productPrice) productPrice.value = formatCurrencyValue(product.price || 0);
          if (productStock) productStock.value = product.stock ? String(product.stock) : "";
          if (productCategory && product.productCategory) {
            productCategory.value = String(product.productCategory.id);
          }
          if (productStatus && product.productStatus) {
            productStatus.value = String(product.productStatus.id);
          }
          if (productFeatured) productFeatured.checked = Boolean(product.isFeatured);
          if (productDescription) productDescription.value = product.description || "";
          if (productImage) productImage.value = product.imageUrl || "";
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

  fetchProducts().catch(() => undefined);

  return { refresh: fetchProducts };
};
