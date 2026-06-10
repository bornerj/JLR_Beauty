import { Prisma, type FulfillmentStatus, type OrderStatus, type PaymentStatus } from "@prisma/client";
import fs from "fs";
import path from "path";
import multer from "multer";
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { hashPassword, isStrongPassword, signToken, verifyPassword } from "../lib/auth";
import {
  listConciergeInboundMessages,
  pushConciergeInboundMessage,
} from "../modules/chatbot/inbox/conciergeInbox";
import {
  createRemoteAppointment,
  listAvailableProfessionalsForSlot,
  listPublicConciergeContext,
  listPublicServiceCatalogByCategory,
  listPublicPeriodsForService,
  listPublicServicesByCategory,
  listPublicSlotsForService,
} from "../lib/appointmentAvailability";
import {
  completeWebConciergeSession,
  getConciergeOptions,
  processWhatsappConciergeInbound,
  upsertConciergeCustomerByPhone,
} from "../modules/chatbot/flow/conciergeFlow";
import {
  getAdminDashboardAgendaSummary,
  getAdminDashboardCommissionsSummary,
  getAdminDashboardKpis,
  getAdminDashboardSalesSeries,
} from "../modules/admin/kpis";
import {
  brandingPayloadSchema,
  getPublicBranding,
  invalidatePublicBrandingCache,
  PUBLIC_BRANDING_SETTING_KEY,
  savePublicBranding,
} from "../modules/branding/service";
import {
  getPublicMediaSlotCatalog,
  getPublicMediaSlots,
  invalidatePublicMediaSlotsCache,
  mediaSlotsPayloadSchema,
  PUBLIC_MEDIA_SLOTS_SETTING_KEY,
  savePublicMediaSlots,
} from "../modules/mediaSlots/service";
import {
  assertStripeEnabled,
  constructStripeWebhookEvent,
  createPublicStripeCheckoutSession,
  retrieveStripeCheckoutSession,
} from "../modules/payments/stripe";
import { MSG } from "../lib/messages";
import {
  getDefaultZApiTargetPhone,
  isZApiConfigured,
  sendZApiTextMessage,
} from "../modules/chatbot/integrations/zapi";
import { requireAuth, requireAdmin, type AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";
import { logger } from "../utils/logger";

const router = Router();

type LoginAttemptState = {
  failures: number;
  windowStartedAt: number;
  blockedUntil: number;
  lastSeenAt: number;
};

const loginAttemptWindowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const loginAttemptMaxFailures = Number(process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS || 8);
const loginAttemptBlockMs = Number(process.env.AUTH_RATE_LIMIT_BLOCK_MS || 15 * 60 * 1000);
const loginAttemptStore = new Map<string, LoginAttemptState>();

const getClientIp = (req: Request): string => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  if (Array.isArray(forwardedFor) && forwardedFor.length) {
    const first = forwardedFor[0]?.trim();
    if (first) return first;
  }
  return req.ip || "unknown-ip";
};

const normalizeIdentifierForRateLimit = (identifier: string): string => {
  const normalized = identifier.trim().toLowerCase();
  return normalized || "unknown-identifier";
};

const buildLoginAttemptKey = (req: Request, identifier: string): string => {
  return `${getClientIp(req)}::${normalizeIdentifierForRateLimit(identifier)}`;
};

const cleanupLoginAttemptStore = (now: number): void => {
  for (const [key, state] of loginAttemptStore.entries()) {
    const idleTime = now - state.lastSeenAt;
    if (idleTime > loginAttemptWindowMs * 4 && state.blockedUntil <= now) {
      loginAttemptStore.delete(key);
    }
  }
};

const checkLoginAttemptBlock = (
  req: Request,
  identifier: string
): { blocked: boolean; retryAfterSeconds: number } => {
  const now = Date.now();
  cleanupLoginAttemptStore(now);
  const key = buildLoginAttemptKey(req, identifier);
  const state = loginAttemptStore.get(key);
  if (!state) return { blocked: false, retryAfterSeconds: 0 };
  state.lastSeenAt = now;
  if (state.blockedUntil > now) {
    return {
      blocked: true,
      retryAfterSeconds: Math.max(1, Math.ceil((state.blockedUntil - now) / 1000)),
    };
  }
  if (now - state.windowStartedAt > loginAttemptWindowMs) {
    loginAttemptStore.delete(key);
  }
  return { blocked: false, retryAfterSeconds: 0 };
};

const registerFailedLoginAttempt = (req: Request, identifier: string): void => {
  const now = Date.now();
  const key = buildLoginAttemptKey(req, identifier);
  const current = loginAttemptStore.get(key);
  if (!current || now - current.windowStartedAt > loginAttemptWindowMs) {
    loginAttemptStore.set(key, {
      failures: 1,
      windowStartedAt: now,
      blockedUntil: 0,
      lastSeenAt: now,
    });
    return;
  }

  const nextFailures = current.failures + 1;
  const shouldBlock = nextFailures >= loginAttemptMaxFailures;
  loginAttemptStore.set(key, {
    failures: nextFailures,
    windowStartedAt: current.windowStartedAt,
    blockedUntil: shouldBlock ? now + loginAttemptBlockMs : 0,
    lastSeenAt: now,
  });
};

const clearFailedLoginAttempts = (req: Request, identifier: string): void => {
  const key = buildLoginAttemptKey(req, identifier);
  loginAttemptStore.delete(key);
};

const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      const base = path
        .basename(file.originalname || "upload", ext)
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${base || "upload"}-${unique}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("tipo de arquivo inválido"));
      return;
    }
    cb(null, true);
  },
});

const withDetail = (detail?: string) => {
  return process.env.NODE_ENV === "development" && detail ? { detail } : {};
};

const parseOptionalDate = (value?: string | null): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value.trim() === "") return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
};

const parseIsoDateStart = (value: string): Date | null => {
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  const parsed = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const addDays = (value: Date, days: number): Date => {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
};

const clockToMinutes = (value: string): number | null => {
  const matched = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!matched) return null;
  const hour = Number(matched[1]);
  const minute = Number(matched[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
};

const fieldLabels: Record<string, string> = {
  identifier: "e-mail/usuário",
  password: "senha",
  name: "nome",
  email: "email",
  price: "preço",
  durationMin: "duração",
  title: "título",
  benefits: "benefícios",
  total: "total",
  items: "itens",
  quantity: "quantidade",
  unitPrice: "preço unitário",
  cost: "custo",
  customerName: "nome do cliente",
  customerEmail: "email do cliente",
  customerPhone: "telefone/WhatsApp do cliente",
  unitId: "unidade",
  professionalId: "profissional",
  serviceId: "serviço",
  orderId: "pedido",
  start: "início",
  end: "fim",
  clientName: "nome do cliente",
  clientPhone: "telefone/WhatsApp do cliente",
  phone: "telefone/WhatsApp",
  phone2: "telefone/WhatsApp 2",
  city: "cidade",
  neighborhood: "bairro",
  avatarUrl: "imagem/avatar",
  status: "status",
  emailVerified: "email verificado",
  rating: "avaliacao",
  role: "tipo",
  sku: "sku",
  stock: "estoque",
  productCategoryId: "categoria do produto",
  serviceCategoryId: "categoria do servico",
  productStatusId: "status do produto",
  serviceStatusId: "status do servico",
  commissionPercent: "comissao",
  isFeatured: "destaque",
  discountType: "tipo de desconto",
  percentOff: "percentual de desconto",
  amountOff: "valor de desconto",
  minSubtotal: "subtotal minimo",
  startsAt: "inicio de validade",
  endsAt: "fim de validade",
  isActive: "ativo",
  code: "codigo",
  subtotal: "subtotal",
  scheduledFor: "data e hora agendada",
  scheduledDateLabel: "data do agendamento",
  date: "data",
  slotLabel: "horario",
  period: "periodo",
  requestedServiceName: "servico solicitado",
  requestedDate: "data solicitada",
  hourStart: "horario inicial",
  hourFinish: "horario final",
  workDate: "data da escala",
  professionalUserId: "usuario profissional",
  workProfileId: "perfil de trabalho",
  canScheduleAppointments: "pode realizar agendamentos",
  canAccessOtherProfessionalsAgenda: "acesso a agenda de outros profissionais",
  canViewServiceValues: "visualizar valores de servicos",
  canViewCustomerContact: "visualizar contato do cliente",
  canAccessMenuClientsAnamnese: "acesso menu clientes/anamnese",
  canAccessMenuServices: "acesso menu servicos",
  canAccessMenuProducts: "acesso menu produtos",
  canAccessMenuExpenses: "acesso menu despesas",
  canViewCommissionsToReceive: "visualizar comissoes a receber",
  canViewCommissionPayments: "visualizar pagamentos de comissao",
  canEditAppointments: "editar agendamentos",
  canDeleteAppointments: "deletar agendamentos",
  canCreateServiceInAppointment: "criar servico no agendamento",
  canViewGrossCommissionsToPay: "ver total bruto em comissoes a pagar",
};

const translateZodMessage = (message: string) => {
  const lower = message.toLowerCase();
  if (lower.includes("required")) return "campo obrigatório";
  if (lower.includes("invalid email") || lower.includes("email")) return "email inválido";
  if (lower.includes("at least") || lower.includes("greater than or equal"))
    return "valor inválido";
  if (lower.includes("number")) return "deve ser um número válido";
  if (lower.includes("string")) return "deve ser um texto válido";
  if (lower.includes("array")) return "lista inválida";
  return message;
};

const urlOrPathSchema = z.string().refine(
  (value) => value.startsWith("/") || /^https?:\/\//.test(value),
  "url inválida"
);

type ZodIssueLike = {
  path: ReadonlyArray<PropertyKey>;
  message: string;
};

const formatZodDetail = (issues: ReadonlyArray<ZodIssueLike>) => {
  if (!issues.length) return undefined;
  return issues
    .map((issue) => {
      const fieldPath = issue.path.length ? issue.path.map(String).join(".") : "corpo";
      const fieldKey = issue.path.length ? String(issue.path[0]) : "corpo";
      const label = fieldLabels[fieldKey] || fieldPath;
      return `${label}: ${translateZodMessage(issue.message)}`;
    })
    .join("; ");
};

const authSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(8),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const userCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["MASTER", "ADMIN", "MANAGER", "PROFESSIONAL", "CLIENT"]).optional(),
  phone: z.string().optional(),
  phone2: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  avatarUrl: urlOrPathSchema.optional(),
  status: z.enum(["ATIVO", "INATIVO", "SUSPENSO", "CANCELADO"]).optional(),
  emailVerified: z.coerce.boolean().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["MASTER", "ADMIN", "MANAGER", "PROFESSIONAL", "CLIENT"]).optional(),
  phone: z.string().optional(),
  phone2: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  avatarUrl: urlOrPathSchema.optional(),
  status: z.enum(["ATIVO", "INATIVO", "SUSPENSO", "CANCELADO"]).optional(),
  emailVerified: z.coerce.boolean().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

const roleSchema = z.object({
  role: z.enum(["MASTER", "ADMIN", "MANAGER", "PROFESSIONAL", "CLIENT"]),
});

type SectionToggleMap = Record<string, Record<string, boolean>>;

const sectionToggleMapSchema = z.record(z.string(), z.record(z.string(), z.boolean()));
const sectionTogglesPayloadSchema = z.object({
  toggles: sectionToggleMapSchema,
});

const SECTION_TOGGLES_EDITOR_EMAIL = "jeiel.borner@gmail.com";
const PUBLIC_SECTION_TOGGLES_SETTING_KEY = "public.sectionToggles";
const DEFAULT_PUBLIC_SECTION_TOGGLES: SectionToggleMap = {
  assinaturas: {
    about: false,
    hero: true,
    membership: true,
    testimonials: false,
  },
  franquias: {
    contact: true,
    hero: true,
    models: true,
    vision: true,
  },
  home: {
    about: true,
    cta: true,
    hero: true,
    membership: false,
    products: true,
    services: true,
    testimonials: true,
  },
};

const cloneSectionToggleMap = (value: SectionToggleMap): SectionToggleMap => {
  return Object.entries(value).reduce<SectionToggleMap>((acc, [page, sections]) => {
    acc[page] = Object.entries(sections).reduce<Record<string, boolean>>((inner, [section, enabled]) => {
      inner[section] = Boolean(enabled);
      return inner;
    }, {});
    return acc;
  }, {});
};
const getSectionTogglesFileCandidates = (): string[] => {
  const candidates = [
    path.resolve(process.cwd(), "..", "web", "src", "modules", "public-site", "sectionToggles.ts"),
    path.resolve(process.cwd(), "apps", "web", "src", "modules", "public-site", "sectionToggles.ts"),
    path.resolve(__dirname, "..", "..", "..", "web", "src", "modules", "public-site", "sectionToggles.ts"),
    path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "apps",
      "web",
      "src",
      "modules",
      "public-site",
      "sectionToggles.ts"
    ),
  ];
  return Array.from(new Set(candidates));
};

const resolveSectionTogglesFilePath = (): { filePath: string; testedPaths: string[] } => {
  const testedPaths = getSectionTogglesFileCandidates();
  const filePath = testedPaths.find((candidate) => fs.existsSync(candidate));
  if (!filePath) {
    throw new Error(`arquivo sectionToggles.ts nao encontrado; paths testados: ${testedPaths.join(" | ")}`);
  }
  return { filePath, testedPaths };
};

const parseSectionTogglesFromSource = (source: string): SectionToggleMap => {
  const match = source.match(/export const publicSectionToggles = (\{[\s\S]*?\}) as const;/m);
  if (!match) {
    throw new Error("declaracao publicSectionToggles nao encontrada");
  }
  const objectLiteral = match[1];
  const parsed = Function(`"use strict"; return (${objectLiteral});`)() as unknown;
  return sectionToggleMapSchema.parse(parsed);
};

const buildSectionToggleLiteral = (toggles: SectionToggleMap): string => {
  const json = JSON.stringify(toggles, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};

const readSectionTogglesFile = (): { filePath: string; source: string; toggles: SectionToggleMap } => {
  const { filePath } = resolveSectionTogglesFilePath();
  const source = fs.readFileSync(filePath, "utf8");
  const toggles = parseSectionTogglesFromSource(source);
  return { filePath, source, toggles };
};

const writeSectionTogglesFile = (
  filePath: string,
  source: string,
  toggles: SectionToggleMap
): SectionToggleMap => {
  const literal = buildSectionToggleLiteral(toggles);
  const declaration = `export const publicSectionToggles = ${literal} as const;`;
  const nextSource = source.replace(
    /export const publicSectionToggles = \{[\s\S]*?\} as const;/m,
    declaration
  );
  if (nextSource === source) {
    throw new Error("falha ao atualizar declaracao de toggles");
  }
  fs.writeFileSync(filePath, nextSource, "utf8");
  return parseSectionTogglesFromSource(nextSource);
};

const canEditSectionToggles = async (userId: number): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user?.email) return false;
  return user.email.trim().toLowerCase() === SECTION_TOGGLES_EDITOR_EMAIL;
};

const readSectionTogglesFromSettings = async (): Promise<SectionToggleMap | null> => {
  const entry = await prisma.setting.findUnique({
    where: { key: PUBLIC_SECTION_TOGGLES_SETTING_KEY },
    select: { value: true },
  });
  if (!entry?.value) return null;
  const parsed = sectionToggleMapSchema.safeParse(entry.value);
  if (!parsed.success) {
    logger.warn("Setting public.sectionToggles com formato invalido; usando fallback", {
      key: PUBLIC_SECTION_TOGGLES_SETTING_KEY,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return null;
  }
  return cloneSectionToggleMap(parsed.data);
};

const readSectionTogglesWithFallback = async (): Promise<SectionToggleMap> => {
  const fromSettings = await readSectionTogglesFromSettings();
  if (fromSettings) return fromSettings;
  try {
    const { toggles } = readSectionTogglesFile();
    return cloneSectionToggleMap(toggles);
  } catch (error) {
    logger.warn("Fallback de section toggles via arquivo indisponivel; usando default embutido", {
      error: error instanceof Error ? error.message : "erro inesperado",
    });
    return cloneSectionToggleMap(DEFAULT_PUBLIC_SECTION_TOGGLES);
  }
};

const saveSectionTogglesToSettings = async (toggles: SectionToggleMap): Promise<SectionToggleMap> => {
  const normalized = cloneSectionToggleMap(sectionToggleMapSchema.parse(toggles));
  const saved = await prisma.setting.upsert({
    where: { key: PUBLIC_SECTION_TOGGLES_SETTING_KEY },
    create: { key: PUBLIC_SECTION_TOGGLES_SETTING_KEY, value: normalized },
    update: { value: normalized },
    select: { value: true },
  });
  const parsed = sectionToggleMapSchema.parse(saved.value ?? normalized);
  return cloneSectionToggleMap(parsed);
};

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  price: z.coerce.number().min(0),
  imageUrl: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  productCategoryId: z.coerce.number().optional(),
  productStatusId: z.coerce.number().optional(),
  isFeatured: z.coerce.boolean().optional(),
});

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  cost: z.coerce.number().min(0).optional(),
  durationMin: z.coerce.number().min(1),
  imageUrl: z.string().optional(),
  commissionPercent: z.coerce.number().min(0).max(100).optional(),
  serviceCategoryId: z.coerce.number().optional(),
  serviceStatusId: z.coerce.number().optional(),
  isFeatured: z.coerce.boolean().optional(),
});

const membershipSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  benefits: z.array(z.string()).optional(),
  isFeatured: z.coerce.boolean().optional(),
  status: z.string().optional(),
});

const discountCouponSchema = z.object({
  code: z.string().min(2).max(64),
  name: z.string().min(2).max(120),
  discountType: z.enum(["PERCENT", "FIXED"]),
  percentOff: z.coerce.number().min(0.01).max(100).optional(),
  amountOff: z.coerce.number().min(0.01).optional(),
  minSubtotal: z.coerce.number().min(0).optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  isActive: z.coerce.boolean().optional(),
});

const productUpdateSchema = productSchema.partial();
const serviceUpdateSchema = serviceSchema.partial();
const membershipUpdateSchema = membershipSchema.partial();
const discountCouponUpdateSchema = discountCouponSchema.partial().extend({
  percentOff: z.union([z.coerce.number().min(0.01).max(100), z.null()]).optional(),
  amountOff: z.union([z.coerce.number().min(0.01), z.null()]).optional(),
  minSubtotal: z.union([z.coerce.number().min(0), z.null()]).optional(),
});

