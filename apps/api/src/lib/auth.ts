import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import prisma from "./prisma";

const JWT_SECRET = (process.env.JWT_SECRET || "").trim();
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET ausente ou inseguro. Defina um segredo com no minimo 32 caracteres.");
}

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "15m").trim() as SignOptions["expiresIn"];

const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const VERIFY_TOKEN_EXPIRES_MS = 15 * 60 * 1000; // 15 minutes
const PASSWORD_RESET_EXPIRES_MS = 15 * 60 * 1000; // 15 minutes

export type JwtPayload = {
  userId: number;
  role: string;
};

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN, algorithm: "HS256" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function isStrongPassword(password: string) {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
}

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

// ─── Refresh tokens ───────────────────────────────────────────────────────────

export async function createRefreshToken(userId: number): Promise<string> {
  const plaintext = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(plaintext);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS);
  await prisma.refreshToken.create({ data: { userId, token: tokenHash, expiresAt } });
  return plaintext;
}

export async function findValidRefreshToken(plaintext: string) {
  const tokenHash = hashToken(plaintext);
  const record = await prisma.refreshToken.findUnique({
    where: { token: tokenHash },
    include: { user: { select: { id: true, role: true, status: true } } },
  });
  if (!record || record.revokedAt !== null || record.expiresAt < new Date()) return null;
  return record;
}

export async function rotateRefreshToken(oldPlaintext: string, userId: number): Promise<string | null> {
  const oldHash = hashToken(oldPlaintext);
  const existing = await prisma.refreshToken.findUnique({ where: { token: oldHash } });
  if (
    !existing ||
    existing.userId !== userId ||
    existing.revokedAt !== null ||
    existing.expiresAt < new Date()
  ) {
    return null;
  }
  await prisma.refreshToken.update({ where: { id: existing.id }, data: { revokedAt: new Date() } });
  return createRefreshToken(userId);
}

export async function revokeRefreshToken(plaintext: string): Promise<void> {
  const tokenHash = hashToken(plaintext);
  await prisma.refreshToken
    .updateMany({ where: { token: tokenHash, revokedAt: null }, data: { revokedAt: new Date() } })
    .catch(() => {});
}

// ─── Email verification tokens ────────────────────────────────────────────────

export async function createVerificationToken(userId: number): Promise<string> {
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });
  const plaintext = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(plaintext);
  const expiresAt = new Date(Date.now() + VERIFY_TOKEN_EXPIRES_MS);
  await prisma.emailVerificationToken.create({ data: { userId, token: tokenHash, expiresAt } });
  return plaintext;
}

export async function consumeVerificationToken(plaintext: string): Promise<number | null> {
  const tokenHash = hashToken(plaintext);
  const record = await prisma.emailVerificationToken.findUnique({ where: { token: tokenHash } });
  if (!record || record.usedAt !== null || record.expiresAt < new Date()) return null;
  await prisma.$transaction([
    prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
  ]);
  return record.userId;
}

// ─── Password reset tokens ────────────────────────────────────────────────────

export async function createPasswordResetToken(userId: number): Promise<string> {
  await prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } });
  const plaintext = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(plaintext);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRES_MS);
  await prisma.passwordResetToken.create({ data: { userId, token: tokenHash, expiresAt } });
  return plaintext;
}

export async function consumePasswordResetToken(plaintext: string): Promise<number | null> {
  const tokenHash = hashToken(plaintext);
  const record = await prisma.passwordResetToken.findUnique({ where: { token: tokenHash } });
  if (!record || record.usedAt !== null || record.expiresAt < new Date()) return null;
  await prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return record.userId;
}

export async function revokeAllRefreshTokens(userId: number): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
