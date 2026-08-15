/** Admin V2 (PLAN-0022, Onda 1) — contrato de GET /api/admin-v2/panorama. */

export type PanoramaNetwork = {
  units: number;
  takeoff: number;
  healthy: number;
  attention: number;
  critical: number;
};

export type PanoramaOperations = {
  ordersNeedingAttention: number;
  stockAlerts: number;
  /** Unidades com componente de ocupação do Health Score abaixo de 50% no período. */
  lowOccupancyUnits: number;
};

export type PanoramaFinancial = {
  revenue: number;
  revenueTrendPercent: number;
  marginPercent: number;
  /** Variação de margem em pontos percentuais vs. período anterior de mesma duração. */
  marginTrendPp: number;
};

export type PanoramaCustomers = {
  newInPeriod: number;
  recurrenceRate: number; // 0-100
  atRisk: number;
};

export type PanoramaOpportunity = {
  type: "REACTIVATION";
  description: string;
  estimatedValue: number;
};

export type PanoramaAttentionSignal = {
  level: "critical" | "attention" | "positive";
  message: string;
};

export type PanoramaSnapshot = {
  period: { from: string; to: string; days: number };
  scope: { unitIds: "all" | number[] };
  network: PanoramaNetwork;
  operations: PanoramaOperations;
  financial: PanoramaFinancial;
  customers: PanoramaCustomers;
  attention: PanoramaAttentionSignal[];
  opportunities: PanoramaOpportunity[];
};