const categorySchema = z.object({
  name: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

const categoryUpdateSchema = categorySchema.partial();

const statusSchema = z.object({
  name: z.string().min(1),
  color: z.enum(["VERDE", "AMARELO", "VERMELHO", "CINZA"]).optional(),
});

const statusUpdateSchema = statusSchema.partial();

const orderUpdateSchema = z.object({
  status: z.enum(["PENDENTE", "PAGO", "ENVIADO", "ENTREGUE", "CANCELADO"]).optional(),
});

const orderFulfillmentUpdateSchema = z.object({
  fulfillmentStatus: z
    .enum(["PENDENTE", "SEPARANDO", "EMBALADO", "DESPACHADO", "ENVIADO", "ENTREGUE", "CANCELADO"])
    .optional(),
  shipmentTrackingCode: z.string().max(191).nullable().optional(),
  shipmentCarrier: z.string().max(191).nullable().optional(),
  fulfillmentNotes: z.string().max(4000).nullable().optional(),
});

const orderBulkAdvanceSchema = z.object({
  orderIds: z.array(z.coerce.number().int().positive()).min(1).max(200),
});

const appointmentUpdateSchema = z.object({
  status: z.enum(["PENDENTE", "CONFIRMADO", "CANCELADO"]).optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  notes: z.string().optional(),
  orderId: z.coerce.number().optional(),
});

const subscriptionSchema = z.object({
  membershipId: z.coerce.number(),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  status: z.enum(["ATIVA", "PENDENTE", "CANCELADA", "INADIMPLENTE"]).optional(),
  startedAt: z.string().optional(),
  cancelledAt: z.string().nullable().optional(),
});

const subscriptionUpdateSchema = subscriptionSchema.partial().extend({
  status: z.enum(["ATIVA", "PENDENTE", "CANCELADA", "INADIMPLENTE"]).optional(),
});

const franchiseLeadUpdateSchema = z.object({
  status: z.string().optional(),
});

const phoneSchema = z
  .string()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .refine((value) => /^\+?\d{8,15}$/.test(value), "telefone/WhatsApp inválido");

const publicSubscriptionSchema = z.object({
  membershipId: z.coerce.number(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: phoneSchema,
});

const publicDiscountCouponValidateSchema = z.object({
  code: z.string().min(1),
  subtotal: z.coerce.number().min(0),
});

const publicStripeCheckoutItemSchema = z.object({
  itemType: z.enum(["PRODUCT", "MEMBERSHIP"]),
  entityId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(99),
});

const publicStripeCheckoutSessionSchema = z.object({
  items: z.array(publicStripeCheckoutItemSchema).min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: phoneSchema,
  couponCode: z.string().optional(),
  deliveryMethod: z.enum(["PICKUP", "LOCAL_DELIVERY"]).default("LOCAL_DELIVERY"),
});

const publicStripeConfirmSessionQuerySchema = z.object({
  sessionId: z.string().min(1),
});

const publicStripeCancelPendingSchema = z
  .object({
    orderId: z.coerce.number().int().positive().optional(),
    paymentRecordId: z.coerce.number().int().positive().optional(),
  })
  .refine((value) => value.orderId !== undefined || value.paymentRecordId !== undefined, {
    message: "orderId ou paymentRecordId deve ser informado",
  });

type DiscountCouponPayload = z.infer<typeof discountCouponSchema>;
type DiscountCouponUpdatePayload = z.infer<typeof discountCouponUpdateSchema>;

const normalizeCouponCode = (value: string): string => value.trim().toUpperCase();

const toDecimalNumber = (value: Prisma.Decimal | null | undefined): number =>
  value === null || value === undefined ? 0 : Number(value.toString());

const roundCurrency = (value: number): number => Math.round(value * 100) / 100;

const parseDateFieldInput = (
  rawValue: string | null | undefined
): { value: Date | null | undefined; invalid: boolean } => {
  if (rawValue === undefined) return { value: undefined, invalid: false };
  const normalized = rawValue === null ? null : rawValue.trim();
  const parsed = parseOptionalDate(normalized);
  const hasText = typeof rawValue === "string" && rawValue.trim() !== "";
  if (hasText && parsed === undefined) {
    return { value: undefined, invalid: true };
  }
  return { value: parsed, invalid: false };
};

const validateDiscountCouponRules = (
  payload: {
    discountType: string;
    percentOff?: number;
    amountOff?: number;
    startsAt?: Date | null;
    endsAt?: Date | null;
  },
  isPartial = false
): string | null => {
  const percentOff = payload.percentOff;
  const amountOff = payload.amountOff;

  if (payload.discountType === "PERCENT") {
    if ((percentOff === undefined || percentOff <= 0) && !isPartial) {
      return "percentual de desconto obrigatorio para tipo percentual";
    }
    if (amountOff !== undefined && amountOff > 0) {
      return "valor fixo nao pode ser informado para cupom percentual";
    }
  }

  if (payload.discountType === "FIXED") {
    if ((amountOff === undefined || amountOff <= 0) && !isPartial) {
      return "valor de desconto obrigatorio para tipo fixo";
    }
    if (percentOff !== undefined && percentOff > 0) {
      return "percentual nao pode ser informado para cupom de valor fixo";
    }
  }

  if (payload.startsAt && payload.endsAt && payload.endsAt < payload.startsAt) {
    return "fim de validade deve ser maior ou igual ao inicio";
  }

  return null;
};

const calculateCouponDiscount = (
  coupon: {
    discountType: string;
    percentOff: Prisma.Decimal | null;
    amountOff: Prisma.Decimal | null;
    minSubtotal: Prisma.Decimal | null;
  },
  subtotal: number
): number => {
  if (subtotal <= 0) return 0;
  const minSubtotal = toDecimalNumber(coupon.minSubtotal);
  if (minSubtotal > 0 && subtotal < minSubtotal) return 0;

  if (coupon.discountType === "PERCENT") {
    const percentOff = toDecimalNumber(coupon.percentOff);
    if (percentOff <= 0) return 0;
    return roundCurrency(Math.min(subtotal, (subtotal * percentOff) / 100));
  }

  if (coupon.discountType === "FIXED") {
    const amountOff = toDecimalNumber(coupon.amountOff);
    if (amountOff <= 0) return 0;
    return roundCurrency(Math.min(subtotal, amountOff));
  }

  return 0;
};

const getCouponValidationError = (
  coupon: {
    isActive: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
    minSubtotal: Prisma.Decimal | null;
  },
  subtotal: number
): string | null => {
  if (!coupon.isActive) return "cupom inativo";
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return "cupom ainda fora da validade";
  if (coupon.endsAt && coupon.endsAt < now) return "cupom expirado";
  const minSubtotal = toDecimalNumber(coupon.minSubtotal);
  if (minSubtotal > 0 && subtotal < minSubtotal) {
    return `subtotal minimo para este cupom: R$ ${minSubtotal.toFixed(2)}`;
  }
  return null;
};

const CHECKOUT_LOCAL_DELIVERY_FEE_SETTING_KEY = "checkout.localDeliveryFee";
const CHECKOUT_FREE_SHIPPING_THRESHOLD_SETTING_KEY = "checkout.freeShippingThreshold";
const DEFAULT_LOCAL_DELIVERY_FEE = 10;
const DEFAULT_FREE_SHIPPING_THRESHOLD = 150;

type CheckoutDeliveryMethod = "PICKUP" | "LOCAL_DELIVERY";

type CheckoutShippingPolicy = {
  localDeliveryFee: number;
  freeShippingThreshold: number;
};

const sanitizeNonNegative = (value: number, fallback: number): number => {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, roundCurrency(value));
};

const parseNumericSettingValue = (rawValue: Prisma.JsonValue | null | undefined): number | null => {
  if (typeof rawValue === "number" && Number.isFinite(rawValue)) return rawValue;
  if (typeof rawValue === "string") {
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
    const candidate = (rawValue as Record<string, unknown>).value;
    if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate;
    if (typeof candidate === "string") {
      const parsed = Number(candidate);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }
  return null;
};

const readCheckoutShippingPolicy = async (): Promise<CheckoutShippingPolicy> => {
  const entries = await prisma.setting.findMany({
    where: {
      key: {
        in: [CHECKOUT_LOCAL_DELIVERY_FEE_SETTING_KEY, CHECKOUT_FREE_SHIPPING_THRESHOLD_SETTING_KEY],
      },
    },
    select: { key: true, value: true },
  });

  const localDeliveryFeeRaw = entries.find(
    (entry) => entry.key === CHECKOUT_LOCAL_DELIVERY_FEE_SETTING_KEY
  )?.value;
  const freeThresholdRaw = entries.find(
    (entry) => entry.key === CHECKOUT_FREE_SHIPPING_THRESHOLD_SETTING_KEY
  )?.value;

  const localDeliveryFee = sanitizeNonNegative(
    parseNumericSettingValue(localDeliveryFeeRaw) ?? DEFAULT_LOCAL_DELIVERY_FEE,
    DEFAULT_LOCAL_DELIVERY_FEE
  );
  const freeShippingThreshold = sanitizeNonNegative(
    parseNumericSettingValue(freeThresholdRaw) ?? DEFAULT_FREE_SHIPPING_THRESHOLD,
    DEFAULT_FREE_SHIPPING_THRESHOLD
  );

  return { localDeliveryFee, freeShippingThreshold };
};

const calculateCheckoutShipping = (
  subtotal: number,
  deliveryMethod: CheckoutDeliveryMethod,
  policy: CheckoutShippingPolicy
): number => {
  if (subtotal <= 0) return 0;
  if (deliveryMethod === "PICKUP") return 0;
  if (subtotal >= policy.freeShippingThreshold) return 0;
  return policy.localDeliveryFee;
};

const buildOrderPublicCode = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(Math.random() * 1679616)
    .toString(36)
    .toUpperCase()
    .padStart(4, "0");
  return `PV-${timestamp}-${random}`;
};

const normalizeNullableText = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const getNextFulfillmentStatus = (
  current: FulfillmentStatus
): FulfillmentStatus | null => {
  if (current === "PENDENTE") return "SEPARANDO";
  if (current === "SEPARANDO") return "EMBALADO";
  if (current === "EMBALADO") return "DESPACHADO";
  if (current === "DESPACHADO") return "ENVIADO";
  if (current === "ENVIADO") return "ENTREGUE";
  return null;
};

const asInputJsonObject = (value: Prisma.JsonValue | null | undefined): Prisma.InputJsonObject => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Prisma.InputJsonObject;
  }
  return {};
};

const appendOrderStatusHistory = async (
  tx: Prisma.TransactionClient,
  params: {
    orderId: number;
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    source: string;
    note?: string;
  }
): Promise<void> => {
  if (params.fromStatus === params.toStatus) return;
  await tx.orderStatusHistory.create({
    data: {
      orderId: params.orderId,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      source: params.source,
      note: params.note,
    },
  });
};

const restockOrderProducts = async (
  tx: Prisma.TransactionClient,
  orderId: number
): Promise<void> => {
  const productItems = await tx.orderItem.findMany({
    where: { orderId, productId: { not: null } },
    select: { productId: true, quantity: true },
  });
  if (!productItems.length) return;
  await Promise.all(
    productItems.map((item) =>
      tx.product.update({
        where: { id: item.productId as number },
        data: { stock: { increment: item.quantity } },
      })
    )
  );
};

const cancelOrderWithOptionalRestock = async (
  tx: Prisma.TransactionClient,
  params: {
    orderId: number;
    source: string;
    note?: string;
    forceRestock?: boolean;
  }
) => {
  const existing = await tx.order.findUnique({
    where: { id: params.orderId },
    select: { id: true, status: true },
  });
  if (!existing) return null;

  if (existing.status === "CANCELADO") return existing;

  const canRestock =
    params.forceRestock === true ||
    (existing.status !== "ENVIADO" && existing.status !== "ENTREGUE");
  if (canRestock) {
    await restockOrderProducts(tx, existing.id);
  }

  const updated = await tx.order.update({
    where: { id: existing.id },
    data: {
      status: "CANCELADO",
      fulfillmentStatus: "CANCELADO",
    },
  });

  await appendOrderStatusHistory(tx, {
    orderId: existing.id,
    fromStatus: existing.status,
    toStatus: "CANCELADO",
    source: params.source,
    note: params.note,
  });

  return updated;
};

const markOrderAsPaid = async (
  tx: Prisma.TransactionClient,
  params: {
    orderId: number;
    source: string;
    note?: string;
  }
) => {
  const existing = await tx.order.findUnique({
    where: { id: params.orderId },
    select: { id: true, status: true, fulfillmentStatus: true },
  });
  if (!existing) return null;

  const fulfillmentStatus: FulfillmentStatus =
    existing.fulfillmentStatus === "CANCELADO" ? "PENDENTE" : existing.fulfillmentStatus;
  const updated = await tx.order.update({
    where: { id: existing.id },
    data: {
      status: "PAGO",
      paymentConfirmedAt: new Date(),
      fulfillmentStatus,
    },
  });

  await appendOrderStatusHistory(tx, {
    orderId: existing.id,
    fromStatus: existing.status,
    toStatus: "PAGO",
    source: params.source,
    note: params.note,
  });

  return updated;
};

type PublicStripeCheckoutItem = z.infer<typeof publicStripeCheckoutItemSchema>;

type PublicStripePricedItem = {
  itemType: "PRODUCT" | "MEMBERSHIP";
  entityId: number;
  quantity: number;
  name: string;
  unitPrice: number;
};

const buildStripeCancelUrlWithContext = (
  baseUrl: string,
  params: { orderId: number; paymentRecordId: number }
): string => {
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}orderId=${params.orderId}&paymentRecordId=${params.paymentRecordId}`;
};

const conciergeWhatsappSummarySchema = z.object({
  summary: z.string().min(1).max(3000),
  recipientPhone: phoneSchema.optional(),
});

const conciergeCompleteSchema = z.object({
  serviceId: z.coerce.number().optional(),
  serviceName: z.string().optional(),
  unitId: z.coerce.number().optional(),
  unitName: z.string().optional(),
  scheduledDateLabel: z.string().optional(),
  scheduledFor: z.string().min(1),
  slotLabel: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: phoneSchema,
});

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "data invalida");

const slotLabelSchema = z
  .string()
  .trim()
  .regex(/^\d{2}:\d{2}$/, "horario invalido");

const conciergeAvailabilityQuerySchema = z.object({
  unitId: z.coerce.number().int().positive(),
  date: isoDateSchema,
});

const conciergePeriodsQuerySchema = conciergeAvailabilityQuerySchema.extend({
  serviceId: z.coerce.number().int().positive(),
});

const conciergeSlotsQuerySchema = conciergePeriodsQuerySchema.extend({
  period: z.enum(["MORNING", "AFTERNOON", "EVENING"]),
});

const conciergeSlotProfessionalsQuerySchema = conciergePeriodsQuerySchema.extend({
  slotLabel: slotLabelSchema,
});

const conciergeBookSchema = z.object({
  unitId: z.coerce.number().int().positive(),
  date: isoDateSchema,
  serviceId: z.coerce.number().int().positive(),
  slotLabel: slotLabelSchema,
  preferredProfessionalId: z.coerce.number().int().positive().optional(),
  clientName: z.string().min(1).max(120),
  clientPhone: phoneSchema,
  clientId: z.coerce.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
  orderId: z.coerce.number().int().positive().optional(),
});

const conciergeWaitlistSchema = z.object({
  unitId: z.coerce.number().int().positive(),
  requestedDate: isoDateSchema,
  requestedServiceName: z.string().min(2).max(160),
  clientName: z.string().max(120).optional(),
  clientPhone: phoneSchema,
  notes: z.string().max(1000).optional(),
});

const clockLabelSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "horario invalido");

const professionalShiftCreateSchema = z.object({
  professionalId: z.coerce.number().int().positive().optional(),
  unitId: z.coerce.number().int().positive().optional(),
  workDate: isoDateSchema,
  hourStart: clockLabelSchema,
  hourFinish: clockLabelSchema,
  isActive: z.coerce.boolean().optional(),
  notes: z.string().max(500).optional(),
});

const professionalShiftUpdateSchema = z.object({
  workDate: isoDateSchema.optional(),
  hourStart: clockLabelSchema.optional(),
  hourFinish: clockLabelSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  notes: z.string().max(500).nullable().optional(),
});

const professionalShiftQuerySchema = z.object({
  professionalId: z.coerce.number().int().positive().optional(),
  unitId: z.coerce.number().int().positive().optional(),
  date: isoDateSchema.optional(),
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

const professionalLinkUserSchema = z.object({
  professionalUserId: z.coerce.number().int().positive(),
});

const professionalUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  unitId: z.coerce.number().int().positive().nullable().optional(),
  specialties: z.array(z.string().min(1).max(80)).optional(),
  employmentStatus: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  startedAt: z.string().nullable().optional(),
  endedAt: z.string().nullable().optional(),
  commissionPercent: z.coerce.number().min(0).max(100).nullable().optional(),
  commissionProfileId: z.coerce.number().int().positive().nullable().optional(),
  workProfileId: z.coerce.number().int().positive().nullable().optional(),
});

const customerUpdateSchema = z.object({
  userId: z.coerce.number().int().positive().nullable().optional(),
  name: z.string().min(2).max(120).optional(),
  phone: phoneSchema.optional(),
  phone2: phoneSchema.nullable().optional(),
  email: z.string().email().nullable().optional(),
  city: z.string().max(120).nullable().optional(),
  state: z.string().max(20).nullable().optional(),
  neighborhood: z.string().max(120).nullable().optional(),
  notes: z.string().max(3000).nullable().optional(),
});

const customerCreateSchema = z.object({
  userId: z.coerce.number().int().positive().nullable().optional(),
  name: z.string().min(2).max(120),
  phone: phoneSchema,
  phone2: phoneSchema.nullable().optional(),
  email: z.string().email().nullable().optional(),
  city: z.string().max(120).nullable().optional(),
  state: z.string().max(20).nullable().optional(),
  neighborhood: z.string().max(120).nullable().optional(),
  notes: z.string().max(3000).nullable().optional(),
});

const professionalCommissionProfileCreateSchema = z.object({
  name: z.string().min(2).max(120),
  commissionPercent: z.coerce.number().min(0).max(100),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

const professionalCommissionProfileUpdateSchema = professionalCommissionProfileCreateSchema
  .partial()
  .extend({
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  });

const professionalWorkProfilePermissionSchema = z.object({
  canScheduleAppointments: z.coerce.boolean().optional(),
  canAccessOtherProfessionalsAgenda: z.coerce.boolean().optional(),
  canViewServiceValues: z.coerce.boolean().optional(),
  canViewCustomerContact: z.coerce.boolean().optional(),
  canAccessMenuClientsAnamnese: z.coerce.boolean().optional(),
  canAccessMenuServices: z.coerce.boolean().optional(),
  canAccessMenuProducts: z.coerce.boolean().optional(),
  canAccessMenuExpenses: z.coerce.boolean().optional(),
  canViewCommissionsToReceive: z.coerce.boolean().optional(),
  canViewCommissionPayments: z.coerce.boolean().optional(),
  canEditAppointments: z.coerce.boolean().optional(),
  canDeleteAppointments: z.coerce.boolean().optional(),
  canCreateServiceInAppointment: z.coerce.boolean().optional(),
  canViewGrossCommissionsToPay: z.coerce.boolean().optional(),
});

const professionalWorkProfileCreateSchema = z
  .object({
    title: z.string().min(2).max(120),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .merge(professionalWorkProfilePermissionSchema);

const professionalWorkProfileUpdateSchema = professionalWorkProfileCreateSchema
  .partial()
  .extend({
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  });

const professionalServicesUpdateSchema = z.object({
  serviceIds: z
    .array(z.coerce.number().int().positive())
    .max(500)
    .transform((list) => Array.from(new Set(list))),
});

type UnknownRecord = Record<string, unknown>;

type ParsedWebhookMessage = {
  messageId: string;
  phone: string;
  text: string;
  createdAt?: string;
  fromMe: boolean;
};

const asRecord = (value: unknown): UnknownRecord | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as UnknownRecord;
};

const valueAsString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  return null;
};

const valueAsBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (lowered === "true") return true;
    if (lowered === "false") return false;
  }
  return null;
};

const getNested = (root: unknown, path: ReadonlyArray<string>): unknown => {
  let current: unknown = root;
  for (const key of path) {
    const record = asRecord(current);
    if (!record) return undefined;
    current = record[key];
  }
  return current;
};

const pickStringFromPaths = (root: unknown, paths: ReadonlyArray<ReadonlyArray<string>>): string => {
  for (const path of paths) {
    const found = valueAsString(getNested(root, path));
    if (found) return found;
  }
  return "";
};

const pickBooleanFromPaths = (
  root: unknown,
  paths: ReadonlyArray<ReadonlyArray<string>>,
  fallback = false
): boolean => {
  for (const path of paths) {
    const found = valueAsBoolean(getNested(root, path));
    if (found !== null) return found;
  }
  return fallback;
};

const normalizeWebhookPhone = (rawValue: string): string => {
  const noSuffix = rawValue.includes("@") ? rawValue.split("@")[0] : rawValue;
  return noSuffix.replace(/\D/g, "");
};

const parseZApiWebhookMessage = (payload: unknown): ParsedWebhookMessage | null => {
  const messageId =
    pickStringFromPaths(payload, [
      ["messageId"],
      ["id"],
      ["data", "messageId"],
      ["data", "id"],
      ["text", "id"],
    ]) || `zapi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const connectedPhone = normalizeWebhookPhone(
    pickStringFromPaths(payload, [
      ["connectedPhone"],
      ["data", "connectedPhone"],
    ])
  );
  const phoneCandidates = [
    pickStringFromPaths(payload, [["participantPhone"], ["data", "participantPhone"]]),
    pickStringFromPaths(payload, [["senderPhone"], ["data", "senderPhone"]]),
    pickStringFromPaths(payload, [["sender", "phone"], ["data", "sender", "phone"]]),
    pickStringFromPaths(payload, [["sender", "id"], ["data", "sender", "id"]]),
    pickStringFromPaths(payload, [["from"], ["data", "from"]]),
    pickStringFromPaths(payload, [["chatId"], ["data", "chatId"]]),
    pickStringFromPaths(payload, [["phone"], ["data", "phone"]]),
  ]
    .map(normalizeWebhookPhone)
    .filter((value) => Boolean(value));
  const uniquePhoneCandidates = Array.from(new Set(phoneCandidates));
  const phone =
    uniquePhoneCandidates.find((value) => value !== connectedPhone) ||
    uniquePhoneCandidates[0] ||
    connectedPhone;

  const text = pickStringFromPaths(payload, [
    ["text", "message"],
    ["textMessage", "text"],
    ["message"],
    ["body"],
    ["data", "text", "message"],
    ["data", "textMessage", "text"],
    ["data", "message"],
    ["data", "body"],
    ["data", "content"],
  ]);

  const createdAt = pickStringFromPaths(payload, [
    ["createdAt"],
    ["timestamp"],
    ["time"],
    ["data", "createdAt"],
    ["data", "timestamp"],
    ["data", "time"],
  ]);

  const fromMe = pickBooleanFromPaths(payload, [
    ["fromMe"],
    ["senderMe"],
    ["data", "fromMe"],
    ["data", "senderMe"],
    ["sender", "fromMe"],
    ["data", "sender", "fromMe"],
  ]);

  if (!phone || !text) return null;
  return {
    messageId,
    phone,
    text,
    createdAt: createdAt || undefined,
    fromMe,
  };
};

const orderSchema = z.object({
  items: z
    .array(
      z
        .object({
          productId: z.coerce.number().optional(),
          membershipId: z.coerce.number().optional(),
          serviceId: z.coerce.number().optional(),
          quantity: z.coerce.number().min(1),
          unitPrice: z.coerce.number().min(0),
        })
        .refine(
          (item) => {
            const present = [item.productId, item.membershipId, item.serviceId].filter(
              (value) => value !== undefined && value !== null
            );
            return present.length === 1;
          },
          "cada item deve ter um produto, serviço ou assinatura"
        )
    )
    .min(1),
  total: z.coerce.number().min(0),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: phoneSchema,
});

