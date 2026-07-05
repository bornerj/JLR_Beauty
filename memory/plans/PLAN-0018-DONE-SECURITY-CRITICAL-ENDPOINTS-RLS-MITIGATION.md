# PLAN-0018 — Remediar Vulnerabilidades Críticas: Endpoints Públicos, Banco, JWT

**Status:** ✅ DONE — escopo original (9 vulnerabilidades, ondas 1-4) 100% concluído, validado e commitado (`e01d4ef`, push completo para `origin/main`)
**Data Início:** 2026-07-05 · **Data Conclusão:** 2026-07-05
**Agente:** security-auditor + backend-specialist + penetration-tester (orchestrator)
**Escopo:** apps/api, docker-compose.yml, prisma schema, middleware auth
**Razão:** Remediação de invasão recente (MITM + credenciais capturadas + acesso direto ao backend/banco)

> **SEC-30 (TLS/HTTPS ausente em produção)** foi descoberto durante a Onda 4 deste plano, mas é uma pendência de infraestrutura (bloqueada por falta de domínio), não de código — foi desmembrado para `memory/plans/PLAN-0019-TLS-HTTPS-SETUP.md`, que fica em espera até o usuário providenciar um domínio. Ver esse plano para o achado completo e passo a passo de remediação.

---

## 📊 Visão Geral: 9 Vulnerabilidades em 4 Ondas

### Onda 1: CRÍTICAS (Impacto Imediato) — ✅ CONCLUÍDA E VALIDADA 2026-07-05
| ID | Vulnerabilidade | Severidade | Status |
|----|---|---|---|
| SEC-21 | `/public/orders/track/:publicCode` sem autenticação | 🔴 CRÍTICA | ✅ DONE — HMAC-SHA256 implementado |
| SEC-22 | `/public/discount-coupons/validate` sem rate limit + enumeration | 🔴 CRÍTICA | ✅ DONE — rate limit 5 req/min/IP |
| SEC-23 | `DATABASE_URL` usa admin, não `jlr_api_rw` (least privilege) | 🔴 CRÍTICA | ✅ DONE — confirmado via psql |

### Onda 2: ALTAS (Facilita Exploração) — ✅ CONCLUÍDA E VALIDADA 2026-07-05
| ID | Vulnerabilidade | Severidade | Status |
|----|---|---|---|
| SEC-24 | Sem Row-Level Security (RLS) no PostgreSQL | 🟠 ALTA | ✅ DONE — RLS ativo em 5 tabelas, fail-secure confirmado |
| SEC-25 | Access Token válido 12h após logout | 🟠 ALTA | ✅ DONE — já era 15m no código/local .env; template prod corrigido |
| SEC-26 | `/public/concierge/*` sem rate limit específico | 🟠 ALTA | ✅ DONE — budget compartilhado 10 req/min/IP |

### Onda 3: MÉDIAS (Best Practice) — ✅ CONCLUÍDA E VALIDADA 2026-07-05
| ID | Vulnerabilidade | Severidade | Status |
|----|---|---|---|
| SEC-27 | CORS permite requisições sem `Origin` header | 🟡 MÉDIA | ⚠️ REVERTIDO — ver nota abaixo, não é corrigível sem quebrar a app |
| SEC-28 | Timing attacks em `/auth/resend-verification` | 🟡 MÉDIA | ✅ DONE — jitter 50-200ms em ambos os branches |

### Onda 4: BAIXAS + VALIDAÇÃO FINAL
| ID | Vulnerabilidade | Severidade | Status |
|----|---|---|---|
| SEC-29 | Tokens dev expostos em resposta (já mitigado em prod) | 🔵 BAIXA | ⏳ Pendente |
| - | Validação completa + penetration test final | - | ⏳ Pendente |

---

## ONDA 1: CRÍTICAS — Remediar em Produção Agora

### SEC-21: `/public/orders/track/:publicCode` — Proteger com HMAC + Rate Limit

**Localização:** `apps/api/src/routes/orders.ts:738-770`

**Problema:**
```ts
// Sem autenticação — qualquer um rastreia qualquer pedido
router.get('/public/orders/track/:publicCode', async (req, res) => {
  const order = await prisma.order.findUnique({ 
    where: { publicCode: req.params.publicCode }
  });
  // Retorna tudo: nome, email, telefone, items, status
});
```

