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
  | "PASSWORD_RESET_SUCCESS"
  // PLAN-0020 — estoque e vendas (PRD 3.3: ações sensíveis auditadas)
  | "STOCK_ENTRY"
  | "STOCK_CONSUMPTION"
  | "STOCK_LOSS"
  | "STOCK_ADJUST"
  | "STOCK_RESERVATION_RELEASE"
  | "ORDER_MANUAL_SALE"
  | "ORDER_CANCELLED"
  // PLAN-0022 (Onda 9 / RETROFIT-010b) — pipeline comercial de franquias
  | "FRANCHISE_LEAD_STAGE_CHANGE";

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
