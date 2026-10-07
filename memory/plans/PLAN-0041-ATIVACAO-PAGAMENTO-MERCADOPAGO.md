# PLAN-0041 — Ativação do pagamento com Mercado Pago (upgrade comercial)

**Status:** 🟦 BACKLOG — **só inicia se a cliente contratar o recurso**. Aberto em 2026-10-04. Nenhum item deste plano é pendência do projeto hoje.
**Catálogo de melhorias futuras:** este plano é o item F-1 do `PLAN-0043` (junto do MFA, F-2).
**Dependência dura:** `PLAN-0019` (HTTPS/domínio) — sem URL pública o webhook e o `auto_return` não funcionam (ver `ERR-0089`).
**Agentes de apoio (na execução):** `@backend-specialist`, `@devops-engineer`, `@security-auditor`, `@test-engineer`, `@qa-automation-engineer`.

---

## 1. Contexto e decisão de negócio (2026-10-04)

O `PLAN-0036` (Stripe → Mercado Pago, Checkout Pro) foi entregue como **ponto extra ("golden point") sem a cliente ter pedido**.
Decisão do usuário: **pagamento com cartão passa a ser um upgrade**, ativado só se a cliente quiser pagar por ele. Portanto:
- o código fica **entregue e desligado** (`MERCADOPAGO_ENABLED=false`);
- a validação com cartão real deixou de ser pendência do `PLAN-0036` e virou a **Fase 4/5 deste plano**;
- o `PLAN-0036` foi fechado `-DONE-`.

## 2. Estado atual (verificado no código em 2026-10-04)

| Item | Estado |
|---|---|
| Backend | `apps/api/src/modules/payments/mercadopago/` (config, Preference, `confirm-payment`, `cancel-pending`, webhook). 4 rotas públicas sob `/api/public/payments/mercadopago/`. |
| Desligar | `MERCADOPAGO_ENABLED` (default `false` em `.env.docker.example`). Desligado: as rotas devolvem erro `mercadopago_disabled`. |
| Credenciais | Só **credenciais de teste** validadas (chamada real à API; Preference criada e cancelada). Nenhuma de produção. |
| Webhook | Exige `MERCADOPAGO_WEBHOOK_SECRET` (sem ele a assinatura `x-signature` é recusada com `mercadopago_webhook_secret_missing`). **O segredo real nunca foi gerado.** |
| `auto_return` | Só é enviado com `back_urls.success` em `https://` público; sem domínio o código omite (`ERR-0089`). |
| Estoque/pedido | Reserva com TTL de 20 min + sweeper; total calculado no servidor; `PaymentWebhookEvent` deduplica por `provider`+`eventId`. |
| Confirmação manual | Existe a confirmação manual Recebido→Pago (`operations.manualPaymentConfirmationEnabled`, default ligada). |
| Testes | Backend `134/134`; **checkout ponta a ponta nunca foi validado num navegador**; e2e `order-dashboard-lifecycle.spec.ts` só validado sintaticamente. |
| ⚠️ **Estado dormente sujo** | Com a flag desligada o botão **"Concluir Compra" do checkout continua visível** e, ao clicar, o cliente recebe uma mensagem de erro (`CheckoutContent.tsx`, `startMercadoPagoCheckout`). A feature desligada não está "invisível" para o visitante. |

## 3. Pré-trabalho recomendado **mesmo sem contratação** (pequeno, independente)

- [ ] **P-1. Estado dormente limpo:** com `MERCADOPAGO_ENABLED=false`, o checkout deve mostrar o caminho alternativo já usado hoje (finalizar pelo WhatsApp / pedido para confirmação manual) em vez de um botão que falha. Exige expor ao frontend se o pagamento está ativo (endpoint público de config ou `Setting`), com texto em `pageTexts` (regra `content_architecture`). Precisa de plano/aprovação próprios antes de codar — é mudança de fluxo público.
- [ ] **P-2. Resposta a um visitante que chame a rota desligada:** mensagem amigável e status adequado (hoje `detail` técnico só aparece em `NODE_ENV=development`).

