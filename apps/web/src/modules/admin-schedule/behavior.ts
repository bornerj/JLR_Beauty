import { logger } from "../../utils/logger";
import type { Cleanup } from "../../shared/dom";
import { on } from "../../shared/dom";

type ApiJsonFn = <T = unknown>(path: string, options?: RequestInit) => Promise<T>;
type AddCleanupFn = (cleanup: Cleanup) => void;
type SetActiveViewFn = (view: string) => void;
type EscapeHtmlFn = (value: string) => string;
type FormatDateFn = (value?: string | null) => string;

type StatusBadgeByName = Record<string, string>;

type AppointmentRow = {
  id: number;
  status: string;
  start: string;
  clientName: string;
  unit?: { id: number; name: string } | null;
  professional?: { id: number; name: string } | null;
  service?: { id: number; name: string } | null;
};

type UnitRow = {
  id: number;
  name: string;
};

type ServiceRow = {
  id: number;
  name: string;
  serviceCategory?: { id: number; name: string } | null;
};

export type AgendaProfessionalRow = {
  id: number;
  name: string;
  unitId?: number | null;
  unit?: { id: number; name: string } | null;
};

type ProfessionalShiftRow = {
  id: number;
  professionalId: number;
  unitId: number;
  workDate: string;
  hourStart: string;
  hourFinish: string;
  isActive: boolean;
  notes?: string | null;
  professional?: { id: number; name: string } | null;
  unit?: { id: number; name: string } | null;
};

type InitAdminScheduleBehaviorParams = {
  addCleanup: AddCleanupFn;
  apiJson: ApiJsonFn;
  setActiveView: SetActiveViewFn;
  escapeHtml: EscapeHtmlFn;
  formatDate: FormatDateFn;
  statusBadgeByName: StatusBadgeByName;
};

const setAgendaProfessionalFilter = (
  select: HTMLSelectElement | null,
  professional: AgendaProfessionalRow
): void => {
  if (!select) return;
  const value = String(professional.id);
  const exists = Array.from(select.options).some((option) => option.value === value);
  if (!exists) {
    const option = document.createElement("option");
    option.value = value;
    const unitLabel = professional.unit?.name ? ` - ${professional.unit.name}` : "";
    option.textContent = `${professional.name}${unitLabel}`;
    select.appendChild(option);
  }
  select.value = value;
};

