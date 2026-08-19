# PLAN-0031 — Migrar "Pedidos e Vendas" (lista + detalhe/edição + venda manual) pro Admin V2 nativo

**Status:** 🟢 EXECUTADO E VALIDADO 2026-08-18 — todas as 7 ondas concluídas na mesma sessão ("pode começar pela Onda 1 e siga até o fim"), E2E real (browser real, Postgres real) em cada fluxo. Ver "Diário de execução" no final do arquivo. Falta commit/push (aguardando aprovação explícita, ainda não solicitada).
**Origem:** usuário pediu (2026-08-18), no mesmo lote de ajustes do `PLAN-0030`: a tela "Pedidos e Vendas" do admin legado — que tem um link a partir da Operação (cards `BLOCKED` do Kanban, "Ver no Admin →") — precisa ser migrada pro Admin V2 nativo, tanto a lista quanto a edição de pedido, mantendo o cabeçalho com os botões de navegação (o mesmo padrão de breadcrumb + abas já usado em todo o Admin V2). É um item de uma pendência maior, já conhecida do projeto: aposentar o admin legado (`DECISION-014` regra #6 / `DECISION-013` regra #3, RETROFIT-022, "ainda sem critério fixado").

---

## Decisões do usuário (2026-08-18)

1. **Onde fica**: nova aba dentro de "Operação", irmã do Kanban ("Pedidos") — mesmo padrão já usado pra Agenda/Produtos/Serviços (`AdminV2Root.tsx`, array `OPERATIONS_TABS`). O link "Ver no Admin →" dos cards `BLOCKED` do Kanban passa a apontar pra essa aba nova, não mais pro legado.
2. **Escopo**: migração **1:1 completa** — nada do que a tela legada faz hoje pode ficar de fora (lista, filtros, busca, paginação, seleção múltipla, ação em lote, drawer de detalhe read-only, modal de edição de status/fulfillment, venda manual/balcão). Não é uma reconstrução simplificada.
3. **Legado**: fica no ar como reserva depois que a versão nativa estiver pronta e validada — aposentar (remover `/admin`) é decisão à parte, feita só quando o usuário confirmar que a nativa cobre o uso real do dia a dia (mesma cautela já registrada na `DECISION-014` regra #6).

---

## Achado de arquitetura (RAG feito antes de propor o plano)

Investigação completa de `apps/web/src/modules/admin-orders/behavior.ts` (~1264 linhas) + `admin-sales/components/AdminSalesView.tsx` (markup) + `apps/api/src/routes/orders.ts`:

### A boa notícia: zero mudança de backend

Todos os endpoints que a tela legada usa **já existem e já funcionam** — a migração é puramente frontend (React nativo substituindo JS imperativo + portal). Nenhuma migration, nenhum endpoint novo:

| Endpoint | Método | Pra quê | Já usado no Admin V2 hoje? |
|---|---|---|---|
| `/orders` | GET | Lista completa (itens/pagamentos/histórico inclusos) | Não — V2 só tem o board agregado |
| `/orders/summary` | GET | KPIs (total, em progresso, despachados, cancelados, receita) | Não |
| `/orders/bulk/advance` | PATCH | Avança em lote a próxima etapa de fulfillment | Não |
| `/orders/:id` | PATCH | Atualiza `status` (inclui cancelamento — não tem botão dedicado, é uma opção do select) | Sim (`confirmOrderPayment`) |
| `/orders/:id/fulfillment` | PATCH | Atualiza fulfillment/transportadora/rastreio/notas | Sim (`updateOrderFulfillmentStatus`) |
| `/orders` | POST | Cria venda manual/balcão | Não |
| `/products`, `/services`, `/inventory/units`, `/inventory/cross-unit` | GET | Catálogo + disponibilidade pra venda manual | Sim, em outros módulos do V2 — não ligados a Pedidos ainda |

### O que precisa ser recriado (não é "wiring", é reescrita)

O legado é uma "ilha React + JS imperativo": `AdminSalesView.tsx` só desenha o esqueleto estático (`data-*` hooks); todo o comportamento (fetch, `innerHTML`, estado, eventos) é `behavior.ts`, chamado uma vez via `admin-core/behavior.ts` depois que o DOM existe. Não dá pra reaproveitar esse código — precisa virar componentes React de verdade (estado via hooks). O que **é** reaproveitável: os 2 endpoints PATCH já usados, e as regras de negócio (aliases de status PT-BR, bloqueio de avanço por pagamento não aprovado — já replicada no board hoje).

### Funcionalidades a cobrir (catálogo completo)

1. **Lista**: tabela (código `PV-{id}`, cliente/email/telefone, status, fulfillment, total, criado/atualizado em, ações) + card mobile equivalente; filtro por status, fulfillment, busca por texto (id/nome/email) — tudo client-side sobre a lista completa (sem paginação/filtro server-side hoje); paginação client-side (tamanho de página configurável, first/prev/next/last); seleção múltipla por página; KPIs no topo (total, receita confirmada, em progresso, despachados, entregues, cancelados).
2. **Ação em lote**: "marcar próxima etapa" sobre os selecionados — mostra quantos atualizados vs. ignorados (e por quê, ex. sem pagamento aprovado).
3. **Drawer de detalhe** (somente leitura): status/fulfillment, cliente, envio (transportadora/rastreio/notas), itens do pedido (produto/serviço/assinatura, qtd, preço, subtotal — sem edição de itens), pagamentos, histórico de status completo.
4. **Modal de edição**: select de status (PENDENTE/PAGO/ENVIADO/ENTREGUE/CANCELADO — cancelar é uma opção aqui, não um botão à parte) + select de fulfillment + transportadora + rastreio + notas; opções que avançam etapa ficam desabilitadas se o pedido tem pagamento vinculado não aprovado (regra já replicada no board hoje, reusar).
5. **Venda manual/balcão**: formulário completo (nome/email/telefone do cliente, unidade — obrigatória só se tiver produto físico, "pago?", itens com quantidade e checagem de disponibilidade cross-unit pra produtos), cria via `POST /orders`.

### Naming a decidir na execução

O nome exato da aba nova (ex. "Lista", "Todos os Pedidos", "Pedidos e Vendas") e o rótulo do botão/link que hoje diz "Ver no Admin →" (deve virar algo como "Ver detalhes" apontando pra rota nativa) ficam pra confirmar durante a execução — proposta inicial: aba **"Lista"** (`/admin-v2/operacao/lista`), consistente com os nomes curtos já usados (Agenda/Produtos/Serviços).

---

## Riscos / pontos de atenção

- **Sem deep-link pro pedido específico ainda** (mesma limitação documentada em `OrderCardView.tsx` desde a Onda 2) — o link do card `BLOCKED` vai abrir a lista nativa, não abrir o pedido já filtrado/aberto. Resolver isso (ex. `?highlight=39` abrindo o drawer direto) é uma melhoria natural desta migração, não estritamente obrigatória pro escopo 1:1 — proponho incluir se o tempo permitir, sem bloquear o resto.
- **Filtros/paginação 100% client-side hoje** (`GET /orders` sem filtro server-side) — replicar exatamente esse comportamento (não é uma regressão inventar filtro server-side sem pedir).
- **`tailwind.generated.css`** (`ERR-0040`/`ERR-0049`/`ERR-0051`/`ERR-0070`) — qualquer classe Tailwind genuinamente nova nesta migração (grid de tabela grande, modal de venda manual) precisa do checklist do `ERR-0070`: grepar a classe no CSS servido + conferir `getComputedStyle` real antes de considerar validado, não só "o dado gravou certo".

---

## Checklist de execução (ondas propostas)

1. ✅ Onda 1 — Lista de Pedidos: nova aba em `OPERATIONS_TABS`/`AdminV2Root.tsx`, rota nova, `OrdersListView.tsx` (tabela + filtros + busca + paginação + seleção + KPIs), clientes novos em `shared/api.ts` (`fetchOrdersFull`, `fetchOrdersSummary`).
2. ✅ Onda 2 — Modal de detalhe (`OrderDetailModal.tsx`, somente leitura): itens/pagamentos/histórico.
3. ✅ Onda 3 — Modal de edição de status/fulfillment (`OrderEditModal.tsx`, reusa os 2 endpoints PATCH já existentes no V2 + `updateOrderStatus` novo).
4. ✅ Onda 4 — Ação em lote (`bulkAdvanceOrders`, `PATCH /orders/bulk/advance`).
5. ✅ Onda 5 — Venda manual/balcão (`ManualSaleModal.tsx`, `createManualSaleOrder`, disponibilidade cross-unit via `fetchCrossUnitStock` já existente).
6. ✅ Onda 6 — Religado o link do card `BLOCKED` do Kanban ("Ver detalhes →") pra `/admin-v2/operacao/lista?highlight={id}` — melhoria real sobre o legado (nunca teve deep-link pro pedido específico).
7. ✅ Onda 7 — Validação final (E2E real via browser real + Postgres real em todos os fluxos; checklist do `ERR-0070` aplicado ao CSS — `min-w-[200px]` era a única classe genuinamente nova, checada antes/depois de regenerar).

Cada onda: `tsc`/build limpos + validação real antes de avançar pra próxima (mesmo padrão do `PLAN-0026`/`PLAN-0030`). Testes automatizados (`npm run test`, api) não precisaram de nenhuma mudança — zero linha de backend tocada nesta migração, 134/134 seguem passando.

---

## Diário de execução (2026-08-18)

Registro detalhado do que foi feito em cada onda, a pedido explícito do usuário ("documente todo o processo e principalmente o que foi feito de mudança").

### Onda 1 — Lista de Pedidos

**Arquivos novos:**
- `apps/web/src/admin-v2/operations/orders/listTypes.ts` — tipos espelhando o shape cru de `GET /orders` (itens/pagamentos/histórico aninhados, valores monetários como string) + mapas de rótulo/cor PT-BR pra status/fulfillment/pagamento + `requiresApprovedPayment()` (mesma regra do backend, replicada client-side só pra UX).
- `apps/web/src/admin-v2/operations/orders/OrdersListView.tsx` — tela principal: KPIs (7 cards), busca (id/nome/e-mail), filtro de status e de fulfillment, tabela com paginação client-side (10/25/50/100 por página, first/prev/next/last), seleção múltipla por página, botão "+ Venda manual".

**Arquivos alterados:**
- `apps/web/src/admin-v2/shared/api.ts` — 5 clientes novos: `fetchOrdersFull` (`GET /orders`), `fetchOrdersSummary` (`GET /orders/summary`), `updateOrderStatus` (`PATCH /orders/:id` genérico — o existente `confirmOrderPayment` só cobria o caso específico de `status=PAGO`+nota do `PLAN-0030`), `bulkAdvanceOrders` (`PATCH /orders/bulk/advance`), `createManualSaleOrder` (`POST /orders`). Nenhum endpoint novo no backend — os 5 já existiam pro admin legado.
- `apps/web/src/admin-v2/AdminV2Root.tsx` — nova entrada `"lista"` em `OperationsTabKey`, `OPERATIONS_SUBTAB_LABELS`, array de abas (`OperationsTabs`), detecção de área (`isListaArea`) e rota (`<Route path="operacao/lista" element={<OrdersListView />} />`). Reusa o `isOperationsArea`/breadcrumb já existentes — nenhuma duplicação de lógica de navegação.

### Onda 2 — Modal de detalhe

**Arquivo novo:** `apps/web/src/admin-v2/operations/orders/components/OrderDetailModal.tsx` — somente leitura, replica 1:1 o que o drawer legado mostrava: badges de status/fulfillment, total, dados do cliente, canal, criado/atualizado em, bloco de envio (transportadora/rastreio/notas, só aparece se algum estiver preenchido), tabela de itens (produto/serviço/plano — sem edição, igual o legado), tabela de pagamentos, lista de histórico de status completo (`de → para (fonte) — nota · data`).

### Onda 3 — Modal de edição

**Arquivo novo:** `apps/web/src/admin-v2/operations/orders/components/OrderEditModal.tsx` — dois blocos independentes (status do pedido; fulfillment + transportadora + rastreio + notas), cada um com seu próprio botão de salvar — mesmo desenho do legado (2 formulários, não 1). Opções que avançam etapa ficam `disabled` no `<select>` quando `requiresApprovedPayment(order.payments)` é verdadeiro — mesma regra que o backend já valida de novo (isto é só feedback de UX, não a validação real).

### Onda 4 — Ação em lote

Sem arquivo novo — `handleBulkAdvance` em `OrdersListView.tsx`, usando `bulkAdvanceOrders`. Mensagem de resultado replica o formato do legado ("N atualizado(s), M ignorado(s) [(K sem pagamento aprovado)]"), computada a partir de `results[].reason`.

### Onda 5 — Venda manual/balcão

**Arquivo novo:** `apps/web/src/admin-v2/operations/orders/components/ManualSaleModal.tsx` — carrega produtos+serviços+unidades em paralelo ao abrir (reusa `fetchProducts`/`fetchServices`/`fetchInventoryUnits`, já existentes em outros módulos do V2, nunca usados em Pedidos antes); catálogo unificado (mesmo escopo do legado — sem plano/assinatura); unidade obrigatória só quando há item de produto na venda; checagem de disponibilidade cross-unit (`fetchCrossUnitStock`) reativa à troca de produto/unidade; linhas com quantidade e total calculado no cliente (total real é recalculado no servidor, `POST /orders`, mesma regra S12 do legado).

### Onda 6 — Religar o link do Kanban

**Arquivo alterado:** `apps/web/src/admin-v2/operations/orders/components/OrderCardView.tsx` — link do card `BLOCKED` trocado de `/admin#vendas` (legado, sem deep-link pro pedido) pra `/admin-v2/operacao/lista?highlight={orderId}` (nativo, abre o detalhe do pedido específico direto). `OrdersListView.tsx` lê o parâmetro `highlight` num `useEffect`, abre `OrderDetailModal` pro pedido correspondente assim que a lista carrega, e remove o parâmetro da URL (`replace: true`) — não é um recurso que o legado jamais teve, é uma melhoria real habilitada pela migração.

### Onda 7 — Validação final

**Checklist do `ERR-0070` aplicado antes de considerar validado** (não só "o dado gravou certo"): `grep` em todas as classes Tailwind com colchete/breakpoint incomum usadas nos arquivos novos — `min-w-[200px]` (select de catálogo do `ManualSaleModal.tsx`) foi a única ausente do CSS servido; `tailwind.generated.css` regenerado (checklist documentado no próprio cabeçalho do arquivo, nova entrada de log adicionada); confirmado via novo hash do CSS gerado pelo `vite build` que a mudança foi de fato pega.

**E2E real (browser real via Chrome, login real, Postgres real):**
- Lista carregada com 43 pedidos reais, KPIs batendo com `GET /orders/summary` real (conferido também via `curl` direto).
- Modal de detalhe aberto pro pedido PV-39 — itens, pagamentos ("nenhum pagamento vinculado", correto pra esse pedido) e paginação ("página 1 de 5") conferidos.
- Ação em lote: 2 pedidos selecionados (PV-39, PV-22), "marcar próxima etapa" clicado — confirmado no banco (`PENDENTE→SEPARANDO`, `SEPARANDO→EMBALADO`) e na mensagem da UI ("2 atualizado(s), 0 ignorado(s)"); revertido ao final.
- Modal de edição: status de PV-31 trocado pra `PAGO` de verdade, salvo, confirmado no banco (`paymentConfirmedAt` preenchido); revertido ao final (incluindo a linha de `OrderStatusHistory` criada).
- Venda manual: formulário preenchido de ponta a ponta (cliente + 1 serviço, "Manicure"), `POST /orders` real criou o pedido 49 (`status=PAGO`, total `R$ 45,00` batendo com o preço de catálogo); apagado ao final (pedido + item + histórico).
- Deep-link: clicado o link "Ver detalhes →" de um card `BLOCKED` real no Kanban (pedido PV-30, "Estoque insuficiente...") — navegação real até a Lista nativa, modal de detalhe abrindo sozinho com os dados certos (incluindo a nota de estoque e o histórico "Pendente → Pago (SEED_ADMIN_V2_TEST_DATA)").
- Nenhum dado de teste avulso ficou pendente de limpeza ao final.

**Achado de processo (não um bug, uma nota pra próxima sessão parecida):** durante os testes intercalados (ação da UI + reversão direta via SQL, várias vezes em sequência rápida), a contagem "filtrado/total" da lista mostrou um valor transitório inconsistente (`39/43` num dos checks) — não reproduzido depois, quase certamente artefato do próprio teste (estado do React vs. banco divergindo momentaneamente por causa das minhas edições diretas de SQL fora do fluxo normal da UI), não um bug real da tela. Registrado aqui só por transparência, sem `ERR` aberto (não reproduzível, não confirmado como causa raiz real).

---

## Git Record of Delivery

### Pre-commit review

**Arquivos novos:**
- `apps/web/src/admin-v2/operations/orders/listTypes.ts`
- `apps/web/src/admin-v2/operations/orders/OrdersListView.tsx`
- `apps/web/src/admin-v2/operations/orders/components/OrderDetailModal.tsx`
- `apps/web/src/admin-v2/operations/orders/components/OrderEditModal.tsx`
- `apps/web/src/admin-v2/operations/orders/components/ManualSaleModal.tsx`

**Arquivos alterados:**
- `apps/web/src/admin-v2/shared/api.ts` — 5 clientes novos (ver Onda 1).
- `apps/web/src/admin-v2/AdminV2Root.tsx` — aba/rota "Lista".
- `apps/web/src/admin-v2/operations/orders/components/OrderCardView.tsx` — link do Kanban religado.
- `apps/web/src/styles/tailwind.generated.css` — regenerado (`min-w-[200px]`).
- `apps/web/src/admin-v2/operations/orders/OrdersBoardView.tsx`, `components/ConfirmPaymentModal.tsx`, `components/ConfirmDispatchModal.tsx` — mesmo lote, ajustes anteriores ao `PLAN-0031` (ID `PV-{id}` consistente com a Lista, coluna "Em Separação" por extenso).
- `memory/MODIFICATION_LOG.md`, `memory/logs/DEBUG-HISTORY.md`, `memory/progress.md`, `memory/plans/PLAN-0031-...md` (este arquivo).

**Validações executadas:** `apps/api` `tsc -b` + `npm run test` (134/134) PASS (backend não tocado); `apps/web` `tsc -b` + `npm run build` PASS; rebuild Docker (`web`) + `up -d --force-recreate`; E2E real completo (ver Onda 7); checklist do `ERR-0070` aplicado ao CSS; nenhum dado de teste avulso pendente.

- Step 2 (Commit authorization): _pendente — aguardando aprovação explícita._
- Step 3 (Commit confirmation): _pendente._
- Step 4 (Push authorization and result): _pendente._
- Push status: **PENDING**
