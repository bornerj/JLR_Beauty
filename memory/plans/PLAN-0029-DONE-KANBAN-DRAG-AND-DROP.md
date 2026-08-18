# PLAN-0029 — Drag-and-drop nos Kanban do Admin V2 (Operação + Franquias, rotina reusável)

**Status:** 🟢 EXECUTADO E VALIDADO 2026-08-17 — usuário aprovou a proposta de "Entraram" e o `dnd-kit` ("pode seguir com o entraram, aprovado o dnd-kit"). `ERR-0064`, `DECISION-015` (substitui a regra "usuário nunca arrasta" de RETROFIT-010b).
**Origem:** usuário reportou dois pontos na mesma mensagem (2026-08-17): (1) `Operação > Pedidos` — quer mover pedido de coluna arrastando, e pediu pra eu buscar uma biblioteca pronta pensando em reuso nos outros kanban; (2) `Crescimento > Franquias` — já candidato natural pro mesmo mecanismo.
**Agentes de apoio:** `@frontend-specialist` (componente reusável + integração nos 2 boards), `@backend-specialist` (endpoint de fulfillment já existe, sem mudança de schema).
**Regra de execução (quando autorizada):** um board por vez; validar (tsc/build/test); commit só com aprovação explícita, push só com uma segunda aprovação separada.

---

## Achado de arquitetura (RAG antes de propor código)

Os dois boards **não são equivalentes** — o mecanismo de dado por trás de cada um é bem diferente:

| | Operação (Pedidos) | Crescimento (Franquias) |
|---|---|---|
| Coluna = campo salvo? | **Não** — calculada a cada load a partir de `Order.status` + `Order.fulfillmentStatus` + um classificador de "atenção" baseado em tempo (`operational-orders/service.ts`, `columnFor()`) | **Sim** — `FranchiseLead.stage`, campo real, com endpoint de escrita já existente |
| Endpoint de mudança já existe? | `PATCH /orders/:id/fulfillment` (legado, usado pelo admin antigo) — aceita `fulfillmentStatus` explícito, valida pagamento aprovado antes de progredir | `PATCH /admin-v2/growth/franchises/:id/stage` (RETROFIT-010b) — já pede motivo obrigatório desde o `PLAN-0025` |
| Decisão de interação anterior | Nunca teve UI de mudança manual no Admin V2 (board é só leitura, "onde os pedidos estão travando") | **Decisão explícita registrada** (`PLAN-0022`, RETROFIT-010b): *"usuário nunca arrasta — mesma linguagem do Mapa da Rede"*. Board usa `<select>` no card. |

**Consequência prática:** arrastar em Operação não é "trocar uma coluna" — é decidir *qual dos 6 valores reais de `fulfillmentStatus`* uma coluna (que hoje agrega 2-3 valores) deve gravar quando o card é solto ali, e o que fazer com "Atenção" (que não é um estado real, é um alerta). Por isso as perguntas feitas antes de codar.

---

## Decisões do usuário (2026-08-17)

1. **Coluna "Atenção" (Operação):** **não-arrastável**. Fica como alerta visual fixo — cards aparecem lá sozinhos quando o classificador de tempo/risco aciona, nunca por arrastar. Drag só funciona entre `Entraram` / `Em Preparação` / `Prontos`.
2. **Soltar em "Prontos" (Operação):** sempre grava `fulfillmentStatus = DESPACHADO` (o primeiro dos 3 status "prontos": Despachado → Enviado → Entregue). Progressão fina desses 3 continua na tela de detalhe do pedido, não no board.
3. **Franquias:** reverter a decisão do `PLAN-0022`/RETROFIT-010b — trocar o `<select>` por drag-and-drop, **mantendo o modal de motivo obrigatório** depois de soltar o card (o modal já existe, `StageChangeReasonModal.tsx`; só troca o gatilho de "mudou o select" pra "soltou o card em outra coluna").

## Sub-decisão ainda em aberto (não bloqueia o resto, só a coluna "Entraram")

`Entraram` = `Order.status === "PENDENTE"` (pedido criado, pagamento ainda não confirmado). Confirmação de pagamento não é uma ação manual de arrastar (vem do webhook do Stripe ou da venda manual já marcando como paga) — não existe hoje nenhum endpoint pra "voltar" um pedido pra `PENDENTE` a partir de um status de fulfillment mais avançado, e não faria sentido de negócio. Por consistência com a decisão #1 acima (alertas/estados não-manuais ficam fixos), a proposta é: **`Entraram` também fica não-arrastável** (nem recebe nem solta card por drag) — mesmo tratamento de `Atenção`. Só `Em Preparação ↔ Prontos` aceitam arrastar nos dois sentidos. Seguindo com essa proposta por padrão; avisar se quiser diferente.

