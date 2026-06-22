import { Prisma } from "@prisma/client";
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import {
  hashPassword,
  isStrongPassword,
  signToken,
  verifyPassword,
  createRefreshToken,
  findValidRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  createVerificationToken,
  consumeVerificationToken,
  createPasswordResetToken,
  consumePasswordResetToken,
} from "../lib/auth";
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
import { recordAudit } from "../lib/auditLog";

const REFRESH_COOKIE = "jlr_rt";
const isProduction = process.env.NODE_ENV === "production";

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/api/auth",
};

const clearRefreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/api/auth",
};

const authSchema = z.object({
  identifier: z.string().email("Informe um e-mail válido"),
  password: z.string().min(8),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

const resendVerificationSchema = z.object({
  email: z.string().email(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

const authRouter = Router();

// ─── POST /auth/login ─────────────────────────────────────────────────────────

authRouter.post("/auth/login", async (req: Request, res: Response) => {
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
        status: true,
        emailVerified: true,
        passwordHash: true,
      },
    });

    if (!user || !user.passwordHash) {
      await registerFailedLoginAttempt(req, identifier);
      recordAudit("LOGIN_FAILED", { req, meta: { reason: "user_not_found", email: identifier } });
      res.status(401).json({ message: MSG.USER_NOT_REGISTERED });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await registerFailedLoginAttempt(req, identifier);
      recordAudit("LOGIN_FAILED", { userId: user.id, req, meta: { reason: "wrong_password" } });
      res.status(401).json({ message: MSG.WRONG_PASSWORD });
      return;
    }

    if (!user.emailVerified) {
      recordAudit("LOGIN_FAILED", { userId: user.id, req, meta: { reason: "email_not_verified" } });
      res.status(403).json({ message: MSG.EMAIL_NOT_VERIFIED });
      return;
    }

    await clearFailedLoginAttempts(req, identifier);

    prisma.user
      .update({ where: { id: user.id }, data: { lastAccessAt: new Date() } })
      .catch((error) => {
        logger.warn("Falha ao atualizar ultimo acesso no login", {
          error: error instanceof Error ? error.message : "erro inesperado",
        });
      });

    const accessToken = signToken({ userId: user.id, role: user.role });
    const refreshToken = await createRefreshToken(user.id);

    recordAudit("LOGIN_SUCCESS", { userId: user.id, req });

    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
    res.json({
      token: accessToken,
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

// ─── POST /auth/register ──────────────────────────────────────────────────────

authRouter.post("/auth/register", async (req: Request, res: Response) => {
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
        emailVerified: false,
      },
    });

    const verificationToken = await createVerificationToken(user.id);
    const accessToken = signToken({ userId: user.id, role: user.role });
    const refreshToken = await createRefreshToken(user.id);

    recordAudit("REGISTER", { userId: user.id, req });

    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);

    const responseBody: Record<string, unknown> = {
      token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        emailVerified: false,
      },
      message: "Cadastro realizado. Verifique seu e-mail para confirmar a conta.",
    };

    if (process.env.NODE_ENV === "development") {
      responseBody._dev_verification_token = verificationToken;
    }

    res.status(201).json(responseBody);
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

// ─── POST /auth/refresh ───────────────────────────────────────────────────────

authRouter.post("/auth/refresh", async (req: Request, res: Response) => {
  try {
    const oldToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!oldToken) {
      res.status(401).json({ message: MSG.REFRESH_TOKEN_INVALID });
      return;
    }

    const record = await findValidRefreshToken(oldToken);
    if (!record) {
      res.clearCookie(REFRESH_COOKIE, clearRefreshCookieOptions);
      res.status(401).json({ message: MSG.REFRESH_TOKEN_INVALID });
      return;
    }

    const user = record.user;
    if (user.status !== "ATIVO") {
      res.clearCookie(REFRESH_COOKIE, clearRefreshCookieOptions);
      res.status(403).json({ message: MSG.FORBIDDEN });
      return;
    }

    const newRefreshToken = await rotateRefreshToken(oldToken, user.id);
    if (!newRefreshToken) {
      res.clearCookie(REFRESH_COOKIE, clearRefreshCookieOptions);
      res.status(401).json({ message: MSG.REFRESH_TOKEN_INVALID });
      return;
    }

    const accessToken = signToken({ userId: user.id, role: user.role });
    res.cookie(REFRESH_COOKIE, newRefreshToken, refreshCookieOptions);
    res.json({ token: accessToken });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "erro inesperado";
    logger.error("Falha no endpoint de refresh", { error: detail });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...(process.env.NODE_ENV === "development" ? { detail } : {}),
    });
  }
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────

authRouter.post("/auth/logout", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    let userId: number | undefined;
    if (token) {
      const record = await findValidRefreshToken(token);
      userId = record?.user?.id;
      await revokeRefreshToken(token);
    }
    recordAudit("LOGOUT", { userId, req });
    res.clearCookie(REFRESH_COOKIE, clearRefreshCookieOptions);
    res.json({ message: MSG.LOGOUT_SUCCESS });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "erro inesperado";
    logger.error("Falha no endpoint de logout", { error: detail });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...(process.env.NODE_ENV === "development" ? { detail } : {}),
    });
  }
});

