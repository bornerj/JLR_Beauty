# PLAN-0008 - Order Dashboard Operacional

Status: DONE
Data de abertura: 2026-03-01
Contexto: Formalizacao do plano registrado em `OrderDashBoardIdea.md`, para evoluir o dashboard de pedidos com dados reais, fluxo operacional de expedicao e operacao em lote.

## Approach
Consolidar o dashboard de pedidos como tela operacional unica, priorizando confiabilidade de dados (API), fluxo de despacho guiado e reducao de atrito na operacao diaria. A execucao ocorre em fases incrementais para manter baixo risco de regressao.

## Scope
- In:
  - dashboard de pedidos com KPIs reais vindos de API;
  - fluxo claro de pagamento -> expedicao -> entrega;
  - operacao em lote para pedidos pendentes;
  - continuidade para UX mobile-first e validacao E2E.
- Out:
  - reescrita completa do admin;
  - BI externo;
  - mudanca arquitetural no checkout.

## Action Items
- [x] 1. Definir regra oficial de bloqueio logistico sem pagamento aprovado.
- [x] 2. Criar endpoint de resumo de pedidos para cards operacionais.
- [x] 3. Substituir cards estaticos por dados reais na tela de pedidos e vendas.
- [x] 4. Trocar atualizacao via `prompt` por fluxo guiado no modal.
- [x] 5. Expor `fulfillmentStatus` na UI com filtro/coluna dedicados.
- [x] 6. Adicionar drawer de detalhes do pedido (itens, pagamentos, historico e tracking).
- [x] 7. Adicionar operacao em lote para pendentes (selecionar varios e marcar proxima etapa).
- [x] 8. Implementar modo mobile-first para pedidos (cards por pedido + acao touch >= 44px).
- [x] 9. Validar cenarios E2E (pago, nao pago, cancelado Stripe, despacho, entrega, estorno).
- [x] 10. Atualizar runbook operacional com matriz de status e regras de bloqueio.

## Validation
- [x] `apps/api`: `npm run build`
- [x] `apps/api`: `npm test`
- [x] `apps/web`: `npm run lint`
- [x] `apps/web`: `npm run build`
- [x] `apps/web`: `npx playwright test e2e/order-dashboard-lifecycle.spec.ts` (com API local ativa em `127.0.0.1:3001`)
- [x] Teste manual do fluxo em lote na tela admin de pedidos (concluido em 2026-03-04).

## Checkpoint de Continuidade
- Ultimo passo concluido: teste manual do fluxo em lote na tela admin de pedidos executado e validado em 2026-03-04.
- Proximo passo planejado: nenhum; plano encerrado.

## Registro Git da Entrega
- Passo 1 (Revisao pre-commit): arquivos staged do escopo `PLAN-0008` revisados (`apps/api/src/routes/index.ts`, `apps/web/src/modules/admin-orders/behavior.ts`, `apps/web/src/modules/admin-sales/components/AdminSalesView.tsx`, `apps/web/e2e/order-dashboard-lifecycle.spec.ts`, `docs/config/STRIPE_TEST_RUNBOOK.md`, `memory/MODIFICATION_LOG.md`, `memory/plans/PLAN-0008-ORDER-DASHBOARD-OPERACIONAL.md`, `OrderDashBoardIdea.md`); validacoes executadas e registradas no plano (`apps/api build/test`, `apps/web lint/build`, `playwright` da spec de ciclo de pedidos).
- Passo 2 (Autorizacao de commit): confirmacao explicita do usuario em 2026-03-01: "agora faça commit e push para atualizar github".
- Passo 3 (Confirmacao do commit): commit `1425299` em `main` com mensagem `feat: evolve order dashboard operations and e2e coverage` (8 arquivos, +1894/-108).
- Passo 4 (Autorizacao e resultado do push): autorizacao explicita do usuario na mesma solicitacao; push executado com sucesso para `origin/main` (`b12cfa8..1425299`).
- Status do push: CONCLUIDO

