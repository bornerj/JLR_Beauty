import assert from "node:assert/strict";
import { test } from "node:test";
import { buildInsightFeed, sumKnownImpact } from "./rules";
import type { InsightInputs } from "./types";
import type { RadarBriefing, RadarFinding } from "../radar/types";
import type { BottlenecksRanking, Bottleneck } from "../gargalos/types";
import type { UnitComparator } from "../comparator/types";

const PERIOD = { from: "2026-07-01T00:00:00.000Z", to: "2026-07-30T23:59:59.999Z", days: 30 };

const finding = (overrides: Partial<RadarFinding> & Pick<RadarFinding, "id" | "severity" | "category">): RadarFinding => ({
  message: "msg",
  actionLabel: "Ver",
  actionPath: "/admin-v2/x",
  ...overrides,
});

const bottleneck = (overrides: Partial<Bottleneck> & Pick<Bottleneck, "id" | "category">): Bottleneck => ({
  message: "msg",
  impact: null,
  actionLabel: "Ver",
  actionPath: "/admin-v2/y",
  ...overrides,
});

const emptyRadar = (findings: RadarFinding[] = []): RadarBriefing => ({
  period: PERIOD,
  generatedAt: PERIOD.to,
  findings,
});

const emptyGargalos = (bottlenecks: Bottleneck[] = []): BottlenecksRanking => ({
  period: PERIOD,
  generatedAt: PERIOD.to,
  totalImpact: 0,
  bottlenecks,
});

const emptyComparator = (biggestGap: UnitComparator["biggestGap"] = null): UnitComparator => ({
  period: PERIOD,
  units: [],
  network: { unitName: "Rede", revenue: 0, marginPercent: 0, occupancyRate: 0, avgTicket: 0, recurrenceRate: 0 },
  biggestGap,
});

const baseInputs = (overrides: Partial<InsightInputs> = {}): InsightInputs => ({
  radar: emptyRadar(),
  gargalos: emptyGargalos(),
  comparator: emptyComparator(),
  ...overrides,
});

test("buildInsightFeed: baseline vazio não quebra", () => {
  assert.deepEqual(buildInsightFeed(baseInputs()), []);
});

test("buildInsightFeed: achado do Radar sem categoria em comum com Gargalos é mantido", () => {
  const insights = buildInsightFeed(
    baseInputs({ radar: emptyRadar([finding({ id: "r1", severity: "CRITICO", category: "Rede" })]) })
  );
  assert.equal(insights.length, 1);
  assert.equal(insights[0].source, "radar");
  assert.equal(insights[0].category, "Rede");
});

test("buildInsightFeed: achado do Radar com MESMA categoria do Gargalos é descartado (Gargalos vence)", () => {
  const insights = buildInsightFeed(
    baseInputs({
      radar: emptyRadar([finding({ id: "r1", severity: "ATENCAO", category: "Operação" })]),
      gargalos: emptyGargalos([bottleneck({ id: "g1", category: "Operação", impact: { amount: 500, explanation: "x" } })]),
    })
  );
  assert.equal(insights.length, 1);
  assert.equal(insights[0].source, "gargalos");
  assert.equal(insights[0].impact?.amount, 500);
});

test("buildInsightFeed: CRITICO sempre vem antes de ATENCAO/OPORTUNIDADE, mesmo sem impacto em R$", () => {
  const insights = buildInsightFeed(
    baseInputs({
      radar: emptyRadar([
        finding({ id: "r1", severity: "OPORTUNIDADE", category: "Financeiro" }),
        finding({ id: "r2", severity: "CRITICO", category: "Rede" }),
      ]),
      gargalos: emptyGargalos([bottleneck({ id: "g1", category: "Operação", impact: { amount: 99999, explanation: "x" } })]),
    })
  );
  assert.equal(insights[0].priority, "CRITICO");
  assert.equal(insights[0].source, "radar");
});

test("buildInsightFeed: dentro da mesma prioridade, maior impacto R$ vem primeiro; nulls por último", () => {
  const insights = buildInsightFeed(
    baseInputs({
      gargalos: emptyGargalos([
        bottleneck({ id: "g1", category: "Agenda", impact: { amount: 100, explanation: "x" } }),
        bottleneck({ id: "g2", category: "Portfólio", impact: null }),
        bottleneck({ id: "g3", category: "Assinaturas", impact: { amount: 500, explanation: "x" } }),
      ]),
    })
  );
  assert.deepEqual(
    insights.map((i) => i.id),
    ["gargalos-g3", "gargalos-g1", "gargalos-g2"]
  );
});

test("buildInsightFeed: maior diferença do Comparador vira insight com impacto quando existe", () => {
  const insights = buildInsightFeed(
    baseInputs({
      comparator: emptyComparator({
        metric: "occupancyRate",
        metricLabel: "Ocupação",
        bestUnitName: "A",
        bestValue: 90,
        worstUnitName: "B",
        worstValue: 10,
        relativeSpreadPercent: 80,
        estimatedRevenueDifference: { amount: 3000, explanation: "x" },
        explanation: "x",
      }),
    })
  );
  assert.equal(insights.length, 1);
  assert.equal(insights[0].source, "comparador");
  assert.equal(insights[0].impact?.amount, 3000);
});

test("buildInsightFeed: Comparador sem biggestGap (null) não vira insight", () => {
  const insights = buildInsightFeed(baseInputs({ comparator: emptyComparator(null) }));
  assert.equal(insights.length, 0);
});

test("sumKnownImpact: soma só os insights com impacto conhecido, ignora nulls", () => {
  const insights = buildInsightFeed(
    baseInputs({
      gargalos: emptyGargalos([
        bottleneck({ id: "g1", category: "Agenda", impact: { amount: 100, explanation: "x" } }),
        bottleneck({ id: "g2", category: "Portfólio", impact: null }),
      ]),
    })
  );
  assert.equal(sumKnownImpact(insights), 100);
});
