# PLAN-0011 — Refactor de Rotas por Domínio

Status: VALIDADO — AGUARDANDO COMMIT
Data de abertura: 2026-06-10
Pré-requisito: PLAN-0010 concluído (Docker + PostgreSQL funcionando)
Contexto: `apps/api/src/routes/index.ts` tem 6.650 linhas e 130 definições de rotas.
O objetivo é dividir em ~9 arquivos por domínio, preservando exatamente o comportamento
atual. Nenhuma lógica de negócio é alterada — só organização e separação física.
Helpers compartilhados são extraídos para lib/.

## STAR

**Situation**
O arquivo `routes/index.ts` é um God File que mistura schemas Zod, helpers utilitários,
rate limiting, acesso direto ao Prisma e todos os 130 handlers de rota. Qualquer
modificação toca o mesmo arquivo, gerando risco de conflito e dificultando testes.
A correção de section toggles (PLAN-0010) já reduz ~70 linhas. Upload ainda usa fs.

**Task**
Dividir o arquivo em domínios sem alterar comportamento. Escopo: separação mínima por
domínio (não criamos camada service/repository neste plano — isso fica para futuro
PLAN-0012 se necessário).

**Action**
Extrair helpers compartilhados, depois mover rotas por domínio, um arquivo por vez,
validando build após cada domínio. O arquivo original se torna um aggregator simples.

**Result**
`routes/index.ts` com ~50 linhas (só imports e router.use()). 9 arquivos de domínio
com responsabilidade clara. Build e testes passando.

---

## Estrutura Alvo

```
apps/api/src/routes/
├── index.ts                    (~50 linhas — aggregator)
├── auth.ts                     (login, register, /me)
├── users.ts                    (CRUD usuários, role, avatar)
├── catalog.ts                  (products, services, categories, statuses)
├── orders.ts                   (pedidos, fulfillment, batch, Stripe checkout)
├── schedule.ts                 (appointments, professionals, shifts, concierge)
├── subscriptions.ts            (memberships, subscriptions, leads)
├── admin.ts                    (KPIs, branding, media slots, section toggles, uploads)
└── webhooks.ts                 (Stripe webhook, Z-API webhook)

apps/api/src/lib/
├── routeHelpers.ts             (withDetail, parseOptionalDate, parseIsoDateStart,
│                                formatZodDetail, translateZodMessage, fieldLabels,
│                                clockToMinutes, normalizeNullableText, etc.)
├── rateLimiter.ts              (loginAttemptStore, checkLoginAttemptBlock,
│                                registerFailedLoginAttempt, clearFailedLoginAttempts)
├── uploadHandler.ts            (multer config — extração do setup de upload)
└── currencyUtils.ts            (toDecimalNumber, roundCurrency, parseDateFieldInput,
                                 calculateCouponDiscount, getCouponValidationError,
                                 calculateCheckoutShipping, buildOrderPublicCode)
```

---

## Escopo

**In:**
- Extração de helpers compartilhados para `apps/api/src/lib/`
- Divisão de `routes/index.ts` em 9 arquivos de domínio
- `routes/index.ts` vira aggregator (router.use())
- Validação de build após cada domínio movido
- Validação de testes existentes (npm test em apps/api)

**Out:**
- Criação de camada service/repository (future PLAN-0012)
- Alteração de lógica de negócio
- Novos endpoints ou mudança de contratos de API
- Alteração de schemas Zod (só movidos de lugar)
- Alterações no frontend

---

## Mapa de Rotas por Domínio

### auth.ts (~3 rotas)
- POST /auth/login
- POST /auth/register
- GET /auth/me

### users.ts (~5 rotas)
- GET /users
- POST /users
- GET /users/:id
- PATCH /users/:id
- DELETE /users/:id

### catalog.ts (~20 rotas)
- GET/POST/PATCH/DELETE /product-categories
- GET/POST/PATCH/DELETE /service-categories
- GET/POST/PATCH/DELETE /product-statuses
- GET/POST/PATCH/DELETE /service-statuses
- GET/POST/PATCH/DELETE /products
- GET/POST/PATCH/DELETE /services
- GET /units

### orders.ts (~15 rotas)
- GET/POST /orders
- GET/PATCH /orders/:id
- PATCH /orders/:id/fulfillment
- POST /orders/bulk-advance
- GET /public/orders/summary
- POST /public/payments/stripe/checkout
- GET /public/payments/stripe/confirm
- POST /public/payments/stripe/cancel-pending
- POST /public/payments/intent (legado)
- PATCH /payments/:id

