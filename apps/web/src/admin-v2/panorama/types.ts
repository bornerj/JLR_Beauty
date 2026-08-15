/** Admin V2 (PLAN-0022, Onda 1) — espelha apps/api/src/modules/intelligence/panorama/types.ts */

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
  stockValue: number;
  lowOccupancyUnits: number;
};

export type PanoramaFinancial = {
  revenue: number;
  revenueTrendPercent: number;
  marginPercent: number;
  marginTrendPp: number;
};

export type PanoramaCustomers = {
  newInPeriod: number;
  recurrenceRate: number;
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

export type AdminV2Unit = {
  id: number;
  name: string;
  kind: string;
  isOnline: boolean;
};
