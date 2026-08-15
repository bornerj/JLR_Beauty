import type { HealthComponentKey, HealthComponents, HealthState } from "../unit-health/types";

/** Admin V2 (PLAN-0022, Onda 2) — contrato de GET /api/admin-v2/network e /network/units/:id. */

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

export type HealthImpactEstimate = {
  /** Só calculado quando a causa é "occupancy" — as demais fraquezas ainda não têm tradução
   * financeira confiável na v1 (não fabricamos um número para não violar a regra de
   * explicabilidade do PLAN-0022). */
  amount: number;
  explanation: string;
} | null;

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
