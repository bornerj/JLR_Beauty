import type { Cleanup } from "../../shared/dom";
import { on } from "../../shared/dom";

type ApiJsonFn = <T = unknown>(path: string, options?: RequestInit) => Promise<T>;
type AddCleanupFn = (cleanup: Cleanup) => void;

type LeadRow = {
  id: number;
  name: string;
  email?: string | null;
  city?: string | null;
  status?: string | null;
};

type InitAdminLeadsBehaviorParams = {
  addCleanup: AddCleanupFn;
  apiJson: ApiJsonFn;
};

export const initAdminLeadsBehavior = ({
  addCleanup,
  apiJson,
}: InitAdminLeadsBehaviorParams): { refresh: () => Promise<void> } => {
  const leadsSearch = document.querySelector("[data-leads-search]") as HTMLInputElement | null;
  const leadsStatusFilter = document.querySelector("[data-leads-status-filter]") as HTMLSelectElement | null;
  const leadsTableBody = document.querySelector("[data-leads-table-body]") as HTMLElement | null;
  const leadsPageFirst = document.querySelector("[data-leads-page-first]") as HTMLButtonElement | null;
  const leadsPagePrev = document.querySelector("[data-leads-page-prev]") as HTMLButtonElement | null;
  const leadsPageNext = document.querySelector("[data-leads-page-next]") as HTMLButtonElement | null;
  const leadsPageLast = document.querySelector("[data-leads-page-last]") as HTMLButtonElement | null;
  const leadsPageSizeSelect = document.querySelector("[data-leads-page-size]") as HTMLSelectElement | null;
  const leadsPaginationPage = document.querySelector(
    "[data-leads-pagination-page]"
  ) as HTMLElement | null;
  const leadsPaginationRange = document.querySelector(
    "[data-leads-pagination-range]"
  ) as HTMLElement | null;

  let leadsCache: LeadRow[] = [];
  let leadsPage = 1;
  let leadsPageSize = 10;

  if (leadsPageSizeSelect) {
    const initialSize = Number(leadsPageSizeSelect.value);
    if (Number.isFinite(initialSize) && initialSize > 0) {
      leadsPageSize = initialSize;
    }
  }

  const renderLeads = (list: LeadRow[]): void => {
    if (!leadsTableBody) return;
    if (!list.length) {
      leadsTableBody.innerHTML = '<tr><td class="table-cell" colspan="5">Nenhum lead encontrado.</td></tr>';
      return;
    }
    leadsTableBody.innerHTML = list
      .map((lead) => {
        const statusLabel = lead.status || "Novo";
        const badge = statusLabel.toLowerCase().includes("aprov")
          ? "bg-green-100 text-green-800 border-green-200"
          : statusLabel.toLowerCase().includes("reprov")
            ? "bg-red-100 text-red-800 border-red-200"
            : "bg-yellow-100 text-yellow-800 border-yellow-200";
        return `
        <tr data-lead-row data-lead-id="${lead.id}" class="group hover:bg-[#f6f8f6] transition-colors">
            <td class="table-cell">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-forest-green/10 flex items-center justify-center text-forest-green font-body font-bold">
                            ${(lead.name || "L").slice(0, 2).toUpperCase()}
                        </div>
                    </div>
                    <div class="ml-4">
                        <button class="text-xs text-primary font-semibold hover:underline" type="button" data-lead-action="edit">
                            LEAD-${lead.id}
                        </button>
                        <div class="text-sm font-medium text-forest-green font-body">${lead.name}</div>
                        <div class="text-xs text-text-muted font-body">${lead.email || "-"}</div>
                    </div>
                </div>
            </td>
            <td class="table-cell"><div class="text-sm text-gray-900 font-body">${lead.city || "-"}</div></td>
            <td class="table-cell"><div class="text-sm text-gray-900 font-body">-</div></td>
            <td class="table-cell"><span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badge}">${statusLabel}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button class="text-forest-green hover:text-primary p-1 rounded hover:bg-primary/10 transition-colors" title="Editar Lead" data-lead-action="edit"><span class="material-symbols-outlined text-lg">edit</span></button>
                </div>
            </td>
        </tr>
      `;
      })
      .join("");
  };

  const updateLeadsPagination = (list: LeadRow[]): void => {
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / leadsPageSize));
    if (leadsPage > totalPages) leadsPage = totalPages;
    if (leadsPage < 1) leadsPage = 1;
    const startIndex = total === 0 ? 0 : (leadsPage - 1) * leadsPageSize + 1;
    const endIndex = Math.min(leadsPage * leadsPageSize, total);
    if (leadsPaginationRange) {
      leadsPaginationRange.textContent =
        total === 0
          ? "Nenhum lead encontrado"
          : `Mostrando ${startIndex}-${endIndex} de ${total} leads`;
    }
    if (leadsPaginationPage) {
      leadsPaginationPage.textContent = `Pagina ${leadsPage} de ${totalPages}`;
    }
    if (leadsPageFirst) {
      leadsPageFirst.disabled = leadsPage <= 1;
      leadsPageFirst.classList.toggle("opacity-50", leadsPage <= 1);
    }
    if (leadsPagePrev) {
      leadsPagePrev.disabled = leadsPage <= 1;
      leadsPagePrev.classList.toggle("opacity-50", leadsPage <= 1);
    }
    if (leadsPageNext) {
      leadsPageNext.disabled = leadsPage >= totalPages;
      leadsPageNext.classList.toggle("opacity-50", leadsPage >= totalPages);
    }
    if (leadsPageLast) {
      leadsPageLast.disabled = leadsPage >= totalPages;
      leadsPageLast.classList.toggle("opacity-50", leadsPage >= totalPages);
    }
    const sliceStart = (leadsPage - 1) * leadsPageSize;
    const sliceEnd = sliceStart + leadsPageSize;
    const pageItems = total === 0 ? [] : list.slice(sliceStart, sliceEnd);
    renderLeads(pageItems);
  };

  const applyLeadFilters = (resetPage = false): void => {
    if (resetPage) leadsPage = 1;
    const query = leadsSearch?.value.trim().toLowerCase() || "";
    const status = leadsStatusFilter?.value || "";
    const filtered = leadsCache.filter((lead) => {
      const matchesQuery =
        !query ||
        lead.name.toLowerCase().includes(query) ||
        (lead.email || "").toLowerCase().includes(query) ||
        (lead.city || "").toLowerCase().includes(query);
      const matchesStatus = !status || (lead.status || "").toLowerCase().includes(status.toLowerCase());
      return matchesQuery && matchesStatus;
    });
    updateLeadsPagination(filtered);
  };

  const fetchLeads = async (): Promise<void> => {
    leadsCache = await apiJson<LeadRow[]>("/franchise-leads");
    applyLeadFilters(true);
  };

  if (leadsSearch) addCleanup(on(leadsSearch, "input", () => applyLeadFilters(true)));
  if (leadsStatusFilter) addCleanup(on(leadsStatusFilter, "change", () => applyLeadFilters(true)));
  if (leadsPageSizeSelect) {
    addCleanup(
      on(leadsPageSizeSelect, "change", () => {
        const nextSize = Number(leadsPageSizeSelect.value);
        leadsPageSize = Number.isFinite(nextSize) && nextSize > 0 ? nextSize : 10;
        leadsPage = 1;
        applyLeadFilters();
      })
    );
  }
  if (leadsPageFirst) {
    addCleanup(
      on(leadsPageFirst, "click", () => {
        if (leadsPage <= 1) return;
        leadsPage = 1;
        applyLeadFilters();
      })
    );
  }
  if (leadsPagePrev) {
    addCleanup(
      on(leadsPagePrev, "click", () => {
        if (leadsPage <= 1) return;
        leadsPage -= 1;
        applyLeadFilters();
      })
    );
  }
  if (leadsPageNext) {
    addCleanup(
      on(leadsPageNext, "click", () => {
        leadsPage += 1;
        applyLeadFilters();
      })
    );
  }
  if (leadsPageLast) {
    addCleanup(
      on(leadsPageLast, "click", () => {
        leadsPage = Number.MAX_SAFE_INTEGER;
        applyLeadFilters();
      })
    );
  }
  if (leadsTableBody) {
    addCleanup(
      on(leadsTableBody, "click", async (event) => {
        const target = event.target as HTMLElement | null;
        const action = target?.closest("[data-lead-action]")?.getAttribute("data-lead-action");
        const row = target?.closest("[data-lead-row]") as HTMLElement | null;
        if (!row || action !== "edit") return;
        const leadId = Number(row.getAttribute("data-lead-id"));
        const lead = leadsCache.find((item) => item.id === leadId);
        if (!lead) return;
        const newStatus = window.prompt("Atualizar status do lead:", lead.status || "Novo");
        if (!newStatus) return;
        await apiJson(`/franchise-leads/${leadId}`, {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus.trim() }),
        });
        await fetchLeads();
      })
    );
  }

  fetchLeads().catch(() => undefined);

  return { refresh: fetchLeads };
};