> Estes dois itens não dependem da cliente; o resto do plano depende.

---

## 4. Fases (executar na ordem; cada fase tem critério de saída)

### Fase 0 — Proposta e escopo comercial
- [ ] Definir com a cliente e registrar por escrito: quem é o **titular da conta Mercado Pago** (a cliente, nunca o desenvolvedor), quem paga a **taxa do MP** (percentual por transação e por parcela), **prazo de liberação** do dinheiro, **parcelamento** (até quantas vezes e se "sem juros" — quem absorve o custo), política de **estorno/cancelamento**, **chargeback** (contestação: o MP debita da conta da cliente), meios aceitos (cartão crédito/débito; confirmar PIX e boleto — hoje PIX fica fora do Checkout Pro nesta integração).
- [ ] Preço/escopo do upgrade, prazo, o que está incluso (configuração, testes, treinamento, 30 dias de acompanhamento) e o que não está (taxas do MP, nota fiscal, suporte de conta).
- [ ] Aceite da cliente (e-mail ou termo). **Saída:** escopo aprovado → liberar a Fase 1.

### Fase 1 — Pré-requisitos da cliente (externos)
- [ ] Conta **Mercado Pago de vendedor verificada** (identidade/CNPJ ou CPF, dados bancários) e e-mail de contato.
- [ ] **Aplicação** criada em *Painel de Desenvolvedores* → Checkout Pro; anotar nome e ID. Credenciais de **produção** (Access Token + Public Key) entregues por canal seguro (nunca por e-mail em texto aberto, nunca em chat/commit).
- [ ] **Domínio próprio com HTTPS** (`PLAN-0019`): DNS apontando, certificado válido, redirecionamento 80→443. Bloqueante.
- [ ] Páginas legais publicadas no site: **política de privacidade (LGPD)**, **termos de venda**, **política de troca/estorno**, dados da empresa (CNPJ, contato).
- [ ] E-mail transacional real configurado (Brevo — `docs/integrations/brevo.md`) para confirmação de pedido/cadastro.
- **Saída:** credenciais de produção em mãos + site em HTTPS.

### Fase 2 — Infraestrutura para produção
- [ ] `PLAN-0019` concluído (TLS). `APP_WEB_URL`, `APP_API_URL`, `CORS_ORIGIN` com `https://` e o domínio real; `TLS_ENABLED=true` (cookie `Secure` — `ERR-0067`).
- [ ] Segredos de produção **novos** (JWT, senha master, senhas das roles — `PLAN-0039` já removeu os defaults); `.env` com permissão restrita e **fora do git**.
- [ ] Firewall com 80/443/SSH; porta do banco **não** publicada; backup do banco **agendado e com cópia externa** (a partir daqui há dinheiro e dados reais — reavaliar a dispensa de cron/offsite do `PLAN-0038`).
- [ ] Monitoramento mínimo (uptime do site e de `/health`) e alerta para a cliente/desenvolvedor.
- **Saída:** ambiente de produção acessível por HTTPS e seguro.

### Fase 3 — Configuração do Mercado Pago
- [ ] No painel do MP: confirmar **moeda BRL**, métodos de pagamento habilitados e **parcelamento** (o `MERCADOPAGO_MAX_INSTALLMENTS` só limita o que o app oferece; "sem juros" é configuração comercial da conta).
- [ ] **Webhooks → Configurar notificações:** URL `https://<dominio>/api/public/payments/mercadopago/webhook`, evento **Pagamentos**; copiar a **chave secreta** → `MERCADOPAGO_WEBHOOK_SECRET`.
- [ ] `.env` de produção: `MERCADOPAGO_ENABLED=true`, `MERCADOPAGO_ACCESS_TOKEN` (produção), `MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_WEBHOOK_SECRET`; as 3 `back_urls` e `NOTIFICATION_URL` podem ficar vazias (derivam de `APP_WEB_URL`/`APP_API_URL`) — **conferir** o resultado.
- [ ] Aplicar com `docker compose up -d api` (**`restart` não relê o `.env`** — lição do `ERR-0096`); conferir `docker compose ps` e `/health`.
- [ ] Atualizar `sfk.toml` (`[[integrations]]`, nomes das variáveis) e `docs/integrations/mercadopago.md` com o que mudou. **Nunca** registrar valores.
- **Saída:** integração ligada em **modo teste** primeiro (credenciais de teste + webhook real), antes de trocar para produção.

