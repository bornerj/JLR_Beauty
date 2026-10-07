import assert from "node:assert/strict";
import test from "node:test";
import {
  canCreateWithRole,
  canDeleteUser,
  canModifyUser,
  shouldRevokeSessions,
  wouldRemoveLastMaster,
} from "./userGuards";

const master = { id: 1, role: "MASTER" };
const admin = { id: 2, role: "ADMIN" };
const otherAdmin = { id: 3, role: "ADMIN" };
const manager = { id: 4, role: "MANAGER" };
const client = { id: 5, role: "CLIENT" };

test("canModifyUser: ADMIN nunca altera um MASTER, em nenhum campo (tomada de conta)", () => {
  for (const fields of [["password"], ["email"], ["status"], ["name"], ["emailVerified"]]) {
    assert.deepEqual(canModifyUser(admin, master, fields), { allowed: false, reason: "admin_cannot_touch_master" });
  }
});

test("canModifyUser: ADMIN não altera outro ADMIN", () => {
  assert.equal(canModifyUser(admin, otherAdmin, ["password"]).allowed, false);
});

test("canModifyUser: ADMIN edita a si mesmo, mas não o próprio status", () => {
  assert.equal(canModifyUser(admin, admin, ["name", "password"]).allowed, true);
  assert.equal(canModifyUser(admin, admin, ["status"]).allowed, false);
});

test("canModifyUser: ADMIN altera contas abaixo de ADMIN", () => {
  assert.equal(canModifyUser(admin, manager, ["password", "email", "status"]).allowed, true);
  assert.equal(canModifyUser(admin, client, ["password"]).allowed, true);
});

test("canModifyUser: MASTER altera qualquer conta", () => {
  assert.equal(canModifyUser(master, admin, ["password"]).allowed, true);
  assert.equal(canModifyUser(master, master, ["password"]).allowed, true);
});

test("canModifyUser: papel sem poder administrativo é negado (fail-closed)", () => {
  assert.equal(canModifyUser(manager, client, ["name"]).allowed, false);
  assert.equal(canModifyUser({ id: 9, role: "QUALQUER" }, client, ["name"]).allowed, false);
});

test("canDeleteUser: ninguém exclui a si mesmo", () => {
  assert.equal(canDeleteUser(master, master).allowed, false);
  assert.equal(canDeleteUser(admin, admin).allowed, false);
});

test("canDeleteUser: ADMIN não exclui MASTER nem ADMIN, mas exclui contas abaixo", () => {
  assert.equal(canDeleteUser(admin, master).allowed, false);
  assert.equal(canDeleteUser(admin, otherAdmin).allowed, false);
  assert.equal(canDeleteUser(admin, client).allowed, true);
});

test("canDeleteUser: MASTER exclui ADMIN", () => {
  assert.equal(canDeleteUser(master, admin).allowed, true);
});

test("canCreateWithRole: só MASTER cria ADMIN/MASTER; demais papéis livres para ADMIN", () => {
  assert.equal(canCreateWithRole(admin, "ADMIN").allowed, false);
  assert.equal(canCreateWithRole(admin, "MASTER").allowed, false);
  assert.equal(canCreateWithRole(master, "ADMIN").allowed, true);
  assert.equal(canCreateWithRole(admin, "MANAGER").allowed, true);
  assert.equal(canCreateWithRole(admin, undefined).allowed, true);
});

test("shouldRevokeSessions: senha, e-mail ou desativação derrubam as sessões", () => {
  assert.equal(shouldRevokeSessions({ passwordChanged: true, emailChanged: false }), true);
  assert.equal(shouldRevokeSessions({ passwordChanged: false, emailChanged: true }), true);
  assert.equal(shouldRevokeSessions({ passwordChanged: false, emailChanged: false, newStatus: "SUSPENSO" }), true);
  assert.equal(shouldRevokeSessions({ passwordChanged: false, emailChanged: false, newStatus: "ATIVO" }), false);
  assert.equal(shouldRevokeSessions({ passwordChanged: false, emailChanged: false }), false);
});

test("wouldRemoveLastMaster: protege o último MASTER ativo", () => {
  assert.equal(wouldRemoveLastMaster(master, { deleting: true }, 0), true);
  assert.equal(wouldRemoveLastMaster(master, { newStatus: "INATIVO" }, 0), true);
  assert.equal(wouldRemoveLastMaster(master, { newRole: "ADMIN" }, 0), true);
  assert.equal(wouldRemoveLastMaster(master, { deleting: true }, 1), false);
  assert.equal(wouldRemoveLastMaster(admin, { deleting: true }, 0), false);
  assert.equal(wouldRemoveLastMaster(master, { newStatus: "ATIVO" }, 0), false);
});
