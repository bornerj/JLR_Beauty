import { logger } from "../../utils/logger";
import type { Cleanup } from "../../shared/dom";
import { on } from "../../shared/dom";

type ApiJsonFn = <T = unknown>(path: string, options?: RequestInit) => Promise<T>;
type AddCleanupFn = (cleanup: Cleanup) => void;
type EscapeHtmlFn = (value: string) => string;
type FormatDateFn = (value?: string | null) => string;

type SettingRow = {
  key: string;
  value?: unknown;
};

type ConciergeSessionRow = {
  id: number;
  origin: "WEB" | "WHATSAPP";
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  phone: string;
  customerName?: string | null;
  service?: { id: number; name: string } | null;
  unit?: { id: number; name: string } | null;
  slotLabel?: string | null;
  scheduledDateLabel?: string | null;
  scheduledFor?: string | null;
  createdAt?: string | null;
  completedAt?: string | null;
  lastInboundAt?: string | null;
  summarySentAt?: string | null;
  eventsCount?: number;
};

type InitAdminWhatsappContactsBehaviorParams = {
  addCleanup: AddCleanupFn;
  apiJson: ApiJsonFn;
  escapeHtml: EscapeHtmlFn;
  formatDate: FormatDateFn;
  statusBadgeByName: Record<string, string>;
};

const WHATSAPP_CATEGORY_FIRST_CONTENT_KEY = "whatsapp_flow_category_first";
const WHATSAPP_OPENING_GREETING_CONTENT_KEY = "whatsapp_opening_greeting_text";
const WHATSAPP_COMPLETION_GREETING_CONTENT_KEY = "whatsapp_completion_greeting_text";
const DEFAULT_WHATSAPP_OPENING_GREETING_TEXT = "Seja bem vinda. Qual tratamento deseja fazer hoje?";
const DEFAULT_WHATSAPP_COMPLETION_GREETING_TEXT =
  "Agendamento registrado com sucesso. Nosso time vai confirmar os detalhes em seguida.";

const parseBooleanContentValue = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["1", "true", "yes", "sim", "on", "enabled"].includes(normalized);
  }
  if (value && typeof value === "object" && "enabled" in (value as Record<string, unknown>)) {
    return Boolean((value as Record<string, unknown>).enabled);
  }
  return false;
};

const parseTextContentValue = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value).trim();
  if (value && typeof value === "object") {
    const asRecord = value as Record<string, unknown>;
    if (typeof asRecord.text === "string") return asRecord.text.trim();
    if (typeof asRecord.message === "string") return asRecord.message.trim();
    if (typeof asRecord.value === "string") return asRecord.value.trim();
  }
  return "";
};

