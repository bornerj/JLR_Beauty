# DECISION-021 — Troca de provedor de pagamento: Stripe → Mercado Pago (Checkout Pro)

Status: ACTIVE
Date: 2026-09-02

## Contexto

O usuário pediu formalmente (`PLAN-0036`) a remoção completa do módulo Stripe e a
integração do Mercado Pago em seu lugar, com preparação de dados de teste (cartões
aprovado/recusado/parcelado). Não havia registro anterior de uma `DECISION` cobrindo
a escolha original do Stripe como provedor — esta decisão cobre a troca em si.

RAG do plano confirmou boas notícias arquiteturais: o model `Payment` (schema.prisma)
já era agnóstico de provedor desde o `PLAN-0020` (`provider`/`providerPaymentId`/
`rawPayload` genéricos), e `markOrderAsPaid`/`cancelOrderWithOptionalRestock`
(choke-points de baixa de estoque/mudança de status) não precisaram de nenhuma
mudança. Só o model `StripeWebhookEvent` (ledger de idempotência de webhook) estava
amarrado ao Stripe por nome.

Entre Checkout Pro (redirect hospedado) e Payment Brick (formulário embutido), o
usuário escolheu **Checkout Pro** — mais próximo do padrão já existente com o Stripe
(redirect → volta com resultado), menor risco de regressão, sem exigir PCI compliance
adicional no próprio site.

## Decisão

**Mercado Pago (Checkout Pro) substitui o Stripe como único provedor de pagamento por
cartão do checkout público.** O Stripe foi removido por completo — código
(`apps/api/src/modules/payments/stripe/`), dependência npm, rotas, variáveis de
ambiente, textos hardcoded, comentários residuais. Não há período de convivência
entre os dois provedores (corte direto, não gradual/feature-flag) — decisão coerente
com o pedido original do usuário ("1-remover o módulo do stripe 2-incluir o módulo
do mercadopago").

O model de idempotência de webhook, antes `StripeWebhookEvent`, foi generalizado para
`PaymentWebhookEvent { provider, eventId, ... }` — nome agnóstico de provedor,
aprovado explicitamente pelo usuário durante a apresentação do plano, alinhado ao
princípio de portabilidade SaaS já declarado em `DECISION-018`/`sfk.toml`. Preferido
sobre a alternativa mais direta (`MercadoPagoWebhookEvent`, espelhando o padrão
antigo) para não repetir o mesmo problema numa eventual troca futura de provedor.

Achados técnicos reais descobertos durante a implementação, registrados em
`memory/logs/DEBUG-HISTORY.md`:
- `ERR-0089` — o Mercado Pago valida sincronamente que `back_urls.success` seja uma
  URL publicamente alcançável quando `auto_return` é usado (o Stripe não validava
  alcançabilidade) — sem domínio real (`PLAN-0019` ainda bloqueado), `auto_return`
  virou condicional no código.

Diferenças arquiteturais relevantes (documentadas em `docs/integrations/mercadopago.md`):
correlação pedido↔pagamento via `external_reference` (não via ID do provedor, que é
diferente na criação e na confirmação, diferente do Stripe); webhook
"notify-then-fetch" (só `{type, data:{id}}`, precisa buscar o pagamento real via API,
diferente do Stripe que manda o payload pronto e assinado); assinatura HMAC sobre um
manifest de headers, não sobre o body (não precisa de `express.raw()`); 3 `back_urls`
(sucesso/falha/pendente) em vez de 2.

## Consequences

- Toda menção a "Stripe" em documentação/comentário ativo do projeto deve ser tratada
  como desatualizada — `SYSTEM.md`, `docs/SECURITY_OVERVIEW.md`, `docs/config/DEPLOY_VPS.md`
  e `sfk.toml` já foram corrigidos no fechamento do `PLAN-0036`.
- Qualquer código futuro que precise correlacionar um pagamento ao pedido interno deve
  usar `external_reference`/`Payment.id`, nunca assumir que o ID do provedor é estável
  entre a criação e a confirmação (isso é verdade pro Mercado Pago; pode não ser verdade
  pra outro provedor no futuro, mas é o padrão mais seguro por default).
- `PaymentWebhookEvent` é o ledger de idempotência para **qualquer** provedor de
  pagamento futuro — não criar uma tabela nova por provedor.
- Validação end-to-end real com cartão de teste num navegador (matriz de
  aprovado/recusado/parcelado) fica registrada como pendência explícita — ver
  `PLAN-0036` Onda 6 — não bloqueia esta decisão, mas bloqueia considerar a
  integração pronta para produção.
- `MERCADOPAGO_WEBHOOK_SECRET` real (gerado no painel, tela de Webhooks) ainda não foi
  configurado neste ambiente — sem ele, a confirmação assíncrona via webhook não
  funciona (o retorno síncrono do navegador funciona normalmente).
