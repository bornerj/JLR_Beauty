/**
 * Admin V2 (PLAN-0026, Onda 1) — espelha o contrato de `apps/api/src/routes/subscriptions.ts`
 * (`/api/memberships`, reusado sem alteração — `DECISION-014` regra #2). `price` chega como
 * `string` (Prisma `Decimal.toJSON()` serializa assim, a rota não converte pra number antes
 * de devolver) — nunca tratar como `number` sem `Number(...)` primeiro.
 */

export type Membership = {
  id: number;
  name: string;
  title: string;
  description: string | null;
  price: string;
  benefits: string[] | null;
  isFeatured: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type MembershipInput = {
  name: string;
  title: string;
  description?: string;
  price: number;
  benefits?: string[];
  isFeatured?: boolean;
  status?: string;
};

export const MEMBERSHIP_STATUS_OPTIONS = ["Ativo", "Rascunho", "Inativo"] as const;
