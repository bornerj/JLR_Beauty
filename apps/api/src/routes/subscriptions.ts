import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth";
import prisma from "../lib/prisma";
import { withDetail, parseOptionalDate, formatZodDetail } from "../lib/routeHelpers";
import { MSG } from "../lib/messages";

const phoneSchema = z
  .string()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .refine((value) => /^\+?\d{8,15}$/.test(value), "telefone/WhatsApp inválido");

const membershipSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  benefits: z.array(z.string()).optional(),
  isFeatured: z.coerce.boolean().optional(),
  status: z.string().optional(),
});
const membershipUpdateSchema = membershipSchema.partial();

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

const franchiseLeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: phoneSchema,
  city: z.string().min(1),
});
const franchiseLeadUpdateSchema = z.object({
  status: z.string().optional(),
});

const publicSubscriptionSchema = z.object({
  membershipId: z.coerce.number(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: phoneSchema,
});

const subscriptionsRouter = Router();

// --- Public memberships ---

subscriptionsRouter.get("/public/memberships", async (_req, res) => {
  const memberships = await prisma.membership.findMany({
    where: { OR: [{ status: "Ativo" }, { status: "ACTIVE" }] },
    orderBy: [{ isFeatured: "desc" }, { price: "asc" }],
  });
  res.json(memberships);
});

subscriptionsRouter.post("/public/subscriptions", async (req, res) => {
  const parsed = publicSubscriptionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail(formatZodDetail(parsed.error.issues)) });
    return;
  }
  const payload = parsed.data;
  const membership = await prisma.membership.findUnique({ where: { id: Number(payload.membershipId) } });
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

// --- Admin memberships ---

subscriptionsRouter.get("/memberships", requireAdmin, async (_req, res) => {
  const memberships = await prisma.membership.findMany({ orderBy: { createdAt: "desc" } });
  res.json(memberships);
});

subscriptionsRouter.post("/memberships", requireAdmin, async (req, res) => {
  const parsed = membershipSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: MSG.INVALID_MEMBERSHIP, ...withDetail(formatZodDetail(parsed.error.issues)) });
    return;
  }
  const { name, title, description, price, benefits, isFeatured, status } = parsed.data;
  const membership = await prisma.membership.create({
    data: {
      name, title, description,
      price: new Prisma.Decimal(price || 0),
      benefits,
      isFeatured: Boolean(isFeatured ?? false),
      status: status || "Ativo",
    },
  });
  res.status(201).json(membership);
});

subscriptionsRouter.patch("/memberships/:id", requireAdmin, async (req, res) => {
  const membershipId = Number(req.params.id);
  if (!Number.isFinite(membershipId)) { res.status(400).json({ message: MSG.INVALID_PAYLOAD }); return; }
  const parsed = membershipUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: MSG.INVALID_MEMBERSHIP, ...withDetail(formatZodDetail(parsed.error.issues)) });
    return;
  }
  const payload = parsed.data;
  const updated = await prisma.membership.update({
    where: { id: membershipId },
    data: {
      name: payload.name, title: payload.title, description: payload.description,
      price: payload.price !== undefined ? new Prisma.Decimal(payload.price || 0) : undefined,
      benefits: payload.benefits, isFeatured: payload.isFeatured, status: payload.status,
    },
  });
  res.json(updated);
});

subscriptionsRouter.delete("/memberships/:id", requireAdmin, async (req, res) => {
  const membershipId = Number(req.params.id);
  if (!Number.isFinite(membershipId)) { res.status(400).json({ message: MSG.INVALID_PAYLOAD }); return; }
  await prisma.membership.delete({ where: { id: membershipId } });
  res.status(204).send();
});

// --- Franchise leads ---

subscriptionsRouter.get("/franchise-leads", requireAdmin, async (_req, res) => {
  const leads = await prisma.franchiseLead.findMany({ orderBy: { createdAt: "desc" } });
  res.json(leads);
});

