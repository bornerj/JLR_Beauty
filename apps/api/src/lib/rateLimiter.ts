import type { Request } from "express";
import prisma from "./prisma";

export const loginAttemptWindowMs   = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS    || 15 * 60 * 1000);
export const loginAttemptMaxFailures = Number(process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS || 8);
export const loginAttemptBlockMs    = Number(process.env.AUTH_RATE_LIMIT_BLOCK_MS     || 15 * 60 * 1000);

// Coupon validation rate limit: 5 requests per minute per IP
export const couponValidationWindowMs   = 60 * 1000; // 1 minute
export const couponValidationMaxAttempts = 5;
export const couponValidationBlockMs    = 60 * 1000; // 1 minute block

// Public concierge rate limit: 10 requests per minute per IP (SEC-26)
export const conciergePublicWindowMs   = 60 * 1000; // 1 minute
export const conciergePublicMaxAttempts = 10;
export const conciergePublicBlockMs    = 60 * 1000; // 1 minute block

/**
 * PLAN-0042 / Onda 2 — IP do cliente = `req.ip`, nunca o cabeçalho cru.
 * Com `trust proxy 1` (app.ts) o Express usa só o salto escrito pelo nginx, que sobrescreve o
 * `X-Forwarded-For` com `$remote_addr`. Antes, ler o 1º item do cabeçalho deixava o cliente
 * escolher o próprio IP (burlava rate limit de login/cupom/concierge e falsificava o AuditLog).
 */
export const getClientIp = (req: Pick<Request, "ip">): string => req.ip || "unknown";

export const buildLoginAttemptKey = (req: Request, identifier: string): string => {
  const ip = getClientIp(req);
  const id = identifier.trim().toLowerCase() || "unknown";
  return `${ip}::${id}`;
};

/**
 * Limite por CONTA (independe do IP): barra ataque distribuído contra um e-mail só. O teto é
 * bem maior que o do par IP+e-mail para que um terceiro não consiga travar a conta alheia
 * com poucas tentativas — o bloqueio dura só `loginAttemptBlockMs`.
 */
export const accountAttemptMaxFailures = Number(process.env.AUTH_ACCOUNT_RATE_LIMIT_MAX_ATTEMPTS || 30);

export const buildAccountAttemptKey = (identifier: string): string =>
  `acct::${identifier.trim().toLowerCase() || "unknown"}`;

const checkBlockByKey = async (key: string): Promise<{ blocked: boolean; retryAfterSeconds: number }> => {
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

const registerFailureByKey = async (key: string, maxFailures: number): Promise<void> => {
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
  const blockedUntil = nextFailures >= maxFailures
    ? new Date(now.getTime() + loginAttemptBlockMs)
    : now;

  await prisma.loginAttempt.update({
    where: { key },
    data:  { failures: nextFailures, blockedUntil, lastSeenAt: now },
  });
};

/** Bloqueado se o par IP+e-mail OU a conta (qualquer IP) estourou o limite. */
export const checkLoginAttemptBlock = async (
  req: Request,
  identifier: string,
): Promise<{ blocked: boolean; retryAfterSeconds: number }> => {
  const [byPair, byAccount] = await Promise.all([
    checkBlockByKey(buildLoginAttemptKey(req, identifier)),
    checkBlockByKey(buildAccountAttemptKey(identifier)),
  ]);
  return byPair.retryAfterSeconds >= byAccount.retryAfterSeconds ? byPair : byAccount;
};

export const registerFailedLoginAttempt = async (req: Request, identifier: string): Promise<void> => {
  await registerFailureByKey(buildLoginAttemptKey(req, identifier), loginAttemptMaxFailures);
  await registerFailureByKey(buildAccountAttemptKey(identifier), accountAttemptMaxFailures);
};

/** Login bem-sucedido zera só o par IP+e-mail; o contador da conta decai pela janela. */
export const clearFailedLoginAttempts = async (req: Request, identifier: string): Promise<void> => {
  await prisma.loginAttempt.delete({ where: { key: buildLoginAttemptKey(req, identifier) } }).catch(() => {});
};

// Coupon validation rate limiting
export const checkCouponValidationLimit = async (
  req: Request,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> => {
  const ip = getClientIp(req);
  const now = new Date();

  const record = await prisma.couponValidationAttempt.findUnique({ where: { ip } });
  if (!record) return { allowed: true, retryAfterSeconds: 0 };

  if (record.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((record.blockedUntil.getTime() - now.getTime()) / 1000)),
    };
  }

  // Check if window expired
  if (now.getTime() - record.windowStartedAt.getTime() > couponValidationWindowMs) {
    await prisma.couponValidationAttempt.delete({ where: { ip } }).catch(() => {});
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return { allowed: true, retryAfterSeconds: 0 };
};

export const recordCouponValidationAttempt = async (req: Request): Promise<void> => {
  const ip = getClientIp(req);
  const now = new Date();

  const current = await prisma.couponValidationAttempt.findUnique({ where: { ip } });

  if (!current || now.getTime() - current.windowStartedAt.getTime() > couponValidationWindowMs) {
    await prisma.couponValidationAttempt.upsert({
      where: { ip },
      create: { ip, attemptCount: 1, windowStartedAt: now, blockedUntil: now },
      update: { attemptCount: 1, windowStartedAt: now, blockedUntil: now },
    });
    return;
  }

  const nextAttempts = current.attemptCount + 1;
  const blockedUntil = nextAttempts >= couponValidationMaxAttempts
    ? new Date(now.getTime() + couponValidationBlockMs)
    : now;

  await prisma.couponValidationAttempt.update({
    where: { ip },
    data: { attemptCount: nextAttempts, blockedUntil },
  });
};

// Public concierge rate limiting (SEC-26)
export const checkConciergePublicLimit = async (
  req: Request,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> => {
  const ip = getClientIp(req);
  const now = new Date();

  const record = await prisma.conciergePublicAttempt.findUnique({ where: { ip } });
  if (!record) return { allowed: true, retryAfterSeconds: 0 };

  if (record.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((record.blockedUntil.getTime() - now.getTime()) / 1000)),
    };
  }

  if (now.getTime() - record.windowStartedAt.getTime() > conciergePublicWindowMs) {
    await prisma.conciergePublicAttempt.delete({ where: { ip } }).catch(() => {});
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return { allowed: true, retryAfterSeconds: 0 };
};

export const recordConciergePublicAttempt = async (req: Request): Promise<void> => {
  const ip = getClientIp(req);
  const now = new Date();

  const current = await prisma.conciergePublicAttempt.findUnique({ where: { ip } });

  if (!current || now.getTime() - current.windowStartedAt.getTime() > conciergePublicWindowMs) {
    await prisma.conciergePublicAttempt.upsert({
      where: { ip },
      create: { ip, attemptCount: 1, windowStartedAt: now, blockedUntil: now },
      update: { attemptCount: 1, windowStartedAt: now, blockedUntil: now },
    });
    return;
  }

  const nextAttempts = current.attemptCount + 1;
  const blockedUntil = nextAttempts >= conciergePublicMaxAttempts
    ? new Date(now.getTime() + conciergePublicBlockMs)
    : now;

  await prisma.conciergePublicAttempt.update({
    where: { ip },
    data: { attemptCount: nextAttempts, blockedUntil },
  });
};
