import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../lib/auth";
import { logger } from "../../utils/logger";
import { useAdminScope } from "../shell/adminScope";
import { fetchMoneyOverview } from "../shared/api";
import { formatCurrencyBRL } from "../shared/format";
import type { MoneyOverview } from "./types";

/**
 * Admin V2 (PLAN-0023, Onda 3) — "Onde está o dinheiro?" (RETROFIT-013).
 * Pergunta que a tela fecha: "quem gera receita e quem gera lucro?"
 * Cascata Receita → Custo Direto → Margem Bruta (mockup `retrofit/RETROFIT-013.md`),
 * depois decomposta por Unidade/Produto/Serviço/Canal/Profissional/Plano de assinatura —
 * nada recalculado aqui, tudo já vem pronto/explicado da API (governança #1/#6).
 */

type MoneyState = { loading: boolean; data: MoneyOverview | null; error: string | null };

const formatSigned = (value: number): string => `${value >= 0 ? "+" : ""}${formatCurrencyBRL(value)}`;

export function MoneyView() {
  const { scope } = useAdminScope();
  const [state, setState] = useState<MoneyState>({ loading: true, data: null, error: null });

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchMoneyOverview({ token, days: scope.days });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar a visão financeira.";
      logger.warn("Falha ao carregar Dinheiro (Admin V2)", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, [scope.days]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.loading && !state.data) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando visão financeira…</p>;
  }

  if (state.error && !state.data) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar a visão financeira.</p>
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
  const money = state.data;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-forest">Onde está o dinheiro?</h1>
        <p className="text-base text-stone-600 dark:text-stone-400">quem gera receita e quem gera lucro · últimos {money.period.days} dia(s)</p>
      </div>

      {/* Cascata */}
      <div className="flex flex-col gap-2 rounded-xl border border-[#cfe7d1] bg-white p-4 dark:border-forest-green dark:bg-forest">
        {money.waterfall.map((step) => (
          <div key={step.label} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dashed border-stone-200 py-2 last:border-0">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {step.kind === "subtract" ? `↓ ${step.label}` : step.label}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">{step.explanation}</p>
            </div>
            <p className={`text-2xl font-bold ${step.kind === "subtract" ? "text-state-critical" : "text-forest"}`}>
              {step.kind === "subtract" ? `− ${formatCurrencyBRL(step.amount)}` : formatCurrencyBRL(step.amount)}
            </p>
          </div>
        ))}
        <p className="pt-1 text-xs text-stone-400">{money.omittedNote}</p>
      </div>

      {/* Origens */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {money.sources.map((source) => (
          <div key={source.label} className="rounded-xl border border-[#cfe7d1] bg-white p-4 dark:border-forest-green dark:bg-forest">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">{source.label}</p>
            <p className="mt-1 text-2xl font-bold text-forest">{formatCurrencyBRL(source.revenue)}</p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              {source.cost !== null ? `custo direto ${formatCurrencyBRL(source.cost)} · ${source.explanation}` : source.explanation}
            </p>
          </div>
        ))}
      </div>

      {/* Por Unidade */}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-forest">Por Unidade</h2>
        <div className="overflow-x-auto rounded-xl border border-[#cfe7d1] bg-white dark:border-forest-green dark:bg-forest">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#cfe7d1] text-xs font-bold uppercase tracking-wider text-stone-500 dark:border-forest-green dark:text-stone-400">
                <th className="px-3 py-2">Unidade</th>
                <th className="px-3 py-2">Receita</th>
                <th className="px-3 py-2">Custo</th>
                <th className="px-3 py-2">Margem</th>
              </tr>
            </thead>
            <tbody>
              {money.byUnit.map((unit) => (
                <tr key={unit.unitId} className="border-b border-stone-100 last:border-0 dark:border-forest-green/40">
                  <td className="px-3 py-2 text-forest">{unit.unitName}</td>
                  <td className="px-3 py-2">{formatCurrencyBRL(unit.revenue)}</td>
                  <td className="px-3 py-2">{formatCurrencyBRL(unit.cost)}</td>
                  <td className="px-3 py-2">{unit.marginPercent !== null ? `${unit.marginPercent.toFixed(1)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Por Produto */}
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-forest">Por Produto</h2>
          <div className="flex flex-col gap-1.5 rounded-xl border border-[#cfe7d1] bg-white p-3 dark:border-forest-green dark:bg-forest">
            {money.byProduct.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">Nenhuma venda de produto no período.</p>
            ) : (
              money.byProduct.map((product) => (
                <div key={product.productId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-forest">{product.name}</span>
                  <span className={product.profit >= 0 ? "text-forest" : "text-state-critical"}>{formatSigned(product.profit)}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Por Serviço */}
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-forest">Por Serviço</h2>
          <div className="flex flex-col gap-1.5 rounded-xl border border-[#cfe7d1] bg-white p-3 dark:border-forest-green dark:bg-forest">
            {money.byService.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">Nenhum agendamento no período.</p>
            ) : (
              money.byService.map((service) => (
                <div key={service.serviceId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-forest">{service.name}</span>
                  <span className={service.profit >= 0 ? "text-forest" : "text-state-critical"}>{formatSigned(service.profit)}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Por Canal */}
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-forest">Por Canal</h2>
          <div className="flex flex-col gap-1.5 rounded-xl border border-[#cfe7d1] bg-white p-3 dark:border-forest-green dark:bg-forest">
            {money.byChannel.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">Nenhuma venda de produto no período.</p>
            ) : (
              money.byChannel.map((channel) => (
                <div key={channel.channel} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-forest">{channel.channel}</span>
                  <span className="text-stone-600 dark:text-stone-400">{formatCurrencyBRL(channel.revenue)}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Por Profissional */}
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-forest">Por Profissional</h2>
          <div className="flex flex-col gap-1.5 rounded-xl border border-[#cfe7d1] bg-white p-3 dark:border-forest-green dark:bg-forest">
            {money.byProfessional.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">Nenhum agendamento no período.</p>
            ) : (
              money.byProfessional.map((professional) => (
                <div key={professional.professionalId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-forest">{professional.name}</span>
                  <span className="text-stone-600 dark:text-stone-400">{formatCurrencyBRL(professional.revenue)}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Por Plano de Assinatura */}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-forest">Por Plano de Assinatura (MRR)</h2>
        <div className="flex flex-col gap-1.5 rounded-xl border border-[#cfe7d1] bg-white p-3 dark:border-forest-green dark:bg-forest">
          {money.byPlan.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">Nenhuma assinatura ativa.</p>
          ) : (
            money.byPlan.map((plan) => (
              <div key={plan.membershipName} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-forest">
                  {plan.membershipName} <span className="text-xs text-stone-500 dark:text-stone-400">({plan.activeCount} ativa(s))</span>
                </span>
                <span className="text-stone-600 dark:text-stone-400">{formatCurrencyBRL(plan.mrr)}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