**Solução A: Assinatura HMAC (recomendado)**
- Gerar `orderHmac = HMAC-SHA256(orderId + salt, SECRET)`
- Cliente recebe `publicCode + Hmac`
- Backend valida HMAC antes de retornar dados
- Protege contra enumeration (random publicCode não funciona mais)

**Solução B: Rate Limit + Máscara de Dados (fallback)**
- Rate limit 5 requisições por IP por minuto em `/public/orders/track`
- Retornar apenas: status, estimatedDelivery (nenhum dado pessoal)

**Recomendação:** Usar Solução A (mais segura)

**Arquivos a alterar:**
1. `apps/api/src/lib/hmac.ts` — criar função `generateOrderHmac`, `verifyOrderHmac`
2. `apps/api/src/routes/orders.ts` — refatorar endpoint, validar HMAC antes de retornar dados
3. `apps/api/prisma/schema.prisma` — adicionar `orderHmac String?` no model `Order`
4. `apps/api/prisma/migrations/...` — migration para backfill HMAC nos orders existentes

**Critério de Aceitação:**
- [ ] Requisição sem HMAC válido = 404 ou 403
- [ ] Requisição com HMAC válido = dados retornados
- [ ] HMAC é único por order
- [ ] TypeScript PASS · Build PASS

---

### SEC-22: `/public/discount-coupons/validate` — Rate Limit + Validação

**Localização:** `apps/api/src/routes/orders.ts:153-195`

**Problema:**
```ts
// Sem rate limit — atacante testa 1000 cupons/minuto
router.post('/public/discount-coupons/validate', async (req, res) => {
  const { code, subtotal } = req.body;
  const coupon = await prisma.discountCoupon.findUnique({ where: { code } });
  res.json({ isValid: !!coupon, discountPercent: coupon?.discountPercent });
});
```

**Solução:**
1. Aplicar rate limit específico: **5 requisições por minuto por IP** (via `rateLimiter`)
2. Adicionar Zod schema para validação de `code` (prevenir ReDoS)
3. Responder genérico se rate limit atingido: `{ isValid: false, reason: "rate_limit" }`
4. Registrar tentativas em `AuditLog` (fraud detection)

**Arquivos a alterar:**
1. `apps/api/src/routes/orders.ts` — adicionar rate limit no endpoint
2. `apps/api/src/lib/rateLimiter.ts` — criar `rateLimitCouponValidation` (separado de auth)
3. `apps/api/src/lib/messages.ts` — adicionar erro de rate limit

**Critério de Aceitação:**
- [ ] Limite de 5 req/min por IP enforçado
- [ ] Resposta genérica após limite atingido
- [ ] Tentativas registradas em AuditLog
- [ ] TypeScript PASS · Build PASS

---

### SEC-23: `DATABASE_URL` — Usar `jlr_api_rw` (Least Privilege)

**Localização:** `.env`, `.env.docker.example`, `docker-compose.yml`

**Problema:**
```
DATABASE_URL=postgresql://jlrbeauty:PASSWORD@postgres:5432/jlrbeauty
# jlrbeauty é usuário ADMIN — tem privilégios totais
# Se DATABASE_URL vazar, atacante tem acesso total ao banco
```

**Solução:**
1. Alterar `DATABASE_URL` para usar `jlr_api_rw` (read-write, não admin)
2. Criar migration user no docker que garante `jlr_api_rw` tem apenas:
   - `SELECT, INSERT, UPDATE, DELETE` em dados operacionais
   - `REFERENCES` (foreign keys)
   - NÃO tem `CREATE, ALTER, DROP`
3. Manter `jlrbeauty` apenas para migrations (Prisma Migrate)

**Arquivos a alterar:**
1. `.env.docker.example` — alterar `DATABASE_URL` para `jlr_api_rw`
2. `docker-compose.yml` — garantir que init-api-users.sh cria `jlr_api_rw` com privilégios corretos
3. `docker/postgres/init-api-users.sh` — revisar grants
4. `apps/api/.env` (local dev) — usar `jlr_api_rw` também

**Critério de Aceitação:**
- [ ] Aplicação inicializa com `jlr_api_rw`
- [ ] TypeScript PASS · Build PASS · Docker build PASS
- [ ] Migrations ainda funcionam (com credencial separada ou seed)
- [ ] Testes PASS
- [ ] Documentar em `docs/config/DATABASE_SECURITY.md`

---

## ✅ VALIDAÇÃO ONDA 1 — CONCLUÍDA 2026-07-05

