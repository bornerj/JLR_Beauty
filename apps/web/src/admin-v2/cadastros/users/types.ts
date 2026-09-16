/**
 * Admin V2 (PLAN-0026, Onda 14) — tipos de Usuários, espelhando `User` (`schema.prisma`) +
 * `userCreateSchema`/`userUpdateSchema` (`apps/api/src/routes/users.ts`). Terceira e última
 * tela do desmembramento de "Pessoas" (`DECISION-014` regra #3) — fecha o plano inteiro.
 *
 * **Sensível**: gestão de `role`/status de conta. Regras de permissão já existentes no
 * backend, replicadas aqui sem alteração:
 * - criar usuário: só um `MASTER` pode atribuir o papel `MASTER` (checado no `POST /users`,
 *   403 se violado) — espelhado escondendo a opção "Master" do select.
 * - editar usuário existente: só um `MASTER` pode mudar o papel, em qualquer direção
 *   (checado no `PATCH /users/:id`, 403 se violado) — espelhado desabilitando o select
 *   inteiro pra quem não é `MASTER` (`ERR-0093`, ver abaixo).
 * - excluir a própria conta é bloqueado pelo backend (403) — espelhado desabilitando o botão
 *   de excluir na própria linha.
 *
 * **`ERR-0093` (corrigido nesta sessão)**: até aqui, o `PATCH /users/:id` genérico só
 * bloqueava PROMOVER alguém a `MASTER` — um `ADMIN` comum (ou o próprio usuário) conseguia
 * REBAIXAR um `MASTER` existente pra qualquer outro papel sem bloqueio nenhum, e essa rota
 * nunca gravava `AuditLog` (diferente da rota dedicada `PATCH /users/:id/role`,
 * `requireMaster`, que grava via `recordAudit("ROLE_CHANGE", ...)`). Isso causou um incidente
 * real (conta MASTER rebaixada sem explicação, sem rastro em `audit_logs`). Corrigido:
 * o `PATCH /users/:id` genérico agora exige `MASTER` pra qualquer mudança real de papel
 * (compara com o valor atual no banco antes de decidir) e grava `recordAudit("ROLE_CHANGE",
 * ...)` igual à rota dedicada — as duas rotas seguem existindo (a genérica por conveniência
 * do formulário, a dedicada pra quem só precisa trocar o papel), mas agora com a mesma regra
 * e o mesmo rastro de auditoria.
 */

export const USER_ROLES = ["MASTER", "ADMIN", "MANAGER", "PROFESSIONAL", "CLIENT"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  MASTER: "Master",
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  PROFESSIONAL: "Profissional",
  CLIENT: "Cliente",
};

export const USER_STATUSES = ["ATIVO", "INATIVO", "SUSPENSO", "CANCELADO"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  SUSPENSO: "Suspenso",
  CANCELADO: "Cancelado",
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  phone2: string | null;
  city: string | null;
  neighborhood: string | null;
  avatarUrl: string | null;
  status: UserStatus | null;
  emailVerified: boolean | null;
  rating: number | null;
  lastAccessAt: string | null;
  createdAt: string;
};

export type UserCreateInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  phone2?: string;
  city?: string;
  neighborhood?: string;
  avatarUrl?: string;
  status: UserStatus;
  emailVerified: boolean;
  rating?: number;
};

export type UserUpdateInput = Omit<UserCreateInput, "password"> & {
  /** omitido (não enviado) = mantém a senha atual — mesmo comportamento do form legado. */
  password?: string;
};
