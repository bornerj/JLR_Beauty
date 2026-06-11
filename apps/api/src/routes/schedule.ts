import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { requireAdmin, requireAuth, type AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";
import { logger } from "../utils/logger";
import {
  createRemoteAppointment,
  listAvailableProfessionalsForSlot,
  listPublicConciergeContext,
  listPublicPeriodsForService,
  listPublicServicesByCategory,
  listPublicSlotsForService,
} from "../lib/appointmentAvailability";
import {
  completeWebConciergeSession,
  getConciergeOptions,
  upsertConciergeCustomerByPhone,
} from "../modules/chatbot/flow/conciergeFlow";
import { listConciergeInboundMessages } from "../modules/chatbot/inbox/conciergeInbox";
import {
  getDefaultZApiTargetPhone,
  isZApiConfigured,
  sendZApiTextMessage,
} from "../modules/chatbot/integrations/zapi";
import {
  withDetail,
  parseOptionalDate,
  parseIsoDateStart,
  addDays,
  clockToMinutes,
  formatZodDetail,
} from "../lib/routeHelpers";
import { MSG } from "../lib/messages";

const phoneSchema = z
  .string()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .refine((value) => /^\+?\d{8,15}$/.test(value), "telefone/WhatsApp inválido");

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

const appointmentUpdateSchema = z.object({
  status: z.enum(["PENDENTE", "CONFIRMADO", "CANCELADO"]).optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  notes: z.string().optional(),
  orderId: z.coerce.number().optional(),
});

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

const scheduleRouter = Router();

// --- Professional commission profiles ---

scheduleRouter.get("/professional-commission-profiles", requireAdmin, async (_req, res) => {
  const items = await prisma.professionalCommissionProfile.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
  res.json(items);
});

scheduleRouter.post("/professional-commission-profiles", requireAdmin, async (req, res) => {
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

scheduleRouter.patch("/professional-commission-profiles/:id", requireAdmin, async (req, res) => {
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

scheduleRouter.delete("/professional-commission-profiles/:id", requireAdmin, async (req, res) => {
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

// --- Professional work profiles ---

scheduleRouter.get("/professional-work-profiles", requireAdmin, async (_req, res) => {
  const items = await prisma.professionalWorkProfile.findMany({
    orderBy: [{ status: "asc" }, { title: "asc" }],
  });
  res.json(items);
});

scheduleRouter.post("/professional-work-profiles", requireAdmin, async (req, res) => {
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

scheduleRouter.patch("/professional-work-profiles/:id", requireAdmin, async (req, res) => {
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

scheduleRouter.delete("/professional-work-profiles/:id", requireAdmin, async (req, res) => {
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

// --- Professionals ---

scheduleRouter.get("/professionals", requireAdmin, async (_req, res) => {
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

// --- Customers ---

scheduleRouter.get("/customers", requireAdmin, async (_req, res) => {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, name: true, role: true } },
    },
  });
  res.json(customers);
});

scheduleRouter.post("/customers", requireAdmin, async (req, res) => {
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

scheduleRouter.patch("/customers/:id", requireAdmin, async (req, res) => {
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

// --- Professionals link-user and update ---

scheduleRouter.patch("/professionals/:id/link-user", requireAdmin, async (req, res) => {
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

scheduleRouter.patch("/professionals/:id", requireAdmin, async (req, res) => {
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

// --- Professional services ---

scheduleRouter.get("/professional-services", requireAdmin, async (req, res) => {
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

scheduleRouter.put("/professionals/:id/services", requireAdmin, async (req, res) => {
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

// --- Public concierge ---

scheduleRouter.get("/public/concierge/options", async (_req, res) => {
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

scheduleRouter.get("/public/concierge/booking-context", async (_req, res) => {
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

scheduleRouter.get("/public/concierge/services", async (req, res) => {
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

scheduleRouter.get("/public/concierge/periods", async (req, res) => {
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

scheduleRouter.get("/public/concierge/slots", async (req, res) => {
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

scheduleRouter.get("/public/concierge/slot-professionals", async (req, res) => {
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

scheduleRouter.post("/public/concierge/book", async (req, res) => {
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

scheduleRouter.post("/public/concierge/waitlist", async (req, res) => {
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

scheduleRouter.post("/public/concierge/complete", async (req, res) => {
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

scheduleRouter.post("/public/concierge/whatsapp-summary", async (req, res) => {
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

// --- Concierge admin ---

scheduleRouter.get("/concierge/inbox", requireAdmin, async (req, res) => {
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

scheduleRouter.get("/concierge/sessions", requireAdmin, async (req, res) => {
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

scheduleRouter.get("/concierge/waitlist", requireAdmin, async (req, res) => {
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

// --- Professional shifts (admin) ---

scheduleRouter.get("/professional-shifts", requireAdmin, async (req, res) => {
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

scheduleRouter.post("/professional-shifts", requireAdmin, async (req, res) => {
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

scheduleRouter.patch("/professional-shifts/:id", requireAdmin, async (req, res) => {
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

scheduleRouter.delete("/professional-shifts/:id", requireAdmin, async (req, res) => {
  const shiftId = Number(req.params.id);
  if (!Number.isFinite(shiftId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  await prisma.professionalShift.delete({ where: { id: shiftId } });
  res.status(204).send();
});

// --- Professionals/me/shifts ---

scheduleRouter.get("/professionals/me/shifts", requireAuth, async (req, res) => {
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

scheduleRouter.post("/professionals/me/shifts", requireAuth, async (req, res) => {
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

scheduleRouter.patch("/professionals/me/shifts/:id", requireAuth, async (req, res) => {
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

scheduleRouter.delete("/professionals/me/shifts/:id", requireAuth, async (req, res) => {
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

// --- Appointments ---

scheduleRouter.get("/appointments", requireAdmin, async (_req, res) => {
  const appointments = await prisma.appointment.findMany({
    orderBy: { start: "desc" },
    include: { unit: true, professional: true, service: true },
  });
  res.json(appointments);
});

scheduleRouter.post("/appointments", requireAdmin, async (req, res) => {
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

scheduleRouter.patch("/appointments/:id", requireAdmin, async (req, res) => {
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

export { scheduleRouter };
