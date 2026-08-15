import type { SalesInsights } from "../../admin/kpis/dashboardSalesInsights";
import type { ServicePerformanceList } from "../service-performance/types";
import type { SubscriptionHealth } from "../subscriptions/types";

/**
 * Admin V2 (PLAN-0023, Onda 3) — "Onde está o dinheiro?" (RETROFIT-013).
 * Contrato único do módulo (mesmo padrão de `radar/types.ts` e `gargalos/types.ts`):
 * `rules.ts` (puro) e `service.ts` (Prisma) importam daqui.
 */

/** Um degrau da cascata Receita → Custo Direto → Margem Bruta (mockup original `retrofit/RETROFIT-013.md`). */
export type MoneyWaterfallStep = {
  label: string;
  amount: number;
  /** "total": valor absoluto da etapa. "subtract": é subtraído da etapa anterior (UI decide como desenhar a seta). */
  kind: "total" | "subtract";
  explanation: string;
};

/** Uma das 3 origens de receita já validadas em ondas anteriores — nunca recalculadas do zero. */
export type MoneySource = {
  label: "Produtos" | "Serviços" | "Assinaturas (MRR)";
  revenue: number;
  /** null quando o custo direto não é rastreado nesta origem (assinaturas — sem custo de plano no schema). */
  cost: number | null;
  explanation: string;
};

export type MoneyByUnit = {
  unitId: number;
  unitName: string;
  revenue: number;
  cost: number;
  /** null só quando a unidade não teve nenhuma receita (produto+serviço) no período. */
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
  /** Explica por que a cascata do mockup original (`.../descontos/taxas/perdas → Margem de Contribuição`) não tem um degrau próprio aqui. */
  omittedNote: string;
};

/** Receita/custo de serviços agrupada por profissional — única agregação nova desta onda (as demais reusam módulos existentes). */
export type ProfessionalRevenueEntry = {
  professionalId: number;
  name: string;
  revenue: number;
  cost: number;
  appointments: number;
};

/** Entradas já buscadas do Prisma pelo `service.ts`, delegadas para a função pura `buildMoneyOverview()`. */
export type MoneyInputs = {
  salesInsightsNetwork: SalesInsights;
  salesInsightsByUnit: Array<{ unitId: number; unitName: string; insights: SalesInsights }>;
  servicePerformance: ServicePerformanceList;
  subscriptionHealth: SubscriptionHealth;
  professionalRevenue: ProfessionalRevenueEntry[];
};