const appointmentSchema = z.object({
  unitId: z.coerce.number(),
  professionalId: z.coerce.number(),
  serviceId: z.coerce.number(),
  orderId: z.coerce.number().optional(),
  start: z.string().min(1),
  end: z.string().optional(),
  clientName: z.string().min(1),
  clientPhone: phoneSchema,
  notes: z.string().optional(),
});

const franchiseLeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: phoneSchema,
  city: z.string().min(1),
});

const paymentIntentSchema = z.object({
  type: z.enum(["order", "subscription"]),
  orderId: z.coerce.number().optional(),
  subscriptionId: z.coerce.number().optional(),
  amount: z.coerce.number().min(0),
  description: z.string().optional(),
  customer: z.custom<Prisma.InputJsonValue>().optional(),
  method: z.string().optional(),
});

const paymentUpdateSchema = z.object({
  status: z.enum(["PENDENTE", "APROVADO", "RECUSADO", "CANCELADO", "REEMBOLSADO"]).optional(),
});

type OrderInput = z.infer<typeof orderSchema>;
type OrderItemInput = OrderInput["items"][number];

const validateShiftHours = (hourStart: string, hourFinish: string): boolean => {
  const startMinutes = clockToMinutes(hourStart);
  const finishMinutes = clockToMinutes(hourFinish);
  if (startMinutes === null || finishMinutes === null) return false;
  return finishMinutes > startMinutes;
};

const resolveProfessionalByUser = async (userId: number) => {
  return prisma.professional.findUnique({
    where: { userId },
    select: { id: true, unitId: true, name: true },
  });
};

router.post("/uploads", requireAuth, requireAdmin, upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

router.post("/auth/login", async (req, res) => {
  try {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

    const { identifier, password } = parsed.data;
    const blockState = checkLoginAttemptBlock(req, identifier);
    if (blockState.blocked) {
      res.status(429).json({
        message: MSG.TOO_MANY_REQUESTS,
        ...withDetail(`tente novamente em ${blockState.retryAfterSeconds}s`),
      });
      return;
    }

    const where = identifier.includes("@")
      ? { email: identifier.toLowerCase() }
      : { name: identifier };

    const user = await prisma.user.findFirst({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordHash: true,
      },
    });
    if (!user || !user.passwordHash) {
      registerFailedLoginAttempt(req, identifier);
      res.status(401).json({ message: MSG.USER_NOT_REGISTERED });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      registerFailedLoginAttempt(req, identifier);
      res.status(401).json({ message: MSG.WRONG_PASSWORD });
      return;
    }

    clearFailedLoginAttempts(req, identifier);

    prisma.user
      .update({
        where: { id: user.id },
        data: { lastAccessAt: new Date() },
      })
      .catch((error) => {
        logger.warn("Falha ao atualizar ultimo acesso no login", {
          error: error instanceof Error ? error.message : "erro inesperado",
        });
      });

    const token = signToken({ userId: user.id, role: user.role });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: null,
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "erro inesperado";
    logger.error("Falha no endpoint de login", {
      error: detail,
    });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...(process.env.NODE_ENV === "development" ? { detail } : {}),
    });
  }
});

router.post("/auth/register", async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: MSG.INVALID_PAYLOAD,
        ...withDetail(formatZodDetail(parsed.error.issues)),
      });
      return;
    }

    const { name, email, password } = parsed.data;
    if (!isStrongPassword(password)) {
      res.status(400).json({
        message: MSG.WEAK_PASSWORD,
      });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(409).json({ message: MSG.EMAIL_EXISTS });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "CLIENT",
      },
    });

    const token = signToken({ userId: user.id, role: user.role });
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ message: MSG.EMAIL_EXISTS });
      return;
    }
    const detail = error instanceof Error ? error.message : "erro inesperado";
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...(process.env.NODE_ENV === "development" ? { detail } : {}),
    });
  }
});

router.get("/auth/me", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ message: MSG.USER_NOT_FOUND });
    return;
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  });
});

router.get("/product-categories", requireAdmin, async (_req, res) => {
  const categories = await prisma.productCategory.findMany({ orderBy: { createdAt: "desc" } });
  res.json(categories);
});

router.post("/product-categories", requireAdmin, async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const category = await prisma.productCategory.create({
    data: {
      name: parsed.data.name,
      status: parsed.data.status || "ACTIVE",
    },
  });
  res.status(201).json(category);
});

router.patch("/product-categories/:id", requireAdmin, async (req, res) => {
  const categoryId = Number(req.params.id);
  if (!Number.isFinite(categoryId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = categoryUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const category = await prisma.productCategory.update({
    where: { id: categoryId },
    data: { name: parsed.data.name, status: parsed.data.status },
  });
  res.json(category);
});

router.delete("/product-categories/:id", requireAdmin, async (req, res) => {
  const categoryId = Number(req.params.id);
  if (!Number.isFinite(categoryId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const inUse = await prisma.product.count({ where: { productCategoryId: categoryId } });
  if (inUse > 0) {
    res.status(409).json({ message: MSG.FORBIDDEN });
    return;
  }
  await prisma.productCategory.delete({ where: { id: categoryId } });
  res.status(204).send();
});

router.get("/service-categories", requireAdmin, async (_req, res) => {
  const categories = await prisma.serviceCategory.findMany({ orderBy: { createdAt: "desc" } });
  res.json(categories);
});

router.post("/service-categories", requireAdmin, async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const category = await prisma.serviceCategory.create({
    data: {
      name: parsed.data.name,
      status: parsed.data.status || "ACTIVE",
    },
  });
  res.status(201).json(category);
});

router.patch("/service-categories/:id", requireAdmin, async (req, res) => {
  const categoryId = Number(req.params.id);
  if (!Number.isFinite(categoryId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = categoryUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const category = await prisma.serviceCategory.update({
    where: { id: categoryId },
    data: { name: parsed.data.name, status: parsed.data.status },
  });
  res.json(category);
});

router.delete("/service-categories/:id", requireAdmin, async (req, res) => {
  const categoryId = Number(req.params.id);
  if (!Number.isFinite(categoryId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const inUse = await prisma.service.count({ where: { serviceCategoryId: categoryId } });
  if (inUse > 0) {
    res.status(409).json({ message: MSG.FORBIDDEN });
    return;
  }
  await prisma.serviceCategory.delete({ where: { id: categoryId } });
  res.status(204).send();
});

router.get("/product-statuses", requireAdmin, async (_req, res) => {
  const statuses = await prisma.productStatus.findMany({ orderBy: { createdAt: "desc" } });
  res.json(statuses);
});

router.post("/product-statuses", requireAdmin, async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const status = await prisma.productStatus.create({
    data: {
      name: parsed.data.name,
      color: parsed.data.color || "VERDE",
    },
  });
  res.status(201).json(status);
});

router.patch("/product-statuses/:id", requireAdmin, async (req, res) => {
  const statusId = Number(req.params.id);
  if (!Number.isFinite(statusId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = statusUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const status = await prisma.productStatus.update({
    where: { id: statusId },
    data: { name: parsed.data.name, color: parsed.data.color },
  });
  res.json(status);
});

router.delete("/product-statuses/:id", requireAdmin, async (req, res) => {
  const statusId = Number(req.params.id);
  if (!Number.isFinite(statusId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const inUse = await prisma.product.count({ where: { productStatusId: statusId } });
  if (inUse > 0) {
    res.status(409).json({ message: MSG.FORBIDDEN });
    return;
  }
  await prisma.productStatus.delete({ where: { id: statusId } });
  res.status(204).send();
});

router.get("/service-statuses", requireAdmin, async (_req, res) => {
  const statuses = await prisma.serviceStatus.findMany({ orderBy: { createdAt: "desc" } });
  res.json(statuses);
});

router.post("/service-statuses", requireAdmin, async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const status = await prisma.serviceStatus.create({
    data: {
      name: parsed.data.name,
      color: parsed.data.color || "VERDE",
    },
  });
  res.status(201).json(status);
});

router.patch("/service-statuses/:id", requireAdmin, async (req, res) => {
  const statusId = Number(req.params.id);
  if (!Number.isFinite(statusId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = statusUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const status = await prisma.serviceStatus.update({
    where: { id: statusId },
    data: { name: parsed.data.name, color: parsed.data.color },
  });
  res.json(status);
});

router.delete("/service-statuses/:id", requireAdmin, async (req, res) => {
  const statusId = Number(req.params.id);
  if (!Number.isFinite(statusId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const inUse = await prisma.service.count({ where: { serviceStatusId: statusId } });
  if (inUse > 0) {
    res.status(409).json({ message: MSG.FORBIDDEN });
    return;
  }
  await prisma.serviceStatus.delete({ where: { id: statusId } });
  res.status(204).send();
});

router.get("/units", requireAdmin, async (_req, res) => {
  const units = await prisma.unit.findMany({ orderBy: { createdAt: "desc" } });
  res.json(units);
});

router.get("/professional-commission-profiles", requireAdmin, async (_req, res) => {
  const items = await prisma.professionalCommissionProfile.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
  res.json(items);
});

router.post("/professional-commission-profiles", requireAdmin, async (req, res) => {
  const parsed = professionalCommissionProfileCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  try {
    const created = await prisma.professionalCommissionProfile.create({
      data: {
        name: parsed.data.name.trim(),
        commissionPercent: parsed.data.commissionPercent,
        status: parsed.data.status || "ACTIVE",
      },
    });
    res.status(201).json(created);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(409).json({ message: "Perfil de comissao ja cadastrado." });
      return;
    }
    throw error;
  }
});

router.patch("/professional-commission-profiles/:id", requireAdmin, async (req, res) => {
  const profileId = Number(req.params.id);
  if (!Number.isFinite(profileId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = professionalCommissionProfileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const existing = await prisma.professionalCommissionProfile.findUnique({
    where: { id: profileId },
    select: { id: true },
  });
  if (!existing) {
    res.status(404).json({ message: MSG.USER_NOT_FOUND });
    return;
  }

  try {
    const updated = await prisma.professionalCommissionProfile.update({
      where: { id: profileId },
      data: {
        name: parsed.data.name?.trim(),
        commissionPercent: parsed.data.commissionPercent,
        status: parsed.data.status,
      },
    });
    res.json(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(409).json({ message: "Perfil de comissao ja cadastrado." });
      return;
    }
    throw error;
  }
});

router.delete("/professional-commission-profiles/:id", requireAdmin, async (req, res) => {
  const profileId = Number(req.params.id);
  if (!Number.isFinite(profileId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }

  const inUse = await prisma.professional.count({
    where: { commissionProfileId: profileId },
  });
  if (inUse > 0) {
    res.status(409).json({
      message: MSG.FORBIDDEN,
      ...withDetail("perfil de comissao em uso por profissionais"),
    });
    return;
  }

  await prisma.professionalCommissionProfile.delete({
    where: { id: profileId },
  });
  res.status(204).send();
});

router.get("/professional-work-profiles", requireAdmin, async (_req, res) => {
  const items = await prisma.professionalWorkProfile.findMany({
    orderBy: [{ status: "asc" }, { title: "asc" }],
  });
  res.json(items);
});

router.post("/professional-work-profiles", requireAdmin, async (req, res) => {
  const parsed = professionalWorkProfileCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  try {
    const created = await prisma.professionalWorkProfile.create({
      data: {
        title: parsed.data.title.trim(),
        status: parsed.data.status || "ACTIVE",
        canScheduleAppointments: parsed.data.canScheduleAppointments ?? false,
        canAccessOtherProfessionalsAgenda:
          parsed.data.canAccessOtherProfessionalsAgenda ?? false,
        canViewServiceValues: parsed.data.canViewServiceValues ?? false,
        canViewCustomerContact: parsed.data.canViewCustomerContact ?? false,
        canAccessMenuClientsAnamnese: parsed.data.canAccessMenuClientsAnamnese ?? false,
        canAccessMenuServices: parsed.data.canAccessMenuServices ?? false,
        canAccessMenuProducts: parsed.data.canAccessMenuProducts ?? false,
        canAccessMenuExpenses: parsed.data.canAccessMenuExpenses ?? false,
        canViewCommissionsToReceive: parsed.data.canViewCommissionsToReceive ?? false,
        canViewCommissionPayments: parsed.data.canViewCommissionPayments ?? false,
        canEditAppointments: parsed.data.canEditAppointments ?? false,
        canDeleteAppointments: parsed.data.canDeleteAppointments ?? false,
        canCreateServiceInAppointment: parsed.data.canCreateServiceInAppointment ?? false,
        canViewGrossCommissionsToPay: parsed.data.canViewGrossCommissionsToPay ?? false,
      },
    });
    res.status(201).json(created);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(409).json({ message: "Ja existe um perfil de trabalho com esse titulo." });
      return;
    }
    throw error;
  }
});

router.patch("/professional-work-profiles/:id", requireAdmin, async (req, res) => {
  const profileId = Number(req.params.id);
  if (!Number.isFinite(profileId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = professionalWorkProfileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const existing = await prisma.professionalWorkProfile.findUnique({
    where: { id: profileId },
    select: { id: true },
  });
  if (!existing) {
    res.status(404).json({ message: MSG.USER_NOT_FOUND });
    return;
  }

  try {
    const updated = await prisma.professionalWorkProfile.update({
      where: { id: profileId },
      data: {
        title: parsed.data.title?.trim(),
        status: parsed.data.status,
        canScheduleAppointments: parsed.data.canScheduleAppointments,
        canAccessOtherProfessionalsAgenda: parsed.data.canAccessOtherProfessionalsAgenda,
        canViewServiceValues: parsed.data.canViewServiceValues,
        canViewCustomerContact: parsed.data.canViewCustomerContact,
        canAccessMenuClientsAnamnese: parsed.data.canAccessMenuClientsAnamnese,
        canAccessMenuServices: parsed.data.canAccessMenuServices,
        canAccessMenuProducts: parsed.data.canAccessMenuProducts,
        canAccessMenuExpenses: parsed.data.canAccessMenuExpenses,
        canViewCommissionsToReceive: parsed.data.canViewCommissionsToReceive,
        canViewCommissionPayments: parsed.data.canViewCommissionPayments,
        canEditAppointments: parsed.data.canEditAppointments,
        canDeleteAppointments: parsed.data.canDeleteAppointments,
        canCreateServiceInAppointment: parsed.data.canCreateServiceInAppointment,
        canViewGrossCommissionsToPay: parsed.data.canViewGrossCommissionsToPay,
      },
    });
    res.json(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(409).json({ message: "Ja existe um perfil de trabalho com esse titulo." });
      return;
    }
    throw error;
  }
});

router.delete("/professional-work-profiles/:id", requireAdmin, async (req, res) => {
  const profileId = Number(req.params.id);
  if (!Number.isFinite(profileId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const inUse = await prisma.professional.count({
    where: { workProfileId: profileId },
  });
  if (inUse > 0) {
    res.status(409).json({
      message: "Perfil de trabalho vinculado a profissionais e nao pode ser excluido.",
    });
    return;
  }
  await prisma.professionalWorkProfile.delete({
    where: { id: profileId },
  });
  res.status(204).send();
});

router.get("/professionals", requireAdmin, async (_req, res) => {
  const professionals = await prisma.professional.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      unit: true,
      user: { select: { id: true, email: true, name: true, role: true } },
      workProfile: {
        select: {
          id: true,
          title: true,
          status: true,
          canScheduleAppointments: true,
          canAccessOtherProfessionalsAgenda: true,
          canViewServiceValues: true,
          canViewCustomerContact: true,
          canAccessMenuClientsAnamnese: true,
          canAccessMenuServices: true,
          canAccessMenuProducts: true,
          canAccessMenuExpenses: true,
          canViewCommissionsToReceive: true,
          canViewCommissionPayments: true,
          canEditAppointments: true,
          canDeleteAppointments: true,
          canCreateServiceInAppointment: true,
          canViewGrossCommissionsToPay: true,
        },
      },
      commissionProfile: {
        select: { id: true, name: true, commissionPercent: true, status: true },
      },
      _count: { select: { shifts: true, professionalServices: true } },
    },
  });
  res.json(professionals);
});

router.get("/customers", requireAdmin, async (_req, res) => {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, name: true, role: true } },
    },
  });
  res.json(customers);
});

router.post("/customers", requireAdmin, async (req, res) => {
  const parsed = customerCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  if (parsed.data.userId !== undefined && parsed.data.userId !== null) {
    const linkedUser = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: { id: true, role: true },
    });
    if (!linkedUser) {
      res.status(404).json({ message: MSG.USER_NOT_FOUND });
      return;
    }
    if (
      linkedUser.role !== "CLIENT" &&
      linkedUser.role !== "ADMIN" &&
      linkedUser.role !== "MASTER"
    ) {
      res.status(400).json({
        message: MSG.INVALID_PAYLOAD,
        ...withDetail("usuario sem permissao de cliente"),
      });
      return;
    }
  }

  const normalizeOptionalField = (value: string | null | undefined): string | null | undefined => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed || null;
  };
  const normalizedState = normalizeOptionalField(parsed.data.state);

  try {
    const created = await prisma.customer.create({
      data: {
        userId: parsed.data.userId,
        name: parsed.data.name.trim(),
        phone: parsed.data.phone,
        phone2: parsed.data.phone2,
        email: normalizeOptionalField(parsed.data.email),
        city: normalizeOptionalField(parsed.data.city),
        state: normalizedState === undefined ? undefined : normalizedState?.toUpperCase() || null,
        neighborhood: normalizeOptionalField(parsed.data.neighborhood),
        notes: normalizeOptionalField(parsed.data.notes),
      },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
      },
    });
    res.status(201).json(created);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ message: "Registro duplicado para um campo unico." });
      return;
    }
    throw error;
  }
});

router.patch("/customers/:id", requireAdmin, async (req, res) => {
  const customerId = Number(req.params.id);
  if (!Number.isFinite(customerId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = customerUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const existing = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true },
  });
  if (!existing) {
    res.status(404).json({ message: MSG.USER_NOT_FOUND });
    return;
  }

  if (parsed.data.userId !== undefined && parsed.data.userId !== null) {
    const linkedUser = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: { id: true, role: true },
    });
    if (!linkedUser) {
      res.status(404).json({ message: MSG.USER_NOT_FOUND });
      return;
    }
    if (
      linkedUser.role !== "CLIENT" &&
      linkedUser.role !== "ADMIN" &&
      linkedUser.role !== "MASTER"
    ) {
      res.status(400).json({
        message: MSG.INVALID_PAYLOAD,
        ...withDetail("usuario sem permissao de cliente"),
      });
      return;
    }
  }

  const normalizeOptionalField = (value: string | null | undefined): string | null | undefined => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed || null;
  };
  const normalizedState = normalizeOptionalField(parsed.data.state);

  try {
    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        userId: parsed.data.userId,
        name: parsed.data.name?.trim(),
        phone: parsed.data.phone,
        phone2: parsed.data.phone2,
        email: normalizeOptionalField(parsed.data.email),
        city: normalizeOptionalField(parsed.data.city),
        state: normalizedState === undefined ? undefined : normalizedState?.toUpperCase() || null,
        neighborhood: normalizeOptionalField(parsed.data.neighborhood),
        notes: normalizeOptionalField(parsed.data.notes),
      },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
      },
    });
    res.json(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(409).json({ message: "Registro duplicado para um campo unico." });
      return;
    }
    throw error;
  }
});

router.patch("/professionals/:id/link-user", requireAdmin, async (req, res) => {
  const professionalId = Number(req.params.id);
  if (!Number.isFinite(professionalId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = professionalLinkUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: { id: true },
  });
  if (!professional) {
    res.status(404).json({ message: MSG.USER_NOT_FOUND });
    return;
  }

  const linkedUser = await prisma.user.findUnique({
    where: { id: parsed.data.professionalUserId },
    select: { id: true, role: true },
  });
  if (!linkedUser) {
    res.status(404).json({ message: MSG.USER_NOT_FOUND });
    return;
  }
  if (linkedUser.role !== "PROFESSIONAL" && linkedUser.role !== "ADMIN" && linkedUser.role !== "MASTER") {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail("usuario sem permissao de profissional"),
    });
    return;
  }

  const updated = await prisma.professional.update({
    where: { id: professionalId },
    data: {
      userId: parsed.data.professionalUserId,
    },
    include: {
      unit: true,
      user: { select: { id: true, email: true, name: true, role: true } },
    },
  });
  res.json(updated);
});

