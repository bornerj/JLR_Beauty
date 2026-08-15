import type { ClassificationPeriod, CustomerRawSignals, CustomerState } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 7) — Clientes como Fluxo de Relacionamento (RETROFIT-008).
 * Classificação pura (sem Prisma, testável isolada — mesmo padrão de
 * `operational-orders/classifier.ts`), em ordem de prioridade fixa e documentada:
 *
 * 1. NOVO — primeira atividade de sempre aconteceu neste período.
 * 2. EM_RISCO — sinal negativo explícito (cancelamento recente, assinatura
 *    inadimplente) OU quebra de cadência (ativo no período anterior e sumiu neste, ou
 *    ativo nos dois mas com queda de frequência). Cancelamento/inadimplência têm
 *    prioridade sobre os sinais de cadência — são mais específicos e acionáveis do que
 *    "sumiu" genérico, mesmo quando os dois são verdade ao mesmo tempo.
 * 3. INATIVO — nenhuma atividade nem no período atual, nem no anterior.
 * 4. RECORRENTE — atividade nos dois períodos, sem nenhum sinal de risco.
 * 5. ATIVO — fallback: ativo neste período, não é novo, não tem sinal de risco, mas
 *    ainda não tem atividade no período anterior para virar "recorrente".
 *
 * Nenhum estado é um número solto — todo cliente sai com `reason` explicando o sinal
 * exato que o classificou (governança #6).
 */

export const classifyCustomer = (
  signals: CustomerRawSignals,
  period: ClassificationPeriod
): { state: CustomerState; reason: string } => {
  const firstInCurrentPeriod = signals.firstActivityAt >= period.currentFrom && signals.firstActivityAt <= period.currentTo;
  if (firstInCurrentPeriod) {
    return { state: "NOVO", reason: "Primeira atividade registrada neste período." };
  }

  const activeInCurrent = signals.activityCountCurrentPeriod > 0;
  const activeInPrevious = signals.activityCountPreviousPeriod > 0;

  if (signals.hasRecentCancellation) {
    return { state: "EM_RISCO", reason: "Teve um pedido ou agendamento cancelado neste período." };
  }
  if (signals.isSubscriptionDelinquent) {
    return { state: "EM_RISCO", reason: "Assinatura inadimplente." };
  }
  if (activeInPrevious && !activeInCurrent) {
    return {
      state: "EM_RISCO",
      reason: "Sem atividade neste período — a última foi no período anterior (ciclo de retorno atrasado).",
    };
  }
  if (activeInCurrent && activeInPrevious && signals.activityCountCurrentPeriod < signals.activityCountPreviousPeriod) {
    return {
      state: "EM_RISCO",
      reason: `Frequência caiu: ${signals.activityCountCurrentPeriod} atividade(s) neste período vs ${signals.activityCountPreviousPeriod} no anterior.`,
    };
  }

  if (!activeInCurrent && !activeInPrevious) {
    return { state: "INATIVO", reason: "Sem nenhuma atividade nos dois últimos períodos." };
  }

  if (activeInCurrent && activeInPrevious) {
    return {
      state: "RECORRENTE",
      reason: `Atividade nos dois períodos (atual e anterior) — ${signals.activityCountTotal} atividade(s) no total.`,
    };
  }

  return {
    state: "ATIVO",
    reason: "Ativo neste período; ainda sem atividade no período anterior para virar um padrão recorrente.",
  };
};
