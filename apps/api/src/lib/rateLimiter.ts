import type { Request } from "express";
import prisma from "./prisma";

export const loginAttemptWindowMs   = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS    || 15 * 60 * 1000);
export const loginAttemptMaxFailures = Number(process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS || 8);
export const loginAttemptBlockMs    = Number(process.env.AUTH_RATE_LIMIT_BLOCK_MS     || 15 * 60 * 1000);

export const getClientIp = (req: Request): string => {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.trim()) return fwd.split(",")[0]?.trim() || req.ip || "unknown";
  if (Array.isArray(fwd) && fwd.length)       return fwd[0]?.trim() || req.ip || "unknown";
  return req.ip || "unknown";
};

export const buildLoginAttemptKey = (req: Request, identifier: string): string => {
  const ip = getClientIp(req);
  const id = identifier.trim().toLowerCase() || "unknown";
  return `${ip}::${id}`;
};

export const checkLoginAttemptBlock = async (
  req: Request,
  identifier: string,
): Promise<{ blocked: boolean; retryAfterSeconds: number }> => {
  const key = buildLoginAttemptKey(req, identifier);
  const now = new Date();

  const record = await prisma.loginAttempt.findUnique({ where: { key } });
  if (!record) return { blocked: false, retryAfterSeconds: 0 };

  if (record.blockedUntil > now) {
    return {
      blocked: true,
      retryAfterSeconds: Math.max(1, Math.ceil((record.blockedUntil.getTime() - now.getTime()) / 1000)),
    };
  }

  if (now.getTime() - record.windowStartedAt.getTime() > loginAttemptWindowMs) {
    await prisma.loginAttempt.delete({ where: { key } }).catch(() => {});
  }

  return { blocked: false, retryAfterSeconds: 0 };
};

export const registerFailedLoginAttempt = async (req: Request, identifier: string): Promise<void> => {
  const key = buildLoginAttemptKey(req, identifier);
  const now = new Date();

  const current = await prisma.loginAttempt.findUnique({ where: { key } });

  if (!current || now.getTime() - current.windowStartedAt.getTime() > loginAttemptWindowMs) {
    await prisma.loginAttempt.upsert({
      where:  { key },
      create: { key, failures: 1, windowStartedAt: now, blockedUntil: now, lastSeenAt: now },
      update: { failures: 1, windowStartedAt: now, blockedUntil: now, lastSeenAt: now },
    });
    return;
  }

  const nextFailures = current.failures + 1;
  const blockedUntil = nextFailures >= loginAttemptMaxFailures
    ? new Date(now.getTime() + loginAttemptBlockMs)
    : now;

  await prisma.loginAttempt.update({
    where: { key },
    data:  { failures: nextFailures, blockedUntil, lastSeenAt: now },
  });
};

export const clearFailedLoginAttempts = async (req: Request, identifier: string): Promise<void> => {
  const key = buildLoginAttemptKey(req, identifier);
  await prisma.loginAttempt.delete({ where: { key } }).catch(() => {});
};
