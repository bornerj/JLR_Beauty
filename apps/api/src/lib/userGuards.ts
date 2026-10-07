/**
 * PLAN-0042 / Onda 1 — hierarquia de contas.
 *
 * Antes, `PATCH`/`DELETE /users/:id` exigiam só `requireAdmin`: um ADMIN podia trocar a senha
 * (ou apagar) um MASTER e assumir a conta. Estas funções são puras para serem testáveis sem
 * banco: a rota só aplica a decisão.
 *
 * Hierarquia: MASTER > ADMIN > demais papéis.
 * - MASTER altera/exclui qualquer conta.
 * - ADMIN só atinge contas abaixo de ADMIN (e edita a si mesmo, exceto o próprio `status`).
 * - Papéis abaixo de ADMIN nunca chegam aqui (as rotas exigem `requireAdmin`).
 */

export type GuardActor = { id: number; role: string };
export type GuardTarget = { id: number; role: string };
export type GuardDecision = { allowed: true } | { allowed: false; reason: string };

const ALLOW: GuardDecision = { allowed: true };
const deny = (reason: string): GuardDecision => ({ allowed: false, reason });

/** Campos que, se alterados, podem entregar a conta a quem os alterou. */
export const SENSITIVE_USER_FIELDS = ["password", "email", "status", "emailVerified"] as const;

export function canModifyUser(actor: GuardActor, target: GuardTarget, fields: readonly string[]): GuardDecision {
  if (actor.role === "MASTER") return ALLOW;
  if (actor.role !== "ADMIN") return deny("actor_not_admin");
  if (target.role === "MASTER") return deny("admin_cannot_touch_master");
  if (target.role === "ADMIN") {
    if (target.id !== actor.id) return deny("admin_cannot_touch_admin");
    if (fields.includes("status")) return deny("admin_cannot_change_own_status");
  }
  return ALLOW;
}

export function canDeleteUser(actor: GuardActor, target: GuardTarget): GuardDecision {
  if (actor.id === target.id) return deny("cannot_delete_self");
  if (actor.role === "MASTER") return ALLOW;
  if (actor.role !== "ADMIN") return deny("actor_not_admin");
  if (target.role === "MASTER" || target.role === "ADMIN") return deny("admin_cannot_delete_privileged");
  return ALLOW;
}

/** Criar ADMIN ou MASTER é uma mudança de papel privilegiada: só MASTER (igual a `/users/:id/role`). */
export function canCreateWithRole(actor: GuardActor, role: string | undefined): GuardDecision {
  if (role !== "ADMIN" && role !== "MASTER") return ALLOW;
  return actor.role === "MASTER" ? ALLOW : deny("only_master_creates_privileged");
}

/** Mudança de dados sensíveis que invalida as sessões existentes da conta alvo. */
export function shouldRevokeSessions(change: { passwordChanged: boolean; emailChanged: boolean; newStatus?: string }): boolean {
  if (change.passwordChanged || change.emailChanged) return true;
  return change.newStatus !== undefined && change.newStatus !== "ATIVO";
}

/**
 * Nunca deixar o sistema sem nenhum MASTER ativo: impede excluir/desativar o último.
 * `otherActiveMasters` = quantidade de MASTER ATIVOS **excluindo** o alvo.
 */
export function wouldRemoveLastMaster(
  target: { role: string },
  action: { deleting?: boolean; newStatus?: string; newRole?: string },
  otherActiveMasters: number,
): boolean {
  if (target.role !== "MASTER" || otherActiveMasters > 0) return false;
  if (action.deleting) return true;
  if (action.newStatus !== undefined && action.newStatus !== "ATIVO") return true;
  if (action.newRole !== undefined && action.newRole !== "MASTER") return true;
  return false;
}
