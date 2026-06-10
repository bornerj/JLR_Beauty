import { ConciergeOrigin, ConciergeStep } from "@prisma/client";
import prisma from "../../../lib/prisma";
import {
  type AvailabilityPeriod,
  createRemoteAppointment,
  listAvailableProfessionalsForSlot,
  listPublicConciergeContext,
  listPublicPeriodsForService,
  listPublicSlotsForService,
} from "../../../lib/appointmentAvailability";
import { buildOpeningGreeting, getGreetingByHour } from "../opening/conciergeOpening";
import { sendZApiTextMessage } from "../integrations/zapi";
import { getPublicBranding } from "../../branding/service";
import { logger } from "../../../utils/logger";

type ConciergeOptionItem = {
  id: number;
  name: string;
};

type ConciergeDateOption = {
  label: string;
  isoDate: string;
};

type ConciergeCatalog = {
  services: ConciergeOptionItem[];
  units: ConciergeOptionItem[];
  scheduleDates: ConciergeDateOption[];
  slots: string[];
  periods: Array<{ key: AvailabilityPeriod; label: string }>;
};

type ConciergeServiceChoice = {
  id: number;
  name: string;
  categoryName: string;
  availableStarts?: number;
  totalStarts?: number;
};

type ConciergeServiceCategory = {
  id: number;
  name: string;
  services: ConciergeServiceChoice[];
};

type ConciergePeriodChoice = {
  key: AvailabilityPeriod;
  label: string;
  availableStarts: number;
  totalStarts: number;
};

type ConciergeSlotChoice = {
  slotLabel: string;
  hourIni: string;
  hourFinish: string;
  professionalsAvailable: number;
};

type CustomerProfileSnapshot = {
  id: number;
  userId: number | null;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  phone2: string | null;
  phone2OptOut: boolean;
  notes: string | null;
};

type CustomerProfileFieldKey = "email" | "city" | "state" | "neighborhood" | "phone2";

type InboundProcessResult = {
  ok: boolean;
  sessionId?: number;
  reason?: string;
};

type WhatsappFlowSettings = {
  categoryFirstFlowEnabled: boolean;
  openingGreetingText: string;
  completionGreetingText: string;
};

type CompleteWebSessionInput = {
  serviceId?: number;
  serviceName?: string;
  unitId?: number;
  unitName?: string;
  scheduledDateLabel?: string;
  scheduledFor?: string;
  slotLabel: string;
  customerName: string;
  customerPhone: string;
};

const DEFAULT_SUMMARY_PHONE = "5511978935812";
const ACTIVE_STATUS_NAMES = ["Ativo", "ACTIVE"];
const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"] as const;
const DEFAULT_SCHEDULE_DAYS = 14;
const PERIOD_STATE_PREFIX = "__PERIOD__:";
const CATEGORY_STATE_PREFIX = "__CATEGORY__:";
const CUSTOMER_PROFILE_STATE_PREFIX = "__PROFILE__:";
const PROFESSIONAL_SELECTION_PENDING = "__PROF_SELECTION_PENDING__";
const PROFESSIONAL_SELECTION_PREFIX = "__PROF_SELECTION__:";
const PROFESSIONAL_SELECTION_AUTO = "AUTO";
const WHATSAPP_FLOW_CATEGORY_FIRST_KEY = "whatsapp_flow_category_first";
const WHATSAPP_OPENING_GREETING_TEXT_KEY = "whatsapp_opening_greeting_text";
const WHATSAPP_COMPLETION_GREETING_TEXT_KEY = "whatsapp_completion_greeting_text";
const WHATSAPP_CUSTOMER_ORIGIN_NOTE = "*cliente vindo pelo whatsapp";
const DEFAULT_WHATSAPP_OPENING_GREETING_TEXT = "Seja bem vinda. Qual tratamento deseja fazer hoje?";
const DEFAULT_WHATSAPP_COMPLETION_GREETING_TEXT =
  "Agendamento registrado com sucesso. Nosso time vai confirmar os detalhes em seguida.";

const sanitizePhone = (value: string): string => value.replace(/\D/g, "");

const CUSTOMER_PROFILE_SELECT = {
  id: true,
  userId: true,
  name: true,
  phone: true,
  email: true,
  city: true,
  state: true,
  neighborhood: true,
  phone2: true,
  phone2OptOut: true,
  notes: true,
} as const;

const resolveSummaryPhone = (): string => {
  const fromEnv = sanitizePhone((process.env.CONCIERGE_SUMMARY_PHONE || "").trim());
  if (fromEnv) return fromEnv;
  return DEFAULT_SUMMARY_PHONE;
};

const buildSlots = (): string[] => {
  const values: string[] = [];
  for (let hour = 9; hour <= 17; hour += 1) {
    values.push(`${String(hour).padStart(2, "0")}:00`);
  }
  return values;
};

