/**
 * Admin V2 (PLAN-0026, Onda 1) — espelha o contrato de `apps/api/src/routes/subscriptions.ts`
 * (`/api/memberships`, reusado sem alteração — `DECISION-014` regra #2). `price` chega como
 * `string` (Prisma `Decimal.toJSON()` serializa assim, a rota não converte pra number antes
 * de devolver) — nunca tratar como `number` sem `Number(...)` primeiro.
 *
 * PLAN-0027 Item 11 (`ERR-0061`): `imageUrl` adicionado (migração aditiva
 * `20260817180000_add_membership_image`, `Membership.imageUrl String?`). Antes deste item o
 * plano não tinha imagem própria no cadastro — as imagens exibidas no site público vinham de
 * media slots genéricos e posicionais (`assinaturas_hero_card_img_01/02/03`), sem nenhum
 * vínculo com o `Membership.id`/`name` real. Ver nota de arquitetura no `PLAN-0027`: este
 * campo já existe no cadastro e na API, mas a seção pública ainda não foi religada pra
 * consumi-lo (decisão em aberto, mesmo padrão do Item 10/flip-cards).
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
  imageUrl: string | null;
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
  imageUrl?: string;
};

export const MEMBERSHIP_STATUS_OPTIONS = ["Ativo", "Rascunho", "Inativo"] as const;
