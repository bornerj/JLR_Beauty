import { resolveAdminPeriodRange, type AdminPeriodInput } from "../../admin/kpis/period";
import { HEALTH_COMPONENT_LABELS } from "../unit-health/scoring";
import { getUnitHealth, getUnitsHealth, type UnitHealthResult } from "../unit-health/service";
import { estimateWeaknessImpact } from "./impact";
import { buildUnitNarrative } from "./narrative";
import type { NetworkBoard, NetworkUnitCard, UnitDiagnostic } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 2) — Mapa Vivo da Rede (RETROFIT-002) + Diagnóstico da
 * Unidade (RETROFIT-003). Camada de apresentação sobre `unit-health/service.ts`: não
 * recalcula score, só formata para o formato que cada tela espera.
 */

const toCard = (unit: UnitHealthResult): NetworkUnitCard => ({
  unitId: unit.unitId,
  unitName: unit.unitName,
  state: unit.state,
  score: unit.score,
  revenue: unit.raw.revenue,
  revenueTrendPercent: unit.raw.revenueTrendPercent,
  marginPercent: unit.raw.marginPercent,
  occupancyRate: unit.raw.occupancyRate,
  primaryStrength: { key: unit.primaryStrength, label: HEALTH_COMPONENT_LABELS[unit.primaryStrength] },
  primaryWeakness: { key: unit.primaryWeakness, label: HEALTH_COMPONENT_LABELS[unit.primaryWeakness] },
});

export const getNetworkBoard = async (
  input: AdminPeriodInput & { unitIds?: number[] }
): Promise<NetworkBoard> => {
  const range = resolveAdminPeriodRange(input);
  const units = await getUnitsHealth(input);

  const columns: NetworkBoard["columns"] = { takeoff: [], healthy: [], attention: [], critical: [] };
  for (const unit of units) {
    const card = toCard(unit);
    if (unit.state === "TAKEOFF") columns.takeoff.push(card);
    else if (unit.state === "HEALTHY") columns.healthy.push(card);
    else if (unit.state === "ATTENTION") columns.attention.push(card);
    else columns.critical.push(card);
  }
  // Dentro de cada coluna, unidade mais crítica/mais em destaque primeiro (score cresce = melhor).
  for (const column of Object.values(columns)) {
    column.sort((a, b) => a.score - b.score);
  }

  return {
    period: { from: range.from.toISOString(), to: range.to.toISOString(), days: range.days },
    columns,
  };
};

export const getUnitDiagnostic = async (
  input: AdminPeriodInput & { unitId: number }
): Promise<UnitDiagnostic> => {
  const unit = await getUnitHealth(input);

  const impactEstimate = estimateWeaknessImpact({
    weaknessKey: unit.primaryWeakness,
    occupancy: unit.occupancy,
    revenue: unit.raw.revenue,
  });

  const primaryWeaknessLabel = HEALTH_COMPONENT_LABELS[unit.primaryWeakness];
  const primaryStrengthLabel = HEALTH_COMPONENT_LABELS[unit.primaryStrength];

  const narrative = buildUnitNarrative({
    unitName: unit.unitName,
    state: unit.state,
    score: unit.score,
    primaryStrengthLabel,
    primaryWeaknessLabel,
    impactEstimate,
    revenueTrendPercent: unit.raw.revenueTrendPercent,
  });

  return {
    unitId: unit.unitId,
    unitName: unit.unitName,
    state: unit.state,
    score: unit.score,
    components: unit.components,
    componentLabels: HEALTH_COMPONENT_LABELS,
    revenue: unit.raw.revenue,
    revenueTrendPercent: unit.raw.revenueTrendPercent,
    marginPercent: unit.raw.marginPercent,
    primaryWeakness: { key: unit.primaryWeakness, label: primaryWeaknessLabel, impactEstimate },
    primaryStrength: { key: unit.primaryStrength, label: primaryStrengthLabel },
    narrative,
  };
};
