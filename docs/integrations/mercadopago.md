# Capítulo: Pagamentos (Mercado Pago — Checkout Pro)

Este capítulo consolida as orientações operacionais da integração de pagamentos com o
Mercado Pago, implementada no `PLAN-0036` em substituição ao Stripe.

## Objetivo
- Processar pagamento com cartão (crédito parcelado, débito) no checkout público do site
  via **Checkout Pro** (página hospedada pelo Mercado Pago — não é um formulário embutido).
- Confirmar o pagamento tanto pelo retorno do navegador (`back_urls`) quanto por webhook
  assíncrono (fonte de verdade real, já que o retorno do navegador não é garantido).

## Por que Checkout Pro (não Payment Brick)
Decisão explícita do usuário ao aprovar o `PLAN-0036`: Checkout Pro (redirect) reaproveita
quase 1:1 o padrão de fluxo que já existia com o Stripe Checkout Sessions — cria uma
cobrança no backend, redireciona o cliente pra uma página hospedada, volta com o resultado.
Payment Brick (formulário de cartão embutido no próprio site) foi descartado por enquanto.

## Variáveis de ambiente (API)
Definir em `.env` (raiz do projeto — nunca commitado, ver `.gitignore`):

- `MERCADOPAGO_ENABLED` — `true`/`false`, desliga a integração inteira.
- `MERCADOPAGO_ACCESS_TOKEN` — credencial da aplicação (Painel de Desenvolvedores >
  Credenciais). **Nota**: mesmo em modo teste, o formato observado é `APP_USR-...` (não
  `TEST-...`) quando a aplicação está associada a um "Usuário de teste" dedicado — é assim
  que o painel atual do Mercado Pago gera credenciais de sandbox pra aplicações registradas.
- `MERCADOPAGO_PUBLIC_KEY` — não é lida pelo backend (Checkout Pro não precisa dela
  server-side); guardada só por padronização/uso futuro (Wallet Brick, se algum dia for
  adotado).
- `MERCADOPAGO_WEBHOOK_SECRET` — chave secreta gerada em **Webhooks > Configurar
  notificações** (tela separada da de credenciais). Usada para validar a assinatura
  `x-signature` das notificações.
- `MERCADOPAGO_CHECKOUT_SUCCESS_URL` / `..._FAILURE_URL` / `..._PENDING_URL` — os 3
  `back_urls` do Checkout Pro. Se vazios, default calculado a partir de `APP_WEB_URL`
  (`{APP_WEB_URL}/checkout?checkout=1&mpStatus=success|failure|pending`).
- `MERCADOPAGO_NOTIFICATION_URL` — endereço do webhook. Se vazio, default
  `{APP_API_URL}/api/public/payments/mercadopago/webhook`. **Precisa ser publicamente
  alcançável** para o Mercado Pago conseguir notificar — em dev local, use um túnel
  (ngrok ou similar).
- `MERCADOPAGO_MAX_INSTALLMENTS` — máximo de parcelas oferecidas no cartão (default `12`).
  Se o parcelamento é "sem juros" de fato depende de configuração comercial da conta MP em
  produção, não só deste parâmetro — confirmar no painel antes de ir pra produção.

## Endpoints (públicos, sem auth)
Base: `https://SEU_DOMINIO/api`

- `POST /public/payments/mercadopago/checkout-preference`
  - Valida itens/estoque/cupom, cria `Order` + `Payment` (`provider=MERCADOPAGO`,
    `status=PENDENTE`), cria uma **Preference** no Mercado Pago, devolve
    `{ preferenceId, initPoint, sandboxInitPoint, orderId, publicCode, paymentRecordId, totals }`.
  - O frontend deve redirecionar pra `sandboxInitPoint` quando presente (credenciais de
    teste), senão `initPoint`.
- `GET /public/payments/mercadopago/confirm-payment?paymentId=...`
  - Chamado no retorno do navegador (`payment_id` que o próprio Mercado Pago anexa ao
    `back_url`). Busca o pagamento real na API do MP, sincroniza o status local.
- `POST /public/payments/mercadopago/cancel-pending`
  - Corpo `{ orderId? , paymentRecordId? }` (pelo menos um). Cancela um pedido pendente
    (ex.: cliente abandonou o checkout) e libera a reserva de estoque.
- `POST /public/payments/mercadopago/webhook`
  - Notificação assíncrona do Mercado Pago (`{ type: "payment", data: { id } }`). Valida
    `x-signature`/`x-request-id`, busca o pagamento real, sincroniza — mesma função
    (`syncMercadoPagoPayment`) usada pelo `confirm-payment`.

