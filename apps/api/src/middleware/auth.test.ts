import assert from "node:assert/strict";
import test from "node:test";
import { canAccessUnit, resolveUnitScope, type AuthRequest } from "./auth";

function reqWith(user: AuthRequest["user"]): AuthRequest {
  return { user } as AuthRequest;
}

test("resolveUnitScope: MASTER tem escopo global (all)", () => {
  const scope = resolveUnitScope(reqWith({ id: 1, role: "MASTER", unitId: null }));
  assert.deepEqual(scope, { kind: "all" });
});

test("resolveUnitScope: ADMIN tem escopo global (all) mesmo sem unitId", () => {
  const scope = resolveUnitScope(reqWith({ id: 2, role: "ADMIN", unitId: null }));
  assert.deepEqual(scope, { kind: "all" });
});

test("resolveUnitScope: MANAGER com unitId fica restrito à própria unidade", () => {
  const scope = resolveUnitScope(reqWith({ id: 3, role: "MANAGER", unitId: 5 }));
  assert.deepEqual(scope, { kind: "units", unitIds: [5] });
});

test("resolveUnitScope: PROFESSIONAL sem unitId vinculado nega tudo (fail-closed)", () => {
  const scope = resolveUnitScope(reqWith({ id: 4, role: "PROFESSIONAL", unitId: null }));
  assert.deepEqual(scope, { kind: "units", unitIds: [] });
});

test("resolveUnitScope: sem usuário autenticado nega tudo", () => {
  const scope = resolveUnitScope(reqWith(undefined));
  assert.deepEqual(scope, { kind: "units", unitIds: [] });
});

test("canAccessUnit: PROFESSIONAL só acessa a própria unidade (S1/S2)", () => {
  const req = reqWith({ id: 4, role: "PROFESSIONAL", unitId: 5 });
  assert.equal(canAccessUnit(req, 5), true);
  assert.equal(canAccessUnit(req, 6), false, "tentativa de acessar outra unidade deve ser negada");
});

test("canAccessUnit: MANAGER sem unidade vinculada não acessa nenhuma unidade", () => {
  const req = reqWith({ id: 3, role: "MANAGER", unitId: null });
  assert.equal(canAccessUnit(req, 1), false);
});

test("canAccessUnit: MASTER/ADMIN acessam qualquer unidade", () => {
  const master = reqWith({ id: 1, role: "MASTER", unitId: null });
  assert.equal(canAccessUnit(master, 999), true);
});