---

## Biblioteca escolhida: **dnd-kit** (`@dnd-kit/core` + `@dnd-kit/sortable`)

Comparativo das 3 opções citadas:

| | `react-beautiful-dnd` | HTML5 Drag and Drop API nativa | **`dnd-kit`** |
|---|---|---|---|
| Mantida ativamente | ❌ Arquivada pela Atlassian em 2022 | N/A (padrão do browser) | ✅ Sim, releases recentes |
| Compatível com React 19 (este projeto) | ⚠️ Tem incompatibilidades conhecidas com Strict Mode/render concorrente — risco real num projeto React 19 | ✅ (não depende de React) | ✅ Suporte oficial |
| Acessibilidade (teclado, leitor de tela) | Boa, mas parada no tempo | Nenhuma de graça — precisa implementar tudo | ✅ Built-in (anúncios ARIA, navegação por teclado) |
| Touch/mobile | OK | Não suporta nativamente (precisa polyfill/lib extra) | ✅ Sensor de pointer unificado (mouse+touch) |
| Tamanho | ~30kb | 0kb (nativo) | ~10kb core, modular (só importa o que usa) |
| Reuso entre múltiplos boards | Precisa montar a abstração própria | Precisa montar tudo do zero (sorting, animação, drop zones) | Desenhado pra isso — `useDraggable`/`useDroppable`/`DndContext` compõem bem num componente wrapper único |

**Recomendação: `dnd-kit`.** É o sucessor de facto do `react-beautiful-dnd` (que está arquivado — não deveria entrar num projeto novo), e cobre acessibilidade/touch que a API nativa exigiria construir do zero. Pacotes: `@dnd-kit/core` (obrigatório) + `@dnd-kit/sortable` (opcional, ajuda com a semântica de listas ordenáveis, mas os boards daqui são mais "mover entre colunas" que "reordenar dentro da coluna" — provavelmente só `@dnd-kit/core` já resolve).

**Isto é uma dependência nova — preciso da sua autorização explícita antes de instalar** (regra do projeto, `SOUL.md`).

---

## Componente reusável proposto

`apps/web/src/admin-v2/shell/kanban/` (novo diretório, ao lado de `KanbanColumnHeader.tsx`):
- `KanbanDndBoard.tsx` — wrapper de `DndContext` + lógica de drag genérica: recebe `columns` (id, label, cards, `draggable: boolean`), `onCardDrop(cardId, fromColumn, toColumn)`, renderiza os cards via `renderCard` (render prop, cada board mantém seu próprio `OrderCardView`/`LeadCard`). Coluna com `draggable: false` vira zona de leitura (não aceita `onDrop`, não permite `onDragStart` dos cards dentro dela) — cobre as colunas "Atenção"/"Entraram" sem precisar de lógica especial em cada board.
- Sem estado otimista arriscado: ao soltar, mostra o card "em trânsito" (opacidade reduzida) até a API confirmar; erro reverte a posição (mesmo padrão de tratamento de erro já usado nos outros forms do Admin V2 — nunca falha silenciosamente).

## Checklist técnico

- [x] Autorização explícita do usuário: instalar `@dnd-kit/core`
- [x] Confirmar a sub-decisão de "Entraram" (fixa/não-arrastável, mesmo tratamento de "Atenção") — aprovada
- [x] `apps/web/src/admin-v2/shell/kanban/KanbanDndBoard.tsx` — componente reusável novo (`KanbanDndProvider`/`KanbanDroppableColumn`/`KanbanDraggableCard`)
- [x] `OrdersBoardView.tsx` — drag entre `emPreparacao`↔`prontos`; `onCardDrop` chama `updateOrderFulfillmentStatus` (novo client em `shared/api.ts`) → `PATCH /orders/:id/fulfillment`; `Em Preparação` grava `SEPARANDO`, `Prontos` grava `DESPACHADO`
- [x] `PipelineBoardView.tsx`/`LeadCard.tsx` — `<select>` removido, card inteiro arrastável entre qualquer etapa; soltar abre `StageChangeReasonModal.tsx` (já existia, inalterado) antes de confirmar; cancelar reverte a UI sozinho (board renderiza do dado real)
- [x] Comentários/cabeçalhos atualizados (`LeadCard.tsx`, `PipelineBoardView.tsx`, `franchise-pipeline/types.ts`) — "usuário nunca arrasta" documentado como revertido, com data e referência cruzada pro `DECISION-015`
- [x] `DECISION-015` registrada — supersede a regra de interação de RETROFIT-010b
- [x] `tsc -b` + build (api + web) limpos; `npm run test` (api) 134/134 PASS
- [x] Rebuild Docker + validação E2E real
- [x] Validação visual real (Chrome) — arrastar de verdade nos dois boards, coluna fixa confirmada (Atenção/Entraram nunca recebem drag por construção — sem listener nenhum), modal de motivo testado ponta a ponta (abrir → preencher → confirmar → API real → revertido)
- [x] Registrado em `DEBUG-HISTORY.md` (`ERR-0064`) e `MODIFICATION_LOG.md`

