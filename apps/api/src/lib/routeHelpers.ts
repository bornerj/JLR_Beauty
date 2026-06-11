import { z } from "zod";
import { type Prisma } from "@prisma/client";

export const withDetail = (detail?: string) => {
  return process.env.NODE_ENV === "development" && detail ? { detail } : {};
};

export const parseOptionalDate = (value?: string | null): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value.trim() === "") return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
};

export const parseIsoDateStart = (value: string): Date | null => {
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  const parsed = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

export const addDays = (value: Date, days: number): Date => {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
};

export const clockToMinutes = (value: string): number | null => {
  const matched = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!matched) return null;
  const hour = Number(matched[1]);
  const minute = Number(matched[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
};

export const fieldLabels: Record<string, string> = {
  identifier: "e-mail/usuário",
  password: "senha",
  name: "nome",
  email: "email",
  price: "preço",
  durationMin: "duração",
  title: "título",
  benefits: "benefícios",
  total: "total",
  items: "itens",
  quantity: "quantidade",
  unitPrice: "preço unitário",
  cost: "custo",
  customerName: "nome do cliente",
  customerEmail: "email do cliente",
  customerPhone: "telefone/WhatsApp do cliente",
  unitId: "unidade",
  professionalId: "profissional",
  serviceId: "serviço",
  orderId: "pedido",
  start: "início",
  end: "fim",
  clientName: "nome do cliente",
  clientPhone: "telefone/WhatsApp do cliente",
  phone: "telefone/WhatsApp",
  phone2: "telefone/WhatsApp 2",
  city: "cidade",
  neighborhood: "bairro",
  avatarUrl: "imagem/avatar",
  status: "status",
  emailVerified: "email verificado",
  rating: "avaliacao",
  role: "tipo",
  sku: "sku",
  stock: "estoque",
  productCategoryId: "categoria do produto",
  serviceCategoryId: "categoria do servico",
  productStatusId: "status do produto",
  serviceStatusId: "status do servico",
  commissionPercent: "comissao",
  isFeatured: "destaque",
  discountType: "tipo de desconto",
  percentOff: "percentual de desconto",
  amountOff: "valor de desconto",
  minSubtotal: "subtotal minimo",
  startsAt: "inicio de validade",
  endsAt: "fim de validade",
  isActive: "ativo",
  code: "codigo",
  subtotal: "subtotal",
  scheduledFor: "data e hora agendada",
  scheduledDateLabel: "data do agendamento",
  date: "data",
  slotLabel: "horario",
  period: "periodo",
  requestedServiceName: "servico solicitado",
  requestedDate: "data solicitada",
  hourStart: "horario inicial",
  hourFinish: "horario final",
  workDate: "data da escala",
  professionalUserId: "usuario profissional",
  workProfileId: "perfil de trabalho",
  canScheduleAppointments: "pode realizar agendamentos",
  canAccessOtherProfessionalsAgenda: "acesso a agenda de outros profissionais",
  canViewServiceValues: "visualizar valores de servicos",
  canViewCustomerContact: "visualizar contato do cliente",
  canAccessMenuClientsAnamnese: "acesso menu clientes/anamnese",
  canAccessMenuServices: "acesso menu servicos",
  canAccessMenuProducts: "acesso menu produtos",
  canAccessMenuExpenses: "acesso menu despesas",
  canViewCommissionsToReceive: "visualizar comissoes a receber",
  canViewCommissionPayments: "visualizar pagamentos de comissao",
  canEditAppointments: "editar agendamentos",
  canDeleteAppointments: "deletar agendamentos",
  canCreateServiceInAppointment: "criar servico no agendamento",
  canViewGrossCommissionsToPay: "ver total bruto em comissoes a pagar",
};

export const translateZodMessage = (message: string) => {
  const lower = message.toLowerCase();
  if (lower.includes("required")) return "campo obrigatório";
  if (lower.includes("invalid email") || lower.includes("email")) return "email inválido";
  if (lower.includes("at least") || lower.includes("greater than or equal"))
    return "valor inválido";
  if (lower.includes("number")) return "deve ser um número válido";
  if (lower.includes("string")) return "deve ser um texto válido";
  if (lower.includes("array")) return "lista inválida";
  return message;
};

export const urlOrPathSchema = z.string().refine(
  (value) => value.startsWith("/") || /^https?:\/\//.test(value),
  "url inválida"
);

export type ZodIssueLike = {
  path: ReadonlyArray<PropertyKey>;
  message: string;
};

export const formatZodDetail = (issues: ReadonlyArray<ZodIssueLike>) => {
  if (!issues.length) return undefined;
  return issues
    .map((issue) => {
      const fieldPath = issue.path.length ? issue.path.map(String).join(".") : "corpo";
      const fieldKey = issue.path.length ? String(issue.path[0]) : "corpo";
      const label = fieldLabels[fieldKey] || fieldPath;
      return `${label}: ${translateZodMessage(issue.message)}`;
    })
    .join("; ");
};

export const normalizeNullableText = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export const asInputJsonObject = (value: Prisma.JsonValue | null | undefined): Prisma.InputJsonObject => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Prisma.InputJsonObject;
  }
  return {};
};
