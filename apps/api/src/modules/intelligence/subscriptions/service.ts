import { Prisma } from "@prisma/client";
import prisma from "../../../lib/prisma";
import { resolveAdminPeriodRange, type AdminPeriodInput } from "../../admin/kpis/period";
import { classifySubscription } from "./classifier";
import type { SubscriptionHealth, SubscriptionHealthEntry, SubscriptionRawSignals, SubscriptionState } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 8) — Assinaturas como Saúde da Base (RETROFIT-009).
 * Camada de acesso a dados: `Subscription` + `Payment` reais (nenhum campo novo,
 * 100% derivado). Nenhuma escrita.
 */

const round1 = (value: number): number => Math.round(value * 10) / 10;

const decimalToNumber = (value: Prisma.Decimal | null | undefined): number => {
  if (!value) return 0;
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : 0;
};

const EMPTY_COUNTS: Record<SubscriptionState, number> = { ENTRANDO: 0, SAUDAVEL: 0, ATENCAO: 0, SAINDO: 0 };

export const getSubscriptionHealth = async (input: AdminPeriodInput): Promise<SubscriptionHealth> => {
  const range = resolveAdminPeriodRange(input);
  const period = { currentFrom: range.from, currentTo: range.to, previousFrom: range.previousFrom, previousTo: range.previousTo };

  const subscriptions = await prisma.subscription.findMany({
    select: {
      id: true,
      status: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      startedAt: true,
      cancelledAt: true,
      membership: { select: { name: true, price: true } },
      payments: { select: { status: true, paidAt: true, createdAt: true } },
    },
  });

  const counts: Record<SubscriptionState, number> = { ...EMPTY_COUNTS };
  let churnCount = 0;

  const entries: SubscriptionHealthEntry[] = subscriptions.map((subscription) => {
    let approvedPaymentsCurrentPeriod = 0;
    let approvedPaymentsPreviousPeriod = 0;
    let hasFailedPaymentCurrentPeriod = false;

    for (const payment of subscription.payments) {
      // `paidAt` é quando o dinheiro de fato entrou; cobranças recusadas nunca têm
      // `paidAt` preenchido, então caem para `createdAt` (quando a tentativa aconteceu).
      const effectiveDate = payment.paidAt ?? payment.createdAt;
      const inCurrentPeriod = effectiveDate >= range.from && effectiveDate <= range.to;
      const inPreviousPeriod = effectiveDate >= range.previousFrom && effectiveDate <= range.previousTo;

      if (payment.status === "APROVADO") {
        if (inCurrentPeriod) approvedPaymentsCurrentPeriod += 1;
        else if (inPreviousPeriod) approvedPaymentsPreviousPeriod += 1;
      } else if (payment.status === "RECUSADO" && inCurrentPeriod) {
        hasFailedPaymentCurrentPeriod = true;
      }
    }

    const signals: SubscriptionRawSignals = {
      subscriptionId: subscription.id,
      membershipName: subscription.membership.name,
      customerName: subscription.customerName,
      customerEmail: subscription.customerEmail,
      customerPhone: subscription.customerPhone,
      status: subscription.status,
      startedAt: subscription.startedAt,
      cancelledAt: subscription.cancelledAt,
      hasFailedPaymentCurrentPeriod,
      approvedPaymentsCurrentPeriod,
      approvedPaymentsPreviousPeriod,
    };

    const { state, reason } = classifySubscription(signals, period);
    counts[state] += 1;

    // Churn "no período" (critério de aceitação): só conta quem realmente cancelou
    // dentro da janela pedida, não toda `CANCELADA` histórica da base.
    if (subscription.status === "CANCELADA" && subscription.cancelledAt && subscription.cancelledAt >= range.from && subscription.cancelledAt <= range.to) {
      churnCount += 1;
    }

    return {
      subscriptionId: subscription.id,
      membershipName: subscription.membership.name,
      membershipPrice: decimalToNumber(subscription.membership.price),
      customerName: subscription.customerName,
      customerEmail: subscription.customerEmail,
      customerPhone: subscription.customerPhone,
      status: subscription.status,
      state,
      reason,
      startedAt: subscription.startedAt.toISOString(),
      cancelledAt: subscription.cancelledAt ? subscription.cancelledAt.toISOString() : null,
      approvedPaymentsCurrentPeriod,
      approvedPaymentsPreviousPeriod,
    };
  });

  entries.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return {
    period: { from: range.from.toISOString(), to: range.to.toISOString(), days: range.days },
    counts,
    churn: {
      count: churnCount,
      // Simplificação documentada: taxa sobre a base total de assinaturas (não sobre a
      // base ativa no início do período — não temos snapshot histórico para calcular
      // isso com precisão). Sobe/desce de forma honesta com o tamanho real da base.
      ratePercent: subscriptions.length > 0 ? round1((churnCount / subscriptions.length) * 100) : null,
      explanation: "cancelamentos com data dentro do período selecionado / total de assinaturas da base",
    },
    subscriptions: entries,
  };
};
