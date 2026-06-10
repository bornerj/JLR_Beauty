import { logger } from "../../utils/logger";
import type { Cleanup } from "../../shared/dom";
import { on } from "../../shared/dom";

type ApiJsonFn = <T = unknown>(path: string, options?: RequestInit) => Promise<T>;
type AddCleanupFn = (cleanup: Cleanup) => void;
type SetModalOpenFn = (name: string | null, isOpen: boolean) => void;
type FormatDateFn = (value?: string | null) => string;

type MembershipOption = {
  id: number;
  name: string;
  title: string;
};

type SubscriptionRow = {
  id: number;
  status: string;
  membership?: { id: number; name: string; title: string } | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  startedAt?: string;
  cancelledAt?: string | null;
};

type InitAdminSubscribersBehaviorParams = {
  addCleanup: AddCleanupFn;
  apiJson: ApiJsonFn;
  setModalOpen: SetModalOpenFn;
  formatDate: FormatDateFn;
  statusBadgeByName: Record<string, string>;
  getMemberships: () => MembershipOption[];
};

const toDateTimeLocal = (value?: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const toIsoFromLocal = (value?: string): string | undefined => {
  const raw = (value || "").trim();
  if (!raw) return undefined;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

const normalizeMembershipOptions = (rows: MembershipOption[]): MembershipOption[] => {
  return rows
    .map((row) => ({
      id: Number(row.id),
      name: String(row.name || "").trim(),
      title: String(row.title || "").trim(),
    }))
    .filter((row) => Number.isFinite(row.id) && row.id > 0);
};

export const initAdminSubscribersBehavior = ({
  addCleanup,
  apiJson,
  setModalOpen,
  formatDate,
  statusBadgeByName,
  getMemberships,
}: InitAdminSubscribersBehaviorParams): { refresh: () => Promise<void> } => {
  const subscriptionsSearch = document.querySelector(
    "[data-subscriptions-search]"
  ) as HTMLInputElement | null;
  const subscriptionsStatusFilter = document.querySelector(
    "[data-subscriptions-status-filter]"
  ) as HTMLSelectElement | null;
  const subscriptionsPageSizeSelect = document.querySelector(
    "[data-subscriptions-page-size]"
  ) as HTMLSelectElement | null;
  const subscriptionsCount = document.querySelector(
    "[data-subscriptions-count]"
  ) as HTMLElement | null;
  const subscriptionsPageFirst = document.querySelector(
    "[data-subscriptions-page-first]"
  ) as HTMLButtonElement | null;
  const subscriptionsPagePrev = document.querySelector(
    "[data-subscriptions-page-prev]"
  ) as HTMLButtonElement | null;
  const subscriptionsPageNext = document.querySelector(
    "[data-subscriptions-page-next]"
  ) as HTMLButtonElement | null;
  const subscriptionsPageLast = document.querySelector(
    "[data-subscriptions-page-last]"
  ) as HTMLButtonElement | null;
  const subscriptionsPaginationPage = document.querySelector(
    "[data-subscriptions-pagination-page]"
  ) as HTMLElement | null;
  const subscriptionsPaginationRange = document.querySelector(
    "[data-subscriptions-pagination-range]"
  ) as HTMLElement | null;
  const subscriptionsIncludeButton = document.querySelector(
    "[data-open-modal=\"assinantes-form\"]"
  ) as HTMLButtonElement | null;
  const subscriptionsTableBody = document.querySelector(
    "[data-subscriptions-table-body]"
  ) as HTMLElement | null;
  const subscriptionForm = document.querySelector(
    "[data-subscription-form]"
  ) as HTMLFormElement | null;
  const subscriptionModalTitle = document.querySelector(
    "[data-subscription-modal-title]"
  ) as HTMLElement | null;
  const subscriptionIdInput = document.querySelector(
    "[data-subscription-id]"
  ) as HTMLInputElement | null;
  const subscriptionMembershipInput = document.querySelector(
    "[data-subscription-membership-id]"
  ) as HTMLSelectElement | null;
  const subscriptionStatusInput = document.querySelector(
    "[data-subscription-status]"
  ) as HTMLSelectElement | null;
  const subscriptionCustomerNameInput = document.querySelector(
    "[data-subscription-customer-name]"
  ) as HTMLInputElement | null;
  const subscriptionCustomerEmailInput = document.querySelector(
    "[data-subscription-customer-email]"
  ) as HTMLInputElement | null;
  const subscriptionCustomerPhoneInput = document.querySelector(
    "[data-subscription-customer-phone]"
  ) as HTMLInputElement | null;
  const subscriptionStartedAtInput = document.querySelector(
    "[data-subscription-started-at]"
  ) as HTMLInputElement | null;
  const subscriptionCancelledAtInput = document.querySelector(
    "[data-subscription-cancelled-at]"
  ) as HTMLInputElement | null;

  let subscriptionsCache: SubscriptionRow[] = [];
  let subscriptionsPage = 1;
  let subscriptionsPageSize = 10;

  if (subscriptionsPageSizeSelect) {
    const initialSize = Number(subscriptionsPageSizeSelect.value);
    if (Number.isFinite(initialSize) && initialSize > 0) {
      subscriptionsPageSize = initialSize;
    }
  }

  const hydrateSubscriptionMembershipOptions = async (selectedId?: number) => {
    if (!subscriptionMembershipInput) return;
    let source = normalizeMembershipOptions(getMemberships());
    if (!source.length) {
      const response = await apiJson<MembershipOption[]>("/memberships");
      source = normalizeMembershipOptions(Array.isArray(response) ? response : []);
    }
    subscriptionMembershipInput.innerHTML = source
      .map((plan) => `<option value="${plan.id}">${plan.name} - ${plan.title}</option>`)
      .join("");
    if (selectedId) {
      subscriptionMembershipInput.value = String(selectedId);
    }
  };

  const resetSubscriptionForm = async () => {
    if (subscriptionModalTitle) subscriptionModalTitle.textContent = "Incluir assinante";
    if (subscriptionIdInput) subscriptionIdInput.value = "";
    if (subscriptionStatusInput) subscriptionStatusInput.value = "PENDENTE";
    if (subscriptionCustomerNameInput) subscriptionCustomerNameInput.value = "";
    if (subscriptionCustomerEmailInput) subscriptionCustomerEmailInput.value = "";
    if (subscriptionCustomerPhoneInput) subscriptionCustomerPhoneInput.value = "";
    if (subscriptionStartedAtInput) subscriptionStartedAtInput.value = "";
    if (subscriptionCancelledAtInput) subscriptionCancelledAtInput.value = "";
    await hydrateSubscriptionMembershipOptions();
  };

  const openSubscriptionEdit = async (subscription: SubscriptionRow) => {
    if (subscriptionModalTitle) subscriptionModalTitle.textContent = `Editar assinante #${subscription.id}`;
    if (subscriptionIdInput) subscriptionIdInput.value = String(subscription.id);
    if (subscriptionStatusInput) subscriptionStatusInput.value = subscription.status || "PENDENTE";
    if (subscriptionCustomerNameInput) subscriptionCustomerNameInput.value = subscription.customerName || "";
    if (subscriptionCustomerEmailInput) subscriptionCustomerEmailInput.value = subscription.customerEmail || "";
    if (subscriptionCustomerPhoneInput) subscriptionCustomerPhoneInput.value = subscription.customerPhone || "";
    if (subscriptionStartedAtInput) subscriptionStartedAtInput.value = toDateTimeLocal(subscription.startedAt);
    if (subscriptionCancelledAtInput) {
      subscriptionCancelledAtInput.value = toDateTimeLocal(subscription.cancelledAt);
    }
    await hydrateSubscriptionMembershipOptions(subscription.membership?.id);
    setModalOpen("assinantes-form", true);
  };

  const renderSubscriptions = (
    list: SubscriptionRow[],
    totalFiltered: number,
    startIndex: number,
    totalPages: number
  ) => {
    if (!subscriptionsTableBody) return;
    if (subscriptionsCount) subscriptionsCount.textContent = String(totalFiltered);
    if (subscriptionsPaginationPage) {
      subscriptionsPaginationPage.textContent = `Pagina ${subscriptionsPage} de ${totalPages}`;
    }
    if (subscriptionsPaginationRange) {
      const start = totalFiltered === 0 ? 0 : startIndex + 1;
      const end = totalFiltered === 0 ? 0 : startIndex + list.length;
      subscriptionsPaginationRange.textContent = `Mostrando ${start}-${end} de ${totalFiltered}`;
    }
    if (subscriptionsPageFirst) {
      subscriptionsPageFirst.disabled = subscriptionsPage <= 1;
      subscriptionsPageFirst.classList.toggle("opacity-50", subscriptionsPage <= 1);
    }
    if (subscriptionsPagePrev) {
      subscriptionsPagePrev.disabled = subscriptionsPage <= 1;
      subscriptionsPagePrev.classList.toggle("opacity-50", subscriptionsPage <= 1);
    }
    if (subscriptionsPageNext) {
      subscriptionsPageNext.disabled = subscriptionsPage >= totalPages;
      subscriptionsPageNext.classList.toggle("opacity-50", subscriptionsPage >= totalPages);
    }
    if (subscriptionsPageLast) {
      subscriptionsPageLast.disabled = subscriptionsPage >= totalPages;
      subscriptionsPageLast.classList.toggle("opacity-50", subscriptionsPage >= totalPages);
    }

    if (!list.length) {
      subscriptionsTableBody.innerHTML =
        '<tr><td class="table-cell" colspan="9">Nenhum assinante encontrado.</td></tr>';
      return;
    }
    subscriptionsTableBody.innerHTML = list
      .map((sub) => {
        const badge = statusBadgeByName[sub.status] || "bg-stone-100 text-stone-600 border-stone-200";
        const planLabel = sub.membership?.name || sub.membership?.title || "-";
        const startLabel = sub.startedAt ? formatDate(sub.startedAt) : "-";
        const cancelLabel = sub.cancelledAt ? formatDate(sub.cancelledAt) : "-";
        return `
        <tr data-subscription-row data-subscription-id="${sub.id}" class="hover:bg-[#f6f8f6] transition-colors">
            <td class="table-cell">
                <button class="text-xs text-primary font-semibold hover:underline" type="button" data-subscription-action="edit">
                    SUB-${sub.id}
                </button>
            </td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${sub.customerName || "-"}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${sub.customerEmail || "-"}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${sub.customerPhone || "-"}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${planLabel}</span></td>
            <td class="table-cell"><span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badge}">${sub.status}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${startLabel}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${cancelLabel}</span></td>
            <td class="table-cell text-right">
                <button class="h-8 w-8 rounded-lg border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] inline-flex items-center justify-center" title="Editar" data-subscription-action="edit">
                    <span class="material-symbols-outlined text-base">edit</span>
                </button>
            </td>
        </tr>
      `;
      })
      .join("");
  };

  const applySubscriptionFilters = () => {
    const query = subscriptionsSearch?.value.trim().toLowerCase() || "";
    const status = subscriptionsStatusFilter?.value || "";
    const filtered = subscriptionsCache.filter((sub) => {
      const matchesQuery =
        !query ||
        (sub.customerName || "").toLowerCase().includes(query) ||
        (sub.customerEmail || "").toLowerCase().includes(query) ||
        String(sub.id).includes(query);
      const matchesStatus = !status || sub.status === status;
      return matchesQuery && matchesStatus;
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / subscriptionsPageSize));
    if (subscriptionsPage > totalPages) subscriptionsPage = totalPages;
    if (subscriptionsPage < 1) subscriptionsPage = 1;
    const start = (subscriptionsPage - 1) * subscriptionsPageSize;
    const paged = filtered.slice(start, start + subscriptionsPageSize);
    renderSubscriptions(paged, filtered.length, start, totalPages);
  };

  const fetchSubscriptions = async () => {
    const response = await apiJson<SubscriptionRow[]>("/subscriptions");
    subscriptionsCache = Array.isArray(response) ? response : [];
    applySubscriptionFilters();
  };

  if (subscriptionsSearch) {
    addCleanup(
      on(subscriptionsSearch, "input", () => {
        subscriptionsPage = 1;
        applySubscriptionFilters();
      })
    );
  }
  if (subscriptionsStatusFilter) {
    addCleanup(
      on(subscriptionsStatusFilter, "change", () => {
        subscriptionsPage = 1;
        applySubscriptionFilters();
      })
    );
  }
  if (subscriptionsPageSizeSelect) {
    addCleanup(
      on(subscriptionsPageSizeSelect, "change", () => {
        const nextSize = Number(subscriptionsPageSizeSelect.value);
        subscriptionsPageSize = Number.isFinite(nextSize) && nextSize > 0 ? nextSize : 10;
        subscriptionsPage = 1;
        applySubscriptionFilters();
      })
    );
  }
  if (subscriptionsPageFirst) {
    addCleanup(
      on(subscriptionsPageFirst, "click", () => {
        if (subscriptionsPage <= 1) return;
        subscriptionsPage = 1;
        applySubscriptionFilters();
      })
    );
  }
  if (subscriptionsPagePrev) {
    addCleanup(
      on(subscriptionsPagePrev, "click", () => {
        if (subscriptionsPage <= 1) return;
        subscriptionsPage -= 1;
        applySubscriptionFilters();
      })
    );
  }
  if (subscriptionsPageNext) {
    addCleanup(
      on(subscriptionsPageNext, "click", () => {
        subscriptionsPage += 1;
        applySubscriptionFilters();
      })
    );
  }
  if (subscriptionsPageLast) {
    addCleanup(
      on(subscriptionsPageLast, "click", () => {
        subscriptionsPage = Number.MAX_SAFE_INTEGER;
        applySubscriptionFilters();
      })
    );
  }
  if (subscriptionsIncludeButton) {
    addCleanup(
      on(subscriptionsIncludeButton, "click", () => {
        resetSubscriptionForm()
          .then(() => undefined)
          .catch((error) => logger.error("Falha ao preparar modal de assinante", { error }));
      })
    );
  }
  if (subscriptionForm) {
    addCleanup(
      on(subscriptionForm, "submit", async (event) => {
        event.preventDefault();
        const id = subscriptionIdInput?.value ? Number(subscriptionIdInput.value) : null;
        const membershipId = subscriptionMembershipInput?.value
          ? Number(subscriptionMembershipInput.value)
          : null;
        if (!membershipId) return;
        const startedAt = toIsoFromLocal(subscriptionStartedAtInput?.value);
        const cancelledAtRaw = (subscriptionCancelledAtInput?.value || "").trim();
        const cancelledAt = cancelledAtRaw ? toIsoFromLocal(cancelledAtRaw) : null;
        const payload = {
          membershipId,
          customerName: subscriptionCustomerNameInput?.value.trim() || undefined,
          customerEmail: subscriptionCustomerEmailInput?.value.trim() || undefined,
          customerPhone: subscriptionCustomerPhoneInput?.value.trim() || undefined,
          status: subscriptionStatusInput?.value || "PENDENTE",
          startedAt,
          cancelledAt,
        };
        if (id) {
          await apiJson(`/subscriptions/${id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          });
        } else {
          await apiJson("/subscriptions", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        }
        setModalOpen("assinantes-form", false);
        await fetchSubscriptions();
      })
    );
  }
  if (subscriptionsTableBody) {
    addCleanup(
      on(subscriptionsTableBody, "click", async (event) => {
        const target = event.target as HTMLElement | null;
        const action = target
          ?.closest("[data-subscription-action]")
          ?.getAttribute("data-subscription-action");
        const row = target?.closest("[data-subscription-row]") as HTMLElement | null;
        if (!row || action !== "edit") return;
        const subscriptionId = Number(row.getAttribute("data-subscription-id"));
        const subscription = subscriptionsCache.find((item) => item.id === subscriptionId);
        if (!subscription) return;
        await openSubscriptionEdit(subscription);
      })
    );
  }

  fetchSubscriptions().catch((error) => {
    logger.error("Falha ao carregar assinantes", { error });
    if (subscriptionsTableBody) {
      subscriptionsTableBody.innerHTML =
        '<tr><td class="table-cell" colspan="9">Falha ao carregar assinantes.</td></tr>';
    }
  });

  return { refresh: fetchSubscriptions };
};