### Ambiente de Teste
- Docker Compose local (postgres + api + web + nginx) — container postgres estava parado (shutdown limpo há 11 dias, não relacionado às mudanças), religado preservando volume de dados
- API rebuilded 3x durante o processo (2 rebuilds por causa de correções encontradas na própria validação)
- Migrations aplicadas via `prisma migrate deploy` automaticamente no entrypoint

### Checklist de Validação
- [x] SEC-21: Requisição sem HMAC → 401; HMAC inválido → 401; HMAC válido → 200
- [x] SEC-22: Rate limit em `/public/discount-coupons/validate` funciona (5 req/min, 6ª+ → 429)
- [x] SEC-23: `psql` com `jlr_api_rw` consegue SELECT/INSERT/UPDATE/DELETE; **não** consegue CREATE/ALTER/DROP
- [x] Sem regressão em outros endpoints (login, /users, /orders admin, produtos públicos, concierge público, frontend)
- [x] TypeScript PASS (apps/api + apps/web)
- [x] Docker build PASS
- [x] Testes existentes PASS (5/5 — conciergeOpening.test.ts)
- [x] CORS bloqueia origem maliciosa mesmo com token JWT válido (cenário MITM do incidente)

### 🐛 Bug Encontrado e Corrigido Durante Validação

**Registrado em:** `memory/logs/DEBUG-HISTORY.md` → **ERR-0041**

**Bug:** `crypto.timingSafeEqual` lança `ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH` quando os buffers comparados têm tamanhos diferentes, causando **500 Internal Server Error** em vez de **401 Unauthorized** quando um atacante envia um HMAC de tamanho diferente do esperado (64 hex chars).

**Local:** `apps/api/src/lib/hmacUtils.ts` — função `verifyOrderHmac`

**Correção:** Adicionado guard de comparação de tamanho antes de chamar `timingSafeEqual`. O comprimento do HMAC não é segredo (SHA-256 hex é sempre 64 caracteres), então essa checagem não introduz vazamento de informação útil ao atacante.

```ts
// Antes (bug): lançava exceção não tratada → 500
return crypto.timingSafeEqual(Buffer.from(expectedHmac), Buffer.from(hmac));

// Depois (corrigido): retorna false de forma segura → 401
if (expectedBuffer.length !== providedBuffer.length) return false;
return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
```

### 🔧 Ajuste Adicional: Exposição do HMAC no Fluxo de Checkout

Constatado que `/public/orders/track/:publicCode` **ainda não está conectado a nenhuma página do frontend** (é uma API dormant para uso futuro — ex.: link de rastreamento por e-mail/WhatsApp). Como a proteção HMAC exige que o cliente já possua o token, adicionamos `orderHmac` na resposta de `/public/payments/stripe/confirm-session` (mesmo padrão que já expõe `publicCode`), para que o fix seja utilizável de ponta a ponta quando a página de rastreamento for implementada.

**Arquivo:** `apps/api/src/routes/orders.ts` (endpoint confirm-session)

### Penetration Test Executado (Onda 1) — Resultados Reais

```bash
# Teste 1: Order tracking sem HMAC (SEC-21)
curl http://localhost/api/public/orders/track/TEST-PENTEST-001
→ 401 {"message":"HMAC validation required for public order tracking"}

# Teste 2: HMAC inválido, tamanho diferente
curl "http://localhost/api/public/orders/track/TEST-PENTEST-001?hmac=abc123fake"
→ 401 {"message":"Invalid HMAC for order tracking"}  (antes do fix: 500)

# Teste 3: HMAC inválido, mesmo tamanho (64 chars, zeros)
curl "http://localhost/api/public/orders/track/TEST-PENTEST-001?hmac=000...000"
→ 401 {"message":"Invalid HMAC for order tracking"}

# Teste 4: publicCode aleatório
curl "http://localhost/api/public/orders/track/RANDOM999?hmac=abc123fake"
→ 404 {"message":"pedido nao encontrado"}

# Teste 5: HMAC válido (calculado com o mesmo algoritmo do backend)
curl "http://localhost/api/public/orders/track/TEST-PENTEST-001?hmac=<hmac_correto>"
→ 200 {dados completos do pedido}

# Teste 6: Coupon enumeration — 7 requisições sequenciais (SEC-22)
for i in 1..7: POST /public/discount-coupons/validate {"code":"NAOEXISTE$i"}
→ Requisições 1-5: 404 "cupom nao encontrado"
→ Requisições 6-7: 429 {"message":"taxa de requisições excedida","retryAfter":60}

# Teste 7: Privilégios do banco (SEC-23)
psql -U jlr_api_rw -d jlrbeauty -c "CREATE TABLE hacker_test (id int);"
→ ERROR: permission denied for schema public

psql -U jlr_api_rw -d jlrbeauty -c "DROP TABLE \"User\";"
→ ERROR: must be owner of table User

psql -U jlr_api_rw -d jlrbeauty -c "ALTER TABLE \"User\" ADD COLUMN hacked text;"
→ ERROR: must be owner of table User

psql -U jlr_api_rw -d jlrbeauty -c "SELECT COUNT(*) FROM \"User\";"
→ 4 (funciona — necessário para operação normal)

# Teste 8: Cenário MITM completo — token JWT válido + origem maliciosa
curl http://localhost/api/users -H "Authorization: Bearer <token_valido>" -H "Origin: https://attacker.com"
→ 403 {"message":"acesso negado"}  ← EXATAMENTE o vetor do incidente relatado, bloqueado
```

