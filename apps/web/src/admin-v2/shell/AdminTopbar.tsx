import { Link } from "react-router-dom";
import { PERIOD_PRESET_LABELS, type AdminScope, type AdminScopePeriodPreset } from "./adminScope";
import type { AdminV2Unit } from "../panorama/types";
import { DockerStatusButton } from "./DockerStatusButton";

const PRESETS: AdminScopePeriodPreset[] = ["TODAY", "LAST_7D", "LAST_30D", "LAST_90D"];

export function AdminTopbar({
  scope,
  units,
  onPresetChange,
  onUnitChange,
}: {
  scope: AdminScope;
  units: AdminV2Unit[];
  onPresetChange: (preset: AdminScopePeriodPreset) => void;
  onUnitChange: (unitId: number | null) => void;
}) {
  return (
    <header className="admin-v2-topbar flex flex-wrap items-center justify-between gap-3 border-b border-gold/40 bg-cream-sidebar px-5 py-3 dark:bg-forest-green">
      <div className="flex items-center gap-3">
        {/* PLAN-0033 — Admin legado aposentado; "Voltar" leva pra SPA pública, não mais pro /admin. */}
        <Link to="/" className="rounded-full border border-gold/60 px-3 py-1 text-xs font-bold uppercase tracking-widest text-forest hover:bg-gold/10">
          ← Voltar
        </Link>
        <span className="text-sm font-bold uppercase tracking-[0.2em] text-forest">
          JLR Beauty <span className="text-primary">Admin V2</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Unidade"
          value={scope.unitId ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            onUnitChange(value ? Number(value) : null);
          }}
          className="rounded-full border border-gold/50 bg-white px-3 py-1.5 text-xs font-semibold text-forest"
        >
          <option value="">Rede inteira</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>

        <div className="flex rounded-full border border-gold/50 bg-white p-0.5">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onPresetChange(preset)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                scope.preset === preset ? "bg-primary text-white" : "text-forest hover:bg-primary/10"
              }`}
            >
              {PERIOD_PRESET_LABELS[preset]}
            </button>
          ))}
        </div>

        {/* PLAN-0033 — status de infra portado do Admin legado (ícone pequeno, canto direito). */}
        <DockerStatusButton />
      </div>
    </header>
  );
}
