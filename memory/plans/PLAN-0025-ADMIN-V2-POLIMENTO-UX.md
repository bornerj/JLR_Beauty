# PLAN-0025 — Admin V2: Polimento de UX + Motivo de Mudança de Etapa

**Status:** ✅ DONE — as 6 ondas (itens 1, 3, 4, 5, 6, 7) entregues e validadas de verdade (E2E
real + visual real com checagem de pixel). **Achado não previsto no planejamento, corrigido na
mesma leva** (surgiu durante o item 6): os 4 tokens semânticos `state-*` do Admin V2 nunca
tinham sido compilados no CSS servido desde a Onda 1 do `PLAN-0022` — ver `ERR-0049` e a seção
`## Onda 0 — achado não planejado` abaixo. Item 2 (Cadastros/Sistema nativos) segue desmembrado
para um `PLAN-0026` futuro, condicionado a atualizar a `DECISION-013` primeiro.
**Origem:** usuário trouxe uma lista de 7 itens de ajuste/melhoria depois do merge do PR #1 e da investigação dos achados #8/#9. RAG feito em todos os 7 antes de planejar; gate socrático aplicado nos 3 pontos que mudavam escopo/direção (respostas do usuário citadas abaixo).
**Decisão arquitetural herdada:** `DECISION-013` (ACTIVE) — este plano **não** a contraria; o item que contrariaria (telas nativas de Cadastros/Sistema) foi desmembrado, ver `## Item 2 — desmembrado, fora deste plano`.
**Escopo macro:** `apps/web/src/admin-v2/` (a maior parte, é polimento visual/UX), `apps/api/src/modules/intelligence/franchise-pipeline/` + `apps/api/src/routes/adminV2.ts` + 1 migração aditiva (item 3), `apps/api/src/modules/intelligence/panorama/` (item 7), `apps/web/src/modules/public-site/sections/AuthModalsSection.tsx` (item 4).
**Agentes de apoio:** `@frontend-specialist`, `@backend-specialist` (item 3 — migração + rota).

---

## Item 2 — desmembrado, fora deste plano

"Cadastros e Sistema precisam ser transportadas para o Admin V2 e modificadas para manter o mesmo layout" **contraria `DECISION-013` regra #5** (hoje: adapter/link pro legado, sem reescrita estética "até haver valor real comprovado"). É também de longe o maior item da lista — ~9-10 telas legadas (Produtos, Serviços, Planos, Cupons, Entrega, Pessoas com 3 sub-abas, Branding, Textos, Seções, Galeria, WhatsApp, Testes), cada uma com formulário/tabela/paginação próprios.

Decisão do usuário (gate socrático): **plano separado**. Antes de existir um `PLAN-0026` pra isso, é preciso:
1. Atualizar `DECISION-013` regra #5 formalmente (novo `DECISION-XXX` ou emenda direta, com o "valor real comprovado" que justifica a mudança de rumo).
2. Priorizar a ordem das ~10 telas (todas de uma vez é uma leva enorme; provavelmente vira várias ondas, uma por tela ou por grupo).

Não fabricado nenhum detalhe de execução aqui — fica registrado como pendência formal em `memory/progress.md` depois deste plano ser aprovado.

---

## Itens 1, 3, 4, 5, 6, 7 — este plano

### Onda 0 — achado não planejado: tokens `state-*` nunca compilados no CSS servido

