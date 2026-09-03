# PLAN-0036 — Migração de Pagamentos: remover Stripe, integrar Mercado Pago (Checkout Pro) + dados de teste

**Status:** ✅ APROVADO (2026-09-02) — execução começa pela Onda 0 (bloqueante, depende do usuário)
**Data de abertura:** 2026-09-02
**Escopo macro:** `apps/api` (módulo `payments/stripe` → `payments/mercadopago`, ~15 pontos em `routes/orders.ts`, 1 model em `schema.prisma`, `app.ts`, env vars), `apps/web` (`CheckoutContent.tsx` reescrito, 2 arquivos com texto/comentário Stripe), `apps/web/e2e` (1 spec), `sfk.toml`/`.env.docker.example`/`docs/integrations/`.
**Decisão a registrar no fechamento:** `DECISION-021` (troca de provedor de pagamento — motivo, trade-offs, data).
**Agentes de apoio:** `@project-planner` (estrutura deste plano — skills `plan-writing`/`brainstorming`), `@backend-specialist` (arquitetura do módulo de pagamento — skill `api-patterns`), `@security-auditor` (validação de assinatura de webhook, segredos, superfície de ataque — skills `vulnerability-scanner`/`api-patterns`), `@test-engineer`/`@qa-automation-engineer` (matriz de cartões de teste + reescrita do e2e — skills `testing-patterns`/`webapp-testing`).

**Decisões do usuário que moldam este plano** (via `AskUserQuestion` nesta sessão):
1. **Checkout Pro** (página hospedada pelo Mercado Pago, redirect + retorno) — não Payment Brick embutido. Arquitetura fica muito próxima do padrão Stripe atual (troca quase 1:1 do fluxo de redirect).
2. **Conta/credenciais de teste do Mercado Pago ainda não existem** — este plano inclui a criação como Onda 0, bloqueante.
3. **Parcelamento: até 12x sem juros, custo assumido pela loja.**

---

## STAR

**Situation:** RAG desta sessão confirmou uma boa notícia arquitetural: o model `Payment` (schema.prisma) **já é agnóstico de provedor** — `provider: String`, `providerPaymentId: String?`, `rawPayload: Json?`. Isso foi projetado assim desde o `PLAN-0020`, sem saber que um dia trocaríamos de gateway. `markOrderAsPaid`/`cancelOrderWithOptionalRestock` (`apps/api/src/lib/fulfillmentUtils.ts`) são os 2 pontos únicos de baixa de estoque/mudança de status já reusados pelo webhook Stripe e pela venda manual — continuam sendo o choke-point, sem mudança. O único artefato genuinamente amarrado ao Stripe no schema é o model `StripeWebhookEvent` (ledger de idempotência de webhook). Todo o resto do fluxo de criação de pedido/reserva de estoque em `routes/orders.ts` (validação de itens, produtos, memberships, cupom, frete) é 100% reutilizável — só os ~50-80 linhas finais de cada rota (chamada ao SDK do provedor) mudam.

Achado colateral (RAG): `apps/web/src/modules/public-site/sections/CartModalSection.tsx:57` tem o texto `"Finalização segura com Stripe"` **hardcoded**, violando o próprio princípio de `content_architecture` do projeto (`sfk.toml` — nenhum texto de marketing deve ficar fora de `pageTexts`). Oportunidade de corrigir isso na mesma leva, já que o texto vai mudar de qualquer forma.

**Task:** (1) Remover o módulo Stripe por completo (código, dependência, env vars, textos). (2) Integrar Mercado Pago Checkout Pro cobrindo o mesmo fluxo (criar preferência → redirecionar → retorno → confirmação via webhook + endpoint de confirmação → cancelamento de pendência). (3) Preparar uma matriz de dados de teste (cartões oficiais de sandbox do MP) cobrindo aprovação, rejeição (múltiplos motivos) e parcelamento, documentada para uso manual e possível automação E2E.

