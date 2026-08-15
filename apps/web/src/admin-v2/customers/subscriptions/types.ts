/** Admin V2 (PLAN-0022, Onda 8) — Assinaturas como Saúde da Base (RETROFIT-009). Espelha apps/api/src/modules/intelligence/subscriptions/types.ts. */

export type SubscriptionState = "ENTRANDO" | "SAUDAVEL" | "ATENCAO" | "SAINDO";

export type SubscriptionHealthEntry = {
  subscriptionId: number;
  membershipName: string;
  membershipPrice: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  status: string;
  state: SubscriptionState;
  reason: string;
  startedAt: string;
  cancelledAt: string | null;
  approvedPaymentsCurrentPeriod: number;
  approvedPaymentsPreviousPeriod: number;
};

export type SubscriptionHealth = {
  period: { from: string; to: string; days: number };
  counts: Record<SubscriptionState, number>;
  churn: { count: number; ratePercent: number | null; explanation: string };
  subscriptions: SubscriptionHealthEntry[];
};
