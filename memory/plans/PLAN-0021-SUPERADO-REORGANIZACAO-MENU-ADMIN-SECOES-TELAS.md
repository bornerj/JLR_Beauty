# PLAN-0021 — Reorganização do Menu Admin e da Tela Seções Telas (ex-Seções SPA)

**Status:** 🗄️ SUPERADO (fechado em 2026-08-20, sem reexecução) — a entrega original (2026-07-22) já estava commitada (`9422f64`), mas nunca ganhou rename `-DONE-` nem Git Record formal por faltar validação visual explícita do usuário. Antes disso acontecer, o `PLAN-0033` (aposentadoria do Admin legado, 2026-08-20) **removeu fisicamente** os 4 arquivos que este plano alterava (`AdminContent.tsx`, `admin-core/behavior.ts`, `AdminSectionTogglesView.tsx`, `admin-tests/behavior.ts` — commit `1572e31`, Onda 4). O código deste plano segue no histórico do Git e na branch `archive/admin-legado`, mas não há mais superfície ativa para validar ou reexecutar: o Admin V2 tem sua própria estrutura de menu, entregue em outros planos. Fechado como superado por decisão explícita do usuário, sem nova validação visual e sem novo commit/push de código (nenhuma linha de código mudou nesta reabertura — só registro).
**Data:** 2026-07-22
**Escopo macro:** `apps/web` (menu lateral admin, tela de toggles de seções públicas, gating de views por papel, suíte de auto-teste de views)
**Agentes de apoio:** `@frontend-specialist` (aplicado inline, sem sub-agente dedicado)

---

## Nota de Processo (Anti-Scope-Drift — registro da discrepância)

Esta tarefa foi classificada pelo usuário como um pedido direto de reorganização de UI ("reagrupar as opções"). Pelo classificador do `kernel/BOOTSTRAP.md`, o tipo **DESIGN/UI** ("design", "UI", "página") exige `PLAN-XXXX` antes da execução. A tarefa tocou 4 arquivos principais (`AdminContent.tsx`, `admin-core/behavior.ts`, `AdminSectionTogglesView.tsx`, `admin-tests/behavior.ts`), cruzando o gatilho de anti-scope-drift de "mais de 3 arquivos principais alterados".

A execução ocorreu de forma point-in-time, sem plano prévio e sem registro em `MODIFICATION_LOG.md` no momento. Ao ser questionado pelo usuário sobre aderência ao protocolo ("foi feito tudo conforme as regras?"), o desvio foi assumido e duas opções de regularização foram oferecidas; o usuário optou por formalizar este plano retroativamente. Não há re-execução de código — este arquivo documenta o que já foi entregue e validado.

---

## STAR

**Situation**
- Menu lateral admin (`AdminContent.tsx`) é uma lista JSX plana, sem config-driven array — grupos e ordem são hardcoded na árvore de botões. Único grupo colapsável existente era "Master" (Branding, Seções SPA, Testes), gated por `isMaster`.
- Tela "Seções Públicas (SPA)" (`AdminSectionTogglesView.tsx`) ordenava grupos (`home`/`franquias`/`assinaturas`) e seções dentro de cada grupo por `localeCompare` puro (alfabético), sem relação com a ordem real de renderização das páginas públicas.
- Usuário reportou que a navegação estava confusa: itens relacionados espalhados (Equipes-Metas/Perform longe de Vendas; Produtos/Planos/Pessoas/Serviços sem agrupamento; Seções SPA "escondida" dentro do Master) e a tela de toggles não refletia a ordem visual real das seções nas páginas.

**Task**
1. Mover Equipes-Metas e Equipes-Perform para logo após Vendas.
2. Mover Textos para dentro do submenu Master.
3. Criar grupo colapsável "Cadastro" com Produtos, Planos, Pessoas e Serviços.
4. Retirar Seções SPA do Master, deixar como item avulso, renomear para "Seções Telas".
5. Na tela Seções Telas, HOME primeiro, Assinaturas por último (Franquias no meio) — grupos em ordem fixa, não alfabética.
6. Dentro de cada grupo da tela Seções Telas, ordenar as seções na mesma ordem em que aparecem nas páginas reais.

