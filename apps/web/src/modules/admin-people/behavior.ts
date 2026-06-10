import type { Cleanup } from "../../shared/dom";
import { on } from "../../shared/dom";

type ApiJsonFn = <T = unknown>(path: string, options?: RequestInit) => Promise<T>;
type AddCleanupFn = (cleanup: Cleanup) => void;
type EscapeHtmlFn = (value: string) => string;
type FormatDateFn = (value?: string | null) => string;
type SetModalOpenFn = (name: string | null, isOpen: boolean) => void;

export type AdminPeopleProfessionalAgendaRow = {
  id: number;
  name: string;
  unitId?: number | null;
  unit?: { id: number; name: string } | null;
};

type CustomerRow = {
  id: number;
  userId?: number | null;
  name: string;
  phone: string;
  phone2?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  neighborhood?: string | null;
  notes?: string | null;
  createdAt?: string;
  user?: {
    id: number;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
};

type ProfessionalWorkProfilePermissions = {
  canScheduleAppointments: boolean;
  canAccessOtherProfessionalsAgenda: boolean;
  canViewServiceValues: boolean;
  canViewCustomerContact: boolean;
  canAccessMenuClientsAnamnese: boolean;
  canAccessMenuServices: boolean;
  canAccessMenuProducts: boolean;
  canAccessMenuExpenses: boolean;
  canViewCommissionsToReceive: boolean;
  canViewCommissionPayments: boolean;
  canEditAppointments: boolean;
  canDeleteAppointments: boolean;
  canCreateServiceInAppointment: boolean;
  canViewGrossCommissionsToPay: boolean;
};

type ProfessionalWorkProfileRow = {
  id: number;
  title: string;
  status?: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
} & ProfessionalWorkProfilePermissions;

type ProfessionalRow = AdminPeopleProfessionalAgendaRow & {
  employmentStatus?: "ACTIVE" | "INACTIVE" | null;
  startedAt?: string | null;
  endedAt?: string | null;
  commissionPercent?: number | string | null;
  workProfileId?: number | null;
  commissionProfileId?: number | null;
  user?: {
    id: number;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
  workProfile?: ProfessionalWorkProfileRow | null;
  commissionProfile?: {
    id: number;
    name: string;
    commissionPercent?: number | string;
    status?: "ACTIVE" | "INACTIVE";
  } | null;
  _count?: {
    shifts?: number;
    professionalServices?: number;
  };
  createdAt?: string;
};

type ProfessionalCommissionProfileRow = {
  id: number;
  name: string;
  commissionPercent?: number | string;
  status?: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
};

type InitAdminPeopleBehaviorParams = {
  addCleanup: AddCleanupFn;
  apiJson: ApiJsonFn;
  escapeHtml: EscapeHtmlFn;
  formatDate: FormatDateFn;
  setModalOpen: SetModalOpenFn;
  openAgendaForProfessional: (professional: AdminPeopleProfessionalAgendaRow) => void;
  openLinkedUserById: (userId: number) => Promise<void>;
};

const parseOptionalNumber = (value: string): number | undefined => {
  const normalized = value.trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.trunc(parsed);
};

const formatDateOnly = (value?: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
};

const toDateInputValue = (value?: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const professionalStatusLabel = (status?: string | null): string => {
  return status === "INACTIVE" ? "Inativo" : "Ativo";
};

const professionalStatusBadgeClass = (status?: string | null): string => {
  return status === "INACTIVE"
    ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
    : "bg-green-100 text-green-800 border border-green-200";
};

const formatPercentValue = (value?: number | string | null): string => {
  if (value === null || value === undefined || value === "") return "-";
  const numeric = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(numeric)) return "-";
  return `${numeric.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;
};

export const initAdminPeopleBehavior = ({
  addCleanup,
  apiJson,
  escapeHtml,
  formatDate,
  setModalOpen,
  openAgendaForProfessional,
  openLinkedUserById,
}: InitAdminPeopleBehaviorParams): {
  refreshCustomers: () => Promise<void>;
  refreshProfessionals: () => Promise<void>;
} => {
  const peopleCustomersTableBody = document.querySelector(
    "[data-people-customers-table-body]"
  ) as HTMLElement | null;
  const peopleCustomersStatus = document.querySelector(
    "[data-people-customers-status]"
  ) as HTMLElement | null;
  const peopleCustomersRefresh = document.querySelector(
    "[data-people-customers-refresh]"
  ) as HTMLButtonElement | null;
  const peopleCustomersCreate = document.querySelector(
    "[data-people-customers-create]"
  ) as HTMLButtonElement | null;
  const peopleCustomersRange = document.querySelector(
    "[data-people-customers-range]"
  ) as HTMLElement | null;
  const peopleCustomersSearch = document.querySelector(
    "[data-people-customers-search]"
  ) as HTMLInputElement | null;
  const peopleCustomersStateFilter = document.querySelector(
    "[data-people-customers-state-filter]"
  ) as HTMLSelectElement | null;
  const peopleCustomersPageFirst = document.querySelector(
    "[data-people-customers-page-first]"
  ) as HTMLButtonElement | null;
  const peopleCustomersPagePrev = document.querySelector(
    "[data-people-customers-page-prev]"
  ) as HTMLButtonElement | null;
  const peopleCustomersPageNext = document.querySelector(
    "[data-people-customers-page-next]"
  ) as HTMLButtonElement | null;
  const peopleCustomersPageLast = document.querySelector(
    "[data-people-customers-page-last]"
  ) as HTMLButtonElement | null;
  const peopleCustomersPageSizeSelect = document.querySelector(
    "[data-people-customers-page-size]"
  ) as HTMLSelectElement | null;
  const peopleCustomersPaginationPage = document.querySelector(
    "[data-people-customers-pagination-page]"
  ) as HTMLElement | null;
  const peopleCustomersTabTrigger = document.querySelector(
    '[data-people-tab-target="clientes"]'
  ) as HTMLButtonElement | null;

  const customerEditName = document.querySelector("[data-customer-edit-name]") as HTMLInputElement | null;
  const customerEditPhone = document.querySelector(
    "[data-customer-edit-phone]"
  ) as HTMLInputElement | null;
  const customerEditPhone2 = document.querySelector(
    "[data-customer-edit-phone2]"
  ) as HTMLInputElement | null;
  const customerEditEmail = document.querySelector(
    "[data-customer-edit-email]"
  ) as HTMLInputElement | null;
  const customerEditCity = document.querySelector("[data-customer-edit-city]") as HTMLInputElement | null;
  const customerEditState = document.querySelector(
    "[data-customer-edit-state]"
  ) as HTMLInputElement | null;
  const customerEditNeighborhood = document.querySelector(
    "[data-customer-edit-neighborhood]"
  ) as HTMLInputElement | null;
  const customerEditNotes = document.querySelector(
    "[data-customer-edit-notes]"
  ) as HTMLTextAreaElement | null;
  const customerEditUserId = document.querySelector(
    "[data-customer-edit-user-id]"
  ) as HTMLInputElement | null;
  const customerEditSave = document.querySelector(
    "[data-customer-edit-save]"
  ) as HTMLButtonElement | null;
  const customerCreateName = document.querySelector(
    "[data-customer-create-name]"
  ) as HTMLInputElement | null;
  const customerCreatePhone = document.querySelector(
    "[data-customer-create-phone]"
  ) as HTMLInputElement | null;
  const customerCreatePhone2 = document.querySelector(
    "[data-customer-create-phone2]"
  ) as HTMLInputElement | null;
  const customerCreateEmail = document.querySelector(
    "[data-customer-create-email]"
  ) as HTMLInputElement | null;
  const customerCreateCity = document.querySelector(
    "[data-customer-create-city]"
  ) as HTMLInputElement | null;
  const customerCreateState = document.querySelector(
    "[data-customer-create-state]"
  ) as HTMLInputElement | null;
  const customerCreateNeighborhood = document.querySelector(
    "[data-customer-create-neighborhood]"
  ) as HTMLInputElement | null;
  const customerCreateNotes = document.querySelector(
    "[data-customer-create-notes]"
  ) as HTMLTextAreaElement | null;
  const customerCreateUserId = document.querySelector(
    "[data-customer-create-user-id]"
  ) as HTMLInputElement | null;
  const customerCreateSave = document.querySelector(
    "[data-customer-create-save]"
  ) as HTMLButtonElement | null;

  const peopleProfessionalsTableBody = document.querySelector(
    "[data-people-professionals-table-body]"
  ) as HTMLElement | null;
  const peopleProfessionalsStatus = document.querySelector(
    "[data-people-professionals-status]"
  ) as HTMLElement | null;
  const peopleProfessionalsRefresh = document.querySelector(
    "[data-people-professionals-refresh]"
  ) as HTMLButtonElement | null;
  const peopleProfessionalsRange = document.querySelector(
    "[data-people-professionals-range]"
  ) as HTMLElement | null;
  const peopleProfessionalsSearch = document.querySelector(
    "[data-people-professionals-search]"
  ) as HTMLInputElement | null;
  const peopleProfessionalsUnitFilter = document.querySelector(
    "[data-people-professionals-unit-filter]"
  ) as HTMLSelectElement | null;
  const peopleProfessionalsPageFirst = document.querySelector(
    "[data-people-professionals-page-first]"
  ) as HTMLButtonElement | null;
  const peopleProfessionalsPagePrev = document.querySelector(
    "[data-people-professionals-page-prev]"
  ) as HTMLButtonElement | null;
  const peopleProfessionalsPageNext = document.querySelector(
    "[data-people-professionals-page-next]"
  ) as HTMLButtonElement | null;
  const peopleProfessionalsPageLast = document.querySelector(
    "[data-people-professionals-page-last]"
  ) as HTMLButtonElement | null;
  const peopleProfessionalsPageSizeSelect = document.querySelector(
    "[data-people-professionals-page-size]"
  ) as HTMLSelectElement | null;
  const peopleProfessionalsPaginationPage = document.querySelector(
    "[data-people-professionals-pagination-page]"
  ) as HTMLElement | null;
  const peopleProfessionalsTabTrigger = document.querySelector(
    '[data-people-tab-target="profissionais"]'
  ) as HTMLButtonElement | null;

  const professionalEditName = document.querySelector(
    "[data-professional-edit-name]"
  ) as HTMLInputElement | null;
  const professionalEditUnitId = document.querySelector(
    "[data-professional-edit-unit-id]"
  ) as HTMLInputElement | null;
  const professionalEditUserId = document.querySelector(
    "[data-professional-edit-user-id]"
  ) as HTMLInputElement | null;
  const professionalEditOpenUser = document.querySelector(
    "[data-professional-edit-open-user]"
  ) as HTMLButtonElement | null;
  const professionalEditEmploymentStatus = document.querySelector(
    "[data-professional-edit-employment-status]"
  ) as HTMLSelectElement | null;
  const professionalEditStartedAt = document.querySelector(
    "[data-professional-edit-started-at]"
  ) as HTMLInputElement | null;
  const professionalEditEndedAt = document.querySelector(
    "[data-professional-edit-ended-at]"
  ) as HTMLInputElement | null;
  const professionalEditCommissionPercent = document.querySelector(
    "[data-professional-edit-commission-percent]"
  ) as HTMLInputElement | null;
  const professionalEditWorkProfileId = document.querySelector(
    "[data-professional-edit-work-profile-id]"
  ) as HTMLSelectElement | null;
  const professionalEditSave = document.querySelector(
    "[data-professional-edit-save]"
  ) as HTMLButtonElement | null;
  const profWorkProfileTitle = document.querySelector(
    "[data-prof-work-profile-title]"
  ) as HTMLInputElement | null;
  const profWorkProfileStatus = document.querySelector(
    "[data-prof-work-profile-status]"
  ) as HTMLSelectElement | null;
  const profWorkProfileSave = document.querySelector(
    "[data-prof-work-profile-save]"
  ) as HTMLButtonElement | null;
  const profWorkProfileCancel = document.querySelector(
    "[data-prof-work-profile-cancel]"
  ) as HTMLButtonElement | null;
  const profWorkProfileFeedback = document.querySelector(
    "[data-prof-work-profile-feedback]"
  ) as HTMLElement | null;
  const profWorkProfileTableBody = document.querySelector(
    "[data-prof-work-profile-table-body]"
  ) as HTMLElement | null;
  const profWorkProfilePermissionInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>("[data-prof-work-profile-perm]")
  );
  const profCommissionProfileName = document.querySelector(
    "[data-prof-commission-profile-name]"
  ) as HTMLInputElement | null;
  const profCommissionProfilePercent = document.querySelector(
    "[data-prof-commission-profile-percent]"
  ) as HTMLInputElement | null;
  const profCommissionProfileStatus = document.querySelector(
    "[data-prof-commission-profile-status]"
  ) as HTMLSelectElement | null;
  const profCommissionProfileSave = document.querySelector(
    "[data-prof-commission-profile-save]"
  ) as HTMLButtonElement | null;
  const profCommissionProfileClear = document.querySelector(
    "[data-prof-commission-profile-clear]"
  ) as HTMLButtonElement | null;
  const profCommissionProfileFeedback = document.querySelector(
    "[data-prof-commission-profile-feedback]"
  ) as HTMLElement | null;
  const profCommissionProfileTableBody = document.querySelector(
    "[data-prof-commission-profile-table-body]"
  ) as HTMLElement | null;

  let peopleCustomersCache: CustomerRow[] = [];
  let peopleCustomersPage = 1;
  let peopleCustomersPageSize = 10;
  let activeCustomerId: number | null = null;

  let peopleProfessionalsCache: ProfessionalRow[] = [];
  let professionalWorkProfilesCache: ProfessionalWorkProfileRow[] = [];
  let professionalCommissionProfilesCache: ProfessionalCommissionProfileRow[] = [];
  let activeProfessionalId: number | null = null;
  let editingProfessionalWorkProfileId: number | null = null;
  let editingProfessionalCommissionProfileId: number | null = null;
  let peopleProfessionalsPage = 1;
  let peopleProfessionalsPageSize = 10;

  const workProfilePermissionKeys: Array<keyof ProfessionalWorkProfilePermissions> = [
    "canScheduleAppointments",
    "canAccessOtherProfessionalsAgenda",
    "canViewServiceValues",
    "canViewCustomerContact",
    "canAccessMenuClientsAnamnese",
    "canAccessMenuServices",
    "canAccessMenuProducts",
    "canAccessMenuExpenses",
    "canViewCommissionsToReceive",
    "canViewCommissionPayments",
    "canEditAppointments",
    "canDeleteAppointments",
    "canCreateServiceInAppointment",
    "canViewGrossCommissionsToPay",
  ];

  if (peopleCustomersPageSizeSelect) {
    const initialSize = Number(peopleCustomersPageSizeSelect.value);
    if (Number.isFinite(initialSize) && initialSize > 0) {
      peopleCustomersPageSize = initialSize;
    }
  }

  if (peopleProfessionalsPageSizeSelect) {
    const initialSize = Number(peopleProfessionalsPageSizeSelect.value);
    if (Number.isFinite(initialSize) && initialSize > 0) {
      peopleProfessionalsPageSize = initialSize;
    }
  }

  const setPeopleCustomersStatus = (value: string): void => {
    if (peopleCustomersStatus) peopleCustomersStatus.textContent = value;
  };

  const renderPeopleCustomersPager = (totalFiltered: number, totalPages: number, pageSize: number): void => {
    if (peopleCustomersRange) {
      const start = totalFiltered === 0 ? 0 : (peopleCustomersPage - 1) * pageSize + 1;
      const end = totalFiltered === 0 ? 0 : Math.min(totalFiltered, peopleCustomersPage * pageSize);
      peopleCustomersRange.textContent = `Mostrando ${start}-${end} de ${totalFiltered} clientes.`;
    }
    if (peopleCustomersPaginationPage) {
      peopleCustomersPaginationPage.textContent = `Pagina ${peopleCustomersPage} de ${totalPages}`;
    }
    if (peopleCustomersPageFirst) {
      peopleCustomersPageFirst.disabled = peopleCustomersPage <= 1;
      peopleCustomersPageFirst.classList.toggle("opacity-50", peopleCustomersPage <= 1);
    }
    if (peopleCustomersPagePrev) {
      peopleCustomersPagePrev.disabled = peopleCustomersPage <= 1;
      peopleCustomersPagePrev.classList.toggle("opacity-50", peopleCustomersPage <= 1);
    }
    if (peopleCustomersPageNext) {
      peopleCustomersPageNext.disabled = peopleCustomersPage >= totalPages;
      peopleCustomersPageNext.classList.toggle("opacity-50", peopleCustomersPage >= totalPages);
    }
    if (peopleCustomersPageLast) {
      peopleCustomersPageLast.disabled = peopleCustomersPage >= totalPages;
      peopleCustomersPageLast.classList.toggle("opacity-50", peopleCustomersPage >= totalPages);
    }
  };

  const renderPeopleCustomers = (list: CustomerRow[], totalFiltered: number, totalPages: number): void => {
    if (!peopleCustomersTableBody) return;
    renderPeopleCustomersPager(totalFiltered, totalPages, peopleCustomersPageSize);
    if (!list.length) {
      const hasAnyCustomer = peopleCustomersCache.length > 0;
      peopleCustomersTableBody.innerHTML = hasAnyCustomer
        ? '<tr><td class="table-cell" colspan="11">Nenhum cliente encontrado para os filtros atuais. Limpe a busca/filtro.</td></tr>'
        : '<tr><td class="table-cell" colspan="11">Nenhum cliente encontrado.</td></tr>';
      return;
    }
    peopleCustomersTableBody.innerHTML = list
      .map((customer) => {
        const linkedUser = customer.user
          ? `${customer.user.name || "-"} (${customer.user.email || "-"})`
          : "-";
        return `
          <tr class="hover:bg-[#f6f8f6] transition-colors" data-customer-row data-customer-id="${customer.id}">
              <td class="table-cell">
                <button class="text-xs text-primary font-semibold hover:underline" type="button" data-customer-action="edit">
                  CLI-${customer.id}
                </button>
              </td>
              <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(customer.name || "-")}</span></td>
              <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(customer.phone || "-")}</span></td>
              <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(customer.phone2 || "-")}</span></td>
              <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(customer.email || "-")}</span></td>
              <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(customer.city || "-")}</span></td>
              <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(customer.state || "-")}</span></td>
              <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(customer.neighborhood || "-")}</span></td>
              <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(customer.notes || "-")}</span></td>
              <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(linkedUser)}</span></td>
              <td class="table-cell"><span class="text-xs text-gray-900 font-body">${formatDate(customer.createdAt)}</span></td>
          </tr>
        `;
      })
      .join("");
  };

  const hydratePeopleCustomersStateFilter = (): void => {
    if (!peopleCustomersStateFilter) return;
    const currentValue = peopleCustomersStateFilter.value || "ALL";
    const states = Array.from(
      new Set(
        peopleCustomersCache
          .map((customer) => (customer.state || "").trim().toUpperCase())
          .filter((state) => Boolean(state))
      )
    ).sort((left, right) => left.localeCompare(right, "pt-BR"));
    peopleCustomersStateFilter.innerHTML = [
      '<option value="ALL">Todos os estados</option>',
      ...states.map((state) => `<option value="${escapeHtml(state)}">${escapeHtml(state)}</option>`),
    ].join("");
    peopleCustomersStateFilter.value = states.includes(currentValue) ? currentValue : "ALL";
  };

  const applyPeopleCustomersFilters = (): void => {
    const query = peopleCustomersSearch?.value.trim().toLowerCase() || "";
    const selectedState = peopleCustomersStateFilter?.value || "ALL";
    const filtered = peopleCustomersCache.filter((customer) => {
      const matchesQuery =
        !query ||
        (customer.name || "").toLowerCase().includes(query) ||
        (customer.phone || "").toLowerCase().includes(query) ||
        (customer.phone2 || "").toLowerCase().includes(query) ||
        (customer.email || "").toLowerCase().includes(query) ||
        (customer.city || "").toLowerCase().includes(query) ||
        (customer.neighborhood || "").toLowerCase().includes(query);
      const state = (customer.state || "").trim().toUpperCase();
      const matchesState = selectedState === "ALL" || state === selectedState;
      return matchesQuery && matchesState;
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / peopleCustomersPageSize));
    if (peopleCustomersPage > totalPages) peopleCustomersPage = totalPages;
    if (peopleCustomersPage < 1) peopleCustomersPage = 1;
    const start = (peopleCustomersPage - 1) * peopleCustomersPageSize;
    const paged = filtered.slice(start, start + peopleCustomersPageSize);
    if (filtered.length !== peopleCustomersCache.length) {
      setPeopleCustomersStatus(`Filtrados: ${filtered.length} de ${peopleCustomersCache.length}`);
    } else {
      setPeopleCustomersStatus(`Total: ${peopleCustomersCache.length}`);
    }
    renderPeopleCustomers(paged, filtered.length, totalPages);
  };

  const fetchPeopleCustomers = async (): Promise<void> => {
    setPeopleCustomersStatus("Carregando...");
    if (peopleCustomersTableBody) {
      peopleCustomersTableBody.innerHTML =
        '<tr><td class="table-cell" colspan="11">Carregando clientes...</td></tr>';
    }
    try {
      peopleCustomersCache = await apiJson<CustomerRow[]>("/customers");
      hydratePeopleCustomersStateFilter();
      applyPeopleCustomersFilters();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar clientes.";
      setPeopleCustomersStatus("");
      renderPeopleCustomersPager(0, 1, peopleCustomersPageSize);
      if (peopleCustomersTableBody) {
        peopleCustomersTableBody.innerHTML = `<tr><td class="table-cell" colspan="11">${escapeHtml(message)}</td></tr>`;
      }
    }
  };

  const openCustomerEditModal = (customer: CustomerRow): void => {
    activeCustomerId = customer.id;
    if (customerEditName) customerEditName.value = customer.name || "";
    if (customerEditPhone) customerEditPhone.value = customer.phone || "";
    if (customerEditPhone2) customerEditPhone2.value = customer.phone2 || "";
    if (customerEditEmail) customerEditEmail.value = customer.email || "";
    if (customerEditCity) customerEditCity.value = customer.city || "";
    if (customerEditState) customerEditState.value = customer.state || "";
    if (customerEditNeighborhood) customerEditNeighborhood.value = customer.neighborhood || "";
    if (customerEditNotes) customerEditNotes.value = customer.notes || "";
    if (customerEditUserId) {
      customerEditUserId.value =
        customer.user?.id !== undefined && customer.user?.id !== null
          ? String(customer.user.id)
          : customer.userId
            ? String(customer.userId)
            : "";
    }
    setModalOpen("customer-edit", true);
  };

  const updateCustomer = async (
    customerId: number,
    payload: Record<string, unknown>
  ): Promise<CustomerRow> => {
    return apiJson<CustomerRow>(`/customers/${customerId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  };

  const createCustomer = async (payload: Record<string, unknown>): Promise<CustomerRow> => {
    return apiJson<CustomerRow>("/customers", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };

  const resetCustomerCreateForm = (): void => {
    if (customerCreateName) customerCreateName.value = "";
    if (customerCreatePhone) customerCreatePhone.value = "";
    if (customerCreatePhone2) customerCreatePhone2.value = "";
    if (customerCreateEmail) customerCreateEmail.value = "";
    if (customerCreateCity) customerCreateCity.value = "";
    if (customerCreateState) customerCreateState.value = "";
    if (customerCreateNeighborhood) customerCreateNeighborhood.value = "";
    if (customerCreateNotes) customerCreateNotes.value = "";
    if (customerCreateUserId) customerCreateUserId.value = "";
  };

  const setPeopleProfessionalsStatus = (value: string): void => {
    if (peopleProfessionalsStatus) peopleProfessionalsStatus.textContent = value;
  };

  const renderPeopleProfessionalsPager = (
    totalFiltered: number,
    totalPages: number,
    pageSize: number
  ): void => {
    if (peopleProfessionalsRange) {
      const start = totalFiltered === 0 ? 0 : (peopleProfessionalsPage - 1) * pageSize + 1;
      const end =
        totalFiltered === 0 ? 0 : Math.min(totalFiltered, peopleProfessionalsPage * pageSize);
      peopleProfessionalsRange.textContent = `Mostrando ${start}-${end} de ${totalFiltered} profissionais.`;
    }
    if (peopleProfessionalsPaginationPage) {
      peopleProfessionalsPaginationPage.textContent = `Pagina ${peopleProfessionalsPage} de ${totalPages}`;
    }
    if (peopleProfessionalsPageFirst) {
      peopleProfessionalsPageFirst.disabled = peopleProfessionalsPage <= 1;
      peopleProfessionalsPageFirst.classList.toggle("opacity-50", peopleProfessionalsPage <= 1);
    }
    if (peopleProfessionalsPagePrev) {
      peopleProfessionalsPagePrev.disabled = peopleProfessionalsPage <= 1;
      peopleProfessionalsPagePrev.classList.toggle("opacity-50", peopleProfessionalsPage <= 1);
    }
    if (peopleProfessionalsPageNext) {
      peopleProfessionalsPageNext.disabled = peopleProfessionalsPage >= totalPages;
      peopleProfessionalsPageNext.classList.toggle("opacity-50", peopleProfessionalsPage >= totalPages);
    }
    if (peopleProfessionalsPageLast) {
      peopleProfessionalsPageLast.disabled = peopleProfessionalsPage >= totalPages;
      peopleProfessionalsPageLast.classList.toggle("opacity-50", peopleProfessionalsPage >= totalPages);
    }
  };

  const renderPeopleProfessionals = (
    list: ProfessionalRow[],
    totalFiltered: number,
    totalPages: number
  ): void => {
    if (!peopleProfessionalsTableBody) return;
    renderPeopleProfessionalsPager(totalFiltered, totalPages, peopleProfessionalsPageSize);
    if (!list.length) {
      peopleProfessionalsTableBody.innerHTML =
        '<tr><td class="table-cell" colspan="11">Nenhum profissional encontrado.</td></tr>';
      return;
    }
    peopleProfessionalsTableBody.innerHTML = list
      .map((professional) => {
        const userEmail = professional.user?.email || "-";
        const statusLabel = professionalStatusLabel(professional.employmentStatus);
        const statusClass = professionalStatusBadgeClass(professional.employmentStatus);
        const commissionSource =
          professional.commissionPercent ?? professional.commissionProfile?.commissionPercent;
        const commissionValueLabel =
          commissionSource === null || commissionSource === undefined
            ? "-"
            : formatPercentValue(commissionSource);
        const shiftsCount = professional._count?.shifts ?? 0;
        const servicesCount = professional._count?.professionalServices ?? 0;
        return `
          <tr class="hover:bg-[#f6f8f6] transition-colors" data-professional-row data-professional-id="${professional.id}">
              <td class="table-cell">
                <button class="text-xs text-primary font-semibold hover:underline" type="button" data-professional-action="edit">
                  PRO-${professional.id}
                </button>
              </td>
              <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(professional.name || "-")}</span></td>
              <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(userEmail)}</span></td>
              <td class="table-cell"><span class="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${statusLabel}</span></td>
              <td class="table-cell"><span class="text-xs text-gray-900 font-body">${formatDateOnly(professional.startedAt || null)}</span></td>
              <td class="table-cell"><span class="text-xs text-gray-900 font-body">${formatDateOnly(professional.endedAt || null)}</span></td>
              <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(professional.unit?.name || "-")}</span></td>
              <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(commissionValueLabel)}</span></td>
              <td class="table-cell"><span class="text-xs text-gray-900 font-body">${shiftsCount}</span></td>
              <td class="table-cell"><span class="text-xs text-gray-900 font-body">${servicesCount}</span></td>
              <td class="table-cell text-right">
                <button class="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-white text-forest-green hover:bg-[#f6f8f6] transition-colors text-[11px] font-semibold" type="button" data-professional-action="open-agenda">
                  Ver agenda
                </button>
              </td>
          </tr>
        `;
      })
      .join("");
  };

  const hydratePeopleProfessionalsUnitFilter = (): void => {
    if (!peopleProfessionalsUnitFilter) return;
    const currentValue = peopleProfessionalsUnitFilter.value || "ALL";
    const unitsById = new Map<number, string>();
    peopleProfessionalsCache.forEach((professional) => {
      if (!professional.unit?.id) return;
      unitsById.set(professional.unit.id, professional.unit.name || "-");
    });
    const units = Array.from(unitsById.entries()).sort((left, right) =>
      left[1].localeCompare(right[1], "pt-BR")
    );
    peopleProfessionalsUnitFilter.innerHTML = [
      '<option value="ALL">Todas as unidades</option>',
      ...units.map(
        ([id, name]) => `<option value="${id}">${escapeHtml(name || `Unidade ${id}`)}</option>`
      ),
    ].join("");
    peopleProfessionalsUnitFilter.value = units.some(([id]) => String(id) === currentValue)
      ? currentValue
      : "ALL";
  };

  const applyPeopleProfessionalsFilters = (): void => {
    const query = peopleProfessionalsSearch?.value.trim().toLowerCase() || "";
    const selectedUnit = peopleProfessionalsUnitFilter?.value || "ALL";
    const filtered = peopleProfessionalsCache.filter((professional) => {
      const linkedUser = `${professional.user?.name || ""} ${professional.user?.email || ""}`.toLowerCase();
      const profileName = (professional.commissionProfile?.name || "").toLowerCase();
      const workProfileTitle = (professional.workProfile?.title || "").toLowerCase();
      const matchesQuery =
        !query ||
        (professional.name || "").toLowerCase().includes(query) ||
        (professional.unit?.name || "").toLowerCase().includes(query) ||
        linkedUser.includes(query) ||
        profileName.includes(query) ||
        workProfileTitle.includes(query);
      const unitId = professional.unit?.id ? String(professional.unit.id) : "";
      const matchesUnit = selectedUnit === "ALL" || unitId === selectedUnit;
      return matchesQuery && matchesUnit;
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / peopleProfessionalsPageSize));
    if (peopleProfessionalsPage > totalPages) peopleProfessionalsPage = totalPages;
    if (peopleProfessionalsPage < 1) peopleProfessionalsPage = 1;
    const start = (peopleProfessionalsPage - 1) * peopleProfessionalsPageSize;
    const paged = filtered.slice(start, start + peopleProfessionalsPageSize);
    renderPeopleProfessionals(paged, filtered.length, totalPages);
  };

  const fetchPeopleProfessionals = async (): Promise<void> => {
    setPeopleProfessionalsStatus("Carregando...");
    if (peopleProfessionalsTableBody) {
      peopleProfessionalsTableBody.innerHTML =
        '<tr><td class="table-cell" colspan="11">Carregando profissionais...</td></tr>';
    }
    try {
      peopleProfessionalsCache = await apiJson<ProfessionalRow[]>("/professionals");
      hydratePeopleProfessionalsUnitFilter();
      applyPeopleProfessionalsFilters();
      setPeopleProfessionalsStatus(`Total: ${peopleProfessionalsCache.length}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar profissionais.";
      setPeopleProfessionalsStatus("");
      renderPeopleProfessionalsPager(0, 1, peopleProfessionalsPageSize);
      if (peopleProfessionalsTableBody) {
        peopleProfessionalsTableBody.innerHTML = `<tr><td class="table-cell" colspan="11">${escapeHtml(message)}</td></tr>`;
      }
    }
  };

  const setProfWorkProfileFeedback = (message: string, isError = false): void => {
    if (!profWorkProfileFeedback) return;
    profWorkProfileFeedback.textContent = message;
    profWorkProfileFeedback.classList.toggle("text-red-500", isError);
    profWorkProfileFeedback.classList.toggle("text-text-muted", !isError);
  };

  const collectWorkProfilePermissions = (): ProfessionalWorkProfilePermissions => {
    const permissions: ProfessionalWorkProfilePermissions = {
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
    };
    profWorkProfilePermissionInputs.forEach((input) => {
      const key = input.getAttribute(
        "data-prof-work-profile-perm"
      ) as keyof ProfessionalWorkProfilePermissions | null;
      if (!key) return;
      permissions[key] = input.checked;
    });
    return permissions;
  };

  const fillWorkProfilePermissions = (profile?: ProfessionalWorkProfileRow | null): void => {
    profWorkProfilePermissionInputs.forEach((input) => {
      const key = input.getAttribute(
        "data-prof-work-profile-perm"
      ) as keyof ProfessionalWorkProfilePermissions | null;
      if (!key) return;
      input.checked = Boolean(profile?.[key]);
    });
  };

  const countActiveWorkProfilePermissions = (profile: ProfessionalWorkProfileRow): number => {
    return workProfilePermissionKeys.reduce((total, key) => {
      return total + (profile[key] ? 1 : 0);
    }, 0);
  };

  const hydrateProfessionalWorkProfileSelect = (selectedId?: number | null): void => {
    if (!professionalEditWorkProfileId) return;
    const selectedValue =
      selectedId !== undefined && selectedId !== null
        ? String(selectedId)
        : professionalEditWorkProfileId.value || "";
    professionalEditWorkProfileId.innerHTML = [
      '<option value="">Sem perfil</option>',
      ...professionalWorkProfilesCache.map(
        (profile) => `<option value="${profile.id}">${escapeHtml(profile.title || "-")}</option>`
      ),
    ].join("");
    if (selectedValue) {
      professionalEditWorkProfileId.value = selectedValue;
    }
  };

  const renderProfessionalWorkProfiles = (): void => {
    if (!profWorkProfileTableBody) return;
    if (!professionalWorkProfilesCache.length) {
      profWorkProfileTableBody.innerHTML =
        '<tr><td class="table-cell" colspan="5">Nenhum perfil de trabalho cadastrado.</td></tr>';
      return;
    }
    profWorkProfileTableBody.innerHTML = professionalWorkProfilesCache
      .map((profile) => {
        const statusLabel = professionalStatusLabel(profile.status);
        const statusClass = professionalStatusBadgeClass(profile.status);
        const activePermissions = countActiveWorkProfilePermissions(profile);
        return `
          <tr class="hover:bg-[#f6f8f6] transition-colors" data-prof-work-profile-row data-prof-work-profile-id="${profile.id}">
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">PWP-${profile.id}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(profile.title || "-")}</span></td>
            <td class="table-cell"><span class="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${statusLabel}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${activePermissions}</span></td>
            <td class="table-cell text-right">
              <div class="inline-flex items-center gap-2">
                <button class="p-2 rounded-lg border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] transition-colors" type="button" data-prof-work-profile-action="edit" title="Editar">
                  <span class="material-symbols-outlined text-base">edit</span>
                </button>
                <button class="p-2 rounded-lg border border-[#f1b8b8] text-red-600 hover:bg-red-50 transition-colors" type="button" data-prof-work-profile-action="delete" title="Excluir">
                  <span class="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  };

  const resetProfessionalWorkProfileForm = (): void => {
    editingProfessionalWorkProfileId = null;
    if (profWorkProfileTitle) profWorkProfileTitle.value = "";
    if (profWorkProfileStatus) profWorkProfileStatus.value = "ACTIVE";
    fillWorkProfilePermissions(null);
    if (profWorkProfileSave) profWorkProfileSave.textContent = "Salvar";
  };

  const fetchProfessionalWorkProfiles = async (): Promise<void> => {
    professionalWorkProfilesCache =
      await apiJson<ProfessionalWorkProfileRow[]>("/professional-work-profiles");
    renderProfessionalWorkProfiles();
    hydrateProfessionalWorkProfileSelect();
  };

  const prefillWorkProfileFormFromActiveProfessional = (): void => {
    if (activeProfessionalId === null) {
      resetProfessionalWorkProfileForm();
      setProfWorkProfileFeedback("Perfis carregados.");
      return;
    }
    const professional = peopleProfessionalsCache.find((item) => item.id === activeProfessionalId);
    if (!professional) {
      resetProfessionalWorkProfileForm();
      setProfWorkProfileFeedback("Profissional atual nao encontrado.", true);
      return;
    }
    const profileId = professional.workProfile?.id ?? professional.workProfileId ?? null;
    if (!profileId) {
      resetProfessionalWorkProfileForm();
      setProfWorkProfileFeedback(
        `Profissional ${professional.name} nao possui perfil de trabalho vinculado.`
      );
      return;
    }
    const profile = professionalWorkProfilesCache.find((item) => item.id === profileId);
    if (!profile) {
      resetProfessionalWorkProfileForm();
      setProfWorkProfileFeedback(
        `Perfil de trabalho vinculado ao profissional ${professional.name} nao foi encontrado.`,
        true
      );
      return;
    }
    editingProfessionalWorkProfileId = profile.id;
    if (profWorkProfileTitle) profWorkProfileTitle.value = profile.title || "";
    if (profWorkProfileStatus) profWorkProfileStatus.value = profile.status || "ACTIVE";
    fillWorkProfilePermissions(profile);
    if (profWorkProfileSave) profWorkProfileSave.textContent = "Atualizar";
    setProfWorkProfileFeedback(`Editando perfil ${profile.title} do profissional ${professional.name}.`);
  };

  const setProfCommissionProfileFeedback = (message: string, isError = false): void => {
    if (!profCommissionProfileFeedback) return;
    profCommissionProfileFeedback.textContent = message;
    profCommissionProfileFeedback.classList.toggle("text-red-500", isError);
    profCommissionProfileFeedback.classList.toggle("text-text-muted", !isError);
  };

  const renderProfessionalCommissionProfiles = (): void => {
    if (!profCommissionProfileTableBody) return;
    if (!professionalCommissionProfilesCache.length) {
      profCommissionProfileTableBody.innerHTML =
        '<tr><td class="table-cell" colspan="5">Nenhum perfil de comissao cadastrado.</td></tr>';
      return;
    }
    profCommissionProfileTableBody.innerHTML = professionalCommissionProfilesCache
      .map((profile) => {
        const statusLabel = professionalStatusLabel(profile.status);
        const statusClass = professionalStatusBadgeClass(profile.status);
        return `
          <tr class="hover:bg-[#f6f8f6] transition-colors" data-prof-commission-profile-row data-prof-commission-profile-id="${profile.id}">
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">PCP-${profile.id}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(profile.name || "-")}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(formatPercentValue(profile.commissionPercent))}</span></td>
            <td class="table-cell"><span class="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${statusLabel}</span></td>
            <td class="table-cell text-right">
              <div class="inline-flex items-center gap-2">
                <button class="p-2 rounded-lg border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] transition-colors" type="button" data-prof-commission-profile-action="edit" title="Editar">
                  <span class="material-symbols-outlined text-base">edit</span>
                </button>
                <button class="p-2 rounded-lg border border-[#f1b8b8] text-red-600 hover:bg-red-50 transition-colors" type="button" data-prof-commission-profile-action="delete" title="Excluir">
                  <span class="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  };

  const resetProfessionalCommissionProfileForm = (): void => {
    editingProfessionalCommissionProfileId = null;
    if (profCommissionProfileName) profCommissionProfileName.value = "";
    if (profCommissionProfilePercent) profCommissionProfilePercent.value = "";
    if (profCommissionProfileStatus) profCommissionProfileStatus.value = "ACTIVE";
    if (profCommissionProfileSave) profCommissionProfileSave.textContent = "Salvar";
  };

  const fetchProfessionalCommissionProfiles = async (): Promise<void> => {
    professionalCommissionProfilesCache =
      await apiJson<ProfessionalCommissionProfileRow[]>("/professional-commission-profiles");
    renderProfessionalCommissionProfiles();
  };

  const openProfessionalEditModal = (professional: ProfessionalRow): void => {
    activeProfessionalId = professional.id;
    if (professionalEditName) professionalEditName.value = professional.name || "";
    if (professionalEditUnitId) {
      professionalEditUnitId.value = professional.unitId ? String(professional.unitId) : "";
    }
    if (professionalEditUserId) {
      professionalEditUserId.value =
        professional.user?.id !== undefined && professional.user?.id !== null
          ? String(professional.user.id)
          : "";
    }
    if (professionalEditEmploymentStatus) {
      professionalEditEmploymentStatus.value = professional.employmentStatus || "ACTIVE";
    }
    if (professionalEditStartedAt) {
      professionalEditStartedAt.value = toDateInputValue(professional.startedAt || null);
    }
    if (professionalEditEndedAt) {
      professionalEditEndedAt.value = toDateInputValue(professional.endedAt || null);
    }
    hydrateProfessionalWorkProfileSelect(professional.workProfile?.id || null);
    if (professionalEditWorkProfileId) {
      professionalEditWorkProfileId.value = professional.workProfile?.id
        ? String(professional.workProfile.id)
        : "";
    }
    if (professionalEditCommissionPercent) {
      const commissionSource =
        professional.commissionPercent ?? professional.commissionProfile?.commissionPercent;
      professionalEditCommissionPercent.value =
        commissionSource === null || commissionSource === undefined
          ? ""
          : String(commissionSource);
    }
    setModalOpen("professional-edit", true);
  };

  const updateProfessional = async (
    professionalId: number,
    payload: Record<string, unknown>
  ): Promise<ProfessionalRow> => {
    return apiJson<ProfessionalRow>(`/professionals/${professionalId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  };

  const linkProfessionalUser = async (
    professionalId: number,
    professionalUserId: number
  ): Promise<ProfessionalRow> => {
    return apiJson<ProfessionalRow>(`/professionals/${professionalId}/link-user`, {
      method: "PATCH",
      body: JSON.stringify({ professionalUserId }),
    });
  };

  const createProfessionalWorkProfile = async (
    payload: Record<string, unknown>
  ): Promise<ProfessionalWorkProfileRow> => {
    return apiJson<ProfessionalWorkProfileRow>("/professional-work-profiles", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };

  const updateProfessionalWorkProfile = async (
    profileId: number,
    payload: Record<string, unknown>
  ): Promise<ProfessionalWorkProfileRow> => {
    return apiJson<ProfessionalWorkProfileRow>(`/professional-work-profiles/${profileId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  };

  const deleteProfessionalWorkProfile = async (profileId: number): Promise<void> => {
    return apiJson<void>(`/professional-work-profiles/${profileId}`, {
      method: "DELETE",
    });
  };

  const createProfessionalCommissionProfile = async (
    payload: Record<string, unknown>
  ): Promise<ProfessionalCommissionProfileRow> => {
    return apiJson<ProfessionalCommissionProfileRow>("/professional-commission-profiles", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };

  const updateProfessionalCommissionProfile = async (
    profileId: number,
    payload: Record<string, unknown>
  ): Promise<ProfessionalCommissionProfileRow> => {
    return apiJson<ProfessionalCommissionProfileRow>(
      `/professional-commission-profiles/${profileId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  };

  const deleteProfessionalCommissionProfile = async (profileId: number): Promise<void> => {
    return apiJson<void>(`/professional-commission-profiles/${profileId}`, {
      method: "DELETE",
    });
  };

  if (peopleCustomersRefresh) {
    addCleanup(
      on(peopleCustomersRefresh, "click", () => {
        peopleCustomersPage = 1;
        fetchPeopleCustomers().catch(() => undefined);
      })
    );
  }

  if (peopleCustomersCreate) {
    addCleanup(
      on(peopleCustomersCreate, "click", () => {
        resetCustomerCreateForm();
      })
    );
  }

  if (peopleCustomersSearch) {
    addCleanup(
      on(peopleCustomersSearch, "input", () => {
        peopleCustomersPage = 1;
        applyPeopleCustomersFilters();
      })
    );
  }

  if (peopleCustomersStateFilter) {
    addCleanup(
      on(peopleCustomersStateFilter, "change", () => {
        peopleCustomersPage = 1;
        applyPeopleCustomersFilters();
      })
    );
  }

  if (peopleCustomersTabTrigger) {
    addCleanup(
      on(peopleCustomersTabTrigger, "click", () => {
        if (peopleCustomersSearch) peopleCustomersSearch.value = "";
        if (peopleCustomersStateFilter) peopleCustomersStateFilter.value = "ALL";
        peopleCustomersPage = 1;
        fetchPeopleCustomers().catch(() => undefined);
      })
    );
  }

  if (peopleCustomersPagePrev) {
    addCleanup(
      on(peopleCustomersPagePrev, "click", () => {
        if (peopleCustomersPage <= 1) return;
        peopleCustomersPage -= 1;
        applyPeopleCustomersFilters();
      })
    );
  }

  if (peopleCustomersPageFirst) {
    addCleanup(
      on(peopleCustomersPageFirst, "click", () => {
        if (peopleCustomersPage <= 1) return;
        peopleCustomersPage = 1;
        applyPeopleCustomersFilters();
      })
    );
  }

  if (peopleCustomersPageNext) {
    addCleanup(
      on(peopleCustomersPageNext, "click", () => {
        peopleCustomersPage += 1;
        applyPeopleCustomersFilters();
      })
    );
  }

  if (peopleCustomersPageLast) {
    addCleanup(
      on(peopleCustomersPageLast, "click", () => {
        peopleCustomersPage = Number.MAX_SAFE_INTEGER;
        applyPeopleCustomersFilters();
      })
    );
  }

  if (peopleCustomersPageSizeSelect) {
    addCleanup(
      on(peopleCustomersPageSizeSelect, "change", () => {
        const nextSize = Number(peopleCustomersPageSizeSelect.value);
        peopleCustomersPageSize = Number.isFinite(nextSize) && nextSize > 0 ? nextSize : 10;
        peopleCustomersPage = 1;
        applyPeopleCustomersFilters();
      })
    );
  }

  if (customerEditSave) {
    addCleanup(
      on(customerEditSave, "click", async () => {
        if (activeCustomerId === null) return;
        const original = customerEditSave.textContent || "";
        customerEditSave.textContent = "Salvando...";
        customerEditSave.disabled = true;
        try {
          const userIdRaw = customerEditUserId?.value || "";
          const parsedUserId = parseOptionalNumber(userIdRaw);
          const payload: Record<string, unknown> = {
            name: customerEditName?.value.trim() || "",
            phone: customerEditPhone?.value.trim() || "",
            phone2: customerEditPhone2?.value.trim() || null,
            email: customerEditEmail?.value.trim() || null,
            city: customerEditCity?.value.trim() || null,
            state: customerEditState?.value.trim() || null,
            neighborhood: customerEditNeighborhood?.value.trim() || null,
            notes: customerEditNotes?.value.trim() || null,
          };
          if (userIdRaw.trim() === "") {
            payload.userId = null;
          } else if (parsedUserId) {
            payload.userId = parsedUserId;
          }
          await updateCustomer(activeCustomerId, payload);
          setPeopleCustomersStatus("Cliente atualizado.");
          await fetchPeopleCustomers();
          setModalOpen("customer-edit", false);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Falha ao atualizar cliente.";
          setPeopleCustomersStatus(message);
        } finally {
          customerEditSave.textContent = original || "Salvar";
          customerEditSave.disabled = false;
        }
      })
    );
  }

  if (customerCreateSave) {
    addCleanup(
      on(customerCreateSave, "click", async () => {
        const original = customerCreateSave.textContent || "";
        customerCreateSave.textContent = "Salvando...";
        customerCreateSave.disabled = true;
        try {
          const userIdRaw = customerCreateUserId?.value || "";
          const parsedUserId = parseOptionalNumber(userIdRaw);
          const payload: Record<string, unknown> = {
            name: customerCreateName?.value.trim() || "",
            phone: customerCreatePhone?.value.trim() || "",
            phone2: customerCreatePhone2?.value.trim() || null,
            email: customerCreateEmail?.value.trim() || null,
            city: customerCreateCity?.value.trim() || null,
            state: customerCreateState?.value.trim() || null,
            neighborhood: customerCreateNeighborhood?.value.trim() || null,
            notes: customerCreateNotes?.value.trim() || null,
          };
          if (userIdRaw.trim() !== "" && parsedUserId) {
            payload.userId = parsedUserId;
          }
          await createCustomer(payload);
          setPeopleCustomersStatus("Cliente criado.");
          resetCustomerCreateForm();
          setModalOpen("customer-create", false);
          peopleCustomersPage = 1;
          await fetchPeopleCustomers();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Falha ao criar cliente.";
          setPeopleCustomersStatus(message);
        } finally {
          customerCreateSave.textContent = original || "Salvar";
          customerCreateSave.disabled = false;
        }
      })
    );
  }

  if (peopleCustomersTableBody) {
    addCleanup(
      on(peopleCustomersTableBody, "click", (event) => {
        const target = event.target as HTMLElement | null;
        const actionItem = target?.closest("[data-customer-action]") as HTMLElement | null;
        if (!actionItem) return;
        const row = actionItem.closest("[data-customer-row]") as HTMLElement | null;
        if (!row) return;
        const id = Number(row.getAttribute("data-customer-id"));
        const customer = peopleCustomersCache.find((entry) => entry.id === id);
        if (!customer) return;
        openCustomerEditModal(customer);
      })
    );
  }

  if (peopleProfessionalsRefresh) {
    addCleanup(
      on(peopleProfessionalsRefresh, "click", () => {
        peopleProfessionalsPage = 1;
        fetchPeopleProfessionals().catch(() => undefined);
      })
    );
  }

  if (peopleProfessionalsSearch) {
    addCleanup(
      on(peopleProfessionalsSearch, "input", () => {
        peopleProfessionalsPage = 1;
        applyPeopleProfessionalsFilters();
      })
    );
  }

  if (peopleProfessionalsUnitFilter) {
    addCleanup(
      on(peopleProfessionalsUnitFilter, "change", () => {
        peopleProfessionalsPage = 1;
        applyPeopleProfessionalsFilters();
      })
    );
  }

  if (peopleProfessionalsTabTrigger) {
    addCleanup(
      on(peopleProfessionalsTabTrigger, "click", () => {
        if (peopleProfessionalsSearch) peopleProfessionalsSearch.value = "";
        if (peopleProfessionalsUnitFilter) peopleProfessionalsUnitFilter.value = "ALL";
        peopleProfessionalsPage = 1;
        fetchPeopleProfessionals().catch(() => undefined);
      })
    );
  }

  if (peopleProfessionalsPagePrev) {
    addCleanup(
      on(peopleProfessionalsPagePrev, "click", () => {
        if (peopleProfessionalsPage <= 1) return;
        peopleProfessionalsPage -= 1;
        applyPeopleProfessionalsFilters();
      })
    );
  }

  if (peopleProfessionalsPageFirst) {
    addCleanup(
      on(peopleProfessionalsPageFirst, "click", () => {
        if (peopleProfessionalsPage <= 1) return;
        peopleProfessionalsPage = 1;
        applyPeopleProfessionalsFilters();
      })
    );
  }

  if (peopleProfessionalsPageNext) {
    addCleanup(
      on(peopleProfessionalsPageNext, "click", () => {
        peopleProfessionalsPage += 1;
        applyPeopleProfessionalsFilters();
      })
    );
  }

  if (peopleProfessionalsPageLast) {
    addCleanup(
      on(peopleProfessionalsPageLast, "click", () => {
        peopleProfessionalsPage = Number.MAX_SAFE_INTEGER;
        applyPeopleProfessionalsFilters();
      })
    );
  }

  if (peopleProfessionalsPageSizeSelect) {
    addCleanup(
      on(peopleProfessionalsPageSizeSelect, "change", () => {
        const nextSize = Number(peopleProfessionalsPageSizeSelect.value);
        peopleProfessionalsPageSize = Number.isFinite(nextSize) && nextSize > 0 ? nextSize : 10;
        peopleProfessionalsPage = 1;
        applyPeopleProfessionalsFilters();
      })
    );
  }

  document
    .querySelectorAll('[data-open-modal="professional-work-profiles"]')
    .forEach((button) => {
      addCleanup(
        on(button, "click", () => {
          const shouldPrefillFromProfessional = button.hasAttribute(
            "data-prof-work-profile-from-professional"
          );
          fetchProfessionalWorkProfiles()
            .then(() => {
              if (shouldPrefillFromProfessional) {
                prefillWorkProfileFormFromActiveProfessional();
              } else {
                setProfWorkProfileFeedback("Perfis carregados.");
              }
            })
            .catch((error) => {
              const message =
                error instanceof Error
                  ? error.message
                  : "Falha ao carregar perfis de trabalho.";
              setProfWorkProfileFeedback(message, true);
            });
        })
      );
    });

  document
    .querySelectorAll('[data-open-modal="professional-commission-profiles"]')
    .forEach((button) => {
      addCleanup(
        on(button, "click", () => {
          fetchProfessionalCommissionProfiles()
            .then(() => setProfCommissionProfileFeedback("Perfis carregados."))
            .catch((error) => {
              const message =
                error instanceof Error
                  ? error.message
                  : "Falha ao carregar perfis de comissao.";
              setProfCommissionProfileFeedback(message, true);
            });
        })
      );
    });

  if (profCommissionProfileSave) {
    addCleanup(
      on(profCommissionProfileSave, "click", async () => {
        const name = profCommissionProfileName?.value.trim() || "";
        const percentValueRaw = profCommissionProfilePercent?.value || "";
        const percentValue = Number(percentValueRaw);
        const status = profCommissionProfileStatus?.value || "ACTIVE";
        if (!name || !Number.isFinite(percentValue) || percentValue < 0 || percentValue > 100) {
          setProfCommissionProfileFeedback(
            "Preencha nome e percentual entre 0 e 100.",
            true
          );
          return;
        }
        const payload = {
          name,
          commissionPercent: percentValue,
          status,
        };
        const original = profCommissionProfileSave.textContent || "";
        profCommissionProfileSave.textContent = "Salvando...";
        profCommissionProfileSave.disabled = true;
        try {
          if (editingProfessionalCommissionProfileId) {
            await updateProfessionalCommissionProfile(
              editingProfessionalCommissionProfileId,
              payload
            );
          } else {
            await createProfessionalCommissionProfile(payload);
          }
          await fetchProfessionalCommissionProfiles();
          resetProfessionalCommissionProfileForm();
          setProfCommissionProfileFeedback("Perfil salvo com sucesso.");
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Falha ao salvar perfil de comissao.";
          setProfCommissionProfileFeedback(message, true);
        } finally {
          profCommissionProfileSave.textContent = original || "Salvar";
          profCommissionProfileSave.disabled = false;
        }
      })
    );
  }

  if (profCommissionProfileClear) {
    addCleanup(
      on(profCommissionProfileClear, "click", () => {
        resetProfessionalCommissionProfileForm();
        setProfCommissionProfileFeedback("");
      })
    );
  }

  if (profCommissionProfileTableBody) {
    addCleanup(
      on(profCommissionProfileTableBody, "click", async (event) => {
        const target = event.target as HTMLElement | null;
        const actionButton = target?.closest(
          "[data-prof-commission-profile-action]"
        ) as HTMLElement | null;
        if (!actionButton) return;
        const row = actionButton.closest(
          "[data-prof-commission-profile-row]"
        ) as HTMLElement | null;
        if (!row) return;
        const profileId = Number(row.getAttribute("data-prof-commission-profile-id"));
        const profile = professionalCommissionProfilesCache.find((item) => item.id === profileId);
        if (!profile) return;
        const action = actionButton.getAttribute("data-prof-commission-profile-action");
        if (action === "edit") {
          editingProfessionalCommissionProfileId = profile.id;
          if (profCommissionProfileName) profCommissionProfileName.value = profile.name || "";
          if (profCommissionProfilePercent) {
            profCommissionProfilePercent.value =
              profile.commissionPercent === null || profile.commissionPercent === undefined
                ? ""
                : String(profile.commissionPercent);
          }
          if (profCommissionProfileStatus) {
            profCommissionProfileStatus.value = profile.status || "ACTIVE";
          }
          if (profCommissionProfileSave) {
            profCommissionProfileSave.textContent = "Atualizar";
          }
          setProfCommissionProfileFeedback(`Editando perfil ${profile.name}.`);
          return;
        }
        if (action === "delete") {
          if (!window.confirm(`Excluir perfil de comissao "${profile.name}"?`)) return;
          try {
            await deleteProfessionalCommissionProfile(profile.id);
            await fetchProfessionalCommissionProfiles();
            if (editingProfessionalCommissionProfileId === profile.id) {
              resetProfessionalCommissionProfileForm();
            }
            setProfCommissionProfileFeedback("Perfil excluido.");
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Falha ao excluir perfil de comissao.";
            setProfCommissionProfileFeedback(message, true);
          }
        }
      })
    );
  }

  if (professionalEditOpenUser) {
    addCleanup(
      on(professionalEditOpenUser, "click", async () => {
        const userId = Number(professionalEditUserId?.value || "");
        if (!Number.isFinite(userId) || userId <= 0) {
          setPeopleProfessionalsStatus("Informe um usuario vinculado valido.");
          return;
        }
        try {
          await openLinkedUserById(userId);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Falha ao abrir usuario vinculado.";
          setPeopleProfessionalsStatus(message);
        }
      })
    );
  }

  if (profWorkProfileSave) {
    addCleanup(
      on(profWorkProfileSave, "click", async () => {
        const title = profWorkProfileTitle?.value.trim() || "";
        const status = profWorkProfileStatus?.value || "ACTIVE";
        if (!title) {
          setProfWorkProfileFeedback("Informe o titulo do perfil.", true);
          return;
        }
        const payload = {
          title,
          status,
          ...collectWorkProfilePermissions(),
        };
        const original = profWorkProfileSave.textContent || "";
        profWorkProfileSave.textContent = "Salvando...";
        profWorkProfileSave.disabled = true;
        try {
          if (editingProfessionalWorkProfileId) {
            await updateProfessionalWorkProfile(editingProfessionalWorkProfileId, payload);
          } else {
            await createProfessionalWorkProfile(payload);
          }
          await fetchProfessionalWorkProfiles();
          resetProfessionalWorkProfileForm();
          setProfWorkProfileFeedback("Perfil salvo com sucesso.");
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Falha ao salvar perfil de trabalho.";
          setProfWorkProfileFeedback(message, true);
        } finally {
          profWorkProfileSave.textContent = original || "Salvar";
          profWorkProfileSave.disabled = false;
        }
      })
    );
  }

  if (profWorkProfileCancel) {
    addCleanup(
      on(profWorkProfileCancel, "click", () => {
        resetProfessionalWorkProfileForm();
        setProfWorkProfileFeedback("");
      })
    );
  }

  if (profWorkProfileTableBody) {
    addCleanup(
      on(profWorkProfileTableBody, "click", async (event) => {
        const target = event.target as HTMLElement | null;
        const actionButton = target?.closest("[data-prof-work-profile-action]") as HTMLElement | null;
        if (!actionButton) return;
        const row = actionButton.closest("[data-prof-work-profile-row]") as HTMLElement | null;
        if (!row) return;
        const profileId = Number(row.getAttribute("data-prof-work-profile-id"));
        const profile = professionalWorkProfilesCache.find((item) => item.id === profileId);
        if (!profile) return;
        const action = actionButton.getAttribute("data-prof-work-profile-action");
        if (action === "edit") {
          editingProfessionalWorkProfileId = profile.id;
          if (profWorkProfileTitle) profWorkProfileTitle.value = profile.title || "";
          if (profWorkProfileStatus) profWorkProfileStatus.value = profile.status || "ACTIVE";
          fillWorkProfilePermissions(profile);
          if (profWorkProfileSave) profWorkProfileSave.textContent = "Atualizar";
          setProfWorkProfileFeedback(`Editando perfil ${profile.title}.`);
          return;
        }
        if (action === "delete") {
          if (!window.confirm(`Excluir perfil de trabalho "${profile.title}"?`)) return;
          try {
            await deleteProfessionalWorkProfile(profile.id);
            await fetchProfessionalWorkProfiles();
            if (editingProfessionalWorkProfileId === profile.id) {
              resetProfessionalWorkProfileForm();
            }
            setProfWorkProfileFeedback("Perfil excluido.");
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Falha ao excluir perfil de trabalho.";
            setProfWorkProfileFeedback(message, true);
          }
        }
      })
    );
  }

  if (professionalEditSave) {
    addCleanup(
      on(professionalEditSave, "click", async () => {
        if (activeProfessionalId === null) return;
        const original = professionalEditSave.textContent || "";
        professionalEditSave.textContent = "Salvando...";
        professionalEditSave.disabled = true;
        try {
          const professional = peopleProfessionalsCache.find(
            (entry) => entry.id === activeProfessionalId
          );
          const unitIdRaw = professionalEditUnitId?.value || "";
          const parsedUnitId = parseOptionalNumber(unitIdRaw);
          const workProfileIdRaw = professionalEditWorkProfileId?.value || "";
          const parsedWorkProfileId = parseOptionalNumber(workProfileIdRaw);
          const commissionPercentRaw = professionalEditCommissionPercent?.value?.trim() || "";
          const parsedCommissionPercent = commissionPercentRaw
            ? Number(commissionPercentRaw.replace(",", "."))
            : null;
          if (
            parsedCommissionPercent !== null &&
            (!Number.isFinite(parsedCommissionPercent) ||
              parsedCommissionPercent < 0 ||
              parsedCommissionPercent > 100)
          ) {
            throw new Error("Comissao invalida. Informe percentual entre 0 e 100.");
          }
          const startedAt = professionalEditStartedAt?.value?.trim() || "";
          const endedAt = professionalEditEndedAt?.value?.trim() || "";
          const payload: Record<string, unknown> = {
            name: professionalEditName?.value.trim() || "",
            unitId: parsedUnitId ?? null,
            employmentStatus: professionalEditEmploymentStatus?.value || "ACTIVE",
            startedAt: startedAt || null,
            endedAt: endedAt || null,
            workProfileId: parsedWorkProfileId ?? null,
            commissionPercent: parsedCommissionPercent,
          };
          await updateProfessional(activeProfessionalId, payload);

          const userIdRaw = professionalEditUserId?.value || "";
          const parsedUserId = parseOptionalNumber(userIdRaw);
          const currentLinkedUserId = professional?.user?.id;
          if (
            parsedUserId &&
            (!currentLinkedUserId || Number(currentLinkedUserId) !== Number(parsedUserId))
          ) {
            await linkProfessionalUser(activeProfessionalId, parsedUserId);
          }

          setPeopleProfessionalsStatus("Profissional atualizado.");
          await fetchPeopleProfessionals();
          setModalOpen("professional-edit", false);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Falha ao atualizar profissional.";
          setPeopleProfessionalsStatus(message);
        } finally {
          professionalEditSave.textContent = original || "Salvar";
          professionalEditSave.disabled = false;
        }
      })
    );
  }

  if (peopleProfessionalsTableBody) {
    addCleanup(
      on(peopleProfessionalsTableBody, "click", (event) => {
        const target = event.target as HTMLElement | null;
        const actionItem = target?.closest("[data-professional-action]") as HTMLElement | null;
        if (!actionItem) return;
        const row = actionItem.closest("[data-professional-row]") as HTMLElement | null;
        if (!row) return;
        const id = Number(row.getAttribute("data-professional-id"));
        const professional = peopleProfessionalsCache.find((entry) => entry.id === id);
        if (!professional) return;
        const action = actionItem.getAttribute("data-professional-action");
        if (action === "open-agenda") {
          openAgendaForProfessional(professional);
          return;
        }
        openProfessionalEditModal(professional);
      })
    );
  }

  if (peopleCustomersTableBody) {
    fetchPeopleCustomers().catch(() => undefined);
  }

  if (peopleProfessionalsTableBody) {
    fetchPeopleProfessionals().catch(() => undefined);
  }

  if (professionalEditWorkProfileId || profWorkProfileTableBody) {
    fetchProfessionalWorkProfiles().catch(() => undefined);
  }

  if (profCommissionProfileTableBody) {
    fetchProfessionalCommissionProfiles().catch(() => undefined);
  }

  return {
    refreshCustomers: fetchPeopleCustomers,
    refreshProfessionals: fetchPeopleProfessionals,
  };
};
