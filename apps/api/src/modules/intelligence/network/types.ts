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
  /** Só calculado quando a causa é "occupancy" — é a única fraqueza com tradução direta e
   * honesta para R$ (horas ociosas × receita/hora). As demais (rentabilidade, crescimento,
   * recorrência, estoque, assinaturas) não ganham um número fabricado — considerado e
   * descartado explicitamente para "estoque" no RETROFIT-017 (Onda 5 do PLAN-0023): o
   * componente mede ruptura/estoque baixo, não capital parado — anexar um número de outra
   * origem violaria a regra de explicabilidade do PLAN-0022 (ver `network/impact.ts`). */
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
  /** RETROFIT-017 (PLAN-0023, Onda 5) — frase determinística composta a partir dos campos acima, nunca um cálculo novo. */
  narrative: string;
};
