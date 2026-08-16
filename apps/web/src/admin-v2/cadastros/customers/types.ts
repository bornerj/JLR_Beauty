/**
 * Admin V2 (PLAN-0026, Onda 12) — tipos de Clientes, espelhando `Customer` (`schema.prisma`)
 * e `customerCreateSchema`/`customerUpdateSchema` (`apps/api/src/routes/schedule.ts`).
 * Primeira das 3 telas do desmembramento de "Pessoas" (`DECISION-014` regra #3) —
 * Clientes/Profissionais/Usuários viram telas nativas independentes, uma por onda.
 *
 * **Sem exclusão**: `Customer` não tem endpoint `DELETE` no backend (só
 * `GET`/`POST`/`PATCH`) — confirmado no RAG, não fabricado. A tela nativa não tem botão de
 * excluir, mesma limitação do legado.
 */

export type Customer = {
  id: number;
  userId: number | null;
  name: string;
  phone: string;
  phone2: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: number; email: string; name: string; role: string } | null;
};

export type CustomerInput = {
  userId?: number | null;
  name: string;
  phone: string;
  phone2?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  neighborhood?: string | null;
  notes?: string | null;
};
