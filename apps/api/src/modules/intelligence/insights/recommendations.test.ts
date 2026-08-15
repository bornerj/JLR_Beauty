import assert from "node:assert/strict";
import { test } from "node:test";
import { attachRecommendedActions, getRecommendedActions } from "./recommendations";
import type { Insight } from "./types";

test("getRecommendedActions: categoria conhecida devolve pelo menos 1 sugestão", () => {
  const actions = getRecommendedActions("Operação");
  assert.ok(actions.length >= 1);
  assert.ok(actions[0].label.length > 0);
});

test("getRecommendedActions: categoria desconhecida devolve lista vazia (nunca fabrica sugestão genérica)", () => {
  assert.deepEqual(getRecommendedActions("Categoria Que Não Existe"), []);
});

test("getRecommendedActions: Franquias e Financeiro têm actionPath real (telas existentes)", () => {
  const franquias = getRecommendedActions("Franquias");
  const financeiro = getRecommendedActions("Financeiro");
  assert.equal(franquias[0].actionPath, "/admin-v2/crescimento");
  assert.equal(financeiro[0].actionPath, "/admin-v2/dinheiro");
});

test("getRecommendedActions: categorias sem tela real de ação têm actionPath null (nunca botão morto)", () => {
  for (const category of ["Rede", "Operação", "Agenda", "Portfólio", "Serviços", "Clientes", "Assinaturas", "Comparador"]) {
    const actions = getRecommendedActions(category);
    for (const action of actions) {
      assert.equal(action.actionPath, null, `categoria "${category}" não deveria ter actionPath real ainda`);
    }
  }
});

const insight = (category: string): Omit<Insight, "recommendedActions"> => ({
  id: "x",
  source: "radar",
  priority: "ATENCAO",
  category,
  message: "msg",
  impact: null,
  actionLabel: "Ver",
  actionPath: "/admin-v2/x",
});

test("attachRecommendedActions: preenche recommendedActions em cada insight sem alterar os outros campos", () => {
  const [result] = attachRecommendedActions([insight("Franquias")]);
  assert.equal(result.id, "x");
  assert.equal(result.actionPath, "/admin-v2/x");
  assert.ok(result.recommendedActions.length >= 1);
  assert.equal(result.recommendedActions[0].actionPath, "/admin-v2/crescimento");
});
