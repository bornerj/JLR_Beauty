import { createContext, useContext } from "react";

/**
 * Admin V2 (PLAN-0022, Onda 1) — tipos/contexto/hook do engine de escopo (RETROFIT-002).
 * Separado de AdminScopeProvider.tsx só para respeitar a regra de Fast Refresh do Vite
 * (um arquivo de componente não pode reexportar não-componentes).
 */

export type AdminScopePeriodPreset = "TODAY" | "LAST_7D" | "LAST_30D" | "LAST_90D";

export const PERIOD_PRESET_LABELS: Record<AdminScopePeriodPreset, string> = {
  TODAY: "Hoje",
  LAST_7D: "Últimos 7 dias",
  LAST_30D: "Últimos 30 dias",
  LAST_90D: "Últimos 90 dias",
};

export const PERIOD_PRESET_DAYS: Record<AdminScopePeriodPreset, number> = {
  TODAY: 1,
  LAST_7D: 7,
  LAST_30D: 30,
  LAST_90D: 90,
};

export type AdminScope = {
  preset: AdminScopePeriodPreset;
  days: number;
  unitId: number | null; // null = rede inteira
};

export type AdminScopeContextValue = {
  scope: AdminScope;
  setPreset: (preset: AdminScopePeriodPreset) => void;
  setUnitId: (unitId: number | null) => void;
};

export const AdminScopeContext = createContext<AdminScopeContextValue | null>(null);

export const isValidPreset = (value: string | null): value is AdminScopePeriodPreset =>
  value === "TODAY" || value === "LAST_7D" || value === "LAST_30D" || value === "LAST_90D";

export function useAdminScope(): AdminScopeContextValue {
  const ctx = useContext(AdminScopeContext);
  if (!ctx) {
    throw new Error("useAdminScope precisa estar dentro de <AdminScopeProvider>");
  }
  return ctx;
}
