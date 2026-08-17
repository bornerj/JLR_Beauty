import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPipeline, STALLED_FALLBACK_DAYS } from "./metrics";
import type { LeadSnapshot, StageHistoryEdge } from "./types";

/** Admin V2 (PLAN-0022, Onda 9) — testes da agregação pura do pipeline de franquias (RETROFIT-010). */

const day = (n: number): Date => new Date(2026, 0, n, 0, 0, 0);

const lead = (overrides: Partial<LeadSnapshot> = {}): LeadSnapshot => ({
  leadId: 1,
  name: "Lead Teste",
  email: null,
  phone: null,
  city: null,
  stage: "INTERESSADO",
  estimatedValue: null,
  stageChangedAt: day(1),
  createdAt: day(1),
  reason: null,
  ...overrides,
});

test("buildPipeline — sem leads e sem histórico devolve todas as 7 etapas zeradas", () => {
  const result = buildPipeline([], [], day(10));
  assert.equal(result.stages.length, 7);
  assert.ok(result.stages.every((s) => s.count === 0 && s.avgDaysToComplete === null && s.avgDaysInStageNow === null && !s.isBottleneck));
  assert.equal(result.leads.length, 0);
});

test("buildPipeline — soma o valor potencial por etapa, ignorando leads sem valor estimado", () => {
  const result = buildPipeline(
    [
      lead({ leadId: 1, stage: "QUALIFICADO", estimatedValue: 50000 }),
      lead({ leadId: 2, stage: "QUALIFICADO", estimatedValue: 30000 }),
      lead({ leadId: 3, stage: "QUALIFICADO", estimatedValue: null }),
    ],
    [],
    day(10)
  );
  const qualificado = result.stages.find((s) => s.stage === "QUALIFICADO")!;
  assert.equal(qualificado.count, 3);
  assert.equal(qualificado.estimatedValueTotal, 80000);
});

test("buildPipeline — tempo médio esperado vem do histórico real (createdAt -> primeira transição)", () => {
  const leads = [lead({ leadId: 1, stage: "QUALIFICADO", stageChangedAt: day(5), createdAt: day(1) })];
  const history: StageHistoryEdge[] = [{ leadId: 1, fromStage: "INTERESSADO", toStage: "QUALIFICADO", changedAt: day(5) }];
  const result = buildPipeline(leads, history, day(10));
  const interessado = result.stages.find((s) => s.stage === "INTERESSADO")!;
  assert.equal(interessado.avgDaysToComplete, 4); // day(1) -> day(5)
});

test("buildPipeline — encadeia múltiplas transições do mesmo lead corretamente", () => {
  const leads = [lead({ leadId: 1, stage: "REUNIAO", stageChangedAt: day(8), createdAt: day(1) })];
  const history: StageHistoryEdge[] = [
    { leadId: 1, fromStage: "INTERESSADO", toStage: "QUALIFICADO", changedAt: day(3) }, // 2 dias em INTERESSADO
    { leadId: 1, fromStage: "QUALIFICADO", toStage: "REUNIAO", changedAt: day(8) }, // 5 dias em QUALIFICADO
  ];
  const result = buildPipeline(leads, history, day(10));
  assert.equal(result.stages.find((s) => s.stage === "INTERESSADO")!.avgDaysToComplete, 2);
  assert.equal(result.stages.find((s) => s.stage === "QUALIFICADO")!.avgDaysToComplete, 5);
});

test("buildPipeline — lead parado além do tempo médio esperado vira isStalled", () => {
  const leads = [
    lead({ leadId: 1, stage: "PROPOSTA", stageChangedAt: day(1), createdAt: day(1) }), // 9 dias parado até day(10)
    lead({ leadId: 2, stage: "PROPOSTA", stageChangedAt: day(9), createdAt: day(1) }), // 1 dia parado
  ];
  // histórico mostra que PROPOSTA normalmente demora só 2 dias
  const history: StageHistoryEdge[] = [{ leadId: 3, fromStage: "PROPOSTA", toStage: "NEGOCIACAO", changedAt: day(3) }];
  const historyLeads = [...leads, lead({ leadId: 3, stage: "NEGOCIACAO", createdAt: day(1) })];
  const result = buildPipeline(historyLeads, history, day(10));

  const stalled = result.leads.find((l) => l.leadId === 1)!;
  const fresh = result.leads.find((l) => l.leadId === 2)!;
  assert.equal(stalled.isStalled, true);
  assert.equal(fresh.isStalled, false);
});

test("buildPipeline — sem histórico nenhum, usa o limiar de segurança fixo (STALLED_FALLBACK_DAYS)", () => {
  const leads = [lead({ leadId: 1, stage: "CONTRATO", stageChangedAt: day(1), createdAt: day(1) })];
  const now = new Date(day(1).getTime() + (STALLED_FALLBACK_DAYS + 1) * 24 * 60 * 60 * 1000);
  const result = buildPipeline(leads, [], now);
  assert.equal(result.leads[0].isStalled, true);
});

test("buildPipeline — isBottleneck só quando a ocupação atual excede a média histórica real", () => {
  const leads = [lead({ leadId: 1, stage: "NEGOCIACAO", stageChangedAt: day(1), createdAt: day(1) })]; // 9 dias parado
  const history: StageHistoryEdge[] = [{ leadId: 2, fromStage: "NEGOCIACAO", toStage: "CONTRATO", changedAt: day(3) }]; // historicamente 2 dias
  const historyLeads = [...leads, lead({ leadId: 2, stage: "CONTRATO", createdAt: day(1) })];
  const result = buildPipeline(historyLeads, history, day(10));
  const negociacao = result.stages.find((s) => s.stage === "NEGOCIACAO")!;
  assert.equal(negociacao.isBottleneck, true);
});

test("buildPipeline — transição com fromStage null não fabrica duração (nada para atribuir)", () => {
  const leads = [lead({ leadId: 1, stage: "QUALIFICADO", stageChangedAt: day(5), createdAt: day(1) })];
  const history: StageHistoryEdge[] = [{ leadId: 1, fromStage: null, toStage: "QUALIFICADO", changedAt: day(5) }];
  const result = buildPipeline(leads, history, day(10));
  assert.equal(result.stages.find((s) => s.stage === "INTERESSADO")!.avgDaysToComplete, null);
});