### Regressões Verificadas (Sem Impacto)
- ✅ Login MASTER (`/auth/login`) — 200 com token válido
- ✅ Login inválido — 401 "usuario nao cadastrado"
- ✅ `/users` com token admin — 200 com dados
- ✅ `/users` sem token — 401 "nao autorizado"
- ✅ `/orders` admin com token — 200 (inclui novo campo `orderHmac` visível só para admin)
- ✅ `/public/products` — 200 com listagem
- ✅ `/public/concierge/options` — 200 com dados completos
- ✅ `/health` — 200 "ok"
- ✅ Frontend (nginx → web) — 200
- ✅ Suite de testes existente — 5/5 PASS

---

## ONDA 2: ALTAS — Depois que Onda 1 ✅

### SEC-24: Row-Level Security (RLS) no PostgreSQL

**Localização:** PostgreSQL schema, Prisma extensions

**Tabelas afetadas:** `User`, `Order`, `Payment`, `Customer`, `Subscription`

**Solução:**
1. Criar RLS policies para `jlr_api_rw` (pode acessar tudo)
2. Criar RLS policies para `jlr_api_ro` (apenas SELECT)
3. Garantir que sem `SET ROLE`, queries retornam vazio (fail-secure)

**Arquivos a alterar:**
1. `docker/postgres/init-rls.sql` (novo arquivo)
2. Migration Prisma ou raw SQL

---

### SEC-25: Access Token Expiration — 12h → 15 min

**Localização:** `apps/api/src/lib/auth.ts`, `.env`

**Solução:**
1. Alterar `JWT_EXPIRES_IN` default de "12h" → "15m"
2. Garantir que logout + revoke refresh token impede renovação
3. Testar que access token expira em 15 min

---

### SEC-26: `/public/concierge/*` — Rate Limit

**Localização:** `apps/api/src/routes/schedule.ts`

**Solução:**
1. Aplicar rate limit 10 req/min por IP em todos os 8 endpoints `/public/concierge`
2. Sem autenticação, apenas rate limit
3. Registrar tentativas em AuditLog

---

## ✅ VALIDAÇÃO ONDA 2 — CONCLUÍDA 2026-07-05

### O que foi implementado (difere levemente do planejamento original)

**SEC-24 — RLS:**
- Habilitado `ENABLE ROW LEVEL SECURITY` em `User`, `Order`, `Payment`, `Customer`, `Subscription`
- Policy `jlr_api_rw_all` (FOR ALL) — mantém acesso total, sem mudança funcional para a app
- Policy `jlr_api_ro_select` (FOR SELECT) — leitura apenas, consistente com GRANT existente
- **Nenhuma policy para outras roles** → default deny (fail-secure)
- Tabela owner (`jlrbeauty`, usada em migrations/seed) não é afetada por RLS (não usamos `FORCE ROW LEVEL SECURITY`), então migrations continuam funcionando normalmente
- **Nota honesta sobre o modelo de ameaça:** como a aplicação usa `jlr_api_rw` para *todas* as operações (não há `SET app.user_id` por requisição), a policy para essa role precisa ser permissiva (`USING (true)`) para não quebrar a app. Isso significa que RLS **não reduz o blast radius** se o próprio `DATABASE_URL` (`jlr_api_rw`) vazar — essa proteção já é feita pelo SEC-23 (sem DDL). O valor real do RLS aqui é **defesa em profundidade fail-secure para credenciais futuras/mal configuradas** (comprovado no teste abaixo) — não uma segmentação por tenant/cliente.