// ─── POST /auth/verify-email ──────────────────────────────────────────────────

authRouter.post("/auth/verify-email", async (req: Request, res: Response) => {
  try {
    const parsed = verifyEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }

    const userId = await consumeVerificationToken(parsed.data.token);
    if (!userId) {
      res.status(400).json({ message: MSG.VERIFICATION_TOKEN_INVALID });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true },
    });
    if (!user) {
      res.status(400).json({ message: MSG.VERIFICATION_TOKEN_INVALID });
      return;
    }

    const accessToken = signToken({ userId: user.id, role: user.role });
    const refreshToken = await createRefreshToken(user.id);

    recordAudit("EMAIL_VERIFIED", { userId: user.id, req });

    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
    res.json({
      message: "E-mail verificado com sucesso.",
      token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        emailVerified: true,
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "erro inesperado";
    logger.error("Falha no endpoint de verificacao de email", { error: detail });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...(process.env.NODE_ENV === "development" ? { detail } : {}),
    });
  }
});

// ─── POST /auth/resend-verification ──────────────────────────────────────────

authRouter.post("/auth/resend-verification", async (req: Request, res: Response) => {
  try {
    const parsed = resendVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      select: { id: true, emailVerified: true },
    });

    // Always return the same message to avoid email enumeration
    if (!user || user.emailVerified) {
      res.json({ message: MSG.VERIFICATION_TOKEN_SENT });
      return;
    }

    const verificationToken = await createVerificationToken(user.id);

    const responseBody: Record<string, unknown> = {
      message: MSG.VERIFICATION_TOKEN_SENT,
    };

    if (process.env.NODE_ENV === "development") {
      responseBody._dev_verification_token = verificationToken;
    }

    res.json(responseBody);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "erro inesperado";
    logger.error("Falha no endpoint de reenvio de verificacao", { error: detail });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...(process.env.NODE_ENV === "development" ? { detail } : {}),
    });
  }
});

// ─── POST /auth/forgot-password ───────────────────────────────────────────────

authRouter.post("/auth/forgot-password", async (req: Request, res: Response) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      select: { id: true, passwordHash: true },
    });

    // Always return the same message to avoid email enumeration
    if (!user || !user.passwordHash) {
      res.json({ message: MSG.PASSWORD_RESET_TOKEN_SENT });
      return;
    }

    const resetToken = await createPasswordResetToken(user.id);

    recordAudit("PASSWORD_RESET_REQUEST", { userId: user.id, req });

    const responseBody: Record<string, unknown> = {
      message: MSG.PASSWORD_RESET_TOKEN_SENT,
    };

    if (process.env.NODE_ENV === "development") {
      responseBody._dev_reset_token = resetToken;
    }

    res.json(responseBody);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "erro inesperado";
    logger.error("Falha no endpoint de forgot-password", { error: detail });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...(process.env.NODE_ENV === "development" ? { detail } : {}),
    });
  }
});

// ─── POST /auth/reset-password ────────────────────────────────────────────────

authRouter.post("/auth/reset-password", async (req: Request, res: Response) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: MSG.INVALID_PAYLOAD,
        ...withDetail(formatZodDetail(parsed.error.issues)),
      });
      return;
    }

    const { token, newPassword } = parsed.data;

    if (!isStrongPassword(newPassword)) {
      res.status(400).json({ message: MSG.WEAK_PASSWORD });
      return;
    }

    const userId = await consumePasswordResetToken(token);
    if (!userId) {
      res.status(400).json({ message: MSG.PASSWORD_RESET_TOKEN_INVALID });
      return;
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await revokeAllRefreshTokens(userId);

    recordAudit("PASSWORD_RESET_SUCCESS", { userId, req });

    res.clearCookie(REFRESH_COOKIE, clearRefreshCookieOptions);
    res.json({ message: MSG.PASSWORD_RESET_SUCCESS });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "erro inesperado";
    logger.error("Falha no endpoint de reset-password", { error: detail });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...(process.env.NODE_ENV === "development" ? { detail } : {}),
    });
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────

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
    emailVerified: user.emailVerified,
  });
});

export { authRouter };
