import type { Cleanup } from "../../shared/dom";
import { on } from "../../shared/dom";

type ApiJsonFn = <T = unknown>(path: string, options?: RequestInit) => Promise<T>;
type AddCleanupFn = (cleanup: Cleanup) => void;
type EscapeHtmlFn = (value: string) => string;
type FormatDateFn = (value?: string | null) => string;
type StatusBadgeByColorFn = (color?: string | null) => string;
type ParseCurrencyValueFn = (value: string) => number | null;
type FormatCurrencyValueFn = (value: number) => string;
type ToCurrencyNumberFn = (value: number | string | null | undefined) => number;

type ServiceRow = {
  id: number;
  name: string;
  description?: string | null;
  price: number | string;
  cost?: number | string | null;
  durationMin?: number | null;
  imageUrl?: string | null;
  commissionPercent?: number | null;
  isFeatured?: boolean | null;
  serviceCategory?: { id: number; name: string } | null;
  serviceStatus?: { id: number; name: string; color?: string | null } | null;
  createdAt?: string;
  updatedAt?: string;
};

type InitAdminServicesBehaviorParams = {
  addCleanup: AddCleanupFn;
  apiJson: ApiJsonFn;
  escapeHtml: EscapeHtmlFn;
  formatDate: FormatDateFn;
  statusBadgeByColor: StatusBadgeByColorFn;
  parseCurrencyValue: ParseCurrencyValueFn;
  formatCurrencyValue: FormatCurrencyValueFn;
  toCurrencyNumber: ToCurrencyNumberFn;
};

const parseIntSafe = (value?: string | null): number | null => {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : null;
};