subscriptionsRouter.post("/franchise-leads", requireAdmin, async (req, res) => {
  const parsed = franchiseLeadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: MSG.INVALID_FRANCHISE_LEAD, ...withDetail(formatZodDetail(parsed.error.issues)) });
    return;
  }
  const { name, email, phone, city } = parsed.data;
  const lead = await prisma.franchiseLead.create({ data: { name, email, phone, city } });
  res.status(201).json(lead);
});

subscriptionsRouter.patch("/franchise-leads/:id", requireAdmin, async (req, res) => {
  const leadId = Number(req.params.id);
  if (!Number.isFinite(leadId)) { res.status(400).json({ message: MSG.INVALID_PAYLOAD }); return; }
  const parsed = franchiseLeadUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: MSG.INVALID_FRANCHISE_LEAD, ...withDetail(formatZodDetail(parsed.error.issues)) });
    return;
  }
  const updated = await prisma.franchiseLead.update({ where: { id: leadId }, data: { status: parsed.data.status } });
  res.json(updated);
});

// --- Admin subscriptions ---

subscriptionsRouter.get("/subscriptions", requireAdmin, async (_req, res) => {
  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: { membership: true, payments: true },
  });
  res.json(subscriptions);
});

subscriptionsRouter.post("/subscriptions", requireAdmin, async (req, res) => {
  const parsed = subscriptionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail(formatZodDetail(parsed.error.issues)) });
    return;
  }
  const payload = parsed.data;
  const membership = await prisma.membership.findUnique({ where: { id: Number(payload.membershipId) } });
  if (!membership) { res.status(404).json({ message: MSG.MEMBERSHIP_NOT_FOUND }); return; }

  const startedAt = parseOptionalDate(payload.startedAt) || new Date();
  const cancelledAt = parseOptionalDate(payload.cancelledAt);
  if (payload.startedAt && !startedAt) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail("data de inicio invalida") }); return;
  }
  if (payload.cancelledAt !== undefined && payload.cancelledAt !== null && !cancelledAt) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail("data de cancelamento invalida") }); return;
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

subscriptionsRouter.patch("/subscriptions/:id", requireAdmin, async (req, res) => {
  const subscriptionId = Number(req.params.id);
  if (!Number.isFinite(subscriptionId)) { res.status(400).json({ message: MSG.INVALID_PAYLOAD }); return; }
  const parsed = subscriptionUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail(formatZodDetail(parsed.error.issues)) });
    return;
  }
  const payload = parsed.data;
  if (payload.membershipId !== undefined) {
    const membership = await prisma.membership.findUnique({ where: { id: Number(payload.membershipId) } });
    if (!membership) { res.status(404).json({ message: MSG.MEMBERSHIP_NOT_FOUND }); return; }
  }
  const startedAt = parseOptionalDate(payload.startedAt);
  const cancelledAt = parseOptionalDate(payload.cancelledAt);
  if (payload.startedAt !== undefined && !startedAt) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail("data de inicio invalida") }); return;
  }
  if (payload.cancelledAt !== undefined && payload.cancelledAt !== null && !cancelledAt) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail("data de cancelamento invalida") }); return;
  }
  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      membershipId: payload.membershipId !== undefined ? Number(payload.membershipId) : undefined,
      customerName: payload.customerName !== undefined ? payload.customerName || null : undefined,
      customerEmail: payload.customerEmail !== undefined ? payload.customerEmail || null : undefined,
      customerPhone: payload.customerPhone !== undefined ? payload.customerPhone || null : undefined,
      status: payload.status,
      startedAt: payload.startedAt !== undefined ? startedAt || undefined : undefined,
      cancelledAt: payload.cancelledAt !== undefined ? (cancelledAt === undefined ? null : cancelledAt) : undefined,
    },
    include: { membership: true, payments: true },
  });
  res.json(updated);
});

export { subscriptionsRouter };