**Action:** ver Ondas abaixo — cada uma independente o bastante para ser validada isoladamente (mesmo padrão dos `PLAN-0032`/`PLAN-0035`).

**Result esperado:** checkout público funcionando ponta a ponta com Mercado Pago (ambiente de teste), zero resíduo de Stripe no código/dependências/env vars, matriz de teste documentada e validada manualmente (E2E automatizado cobrindo pelo menos o fluxo de cancelamento, como cobria para Stripe), `tsc`/build/lint/testes limpos.

---

## Pesquisa Mercado Pago (fontes consultadas nesta sessão)

Acesso direto à documentação oficial (`developers.mercadopago.com`) funcionou parcialmente (uma URL retornou 404); complementado com os repositórios oficiais no GitHub, como você sugeriu.

| Fonte | O que confirma |
|---|---|
| [github.com/mercadopago/sdk-nodejs](https://github.com/mercadopago/sdk-nodejs) | SDK oficial Node.js/TypeScript, pacote npm **`mercadopago`**, requer **Node 18+** (projeto já usa Node 20+). Inicialização via `new MercadoPagoConfig({ accessToken })`. |
| [github.com/mercadopago/sdk-js](https://github.com/mercadopago/sdk-js) / `sdk-react` | SDKs de frontend para **Bricks** — não necessários neste plano (Checkout Pro não usa Bricks). |
| [developers.mercadopago.com/.../checkout-pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/landing) | Fluxo Checkout Pro: criar **Preference** (`items`, `back_urls.{success,failure,pending}`, `notification_url`, `external_reference`, `payment_methods.installments`) → SDK retorna `init_point` (produção) e `sandbox_init_point` (teste, credenciais `TEST-`) → redirecionar o cliente. |
| Doc oficial de cartões de teste BR | Números de cartão (Mastercard/Visa/Amex/Elo) + CVV/validade fixos de sandbox + **códigos de nome do titular** para simular cada cenário (ver tabela na Onda 6). |
| [github.com/mercadopago/sdk-nodejs discussions #318](https://github.com/mercadopago/sdk-nodejs/discussions/318) + doc oficial "Ensure the validity of notifications" | Webhook assina via header `x-signature` (`ts=...,v1=...`) + `x-request-id`; validação é **HMAC-SHA256** de um *manifest* `id:{data.id};request-id:{x-request-id};ts:{ts};`, chave = segredo gerado no painel (`notification_url` → "Configurar assinatura secreta"). |

**Diferença arquitetural relevante vs. Stripe** (impacta o design do webhook): o Stripe manda o **payload completo** assinado no corpo do webhook (`constructEvent` já retorna o objeto pronto). O Mercado Pago manda só `{ type: "payment", data: { id } }` — o backend precisa, a cada notificação, fazer **`GET /v1/payments/{id}`** pra buscar o status real antes de decidir aprovar/cancelar. Isso é um padrão "notify-then-fetch", não "notify-with-payload". Precisa ficar explícito no código novo (mesmo formato de função `syncMercadoPagoPayment`, mas busca o pagamento antes de decidir).

---

## Inventário RAG (arquivos tocados, por área)

### Backend — módulo do provedor
- `apps/api/src/modules/payments/stripe/{client.ts,config.ts,index.ts,publicCheckout.ts}` (162 linhas) → **remover**, criar `apps/api/src/modules/payments/mercadopago/{client.ts,config.ts,index.ts,publicCheckout.ts}` no mesmo formato (SDK client singleton, config lida de env vars, funções `createPublicMercadoPagoPreference`/`retrieveMercadoPagoPayment`/`verifyMercadoPagoWebhookSignature`).
- `apps/api/package.json` — remover `"stripe": "^20.4.0"`, adicionar `"mercadopago"` (versão atual do SDK oficial, confirmar no `npm view mercadopago version` na hora da implementação).

### Backend — rotas (`apps/api/src/routes/orders.ts`, ~15 pontos de acoplamento)
- `POST /public/payments/stripe/checkout-session` → `POST /public/payments/mercadopago/checkout-preference` — mantém 100% da validação de itens/produtos/memberships/cupom/frete (não muda), só troca a chamada final (cria `Preference` em vez de `Checkout Session`) e a resposta (`initPoint`/`sandboxInitPoint` em vez de `checkoutUrl`).
- `GET /public/payments/stripe/confirm-session` → `GET /public/payments/mercadopago/confirm-payment` — recebe `paymentId` (query, MP devolve isso no `back_url` de retorno) em vez de `sessionId`.
- `POST /public/payments/stripe/cancel-pending` → `POST /public/payments/mercadopago/cancel-pending` — lógica idêntica, só troca `provider: "STRIPE"` → `provider: "MERCADOPAGO"`.
- `handleStripeWebhook` → `handleMercadoPagoWebhookNotification` — muda de "verificar assinatura sobre o body inteiro" pra "verificar assinatura HMAC do manifest + buscar pagamento por ID" (ver diferença arquitetural acima).
- `syncStripeCheckoutSessionPayment` → `syncMercadoPagoPayment`, `sanitizeStripeEvent` → `sanitizeMercadoPagoPayment` (mesmo padrão de sanitização antes de persistir no ledger).

### Backend — infra/config
- `apps/api/src/app.ts:100-104` — troca o path do webhook; avaliar durante a implementação se `express.raw()` ainda é necessário (o MP não exige body cru pra validar assinatura, diferente do Stripe — mas manter JSON parse padrão deve bastar; **decisão técnica a confirmar na Onda 2**, não travar o plano por isso agora).
- `apps/api/src/lib/currencyUtils.ts:194` — `buildStripeCancelUrlWithContext` → renomear pra `buildMercadoPagoCancelUrlWithContext` (função genérica, só o nome é Stripe).
- `apps/api/prisma/schema.prisma:445` — model `StripeWebhookEvent` → **generalizar** pra `PaymentWebhookEvent { provider, eventId, ... }` (migration aditiva: cria tabela nova, dropa a antiga, já que Stripe some por completo). Nome genérico escolhido deliberadamente alinhado ao princípio de portabilidade SaaS já declarado em `sfk.toml → [content_architecture]` (mesmo raciocínio do `DECISION-018`) — evita repetir o mesmo problema se um dia trocar de gateway de novo. **Ponto de validação com o usuário na apresentação do plano** (ver seção de perguntas abertas abaixo).

### Frontend
- `apps/web/src/components/pages/CheckoutContent.tsx` (~350 linhas tocadas de um arquivo maior) — reescreve `startStripeCheckout`→`startMercadoPagoCheckout` (redireciona pro `initPoint`/`sandboxInitPoint`), `confirmStripeSession`→`confirmMercadoPagoPayment`, `cancelPendingStripeOrder`→`cancelPendingMercadoPagoOrder`, chave de `localStorage` (`jlr_pending_stripe_order_checkout`→`jlr_pending_mercadopago_order_checkout`), query params de retorno (`stripeSessionId/stripeSuccess/stripeCanceled` → os que o MP anexa: `payment_id`/`status`/`external_reference`, mais um par local de sucesso/falha/pendente pros 3 `back_urls`).
- `apps/web/src/modules/public-site/sections/CartModalSection.tsx:57` — migra o texto hardcoded pra `pageTexts` (nova chave, ex. `public.checkout.secureBadge`) já com a marca trocada — corrige achado de `content_architecture` na mesma leva.
- `apps/web/src/admin-v2/operations/orders/components/ConfirmPaymentModal.tsx:6` — comentário desatualizado ("PIX fora do Stripe") → atualizar texto/contexto.

### E2E
- `apps/web/e2e/order-dashboard-lifecycle.spec.ts:123-301` — bloco que cria um `Payment` com `provider` fixo e chama `POST .../payments/stripe/cancel-pending` → reescrever pro endpoint Mercado Pago equivalente (mesma asserção, provider trocado).

### Config/infra/docs
- `.env.docker.example:38-44` — bloco `STRIPE_*` → `MERCADOPAGO_ENABLED`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY` (não estritamente necessário no Checkout Pro, mas mantido por padronização/possível uso futuro do Wallet Brick), `MERCADOPAGO_WEBHOOK_SECRET`, `MERCADOPAGO_CHECKOUT_SUCCESS_URL`, `MERCADOPAGO_CHECKOUT_FAILURE_URL`, `MERCADOPAGO_CHECKOUT_PENDING_URL` (Checkout Pro exige 3 `back_urls`, não 2 como o Stripe), `MERCADOPAGO_MAX_INSTALLMENTS` (default `12`).
- `sfk.toml` — `[[integrations]]` Stripe → Mercado Pago (nome, propósito, doc, webhook, env vars); `[environments.docker].vars` atualizado com a lista acima.
- `docs/integrations/mercadopago.md` (novo, mesmo padrão de `docs/integrations/WHATSAPP_API_ZAPI.md` já existente) — runbook: como gerar credenciais de teste no Painel de Desenvolvedores, como expor `notification_url` em ambiente de dev (túnel), tabela de cartões de teste, como alternar sandbox→produção.

---

## Fora de escopo (Out)
- **Payment Brick / checkout embutido** — descartado pela sua escolha (Checkout Pro).
- **PIX/boleto como itens formais da matriz de teste** — o Checkout Pro habilita automaticamente todos os meios disponíveis pra conta; este plano garante e valida **cartão de crédito parcelado**. PIX/boleto ficam disponíveis "de graça" pela própria página do MP, mas não entram na validação formal — podem ser conferidos como bônus se sobrar tempo, sem bloquear o fechamento do plano.
- **Configuração comercial do "parcelamento sem juros"** — o código prepara `payment_methods.installments` (até 12), mas se o custo do parcelamento é absorvido automaticamente pela loja ou depende de um programa/config adicional na conta MP em produção é algo a **confirmar no painel da conta real**, fora do alcance do código. Fica registrado como nota de risco, não como bloqueio.
- **Migração de dados históricos** — não existem pagamentos Stripe reais em produção ainda pendentes de reconciliação (a confirmar no início da execução via `SELECT COUNT(*) FROM "Payment" WHERE provider='STRIPE'`); se houver, tratado como achado à parte, não amplia este plano.

---

## Ondas de execução

### Onda 0 — Conta e credenciais Mercado Pago (bloqueante, responsabilidade do usuário)
- [x] Criar aplicação no Painel de Desenvolvedores do Mercado Pago (usuário confirmou em 2026-09-02)
- [x] Gerar credenciais de teste — **nota**: o app deste usuário usa o formato `APP_USR-...`
      (não `TEST-...`) tanto pra Public Key quanto Access Token, pareado a um "Usuário de
      teste" dedicado (`TESTUSER4492788855605176697`) — é o formato atual do painel pra
      aplicações registradas; confirmado como credencial de sandbox de verdade (validado
      com uma chamada real à API, ver `ERR-0089`)
- [x] Confirmar país/moeda da conta — Brasil confirmado no painel
- [ ] Gerar a assinatura secreta do webhook — **ainda pendente**, tela separada
      (Webhooks > Configurar notificações), não bloqueia o fluxo de checkout/confirmação,
      só a validação assíncrona via webhook
- [x] Valores repassados via `.env` (raiz, gitignored) — nunca em texto no código/sfk.toml,
      só nomes de variável ficam documentados

### Onda 1 — Remoção do módulo Stripe (backend) ✅ CONCLUÍDA (2026-09-02)
- [x] Remover `apps/api/src/modules/payments/stripe/` (4 arquivos)
- [x] Remover dependência `stripe` do `package.json`, adicionar `mercadopago` (`^3.6.0`) + `npm install`
- [x] Remover as 5 rotas/handlers Stripe de `routes/orders.ts`
- [x] Remover registro especial do webhook em `app.ts` (não era mais necessário — ver nota na Onda 2)
- [x] `tsc -b` limpo

**Nota de execução:** as Ondas 1 e 2 foram executadas juntas, não em sequência estrita —
o handler de checkout e a lógica de validação de pedido/estoque vivem no mesmo arquivo
(`routes/orders.ts`), então "remover Stripe" e "criar Mercado Pago" nessas rotas era,
na prática, uma única reescrita atômica. Separar em dois commits quebraria o build no
meio. A Onda 3 (schema) também foi puxada pra frente pelo mesmo motivo (o webhook novo
já referencia `PaymentWebhookEvent`).

### Onda 2 — Módulo Mercado Pago (backend): Preference, confirmação, cancelamento, webhook ✅ CONCLUÍDA (2026-09-02)
- [x] Criado `apps/api/src/modules/payments/mercadopago/` (client/config/publicCheckout/index, espelhando o padrão Stripe)
- [x] 3 rotas públicas (`checkout-preference`, `confirm-payment`, `cancel-pending`) + webhook em `routes/orders.ts`, registrado como rota normal do `ordersRouter` (não precisou de tratamento especial em `app.ts`)
- [x] **Decidido**: `express.raw()` não é necessário — a assinatura HMAC do MP é sobre um manifest textual (`id:...;request-id:...;ts:...;`), não sobre o body. `express.json()` padrão processa a rota normalmente.
- [x] Idempotência do webhook: dedupe por `` `${paymentId}:${status}` `` (compound unique `provider+eventId`), já que o MP não manda um "event id" único como o Stripe — uma mudança real de status gera um novo registro, reprocessar o mesmo status é ignorado.
- [x] Correlação pedido↔pagamento via `external_reference` (nosso `Payment.id`), não via `preferenceId` — o Mercado Pago usa dois IDs diferentes (preference na criação, payment no retorno/webhook), diferente do Stripe (mesmo `sessionId` nos dois momentos). Documentado inline no código.
- [x] Função única `syncMercadoPagoPayment` compartilhada entre o endpoint de confirmação e o webhook (o Stripe original duplicava essa lógica nos dois lugares — corrigido na reescrita).
- [x] `npm run test` (api): 134/134 PASS (sem regressão)
- [x] **Teste real contra a API do Mercado Pago** (credenciais de teste do usuário, 2026-09-02):
      `checkout-preference` criou uma Preference de verdade (`preferenceId`/`initPoint`/
      `sandboxInitPoint` reais retornados), `Payment` gravado no banco com `provider=MERCADOPAGO`
      e `providerPaymentId` = preferenceId; `cancel-pending` testado em seguida, reverteu
      status pra `CANCELADO` em `Payment`/`Order` e liberou a reserva de estoque — pedido de
      teste limpo, nenhum dado de teste deixado no banco. Achado real corrigido no processo:
      `ERR-0089` (MP rejeita `auto_return` sem `back_urls.success` publicamente alcançável —
      `localhost` neste ambiente, mesma limitação do `PLAN-0019`).
- [ ] Teste manual do fluxo completo **com pagamento de cartão de verdade** (via
      `sandbox_init_point` num navegador, cartão de teste `APRO`) — ainda não feito; a criação
      da preferência já está validada, falta percorrer a página do Mercado Pago até o fim
      (Onda 6)

### Onda 3 — Migração de schema (ledger de webhook) ✅ CONCLUÍDA (2026-09-02)
- [x] Migration `20260903010053_generalize_payment_webhook_event`: `StripeWebhookEvent` → `PaymentWebhookEvent { provider, eventId, ... }` com `@@unique([provider, eventId])` (nome aprovado pelo usuário)
- [x] Confirmado antes de dropar a tabela antiga: `SELECT COUNT(*)` real no Postgres — **zero** pagamentos `provider='STRIPE'` e **zero** linhas em `StripeWebhookEvent` em produção, recriação sem perda de dado real
- [x] `npx prisma generate`
- [x] Aplicada de fato no banco (rebuild Docker + `prisma migrate deploy` no boot — log confirmado: "All migrations have been successfully applied", schema real conferido via `psql \d`)
- [x] Registrada em `memory/logs/BUILD-HISTORY.md`

### Onda 4 — Frontend: checkout redirect Mercado Pago ✅ CONCLUÍDA (2026-09-02)
- [x] `CheckoutContent.tsx` reescrito: `startMercadoPagoCheckout`/`confirmMercadoPagoPayment`/
      `cancelPendingMercadoPagoOrder`, chave de `localStorage`
      (`jlr_pending_mercadopago_order_checkout`), leitura dos 3 status de retorno via `mpStatus`
      (marcador próprio nos 3 `back_urls`) + `payment_id` real anexado pelo Mercado Pago.
      Preferência dada a `sandboxInitPoint` quando presente (funciona certo tanto em teste
      quanto produção, já que o próprio Mercado Pago só populariza esse campo quando as
      credenciais usadas são de teste).
- [x] Caso `pending` tratado como estado novo (não existia no Stripe): não cancela nem limpa
      carrinho, só informa — a confirmação real chega depois via webhook.
- [ ] Validação **manual num navegador real** dos 3 cenários de retorno — **não foi possível
      nesta sessão** (extensão Chrome indisponível no ambiente). Validado até aqui só via
      chamadas diretas à API (Onda 2) + `tsc`/build/lint limpos + rebuild Docker do `web`.
      Passos e cartões de teste para o usuário validar manualmente: ver Onda 6.

### Onda 5 — Textos hardcoded + branding + comentários residuais ✅ CONCLUÍDA (2026-09-02)
- [x] `CartModalSection.tsx` — "Finalização segura com Stripe" migrado pra `pageTexts`
      (chave nova `global.checkout.secure_badge`, catálogo backend + `usePageText`/`RichText`
      no componente, mesmo padrão do resto do site) + marca trocada
- [x] `ConfirmPaymentModal.tsx` — comentário atualizado ("PIX fora do Mercado Pago", referência
      ao `PLAN-0036`)
- [x] Grep final por `stripe`/`Stripe` em `apps/api/src` e `apps/web/src` — **zero resíduo**
      (nem funcional nem em comentário, backend e frontend)

### Onda 6 — Matriz de dados de teste + validação manual
Cartões oficiais de sandbox do Mercado Pago Brasil (confirme os números atuais no painel antes de usar — o MP costuma rotacioná-los):

| Bandeira | Número | CVV | Validade |
|---|---|---|---|
| Mastercard (crédito) | 5480 8328 0103 3311 | 123 | 11/30 |
| Visa (crédito) | 4235 6477 2802 5682 | 123 | 11/30 |
| Amex (crédito) | 3753 651535 56885 | 1234 | 11/30 |
| Elo (débito) | 5067 7667 8388 8311 | 123 | 11/30 |

Cenário simulado via **nome do titular** no formulário (qualquer um dos cartões acima + CPF de teste `123.456.789-09`):

| Nome no cartão | Resultado simulado |
|---|---|
| `APRO` | Aprovado — cenário base "cliente aprovado" |
| `OTHE` | Erro genérico |
| `CONT` | Pendente (análise) |
| `CALL` | Requer autorização (ligar pro banco) |
| `FUND` | Recusado — saldo insuficiente |
| `SECU` | Recusado — CVV inválido |
| `EXPI` | Recusado — data de validade inválida |
| `FORM` | Recusado — erro de formulário |
| `INST` | Recusado — parcelas inválidas |
| `LOCK` | Recusado — cartão bloqueado |

Proposta de matriz mínima pra validar os 3 pedidos do usuário ("aprovar alguns, rejeitar outros, parcelado"):
- [ ] **2 clientes de teste "aprovado"** — `APRO`, à vista (1x) e parcelado (ex. 6x), confirma que `markOrderAsPaid` roda em ambos.
- [ ] **3 clientes de teste "rejeitado"** — `FUND` (saldo), `SECU` (CVV), `CALL` (autorização) — cobre motivos de recusa diferentes, confirma que o pedido não é marcado como pago e a reserva de estoque é liberada.
- [ ] **1 cliente de teste "pendente"** — `CONT` — confirma o estado intermediário (nem aprovado nem cancelado) até o webhook resolver.
- [ ] **Parcelamento**: repetir 1 caso aprovado em 3x, 6x e 12x — confirma que `payment_methods.installments` está de fato oferecendo até 12 parcelas e que o valor da parcela bate.
- [ ] Documentar tudo isso em `docs/integrations/mercadopago.md` pra reuso em testes futuros (não fica só na memória da sessão).
- [ ] Reescrever `apps/web/e2e/order-dashboard-lifecycle.spec.ts` (bloco `cancel-pending`) pro endpoint Mercado Pago.

### Onda 7 — Config/infra/docs + fechamento formal (2026-09-02)
- [x] `.env.docker.example`, `sfk.toml` (`[[integrations]]` + `[environments.docker]`)
- [x] `docs/integrations/mercadopago.md` novo (runbook completo: env vars, endpoints,
      diferenças vs Stripe, cartões de teste, como gerar credenciais/webhook secret)
- [x] `DECISION-021` registrada (troca de provedor — motivo, trade-offs, achados técnicos)
- [x] Limpeza adicional de resíduo Stripe fora do inventário original do plano (achado
      durante o fechamento): `SYSTEM.md` (stack + seção de pagamentos), `docs/SECURITY_OVERVIEW.md`
      (controle #13, sanitização de webhook — reescrito pro formato real do
      `sanitizeMercadoPagoPayment`), `docs/config/DEPLOY_VPS.md` (passo de pós-deploy),
      `docs/config/STRIPE_TEST_RUNBOOK.md` removido (obsoleto, substituído pelo runbook novo),
      `apps/web/e2e/order-dashboard-lifecycle.spec.ts` (rota/provider do teste de cancelamento)
- [x] `tsc -b`/build/lint/testes limpos em `apps/api` (134/134 PASS) e `apps/web` (lint zero
      erros, build 216 módulos). E2E (`order-dashboard-lifecycle.spec.ts`) validado só
      sintaticamente (`esbuild` transpile check) — **não executado de ponta a ponta**
      (Postgres/API não expostos ao host fora do Docker; rodar exigiria expor portas,
      decisão de segurança que não tomo sozinho sem perguntar)
- [x] Rebuild Docker completo (`api`+`web`) + validado ao vivo: `/health` 200, `pageTexts`
      novo resolvendo corretamente via API real (`global.checkout.secure_badge`)
- [ ] **Validação visual real do checkout ponta a ponta (navegador) — não executada**
      (extensão Chrome indisponível nesta sessão). Fica pendência explícita, não
      "deveria funcionar" — ver Onda 6.
- [ ] Git Record of Delivery — aguardando aprovação de commit do usuário
- [ ] Plano **não renomeado `-DONE-` ainda** — Onda 6 (validação manual com cartão real)
      segue em aberto; renomear só quando isso for concluído (ou o usuário decidir
      fechar mesmo assim)

---

## Decisões de arquitetura confirmadas com o usuário (2026-09-02)
1. **Nome do model genérico de webhook** (Onda 3): **`PaymentWebhookEvent`** — aprovado pelo usuário, alinhado à filosofia de portabilidade já declarada em `sfk.toml`.
2. **`express.raw()` no webhook** (Onda 2): mantém `express.json()` padrão pra essa rota, a menos que a implementação real revele o contrário — sem objeção do usuário.

---

## Esforço previsto

| Onda | Descrição | Esforço | Observação |
|---|---|---|---|
| 0 | Conta/credenciais MP | **Externa** (não é esforço de dev) | Bloqueante — só o usuário pode fazer |
| 1 | Remover Stripe (backend) | **P** (pequeno, ~1-2h) | Remoção é mecânica, risco baixo |
| 2 | Módulo Mercado Pago (Preference/confirm/cancel/webhook) | **G** (grande, ~1 dia) | Núcleo do plano — inclui a diferença arquitetural do webhook (notify-then-fetch) e validação manual ponta a ponta |
| 3 | Migration do ledger de webhook | **P** (~30min-1h) | Mecânica, mas é mudança de schema — precisa validação cuidadosa |
| 4 | Frontend checkout redirect | **M** (médio, ~3-4h) | Reescrita de ~350 linhas de um componente já grande, com 3 fluxos de retorno |
| 5 | Textos hardcoded/branding | **P** (~1h) | Pequeno, mas junto corrige achado real de `content_architecture` |
| 6 | Matriz de teste + validação manual + e2e | **M** (~3-4h) | 6 cenários de cartão a testar manualmente ao vivo + 1 spec e2e reescrito + doc nova |
| 7 | Config/infra/docs/fechamento | **P** (~1-2h) | Padrão de fechamento já repetido em planos anteriores |

**Total estimado: ~2 a 2,5 dias de sessão de desenvolvimento** (mesma ordem de grandeza do `PLAN-0033` — aposentar o Admin legado — que teve escopo comparável em número de arquivos, mas aqui a complexidade central está concentrada na Onda 2, não distribuída). Isso assume: (a) credenciais de teste já disponíveis antes do início da Onda 1 (Onda 0 resolvida à parte, sem bloquear o cronômetro do trabalho técnico), (b) nenhum bug de terceiros na documentação/SDK do Mercado Pago que exija investigação extra (histórico do projeto mostra que isso já aconteceu com o Stripe — `ERR-0067`/`ERR-0068` — então é um risco real, não hipotético).

**Maior risco técnico:** a Onda 2, especificamente a validação da assinatura do webhook e o padrão "notificação enxuta + busca por ID" — é a parte com menos precedente no código atual (o Stripe manda o payload pronto; o MP não) e a que mais provavelmente vai gerar 1-2 achados reais (`ERR-XXXX`) durante a implementação, como aconteceu em praticamente toda integração de pagamento anterior deste projeto.

---

## Git Record of Delivery
- [x] Step 1 (Pre-commit review) — 2026-09-02: ~30 arquivos (removidos: módulo
      `payments/stripe/` 4 arquivos + `docs/config/STRIPE_TEST_RUNBOOK.md`; novos:
      `payments/mercadopago/` 4 arquivos + migration + `docs/integrations/mercadopago.md`
      + `DECISION-021` + este plano; modificados: rotas/schema/config/docs listados nas
      Ondas acima). Validações: `apps/api` `tsc -b` limpo + `npm run test` 134/134 PASS;
      `apps/web` `tsc -b` limpo, `npm run build` PASS (216 módulos), `eslint .` zero erros.
      Rebuild Docker completo (`api`+`web`) validado ao vivo (health 200, pageTexts real,
      preferência real criada e cancelada contra a API do Mercado Pago). Este commit também
      inclui a regularização pendente do `PLAN-0035` (rename `-DONE-` + Git Record, pedida
      no início desta sessão, antes do `PLAN-0036`).
- [ ] Step 2 (Commit authorization): aguardando confirmação explícita do usuário
- [ ] Step 3 (Commit confirmation): hash/branch/mensagem/estatísticas
- [ ] Step 4 (Push authorization e resultado): confirmação explícita + retorno
- Push status: PENDING
