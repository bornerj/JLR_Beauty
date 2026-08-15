/**
 * Admin V2 (PLAN-0022) — Health Score v1.
 * Fórmula fixa e determinística (DECISION-013): sem pesos configuráveis nesta fase.
 */

export type HealthState = "TAKEOFF" | "HEALTHY" | "ATTENTION" | "CRITICAL";

export type HealthComponents = {
  profitability: number; // 0-100, peso 30% — normalizado a partir da margem de contribuição
  growth: number; // 0-100, peso 20% — normalizado a partir da tendência de receita
  occupancy: number; // 0-100, peso 20% — ocupação real da agenda no período
  recurrence: number; // 0-100, peso 15% — proxy de recorrência de clientes (ver unit-health/service.ts)
  inventory: number; // 0-100, peso 10% — saúde do estoque (sem ruptura/sem baixo estoque)
  subscriptions: number; // 0-100, peso 5% — saúde da base de assinaturas (rede inteira, ver nota)
};

export const HEALTH_WEIGHTS: HealthComponents = {
  profitability: 0.3,
  growth: 0.2,
  occupancy: 0.2,
  recurrence: 0.15,
  inventory: 0.1,
  subscriptions: 0.05,
};

/** Métricas brutas de entrada (já calculadas a partir do banco), antes da normalização 0-100. */
export type UnitHealthRawMetrics = {
  revenue: number; // valor absoluto de receita PAGA no período (R$) — só para exibição, não entra na normalização
  marginPercent: number; // ex.: 12.4 (%)
  revenueTrendPercent: number; // ex.: -18 (%) — variação vs. período anterior de mesma duração
  occupancyRate: number; // 0-100 (%) — bookedMinutes/availableMinutes
  recurrenceRate: number; // 0-100 (%) — proxy: clientes com >=2 pedidos pagos no período / total de clientes no período
  inventoryHealthRate: number; // 0-100 (%) — produtos sem ruptura nem estoque baixo / total de produtos com estoque na unidade
  subscriptionActiveRate: number; // 0-100 (%) — rede inteira (Subscription não tem unitId no schema atual — ver nota no service.ts)
};

export type HealthComponentKey = keyof HealthComponents;

export type UnitHealthScore = {
  score: number; // 0-100
  state: HealthState;
  components: HealthComponents;
  /** Componente que mais puxou o score para baixo (maior déficit vs. 100). */
  primaryWeakness: HealthComponentKey;
  /** Componente que mais sustenta o score (maior valor absoluto). */
  primaryStrength: HealthComponentKey;
};
