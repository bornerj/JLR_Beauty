import type { PanoramaSnapshot } from "../panorama/types";
import type { NetworkBoard } from "../network/types";
import type { OrdersBoard } from "../operational-orders/types";
import type { PortfolioProducts } from "../portfolio/types";
import type { ServicePerformanceList } from "../service-performance/types";
import type { CustomerFlow } from "../customers/types";
import type { SubscriptionHealth } from "../subscriptions/types";
import type { FranchisePipeline } from "../franchise-pipeline/types";

/**
 * Admin V2 (PLAN-0023, Onda 1) — Radar Executivo (RETROFIT-011).
 * Contrato único do módulo (mesmo padrão de `franchise-pipeline/types.ts`): `rules.ts`
 * (puro) e `service.ts` (orquestração) importam daqui.
 *
 * Cruza os 8 endpoints de leitura já entregues nas Ondas 1-9 do PLAN-0022 — não
 * recalcula nenhuma classificação, só lê o que cada módulo já decompôs e monta achados
 * priorizados. Sem ML — toda regra é fixa e documentada em `rules.ts`.
 */
export type RadarSeverity = "CRITICO" | "ATENCAO" | "OPORTUNIDADE";

export type RadarFinding = {
  id: string;
  severity: RadarSeverity;
  category: string;
  /** Nunca um número solto (governança #6 do PLAN-0022) — a mensagem já explica o achado. */
  message: string;
  actionLabel: string;
  /** Rota do próprio Admin V2 para onde o achado leva — todo achado tem uma (governança #7). */
  actionPath: string;
};

export type RadarBriefing = {
  period: { from: string; to: string; days: number };
  generatedAt: string;
  findings: RadarFinding[];
};

/** Entrada pura de `buildRadarFindings` — as respostas já normalizadas dos 8 módulos consumidos. */
export type RadarInputs = {
  panorama: PanoramaSnapshot;
  networkBoard: NetworkBoard;
  ordersBoard: OrdersBoard;
  portfolioProducts: PortfolioProducts;
  servicePerformance: ServicePerformanceList;
  customerFlow: CustomerFlow;
  subscriptionHealth: SubscriptionHealth;
  franchisePipeline: FranchisePipeline;
};
