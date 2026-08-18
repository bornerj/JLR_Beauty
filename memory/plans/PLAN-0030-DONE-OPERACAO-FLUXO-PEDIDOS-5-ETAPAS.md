# PLAN-0030 — Board Operacional de Pedidos: fluxo real de 5 etapas (Recebido → Pago → Em Separação → Pronto → Despachado/Entregue)

**Status:** ✅ DONE 2026-08-18 — E2E real (curl + drag simulado via `PointerEvent`) contra Postgres real, nas 5 transições + os 2 modais (incluindo os 2 sub-caminhos de Despachado/Entregue) + flag desligada bloqueando o drop em "Pago" + Addendum 2 ("Atenção" virou selo, não mais coluna). `DECISION-016`, `ERR-0065`, `ERR-0066`. Commitado (`c7160da`, `3e5d82a`) e pushado (`origin/main` `6ccb472..3e5d82a`), ambos com aprovação explícita e separada do usuário.
**Origem:** usuário reportou (2026-08-18) que os pedidos parados em "Entraram" não tinham como ser movidos. Investigação ao vivo (drag real testado no ambiente Docker local + inspeção do banco) revelou que a solução simples (reusar o endpoint de fulfillment) não funciona — ver "Achado de arquitetura" abaixo. O usuário decidiu, a partir daí, redesenhar o fluxo inteiro pra 5 etapas reais em vez de só destravar a coluna antiga.
**Sub-item já executado e validado nesta sessão (fora do escopo restante deste plano):** fix do tooltip "Motivo" no Kanban de Franquias (`ERR-0065`) — nativo (`title`) trocado por tooltip próprio, sempre mostra "Motivo" com fallback "N/A". `apps/web/src/admin-v2/growth/franchises/components/LeadCard.tsx`. `tsc`/build limpos, validado visualmente via Chrome (texto real e "N/A" confirmados). Sem commit/push ainda (mesmo lote deste plano).

---

## Achado de arquitetura (por que a solução simples não serve)

Testei ao vivo (token real via `/auth/login`, drag simulado com `PointerEvent` real, board rodando em Docker local) arrastar um pedido de "Entraram" pra "Em Preparação" gravando `fulfillmentStatus = SEPARANDO` (reuso do endpoint existente, mesma lógica já usada em Em Preparação↔Prontos). Resultado real:

- O backend aceitou e gravou `fulfillmentStatus = SEPARANDO` sem erro.
- O card **não saiu de "Entraram"** — porque `columnFor()` (`operational-orders/service.ts`) decide a coluna assim: `if (order.status !== "CANCELADO" alerta) → atencao; if (order.status === "PENDENTE") → entraram` **antes de olhar pro `fulfillmentStatus`**. "Entraram" = pedido com `status` ainda `PENDENTE` (pagamento não confirmado) — não é sobre fulfillment.
- Resultado: um pedido "não pago" ficou com `separatedAt` preenchido e `fulfillmentStatus = SEPARANDO`, inconsistente. Revertido no banco (dado de teste, sem impacto real).

Ou seja: a única forma de um pedido sair de "Entraram" é o `status` deixar de ser `PENDENTE` — isso é **confirmação de pagamento**, uma ação com peso financeiro, não um simples "mover etapa visual". Daí a decisão do usuário de reformular o fluxo inteiro em vez de forçar a coluna antiga a aceitar drag.

---

## Decisões do usuário (2026-08-18)

Fluxo novo, 5 etapas sequenciais + a coluna de alerta "Atenção" (inalterada, sempre fixa, sem drag — já decidido nesta sessão antes da reformulação):

1. **RECEBIDO** — `Order.status = PENDENTE`. Pedido só foi criado, nada confirmado ainda. (Equivalente ao antigo "Entraram", renomeado pra bater com a semântica real.)
2. **PAGO** — `Order.status = PAGO`, `fulfillmentStatus` ainda `PENDENTE`. Mover um card pra cá **pede confirmação de nome e data de quem confirmou o recebimento** (não existe integração de meio de pagamento funcionando pra essa parte do fluxo ainda — é confirmação manual). Registrado como texto em `OrderStatusHistory.note` (campo já existe, sem migration): *"Pagamento confirmado manualmente por {nome} em {data}"*.
   - **Flag nova** (`Setting` no banco, chave `operations.manualPaymentConfirmationEnabled`, mesmo padrão dos outros toggles do Admin V2 — sem precisar de redeploy pra mudar): enquanto `true` (padrão hoje), a confirmação manual fica disponível. Quando uma integração de pagamento real cobrir esse fluxo, a flag vira `false` e a coluna "Pago" deixa de aceitar drop manual (passa a esperar confirmação automática, ex. webhook).