**Action** — ver "Registro de Execução" abaixo.
**Result** — menu reagrupado conforme solicitado; tela de toggles com ordenação fixa (grupos e seções) espelhando a navegação real; `tsc -b` e build Docker validados.

---

## Decisões de execução (esclarecidas com o usuário antes de editar)

| Tema | Escolha |
|---|---|
| Posição do novo grupo "Cadastro" | Logo após "Entrega" — ocupa o espaço onde "Produtos" ficava, mantendo Cupons/Assinantes na sequência atual |
| Posição de "Seções Telas" (ex-Master) | Logo após o grupo Master — mesma posição visual que ocupava dentro do Master, agora fora dele |
| Gating de acesso de "Textos" | Ao entrar no submenu Master (todo ele gated por `isMaster`), Textos passou a ser master-only — efeito colateral assumido como intencional, consistente com os demais itens do Master |
| Gating de acesso de "Seções Telas" | Mantido master-only (igual já era dentro do Master) — só mudou de item aninhado para item avulso |

## Checklist de Execução

- [x] `AdminContent.tsx`: adicionar state `isCadastroMenuOpen`.
- [x] `AdminContent.tsx`: mover botões "Equipes-Metas"/"Equipes-Perform" para logo após "Vendas".
- [x] `AdminContent.tsx`: criar submenu colapsável "Cadastro" (ícone `folder_open`) logo após "Entrega", com Produtos/Planos/Pessoas/Serviços; remover esses 4 triggers de suas posições antigas.
- [x] `AdminContent.tsx`: mover "Textos" (`textos-paginas`) para dentro do submenu Master; remover "Seções SPA" do submenu Master.
- [x] `AdminContent.tsx`: adicionar botão avulso "Seções Telas" (`site-sections`, renomeado), gated por `isMaster`, logo após o submenu Master.
- [x] `AdminContent.tsx`: envolver o painel de conteúdo `data-view="textos-paginas"` em `{isMaster ? ... : null}` (antes renderizava incondicionalmente), para coerência com o botão agora master-only.
- [x] `admin-core/behavior.ts`: adicionar `"textos-paginas"` a `masterOnlyViews`.
- [x] `admin-tests/behavior.ts`: adicionar `"textos-paginas"` a `masterExpectedViews`, mantendo a suíte de auto-teste de views coerente com o novo gating.
- [x] `AdminSectionTogglesView.tsx`: substituir sort alfabético por `PAGE_ORDER = ["home", "franquias", "assinaturas"]`.
- [x] `AdminSectionTogglesView.tsx`: substituir sort alfabético de seções por `SECTION_ORDER` por página, espelhando a ordem real de renderização (`HomeContent.tsx`, `FranquiasContent.tsx`, `AssinaturasContent.tsx`).
- [x] `AdminSectionTogglesView.tsx`: renomear título da tela de "Seções Públicas (SPA)" para "Seções Telas".

## Ajuste 2 (2026-07-22, mesma sessão) — Master ao final + Entrega/Cupons para Cadastro

Usuário pediu, em seguida: (a) mover o grupo Master para ser a **última** opção do menu; (b) mover "Entrega" e "Cupons" para dentro do grupo "Cadastro".

- [x] `AdminContent.tsx`: removidos os botões avulsos "Entrega" e "Cupons" de suas posições antigas; adicionados dentro do submenu "Cadastro" (após Serviços, ordem: Produtos, Planos, Pessoas, Serviços, Entrega, Cupons).
- [x] `AdminContent.tsx`: bloco `{isMaster ? <div data-master-menu>...} : null}` movido para depois do botão "Galeria" — Master agora é o último item do menu.
- [x] `npx tsc -b` (apps/web) PASS.
- [x] `docker compose up -d --build web` PASS.

**Ordem final do menu:** Painel, Agenda, WhatsApp, Vendas, Equipes-Metas, Equipes-Perform, [Cadastro: Produtos/Planos/Pessoas/Serviços/Entrega/Cupons], Assinantes, Seções Telas, Galeria, [Master: Branding/Testes/Textos].