const toIsoDate = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseIsoDate = (value: string): Date | null => {
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  const parsed = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const buildScheduleDates = (days = DEFAULT_SCHEDULE_DAYS): ConciergeDateOption[] => {
  const items: ConciergeDateOption[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const isoDate = toIsoDate(date);
    const weekday = WEEKDAY_LABELS[date.getDay()] || "";
    const label = `${date.toLocaleDateString("pt-BR")} (${weekday})`;
    items.push({ label, isoDate });
  }
  return items;
};

const combineDateAndSlot = (isoDate: string, slotLabel: string): Date | null => {
  const date = parseIsoDate(isoDate);
  if (!date) return null;
  const [hourRaw, minuteRaw] = slotLabel.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  date.setHours(hour, minute, 0, 0);
  return date;
};

const formatChoiceOptions = (items: readonly string[]): string => {
  return items.map((item, index) => `${index + 1}) ${item}`).join("\n");
};

const joinMessageBlocks = (blocks: readonly (string | null | undefined)[]): string => {
  return blocks
    .map((block) => (block || "").trim())
    .filter((block) => block.length > 0)
    .join("\n\n");
};

const categorizedServicePrompt = (categories: ConciergeServiceCategory[]): string => {
  const categoryBlocks: string[] = [];
  let index = 1;
  for (const category of categories) {
    if (!category.services.length) continue;
    const lines = [`Categoria: ${category.name}`];
    for (const service of category.services) {
      const availabilitySuffix =
        typeof service.availableStarts === "number" ? ` (${service.availableStarts} vagas)` : "";
      lines.push(`${index}) ${service.name}${availabilitySuffix}`);
      index += 1;
    }
    categoryBlocks.push(lines.join("\n"));
  }
  return joinMessageBlocks([
    "Qual tratamento deseja fazer hoje?",
    ["Categorias:", categoryBlocks.join("\n\n")].join("\n"),
    "Responda com o número ou nome do serviço.",
  ]);
};

const serviceCategoryPrompt = (categories: ConciergeServiceCategory[]): string => {
  const labels = categories.map((category) => category.name);
  return joinMessageBlocks([
    "Qual tratamento deseja fazer hoje?",
    ["Categorias:", formatChoiceOptions(labels)].join("\n"),
    "Responda com o número ou nome da categoria.",
  ]);
};

const servicesInCategoryPrompt = (category: ConciergeServiceCategory): string => {
  const labels = category.services.map((service) => service.name);
  return joinMessageBlocks([
    `Categoria selecionada: ${category.name}. Qual serviço deseja agendar?`,
    formatChoiceOptions(labels),
    "Responda com o número ou nome do serviço. Se quiser trocar a categoria, digite 'menu'.",
  ]);
};

const unitPrompt = (units: ConciergeOptionItem[]): string => {
  const names = units.map((item) => item.name);
  return joinMessageBlocks([
    "Qual unidade você prefere?",
    formatChoiceOptions(names),
    "Responda com o número ou nome da opção.",
  ]);
};

const datePrompt = (dates: ConciergeDateOption[]): string => {
  const labels = dates.map((item) => item.label);
  return joinMessageBlocks([
    "Qual data você prefere para o agendamento?",
    formatChoiceOptions(labels),
    "Responda com o número ou data exibida.",
  ]);
};

const periodPrompt = (periods: ConciergePeriodChoice[]): string => {
  const labels = periods.map((period) => `${period.label} (${period.availableStarts} vagas)`);
  return joinMessageBlocks([
    "Qual período você prefere?",
    formatChoiceOptions(labels),
    "Responda com o número ou nome do período.",
  ]);
};

const slotPrompt = (slots: ConciergeSlotChoice[], periodLabel: string): string => {
  const labels = slots.map((slot) => `${slot.slotLabel} (${slot.professionalsAvailable} profissionais)`);
  return joinMessageBlocks([
    `Escolha um horário disponível no período ${periodLabel}:`,
    formatChoiceOptions(labels),
    "Responda com o número ou horário (ex.: 14:00).",
  ]);
};

const professionalPrompt = (
  professionals: Array<{ id: number; name: string }>
): string => {
  const labels = [
    "Primeiro profissional disponível",
    ...professionals.map((professional) => professional.name),
  ];
  return joinMessageBlocks([
    "Temos mais de um profissional disponível nesse horário. Com quem deseja agendar?",
    formatChoiceOptions(labels),
    "Responda com o número ou nome da opção.",
  ]);
};

const askNamePrompt = "Perfeito. Agora informe seu nome completo.";

const completionAckPrompt = DEFAULT_WHATSAPP_COMPLETION_GREETING_TEXT;

const CUSTOMER_PROFILE_FIELD_ORDER: CustomerProfileFieldKey[] = [
  "email",
  "city",
  "state",
  "neighborhood",
  "phone2",
];

const CUSTOMER_PROFILE_FIELD_LABEL: Record<CustomerProfileFieldKey, string> = {
  email: "e-mail",
  city: "cidade",
  state: "estado",
  neighborhood: "bairro",
  phone2: "telefone 2",
};

const resolveDisplayName = (rawName?: string | null): string | null => {
  const normalized = (rawName || "").trim();
  if (!normalized) return null;
  const firstName = normalized.split(/\s+/)[0] || "";
  return firstName || null;
};

const openingGreetingPrompt = (
  customerName?: string | null,
  openingGreetingText?: string
): string => {
  const normalizedText = (openingGreetingText || "").trim();
  if (!normalizedText) {
    return buildOpeningGreeting(new Date(), customerName);
  }
  const greetingByHour = getGreetingByHour(new Date());
  const displayName = resolveDisplayName(customerName);
  const prefix = displayName ? `${greetingByHour} ${displayName}` : greetingByHour;
  return `${prefix}, ${normalizedText}`;
};

const serviceSelectionPrompt = (
  categories: ConciergeServiceCategory[],
  categoryFirstFlowEnabled: boolean
): string => {
  if (categoryFirstFlowEnabled) return serviceCategoryPrompt(categories);
  return categorizedServicePrompt(categories);
};

const openingServiceSelectionPrompt = (
  categories: ConciergeServiceCategory[],
  categoryFirstFlowEnabled: boolean,
  openingGreetingText: string,
  customerName?: string | null
): string => {
  const fullCatalogPrompt = serviceSelectionPrompt(categories, categoryFirstFlowEnabled);
  const leadingQuestion = "Qual tratamento deseja fazer hoje?";
  const catalogPrompt = fullCatalogPrompt.startsWith(leadingQuestion)
    ? fullCatalogPrompt.slice(leadingQuestion.length).trimStart()
    : fullCatalogPrompt;
  return joinMessageBlocks([openingGreetingPrompt(customerName, openingGreetingText), catalogPrompt]);
};

const encodePeriodState = (period: AvailabilityPeriod): string => `${PERIOD_STATE_PREFIX}${period}`;

const encodeCategoryState = (categoryId: number): string => `${CATEGORY_STATE_PREFIX}${categoryId}`;
const encodeCustomerProfileState = (field: CustomerProfileFieldKey): string =>
  `${CUSTOMER_PROFILE_STATE_PREFIX}${field.toUpperCase()}`;

const decodePeriodState = (rawValue: string | null | undefined): AvailabilityPeriod | null => {
  if (!rawValue || !rawValue.startsWith(PERIOD_STATE_PREFIX)) return null;
  const key = rawValue.slice(PERIOD_STATE_PREFIX.length).trim().toUpperCase();
  if (key === "MORNING" || key === "AFTERNOON" || key === "EVENING") {
    return key;
  }
  return null;
};

const decodeCategoryState = (rawValue: string | null | undefined): number | null => {
  if (!rawValue || !rawValue.startsWith(CATEGORY_STATE_PREFIX)) return null;
  const parsed = Number(rawValue.slice(CATEGORY_STATE_PREFIX.length).trim());
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return null;
};

const decodeCustomerProfileState = (
  rawValue: string | null | undefined
): CustomerProfileFieldKey | null => {
  if (!rawValue || !rawValue.startsWith(CUSTOMER_PROFILE_STATE_PREFIX)) return null;
  const token = rawValue.slice(CUSTOMER_PROFILE_STATE_PREFIX.length).trim().toLowerCase();
  if (
    token === "email" ||
    token === "city" ||
    token === "state" ||
    token === "neighborhood" ||
    token === "phone2"
  ) {
    return token;
  }
  return null;
};

const encodeProfessionalState = (professionalId: number | null): string => {
  if (professionalId === null) {
    return `${PROFESSIONAL_SELECTION_PREFIX}${PROFESSIONAL_SELECTION_AUTO}`;
  }
  return `${PROFESSIONAL_SELECTION_PREFIX}${professionalId}`;
};

const decodeProfessionalState = (rawValue: string | null | undefined): number | null | undefined => {
  if (!rawValue || !rawValue.startsWith(PROFESSIONAL_SELECTION_PREFIX)) return undefined;
  const token = rawValue.slice(PROFESSIONAL_SELECTION_PREFIX.length).trim().toUpperCase();
  if (token === PROFESSIONAL_SELECTION_AUTO) return null;
  const parsed = Number(token);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return undefined;
};

const matchChoiceByLabel = (input: string, labels: readonly string[]): number => {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return -1;

  const numeric = Number(normalized);
  if (Number.isFinite(numeric) && numeric >= 1 && numeric <= labels.length) {
    return numeric - 1;
  }

  const exact = labels.findIndex((label) => label.trim().toLowerCase() === normalized);
  if (exact >= 0) return exact;

  const includes = labels.findIndex((label) => label.trim().toLowerCase().includes(normalized));
  return includes;
};

const logSessionError = (message: string, error: unknown): void => {
  logger.error(message, {
    error: error instanceof Error ? error.message : "erro inesperado",
  });
};

const delay = async (ms: number): Promise<void> => {
  if (ms <= 0) return;
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
};

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

const loadWhatsappFlowSettings = async (): Promise<WhatsappFlowSettings> => {
  const keys = [
    WHATSAPP_FLOW_CATEGORY_FIRST_KEY,
    WHATSAPP_OPENING_GREETING_TEXT_KEY,
    WHATSAPP_COMPLETION_GREETING_TEXT_KEY,
  ];
  const settings = await prisma.setting.findMany({
    where: { key: { in: keys } },
    select: { key: true, value: true },
  });
  const byKey = new Map<string, unknown>(settings.map((item) => [item.key, item.value]));
  const categoryFirstFlowEnabled = parseBooleanContentValue(
    byKey.get(WHATSAPP_FLOW_CATEGORY_FIRST_KEY)
  );
  const openingGreetingText =
    parseTextContentValue(byKey.get(WHATSAPP_OPENING_GREETING_TEXT_KEY)) ||
    DEFAULT_WHATSAPP_OPENING_GREETING_TEXT;
  const completionGreetingText =
    parseTextContentValue(byKey.get(WHATSAPP_COMPLETION_GREETING_TEXT_KEY)) ||
    DEFAULT_WHATSAPP_COMPLETION_GREETING_TEXT;
  return {
    categoryFirstFlowEnabled,
    openingGreetingText,
    completionGreetingText,
  };
};

const readCustomerProfileByPhone = async (phone: string): Promise<CustomerProfileSnapshot | null> => {
  const normalizedPhone = sanitizePhone(phone);
  if (!normalizedPhone) return null;
  return prisma.customer.findUnique({
    where: { phone: normalizedPhone },
    select: CUSTOMER_PROFILE_SELECT,
  });
};

const normalizeTextField = (value: string): string => value.trim().replace(/\s+/g, " ").slice(0, 120);

const shouldSkipOptionalPhone2 = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  return ["pular", "nao", "sem", "nenhum", "nenhuma"].includes(normalized);
};

const getNextMissingCustomerField = (
  customer: CustomerProfileSnapshot | null
): CustomerProfileFieldKey | null => {
  if (!customer) return null;
  for (const field of CUSTOMER_PROFILE_FIELD_ORDER) {
    if (field === "phone2") {
      if (!customer.phone2 && !customer.phone2OptOut) return "phone2";
      continue;
    }
    const value = (customer[field] || "").trim();
    if (!value) return field;
  }
  return null;
};