3. **EM SEPARAÇÃO** — `fulfillmentStatus ∈ {SEPARANDO, EMBALADO}`. Sem modal, drag direto — mesmo comportamento de hoje (`EMBALADO` continua agregado aqui, sem virar uma coluna própria, decisão já tomada).
4. **PRONTO** — `fulfillmentStatus = DESPACHADO`. Sem modal, drag direto (equivalente ao que a coluna "Prontos" já grava hoje).
5. **DESPACHADO/ENTREGUE** — etapa final. Ao soltar um card aqui, **pergunta se foi despachado ou entregue**:
   - **Entregue** (ex.: venda balcão, retirada): confirma direto → `fulfillmentStatus = ENTREGUE` (endpoint já seta `deliveredAt` + `status = ENTREGUE` sozinho, sem campo extra).
   - **Despachado** (ex.: envio via transportadora): pede **meio** (texto livre, ex. "Correios") **e data** — campo de data editável, aceita datas passadas (ex. "05/10", registro retroativo) → `fulfillmentStatus = ENVIADO`, grava `shipmentCarrier` (campo já existe) e `shippedAt` com a data escolhida (hoje o endpoint sempre grava `new Date()`; precisa aceitar a data vinda do formulário).

**Sem migration de banco em nenhum ponto** — todo o fluxo novo usa enums (`OrderStatus`, `FulfillmentStatus`) e campos (`shipmentCarrier`, `shippedAt`, `OrderStatusHistory.note`) que já existem hoje, mais a tabela genérica `Setting` (`/api/settings/:key`, já usada por Entrega/WhatsApp/Branding no Admin V2) pra flag nova.

---

## Mapeamento técnico

### `columnFor()` novo (`apps/api/src/modules/intelligence/operational-orders/service.ts`)

```ts
const columnFor = (order, card) => {
  if (card.operationalState !== "NORMAL") return "atencao";              // alerta tem prioridade (regra já existente)
  if (order.status === "PENDENTE") return "recebido";
  if (order.status === "PAGO" && order.fulfillmentStatus === "PENDENTE") return "pago";
  if (order.fulfillmentStatus === "DESPACHADO") return "pronto";
  if (order.fulfillmentStatus === "ENVIADO" || order.fulfillmentStatus === "ENTREGUE") return "despachadoEntregue";
  return "emSeparacao"; // catch-all: SEPARANDO, EMBALADO (mesmo papel do antigo default da coluna "Em Preparação")
};
```

### Tipos (`operational-orders/types.ts` + espelho `apps/web/.../operations/orders/types.ts`)

`OrdersBoard["columns"]` passa de `{ entraram, emPreparacao, atencao, prontos }` pra `{ recebido, pago, emSeparacao, pronto, despachadoEntregue, atencao }`.

### Endpoints (reuso — nenhum endpoint novo)

- `PATCH /orders/:id` (`routes/orders.ts`) — `orderUpdateSchema` ganha `note?: string` opcional (usado só quando enviado; sem mudança de comportamento pra quem já chama sem esse campo, ex. admin legado). Usado pela transição RECEBIDO→PAGO.
- `PATCH /orders/:id/fulfillment` — `orderFulfillmentUpdateSchema` ganha `shippedAt?: string` (ISO, opcional) — quando enviado e `fulfillmentStatus = ENVIADO`, usa essa data em vez de `new Date()`. `shipmentCarrier` já existe no schema, só falta o frontend mandar.
- Gate de pagamento existente (`requiresApprovedPayment && isProgressingStatus`, ambos os endpoints) **continua valendo sem alteração** — se um pedido tiver um `Payment` vinculado e não aprovado (ex. checkout Stripe abandonado), a confirmação manual de "Pago" é bloqueada com erro claro (409), igual já acontece hoje. A flag nova não contorna essa validação.

### Frontend (`apps/web/src/admin-v2/operations/orders/`)

