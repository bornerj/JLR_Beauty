# PLAN-0017 — Revisão de Segurança: Autenticação e PostgreSQL

**Status:** IN PROGRESS — Fase 1 CONCLUÍDA · Fases 2–4 pendentes (retomar próxima sessão)
**Data:** 2026-06-21
**Agente:** security-auditor
**Escopo:** apps/api — autenticação, autorização, PostgreSQL, headers HTTP

---

## O que já está bem (não mexer sem motivo)

| Item | Avaliação |
|------|-----------|
| JWT secret ≥ 32 chars enforced no startup | ✅ Correto |
| bcryptjs rounds=10 | ✅ Aceitável (aumentar para 12 na Fase 1) |
| Rate limiter IP+identifier (composto) | ✅ Boa lógica — problema é o armazenamento (ver abaixo) |
| Middleware re-valida usuário no banco em toda requisição | ✅ Defense-in-depth |
| Verificação de status ATIVO antes de autorizar | ✅ Correto |
| CORS com allowedOrigins explícito + aviso se vazio em produção | ✅ Correto |
| `detail` oculto em erros 500 em produção | ✅ Correto |
| Zod em todos os endpoints de auth | ✅ Correto |
| `isStrongPassword` no registro | ✅ Correto |

---

## Lacunas identificadas — por severidade

### 🔴 CRÍTICO / ALTO

| ID | Lacuna | Risco | Onde |
|----|--------|-------|------|
| SEC-01 | Rate limiter em memória (`new Map`) — reseta no restart do container, não funciona com múltiplas instâncias | Attacker pode resetar bloqueio via restart; sem proteção real em produção | `lib/rateLimiter.ts` |
| SEC-02 | Login por `name` sem unique constraint — `findFirst` retorna resultado não-determinístico se dois usuários tiverem o mesmo nome | Usuário errado pode ser autenticado | `routes/auth.ts:50-53` |
| SEC-03 | `emailVerified` não é verificado no login | Registro com email alheio permite acesso antes da verificação | `routes/auth.ts` + `User` model |
| SEC-04 | Sem mecanismo de logout / revogação de token | Token roubado permanece válido até expirar (12h) | Toda a camada auth |
| SEC-05 | Roles MANAGER e PROFESSIONAL sem guard dedicado — rotas que deveriam ser MANAGER-only usam `requireAuth` (permissivo demais) ou `requireAdmin` (restritivo demais) | Escalada de privilégio horizontal | `middleware/auth.ts` |
| SEC-06 | Um único `DATABASE_URL` com acesso total ao banco — violação do princípio de mínimo privilégio | Se a API for comprometida, o atacante tem acesso total ao PostgreSQL | `lib/prisma.ts` / env |

### 🟡 MÉDIO

| ID | Lacuna | Risco | Onde |
|----|--------|-------|------|
| SEC-07 | Sem Helmet.js — apenas 3 headers manuais. Faltam: CSP, Permissions-Policy, HSTS, X-XSS-Protection | Exposição a clickjacking avançado, MIME sniffing, falta de HSTS | `app.ts` |
| SEC-08 | Sem Row-Level Security (RLS) no PostgreSQL — controle de acesso apenas na camada de aplicação | Se a app for bypassada, dados estão expostos diretamente no DB | schema / PostgreSQL |
| SEC-09 | Sem tabela de `AuditLog` — eventos de segurança (login, troca de role, reset de senha) não são persistidos | Sem rastreabilidade pós-incidente | schema.prisma |
| SEC-10 | `rawPayload: Json?` no model Payment — armazena payload bruto do Stripe com potencial PII e dados de método de pagamento | Exposição de dados sensíveis no banco | schema.prisma |
| SEC-11 | Sem `pg_audit` ou logging nativo do PostgreSQL configurado | Nenhuma evidência de tentativas de acesso direto ao banco | docker/postgres config |
| SEC-12 | `X-Forwarded-For` lido diretamente sem `app.set('trust proxy', 1)` — pode ser falsificado por atacante para bypassar rate limiting por IP | Rate limit por IP pode ser burlado | `lib/rateLimiter.ts` + `app.ts` |
| SEC-13 | Sem rate limiting no `/auth/register` — pode ser inundado para enumeração de emails (timing attack) ou flood de usuários | Enumeração + DoS leve | `routes/auth.ts` |
| SEC-14 | Sem HTTPS/HSTS enforçado na camada da API | Downgrade attack se proxy não forçar TLS | `app.ts` |

