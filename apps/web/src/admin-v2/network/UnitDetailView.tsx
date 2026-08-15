import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getToken } from "../../lib/auth";
import { logger } from "../../utils/logger";
import { useAdminScope } from "../shell/adminScope";
import { fetchUnitDiagnostic } from "../shared/api";
import { formatCurrencyBRL, formatSignedPercent } from "../shared/format";
import { STATE_BADGE_ICON, STATE_LABELS, STATE_TEXT_CLASS } from "../shared/health";
import type { UnitDiagnostic } from "./types";
import { HealthScoreBars } from "./components/HealthScoreBars";

/**
 * Admin V2 (PLAN-0022, Onda 2) — Diagnóstico Vivo da Unidade (RETROFIT-003).
 * Pergunta que a tela fecha: "por que esta unidade está bem ou mal?"
 */

type DiagnosticState = { loading: boolean; data: UnitDiagnostic | null; error: string | null };

/** Ações que já navegam de verdade — selecionam a unidade no escopo global e levam para a tela nativa correspondente (mesmo padrão da Onda 4 para "Ver agenda"). */
const ENABLED_ACTIONS = [
  { label: "Ver agenda", path: "/admin-v2/operacao/agenda" },
  { label: "Ver produtos", path: "/admin-v2/operacao/produtos" },
  { label: "Ver clientes", path: "/admin-v2/clientes" },
];

const DISABLED_ACTIONS = [
  { label: "Comparar unidade", reason: "Comparador chega numa onda futura de Inteligência (RETROFIT-014)" },
];

export function UnitDetailView() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const { scope, setUnitId } = useAdminScope();
  const [state, setState] = useState<DiagnosticState>({ loading: true, data: null, error: null });

  const load = useCallback(async () => {
    if (!unitId) return;
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchUnitDiagnostic({ token, unitId: Number(unitId), days: scope.days });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar o diagnóstico.";
      logger.warn("Falha ao carregar Diagnóstico da Unidade (Admin V2)", { error: message, unitId });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, [unitId, scope.days]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.loading && !state.data) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando diagnóstico…</p>;
  }

  if (state.error && !state.data) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar o diagnóstico.</p>
        <p className="text-sm text-stone-600 dark:text-stone-400">{state.error}</p>
        <div>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!state.data) return null;
  const unit = state.data;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-bold text-forest">{unit.unitName}</h1>
        <span className={`flex items-center gap-1.5 text-sm font-bold ${STATE_TEXT_CLASS[unit.state]}`}>
          {STATE_BADGE_ICON[unit.state]} {STATE_LABELS[unit.state]}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-base text-stone-600 dark:text-stone-400">
        <span>
          Receita <strong className="text-forest">{formatCurrencyBRL(unit.revenue)}</strong>{" "}
          <span className={unit.revenueTrendPercent >= 0 ? "text-state-healthy" : "text-state-critical"}>
            {formatSignedPercent(unit.revenueTrendPercent)}
          </span>
        </span>
        <span>
          Margem <strong className="text-forest">{unit.marginPercent.toFixed(1)}%</strong>
        </span>
      </div>

      <section className="rounded-xl border border-[#cfe7d1] bg-white p-5 dark:border-forest-green dark:bg-forest">
        <p className="mb-1 text-sm font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Health Score</p>
        <p className="mb-4 text-4xl font-bold text-forest">{unit.score}</p>
        <p className="mb-3 text-sm font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
          Por que esta unidade está {STATE_LABELS[unit.state].toLowerCase()}?
        </p>
        <HealthScoreBars components={unit.components} labels={unit.componentLabels} />
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-state-critical/30 bg-state-critical/5 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-state-critical">Principal problema</p>
          <p className="mt-2 text-xl font-bold text-forest">{unit.primaryWeakness.label}</p>
          {unit.primaryWeakness.impactEstimate ? (
            <p className="mt-1 text-base text-stone-600 dark:text-stone-400">
              Impacto estimado: <strong className="text-forest">{formatCurrencyBRL(unit.primaryWeakness.impactEstimate.amount)}</strong> no
              período ({unit.primaryWeakness.impactEstimate.explanation})
            </p>
          ) : (
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Impacto financeiro ainda não estimado para esta causa — só ocupação tem tradução direta para R$ nesta versão.
            </p>
          )}
        </section>
        <section className="rounded-xl border border-state-healthy/30 bg-state-healthy/5 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-state-healthy">Principal força</p>
          <p className="mt-2 text-xl font-bold text-forest">{unit.primaryStrength.label}</p>
        </section>
      </div>

      <div className="flex flex-wrap gap-2">
        {ENABLED_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => {
              setUnitId(unit.unitId);
              navigate(action.path);
            }}
            className="rounded-full border border-primary/60 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
          >
            {action.label}
          </button>
        ))}
        {DISABLED_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            disabled
            title={`${action.label} — em breve (${action.reason})`}
            className="cursor-not-allowed rounded-full border border-stone-200 px-3 py-1.5 text-sm font-semibold text-stone-500 dark:text-stone-400"
          >
            {action.label} · em breve
          </button>
        ))}
      </div>
    </div>
  );
}
