import assert from "node:assert/strict";
import test from "node:test";
import { classifyRefreshToken, REFRESH_REUSE_GRACE_MS } from "./refreshPolicy";

const now = new Date("2026-10-07T12:00:00Z");
const future = new Date(now.getTime() + 3_600_000);
const past = (ms: number) => new Date(now.getTime() - ms);

test("inexistente ou expirado → invalid", () => {
  assert.equal(classifyRefreshToken(null, now), "invalid");
  assert.equal(classifyRefreshToken({ revokedAt: null, expiresAt: past(1) }, now), "invalid");
});

test("ativo e dentro da validade → valid", () => {
  assert.equal(classifyRefreshToken({ revokedAt: null, expiresAt: future }, now), "valid");
});

test("revogado há instantes (duas abas) → grace, não é roubo", () => {
  assert.equal(classifyRefreshToken({ revokedAt: past(2_000), expiresAt: future }, now), "grace");
  assert.equal(classifyRefreshToken({ revokedAt: past(REFRESH_REUSE_GRACE_MS), expiresAt: future }, now), "grace");
});

test("revogado há mais que a janela → reuse (derruba sessões)", () => {
  assert.equal(classifyRefreshToken({ revokedAt: past(REFRESH_REUSE_GRACE_MS + 1), expiresAt: future }, now), "reuse");
  assert.equal(classifyRefreshToken({ revokedAt: past(86_400_000), expiresAt: future }, now), "reuse");
});

test("revogado e já expirado → invalid (nada a investigar)", () => {
  assert.equal(classifyRefreshToken({ revokedAt: past(86_400_000), expiresAt: past(1) }, now), "invalid");
});
