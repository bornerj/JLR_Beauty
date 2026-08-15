/** Admin V2 (PLAN-0022, Onda 2) — espelha apps/api/src/modules/intelligence/network/types.ts */

export type HealthComponentKey =
  | "profitability"
  | "growth"
  | "occupancy"
  | "recurrence"
  | "inventory"
  | "subscriptions";

export type HealthState = "TAKEOFF" | "HEALTHY" | "ATTENTION" | "CRITICAL";

export type HealthComponents = Record<HealthComponentKey, number>;

export type NetworkUnitCard = {
  unitId: number;
  unitName: string;
  state: HealthState;
  score: number;
  revenue: number;
  revenueTrendPercent: number;
  marginPercent: number;
  occupancyRate: number;
  primaryStrength: { key: HealthComponentKey; label: string };
  primaryWeakness: { key: HealthComponentKey; label: string };
};

export type NetworkBoard = {
  period: { from: string; to: string; days: number };
  columns: {
    takeoff: NetworkUnitCard[];
    healthy: NetworkUnitCard[];
    attention: NetworkUnitCard[];
    critical: NetworkUnitCard[];
  };
};

export type HealthImpactEstimate = { amount: number; explanation: string } | null;

export type UnitDiagnostic = {
  unitId: number;
  unitName: string;
  state: HealthState;
  score: number;
  components: HealthComponents;
  componentLabels: Record<HealthComponentKey, string>;
  revenue: number;
  revenueTrendPercent: number;
  marginPercent: number;
  primaryWeakness: { key: HealthComponentKey; label: string; impactEstimate: HealthImpactEstimate };
  primaryStrength: { key: HealthComponentKey; label: string };
};