const formatIsoDate = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const initAdminScheduleBehavior = ({
  addCleanup,
  apiJson,
  setActiveView,
  escapeHtml,
  formatDate,
  statusBadgeByName,
}: InitAdminScheduleBehaviorParams): {
  openAgendaForProfessional: (professional: AgendaProfessionalRow) => void;
  refresh: () => Promise<void>;
} => {
  const appointmentsUnitFilter = document.querySelector(
    "[data-appointments-unit-filter]"
  ) as HTMLSelectElement | null;
  const appointmentsProfessionalFilter = document.querySelector(
    "[data-appointments-professional-filter]"
  ) as HTMLSelectElement | null;
  const appointmentsDateFilter = document.querySelector(
    "[data-appointments-date-filter]"
  ) as HTMLInputElement | null;
  const appointmentsTableBody = document.querySelector(
    "[data-appointments-table-body]"
  ) as HTMLElement | null;
  const shiftsRefresh = document.querySelector("[data-shifts-refresh]") as HTMLButtonElement | null;
  const shiftsUnitFilter = document.querySelector("[data-shifts-unit-filter]") as HTMLSelectElement | null;
  const shiftsDateFilter = document.querySelector("[data-shifts-date-filter]") as HTMLInputElement | null;
  const shiftsProfessionalFilter = document.querySelector(
    "[data-shifts-professional-filter]"
  ) as HTMLSelectElement | null;
  const shiftForm = document.querySelector("[data-shift-form]") as HTMLFormElement | null;
  const shiftProfessionalInput = document.querySelector(
    "[data-shift-professional]"
  ) as HTMLSelectElement | null;
  const shiftDateInput = document.querySelector("[data-shift-date]") as HTMLInputElement | null;
  const shiftHourStartInput = document.querySelector(
    "[data-shift-hour-start]"
  ) as HTMLInputElement | null;
  const shiftHourFinishInput = document.querySelector(
    "[data-shift-hour-finish]"
  ) as HTMLInputElement | null;
  const shiftNotesInput = document.querySelector("[data-shift-notes]") as HTMLInputElement | null;
  const shiftsTableBody = document.querySelector("[data-shifts-table-body]") as HTMLElement | null;
  const profServicesProfessional = document.querySelector(
    "[data-prof-services-professional]"
  ) as HTMLSelectElement | null;
  const profServicesUnit = document.querySelector(
    "[data-prof-services-unit]"
  ) as HTMLSelectElement | null;
  const profServicesSave = document.querySelector("[data-prof-services-save]") as HTMLButtonElement | null;
  const profServicesList = document.querySelector("[data-prof-services-list]") as HTMLElement | null;
  const profServicesFeedback = document.querySelector(
    "[data-prof-services-feedback]"
  ) as HTMLElement | null;

  let appointmentsCache: AppointmentRow[] = [];
  let unitsCache: UnitRow[] = [];
  let professionalsCache: AgendaProfessionalRow[] = [];
  let servicesForProfessionalCache: ServiceRow[] = [];
  let shiftsCache: ProfessionalShiftRow[] = [];

  const setShiftsMessage = (message: string): void => {
    if (!shiftsTableBody) return;
    shiftsTableBody.innerHTML = `<tr><td class="table-cell" colspan="7">${escapeHtml(message)}</td></tr>`;
  };

  const setProfServicesFeedback = (message: string, isError = false): void => {
    if (!profServicesFeedback) return;
    profServicesFeedback.textContent = message;
    profServicesFeedback.classList.toggle("text-red-500", isError);
    profServicesFeedback.classList.toggle("text-text-muted", !isError);
  };

  const renderAppointments = (list: AppointmentRow[]): void => {
    if (!appointmentsTableBody) return;
    if (!list.length) {
      appointmentsTableBody.innerHTML =
        '<tr><td class="table-cell" colspan="6">Nenhum agendamento.</td></tr>';
      return;
    }
    appointmentsTableBody.innerHTML = list
      .sort((left, right) => {
        const leftTime = left.start ? Date.parse(left.start) : 0;
        const rightTime = right.start ? Date.parse(right.start) : 0;
        return leftTime - rightTime;
      })
      .map((item) => {
        const dateTimeLabel = item.start
          ? new Date(item.start).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-";
        const status = item.status || "PENDENTE";
        const badge = statusBadgeByName[status] || "bg-stone-100 text-stone-600 border-stone-200";
        return `
        <tr class="hover:bg-[#f6f8f6] transition-colors">
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(dateTimeLabel)}</span></td>
            <td class="table-cell"><span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badge}">${escapeHtml(status)}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(item.service?.name || "-")}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(item.clientName || "-")}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(item.professional?.name || "-")}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(item.unit?.name || "-")}</span></td>
        </tr>
      `;
      })
      .join("");
  };

  const applyAppointmentFilters = (): void => {
    const unitId = appointmentsUnitFilter?.value || "";
    const professionalId = appointmentsProfessionalFilter?.value || "";
    const date = appointmentsDateFilter?.value || "";
    const filtered = appointmentsCache.filter((appointment) => {
      const matchesUnit = !unitId || String(appointment.unit?.id || "") === unitId;
      const matchesProfessional =
        !professionalId || String(appointment.professional?.id || "") === professionalId;
      const matchesDate = !date || appointment.start.startsWith(date);
      return matchesUnit && matchesProfessional && matchesDate;
    });
    renderAppointments(filtered);
  };

  const fetchAppointments = async (): Promise<void> => {
    appointmentsCache = await apiJson<AppointmentRow[]>("/appointments");
    applyAppointmentFilters();
  };

  const hydrateAppointmentFilters = async (): Promise<void> => {
    const [units, pros, services] = await Promise.all([
      apiJson<UnitRow[]>("/units"),
      apiJson<AgendaProfessionalRow[]>("/professionals"),
      apiJson<ServiceRow[]>("/services"),
    ]);
    unitsCache = Array.isArray(units) ? units : [];
    professionalsCache = Array.isArray(pros) ? pros : [];
    servicesForProfessionalCache = Array.isArray(services) ? services : [];

    const populateUnitSelect = (select: HTMLSelectElement | null, firstLabel: string): void => {
      if (!select) return;
      select.innerHTML = `<option value="">${firstLabel}</option>`;
      unitsCache.forEach((unit) => {
        const option = document.createElement("option");
        option.value = String(unit.id);
        option.textContent = unit.name;
        select.appendChild(option);
      });
    };

    const populateProfessionalSelect = (
      select: HTMLSelectElement | null,
      firstLabel: string
    ): void => {
      if (!select) return;
      select.innerHTML = `<option value="">${firstLabel}</option>`;
      professionalsCache.forEach((professional) => {
        const unitLabel = professional.unit?.name ? ` - ${professional.unit.name}` : "";
        const option = document.createElement("option");
        option.value = String(professional.id);
        option.textContent = `${professional.name}${unitLabel}`;
        select.appendChild(option);
      });
    };

    populateUnitSelect(appointmentsUnitFilter, "Todas");
    populateProfessionalSelect(appointmentsProfessionalFilter, "Todos");
    populateUnitSelect(shiftsUnitFilter, "Todas as unidades");
    populateProfessionalSelect(shiftsProfessionalFilter, "Todos profissionais");
    populateProfessionalSelect(shiftProfessionalInput, "Selecione o profissional");
    populateProfessionalSelect(profServicesProfessional, "Selecione o profissional");
    populateUnitSelect(profServicesUnit, "Selecione a unidade");

    const now = new Date();
    const today = formatIsoDate(now);
    if (shiftDateInput && !shiftDateInput.value) shiftDateInput.value = today;
    if (shiftsDateFilter && !shiftsDateFilter.value) shiftsDateFilter.value = today;
  };

  const renderShifts = (list: ProfessionalShiftRow[]): void => {
    if (!shiftsTableBody) return;
    if (!list.length) {
      shiftsTableBody.innerHTML =
        '<tr><td class="table-cell" colspan="7">Nenhuma escala cadastrada para o filtro.</td></tr>';
      return;
    }
    shiftsTableBody.innerHTML = list
      .map((shift) => {
        const statusClass = shift.isActive
          ? "bg-green-100 text-green-800 border-green-200"
          : "bg-stone-100 text-stone-600 border-stone-200";
        return `
          <tr class="hover:bg-[#f6f8f6] transition-colors" data-shift-row data-shift-id="${shift.id}">
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${formatDate(shift.workDate)}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(
              shift.unit?.name || "-"
            )}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(
              shift.professional?.name || "-"
            )}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(shift.hourStart || "-")}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(shift.hourFinish || "-")}</span></td>
            <td class="table-cell"><span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${
              shift.isActive ? "ATIVA" : "INATIVA"
            }</span></td>
            <td class="table-cell text-right">
              <button class="p-2 rounded-lg text-red-500 hover:bg-red-50" type="button" title="Excluir escala" data-shift-action="delete">
                <span class="material-symbols-outlined text-base">delete</span>
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  };

  const fetchShifts = async (): Promise<void> => {
    const query = new URLSearchParams();
    if (shiftsUnitFilter?.value) query.set("unitId", shiftsUnitFilter.value);
    if (shiftsDateFilter?.value) query.set("date", shiftsDateFilter.value);
    if (shiftsProfessionalFilter?.value) query.set("professionalId", shiftsProfessionalFilter.value);
    query.set("limit", "500");
    const payload = await apiJson<{ items?: ProfessionalShiftRow[] }>(
      `/professional-shifts?${query.toString()}`
    );
    shiftsCache = Array.isArray(payload.items) ? payload.items : [];
    renderShifts(shiftsCache);
  };

  const getSelectedServiceIds = (): number[] => {
    if (!profServicesList) return [];
    const checked = Array.from(
      profServicesList.querySelectorAll<HTMLInputElement>('input[data-prof-service-checkbox]:checked')
    );
    return checked
      .map((input) => Number(input.value))
      .filter((value) => Number.isFinite(value) && value > 0);
  };

  const renderProfessionalServiceChecklist = async (): Promise<void> => {
    if (!profServicesList) return;
    const professionalId = Number(profServicesProfessional?.value || "");
    if (!Number.isFinite(professionalId) || professionalId <= 0) {
      profServicesList.innerHTML =
        '<p class="text-sm text-text-muted">Selecione um profissional para carregar os serviços.</p>';
      setProfServicesFeedback("Selecione um profissional.");
      return;
    }

    const professional = professionalsCache.find((row) => row.id === professionalId);
    if (profServicesUnit) {
      profServicesUnit.value = professional?.unitId ? String(professional.unitId) : "";
    }

    const payload = await apiJson<{
      items?: Array<{ serviceId: number }>;
    }>(`/professional-services?professionalId=${professionalId}`);
    const linked = new Set<number>(
      (payload.items || [])
        .map((row) => Number(row.serviceId))
        .filter((value) => Number.isFinite(value) && value > 0)
    );

    const sortedServices = [...servicesForProfessionalCache].sort((left, right) =>
      left.name.localeCompare(right.name)
    );
    if (!sortedServices.length) {
      profServicesList.innerHTML = '<p class="text-sm text-text-muted">Nenhum serviço encontrado.</p>';
      setProfServicesFeedback("Nenhum serviço encontrado para vincular.", true);
      return;
    }

    profServicesList.innerHTML = sortedServices
      .map((service) => {
        const checked = linked.has(service.id) ? "checked" : "";
        const category = service.serviceCategory?.name || "Sem categoria";
        return `
          <label class="flex items-center gap-2 rounded-lg border border-[#cfe7d1] bg-white px-3 py-2">
            <input class="h-4 w-4 text-primary" type="checkbox" data-prof-service-checkbox value="${service.id}" ${checked}>
            <span class="text-xs text-forest-green font-medium">${escapeHtml(service.name)}</span>
            <span class="text-[10px] text-text-muted ml-auto">${escapeHtml(category)}</span>
          </label>
        `;
      })
      .join("");
    setProfServicesFeedback(`${professional?.name || "Profissional"}: ${linked.size} serviço(s) vinculados.`);
  };

  const openAgendaForProfessional = (professional: AgendaProfessionalRow): void => {
    setActiveView("agenda");
    setAgendaProfessionalFilter(appointmentsProfessionalFilter, professional);
    setAgendaProfessionalFilter(shiftsProfessionalFilter, professional);
    applyAppointmentFilters();
    fetchAppointments().catch((error) => {
      logger.error("Falha ao aplicar filtro de agendamentos por profissional", { error });
    });
    fetchShifts().catch((error) => {
      logger.error("Falha ao abrir agenda do profissional", { error });
    });
  };

  if (appointmentsUnitFilter) {
    addCleanup(on(appointmentsUnitFilter, "change", () => applyAppointmentFilters()));
  }
  if (appointmentsProfessionalFilter) {
    addCleanup(on(appointmentsProfessionalFilter, "change", () => applyAppointmentFilters()));
  }
  if (appointmentsDateFilter) {
    addCleanup(on(appointmentsDateFilter, "change", () => applyAppointmentFilters()));
  }
  if (shiftsRefresh) {
    addCleanup(
      on(shiftsRefresh, "click", () => {
        fetchShifts().catch((error) => {
          logger.error("Falha ao atualizar escalas", { error });
          setShiftsMessage(error instanceof Error ? error.message : "Falha ao carregar escalas.");
        });
      })
    );
  }
  if (shiftsUnitFilter) {
    addCleanup(
      on(shiftsUnitFilter, "change", () => {
        fetchShifts().catch((error) => {
          logger.error("Falha ao filtrar escalas por unidade", { error });
          setShiftsMessage(error instanceof Error ? error.message : "Falha ao filtrar escalas.");
        });
      })
    );
  }
  if (shiftsDateFilter) {
    addCleanup(
      on(shiftsDateFilter, "change", () => {
        fetchShifts().catch((error) => {
          logger.error("Falha ao filtrar escalas por data", { error });
          setShiftsMessage(error instanceof Error ? error.message : "Falha ao filtrar escalas.");
        });
      })
    );
  }
  if (shiftsProfessionalFilter) {
    addCleanup(
      on(shiftsProfessionalFilter, "change", () => {
        fetchShifts().catch((error) => {
          logger.error("Falha ao filtrar escalas por profissional", { error });
          setShiftsMessage(error instanceof Error ? error.message : "Falha ao filtrar escalas.");
        });
      })
    );
  }
  if (shiftForm) {
    addCleanup(
      on(shiftForm, "submit", async (event) => {
        event.preventDefault();
        const professionalId = Number(shiftProfessionalInput?.value || "");
        const workDate = shiftDateInput?.value || "";
        const hourStart = shiftHourStartInput?.value || "";
        const hourFinish = shiftHourFinishInput?.value || "";
        const notes = shiftNotesInput?.value.trim() || "";

        if (!Number.isFinite(professionalId) || professionalId <= 0) {
          setShiftsMessage("Selecione um profissional para salvar a escala.");
          return;
        }
        if (!workDate || !hourStart || !hourFinish) {
          setShiftsMessage("Preencha data, horario inicial e horario final.");
          return;
        }

        const professional = professionalsCache.find((item) => item.id === professionalId);
        const unitFromProfessional = professional?.unitId ? Number(professional.unitId) : null;
        const unitFromFilter = Number(shiftsUnitFilter?.value || "");
        const unitId =
          unitFromProfessional && unitFromProfessional > 0
            ? unitFromProfessional
            : Number.isFinite(unitFromFilter) && unitFromFilter > 0
              ? unitFromFilter
              : undefined;

        try {
          await apiJson("/professional-shifts", {
            method: "POST",
            body: JSON.stringify({
              professionalId,
              unitId,
              workDate,
              hourStart,
              hourFinish,
              notes: notes || undefined,
            }),
          });
          if (shiftHourStartInput) shiftHourStartInput.value = "";
          if (shiftHourFinishInput) shiftHourFinishInput.value = "";
          if (shiftNotesInput) shiftNotesInput.value = "";
          await fetchShifts();
        } catch (error) {
          logger.error("Falha ao salvar escala", { error });
          setShiftsMessage(error instanceof Error ? error.message : "Falha ao salvar escala.");
        }
      })
    );
  }
  if (shiftsTableBody) {
    addCleanup(
      on(shiftsTableBody, "click", async (event) => {
        const target = event.target as HTMLElement | null;
        const row = target?.closest("[data-shift-row]") as HTMLElement | null;
        if (!row) return;
        const action = target?.closest("[data-shift-action]")?.getAttribute("data-shift-action");
        if (action !== "delete") return;
        const shiftId = Number(row.getAttribute("data-shift-id"));
        if (!Number.isFinite(shiftId) || shiftId <= 0) return;
        try {
          await apiJson(`/professional-shifts/${shiftId}`, { method: "DELETE" });
          await fetchShifts();
        } catch (error) {
          logger.error("Falha ao excluir escala", { error });
          setShiftsMessage(error instanceof Error ? error.message : "Falha ao excluir escala.");
        }
      })
    );
  }
  if (profServicesProfessional) {
    addCleanup(
      on(profServicesProfessional, "change", () => {
        renderProfessionalServiceChecklist().catch((error) => {
          logger.error("Falha ao carregar checklist de serviços do profissional", { error });
          if (profServicesList) {
            profServicesList.innerHTML =
              '<p class="text-sm text-red-500">Falha ao carregar serviços do profissional.</p>';
          }
          setProfServicesFeedback(
            error instanceof Error ? error.message : "Falha ao carregar serviços do profissional.",
            true
          );
        });
      })
    );
  }
  if (profServicesSave) {
    addCleanup(
      on(profServicesSave, "click", async () => {
        const professionalId = Number(profServicesProfessional?.value || "");
        const unitId = Number(profServicesUnit?.value || "");
        const serviceIds = getSelectedServiceIds();

        if (!Number.isFinite(professionalId) || professionalId <= 0) {
          setProfServicesFeedback("Selecione um profissional para salvar os vínculos.", true);
          return;
        }
        if (!Number.isFinite(unitId) || unitId <= 0) {
          setProfServicesFeedback("Selecione a unidade do profissional.", true);
          return;
        }

        try {
          await apiJson(`/professionals/${professionalId}`, {
            method: "PATCH",
            body: JSON.stringify({ unitId }),
          });
          await apiJson(`/professionals/${professionalId}/services`, {
            method: "PUT",
            body: JSON.stringify({ serviceIds }),
          });

          const selectedProfessionalId = String(professionalId);
          await hydrateAppointmentFilters();
          if (profServicesProfessional) profServicesProfessional.value = selectedProfessionalId;
          if (profServicesUnit) profServicesUnit.value = String(unitId);
          await renderProfessionalServiceChecklist();
          setProfServicesFeedback(`Vínculos atualizados com sucesso (${serviceIds.length} serviço(s)).`);
        } catch (error) {
          logger.error("Falha ao salvar vínculos de serviços do profissional", { error });
          setProfServicesFeedback(
            error instanceof Error ? error.message : "Falha ao salvar vínculos do profissional.",
            true
          );
        }
      })
    );
  }

  const refresh = async (): Promise<void> => {
    await hydrateAppointmentFilters();
    await Promise.all([
      fetchAppointments(),
      fetchShifts().catch((error) => {
        logger.error("Falha ao carregar escalas iniciais", { error });
        setShiftsMessage(error instanceof Error ? error.message : "Falha ao carregar escalas.");
      }),
    ]);

    if (profServicesProfessional?.value) {
      await renderProfessionalServiceChecklist().catch((error) => {
        logger.error("Falha ao carregar checklist inicial de serviços por profissional", { error });
        if (profServicesList) {
          profServicesList.innerHTML =
            '<p class="text-sm text-red-500">Falha ao carregar serviços do profissional.</p>';
        }
        setProfServicesFeedback(
          error instanceof Error ? error.message : "Falha ao carregar serviços do profissional.",
          true
        );
      });
    } else {
      setProfServicesFeedback("Selecione um profissional.");
    }
  };

  refresh().catch(() => undefined);

  return {
    openAgendaForProfessional,
    refresh,
  };
};