router.patch("/professionals/:id", requireAdmin, async (req, res) => {
  const professionalId = Number(req.params.id);
  if (!Number.isFinite(professionalId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = professionalUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const existing = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: { id: true },
  });
  if (!existing) {
    res.status(404).json({ message: MSG.USER_NOT_FOUND });
    return;
  }

  if (parsed.data.unitId !== undefined && parsed.data.unitId !== null) {
    const unit = await prisma.unit.findUnique({
      where: { id: parsed.data.unitId },
      select: { id: true },
    });
    if (!unit) {
      res.status(400).json({
        message: MSG.INVALID_PAYLOAD,
        ...withDetail("unidade invalida"),
      });
      return;
    }
  }

  if (
    parsed.data.commissionProfileId !== undefined &&
    parsed.data.commissionProfileId !== null
  ) {
    const profile = await prisma.professionalCommissionProfile.findUnique({
      where: { id: parsed.data.commissionProfileId },
      select: { id: true },
    });
    if (!profile) {
      res.status(400).json({
        message: MSG.INVALID_PAYLOAD,
        ...withDetail("perfil de comissao invalido"),
      });
      return;
    }
  }
  if (parsed.data.workProfileId !== undefined && parsed.data.workProfileId !== null) {
    const workProfile = await prisma.professionalWorkProfile.findUnique({
      where: { id: parsed.data.workProfileId },
      select: { id: true },
    });
    if (!workProfile) {
      res.status(400).json({
        message: MSG.INVALID_PAYLOAD,
        ...withDetail("perfil de trabalho invalido"),
      });
      return;
    }
  }

  const parsedStartedAt = parseOptionalDate(parsed.data.startedAt);
  if (parsed.data.startedAt !== undefined && parsedStartedAt === undefined) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail("data de inicio invalida"),
    });
    return;
  }
  const parsedEndedAt = parseOptionalDate(parsed.data.endedAt);
  if (parsed.data.endedAt !== undefined && parsedEndedAt === undefined) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail("data de saida invalida"),
    });
    return;
  }
  if (
    parsedStartedAt instanceof Date &&
    parsedEndedAt instanceof Date &&
    parsedEndedAt.getTime() < parsedStartedAt.getTime()
  ) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail("data de saida deve ser maior ou igual a data de inicio"),
    });
    return;
  }

  const updated = await prisma.professional.update({
    where: { id: professionalId },
    data: {
      name: parsed.data.name,
      unitId: parsed.data.unitId,
      specialties: parsed.data.specialties,
      employmentStatus: parsed.data.employmentStatus,
      startedAt: parsedStartedAt,
      endedAt: parsedEndedAt,
      commissionPercent:
        parsed.data.commissionPercent === undefined
          ? undefined
          : parsed.data.commissionPercent === null
          ? null
          : new Prisma.Decimal(parsed.data.commissionPercent),
      commissionProfileId: parsed.data.commissionProfileId,
      workProfileId: parsed.data.workProfileId,
    },
    include: {
      unit: true,
      user: { select: { id: true, email: true, name: true, role: true } },
      workProfile: {
        select: {
          id: true,
          title: true,
          status: true,
          canScheduleAppointments: true,
          canAccessOtherProfessionalsAgenda: true,
          canViewServiceValues: true,
          canViewCustomerContact: true,
          canAccessMenuClientsAnamnese: true,
          canAccessMenuServices: true,
          canAccessMenuProducts: true,
          canAccessMenuExpenses: true,
          canViewCommissionsToReceive: true,
          canViewCommissionPayments: true,
          canEditAppointments: true,
          canDeleteAppointments: true,
          canCreateServiceInAppointment: true,
          canViewGrossCommissionsToPay: true,
        },
      },
      commissionProfile: {
        select: { id: true, name: true, commissionPercent: true, status: true },
      },
      _count: { select: { shifts: true, professionalServices: true } },
    },
  });
  res.json(updated);
});

router.get("/professional-services", requireAdmin, async (req, res) => {
  const professionalIdRaw =
    typeof req.query.professionalId === "string" ? Number(req.query.professionalId) : NaN;
  const where: Prisma.ProfessionalServiceWhereInput = {};
  if (Number.isFinite(professionalIdRaw)) {
    where.professionalId = professionalIdRaw;
  }

  const items = await prisma.professionalService.findMany({
    where,
    orderBy: [{ professionalId: "asc" }, { serviceId: "asc" }],
    include: {
      professional: {
        select: {
          id: true,
          name: true,
          unitId: true,
          unit: { select: { id: true, name: true } },
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          serviceCategory: { select: { id: true, name: true } },
        },
      },
    },
  });
  res.json({ items });
});

router.put("/professionals/:id/services", requireAdmin, async (req, res) => {
  const professionalId = Number(req.params.id);
  if (!Number.isFinite(professionalId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = professionalServicesUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: { id: true },
  });
  if (!professional) {
    res.status(404).json({ message: MSG.USER_NOT_FOUND });
    return;
  }

  const serviceIds = parsed.data.serviceIds;
  if (serviceIds.length > 0) {
    const serviceCount = await prisma.service.count({
      where: { id: { in: serviceIds } },
    });
    if (serviceCount !== serviceIds.length) {
      res.status(400).json({
        message: MSG.INVALID_PAYLOAD,
        ...withDetail("lista de servicos contem ids invalidos"),
      });
      return;
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.professionalService.deleteMany({ where: { professionalId } });
    if (serviceIds.length > 0) {
      await tx.professionalService.createMany({
        data: serviceIds.map((serviceId) => ({
          professionalId,
          serviceId,
        })),
        skipDuplicates: true,
      });
    }
  });

  const items = await prisma.professionalService.findMany({
    where: { professionalId },
    orderBy: { serviceId: "asc" },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          serviceCategory: { select: { id: true, name: true } },
        },
      },
    },
  });
  res.json({
    professionalId,
    serviceIds: items.map((row) => row.serviceId),
    items,
  });
});

router.get("/users", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      phone2: true,
      city: true,
      neighborhood: true,
      avatarUrl: true,
      status: true,
      emailVerified: true,
      rating: true,
      lastAccessAt: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
});

router.post("/users", requireAuth, requireAdmin, async (req, res) => {
  const parsed = userCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const payload = parsed.data;
  if (payload.role === "MASTER" && req.user?.role !== "MASTER") {
    res.status(403).json({ message: MSG.FORBIDDEN });
    return;
  }
  const existing = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
  if (existing) {
    res.status(409).json({ message: MSG.EMAIL_EXISTS });
    return;
  }
  const passwordHash = await hashPassword(payload.password);
  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email.toLowerCase(),
      passwordHash,
      role: payload.role || "CLIENT",
      phone: payload.phone,
      phone2: payload.phone2,
      city: payload.city,
      neighborhood: payload.neighborhood,
      avatarUrl: payload.avatarUrl,
      status: payload.status || "ATIVO",
      emailVerified: payload.emailVerified ?? false,
      rating: payload.rating,
    },
  });
  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});

router.patch("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isFinite(userId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = userUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const payload = parsed.data;
  if (payload.role === "MASTER" && req.user?.role !== "MASTER") {
    res.status(403).json({ message: MSG.FORBIDDEN });
    return;
  }
  if (payload.email) {
    const existing = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });
    if (existing && existing.id !== userId) {
      res.status(409).json({ message: MSG.EMAIL_EXISTS });
      return;
    }
  }
  const data: Prisma.UserUpdateInput = {
    name: payload.name,
    email: payload.email ? payload.email.toLowerCase() : undefined,
    role: payload.role,
    phone: payload.phone,
    phone2: payload.phone2,
    city: payload.city,
    neighborhood: payload.neighborhood,
    avatarUrl: payload.avatarUrl,
    status: payload.status,
    emailVerified: payload.emailVerified,
    rating: payload.rating,
  };
  if (payload.password) {
    data.passwordHash = await hashPassword(payload.password);
  }
  const updated = await prisma.user.update({
    where: { id: userId },
    data,
  });
  res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
  });
});

router.patch("/users/:id/role", requireAuth, requireAdmin, async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isFinite(userId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = roleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  if (parsed.data.role === "MASTER" && req.user?.role !== "MASTER") {
    res.status(403).json({ message: MSG.FORBIDDEN });
    return;
  }
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    res.status(404).json({ message: MSG.USER_NOT_FOUND });
    return;
  }
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: parsed.data.role },
  });
  res.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role });
});

router.delete("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isFinite(userId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  if (req.user?.id === userId) {
    res.status(403).json({ message: MSG.FORBIDDEN });
    return;
  }
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    res.status(404).json({ message: MSG.USER_NOT_FOUND });
    return;
  }
  await prisma.user.delete({ where: { id: userId } });
  res.status(204).send();
});

router.get("/settings", requireAdmin, async (_req, res) => {
  const entries = await prisma.setting.findMany({ orderBy: { key: "asc" } });
  res.json(entries);
});

router.get("/settings/:key", requireAdmin, async (req, res) => {
  const key = String(req.params.key);
  const entry = await prisma.setting.findUnique({ where: { key } });
  if (!entry) {
    res.status(404).json({ message: MSG.CONTENT_NOT_FOUND });
    return;
  }
  res.json(entry);
});

router.put("/settings/:key", requireAdmin, async (req, res) => {
  const key = String(req.params.key);
  const { value } = req.body;
  const entry = await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
  if (key === PUBLIC_BRANDING_SETTING_KEY) {
    invalidatePublicBrandingCache();
  }
  if (key === PUBLIC_MEDIA_SLOTS_SETTING_KEY) {
    invalidatePublicMediaSlotsCache();
  }
  res.json(entry);
});

router.get("/admin/section-toggles", requireAdmin, async (req: AuthRequest, res) => {
  const userId = Number(req.user?.id);
  if (!Number.isFinite(userId) || userId <= 0) {
    res.status(401).json({ message: MSG.UNAUTHORIZED });
    return;
  }

  try {
    const isAllowed = await canEditSectionToggles(userId);
    if (!isAllowed) {
      res.status(403).json({ message: MSG.FORBIDDEN });
      return;
    }
    const toggles = await readSectionTogglesWithFallback();
    res.json({ toggles });
  } catch (error) {
    logger.error("Falha ao ler section toggles", { error });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(error instanceof Error ? error.message : undefined),
    });
  }
});

router.put("/admin/section-toggles", requireAdmin, async (req: AuthRequest, res) => {
  const userId = Number(req.user?.id);
  if (!Number.isFinite(userId) || userId <= 0) {
    res.status(401).json({ message: MSG.UNAUTHORIZED });
    return;
  }

  const parsedPayload = sectionTogglesPayloadSchema.safeParse(req.body);
  if (!parsedPayload.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsedPayload.error.issues)),
    });
    return;
  }

  try {
    const isAllowed = await canEditSectionToggles(userId);
    if (!isAllowed) {
      res.status(403).json({ message: MSG.FORBIDDEN });
      return;
    }
    const toggles = await saveSectionTogglesToSettings(parsedPayload.data.toggles);
    res.json({ toggles, updatedAt: new Date().toISOString() });
  } catch (error) {
    logger.error("Falha ao salvar section toggles", { error });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(error instanceof Error ? error.message : undefined),
    });
  }
});

router.get("/public/section-toggles", async (_req, res) => {
  try {
    const toggles = await readSectionTogglesWithFallback();
    res.json({ toggles });
  } catch (error) {
    logger.error("Falha ao ler section toggles publicos", { error });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(error instanceof Error ? error.message : undefined),
    });
  }
});

router.get("/admin/branding", requireAdmin, async (_req, res) => {
  try {
    const branding = await getPublicBranding();
    res.json({ branding });
  } catch (error) {
    logger.error("Falha ao ler branding admin", { error });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(error instanceof Error ? error.message : undefined),
    });
  }
});

router.put("/admin/branding", requireAdmin, async (req, res) => {
  const parsedPayload = brandingPayloadSchema.safeParse(req.body);
  if (!parsedPayload.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsedPayload.error.issues)),
    });
    return;
  }

  try {
    const branding = await savePublicBranding(parsedPayload.data);
    res.json({ branding, updatedAt: new Date().toISOString() });
  } catch (error) {
    logger.error("Falha ao salvar branding admin", { error });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(error instanceof Error ? error.message : undefined),
    });
  }
});

router.get("/public/branding", async (_req, res) => {
  try {
    const branding = await getPublicBranding();
    res.json({ branding });
  } catch (error) {
    logger.error("Falha ao ler branding publico", { error });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(error instanceof Error ? error.message : undefined),
    });
  }
});

router.get("/admin/media-slots", requireAdmin, async (_req, res) => {
  try {
    const catalog = getPublicMediaSlotCatalog();
    const slots = await getPublicMediaSlots();
    res.json({ catalog, slots });
  } catch (error) {
    logger.error("Falha ao ler media slots no admin", { error });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(error instanceof Error ? error.message : undefined),
    });
  }
});

router.put("/admin/media-slots", requireAdmin, async (req, res) => {
  const parsedPayload = mediaSlotsPayloadSchema.safeParse(req.body);
  if (!parsedPayload.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsedPayload.error.issues)),
    });
    return;
  }

  try {
    const slots = await savePublicMediaSlots(parsedPayload.data.slots);
    const catalog = getPublicMediaSlotCatalog();
    res.json({ catalog, slots, updatedAt: new Date().toISOString() });
  } catch (error) {
    logger.error("Falha ao salvar media slots no admin", { error });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(error instanceof Error ? error.message : undefined),
    });
  }
});

router.get("/public/media-slots", async (_req, res) => {
  try {
    const slots = await getPublicMediaSlots();
    res.json({ slots });
  } catch (error) {
    logger.error("Falha ao ler media slots publicos", { error });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(error instanceof Error ? error.message : undefined),
    });
  }
});

router.get("/products", requireAdmin, async (_req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { productCategory: true, productStatus: true },
  });
  res.json(products);
});

router.post("/products", requireAdmin, async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PRODUCT,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const {
    name,
    description,
    price,
    imageUrl,
    productCategoryId,
    productStatusId,
    isFeatured,
    sku,
    stock,
    benefits,
  } = parsed.data;
  const normalizedCategoryId =
    productCategoryId !== undefined && Number(productCategoryId) > 0
      ? Number(productCategoryId)
      : null;
  const normalizedStatusId =
    productStatusId !== undefined && Number(productStatusId) > 0 ? Number(productStatusId) : null;

  if (normalizedCategoryId !== null) {
    const categoryExists = await prisma.productCategory.findUnique({
      where: { id: normalizedCategoryId },
      select: { id: true },
    });
    if (!categoryExists) {
      res.status(400).json({
        message: MSG.INVALID_PRODUCT,
        ...withDetail("categoria de produto invalida"),
      });
      return;
    }
  }

  if (normalizedStatusId !== null) {
    const statusExists = await prisma.productStatus.findUnique({
      where: { id: normalizedStatusId },
      select: { id: true },
    });
    if (!statusExists) {
      res.status(400).json({
        message: MSG.INVALID_PRODUCT,
        ...withDetail("status de produto invalido"),
      });
      return;
    }
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        sku,
        stock: stock ?? 0,
        price: new Prisma.Decimal(price || 0),
        imageUrl,
        benefits,
        isFeatured: Boolean(isFeatured ?? false),
        productCategoryId: normalizedCategoryId,
        productStatusId: normalizedStatusId,
      },
      include: { productCategory: true, productStatus: true },
    });
    res.status(201).json(product);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      res.status(400).json({
        message: MSG.INVALID_PRODUCT,
        ...withDetail("categoria/status de produto invalido"),
      });
      return;
    }
    logger.error("Falha ao criar produto", { error });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(error instanceof Error ? error.message : "create_product_failed"),
    });
  }
});

router.patch("/products/:id", requireAdmin, async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isFinite(productId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = productUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PRODUCT,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const payload = parsed.data;
  const hasCategoryKey = Object.prototype.hasOwnProperty.call(payload, "productCategoryId");
  const hasStatusKey = Object.prototype.hasOwnProperty.call(payload, "productStatusId");

  const normalizedCategoryId = hasCategoryKey
    ? payload.productCategoryId !== undefined && Number(payload.productCategoryId) > 0
      ? Number(payload.productCategoryId)
      : null
    : undefined;
  const normalizedStatusId = hasStatusKey
    ? payload.productStatusId !== undefined && Number(payload.productStatusId) > 0
      ? Number(payload.productStatusId)
      : null
    : undefined;

  if (normalizedCategoryId !== undefined && normalizedCategoryId !== null) {
    const categoryExists = await prisma.productCategory.findUnique({
      where: { id: normalizedCategoryId },
      select: { id: true },
    });
    if (!categoryExists) {
      res.status(400).json({
        message: MSG.INVALID_PRODUCT,
        ...withDetail("categoria de produto invalida"),
      });
      return;
    }
  }

  if (normalizedStatusId !== undefined && normalizedStatusId !== null) {
    const statusExists = await prisma.productStatus.findUnique({
      where: { id: normalizedStatusId },
      select: { id: true },
    });
    if (!statusExists) {
      res.status(400).json({
        message: MSG.INVALID_PRODUCT,
        ...withDetail("status de produto invalido"),
      });
      return;
    }
  }

  try {
    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        name: payload.name,
        description: payload.description,
        sku: payload.sku,
        stock: payload.stock,
        price: payload.price !== undefined ? new Prisma.Decimal(payload.price || 0) : undefined,
        imageUrl: payload.imageUrl,
        benefits: payload.benefits,
        isFeatured: payload.isFeatured,
        productCategoryId: normalizedCategoryId,
        productStatusId: normalizedStatusId,
      },
      include: { productCategory: true, productStatus: true },
    });
    res.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ message: MSG.PRODUCT_NOT_FOUND });
      return;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      res.status(400).json({
        message: MSG.INVALID_PRODUCT,
        ...withDetail("categoria/status de produto invalido"),
      });
      return;
    }
    logger.error("Falha ao atualizar produto", { error, productId });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(error instanceof Error ? error.message : "update_product_failed"),
    });
  }
});

router.delete("/products/:id", requireAdmin, async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isFinite(productId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  try {
    await prisma.product.delete({ where: { id: productId } });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ message: MSG.PRODUCT_NOT_FOUND });
      return;
    }
    logger.error("Falha ao excluir produto", { error, productId });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(error instanceof Error ? error.message : "delete_product_failed"),
    });
  }
});

router.get("/services", requireAdmin, async (_req, res) => {
  const services = await prisma.service.findMany({
    orderBy: { createdAt: "desc" },
    include: { serviceCategory: true, serviceStatus: true },
  });
  res.json(services);
});

router.post("/services", requireAdmin, async (req, res) => {
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_SERVICE,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const {
    name,
    description,
    price,
    cost,
    durationMin,
    imageUrl,
    serviceCategoryId,
    serviceStatusId,
    isFeatured,
    commissionPercent,
  } = parsed.data;
  const service = await prisma.service.create({
    data: {
      name,
      description,
      price: new Prisma.Decimal(price || 0),
      cost: cost !== undefined ? new Prisma.Decimal(cost || 0) : null,
      durationMin: durationMin ? Number(durationMin) : null,
      imageUrl,
      commissionPercent: commissionPercent ?? null,
      isFeatured: Boolean(isFeatured ?? false),
      serviceCategoryId: serviceCategoryId ? Number(serviceCategoryId) : null,
      serviceStatusId: serviceStatusId ? Number(serviceStatusId) : null,
    },
    include: { serviceCategory: true, serviceStatus: true },
  });
  res.status(201).json(service);
});

router.patch("/services/:id", requireAdmin, async (req, res) => {
  const serviceId = Number(req.params.id);
  if (!Number.isFinite(serviceId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = serviceUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_SERVICE,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const payload = parsed.data;
  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: {
      name: payload.name,
      description: payload.description,
      price: payload.price !== undefined ? new Prisma.Decimal(payload.price || 0) : undefined,
      cost: payload.cost !== undefined ? new Prisma.Decimal(payload.cost || 0) : undefined,
      durationMin: payload.durationMin !== undefined ? Number(payload.durationMin) : undefined,
      imageUrl: payload.imageUrl,
      commissionPercent: payload.commissionPercent,
      isFeatured: payload.isFeatured,
      serviceCategoryId: payload.serviceCategoryId
        ? Number(payload.serviceCategoryId)
        : payload.serviceCategoryId === null
        ? null
        : undefined,
      serviceStatusId: payload.serviceStatusId
        ? Number(payload.serviceStatusId)
        : payload.serviceStatusId === null
        ? null
        : undefined,
    },
    include: { serviceCategory: true, serviceStatus: true },
  });
  res.json(updated);
});

router.delete("/services/:id", requireAdmin, async (req, res) => {
  const serviceId = Number(req.params.id);
  if (!Number.isFinite(serviceId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  await prisma.service.delete({ where: { id: serviceId } });
  res.status(204).send();
});

router.get("/discount-coupons", requireAdmin, async (_req, res) => {
  const coupons = await prisma.discountCoupon.findMany({
    orderBy: [{ createdAt: "desc" }],
  });
  res.json(coupons);
});

router.post("/discount-coupons", requireAdmin, async (req, res) => {
  const parsed = discountCouponSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const payload: DiscountCouponPayload = parsed.data;
  const startsAt = parseDateFieldInput(payload.startsAt);
  const endsAt = parseDateFieldInput(payload.endsAt);
  if (startsAt.invalid || endsAt.invalid) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail("datas de validade invalidas"),
    });
    return;
  }

  const ruleError = validateDiscountCouponRules({
    discountType: payload.discountType,
    percentOff: payload.percentOff,
    amountOff: payload.amountOff,
    startsAt: startsAt.value ?? null,
    endsAt: endsAt.value ?? null,
  });
  if (ruleError) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(ruleError),
    });
    return;
  }

  try {
    const created = await prisma.discountCoupon.create({
      data: {
        code: normalizeCouponCode(payload.code),
        name: payload.name.trim(),
        discountType: payload.discountType,
        percentOff:
          payload.discountType === "PERCENT"
            ? new Prisma.Decimal(payload.percentOff || 0)
            : null,
        amountOff:
          payload.discountType === "FIXED" ? new Prisma.Decimal(payload.amountOff || 0) : null,
        minSubtotal:
          payload.minSubtotal !== undefined ? new Prisma.Decimal(payload.minSubtotal) : null,
        startsAt: startsAt.value ?? null,
        endsAt: endsAt.value ?? null,
        isActive: payload.isActive ?? true,
      },
    });
    res.status(201).json(created);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({
        message: MSG.INVALID_PAYLOAD,
        ...withDetail("codigo de cupom ja cadastrado"),
      });
      return;
    }
    logger.error("Falha ao criar cupom de desconto", { error });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(error instanceof Error ? error.message : "create_discount_coupon_failed"),
    });
  }
});

