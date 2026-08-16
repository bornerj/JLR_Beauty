# PLAN-0026 — Admin V2: Cadastros e Sistema nativos (reescrita, não reskin)

**Status:** 🔄 EXECUTING_WITH_PLAN — Onda 1 (Planos) ✅ CONCLUÍDA 2026-08-16, validada por E2E real + visual real. Ondas 2-14 aguardando execução.
**Origem:** continuação direta do `PLAN-0024` (RETROFIT-020/021, hubs de adapter/link) — usuário pediu a reescrita nativa dessas telas dentro do Admin V2. RAG feito nos 3 sistemas de conteúdo endereçável (Textos/Seções/Galeria) e no restante das telas de Cadastro/Sistema antes de planejar; gate socrático aplicado (autorização explícita pra alterar `DECISION-013`).
**Decisão arquitetural:** `DECISION-014` (ACTIVE, 2026-08-16) — substitui a regra #5 da `DECISION-013`. 6 regras fixas, não revalidadas onda a onda (ver `DECISION-014` na íntegra). Resumo: componentes novos (nunca editar módulo legado), reuso obrigatório de backend já existente, telas monolíticas do legado desmembradas em telas nativas por entidade, sequenciamento por complexidade real (reskin primeiro, Produtos/Pessoas por último).
**Escopo macro:** `apps/web/src/admin-v2/cadastros/*` e `apps/web/src/admin-v2/sistema/*` (14 módulos novos, um por tela/entidade), `apps/web/src/admin-v2/AdminV2Root.tsx` (14 rotas novas), `CadastrosHubView.tsx`/`SistemaHubView.tsx` (cards viram rotas internas em vez de links pro legado, um de cada vez conforme a onda entrega). **Sem endpoint de API novo previsto** — 100% do CRUD necessário já existe (`catalog.ts`, `users.ts`, `schedule.ts`, `subscriptions.ts`, `admin.ts`); gaps reais (paginação/filtro server-side) só se confirmados onda a onda, nunca assumidos a priori.
**Agentes de apoio:** `@frontend-specialist` (maior parte), `@backend-specialist` (só se uma onda confirmar gap real de API).

---

## Governança do programa (herdada de `DECISION-014`, vale para todas as ondas)