export const initAdminWhatsappContactsBehavior = ({
  addCleanup,
  apiJson,
  escapeHtml,
  formatDate,
  statusBadgeByName,
}: InitAdminWhatsappContactsBehaviorParams): {
  refreshSessions: () => Promise<void>;
  refreshSettings: () => Promise<void>;
} => {
  const conciergeSearch = document.querySelector("[data-concierge-search]") as HTMLInputElement | null;
  const conciergeStatusFilter = document.querySelector(
    "[data-concierge-status-filter]"
  ) as HTMLSelectElement | null;
  const conciergeFrom = document.querySelector("[data-concierge-from]") as HTMLInputElement | null;
  const conciergeTo = document.querySelector("[data-concierge-to]") as HTMLInputElement | null;
  const conciergeRefresh = document.querySelector(
    "[data-concierge-refresh]"
  ) as HTMLButtonElement | null;
  const conciergeCategoryFirstToggle = document.querySelector(
    "[data-concierge-category-first-toggle]"
  ) as HTMLInputElement | null;
  const conciergeCategoryFirstStatus = document.querySelector(
    "[data-concierge-category-first-status]"
  ) as HTMLElement | null;
  const conciergeOpeningGreetingInput = document.querySelector(
    "[data-concierge-opening-greeting]"
  ) as HTMLTextAreaElement | null;
  const conciergeCompletionGreetingInput = document.querySelector(
    "[data-concierge-completion-greeting]"
  ) as HTMLTextAreaElement | null;
  const conciergeGreetingsSave = document.querySelector(
    "[data-concierge-greetings-save]"
  ) as HTMLButtonElement | null;
  const conciergeGreetingsStatus = document.querySelector(
    "[data-concierge-greetings-status]"
  ) as HTMLElement | null;
  const conciergeCount = document.querySelector("[data-concierge-count]") as HTMLElement | null;
  const conciergeTableBody = document.querySelector(
    "[data-concierge-table-body]"
  ) as HTMLElement | null;

  let conciergeSessionsCache: ConciergeSessionRow[] = [];
  let conciergeCategoryFirstEnabled = false;

  const setConciergeCategoryFirstStatus = (enabled: boolean, saving = false): void => {
    if (!conciergeCategoryFirstStatus) return;
    if (saving) {
      conciergeCategoryFirstStatus.textContent = "Salvando configuracao...";
      return;
    }
    conciergeCategoryFirstStatus.textContent = enabled
      ? "Modo ativo: cliente ve categorias primeiro e depois os servicos da categoria."
      : "Modo desativado: cliente ve todos os servicos de uma vez.";
  };

  const setConciergeGreetingsStatus = (message: string, isError = false): void => {
    if (!conciergeGreetingsStatus) return;
    conciergeGreetingsStatus.textContent = message;
    conciergeGreetingsStatus.classList.toggle("text-red-500", isError);
    conciergeGreetingsStatus.classList.toggle("text-text-muted", !isError);
  };

  const fetchConciergeTextSetting = async (key: string, fallbackValue: string): Promise<string> => {
    try {
      const entry = await apiJson<SettingRow>(`/settings/${key}`);
      const parsed = parseTextContentValue(entry?.value);
      return parsed || fallbackValue;
    } catch {
      return fallbackValue;
    }
  };

  const fetchConciergeGreetingSettings = async (): Promise<void> => {
    setConciergeGreetingsStatus("Carregando saudacoes...");
    try {
      const [openingText, completionText] = await Promise.all([
        fetchConciergeTextSetting(
          WHATSAPP_OPENING_GREETING_CONTENT_KEY,
          DEFAULT_WHATSAPP_OPENING_GREETING_TEXT
        ),
        fetchConciergeTextSetting(
          WHATSAPP_COMPLETION_GREETING_CONTENT_KEY,
          DEFAULT_WHATSAPP_COMPLETION_GREETING_TEXT
        ),
      ]);
      if (conciergeOpeningGreetingInput) conciergeOpeningGreetingInput.value = openingText;
      if (conciergeCompletionGreetingInput) conciergeCompletionGreetingInput.value = completionText;
      setConciergeGreetingsStatus("Saudacoes carregadas.");
    } catch (error) {
      logger.error("Falha ao carregar saudacoes do fluxo WhatsApp", { error });
      if (conciergeOpeningGreetingInput) {
        conciergeOpeningGreetingInput.value = DEFAULT_WHATSAPP_OPENING_GREETING_TEXT;
      }
      if (conciergeCompletionGreetingInput) {
        conciergeCompletionGreetingInput.value = DEFAULT_WHATSAPP_COMPLETION_GREETING_TEXT;
      }
      setConciergeGreetingsStatus("Falha ao carregar saudacoes. Usando padrao.", true);
    }
  };

  const persistConciergeGreetingSettings = async (): Promise<void> => {
    const openingRaw = (conciergeOpeningGreetingInput?.value || "").trim();
    const completionRaw = (conciergeCompletionGreetingInput?.value || "").trim();
    const openingValue = openingRaw || DEFAULT_WHATSAPP_OPENING_GREETING_TEXT;
    const completionValue = completionRaw || DEFAULT_WHATSAPP_COMPLETION_GREETING_TEXT;

    setConciergeGreetingsStatus("Salvando saudacoes...");
    await Promise.all([
      apiJson(`/settings/${WHATSAPP_OPENING_GREETING_CONTENT_KEY}`, {
        method: "PUT",
        body: JSON.stringify({ value: openingValue }),
      }),
      apiJson(`/settings/${WHATSAPP_COMPLETION_GREETING_CONTENT_KEY}`, {
        method: "PUT",
        body: JSON.stringify({ value: completionValue }),
      }),
    ]);
    if (conciergeOpeningGreetingInput) conciergeOpeningGreetingInput.value = openingValue;
    if (conciergeCompletionGreetingInput) conciergeCompletionGreetingInput.value = completionValue;
    setConciergeGreetingsStatus("Saudacoes salvas com sucesso.");
  };

  const fetchConciergeCategoryFirstSetting = async (): Promise<void> => {
    try {
      const entry = await apiJson<SettingRow>(`/settings/${WHATSAPP_CATEGORY_FIRST_CONTENT_KEY}`);
      conciergeCategoryFirstEnabled = parseBooleanContentValue(entry?.value);
    } catch (error) {
      conciergeCategoryFirstEnabled = false;
      logger.warn("Falha ao carregar configuracao do fluxo WhatsApp. Usando padrao.", { error });
    }
    if (conciergeCategoryFirstToggle) {
      conciergeCategoryFirstToggle.checked = conciergeCategoryFirstEnabled;
    }
    setConciergeCategoryFirstStatus(conciergeCategoryFirstEnabled);
  };

  const persistConciergeCategoryFirstSetting = async (enabled: boolean): Promise<void> => {
    await apiJson(`/settings/${WHATSAPP_CATEGORY_FIRST_CONTENT_KEY}`, {
      method: "PUT",
      body: JSON.stringify({ value: enabled }),
    });
    conciergeCategoryFirstEnabled = enabled;
    if (conciergeCategoryFirstToggle) {
      conciergeCategoryFirstToggle.checked = enabled;
    }
    setConciergeCategoryFirstStatus(enabled);
  };

  const renderConciergeSessions = (list: ConciergeSessionRow[]): void => {
    if (!conciergeTableBody) return;
    if (conciergeCount) {
      conciergeCount.textContent = `${list.length} registro${list.length === 1 ? "" : "s"}`;
    }
    if (!list.length) {
      conciergeTableBody.innerHTML =
        '<tr><td class="table-cell" colspan="10">Nenhum contato encontrado.</td></tr>';
      return;
    }
    conciergeTableBody.innerHTML = list
      .map((row) => {
        const originLabel = row.origin === "WHATSAPP" ? "WhatsApp" : "Site";
        const statusLabel = row.status || "ACTIVE";
        const statusClass =
          statusBadgeByName[statusLabel] || "bg-stone-100 text-stone-600 border-stone-200";
        const scheduledDate =
          (row.scheduledDateLabel || "").trim() ||
          (row.scheduledFor ? new Date(row.scheduledFor).toLocaleDateString("pt-BR") : "-");
        const scheduledTime =
          (row.slotLabel || "").trim() ||
          (row.scheduledFor
            ? new Date(row.scheduledFor).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-");
        return `
          <tr class="hover:bg-[#f6f8f6] transition-colors">
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${formatDate(row.createdAt || null)}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${originLabel}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml((row.customerName || "-").trim() || "-")}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(row.phone || "-")}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(row.service?.name || "-")}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(row.unit?.name || "-")}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(scheduledDate)}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${escapeHtml(scheduledTime)}</span></td>
            <td class="table-cell"><span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${statusLabel}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${formatDate(row.completedAt || null)}</span></td>
          </tr>
        `;
      })
      .join("");
  };

  const applyConciergeFilters = (): void => {
    const query = (conciergeSearch?.value || "").trim().toLowerCase();
    const status = (conciergeStatusFilter?.value || "").trim();
    const from = (conciergeFrom?.value || "").trim();
    const to = (conciergeTo?.value || "").trim();
    const fromMs = from ? new Date(`${from}T00:00:00`).getTime() : 0;
    const toMs = to ? new Date(`${to}T23:59:59`).getTime() : 0;

    const filtered = conciergeSessionsCache.filter((row) => {
      const textStack = [
        row.phone || "",
        row.customerName || "",
        row.service?.name || "",
        row.unit?.name || "",
        row.slotLabel || "",
        row.scheduledDateLabel || "",
      ]
        .join(" ")
        .toLowerCase();
      const createdMs = row.createdAt ? Date.parse(row.createdAt) : 0;
      const matchesQuery = !query || textStack.includes(query);
      const matchesStatus = !status || row.status === status;
      const matchesFrom = !fromMs || (Number.isFinite(createdMs) && createdMs >= fromMs);
      const matchesTo = !toMs || (Number.isFinite(createdMs) && createdMs <= toMs);
      return matchesQuery && matchesStatus && matchesFrom && matchesTo;
    });
    renderConciergeSessions(filtered);
  };

  const fetchConciergeSessions = async (): Promise<void> => {
    const payload = await apiJson<{ items?: ConciergeSessionRow[] }>("/concierge/sessions?limit=500");
    conciergeSessionsCache = Array.isArray(payload.items) ? payload.items : [];
    applyConciergeFilters();
  };

  if (conciergeSearch) addCleanup(on(conciergeSearch, "input", () => applyConciergeFilters()));
  if (conciergeStatusFilter) addCleanup(on(conciergeStatusFilter, "change", () => applyConciergeFilters()));
  if (conciergeFrom) addCleanup(on(conciergeFrom, "change", () => applyConciergeFilters()));
  if (conciergeTo) addCleanup(on(conciergeTo, "change", () => applyConciergeFilters()));
  if (conciergeCategoryFirstToggle) {
    addCleanup(
      on(conciergeCategoryFirstToggle, "change", async () => {
        const nextValue = Boolean(conciergeCategoryFirstToggle.checked);
        const previousValue = conciergeCategoryFirstEnabled;
        setConciergeCategoryFirstStatus(nextValue, true);
        try {
          await persistConciergeCategoryFirstSetting(nextValue);
        } catch (error) {
          logger.error("Falha ao salvar configuracao do fluxo WhatsApp", { error });
          conciergeCategoryFirstEnabled = previousValue;
          conciergeCategoryFirstToggle.checked = previousValue;
          setConciergeCategoryFirstStatus(previousValue);
        }
      })
    );
  }
  if (conciergeRefresh) {
    addCleanup(
      on(conciergeRefresh, "click", () => {
        fetchConciergeSessions().catch(() => undefined);
      })
    );
  }
  if (conciergeGreetingsSave) {
    addCleanup(
      on(conciergeGreetingsSave, "click", async () => {
        conciergeGreetingsSave.disabled = true;
        conciergeGreetingsSave.classList.add("opacity-70");
        try {
          await persistConciergeGreetingSettings();
        } catch (error) {
          logger.error("Falha ao salvar saudacoes do fluxo WhatsApp", { error });
          setConciergeGreetingsStatus(
            error instanceof Error ? error.message : "Falha ao salvar saudacoes.",
            true
          );
        } finally {
          conciergeGreetingsSave.disabled = false;
          conciergeGreetingsSave.classList.remove("opacity-70");
        }
      })
    );
  }

  fetchConciergeSessions().catch(() => undefined);
  fetchConciergeCategoryFirstSetting().catch(() => undefined);
  fetchConciergeGreetingSettings().catch(() => undefined);

  return {
    refreshSessions: fetchConciergeSessions,
    refreshSettings: async () => {
      await Promise.all([fetchConciergeCategoryFirstSetting(), fetchConciergeGreetingSettings()]);
    },
  };
};