### Fase 4 — Validação em sandbox (a antiga Onda 6 do `PLAN-0036`)
Cartões e nomes de titular: ver `docs/integrations/mercadopago.md` (confirmar no painel; o MP rotaciona).
- [ ] **2 aprovados** (`APRO`): à vista e parcelado (6x) — pedido vira `PAGO`, `Payment` `APROVADO`, estoque baixa, e-mail/estado corretos.
- [ ] **3 recusados** (`FUND`, `SECU`, `CALL`) — pedido **não** vira pago; reserva de estoque é **liberada**.
- [ ] **1 pendente** (`CONT`) — estado intermediário; resolve quando o webhook chega.
- [ ] **Parcelamento** 3x/6x/12x: oferece até o máximo e o valor da parcela bate.
- [ ] **Abandono:** fechar a aba no checkout → `cancel-pending`/TTL de 20 min libera o estoque.
- [ ] **Webhook:** chega com assinatura válida; **reenvio duplicado não duplica** (dedupe por `eventId`); assinatura inválida é recusada; segredo ausente é recusado.
- [ ] **Validação visual real** do checkout (3 retornos: sucesso, falha, pendente) num navegador, em desktop e celular.
- [ ] Reescrever/rodar `apps/web/e2e/order-dashboard-lifecycle.spec.ts` (bloco `cancel-pending`) contra o endpoint do MP.
- [ ] Testes automatizados novos para: assinatura do webhook, dedupe, total calculado no servidor (adulteração de preço no corpo é ignorada), cupom.
- **Saída:** matriz completa verde, evidências guardadas (IDs de pedido/pagamento, sem dado sensível).

### Fase 5 — Produção controlada
- [ ] Trocar para **credenciais de produção** (token + webhook secret de produção); `up -d api`.
- [ ] **Compra real de baixo valor** com cartão próprio (respeitando o valor mínimo do MP) → conferir pedido `PAGO`, `Payment`, estoque, e-mail, extrato no painel do MP (valor, taxa, liberação).
- [ ] **Estorno** dessa compra pelo painel do MP e conferir como o pedido fica no admin (se não houver fluxo de estorno no Admin V2, definir processo manual documentado ou abrir plano próprio).
- [ ] Decidir sobre `operations.manualPaymentConfirmationEnabled`: com integração real pode ser desligada (registrar a decisão).
- **Saída:** 1 transação real aprovada e estornada com todos os registros coerentes.

### Fase 6 — Operação, conciliação e suporte
- [ ] Rotina de **conciliação** (relatório do MP × pedidos `PAGO` do período) e quem executa.
- [ ] Como a cliente vê pagamentos, estorna e trata **chargeback**; passo a passo escrito e treinamento feito.
- [ ] Monitorar `PaymentWebhookEvent` (falhas/duplicados) e logs da API; alerta para erro de webhook.
- [ ] Rotação de token do MP (periodicidade e procedimento) e o que fazer se vazar (revogar no painel → novo token → `up -d api`).