- `OrdersBoardView.tsx` — 6 colunas (5 sequenciais + Atenção). **Decisão do usuário (2026-08-18): sem scroll horizontal** — grid responsivo que quebra linha (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`), cabendo todas as 6 em uma linha só em telas grandes e quebrando em 2-3 linhas em telas menores; cada coluna cresce em altura conforme a quantidade de cards (comportamento natural do grid, mesmo padrão de hoje).
- **Labels curtos:** RECEB · PAGO · EM SEP · PRONTO · DESP/ENTR · ATENÇÃO — os 4 primeiros literais do usuário; "DESP/ENTR" e "ATENÇÃO" (mantida) escolhidos por mim seguindo o mesmo padrão. Implementado.
- Matriz de drag: `recebido`(origem)→`pago`(destino, com modal); `pago`(origem)→`emSeparacao`(destino, direto); `emSeparacao`(origem)→`pronto`(destino, direto); `pronto`(origem)→`despachadoEntregue`(destino, com modal). Cada etapa só aceita a anterior imediata como origem (sem pular etapa, mesma regra já usada nesta sessão). `despachadoEntregue` é terminal (não-arrastável como origem). `atencao` continua sem drag nenhum.
- 2 modais novos (`operations/orders/components/`): `ConfirmPaymentModal.tsx` (nome + data) e `ConfirmDispatchModal.tsx` (escolha Despachado/Entregue; Despachado abre campos de meio + data). Estilo visual seguindo o padrão já usado em `StageChangeReasonModal.tsx` (Franquias) — cancelar reverte a UI sozinha, board sempre renderiza do dado real.
- Coluna "Pago" busca a flag (`fetchSetting({ key: "operations.manualPaymentConfirmationEnabled" })`) ao carregar o board; ausente/`true` = aceita drop (comportamento padrão hoje); `false` = coluna vira não-droppable.

---

## Riscos / pontos de atenção já mapeados

- Pedidos que hoje têm `Payment` vinculado não aprovado continuam bloqueados de virar "Pago" manualmente — comportamento correto, não é regressão.
- `OrderFlowTimeline` (gráfico "Fluxo do Pedido") não usa as chaves de coluna do board — só timestamps (`createdAt`/`paymentConfirmedAt`/etc.) — não precisa de nenhuma mudança.
- Nenhum dado histórico precisa de migração — a reclassificação é 100% em tempo de leitura (`columnFor()`), igual já é hoje.

---

## Checklist de execução

1. ✅ Backend: `operational-orders/types.ts` (+ espelho frontend `types.ts`) — novo shape de `columns`.
2. ✅ Backend: `columnFor()` reescrito, comentário atualizado.
3. ✅ Backend: `PATCH /orders/:id` — aceita `note` opcional.
4. ✅ Backend: `PATCH /orders/:id/fulfillment` — aceita `shippedAt` opcional.
5. ✅ Frontend: `shared/api.ts` — `confirmOrderPayment` novo; `updateOrderFulfillmentStatus` ganhou `shipmentCarrier`/`shippedAt` opcionais.
6. ✅ Frontend: `OrdersBoardView.tsx` — 6 colunas, grid sem scroll (`xl:grid-cols-6`), matriz de drag, busca da flag.
7. ✅ Frontend: `ConfirmPaymentModal.tsx`, `ConfirmDispatchModal.tsx` (novos).
8. ✅ Validação: `tsc -b` + build + testes (api 134/134, web) PASS; rebuild Docker (`api`+`web`); E2E real (curl login real + drag simulado via `PointerEvent`, Postgres real) nas 5 transições + os 2 modais (incluindo os 2 sub-caminhos de Despachado/Entregue) + flag desligada (drop em "Pago" corretamente bloqueado, sem modal, sem mudança de estado); dados de teste revertidos ao final (2 pedidos + histórico + a linha de `Setting` da flag).
9. ✅ `DECISION-016` — registra o novo modelo de 6 colunas e a flag, supersedendo o exemplo de "Entraram" fixo da `DECISION-015` regra #1.
10. ✅ `ERR-0065` (tooltip Motivo, Franquias) e `ERR-0066` (achado que motivou o redesenho) registrados.
11. ✅ `memory/MODIFICATION_LOG.md` + `memory/progress.md` atualizados.
12. ⏳ Git Record of Delivery (abaixo) — commit só com aprovação explícita, push só com uma segunda aprovação separada.

Também tocado nesta sessão, fora do escopo original do plano: fixtures de teste (`gargalos/rules.test.ts`, `radar/rules.test.ts`) atualizadas pro novo shape de `OrdersBoard["columns"]` — só tipagem de mock, nenhuma regra de negócio dessas duas ondas foi alterada (ambas só leem `columns.atencao`, que não mudou).

---

## Addendum — destravar "Atenção" (2026-08-18, mesma sessão)

Usuário perguntou, depois da entrega inicial: se os cards em Atenção não podem ser movidos, como resolver a situação deles? "Atenção" não é uma 6ª etapa — é um alerta de tempo (`classifier.ts`, já existente, inalterado) por cima do fulfillment real, que pode estar em qualquer ponto das 5 etapas. Decisões do usuário:
1. **Cards de Atenção viram arrastáveis** (exceto `BLOCKED`) — usam `naturalColumnFor()` (novo, mesma lógica do `columnFor()` do backend sem a prioridade do alerta) pra descobrir a etapa real, e só aceitam soltar no próximo passo real (reusa os mesmos modais/validações das 5 etapas, sem UI nova). Caso especial sem próximo passo (pedido já `ENVIADO`, só falta confirmar entrega): soltar de volta na própria coluna "Despachado/Entregue" marca `ENTREGUE` direto, sem modal.
2. **`BLOCKED`** (estoque insuficiente, `fulfillmentNotes` com `[ESTOQUE]`) é diferente — não se resolve avançando etapa. Fica sempre fixo (nunca arrastável) e ganha um link fixo no card pro Admin legado (`/admin#vendas`, mesmo padrão de deep-link por hash do `HubCard.tsx`) — sem deep-link pro pedido específico (limitação já documentada em `OrderCardView.tsx`), o admin busca pelo código público mostrado no card.

**Arquivos adicionais:** `apps/web/src/admin-v2/operations/orders/OrdersBoardView.tsx` (`naturalColumnFor()`, `NEXT_COLUMN`, draggable por card em "Atenção", caso especial `despachadoEntregue`→`ENTREGUE`); `apps/web/src/admin-v2/operations/orders/components/OrderCardView.tsx` (link "Ver no Admin →" pra `BLOCKED`). Nenhuma mudança de backend, nenhuma migration.

**Validado ao vivo:** drag de um card `PAGO·SEPARANDO` em Atenção pra "Pronto" (gravou `DESPACHADO`, permaneceu em Atenção — ainda demorado), depois pra "Despachado/Entregue" (abriu o modal, escolhido "Entregue", gravou `ENTREGUE` — **saiu de Atenção**, confirmado); os 3 pedidos `BLOCKED` reais (dado de seed, estoque insuficiente) mostrando o link, não-arrastáveis, link testado navegando pro Admin legado (`/admin#vendas`) de verdade. `tsc`/build limpos. Dado de teste (pedido 29) revertido ao final.

**Achado colateral (não é bug, não corrigido — fora de escopo):** ao validar, encontrei 2 pedidos (`PV-MSRI9CSB-A8H2`/id 14, `PV-MSRI9D6P-X1EW`/id 22) já com `status=PAGO`/`fulfillmentStatus` avançado e histórico com nomes reais ("Jeiel"/"Borner") — **o próprio usuário testou o fluxo ao vivo** entre as minhas rodadas de validação, confirmando pagamento de verdade em 2 pedidos reais pela UI. Não revertido — é uso real do usuário, não dado de teste meu. Fica registrado aqui pra não confundir numa averiguação futura.

**Este addendum foi commitado** (`c7160da`) antes do próximo achado abaixo — a coluna "Atenção" descrita aqui foi **substituída** pelo Addendum 2 no mesmo dia, ainda sem push.

---

## Addendum 2 — "Atenção" deixa de ser coluna, vira selo (2026-08-18, mesma sessão, depois do commit `c7160da`)

Usuário testou o Addendum 1 ao vivo e reportou: "nenhum pedido que tentei mover de atenção foi movido, todos voltam". Investigação confirmou que os drags **estavam funcionando de verdade** (6 pedidos diferentes avançaram `SEPARANDO`/`EMBALADO` → `DESPACHADO` no banco, dados reais) — o problema era 100% visual: "Atenção" continuava sendo uma coluna **exclusiva** com prioridade sobre a etapa real (regra herdada do `PLAN-0022`, governança #4), então um card avançava de verdade e mesmo assim reaparecia no mesmo lugar (ainda atrasado = ainda flagueado = ainda cai em "Atenção"), parecendo que nada tinha acontecido.

Duas opções levantadas pro usuário — ele escolheu a mudança maior:
- (não escolhida) manter "Atenção" como coluna e só adicionar um aviso de confirmação (toast) no drag;
- **(escolhida) "Atenção" deixa de ser uma coluna do kanban.** Board volta a ter só as 5 colunas reais (nunca 6). Todo pedido aparece sempre na sua coluna real (`columnFor()` sem desvio de prioridade); os flagueados (`operationalState !== "NORMAL"`) ganham um **selo inline** no próprio card (já existia — `card.reason`/`OrderCardView.tsx`, não precisou mudar) e entram num **agregado** `board.columns.atencao` (`count`/`totalValue`, computado em paralelo às 5 colunas reais, não mais exclusivo — um pedido pode estar simultaneamente na sua coluna real e no agregado). O agregado alimenta um banner de resumo no topo do board ("⚠ N pedido(s) precisam de atenção · R$ X em jogo") e continua alimentando Gargalos/Radar (RETROFIT-011/012) sem nenhuma mudança nesses dois módulos — eles só liam `count`/`totalValue`, que continuam com o mesmo significado agregado.

**Efeito colateral positivo, generalizado:** o caso "pedido `ENVIADO` sem confirmação de entrega" deixa de ser exclusivo de cards flagueados — agora vale sempre, pra qualquer card na coluna "Despachado/Entregue": soltar de volta na própria coluna marca `ENTREGUE`, sem modal.

**Arquivos:** `apps/api/src/modules/intelligence/operational-orders/service.ts` (`columnFor()` volta a ser só as 5 etapas reais, sem branch de prioridade; loop principal passa a empurrar cada pedido pra coluna real sempre +, em paralelo, pro agregado `atencao` quando flagueado); `apps/web/src/admin-v2/operations/orders/OrdersBoardView.tsx` (reescrito: `COLUMN_ORDER` volta a 5, remove `naturalColumnFor()`/lógica especial de origem "Atenção" — não precisa mais, já que a coluna exibida é sempre a real —, banner de resumo, regra de `despachadoEntregue` generalizada). Nenhuma migration, nenhum endpoint novo. `types.ts` (api+web) sem mudança de shape (`atencao` continua existindo no tipo, só muda o que significa).

**Validado ao vivo (E2E real, Postgres real):** rebuild+redeploy `api`+`web`; drag de um card `PAGO·PENDENTE` flagueado (`PV-MSRI9CZK-WSPZ`) de "Pago" pra "Em Separação" — confirmado no banco (`SEPARANDO`) **e visualmente**: o card saiu fisicamente da coluna "Pago" e apareceu em "Em Separação", com o selo vermelho do motivo ainda visível ali — evidência clara de movimento, ao contrário do Addendum 1. Banner de resumo conferido ("30 pedido(s) precisam de atenção · R$ 8.150,10 em jogo"). Os 3 pedidos `BLOCKED` (estoque insuficiente) conferidos aparecendo na coluna real deles ("Pago"), com o link "Ver no Admin →", ainda não-arrastáveis. Grid de 5 colunas conferido sem scroll horizontal (`document.body.scrollWidth <= window.innerWidth`). `tsc`/build (api+web) limpos, `npm run test` 134/134 PASS (fixtures de `gargalos`/`radar` do Addendum original continuam válidas — shape do tipo não mudou). Dado de teste (pedido 18) revertido ao final.

`DECISION-016` atualizada: item 6b marcado como superado, item 6c registra o desenho final.

---

## Git Record of Delivery

### Step 1 — Pre-commit review (leva 1, commitada)

**Arquivos alterados:**
- `apps/api/src/routes/orders.ts` — `note` opcional em `PATCH /orders/:id`; `shippedAt` opcional em `PATCH /orders/:id/fulfillment`.
- `apps/api/src/modules/intelligence/operational-orders/types.ts` — novo shape de `OrdersBoard["columns"]` (6 colunas).
- `apps/api/src/modules/intelligence/operational-orders/service.ts` — `columnFor()` reescrito, colunas iniciais atualizadas, comentários.
- `apps/api/src/modules/intelligence/gargalos/rules.test.ts`, `apps/api/src/modules/intelligence/radar/rules.test.ts` — fixtures de mock atualizadas pro novo shape (só tipagem).
- `apps/web/src/admin-v2/operations/orders/types.ts` — espelho do shape novo.
- `apps/web/src/admin-v2/operations/orders/OrdersBoardView.tsx` — reescrito: 6 colunas, grid sem scroll, matriz de drag, flag, 2 modais novos, drag a partir de "Atenção" (addendum).
- `apps/web/src/admin-v2/operations/orders/components/OrderCardView.tsx` — link "Ver no Admin →" pra cards `BLOCKED` (addendum).
- `apps/web/src/admin-v2/operations/orders/components/ConfirmPaymentModal.tsx` (novo).
- `apps/web/src/admin-v2/operations/orders/components/ConfirmDispatchModal.tsx` (novo).
- `apps/web/src/admin-v2/shared/api.ts` — `confirmOrderPayment` novo; `updateOrderFulfillmentStatus` ganhou `shipmentCarrier`/`shippedAt`.
- `apps/web/src/admin-v2/shared/format.ts` — `formatDateInputBR` novo.
- `apps/web/src/admin-v2/growth/franchises/components/LeadCard.tsx` — `ERR-0065`, tooltip próprio no lugar do nativo.
- `memory/plans/PLAN-0030-...md` (novo), `memory/decisions/DECISION-016.md` (novo), `memory/logs/DEBUG-HISTORY.md` (`ERR-0065`, `ERR-0066`), `memory/MODIFICATION_LOG.md`, `memory/progress.md`.

**Validações executadas:** `apps/api` `tsc -b` PASS, `npm run test` 134/134 PASS; `apps/web` `tsc -b` + `npm run build` PASS; rebuild Docker (`api`+`web`) + `up -d --force-recreate`; E2E real completo (ver item 8 do checklist); nenhum dado de teste avulso ficou pendente de limpeza.

### Step 1b — Pre-commit review (leva 2, Addendum 2 — "Atenção vira selo")

**Arquivos alterados:**
- `apps/api/src/modules/intelligence/operational-orders/service.ts` — `columnFor()` volta a computar só a coluna real (sem branch de prioridade); loop de `getOrdersBoard()` passa a empurrar cada pedido pra coluna real sempre + em paralelo pro agregado `atencao` quando flagueado.
- `apps/web/src/admin-v2/operations/orders/OrdersBoardView.tsx` — reescrito: volta a 5 colunas reais, remove `naturalColumnFor()`/lógica de origem especial de "Atenção", banner de resumo do agregado, regra de `despachadoEntregue`→confirmar `ENTREGUE` generalizada (não mais exclusiva de cards flagueados).
- `memory/plans/PLAN-0030-...md`, `memory/decisions/DECISION-016.md` (item 6b marcado superado, 6c novo), `memory/MODIFICATION_LOG.md`, `memory/progress.md`.

**Validações executadas:** `apps/api` `tsc -b` PASS, `npm run test` 134/134 PASS; `apps/web` `tsc -b` + `npm run build` PASS; rebuild Docker (`api`+`web`) + `up -d --force-recreate`; E2E real via drag simulado (`PAGO→EM SEP` confirmado no banco e visualmente, card saiu fisicamente da coluna de origem); banner de resumo conferido; os 3 `BLOCKED` reais conferidos na coluna real deles, ainda não-arrastáveis; grid de 5 colunas sem scroll horizontal conferido. Dado de teste (pedido 18) revertido ao final.

- Step 2 (Commit authorization, leva 1): aprovado explicitamente pelo usuário ("pode commitar", 2026-08-18).
- Step 3 (Commit confirmation, leva 1): `c7160da`, branch `main`, 18 arquivos (760 inserções, 102 remoções).
- Step 2b (Commit authorization, leva 2 — Addendum 2): aprovado explicitamente pelo usuário ("pode commitar", 2026-08-18).
- Step 3b (Commit confirmation, leva 2): `3e5d82a`, branch `main`, 6 arquivos (131 inserções, 86 remoções).
- Step 4 (Push authorization and result, as duas levas juntas): aprovado explicitamente pelo usuário ("pode fazer o push", 2026-08-18). Resultado: `origin/main` `6ccb472..3e5d82a` (2 commits, `c7160da`+`3e5d82a`).
- Push status: **COMPLETED**
