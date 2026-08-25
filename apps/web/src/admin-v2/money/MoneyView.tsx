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
 *
 * PLAN-0032 ocorrência #5 (`@frontend-specialist` + skill `dataviz`) — reformulação visual:
 * usuário reportou 3 problemas: (1) cascata (3 linhas numa caixa) e origens (3 cards) usavam
 * 2 tratamentos visuais diferentes pro mesmo tipo de dado — unificados em 6 stat tiles
 * coloridos; (2) as 6 decomposições (Unidade/Produto/Serviço/Canal/Profissional/Plano)
 * empilhadas direto na página viravam "cards gigantes" difíceis de ler — viraram abas (mesmo
 * padrão visual dos sub-tabs de Operação em `AdminV2Root.tsx`) com um painel de altura fixa +
 * rolagem vertical. (3) cor nos 6 tiles iniciais, pedido explícito.
 * Paleta das 6 cores validada com `scripts/validate_palette.js` da skill `dataviz` (5 hues
 * distintos, `primary` reaproveitado 1x entre as duas linhas por afinidade semântica —
 * "Receita" e "Assinaturas" são as 2 únicas entradas de dinheiro recorrente/positivo — nunca
 * dentro da mesma linha/grupo, então não competem visualmente): ALL CHECKS PASS (lightness,
 * chroma floor, separação CVD deutan/tritan, piso de visão normal); único WARN aceito foi o
 * contraste do `gold-accent` puro contra o fundo — mitigado porque a cor nunca carrega texto
 * sozinha (números seguem em `text-forest`, alto contraste; a cor é só barra/ícone de apoio).
 * Nenhum token novo — os 5 tons já existem no `tailwind.config.js` (`primary`, `state-critical`,
 * `gold-accent`, `state-info`, `state-attention`); `state-critical` no Custo Direto é reuso
 * semântico real (já era a cor do passo de subtração na cascata antiga), os demais são uso
 * decorativo dos tokens de marca — não dos tokens `state-*` reservados (exceção: `state-info`/
 * `state-attention` reaproveitados decorativamente nos 2 tiles de origem que não tinham
 * equivalente de marca livre; sem colisão nesta tela — nenhum outro elemento aqui usa esses
 * tokens com significado de status real).
 */

type MoneyState = { loading: boolean; data: MoneyOverview | null; error: string | null };

const formatSigned = (value: number): string => `${value >= 0 ? "+" : ""}${formatCurrencyBRL(value)}`;

type StatTileTone = {
  icon: string;
  accent: string; // classe de borda/ícone (cor cheia, ex. border-primary / text-primary)
  tint: string; // classe de fundo bem clarinho (ex. bg-primary/10)
};

const WATERFALL_TONES: Record<string, StatTileTone> = {
  "Receita": { icon: "payments", accent: "border-primary text-primary", tint: "bg-primary/10" },
  "Custo Direto": { icon: "trending_down", accent: "border-state-critical text-state-critical", tint: "bg-state-critical/10" },
  "Margem Bruta": { icon: "savings", accent: "border-gold-accent text-gold-accent", tint: "bg-gold-accent/10" },
};

const SOURCE_TONES: Record<string, StatTileTone> = {
  "Produtos": { icon: "inventory_2", accent: "border-state-info text-state-info", tint: "bg-state-info/10" },
  "Serviços": { icon: "spa", accent: "border-state-attention text-state-attention", tint: "bg-state-attention/10" },
  "Assinaturas (MRR)": { icon: "loyalty", accent: "border-primary text-primary", tint: "bg-primary/10" },
};

const DEFAULT_TONE: StatTileTone = { icon: "insights", accent: "border-stone-300 text-stone-500", tint: "bg-stone-100" };

const BREAKDOWN_TABS = [
  { id: "unit", label: "Unidade" },
  { id: "product", label: "Produto" },
  { id: "service", label: "Serviço" },
  { id: "channel", label: "Canal" },
  { id: "professional", label: "Profissional" },
  { id: "plan", label: "Plano" },
] as const;

type BreakdownTabId = (typeof BREAKDOWN_TABS)[number]["id"];