const buildCustomerProfileFieldPrompt = (
  field: CustomerProfileFieldKey,
  customerName?: string | null,
  openingGreetingText?: string
): string => {
  const greetingLine = openingGreetingPrompt(customerName, openingGreetingText).split("\n")[0] || "Ola!";
  const questionByField: Record<CustomerProfileFieldKey, string> = {
    email: "Antes de continuar, me informe seu e-mail.",
    city: "Antes de continuar, em qual cidade você mora?",
    state: "Antes de continuar, qual estado (UF) você mora?",
    neighborhood: "Antes de continuar, qual bairro você mora?",
    phone2:
      "Antes de continuar, se quiser informe um telefone 2 (opcional). Se preferir, digite 'pular'.",
  };
  return joinMessageBlocks([greetingLine, questionByField[field]]);
};

const validateCustomerProfileFieldInput = (
  field: CustomerProfileFieldKey,
  rawInput: string
): { ok: true; data: { value?: string; skipOptionalPhone2?: boolean } } | { ok: false; message: string } => {
  const cleanInput = rawInput.trim();
  if (!cleanInput) {
    return {
      ok: false,
      message: `Não entendi o ${CUSTOMER_PROFILE_FIELD_LABEL[field]}. Tente novamente.`,
    };
  }

  if (field === "email") {
    const email = cleanInput.toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { ok: false, message: "E-mail inválido. Informe no formato nome@dominio.com." };
    }
    return { ok: true, data: { value: email.slice(0, 180) } };
  }

  if (field === "phone2") {
    if (shouldSkipOptionalPhone2(cleanInput)) {
      return { ok: true, data: { skipOptionalPhone2: true } };
    }
    const phone2 = sanitizePhone(cleanInput);
    if (phone2.length < 10) {
      return {
        ok: false,
        message: "Telefone 2 inválido. Informe com DDD ou digite 'pular'.",
      };
    }
    return { ok: true, data: { value: phone2 } };
  }

  const normalized = normalizeTextField(cleanInput);
  if (normalized.length < 2) {
    return {
      ok: false,
      message: `Não entendi o ${CUSTOMER_PROFILE_FIELD_LABEL[field]}. Tente novamente.`,
    };
  }
  if (field === "state" && normalized.length > 30) {
    return { ok: false, message: "Estado inválido. Informe sigla UF ou nome do estado." };
  }
  return { ok: true, data: { value: normalized } };
};

export const upsertConciergeCustomerByPhone = async (payload: {
  phone: string;
  name: string;
  createOriginNote?: string | null;
}): Promise<CustomerProfileSnapshot> => {
  const normalizedPhone = sanitizePhone(payload.phone);
  const normalizedName = normalizeTextField(payload.name || "Cliente");
  if (!normalizedPhone) {
    throw new Error("invalid_phone");
  }

  const existing = await readCustomerProfileByPhone(normalizedPhone);
  if (existing) {
    const shouldUpdateName =
      normalizedName.length >= 2 &&
      existing.name.trim().toLowerCase() !== normalizedName.toLowerCase();
    if (!shouldUpdateName) return existing;
    return prisma.customer.update({
      where: { id: existing.id },
      data: { name: normalizedName },
      select: CUSTOMER_PROFILE_SELECT,
    });
  }

  return prisma.customer.create({
    data: {
      phone: normalizedPhone,
      name: normalizedName,
      notes: payload.createOriginNote?.trim() || null,
    },
    select: CUSTOMER_PROFILE_SELECT,
  });
};

const upsertWhatsappCustomer = async (payload: {
  phone: string;
  name: string;
}): Promise<CustomerProfileSnapshot> =>
  upsertConciergeCustomerByPhone({
    phone: payload.phone,
    name: payload.name || "Cliente WhatsApp",
    createOriginNote: WHATSAPP_CUSTOMER_ORIGIN_NOTE,
  });

