/** Admin V2 (PLAN-0023, Onda 3) — Dinheiro (RETROFIT-013). Espelha apps/api/src/modules/intelligence/money/types.ts. */

export type MoneyWaterfallStep = {
  label: string;
  amount: number;
  kind: "total" | "subtract";
  explanation: string;
};

export type MoneySource = {
  label: "Produtos" | "Serviços" | "Assinaturas (MRR)";
  revenue: number;
  cost: number | null;
  explanation: string;
};

export type MoneyByUnit = {
  unitId: number;
  unitName: string;
  revenue: number;
  cost: number;
  marginPercent: number | null;
};

export type MoneyByProduct = {
  productId: number;
  name: string;
  revenue: number;
  cost: number;
  profit: number;
};

export type MoneyByService = {
  serviceId: number;
  name: string;
  revenue: number;
  cost: number;
  profit: number;
};

export type MoneyByChannel = {
  channel: string;
  revenue: number;
};

export type MoneyByProfessional = {
  professionalId: number;
  name: string;
  revenue: number;
  cost: number;
  appointments: number;
};

export type MoneyByPlan = {
  membershipName: string;
  activeCount: number;
  mrr: number;
};

export type MoneyOverview = {
  period: { from: string; to: string; days: number };
  waterfall: MoneyWaterfallStep[];
  sources: MoneySource[];
  byUnit: MoneyByUnit[];
  byProduct: MoneyByProduct[];
  byService: MoneyByService[];
  byChannel: MoneyByChannel[];
  byProfessional: MoneyByProfessional[];
  byPlan: MoneyByPlan[];
  omittedNote: string;
};
