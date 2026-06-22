import type { Request } from "express";
import { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { getClientIp } from "./rateLimiter";
import { logger } from "../utils/logger";


export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "REGISTER"
  | "EMAIL_VERIFIED"
  | "ROLE_CHANGE"
  | "PASSWORD_RESET_REQUEST"
  | "PASSWORD_RESET_SUCCESS";

export function recordAudit(
  action: AuditAction,
  opts: {
    userId?: number;
    req?: Request;
    meta?: Record<string, unknown>;
  }
): void {
  const ip = opts.req ? getClientIp(opts.req) : null;
  const rawAgent = opts.req?.headers["user-agent"];
  const userAgent = rawAgent ? rawAgent.slice(0, 512) : null;

  prisma.auditLog
    .create({
      data: {
        action,
        userId: opts.userId ?? null,
        ip,
        userAgent,
        meta: opts.meta ? (opts.meta as Prisma.InputJsonValue) : Prisma.DbNull,
      },
    })
    .catch((err: unknown) => {
      logger.error("Falha ao registrar audit log", {
        action,
        error: err instanceof Error ? err.message : "unknown",
      });
    });
}
