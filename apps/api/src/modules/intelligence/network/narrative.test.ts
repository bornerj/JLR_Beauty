import assert from "node:assert/strict";
import { test } from "node:test";
import { buildUnitNarrative } from "./narrative";

const base = {
  unitName: "Parque da Cidade",
  state: "ATTENTION" as const,
  score: 61,
  primaryStrengthLabel: "Estoque",
  primaryWeaknessLabel: "Ocupação",
  revenueTrendPercent: -6,
};

test("buildUnitNarrative: cita unidade, estado e score", () => {
  const text = buildUnitNarrative({ ...base, impactEstimate: null });
  assert.ok(text.includes("Parque da Cidade"));
  assert.ok(text.includes("em atenção"));
  assert.ok(text.includes("61/100"));
});

test("buildUnitNarrative: com impactEstimate, cita o valor formatado em R$ e a explicação", () => {
  const text = buildUnitNarrative({
    ...base,
    impactEstimate: { amount: 7200, explanation: "horas ociosas × receita por hora" },
  });
  assert.ok(text.includes("R$"));
  assert.ok(text.includes("7.200,00"));
  assert.ok(text.includes("horas ociosas × receita por hora"));
});

test("buildUnitNarrative: sem impactEstimate, nunca inventa um valor — frase honesta", () => {
  const text = buildUnitNarrative({ ...base, impactEstimate: null });
  // "R$" pode aparecer só como referência descritiva ("sem estimativa... em R$"), nunca com um valor monetário formatado junto (R$ seguido de dígito).
  assert.ok(!/R\$\s*\d/.test(text));
  assert.ok(text.includes("sem uma estimativa confiável"));
});

test("buildUnitNarrative: tendência positiva vs. negativa vs. estável", () => {
  const up = buildUnitNarrative({ ...base, revenueTrendPercent: 12, impactEstimate: null });
  const down = buildUnitNarrative({ ...base, revenueTrendPercent: -12, impactEstimate: null });
  const flat = buildUnitNarrative({ ...base, revenueTrendPercent: 0, impactEstimate: null });
  assert.ok(up.includes("crescendo 12%"));
  assert.ok(down.includes("caindo 12%"));
  assert.ok(flat.includes("estável"));
});

test("buildUnitNarrative: sempre cita a força principal", () => {
  const text = buildUnitNarrative({ ...base, impactEstimate: null });
  assert.ok(text.toLowerCase().includes("estoque"));
});
