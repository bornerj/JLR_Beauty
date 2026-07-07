import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth";
import { MSG } from "../lib/messages";
import prisma from "../lib/prisma";
import { logger } from "../utils/logger";

export type AuthRequest = Request & {
  user?: {
    id: number;
    role: string;
    /// Unidade canônica do staff (null = escopo global para MASTER/ADMIN).
    unitId: number | null;
  };
};

const isUserActive = (status: string | null | undefined): boolean =>
  status === "ATIVO" || status === "ACTIVE";

const getTokenFromHeader = (req: Request): string | null => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token || null;
};

const resolveAuthenticatedUser = async (
  req: AuthRequest,
  res: Response
): Promise<{ id: number; role: string; unitId: number | null } | null> => {
  const token = getTokenFromHeader(req);
  if (!token) {
    res.status(401).json({ message: MSG.UNAUTHORIZED });
    return null;
  }

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, status: true, unitId: true },
    });
    if (!user) {
      res.status(401).json({ message: MSG.INVALID_TOKEN });
      return null;
    }
    if (!isUserActive(user.status)) {
      res.status(403).json({ message: MSG.FORBIDDEN });
      return null;
    }
    req.user = { id: user.id, role: user.role, unitId: user.unitId ?? null };
    return req.user;
  } catch (error) {
    logger.warn("Falha na validacao de token", {
      error: error instanceof Error ? error.message : "erro inesperado",
    });
    res.status(401).json({ message: MSG.INVALID_TOKEN });
    return null;
  }
};

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const user = await resolveAuthenticatedUser(req, res);
  if (!user) return;
  next();
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const user = await resolveAuthenticatedUser(req, res);
  if (!user) return;
  if (user.role !== "ADMIN" && user.role !== "MASTER") {
    res.status(403).json({ message: MSG.FORBIDDEN });
    return;
  }
  next();
}

// Qualquer usuário autenticado que não seja CLIENT (professional, manager, admin, master)
export async function requireStaff(req: AuthRequest, res: Response, next: NextFunction) {
  const user = await resolveAuthenticatedUser(req, res);
  if (!user) return;
  if (user.role === "CLIENT") {
    res.status(403).json({ message: MSG.FORBIDDEN });
    return;
  }
  next();
}

// Gerente de unidade ou acima (MANAGER/ADMIN/MASTER)
export async function requireManager(req: AuthRequest, res: Response, next: NextFunction) {
  const user = await resolveAuthenticatedUser(req, res);
  if (!user) return;
  if (user.role !== "MANAGER" && user.role !== "ADMIN" && user.role !== "MASTER") {
    res.status(403).json({ message: MSG.FORBIDDEN });
    return;
  }
  next();
}

// Exclusivo para o proprietário da plataforma (SaaS owner)
export async function requireMaster(req: AuthRequest, res: Response, next: NextFunction) {
  const user = await resolveAuthenticatedUser(req, res);
  if (!user) return;
  if (user.role !== "MASTER") {
    res.status(403).json({ message: MSG.FORBIDDEN });
    return;
  }
  next();
}

/**
 * Escopo de unidade por papel (PLAN-0020 S1/S2 — fail-closed):
 * - MASTER/ADMIN: acesso global (retorna "all").
 * - MANAGER/PROFESSIONAL: somente a própria unidade; sem unidade vinculada → nega tudo.
 * Nunca confiar em unitId vindo do cliente sem passar por canAccessUnit.
 */
export type UnitScope = { kind: "all" } | { kind: "units"; unitIds: number[] };

export function resolveUnitScope(req: AuthRequest): UnitScope {
  const user = req.user;
  if (!user) return { kind: "units", unitIds: [] };
  if (user.role === "MASTER" || user.role === "ADMIN") return { kind: "all" };
  if (user.unitId) return { kind: "units", unitIds: [user.unitId] };
  return { kind: "units", unitIds: [] };
}

export function canAccessUnit(req: AuthRequest, unitId: number): boolean {
  const scope = resolveUnitScope(req);
  if (scope.kind === "all") return true;
  return scope.unitIds.includes(unitId);
}
