import type { Bottleneck, RankInputs } from "./types";

/**
 * Admin V2 (PLAN-0023, Onda 2) — "O que está travando?" / Gargalos (RETROFIT-012).
 * Regras determinísticas e fixas (sem ML) — cada gargalo com impacto conhecido reusa uma
 * fórmula já usada em algum módulo das Ondas 3-9, nunca inventa uma nova conta de R$.
 * Ordenado por impacto (`amount`) decrescente; sem impacto conhecido vai pro fim, nunca
 * escondido (governança #6).
 */

/**
 * Mesma fórmula honesta de `capacity/service.ts` (`getSlotDetail`): minutos ociosos ×
 * taxa de referência (a do próprio horário, ou a média da unidade quando o horário não
 * teve nenhuma reserva própria). Somada aqui em vez de refeita — Onda 4 já calcula tudo
 * que este cálculo precisa, campo a campo, dentro do próprio heatmap.
 */
const estimateAgendaLostRevenue = (inputs: RankInputs): { totalAmount: number; worstUnitName: string | null; worstUnitAmount: number } => {
  let totalAmount = 0;
  let worstUnitName: string | null = null;
  let worstUnitAmount = 0;

  for (const heatmap of inputs.capacityHeatmaps) {
    let unitAmount = 0;
    for (const day of heatmap.days) {
      for (const slot of day.slots) {
        const idleMinutes = Math.max(0, slot.availableMinutes - slot.bookedMinutes);
        const referenceRate = slot.revenuePerBookedHour ?? heatmap.unitRevenuePerBookedHour;
        if (idleMinutes <= 0 || referenceRate === null || referenceRate <= 0) continue;
        unitAmount += (idleMinutes / 60) * referenceRate;
      }
    }
    totalAmount += unitAmount;
    if (unitAmount > worstUnitAmount) {
      worstUnitAmount = unitAmount;
      worstUnitName = heatmap.unitName;
    }
  }

  return { totalAmount, worstUnitName, worstUnitAmount };
};

export const rankBottlenecks = (inputs: RankInputs): Bottleneck[] => {
  const bottlenecks: Bottleneck[] = [];

  // ─── Operação (Onda 3): dinheiro parado em pedidos que precisam de atenção ──────────
  const attentionColumn = inputs.ordersBoard.columns.atencao;
  if (attentionColumn.count > 0) {
    bottlenecks.push({
      id: "gargalo-operacao-pedidos",
      category: "Operação",
      message: `${attentionColumn.count} pedido(s) travados no fulfillment.`,
      impact: {
        amount: attentionColumn.totalValue,
        explanation: "soma do valor dos pedidos na coluna \"Atenção\" do board operacional (Onda 3) — dinheiro cobrado, ainda não entregue",
      },
      actionLabel: "Ver operação",
      actionPath: "/admin-v2/operacao",
    });
  }

  // ─── Agenda (Onda 4): receita potencial perdida por ociosidade, somada em toda a rede ─
  const agenda = estimateAgendaLostRevenue(inputs);
  if (agenda.totalAmount > 0) {
    bottlenecks.push({
      id: "gargalo-agenda-ociosidade",
      category: "Agenda",
      message: agenda.worstUnitName
        ? `Capacidade ociosa na agenda em toda a rede — a unidade mais afetada é ${agenda.worstUnitName}.`
        : "Capacidade ociosa na agenda em toda a rede.",
      impact: {
        amount: agenda.totalAmount,
        explanation: "soma de (minutos ociosos × receita/hora de referência) de cada horário de cada unidade — mesma fórmula do drill-down de horário da Onda 4",
      },
      actionLabel: "Ver agenda",
      actionPath: "/admin-v2/operacao/agenda",
    });
  }

  // ─── Portfólio (Onda 5): capital parado em produtos Armadilha ───────────────────────
  const armadilhaProducts = inputs.portfolioProducts.products.filter((product) => product.quadrant === "ARMADILHA");
  const capitalParked = armadilhaProducts.reduce((sum, product) => sum + product.capitalParked, 0);
  if (armadilhaProducts.length > 0) {
    bottlenecks.push({
      id: "gargalo-portfolio-capital-parado",
      category: "Portfólio",
      message: `${armadilhaProducts.length} produto(s) Armadilha (vendem bastante, rendem pouco) com capital parado em estoque.`,
      impact:
        capitalParked > 0
          ? { amount: capitalParked, explanation: "soma de estoque físico × custo dos produtos classificados como Armadilha (Onda 5)" }
          : null,
      actionLabel: "Ver produtos",
      actionPath: "/admin-v2/operacao/produtos",
    });
  }

  // ─── Assinaturas (Onda 8): receita recorrente mensal em risco (Saindo + Atenção) ────
  const atRiskSubscriptions = inputs.subscriptionHealth.subscriptions.filter((subscription) => subscription.state === "SAINDO" || subscription.state === "ATENCAO");
  const mrrAtRisk = atRiskSubscriptions.reduce((sum, subscription) => sum + subscription.membershipPrice, 0);
  if (atRiskSubscriptions.length > 0) {
    bottlenecks.push({
      id: "gargalo-assinaturas-mrr-risco",
      category: "Assinaturas",
      message: `${atRiskSubscriptions.length} assinatura(s) saindo ou em atenção.`,
      impact:
        mrrAtRisk > 0
          ? { amount: mrrAtRisk, explanation: "soma do preço mensal dos planos das assinaturas em \"Saindo\" ou \"Atenção\" (Onda 8) — receita recorrente mensal em risco" }
          : null,
      actionLabel: "Ver assinaturas",
      actionPath: "/admin-v2/clientes/assinaturas",
    });
  }

  // ─── Franquias (Onda 9): valor potencial parado em leads acima do tempo esperado ────
  const stalledLeads = inputs.franchisePipeline.leads.filter((lead) => lead.isStalled);
  const stalledValue = stalledLeads.reduce((sum, lead) => sum + (lead.estimatedValue ?? 0), 0);
  if (stalledLeads.length > 0) {
    bottlenecks.push({
      id: "gargalo-franquias-leads-parados",
      category: "Franquias",
      message: `${stalledLeads.length} lead(s) de franquia parados além do tempo esperado para a etapa.`,
      impact:
        stalledValue > 0
          ? { amount: stalledValue, explanation: "soma do valor potencial estimado dos leads parados além do tempo médio esperado da etapa (Onda 9)" }
          : null,
      actionLabel: "Ver pipeline",
      actionPath: "/admin-v2/crescimento",
    });
  }

  // Impacto decrescente primeiro; sem impacto conhecido (null) vai pro fim, nunca escondido.
  return bottlenecks.sort((a, b) => (b.impact?.amount ?? -1) - (a.impact?.amount ?? -1));
};

export const sumKnownImpact = (bottlenecks: Bottleneck[]): number =>
  Math.round(bottlenecks.reduce((sum, bottleneck) => sum + (bottleneck.impact?.amount ?? 0), 0) * 100) / 100;
