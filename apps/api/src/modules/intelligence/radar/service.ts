import { getPanorama } from "../panorama/service";
import { getNetworkBoard } from "../network/service";
import { getOrdersBoard } from "../operational-orders/service";
import { getPortfolioProducts } from "../portfolio/service";
import { getServicePerformance } from "../service-performance/service";
import { getCustomerFlow } from "../customers/service";
import { getSubscriptionHealth } from "../subscriptions/service";
import { getFranchisePipeline } from "../franchise-pipeline/service";
import { resolveAdminPeriodRange, type AdminPeriodInput } from "../../admin/kpis/period";
import { buildRadarFindings } from "./rules";
import type { RadarBriefing } from "./types";

/**
 * Admin V2 (PLAN-0023, Onda 1) — Radar Executivo (RETROFIT-011).
 * Busca os 8 endpoints de leitura já existentes (Ondas 1-9 do PLAN-0022) EM PARALELO
 * (`Promise.all`, nunca em cascata) e delega a priorização para `rules.ts` (puro).
 * Sempre de rede inteira — mesmo escopo do Panorama, sem `unitIds` (um briefing
 * executivo é sobre o negócio todo, não uma unidade isolada).
 */
export const getRadarBriefing = async (input: AdminPeriodInput): Promise<RadarBriefing> => {
  const range = resolveAdminPeriodRange(input);

  const [panorama, networkBoard, ordersBoard, portfolioProducts, servicePerformance, customerFlow, subscriptionHealth, franchisePipeline] =
    await Promise.all([
      getPanorama(input),
      getNetworkBoard(input),
      getOrdersBoard(input),
      getPortfolioProducts(input),
      getServicePerformance(input),
      getCustomerFlow(input),
      getSubscriptionHealth(input),
      getFranchisePipeline(),
    ]);

  const findings = buildRadarFindings({
    panorama,
    networkBoard,
    ordersBoard,
    portfolioProducts,
    servicePerformance,
    customerFlow,
    subscriptionHealth,
    franchisePipeline,
  });

  return {
    period: { from: range.from.toISOString(), to: range.to.toISOString(), days: range.days },
    generatedAt: new Date().toISOString(),
    findings,
  };
};
