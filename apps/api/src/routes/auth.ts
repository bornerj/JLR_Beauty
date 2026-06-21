import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { hashPassword, isStrongPassword, signToken, verifyPassword } from "../lib/auth";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";
import { logger } from "../utils/logger";
import {
  checkLoginAttemptBlock,
  registerFailedLoginAttempt,
  clearFailedLoginAttempts,
} from "../lib/rateLimiter";
import { withDetail, formatZodDetail } from "../lib/routeHelpers";
import { MSG } from "../lib/messages";

const authSchema = z.object({
  identifier: z.string().email("Informe um e-mail válido"),
  password: z.string().min(8),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const authRouter = Router();

authRouter.post("/auth/login", async (req, res) => {
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
    const blockState = await checkLoginAttemptBlock(req, identifier);
    if (blockState.blocked) {
      res.status(429).json({
        message: MSG.TOO_MANY_REQUESTS,
        ...withDetail(`tente novamente em ${blockState.retryAfterSeconds}s`),
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: identifier.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordHash: true,
      },
    });
    if (!user || !user.passwordHash) {
      await registerFailedLoginAttempt(req, identifier);
      res.status(401).json({ message: MSG.USER_NOT_REGISTERED });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await registerFailedLoginAttempt(req, identifier);
      res.status(401).json({ message: MSG.WRONG_PASSWORD });
      return;
    }

    await clearFailedLoginAttempts(req, identifier);

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
    logger.error("Falha no endpoint de login", { error: detail });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...(process.env.NODE_ENV === "development" ? { detail } : {}),
    });
  }
});

authRouter.post("/auth/register", async (req, res) => {
  try {
    const registerBlock = await checkLoginAttemptBlock(req, "__register__");
    if (registerBlock.blocked) {
      res.status(429).json({
        message: MSG.TOO_MANY_REQUESTS,
        ...withDetail(`tente novamente em ${registerBlock.retryAfterSeconds}s`),
      });
      return;
    }

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
      res.status(400).json({ message: MSG.WEAK_PASSWORD });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      await registerFailedLoginAttempt(req, "__register__");
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

authRouter.get("/auth/me", requireAuth, async (req, res) => {
  const userId = (req as AuthRequest).user?.id;
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

export { authRouter };