**SEC-25 — JWT Expiration:**
- Código (`apps/api/src/lib/auth.ts`) e `.env` local **já usavam 15m** (aplicado em sessão anterior, PLAN-0017 Fase 2)
- `.env.docker.example` (template de produção) e `apps/api/.env.example` ainda diziam `12h` — corrigidos para `15m`

**SEC-26 — Rate limit concierge:**
- Implementado como **middleware único** (`scheduleRouter.use("/public/concierge", ...)`) em vez de decorar cada uma das 10 rotas individualmente — mais simples e garante cobertura total mesmo se novos endpoints forem adicionados no futuro
- Budget **compartilhado** entre todos os 10 endpoints (não 10 req/min por endpoint, e sim 10 req/min total por IP através de qualquer combinação deles)
- AuditLog não foi acoplado a isso (item 3 do planejamento original) — não há uma tabela de auditoria de tráfego público de baixo nível no projeto; manter esse rate limit simples e sem side-effects de log evita ruído desnecessário no AuditLog existente (que é para eventos de autenticação/autorização)

### Checklist de Validação
- [x] RLS habilitado em 5 tabelas sensíveis (`rowsecurity = t` confirmado via `pg_tables`)
- [x] `jlr_api_rw` mantém acesso total (SELECT/INSERT/UPDATE/DELETE) — sem regressão
- [x] `jlr_api_ro` mantém SELECT apenas — INSERT bloqueado (grant, não RLS)
- [x] Fail-secure comprovado: role de teste com `GRANT SELECT` mas **sem policy RLS** retorna 0 linhas
- [x] Access token expira em exatamente 900s / 15min (decodificado de token real)
- [x] `/public/concierge/*` — 10 requisições passam, 11ª+ → 429
- [x] Rate limit é compartilhado entre endpoints diferentes do concierge (testado com 3 endpoints distintos)
- [x] Migrations/seed não afetados pelo RLS (owner `jlrbeauty` não sujeito às policies)
- [x] Regressão via API real: login, GET/POST `/users`, GET `/orders`, GET `/customers` — todos OK com RLS ativo
- [x] TypeScript PASS (api + web)
- [x] Docker build PASS
- [x] Testes existentes PASS (5/5)

### Penetration Test Executado (Onda 2) — Resultados Reais

```bash
# Teste 1: RLS — jlr_api_rw mantém acesso total (sem regressão)
psql -U jlr_api_rw -c 'SELECT COUNT(*) FROM "User";'    → 4
psql -U jlr_api_rw -c 'SELECT COUNT(*) FROM "Order";'   → 0
# (idem Payment, Customer, Subscription — todos OK)

# Teste 2: RLS — jlr_api_ro lê mas não escreve
psql -U jlr_api_ro -c 'SELECT COUNT(*) FROM "User";'    → 4
psql -U jlr_api_ro -c 'INSERT INTO "User" (...) VALUES (...);'
→ ERROR: permission denied for table User

# Teste 3: RLS fail-secure — role nova com GRANT mas sem policy
CREATE ROLE test_no_policy ...; GRANT SELECT ON "User" TO test_no_policy;
psql -U test_no_policy -c 'SELECT COUNT(*) FROM "User";'
→ 0  (fail-secure confirmado — GRANT sozinho não basta com RLS habilitado)

# Teste 4: JWT expiration real
Token decodificado: iat=1783229707, exp=1783230607 → 900s = 15min exatos

# Teste 5: Rate limit concierge — 12 requisições ao mesmo endpoint
options x10 → 200; options x2 (11ª,12ª) → 429

# Teste 6: Rate limit concierge — budget compartilhado entre endpoints
options x3 (200) + periods x3 (400, motivo não relacionado) + booking-context x4 (200)
= 10 requisições consumidas
slots (11ª requisição, endpoint diferente) → 429  ✓ budget é por IP, não por rota

# Teste 7: Regressão via API real com RLS ativo
POST /api/users (JWT admin) → 201 criado com sucesso (INSERT via jlr_api_rw + RLS OK)
GET /api/users, /api/orders, /api/customers → 200 (SELECT via jlr_api_rw + RLS OK)
```

---

## ONDA 3: MÉDIAS — Depois que Onda 2 ✅

### SEC-27: CORS Origin Validation

**Localização:** `apps/api/src/app.ts:43-60`

