import type { OrdersBoard } from "../operational-orders/types";
import type { CapacityHeatmap } from "../capacity/types";
import type { PortfolioProducts } from "../portfolio/types";
import type { SubscriptionHealth } from "../subscriptions/types";
import type { FranchisePipeline } from "../franchise-pipeline/types";

/**
 * Admin V2 (PLAN-0023, Onda 2) — "O que está travando?" / Gargalos (RETROFIT-012).
 * Contrato único do módulo (mesmo padrão de `radar/types.ts`): `rules.ts` (puro) e
 * `service.ts` (orquestração) importam daqui.
 *
 * Diferente do Radar (Onda 1, que lista TODOS os achados): Gargalos só entra quando dá
 * pra estimar um impacto em R$ honesto — cruza Ondas 3 (Operação)/4 (Agenda)/5
 * (Portfólio)/8 (Assinaturas)/9 (Franquias), sempre reusando um cálculo que o módulo de
 * origem já faz (nunca inventa uma fórmula nova de dinheiro).
 */
export type BottleneckImpact = {
  amount: number;
  /** Nunca só o número (governança #6) — explica de onde veio a estimativa. */
  explanation: string;
} | null;

export type Bottleneck = {
  id: string;
  category: string;
  message: string;
  /** Null quando o domínio não tem uma tradução honesta pra R$ ainda (aparece no fim do ranking, não escondido). */
  impact: BottleneckImpact;
  actionLabel: string;
  actionPath: string;
};

export type BottlenecksRanking = {
  period: { from: string; to: string; days: number };
  generatedAt: string;
  totalImpact: number;
  bottlenecks: Bottleneck[];
};

/** Entrada pura de `rankBottlenecks` — respostas já normalizadas dos módulos consumidos. */
export type RankInputs = {
  ordersBoard: OrdersBoard;
  /** 1 heatmap por unidade da rede — Gargalos soma a ociosidade de todas (Onda 4 é por unidade, aqui é visão de rede). */
  capacityHeatmaps: CapacityHeatmap[];
  portfolioProducts: PortfolioProducts;
  subscriptionHealth: SubscriptionHealth;
  franchisePipeline: FranchisePipeline;
};
