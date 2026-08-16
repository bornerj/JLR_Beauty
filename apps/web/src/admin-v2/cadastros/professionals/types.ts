/**
 * Admin V2 (PLAN-0026, Onda 13) — tipos de Profissionais, espelhando `Professional`
 * (`schema.prisma`) + `professionalUpdateSchema`/`professionalLinkUserSchema`/
 * `professionalWorkProfile*Schema`/`professionalCommissionProfile*Schema`
 * (`apps/api/src/routes/schedule.ts`). Segunda das 3 telas do desmembramento de "Pessoas"
 * (`DECISION-014` regra #3).
 *
 * **Sem criação de profissional**: não existe `POST /professionals` no backend (confirmado
 * no RAG — só `GET` de lista, `PATCH` de edição e `PATCH .../link-user`). `Professional` só é
 * criado via seed/script (`prisma/seed.ts`, `scripts/seedAdminV2TestData.ts`), nunca via API
 * em produção — não fabricado. A tela nativa só edita profissionais já existentes, mesma
 * limitação do legado (`admin-people`, aba Profissionais, também não tem botão de "novo
 * profissional").
 *
 * **Turnos e vínculo de serviços ficam fora desta tela**: `/professional-shifts` e
 * `/professionals/:id/services` já são consumidos pelo módulo `admin-schedule` (Agenda), não
 * por `admin-people` — mesmo desmembramento por domínio que o legado já tinha, preservado
 * (a tabela só mostra as contagens `_count.shifts`/`_count.professionalServices`, read-only,
 * sem ação — igual ao legado, que só tem um botão "Ver agenda" pra sair da tela).
 *
 * **`commissionProfileId`/`specialties` não entram no form de edição**: o backend aceita os
 * dois campos, mas o form legado nunca os expõe (só `commissionPercent` bruto e os demais
 * campos abaixo) — replicado por paridade, não é modernização nem gap corrigido.
 */

export type ProfessionalWorkProfilePermissions = {
  canScheduleAppointments: boolean;
  canAccessOtherProfessionalsAgenda: boolean;
  canViewServiceValues: boolean;
  canViewCustomerContact: boolean;
  canAccessMenuClientsAnamnese: boolean;
  canAccessMenuServices: boolean;
  canAccessMenuProducts: boolean;
  canAccessMenuExpenses: boolean;
  canViewCommissionsToReceive: boolean;
  canViewCommissionPayments: boolean;
  canEditAppointments: boolean;
  canDeleteAppointments: boolean;
  canCreateServiceInAppointment: boolean;
  canViewGrossCommissionsToPay: boolean;
};

export const WORK_PROFILE_PERMISSION_GROUPS: Array<{
  title: string;
  items: Array<{ key: keyof ProfessionalWorkProfilePermissions; label: string }>;
}> = [
  {
    title: "Ajustes finos",
    items: [
      { key: "canScheduleAppointments", label: "Pode realizar agendamentos" },
      { key: "canAccessOtherProfessionalsAgenda", label: "Pode acessar a agenda de outros profissionais" },
      { key: "canViewServiceValues", label: "Pode visualizar valores de serviços" },
      { key: "canViewCustomerContact", label: "Pode visualizar contato do cliente" },
    ],
  },
  {
    title: "Acesso aos menus",
    items: [
      { key: "canAccessMenuClientsAnamnese", label: "Pode acessar menu clientes/anamnese" },
      { key: "canAccessMenuServices", label: "Pode acessar menu serviços" },
      { key: "canAccessMenuProducts", label: "Pode acessar menu produtos" },
      { key: "canAccessMenuExpenses", label: "Pode acessar menu despesas" },
      { key: "canViewCommissionsToReceive", label: "Pode visualizar comissões a receber" },
      { key: "canViewCommissionPayments", label: "Pode visualizar pagamentos de comissão" },
    ],
  },
  {
    title: "Opções avançadas",
    items: [
      { key: "canEditAppointments", label: "Pode editar agendamentos" },
      { key: "canDeleteAppointments", label: "Pode deletar agendamentos" },
      { key: "canCreateServiceInAppointment", label: "Pode criar serviço no agendamento" },
      { key: "canViewGrossCommissionsToPay", label: "Ver total bruto em comissões a pagar" },
    ],
  },
];

export type ProfessionalWorkProfile = ProfessionalWorkProfilePermissions & {
  id: number;
  title: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
};

export type ProfessionalWorkProfileInput = Partial<ProfessionalWorkProfilePermissions> & {
  title: string;
  status: "ACTIVE" | "INACTIVE";
};

export type ProfessionalCommissionProfile = {
  id: number;
  name: string;
  commissionPercent: string; // Prisma Decimal -> string na serialização JSON (mesmo achado das Ondas 1/4/11)
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
};

export type ProfessionalCommissionProfileInput = {
  name: string;
  commissionPercent: number;
  status: "ACTIVE" | "INACTIVE";
};

export type Professional = {
  id: number;
  name: string;
  userId: number;
  specialties: string[] | null;
  unitId: number | null;
  employmentStatus: "ACTIVE" | "INACTIVE";
  startedAt: string | null;
  endedAt: string | null;
  commissionPercent: string | null; // Decimal -> string
  commissionProfileId: number | null;
  workProfileId: number | null;
  createdAt: string;
  updatedAt: string;
  unit: { id: number; name: string } | null;
  user: { id: number; email: string; name: string; role: string };
  workProfile: ProfessionalWorkProfile | null;
  commissionProfile: { id: number; name: string; commissionPercent: string; status: string } | null;
  _count: { shifts: number; professionalServices: number };
};

export type ProfessionalUpdateInput = {
  name?: string;
  unitId?: number | null;
  employmentStatus?: "ACTIVE" | "INACTIVE";
  startedAt?: string | null;
  endedAt?: string | null;
  commissionPercent?: number | null;
  workProfileId?: number | null;
};
