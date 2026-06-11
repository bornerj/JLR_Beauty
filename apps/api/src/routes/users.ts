import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { hashPassword } from "../lib/auth";
import { requireAuth, requireAdmin, type AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";
import { withDetail, formatZodDetail, urlOrPathSchema } from "../lib/routeHelpers";
import { MSG } from "../lib/messages";

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

const usersRouter = Router();

usersRouter.get("/users", requireAuth, requireAdmin, async (_req, res) => {
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

usersRouter.post("/users", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
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

usersRouter.patch("/users/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
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

usersRouter.patch("/users/:id/role", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
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

usersRouter.delete("/users/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
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

export { usersRouter };
