/**
 * Admin V2 (PLAN-0022, Onda 7) — Clientes como Fluxo de Relacionamento (RETROFIT-008).
 * Contrato único do módulo (mesmo padrão de `portfolio/types.ts`,
 * `service-performance/types.ts`): `classifier.ts` (puro) e `service.ts` (Prisma)
 * importam daqui.
 *
 * Identidade de cliente: não existe uma FK real ligando `Order`/`Appointment` a um
 * cadastro único de cliente (schema atual não tem esse relacionamento) — a identidade é
 * um proxy `email > telefone > nome`, mesma convenção já usada em
 * `unit-health/service.ts` (`calculateUnitRecurrenceRate`) e `dashboardSalesInsights.ts`.
 * Não é resolução de identidade de CRM completa.
 */
export type CustomerState = "NOVO" | "ATIVO" | "RECORRENTE" | "EM_RISCO" | "INATIVO";

export type CustomerFlowEntry = {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  state: CustomerState;
  /** Nunca um número solto (governança #6) — explica exatamente qual sinal classificou este cliente. */
  reason: string;
  firstActivityAt: string;
  lastActivityAt: string;
  activityCountTotal: number;
  activityCountCurrentPeriod: number;
  activityCountPreviousPeriod: number;
};

export type CustomerFlow = {
  period: { from: string; to: string; days: number };
  counts: Record<CustomerState, number>;
  customers: CustomerFlowEntry[];
};

/** Sinais brutos já agregados de um cliente, entrada do classificador puro (`classifier.ts`). */
export type CustomerRawSignals = {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  firstActivityAt: Date;
  lastActivityAt: Date;
  activityCountTotal: number;
  activityCountCurrentPeriod: number;
  activityCountPreviousPeriod: number;
  /** Pedido OU agendamento cancelado com data dentro do período atual. */
  hasRecentCancellation: boolean;
  /** Existe alguma `Subscription` com `status=INADIMPLENTE` para esta identidade (estado atual, não histórico — `Subscription` não tem `unitId`, mesma nota da Onda 1). */
  isSubscriptionDelinquent: boolean;
};

export type ClassificationPeriod = { currentFrom: Date; currentTo: Date; previousFrom: Date; previousTo: Date };
