/** Admin V2 (PLAN-0022, Onda 7) — Clientes como Fluxo de Relacionamento (RETROFIT-008). Espelha apps/api/src/modules/intelligence/customers/types.ts. */

export type CustomerState = "NOVO" | "ATIVO" | "RECORRENTE" | "EM_RISCO" | "INATIVO";

export type CustomerFlowEntry = {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  state: CustomerState;
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
