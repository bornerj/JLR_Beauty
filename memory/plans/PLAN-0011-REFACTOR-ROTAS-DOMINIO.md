# PLAN-0011 — Refactor de Rotas por Domínio

Status: AGUARDANDO APROVAÇÃO
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

### Fase 0 — Extração de helpers (sem tocar rotas)
- [ ] 1. Criar `apps/api/src/lib/routeHelpers.ts` — mover: `withDetail`, `parseOptionalDate`, `parseIsoDateStart`, `addDays`, `clockToMinutes`, `fieldLabels`, `translateZodMessage`, `formatZodDetail`, `urlOrPathSchema`, `normalizeNullableText`, `asInputJsonObject`
- [ ] 2. Criar `apps/api/src/lib/rateLimiter.ts` — mover: `LoginAttemptState`, `loginAttemptStore`, `checkLoginAttemptBlock`, `registerFailedLoginAttempt`, `clearFailedLoginAttempts`, `buildLoginAttemptKey`, `normalizeIdentifierForRateLimit`, `getClientIp`, `cleanupLoginAttemptStore` + constantes de config
- [ ] 3. Criar `apps/api/src/lib/uploadHandler.ts` — mover: configuração multer (`upload`, `uploadDir`)
- [ ] 4. Criar `apps/api/src/lib/currencyUtils.ts` — mover: `toDecimalNumber`, `roundCurrency`, `parseDateFieldInput`, `calculateCouponDiscount`, `getCouponValidationError`, `calculateCheckoutShipping`, `buildOrderPublicCode`, `sanitizeNonNegative`, `parseNumericSettingValue`, `readCheckoutShippingPolicy`
- [ ] 5. Criar `apps/api/src/lib/fulfillmentUtils.ts` — mover: `getNextFulfillmentStatus`, `appendOrderStatusHistory`, `restockOrderProducts`, `cancelOrderWithOptionalRestock`, `markOrderAsPaid`
- [ ] 6. Criar `apps/api/src/lib/webhookParser.ts` — mover: `parseZApiWebhookMessage` e tipos auxiliares (`ParsedWebhookMessage`, `UnknownRecord`, `asRecord`, `valueAsString`, `valueAsBoolean`, `getNested`, `pickStringFromPaths`, `pickBooleanFromPaths`, `normalizeWebhookPhone`)
- [ ] 7. Atualizar imports em `routes/index.ts` para apontar para os novos libs
- [ ] 8. `npm run build` em apps/api — deve passar ✅

### Fase 1 — auth.ts
- [ ] 9. Criar `apps/api/src/routes/auth.ts` com as 3 rotas de auth + rateLimiter importado
- [ ] 10. Remover essas rotas de `routes/index.ts`, adicionar `router.use(authRoutes)`
- [ ] 11. `npm run build` ✅

### Fase 2 — webhooks.ts
- [ ] 12. Criar `apps/api/src/routes/webhooks.ts` (Z-API webhook)
- [ ] 13. Remover de `routes/index.ts`, adicionar `router.use(webhookRoutes)`
- [ ] 14. `npm run build` ✅

### Fase 3 — catalog.ts
- [ ] 15. Criar `apps/api/src/routes/catalog.ts` (products, services, categories, statuses, units)
- [ ] 16. Remover de `routes/index.ts`, adicionar `router.use(catalogRoutes)`
- [ ] 17. `npm run build` ✅

### Fase 4 — subscriptions.ts
- [ ] 18. Criar `apps/api/src/routes/subscriptions.ts` (memberships, subscriptions, leads)
- [ ] 19. Remover de `routes/index.ts`, adicionar `router.use(subscriptionRoutes)`
- [ ] 20. `npm run build` ✅

### Fase 5 — schedule.ts
- [ ] 21. Criar `apps/api/src/routes/schedule.ts` (appointments, professionals, shifts, customers, concierge)
- [ ] 22. Remover de `routes/index.ts`, adicionar `router.use(scheduleRoutes)`
- [ ] 23. `npm run build` ✅

### Fase 6 — orders.ts
- [ ] 24. Criar `apps/api/src/routes/orders.ts` (orders, fulfillment, Stripe checkout, payments)
- [ ] 25. Remover de `routes/index.ts`, adicionar `router.use(orderRoutes)`
- [ ] 26. `npm run build` ✅

### Fase 7 — users.ts
- [ ] 27. Criar `apps/api/src/routes/users.ts`
- [ ] 28. Remover de `routes/index.ts`, adicionar `router.use(userRoutes)`
- [ ] 29. `npm run build` ✅

### Fase 8 — admin.ts
- [ ] 30. Criar `apps/api/src/routes/admin.ts` (KPIs, branding, media slots, section toggles, uploads, checkout delivery, discount coupons, public endpoints)
- [ ] 31. Remover de `routes/index.ts`, adicionar `router.use(adminRoutes)`
- [ ] 32. `npm run build` ✅

### Fase 9 — Validação final
- [ ] 33. `routes/index.ts` deve ter ≤ 60 linhas (só imports e router.use())
- [ ] 34. `npm test` em apps/api — testes existentes passam
- [ ] 35. `npm run lint` em apps/web — zero erros (não foi alterado, verificação preventiva)
- [ ] 36. `docker-compose up` — sistema completo funciona após refactor
- [ ] 37. Smoke test manual: login, listar produtos, criar pedido, ver agenda

---

## Validation

- [ ] `wc -l apps/api/src/routes/index.ts` ≤ 60
- [ ] `ls apps/api/src/routes/` mostra 9 arquivos de domínio + index.ts
- [ ] `npm run build` em apps/api: exit 0
- [ ] `npm test` em apps/api: todos passam
- [ ] `docker-compose up` após refactor: sistema funcional
- [ ] Nenhuma lógica de negócio foi alterada (grep por funções críticas confirma presença nos novos arquivos)

---

## Continuidade

- Último passo concluído: aguardando aprovação do usuário
- Próximo passo planejado: item 1 (criar routeHelpers.ts)

---

## Registro Git da Entrega

*(a preencher após execução)*

- Passo 1 (Revisão pré-commit): —
- Passo 2 (Autorização de commit): —
- Passo 3 (Confirmação do commit): —
- Passo 4 (Autorização e resultado do push): —
- Status do push: PENDENTE