export function MoneyView() {
  const { scope } = useAdminScope();
  const [state, setState] = useState<MoneyState>({ loading: true, data: null, error: null });
  const [activeTab, setActiveTab] = useState<BreakdownTabId>("unit");

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
    // ERR-0083 — adia a chamada em 1 tick: load() faz setState antes do primeiro
    // await, o que roda de forma síncrona dentro do próprio efeito (react-hooks/set-state-in-effect).
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
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

      {/* Resultado do período — cascata Receita→Custo→Margem, agora como stat tiles coloridos
          (era uma caixa de 3 linhas + 3 cards num tratamento visual diferente; unificado). */}
      <section className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Resultado do período</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {money.waterfall.map((step) => {
            const tone = WATERFALL_TONES[step.label] ?? DEFAULT_TONE;
            return (
              <div key={step.label} className={`rounded-xl border-l-4 bg-white p-4 shadow-sm dark:bg-forest ${tone.accent.split(" ")[0]} ${tone.tint}`}>
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-lg ${tone.accent.split(" ")[1]}`}>{tone.icon}</span>
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    {step.kind === "subtract" ? `↓ ${step.label}` : step.label}
                  </p>
                </div>
                <p className={`mt-1.5 text-2xl font-bold ${step.kind === "subtract" ? "text-state-critical" : "text-forest"}`}>
                  {step.kind === "subtract" ? `− ${formatCurrencyBRL(step.amount)}` : formatCurrencyBRL(step.amount)}
                </p>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{step.explanation}</p>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-stone-400">{money.omittedNote}</p>
      </section>

      {/* De onde vem — mesmo tratamento de stat tile, cores diferentes (identidade por
          categoria, não por estado). */}
      <section className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">De onde vem</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {money.sources.map((source) => {
            const tone = SOURCE_TONES[source.label] ?? DEFAULT_TONE;
            return (
              <div key={source.label} className={`rounded-xl border-l-4 bg-white p-4 shadow-sm dark:bg-forest ${tone.accent.split(" ")[0]} ${tone.tint}`}>
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-lg ${tone.accent.split(" ")[1]}`}>{tone.icon}</span>
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">{source.label}</p>
                </div>
                <p className="mt-1.5 text-2xl font-bold text-forest">{formatCurrencyBRL(source.revenue)}</p>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  {source.cost !== null ? `custo direto ${formatCurrencyBRL(source.cost)} · ${source.explanation}` : source.explanation}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Detalhamento — 6 decomposições (Unidade/Produto/Serviço/Canal/Profissional/Plano)
          empilhadas viravam "cards gigantes" (cada uma podia crescer sem limite, dificultando
          a leitura). Viraram abas — 1 painel de altura fixa por vez, com rolagem vertical
          própria (dá pra ver o que tem mais embaixo sem a página inteira ficar enorme). */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-forest">Detalhamento</h2>
        <div className="flex w-fit flex-wrap rounded-full border border-gold/50 bg-white p-0.5 dark:bg-forest">
          {BREAKDOWN_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                activeTab === tab.id ? "bg-primary text-white" : "text-forest hover:bg-primary/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="max-h-[420px] overflow-y-auto rounded-xl border border-[#cfe7d1] bg-white p-3 dark:border-forest-green dark:bg-forest">
          {activeTab === "unit" && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="sticky top-0 border-b border-[#cfe7d1] bg-white text-xs font-bold uppercase tracking-wider text-stone-500 dark:border-forest-green dark:bg-forest dark:text-stone-400">
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
          )}

          {activeTab === "product" && (
            <div className="flex flex-col gap-1.5">
              {money.byProduct.length === 0 ? (
                <p className="text-sm text-stone-500 dark:text-stone-400">Nenhuma venda de produto no período.</p>
              ) : (
                money.byProduct.map((product) => (
                  <div key={product.productId} className="flex items-center justify-between gap-2 border-b border-stone-100 pb-1.5 text-sm last:border-0 dark:border-forest-green/40">
                    <span className="text-forest">{product.name}</span>
                    <span className={product.profit >= 0 ? "text-forest" : "text-state-critical"}>{formatSigned(product.profit)}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "service" && (
            <div className="flex flex-col gap-1.5">
              {money.byService.length === 0 ? (
                <p className="text-sm text-stone-500 dark:text-stone-400">Nenhum agendamento no período.</p>
              ) : (
                money.byService.map((service) => (
                  <div key={service.serviceId} className="flex items-center justify-between gap-2 border-b border-stone-100 pb-1.5 text-sm last:border-0 dark:border-forest-green/40">
                    <span className="text-forest">{service.name}</span>
                    <span className={service.profit >= 0 ? "text-forest" : "text-state-critical"}>{formatSigned(service.profit)}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "channel" && (
            <div className="flex flex-col gap-1.5">
              {money.byChannel.length === 0 ? (
                <p className="text-sm text-stone-500 dark:text-stone-400">Nenhuma venda de produto no período.</p>
              ) : (
                money.byChannel.map((channel) => (
                  <div key={channel.channel} className="flex items-center justify-between gap-2 border-b border-stone-100 pb-1.5 text-sm last:border-0 dark:border-forest-green/40">
                    <span className="text-forest">{channel.channel}</span>
                    <span className="text-stone-600 dark:text-stone-400">{formatCurrencyBRL(channel.revenue)}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "professional" && (
            <div className="flex flex-col gap-1.5">
              {money.byProfessional.length === 0 ? (
                <p className="text-sm text-stone-500 dark:text-stone-400">Nenhum agendamento no período.</p>
              ) : (
                money.byProfessional.map((professional) => (
                  <div key={professional.professionalId} className="flex items-center justify-between gap-2 border-b border-stone-100 pb-1.5 text-sm last:border-0 dark:border-forest-green/40">
                    <span className="text-forest">{professional.name}</span>
                    <span className="text-stone-600 dark:text-stone-400">{formatCurrencyBRL(professional.revenue)}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "plan" && (
            <div className="flex flex-col gap-1.5">
              <p className="mb-1 text-xs text-stone-400">Receita recorrente mensal (MRR) por plano de assinatura.</p>
              {money.byPlan.length === 0 ? (
                <p className="text-sm text-stone-500 dark:text-stone-400">Nenhuma assinatura ativa.</p>
              ) : (
                money.byPlan.map((plan) => (
                  <div key={plan.membershipName} className="flex items-center justify-between gap-2 border-b border-stone-100 pb-1.5 text-sm last:border-0 dark:border-forest-green/40">
                    <span className="text-forest">
                      {plan.membershipName} <span className="text-xs text-stone-500 dark:text-stone-400">({plan.activeCount} ativa(s))</span>
                    </span>
                    <span className="text-stone-600 dark:text-stone-400">{formatCurrencyBRL(plan.mrr)}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
