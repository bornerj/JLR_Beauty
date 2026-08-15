import type { RadarFinding, RadarInputs } from "./types";

/**
 * Admin V2 (PLAN-0023, Onda 1) — Radar Executivo (RETROFIT-011).
 * Regras determinísticas e fixas (sem ML) — cada achado sai sempre com `message` já
 * explicada e `actionPath` navegável (governança #6/#7 do PLAN-0022). Limiares
 * documentados aqui, ajustáveis só via novo PR (mesmo padrão de `classifier.ts` das
 * Ondas 3-9).
 */

const ORDERS_ATTENTION_CRITICAL_THRESHOLD = 10;
const REVENUE_DROP_THRESHOLD_PERCENT = -10;
const REVENUE_GROWTH_THRESHOLD_PERCENT = 15;

const formatBRL = (value: number): string => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const buildRadarFindings = (inputs: RadarInputs): RadarFinding[] => {
  const findings: RadarFinding[] = [];

  // ─── Rede: unidades críticas, 1 achado por unidade (já vem com a causa decomposta) ───
  for (const unit of inputs.networkBoard.columns.critical) {
    findings.push({
      id: `rede-critica-${unit.unitId}`,
      severity: "CRITICO",
      category: "Rede",
      message: `${unit.unitName} está crítica (score ${unit.score}) — principal causa: ${unit.primaryWeakness.label}.`,
      actionLabel: "Ver diagnóstico",
      actionPath: `/admin-v2/rede/${unit.unitId}`,
    });
  }

  // ─── Operação: coluna "Atenção" do board de pedidos ────────────────────────────────
  const attentionColumn = inputs.ordersBoard.columns.atencao;
  if (attentionColumn.count > 0) {
    findings.push({
      id: "operacao-pedidos-atencao",
      severity: attentionColumn.count >= ORDERS_ATTENTION_CRITICAL_THRESHOLD ? "CRITICO" : "ATENCAO",
      category: "Operação",
      message: `${attentionColumn.count} pedido(s) precisam de atenção (${formatBRL(attentionColumn.totalValue)} em jogo).`,
      actionLabel: "Ver operação",
      actionPath: "/admin-v2/operacao",
    });
  }

  // ─── Portfólio: produtos "Armadilha" (agregado — não 1 por item, pra não inundar) ──
  const armadilhaProducts = inputs.portfolioProducts.products.filter((product) => product.quadrant === "ARMADILHA");
  if (armadilhaProducts.length > 0) {
    findings.push({
      id: "portfolio-produtos-armadilha",
      severity: "ATENCAO",
      category: "Portfólio",
      message: `${armadilhaProducts.length} produto(s) vendem bastante mas rendem pouco (Armadilha).`,
      actionLabel: "Ver produtos",
      actionPath: "/admin-v2/operacao/produtos",
    });
  }

  // ─── Serviços: "Armadilha" (ocupa agenda, rende pouco por hora) ─────────────────────
  const armadilhaServices = inputs.servicePerformance.services.filter((service) => service.quadrant === "ARMADILHA");
  if (armadilhaServices.length > 0) {
    findings.push({
      id: "portfolio-servicos-armadilha",
      severity: "ATENCAO",
      category: "Serviços",
      message: `${armadilhaServices.length} serviço(s) ocupam agenda mas rendem pouco por hora.`,
      actionLabel: "Ver serviços",
      actionPath: "/admin-v2/operacao/servicos",
    });
  }

  // ─── Clientes: em risco de churn ─────────────────────────────────────────────────────
  const atRiskCustomers = inputs.customerFlow.counts.EM_RISCO;
  if (atRiskCustomers > 0) {
    findings.push({
      id: "clientes-em-risco",
      severity: "ATENCAO",
      category: "Clientes",
      message: `${atRiskCustomers} cliente(s) em risco de sair.`,
      actionLabel: "Ver clientes",
      actionPath: "/admin-v2/clientes",
    });
  }

  // ─── Assinaturas: churn no período + assinaturas em atenção ─────────────────────────
  if (inputs.subscriptionHealth.churn.count > 0) {
    const rate = inputs.subscriptionHealth.churn.ratePercent;
    findings.push({
      id: "assinaturas-churn",
      severity: "CRITICO",
      category: "Assinaturas",
      message: `${inputs.subscriptionHealth.churn.count} cancelamento(s) de assinatura neste período${rate !== null ? ` (churn ${rate.toFixed(1)}%)` : ""}.`,
      actionLabel: "Ver assinaturas",
      actionPath: "/admin-v2/clientes/assinaturas",
    });
  }
  const subscriptionsAttention = inputs.subscriptionHealth.counts.ATENCAO;
  if (subscriptionsAttention > 0) {
    findings.push({
      id: "assinaturas-atencao",
      severity: "ATENCAO",
      category: "Assinaturas",
      message: `${subscriptionsAttention} assinatura(s) precisam de atenção (cobrança falhou, uso caiu ou inadimplência).`,
      actionLabel: "Ver assinaturas",
      actionPath: "/admin-v2/clientes/assinaturas",
    });
  }

  // ─── Franquias: etapas mais lentas que o normal + leads parados ─────────────────────
  for (const stage of inputs.franchisePipeline.stages) {
    if (stage.isBottleneck) {
      findings.push({
        id: `franquias-gargalo-${stage.stage}`,
        severity: "ATENCAO",
        category: "Franquias",
        message: `Etapa "${stage.stage}" do funil comercial está mais lenta que o normal (${Math.round(stage.avgDaysInStageNow ?? 0)}d parado em média, contra ${Math.round(stage.avgDaysToComplete ?? 0)}d esperado).`,
        actionLabel: "Ver pipeline",
        actionPath: "/admin-v2/crescimento",
      });
    }
  }
  const stalledLeads = inputs.franchisePipeline.leads.filter((lead) => lead.isStalled).length;
  if (stalledLeads > 0) {
    findings.push({
      id: "franquias-leads-parados",
      severity: "ATENCAO",
      category: "Franquias",
      message: `${stalledLeads} lead(s) de franquia parados além do tempo esperado para a etapa.`,
      actionLabel: "Ver pipeline",
      actionPath: "/admin-v2/crescimento",
    });
  }

  // ─── Financeiro: tendência de receita da rede ────────────────────────────────────────
  const revenueTrend = inputs.panorama.financial.revenueTrendPercent;
  if (revenueTrend <= REVENUE_DROP_THRESHOLD_PERCENT) {
    findings.push({
      id: "financeiro-receita-queda",
      severity: "ATENCAO",
      category: "Financeiro",
      message: `Receita caiu ${Math.abs(revenueTrend).toFixed(1)}% vs. o período anterior.`,
      actionLabel: "Ver panorama",
      actionPath: "/admin-v2",
    });
  } else if (revenueTrend >= REVENUE_GROWTH_THRESHOLD_PERCENT) {
    findings.push({
      id: "financeiro-receita-alta",
      severity: "OPORTUNIDADE",
      category: "Financeiro",
      message: `Receita cresceu ${revenueTrend.toFixed(1)}% vs. o período anterior.`,
      actionLabel: "Ver panorama",
      actionPath: "/admin-v2",
    });
  }

  // ─── Oportunidades já calculadas pelo Panorama (Onda 1) ──────────────────────────────
  for (const [index, opportunity] of inputs.panorama.opportunities.entries()) {
    findings.push({
      id: `panorama-oportunidade-${index}`,
      severity: "OPORTUNIDADE",
      category: "Clientes",
      message: `${opportunity.description} (${formatBRL(opportunity.estimatedValue)} estimado).`,
      actionLabel: "Ver clientes",
      actionPath: "/admin-v2/clientes",
    });
  }

  const severityOrder: Record<RadarFinding["severity"], number> = { CRITICO: 0, ATENCAO: 1, OPORTUNIDADE: 2 };
  return findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
};