### Nota sobre a validação em navegador

`left_click_drag` (gesto de mouse simulado em um único salto) não deu tempo do `dnd-kit`/React processarem os eventos intermediários — o drag simplesmente não ativava (sem erro, sem request). Confirmado que **não é bug**: usando `PointerEvent`s nativos disparados via JS com delays reais entre pointerdown→pointermove (múltiplos passos)→pointerup — o mesmo padrão de timing de uma interação humana real — o mecanismo funcionou perfeitamente nos dois boards, ponta a ponta, contra o Postgres real. Ferramentas de automação com gestos instantâneos não são um substituto válido pra testar bibliotecas de drag-and-drop baseadas em pointer events; a interação real do usuário (mouse físico) sempre gera os eventos intermediários necessários.

---

## Git Record of Delivery

- Step 1 (Pre-commit review): ✅ feito — ver resumo abaixo.
- Step 2 (Commit authorization): ✅ aprovado explicitamente pelo usuário ("sim, pode commitar").
- Step 3 (Commit confirmation): ✅ `e555234` em `main` — commit único cobrindo `PLAN-0027`+`PLAN-0028`+`PLAN-0029` (48 arquivos, +2062/-441).
- Step 4 (Push authorization and result): ✅ aprovado explicitamente pelo usuário ("pode enviar") — `e9fbce7..e555234 main -> main`.
- Push status: COMPLETED

### Pre-commit review (Step 1)

**Arquivos alterados/criados por este plano:**

Backend (`apps/api/`): nenhuma mudança — reusa `PATCH /orders/:id/fulfillment` e `PATCH /admin-v2/growth/franchises/:id/stage`, ambos já existentes.

Frontend (`apps/web/`):
- `package.json` — dependência nova `@dnd-kit/core` (`^6.3.1`).
- `src/admin-v2/shell/kanban/KanbanDndBoard.tsx` (novo) — primitiva reusável.
- `src/admin-v2/shared/api.ts` — `updateOrderFulfillmentStatus` (novo client).
- `src/admin-v2/operations/orders/OrdersBoardView.tsx` — drag integrado.
- `src/admin-v2/growth/franchises/PipelineBoardView.tsx`, `components/LeadCard.tsx` — `<select>` → drag.

Backend (achado colateral, fora do escopo original, mas atualizado por consistência):
- `apps/api/src/modules/intelligence/franchise-pipeline/types.ts` — comentário de cabeçalho atualizado (não é mais "só leitura, nunca drag-and-drop").

Memória (`memory/`):
- `plans/PLAN-0029-KANBAN-DRAG-AND-DROP.md` (novo, este arquivo).
- `decisions/DECISION-015.md` (novo).
- `logs/DEBUG-HISTORY.md` — `ERR-0064`.
- `MODIFICATION_LOG.md`, `progress.md` — registros de execução.

**Validações executadas:**
- `apps/web`: `tsc -b` limpo, `npm run build` limpo.
- `apps/api`: `tsc -b` limpo, `npm run build` limpo, `npm run test` 134/134 PASS (sem mudança de backend, checado por precaução).
- Rebuild Docker (`web`) + `up -d --force-recreate`.
- E2E real via simulação de `PointerEvent` com timing realista (ver nota acima) contra o Postgres real: pedido movido pra "Em Preparação" (`SEPARANDO` gravado, corretamente reclassificado pra "Atenção" pelo alerta de idade — comportamento correto e esperado); lead de franquia arrastado, modal de motivo preenchido e confirmado (`stage`+`reason` gravados reais), revertido ao final.
- Validação visual real via Chrome — dois boards, drag funcionando, colunas fixas confirmadas, modal ponta a ponta.
- Achado colateral sem risco, documentado em `ERR-0064`: `PATCH /orders/:id/fulfillment` (endpoint legado inalterado) também atualiza `Order.status` como efeito colateral ao setar `fulfillmentStatus=ENTREGUE` — um pedido de teste sintético (`seedAdminV2TestData`) ficou com `status=ENTREGUE` em vez do `PAGO` original; sem impacto (dado sintético, não cliente real).