Surgiu durante a validação visual do item 6 (contraste da Agenda-Capacidade): mesmo depois de
aumentar as opacidades em `state.ts`, checagem de pixel real (Playwright + PIL) mostrou a célula
de 0% praticamente idêntica ao branco de fundo. Investigação (`grep` nos CSS pré-compilados)
confirmou: os 4 tokens semânticos `state-critical`/`state-attention`/`state-healthy`/`state-info`
(`DECISION-013` regra #6, criados na Onda 1 do `PLAN-0022`) **nunca existiram no CSS servido, em
nenhuma forma** — o projeto usa CSS Tailwind pré-compilado e hand-maintained (`tailwind.css`,
`tailwind.react.patch.css`), sem nenhum passo de build Tailwind no `npm run build`/`Dockerfile`
(mesma causa raiz do `ERR-0040`, achada aqui em escopo sistêmico). Confirmado que isso apagava a
cor de badges de prioridade, bolinhas de saúde de rede, severidade do Radar/Gargalos — não só a
Agenda-Capacidade.

**Gate socrático aplicado antes de corrigir** (mudança de escopo grande o suficiente pra pedir
confirmação): usuário aprovou a regeneração de verdade via Tailwind CLI (`npx tailwindcss@3.4.17`,
confirmado funcional neste ambiente sem instalação prévia) em vez do remendo pontual só pro
item 6.

**Tentativa abortada por segurança:** substituir os 2 arquivos CSS pelo output do Tailwind CLI
foi cogitado e **rejeitado** — comparação classe-a-classe mostrou CSS customizado hand-written
misturado nos arquivos atuais (`.metric-card`, `.footer-*`, `.nav-*`, `.brand-*`, `.flip-card`,
`.display-*`, etc.) que `tailwindcss build` não reproduz; substituir teria apagado esse CSS e
quebrado o site público.

**Fix aplicado (aditivo, zero risco pro CSS existente):**
- [x] `apps/web/src/styles/tailwind.generated.css` (novo) — gerado via `npx tailwindcss@3.4.17`
  (só `@tailwind utilities`, sem Preflight), contendo as 161 classes usadas no código mas
  ausentes do CSS servido (os 4 tokens `state-*` completos + ~150 outras de gaps acumulados de
  sessões anteriores). Comentário de cabeçalho documenta o comando de regeneração.
- [x] `apps/web/src/main.tsx` — importa `tailwind.generated.css` por último (depois de
  `tailwind.css`/`tailwind.react.patch.css`/`legacy.css`).
- [x] `memory/logs/DEBUG-HISTORY.md` — `ERR-0049`.
- [x] `memory/logs/BUILD-HISTORY.md` — seção de referência sobre o pipeline de CSS pré-compilado
  e o comando de regeneração, pra não repetir esse levantamento manual numa sessão futura.

**Validado com checagem de pixel real** (não só visual "parece certo" — a lição desta
investigação): Agenda-Capacidade (0% → salmão `rgb(241,163,144)`, antes quase idêntico ao branco
`rgb(247,255,255)`), Panorama (bolinhas de rede verde/âmbar/vermelho), Insights (card de impacto
com tom vermelho, badges de prioridade coloridos — telas que este plano nem tocou, confirmando o
alcance sistêmico do fix).

---

### Onda 1 — Cabeçalho dos Kanban (item 1)

**Achado (RAG):** `NetworkView.tsx` e `OrdersBoardView.tsx` não têm nenhum fundo no cabeçalho da coluna — é só um `<p>` flutuando direto no fundo da página (que é quase branco), sem nenhuma barra visual separando "cabeçalho" de "cards". `PipelineBoardView.tsx` já tem uma caixa no cabeçalho, mas com `bg-white` — literalmente o mesmo fundo dos `LeadCard` abaixo, confirmando a queixa do usuário pra esse caso específico.

**Design:** componente novo compartilhado `apps/web/src/admin-v2/shell/KanbanColumnHeader.tsx` — wrapper com `bg-cream-sidebar dark:bg-forest-green border border-gold/30 rounded-lg px-3 py-2` (reusa o par de tokens já usado no shell/topbar do próprio Admin V2 — não inventa cor nova, `DECISION-013` regra #6). Cada view mantém seu próprio conteúdo interno (contadores, valores, badges de gargalo) — o componente só fornece o fundo/borda consistentes.

**Checklist:**
- [x] `apps/web/src/admin-v2/shell/KanbanColumnHeader.tsx` (novo).
- [x] `NetworkView.tsx` — cabeçalho da coluna passa a usar `KanbanColumnHeader`.
- [x] `OrdersBoardView.tsx` — idem.
- [x] `PipelineBoardView.tsx` — cabeçalho troca de `bg-white`/`bg-state-critical/5` pra `KanbanColumnHeader` (o estado de gargalo continua sinalizado, mas por um indicador dentro do cabeçalho, não pela cor de fundo inteira — evita colidir com a nova cor de base).

---

### Onda 2 — Motivo da mudança de etapa no Pipeline de Franquias (item 3)

**Design:** modal pequeno, abre quando o usuário troca o `<select>` de etapa no `LeadCard`, antes de confirmar a chamada — não muda mais a etapa direto no `onChange`. Campo de texto obrigatório ("Motivo ou evento que motivou a mudança"), 2 botões (Cancelar reverte o select / Confirmar chama a API e fecha o modal sozinho, "some depois" como pedido). Erro de API mantém o modal aberto (não perde o texto digitado).

**Backend (migração aditiva, `db/migrations` — nunca renumerar):**
- [x] `schema.prisma` — `FranchiseLeadStageHistory.reason String?` (nullable — não quebra os registros históricos já existentes, que ficam com `reason: null`).
- [x] Migração `NNNN_add_franchise_stage_history_reason`.
- [x] `apps/api/src/modules/intelligence/franchise-pipeline/service.ts` — `moveLeadStage(leadId, newStage, reason?: string)` grava `reason` no `create` da `FranchiseLeadStageHistory` (dentro da mesma transação já existente).
- [x] `apps/api/src/routes/adminV2.ts` — `stageBodySchema` ganha `reason: z.string().min(1).max(500).optional()` (opcional no contrato — a obrigatoriedade é imposta na UI, não quebra nenhum client futuro que não mande o campo).

**Frontend:**
- [x] `growth/franchises/components/StageChangeReasonModal.tsx` (novo) — textarea + Cancelar/Confirmar.
- [x] `LeadCard.tsx` — `onChange` do select vira `onStageSelected(stage)` (abre o modal com o alvo pendente) em vez de disparar a mutação direto.
- [x] `PipelineBoardView.tsx` — estado do modal pendente (`{ leadId, targetStage } | null`), `moveStage` passa a receber `reason`.
- [x] `shared/api.ts` — `moveFranchiseLeadStage` ganha `reason?: string` no body.

**Fora de escopo (explícito):** não construir uma tela de histórico mostrando os motivos passados — só captura pra auditoria por enquanto. Se o usuário quiser visualizar depois, é onda nova.

---

### Onda 3 — Remover botões mortos de Google/Facebook no login (item 4)

**Decisão do usuário (gate socrático):** não implementar OAuth agora. Achado no RAG: zero infraestrutura hoje (sem `passport`, sem client IDs configurados, sem rota de callback); bloqueio real de produção — Google OAuth exige callback HTTPS, e `PLAN-0019` (TLS) segue `BLOCKED`. Esforço estimado se fosse implementar: múltiplos dias de backend (fluxo OAuth2, linkagem de conta por email, novas colunas em `User`) + frontend + registro dos apps no Google Cloud Console/Meta for Developers (só o usuário pode fazer isso) + revisão do app pelo Facebook, historicamente imprevisível em duração.

**Checklist:**
- [x] `apps/web/src/modules/public-site/sections/AuthModalsSection.tsx` — remove os 2 botões (Google/Facebook) dos modais de login E de cadastro (achar o segundo par, linha ~152-155 do RAG, provavelmente o modal de signup) e o divisor "ou" que só fazia sentido com eles.

---

### Onda 4 — Texto explicativo na tela Rede (item 5)

**Achado (RAG):** `NetworkView.tsx` é a única tela "mundo" do Admin V2 sem subtítulo explicativo — todas as outras (Operação: "onde os pedidos estão travando"; Crescimento: "onde estão as oportunidades comerciais de franquia"; Portfólio: "o que vende e o que realmente dá dinheiro") têm. A pergunta que a tela fecha já está documentada no `PLAN-0022` (Onda 2, RETROFIT-002): *"quais unidades estão bem, quais precisam de atenção, e por quê?"* — reusar essa frase já validada em vez de inventar uma nova.

**Checklist:**
- [x] `NetworkView.tsx` — subtítulo abaixo do `<h1>Rede</h1>`, mesmo padrão visual das outras telas.

---

### Onda 5 — Contraste da Agenda-Capacidade (item 6)

**Decisão do usuário (gate socrático):** manter a lógica de negócio atual (vermelho = ocioso/perdendo receita, verde = ocupado — proposital, é o propósito da tela), só revisar o contraste visual. Achado no RAG: `OCCUPANCY_CELL_CLASS` usa opacidades baixas (`/20`, `/25`) sobre fundo já claro (`bg-white` da tabela) — o vermelho e o âmbar em 20% de opacidade podem ficar próximos demais do branco pra distinguir à primeira vista, especialmente lado a lado com o "sem escala" (`bg-stone-50`, também bem claro).

**Design:** aumentar a opacidade/saturação dos 3 níveis coloridos (CRITICAL/ATTENTION/HEALTHY) o suficiente pra ficarem claramente distintos entre si e do "sem escala" (`NONE`), sem virar decorativo demais (mantém a mesma paleta semântica, só ajusta intensidade). Comparação visual antes/depois via screenshot fica registrada na validação desta onda.

**Checklist:**
- [x] `apps/web/src/admin-v2/operations/agenda/state.ts` — `OCCUPANCY_CELL_CLASS` com opacidades revisadas (ex.: `/35`-`/45` em vez de `/20`-`/25`; valor final calibrado visualmente durante a validação, não fixado a priori).

---

### Onda 6 — Indicadores de venda/estoque (item 7)

**Achado (RAG), boa notícia — a maior parte já existe:**
- **Ticket médio por unidade**: já entregue no Comparador de Unidades (RETROFIT-014, coluna `avgTicket`) desde o `PLAN-0023`. Nada novo a construir aqui — só vale confirmar com o usuário se é isso mesmo que ele tinha em mente, ou se quer o ticket médio em algum outro lugar também (ex.: card do Panorama).
- **Valor em estoque ("valor armazenado")**: o backend já calcula isso — `getInventoryOverview()` (PLAN-0020, reusado pelo `unit-health` e pelo Panorama) devolve `stockValue` por unidade E consolidado, mas o Panorama hoje só usa a contagem de alertas (`outOfStock + lowStock`), descarta o `stockValue`. É plumbing, não cálculo novo.

**Design:** adicionar "Valor em estoque" ao card "Operação agora" do Panorama (mesmo lugar que já mostra alertas de estoque — mesma fonte de dados, só expõe o campo que já existe e hoje é descartado).

**Checklist:**
- [x] `apps/api/src/modules/intelligence/panorama/types.ts` — `PanoramaOperations.stockValue: number` (novo campo).
- [x] `apps/api/src/modules/intelligence/panorama/service.ts` — `getPanorama` passa `inventoryOverview.consolidated.stockValue` pro retorno (o `inventoryOverview` já é buscado, só não era aproveitado por inteiro).
- [x] `apps/web/src/admin-v2/panorama/types.ts` (mirror) + `PanoramaCards.tsx` (`OperationsSummaryCard`) — nova linha "Valor em estoque: R$ X".

**Fora de escopo (a confirmar com o usuário depois, não fabricado aqui):** indicadores adicionais do Admin legado que não têm equivalente pronto no backend do V2 (comissões, série temporal de vendas) — exigiriam avaliação própria, não incluídos nesta onda.

---

## Validações executadas (todas reais)

- [x] `npx tsc -b --noEmit` (api + web) limpo — 3 rodadas (antes e depois do fix do CSS).
- [x] `npm run build` (api + web) PASS.
- [x] `npm run test` (api) — **134/134 PASS**, sem regressão.
- [x] `npm run lint` (web) — 17 erros pré-existentes/tolerados (mesmo padrão fetch-on-mount de sempre), nenhum novo.
- [x] Migração `20260815192400_add_franchise_stage_history_reason` aplicada e validada — `memory/logs/BUILD-HISTORY.md`.
- [x] `docker compose build api web` + `up -d --force-recreate api web nginx` (2 rodadas — uma antes do fix de CSS, outra depois) — todos saudáveis.
- [x] **E2E real** (login MASTER): `PATCH .../stage` com `reason` → `200`, persistência conferida direto no banco (`SELECT` na `FranchiseLeadStageHistory`, `reason` gravado corretamente); sem `reason` → `200` (contrato opcional preservado); `GET /admin-v2/panorama` devolvendo `stockValue: 218559.5` (real, batendo com o consolidado de estoque); regressão OK em todos os endpoints de inteligência.
- [x] **Validação visual real** (Playwright headless, 11 checks automatizados + checagem de pixel via PIL): botões Google/Facebook removidos (login e cadastro); subtítulo da Rede; "Valor em estoque" no Panorama; fluxo completo do modal de motivo (abre ao trocar etapa, Confirmar desabilitado sem texto, Cancelar reverte o select, Confirmar habilita com texto, modal some sozinho ao confirmar); cabeçalhos dos 3 kanbans com fundo `cream-sidebar`/borda `gold` visualmente distinto dos cards; contraste real da Agenda-Capacidade confirmado por pixel (não só visualmente).

---

## Git Record of Delivery

- Step 1 (Pre-commit review): pendente
- Step 2 (Commit authorization): pendente
- Step 3 (Commit confirmation): pendente
- Step 4 (Push authorization and result): pendente
- Push status: PENDING
