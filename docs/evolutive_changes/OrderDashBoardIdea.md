# Plano de Avaliacao - Order Dashboard (Base Real do Projeto)

Data da avaliacao: 2026-03-01

## Equipe de avaliacao (skills aplicadas)

- `brainstorming`: validar ideia vs realidade implementada, sem seguir placeholder literalmente.
- `frontend-design`: avaliar hierarquia visual e aderencia do layout de referencia.
- `mobile-design`: avaliar usabilidade touch e responsividade real da tela de pedidos.
- `concise-planning`: gerar plano de evolucao objetivo, em etapas.
- `frontend-developer`: nao existe como skill instalada; substituido por revisao tecnica do frontend atual (`admin-sales`, `admin-orders`, `admin-core`).

## Respostas objetivas (1 a 4)

1. A ideia e viavel dentro do que ja foi feito?
- Sim, viavel e parcialmente pronta.
- Ja existe base forte: listagem de pedidos com busca/filtro/paginacao, status PT-BR e API de atualizacao.
- Nao esta pronta no formato exato da imagem (cards de topo + detalhes estruturados + fluxo de despacho guiado).

2. Com o que ja temos, podemos montar o dashboard assim ou ja foi montado?
- Podemos montar com baixo risco, porque a maior parte da infraestrutura ja existe.
- Ja existe algo proximo em "Pedidos e Vendas", mas nao igual ao mock:
  - Tabela existe.
  - Filtro por status existe.
  - Cards do topo existem na tela, mas com numeros estaticos (nao alimentados por API de resumo de pedidos).
  - Acao atual de status usa `prompt`, sem drawer/modal de detalhes.

3. Processo de compra e acompanhamento esta facilitado da mesma maneira?
- Parcialmente.
- O que ja acontece hoje:
  - Checkout Stripe cria pedido `PENDENTE` e pagamento `PENDENTE`.
  - Estoque e reservado no checkout e revertido em cancelamento/expiracao.
  - Confirmacao Stripe marca pagamento `APROVADO` e pedido `PAGO`.
  - Cancelamento/expiracao Stripe cancela pagamento/pedido e faz restock.
- Ponto critico:
  - No painel admin, hoje e possivel avancar status de pedido sem bloqueio duro de pagamento aprovado.
  - Ou seja: sem confirmacao de pagamento, ainda da para forcar `ENVIADO/ENTREGUE` no fluxo manual.
- Bloqueio que existe:
  - Para agendamentos, ao marcar `CONFIRMADO`, existe bloqueio se nao houver pagamento aprovado.

4. Dashboard unico para ver todos pedidos e operar pendentes/cancelados?
- Sim, existe uma tela unica para ver todos os pedidos (`/api/orders` no admin).
- Sim, da para filtrar cancelados e pendentes.
- Sim, da para atualizar status por linha.
- Nao ideal ainda:
  - Nao ha operacao em lote (bulk).
  - Nao ha fluxo guiado de expedicao por `fulfillmentStatus` na UI.
  - `DESPACHADO` existe no backend (fulfillment), mas nao esta exposto de forma clara na tela atual.

## Diagnostico critico (o que esta bom e o que falta)

### Ja esta bom
- Status padronizados em PT-BR no dominio principal de pedidos/pagamentos.
- Endpoints de pedidos e fulfillment separados (boa base para fluxo logistico).
- Integração Stripe com confirmacao/cancelamento/webhook e idempotencia.

### Lacunas reais
- Tela de vendas ainda usa cards estaticos (nao confiaveis para operacao).
- Atualizacao de status via `prompt` e fragil para operacao diaria.
- Falta painel de detalhes de pedido com timeline/historico.
- Falta regra de bloqueio de expedicao sem pagamento aprovado (se essa for a politica desejada).
- Falta visao mobile dedicada para operacao rapida (tabela grande em telas pequenas).

## Avaliacao de design da sua referencia

A referencia visual e boa para operacao:
- Excelente para leitura rapida: 4 cards + tabela central.
- Bom equilibrio entre macro (cards) e micro (linhas).
- Facil de adaptar ao visual existente do admin.

