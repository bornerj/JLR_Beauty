import { type Request } from "express";

export type LoginAttemptState = {
  failures: number;
  windowStartedAt: number;
  blockedUntil: number;
  lastSeenAt: number;
};

export const loginAttemptWindowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
export const loginAttemptMaxFailures = Number(process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS || 8);
export const loginAttemptBlockMs = Number(process.env.AUTH_RATE_LIMIT_BLOCK_MS || 15 * 60 * 1000);
export const loginAttemptStore = new Map<string, LoginAttemptState>();

export const getClientIp = (req: Request): string => {
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

export const normalizeIdentifierForRateLimit = (identifier: string): string => {
  const normalized = identifier.trim().toLowerCase();
  return normalized || "unknown-identifier";
};

export const buildLoginAttemptKey = (req: Request, identifier: string): string => {
  return `${getClientIp(req)}::${normalizeIdentifierForRateLimit(identifier)}`;
};

export const cleanupLoginAttemptStore = (now: number): void => {
  for (const [key, state] of loginAttemptStore.entries()) {
    const idleTime = now - state.lastSeenAt;
    if (idleTime > loginAttemptWindowMs * 4 && state.blockedUntil <= now) {
      loginAttemptStore.delete(key);
    }
  }
};

export const checkLoginAttemptBlock = (
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

export const registerFailedLoginAttempt = (req: Request, identifier: string): void => {
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

export const clearFailedLoginAttempts = (req: Request, identifier: string): void => {
  const key = buildLoginAttemptKey(req, identifier);
  loginAttemptStore.delete(key);
};