### 🔵 BAIXO / BEST PRACTICE

| ID | Lacuna | Risco | Onde |
|----|--------|-------|------|
| SEC-15 | `passwordHash: String?` nullable — intenção não documentada | Usuários sem senha podem confundir lógica de auth | schema.prisma |
| SEC-16 | Sem fluxo de reset de senha — admin precisa intervir manualmente | Operacional + risco de social engineering | Ausente |
| SEC-17 | Sem MFA para roles MASTER/ADMIN | Sem 2ª camada para contas privilegiadas | Ausente |
| SEC-18 | Algorithm JWT não especificado explicitamente (`jwt.sign` default HS256) | Má prática; deve ser explícito para prevenir algorithm confusion | `lib/auth.ts` |
| SEC-19 | bcrypt rounds=10 — funcional mas 12 é o padrão atual recomendado | Levemente mais vulnerável a brute force offline | `lib/auth.ts` |
| SEC-20 | Health endpoint `/health/services` expõe status de nginx, api, web, postgres sem autenticação | Information disclosure para reconhecimento | `app.ts` |

---

## Fases de execução

### ✅ Fase 1 — Fundação (Críticos) — CONCLUÍDA 2026-06-21 · commit e368173

**SEC-12** — Configurar `trust proxy` antes de tudo (pré-requisito para SEC-01 funcionar corretamente)
```ts
app.set('trust proxy', 1); // antes dos middlewares
```

**SEC-01** — Substituir Map in-memory por rate limiter persistido no PostgreSQL
- Criar tabela `LoginAttempt` no Prisma: `key`, `failures`, `windowStartedAt`, `blockedUntil`, `updatedAt`
- Substituir `loginAttemptStore: Map` por queries Prisma
- Adicionar cron ou trigger de limpeza (TTL automático)

**SEC-02** — Remover login por `name`
- Aceitar apenas `email` como identificador
- Atualizar `authSchema` para validar formato de email obrigatório

**SEC-05** — Adicionar guards para MANAGER e PROFESSIONAL
```ts
export async function requireManager(...)  // MASTER | ADMIN | MANAGER
export async function requireProfessional(...) // todos exceto CLIENT
```
- Auditar todas as rotas e aplicar o guard correto

**SEC-19** — Aumentar bcrypt rounds de 10 para 12
**SEC-18** — Explicitar `algorithm: 'HS256'` no `jwt.sign`

---

### ⏳ Fase 2 — Controle de sessão e tokens — PENDENTE (próxima sessão)

**SEC-04** — Implementar refresh token + logout
- Criar model `RefreshToken`: `userId`, `token` (hash), `expiresAt`, `revokedAt`
- Access token: 15 minutos
- Refresh token: 7 dias, armazenado em HttpOnly cookie
- Endpoints: `POST /auth/refresh`, `POST /auth/logout`

**SEC-03** — Enforçar `emailVerified` no login
- Bloquear login de usuários com `emailVerified: false` (exceto se estiver se registrando agora)
- Implementar `POST /auth/verify-email` com token de tempo limitado (15 min)
- Implementar `POST /auth/resend-verification`

**SEC-13** — Rate limiting no `/auth/register` (reusar a infraestrutura da Fase 1)

---

### ⏳ Fase 3 — PostgreSQL e headers — PENDENTE

