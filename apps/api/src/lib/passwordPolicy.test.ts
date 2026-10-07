import assert from "node:assert/strict";
import test from "node:test";
import { validateNewPassword } from "./passwordPolicy";

const code = (password: string, ctx?: { email?: string; name?: string }) => {
  const result = validateNewPassword(password, ctx);
  return result.ok ? "ok" : result.code;
};

test("aceita senha longa, variada e sem previsibilidade", () => {
  assert.equal(code("Tr0piCal#Vento-92x"), "ok");
  assert.equal(code("Cafe&Lua!Mesa7Roxa"), "ok");
});

test("recusa senha curta (< 10) mesmo com complexidade", () => {
  assert.equal(code("Ab1!cdEf"), "too_short");
});

test("recusa senha sem complexidade mínima", () => {
  assert.equal(code("todasminusculasaqui"), "weak_complexity");
});

test("recusa senhas comuns, inclusive com leet e acréscimos", () => {
  for (const weak of ["Senha@12345", "P@ssw0rd!2024", "Qwerty#12345", "Admin@123456", "Welcome#2024x", "Br@sil2024!!x", "Mudar@123456"]) {
    assert.equal(code(weak), "common", weak);
  }
});

test("recusa repetição de 4+ caracteres iguais", () => {
  assert.equal(code("Zebra!9999Mesa"), "repetitive");
});

test("recusa senha que contém parte do e-mail ou do nome", () => {
  assert.equal(code("Mariana#Lua-47x", { email: "mariana.souza@exemplo.com" }), "contains_identity");
  assert.equal(code("Lua-47x#Souza!Mesa", { name: "João Souza" }), "contains_identity");
  assert.equal(code("Lua-47x#Mesa!Roxa", { email: "ana@exemplo.com", name: "Ana" }), "ok");
});