router.patch("/discount-coupons/:id", requireAdmin, async (req, res) => {
  const couponId = Number(req.params.id);
  if (!Number.isFinite(couponId) || couponId <= 0) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }

  const parsed = discountCouponUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const payload: DiscountCouponUpdatePayload = parsed.data;
  const existing = await prisma.discountCoupon.findUnique({ where: { id: couponId } });
  if (!existing) {
    res.status(404).json({ message: MSG.CONTENT_NOT_FOUND });
    return;
  }

  const hasStartsAt = Object.prototype.hasOwnProperty.call(payload, "startsAt");
  const hasEndsAt = Object.prototype.hasOwnProperty.call(payload, "endsAt");
  const hasPercentOff = Object.prototype.hasOwnProperty.call(payload, "percentOff");
  const hasAmountOff = Object.prototype.hasOwnProperty.call(payload, "amountOff");
  const hasMinSubtotal = Object.prototype.hasOwnProperty.call(payload, "minSubtotal");
  const hasCode = Object.prototype.hasOwnProperty.call(payload, "code");
  const hasName = Object.prototype.hasOwnProperty.call(payload, "name");
  const hasIsActive = Object.prototype.hasOwnProperty.call(payload, "isActive");

  const startsAt = hasStartsAt ? parseDateFieldInput(payload.startsAt ?? null) : null;
  const endsAt = hasEndsAt ? parseDateFieldInput(payload.endsAt ?? null) : null;
  if ((startsAt && startsAt.invalid) || (endsAt && endsAt.invalid)) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail("datas de validade invalidas"),
    });
    return;
  }

  const mergedDiscountType = payload.discountType ?? existing.discountType;
  const discountTypeChanged =
    payload.discountType !== undefined && payload.discountType !== existing.discountType;
  const mergedPercentOff =
    mergedDiscountType === "PERCENT"
      ? hasPercentOff
        ? payload.percentOff === null || payload.percentOff === undefined
          ? undefined
          : payload.percentOff
        : discountTypeChanged
        ? undefined
        : toDecimalNumber(existing.percentOff)
      : undefined;
  const mergedAmountOff =
    mergedDiscountType === "FIXED"
      ? hasAmountOff
        ? payload.amountOff === null || payload.amountOff === undefined
          ? undefined
          : payload.amountOff
        : discountTypeChanged
        ? undefined
        : toDecimalNumber(existing.amountOff)
      : undefined;
  const mergedStartsAt = startsAt ? startsAt.value ?? null : existing.startsAt;
  const mergedEndsAt = endsAt ? endsAt.value ?? null : existing.endsAt;

  const ruleError = validateDiscountCouponRules({
    discountType: mergedDiscountType,
    percentOff: mergedPercentOff,
    amountOff: mergedAmountOff,
    startsAt: mergedStartsAt,
    endsAt: mergedEndsAt,
  });
  if (ruleError) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(ruleError),
    });
    return;
  }

  try {
    const updated = await prisma.discountCoupon.update({
      where: { id: couponId },
      data: {
        code: hasCode && payload.code ? normalizeCouponCode(payload.code) : undefined,
        name: hasName && payload.name ? payload.name.trim() : undefined,
        discountType: mergedDiscountType,
        percentOff:
          mergedDiscountType === "PERCENT"
            ? new Prisma.Decimal(mergedPercentOff || 0)
            : null,
        amountOff:
          mergedDiscountType === "FIXED" ? new Prisma.Decimal(mergedAmountOff || 0) : null,
        minSubtotal: hasMinSubtotal
          ? payload.minSubtotal === null || payload.minSubtotal === undefined
            ? null
            : new Prisma.Decimal(payload.minSubtotal)
          : undefined,
        startsAt: startsAt ? startsAt.value ?? null : undefined,
        endsAt: endsAt ? endsAt.value ?? null : undefined,
        isActive: hasIsActive ? Boolean(payload.isActive) : undefined,
      },
    });
    res.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({
        message: MSG.INVALID_PAYLOAD,
        ...withDetail("codigo de cupom ja cadastrado"),
      });
      return;
    }
    logger.error("Falha ao atualizar cupom de desconto", { error, couponId });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(error instanceof Error ? error.message : "update_discount_coupon_failed"),
    });
  }
});

router.delete("/discount-coupons/:id", requireAdmin, async (req, res) => {
  const couponId = Number(req.params.id);
  if (!Number.isFinite(couponId) || couponId <= 0) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }

  try {
    await prisma.discountCoupon.delete({ where: { id: couponId } });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ message: MSG.CONTENT_NOT_FOUND });
      return;
    }
    logger.error("Falha ao excluir cupom de desconto", { error, couponId });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(error instanceof Error ? error.message : "delete_discount_coupon_failed"),
    });
  }
});

router.post("/public/discount-coupons/validate", async (req, res) => {
  const parsed = publicDiscountCouponValidateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const code = normalizeCouponCode(parsed.data.code);
  const subtotal = parsed.data.subtotal;

  try {
    const coupon = await prisma.discountCoupon.findUnique({
      where: { code },
    });
    if (!coupon) {
      res.status(404).json({ message: "cupom nao encontrado" });
      return;
    }

    const validationError = getCouponValidationError(coupon, subtotal);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const discountValue = calculateCouponDiscount(coupon, subtotal);
    const total = roundCurrency(Math.max(0, subtotal - discountValue));

    res.json({
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        percentOff: coupon.percentOff === null ? null : toDecimalNumber(coupon.percentOff),
        amountOff: coupon.amountOff === null ? null : toDecimalNumber(coupon.amountOff),
        minSubtotal: coupon.minSubtotal === null ? null : toDecimalNumber(coupon.minSubtotal),
        startsAt: coupon.startsAt,
        endsAt: coupon.endsAt,
        isActive: coupon.isActive,
      },
      subtotal: roundCurrency(subtotal),
      discount: discountValue,
      total,
    });
  } catch (error) {
    logger.error("Falha ao validar cupom publico no checkout", { error, code, subtotal });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(error instanceof Error ? error.message : "validate_public_discount_coupon_failed"),
    });
  }
});

router.get("/public/checkout/shipping-policy", async (_req, res) => {
  try {
    const policy = await readCheckoutShippingPolicy();
    res.json({
      policy,
      deliveryMethods: [
        { code: "PICKUP", label: "Retirada no salao" },
        { code: "LOCAL_DELIVERY", label: "Entrega local" },
      ],
    });
  } catch (error) {
    logger.error("Falha ao ler politica de frete publico", { error });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(error instanceof Error ? error.message : "shipping_policy_read_failed"),
    });
  }
});

router.post("/public/payments/stripe/checkout-session", async (req, res) => {
  const parsed = publicStripeCheckoutSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  let stripeConfig;
  try {
    stripeConfig = assertStripeEnabled();
  } catch (error) {
    const detail = error instanceof Error ? error.message : "stripe_disabled";
    res.status(503).json({
      message: MSG.INVALID_PAYMENT,
      ...withDetail(detail),
    });
    return;
  }

  const payload = parsed.data;
  const productQuantities = new Map<number, number>();
  const membershipQuantities = new Map<number, number>();
  for (const item of payload.items) {
    if (item.itemType === "PRODUCT") {
      const current = productQuantities.get(item.entityId) || 0;
      productQuantities.set(item.entityId, current + item.quantity);
      continue;
    }
    const current = membershipQuantities.get(item.entityId) || 0;
    membershipQuantities.set(item.entityId, current + item.quantity);
  }

  const productIds = Array.from(productQuantities.keys());
  const membershipIds = Array.from(membershipQuantities.keys());
  const [products, memberships] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, price: true, stock: true },
        })
      : Promise.resolve([]),
    membershipIds.length
      ? prisma.membership.findMany({
          where: { id: { in: membershipIds } },
          select: { id: true, name: true, title: true, price: true, status: true },
        })
      : Promise.resolve([]),
  ]);

  if (products.length !== productIds.length) {
    res.status(404).json({ message: MSG.PRODUCT_NOT_FOUND });
    return;
  }
  if (memberships.length !== membershipIds.length) {
    res.status(404).json({ message: MSG.MEMBERSHIP_NOT_FOUND });
    return;
  }

  const inactiveMembership = memberships.find((item) => {
    const status = (item.status || "").trim().toUpperCase();
    return status !== "ATIVO" && status !== "ACTIVE";
  });
  if (inactiveMembership) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(`assinatura inativa: ${inactiveMembership.name}`),
    });
    return;
  }

  const productById = new Map(products.map((item) => [item.id, item]));
  const membershipById = new Map(memberships.map((item) => [item.id, item]));

  const pricedItems: PublicStripePricedItem[] = [];
  for (const item of payload.items as PublicStripeCheckoutItem[]) {
    if (item.itemType === "PRODUCT") {
      const product = productById.get(item.entityId);
      if (!product) {
        res.status(404).json({ message: MSG.PRODUCT_NOT_FOUND });
        return;
      }
      pricedItems.push({
        itemType: "PRODUCT",
        entityId: product.id,
        quantity: item.quantity,
        name: product.name,
        unitPrice: toDecimalNumber(product.price),
      });
      continue;
    }

    const membership = membershipById.get(item.entityId);
    if (!membership) {
      res.status(404).json({ message: MSG.MEMBERSHIP_NOT_FOUND });
      return;
    }
    pricedItems.push({
      itemType: "MEMBERSHIP",
      entityId: membership.id,
      quantity: item.quantity,
      name: `${membership.name} - ${membership.title}`,
      unitPrice: toDecimalNumber(membership.price),
    });
  }

  const subtotal = roundCurrency(
    pricedItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0)
  );
  const shippingPolicy = await readCheckoutShippingPolicy();
  const deliveryMethod = payload.deliveryMethod as CheckoutDeliveryMethod;
  const shipping = calculateCheckoutShipping(subtotal, deliveryMethod, shippingPolicy);
  const normalizedCouponCode = payload.couponCode ? normalizeCouponCode(payload.couponCode) : null;

  let discount = 0;
  let couponId: number | null = null;
  if (normalizedCouponCode) {
    const coupon = await prisma.discountCoupon.findUnique({
      where: { code: normalizedCouponCode },
    });
    if (!coupon) {
      res.status(404).json({ message: "cupom nao encontrado" });
      return;
    }
    const validationError = getCouponValidationError(coupon, subtotal);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }
    discount = calculateCouponDiscount(coupon, subtotal);
    couponId = coupon.id;
  }

  const total = roundCurrency(Math.max(0, subtotal + shipping - discount));
  if (total <= 0) {
    res.status(400).json({
      message: MSG.INVALID_ORDER,
      ...withDetail("total do pedido invalido para checkout stripe"),
    });
    return;
  }

  let createdOrder: { id: number; publicCode: string | null; total: Prisma.Decimal };
  let createdPayment: { id: number };
  try {
    const created = await prisma.$transaction(async (tx) => {
      if (productIds.length) {
        for (const productId of productIds) {
          const quantity = productQuantities.get(productId) || 0;
          const updated = await tx.product.updateMany({
            where: { id: productId, stock: { gte: quantity } },
            data: { stock: { decrement: quantity } },
          });
          if (updated.count !== 1) {
            throw new Error(`insufficient_stock_${productId}`);
          }
        }
      }

      const order = await tx.order.create({
        data: {
          publicCode: buildOrderPublicCode(),
          status: "PENDENTE",
          fulfillmentStatus: "PENDENTE",
          total: new Prisma.Decimal(total),
          customerName: payload.customerName.trim(),
          customerEmail: payload.customerEmail.trim().toLowerCase(),
          customerPhone: payload.customerPhone,
          items: {
            create: pricedItems.map((item) => ({
              productId: item.itemType === "PRODUCT" ? item.entityId : null,
              membershipId: item.itemType === "MEMBERSHIP" ? item.entityId : null,
              quantity: item.quantity,
              unitPrice: new Prisma.Decimal(item.unitPrice),
            })),
          },
        },
        select: { id: true, publicCode: true, total: true },
      });

      const payment = await tx.payment.create({
        data: {
          provider: "STRIPE",
          status: "PENDENTE",
          amount: new Prisma.Decimal(total),
          method: "CARD",
          orderId: order.id,
          rawPayload: {
            origin: "public_checkout",
            deliveryMethod,
            subtotal,
            shipping,
            discount,
            couponCode: normalizedCouponCode,
            couponId,
          },
        },
        select: { id: true },
      });

      return { order, payment };
    });
    createdOrder = created.order;
    createdPayment = created.payment;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "order_create_failed";
    if (detail.startsWith("insufficient_stock_")) {
      res.status(400).json({
        message: MSG.INVALID_ORDER,
        ...withDetail("estoque insuficiente para um ou mais produtos"),
      });
      return;
    }
    logger.error("Falha ao criar pedido/pagamento para checkout stripe", { error: detail });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(detail),
    });
    return;
  }

  const checkoutLineItems = [
    {
      name: `Pedido ${createdOrder.publicCode || `#${createdOrder.id}`}`,
      description: "Pagamento de compra no site JLR",
      quantity: 1,
      unitAmount: total,
    },
  ];

  let sessionId: string;
  let checkoutUrl: string;
  try {
    const session = await createPublicStripeCheckoutSession({
      lineItems: checkoutLineItems,
      customerEmail: payload.customerEmail,
      metadata: {
        orderId: String(createdOrder.id),
        paymentRecordId: String(createdPayment.id),
        publicCode: createdOrder.publicCode || "",
      },
      cancelUrl: buildStripeCancelUrlWithContext(stripeConfig.cancelUrl, {
        orderId: createdOrder.id,
        paymentRecordId: createdPayment.id,
      }),
    });
    if (!session.url) {
      throw new Error("stripe_session_without_url");
    }
    sessionId = session.id;
    checkoutUrl = session.url;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "stripe_session_create_failed";
    logger.error("Falha ao criar sessao Stripe Checkout", {
      error: detail,
      orderId: createdOrder.id,
      paymentId: createdPayment.id,
    });
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: createdPayment.id },
        data: {
          status: "RECUSADO",
          rawPayload: {
            origin: "public_checkout",
            error: detail,
          },
        },
      });
      await cancelOrderWithOptionalRestock(tx, {
        orderId: createdOrder.id,
        source: "STRIPE_SESSION",
        note: "falha ao criar sessao stripe",
        forceRestock: true,
      });
    });
    res.status(502).json({
      message: MSG.INVALID_PAYMENT,
      ...withDetail("stripe_checkout_session_failed"),
    });
    return;
  }

  await prisma.payment.update({
    where: { id: createdPayment.id },
    data: {
      providerPaymentId: sessionId,
      rawPayload: {
        origin: "public_checkout",
        deliveryMethod,
        subtotal,
        shipping,
        discount,
        couponCode: normalizedCouponCode,
        couponId,
        stripeSessionId: sessionId,
      },
    },
  });

  res.status(201).json({
    sessionId,
    checkoutUrl,
    orderId: createdOrder.id,
    publicCode: createdOrder.publicCode,
    paymentRecordId: createdPayment.id,
    totals: {
      subtotal,
      shipping,
      discount,
      total,
    },
  });
});

router.get("/public/payments/stripe/confirm-session", async (req, res) => {
  const parsed = publicStripeConfirmSessionQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  try {
    assertStripeEnabled();
  } catch (error) {
    const detail = error instanceof Error ? error.message : "stripe_disabled";
    res.status(503).json({
      message: MSG.INVALID_PAYMENT,
      ...withDetail(detail),
    });
    return;
  }

  const { sessionId } = parsed.data;
  let session;
  try {
    session = await retrieveStripeCheckoutSession(sessionId);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "stripe_session_not_found";
    res.status(404).json({
      message: MSG.INVALID_PAYMENT,
      ...withDetail(detail),
    });
    return;
  }

  const payment = await prisma.payment.findFirst({
    where: {
      provider: "STRIPE",
      providerPaymentId: session.id,
    },
    include: {
      order: true,
    },
  });
  if (!payment) {
    res.status(404).json({ message: MSG.PAYMENT_NOT_FOUND });
    return;
  }

  if (session.payment_status === "paid") {
    await prisma.$transaction(async (tx) => {
      const currentPayment = await tx.payment.findUnique({
        where: { id: payment.id },
        select: { id: true, status: true, orderId: true },
      });
      if (!currentPayment) return;
      if (currentPayment.status !== "APROVADO") {
        await tx.payment.update({
          where: { id: currentPayment.id },
          data: {
            status: "APROVADO",
            paidAt: new Date(),
            rawPayload: {
              stripeSessionId: session.id,
              stripePaymentIntentId:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : session.payment_intent?.id || null,
              confirmSource: "confirm_session",
            },
          },
        });
      }
      if (currentPayment.orderId) {
        await markOrderAsPaid(tx, {
          orderId: currentPayment.orderId,
          source: "STRIPE_CONFIRM",
          note: "pagamento confirmado por confirm-session",
        });
      }
    });
  } else if (session.status === "expired" && payment.status === "PENDENTE") {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "CANCELADO",
        rawPayload: {
            stripeSessionId: session.id,
            confirmSource: "confirm_session",
            reason: "expired",
          },
        },
      });
      if (payment.orderId) {
        await cancelOrderWithOptionalRestock(tx, {
          orderId: payment.orderId,
          source: "STRIPE_CONFIRM",
          note: "sessao stripe expirada",
          forceRestock: true,
        });
      }
    });
  }

  const refreshed = await prisma.payment.findUnique({
    where: { id: payment.id },
    include: {
      order: true,
    },
  });
  if (!refreshed) {
    res.status(404).json({ message: MSG.PAYMENT_NOT_FOUND });
    return;
  }

  res.json({
    sessionId: session.id,
    stripeSessionStatus: session.status,
    stripePaymentStatus: session.payment_status,
    paymentStatus: refreshed.status,
    order: refreshed.order
      ? {
          id: refreshed.order.id,
          publicCode: refreshed.order.publicCode,
          status: refreshed.order.status,
          fulfillmentStatus: refreshed.order.fulfillmentStatus,
          total: toDecimalNumber(refreshed.order.total),
          paymentConfirmedAt: refreshed.order.paymentConfirmedAt,
          shipmentTrackingCode: refreshed.order.shipmentTrackingCode,
          shipmentCarrier: refreshed.order.shipmentCarrier,
          shippedAt: refreshed.order.shippedAt,
          deliveredAt: refreshed.order.deliveredAt,
        }
      : null,
  });
});

router.post("/public/payments/stripe/cancel-pending", async (req, res) => {
  const parsed = publicStripeCancelPendingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const payload = parsed.data;
  const payment = payload.paymentRecordId
    ? await prisma.payment.findUnique({
        where: { id: payload.paymentRecordId },
      })
    : await prisma.payment.findFirst({
        where: {
          orderId: payload.orderId,
          provider: "STRIPE",
        },
        orderBy: { id: "desc" },
      });

  if (!payment || payment.provider !== "STRIPE") {
    res.status(404).json({ message: MSG.PAYMENT_NOT_FOUND });
    return;
  }

  await prisma.$transaction(async (tx) => {
    const currentPayment = await tx.payment.findUnique({
      where: { id: payment.id },
      select: { id: true, status: true, orderId: true },
    });
    if (!currentPayment) return;

    if (currentPayment.status !== "APROVADO") {
      await tx.payment.update({
        where: { id: currentPayment.id },
        data: { status: "CANCELADO" },
      });
    }

    if (currentPayment.orderId) {
      await cancelOrderWithOptionalRestock(tx, {
        orderId: currentPayment.orderId,
        source: "STRIPE_CANCEL",
        note: "checkout cancelado antes da confirmacao",
        forceRestock: true,
      });
    }
  });

  res.json({ ok: true, paymentId: payment.id });
});