---

## Critérios de Aceitação

- [x] Ordem do menu (após Ajuste 2): Painel, Agenda, WhatsApp, Vendas, Equipes-Metas, Equipes-Perform, [Cadastro: Produtos/Planos/Pessoas/Serviços/Entrega/Cupons], Assinantes, Seções Telas, Galeria, [Master: Branding/Testes/Textos] (último item do menu).
- [x] Grupo "Cadastro" colapsável, mesmo padrão visual do grupo "Master" (toggle + submenu indentado).
- [x] "Seções Telas" continua restrita a usuários MASTER (mesma proteção que tinha dentro do Master).
- [x] Tela Seções Telas exibe grupos na ordem Home → Franquias → Assinaturas.
- [x] Dentro de cada grupo, seções na ordem real de renderização das páginas públicas correspondentes.
- [x] `npx tsc -b` (apps/web) PASS.
- [x] Build Docker do `web` PASS; container saudável.

## Registro de Execução (2026-07-22)

**Entregue:**
- Menu reagrupado em `AdminContent.tsx` conforme checklist acima.
- Gating de `textos-paginas` propagado para `admin-core/behavior.ts` (`masterOnlyViews`) e `admin-tests/behavior.ts` (`masterExpectedViews`), evitando inconsistência entre o que o menu mostra e o que a suíte de auto-teste de views admin valida.
- `AdminSectionTogglesView.tsx`: nova função `sortByOrder` parametrizada por lista de ordem explícita, usada tanto para `PAGE_ORDER` quanto para `SECTION_ORDER` por página (com fallback alfabético para chaves não mapeadas, evitando que uma seção nova "suma" caso o `SECTION_ORDER` não seja atualizado).
- Título da tela atualizado para "Seções Telas".

**Validações executadas:** `npx tsc -b` (apps/web) — PASS em duas rodadas (antes e depois do ajuste em `admin-tests/behavior.ts`); `docker compose up -d --build web` — PASS, container `web` saudável; leitura da árvore JSX final confirmando a ordem esperada dos botões.

**Fora do escopo automatizado:** não há teste automatizado (Vitest/RTL) para ordem de itens de menu ou para `toSortedToggleMap` — validado via `tsc` + inspeção de código + rebuild, sem suíte de testes de UI no projeto para este componente.

**Pendências para DONE — N/A, plano superado antes de serem cumpridas:**
- [x] ~~Validação visual do usuário na tela real~~ — alvo removido pelo `PLAN-0033` antes da validação acontecer; não aplicável.
- [x] ~~Fluxo Git completo (commit + push autorizados)~~ — o código já estava commitado (`9422f64`); não há Git Record dedicado a fazer porque não há código novo para commitar nesta reabertura.

## Git Record of Delivery
- **Código original:** já commitado em `9422f64` ("Atualiza Dockerfiles e documentação de planos"), sem mensagem/registro dedicado ao `PLAN-0021` na época.
- **Remoção do alvo:** `1572e31` (`PLAN-0033`, Onda 4) — os 4 arquivos que este plano alterava foram deletados fisicamente; código preservado na branch `archive/admin-legado`.
- **Fechamento deste registro (documentação apenas):** ver commit apontado em `MODIFICATION_LOG.md` na entrada de fechamento do `PLAN-0021`.
- **Push status:** N/A para este fechamento (só documentação; será incluído no próximo commit/push autorizado da sessão).

---

## Encerramento (2026-08-20)

Fechado como **superado pelo `PLAN-0033`**, por decisão explícita do usuário, sem
reexecução de código. Nada do que este plano descrevia continua ativo na base: o Admin
V2 tem sua própria árvore de menu, entregue de forma nativa em outros planos
(`PLAN-0024`/`0026`/`0027`/`0031`/etc.), e o Admin legado — alvo deste plano — não existe
mais na base local (removido, preservado só em `archive/admin-legado` e no histórico de
commits). Nenhum próximo passo pendente.