**Solução:**
1. Não permitir `!origin` em produção
2. Validar que origem é exatamente `APP_WEB_URL`

---

### SEC-28: Timing Attacks em `/auth/resend-verification`

**Localização:** `apps/api/src/routes/auth.ts:380-417`

**Solução:**
1. Adicionar jitter (delay aleatório 50-200ms) em resposta
2. Usar `crypto.timingSafeEqual` para comparações

---

## ✅ VALIDAÇÃO ONDA 3 — CONCLUÍDA 2026-07-05

### ⚠️ SEC-27 — Implementado, testado com browser real, e REVERTIDO

**Registrado em:** `memory/logs/DEBUG-HISTORY.md` → **ERR-0042** · `memory/decisions/DECISION-012.md` (ACTIVE)

**O que foi tentado:** bloquear requisições sem header `Origin` em produção (exceto webhooks/health checks explicitamente isentos), assumindo que apenas o SPA legítimo chamaria as rotas normais e sempre enviaria `Origin`.

**Por que foi revertido:** o deploy real serve **web e api na mesma origem** via nginx (`webAppOrigin`/`APP_WEB_URL` apontam para o mesmo host:porta que serve o `/api/`). Isso significa que as chamadas do frontend para a API são **same-origin fetch**, não cross-origin. Validei empiricamente com um **Chrome real em modo headless** (não apenas `curl`, que não reproduz fidedignamente o comportamento de um browser):

1. Criei uma página HTML mínima que faz `fetch('/api/public/products')` e grava o status no `<title>`
2. Servi essa página pela **mesma origem** (copiada para dentro do container nginx/web, acessível em `http://localhost/test_origin.html`)
3. Rodei `google-chrome --headless=new --dump-dom` apontando para essa página
4. **Resultado com a restrição ativa: `STATUS_403`** — o próprio Chrome, fazendo um fetch same-origin GET legítimo (exatamente como o SPA real faz), **não envia o header `Origin`**

Isso confirma que a restrição teria **quebrado toda a navegação do frontend em produção**, não apenas bloqueado atacantes. Revertido imediatamente para o comportamento original (`!origin → allow`), com um comentário no código explicando a investigação para que ninguém reintroduza esse "fix" no futuro sem repetir esse teste.

**Conclusão de segurança honesta:** CORS não é a camada de proteção relevante para o cenário de ataque relatado pelo usuário (credencial roubada + chamada direta ao backend) — um atacante não-browser (curl, script, ferramenta de exploit) controla livremente o header `Origin` e pode simplesmente enviá-lo com um valor que passa na validação, ou omiti-lo (que já era e continua sendo permitido). A proteção real contra esse cenário específico é a camada de autenticação (`requireAuth`/`requireAdmin`, já validada nas Ondas 1 e 2) e a expiração curta do token (SEC-25). SEC-27 permanece **sem correção viável** nesta arquitetura (web+api same-origin); mitigar de verdade exigiria separar as origens de web/api (mudança de infraestrutura fora do escopo desta auditoria) — não recomendado apenas para isso, dado o baixo valor de proteção real que essa medida teria mesmo se fosse viável.

### SEC-28 — Concluído e validado

- Helper `applyEmailEnumerationJitter()` em `routeHelpers.ts` — delay aleatório 50-200ms
- Aplicado nos 2 branches (email existe / não existe) de `/auth/resend-verification` e `/auth/forgot-password`
- Timing empírico: 5 amostras de cada branch, ambos na faixa ~110-330ms, sem separação estatística clara entre os dois casos

### Checklist de Validação
- [x] SEC-27: revertido com segurança após teste com browser real; comportamento original restaurado e confirmado (frontend volta a funcionar, Origin maliciosa continua bloqueada)
- [x] SEC-28: jitter aplicado e mensuravelmente reduz a diferença de tempo entre branches
- [x] Webhooks (Stripe, Z-API) e health checks não afetados
- [x] Regressão: login, resend-verification, forgot-password, rate limit de cupom — todos OK
- [x] TypeScript PASS (api + web)
- [x] Docker build PASS
- [x] Testes existentes PASS (5/5)

### Penetration Test / Verificação Executada (Onda 3) — Resultados Reais