## Diferenças arquiteturais importantes vs. Stripe (contexto pra quem for mexer aqui)

1. **Dois IDs por transação, não um.** O Stripe usava o mesmo `sessionId` na criação e na
   confirmação. O Mercado Pago cria uma **Preference** (id A) e, quando o cliente paga de
   verdade, gera um **Payment** separado (id B) — só sabemos o id B quando o cliente volta
   ou quando o webhook chega. Por isso a correlação pedido↔pagamento é feita via
   `external_reference` (nosso `Payment.id` interno), não pelo id do provedor.
2. **Webhook "notify-then-fetch", não "notify-with-payload".** O Stripe manda o objeto
   completo e assinado no corpo do webhook. O Mercado Pago manda só `{ type, data: { id } }`
   — o backend precisa buscar o pagamento real via `GET /v1/payments/:id` antes de decidir
   aprovar/cancelar.
3. **Assinatura sobre um manifest, não sobre o body.** A verificação de `x-signature` é um
   HMAC-SHA256 sobre a string `id:{data.id};request-id:{x-request-id};ts:{ts};`, não sobre
   o payload JSON — por isso a rota do webhook **não** precisa de `express.raw()` (diferente
   do Stripe).
4. **3 back_urls, não 2.** Checkout Pro tem `success`/`failure`/`pending` — o Stripe só
   tinha `success_url`/`cancel_url`. O estado "pendente" (boleto/PIX/análise manual) é
   tratado sem cancelar o pedido nem limpar o carrinho — só informa o cliente.
5. **`auto_return` exige URL pública.** Ver `ERR-0089` (`memory/logs/DEBUG-HISTORY.md`) — a
   API do Mercado Pago rejeita a preferência inteira se `back_urls.success` não for
   `https://` e publicamente alcançável, quando `auto_return` é enviado. Sem domínio real
   (`PLAN-0019` ainda bloqueado), o código detecta isso e omite `auto_return` — o checkout
   funciona, só sem redirecionamento automático pós-pagamento.

## Cartões de teste (sandbox Brasil)

| Bandeira | Número | CVV | Validade |
|---|---|---|---|
| Mastercard (crédito) | 5480 8328 0103 3311 | 123 | 11/30 |
| Visa (crédito) | 4235 6477 2802 5682 | 123 | 11/30 |
| Amex (crédito) | 3753 651535 56885 | 1234 | 11/30 |
| Elo (débito) | 5067 7667 8388 8311 | 123 | 11/30 |

O **resultado** é controlado pelo nome digitado no campo "Nome no cartão" (CPF de teste:
`123.456.789-09`):

| Nome no cartão | Resultado |
|---|---|
| `APRO` | Aprovado |
| `OTHE` | Erro genérico |
| `CONT` | Pendente (análise) |
| `CALL` | Requer autorização |
| `FUND` | Recusado — saldo insuficiente |
| `SECU` | Recusado — CVV inválido |
| `EXPI` | Recusado — validade inválida |
| `FORM` | Recusado — erro de formulário |
| `INST` | Recusado — parcelas inválidas |
| `LOCK` | Recusado — cartão bloqueado |

Confirme os números atuais no painel antes de usar — o Mercado Pago costuma rotacioná-los.

## Como gerar as credenciais de teste
1. [Painel de Desenvolvedores](https://www.mercadopago.com.br/developers/panel) > sua
   aplicação > **Credenciais** > aba **"Credenciais de teste"** — copiar `Public Key` e
   `Access Token` de lá (não da aba de produção).
2. **Webhooks** > "Configurar notificações" > informar a `notification_url` pública >
   copiar a **chave secreta** gerada — vai em `MERCADOPAGO_WEBHOOK_SECRET`.
3. Em dev local sem domínio, usar um túnel (ngrok ou similar) pra expor a API e conseguir
   testar o webhook de verdade; sem isso, só o retorno do navegador (`confirm-payment`)
   funciona.

## Como validar manualmente
1. Montar um carrinho no site, ir pro checkout, preencher nome/e-mail/telefone.
2. Clicar "Concluir Compra" — deve redirecionar pra `sandbox.mercadopago.com.br`.
3. Pagar com um cartão de teste + nome de titular controlando o resultado (tabela acima).
4. Confirmar o retorno ao site (`/checkout?checkout=1&mpStatus=...`) e o estado do
   `Payment`/`Order` no banco.
