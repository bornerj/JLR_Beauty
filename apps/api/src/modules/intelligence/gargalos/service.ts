import prisma from "../../../lib/prisma";
import { getOrdersBoard } from "../operational-orders/service";
import { getCapacityHeatmap } from "../capacity/service";
import { getPortfolioProducts } from "../portfolio/service";
import { getSubscriptionHealth } from "../subscriptions/service";
import { getFranchisePipeline } from "../franchise-pipeline/service";
import { resolveAdminPeriodRange, type AdminPeriodInput } from "../../admin/kpis/period";
import { rankBottlenecks, sumKnownImpact } from "./rules";
import type { BottlenecksRanking } from "./types";

/**
 * Admin V2 (PLAN-0023, Onda 2) — "O que está travando?" / Gargalos (RETROFIT-012).
 * Busca os módulos de origem EM PARALELO (`Promise.all`) e delega a priorização para
 * `rules.ts` (puro). Sempre de rede inteira, mesmo escopo do Radar (Onda 1).
 *
 * A Agenda (Onda 4) é por unidade — aqui buscamos o heatmap de TODAS as unidades em
 * paralelo (única consulta direta a `Unit` deste módulo, mesmo padrão já usado em
 * `service-performance/service.ts` para resolver o escopo de rede inteira).
 */
export const getBottlenecksRanking = async (input: AdminPeriodInput): Promise<BottlenecksRanking> => {
  const range = resolveAdminPeriodRange(input);

  const units = await prisma.unit.findMany({ select: { id: true } });

  const [ordersBoard, capacityHeatmaps, portfolioProducts, subscriptionHealth, franchisePipeline] = await Promise.all([
    getOrdersBoard(input),
    Promise.all(units.map((unit) => getCapacityHeatmap({ ...input, unitId: unit.id }))),
    getPortfolioProducts(input),
    getSubscriptionHealth(input),
    getFranchisePipeline(),
  ]);

  const bottlenecks = rankBottlenecks({
    ordersBoard,
    capacityHeatmaps,
    portfolioProducts,
    subscriptionHealth,
    franchisePipeline,
  });

  return {
    period: { from: range.from.toISOString(), to: range.to.toISOString(), days: range.days },
    generatedAt: new Date().toISOString(),
    totalImpact: sumKnownImpact(bottlenecks),
    bottlenecks,
  };
};