Ajuste recomendado para o contexto atual:
- Trocar "In Progress" por conceito de negocio local:
  - `SEPARANDO + EMBALADO + DESPACHADO` (fulfillment) ou
  - `PENDENTE` (pedido/pagamento) dependendo da decisao operacional.

## Plano enxuto de evolucao (adaptado ao que ja existe)

## Scope

- In:
  - Dashboard de pedidos operacional, com dados reais.
  - Fluxo claro de pagamento -> expedicao -> entrega.
  - UX desktop + mobile para equipe de operacao.
- Out:
  - Reescrever todo admin.
  - Criar BI externo.
  - Alterar arquitetura de checkout.

## Action Items

[x] 1. Definir regra de negocio oficial para bloqueio logistico sem pagamento (`enviar/despachar` exige `APROVADO`?).
[ ] 2. Criar endpoint de resumo de pedidos (cards) com contadores por status operacional (total, em andamento, enviados, cancelados).
[x] 3. Substituir cards estaticos da tela "Pedidos e Vendas" por dados reais de API.
[x] 4. Trocar acao via `prompt` por menu de transicao de status (com opcoes validas e feedback de erro).
[x] 5. Expor fluxo de `fulfillmentStatus` na UI (`SEPARANDO`, `EMBALADO`, `DESPACHADO`, `ENVIADO`, `ENTREGUE`).
[x] 6. Adicionar drawer/modal de detalhes do pedido (itens, pagamentos, historico de status, tracking).
[ ] 7. Adicionar operacao em lote para pendentes (ex.: selecionar varios e marcar proxima etapa).
[ ] 8. Implementar modo mobile-first para pedidos (cards por pedido + acao primaria touch >= 44px).
[ ] 9. Validar com cenarios E2E: pago, nao pago, cancelado Stripe, despacho, entrega, estorno.
[ ] 10. Atualizar runbook de operacao com matriz de status e regras de bloqueio.

## Execucao feita em 2026-03-01 (Fase 1)

- Backend: bloqueio ativo para impedir avanco de pedido/fulfillment sem pagamento `APROVADO` quando existe pagamento vinculado.
- Frontend: cards do dashboard de pedidos agora sao preenchidos com dados reais carregados de `/orders` (sem hardcode).
- Frontend: troca de status saiu de `prompt` para modal com opcoes guiadas, validacao e mensagem de erro.

## Execucao feita em 2026-03-01 (Fase 2)

- Frontend: fluxo de `fulfillmentStatus` exposto no dashboard com filtro dedicado (`Despacho`) e coluna de despacho na tabela.
- Frontend: modal agora permite atualizar `SEPARANDO`, `EMBALADO`, `DESPACHADO`, `ENVIADO`, `ENTREGUE`, com transportadora, rastreio e observacoes.
- Frontend: atualizacao de despacho integrada ao endpoint `PATCH /orders/:id/fulfillment`, com tratamento de bloqueio de pagamento nao aprovado.

## Execucao feita em 2026-03-01 (Fase 3)

- Backend: endpoint `GET /orders` ampliado para retornar `items` com nomes relacionados e `statusHistory` ordenado.
- Frontend: drawer lateral de detalhes do pedido implementado com resumo, logistica, itens, pagamentos e historico de status.
- Frontend: acao `Detalhes` por linha na tabela de pedidos, mantendo o modal de atualizacao para pedido/despacho.

## Open Questions

- A regra final sera: "nao despacha sem pagamento aprovado" em 100% dos casos?
- Queremos manter dois eixos visiveis (pedido + fulfillment) ou simplificar para um eixo operacional?
- O cliente final precisa de pagina publica de acompanhamento por `publicCode` (UI), alem da API existente?

## Recomendacao final

Seguir sua ideia como direcao de UX, mas adaptando ao dominio real ja implementado.
Nao recomendo copiar o placeholder literalmente: a melhor versao para este projeto e um "Order Dashboard Operacional" com foco em `payment + fulfillment + historico`, mantendo a estética do mock e os status reais em portugues.