### Fase 7 — Segurança e compliance
- [ ] `@security-auditor` revisa as 4 rotas públicas: rate limit, validação Zod, ausência de dado de cartão (Checkout Pro mantém o cartão fora do nosso servidor), sanitização de logs/`sanitizeMercadoPagoPayment`, `detail` só em desenvolvimento.
- [ ] Teste de abuso: preço adulterado, cupom repetido, `orderId` de terceiros em `cancel-pending`/`confirm-payment`, reenvio de webhook.
- [ ] Atualizar `docs/SECURITY_OVERVIEW.md` e o registro de tratamento de dados (LGPD: dados de pagamento ficam com o MP; guardamos nome, e-mail, telefone, itens, valor, status).

### Fase 8 — Go-live e encerramento
- [ ] Checklist final assinado: HTTPS, credenciais de produção, webhook ok, compra real ok, backup externo ativo, páginas legais publicadas, treinamento feito.
- [ ] Plano de **rollback**: `MERCADOPAGO_ENABLED=false` + `docker compose up -d api` (e o visitante vê o caminho alternativo — depende do item **P-1**); tratar pedidos `PENDENTE` abertos.
- [ ] Período de acompanhamento combinado (ex.: 30 dias) e canal de suporte.
- [ ] Fechar este plano `-DONE-` com Git Record; atualizar `progress.md`, `DECISION-021` (adendo) e `MODIFICATION_LOG`.

---

## 5. Esforço estimado (quando contratado)
| Fase | Quem | Esforço |
|---|---|---|
| 0 Proposta | desenvolvedor + cliente | ~1-2 h de conversa + redação |
| 1 Pré-requisitos | **cliente** (+ ajuda) | dias (KYC do MP e domínio dependem de terceiros) |
| 2 Infra | desenvolvedor | `PLAN-0019` (próprio) + ~2-3 h |
| 3 Configuração | desenvolvedor | ~1-2 h |
| 4 Sandbox | desenvolvedor | ~3-4 h + testes automatizados |
| 5 Produção controlada | desenvolvedor + cliente | ~1-2 h |
| 6-7 Operação/segurança | desenvolvedor | ~3-4 h |
| 8 Go-live | ambos | ~1-2 h |
Pré-trabalho P-1/P-2: ~2-3 h (plano próprio).

## 6. Riscos
1. **Domínio/HTTPS atrasam** (depende da cliente) → bloqueia Fases 2-5. Sem ele só o retorno do navegador funciona (sem webhook confiável).
2. **KYC do Mercado Pago** pode demorar ou ser recusado → Fase 1 sem prazo garantido.
3. **Taxas e chargeback** surpreendem a cliente → Fase 0 precisa ser escrita e aceita.
4. **Token/webhook secret vazados** → impacto financeiro; seguir a Fase 6 (rotação) e nunca registrar valores.
5. **Estado dormente sujo (P-1)** já afeta visitantes hoje, independente da contratação.
6. **Estorno sem fluxo no Admin** → processo manual até haver plano próprio.
7. **Valores/regras do MP mudam** (cartões de teste, interface do painel, taxas) → conferir a documentação oficial no momento da execução.

## 7. Critérios de aceite (quando contratado)
- Transação real aprovada **e** estornada, com `Order`, `Payment`, estoque e extrato do MP coerentes.
- Matriz de sandbox completa e e2e verde; webhook idempotente e com assinatura obrigatória.
- Nenhum segredo/valor em git, log ou memória; `.env` restrito; backup externo ativo.
- Cliente treinada e com procedimento escrito de conciliação, estorno e chargeback; rollback testado (flag + `up -d api`).

## 8. Referências
`memory/plans/PLAN-0036-DONE-MIGRACAO-STRIPE-MERCADOPAGO.md` · `memory/decisions/DECISION-021.md` · `docs/integrations/mercadopago.md` · `docs/integrations/brevo.md` · `memory/plans/PLAN-0019-TLS-HTTPS-SETUP.md` · `ERR-0067`, `ERR-0089`, `ERR-0096` em `memory/logs/DEBUG-HISTORY.md` · `docs/config/SERVIDOR_UBUNTU.md`.

## Git Record of Delivery
- Plano em BACKLOG; sem entrega. Preencher quando a execução começar.
- Push status: N/A
