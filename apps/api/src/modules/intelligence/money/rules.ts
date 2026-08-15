import type {
  MoneyByPlan,
  MoneyByUnit,
  MoneyInputs,
  MoneyOverview,
  MoneySource,
  MoneyWaterfallStep,
} from "./types";

const round2 = (value: number): number => Math.round(value * 100) / 100;

/**
 * Admin V2 (PLAN-0023, Onda 3) — função pura de "Onde está o dinheiro?" (RETROFIT-013).
 * Não recalcula margem/CMV/receita do zero — só recombina o que os módulos das Ondas
 * 5 (Portfólio), 6 (Serviços) e 8 (Assinaturas) já validaram, mais uma agregação nova
 * por profissional (mesmos dados de agenda da Onda 6, só agrupados diferente).
 */
export const buildMoneyOverview = (inputs: MoneyInputs): MoneyOverview => {
  const { salesInsightsNetwork, salesInsightsByUnit, servicePerformance, subscriptionHealth, professionalRevenue } =
    inputs;

  const productRevenue = salesInsightsNetwork.totals.revenue;
  const productCost = salesInsightsNetwork.totals.cmv;

  const serviceRevenue = round2(servicePerformance.services.reduce((sum, svc) => sum + svc.revenue, 0));
  const serviceCost = round2(servicePerformance.services.reduce((sum, svc) => sum + svc.cost, 0));

  // MRR: soma do preço mensal de toda assinatura que ainda não cancelou — não é "receita
  // do período" como as outras duas origens, é a recorrência atual da base (mesma
  // convenção já usada no Gargalos, RETROFIT-012, para "MRR em risco").
  const activeSubscriptions = subscriptionHealth.subscriptions.filter((s) => s.status !== "CANCELADA");
  const subscriptionRevenue = round2(activeSubscriptions.reduce((sum, s) => sum + s.membershipPrice, 0));

  const totalRevenue = round2(productRevenue + serviceRevenue + subscriptionRevenue);
  const totalCost = round2(productCost + serviceCost);
  const grossMargin = round2(totalRevenue - totalCost);

  const waterfall: MoneyWaterfallStep[] = [
    {
      label: "Receita",
      amount: totalRevenue,
      kind: "total",
      explanation: "produtos (pedidos pagos) + serviços (agendamentos não cancelados) + assinaturas (MRR das assinaturas ainda não canceladas)",
    },
    {
      label: "Custo Direto",
      amount: totalCost,
      kind: "subtract",
      explanation: "CMV dos produtos vendidos + custo cadastrado dos serviços realizados — assinaturas não têm custo direto rastreado no sistema",
    },
    {
      label: "Margem Bruta",
      amount: grossMargin,
      kind: "total",
      explanation: "receita menos custo direto",
    },
  ];

  const sources: MoneySource[] = [
    {
      label: "Produtos",
      revenue: productRevenue,
      cost: productCost,
      explanation: "pedidos com status PAGO no período selecionado",
    },
    {
      label: "Serviços",
      revenue: serviceRevenue,
      cost: serviceCost,
      explanation: "agendamentos não cancelados no período, pelo preço/custo cadastrado do serviço",
    },
    {
      label: "Assinaturas (MRR)",
      revenue: subscriptionRevenue,
      cost: null,
      explanation: "soma do preço mensal de toda assinatura ainda não cancelada — recorrência atual da base, não filtrada pelo período",
    },
  ];

  const unitMap = new Map<number, MoneyByUnit>();
  for (const unit of salesInsightsByUnit) {
    unitMap.set(unit.unitId, {
      unitId: unit.unitId,
      unitName: unit.unitName,
      revenue: unit.insights.totals.revenue,
      cost: unit.insights.totals.cmv,
      marginPercent: null,
    });
  }
  for (const svc of servicePerformance.services) {
    for (const unitBreakdown of svc.byUnit) {
      const existing = unitMap.get(unitBreakdown.unitId);
      const base = existing ?? { unitId: unitBreakdown.unitId, unitName: unitBreakdown.unitName, revenue: 0, cost: 0, marginPercent: null };
      base.revenue = round2(base.revenue + unitBreakdown.revenue);
      base.cost = round2(base.cost + unitBreakdown.cost);
      unitMap.set(unitBreakdown.unitId, base);
    }
  }
  const byUnit: MoneyByUnit[] = Array.from(unitMap.values())
    .map((unit) => ({ ...unit, marginPercent: unit.revenue > 0 ? round2(((unit.revenue - unit.cost) / unit.revenue) * 100) : null }))
    .sort((a, b) => b.revenue - a.revenue);

  const byProduct = salesInsightsNetwork.topProducts.map((p) => ({
    productId: p.productId,
    name: p.name,
    revenue: p.revenue,
    cost: p.cmv,
    profit: p.profit,
  }));

  const byService = [...servicePerformance.services]
    .map((svc) => ({ serviceId: svc.serviceId, name: svc.name, revenue: svc.revenue, cost: svc.cost, profit: round2(svc.revenue - svc.cost) }))
    .sort((a, b) => b.revenue - a.revenue);

  const byChannel = [...salesInsightsNetwork.byChannel].sort((a, b) => b.revenue - a.revenue);

  const byProfessional = [...professionalRevenue].sort((a, b) => b.revenue - a.revenue);

  const planMap = new Map<string, MoneyByPlan>();
  for (const subscription of activeSubscriptions) {
    const existing = planMap.get(subscription.membershipName) ?? {
      membershipName: subscription.membershipName,
      activeCount: 0,
      mrr: 0,
    };
    existing.activeCount += 1;
    existing.mrr = round2(existing.mrr + subscription.membershipPrice);
    planMap.set(subscription.membershipName, existing);
  }
  const byPlan = Array.from(planMap.values()).sort((a, b) => b.mrr - a.mrr);

  return {
    period: salesInsightsNetwork.period,
    waterfall,
    sources,
    byUnit,
    byProduct,
    byService,
    byChannel,
    byProfessional,
    byPlan,
    omittedNote:
      "o degrau \"descontos/taxas/perdas → Margem de Contribuição\" do conceito original não existe aqui: o total do pedido já é o valor final pós-desconto (não há uma linha de desconto separada no schema) — criar esse degrau seria repetir a Margem Bruta com outro nome.",
  };
};
