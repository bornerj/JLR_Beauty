import type { RadarBriefing } from "../radar/types";
import type { BottlenecksRanking } from "../gargalos/types";
import type { UnitComparator } from "../comparator/types";

/**
 * Admin V2 (PLAN-0023, Onda 6) — Insight Engine (RETROFIT-018).
 * Contrato único do módulo (mesmo padrão de `radar/types.ts`, `gargalos/types.ts`):
 * `rules.ts` (puro) e `service.ts` (orquestração) importam daqui.
 *
 * Não é um motor de regras novo — o Radar (Onda 1) e o Gargalos (Onda 2) já são isso,
 * cada um sobre seu próprio recorte. Esta onda consolida os dois (+ o maior achado do
 * Comparador, Onda 4) num único feed ranqueado, com uma regra de deduplicação: quando o
 * Radar e o Gargalos têm um achado da MESMA categoria (ex.: "Operação"), o Gargalos
 * vence — ele carrega o R$, o Radar não. Sem isso, o mesmo fato apareceria duas vezes
 * com fraseamento diferente, o oposto de "um único feed".
 */
export type InsightSource = "radar" | "gargalos" | "comparador";

export type InsightPriority = "CRITICO" | "ATENCAO" | "OPORTUNIDADE";

export type InsightImpact = { amount: number; explanation: string } | null;

/**
 * RETROFIT-019 (Onda 7) — sugestão de próximo passo em texto, curada por categoria.
 * `actionPath: null` quando não existe uma tela real pra essa ação ainda — nunca
 * fabricamos um botão que não leva a lugar nenhum (mesma governança do resto do
 * programa). Quando existe, é sempre uma rota real já validada em ondas anteriores.
 */
export type RecommendedAction = {
  label: string;
  actionPath: string | null;
};

export type Insight = {
  id: string;
  source: InsightSource;
  priority: InsightPriority;
  category: string;
  message: string;
  impact: InsightImpact;
  actionLabel: string;
  actionPath: string;
  /** RETROFIT-019 — 1-2 sugestões de "o que fazer", nem sempre com tela pra ir junto. */
  recommendedActions: RecommendedAction[];
};

export type InsightFeed = {
  period: { from: string; to: string; days: number };
  generatedAt: string;
  /** Soma só dos insights com impacto conhecido — mesmo padrão do Gargalos (governança #6). */
  totalKnownImpact: number;
  insights: Insight[];
};

/** Entradas já buscadas pelo `service.ts` (Radar/Gargalos/Comparador reais), delegadas para `rules.ts`. */
export type InsightInputs = {
  radar: RadarBriefing;
  gargalos: BottlenecksRanking;
  comparator: UnitComparator;
};
