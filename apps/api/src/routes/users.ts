import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { hashPassword, revokeAllRefreshTokens } from "../lib/auth";
import { validateNewPassword } from "../lib/passwordPolicy";
import {
  canCreateWithRole,
  canDeleteUser,
  canModifyUser,
  shouldRevokeSessions,
  wouldRemoveLastMaster,
} from "../lib/userGuards";
import { requireAuth, requireAdmin, requireMaster, type AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";
import { withDetail, formatZodDetail, urlOrPathSchema } from "../lib/routeHelpers";
import { MSG } from "../lib/messages";
import { recordAudit } from "../lib/auditLog";

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

// PLAN-0042 / Onda 1 — nunca deixar o sistema sem MASTER ativo.
const countOtherActiveMasters = (excludeUserId: number): Promise<number> =>
  prisma.user.count({ where: { role: "MASTER", status: "ATIVO", id: { not: excludeUserId } } });

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
  const actor = { id: req.user!.id, role: req.user!.role };
  if (!canCreateWithRole(actor, payload.role).allowed) {
    res.status(403).json({ message: MSG.FORBIDDEN });
    return;
  }
  if (!validateNewPassword(payload.password, { email: payload.email, name: payload.name }).ok) {
    res.status(400).json({ message: MSG.WEAK_PASSWORD });
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
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true, status: true },
  });
  if (!existingUser) {
    res.status(404).json({ message: MSG.USER_NOT_FOUND });
    return;
  }
  // PLAN-0042 / Onda 1 — hierarquia: ADMIN nunca atinge MASTER (nem outro ADMIN); antes bastava
  // `requireAdmin` para trocar a senha de um MASTER e assumir a conta.
  const changedFields = (Object.keys(payload) as Array<keyof typeof payload>).filter(
    (key) => payload[key] !== undefined,
  );
  const guard = canModifyUser(
    { id: req.user!.id, role: req.user!.role },
    { id: userId, role: existingUser.role },
    changedFields,
  );
  if (!guard.allowed) {
    recordAudit("USER_ACCESS_DENIED", {
      userId,
      req,
      meta: { reason: guard.reason, attemptedBy: req.user?.id, via: "PATCH /users/:id", fields: changedFields },
    });
    res.status(403).json({ message: MSG.FORBIDDEN });
    return;
  }
  if (
    payload.password &&
    !validateNewPassword(payload.password, { email: payload.email ?? existingUser.email, name: payload.name }).ok
  ) {
    res.status(400).json({ message: MSG.WEAK_PASSWORD });
    return;
  }
  if (
    wouldRemoveLastMaster(
      existingUser,
      { newStatus: payload.status, newRole: payload.role },
      await countOtherActiveMasters(userId),
    )
  ) {
    res.status(409).json({ message: MSG.LAST_MASTER });
    return;
  }
  // ERR-0093 — a checagem original só bloqueava PROMOVER alguém a MASTER; um ADMIN
  // conseguia REBAIXAR um MASTER existente pra qualquer outro papel sem essa guarda (e sem
  // auditoria, ver recordAudit abaixo). Qualquer mudança real de papel, nas duas direções,
  // agora exige o chamador ser MASTER — igual à rota dedicada `/users/:id/role`.
  const isRoleChange = payload.role !== undefined && payload.role !== existingUser.role;
  if (isRoleChange && req.user?.role !== "MASTER") {
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
  const emailChanged = payload.email !== undefined && payload.email.toLowerCase() !== existingUser.email;
  if (shouldRevokeSessions({ passwordChanged: Boolean(payload.password), emailChanged, newStatus: payload.status })) {
    await revokeAllRefreshTokens(userId);
  }
  if (payload.password || emailChanged || payload.status !== undefined || payload.emailVerified !== undefined) {
    recordAudit("USER_SENSITIVE_UPDATE", {
      userId,
      req,
      meta: {
        changedBy: req.user?.id,
        passwordChanged: Boolean(payload.password),
        emailChanged,
        statusChanged: payload.status !== undefined && payload.status !== existingUser.status,
        emailVerifiedChanged: payload.emailVerified !== undefined,
      },
    });
  }
  if (isRoleChange) {
    recordAudit("ROLE_CHANGE", {
      userId,
      req,
      meta: {
        fromRole: existingUser.role,
        toRole: updated.role,
        changedBy: req.user?.id,
        via: "PATCH /users/:id",
      },
    });
  }
  res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
  });
});

usersRouter.patch("/users/:id/role", requireAuth, requireMaster, async (req: AuthRequest, res) => {
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
  if (wouldRemoveLastMaster(existing, { newRole: parsed.data.role }, await countOtherActiveMasters(userId))) {
    res.status(409).json({ message: MSG.LAST_MASTER });
    return;
  }
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: parsed.data.role },
  });

  recordAudit("ROLE_CHANGE", {
    userId,
    req,
    meta: {
      fromRole: existing.role,
      toRole: parsed.data.role,
      changedBy: req.user?.id,
    },
  });

  res.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role });
});

usersRouter.delete("/users/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const userId = Number(req.params.id);
  if (!Number.isFinite(userId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    res.status(404).json({ message: MSG.USER_NOT_FOUND });
    return;
  }
  const guard = canDeleteUser({ id: req.user!.id, role: req.user!.role }, { id: userId, role: existing.role });
  if (!guard.allowed) {
    recordAudit("USER_ACCESS_DENIED", {
      userId,
      req,
      meta: { reason: guard.reason, attemptedBy: req.user?.id, via: "DELETE /users/:id" },
    });
    res.status(403).json({ message: MSG.FORBIDDEN });
    return;
  }
  if (wouldRemoveLastMaster(existing, { deleting: true }, await countOtherActiveMasters(userId))) {
    res.status(409).json({ message: MSG.LAST_MASTER });
    return;
  }
  recordAudit("USER_DELETED", {
    userId,
    req,
    meta: { deletedRole: existing.role, deletedBy: req.user?.id },
  });
  await prisma.user.delete({ where: { id: userId } });
  res.status(204).send();
});

export { usersRouter };
