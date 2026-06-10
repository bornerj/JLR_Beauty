import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth";
import { MSG } from "../lib/messages";
import prisma from "../lib/prisma";
import { logger } from "../utils/logger";

export type AuthRequest = Request & {
  user?: {
    id: number;
    role: string;
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
): Promise<{ id: number; role: string } | null> => {
  const token = getTokenFromHeader(req);
  if (!token) {
    res.status(401).json({ message: MSG.UNAUTHORIZED });
    return null;
  }

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, status: true },
    });
    if (!user) {
      res.status(401).json({ message: MSG.INVALID_TOKEN });
      return null;
    }
    if (!isUserActive(user.status)) {
      res.status(403).json({ message: MSG.FORBIDDEN });
      return null;
    }
    req.user = { id: user.id, role: user.role };
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
