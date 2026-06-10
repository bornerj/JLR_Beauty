# Stripe Test Runbook (No Impacto em Produção)

## Objetivo
Executar validação completa do fluxo Stripe em ambiente controlado, sem afetar a usuária que vai testar a versão atual.

## Estado Atual Registrado
- Branch de trabalho local: `main` (workspace atual).
- Módulo Stripe agora está no código ativo local; validar antes de qualquer deploy.
- Módulo criado no backend:
  - `apps/api/src/modules/payments/stripe/config.ts`
  - `apps/api/src/modules/payments/stripe/client.ts`
  - `apps/api/src/modules/payments/stripe/publicCheckout.ts`
  - `apps/api/src/modules/payments/stripe/index.ts`
- Endpoints públicos adicionados:
  - `POST /api/public/payments/stripe/checkout-session`
  - `GET /api/public/payments/stripe/confirm-session`
  - `POST /api/public/payments/stripe/cancel-pending`
  - `POST /api/public/payments/stripe/webhook`
- Frontend integrado:
  - `apps/web/src/components/pages/CheckoutContent.tsx`
- Build/validações executadas na branch:
  - `apps/api`: `npm run build` PASS
  - `apps/api`: `npm test` PASS
  - `apps/web`: `npm run lint` PASS
  - `apps/web`: `npm run build` PASS

## Sequência de Configuração (amanhã/no sábado)

### Etapa 1 - Confirmação de isolamento
1. Confirmar branch ativa de teste local.
2. Garantir que mudanças não foram publicadas em produção sem validação.
3. Não alterar variáveis de produção enquanto a usuária estiver testando.

### Etapa 2 - Preparar Stripe (modo teste)
1. No painel Stripe, obter chave secreta de teste (`sk_test_...`).
2. Opcional: confirmar chave pública de teste (`pk_test_...`) para etapas futuras (Elements).
3. Manter uso de cartões de teste Stripe.

### Etapa 3 - Configurar backend local/homologação
Definir no backend (`apps/api/.env` ou serviço isolado):

```env
APP_API_URL=http://localhost:3001
APP_WEB_URL=http://localhost:5174
STRIPE_ENABLED=true
STRIPE_SECRET_KEY=sk_test_...
CORS_ORIGIN=http://localhost:5174
```

Observação:
- `STRIPE_CHECKOUT_SUCCESS_URL` e `STRIPE_CHECKOUT_CANCEL_URL` podem ficar vazias:
  o backend monta defaults automaticamente a partir de `APP_WEB_URL`.
- Em deploy cloud, preencher `APP_WEB_URL`/`APP_API_URL` com domínio real.

### Etapa 4 - Configurar frontend local/homologação
Definir no frontend (`apps/web/.env` ou projeto de preview):

```env
VITE_WEB_URL=http://localhost:5174
VITE_API_URL=http://localhost:3001
VITE_STRIPE_ENABLED=true
```

### Etapa 5 - Subir serviços
1. API: `cd apps/api && npm run dev`
2. WEB: `cd apps/web && npm run dev -- --port 5174`

### Etapa 6 - Teste funcional positivo
1. Adicionar itens no carrinho.
2. Abrir checkout e aplicar cupom (se necessário).
3. Clicar em `Concluir Compra`.
4. Verificar redirecionamento para Stripe Checkout.
5. Pagar com cartão de teste de sucesso:
   - Número: `4242 4242 4242 4242`
   - Data: qualquer futura
   - CVC: qualquer
6. Ao retornar:
   - confirmar mensagem de sucesso;
   - confirmar carrinho vazio;
   - confirmar pedido/pagamento no banco (`Order=PAGO`, `Payment=APROVADO`).

### Etapa 7 - Testes de falha/contorno
1. Cartão recusado:
   - `4000 0000 0000 0002`
2. Validar comportamento:
   - pedido/pagamento não podem ser aprovados indevidamente;
   - erro visível no frontend;
   - sem travamento do botão.

### Etapa 8 - Validação de dados no banco
Validar ao menos:
1. `Payment.provider = 'STRIPE'`.
2. `Payment.providerPaymentId` preenchido.
3. `Payment.status` coerente com retorno Stripe.
4. `Order.status` coerente com pagamento.
5. Estoque decrementado apenas quando pagamento confirmado.

### Etapa 9 - Critérios de aceite
Considerar pronto quando:
1. checkout cria sessão Stripe sem erro;
2. retorno confirma pagamento e atualiza banco;
3. falha de pagamento não aprova pedido;
4. fluxo mantém estabilidade visual e funcional no checkout atual.

### Etapa 9.1 - Matriz operacional de status e bloqueios (Pedido Dashboard)

#### Enum oficial (backend)
- `Order.status`: `PENDENTE | PAGO | ENVIADO | ENTREGUE | CANCELADO`
- `Payment.status`: `PENDENTE | APROVADO | RECUSADO | CANCELADO | REEMBOLSADO`
- `Order.fulfillmentStatus`: `PENDENTE | SEPARANDO | EMBALADO | DESPACHADO | ENVIADO | ENTREGUE | CANCELADO`