router.get("/public/orders/track/:publicCode", async (req, res) => {
  const code = String(req.params.publicCode || "").trim();
  if (!code) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }

  const order = await prisma.order.findFirst({
    where: { publicCode: code },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, imageUrl: true } },
          membership: { select: { id: true, name: true, title: true } },
          service: { select: { id: true, name: true } },
        },
      },
      payments: {
        orderBy: { id: "desc" },
        select: {
          id: true,
          provider: true,
          providerPaymentId: true,
          status: true,
          amount: true,
          method: true,
          paidAt: true,
          createdAt: true,
        },
      },
    },
  });
  if (!order) {
    res.status(404).json({ message: MSG.ORDER_NOT_FOUND });
    return;
  }

  res.json({
    id: order.id,
    publicCode: order.publicCode,
    status: order.status,
    fulfillmentStatus: order.fulfillmentStatus,
    total: toDecimalNumber(order.total),
    createdAt: order.createdAt,
    paymentConfirmedAt: order.paymentConfirmedAt,
    separatedAt: order.separatedAt,
    packedAt: order.packedAt,
    dispatchedAt: order.dispatchedAt,
    shipmentTrackingCode: order.shipmentTrackingCode,
    shipmentCarrier: order.shipmentCarrier,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: toDecimalNumber(item.unitPrice),
      product: item.product,
      membership: item.membership,
      service: item.service,
    })),
    payments: order.payments.map((item) => ({
      ...item,
      amount: toDecimalNumber(item.amount),
    })),
  });
});

router.get("/public/products", async (_req, res) => {
  const products = await prisma.product.findMany({
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      description: true,
      sku: true,
      price: true,
      imageUrl: true,
      benefits: true,
      isFeatured: true,
      productStatus: {
        select: {
          name: true,
        },
      },
    },
  });

  const activeStatusNames = new Set(["ACTIVE", "ATIVO", "ATIVA"]);
  const visibleProducts = products
    .filter((product) => {
      const statusName = product.productStatus?.name?.trim().toUpperCase();
      if (!statusName) return true;
      return activeStatusNames.has(statusName);
    })
    .map(({ productStatus: _productStatus, ...product }) => product);

  res.json(visibleProducts);
});

router.get("/public/memberships", async (_req, res) => {
  const memberships = await prisma.membership.findMany({
    where: {
      OR: [{ status: "Ativo" }, { status: "ACTIVE" }],
    },
    orderBy: [{ isFeatured: "desc" }, { price: "asc" }],
  });
  res.json(memberships);
});

router.post("/public/subscriptions", async (req, res) => {
  const parsed = publicSubscriptionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const payload = parsed.data;
  const membership = await prisma.membership.findUnique({
    where: { id: Number(payload.membershipId) },
  });
  if (!membership || !["Ativo", "ACTIVE"].includes(membership.status || "")) {
    res.status(404).json({ message: MSG.MEMBERSHIP_NOT_FOUND });
    return;
  }

  const created = await prisma.subscription.create({
    data: {
      membershipId: membership.id,
      customerName: payload.customerName.trim(),
      customerEmail: payload.customerEmail.trim().toLowerCase(),
      customerPhone: payload.customerPhone,
      status: "PENDENTE",
      startedAt: new Date(),
      cancelledAt: null,
    },
  });
  res.status(201).json({ id: created.id, membershipId: created.membershipId });
});

router.get("/public/concierge/options", async (_req, res) => {
  try {
    const [options, bookingContext] = await Promise.all([
      getConciergeOptions(),
      listPublicConciergeContext(),
    ]);
    res.json({ ...options, bookingContext });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "erro inesperado";
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(detail),
    });
  }
});

router.get("/public/concierge/booking-context", async (_req, res) => {
  try {
    const payload = await listPublicConciergeContext();
    res.json(payload);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "erro inesperado";
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(detail),
    });
  }
});

router.get("/public/concierge/services", async (req, res) => {
  const parsed = conciergeAvailabilityQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  try {
    const categories = await listPublicServicesByCategory({
      unitId: parsed.data.unitId,
      dateIso: parsed.data.date,
    });
    res.json({ categories });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "erro inesperado";
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(detail),
    });
  }
});

router.get("/public/services/catalog", async (_req, res) => {
  try {
    const categories = await listPublicServiceCatalogByCategory();
    res.json({ categories });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "erro inesperado";
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(detail),
    });
  }
});

router.get("/public/concierge/periods", async (req, res) => {
  const parsed = conciergePeriodsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  try {
    const periods = await listPublicPeriodsForService({
      unitId: parsed.data.unitId,
      dateIso: parsed.data.date,
      serviceId: parsed.data.serviceId,
    });
    res.json({ periods });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "erro inesperado";
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(detail),
    });
  }
});

router.get("/public/concierge/slots", async (req, res) => {
  const parsed = conciergeSlotsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  try {
    const slots = await listPublicSlotsForService({
      unitId: parsed.data.unitId,
      dateIso: parsed.data.date,
      serviceId: parsed.data.serviceId,
      period: parsed.data.period,
    });
    res.json({ slots });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "erro inesperado";
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(detail),
    });
  }
});

router.get("/public/concierge/slot-professionals", async (req, res) => {
  const parsed = conciergeSlotProfessionalsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  try {
    const professionals = await listAvailableProfessionalsForSlot({
      unitId: parsed.data.unitId,
      dateIso: parsed.data.date,
      serviceId: parsed.data.serviceId,
      slotLabel: parsed.data.slotLabel,
    });
    res.json({ professionals });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "erro inesperado";
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(detail),
    });
  }
});

router.post("/public/concierge/book", async (req, res) => {
  const parsed = conciergeBookSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  let resolvedClientId = parsed.data.clientId;
  try {
    const customer = await upsertConciergeCustomerByPhone({
      phone: parsed.data.clientPhone,
      name: parsed.data.clientName,
      createOriginNote: "*cliente vindo pelo chatbot web",
    });
    // Appointment.clientId referencia User.id; Customer.id nao pode ser usado aqui.
    resolvedClientId = customer.userId ?? parsed.data.clientId;
  } catch (error) {
    logger.error("Falha ao verificar/cadastrar cliente no chatbot web", {
      error,
      route: "/public/concierge/book",
    });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail("customer_upsert_failed"),
    });
    return;
  }

  const result = await createRemoteAppointment({
    unitId: parsed.data.unitId,
    serviceId: parsed.data.serviceId,
    dateIso: parsed.data.date,
    slotLabel: parsed.data.slotLabel,
    preferredProfessionalId: parsed.data.preferredProfessionalId,
    strictPreferredProfessional: parsed.data.preferredProfessionalId !== undefined,
    clientName: parsed.data.clientName,
    clientPhone: parsed.data.clientPhone,
    clientId: resolvedClientId,
    notes: parsed.data.notes,
    orderId: parsed.data.orderId,
  });

  if (!result.ok) {
    if (result.reason === "slot_unavailable") {
      res.status(409).json({
        message: MSG.INVALID_APPOINTMENT,
        ...withDetail("slot indisponivel"),
      });
      return;
    }
    if (
      result.reason === "unit_not_found" ||
      result.reason === "service_not_found" ||
      result.reason === "invalid_date" ||
      result.reason === "invalid_slot" ||
      result.reason === "outside_unit_hours" ||
      result.reason === "service_duration_invalid" ||
      result.reason === "no_professional_available"
    ) {
      res.status(400).json({
        message: MSG.INVALID_APPOINTMENT,
        ...withDetail(result.reason),
      });
      return;
    }
    res.status(400).json({
      message: MSG.INVALID_APPOINTMENT,
      ...withDetail(result.reason),
    });
    return;
  }

  res.status(201).json({ success: true, appointment: result.appointment });
});

router.post("/public/concierge/waitlist", async (req, res) => {
  const parsed = conciergeWaitlistSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const requestedDate = new Date(`${parsed.data.requestedDate}T00:00:00`);
  if (Number.isNaN(requestedDate.getTime())) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail("data invalida"),
    });
    return;
  }

  const unit = await prisma.unit.findUnique({ where: { id: parsed.data.unitId }, select: { id: true } });
  if (!unit) {
    res.status(404).json({ message: MSG.INVALID_APPOINTMENT, ...withDetail("unit_not_found") });
    return;
  }

  const waitlist = await prisma.appointmentWaitlistMessage.create({
    data: {
      unitId: parsed.data.unitId,
      requestedDate,
      serviceName: parsed.data.requestedServiceName.trim(),
      clientName: parsed.data.clientName?.trim() || null,
      clientPhone: parsed.data.clientPhone,
      notes: parsed.data.notes?.trim() || null,
      status: "PENDING",
    },
    select: {
      id: true,
      unitId: true,
      requestedDate: true,
      serviceName: true,
      clientName: true,
      clientPhone: true,
      status: true,
      createdAt: true,
    },
  });
  res.status(201).json({ success: true, waitlist });
});

router.post("/public/concierge/complete", async (req, res) => {
  const parsed = conciergeCompleteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const result = await completeWebConciergeSession(parsed.data);
  if (!result.success) {
    const detail = result.detail || "falha ao finalizar concierge";
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(detail),
    });
    return;
  }
  res.status(201).json({ success: true, summary: result.summary || "" });
});

router.post("/public/concierge/whatsapp-summary", async (req, res) => {
  const parsed = conciergeWhatsappSummarySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  if (!isZApiConfigured()) {
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail("zapi nao configurada"),
    });
    return;
  }

  const destinationPhone = parsed.data.recipientPhone || getDefaultZApiTargetPhone();
  if (!destinationPhone) {
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail("telefone de destino zapi nao configurado"),
    });
    return;
  }

  try {
    const result = await sendZApiTextMessage({
      phone: destinationPhone,
      message: parsed.data.summary.trim(),
    });

    if (!result.ok) {
      res.status(502).json({
        message: MSG.SERVER_ERROR,
        ...withDetail(`falha zapi: status ${result.status}`),
      });
      return;
    }

    res.status(202).json({ success: true });
  } catch (error) {
    logger.error("Falha no disparo de resumo do concierge via Z-API", {
      error: error instanceof Error ? error.message : "erro inesperado",
    });
    const detail = error instanceof Error ? error.message : "erro inesperado";
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(detail),
    });
  }
});

router.get("/public/webhooks/zapi", (_req, res) => {
  res.status(200).json({ ok: true, provider: "zapi", webhook: "online" });
});

router.post("/public/webhooks/zapi", async (req, res) => {
  const expectedSecret = (process.env.ZAPI_WEBHOOK_SECRET || "").trim();
  if (!expectedSecret) {
    logger.error("Webhook Z-API bloqueado por configuracao ausente", {
      reason: "missing_webhook_secret",
    });
    res.status(503).json({
      message: MSG.SERVER_ERROR,
      ...withDetail("zapi webhook secret nao configurado"),
    });
    return;
  }

  const headerSecretRaw = req.headers["x-zapi-secret"];
  const headerSecret =
    typeof headerSecretRaw === "string"
      ? headerSecretRaw.trim()
      : Array.isArray(headerSecretRaw)
      ? String(headerSecretRaw[0] || "").trim()
      : "";
  const querySecret =
    typeof req.query.secret === "string" ? req.query.secret.trim() : "";
  if (headerSecret !== expectedSecret && querySecret !== expectedSecret) {
    res.status(401).json({ message: MSG.UNAUTHORIZED });
    return;
  }

  const parsed = parseZApiWebhookMessage(req.body);
  if (!parsed) {
    res.status(200).json({ received: true, stored: false, reason: "unsupported_payload" });
    return;
  }

  if (parsed.fromMe) {
    res.status(200).json({ received: true, stored: false, reason: "from_me_ignored" });
    return;
  }

  const stored = pushConciergeInboundMessage({
    id: parsed.messageId,
    phone: parsed.phone,
    text: parsed.text,
    createdAt: parsed.createdAt,
  });
  const flow = await processWhatsappConciergeInbound(parsed.phone, parsed.text);

  if (stored) {
    logger.info("Z-API webhook message stored for concierge inbox", {
      phoneSuffix: stored.phone.slice(-4),
      flowOk: flow.ok,
    });
  }

  res.status(200).json({
    received: true,
    stored: Boolean(stored),
    flowOk: flow.ok,
    ...(flow.reason ? { reason: flow.reason } : {}),
  });
});

router.get("/concierge/inbox", requireAdmin, async (req, res) => {
  const phone = typeof req.query.phone === "string" ? req.query.phone : "";
  const sinceRaw = typeof req.query.since === "string" ? Number(req.query.since) : 0;
  const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 30;

  const messages = listConciergeInboundMessages({
    phone,
    sinceMs: Number.isFinite(sinceRaw) ? sinceRaw : 0,
    limit: Number.isFinite(limitRaw) ? limitRaw : 30,
  });
  res.json({ messages });
});

router.get("/concierge/sessions", requireAdmin, async (req, res) => {
  const searchRaw = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const searchDigits = searchRaw.replace(/\D/g, "");
  const statusRaw = typeof req.query.status === "string" ? req.query.status.trim().toUpperCase() : "";
  const fromRaw = typeof req.query.from === "string" ? req.query.from.trim() : "";
  const toRaw = typeof req.query.to === "string" ? req.query.to.trim() : "";
  const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 200;
  const take = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, Number(limitRaw))) : 200;

  const where: Prisma.ConciergeSessionWhereInput = {};
  if (statusRaw === "ACTIVE" || statusRaw === "COMPLETED" || statusRaw === "CANCELLED") {
    where.status = statusRaw;
  }
  if (searchRaw) {
    const orFilters: Prisma.ConciergeSessionWhereInput[] = [
      { customerName: { contains: searchRaw } },
      { summaryText: { contains: searchRaw } },
      { slotLabel: { contains: searchRaw } },
      { scheduledDateLabel: { contains: searchRaw } },
      { service: { is: { name: { contains: searchRaw } } } },
      { unit: { is: { name: { contains: searchRaw } } } },
    ];
    if (searchDigits) {
      orFilters.push({ phone: { contains: searchDigits } });
    }
    where.OR = orFilters;
  }

  const createdAtFilter: Prisma.DateTimeFilter = {};
  if (fromRaw) {
    const fromDate = new Date(fromRaw);
    if (!Number.isNaN(fromDate.getTime())) {
      createdAtFilter.gte = fromDate;
    }
  }
  if (toRaw) {
    const toDate = new Date(toRaw);
    if (!Number.isNaN(toDate.getTime())) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(toRaw)) {
        toDate.setHours(23, 59, 59, 999);
      }
      createdAtFilter.lte = toDate;
    }
  }
  if (createdAtFilter.gte || createdAtFilter.lte) {
    where.createdAt = createdAtFilter;
  }

  const sessions = await prisma.conciergeSession.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    include: {
      service: { select: { id: true, name: true } },
      unit: { select: { id: true, name: true } },
      _count: { select: { events: true } },
    },
  });

  res.json({
    items: sessions.map((session) => ({
      id: session.id,
      origin: session.origin,
      status: session.status,
      phone: session.phone,
      customerName: session.customerName,
      service: session.service,
      unit: session.unit,
      slotLabel: session.slotLabel,
      scheduledDateLabel: session.scheduledDateLabel,
      scheduledFor: session.scheduledFor,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
      lastInboundAt: session.lastInboundAt,
      summarySentAt: session.summarySentAt,
      eventsCount: session._count.events,
    })),
  });
});

router.get("/concierge/waitlist", requireAdmin, async (req, res) => {
  const searchRaw = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const searchDigits = searchRaw.replace(/\D/g, "");
  const statusRaw = typeof req.query.status === "string" ? req.query.status.trim().toUpperCase() : "";
  const fromRaw = typeof req.query.from === "string" ? req.query.from.trim() : "";
  const toRaw = typeof req.query.to === "string" ? req.query.to.trim() : "";
  const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 200;
  const take = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, Number(limitRaw))) : 200;

  const where: Prisma.AppointmentWaitlistMessageWhereInput = {};
  if (statusRaw) {
    where.status = statusRaw;
  }
  if (searchRaw) {
    const orFilters: Prisma.AppointmentWaitlistMessageWhereInput[] = [
      { serviceName: { contains: searchRaw } },
      { clientName: { contains: searchRaw } },
      { notes: { contains: searchRaw } },
      { unit: { is: { name: { contains: searchRaw } } } },
    ];
    if (searchDigits) {
      orFilters.push({ clientPhone: { contains: searchDigits } });
    }
    where.OR = orFilters;
  }

  const dateFilter: Prisma.DateTimeFilter = {};
  if (fromRaw) {
    const fromDate = new Date(fromRaw);
    if (!Number.isNaN(fromDate.getTime())) {
      dateFilter.gte = fromDate;
    }
  }
  if (toRaw) {
    const toDate = new Date(toRaw);
    if (!Number.isNaN(toDate.getTime())) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(toRaw)) {
        toDate.setHours(23, 59, 59, 999);
      }
      dateFilter.lte = toDate;
    }
  }
  if (dateFilter.gte || dateFilter.lte) {
    where.requestedDate = dateFilter;
  }

  const waitlist = await prisma.appointmentWaitlistMessage.findMany({
    where,
    orderBy: [{ requestedDate: "asc" }, { createdAt: "desc" }],
    take,
    include: {
      unit: {
        select: { id: true, name: true },
      },
    },
  });

  res.json({
    items: waitlist.map((row) => ({
      id: row.id,
      unit: row.unit,
      requestedDate: row.requestedDate,
      serviceName: row.serviceName,
      clientName: row.clientName,
      clientPhone: row.clientPhone,
      notes: row.notes,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })),
  });
});

router.get("/professional-shifts", requireAdmin, async (req, res) => {
  const parsed = professionalShiftQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const where: Prisma.ProfessionalShiftWhereInput = {};
  if (parsed.data.professionalId) where.professionalId = parsed.data.professionalId;
  if (parsed.data.unitId) where.unitId = parsed.data.unitId;

  if (parsed.data.date) {
    const start = parseIsoDateStart(parsed.data.date);
    if (!start) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail("data invalida") });
      return;
    }
    where.workDate = { gte: start, lt: addDays(start, 1) };
  } else if (parsed.data.from || parsed.data.to) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (parsed.data.from) {
      const fromStart = parseIsoDateStart(parsed.data.from);
      if (!fromStart) {
        res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail("data inicial invalida") });
        return;
      }
      dateFilter.gte = fromStart;
    }
    if (parsed.data.to) {
      const toStart = parseIsoDateStart(parsed.data.to);
      if (!toStart) {
        res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail("data final invalida") });
        return;
      }
      dateFilter.lt = addDays(toStart, 1);
    }
    where.workDate = dateFilter;
  }

  const take = parsed.data.limit || 200;
  const items = await prisma.professionalShift.findMany({
    where,
    orderBy: [{ workDate: "asc" }, { hourStart: "asc" }, { professionalId: "asc" }],
    take,
    include: {
      professional: { select: { id: true, name: true, unitId: true, userId: true } },
      unit: { select: { id: true, name: true } },
    },
  });
  res.json({ items });
});

router.post("/professional-shifts", requireAdmin, async (req, res) => {
  const parsed = professionalShiftCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  if (!parsed.data.professionalId) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail("professionalId obrigatorio"),
    });
    return;
  }
  if (!validateShiftHours(parsed.data.hourStart, parsed.data.hourFinish)) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail("horario final deve ser maior que inicial"),
    });
    return;
  }

  const workDate = parseIsoDateStart(parsed.data.workDate);
  if (!workDate) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail("workDate invalido"),
    });
    return;
  }

  const professional = await prisma.professional.findUnique({
    where: { id: parsed.data.professionalId },
    select: { id: true, unitId: true },
  });
  if (!professional) {
    res.status(404).json({ message: MSG.USER_NOT_FOUND });
    return;
  }

  const unitId = parsed.data.unitId ?? professional.unitId;
  if (!unitId) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail("profissional sem unidade vinculada"),
    });
    return;
  }

  const created = await prisma.professionalShift.create({
    data: {
      professionalId: professional.id,
      unitId,
      workDate,
      hourStart: parsed.data.hourStart,
      hourFinish: parsed.data.hourFinish,
      isActive: parsed.data.isActive ?? true,
      notes: parsed.data.notes?.trim() || null,
    },
    include: {
      professional: { select: { id: true, name: true } },
      unit: { select: { id: true, name: true } },
    },
  });
  res.status(201).json(created);
});

router.patch("/professional-shifts/:id", requireAdmin, async (req, res) => {
  const shiftId = Number(req.params.id);
  if (!Number.isFinite(shiftId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = professionalShiftUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const existing = await prisma.professionalShift.findUnique({
    where: { id: shiftId },
  });
  if (!existing) {
    res.status(404).json({ message: MSG.USER_NOT_FOUND });
    return;
  }

  const nextHourStart = parsed.data.hourStart ?? existing.hourStart;
  const nextHourFinish = parsed.data.hourFinish ?? existing.hourFinish;
  if (!validateShiftHours(nextHourStart, nextHourFinish)) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail("horario final deve ser maior que inicial"),
    });
    return;
  }

  let nextWorkDate: Date | undefined;
  if (parsed.data.workDate !== undefined) {
    const parsedDate = parseIsoDateStart(parsed.data.workDate);
    if (!parsedDate) {
      res.status(400).json({
        message: MSG.INVALID_PAYLOAD,
        ...withDetail("workDate invalido"),
      });
      return;
    }
    nextWorkDate = parsedDate;
  }

  const updated = await prisma.professionalShift.update({
    where: { id: shiftId },
    data: {
      workDate: nextWorkDate,
      hourStart: parsed.data.hourStart,
      hourFinish: parsed.data.hourFinish,
      isActive: parsed.data.isActive,
      notes: parsed.data.notes === undefined ? undefined : parsed.data.notes?.trim() || null,
    },
    include: {
      professional: { select: { id: true, name: true } },
      unit: { select: { id: true, name: true } },
    },
  });
  res.json(updated);
});