export const initAdminServicesBehavior = ({
  addCleanup,
  apiJson,
  escapeHtml,
  formatDate,
  statusBadgeByColor,
  parseCurrencyValue,
  formatCurrencyValue,
  toCurrencyNumber,
}: InitAdminServicesBehaviorParams): { refresh: (resetPage?: boolean) => Promise<void> } => {
  const serviceForm = document.querySelector("[data-service-form]") as HTMLFormElement | null;
  const serviceName = document.querySelector("[data-service-name]") as HTMLInputElement | null;
  const serviceDescription = document.querySelector(
    "[data-service-description]"
  ) as HTMLTextAreaElement | null;
  const serviceCategory = document.querySelector("[data-service-category]") as HTMLSelectElement | null;
  const serviceDuration = document.querySelector("[data-service-duration]") as HTMLInputElement | null;
  const servicePrice = document.querySelector("[data-service-price]") as HTMLInputElement | null;
  const serviceCost = document.querySelector("[data-service-cost]") as HTMLInputElement | null;
  const serviceCommission = document.querySelector(
    "[data-service-commission]"
  ) as HTMLInputElement | null;
  const serviceStatus = document.querySelector("[data-service-status]") as HTMLSelectElement | null;
  const serviceFeatured = document.querySelector("[data-service-featured]") as HTMLInputElement | null;
  const serviceImage = document.querySelector("[data-service-image]") as HTMLInputElement | null;
  const serviceSave = document.querySelector("[data-service-save]") as HTMLButtonElement | null;
  const serviceClear = document.querySelector("[data-service-clear]") as HTMLButtonElement | null;
  const serviceNew = document.querySelector("[data-service-new]") as HTMLButtonElement | null;
  const servicesSearch = document.querySelector("[data-services-search]") as HTMLInputElement | null;
  const servicesCategoryFilter = document.querySelector(
    "[data-services-category-filter]"
  ) as HTMLSelectElement | null;
  const servicesStatusFilter = document.querySelector(
    "[data-services-status-filter]"
  ) as HTMLSelectElement | null;
  const servicesClearFilters = document.querySelector(
    "[data-services-clear-filters]"
  ) as HTMLButtonElement | null;
  const servicesTableBody = document.querySelector("[data-services-table-body]") as HTMLElement | null;
  const servicesPageFirst = document.querySelector(
    "[data-services-page-first]"
  ) as HTMLButtonElement | null;
  const servicesPagePrev = document.querySelector(
    "[data-services-page-prev]"
  ) as HTMLButtonElement | null;
  const servicesPageNext = document.querySelector(
    "[data-services-page-next]"
  ) as HTMLButtonElement | null;
  const servicesPageLast = document.querySelector(
    "[data-services-page-last]"
  ) as HTMLButtonElement | null;
  const servicesPageSizeSelect = document.querySelector(
    "[data-services-page-size]"
  ) as HTMLSelectElement | null;
  const servicesPaginationPage = document.querySelector(
    "[data-services-pagination-page]"
  ) as HTMLElement | null;
  const servicesPaginationRange = document.querySelector(
    "[data-services-pagination-range]"
  ) as HTMLElement | null;

  let servicesCache: ServiceRow[] = [];
  let activeServiceId: number | null = null;
  let servicesPage = 1;
  let servicesPageSize = 10;

  if (servicesPageSizeSelect) {
    const initialSize = Number(servicesPageSizeSelect.value);
    if (Number.isFinite(initialSize) && initialSize > 0) {
      servicesPageSize = initialSize;
    }
  }

  const resetServiceForm = (): void => {
    if (serviceForm) serviceForm.reset();
    if (serviceImage) serviceImage.value = "";
    activeServiceId = null;
    if (serviceSave) serviceSave.textContent = "Salvar serviço";
  };

  const renderServices = (list: ServiceRow[]): void => {
    if (!servicesTableBody) return;
    if (!list.length) {
      servicesTableBody.innerHTML =
        '<tr><td class="table-cell" colspan="14">Nenhum serviço encontrado.</td></tr>';
      return;
    }
    servicesTableBody.innerHTML = list
      .map((service) => {
        const category = service.serviceCategory?.name || "-";
        const statusName = service.serviceStatus?.name || "-";
        const statusClass = statusBadgeByColor(service.serviceStatus?.color);
        const featuredLabel = service.isFeatured ? "Sim" : "Nao";
        const priceLabel = formatCurrencyValue(toCurrencyNumber(service.price));
        const costLabel =
          service.cost !== null && service.cost !== undefined
            ? formatCurrencyValue(toCurrencyNumber(service.cost))
            : "-";
        const durationLabel = service.durationMin ? `${service.durationMin} min` : "-";
        const commissionLabel =
          service.commissionPercent !== null && service.commissionPercent !== undefined
            ? `${service.commissionPercent}%`
            : "-";
        const description = escapeHtml(service.description || "-");
        const imageUrl = service.imageUrl ? escapeHtml(service.imageUrl) : "-";
        const createdLabel = formatDate(service.createdAt);
        const updatedLabel = formatDate(service.updatedAt);
        return `
        <tr data-service-row data-service-id="${service.id}" class="group hover:bg-[#f6f8f6] transition-colors">
            <td class="table-cell">
                <button class="text-xs text-primary font-semibold hover:underline" type="button" data-service-action="edit">
                    SRV-${service.id}
                </button>
            </td>
            <td class="table-cell">
                <div class="flex items-center gap-3">
                    <div class="h-10 w-10 rounded-xl bg-[#f6f8f6] border border-[#cfe7d1] flex items-center justify-center overflow-hidden">
                        ${service.imageUrl ? `<img class="h-10 w-10 object-cover" src="${service.imageUrl}" alt="Servico">` : '<span class="material-symbols-outlined text-primary">spa</span>'}
                    </div>
                    <div>
                        <div class="text-sm font-medium text-forest-green font-body">${service.name}</div>
                        <div class="text-xs text-text-muted font-body">ID: SRV-${service.id}</div>
                    </div>
                </div>
            </td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${description}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${category}</span></td>
            <td class="table-cell"><span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${statusName}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${durationLabel}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${commissionLabel}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${priceLabel}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${costLabel}</span></td>
            <td class="table-cell"><span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-200">${featuredLabel}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${imageUrl}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${createdLabel}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${updatedLabel}</span></td>
            <td class="table-cell text-right">
                <div class="inline-flex items-center gap-2">
                    <button class="p-2 rounded-lg text-forest-green hover:bg-[#f6f8f6]" title="Editar" type="button" data-service-action="edit">
                        <span class="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button class="p-2 rounded-lg text-red-500 hover:bg-red-50" title="Excluir" type="button" data-service-action="delete">
                        <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            </td>
        </tr>
      `;
      })
      .join("");
  };

  const updateServicePagination = (list: ServiceRow[]): void => {
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / servicesPageSize));
    if (servicesPage > totalPages) servicesPage = totalPages;
    if (servicesPage < 1) servicesPage = 1;
    const startIndex = total === 0 ? 0 : (servicesPage - 1) * servicesPageSize + 1;
    const endIndex = Math.min(servicesPage * servicesPageSize, total);
    if (servicesPaginationRange) {
      servicesPaginationRange.textContent =
        total === 0
          ? "Nenhum servico encontrado"
          : `Mostrando ${startIndex}-${endIndex} de ${total} servicos`;
    }
    if (servicesPaginationPage) {
      servicesPaginationPage.textContent = `Pagina ${servicesPage} de ${totalPages}`;
    }
    if (servicesPagePrev) {
      servicesPagePrev.disabled = servicesPage <= 1;
      servicesPagePrev.classList.toggle("opacity-50", servicesPage <= 1);
    }
    if (servicesPageFirst) {
      servicesPageFirst.disabled = servicesPage <= 1;
      servicesPageFirst.classList.toggle("opacity-50", servicesPage <= 1);
    }
    if (servicesPageNext) {
      servicesPageNext.disabled = servicesPage >= totalPages;
      servicesPageNext.classList.toggle("opacity-50", servicesPage >= totalPages);
    }
    if (servicesPageLast) {
      servicesPageLast.disabled = servicesPage >= totalPages;
      servicesPageLast.classList.toggle("opacity-50", servicesPage >= totalPages);
    }
    const sliceStart = (servicesPage - 1) * servicesPageSize;
    const sliceEnd = sliceStart + servicesPageSize;
    const pageItems = total === 0 ? [] : list.slice(sliceStart, sliceEnd);
    renderServices(pageItems);
  };

  const applyServiceFilters = (resetPage = false): void => {
    if (resetPage) servicesPage = 1;
    const query = servicesSearch?.value.trim().toLowerCase() || "";
    const categoryId = servicesCategoryFilter?.value || "";
    const statusId = servicesStatusFilter?.value || "";
    const filtered = servicesCache.filter((service) => {
      const matchesQuery =
        !query ||
        service.name.toLowerCase().includes(query) ||
        (service.description || "").toLowerCase().includes(query);
      const matchesCategory = !categoryId || String(service.serviceCategory?.id || "") === categoryId;
      const matchesStatus = !statusId || String(service.serviceStatus?.id || "") === statusId;
      return matchesQuery && matchesCategory && matchesStatus;
    });
    updateServicePagination(filtered);
  };

  const fetchServices = async (resetPage = false): Promise<void> => {
    servicesCache = await apiJson<ServiceRow[]>("/services");
    applyServiceFilters(resetPage);
  };

  if (serviceSave) {
    addCleanup(
      on(serviceSave, "click", async () => {
        const name = serviceName?.value.trim() || "";
        const price = parseCurrencyValue(servicePrice?.value || "");
        const cost = parseCurrencyValue(serviceCost?.value || "");
        const duration = parseIntSafe(serviceDuration?.value);
        if (!name || price === null || !duration) return;
        const payload = {
          name,
          description: serviceDescription?.value.trim() || "",
          price,
          cost: cost ?? undefined,
          durationMin: duration,
          commissionPercent: parseIntSafe(serviceCommission?.value),
          serviceCategoryId: serviceCategory?.value ? Number(serviceCategory.value) : undefined,
          serviceStatusId: serviceStatus?.value ? Number(serviceStatus.value) : undefined,
          isFeatured: Boolean(serviceFeatured?.checked),
          imageUrl: serviceImage?.value.trim() || undefined,
        };
        if (activeServiceId) {
          await apiJson(`/services/${activeServiceId}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          });
        } else {
          await apiJson("/services", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        }
        await fetchServices();
        resetServiceForm();
      })
    );
  }

  if (serviceClear) {
    addCleanup(on(serviceClear, "click", () => resetServiceForm()));
  }

  if (serviceNew) {
    addCleanup(on(serviceNew, "click", () => resetServiceForm()));
  }

  if (servicesSearch) {
    addCleanup(on(servicesSearch, "input", () => applyServiceFilters(true)));
  }
  if (servicesCategoryFilter) {
    addCleanup(on(servicesCategoryFilter, "change", () => applyServiceFilters(true)));
  }
  if (servicesStatusFilter) {
    addCleanup(on(servicesStatusFilter, "change", () => applyServiceFilters(true)));
  }
  if (servicesClearFilters) {
    addCleanup(
      on(servicesClearFilters, "click", () => {
        if (servicesSearch) servicesSearch.value = "";
        if (servicesCategoryFilter) servicesCategoryFilter.value = "";
        if (servicesStatusFilter) servicesStatusFilter.value = "";
        applyServiceFilters(true);
      })
    );
  }
  if (servicesPagePrev) {
    addCleanup(
      on(servicesPagePrev, "click", () => {
        if (servicesPage <= 1) return;
        servicesPage -= 1;
        applyServiceFilters();
      })
    );
  }
  if (servicesPageFirst) {
    addCleanup(
      on(servicesPageFirst, "click", () => {
        if (servicesPage <= 1) return;
        servicesPage = 1;
        applyServiceFilters();
      })
    );
  }
  if (servicesPageNext) {
    addCleanup(
      on(servicesPageNext, "click", () => {
        servicesPage += 1;
        applyServiceFilters();
      })
    );
  }
  if (servicesPageLast) {
    addCleanup(
      on(servicesPageLast, "click", () => {
        servicesPage = Number.MAX_SAFE_INTEGER;
        applyServiceFilters();
      })
    );
  }
  if (servicesPageSizeSelect) {
    addCleanup(
      on(servicesPageSizeSelect, "change", () => {
        const nextSize = Number(servicesPageSizeSelect.value);
        servicesPageSize = Number.isFinite(nextSize) && nextSize > 0 ? nextSize : 10;
        servicesPage = 1;
        applyServiceFilters();
      })
    );
  }
  if (servicesTableBody) {
    addCleanup(
      on(servicesTableBody, "click", async (event) => {
        const target = event.target as HTMLElement | null;
        const row = target?.closest("[data-service-row]") as HTMLElement | null;
        if (!row) return;
        const serviceId = Number(row.getAttribute("data-service-id"));
        const action = target?.closest("[data-service-action]")?.getAttribute("data-service-action");
        const service = servicesCache.find((item) => item.id === serviceId);
        if (!service) return;
        if (action === "edit") {
          activeServiceId = service.id;
          if (serviceName) serviceName.value = service.name || "";
          if (serviceDescription) serviceDescription.value = service.description || "";
          if (serviceCategory && service.serviceCategory) {
            serviceCategory.value = String(service.serviceCategory.id);
          }
          if (serviceDuration) {
            serviceDuration.value = service.durationMin ? String(service.durationMin) : "";
          }
          if (servicePrice) servicePrice.value = formatCurrencyValue(toCurrencyNumber(service.price));
          if (serviceCost) {
            serviceCost.value =
              service.cost !== null && service.cost !== undefined
                ? formatCurrencyValue(toCurrencyNumber(service.cost))
                : "";
          }
          if (serviceCommission) {
            serviceCommission.value = service.commissionPercent ? String(service.commissionPercent) : "";
          }
          if (serviceStatus && service.serviceStatus) {
            serviceStatus.value = String(service.serviceStatus.id);
          }
          if (serviceFeatured) serviceFeatured.checked = Boolean(service.isFeatured);
          if (serviceImage) serviceImage.value = service.imageUrl || "";
          if (serviceSave) serviceSave.textContent = "Atualizar servico";
          serviceForm?.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (action === "delete") {
          await apiJson(`/services/${service.id}`, { method: "DELETE" });
          await fetchServices();
          resetServiceForm();
        }
      })
    );
  }

  fetchServices(true).catch(() => undefined);

  return { refresh: fetchServices };
};
