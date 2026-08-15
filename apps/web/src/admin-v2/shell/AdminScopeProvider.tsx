import { useMemo, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AdminScopeContext,
  PERIOD_PRESET_DAYS,
  isValidPreset,
  type AdminScope,
  type AdminScopePeriodPreset,
} from "./adminScope";

/**
 * Admin V2 (PLAN-0022, Onda 1) — engine de escopo (RETROFIT-002).
 * Persistido na querystring (não em memória) para sobreviver a navegação e ao
 * botão "voltar" do browser — implementa roll-up "de graça" sem estado extra.
 *
 * Seletor de unidade nesta onda é único (0 ou 1 unidade), não multi-select: a
 * comparação lado a lado de várias unidades fica para o Comparador de Unidades
 * (RETROFIT-014, onda futura de Inteligência) — ver nota do PLAN-0022 §Onda 1.
 */

export function AdminScopeProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const presetParam = searchParams.get("period");
  const preset: AdminScopePeriodPreset = isValidPreset(presetParam) ? presetParam : "LAST_30D";
  const unitParam = searchParams.get("unit");
  const parsedUnitId = unitParam ? Number(unitParam) : null;
  const unitId = parsedUnitId && Number.isFinite(parsedUnitId) ? parsedUnitId : null;

  const scope: AdminScope = useMemo(
    () => ({ preset, days: PERIOD_PRESET_DAYS[preset], unitId }),
    [preset, unitId]
  );

  const setPreset = (next: AdminScopePeriodPreset) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("period", next);
      return params;
    });
  };

  const setUnitId = (next: number | null) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (next) params.set("unit", String(next));
      else params.delete("unit");
      return params;
    });
  };

  return (
    <AdminScopeContext.Provider value={{ scope, setPreset, setUnitId }}>
      {children}
    </AdminScopeContext.Provider>
  );
}