router.delete("/professional-shifts/:id", requireAdmin, async (req, res) => {
  const shiftId = Number(req.params.id);
  if (!Number.isFinite(shiftId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  await prisma.professionalShift.delete({ where: { id: shiftId } });
  res.status(204).send();
});

router.get("/professionals/me/shifts", requireAuth, async (req, res) => {
  const userId = Number(req.user?.id);
  if (!Number.isFinite(userId)) {
    res.status(401).json({ message: MSG.UNAUTHORIZED });
    return;
  }
  const parsed = professionalShiftQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const professional = await resolveProfessionalByUser(userId);
  if (!professional) {
    res.status(403).json({ message: MSG.FORBIDDEN });
    return;
  }

  const where: Prisma.ProfessionalShiftWhereInput = {
    professionalId: professional.id,
  };

  if (parsed.data.date) {
    const start = parseIsoDateStart(parsed.data.date);
    if (!start) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail("data invalida") });
      return;
    }
    where.workDate = { gte: start, lt: addDays(start, 1) };
  } else if (parsed.data.from || parsed.data.to) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (parsed.data.from) {
      const fromStart = parseIsoDateStart(parsed.data.from);
      if (!fromStart) {
        res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail("data inicial invalida") });
        return;
      }
      dateFilter.gte = fromStart;
    }
    if (parsed.data.to) {
      const toStart = parseIsoDateStart(parsed.data.to);
      if (!toStart) {
        res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail("data final invalida") });
        return;
      }
      dateFilter.lt = addDays(toStart, 1);
    }
    where.workDate = dateFilter;
  }

  const items = await prisma.professionalShift.findMany({
    where,
    orderBy: [{ workDate: "asc" }, { hourStart: "asc" }],
    take: parsed.data.limit || 200,
    include: {
      unit: { select: { id: true, name: true } },
    },
  });
  res.json({ professional, items });
});

router.post("/professionals/me/shifts", requireAuth, async (req, res) => {
  const userId = Number(req.user?.id);
  if (!Number.isFinite(userId)) {
    res.status(401).json({ message: MSG.UNAUTHORIZED });
    return;
  }
  const parsed = professionalShiftCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  if (!validateShiftHours(parsed.data.hourStart, parsed.data.hourFinish)) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail("horario final deve ser maior que inicial"),
    });
    return;
  }
  const professional = await resolveProfessionalByUser(userId);
  if (!professional) {
    res.status(403).json({ message: MSG.FORBIDDEN });
    return;
  }

  const workDate = parseIsoDateStart(parsed.data.workDate);
  if (!workDate) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail("workDate invalido"),
    });
    return;
  }
  const unitId = parsed.data.unitId ?? professional.unitId;
  if (!unitId) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail("profissional sem unidade vinculada"),
    });
    return;
  }

  const created = await prisma.professionalShift.create({
    data: {
      professionalId: professional.id,
      unitId,
      workDate,
      hourStart: parsed.data.hourStart,
      hourFinish: parsed.data.hourFinish,
      isActive: parsed.data.isActive ?? true,
      notes: parsed.data.notes?.trim() || null,
    },
    include: { unit: { select: { id: true, name: true } } },
  });
  res.status(201).json(created);
});

router.patch("/professionals/me/shifts/:id", requireAuth, async (req, res) => {
  const userId = Number(req.user?.id);
  const shiftId = Number(req.params.id);
  if (!Number.isFinite(userId) || !Number.isFinite(shiftId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const professional = await resolveProfessionalByUser(userId);
  if (!professional) {
    res.status(403).json({ message: MSG.FORBIDDEN });
    return;
  }
  const parsed = professionalShiftUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const existing = await prisma.professionalShift.findUnique({
    where: { id: shiftId },
  });
  if (!existing || existing.professionalId !== professional.id) {
    res.status(404).json({ message: MSG.USER_NOT_FOUND });
    return;
  }

  const nextHourStart = parsed.data.hourStart ?? existing.hourStart;
  const nextHourFinish = parsed.data.hourFinish ?? existing.hourFinish;
  if (!validateShiftHours(nextHourStart, nextHourFinish)) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail("horario final deve ser maior que inicial"),
    });
    return;
  }

  let nextWorkDate: Date | undefined;
  if (parsed.data.workDate !== undefined) {
    const parsedDate = parseIsoDateStart(parsed.data.workDate);
    if (!parsedDate) {
      res.status(400).json({
        message: MSG.INVALID_PAYLOAD,
        ...withDetail("workDate invalido"),
      });
      return;
    }
    nextWorkDate = parsedDate;
  }

  const updated = await prisma.professionalShift.update({
    where: { id: shiftId },
    data: {
      workDate: nextWorkDate,
      hourStart: parsed.data.hourStart,
      hourFinish: parsed.data.hourFinish,
      isActive: parsed.data.isActive,
      notes: parsed.data.notes === undefined ? undefined : parsed.data.notes?.trim() || null,
    },
    include: {
      unit: { select: { id: true, name: true } },
    },
  });
  res.json(updated);
});

router.delete("/professionals/me/shifts/:id", requireAuth, async (req, res) => {
  const userId = Number(req.user?.id);
  const shiftId = Number(req.params.id);
  if (!Number.isFinite(userId) || !Number.isFinite(shiftId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const professional = await resolveProfessionalByUser(userId);
  if (!professional) {
    res.status(403).json({ message: MSG.FORBIDDEN });
    return;
  }
  const existing = await prisma.professionalShift.findUnique({
    where: { id: shiftId },
    select: { id: true, professionalId: true },
  });
  if (!existing || existing.professionalId !== professional.id) {
    res.status(404).json({ message: MSG.USER_NOT_FOUND });
    return;
  }
  await prisma.professionalShift.delete({ where: { id: shiftId } });
  res.status(204).send();
});

router.get("/memberships", requireAdmin, async (_req, res) => {
  const memberships = await prisma.membership.findMany({ orderBy: { createdAt: "desc" } });
  res.json(memberships);
});

router.post("/memberships", requireAdmin, async (req, res) => {
  const parsed = membershipSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_MEMBERSHIP,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const { name, title, description, price, benefits, isFeatured, status } = parsed.data;
  const membership = await prisma.membership.create({
    data: {
      name,
      title,
      description,
      price: new Prisma.Decimal(price || 0),
      benefits,
      isFeatured: Boolean(isFeatured ?? false),
      status: status || "Ativo",
    },
  });
  res.status(201).json(membership);
});

router.patch("/memberships/:id", requireAdmin, async (req, res) => {
  const membershipId = Number(req.params.id);
  if (!Number.isFinite(membershipId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = membershipUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_MEMBERSHIP,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const payload = parsed.data;
  const updated = await prisma.membership.update({
    where: { id: membershipId },
    data: {
      name: payload.name,
      title: payload.title,
      description: payload.description,
      price: payload.price !== undefined ? new Prisma.Decimal(payload.price || 0) : undefined,
      benefits: payload.benefits,
      isFeatured: payload.isFeatured,
      status: payload.status,
    },
  });
  res.json(updated);
});

router.delete("/memberships/:id", requireAdmin, async (req, res) => {
  const membershipId = Number(req.params.id);
  if (!Number.isFinite(membershipId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  await prisma.membership.delete({ where: { id: membershipId } });
  res.status(204).send();
});

router.get("/admin/dashboard/kpis", requireAdmin, async (req, res) => {
  const queryDaysRaw = req.query.days;
  const queryDays =
    typeof queryDaysRaw === "string" && queryDaysRaw.trim() !== ""
      ? Number(queryDaysRaw)
      : undefined;
  const queryFrom = typeof req.query.from === "string" ? req.query.from : undefined;
  const queryTo = typeof req.query.to === "string" ? req.query.to : undefined;

  try {
    const kpis = await getAdminDashboardKpis({
      days: queryDays,
      from: queryFrom,
      to: queryTo,
    });
    res.json(kpis);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro inesperado";
    const isValidationError = message.startsWith("invalid_");
    if (isValidationError) {
      res.status(400).json({
        message: MSG.INVALID_PAYLOAD,
        ...withDetail(message),
      });
      return;
    }
    logger.error("Falha ao carregar KPIs do dashboard admin", {
      error: message,
      from: queryFrom,
      to: queryTo,
      days: queryDays,
    });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

router.get("/admin/dashboard/sales-series", requireAdmin, async (req, res) => {
  const queryDaysRaw = req.query.days;
  const queryDays =
    typeof queryDaysRaw === "string" && queryDaysRaw.trim() !== ""
      ? Number(queryDaysRaw)
      : undefined;
  const queryFrom = typeof req.query.from === "string" ? req.query.from : undefined;
  const queryTo = typeof req.query.to === "string" ? req.query.to : undefined;
  const queryScope = typeof req.query.scope === "string" ? req.query.scope.trim().toUpperCase() : undefined;
  const isAllowedScope =
    !queryScope ||
    queryScope === "SERVICES" ||
    queryScope === "PRODUCTS" ||
    queryScope === "SUBSCRIPTIONS" ||
    queryScope === "ALL";
  if (!isAllowedScope) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail("invalid_scope"),
    });
    return;
  }
  const scopeValue: "SERVICES" | "PRODUCTS" | "SUBSCRIPTIONS" | "ALL" | undefined =
    queryScope === "SERVICES" ||
    queryScope === "PRODUCTS" ||
    queryScope === "SUBSCRIPTIONS" ||
    queryScope === "ALL"
      ? queryScope
      : undefined;

  try {
    const series = await getAdminDashboardSalesSeries({
      days: queryDays,
      from: queryFrom,
      to: queryTo,
      scope: scopeValue,
    });
    res.json(series);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro inesperado";
    const isValidationError = message.startsWith("invalid_");
    if (isValidationError) {
      res.status(400).json({
        message: MSG.INVALID_PAYLOAD,
        ...withDetail(message),
      });
      return;
    }
    logger.error("Falha ao carregar serie de vendas do dashboard admin", {
      error: message,
      from: queryFrom,
      to: queryTo,
      days: queryDays,
      scope: queryScope,
    });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

router.get("/admin/dashboard/agenda-summary", requireAdmin, async (req, res) => {
  const queryMonth = typeof req.query.month === "string" ? req.query.month : undefined;
  const queryDate = typeof req.query.date === "string" ? req.query.date : undefined;
  try {
    const summary = await getAdminDashboardAgendaSummary({
      month: queryMonth,
      date: queryDate,
    });
    res.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro inesperado";
    const isValidationError = message.startsWith("invalid_");
    if (isValidationError) {
      res.status(400).json({
        message: MSG.INVALID_PAYLOAD,
        ...withDetail(message),
      });
      return;
    }
    logger.error("Falha ao carregar resumo da agenda do dashboard admin", {
      error: message,
      month: queryMonth,
      date: queryDate,
    });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

router.get("/admin/dashboard/commissions-summary", requireAdmin, async (req, res) => {
  const queryDaysRaw = req.query.days;
  const queryDays =
    typeof queryDaysRaw === "string" && queryDaysRaw.trim() !== ""
      ? Number(queryDaysRaw)
      : undefined;
  const queryFrom = typeof req.query.from === "string" ? req.query.from : undefined;
  const queryTo = typeof req.query.to === "string" ? req.query.to : undefined;
  try {
    const summary = await getAdminDashboardCommissionsSummary({
      days: queryDays,
      from: queryFrom,
      to: queryTo,
    });
    res.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro inesperado";
    const isValidationError = message.startsWith("invalid_");
    if (isValidationError) {
      res.status(400).json({
        message: MSG.INVALID_PAYLOAD,
        ...withDetail(message),
      });
      return;
    }
    logger.error("Falha ao carregar resumo de comissoes do dashboard admin", {
      error: message,
      from: queryFrom,
      to: queryTo,
      days: queryDays,
    });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

router.get("/orders", requireAdmin, async (_req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true } },
          service: { select: { id: true, name: true } },
          membership: { select: { id: true, name: true, title: true } },
        },
      },
      payments: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });
  res.json(orders);
});

router.get("/orders/summary", requireAdmin, async (_req, res) => {
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      status: true,
      fulfillmentStatus: true,
      total: true,
      payments: {
        select: { status: true },
      },
    },
  });

  const totalOrders = orders.length;
  const inProgress = orders.filter((order) =>
    ["PENDENTE", "SEPARANDO", "EMBALADO"].includes(order.fulfillmentStatus)
  ).length;
  const dispatched = orders.filter((order) =>
    ["DESPACHADO", "ENVIADO", "ENTREGUE"].includes(order.fulfillmentStatus)
  ).length;
  const delivered = orders.filter((order) => order.fulfillmentStatus === "ENTREGUE").length;
  const cancelled = orders.filter((order) => order.status === "CANCELADO").length;
  const pendingPayment = orders.filter((order) => {
    const hasLinkedPayment = order.payments.length > 0;
    const hasApprovedPayment = order.payments.some((payment) => payment.status === "APROVADO");
    return hasLinkedPayment && !hasApprovedPayment;
  }).length;
  const confirmedRevenue = orders.reduce((acc, order) => {
    if (!["PAGO", "ENVIADO", "ENTREGUE"].includes(order.status)) return acc;
    return acc + Number(order.total);
  }, 0);

  res.json({
    totalOrders,
    inProgress,
    dispatched,
    delivered,
    cancelled,
    pendingPayment,
    confirmedRevenue,
  });
});

router.get("/order-items", requireAdmin, async (_req, res) => {
  const orderItems = await prisma.orderItem.findMany({
    orderBy: { id: "desc" },
    include: { order: true, product: true, membership: true, service: true },
  });
  res.json(orderItems);
});

router.post("/orders", requireAdmin, async (req, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) {
    const debugHeader = req.headers["x-debug"] === "1";
    res.status(400).json({
      message: MSG.INVALID_ORDER,
      ...(debugHeader
        ? { detail: formatZodDetail(parsed.error.issues), debug: req.body }
        : withDetail(formatZodDetail(parsed.error.issues))),
    });
    return;
  }

  const { items = [], total, customerName, customerEmail, customerPhone } = parsed.data;
  const productQuantities = new Map<number, number>();
  const serviceIds = new Set<number>();
  const membershipIds = new Set<number>();
  items.forEach((item: OrderItemInput) => {
    if (item.productId) {
      const productId = Number(item.productId);
      if (Number.isFinite(productId)) {
        const current = productQuantities.get(productId) || 0;
        productQuantities.set(productId, current + Number(item.quantity || 1));
      }
    }
    if (item.serviceId) {
      const serviceId = Number(item.serviceId);
      if (Number.isFinite(serviceId)) serviceIds.add(serviceId);
    }
    if (item.membershipId) {
      const membershipId = Number(item.membershipId);
      if (Number.isFinite(membershipId)) membershipIds.add(membershipId);
    }
  });
  const productIds = Array.from(productQuantities.keys());
  const serviceIdList = Array.from(serviceIds);
  const membershipIdList = Array.from(membershipIds);
  if (productIds.length) {
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    if (products.length !== productIds.length) {
      res.status(404).json({ message: MSG.PRODUCT_NOT_FOUND });
      return;
    }
    const insufficient = products.find(
      (product) => product.stock < (productQuantities.get(product.id) || 0)
    );
    if (insufficient) {
      const detail = `estoque insuficiente para ${insufficient.name}`;
      const debugHeader = req.headers["x-debug"] === "1";
      res.status(400).json({
        message: MSG.INVALID_ORDER,
        ...(debugHeader ? { detail } : withDetail(detail)),
      });
      return;
    }
  }
  if (serviceIdList.length) {
    const services = await prisma.service.findMany({ where: { id: { in: serviceIdList } } });
    if (services.length !== serviceIdList.length) {
      res.status(404).json({ message: MSG.SERVICE_NOT_FOUND });
      return;
    }
  }
  if (membershipIdList.length) {
    const memberships = await prisma.membership.findMany({
      where: { id: { in: membershipIdList } },
    });
    if (memberships.length !== membershipIdList.length) {
      res.status(404).json({ message: MSG.MEMBERSHIP_NOT_FOUND });
      return;
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    if (productIds.length) {
      await Promise.all(
        productIds.map((productId) =>
          tx.product.update({
            where: { id: productId },
            data: { stock: { decrement: productQuantities.get(productId) || 0 } },
          })
        )
      );
    }
    return tx.order.create({
      data: {
        publicCode: buildOrderPublicCode(),
        total: new Prisma.Decimal(total || 0),
        customerName,
        customerEmail,
        customerPhone,
        items: {
          create: items.map((item: OrderItemInput) => ({
            productId: item.productId ? Number(item.productId) : null,
            membershipId: item.membershipId ? Number(item.membershipId) : null,
            serviceId: item.serviceId ? Number(item.serviceId) : null,
            quantity: Number(item.quantity || 1),
            unitPrice: new Prisma.Decimal(item.unitPrice || 0),
          })),
        },
      },
      include: { items: true },
    });
  });
  res.status(201).json(order);
});

router.patch("/orders/bulk/advance", requireAdmin, async (req, res) => {
  const parsed = orderBulkAdvanceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const orderIds = Array.from(new Set(parsed.data.orderIds));
  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    include: { payments: true },
  });
  const orderById = new Map(orders.map((order) => [order.id, order]));

  const results: Array<{
    orderId: number;
    result: "UPDATED" | "SKIPPED";
    reason?: string;
    previousFulfillmentStatus?: FulfillmentStatus;
    nextFulfillmentStatus?: FulfillmentStatus;
    nextOrderStatus?: OrderStatus;
  }> = [];

  await prisma.$transaction(async (tx) => {
    for (const orderId of orderIds) {
      const existing = orderById.get(orderId);
      if (!existing) {
        results.push({ orderId, result: "SKIPPED", reason: "pedido nao encontrado" });
        continue;
      }

      if (existing.status === "CANCELADO" || existing.fulfillmentStatus === "CANCELADO") {
        results.push({ orderId, result: "SKIPPED", reason: "pedido cancelado" });
        continue;
      }

      const hasApprovedPayment = existing.payments.some((payment) => payment.status === "APROVADO");
      const hasLinkedPayment = existing.payments.length > 0;
      const requiresApprovedPayment = hasLinkedPayment && !hasApprovedPayment;
      if (requiresApprovedPayment) {
        results.push({ orderId, result: "SKIPPED", reason: MSG.ORDER_PAYMENT_REQUIRED });
        continue;
      }

      const nextFulfillmentStatus = getNextFulfillmentStatus(existing.fulfillmentStatus);
      if (!nextFulfillmentStatus) {
        results.push({
          orderId,
          result: "SKIPPED",
          reason: "pedido ja esta na etapa final",
          previousFulfillmentStatus: existing.fulfillmentStatus,
        });
        continue;
      }

      const updateData: Prisma.OrderUpdateInput = {
        fulfillmentStatus: nextFulfillmentStatus,
      };
      let nextOrderStatus: OrderStatus | undefined;
      const now = new Date();

      if (nextFulfillmentStatus === "SEPARANDO") {
        updateData.separatedAt = now;
      }
      if (nextFulfillmentStatus === "EMBALADO") {
        updateData.packedAt = now;
      }
      if (nextFulfillmentStatus === "DESPACHADO") {
        updateData.dispatchedAt = now;
      }
      if (nextFulfillmentStatus === "ENVIADO") {
        updateData.shippedAt = now;
        updateData.status = "ENVIADO";
        nextOrderStatus = "ENVIADO";
      }
      if (nextFulfillmentStatus === "ENTREGUE") {
        updateData.deliveredAt = now;
        updateData.status = "ENTREGUE";
        nextOrderStatus = "ENTREGUE";
      }

      const updated = await tx.order.update({
        where: { id: existing.id },
        data: updateData,
      });

      if (updated.status !== existing.status) {
        await appendOrderStatusHistory(tx, {
          orderId: updated.id,
          fromStatus: existing.status,
          toStatus: updated.status,
          source: "BULK",
          note: "status atualizado por operacao em lote",
        });
      }

      results.push({
        orderId,
        result: "UPDATED",
        previousFulfillmentStatus: existing.fulfillmentStatus,
        nextFulfillmentStatus,
        ...(nextOrderStatus ? { nextOrderStatus } : {}),
      });
    }
  });

  const updatedCount = results.filter((item) => item.result === "UPDATED").length;
  const skippedCount = results.length - updatedCount;
  res.json({
    totalRequested: orderIds.length,
    updatedCount,
    skippedCount,
    results,
  });
});

router.patch("/orders/:id", requireAdmin, async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isFinite(orderId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = orderUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_ORDER,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: true },
  });
  if (!existing) {
    res.status(404).json({ message: MSG.ORDER_NOT_FOUND });
    return;
  }

  const nextStatus = parsed.data.status;
  const hasApprovedPayment = existing.payments.some((payment) => payment.status === "APROVADO");
  const hasLinkedPayment = existing.payments.length > 0;
  const requiresApprovedPayment = hasLinkedPayment && !hasApprovedPayment;
  const isProgressingStatus =
    nextStatus === "PAGO" || nextStatus === "ENVIADO" || nextStatus === "ENTREGUE";
  if (requiresApprovedPayment && isProgressingStatus) {
    res.status(409).json({ message: MSG.ORDER_PAYMENT_REQUIRED });
    return;
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (nextStatus === "CANCELADO") {
      await cancelOrderWithOptionalRestock(tx, {
        orderId,
        source: "ADMIN",
        note: "pedido cancelado via painel admin",
      });
      const row = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, payments: true },
      });
      return row as NonNullable<typeof row>;
    }

    const updateData: Prisma.OrderUpdateInput = {
      status: nextStatus,
      ...(nextStatus === "PAGO" ? { paymentConfirmedAt: new Date() } : {}),
      ...(nextStatus === "ENVIADO"
        ? {
            fulfillmentStatus: "ENVIADO",
            shippedAt: new Date(),
          }
        : {}),
      ...(nextStatus === "ENTREGUE"
        ? {
            fulfillmentStatus: "ENTREGUE",
            deliveredAt: new Date(),
          }
        : {}),
      ...(nextStatus === "PENDENTE" ? { fulfillmentStatus: "PENDENTE" } : {}),
    };

    const row = await tx.order.update({
      where: { id: orderId },
      data: updateData,
      include: { items: true, payments: true },
    });

    if (nextStatus && nextStatus !== existing.status) {
      await appendOrderStatusHistory(tx, {
        orderId,
        fromStatus: existing.status,
        toStatus: nextStatus,
        source: "ADMIN",
        note: "status alterado pelo painel admin",
      });
    }
    return row;
  });
  res.json(updated);
});