#### Matriz de transição principal (operação)
| Eixo | Origem | Destino | Regra |
|---|---|---|---|
| Pedido | `PENDENTE` | `PAGO` | Exige pagamento aprovado quando existe pagamento vinculado |
| Pedido | `PAGO` | `ENVIADO` | Exige pagamento aprovado quando existe pagamento vinculado |
| Pedido | `ENVIADO` | `ENTREGUE` | Exige pagamento aprovado quando existe pagamento vinculado |
| Pedido | `*` | `CANCELADO` | Permitido via admin/pagamento; pode acionar reposição de estoque conforme contexto |
| Fulfillment | `PENDENTE` | `SEPARANDO` | Exige pagamento aprovado quando existe pagamento vinculado |
| Fulfillment | `SEPARANDO` | `EMBALADO` | Exige pagamento aprovado quando existe pagamento vinculado |
| Fulfillment | `EMBALADO` | `DESPACHADO` | Exige pagamento aprovado quando existe pagamento vinculado |
| Fulfillment | `DESPACHADO` | `ENVIADO` | Exige pagamento aprovado quando existe pagamento vinculado; sincroniza `Order.status=ENVIADO` |
| Fulfillment | `ENVIADO` | `ENTREGUE` | Exige pagamento aprovado quando existe pagamento vinculado; sincroniza `Order.status=ENTREGUE` |
| Fulfillment | `*` | `CANCELADO` | Permitido; sincroniza `Order.status=CANCELADO` |

#### Regras de bloqueio (HTTP/API)
1. `PATCH /api/orders/:id`
   - Tentativa de avançar para `PAGO|ENVIADO|ENTREGUE` sem pagamento aprovado (quando há pagamento vinculado):
   - retorna `409` com `message = "pagamento aprovado necessario para avancar o pedido"`.
2. `PATCH /api/orders/:id/fulfillment`
   - Tentativa de avançar para `SEPARANDO|EMBALADO|DESPACHADO|ENVIADO|ENTREGUE` sem pagamento aprovado (quando há pagamento vinculado):
   - retorna `409` com a mesma mensagem de bloqueio.
3. `PATCH /api/orders/bulk/advance`
   - Não falha o lote inteiro.
   - Pedido sem pagamento aprovado é marcado como `SKIPPED` com motivo de bloqueio.

#### Regras de conciliação pedido x pagamento
1. `PATCH /api/payments/:id` com `status=APROVADO`
   - sincroniza pedido vinculado para `Order.status=PAGO`.
2. `PATCH /api/payments/:id` com `status=CANCELADO|REEMBOLSADO`
   - sincroniza pedido vinculado para `Order.status=CANCELADO` e `fulfillmentStatus=CANCELADO`.
   - reposição de estoque ocorre quando o pedido ainda não estava em `ENVIADO`/`ENTREGUE`.
3. `POST /api/public/payments/stripe/cancel-pending`
   - cancela pagamento Stripe pendente e cancela pedido;
   - executa reposição de estoque forçada (`forceRestock=true`).

#### Regra de operação em lote (dashboard)
- Endpoint: `PATCH /api/orders/bulk/advance`
- Próxima etapa aplicada por pedido:
  - `PENDENTE -> SEPARANDO`
  - `SEPARANDO -> EMBALADO`
  - `EMBALADO -> DESPACHADO`
  - `DESPACHADO -> ENVIADO`
  - `ENVIADO -> ENTREGUE`
- Comportamento:
  - somente pedidos elegíveis são atualizados;
  - pedidos cancelados, finais ou bloqueados por pagamento pendente são ignorados com motivo.

#### Checklist operacional diário (admin)
1. Revisar KPI de `pendentes com pagamento pendente`.
2. Rodar lote de `próxima etapa` apenas em pedidos com pagamento aprovado.
3. Verificar pedidos `DESPACHADO/ENVIADO` com rastreio ausente.
4. Validar casos `CANCELADO` do dia e confirmar se houve reposição de estoque esperada.
5. Auditar amostra de pedidos no drawer de detalhes (pagamentos + histórico).

### Etapa 10 - Estratégia de ativação posterior
1. Merge para `main` somente após aceite.
2. Deploy controlado em janela definida.
3. Ativar flags apenas no ambiente que receber Stripe:
   - backend: `STRIPE_ENABLED=true`
   - frontend: `VITE_STRIPE_ENABLED=true`
4. Manter opção de rollback rápido desativando flags.

## Variáveis envolvidas (resumo)
- Backend:
  - `APP_API_URL`
  - `APP_WEB_URL`
  - `STRIPE_ENABLED`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_CHECKOUT_SUCCESS_URL`
  - `STRIPE_CHECKOUT_CANCEL_URL`
  - `CORS_ORIGIN`
- Frontend:
  - `VITE_WEB_URL`
  - `VITE_API_URL`
  - `VITE_STRIPE_ENABLED`

## Fora de escopo neste ciclo
- Z-API (WhatsApp) ficará para configuração posterior, separada do teste Stripe.
