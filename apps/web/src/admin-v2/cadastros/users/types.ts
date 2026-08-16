/**
 * Admin V2 (PLAN-0026, Onda 14) — tipos de Usuários, espelhando `User` (`schema.prisma`) +
 * `userCreateSchema`/`userUpdateSchema` (`apps/api/src/routes/users.ts`). Terceira e última
 * tela do desmembramento de "Pessoas" (`DECISION-014` regra #3) — fecha o plano inteiro.
 *
 * **Sensível**: gestão de `role`/status de conta. Regras de permissão já existentes no
 * backend, replicadas aqui sem alteração:
 * - só um usuário `MASTER` pode atribuir o papel `MASTER` (checado no `POST`/`PATCH`
 *   genérico, 403 se violado) — espelhado no cliente escondendo a opção "Master" do select
 *   quando o usuário logado não é `MASTER`, mesmo padrão de gate client-side já usado pra
 *   "Seções Telas" (Onda 6).
 * - excluir a própria conta é bloqueado pelo backend (403) — espelhado desabilitando o botão
 *   de excluir na própria linha.
 *
 * **Achado de contrato (não corrigido, fora de escopo — mesmo padrão do `ERR-0053`)**: existe
 * uma rota dedicada e auditada pra troca de papel, `PATCH /users/:id/role` (`requireMaster`,
 * grava `AuditLog` via `recordAudit("ROLE_CHANGE", ...)`), mas o formulário legado (e esta
 * tela nativa, por paridade) manda `role` dentro do `PATCH /users/:id` genérico — que
 * **não** grava auditoria. Trocar de rota mudaria quem pode editar o quê (o genérico exige
 * só `ADMIN`, o dedicado exige `MASTER`) e não foi pedido nesta onda; documentado, não
 * fabricado como fix.
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
