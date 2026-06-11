import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireAdmin, type AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";
import { logger } from "../utils/logger";
import { upload } from "../lib/uploadHandler";
import { withDetail, formatZodDetail } from "../lib/routeHelpers";
import {
  toDecimalNumber,
  parseDateFieldInput,
  validateDiscountCouponRules,
  normalizeCouponCode,
} from "../lib/currencyUtils";
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
  getAdminDashboardAgendaSummary,
  getAdminDashboardCommissionsSummary,
  getAdminDashboardKpis,
  getAdminDashboardSalesSeries,
} from "../modules/admin/kpis";
import { MSG } from "../lib/messages";

// --- Section toggles ---

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
  return cloneSectionToggleMap(DEFAULT_PUBLIC_SECTION_TOGGLES);
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

// --- Discount coupons ---

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

const discountCouponUpdateSchema = discountCouponSchema.partial().extend({
  percentOff: z.union([z.coerce.number().min(0.01).max(100), z.null()]).optional(),
  amountOff: z.union([z.coerce.number().min(0.01), z.null()]).optional(),
  minSubtotal: z.union([z.coerce.number().min(0), z.null()]).optional(),
});
type DiscountCouponPayload = z.infer<typeof discountCouponSchema>;
type DiscountCouponUpdatePayload = z.infer<typeof discountCouponUpdateSchema>;

const adminRouter = Router();

// --- Uploads ---

adminRouter.post("/uploads", requireAuth, requireAdmin, upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

// --- Settings ---

adminRouter.get("/settings", requireAdmin, async (_req, res) => {
  const entries = await prisma.setting.findMany({ orderBy: { key: "asc" } });
  res.json(entries);
});

adminRouter.get("/settings/:key", requireAdmin, async (req, res) => {
  const key = String(req.params.key);
  const entry = await prisma.setting.findUnique({ where: { key } });
  if (!entry) {
    res.status(404).json({ message: MSG.CONTENT_NOT_FOUND });
    return;
  }
  res.json(entry);
});

adminRouter.put("/settings/:key", requireAdmin, async (req, res) => {
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

// --- Section toggles ---

adminRouter.get("/admin/section-toggles", requireAdmin, async (req: AuthRequest, res) => {
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

adminRouter.put("/admin/section-toggles", requireAdmin, async (req: AuthRequest, res) => {
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

adminRouter.get("/public/section-toggles", async (_req, res) => {
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

// --- Branding ---

adminRouter.get("/admin/branding", requireAdmin, async (_req, res) => {
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

adminRouter.put("/admin/branding", requireAdmin, async (req, res) => {
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

adminRouter.get("/public/branding", async (_req, res) => {
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

// --- Media slots ---

adminRouter.get("/admin/media-slots", requireAdmin, async (_req, res) => {
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

adminRouter.put("/admin/media-slots", requireAdmin, async (req, res) => {
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

adminRouter.get("/public/media-slots", async (_req, res) => {
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

// --- Discount coupons ---

adminRouter.get("/discount-coupons", requireAdmin, async (_req, res) => {
  const coupons = await prisma.discountCoupon.findMany({
    orderBy: [{ createdAt: "desc" }],
  });
  res.json(coupons);
});

adminRouter.post("/discount-coupons", requireAdmin, async (req, res) => {
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

adminRouter.patch("/discount-coupons/:id", requireAdmin, async (req, res) => {
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

adminRouter.delete("/discount-coupons/:id", requireAdmin, async (req, res) => {
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

// --- Dashboard ---

adminRouter.get("/admin/dashboard/kpis", requireAdmin, async (req, res) => {
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

adminRouter.get("/admin/dashboard/sales-series", requireAdmin, async (req, res) => {
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

adminRouter.get("/admin/dashboard/agenda-summary", requireAdmin, async (req, res) => {
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

adminRouter.get("/admin/dashboard/commissions-summary", requireAdmin, async (req, res) => {
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

// --- Trinx stubs ---

adminRouter.get("/trinx/units", requireAdmin, (_req, res) => res.json([]));
adminRouter.get("/trinx/services", requireAdmin, (_req, res) => res.json([]));
adminRouter.get("/trinx/professionals", requireAdmin, (_req, res) => res.json([]));
adminRouter.get("/trinx/slots", requireAdmin, (_req, res) => res.json([]));

export { adminRouter };