router.patch("/orders/:id/fulfillment", requireAdmin, async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isFinite(orderId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }

  const parsed = orderFulfillmentUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: true },
  });
  if (!existing) {
    res.status(404).json({ message: MSG.ORDER_NOT_FOUND });
    return;
  }

  const payload = parsed.data;
  const nextFulfillmentStatus = payload.fulfillmentStatus;
  const hasApprovedPayment = existing.payments.some((payment) => payment.status === "APROVADO");
  const hasLinkedPayment = existing.payments.length > 0;
  const requiresApprovedPayment = hasLinkedPayment && !hasApprovedPayment;
  const isProgressingFulfillment =
    nextFulfillmentStatus === "SEPARANDO" ||
    nextFulfillmentStatus === "EMBALADO" ||
    nextFulfillmentStatus === "DESPACHADO" ||
    nextFulfillmentStatus === "ENVIADO" ||
    nextFulfillmentStatus === "ENTREGUE";
  if (requiresApprovedPayment && isProgressingFulfillment) {
    res.status(409).json({ message: MSG.ORDER_PAYMENT_REQUIRED });
    return;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updateData: Prisma.OrderUpdateInput = {
      fulfillmentStatus: nextFulfillmentStatus,
      shipmentTrackingCode: normalizeNullableText(payload.shipmentTrackingCode),
      shipmentCarrier: normalizeNullableText(payload.shipmentCarrier),
      fulfillmentNotes: normalizeNullableText(payload.fulfillmentNotes),
    };

    if (nextFulfillmentStatus === "SEPARANDO") {
      updateData.separatedAt = new Date();
    }
    if (nextFulfillmentStatus === "EMBALADO") {
      updateData.packedAt = new Date();
    }
    if (nextFulfillmentStatus === "DESPACHADO") {
      updateData.dispatchedAt = new Date();
    }
    if (nextFulfillmentStatus === "ENVIADO") {
      updateData.shippedAt = new Date();
      updateData.status = "ENVIADO";
    }
    if (nextFulfillmentStatus === "ENTREGUE") {
      updateData.deliveredAt = new Date();
      updateData.status = "ENTREGUE";
    }
    if (nextFulfillmentStatus === "CANCELADO") {
      updateData.status = "CANCELADO";
    }

    const row = await tx.order.update({
      where: { id: orderId },
      data: updateData,
      include: { items: true, payments: true },
    });

    if (row.status !== existing.status) {
      await appendOrderStatusHistory(tx, {
        orderId: row.id,
        fromStatus: existing.status,
        toStatus: row.status,
        source: "FULFILLMENT",
        note: "status atualizado pelo fluxo de fulfillment",
      });
    }

    return row;
  });

  res.json(updated);
});

router.get("/appointments", requireAdmin, async (_req, res) => {
  const appointments = await prisma.appointment.findMany({
    orderBy: { start: "desc" },
    include: { unit: true, professional: true, service: true },
  });
  res.json(appointments);
});

router.post("/appointments", requireAdmin, async (req, res) => {
  const parsed = appointmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_APPOINTMENT,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const {
    unitId,
    professionalId,
    serviceId,
    orderId,
    start,
    clientName,
    clientPhone,
    notes,
  } = parsed.data;
  let linkedOrderId: number | null = null;
  if (orderId !== undefined) {
    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: { items: true },
    });
    if (!order) {
      res.status(404).json({ message: MSG.ORDER_NOT_FOUND });
      return;
    }
    const hasService = order.items.some((item) => item.serviceId === Number(serviceId));
    if (!hasService) {
      res.status(400).json({
        message: MSG.INVALID_APPOINTMENT,
        ...withDetail("pedido nao contem o servico informado"),
      });
      return;
    }
    linkedOrderId = order.id;
  }
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) {
    res.status(400).json({
      message: MSG.INVALID_APPOINTMENT,
      ...withDetail("invalid_start"),
    });
    return;
  }
  const dateIso = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(
    startDate.getDate()
  ).padStart(2, "0")}`;
  const slotLabel = `${String(startDate.getHours()).padStart(2, "0")}:${String(
    startDate.getMinutes()
  ).padStart(2, "0")}`;

  const created = await createRemoteAppointment({
    unitId: Number(unitId),
    serviceId: Number(serviceId),
    dateIso,
    slotLabel,
    clientName,
    clientPhone,
    notes: notes || null,
    orderId: linkedOrderId,
    preferredProfessionalId: Number(professionalId),
    strictPreferredProfessional: true,
  });

  if (!created.ok) {
    const detail = created.reason === "slot_unavailable" ? "slot indisponivel" : created.reason;
    const status = created.reason === "slot_unavailable" ? 409 : 400;
    res.status(status).json({
      message: MSG.INVALID_APPOINTMENT,
      ...withDetail(detail),
    });
    return;
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: created.appointment.id },
    include: { unit: true, professional: true, service: true },
  });
  res.status(201).json(appointment || created.appointment);
});

router.patch("/appointments/:id", requireAdmin, async (req, res) => {
  const appointmentId = Number(req.params.id);
  if (!Number.isFinite(appointmentId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = appointmentUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_APPOINTMENT,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const payload = parsed.data;
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });
  if (!existing) {
    res.status(404).json({ message: MSG.APPOINTMENT_NOT_FOUND });
    return;
  }

  let resolvedOrderId = existing.orderId ?? null;
  if (payload.orderId !== undefined) {
    const order = await prisma.order.findUnique({
      where: { id: Number(payload.orderId) },
      include: { items: true },
    });
    if (!order) {
      res.status(404).json({ message: MSG.ORDER_NOT_FOUND });
      return;
    }
    const hasService = order.items.some((item) => item.serviceId === existing.serviceId);
    if (!hasService) {
      res.status(400).json({
        message: MSG.INVALID_APPOINTMENT,
        ...withDetail("pedido nao contem o servico informado"),
      });
      return;
    }
    resolvedOrderId = order.id;
  }

  if (payload.status === "CONFIRMADO") {
    if (!resolvedOrderId) {
      res.status(409).json({ message: MSG.APPOINTMENT_PAYMENT_REQUIRED });
      return;
    }
    const order = await prisma.order.findUnique({
      where: { id: resolvedOrderId },
      include: { payments: true, items: true },
    });
    if (!order) {
      res.status(404).json({ message: MSG.ORDER_NOT_FOUND });
      return;
    }
    const hasService = order.items.some((item) => item.serviceId === existing.serviceId);
    if (!hasService) {
      res.status(400).json({
        message: MSG.INVALID_APPOINTMENT,
        ...withDetail("pedido nao contem o servico informado"),
      });
      return;
    }
    const hasApprovedPayment = order.payments.some((payment) => payment.status === "APROVADO");
    if (!hasApprovedPayment) {
      res.status(409).json({ message: MSG.APPOINTMENT_PAYMENT_REQUIRED });
      return;
    }
  }
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: payload.status,
        start: payload.start ? new Date(payload.start) : undefined,
        end: payload.end ? new Date(payload.end) : undefined,
        notes: payload.notes,
        orderId: resolvedOrderId,
      },
      include: { unit: true, professional: true, service: true },
    });
    if (row.status === "CANCELADO") {
      await tx.appointmentSlot.deleteMany({ where: { appointmentId: row.id } });
    }
    return row;
  });
  res.json(updated);
});

router.get("/franchise-leads", requireAdmin, async (_req, res) => {
  const leads = await prisma.franchiseLead.findMany({ orderBy: { createdAt: "desc" } });
  res.json(leads);
});

router.post("/franchise-leads", requireAdmin, async (req, res) => {
  const parsed = franchiseLeadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_FRANCHISE_LEAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const { name, email, phone, city } = parsed.data;
  const lead = await prisma.franchiseLead.create({
    data: { name, email, phone, city },
  });
  res.status(201).json(lead);
});

router.patch("/franchise-leads/:id", requireAdmin, async (req, res) => {
  const leadId = Number(req.params.id);
  if (!Number.isFinite(leadId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = franchiseLeadUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_FRANCHISE_LEAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const updated = await prisma.franchiseLead.update({
    where: { id: leadId },
    data: { status: parsed.data.status },
  });
  res.json(updated);
});

router.get("/subscriptions", requireAdmin, async (_req, res) => {
  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: { membership: true, payments: true },
  });
  res.json(subscriptions);
});

router.post("/subscriptions", requireAdmin, async (req, res) => {
  const parsed = subscriptionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const payload = parsed.data;
  const membership = await prisma.membership.findUnique({
    where: { id: Number(payload.membershipId) },
  });
  if (!membership) {
    res.status(404).json({ message: MSG.MEMBERSHIP_NOT_FOUND });
    return;
  }

  const startedAt = parseOptionalDate(payload.startedAt) || new Date();
  const cancelledAt = parseOptionalDate(payload.cancelledAt);
  if (payload.startedAt && !startedAt) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail("data de inicio invalida") });
    return;
  }
  if (payload.cancelledAt !== undefined && payload.cancelledAt !== null && !cancelledAt) {
    res
      .status(400)
      .json({ message: MSG.INVALID_PAYLOAD, ...withDetail("data de cancelamento invalida") });
    return;
  }

  const created = await prisma.subscription.create({
    data: {
      membershipId: Number(payload.membershipId),
      customerName: payload.customerName || null,
      customerEmail: payload.customerEmail || null,
      customerPhone: payload.customerPhone || null,
      status: payload.status || "PENDENTE",
      startedAt,
      cancelledAt: cancelledAt === undefined ? null : cancelledAt,
    },
    include: { membership: true, payments: true },
  });
  res.status(201).json(created);
});

router.patch("/subscriptions/:id", requireAdmin, async (req, res) => {
  const subscriptionId = Number(req.params.id);
  if (!Number.isFinite(subscriptionId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = subscriptionUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const payload = parsed.data;
  if (payload.membershipId !== undefined) {
    const membership = await prisma.membership.findUnique({
      where: { id: Number(payload.membershipId) },
    });
    if (!membership) {
      res.status(404).json({ message: MSG.MEMBERSHIP_NOT_FOUND });
      return;
    }
  }
  const startedAt = parseOptionalDate(payload.startedAt);
  const cancelledAt = parseOptionalDate(payload.cancelledAt);
  if (payload.startedAt !== undefined && !startedAt) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail("data de inicio invalida") });
    return;
  }
  if (payload.cancelledAt !== undefined && payload.cancelledAt !== null && !cancelledAt) {
    res
      .status(400)
      .json({ message: MSG.INVALID_PAYLOAD, ...withDetail("data de cancelamento invalida") });
    return;
  }
  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      membershipId:
        payload.membershipId !== undefined ? Number(payload.membershipId) : undefined,
      customerName: payload.customerName !== undefined ? payload.customerName || null : undefined,
      customerEmail:
        payload.customerEmail !== undefined ? payload.customerEmail || null : undefined,
      customerPhone:
        payload.customerPhone !== undefined ? payload.customerPhone || null : undefined,
      status: payload.status,
      startedAt: payload.startedAt !== undefined ? startedAt || undefined : undefined,
      cancelledAt:
        payload.cancelledAt !== undefined ? (cancelledAt === undefined ? null : cancelledAt) : undefined,
    },
    include: { membership: true, payments: true },
  });
  res.json(updated);
});

router.get("/payments", requireAdmin, async (_req, res) => {
  const payments = await prisma.payment.findMany({
    orderBy: { id: "desc" },
    include: { order: true, subscription: true },
  });
  res.json(payments);
});

router.patch("/payments/:id", requireAdmin, async (req, res) => {
  const paymentId = Number(req.params.id);
  if (!Number.isFinite(paymentId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = paymentUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYMENT,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const status = parsed.data.status;
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.payment.findUnique({
        where: { id: paymentId },
        select: { id: true, status: true, orderId: true, subscriptionId: true },
      });
      if (!current) {
        throw new Error("payment_not_found");
      }

      const nextStatus: PaymentStatus = status || current.status;
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: nextStatus,
          paidAt:
            nextStatus === "APROVADO"
              ? new Date()
              : nextStatus === "REEMBOLSADO"
              ? new Date()
              : undefined,
        },
      });

      if (nextStatus === "APROVADO") {
        if (current.orderId) {
          await markOrderAsPaid(tx, {
            orderId: current.orderId,
            source: "ADMIN_PAYMENT",
            note: "pagamento aprovado manualmente",
          });
        }
        if (current.subscriptionId) {
          await tx.subscription.update({
            where: { id: current.subscriptionId },
            data: { status: "ATIVA" },
          });
        }
      }

      if (nextStatus === "CANCELADO" || nextStatus === "REEMBOLSADO") {
        if (current.orderId) {
          await cancelOrderWithOptionalRestock(tx, {
            orderId: current.orderId,
            source: "ADMIN_PAYMENT",
            note: nextStatus === "REEMBOLSADO" ? "pagamento estornado" : "pagamento cancelado",
          });
        }
        if (current.subscriptionId) {
          await tx.subscription.update({
            where: { id: current.subscriptionId },
            data: { status: "CANCELADA" },
          });
        }
      }

      const row = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { order: true, subscription: true },
      });
      return row as NonNullable<typeof row>;
    });
    res.json(updated);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "payment_update_failed";
    if (detail === "payment_not_found") {
      res.status(404).json({ message: MSG.PAYMENT_NOT_FOUND });
      return;
    }
    logger.error("Falha ao atualizar pagamento", { paymentId, error: detail });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(detail),
    });
  }
});

router.post("/payments/intent", requireAuth, async (req, res) => {
  const parsed = paymentIntentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYMENT,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const { type, orderId, subscriptionId, amount, description, customer, method } = parsed.data;
  const rawPayload: Prisma.InputJsonObject = {
    type,
    ...(description !== undefined ? { description } : {}),
    ...(customer !== undefined ? { customer } : {}),
  };
  if (type === "order" && !orderId) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  if (type === "subscription" && !subscriptionId) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  if (type === "order") {
    const orderExists = await prisma.order.findUnique({ where: { id: Number(orderId) } });
    if (!orderExists) {
      res.status(404).json({ message: MSG.ORDER_NOT_FOUND });
      return;
    }
  }
  if (type === "subscription") {
    const subExists = await prisma.subscription.findUnique({
      where: { id: Number(subscriptionId) },
    });
    if (!subExists) {
      res.status(404).json({ message: MSG.SUBSCRIPTION_NOT_FOUND });
      return;
    }
  }

  const paymentId = `mock_${Date.now()}`;
  const payment = await prisma.payment.create({
    data: {
      provider: "MOCK",
      providerPaymentId: paymentId,
      status: "PENDENTE",
          amount: new Prisma.Decimal(amount || 0),
      method: method || null,
      orderId: type === "order" ? Number(orderId) : null,
      subscriptionId: type === "subscription" ? Number(subscriptionId) : null,
      rawPayload,
    },
  });

  res.json({
    paymentId,
    paymentRecordId: payment.id,
    status: payment.status.toLowerCase(),
    initPoint: "https://www.mercadopago.com.br",
    type,
    orderId,
    subscriptionId,
    amount,
    description,
    customer,
  });
});

type StripeCheckoutSessionLike = {
  id: string;
  status?: string | null;
  payment_status?: string | null;
  payment_intent?: string | { id: string } | null;
};

const syncStripeCheckoutSessionPayment = async (
  session: StripeCheckoutSessionLike,
  params: {
    mode: "approve" | "cancel";
    source: string;
    eventType: string;
    eventId: string;
  }
): Promise<void> => {
  const payment = await prisma.payment.findFirst({
    where: {
      provider: "STRIPE",
      providerPaymentId: session.id,
    },
    select: { id: true, orderId: true },
  });
  if (!payment) return;

  await prisma.$transaction(async (tx) => {
    const current = await tx.payment.findUnique({
      where: { id: payment.id },
      select: { id: true, status: true, orderId: true, rawPayload: true },
    });
    if (!current) return;

    const basePayload = asInputJsonObject(current.rawPayload);
    const stripePaymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || null;

    if (params.mode === "approve" || session.payment_status === "paid") {
      if (current.status !== "APROVADO") {
        await tx.payment.update({
          where: { id: current.id },
          data: {
            status: "APROVADO",
            paidAt: new Date(),
            rawPayload: {
              ...basePayload,
              stripeSessionId: session.id,
              stripePaymentIntentId,
              webhookEventId: params.eventId,
              webhookEventType: params.eventType,
              webhookSource: params.source,
            },
          },
        });
      }
      if (current.orderId) {
        await markOrderAsPaid(tx, {
          orderId: current.orderId,
          source: params.source,
          note: `pagamento aprovado via ${params.eventType}`,
        });
      }
      return;
    }

    if (current.status === "APROVADO") {
      return;
    }

    await tx.payment.update({
      where: { id: current.id },
      data: {
        status: "CANCELADO",
        rawPayload: {
          ...basePayload,
          stripeSessionId: session.id,
          stripePaymentIntentId,
          webhookEventId: params.eventId,
          webhookEventType: params.eventType,
          webhookSource: params.source,
        },
      },
    });
    if (current.orderId) {
      await cancelOrderWithOptionalRestock(tx, {
        orderId: current.orderId,
        source: params.source,
        note: `pagamento cancelado via ${params.eventType}`,
        forceRestock: true,
      });
    }
  });
};

export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const signatureHeader = req.headers["stripe-signature"];
  if (typeof signatureHeader !== "string" || !signatureHeader.trim()) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail("missing_stripe_signature") });
    return;
  }
  const rawBody =
    req.body instanceof Buffer
      ? req.body
      : Buffer.from(typeof req.body === "string" ? req.body : "");

  let event;
  try {
    event = constructStripeWebhookEvent(rawBody, signatureHeader);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "stripe_signature_invalid";
    logger.warn("Webhook Stripe rejeitado por assinatura/payload invalido", { detail });
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail(detail) });
    return;
  }

  const alreadyProcessed = await prisma.stripeWebhookEvent.findUnique({
    where: { eventId: event.id },
    select: { id: true },
  });
  if (alreadyProcessed) {
    res.status(200).json({ received: true, duplicate: true });
    return;
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as unknown as StripeCheckoutSessionLike;
      await syncStripeCheckoutSessionPayment(session, {
        mode: "approve",
        source: "STRIPE_WEBHOOK",
        eventType: event.type,
        eventId: event.id,
      });
    } else if (
      event.type === "checkout.session.expired" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      const session = event.data.object as unknown as StripeCheckoutSessionLike;
      await syncStripeCheckoutSessionPayment(session, {
        mode: "cancel",
        source: "STRIPE_WEBHOOK",
        eventType: event.type,
        eventId: event.id,
      });
    }

    await prisma.stripeWebhookEvent.create({
      data: {
        eventId: event.id,
        eventType: event.type,
        livemode: Boolean(event.livemode),
        status: "PROCESSED",
        payload: event as unknown as Prisma.InputJsonValue,
        processedAt: new Date(),
      },
    });

    res.status(200).json({ received: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "stripe_webhook_process_failed";
    logger.error("Falha ao processar webhook Stripe", {
      eventId: event.id,
      eventType: event.type,
      error: detail,
    });
    await prisma.stripeWebhookEvent
      .create({
        data: {
          eventId: event.id,
          eventType: event.type,
          livemode: Boolean(event.livemode),
          status: "FAILED",
          errorMessage: detail,
          payload: event as unknown as Prisma.InputJsonValue,
          processedAt: new Date(),
        },
      })
      .catch(() => undefined);
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
};

router.get("/trinx/units", requireAdmin, (_req, res) => res.json([]));
router.get("/trinx/services", requireAdmin, (_req, res) => res.json([]));
router.get("/trinx/professionals", requireAdmin, (_req, res) => res.json([]));
router.get("/trinx/slots", requireAdmin, (_req, res) => res.json([]));

export default router;