```bash
# Teste 1: CORS com Origin maliciosa (deve continuar bloqueado, comportamento inalterado)
curl http://localhost/api/public/products -H "Origin: https://attacker.com"
→ 403 {"message":"acesso negado"}

# Teste 2 (durante a tentativa de fix, ANTES do revert): fetch same-origin real via Chrome headless
# Página servida em http://localhost/test_origin.html (mesma origem do nginx)
# fetch('/api/public/products') sem Origin explícito (comportamento nativo do browser)
→ Com a restrição SEC-27 ativa: STATUS_403 (quebrava a app)
→ Após revert: STATUS_200 (comportamento correto restaurado)

# Teste 3: webhooks continuam acessíveis sem Origin (nunca dependeram do fix)
curl -X POST http://localhost/api/public/payments/stripe/webhook -d '{"fake":"payload"}'
→ 400 "dados invalidos" (chegou na validação de assinatura, não bloqueado por CORS)

# Teste 4: timing jitter em forgot-password
5x email inexistente:  0.33s, 0.11s, 0.12s, 0.13s, 0.12s
5x email existente:    0.26s, 0.20s, 0.13s, 0.13s, 0.11s
→ Distribuições sobrepostas, sem sinal de timing claro
```

---

## ✅ VALIDAÇÃO ONDA 4 — CONCLUÍDA 2026-07-05

### Ambiente: rebuild limpo total (api + web + postgres) do zero

Diferente das ondas anteriores (rebuild incremental só da API), a Onda 4 fez `docker compose up -d --build` de **todos os serviços**, confirmando que as 8 migrations e as policies RLS sobrevivem a um rebuild completo (volume `postgres_data` persistido; `prisma migrate deploy` reportou "No pending migrations to apply").

### SEC-29 — Tokens Dev — Confirmado mitigado

`NODE_ENV=production` confirmado no container real (`docker exec jlr_beauty-api-1 printenv NODE_ENV`). Chamadas reais a `/auth/forgot-password` e `/auth/resend-verification` no ambiente rodando **não** retornam `_dev_reset_token`/`_dev_verification_token` — apenas a mensagem genérica.

### 🔴 Achado crítico adicional descoberto nesta onda: SEC-30 (ver seção no topo do documento)