const getConciergeCatalog = async (): Promise<ConciergeCatalog> => {
  const [services, bookingContext] = await Promise.all([
    prisma.service.findMany({
      where: {
        OR: [
          { serviceStatus: null },
          { serviceStatus: { name: { in: ACTIVE_STATUS_NAMES } } },
        ],
      },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    listPublicConciergeContext(),
  ]);

  return {
    services: services.map((row) => ({ id: row.id, name: row.name })),
    units: bookingContext.units.map((row) => ({ id: row.id, name: row.name })),
    scheduleDates: bookingContext.dates.map((dateItem) => ({
      label: dateItem.label,
      isoDate: dateItem.isoDate,
    })),
    slots: buildSlots(),
    periods: bookingContext.periods,
  };
};

const appendEvent = async (payload: {
  sessionId: number;
  direction: "INBOUND" | "OUTBOUND" | "SYSTEM";
  channel: ConciergeOrigin;
  phone?: string;
  text: string;
}): Promise<void> => {
  await prisma.conciergeEvent.create({
    data: {
      sessionId: payload.sessionId,
      direction: payload.direction,
      channel: payload.channel,
      phone: payload.phone || null,
      text: payload.text,
    },
  });
};

const sendText = async (targetPhone: string, text: string): Promise<boolean> => {
  const target = sanitizePhone(targetPhone);
  if (!target || !text.trim()) return false;
  const result = await sendZApiTextMessage({ phone: target, message: text });
  return result.ok;
};

const sendAndTrack = async (payload: {
  sessionId: number;
  targetPhone: string;
  text: string;
  channel: ConciergeOrigin;
}): Promise<boolean> => {
  let sent = false;
  try {
    sent = await sendText(payload.targetPhone, payload.text);
  } catch (error) {
    logSessionError("Falha ao enviar mensagem via WhatsApp no fluxo concierge", error);
  }
  await appendEvent({
    sessionId: payload.sessionId,
    direction: "OUTBOUND",
    channel: payload.channel,
    phone: payload.targetPhone,
    text: payload.text,
  });
  return sent;
};

const sendAndTrackWithRetry = async (
  payload: {
    sessionId: number;
    targetPhone: string;
    text: string;
    channel: ConciergeOrigin;
  },
  options?: { retries?: number; retryDelayMs?: number }
): Promise<boolean> => {
  const retries = Math.max(0, options?.retries ?? 1);
  const retryDelayMs = Math.max(0, options?.retryDelayMs ?? 600);
  let attempt = 0;
  while (attempt <= retries) {
    const sent = await sendAndTrack(payload);
    if (sent) return true;
    attempt += 1;
    if (attempt <= retries) {
      await delay(retryDelayMs);
    }
  }
  return false;
};

const findUnitByInput = (catalog: ConciergeCatalog, rawInput: string): ConciergeOptionItem | null => {
  const labels = catalog.units.map((item) => item.name);
  const index = matchChoiceByLabel(rawInput, labels);
  if (index < 0) return null;
  return catalog.units[index] || null;
};

const findDateByInput = (catalog: ConciergeCatalog, rawInput: string): ConciergeDateOption | null => {
  const labels = catalog.scheduleDates.map((item) => item.label);
  const index = matchChoiceByLabel(rawInput, labels);
  if (index < 0) return null;
  return catalog.scheduleDates[index] || null;
};

const resolveSessionDateOption = (
  catalog: ConciergeCatalog,
  scheduledDateLabel: string | null
): ConciergeDateOption | null => {
  if (!scheduledDateLabel) return null;
  return catalog.scheduleDates.find((dateOption) => dateOption.label === scheduledDateLabel) || null;
};

const loadCategorizedServicesCatalog = async (): Promise<ConciergeServiceCategory[]> => {
  const categories = await prisma.serviceCategory.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      services: {
        where: {
          OR: [
            { serviceStatus: null },
            { serviceStatus: { name: { in: ACTIVE_STATUS_NAMES } } },
          ],
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      services: category.services.map((service) => ({
        id: service.id,
        name: service.name,
        categoryName: category.name,
      })),
    }))
    .filter((category) => category.services.length > 0);
};

const flattenServices = (categories: ConciergeServiceCategory[]): ConciergeServiceChoice[] => {
  const flat: ConciergeServiceChoice[] = [];
  for (const category of categories) {
    flat.push(...category.services);
  }
  return flat;
};

const findServiceByInput = (
  categories: ConciergeServiceCategory[],
  rawInput: string
): ConciergeServiceChoice | null => {
  const services = flattenServices(categories);
  const labels = services.map((item) => item.name);
  const index = matchChoiceByLabel(rawInput, labels);
  if (index < 0) return null;
  return services[index] || null;
};

const findCategoryByInput = (
  categories: ConciergeServiceCategory[],
  rawInput: string
): ConciergeServiceCategory | null => {
  const labels = categories.map((category) => category.name);
  const index = matchChoiceByLabel(rawInput, labels);
  if (index < 0) return null;
  return categories[index] || null;
};

const findServiceInCategoryByInput = (
  category: ConciergeServiceCategory,
  rawInput: string
): ConciergeServiceChoice | null => {
  const labels = category.services.map((service) => service.name);
  const index = matchChoiceByLabel(rawInput, labels);
  if (index < 0) return null;
  return category.services[index] || null;
};

const wantsBackToCategorySelection = (rawInput: string): boolean => {
  const normalized = rawInput.trim().toLowerCase();
  if (!normalized) return false;
  return ["menu", "voltar", "categoria", "categorias", "trocar categoria"].includes(normalized);
};

const findPeriodByInput = (
  periods: ConciergePeriodChoice[],
  rawInput: string
): ConciergePeriodChoice | null => {
  const labels = periods.map((period) => period.label);
  const index = matchChoiceByLabel(rawInput, labels);
  if (index < 0) return null;
  return periods[index] || null;
};

const findSlotByInput = (slots: ConciergeSlotChoice[], rawInput: string): ConciergeSlotChoice | null => {
  const labels = slots.map((slot) => slot.slotLabel);
  const index = matchChoiceByLabel(rawInput, labels);
  if (index < 0) return null;
  return slots[index] || null;
};

const findProfessionalByInput = (
  professionals: Array<{ id: number; name: string }>,
  rawInput: string
): { preferredProfessionalId: number | null } | null => {
  const labels = [
    "Primeiro profissional disponível",
    ...professionals.map((professional) => professional.name),
  ];
  const index = matchChoiceByLabel(rawInput, labels);
  if (index < 0) return null;
  if (index === 0) return { preferredProfessionalId: null };
  const selected = professionals[index - 1];
  if (!selected) return null;
  return { preferredProfessionalId: selected.id };
};

const toPeriodChoices = (
  periods: Awaited<ReturnType<typeof listPublicPeriodsForService>>
): ConciergePeriodChoice[] => {
  return periods
    .filter((period) => period.availableStarts > 0)
    .map((period) => ({
      key: period.key,
      label: period.label,
      availableStarts: period.availableStarts,
      totalStarts: period.totalStarts,
    }));
};

const toSlotChoices = (
  slots: Awaited<ReturnType<typeof listPublicSlotsForService>>
): ConciergeSlotChoice[] => {
  return slots.map((slot) => ({
    slotLabel: slot.slotLabel,
    hourIni: slot.hourIni,
    hourFinish: slot.hourFinish,
    professionalsAvailable: slot.professionalsAvailable,
  }));
};

const resolveConciergeSummaryTitle = async (): Promise<string> => {
  try {
    const branding = await getPublicBranding();
    return `Resumo de Agendamento - Concierge ${branding.shortName}`;
  } catch (error) {
    logger.warn("Falha ao carregar branding para resumo de concierge; usando fallback", {
      error: error instanceof Error ? error.message : "erro inesperado",
    });
    return "Resumo de Agendamento - Concierge";
  }
};

const buildSummary = async (payload: {
  serviceName: string;
  unitName: string;
  scheduledDateLabel: string;
  scheduledFor: Date;
  slotLabel: string;
  professionalName?: string;
  customerName: string;
  customerPhone: string;
  finalizedAt: Date;
  origin: ConciergeOrigin;
}): Promise<string> => {
  const title = await resolveConciergeSummaryTitle();
  const finalizedIso = payload.finalizedAt.toISOString();
  const detailLines = [
    `Origem: ${payload.origin}`,
    `Servico: ${payload.serviceName}`,
    `Unidade: ${payload.unitName}`,
    `Data: ${payload.scheduledDateLabel}`,
    `Horario: ${payload.slotLabel}`,
    ...(payload.professionalName ? [`Profissional: ${payload.professionalName}`] : []),
    `Agendado para: ${payload.scheduledFor.toISOString()}`,
    `Nome: ${payload.customerName}`,
    `Telefone: ${payload.customerPhone}`,
    `Finalizado em: ${finalizedIso}`,
  ].join("\n");
  return joinMessageBlocks([title, detailLines]);
};

const buildCompactSummary = (payload: {
  serviceName: string;
  unitName: string;
  scheduledDateLabel: string;
  slotLabel: string;
  professionalName?: string;
}): string => {
  const detailLines = [
    `Servico: ${payload.serviceName}`,
    `Unidade: ${payload.unitName}`,
    `Data: ${payload.scheduledDateLabel}`,
    `Horario: ${payload.slotLabel}`,
    ...(payload.professionalName ? [`Profissional: ${payload.professionalName}`] : []),
  ].join("\n");
  return joinMessageBlocks(["Resumo do seu agendamento:", detailLines]);
};

const findOrCreateActiveWhatsappSession = async (
  phone: string
): Promise<{
    session: {
      id: number;
      step: ConciergeStep;
      serviceId: number | null;
      unitId: number | null;
      scheduledDateLabel: string | null;
      slotLabel: string | null;
      customerName: string | null;
    };
  isNew: boolean;
}> => {
  const normalizedPhone = sanitizePhone(phone);
  const existing = await prisma.conciergeSession.findFirst({
    where: {
      phone: normalizedPhone,
      origin: "WHATSAPP",
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
      select: {
        id: true,
        step: true,
        serviceId: true,
        unitId: true,
        scheduledDateLabel: true,
        slotLabel: true,
        customerName: true,
      },
  });
  if (existing) {
    return { session: existing, isNew: false };
  }
  const created = await prisma.conciergeSession.create({
    data: {
      origin: "WHATSAPP",
      phone: normalizedPhone,
      status: "ACTIVE",
      step: "SERVICE",
      lastInboundAt: new Date(),
    },
      select: {
        id: true,
        step: true,
        serviceId: true,
        unitId: true,
        scheduledDateLabel: true,
        slotLabel: true,
        customerName: true,
      },
  });
  return { session: created, isNew: true };
};

export const getConciergeOptions = async (): Promise<ConciergeCatalog> => {
  return getConciergeCatalog();
};

export const processWhatsappConciergeInbound = async (
  phone: string,
  text: string
): Promise<InboundProcessResult> => {
  const normalizedPhone = sanitizePhone(phone);
  const cleanText = text.trim();
  if (!normalizedPhone || !cleanText) {
    return { ok: false, reason: "invalid_input" };
  }

  const catalog = await getConciergeCatalog();
  if (!catalog.units.length || !catalog.scheduleDates.length) {
    return { ok: false, reason: "catalog_unavailable" };
  }

  try {
    const flowSettings = await loadWhatsappFlowSettings();
    const { categoryFirstFlowEnabled, openingGreetingText, completionGreetingText } = flowSettings;
    const { session, isNew } = await findOrCreateActiveWhatsappSession(normalizedPhone);
    let customerProfile = await readCustomerProfileByPhone(normalizedPhone);

    await appendEvent({
      sessionId: session.id,
      direction: "INBOUND",
      channel: "WHATSAPP",
      phone: normalizedPhone,
      text: cleanText,
    });

    const getKnownCustomerName = (): string | null => {
      const normalizedKnownName = normalizeTextField(customerProfile?.name || "");
      if (normalizedKnownName.length < 2) return null;
      return normalizedKnownName;
    };

    const finalizeWithCustomerName = async (
      sessionId: number,
      rawCustomerName: string
    ): Promise<InboundProcessResult> => {
      const customerName = normalizeTextField(rawCustomerName);
      if (!customerName) {
        await sendAndTrack({
          sessionId,
          targetPhone: normalizedPhone,
          text: askNamePrompt,
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId, reason: "invalid_name" };
      }

      const fullSession = await prisma.conciergeSession.findUnique({
        where: { id: sessionId },
        include: {
          service: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true } },
        },
      });
      if (
        !fullSession?.service ||
        !fullSession.unit ||
        !fullSession.slotLabel ||
        !fullSession.scheduledDateLabel ||
        !fullSession.scheduledFor
      ) {
        await sendAndTrack({
          sessionId,
          targetPhone: normalizedPhone,
          text: "Não foi possível recuperar os dados da sessão. Vamos reiniciar.",
          channel: "WHATSAPP",
        });
        await prisma.conciergeSession.update({
          where: { id: sessionId },
          data: {
            step: "SERVICE",
            serviceId: null,
            unitId: null,
            slotLabel: null,
            scheduledDateLabel: null,
            scheduledFor: null,
            customerName: null,
            lastInboundAt: new Date(),
          },
        });
        const categories = await loadCategorizedServicesCatalog();
        const prompt = categories.length
          ? openingServiceSelectionPrompt(
              categories,
              categoryFirstFlowEnabled,
              openingGreetingText,
              customerProfile?.name
            )
          : "Não encontrei serviços disponíveis no momento.";
        await sendAndTrack({
          sessionId,
          targetPhone: normalizedPhone,
          text: prompt,
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId, reason: "session_restarted" };
      }

      const selectedDate = resolveSessionDateOption(catalog, fullSession.scheduledDateLabel);
      if (!selectedDate) {
        await prisma.conciergeSession.update({
          where: { id: sessionId },
          data: {
            step: "DATE",
            slotLabel: null,
            scheduledFor: null,
            customerName: null,
            lastInboundAt: new Date(),
          },
        });
        await sendAndTrack({
          sessionId,
          targetPhone: normalizedPhone,
          text: "Não consegui validar a data atual. Vamos escolher novamente.",
          channel: "WHATSAPP",
        });
        await sendAndTrack({
          sessionId,
          targetPhone: normalizedPhone,
          text: datePrompt(catalog.scheduleDates),
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId, reason: "date_missing" };
      }

      const selectedProfessionalState = decodeProfessionalState(fullSession.customerName);
      const preferredProfessionalId =
        typeof selectedProfessionalState === "number" ? selectedProfessionalState : undefined;
      const created = await createRemoteAppointment({
        unitId: fullSession.unit.id,
        serviceId: fullSession.service.id,
        dateIso: selectedDate.isoDate,
        slotLabel: fullSession.slotLabel,
        preferredProfessionalId,
        strictPreferredProfessional: typeof selectedProfessionalState === "number",
        clientName: customerName,
        clientPhone: normalizedPhone,
      });

      if (!created.ok) {
        await prisma.conciergeSession.update({
          where: { id: sessionId },
          data: {
            step: "SLOT",
            slotLabel: null,
            scheduledFor: null,
            customerName: null,
            lastInboundAt: new Date(),
          },
        });
        await sendAndTrack({
          sessionId,
          targetPhone: normalizedPhone,
          text: "Esse horário não está mais disponível. Vamos escolher novamente.",
          channel: "WHATSAPP",
        });
        const periods = toPeriodChoices(
          await listPublicPeriodsForService({
            unitId: fullSession.unit.id,
            dateIso: selectedDate.isoDate,
            serviceId: fullSession.service.id,
          })
        );
        if (periods.length) {
          await sendAndTrack({
            sessionId,
            targetPhone: normalizedPhone,
            text: periodPrompt(periods),
            channel: "WHATSAPP",
          });
        } else {
          await sendAndTrack({
            sessionId,
            targetPhone: normalizedPhone,
            text: datePrompt(catalog.scheduleDates),
            channel: "WHATSAPP",
          });
        }
        return { ok: true, sessionId, reason: created.reason };
      }

      const assignedProfessional = await prisma.professional.findUnique({
        where: { id: created.appointment.professionalId },
        select: { name: true },
      });

      customerProfile = await upsertWhatsappCustomer({
        phone: normalizedPhone,
        name: customerName,
      });

      const finalizedAt = new Date();
      const summary = await buildSummary({
        serviceName: fullSession.service.name,
        unitName: fullSession.unit.name,
        scheduledDateLabel: fullSession.scheduledDateLabel,
        scheduledFor: created.appointment.start,
        slotLabel: fullSession.slotLabel,
        professionalName: assignedProfessional?.name || undefined,
        customerName,
        customerPhone: normalizedPhone,
        finalizedAt,
        origin: "WHATSAPP",
      });

      const recipients = Array.from(new Set([normalizedPhone, resolveSummaryPhone()]));
      let customerSummarySent = false;
      for (const recipient of recipients) {
        const sent = await sendAndTrackWithRetry(
          {
            sessionId,
            targetPhone: recipient,
            text: summary,
            channel: "WHATSAPP",
          },
          { retries: 1, retryDelayMs: 700 }
        );
        if (recipient === normalizedPhone) {
          customerSummarySent = sent;
        }
        await delay(250);
      }

      if (!customerSummarySent) {
        const fallbackSummary = buildCompactSummary({
          serviceName: fullSession.service.name,
          unitName: fullSession.unit.name,
          scheduledDateLabel: fullSession.scheduledDateLabel,
          slotLabel: fullSession.slotLabel,
          professionalName: assignedProfessional?.name || undefined,
        });
        await sendAndTrackWithRetry(
          {
            sessionId,
            targetPhone: normalizedPhone,
            text: fallbackSummary,
            channel: "WHATSAPP",
          },
          { retries: 2, retryDelayMs: 900 }
        );
      }

      await sendAndTrackWithRetry({
        sessionId,
        targetPhone: normalizedPhone,
        text: completionGreetingText || completionAckPrompt,
        channel: "WHATSAPP",
      });

      await prisma.conciergeSession.update({
        where: { id: sessionId },
        data: {
          customerName,
          scheduledDateLabel: fullSession.scheduledDateLabel,
          scheduledFor: created.appointment.start,
          summaryText: summary,
          status: "COMPLETED",
          step: "COMPLETED",
          completedAt: finalizedAt,
          summarySentAt: finalizedAt,
          lastInboundAt: finalizedAt,
        },
      });
      return { ok: true, sessionId };
    };

    if (isNew) {
      const categories = await loadCategorizedServicesCatalog();
      const missingField = getNextMissingCustomerField(customerProfile);
      if (missingField) {
        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            slotLabel: encodeCustomerProfileState(missingField),
            serviceId: null,
            unitId: null,
            scheduledDateLabel: null,
            scheduledFor: null,
            customerName: null,
            step: "SERVICE",
            lastInboundAt: new Date(),
          },
        });
        const prompt = buildCustomerProfileFieldPrompt(
          missingField,
          customerProfile?.name,
          openingGreetingText
        );
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: prompt,
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id };
      }
      const prompt = categories.length
        ? openingServiceSelectionPrompt(
            categories,
            categoryFirstFlowEnabled,
            openingGreetingText,
            customerProfile?.name
          )
        : "Não encontrei serviços disponíveis no momento.";
      await sendAndTrack({
        sessionId: session.id,
        targetPhone: normalizedPhone,
        text: prompt,
        channel: "WHATSAPP",
      });
      return { ok: true, sessionId: session.id };
    }

    if (session.step === "SERVICE") {
      const categories = await loadCategorizedServicesCatalog();
      if (!categories.length) {
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: "Não encontrei serviços disponíveis no momento.",
          channel: "WHATSAPP",
        });
        return { ok: false, sessionId: session.id, reason: "catalog_unavailable" };
      }

      const pendingProfileField = decodeCustomerProfileState(session.slotLabel);
      if (pendingProfileField) {
        if (!customerProfile) {
          customerProfile = await upsertWhatsappCustomer({
            phone: normalizedPhone,
            name: "Cliente WhatsApp",
          });
        }
        const parsedProfile = validateCustomerProfileFieldInput(pendingProfileField, cleanText);
        if (!parsedProfile.ok) {
          const retryPrompt = [
            parsedProfile.message,
            buildCustomerProfileFieldPrompt(
              pendingProfileField,
              customerProfile.name,
              openingGreetingText
            ),
          ].join("\n\n");
          await sendAndTrack({
            sessionId: session.id,
            targetPhone: normalizedPhone,
            text: retryPrompt,
            channel: "WHATSAPP",
          });
          return { ok: true, sessionId: session.id, reason: "invalid_profile_field" };
        }

        const profileUpdateData: {
          email?: string | null;
          city?: string | null;
          state?: string | null;
          neighborhood?: string | null;
          phone2?: string | null;
          phone2OptOut?: boolean;
        } = {};
        if (pendingProfileField === "phone2") {
          if (parsedProfile.data.skipOptionalPhone2) {
            profileUpdateData.phone2 = null;
            profileUpdateData.phone2OptOut = true;
          } else {
            profileUpdateData.phone2 = parsedProfile.data.value || null;
            profileUpdateData.phone2OptOut = false;
          }
        } else {
          profileUpdateData[pendingProfileField] = parsedProfile.data.value || null;
        }

        customerProfile = await prisma.customer.update({
          where: { id: customerProfile.id },
          data: profileUpdateData,
          select: {
            id: true,
            userId: true,
            name: true,
            phone: true,
            email: true,
            city: true,
            state: true,
            neighborhood: true,
            phone2: true,
            phone2OptOut: true,
            notes: true,
          },
        });

        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            slotLabel: null,
            serviceId: null,
            unitId: null,
            scheduledDateLabel: null,
            scheduledFor: null,
            customerName: null,
            step: "SERVICE",
            lastInboundAt: new Date(),
          },
        });

        const nextMissingField = getNextMissingCustomerField(customerProfile);
        if (nextMissingField) {
          await sendAndTrack({
            sessionId: session.id,
            targetPhone: normalizedPhone,
            text: [
              "Cadastro atualizado com sucesso.",
              "Vamos seguir com seu agendamento.",
              openingServiceSelectionPrompt(
                categories,
                categoryFirstFlowEnabled,
                openingGreetingText,
                customerProfile.name
              ),
            ].join("\n\n"),
            channel: "WHATSAPP",
          });
          return { ok: true, sessionId: session.id, reason: "profile_field_saved" };
        }

        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: [
            "Cadastro atualizado com sucesso.",
            openingServiceSelectionPrompt(
              categories,
              categoryFirstFlowEnabled,
              openingGreetingText,
              customerProfile.name
            ),
          ].join("\n\n"),
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id, reason: "profile_completed" };
      }

      if (!categoryFirstFlowEnabled) {
        const selectedService = findServiceByInput(categories, cleanText);
        if (!selectedService) {
          const retryPrompt = [
            "Não entendi o serviço selecionado.",
            serviceSelectionPrompt(categories, false),
          ].join("\n\n");
          await sendAndTrack({
            sessionId: session.id,
            targetPhone: normalizedPhone,
            text: retryPrompt,
            channel: "WHATSAPP",
          });
          return { ok: true, sessionId: session.id, reason: "invalid_service" };
        }

        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            serviceId: selectedService.id,
            unitId: null,
            scheduledDateLabel: null,
            scheduledFor: null,
            slotLabel: null,
            customerName: null,
            step: "UNIT",
            lastInboundAt: new Date(),
          },
        });
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: unitPrompt(catalog.units),
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id };
      }

      const pendingCategoryId = decodeCategoryState(session.slotLabel);
      if (!pendingCategoryId) {
        const selectedCategory = findCategoryByInput(categories, cleanText);
        if (!selectedCategory) {
          const retryPrompt = ["Não entendi a categoria selecionada.", serviceCategoryPrompt(categories)].join(
            "\n\n"
          );
          await sendAndTrack({
            sessionId: session.id,
            targetPhone: normalizedPhone,
            text: retryPrompt,
            channel: "WHATSAPP",
          });
          return { ok: true, sessionId: session.id, reason: "invalid_category" };
        }

        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            serviceId: null,
            unitId: null,
            scheduledDateLabel: null,
            scheduledFor: null,
            slotLabel: encodeCategoryState(selectedCategory.id),
            customerName: null,
            step: "SERVICE",
            lastInboundAt: new Date(),
          },
        });
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: servicesInCategoryPrompt(selectedCategory),
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id };
      }

      const selectedCategory = categories.find((category) => category.id === pendingCategoryId) || null;
      if (!selectedCategory) {
        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            slotLabel: null,
            serviceId: null,
            unitId: null,
            scheduledDateLabel: null,
            scheduledFor: null,
            customerName: null,
            step: "SERVICE",
            lastInboundAt: new Date(),
          },
        });
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: serviceCategoryPrompt(categories),
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id, reason: "category_missing" };
      }

      if (wantsBackToCategorySelection(cleanText)) {
        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            slotLabel: null,
            serviceId: null,
            unitId: null,
            scheduledDateLabel: null,
            scheduledFor: null,
            customerName: null,
            step: "SERVICE",
            lastInboundAt: new Date(),
          },
        });
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: serviceCategoryPrompt(categories),
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id, reason: "category_back" };
      }

      const selectedService = findServiceInCategoryByInput(selectedCategory, cleanText);
      if (!selectedService) {
        const retryPrompt = [
          "Não entendi o serviço selecionado.",
          servicesInCategoryPrompt(selectedCategory),
        ].join("\n\n");
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: retryPrompt,
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id, reason: "invalid_service" };
      }

      await prisma.conciergeSession.update({
        where: { id: session.id },
        data: {
          serviceId: selectedService.id,
          unitId: null,
          scheduledDateLabel: null,
          scheduledFor: null,
          slotLabel: null,
          customerName: null,
          step: "UNIT",
          lastInboundAt: new Date(),
        },
      });
      await sendAndTrack({
        sessionId: session.id,
        targetPhone: normalizedPhone,
        text: unitPrompt(catalog.units),
        channel: "WHATSAPP",
      });
      return { ok: true, sessionId: session.id };
    }

    if (session.step === "UNIT") {
      if (!session.serviceId) {
        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            step: "SERVICE",
            unitId: null,
            scheduledDateLabel: null,
            scheduledFor: null,
            slotLabel: null,
            customerName: null,
            lastInboundAt: new Date(),
          },
        });
        const categories = await loadCategorizedServicesCatalog();
        const prompt = categories.length
          ? openingServiceSelectionPrompt(
              categories,
              categoryFirstFlowEnabled,
              openingGreetingText,
              customerProfile?.name
            )
          : "Não encontrei serviços disponíveis no momento.";
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: prompt,
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id, reason: "service_missing" };
      }

      const selectedUnit = findUnitByInput(catalog, cleanText);
      if (!selectedUnit) {
        const retryPrompt = ["Não entendi a unidade selecionada.", unitPrompt(catalog.units)].join(
          "\n\n"
        );
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: retryPrompt,
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id, reason: "invalid_unit" };
      }
      await prisma.conciergeSession.update({
        where: { id: session.id },
        data: {
          unitId: selectedUnit.id,
          scheduledDateLabel: null,
          scheduledFor: null,
          slotLabel: null,
          customerName: null,
          step: "DATE",
          lastInboundAt: new Date(),
        },
      });
      await sendAndTrack({
        sessionId: session.id,
        targetPhone: normalizedPhone,
        text: datePrompt(catalog.scheduleDates),
        channel: "WHATSAPP",
      });
      return { ok: true, sessionId: session.id };
    }

    if (session.step === "DATE") {
      if (!session.serviceId) {
        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            step: "SERVICE",
            unitId: null,
            scheduledDateLabel: null,
            scheduledFor: null,
            slotLabel: null,
            customerName: null,
            lastInboundAt: new Date(),
          },
        });
        const categories = await loadCategorizedServicesCatalog();
        const prompt = categories.length
          ? openingServiceSelectionPrompt(
              categories,
              categoryFirstFlowEnabled,
              openingGreetingText,
              customerProfile?.name
            )
          : "Não encontrei serviços disponíveis no momento.";
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: prompt,
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id, reason: "service_missing" };
      }

      if (!session.unitId) {
        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            step: "UNIT",
            scheduledDateLabel: null,
            scheduledFor: null,
            slotLabel: null,
            customerName: null,
            lastInboundAt: new Date(),
          },
        });
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: unitPrompt(catalog.units),
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id, reason: "unit_missing" };
      }

      const selectedDate = findDateByInput(catalog, cleanText);
      if (!selectedDate) {
        const retryPrompt = ["Não entendi a data selecionada.", datePrompt(catalog.scheduleDates)].join(
          "\n\n"
        );
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: retryPrompt,
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id, reason: "invalid_date" };
      }

      const periods = toPeriodChoices(
        await listPublicPeriodsForService({
          unitId: session.unitId,
          dateIso: selectedDate.isoDate,
          serviceId: session.serviceId,
        })
      );
      if (!periods.length) {
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: "Não encontrei disponibilidade desse serviço nessa data. Escolha outra data.",
          channel: "WHATSAPP",
        });
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: datePrompt(catalog.scheduleDates),
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id, reason: "no_periods_for_date" };
      }

      await prisma.conciergeSession.update({
        where: { id: session.id },
        data: {
          scheduledDateLabel: selectedDate.label,
          scheduledFor: null,
          slotLabel: null,
          customerName: null,
          step: "SLOT",
          lastInboundAt: new Date(),
        },
      });
      await sendAndTrack({
        sessionId: session.id,
        targetPhone: normalizedPhone,
        text: periodPrompt(periods),
        channel: "WHATSAPP",
      });
      return { ok: true, sessionId: session.id };
    }

    if (session.step === "SLOT") {
      if (!session.serviceId) {
        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            step: "SERVICE",
            unitId: null,
            slotLabel: null,
            scheduledDateLabel: null,
            scheduledFor: null,
            customerName: null,
            lastInboundAt: new Date(),
          },
        });
        const categories = await loadCategorizedServicesCatalog();
        const prompt = categories.length
          ? openingServiceSelectionPrompt(
              categories,
              categoryFirstFlowEnabled,
              openingGreetingText,
              customerProfile?.name
            )
          : "Não encontrei serviços disponíveis no momento.";
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: prompt,
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id, reason: "service_missing" };
      }

      if (!session.unitId) {
        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            step: "UNIT",
            slotLabel: null,
            scheduledDateLabel: null,
            scheduledFor: null,
            customerName: null,
            lastInboundAt: new Date(),
          },
        });
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: unitPrompt(catalog.units),
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id, reason: "unit_missing" };
      }

      const selectedDate = resolveSessionDateOption(catalog, session.scheduledDateLabel);
      if (!selectedDate) {
        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            step: "DATE",
            slotLabel: null,
            customerName: null,
            lastInboundAt: new Date(),
          },
        });
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: datePrompt(catalog.scheduleDates),
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id, reason: "date_missing" };
      }

      const periods = toPeriodChoices(
        await listPublicPeriodsForService({
          unitId: session.unitId,
          dateIso: selectedDate.isoDate,
          serviceId: session.serviceId,
        })
      );
      if (!periods.length) {
        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            step: "DATE",
            slotLabel: null,
            customerName: null,
            lastInboundAt: new Date(),
          },
        });
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: "Não há períodos com vagas para esse serviço nessa data. Vamos escolher outra data.",
          channel: "WHATSAPP",
        });
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: datePrompt(catalog.scheduleDates),
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id, reason: "no_periods_for_date" };
      }

      const pendingPeriod = decodePeriodState(session.slotLabel);
      if (!pendingPeriod) {
        const selectedPeriod = findPeriodByInput(periods, cleanText);
        if (!selectedPeriod) {
          const retryPrompt = ["Não entendi o período selecionado.", periodPrompt(periods)].join("\n\n");
          await sendAndTrack({
            sessionId: session.id,
            targetPhone: normalizedPhone,
            text: retryPrompt,
            channel: "WHATSAPP",
          });
          return { ok: true, sessionId: session.id, reason: "invalid_period" };
        }

        const slots = toSlotChoices(
          await listPublicSlotsForService({
            unitId: session.unitId,
            dateIso: selectedDate.isoDate,
            serviceId: session.serviceId,
            period: selectedPeriod.key,
          })
        );
        if (!slots.length) {
          await sendAndTrack({
            sessionId: session.id,
            targetPhone: normalizedPhone,
            text: "Esse período ficou sem vagas. Escolha outro período.",
            channel: "WHATSAPP",
          });
          await sendAndTrack({
            sessionId: session.id,
            targetPhone: normalizedPhone,
            text: periodPrompt(periods),
            channel: "WHATSAPP",
          });
          return { ok: true, sessionId: session.id, reason: "period_without_slots" };
        }

        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            slotLabel: encodePeriodState(selectedPeriod.key),
            scheduledFor: null,
            customerName: null,
            lastInboundAt: new Date(),
          },
        });
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: slotPrompt(slots, selectedPeriod.label),
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id };
      }

      const selectedPeriod = periods.find((period) => period.key === pendingPeriod) || null;
      if (!selectedPeriod) {
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: "Esse período não está mais disponível. Vamos selecionar o período novamente.",
          channel: "WHATSAPP",
        });
        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            slotLabel: null,
            customerName: null,
            lastInboundAt: new Date(),
          },
        });
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: periodPrompt(periods),
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id, reason: "period_expired" };
      }

      const slots = toSlotChoices(
        await listPublicSlotsForService({
          unitId: session.unitId,
          dateIso: selectedDate.isoDate,
          serviceId: session.serviceId,
          period: selectedPeriod.key,
        })
      );
      if (!slots.length) {
        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            slotLabel: null,
            customerName: null,
            lastInboundAt: new Date(),
          },
        });
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: "Esse período ficou sem vagas. Escolha outro período.",
          channel: "WHATSAPP",
        });
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: periodPrompt(periods),
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id, reason: "slots_unavailable" };
      }

      const selectedSlot = findSlotByInput(slots, cleanText);
      if (!selectedSlot) {
        const retryPrompt = ["Não entendi o horário selecionado.", slotPrompt(slots, selectedPeriod.label)].join(
          "\n\n"
        );
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: retryPrompt,
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id, reason: "invalid_slot" };
      }

      const scheduledFor = combineDateAndSlot(selectedDate.isoDate, selectedSlot.slotLabel);
      if (!scheduledFor) {
        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            slotLabel: null,
            step: "DATE",
            lastInboundAt: new Date(),
          },
        });
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: "Não foi possível validar data e horário. Vamos escolher a data novamente.",
          channel: "WHATSAPP",
        });
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: datePrompt(catalog.scheduleDates),
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id, reason: "invalid_schedule" };
      }

      await prisma.conciergeSession.update({
        where: { id: session.id },
        data: {
          slotLabel: selectedSlot.slotLabel,
          scheduledFor,
          lastInboundAt: new Date(),
        },
      });

      const availableProfessionals = await listAvailableProfessionalsForSlot({
        unitId: session.unitId,
        dateIso: selectedDate.isoDate,
        serviceId: session.serviceId,
        slotLabel: selectedSlot.slotLabel,
      });
      if (!availableProfessionals.length) {
        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            slotLabel: encodePeriodState(selectedPeriod.key),
            scheduledFor: null,
            customerName: null,
            step: "SLOT",
            lastInboundAt: new Date(),
          },
        });
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: "Esse horário não está mais disponível. Escolha outro horário.",
          channel: "WHATSAPP",
        });
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: slotPrompt(slots, selectedPeriod.label),
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id, reason: "slot_unavailable" };
      }

      if (availableProfessionals.length > 1) {
        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            customerName: PROFESSIONAL_SELECTION_PENDING,
            step: "NAME",
            lastInboundAt: new Date(),
          },
        });
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: professionalPrompt(availableProfessionals),
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id };
      }

      await prisma.conciergeSession.update({
        where: { id: session.id },
        data: {
          customerName: encodeProfessionalState(availableProfessionals[0].id),
          step: "NAME",
          lastInboundAt: new Date(),
        },
      });
      const knownCustomerName = getKnownCustomerName();
      if (knownCustomerName) {
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: `Perfeito. Vou usar seu nome cadastrado: ${knownCustomerName}.`,
          channel: "WHATSAPP",
        });
        return finalizeWithCustomerName(session.id, knownCustomerName);
      }
      await sendAndTrack({
        sessionId: session.id,
        targetPhone: normalizedPhone,
        text: askNamePrompt,
        channel: "WHATSAPP",
      });
      return { ok: true, sessionId: session.id };
    }

    if (session.step === "NAME") {
      const fullSession = await prisma.conciergeSession.findUnique({
        where: { id: session.id },
        include: {
          service: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true } },
        },
      });
      if (
        !fullSession?.service ||
        !fullSession.unit ||
        !fullSession.slotLabel ||
        !fullSession.scheduledDateLabel ||
        !fullSession.scheduledFor
      ) {
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: "Não foi possível recuperar os dados da sessão. Vamos reiniciar.",
          channel: "WHATSAPP",
        });
        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            step: "SERVICE",
            serviceId: null,
            unitId: null,
            slotLabel: null,
            scheduledDateLabel: null,
            scheduledFor: null,
            customerName: null,
            lastInboundAt: new Date(),
          },
        });
        const categories = await loadCategorizedServicesCatalog();
        const prompt = categories.length
          ? openingServiceSelectionPrompt(
              categories,
              categoryFirstFlowEnabled,
              openingGreetingText,
              customerProfile?.name
            )
          : "Não encontrei serviços disponíveis no momento.";
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: prompt,
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id, reason: "session_restarted" };
      }

      const selectedDate = resolveSessionDateOption(catalog, fullSession.scheduledDateLabel);
      if (!selectedDate) {
        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            step: "DATE",
            slotLabel: null,
            scheduledFor: null,
            customerName: null,
            lastInboundAt: new Date(),
          },
        });
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: "Não consegui validar a data atual. Vamos escolher novamente.",
          channel: "WHATSAPP",
        });
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: datePrompt(catalog.scheduleDates),
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id, reason: "date_missing" };
      }

      if (fullSession.customerName === PROFESSIONAL_SELECTION_PENDING) {
        const professionals = await listAvailableProfessionalsForSlot({
          unitId: fullSession.unit.id,
          dateIso: selectedDate.isoDate,
          serviceId: fullSession.service.id,
          slotLabel: fullSession.slotLabel,
        });

        if (!professionals.length) {
          await prisma.conciergeSession.update({
            where: { id: session.id },
            data: {
              step: "SLOT",
              slotLabel: null,
              scheduledFor: null,
              customerName: null,
              lastInboundAt: new Date(),
            },
          });
          await sendAndTrack({
            sessionId: session.id,
            targetPhone: normalizedPhone,
            text: "Não há profissionais disponíveis nesse horário. Vamos escolher novamente o período.",
            channel: "WHATSAPP",
          });
          const periods = toPeriodChoices(
            await listPublicPeriodsForService({
              unitId: fullSession.unit.id,
              dateIso: selectedDate.isoDate,
              serviceId: fullSession.service.id,
            })
          );
          if (periods.length) {
            await sendAndTrack({
              sessionId: session.id,
              targetPhone: normalizedPhone,
              text: periodPrompt(periods),
              channel: "WHATSAPP",
            });
          } else {
            await sendAndTrack({
              sessionId: session.id,
              targetPhone: normalizedPhone,
              text: datePrompt(catalog.scheduleDates),
              channel: "WHATSAPP",
            });
          }
          return { ok: true, sessionId: session.id, reason: "professional_unavailable" };
        }

        if (professionals.length === 1) {
          await prisma.conciergeSession.update({
            where: { id: session.id },
            data: {
              customerName: encodeProfessionalState(professionals[0].id),
              lastInboundAt: new Date(),
            },
          });
          const knownCustomerName = getKnownCustomerName();
          if (knownCustomerName) {
            await sendAndTrack({
              sessionId: session.id,
              targetPhone: normalizedPhone,
              text: `Perfeito. Vou usar seu nome cadastrado: ${knownCustomerName}.`,
              channel: "WHATSAPP",
            });
            return finalizeWithCustomerName(session.id, knownCustomerName);
          }
          await sendAndTrack({
            sessionId: session.id,
            targetPhone: normalizedPhone,
            text: askNamePrompt,
            channel: "WHATSAPP",
          });
          return { ok: true, sessionId: session.id };
        }

        const selectedProfessional = findProfessionalByInput(professionals, cleanText);
        if (!selectedProfessional) {
          const retryPrompt = [
            "Não entendi o profissional selecionado.",
            professionalPrompt(professionals),
          ].join("\n\n");
          await sendAndTrack({
            sessionId: session.id,
            targetPhone: normalizedPhone,
            text: retryPrompt,
            channel: "WHATSAPP",
          });
          return { ok: true, sessionId: session.id, reason: "invalid_professional" };
        }

        await prisma.conciergeSession.update({
          where: { id: session.id },
          data: {
            customerName: encodeProfessionalState(selectedProfessional.preferredProfessionalId),
            lastInboundAt: new Date(),
          },
        });
        const knownCustomerName = getKnownCustomerName();
        if (knownCustomerName) {
          await sendAndTrack({
            sessionId: session.id,
            targetPhone: normalizedPhone,
            text: `Perfeito. Vou usar seu nome cadastrado: ${knownCustomerName}.`,
            channel: "WHATSAPP",
          });
          return finalizeWithCustomerName(session.id, knownCustomerName);
        }
        await sendAndTrack({
          sessionId: session.id,
          targetPhone: normalizedPhone,
          text: askNamePrompt,
          channel: "WHATSAPP",
        });
        return { ok: true, sessionId: session.id };
      }

      const knownCustomerName = getKnownCustomerName();
      if (knownCustomerName) {
        return finalizeWithCustomerName(session.id, knownCustomerName);
      }
      return finalizeWithCustomerName(session.id, cleanText);
    }

    await prisma.conciergeSession.update({
      where: { id: session.id },
      data: {
        status: "CANCELLED",
      },
    });
    const restarted = await prisma.conciergeSession.create({
      data: {
        origin: "WHATSAPP",
        phone: normalizedPhone,
        status: "ACTIVE",
        step: "SERVICE",
        lastInboundAt: new Date(),
      },
      select: { id: true },
    });
    const restartMissingField = getNextMissingCustomerField(customerProfile);
    if (restartMissingField) {
      await prisma.conciergeSession.update({
        where: { id: restarted.id },
        data: {
          slotLabel: encodeCustomerProfileState(restartMissingField),
          step: "SERVICE",
          lastInboundAt: new Date(),
        },
      });
      await sendAndTrack({
        sessionId: restarted.id,
        targetPhone: normalizedPhone,
        text: buildCustomerProfileFieldPrompt(
          restartMissingField,
          customerProfile?.name,
          openingGreetingText
        ),
        channel: "WHATSAPP",
      });
      return { ok: true, sessionId: restarted.id, reason: "profile_field_required" };
    }
    const categories = await loadCategorizedServicesCatalog();
    const restartPrompt = categories.length
      ? openingServiceSelectionPrompt(
          categories,
          categoryFirstFlowEnabled,
          openingGreetingText,
          customerProfile?.name
        )
      : "Não encontrei serviços disponíveis no momento.";
    await sendAndTrack({
      sessionId: restarted.id,
      targetPhone: normalizedPhone,
      text: restartPrompt,
      channel: "WHATSAPP",
    });
    return { ok: true, sessionId: restarted.id, reason: "new_session_started" };
  } catch (error) {
    logSessionError("Falha ao processar inbound do concierge via WhatsApp", error);
    return { ok: false, reason: "processing_error" };
  }
};

