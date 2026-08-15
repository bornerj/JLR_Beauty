/**
 * Admin V2 (PLAN-0022, Onda 8) — Assinaturas como Saúde da Base (RETROFIT-009).
 * Contrato único do módulo (mesmo padrão de `customers/types.ts`): `health.classifier`
 * (puro) e `service.ts` (Prisma) importam daqui.
 *
 * `Subscription` não tem `unitId` no schema (mesma nota já registrada na Onda 1 para o
 * componente de assinaturas do Health Score) — este módulo é sempre de rede inteira, não
 * filtrável por unidade. A rota não aceita `unitIds` (diferente de todas as outras rotas
 * de lista do Admin V2) — aceitar e ignorar silenciosamente seria enganoso.
 */
export type SubscriptionState = "ENTRANDO" | "SAUDAVEL" | "ATENCAO" | "SAINDO";

export type SubscriptionHealthEntry = {
  subscriptionId: number;
  membershipName: string;
  /** Preço mensal do plano (`Membership.price`) — usado pelo Radar/Gargalos (PLAN-0023) para estimar receita recorrente em risco, sem inventar um valor. */
  membershipPrice: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  status: string;
  state: SubscriptionState;
  /** Nunca um número solto (governança #6) — explica o sinal exato da classificação. */
  reason: string;
  startedAt: string;
  cancelledAt: string | null;
  approvedPaymentsCurrentPeriod: number;
  approvedPaymentsPreviousPeriod: number;
};

export type SubscriptionHealth = {
  period: { from: string; to: string; days: number };
  counts: Record<SubscriptionState, number>;
  churn: {
    count: number;
    ratePercent: number | null;
    explanation: string;
  };
  subscriptions: SubscriptionHealthEntry[];
};

/** Sinais brutos já agregados de uma assinatura, entrada do classificador puro. */
export type SubscriptionRawSignals = {
  subscriptionId: number;
  membershipName: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  status: string;
  startedAt: Date;
  cancelledAt: Date | null;
  hasFailedPaymentCurrentPeriod: boolean;
  approvedPaymentsCurrentPeriod: number;
  approvedPaymentsPreviousPeriod: number;
};

export type ClassificationPeriod = { currentFrom: Date; currentTo: Date; previousFrom: Date; previousTo: Date };
