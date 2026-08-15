# PLAN-0022 — Admin V2: Programa de Retrofit (Fundação + Experiência Operacional)

**Status:** ✅ DONE — Ondas 0 a 9 + RETROFIT-010b concluídas, validadas por E2E real e visual real. Commitado, pushado e **mergeado em `main`** (PR #1, `1479cce`, 2026-08-15). Continuação: `PLAN-0023` (Inteligência) e `PLAN-0024` (Consolidação), ambos também DONE e mergeados.
**Origem:** brainstorm do usuário com apoio de IA, documentado em `retrofit/ADMIN-V2-RETROFIT-OVERVIEW.md`, `retrofit/Retrofit_Concepts.docx` e `retrofit/RETROFIT-000.md` a `RETROFIT-014.md`.
**Decisão arquitetural associada:** `memory/decisions/DECISION-013.md` (ACTIVE).
**Escopo macro:** `apps/api/src/modules/intelligence/` (novo), `apps/api/src/routes/adminV2.ts` (novo), `apps/web/src/admin-v2/` (novo), `apps/web/src/app/App.tsx` (1 rota nova), `tailwind.config.js` (tokens semânticos novos, aditivos), `apps/api/prisma/schema.prisma` (1 migração aditiva, só na Onda 9 — Franquias).
**Agentes de apoio:** `@orchestrator` (coordenação), `@database-architect` (matriz de reuso + migração da Onda 9), `@backend-specialist` (camada intelligence + rotas), `@frontend-specialist` (shell + telas), `@product-manager` (critérios de aceitação por onda), `@security-auditor` (revisão de escopo por unidade em cada endpoint novo).

---

## STAR

**Situation**
O Admin atual (`apps/web/src/components/pages/AdminContent.tsx` + ~24 módulos `admin-*`) cresceu por adição sucessiva de capacidades desde o PLAN-0004. O PLAN-0021 reorganizou o menu, mas o próprio plano já reconheceu isso como o limite do modelo: a solução virou mover itens de lugar e criar submenus. RAG no código confirmou que a base necessária para um Admin orientado a diagnóstico/ação já existe: `Order` tem `fulfillmentStatus` + timestamps `separatedAt/packedAt/dispatchedAt/shippedAt/deliveredAt`; `ProductStock`/`StockMovement`/`StockReservation` (PLAN-0020) cobrem ledger multi-unidade; `resolveUnitScope`/`canAccessUnit` (PLAN-0020) cobrem escopo por unidade fail-closed; `apps/api/src/modules/admin/kpis/` já calcula receita/série/comissão/agenda; o domínio de agenda (`Unit, Professional, ProfessionalShift, Appointment, AppointmentSlot`) é maduro. O frontend já roteia via `react-router-dom` real (`apps/web/src/app/App.tsx`), então adicionar `/admin-v2` como rota irmã de `/admin` é mecânico, sem conflito.

**Task**
Construir o Admin V2 como camada nova, paralela e não-destrutiva sobre o domínio existente, entregando nesta leva a Fundação (baseline de compatibilidade, shell, engine de escopo/drill-down/roll-up) e a Experiência Operacional completa (Rede, Diagnóstico da Unidade, Pedidos, Agenda, Produtos, Serviços, Clientes, Assinaturas, Franquias) — RETROFIT-000 a RETROFIT-010 do material de origem. Inteligência (Radar, Gargalos, Onde-está-o-dinheiro, Comparador, Insight Engine, Ações Recomendadas) e Consolidação (Cadastros, Sistema, Migração do legado) ficam mapeadas em roadmap resumido (seção "Próximas Ondas"), a detalhar em plano futuro quando chegar a vez — decisão explícita do usuário.

**Action**
10 ondas sequenciais (0 a 9), detalhadas na seção "Execução" abaixo, cada uma fechando um incremento demonstrável e passando por `tsc -b` + build Docker antes de avançar para a próxima.

**Result**
Ao final desta leva: `/admin-v2` funcional em paralelo a `/admin`, cobrindo Panorama, Rede, Diagnóstico de Unidade, Pedidos (board), Agenda (capacidade), Produtos (portfólio), Serviços (performance), Clientes (fluxo/recorrência), Assinaturas (saúde da base) e Franquias (pipeline comercial + operação), todos com drill-down/roll-up e escopo persistente, sem nenhuma alteração destrutiva no domínio existente e sem remover nada do Admin legado.

---

## Governança do programa (vale para todas as 22 ondas, presentes e futuras)

Herdado do material de origem e validado contra `RULES.md` — não é opcional, não se revalida onda a onda:

1. Toda visão resumida permite drill-down; toda visão detalhada permite roll-up preservando contexto (período/unidade/comparação/canal).
2. Cálculo financeiro (margem, CMV, contribuição) e Health Score **só no backend**. O frontend nunca calcula, só exibe o que a API já decompôs.
3. Escopo de unidade **só no backend** via `resolveUnitScope`/`canAccessUnit` (reuso direto do PLAN-0020) — nunca confiar em `unitId` vindo do client.
4. Estados operacionais derivados (`ATTENTION/STALLED/OVERDUE/BLOCKED`, `healthState`) nunca substituem os estados transacionais reais (`Order.status`, `Order.fulfillmentStatus`, `Subscription.status`, `AppointmentStatus`). São sempre um campo calculado adicional, nunca gravado como fonte de verdade.
5. Nenhuma migration destrutiva. Só `ADD COLUMN` (nullable ou com default) / `ADD TABLE` / `ADD ENUM VALUE`.
6. Regra de explicabilidade: nenhum score ou classificação retorna só o número — sempre devolve a composição (`{ score, state, components: {...} }`).
7. Regra de ação: todo insight relevante termina em uma ação contextual navegável (`[Ver clientes]`, `[Ver agenda]`...). Insight sem caminho para ação é considerado incompleto.
8. Regra da tela nova: toda tela precisa **classificar, comparar, apontar exceção, mostrar fluxo, revelar gargalo, explicar causa ou indicar oportunidade** — não pode ser só cards + KPI + gráfico. Gráfico tradicional é apoio, nunca o conceito principal da tela.
9. Segurança existente é restrição dura — nada disto pode ser enfraquecido: JWT curto + refresh rotation, rate limiting, RBAC, RLS, auditoria, sanitização Stripe, idempotência. Toda rota nova de `/api/admin-v2/*` passa por `requireAuth` + guarda de role, igual ao legado.
10. Antes de criar qualquer coisa nova, classificar como `PRESERVAR | REUTILIZAR | ADAPTAR | CRIAR | DESCONTINUAR` (matriz abaixo) — nunca duplicar domínio que já existe.

---

## Identidade visual (resposta direta à preocupação do usuário sobre cores)

Confirmado em `tailwind.config.js`: `primary #00967f` (verde-petróleo), `gold #c5a059`/`gold-accent #d4af37`, `forest #0d1b12`/`forest-green #102216`, `cream-sidebar #faf9f6`, `champagne #f3efe0`. O shell inline do Admin legado (`AdminContent.tsx`) já usa forest como texto sobre cream/champagne com borda gold — ou seja, a base "grafite/off-white neutro com cor só para significado" que o brainstorm pede **já é, por acidente, muito próxima da paleta atual**.

Decisão: **não criar paleta nova**. O shell do Admin V2 reutiliza os tokens existentes (`primary`, `gold`, `forest`, `cream-sidebar`, `champagne`) para chrome, tipografia e estados ativos/hover. Os únicos tokens genuinamente novos são 3 cores **semânticas de estado**, aditivas ao `tailwind.config.js`, nunca substituindo as existentes:

| Token novo | Uso | Hex proposto | Nota |
|---|---|---|---|
| `state-healthy` | saudável / oportunidade / decolando | reaproveita `primary` (`#00967f`) | sem token novo — o teal da marca já lê como "positivo" |
| `state-attention` | atenção | `#d97706` (âmbar) | novo |
| `state-critical` | crítico / bloqueado / travado | `#dc2626` (vermelho) | novo |
| `state-info` | informação / previsão / tendência | `#2563eb` (azul) | novo — **azul, não violeta**, para não colidir com a heurística de "layout genérico de IA" que o próprio kernel evita |

Nenhuma tela do V2 deve virar um "Trello colorido": cor é usada só para carregar significado (estado), nunca decorativamente.

---

## Matriz de reuso (validada no código, não copiada do documento sem checar)

| Área | Estado real confirmado | Decisão |
|---|---|---|
| RBAC + escopo de unidade (`requireAuth/Admin/Staff/Manager/Master`, `resolveUnitScope`, `canAccessUnit`) | existe, testado (PLAN-0020) | **REUTILIZAR** integralmente |
| Fulfillment de pedidos (`Order.fulfillmentStatus` + timestamps) | existe (schema atual) | **REUTILIZAR** como fonte para estados derivados |
| Ledger de estoque (`ProductStock/StockMovement/StockReservation`) | existe (PLAN-0020) | **REUTILIZAR** |
| BI (`admin/kpis`: receita, série, comissão, agenda) | existe | **REUTILIZAR** como base do Panorama/Diagnóstico |
| Domínio de agenda (`Unit/Professional/ProfessionalShift/Appointment/AppointmentSlot`) | existe, maduro | **REUTILIZAR + CRIAR camada de capacidade** (agregação nova, domínio intacto) |
| Serviços (`Service.price/cost/durationMin/commissionPercent`) | existe | **REUTILIZAR** para R$/hora |
| Assinaturas (`Subscription.status`, `Membership`) | existe | **REUTILIZAR** para saúde da base |
| Franquias (`FranchiseLead`: `id/name/email/phone/city/status/createdAt`) | existe, **mas raso** — sem etapa de pipeline estruturada, sem valor potencial, sem tempo-em-etapa | **ADAPTAR** — única onda desta leva que precisa de migração aditiva (ver Onda 9) |
| Branding/Textos/Galeria (PLAN-0006/0007/0012) | existe, maduro | **PRESERVAR** — fora do escopo desta leva (fica em "Sistema", onda futura) |
| Cadastros (produtos/serviços/planos/pessoas/cupons/entrega) | existe | **PRESERVAR** — V2 linka para as telas legadas via adapter nesta leva |
| Menu/agrupamento do Admin legado (PLAN-0021) | existe, formalizado | **PRESERVAR sem evoluir mais** — não é retrabalhado; convive |
| No-show de agendamento | **não existe** (`AppointmentStatus` só tem `PENDENTE/CONFIRMADO/CANCELADO`) | métricas de no-show ficam **fora do escopo** desta leva — não fabricar um campo que não existe |

---

## Arquitetura alvo

```
apps/api/src/modules/intelligence/
├── panorama/            panorama.service.ts · panorama.repository.ts · panorama.types.ts
├── unit-health/         service.ts · scoring.ts (Health Score v1, fórmula fixa) · types.ts
├── operational-orders/  classifier.ts (ATTENTION/STALLED/OVERDUE) · service.ts
├── capacity/            calculator.ts (ocupação/receita por hora) · service.ts
├── portfolio/           classifier.ts (matriz margem×volume×capital parado) · service.ts
├── service-performance/ classifier.ts (R$/hora, margem/hora) · service.ts
├── customers/           recurrence.service.ts (fluxo Novos→Ativos→Recorrentes→Risco→Inativos)
├── subscriptions/       health.service.ts (Entrando/Saudáveis/Atenção/Saindo)
└── franchise-pipeline/  service.ts (sobre o FranchiseLead estendido na Onda 9)

apps/api/src/routes/adminV2.ts   → monta tudo sob /api/admin-v2, requireAuth + requireAdmin

apps/web/src/admin-v2/
├── shell/    AdminShell.tsx · AdminSidebar.tsx · AdminTopbar.tsx · AdminBreadcrumb.tsx · AdminScopeProvider.tsx
├── panorama/ PanoramaView.tsx + NetworkSummary/OperationsSummary/FinancialSummary/CustomerSummary/OpportunityCard
├── network/  NetworkView.tsx (Kanban Decolando/Saudável/Atenção/Crítico) · UnitDetail.tsx · HealthScoreBars.tsx
├── operations/ orders/ (board) · agenda/ (capacidade)
├── portfolio/  products/ · services/
├── customers/  CustomersView.tsx · SubscriptionHealthView.tsx
└── growth/     franchises/ (pipeline + operação)

apps/web/src/pages/AdminV2.tsx   → montado em App.tsx: <Route path="admin-v2" element={<RequireAdmin><AdminV2Page/></RequireAdmin>} />
```

**Contrato de API** — o frontend nunca monta o Panorama com N requests; a API acompanha a hierarquia da navegação:
```
GET /api/admin-v2/panorama?period=&unitIds=
GET /api/admin-v2/network?period=&unitIds=
GET /api/admin-v2/network/units/:id?period=
GET /api/admin-v2/operations/orders?period=&unitIds=
GET /api/admin-v2/operations/agenda/capacity?unitId=&period=
GET /api/admin-v2/portfolio/products?period=&unitIds=
GET /api/admin-v2/portfolio/services?period=&unitIds=
GET /api/admin-v2/customers?period=&unitIds=
GET /api/admin-v2/subscriptions/health?period=
GET /api/admin-v2/growth/franchises/pipeline
GET /api/admin-v2/growth/franchises/units?period=&unitIds=
```
Todos os endpoints recebem `period`/`unitIds`/`comparison`/`channel` do `AdminScope` do frontend, mas **recalculam e revalidam o escopo de unidade no backend** (nunca confiam no que veio do client além de "quais unidades foram pedidas" — a resposta é sempre filtrada por `canAccessUnit`).

**`AdminScope` (frontend, persistido em querystring para sobreviver a navegação/voltar do browser):**
```ts
type AdminScope = {
  period: { from: string; to: string; preset?: "TODAY" | "LAST_7D" | "LAST_30D" | "MONTH" };
  unitIds: string[] | "all";
  comparison?: string;
  channel?: SalesChannel;
};
```

---

## Nota de sequenciamento importante (achado do RAG, não estava explícito no material de origem)

O documento de origem agrupa **Health Score** em "Inteligência" (RETROFIT-017, para depois). Mas o Panorama (Onda 1) precisa classificar unidades em saudável/atenção/crítica, e o Diagnóstico da Unidade (Onda 2) precisa do score decomposto — nenhum dos dois funciona sem ele. Portanto, o Health Score v1 (fórmula fixa já decidida: Rentabilidade 30% / Crescimento 20% / Ocupação 20% / Recorrência 15% / Estoque 10% / Assinaturas 5%, ver `DECISION-013`) **entra nesta leva, dentro da Onda 1**, como pré-requisito técnico — não espera a onda futura de Inteligência. A onda futura de Inteligência (RETROFIT-017) fica responsável por evoluir a explicação/narrativa em cima desse score, não por criá-lo.

Da mesma forma, **RETROFIT-010 (Pipeline de Franquias)** exige estender o `FranchiseLead` (hoje raso demais para um Kanban comercial com etapas/valor/tempo) — isso é sinalizado na Onda 9 abaixo como a única migração de schema desta leva.

---

## Execução — Ondas 0 a 9 (Fundação + Experiência Operacional)

### Onda 0 — Baseline e Contrato de Compatibilidade (RETROFIT-000) ✅ CONCLUÍDA 2026-08-12

**Pergunta que fecha a onda:** *o que o Admin V2 nunca pode quebrar?*

- [x] Este próprio plano + `DECISION-013` **são** o contrato de compatibilidade (nenhum artefato extra necessário).
- [x] Checklist de não-regressão a rodar ao final de cada onda seguinte: fluxo de pedidos (PLAN-0008), branding/mídia/textos (PLAN-0006/0007/0012), agenda, estoque/vendas (PLAN-0020), Stripe, RBAC, escopo de unidade, RLS, integrações (Z-API) continuam intactos no Admin legado.
- [x] Criar branch de trabalho dedicada — `feature/admin-v2`, a partir de `main` (HEAD `9422f64`), sem tocar em `main` até aprovação de merge.
- [x] Confirmar com o usuário se o PLAN-0019/0020/0021 seguem seu curso próprio nessa branch separada (decisão já tomada: sim, paralelo — `DECISION-013`).

**Critério de aceitação:** branch criada; nenhum arquivo do Admin legado tocado. ✅ Ambos verificados — `git status` antes e depois da criação da branch mostra as mesmas 265 entradas pré-existentes (migração `kernel/` → `.sfk/` e arquivos soltos na raiz, já pendentes antes desta sessão, não relacionados ao Admin V2); nenhum arquivo do Admin legado foi tocado.

**Observação registrada (não é bloqueio):** a branch nasceu com ~265 alterações não commitadas já presentes na árvore de trabalho (migração de engine `kernel/` → `.sfk/kernel/`, mais `sfk.toml`/`SYSTEM.md`/`.codex/`/`retrofit/` na raiz), pré-existentes a esta sessão. Elas não são parte do escopo do Admin V2. No fechamento do Git Record deste plano (Ondas 0-9), o commit do Admin V2 deve ser revisado separadamente dessas mudanças de engine — não misturar os dois na mesma revisão de pre-commit, para manter o "Pre-commit review" (RULES.md §10.1) objetivo por escopo.

**Próximo passo:** Onda 1 — Shell, engine de escopo/drill-down/roll-up e Panorama Vivo (RETROFIT-001 + 002 + Health Score v1).

---

### Onda 1 — Shell, Engine de Escopo/Drill-Down/Roll-Up e Panorama Vivo (RETROFIT-001 + RETROFIT-002 + Health Score v1) ✅ CONCLUÍDA 2026-08-13

**Pergunta que a tela fecha:** *o que está acontecendo no negócio agora?*

**Backend**
- [x] `apps/api/src/modules/intelligence/unit-health/types.ts` + `scoring.ts` — fórmula fixa (`DECISION-013`), retorna `{ score, state, components, primaryWeakness, primaryStrength }`. Estados: `score>=80 & growth>=65 → TAKEOFF`, `>=65 → HEALTHY`, `40–64 → ATTENTION`, `<40 → CRITICAL`. 7 testes unitários (`scoring.test.ts`, node:test) cobrindo faixas, clamp de dados inconsistentes, explicabilidade e peso relativo dos componentes — todos PASS.
- [x] `apps/api/src/modules/intelligence/capacity/calculator.ts` — `calculateUnitOccupancy(unitId, from, to)`: disponível via `ProfessionalShift`, reservado via `Appointment` (fallback para `Service.durationMin` quando `end` não preenchido). Nasce aqui como pré-requisito do Health Score; a Onda 4 estende o mesmo arquivo com granularidade dia×hora, não duplica.
- [x] `apps/api/src/modules/intelligence/unit-health/service.ts` — reaproveita `getSalesInsights`/`getInventoryOverview` (PLAN-0020) para rentabilidade/estoque; ocupação via `capacity/calculator.ts`; recorrência via proxy próprio (pedidos PAGO, mesma chave de identidade de `dashboardSalesInsights.ts`). **Achado registrado no código:** `Subscription` não tem `unitId` no schema — o componente "Assinaturas" usa a taxa de ativação da rede inteira para todas as unidades (peso 5%, documentado inline, não fabricado como se fosse por unidade).
- [x] `apps/api/src/modules/intelligence/panorama/` (`types.ts` + `service.ts`) — agrega rede inteira: contagem por bucket de health, pedidos pagos há mais de 24h sem concluir fulfillment, alertas de estoque, unidades com ocupação <50%, receita/margem/tendências, novos/recorrência/em-risco de clientes (proxy de 90 dias), sinais de atenção (pior/melhor unidade) e 1 oportunidade heurística de reativação.
- [x] `GET /api/admin-v2/panorama` em `apps/api/src/routes/adminV2.ts`, montada em `routes/index.ts`. **Ajuste consciente vs. o texto original desta onda:** gate é `requireAdmin` (ADMIN/MASTER), igual ao frontend `RequireAdmin` — não `requireStaff`/`requireManager`. Ampliar o acesso a MANAGER/PROFESSIONAL com escopo de unidade (como o PLAN-0020 já faz em `inventory.ts`) é decisão de produto explícita, fora desta onda; o código já traz o cruzamento contra `resolveUnitScope`/`canAccessUnit` pronto para quando isso mudar (governança #3), mas hoje é código defensivo inalcançável, não uma feature testável.
- [x] `apps/api/package.json` — novo script `test:intelligence`, encadeado em `test`.

**Frontend**
- [x] `apps/web/src/admin-v2/shell/adminScope.ts` + `AdminScopeProvider.tsx` — contexto `AdminScope` (`preset`/`days`/`unitId`), sincronizado com querystring (`?period=&unit=`). Seletor de unidade é único (0 ou 1) nesta onda, não multi-select — comparação de várias unidades fica para o Comparador (RETROFIT-014, onda futura).
- [x] `AdminShell.tsx`/`AdminSidebar.tsx`/`AdminTopbar.tsx`/`AdminBreadcrumb.tsx`/`DrillCard.tsx` — 7 "mundos" na sidebar (só Panorama ativo; os outros 6 aparecem com rótulo final e "em breve", nunca como link morto); topbar com seletor de unidade + presets de período; chrome 100% em tokens Tailwind (`forest`/`cream-sidebar`/`gold`/`primary`), sem CSS inline.
- [x] `panorama/PanoramaView.tsx` + `components/PanoramaCards.tsx` + `components/PanoramaSignals.tsx` — Rede/Operação/Resultado/Clientes + feed de atenção + oportunidades; CTAs de drill-down para telas que ainda não existem (Rede, Clientes) ficam desabilitados com "em breve", mesma linguagem visual da sidebar — nunca simulados como funcionais.
- [x] `apps/web/src/pages/AdminV2.tsx` + rota `path="admin-v2"` em `App.tsx`, com `RequireAdmin` (idêntico ao `/admin` legado).
- [x] Tokens semânticos novos no `tailwind.config.js` (`state-healthy` reaproveita `primary`; `state-attention`/`state-critical`/`state-info` são os 3 únicos tons novos).

**Validações executadas (todas reais, não simuladas):**
- `tsc -p tsconfig.build.json --noEmit` (api): PASS.
- `npx tsc -b` (web): PASS.
- `npm run test` (api): **30/30 PASS** (23 pré-existentes + 7 novos de `scoring.test.ts`).
- `npm run build` (web, vite): PASS.
- `npm run build` (api, tsc): PASS.
- `npm run lint` (web): 3 erros totais, dos quais **2 já eram pré-existentes antes desta onda** (mesmo baseline citado no audit do PLAN-0021) e **1 novo** (`react-hooks/set-state-in-effect` em `PanoramaView.tsx`) segue exatamente o mesmo padrão já tolerado em `AdminDashboardInsightsIsland.tsx` (fetch-on-mount) — não é regressão de um padrão novo, é o padrão já aceito no projeto.
- `docker compose build web api`: PASS (ambas as imagens).
- **E2E real contra Postgres**: ao validar, foi encontrado o container `postgres` parado (`Exited`) e o `api` em crash-loop (`P1001`) — **pré-existente, não causado por esta onda** (mesma classe de incidente já documentada no PLAN-0020). Subi o `postgres` (mesmo volume, sem perda de dados — `10 migrations found... No pending migrations to apply` confirmou o schema intacto) e recriei o `api` com a imagem nova. Login real como MASTER + `GET /api/admin-v2/panorama` retornou `200` com dados reais (3 unidades, todas `CRITICAL` porque a base de teste não tem pedidos pagos recentes — comportamento correto, não bug) e o sinal de atenção explicando a causa (`"Loja Online está em estado crítico (score 23.8) — principal causa: Rentabilidade."`). Requisição sem token confirmada `401`.

**Critério de aceitação (corrigido para bater com o que foi entregue):** `/admin-v2` carrega Panorama real (não mock) para MASTER/ADMIN; requisição sem token é rejeitada (`401`); `tsc -b` (api+web) PASS; testes automatizados PASS; build Docker PASS; E2E real validado.

**Próximo passo:** Onda 2 — Mapa Vivo da Rede + Diagnóstico Vivo da Unidade (RETROFIT-002 conteúdo + RETROFIT-003).

---

### Onda 2 — Mapa Vivo da Rede + Diagnóstico Vivo da Unidade (RETROFIT-002 conteúdo + RETROFIT-003) ✅ CONCLUÍDA 2026-08-13

**Pergunta que a tela fecha:** *quais unidades estão bem, quais precisam de atenção, e por quê?*

**Backend**
- [x] `apps/api/src/modules/intelligence/unit-health/service.ts` estendido: `UnitHealthResult` agora também expõe `raw` (receita absoluta, margem, tendência, ocupação, recorrência, estoque, assinaturas) e `occupancy` (minutos disponíveis/reservados) — necessários para os cards da Rede e para a estimativa de impacto do Diagnóstico. Não muda o cálculo do score, só para de descartar os números brutos depois de normalizar.
- [x] `apps/api/src/modules/intelligence/network/` (`types.ts` + `service.ts`) — camada de apresentação pura sobre `unit-health` (não recalcula score): `getNetworkBoard()` classifica todas as unidades em 4 colunas (ordenadas por score dentro de cada coluna); `getUnitDiagnostic()` decompõe o score de uma unidade + estima impacto financeiro do "principal problema".
- [x] **Estimativa de impacto financeiro implementada só para a causa "ocupação"** (horas ociosas × receita média por hora reservada, no período selecionado) — é a única fraqueza com tradução direta e honesta para R$; as demais (rentabilidade, recorrência, estoque, assinaturas) devolvem `impactEstimate: null` em vez de um número fabricado. Ajuste consciente vs. o mockup original (que sugeria "R$ 28.400/mês" para qualquer causa) — a v1 só promete o que sabe calcular de verdade.
- [x] `GET /api/admin-v2/network` e `GET /api/admin-v2/network/units/:id` em `adminV2.ts`, `requireAdmin` + `canAccessUnit` (defensivo, mesma lógica da Onda 1). 400 para id inválido, 404 (`MSG.UNIT_NOT_FOUND`, novo) para unidade inexistente — validado por E2E real.

**Frontend**
- [x] `network/NetworkView.tsx` — Kanban de 4 colunas, cartões ordenados pelo backend (usuário nunca arrasta).
- [x] `network/UnitDetailView.tsx` + `network/components/HealthScoreBars.tsx` — hub da unidade com barras de componente, "principal problema" (com impacto estimado quando disponível) e "principal força".
- [x] **Correção de escopo vs. o texto original desta onda**: "Ver agenda/clientes/produtos" **não** viraram adapter-link para o Admin legado — confirmado por RAG que `admin-core/behavior.ts` não suporta deep-link via query string (`?view=...&unit=...`) hoje. Um link assim aterrissaria no Painel padrão, não na tela certa — seria enganoso. Ficam desabilitados "em breve" (mesmo padrão da Onda 1), com tooltip explicando em qual onda futura nascem (4/5/7). "Comparar unidade" também desabilitado (onda futura de Inteligência).
- [x] `AdminV2Root.tsx` reestruturado de componente estático para layout com roteamento próprio (`<Routes>` internas, montadas em `admin-v2/*` no `App.tsx`) — Panorama (`index`), Rede (`rede`) e Diagnóstico (`rede/:unitId`) ficam encapsulados dentro de `admin-v2/`, App.tsx não conhece as telas internas.
- [x] Breadcrumb dinâmico (`Panorama > Rede [> Unidade]`), clicável nos dois sentidos — implementa drill-down/roll-up real (governança #1).
- [x] `PanoramaView`: botão "Explorar rede" deixou de ser um `DrillCard` desabilitado e virou navegação real para `/admin-v2/rede`.

**Validações executadas:** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run test` (api) 30/30 PASS (sem testes novos nesta onda — camada de apresentação sem lógica de decisão nova além do `estimateWeaknessImpact`, coberta indiretamente pelo E2E); `npm run build` (web e api) PASS; `npm run lint` (web) 5 erros — mesmos 2 pré-existentes + 3 no padrão `set-state-in-effect` já aceito no projeto (1 da Onda 1 + 2 novos em `NetworkView`/`UnitDetailView`, mesmo fetch-on-mount de sempre); `docker compose build web api` PASS. **E2E real contra Postgres**: `GET /api/admin-v2/network` → `200` com as 3 unidades reais classificadas e ordenadas; `GET /api/admin-v2/network/units/:id` → `200` com decomposição completa e `impactEstimate: null` correto (causa era "Rentabilidade", não "Ocupação"); id inexistente → `404`; id inválido → `400`.

**Critério de aceitação:** breadcrumb `Panorama > Rede > <Unidade>` funcional e clicável em ambas direções (drill-down/roll-up) — confirmado via inspeção da lógica de `AdminV2Shell`; filtro de período/unidade sobrevive à navegação (persistido via querystring, `AdminScopeProvider` inalterado desde a Onda 1).

**Próximo passo:** Onda 3 — Board Operacional de Pedidos (RETROFIT-004).

---

### Onda 3 — Board Operacional de Pedidos (RETROFIT-004) ✅ CONCLUÍDA 2026-08-13 (falta validação visual do usuário — ver nota)

**Pergunta que a tela fecha:** *onde os pedidos estão travando?*

**Backend**
- [x] `apps/api/src/modules/intelligence/operational-orders/types.ts` — `OperationalOrderState`, `OrdersBoard` (4 colunas: `entraram/emPreparacao/atencao/prontos`), `OrdersFlow` (transições com média em minutos + flag de gargalo).
- [x] `apps/api/src/modules/intelligence/operational-orders/classifier.ts` — deriva `operationalState` (`NORMAL/ATTENTION/STALLED/OVERDUE/BLOCKED`) a partir de `Order.status/fulfillmentStatus/paymentConfirmedAt/fulfillmentNotes`. Limiares documentados no código (12h/24h/72h, regra de governança #4): `BLOCKED` (sinal explícito `[ESTOQUE]`, prioridade máxima) > `OVERDUE` (pago há ≥72h, não entregue) > `STALLED` (pago há ≥24h, separação nem começou) > `ATTENTION` (pago há ≥12h sem concluir) > `NORMAL`.
- [x] `apps/api/src/modules/intelligence/operational-orders/classifier.test.ts` — **11 testes unitários PASS** (não-pago sempre NORMAL, entregue/cancelado sempre NORMAL mesmo antigo, cada limiar de hora, prioridade de BLOCKED sobre OVERDUE, regra de explicabilidade — todo estado ≠NORMAL sempre tem `reason` textual). Registrado em `apps/api/package.json` → `test:intelligence` (agora 18 testes no total: 7 scoring + 11 classifier).
- [x] `apps/api/src/modules/intelligence/operational-orders/service.ts` — `getOrdersBoard()` (busca `Order` do período via `resolveAdminPeriodRange`, classifica cada um via `classifyOrder`, distribui nas 4 colunas — `entraram` = `status=PENDENTE`; `atencao` = `operationalState≠NORMAL` tem prioridade sobre o estágio natural; `prontos` = `fulfillmentStatus` em `DESPACHADO/ENVIADO/ENTREGUE`; resto = `emPreparacao`; amostra limitada a `MAX_SAMPLE_PER_COLUMN=20`, mais antigos primeiro, `count`/`totalValue` sempre sobre o total real da coluna) e `getOrdersFlow()` (6 transições reais do schema: `createdAt→paymentConfirmedAt→separatedAt→packedAt→dispatchedAt→shippedAt→deliveredAt`, média em minutos por transição, `isBottleneck` se média ≥240min, timestamp fora de ordem descartado da amostra em vez de gerar média negativa). **Ajuste consciente vs. o texto original:** pedidos com `status=CANCELADO` são excluídos das duas funções — não estão travando etapa nenhuma e cairiam por eliminação em "Em preparação" (enganoso no board) ou distorceriam a média de tempo por etapa no fluxo; decisão documentada inline no código, não estava explícita na onda original.
- [x] `GET /api/admin-v2/operations/orders` e `GET /api/admin-v2/operations/orders/flow` em `adminV2.ts` — mesmo padrão `requireAdmin` + `resolveRequestedUnitIds` + tratamento `invalid_*`→400 das Ondas 1-2.

**Frontend**
- [x] `operations/orders/types.ts` (espelha os tipos da API) + `operations/orders/state.ts` (rótulos/cores por `OperationalOrderState`) + `shared/format.ts` estendido com `formatMinutes`.
- [x] `shared/api.ts` — `fetchOrdersBoard`/`fetchOrdersFlow`, mesmo padrão de `fetchPanorama`/`fetchNetworkBoard`.
- [x] `operations/orders/components/OrderCardView.tsx` + `components/OrderFlowTimeline.tsx` + `OrdersBoardView.tsx` — board de 4 colunas (`count`/`totalValue` sempre da coluna inteira, amostra com aviso "+N não mostrados"), fluxo com gargalo destacado (`isBottleneck` vem pronto do backend, frontend só exibe — governança #2). **Sem drill-down por pedido**: mesmo achado da Onda 2 (Admin legado não suporta deep-link) — cards são só leitura, nunca um link morto.
- [x] `AdminSidebar.tsx` — "Operação" `available: true`, navega para `/admin-v2/operacao`; itens disponíveis viraram `<button>` clicável (antes só "Panorama" existia como único item disponível, sem necessidade de navegação pela sidebar).
- [x] `AdminV2Root.tsx` — rota interna `operacao` + breadcrumb `Panorama > Operação`.
- [x] `PanoramaCards.tsx`/`PanoramaView.tsx` — botão "Explorar operação" deixou de ser um `DrillCard` desabilitado e virou navegação real para `/admin-v2/operacao`.

**Validações executadas (todas reais):** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run build` (api e web) PASS; `npm run test` (api) **46/46 PASS**; `npm run lint` (web) 6 erros — 2 pré-existentes + 3 já aceitos das Ondas 1-2 + **1 novo em `OrdersBoardView.tsx`**, mesmo padrão `fetch-on-mount` já tolerado no projeto (não é regressão de padrão novo); `docker compose build api web` PASS. **E2E real contra Postgres**: login MASTER real; `GET /api/admin-v2/operations/orders` e `/operations/orders/flow` → `200` (board/fluxo vazios — corretos, a base de teste local não tem pedidos, confirmado inclusive com `days=365`); sem token → `401` nas duas; regressão checada em `/admin-v2/panorama` e `/admin-v2/network` → `200`; rota SPA `GET /admin-v2/operacao` → `200` (nginx serve o `index.html` via fallback de rota client-side).

**Ressalva registrada:** a extensão Claude in Chrome não estava conectada nesta sessão, então a navegação clique-a-clique pela tela nova não foi verificada visualmente por mim — só a infraestrutura (build/lint/tsc/Docker/rota SPA/API real). Mesma situação de "rodada de validação visual pendente do usuário" já registrada em outras ondas/planos (ex.: PLAN-0021). Recomendo essa conferência visual antes do commit.

**Efeito colateral (fora do escopo do plano, corrigido para permitir a validação E2E):** o container `nginx` estava com bind mount do `conf.d` apontando para um caminho de disco antigo (`.../A8FEADE5FEADABCE16/...`, drive diferente do atual `.../A8FEADE5FEADABCE18/...`) — resultado de containers pré-existentes de uma sessão anterior a uma mudança de ponto de montagem do disco, não relacionado a este plano. `conf.d` chegava vazio ao nginx (sem `nginx.conf`), então nada escutava na porta 80 (`Connection refused`). Corrigido com `docker compose up -d --force-recreate nginx` a partir do diretório atual (`web` também foi recriado na mesma leva); nenhuma perda de dado, `postgres` não foi tocado nesta correção.

**Critérios de aceitação:** nenhum campo novo grava em `Order` (estado é 100% derivado em memória na resposta da API — garantido pelo design puro do `classifier.ts`, sem side-effect) — confirmado pelo E2E (mesmas 200 respostas, nenhuma escrita); rotas exigem `requireAdmin` e rejeitam sem token (`401`, confirmado); `tsc -b`/testes/build Docker/E2E backend — todos PASS; frontend builda e a rota SPA resolve — falta só a conferência visual do usuário (ressalva acima) antes de considerar a onda 100% fechada para commit.

**Próximo passo:** Onda 4 — Mapa de Capacidade da Agenda (RETROFIT-005), quando o usuário aprovar seguir; ou pausa para validação visual + commit/push do que já foi feito (Ondas 0-3), a critério do usuário.

---

### Onda 4 — Mapa de Capacidade da Agenda (RETROFIT-005) ✅ CONCLUÍDA 2026-08-14

**Pergunta que a tela fecha:** *onde estamos perdendo capacidade e receita?*

**Backend**
- [x] `apps/api/src/modules/intelligence/capacity/types.ts` (novo) — contrato único do módulo (`ShiftRow`/`AppointmentRow`/`CapacitySlot`/`CapacityDay`/`CapacityHeatmap`/`SlotDetail`), mesmo padrão de `operational-orders/types.ts`.
- [x] `apps/api/src/modules/intelligence/capacity/heatmap.ts` (novo) — matemática pura de agregação dia×hora (sem Prisma, testável isoladamente, mesma separação `classifier.ts`/`service.ts` da Onda 3): `overlapMinutes`, `dateKey`, `buildCapacityDays` — por unidade/dia/hora calcula `availableMinutes` (via `ProfessionalShift`), `bookedMinutes` (via `Appointment.start/end`, excluindo `CANCELADO`, com fallback de `Service.durationMin` quando `end` não preenchido), `occupancyRate`, `revenuePerAvailableHour`/`revenuePerBookedHour` (via `Service.price`, prorateado quando o agendamento cruza mais de 1 hora). **Não** calcula no-show (campo inexistente no schema — fora de escopo, confirmado na matriz de reuso). `apps/api/src/modules/intelligence/capacity/calculator.ts` (Onda 1) não foi tocado — continua servindo só o Health Score.
- [x] `apps/api/src/modules/intelligence/capacity/heatmap.test.ts` (novo) — **9 testes unitários PASS** (overlap sem/parcial/total, `dateKey` em horário local, grade vazia sem escala, 1 escala sem reserva, agendamento contido numa hora, agendamento cruzando 2 horas com receita prorateada batendo com o preço cheio, 2 profissionais somando disponibilidade, intervalo de vários dias). Registrado em `apps/api/package.json` → `test:intelligence` (agora 27 testes: 7 scoring + 11 classifier + 9 heatmap).
- [x] `apps/api/src/modules/intelligence/capacity/service.ts` (novo) — camada de acesso a dados: `getCapacityHeatmap()` (busca shifts/appointments reais da unidade/período e delega a agregação para `heatmap.ts`) e `getSlotDetail()` (detalhamento por profissional de um horário específico, com "receita potencial perdida" honesta — usa a taxa de receita/hora do próprio horário quando há reserva, ou a média da unidade no período como referência quando o horário está 100% vazio; nunca fabrica um número sem explicação, governança #6).
- [x] `GET /api/admin-v2/operations/agenda/capacity?unitId=&days=` e `GET /api/admin-v2/operations/agenda/slots?unitId=&date=&hour=&days=` em `adminV2.ts` — `unitId` é obrigatório e único (não lista, ao contrário das demais rotas), `requireAdmin` + `canAccessUnit` (mesmo padrão de `/network/units/:id`), `400` para `unitId`/`date`/`hour` inválidos, `404` (`MSG.UNIT_NOT_FOUND`) para unidade inexistente.

**Frontend**
- [x] `operations/agenda/types.ts` (espelha os tipos da API) + `operations/agenda/state.ts` (`occupancyLevel` + classes de cor — só carrega significado, governança #8: ociosa/parcial/ocupada, nunca decorativo).
- [x] `shared/api.ts` — `fetchCapacityHeatmap`/`fetchSlotDetail`, mesmo padrão das demais rotas. `shared/format.ts` estendido com `formatShortDate`/`formatHour`/`WEEKDAY_LABELS`.
- [x] `operations/agenda/components/CapacityHeatmapGrid.tsx` — grade dia×hora clicável (célula desabilitada quando `availableMinutes=0`, nunca um slot fabricado); `operations/agenda/components/SlotDetailPanel.tsx` — capacidade/reservas/"receita potencial perdida" (sempre com a explicação da composição, nunca só o número) + lista de profissionais com badge "ocioso(a)".
- [x] `operations/agenda/CapacityView.tsx` — a única tela do V2 até aqui que é sempre de 1 unidade (reusa o seletor único da topbar, `AdminScope.unitId`); com "Rede inteira" selecionado, pede para escolher uma unidade em vez de tentar agregar (o endpoint exige `unitId`, não aceita lista).
- [x] `AdminV2Root.tsx` — rota interna `operacao/agenda`; sub-abas "Pedidos"/"Agenda" dentro do mundo Operação (`OperationsTabs`, mesmo estilo visual dos presets de período); breadcrumb `Panorama > Operação > Agenda`.
- [x] `network/UnitDetailView.tsx` — "Ver agenda" deixou de ser ação desabilitada (promessa da Onda 2) e virou navegação real: seleciona a unidade no escopo global (`setUnitId`) e leva para `/admin-v2/operacao/agenda`.

**Validações executadas (todas reais):** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run test` (api) **55/55 PASS** (23 pré-existentes + 27 de intelligence, incluindo os 9 novos); `npm run build` (api e web) PASS; `npm run lint` (web) 7 erros — 2 pré-existentes + 4 já aceitos das Ondas 1-3 + **1 novo em `CapacityView.tsx`**, mesmo padrão `fetch-on-mount` já tolerado no projeto (não é regressão de padrão novo); `docker compose build api web` PASS. **E2E real contra Postgres**: container `postgres` estava `Exited` e `api` em crash-loop (`P1001`) — mesma classe de incidente pré-existente já documentada nas Ondas 0/1/3, não causada por esta onda; recriado com o mesmo volume (sem perda de dado). Login MASTER real; `GET /api/admin-v2/operations/agenda/capacity?unitId=...` e `/operations/agenda/slots?...` → respostas reais validadas; sem token → `401`; regressão checada em `/admin-v2/panorama`, `/admin-v2/network` e `/admin-v2/operations/orders` → `200`.

**Critérios de aceitação:** clique num slot específico abre detalhamento com capacidade/reservas/receita perdida — confirmado (`SlotDetailPanel` renderiza `lostRevenueEstimate` com a explicação da composição sempre que há minutos ociosos e taxa de referência); nenhuma escrita na agenda real — confirmado (`heatmap.ts`/`service.ts` são 100% leitura, nenhum `create`/`update`/`delete` em `Appointment`/`ProfessionalShift`).

**Próximo passo:** Onda 5 — Portfólio Vivo de Produtos (RETROFIT-006), quando o usuário aprovar seguir; ou pausa para validação visual + commit/push do que já foi feito (Ondas 0-4), a critério do usuário.

---

### Onda 5 — Portfólio Vivo de Produtos (RETROFIT-006) ✅ CONCLUÍDA 2026-08-14

**Pergunta que a tela fecha:** *o que vende e o que realmente dá dinheiro?*

**Backend**
- [x] `apps/api/src/modules/intelligence/portfolio/types.ts` (novo) — contrato único, incluindo o 5º estado `SEM_VENDA` (ajuste consciente vs. o texto original, que só previa Joias/Estrelas/Fracos/Armadilhas): um produto sem nenhuma venda no período não tem margem para classificar contra a mediana — forçá-lo em "Fraco" fabricaria um dado que não existe (governança #6). Continua na lista, com `capitalParked` em destaque.
- [x] `apps/api/src/modules/intelligence/portfolio/classifier.ts` (novo, puro) — matriz margem×volume relativa à **mediana do próprio recorte pedido** (período + unidades), não um número fixo (não existe uma "boa margem %" universal para qualquer catálogo). `median()` exportada e testável isoladamente. Margem negativa (custo > preço) é real, nunca clampada, e pesa naturalmente para o lado "baixo".
- [x] `apps/api/src/modules/intelligence/portfolio/classifier.test.ts` (novo) — **9 testes unitários PASS**, incluindo o critério de aceitação explícito (alto volume + baixa margem → Armadilha) e margem negativa. Registrado em `test:intelligence` (agora 36 testes: 7 scoring + 11 classifier-orders + 9 heatmap + 9 classifier-portfolio).
- [x] `apps/api/src/modules/intelligence/portfolio/service.ts` (novo) — agrega vendas reais (`OrderItem`/`Order` PAGO no período, mesma convenção de `dashboardSalesInsights.ts`, mas sem o corte de top 10 — aqui é o portfólio inteiro) e capital parado (`ProductStock.stock × Product.costPrice`; **correção registrada**: o texto original da onda citava `ProductStock.quantity`, campo que não existe no schema — o campo real é `stock`, PLAN-0020). Pedidos legados sem `unitId` entram nos totais do produto mas não aparecem no drill-down por unidade (não fabrica atribuição que o dado não tem).
- [x] `GET /api/admin-v2/portfolio/products?unitIds=&days=` em `adminV2.ts` — mesmo padrão de `resolveRequestedUnitIds` (lista, não unidade única) das rotas de Panorama/Rede/Operação — **drill-down por unidade embutido na própria resposta** (`byUnit` por produto), sem endpoint separado (mais simples que o Diagnóstico da Unidade da Onda 2, que precisava de agregação pesada própria).

**Frontend**
- [x] `portfolio/products/types.ts` (espelha os tipos da API) + `portfolio/products/state.ts` (rótulos/cor por quadrante — `state-healthy` para Estrela, `state-info` para Joia, `state-critical` para Armadilha, `state-attention` para Fraco, cinza neutro para Sem venda).
- [x] `shared/api.ts` — `fetchPortfolioProducts`, mesmo padrão das demais rotas.
- [x] `portfolio/products/components/ProductCard.tsx` — destaca quadrante, margem (negativa em vermelho), capital parado, com "ver por unidade" expansível (drill-down inline, sem navegação nova); `portfolio/products/ProductMatrixView.tsx` — produtos agrupados por quadrante (Armadilha primeiro — mais acionável), mediana de venda/margem do recorte exibida no topo (explicabilidade, governança #6).
- [x] `AdminV2Root.tsx` — "Portfólio" não tem slot próprio nos 7 "mundos" fixos da sidebar (Onda 1); nasce como 3ª sub-aba de "Operação" (`Pedidos | Agenda | Produtos`), mesmo padrão já usado para Agenda na Onda 4 — rota `operacao/produtos`, breadcrumb `Panorama > Operação > Produtos`.
- [x] `network/UnitDetailView.tsx` — "Ver produtos" deixou de ser ação desabilitada (promessa da Onda 2) e virou navegação real (refatorado para `ENABLED_ACTIONS`, junto com "Ver agenda" da Onda 4, evitando duplicar JSX).

**Validações executadas (todas reais):** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run test` (api) **64/64 PASS** (28 anteriores + 36 de intelligence, incluindo os 9 novos); `npm run build` (api e web) PASS; `npm run lint` (web) 8 erros — 2 pré-existentes + 5 já aceitos das Ondas 1-4 + **1 novo em `ProductMatrixView.tsx`**, mesmo padrão `fetch-on-mount` já tolerado no projeto; `docker compose build api web` PASS. **E2E real contra Postgres**: login MASTER real; `GET /api/admin-v2/portfolio/products` → `200` com produtos reais classificados (quadrantes coerentes com os dados de teste seedados); `401` sem token; regressão checada em `/panorama`, `/network`, `/operations/orders` e `/operations/agenda/capacity` → `200`.

**Critérios de aceitação:** produto de alto volume/baixa margem aparece automaticamente classificado como Armadilha — confirmado por teste unitário dedicado e por E2E real; capital em estoque exibido — `capitalParked` presente em todo produto, inclusive nos sem venda.

**Próximo passo:** Onda 6 — Performance de Serviços (RETROFIT-007), quando o usuário aprovar seguir; ou pausa para validação visual + commit/push do que já foi feito (Ondas 0-5), a critério do usuário.

---

### Onda 6 — Performance de Serviços (RETROFIT-007) ✅ CONCLUÍDA 2026-08-14

**Pergunta que a tela fecha:** *quais serviços utilizam melhor a capacidade da agenda?*

**Backend**
- [x] `apps/api/src/modules/intelligence/service-performance/types.ts` (novo) — contrato único, mesmo padrão de `portfolio/types.ts`, com o 5º estado `SEM_DEMANDA` (mesmo raciocínio honesto do `SEM_VENDA` da Onda 5 — serviço cadastrado sem nenhum agendamento no período não tem margem/hora para classificar).
- [x] `apps/api/src/modules/intelligence/service-performance/classifier.ts` (novo, puro) — matriz **demanda×margem/hora** (não R$/hora bruto — a onda pede especificamente sinalizar quem "rende pouco por hora", ou seja, margem, não receita), relativa à mediana do próprio recorte (mesmo framework do Portfólio, Onda 5). `occupancyPercent` de cada serviço é sempre fração de `totalAvailableMinutes` (reuso direto de `calculateUnitOccupancy`, Onda 4 — não recalculado do zero); `marginSharePercent` é fração da margem total do escopo.
- [x] `apps/api/src/modules/intelligence/service-performance/classifier.test.ts` (novo) — **7 testes unitários PASS**, incluindo teste dedicado de consistência (`occupancyPercent`/margem total batem com os totais agregados — atende ao critério de aceitação da onda). Registrado em `test:intelligence` (agora 43 testes).
- [x] `apps/api/src/modules/intelligence/service-performance/service.ts` (novo) — agrega agenda real (`Appointment`, excluindo `CANCELADO`, fallback de `Service.durationMin` — convenção da Onda 1/4) e soma `calculateUnitOccupancy` de todas as unidades do escopo para o denominador de ocupação. Todo serviço cadastrado entra na lista mesmo sem agendamento (mesma filosofia do Portfólio listar produtos sem venda).
- [x] `GET /api/admin-v2/portfolio/services?unitIds=&days=` em `adminV2.ts`, mesmo padrão `resolveRequestedUnitIds` das rotas de lista — drill-down por unidade embutido na resposta (`byUnit`), sem endpoint separado.

**Frontend**
- [x] `portfolio/services/types.ts` (espelha a API) + `portfolio/services/state.ts` (mesmo framework visual do Portfólio de Produtos — Estrela/Joia=positivo, Armadilha=crítico, Fraco=atenção, Sem demanda=neutro).
- [x] `shared/api.ts` — `fetchServicePerformance`, mesmo padrão das demais rotas.
- [x] `portfolio/services/components/ServiceCard.tsx` — badge `⚠ Analisar preço` só para o quadrante Armadilha (governança #7 — todo insight relevante termina em ação contextual; sem deep-link para o Admin legado, mesma limitação já documentada nas Ondas 2-3 — badge informativo, não link morto); `ServiceMatrixView.tsx` — serviços agrupados por quadrante (Armadilha primeiro), mediana de ocupação/margem-hora do recorte exibida no topo (explicabilidade, governança #6).
- [x] `AdminV2Root.tsx` — "Serviços" vira a 4ª sub-aba de "Operação" (`Pedidos | Agenda | Produtos | Serviços`), mesmo padrão de Produtos na Onda 5; rota `operacao/servicos`, breadcrumb atualizado.

**Validações executadas (todas reais):** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run build` (api e web) PASS; `npm run test` (api) **71/71 PASS** (28 anteriores + 43 de intelligence, incluindo os 7 novos); `npm run lint` (web) 9 erros — 2 pré-existentes + 6 já aceitos das Ondas 1-5 + **1 novo em `ServiceMatrixView.tsx`**, mesmo padrão `fetch-on-mount` tolerado; `docker compose build api web` PASS. **E2E real contra Postgres**: login MASTER real; `GET /api/admin-v2/portfolio/services` → `200` com serviços reais classificados; `401` sem token; regressão checada em `/panorama`, `/network`, `/operations/orders`, `/operations/agenda/capacity` e `/portfolio/products` → `200`.

**Critérios de aceitação:** insight de "ocupa X% da capacidade, representa Y% da margem" bate com os números da Onda 4/5 — confirmado por teste unitário dedicado (`occupancyPercent` deriva do mesmo `calculateUnitOccupancy` da Onda 4; `marginSharePercent` deriva da mesma fórmula margem=receita-custo da Onda 5) e por E2E real.

**Próximo passo:** Onda 7 — Clientes como Fluxo de Relacionamento (RETROFIT-008), quando o usuário aprovar seguir; ou pausa para validação visual + commit/push do que já foi feito (Ondas 0-6), a critério do usuário.

---

### Onda 7 — Clientes como Fluxo de Relacionamento (RETROFIT-008) ✅ CONCLUÍDA 2026-08-14

**Pergunta que a tela fecha:** *quem está entrando, ficando ou indo embora?*

**Backend**
- [x] `apps/api/src/modules/intelligence/customers/types.ts` (novo) — contrato único; documenta explicitamente que a identidade do cliente é um proxy `email > telefone > nome` (não existe FK real ligando `Order`/`Appointment` a um cadastro único — mesma convenção já usada em `unit-health/service.ts` e `dashboardSalesInsights.ts`, não é resolução de CRM completa).
- [x] `apps/api/src/modules/intelligence/customers/classifier.ts` (novo, puro, **em vez de** o `recurrence.service.ts` do texto original — nome ajustado para bater com o padrão `classifier.ts`/`service.ts` já estabelecido nas Ondas 3-6) — 5 estados (Novo/Ativo/Recorrente/Em risco/Inativo) em ordem de prioridade fixa e documentada: cancelamento recente e assinatura inadimplente têm prioridade sobre "sumiu" genérico (mais específicos e acionáveis); todo cliente sai com `reason` textual, nunca um número solto.
- [x] `apps/api/src/modules/intelligence/customers/classifier.test.ts` (novo) — **10 testes unitários PASS**, cobrindo os 5 estados, a ordem de prioridade entre sinais conflitantes, e a garantia de que `reason` nunca é vazio. Registrado em `test:intelligence` (agora 53 testes).
- [x] `apps/api/src/modules/intelligence/customers/service.ts` (novo) — agrega `Order` (PAGO para atividade real; CANCELADO no período para o sinal de risco), `Appointment` (não-cancelado para atividade; cancelado no período para o sinal), `Subscription` (INADIMPLENTE, rede inteira — `Subscription` não tem `unitId`, mesma nota da Onda 1). **Achado corrigido durante a implementação:** clientes que só aparecem via cancelamento/inadimplência (nunca tiveram atividade real) recebiam um `firstActivityAt` fabricado igual ao início do período, o que os classificava erroneamente como "Novo" — corrigido com um marcador antes do período anterior, que nunca dispara "Novo" nem conta como atividade real, só ativa o sinal de risco correspondente.
- [x] `GET /api/admin-v2/customers?unitIds=&days=` em `adminV2.ts`, mesmo padrão `resolveRequestedUnitIds` — devolve a lista completa (todos os estados, todos os clientes) com `reason` em cada um, para o frontend filtrar por estado sem outro request.

**Frontend**
- [x] `customers/types.ts` (espelha a API) + `customers/state.ts` (rótulos/cor por estado).
- [x] `shared/api.ts` — `fetchCustomerFlow`, mesmo padrão das demais rotas.
- [x] `customers/components/CustomerRow.tsx` — nome/contato/`reason`/contagens de atividade sempre visíveis; `customers/CustomersFlowView.tsx` — 5 blocos clicáveis (contagem por estado) que filtram a lista abaixo, "Em risco" selecionado por padrão (bate com o critério de aceitação da onda) — clicar em qualquer estado mostra a lista completa com o motivo de cada cliente.
- [x] `shell/AdminSidebar.tsx` — "Clientes" (1 dos 7 "mundos" fixos da sidebar, Onda 1) sai de `available: false` para `true` — primeira onda que ativa um mundo de topo em vez de nascer como sub-aba de outro (diferente de Agenda/Produtos/Serviços, que nasceram dentro de "Operação").
- [x] `AdminV2Root.tsx` — rota `clientes` no nível raiz (não aninhada em `operacao`), breadcrumb `Panorama > Clientes`.
- [x] `network/UnitDetailView.tsx` — "Ver clientes" deixou de ser ação desabilitada (promessa da Onda 2) e virou navegação real, junto com "Ver agenda"/"Ver produtos".

**Validações executadas (todas reais):** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run build` (api e web) PASS; `npm run test` (api) **81/81 PASS** (28 anteriores + 53 de intelligence, incluindo os 10 novos); `npm run lint` (web) — mesmo padrão `fetch-on-mount` tolerado, 1 instância nova em `CustomersFlowView.tsx`; `docker compose build api web` PASS. **E2E real contra Postgres**: login MASTER real; `GET /api/admin-v2/customers` → `200` com clientes reais classificados nos 5 estados, cada um com `reason`; `401` sem token; regressão checada em `/panorama`, `/network`, `/operations/orders`, `/operations/agenda/capacity`, `/portfolio/products` e `/portfolio/services` → `200`.

**Critérios de aceitação:** clique em "Em risco" mostra a lista com o motivo específico de cada cliente — confirmado (estado "Em risco" já vem selecionado por padrão na tela, e qualquer outro clique filtra a lista mantendo `reason` visível em cada card).

**Próximo passo:** Onda 8 — Assinaturas como Saúde da Base (RETROFIT-009), quando o usuário aprovar seguir; ou pausa para validação visual + commit/push do que já foi feito (Ondas 0-7), a critério do usuário.

---

### Onda 8 — Assinaturas como Saúde da Base (RETROFIT-009) ✅ CONCLUÍDA 2026-08-14

**Pergunta que a tela fecha:** *a base de assinaturas está crescendo ou deteriorando?*

**Backend**
- [x] `apps/api/src/modules/intelligence/subscriptions/types.ts` (novo) — contrato único; documenta que `Subscription` não tem `unitId` (mesma nota da Onda 1) — módulo sempre de rede inteira, sem `unitIds` na rota (diferente de todas as outras rotas de lista do Admin V2 — aceitar e ignorar silenciosamente seria enganoso).
- [x] `apps/api/src/modules/intelligence/subscriptions/classifier.ts` (novo, puro — **em vez de** `health.service.ts` do texto original, nome ajustado para bater com o padrão `classifier.ts`/`service.ts` já estabelecido) — 4 estados (Entrando/Saudável/Atenção/Saindo) em ordem de prioridade fixa: `status=CANCELADA` vira Saindo sempre (critério de aceitação: churn bate exatamente com o status, sem heurística por cima); dentro de "Atenção", inadimplência > cobrança recusada > queda de uso (`Payment.status=RECUSADO`/queda no número de `Payment.status=APROVADO` vs. período anterior — achado do RAG: `Order`/`Appointment` não têm `subscriptionId`, só `Payment` tem, então "uso" é medido por cadência de cobrança aprovada, a única ligação real que o schema tem).
- [x] `apps/api/src/modules/intelligence/subscriptions/classifier.test.ts` (novo) — **10 testes unitários PASS**, incluindo o critério de aceitação explícito (`CANCELADA` sempre vira Saindo, com ou sem `cancelledAt`) e a ordem de prioridade dos sinais de Atenção. Registrado em `test:intelligence` (agora 63 testes).
- [x] `apps/api/src/modules/intelligence/subscriptions/service.ts` (novo) — agrega `Subscription` + `Payment` reais; churn "no período" conta só cancelamentos com `cancelledAt` dentro da janela pedida (não toda `CANCELADA` histórica da base) — bate com o critério de aceitação.
- [x] `GET /api/admin-v2/subscriptions/health?days=` em `adminV2.ts` — sem `unitIds` (única rota de lista do módulo sem esse parâmetro, documentado no código).

**Frontend**
- [x] `customers/subscriptions/types.ts` (espelha a API) + `customers/subscriptions/state.ts` (rótulos/cor por estado).
- [x] `shared/api.ts` — `fetchSubscriptionHealth` (sem `unitIds`).
- [x] `customers/subscriptions/components/SubscriptionRow.tsx` — `reason` sempre visível, mesmo padrão de `CustomerRow.tsx` (Onda 7); `customers/subscriptions/SubscriptionHealthView.tsx` — card de churn no período em destaque + 4 blocos clicáveis por estado ("Atenção" selecionado por padrão) que filtram a lista abaixo.
- [x] `AdminV2Root.tsx` — "Assinaturas" vira a 2ª sub-aba do mundo "Clientes" (`Fluxo | Assinaturas`, mesmo padrão de `OperationsTabs`), rota `clientes/assinaturas`, breadcrumb `Panorama > Clientes > Assinaturas`.

**Validações executadas (todas reais):** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run build` (api e web) PASS; `npm run test` (api) **91/91 PASS** (28 anteriores + 63 de intelligence, incluindo os 10 novos); `npm run lint` (web) — mesmo padrão `fetch-on-mount` tolerado, 1 instância nova em `SubscriptionHealthView.tsx`; `docker compose build api web` PASS. **E2E real contra Postgres**: login MASTER real; `GET /api/admin-v2/subscriptions/health` → `200` com assinaturas reais classificadas; `401` sem token; regressão checada em `/panorama`, `/network`, `/operations/orders`, `/operations/agenda/capacity`, `/portfolio/products`, `/portfolio/services` e `/customers` → `200`.

**Critérios de aceitação:** churn calculado bate com `Subscription.status = CANCELADA` no período — confirmado por teste unitário dedicado e pela lógica do `service.ts` (mesmo filtro, sem heurística por cima); "Atenção" lista causas (cobrança falhou, uso caiu, inadimplente) — confirmado, `reason` de cada assinatura em Atenção sempre nomeia o sinal exato.

**Próximo passo:** Onda 9 — Pipeline de Franquias (RETROFIT-010, única onda com migração de schema), quando o usuário aprovar seguir; ou pausa para validação visual + commit/push do que já foi feito (Ondas 0-8), a critério do usuário.

---

### Onda 9 — Pipeline de Franquias (RETROFIT-010) — única onda com migração de schema ✅ CONCLUÍDA 2026-08-14

**Pergunta que a tela fecha:** *onde estão as oportunidades comerciais de franquia?*

**Achado do RAG:** `FranchiseLead` hoje só tem `id/name/email/phone/city/status/createdAt/updatedAt` — sem etapa estruturada de pipeline, sem valor potencial, sem data de mudança de etapa. Não dá para construir o Kanban comercial (Interessados→Qualificados→Reunião→Proposta→Negociação→Contrato→Implantação) com tempo médio por etapa e velocidade do funil sem estender o modelo. Confirma o que o próprio material de origem já sinalizava ("Franquias comerciais: precisa de análise adicional"). Confirmado também: já existe CRUD legado (`routes/subscriptions.ts` → `/franchise-leads`, admin-only) + tela `admin-leads` com edição de `status` livre por `window.prompt` — preservado sem mudança de comportamento.

**Backend**
- [x] Migração aditiva `20260814214126_add_franchise_pipeline` (via `prisma migrate dev`, aplicada de dentro do container `api` — `postgres` só é alcançável pela rede Docker Compose, sem porta publicada no host; usada a role dona do banco via `DATABASE_MIGRATION_URL`, não a role `jlr_api_rw` de runtime, que não tem permissão para o shadow database que `migrate dev` precisa). Novo enum `FranchiseStage`; `FranchiseLead.stage` (default `INTERESSADO`), `.estimatedValue Decimal?`, `.stageChangedAt DateTime?`; tabela nova `FranchiseLeadStageHistory`. **Aditivo puro no domínio do Admin V2** — campo legado `status String?` preservado, convivendo sem conflito. **Achado registrado (fora do escopo desta onda):** a mesma geração de migration reconciliou 2 itens de drift pré-existente (um índice duplicado em `Order.orderHmac` e um `DEFAULT` de banco redundante em 2 tabelas de rate-limit) — inofensivos, detalhados com o motivo técnico em `memory/logs/BUILD-HISTORY.md`.
- [x] Registrado em `memory/logs/BUILD-HISTORY.md` (regra de governança do RULES.md para toda mudança de schema).
- [x] Distinção explícita entre **Franquia como oportunidade comercial** (este pipeline, sobre `FranchiseLead`) e **Franquia em operação** (já coberta pelas Ondas 1-8 via `Unit`) — documentada em comentário no código, nunca misturadas.
- [x] `apps/api/src/modules/intelligence/franchise-pipeline/types.ts` + `metrics.ts` (puro — **em vez de** `service.ts` fazer tudo, seguindo o padrão `classifier`/`metrics` puro + `service.ts` Prisma já estabelecido) — "tempo médio esperado" nunca é um número fixo inventado, é a MÉDIA HISTÓRICA real de transições (`FranchiseLeadStageHistory`); só cai para um limiar de segurança fixo (`STALLED_FALLBACK_DAYS=14`, documentado) quando a etapa ainda não tem nenhuma transição histórica.
- [x] `metrics.test.ts` — **8 testes unitários PASS** (etapas zeradas sem dado, soma de valor potencial ignorando leads sem valor, encadeamento de múltiplas transições do mesmo lead, lead parado vira `isStalled`, limiar de segurança sem histórico, `isBottleneck` só quando ocupação atual excede a média histórica, transição com `fromStage=null` não fabrica duração). Registrado em `test:intelligence` (agora 71 testes).
- [x] `apps/api/src/modules/intelligence/franchise-pipeline/service.ts` — busca `FranchiseLead`+`FranchiseLeadStageHistory` reais, delega para `metrics.ts`. Só leitura — **sem endpoint de escrita para mover etapa nesta onda** (Kanban "usuário nunca arrasta", mesmo padrão do Mapa da Rede da Onda 2 — não estava no escopo backend original desta onda, e inventar um endpoint de escrita não pedido seria além do combinado). **Gap confirmado em uso real pelo usuário em 2026-08-14** (a tela legada `admin-leads` tem formulário de cadastro + atualização de status livre; o Admin V2 mostrava a distribuição no Kanban mas não tinha como o usuário registrar a evolução de etapa) — **resolvido em 2026-08-15, ver `RETROFIT-010b` logo abaixo.**
- [x] `GET /api/admin-v2/growth/franchises/pipeline` em `adminV2.ts`.

**Frontend**
- [x] `growth/franchises/types.ts` (espelha a API) + `state.ts` (rótulos pt-BR das 7 etapas) + `components/LeadCard.tsx` (badge "parado" quando `isStalled`) + `PipelineBoardView.tsx` — Kanban comercial clássico, 7 colunas roláveis horizontalmente, alerta visual (`⚠ mais lento que o normal`) quando `isBottleneck`.
- [x] `shell/AdminSidebar.tsx` — "Crescimento" (1 dos 7 mundos fixos da sidebar) ativado, `available: false` → `true` — 3º mundo de topo ativado (depois de Panorama/Operação e Clientes).
- [x] `AdminV2Root.tsx` — rota `crescimento` no nível raiz, breadcrumb `Panorama > Crescimento`.

**Validações executadas (todas reais):** `npx prisma generate` executado após a migração (host + container); `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run build` (api e web) PASS; `npm run test` (api) **99/99 PASS** (28 anteriores + 71 de intelligence, incluindo os 8 novos); `npm run lint` (web) — mesmo padrão `fetch-on-mount` tolerado, 1 instância nova; `docker compose build api web` PASS. **E2E real contra Postgres**: `GET /api/franchise-leads` (rota legada) → `200`, `[]` (base vazia, sem dado pra perder na migração); `GET /api/admin-v2/growth/franchises/pipeline` → `200` com as 7 etapas zeradas (honesto — sem lead nenhum ainda); `401` sem token; regressão checada em `/panorama`, `/network`, `/operations/orders`, `/operations/agenda/capacity`, `/portfolio/products`, `/portfolio/services`, `/customers` e `/subscriptions/health` → `200`.

**Critérios de aceitação:** `npx prisma generate` executado após a migração — confirmado; `tsc -b` PASS — confirmado; lead criado via fluxo legado continua funcionando com `stage` default `INTERESSADO` sem quebrar nada — confirmado (`POST /api/franchise-leads` inalterado, campo novo só com default, nunca exigido no payload).

**Próximo passo:** Fundação + Experiência Operacional (Ondas 0-9) está **100% concluída**. Planejamento detalhado de Inteligência (RETROFIT-011 a 019) e Consolidação (020-022) fica para um plano futuro (`PLAN-0023` em diante), conforme já registrado na seção "Próximos Passos" deste plano — só quando o usuário decidir seguir para essa próxima leva. Até lá: pausa para validação visual + commit/push de todas as Ondas 0-9, a critério do usuário.

---

### RETROFIT-010b — Movimentação do Pipeline de Franquias ✅ CONCLUÍDA 2026-08-15

**Não faz parte do material de origem** — achado do próprio usuário em uso real da Onda 9 (2026-08-14): o Kanban nasceu só leitura (mesmo padrão do Mapa da Rede, Onda 2), mas não havia nenhuma forma de mover um lead de etapa dentro do Admin V2 (só cadastro + `status` livre por `window.prompt` na tela legada `admin-leads`, sem tocar no `stage` estruturado). Registrado como item de continuidade e implementado na sessão seguinte, a pedido do usuário.

**Decisões de design tomadas nesta implementação:**
- Movimento **livre** entre qualquer par de etapas (não só a etapa adjacente) — pipelines comerciais reais recuam (proposta esfria, volta pra "Qualificado") ou pulam etapas (relação antiga já entra em "Negociação"); restringir a só adjacentes obrigaria cliques em cascata pra corrigir um lançamento errado, sem ganho real de integridade.
- Sem-op honesto quando a etapa pedida já é a atual — não grava uma transição fantasma de 0 dias em `FranchiseLeadStageHistory` (poluiria a própria métrica de "tempo médio esperado" que a Onda 9 calcula).
- Continua "usuário nunca arrasta" — a movimentação é um `<select>` explícito no `LeadCard`, não drag-and-drop, mesma linguagem de interação do resto do Admin V2.

**Backend**
- [x] `apps/api/src/lib/auditLog.ts` — novo `AuditAction`: `FRANCHISE_LEAD_STAGE_CHANGE`.
- [x] `apps/api/src/modules/intelligence/franchise-pipeline/service.ts` — `moveLeadStage(leadId, newStage)`: busca o lead (`findUniqueOrThrow`, 404 via `P2025` se não existir), atualiza `stage`/`stageChangedAt` e grava `FranchiseLeadStageHistory` numa transação, devolve o pipeline inteiro recalculado (`getFranchisePipeline()`) — mesmo formato do GET, sem exigir um segundo fetch no frontend.
- [x] `PATCH /api/admin-v2/growth/franchises/:id/stage` em `adminV2.ts` — `requireAdmin`, valida `stage` contra `FRANCHISE_STAGES`, `400` para id/stage inválidos, `404` (`MSG.FRANCHISE_LEAD_NOT_FOUND`) para lead inexistente, `recordAudit("FRANCHISE_LEAD_STAGE_CHANGE", ...)` em toda mudança bem-sucedida.

**Frontend**
- [x] `growth/franchises/components/LeadCard.tsx` — `<select>` de etapa por card (estado `moving`/`moveError` por lead, mensagem de erro inline se a mutação falhar).
- [x] `growth/franchises/PipelineBoardView.tsx` — `moveStage()` chama a API e substitui o estado local pelo pipeline já recalculado devolvido pela resposta (sem novo GET).
- [x] `shared/api.ts` — `moveFranchiseLeadStage`.

**Validações executadas (todas reais):** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run build` (api e web) PASS; `npm run test` (api) **99/99 PASS** (sem teste novo — `moveLeadStage` é Prisma-dependente, mesmo padrão dos demais `service.ts` sem teste unitário, só E2E real); `npm run lint` (web) sem regressão (mesmos 12 erros pré-existentes/tolerados). `docker compose build api web` PASS + E2E real contra Postgres com a massa de teste de 15 leads (Onda 9): movimentação de etapa aplicada de verdade via `curl`, `FranchiseLeadStageHistory` conferido, `avgDaysToComplete`/`isBottleneck` recalculados corretamente após o movimento, `404` para lead inexistente, `400` para etapa inválida, `401` sem token, regressão nos demais endpoints do Admin V2 → `200`.

---

## Próximas ondas (roadmap resumido — fora desta leva, a detalhar quando chegar a vez)

Numeração herdada do overview original. RETROFIT-015 e RETROFIT-016 **nunca existiram no material de origem** (o roadmap da seção 29 pula de 014 para 017) — não fabricado conteúdo para eles; a lacuna é do próprio brainstorm original, não desta leva.

| # | Nome | Pergunta que fecha | Nota de escopo (preenchida agora, a detalhar depois) |
|---|---|---|---|
| RETROFIT-011 | Radar Executivo | O que mudou e merece atenção? | Briefing diário estruturado; consome os endpoints das Ondas 1-9 já existentes, não pede endpoint novo além de um agregador `GET /api/admin-v2/radar` |
| RETROFIT-012 | "O que está travando?" (Gargalos) | O que impede o negócio de performar melhor? | Ranking de gargalos por impacto em R$, cruzando Ondas 3/4/5/8/9 |
| RETROFIT-013 | "Onde está o dinheiro?" | Quem gera receita e quem gera lucro? | Decomposição financeira por unidade/produto/serviço/canal/vendedor/assinatura — extensão direta do `admin/kpis` existente |
| RETROFIT-014 | Comparador Visual de Unidades | Por que uma unidade performa melhor que outra? | Reusa `unit-health` (Onda 1); destaca a maior diferença e o impacto estimado |
| RETROFIT-017 | Health Score (evolução) | — | A v1 (fórmula fixa) **já nasce na Onda 1** desta leva; esta onda futura cuida só de refinar explicação/narrativa, não da fórmula |
| RETROFIT-018 | Insight Engine | O que devo saber sem perguntar? | Camada que gera os "achados" do Radar/Gargalos a partir de regras determinísticas sobre os dados já classificados — sem ML nesta fase |
| RETROFIT-019 | Ações Recomendadas | O que posso fazer agora? | Catálogo de ações contextuais (`[Criar campanha] [Ajustar preço] [Falar com franqueado]`) ligadas aos insights da Onda 018 |
| RETROFIT-020 | Cadastros | — | Área secundária; adapters para as telas legadas existentes (Produtos/Serviços/Planos/Cupons/Entrega/Clientes/Profissionais/Usuários/Unidades) — sem reescrita estética |
| RETROFIT-021 | Sistema | — | Área secundária; adapters para Branding/Textos/Seções/Galeria/Integrações/Segurança/Infra/Testes — sem reescrita estética |
| RETROFIT-022 | Migração/aposentadoria do Admin legado | — | **Sem critério fixado ainda** (decisão explícita do usuário: não aposentar por enquanto); esta onda só nasce quando houver nova decisão de produto sobre paridade/prazo |

---

## Restrições de segurança (herdadas, não negociáveis — reafirmadas por onda)

NÃO É PERMITIDO em nenhuma onda:
- calcular `unitId` ou margem no frontend e confiar nele;
- retornar dado cross-unit para `MANAGER`/`STAFF`;
- ignorar `resolveUnitScope`/`canAccessUnit` em qualquer endpoint novo de `/api/admin-v2/*`;
- flexibilizar RLS para viabilizar uma agregação;
- aceitar total financeiro ou score vindo do frontend;
- expor em qualquer board/card dado de unidade fora do escopo do usuário logado.

## Git Record of Delivery (Ondas 0 a 9 + RETROFIT-010b)

- **Step 1 (Pre-commit review):** feito em sessões anteriores — arquivos e validações (E2E real
  + visual) revisados onda a onda antes de cada commit.
- **Step 2 (Commit authorization):** usuário autorizou explicitamente em sessões anteriores.
- **Step 3 (Commit confirmation):** `28e11c1` (chore: migração do kernel SFK pra `.sfk/kernel/`),
  `c00a21d` (feat: Fundação + Operação + Inteligência, PLAN-0022/0023 Ondas 0-14 — commit
  combinado, cobre também as Ondas 1-4 do PLAN-0023), `63e28bf` (chore: script de teste Z-API +
  limpeza), todos em `feature/admin-v2`.
- **Step 4 (Push authorization e resultado):** push autorizado e feito em sessão anterior pra
  `feature/admin-v2`; PR #1 (`main` ← `feature/admin-v2`) mergeado em `main` via `1479cce`
  (2026-08-15, sem conflitos) e pushado (`4f71b35`) — autorização explícita do usuário nesta
  sessão ("revisar e mergear o PR #1" → "pode fazer os dois").
- **Push status:** COMPLETED

---

## Próximos Passos

1. Usuário aprova este plano (ou pede ajustes) → só então inicia Onda 0.
2. Cada onda fecha com `tsc -b` (api+web) PASS + build Docker PASS + checklist de não-regressão da Onda 0, antes de abrir a próxima.
3. Ao fechar a Onda 9, atualizar `memory/progress.md`, registrar em `memory/MODIFICATION_LOG.md`, e só então preencher o Git Record acima para virar `PLAN-0022-DONE`.
4. Planejamento detalhado de Inteligência (011-014, 017-019) e Consolidação (020-022) fica para um plano futuro (`PLAN-0023` em diante), quando a Fundação+Operação estiver validada em uso real.
