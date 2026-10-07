import assert from "node:assert/strict";
import test from "node:test";
import { buildAccountAttemptKey, getClientIp } from "./rateLimiter";

test("getClientIp: usa req.ip e ignora X-Forwarded-For forjado pelo cliente", () => {
  const forged = { ip: "203.0.113.9", headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } };
  assert.equal(getClientIp(forged as never), "203.0.113.9");
});

test("getClientIp: sem IP devolve 'unknown' (chave estável, nunca vazia)", () => {
  assert.equal(getClientIp({ ip: undefined } as never), "unknown");
});

test("buildAccountAttemptKey: normaliza caixa/espaços e independe de IP", () => {
  assert.equal(buildAccountAttemptKey("  Maria@Exemplo.COM "), "acct::maria@exemplo.com");
  assert.equal(buildAccountAttemptKey(""), "acct::unknown");
});
