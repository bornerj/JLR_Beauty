import type { HealthComponentKey } from "../unit-health/types";
import type { HealthImpactEstimate } from "./types";

const round1 = (value: number): number => Math.round(value * 10) / 10;

/**
 * Admin V2 (PLAN-0023, Onda 5) — evolução do Health Score (RETROFIT-017).
 * Função pura, extraída de `network/service.ts` sem mudar a regra: ocupação continua a
 * única fraqueza com tradução direta e honesta para R$ (horas ociosas × receita/hora).
 *
 * Considerado e descartado nesta onda: usar o capital parado em produtos Armadilha
 * (Portfólio, Onda 5 do PLAN-0022) como tradução da fraqueza "estoque". Rejeitado porque
 * o componente "estoque" do Health Score mede ruptura/estoque baixo
 * (`inventoryHealthRate`, ver `unit-health/service.ts`) — um sinal distinto de "capital
 * parado em produto de baixa margem" (classificação Armadilha). Uma unidade pode ter
 * ruptura severa com ZERO capital parado (efeito oposto). Anexar esse número à fraqueza
 * errada violaria a governança #6 (nunca um número que não explica a causa real) — as
 * demais fraquezas (rentabilidade, crescimento, recorrência, estoque, assinaturas)
 * continuam `null`, sem fórmula honesta disponível ainda.
 */
export type WeaknessImpactInputs = {
  weaknessKey: HealthComponentKey;
  occupancy: { availableMinutes: number; bookedMinutes: number };
  revenue: number;
};

export const estimateWeaknessImpact = (inputs: WeaknessImpactInputs): HealthImpactEstimate => {
  if (inputs.weaknessKey !== "occupancy") return null;
  const idleMinutes = Math.max(0, inputs.occupancy.availableMinutes - inputs.occupancy.bookedMinutes);
  if (idleMinutes <= 0 || inputs.occupancy.bookedMinutes <= 0 || inputs.revenue <= 0) return null;
  const revenuePerBookedHour = inputs.revenue / (inputs.occupancy.bookedMinutes / 60);
  return {
    amount: round1((idleMinutes / 60) * revenuePerBookedHour),
    explanation: "horas ociosas da agenda × receita média por hora reservada no período selecionado",
  };
};