1. Componente novo em `apps/web/src/admin-v2/`, nunca editar `apps/web/src/modules/admin-*/` (módulo legado fica intocado, `/admin` continua servindo normalmente).
2. Reuso obrigatório de backend — nenhuma rota de API nova por padrão. RAG por onda confirma o endpoint exato antes de escrever a tela.
3. Telas legadas multi-entidade desmembram em telas nativas independentes, uma por entidade (Pessoas → Clientes / Profissionais / Usuários, 3 ondas, não 1).
4. Sequenciamento por complexidade real (tiers abaixo), não por ordem alfabética nem pela ordem do card no hub.
5. Cálculo de negócio só no backend, paleta de cores só os tokens já existentes (`DECISION-013` regras #4/#6, herdadas sem revalidação).
6. Aposentadoria do legado continua fora de escopo — cada tela nativa entregue NÃO remove a equivalente legada nem o card do hub vira automaticamente "a única forma" de acessar aquela função.

**Padrão de sidebar por onda:** quando uma tela vira nativa, o card correspondente em `CadastrosHubView.tsx`/`SistemaHubView.tsx` troca de link externo (`/admin#view`) pra rota interna do V2 (`/admin-v2/cadastros/<entidade>`), mesmo texto/ícone, só o destino muda — nunca os dois links coexistindo pra mesma função (evita "qual eu uso?").

---

## Roadmap (tiers por complexidade real, evidenciada por RAG — ver conversa que originou este plano)

| # | Onda | Tela/Entidade | Tier | Backend (confirmado) | Nota de escopo |
|---|---|---|---|---|---|
| 0 | — | `DECISION-014` | — | — | ✅ feita — ver decisão acima |
| 1 | 1 | **Planos** (memberships) | P | `subscriptions.ts` (`/memberships` CRUD) | ✅ CONCLUÍDA 2026-08-16 — onda-modelo, validada E2E real + visual real |
| 2 | 2 | **Entrega** (checkout/frete) | P | `/api/settings/:key` (genérico) | Config-form, não list-CRUD — mesmo padrão de Branding |
| 3 | 3 | **Branding** | P | `admin.ts` (`/admin/branding`) | Config-form; já é React puro no legado (496 linhas, sem `behavior.ts`) |
| 4 | 4 | **Cupons** (discount-coupons) | P | `admin.ts` (CRUD completo) | Já é React puro no legado (538 linhas) |
| 5 | 5 | **Textos das Páginas** | P | `admin.ts` (`/admin/page-texts` + `/previous` + `/restore`) | 331 campos, catálogo já mapeado no RAG (`pageTexts/catalog.ts`); preservar undo de 1 nível |
| 6 | 6 | **Seções Telas** (liga/desliga) | P | `admin.ts` (`/admin/section-toggles`) | 32 chaves `page.section`; **só MASTER edita** (checagem além do `requireAdmin` padrão) — preservar exatamente |
| 7 | 7 | **Galeria de Mídias** | P | `admin.ts` (`/admin/media-slots` + `/uploads` genérico) | 78 slots, fallback em cascata (banco → catálogo → cache local) — preservar |
| 8 | 8 | **Serviços** | M | `catalog.ts` (`/services` CRUD) | Legado tem `behavior.ts` (416 linhas) — reescrever como React |
| 9 | 9 | **WhatsApp / Integrações** | M | a confirmar na onda (RAG não fez o levantamento fino do backend ainda) | Legado tem `behavior.ts` (361 linhas) |
| 10 | 10 | **Testes** | M | a confirmar na onda | Legado tem `behavior.ts` (385 linhas); confirmar o que a tela realmente testa antes de desenhar a nativa |
| 11 | 11 | **Produtos** | G | `catalog.ts` (`/products` CRUD) + `inventory.ts`/estoque multi-unidade (PLAN-0020) | A mais pesada de Cadastros — upload de imagem, min/max de estoque, estoque por unidade real (não só campo solto) |
| 12 | 12 | **Clientes** | G | `schedule.ts` (`/customers` CRUD) | Desmembrado de "Pessoas" |
| 13 | 13 | **Profissionais** | G | `schedule.ts` (`/professionals`, `/professional-work-profiles`, `/professional-commission-profiles`, `/professional-shifts`) | Desmembrado de "Pessoas" — a mais relacional (perfis de trabalho/comissão, escalas) |
| 14 | 14 | **Usuários** | G | `users.ts` (`/users` CRUD + `/users/:id/role`) | Desmembrado de "Pessoas" — sensível (gestão de permissão/role), revisar escopo por papel com atenção redobrada |

**"Segurança" e "Infra" do hub de Sistema ficam fora deste plano** — confirmado no `PLAN-0024` que não existe tela legada dedicada pra elas (Segurança é feature de backend sem UI própria; Infra só existe como modal flutuante). Sem tela legada, não há o que "nativizar" — se o usuário quiser essas telas, é escopo novo, não portado.

---

## Onda 1 — Planos (memberships) ✅ CONCLUÍDA 2026-08-16

**Pergunta que a tela fecha:** *quais planos de assinatura existem, e como cadastrar/editar um?*

**RAG feito (confirmado no início da execução):** `Membership` no `schema.prisma` (`id, name, title, description?, price Decimal, benefits Json?, isFeatured, status String default "Ativo"`). Achado importante: `price` volta do backend como **`string`** (`Prisma.Decimal.toJSON()`), não `number` — a rota não converte antes de devolver; tratado explicitamente no `types.ts`. `benefits` é validado como `string[]` no Zod da rota (`membershipSchema`), apesar de `Json?` no schema. Legado `admin-plans` (121 linhas, `AdminPlansView.tsx`) é só markup — toda a interação (form, validação, lista, editar/excluir) vive centralizada em `admin-core/behavior.ts` (linhas 1389-1730), não num `behavior.ts` próprio do módulo — achado que corrige a estimativa inicial de complexidade (o "tier P" continua correto pra Planos em si, mas o método de "contar linhas por módulo" subestima onda a onda quando a interação está centralizada em outro módulo; atenção a isso nas próximas ondas).

**Backend:** nenhuma mudança — reusa `GET/POST/PATCH/DELETE /api/memberships` (`apps/api/src/routes/subscriptions.ts`) sem alteração, confirmando `DECISION-014` regra #2.

**Frontend entregue:**
- [x] `apps/web/src/admin-v2/cadastros/plans/types.ts` — `Membership`, `MembershipInput`, `MEMBERSHIP_STATUS_OPTIONS`.
- [x] `apps/web/src/admin-v2/shared/api.ts` — `fetchMemberships`/`createMembership`/`updateMembership`/`deleteMembership`.
- [x] `apps/web/src/admin-v2/cadastros/plans/components/PlanFormModal.tsx` — criar/editar, lista dinâmica de benefícios (adicionar/remover linha), mesmos campos do legado.
- [x] `apps/web/src/admin-v2/shell/DeleteConfirmModal.tsx` (novo, **compartilhado** entre futuras ondas de Cadastros) — confirmação de exclusão em modal próprio, nunca `window.confirm()` (bloquearia automação/Playwright e fugiria do visual do V2, mesmo padrão do `StageChangeReasonModal` do `PLAN-0025`).
- [x] `apps/web/src/admin-v2/cadastros/plans/components/PlanCard.tsx` — card de exibição (preço formatado, badge "destaque", lista de benefícios, ações editar/excluir).
- [x] `apps/web/src/admin-v2/cadastros/plans/PlansListView.tsx` — orquestra lista + os 2 modais.
- [x] `apps/web/src/admin-v2/AdminV2Root.tsx` — rota `cadastros/planos`, breadcrumb `Panorama > Cadastros > Planos`.
- [x] `CadastrosHubView.tsx` — card "Planos" vira `<Link>` interno (`native: true`); comentário de topo do arquivo atualizado.
- [x] `apps/web/src/admin-v2/shell/HubCard.tsx` — novo prop `native?: boolean`, muda a legenda ("Abrir →" vs "Abrir no Admin →") sem quebrar os cards ainda não migrados.

**Validações executadas (todas reais):** `tsc -b` (web) limpo; `npm run build` (web) PASS; `npm run lint` (web) — 18 erros (17 pré-existentes + 1 novo, mesmo padrão `fetch-on-mount` já tolerado em toda tela do Admin V2, confirmado que não é um tipo de erro novo); `docker compose build web` + redeploy `--force-recreate`. **E2E real contra Postgres** (login MASTER): `POST /api/memberships` → `201` (`price` volta como `"49.9"`, confirmando o achado do RAG); `PATCH` → `200`; `GET` confirmando a contagem antes/depois; `DELETE` → `204`; banco conferido de volta ao estado original (3 planos: Platinum/Gold/Silver) ao final, nenhum dado de teste deixado pra trás. **Validação visual real** (Playwright): hub de Cadastros mostra o card "Planos" já nativo; navegação real pro `/admin-v2/cadastros/planos`; breadcrumb correto; criar plano via UI (modal fecha sozinho); editar reflete na lista; excluir abre modal de confirmação (não `window.confirm()`) e remove da lista após confirmar — confirmado tanto pela screenshot final (visual, cards com formatação/badge corretos) quanto por um teste isolado com log de rede (`DELETE .../5 → 204`, contagem final = 0 na lista).

---

## Ondas 2 a 14 — roadmap resumido, a detalhar quando chegar a vez

Mesmo padrão de todo o programa (`PLAN-0022` §"Próximas ondas"): cada onda recebe RAG completo (schema, payload exato dos endpoints, campos reais do form legado) só quando é a vez dela — não fabricar detalhe de implementação de uma tela que ainda não foi investigada a fundo. A tabela do Roadmap acima já fixa tier, backend confirmado (quando já levantado) e prioridade; isso é suficiente pra aprovar o plano sem inflar o documento com suposições.

---

## Validações a executar (mesmo padrão de todo o programa, por onda)

- [ ] `npx tsc -b --noEmit` (api + web) limpo.
- [ ] `npm run build` (api + web) PASS.
- [ ] `npm run test` (api) — sem regressão.
- [ ] `npm run lint` (web) — sem regressão nova.
- [ ] `docker compose build` + redeploy.
- [ ] **E2E real** contra Postgres (CRUD completo da entidade da onda).
- [ ] **Validação visual real** (Playwright headless, checagem de pixel quando cor for parte do que está sendo validado — lição do `PLAN-0025`/`ERR-0049`).

---

## Git Record of Delivery

- Step 1 (Pre-commit review): pendente
- Step 2 (Commit authorization): pendente
- Step 3 (Commit confirmation): pendente
- Step 4 (Push authorization and result): pendente
- Push status: PENDING