**SEC-07** — Instalar e configurar Helmet.js
```ts
import helmet from 'helmet';
app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], ... } },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));
```

**SEC-06** — Segregação de credenciais PostgreSQL
- Criar user `jlr_api_rw` (INSERT/UPDATE/SELECT nos dados operacionais)
- Criar user `jlr_api_ro` (SELECT only — para relatórios/leitura pública)
- Manter user `jlr_migration` (CREATE/ALTER — apenas para migrations)
- Configurar via `DATABASE_URL`, `DATABASE_RO_URL`, `DATABASE_MIGRATION_URL`

**SEC-08** — Row-Level Security (RLS) nas tabelas sensíveis
- Habilitar `ALTER TABLE "User" ENABLE ROW LEVEL SECURITY`
- Habilitar em: `Payment`, `Customer`, `Subscription`, `Order`
- Políticas: `jlr_api_rw` pode acessar todos os registros (current_user check)
- Prisma: usar extensão `prisma.$executeRaw` para set_config de contexto de usuário

**SEC-11** — Configurar pg_audit no PostgreSQL
- Adicionar ao `postgresql.conf` via docker: `shared_preload_libraries = 'pgaudit'`
- Configurar `pgaudit.log = 'ddl, role, connection'`

**SEC-20** — Proteger health endpoints
- `/health/services` e `/health/db`: restringir por IP de rede interna ou adicionar `requireAdmin`

---

### ⏳ Fase 4 — Auditoria e boas práticas — PENDENTE

**SEC-09** — Criar tabela `AuditLog`
```prisma
model AuditLog {
  id        Int      @id @default(autoincrement())
  userId    Int?
  action    String   // LOGIN, LOGOUT, LOGIN_FAILED, ROLE_CHANGE, PASSWORD_RESET, etc.
  ip        String?
  userAgent String?
  meta      Json?
  createdAt DateTime @default(now())
  @@index([userId, createdAt])
  @@index([action, createdAt])
}
```
- Registrar: login bem-sucedido, login falho, logout, troca de role, reset de senha

**SEC-10** — Sanitizar `rawPayload` do Stripe
- Remover campos de PII antes de salvar: `billing_details`, `customer`, `metadata.email`
- Manter apenas: `id`, `type`, `amount`, `status`, `created`

**SEC-16** — Implementar fluxo de reset de senha
- `POST /auth/forgot-password` → gera token hash, envia email
- `POST /auth/reset-password` → valida token (max 1 uso, 15 min), atualiza hash

**SEC-17** — Planejar MFA (TOTP) para MASTER/ADMIN
- Pesquisar `otplib` + QR code provisioning
- Pode ser Fase 5 separada dado o escopo

**SEC-15** — Documentar/enforçar `passwordHash` como obrigatório
- Adicionar `NOT NULL` constraint ou comentário claro se OAuth for planejado

---

## Critérios de aceitação

- [ ] Rate limiter persiste entre restarts de container
- [ ] Login por nome removido
- [ ] Guards de role completos para todos os 5 roles
- [ ] Access token ≤ 15min + refresh token revogável
- [ ] Logout funcional (revoga refresh token)
- [ ] Helmet.js configurado com CSP + HSTS
- [ ] PostgreSQL com ≥ 2 usuários segregados
- [ ] RLS habilitado nas 4 tabelas sensíveis
- [ ] AuditLog registra todos os eventos de autenticação
- [ ] rawPayload sanitizado antes de persistir
- [ ] Fluxo de reset de senha funcional
- [ ] TypeScript PASS · Build PASS em cada fase

---

## Estimativa geral

| Fase | Foco | Sessões |
|------|------|---------|
| 1 | Rate limit persistido, guards, bcrypt | 1 |
| 2 | Refresh token, logout, email verify | 1 |
| 3 | Helmet, segregação DB, RLS, pg_audit | 1–2 |
| 4 | AuditLog, rawPayload, reset senha | 1 |
| **Total** | | **4–5 sessões** |