export const completeWebConciergeSession = async (
  input: CompleteWebSessionInput
): Promise<{ success: boolean; summary?: string; detail?: string }> => {
  const catalog = await getConciergeCatalog();
  if (!catalog.services.length || !catalog.units.length) {
    return { success: false, detail: "catalog_unavailable" };
  }

  const normalizedPhone = sanitizePhone(input.customerPhone);
  if (!normalizedPhone) {
    return { success: false, detail: "invalid_phone" };
  }

  const service =
    catalog.services.find((item) => item.id === input.serviceId) ||
    catalog.services.find(
      (item) => item.name.trim().toLowerCase() === (input.serviceName || "").trim().toLowerCase()
    );
  if (!service) {
    return { success: false, detail: "service_not_found" };
  }

  const unit =
    catalog.units.find((item) => item.id === input.unitId) ||
    catalog.units.find(
      (item) => item.name.trim().toLowerCase() === (input.unitName || "").trim().toLowerCase()
    );
  if (!unit) {
    return { success: false, detail: "unit_not_found" };
  }

  const slotLabel = input.slotLabel.trim();
  if (!catalog.slots.includes(slotLabel)) {
    return { success: false, detail: "invalid_slot" };
  }

  const scheduledForInput = (input.scheduledFor || "").trim();
  if (!scheduledForInput) {
    return { success: false, detail: "missing_schedule" };
  }
  const scheduledFor = new Date(scheduledForInput);
  if (Number.isNaN(scheduledFor.getTime())) {
    return { success: false, detail: "invalid_schedule" };
  }

  const scheduledDateLabel =
    (input.scheduledDateLabel || "").trim() ||
    scheduledFor.toLocaleDateString("pt-BR", {
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  const customerName = input.customerName.trim().slice(0, 120);
  if (!customerName) {
    return { success: false, detail: "invalid_name" };
  }

  const finalizedAt = new Date();
  const summary = await buildSummary({
    serviceName: service.name,
    unitName: unit.name,
    scheduledDateLabel,
    scheduledFor,
    slotLabel,
    customerName,
    customerPhone: normalizedPhone,
    finalizedAt,
    origin: "WEB",
  });

  try {
    const created = await prisma.conciergeSession.create({
      data: {
        origin: "WEB",
        phone: normalizedPhone,
        status: "COMPLETED",
        step: "COMPLETED",
        serviceId: service.id,
        unitId: unit.id,
        slotLabel,
        scheduledDateLabel,
        scheduledFor,
        customerName,
        summaryText: summary,
        completedAt: finalizedAt,
        summarySentAt: finalizedAt,
        lastInboundAt: finalizedAt,
      },
      select: { id: true },
    });

    await appendEvent({
      sessionId: created.id,
      direction: "SYSTEM",
      channel: "WEB",
      phone: normalizedPhone,
      text: "Sessão finalizada via site.",
    });

    const recipients = Array.from(new Set([resolveSummaryPhone(), normalizedPhone]));
    for (const recipient of recipients) {
      await sendAndTrack({
        sessionId: created.id,
        targetPhone: recipient,
        text: summary,
        channel: "WEB",
      });
    }

    return { success: true, summary };
  } catch (error) {
    logSessionError("Falha ao completar sessao concierge iniciada no site", error);
    return { success: false, detail: "complete_failed" };
  }
};