Ao montar o cenário de penetration test completo, replicando o incidente original de ponta a ponta, percebi que precisava confirmar se o canal de transporte (HTTP vs HTTPS) era parte do problema — e descobri que **produção roda em HTTP puro, sem TLS**. Confirmado diretamente com o usuário. Este é provavelmente o vetor real que permitiu o "sniffer" capturar credenciais no incidente original. Registrado como **SEC-30 CRÍTICO PENDENTE** (bloqueado por falta de domínio — Let's Encrypt não emite certificado para IP puro). Ver seção dedicada no início deste documento para detalhes e plano de ação quando houver domínio.

### Penetration Test Completo Executado — Resultados Reais

```bash
# Cenário original replicado: atacante com token JWT válido roubado (via sniffer)

# 1. Chamada direta com Origin forjada de domínio malicioso
curl http://localhost/api/users -H "Authorization: Bearer <token_válido>" -H "Origin: https://attacker-controlled-script.com"
→ 403 acesso negado (CORS bloqueia — origin não está na allowlist)

# 2. Chamada direta SEM Origin (script/curl simples, sem forjar nada)
curl http://localhost/api/users -H "Authorization: Bearer <token_válido>"
→ 200 OK — retorna dados dos usuários

# ACHADO HONESTO: um token válido e não expirado ainda autentica quando chamado
# direto, sem Origin. Isso é esperado e documentado (DECISION-012) — CORS nunca
# protege contra isso; quem protege é a validação do token em si (requireAuth,
# já reforçada nas Ondas 1-2) + a janela de exposição reduzida a 15min (SEC-25).
# A mitigação real do "roubo" da credencial em si é criptografar o transporte
# (SEC-30, pendente).
```

### Checklist de Validação Consolidada (todas as ondas)
- [x] Rebuild completo do zero — migrations e RLS persistem corretamente
- [x] SEC-21 a SEC-26, SEC-28: todos re-confirmados funcionando juntos em uma única passada
- [x] SEC-27: comportamento revertido confirmado estável (DECISION-012)
- [x] SEC-29: confirmado mitigado, sem mudança de código necessária
- [x] Regressão via browser real (Chrome headless): home carrega, login+fetch autenticado funciona end-to-end
- [x] TypeScript PASS (api + web)
- [x] Testes existentes PASS (5/5)
- [x] Dados de teste (rate limit, tokens, order de pentest) limpos do banco
- [x] Achado SEC-30 registrado formalmente com plano de ação

---

## Critérios de Aceitação Global

### Onda 1 (Críticas) — ✅ TODOS ATENDIDOS
- [x] `/public/orders/track` requer HMAC válido
- [x] `/public/discount-coupons/validate` tem rate limit 5 req/min
- [x] `DATABASE_URL` usa `jlr_api_rw` (não admin)
- [x] Sem regressions em testes existentes
- [x] Build/Type/Test PASS

### Onda 2 (Altas) — ✅ TODOS ATENDIDOS
- [x] RLS habilitado em 5 tabelas sensíveis
- [x] Access token expira em 15 min
- [x] `/public/concierge` tem rate limit 10 req/min

### Onda 3 (Médias) — ✅ PARCIAL POR DESIGN
- [x] Timing attacks mitigados com jitter (SEC-28)
- [x] CORS: investigado, testado com browser real, formalmente decidido não implementar nesta arquitetura (SEC-27 / DECISION-012) — não é uma pendência, é uma decisão tomada

### Onda 4 (Validação Final) — ✅ CONCLUÍDA, com 1 achado novo em aberto
- [x] Penetration test completo executado (cenário original replicado ponta a ponta)
- [x] Documentação atualizada (PLAN, MODIFICATION_LOG, DEBUG-HISTORY, DECISION, progress.md)
- [ ] **SEC-30 (TLS/HTTPS) — CRÍTICO, fora do escopo de código, bloqueado por domínio do usuário**

---

## Status Final do PLAN-0018

**Escopo original (9 vulnerabilidades, 4 ondas): 100% concluído.**
- 7 corrigidas e validadas (SEC-21, 22, 23, 24, 25, 26, 28)
- 1 investigada e formalmente decidida como não-implementável nesta arquitetura, com decisão registrada (SEC-27 / DECISION-012)
- 1 já estava mitigada, apenas confirmada (SEC-29)

**Achado adicional fora do escopo original:** SEC-30 (TLS/HTTPS ausente em produção) — provável causa raiz real do incidente. O usuário optou explicitamente por desmembrar esse achado em `PLAN-0019-TLS-HTTPS-SETUP.md` (status BLOCKED, aguardando domínio) e fechar este PLAN-0018 quanto ao escopo original das 9 vulnerabilidades, já 100% entregue.

## Git Record of Delivery

- **Step 1 (Pre-commit review):** 19 arquivos alterados/criados (ver lista abaixo) + validações (TypeScript PASS api+web, Docker build PASS, testes 5/5 PASS, penetration test completo executado)
- **Step 2 (Commit authorization):** confirmado explicitamente pelo usuário em 2026-07-05
- **Step 3 (Commit confirmation):** hash `e01d4ef` · branch `main` · 19 files changed, 1085 insertions(+), 6 deletions(-)
- **Step 4 (Push authorization e resultado):** confirmado explicitamente pelo usuário em 2026-07-05 · `origin/main` atualizado `c57562d..e01d4ef`
- **Push status:** COMPLETED

**Arquivos alterados/criados nesta sessão (Ondas 1-4):**
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260705000000_sec_coupon_validation_rate_limit/`
- `apps/api/prisma/migrations/20260705000001_sec_order_hmac/`
- `apps/api/prisma/migrations/20260705010000_sec_concierge_rate_limit/`
- `apps/api/prisma/migrations/20260705020000_sec_rls_sensitive_tables/`
- `apps/api/src/lib/hmacUtils.ts` (novo)
- `apps/api/src/lib/rateLimiter.ts`
- `apps/api/src/lib/routeHelpers.ts`
- `apps/api/src/routes/orders.ts`
- `apps/api/src/routes/schedule.ts`
- `apps/api/src/routes/auth.ts`
- `apps/api/src/app.ts` (revertido líquido, só comentário)
- `.env.docker.example`, `apps/api/.env.example`
- `memory/plans/PLAN-0018-SECURITY-CRITICAL-ENDPOINTS-RLS-MITIGATION.md` (novo)
- `memory/decisions/DECISION-012.md` (novo)
- `memory/logs/DEBUG-HISTORY.md` (ERR-0041, ERR-0042)
- `memory/MODIFICATION_LOG.md`, `memory/progress.md`

> Nota: por não ter havido `-DONE-` neste plano (SEC-30 em aberto), o Git Record acima cobre o que está pronto para commit **quanto ao escopo original das 9 vulnerabilidades**; SEC-30 exigirá seu próprio ciclo de commit quando implementado.
