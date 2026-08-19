/**
 * Admin V2 (PLAN-0031) — tipos da Lista de Pedidos nativa (migração da tela legada "Pedidos e
 * Vendas", `apps/web/src/modules/admin-orders/behavior.ts`). Espelha o shape cru devolvido por
 * `GET /orders` (`apps/api/src/routes/orders.ts`) — Prisma inclui `items`/`payments`/
 * `statusHistory`; valores monetários (`Decimal`) chegam como string no JSON, mesmo padrão já
 * usado em `Product.price`/`Service.price` no resto do Admin V2.
 */

export type OrderListItem = {
  id: number;
  productId: number | null;
  membershipId: number | null;
  serviceId: number | null;
  quantity: number;
  unitPrice: string;
  unitCost: string | null;
  product: { id: number; name: string } | null;
  service: { id: number; name: string } | null;
  membership: { id: number; name: string; title: string | null } | null;
};

export type OrderListPayment = {
  id: number;
  status: string;
  provider: string;
  providerPaymentId: string | null;
  amount: string;
  method: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type OrderListHistory = {
  id: number;
  fromStatus: string | null;
  toStatus: string;
  source: string;
  note: string | null;
  createdAt: string;
};

export type OrderListRow = {
  id: number;
  publicCode: string | null;
  status: string;
  fulfillmentStatus: string;
  channel: string;
  total: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shipmentTrackingCode: string | null;
  shipmentCarrier: string | null;
  fulfillmentNotes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderListItem[];
  payments: OrderListPayment[];
  statusHistory: OrderListHistory[];
};

export type OrdersSummary = {
  totalOrders: number;
  inProgress: number;
  dispatched: number;
  delivered: number;
  cancelled: number;
  pendingPayment: number;
  confirmedRevenue: number;
};

export type BulkAdvanceResult = {
  orderId: number;
  result: "UPDATED" | "SKIPPED";
  reason?: string;
  previousFulfillmentStatus?: string;
  nextFulfillmentStatus?: string;
  nextOrderStatus?: string;
};

export type BulkAdvanceResponse = {
  totalRequested: number;
  updatedCount: number;
  skippedCount: number;
  results: BulkAdvanceResult[];
};

export const ORDER_STATUS_OPTIONS = ["PENDENTE", "PAGO", "ENVIADO", "ENTREGUE", "CANCELADO"] as const;
export const FULFILLMENT_STATUS_OPTIONS = [
  "PENDENTE",
  "SEPARANDO",
  "EMBALADO",
  "DESPACHADO",
  "ENVIADO",
  "ENTREGUE",
  "CANCELADO",
] as const;

/** Etapas de fulfillment que avançam o pedido — usado pra desabilitar opção quando o pagamento vinculado não está aprovado (mesma regra do backend, `requiresApprovedPayment`). */
export const PROGRESSING_FULFILLMENT_STATUSES = new Set(["SEPARANDO", "EMBALADO", "DESPACHADO", "ENVIADO", "ENTREGUE"]);
/** Status do pedido que avançam — mesma regra, pro select de status. */
export const PROGRESSING_ORDER_STATUSES = new Set(["PAGO", "ENVIADO", "ENTREGUE"]);

export const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
  ENVIADO: "Enviado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
  SEPARANDO: "Separando",
  EMBALADO: "Embalado",
  DESPACHADO: "Despachado",
};

export const STATUS_BADGE_CLASS: Record<string, string> = {
  PENDENTE: "bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-200",
  PAGO: "bg-state-healthy/15 text-state-healthy",
  SEPARANDO: "bg-state-info/15 text-state-info",
  EMBALADO: "bg-state-info/15 text-state-info",
  DESPACHADO: "bg-primary/15 text-primary",
  ENVIADO: "bg-primary/15 text-primary",
  ENTREGUE: "bg-state-healthy/15 text-state-healthy",
  CANCELADO: "bg-state-critical/15 text-state-critical",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
  CANCELADO: "Cancelado",
  REEMBOLSADO: "Reembolsado",
};

/** `has*Payment` calculados a partir de `payments` — mesma regra usada no backend (`requiresApprovedPayment`) pra desabilitar opções que avançam etapa. */
export const requiresApprovedPayment = (payments: OrderListPayment[]): boolean => {
  const hasLinked = payments.length > 0;
  const hasApproved = payments.some((payment) => payment.status === "APROVADO");
  return hasLinked && !hasApproved;
};
