/**
 * PLAN-0042 / Onda 4 — decisão pura sobre um refresh token apresentado.
 *
 * - `valid`:   ativo, dentro da validade → pode rotacionar.
 * - `invalid`: inexistente ou expirado → só recusa.
 * - `grace`:   revogado há instantes (< janela) → corrida legítima entre abas que dividem o
 *              cookie; recusa SEM derrubar a sessão e SEM apagar o cookie (já é o novo).
 * - `reuse`:   revogado há mais que a janela → o token roubado/antigo foi reapresentado; trata
 *              como comprometimento e derruba todas as sessões do usuário.
 */
export const REFRESH_REUSE_GRACE_MS = 10_000;

export type RefreshStatus = "valid" | "invalid" | "grace" | "reuse";

export function classifyRefreshToken(
  record: { revokedAt: Date | null; expiresAt: Date } | null,
  now: Date = new Date(),
): RefreshStatus {
  if (!record || record.expiresAt <= now) return "invalid";
  if (record.revokedAt === null) return "valid";
  return now.getTime() - record.revokedAt.getTime() <= REFRESH_REUSE_GRACE_MS ? "grace" : "reuse";
}