### schedule.ts (~25 rotas)
- GET/POST/PATCH/DELETE /appointments
- GET/POST /appointments/waitlist
- GET/POST/PATCH/DELETE /professionals
- POST /professionals/:id/link-user
- PATCH /professionals/:id/services
- GET/POST/PATCH/DELETE /professional-shifts
- GET/POST/PATCH/DELETE /professional-commission-profiles
- GET/POST/PATCH/DELETE /professional-work-profiles
- GET/POST/PATCH/DELETE /customers

### subscriptions.ts (~10 rotas)
- GET/POST/PATCH/DELETE /memberships
- GET/POST/PATCH/DELETE /subscriptions
- GET/POST/PATCH /franchise-leads
- POST /public/subscriptions

### admin.ts (~20 rotas)
- GET/POST /admin/dashboard/kpis (e variantes)
- GET/PUT /admin/branding
- GET/PUT /admin/media-slots
- GET/PUT /admin/section-toggles (versão simplificada — PLAN-0010)
- GET/PUT /admin/checkout-delivery
- GET/PUT /admin/discount-coupons
- POST /uploads
- GET/PUT /public/branding
- GET /public/media-slots
- GET /public/section-toggles
- GET /public/memberships
- GET /public/services
- GET /public/products
- GET /public/concierge/context

### webhooks.ts (~2 rotas)
- POST /public/webhooks/zapi
- POST /public/payments/stripe/webhook (já está em app.ts — confirmar)

### schedule.ts — concierge (~10 rotas)
- POST /public/concierge/complete
- GET /public/concierge/availability
- GET /public/concierge/periods
- GET /public/concierge/slots
- GET /public/concierge/slot-professionals
- POST /public/concierge/book
- POST /public/concierge/waitlist
- POST /public/concierge/whatsapp-summary
- GET /admin/concierge/sessions
- GET /admin/concierge/inbox

---

## Action Items

### Fase 0 — Extração de helpers
- [x] 1. `apps/api/src/lib/routeHelpers.ts` criado ✅
- [x] 2. `apps/api/src/lib/rateLimiter.ts` criado ✅
- [x] 3. `apps/api/src/lib/uploadHandler.ts` criado ✅
- [x] 4. `apps/api/src/lib/currencyUtils.ts` criado ✅
- [x] 5. `apps/api/src/lib/fulfillmentUtils.ts` criado ✅
- [x] 6. `apps/api/src/lib/webhookParser.ts` criado ✅
- [x] 7. Imports atualizados nos domain routes ✅
- [x] 8. `npm run build` — exit 0 ✅

### Fase 1 — auth.ts
- [x] 9-11. `routes/auth.ts` criado, rotas movidas, build passou ✅

### Fase 2 — webhooks.ts
- [x] 12-14. `routes/webhooks.ts` criado, rotas movidas, build passou ✅

### Fase 3 — catalog.ts
- [x] 15-17. `routes/catalog.ts` criado, rotas movidas, build passou ✅

### Fase 4 — subscriptions.ts
- [x] 18-20. `routes/subscriptions.ts` criado, rotas movidas, build passou ✅

### Fase 5 — schedule.ts
- [x] 21-23. `routes/schedule.ts` criado, rotas movidas, build passou ✅

### Fase 6 — orders.ts
- [x] 24-26. `routes/orders.ts` criado, rotas movidas, build passou ✅

### Fase 7 — users.ts
- [x] 27-29. `routes/users.ts` criado, rotas movidas, build passou ✅

### Fase 8 — admin.ts
- [x] 30-32. `routes/admin.ts` criado, rotas movidas, build passou ✅

### Fase 9 — Validação final (2026-06-11)
- [x] 33. `wc -l routes/index.ts` = **23 linhas** ✅ (meta: ≤ 60)
- [x] 34. `npm test` em apps/api — 5/5 passaram ✅
- [x] 35. `npm run build` em apps/web — exit 0 ✅
- [x] 36. `docker compose up` — sistema funcional após refactor ✅
- [x] 37. Smoke test: login OK (role=ADMIN), GET /api/public/section-toggles OK ✅

---

## Validation

- [x] `wc -l routes/index.ts` = 23 ≤ 60 ✅
- [x] `ls routes/` — 9 arquivos de domínio + index.ts ✅
- [x] `npm run build` em apps/api — exit 0 ✅
- [x] `npm test` em apps/api — 5/5 ✅
- [x] `docker compose up` após refactor — sistema funcional ✅

---

## Continuidade

- Todas as fases concluídas em 2026-06-11
- Aguardando autorização de commit do usuário

---

## Registro Git da Entrega

- Passo 1 (Revisão pré-commit): ver seção abaixo
- Passo 2 (Autorização de commit): PENDENTE — aguardando usuário
- Passo 3 (Confirmação do commit): —
- Passo 4 (Autorização de push): —
- Status do push: PENDENTE
