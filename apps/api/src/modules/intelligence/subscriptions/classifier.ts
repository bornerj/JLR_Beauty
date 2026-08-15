import type { ClassificationPeriod, SubscriptionRawSignals, SubscriptionState } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 8) — Assinaturas como Saúde da Base (RETROFIT-009).
 * Classificação pura (sem Prisma, testável isolada — mesmo padrão de
 * `customers/classifier.ts`), em ordem de prioridade fixa e documentada:
 *
 * 1. SAINDO — `status=CANCELADA` (o critério de aceitação da onda: churn deve bater
 *    exatamente com este status, sem heurística por cima).
 * 2. ENTRANDO — `status=PENDENTE` (ainda não ativada) OU `status=ATIVA` iniciada dentro
 *    do período atual (recém-chegada).
 * 3. ATENÇÃO — `status=INADIMPLENTE`, OU cobrança recusada no período, OU queda no
 *    número de cobranças aprovadas vs. o período anterior — nesta ordem de prioridade
 *    (sinal mais explícito/grave primeiro).
 * 4. SAUDÁVEL — fallback: `status=ATIVA`, sem nenhum sinal de risco.
 *
 * Nenhum estado é um número solto — todo item sai com `reason` explicando o sinal exato.
 */

export const classifySubscription = (
  signals: SubscriptionRawSignals,
  period: ClassificationPeriod
): { state: SubscriptionState; reason: string } => {
  if (signals.status === "CANCELADA") {
    return {
      state: "SAINDO",
      reason: signals.cancelledAt ? "Assinatura cancelada." : "Assinatura cancelada (data do cancelamento não registrada).",
    };
  }

  const startedInCurrentPeriod = signals.startedAt >= period.currentFrom && signals.startedAt <= period.currentTo;
  if (signals.status === "PENDENTE") {
    return { state: "ENTRANDO", reason: "Aguardando ativação (primeiro pagamento ainda não confirmado)." };
  }
  if (startedInCurrentPeriod) {
    return { state: "ENTRANDO", reason: "Assinatura iniciada neste período." };
  }

  if (signals.status === "INADIMPLENTE") {
    return { state: "ATENCAO", reason: "Assinatura inadimplente." };
  }
  if (signals.hasFailedPaymentCurrentPeriod) {
    return { state: "ATENCAO", reason: "Cobrança recusada neste período." };
  }
  if (signals.approvedPaymentsPreviousPeriod > 0 && signals.approvedPaymentsCurrentPeriod < signals.approvedPaymentsPreviousPeriod) {
    return {
      state: "ATENCAO",
      reason: `Uso caiu: ${signals.approvedPaymentsCurrentPeriod} cobrança(s) aprovada(s) neste período vs ${signals.approvedPaymentsPreviousPeriod} no anterior.`,
    };
  }

  return { state: "SAUDAVEL", reason: "Sem nenhum sinal de risco nos pagamentos deste período." };
};
