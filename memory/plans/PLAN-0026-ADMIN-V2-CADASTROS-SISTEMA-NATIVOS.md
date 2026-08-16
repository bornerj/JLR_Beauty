# PLAN-0026 — Admin V2: Cadastros e Sistema nativos (reescrita, não reskin)

**Status:** 🔄 EXECUTING_WITH_PLAN — Ondas 1-12 ✅ CONCLUÍDAS 2026-08-16. **Tier P e tier M inteiros fechados**; Onda 11 (Produtos, a mais pesada) e Onda 12 (Clientes, primeira do desmembramento de "Pessoas") também concluídas. Ondas 13-14 (Profissionais/Usuários) aguardando execução. Autorização em pé (usuário, 2026-08-16): commit sem aprovação por onda, push adiado pro final.
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
| 2 | 2 | **Entrega** (checkout/frete) | P | `/api/settings/:key` (genérico) | ✅ CONCLUÍDA 2026-08-16 — validada E2E real + visual real |
| 3 | 3 | **Branding** | P | `admin.ts` (`/admin/branding`) | ✅ CONCLUÍDA 2026-08-16 — validada E2E real + visual real; rota dedicada, não o `/settings/:key` genérico |
| 4 | 4 | **Cupons** (discount-coupons) | P | `admin.ts` (CRUD completo) | ✅ CONCLUÍDA 2026-08-16 — validada E2E real + visual real |
| 5 | 5 | **Textos das Páginas** | P | `admin.ts` (`/admin/page-texts` + `/previous` + `/restore`) | ✅ CONCLUÍDA 2026-08-16 — validada E2E real + visual real; 331 campos, undo de 1 nível preservado |
| 6 | 6 | **Seções Telas** (liga/desliga) | P | `admin.ts` (`/admin/section-toggles`) | ✅ CONCLUÍDA 2026-08-16 — validada E2E real + visual real; gate MASTER preservado; achado `ERR-0051` (CSS) corrigido |
| 7 | 7 | **Galeria de Mídias** | P | `admin.ts` (`/admin/media-slots` + `/uploads` genérico) | ✅ CONCLUÍDA 2026-08-16 — validada E2E real + visual real; achado `ERR-0052` (z-index) corrigido |
| 8 | 8 | **Serviços** | M | `catalog.ts` (`/services` CRUD) | ✅ CONCLUÍDA 2026-08-16 — validada E2E real + visual real; `behavior.ts` reescrito como React |
| 9 | 9 | **WhatsApp / Integrações** | M | `schedule.ts` (`/concierge/sessions`, leitura) + `/api/settings/:key` genérico | ✅ CONCLUÍDA 2026-08-16 — validada E2E real + visual real; `behavior.ts` (361 linhas) reescrito como React |
| 10 | 10 | **Testes** | M | 13 endpoints já existentes (smoke-check) | ✅ CONCLUÍDA 2026-08-16 — escopo reduzido deliberadamente (checks de DOM do shell legado descartados, ver seção da onda) |
| 11 | 11 | **Produtos** | G | `catalog.ts` (`/products` CRUD) + `inventory.ts`/estoque multi-unidade (PLAN-0020) | ✅ CONCLUÍDA 2026-08-16 — validada E2E real + visual real; achado `ERR-0053` (backend, fora de escopo) documentado |
| 12 | 12 | **Clientes** | G | `schedule.ts` (`/customers`, sem DELETE) | ✅ CONCLUÍDA 2026-08-16 — validada E2E real + visual real; achado `ERR-0054` (breadcrumb) corrigido |
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

## Onda 2 — Entrega no Checkout ✅ CONCLUÍDA 2026-08-16

**Pergunta que a tela fecha:** *quanto cobrar de entrega local, e a partir de qual valor o frete fica grátis?*

**RAG feito:** legado `admin-checkout-delivery` (308 linhas, `AdminCheckoutDeliveryView.tsx`, React puro). 2 chaves genéricas via `/api/settings/:key` (`admin.ts`): `checkout.localDeliveryFee` (default R$ 10) e `checkout.freeShippingThreshold` (default R$ 150). `GET` devolve `404` quando a chave nunca foi salva (tratado como "sem valor, usa default", não erro); `PUT` faz upsert e devolve o registro completo.

**Backend:** nenhuma mudança — reusa `/api/settings/:key` sem alteração.

**Frontend entregue:**
- [x] `apps/web/src/admin-v2/shared/api.ts` — cliente genérico `fetchSetting`/`updateSetting` (**reutilizável pelas próximas ondas de config-form**, ex.: Branding).
- [x] `apps/web/src/admin-v2/cadastros/delivery/DeliverySettingsView.tsx` — form com as 2 chaves, resumo aplicado no checkout, mesmos textos/defaults do legado.
- [x] `AdminV2Root.tsx` — rota `cadastros/entrega`; **refatorado o padrão de breadcrumb** das sub-telas de Cadastros pra uma tabela de lookup (`CADASTROS_SUBROUTE_LABELS`) em vez de 1 `isXArea` + 1 `if` por onda — decisão tomada nesta onda pra não inflar o arquivo a cada uma das 14 ondas do plano (aplica-se retroativamente a Planos também, sem mudar comportamento).
- [x] `CadastrosHubView.tsx` — card "Entrega" vira `native: true`.

**Validações executadas (todas reais):** `tsc -b` (web) limpo; `npm run build` (web) PASS; `docker compose build web` + redeploy. **E2E real contra Postgres**: `GET` inicial `404` (chaves nunca setadas); `PUT` das 2 chaves → `200`; revertido pros defaults originais (10/150) ao final. **Validação visual real** (Playwright, 5 checks): título/breadcrumb corretos; valores iniciais = defaults; salvar reflete no resumo aplicado; **persistência real confirmada com reload de página** (não só estado local em memória); banco conferido de volta aos defaults ao final via UI mesmo (não só API).

---

## Onda 3 — Branding Global ✅ CONCLUÍDA 2026-08-16

**Pergunta que a tela fecha:** *qual é o nome completo, nome curto e logo atuais da marca, e como trocá-los?*

**RAG feito:** ao contrário de Entrega (Onda 2), Branding **não** usa o genérico `/api/settings/:key` — tem rota dedicada em `admin.ts` (`GET/PUT /admin/branding`), que por baixo lê/grava a mesma tabela `Setting` (chave `public.branding`, `PUBLIC_BRANDING_SETTING_KEY`) via `modules/branding/service.ts`, mas com schema Zod próprio (`brandingPayloadSchema`: `fullName`/`shortName`/`logoUrl`) e cache in-memory de 5min no service. Legado (`admin-branding/components/AdminBrandingView.tsx`, 496 linhas) já era React puro, sem `behavior.ts` — confirmado o tier P do roadmap. Achado de posicionamento: Branding pertence ao hub **Sistema**, não Cadastros (conferido na tabela de roadmap do plano e em `SistemaHubView.tsx`), diferente de Planos/Entrega que foram Cadastros — é a primeira onda que usa `sistema/*`.

**Backend:** nenhuma mudança — reusa `/api/admin/branding` sem alteração.

**Frontend entregue:**
- [x] `apps/web/src/admin-v2/shared/api.ts` — `fetchBranding`/`updateBranding` (rota dedicada, não o genérico `fetchSetting`/`updateSetting`) + `uploadAsset` (cliente genérico de `/api/uploads`, reusável desde já pra Galeria de Mídias na Onda 7).
- [x] `apps/web/src/admin-v2/sistema/branding/BrandingSettingsView.tsx` (novo) — form com os 3 campos, upload de logo com preview, histórico local de logos (localStorage, mesma lógica do legado) com botão "Reverter", painel de pré-visualização ao vivo. Chama `updateBrandingSnapshot` (de `modules/public-site/branding.runtime`, módulo utilitário compartilhado, não editado) após salvar, pra refletir instantaneamente no site público — mesmo comportamento do legado.
- [x] `AdminV2Root.tsx` — rota `sistema/branding`; **generalizado o padrão de breadcrumb por lookup** (`CADASTROS_SUBROUTE_LABELS`, da Onda 2) também pro hub de Sistema (`SISTEMA_SUBROUTE_LABELS`), mesmo mecanismo, evita duplicar a lógica de novo.
- [x] `SistemaHubView.tsx` — card "Branding" vira `native: true`; comentário de topo e texto do header atualizados (deixam de dizer "sem reescrita estética nesta fase").

**Validações executadas (todas reais):** `tsc -b` (web) limpo; `npx eslint` nos arquivos tocados limpo; `npm run build` (web) PASS; `docker compose build web` + redeploy `--force-recreate`. **E2E real contra Postgres** (login MASTER via `/api/auth/login`, campo `identifier`): `GET /admin/branding` inicial confirma valores de produção (`JLR Beauty`/`JLR`/`/images/JLRLOGO.webp`); `PUT` com valores de teste → `200`; `GET` confirma persistência; `PUT` revertendo pro original → `200`; `GET` final confirma banco de volta ao estado original. **Validação visual real** (Playwright, 7 checks, todos PASS): hub de Sistema mostra "Branding" com "Abrir →" (as demais 5 telas do hub seguem "Abrir no Admin →"); navegação real pro `/admin-v2/sistema/branding`; breadcrumb `Panorama > Sistema > Branding`; campos pré-preenchidos com os valores reais do banco; editar + salvar via UI mostra mensagem de sucesso; **persistência confirmada com reload de página real**; revertido ao valor original via UI ao final, confirmado por reload — nenhum dado de teste deixado pra trás. Screenshots conferem visualmente: cards do hub, tela de config com preview do logo real renderizando corretamente.

---

## Onda 4 — Cupons de Desconto ✅ CONCLUÍDA 2026-08-16

**Pergunta que a tela fecha:** *quais cupons existem, com que regra de desconto e validade, e como criar/editar/excluir um?*

**RAG feito:** `admin.ts` já tinha CRUD completo (`GET/POST/PATCH/DELETE /discount-coupons`) reusando `DiscountCoupon` (`schema.prisma`: `percentOff`/`amountOff`/`minSubtotal` como `Decimal?`, mesma pegadinha de serialização `string | null` das Ondas 1/3). Legado (`admin-discount-coupons/AdminDiscountCouponsView.tsx`, 538 linhas) já era React puro. **Achado importante descoberto só na validação E2E via UI** (não no RAG estático): o schema Zod de **criação** (`discountCouponSchema`) só aceita `number | undefined` em `percentOff`/`amountOff`/`minSubtotal` — `null` explícito falha a coerção (`z.coerce.number()` transforma `null` em `0`, que reprova `min(0.01)`). Só o schema de **atualização** (`discountCouponUpdateSchema`) aceita `null` explícito (pra permitir limpar um campo já setado). O form nativo inicialmente mandava `null` pro campo de desconto não usado em ambos os casos — quebrava toda criação de cupom com "dados invalidos". Corrigido enviando `undefined` (chave omitida) ao criar e `null` explícito ao editar, mesma distinção que o form legado já fazia (`payload.amountOff = isUpdate ? null : undefined`), só que replicada corretamente desta vez.

**Backend:** nenhuma mudança — reusa `/api/discount-coupons` sem alteração.

**Frontend entregue:**
- [x] `apps/web/src/admin-v2/cadastros/coupons/types.ts` — `DiscountCoupon`, `DiscountCouponInput`, `DiscountType`.
- [x] `apps/web/src/admin-v2/shared/api.ts` — `fetchDiscountCoupons`/`createDiscountCoupon`/`updateDiscountCoupon`/`deleteDiscountCoupon`.
- [x] `apps/web/src/admin-v2/cadastros/coupons/components/CouponFormModal.tsx` — criar/editar, mesmas regras de validação client-side do legado (percentual xor valor fixo, fim >= início).
- [x] `apps/web/src/admin-v2/cadastros/coupons/CouponsListView.tsx` — **tabela** (não cards, diferente da Onda 1) — 8 colunas, mesmo padrão de tabela já usado em outras telas do Admin V2 (`money/MoneyView.tsx`); reusa `DeleteConfirmModal` (Onda 1).
- [x] `AdminV2Root.tsx` — rota `cadastros/cupons`; entrada em `CADASTROS_SUBROUTE_LABELS`.
- [x] `CadastrosHubView.tsx` — card "Cupons" vira `native: true`.

**Validações executadas (todas reais):** `tsc -b` (web) limpo; `npm run build` (web) PASS; `docker compose build web` + redeploy `--force-recreate` (2x — a primeira rodada de validação visual pegou o bug de `null` vs `undefined` acima, corrigido e revalidado do zero). **E2E real contra Postgres**: baseline vazio (`[]`); `POST` cria cupom `PERCENT` → `201`; `PATCH` troca pra `FIXED` (testa a troca de tipo, campo antigo zerado corretamente) → `200`; `DELETE` → `204`; banco confirmado de volta a `[]`. **Validação visual real** (Playwright, 8 checks, todos PASS — só depois da correção do bug de criação): hub mostra "Cupons" com "Abrir →"; criar cupom via UI (achou o bug real, não um falso-negativo de teste); cupom aparece na tabela e **persiste após reload**; editar nome reflete na tabela; excluir abre `DeleteConfirmModal` (não `window.confirm()`) e remove da lista; estado vazio final confirmado por reload — nenhum dado de teste deixado pra trás.

---

## Onda 5 — Textos das Páginas ✅ CONCLUÍDA 2026-08-16

**Pergunta que a tela fecha:** *quais textos do site público existem, e como editar qualquer um deles sem gerar deploy?*

**RAG feito:** catálogo (`apps/api/src/modules/pageTexts/catalog.ts`) tem **331 entradas** (`key`, `page`, `section`, `label`, `type: "simple" | "segmented"`, `defaultValue`), cada uma endereçável por chave em `Setting` (`public.pageTexts`). Legado (`admin-page-texts/AdminPageTextsView.tsx` + `SegmentEditor.tsx`, 309+91 linhas) já era React puro. **Achado crítico de contrato, não óbvio pelo schema Zod sozinho**: `savePublicPageTexts` (`pageTexts/service.ts`) **substitui o mapa inteiro** — faz merge com os *defaults* do catálogo, não com o que estava salvo antes. Um `PUT` que manda só as chaves editadas nesta sessão reseta todas as outras 300+ pro valor padrão. A tela (nativa e legada) precisa manter as 331 chaves em memória (carregadas já mescladas com defaults pelo `GET`) e mandar o mapa completo de volta em todo `PUT`, nunca um diff.

**Backend:** nenhuma mudança — reusa `/api/admin/page-texts` (+ `/previous` + `/restore`) sem alteração.

**Frontend entregue:**
- [x] `apps/web/src/admin-v2/sistema/pageTexts/types.ts` — `PageTextCatalogEntry`; `StyleId`/`TextSegment`/`PageTextValue`/`PageTextsMap` reusados de `modules/public-site/pageTexts.ts` (módulo utilitário compartilhado com o site público, não é `admin-*` legado).
- [x] `apps/web/src/admin-v2/shared/api.ts` — `fetchPageTexts`/`fetchPreviousPageTexts`/`savePageTexts`/`restorePreviousPageTexts`.
- [x] `apps/web/src/admin-v2/sistema/pageTexts/components/SegmentEditor.tsx` — porte 1:1 do editor de texto segmentado (múltiplas partes com estilo próprio + preview ao vivo), só troca de classes pro visual do V2.
- [x] `apps/web/src/admin-v2/sistema/pageTexts/PageTextsView.tsx` — abas por página (Home/Franquias/Assinaturas/Missão&Valores) + acordeão por seção, mesmo padrão do legado pra não renderizar os 331 campos de uma vez; botão "Restaurar versão anterior" (undo de 1 nível, preservado).
- [x] `apps/web/src/admin-v2/shell/DeleteConfirmModal.tsx` — **generalizado** com `tone`/`confirmLabel`/`confirmingLabel` opcionais (default preserva 100% o comportamento original de exclusão) pra também servir confirmação neutra (restaurar), em vez de criar um segundo componente quase idêntico.
- [x] `AdminV2Root.tsx` — rota `sistema/textos-paginas`; entrada em `SISTEMA_SUBROUTE_LABELS`.
- [x] `SistemaHubView.tsx` — card "Textos das Páginas" vira `native: true`.

**Validações executadas (todas reais):** `tsc -b` (web) limpo; `eslint` nos arquivos tocados limpo; `npm run build` (web) PASS; `docker compose build web` + redeploy `--force-recreate`. **E2E real contra Postgres, com cuidado redobrado por ser conteúdo de produção real (não massa de teste)**: baseline de 331 chaves capturado via `GET` antes de qualquer mutação; `PUT` com 1 campo alterado (mapa completo, 330 chavesinalteradas + 1 QA marker) → confirmado; `PUT` revertendo o mapa completo original → confirmado **byte-a-byte idêntico ao baseline** (comparação Python de dicionário completo, não só amostra); endpoint `/restore` testado explicitamente (GET previous, POST restore, confirma valor restaurado) e revertido de novo ao original real ao final — banco de produção saiu do teste exatamente como entrou. **Validação visual real** (Playwright, 11 checks, todos PASS): hub mostra "Textos das Páginas" com "Abrir →"; 331 campos confirmados no header; edição + salvar com sucesso; **persistência confirmada com reload**; botão restaurar visível (`hasPrevious=true`, dado real de produção); modal de restauração (tom neutro, não vermelho) funciona e traz o valor anterior de volta; troca de aba (Home→Franquias) renderiza seções e conteúdo real corretos; **DB confirmado restaurado byte-a-byte ao final via chamada de API dedicada, independente do que o fluxo de UI deixou**.

---

## Onda 6 — Seções Telas (liga/desliga) ✅ CONCLUÍDA 2026-08-16

**Pergunta que a tela fecha:** *quais seções das páginas públicas estão ligadas/desligadas, e como um MASTER muda isso sem deploy?*

**RAG feito:** `admin.ts` já tinha `GET/PUT /admin/section-toggles`, 32 chaves `page.section` (Home 8, Franquias 19, Assinaturas 5), gravadas em `Setting` (`public.sectionToggles`). **Restrição de papel preservada exatamente**: `canEditSectionToggles(userId)` exige `role === "MASTER"` — checada em cima do `requireAdmin` padrão, no `GET` **e** no `PUT` (um ADMIN comum recebe 403 até pra *ver* os toggles, não só editar). Legado (`admin-section-toggles/AdminSectionTogglesView.tsx`, 276 linhas) já tinha gate client-side espelhando isso (`getUser()?.role === "MASTER"`, checado antes de chamar a API), replicado 1:1.

**Backend:** nenhuma mudança — reusa `/api/admin/section-toggles` sem alteração.

**Frontend entregue:**
- [x] `apps/web/src/admin-v2/shared/api.ts` — `fetchSectionToggles`/`updateSectionToggles`, tipo `SectionToggleMap`.
- [x] `apps/web/src/admin-v2/sistema/sectionToggles/SectionTogglesView.tsx` — 3 colunas (Home/Franquias/Assinaturas), ordem fixa de página e seção (não alfabética, mesma do legado — reflete a ordem real nas páginas públicas), switch customizado (Tailwind, sem CSS inline como o legado), gate `canEdit` client-side preservado.
- [x] `AdminV2Root.tsx` — rota `sistema/secoes`; entrada em `SISTEMA_SUBROUTE_LABELS`.
- [x] `SistemaHubView.tsx` — card "Seções" vira `native: true`.

**Bug real achado na validação visual, não no E2E via curl (`ERR-0051`, mesma causa raiz do `ERR-0049`/`ERR-0040`)**: todos os 32 toggles renderizavam brancos/sem cor, círculo sempre à esquerda, mesmo com `enabled: true` no banco. Causa: `tailwind.generated.css` é um snapshot estático (gerado na Onda 5 do `PLAN-0025`) — o switch customizado introduziu classes nunca usadas antes no código (`border-state-healthy` na forma bare, `w-[52px]`, `left-[26px]`), ausentes do CSS servido. Corrigido regenerando o arquivo por completo (mesmo comando documentado no cabeçalho do próprio arquivo) — a regeneração rescaneia todo o código atual, então automaticamente cobre também as Ondas 1-5. Documentado como `ERR-0051`, com nota de processo: telas futuras que introduzam padrão visual genuinamente novo devem regenerar esse arquivo como parte padrão da validação, não só reativamente.

**Validações executadas (todas reais):** `tsc -b` (web) limpo; `eslint` nos arquivos tocados limpo; `npm run build` (web) PASS (2x — antes e depois do fix de CSS); `docker compose build web` + redeploy `--force-recreate` (2x). **E2E real contra Postgres**: baseline de 32 chaves capturado (confirmado: produção já tinha todas as 32 seções em `true`, diferente dos defaults do código que têm várias `false` — dado real, não bug); toggle de 1 chave + `PUT` completo confirmado; revertido ao mapa original exato. **Validação visual real** (Playwright, 8 checks, todos PASS — só depois do fix de CSS): hub mostra "Seções" com "Abrir →"; total de 32 seções confirmado; toggle muda `aria-pressed` e reflete na tela; **persistência confirmada com reload**; **pixel-sampling confirmou `rgb(0,150,127)` exato no estado ligado e cinza claro no desligado** (não só "parece verde"); banco confirmado revertido ao original ao final.

---

## Onda 7 — Galeria de Mídias ✅ CONCLUÍDA 2026-08-16 (fecha o tier P)

**Pergunta que a tela fecha:** *quais imagens institucionais o site usa em cada slot, e como trocar qualquer uma sem deploy?*

**RAG feito:** `admin.ts` já tinha `GET/PUT /admin/media-slots` + reuso de `/api/uploads` genérico. 78 slots (`MEDIA_SLOT_IDS`), cada um com `page`/`section`/`order`/`label`/`fallbackUrl` num catálogo hardcoded no backend (`mediaSlots/service.ts`, 606 linhas, majoritariamente dados) — e uma cópia local equivalente no frontend (`modules/public-site/mediaSlots.ts`, módulo utilitário compartilhado com o site público, reusado sem edição). **Mesmo contrato "manda o mapa inteiro" da Onda 5** (`savePublicMediaSlots` normaliza com fallback pra qualquer slot ausente, não faz merge incremental). Legado (`admin-media-gallery/AdminMediaGalleryView.tsx`, 519 linhas) já era React puro — grid de thumbnails agrupado por página, clique abre editor em modal (preview, URL manual, upload, reverter fallback).

**Backend:** nenhuma mudança — reusa `/api/admin/media-slots` + `/api/uploads` sem alteração.

**Frontend entregue:**
- [x] `apps/web/src/admin-v2/shared/api.ts` — `fetchMediaSlots`/`saveMediaSlots` (reusa `uploadAsset` da Onda 3).
- [x] `apps/web/src/admin-v2/sistema/mediaGallery/MediaGalleryView.tsx` — grid de 78 thumbnails agrupados por página (Home/Franquias/Assinaturas/Checkout/Global), modal de edição por slot (preview real, URL manual, upload, reverter fallback, salvar-e-fechar), confirmação de "fechar sem salvar" via `DeleteConfirmModal` (`tone="neutral"`) em vez de `window.confirm()` do legado.
- [x] `AdminV2Root.tsx` — rota `sistema/galeria-midias`; entrada em `SISTEMA_SUBROUTE_LABELS`.
- [x] `SistemaHubView.tsx` — card "Galeria de Mídias" vira `native: true`.

**Bug real achado na validação visual (`ERR-0052`, não no E2E via curl)**: o modal de "fechar sem salvar" abria mas ficava impossível de clicar — herdado do legado com `z-[80]`, o modal do editor de slot ficava acima do `DeleteConfirmModal` compartilhado (`z-50`, convenção de todos os outros modais nativos do Admin V2). Corrigido igualando o editor a `z-50` — com z-index empatado, a ordem de renderização no DOM (confirmação depois do editor) já garante a pilha correta. Nota de processo: nunca copiar `z-[N]` arbitrário do legado sem checar contra a convenção já estabelecida.

**Validações executadas (todas reais):** `tsc -b` (web) limpo; `eslint` nos arquivos tocados limpo; `npm run build` (web) PASS (2x — antes e depois do fix de z-index); **CSS regenerado proativamente antes do primeiro rebuild** (lição da Onda 6 — `h-[140px]`, `z-[80]`→depois removido, `h-[260px]`, `max-w-[640px]` confirmados presentes antes de gastar um ciclo de build); `docker compose build web` + redeploy `--force-recreate` (2x). **E2E real contra Postgres**: baseline de 78 slots capturado; 1 slot alterado + `PUT` completo confirmado; revertido ao mapa original exato. **Validação visual real** (Playwright, 10 checks, todos PASS — 9/10 na primeira rodada por causa do `ERR-0052`): hub mostra "Galeria de Mídias" com "Abrir →"; 78 slots confirmados; editor abre com preview real; editar+salvar com sucesso; **persistência confirmada com reload**; reverter fallback funciona; **modal de confirmação de fechar sem salvar funciona de verdade** (não só aparece — o clique completa); banco confirmado revertido ao original ao final.

**Tier P do roadmap está 100% concluído** (Ondas 1-7). Ondas 8-14 são tier M/G — telas com `behavior.ts` imperativo pra reescrever como React (Serviços/WhatsApp/Testes) e as telas mais pesadas (Produtos/Clientes/Profissionais/Usuários).

---

## Onda 8 — Serviços ✅ CONCLUÍDA 2026-08-16 (primeira do tier M)

**Pergunta que a tela fecha:** *quais serviços o salão oferece, com que categoria/status/preço/comissão, e como criar/editar/excluir um?*

**RAG feito:** `catalog.ts` já tinha CRUD completo (`GET/POST/PATCH/DELETE /services`) + CRUD de `/service-categories` e `/service-statuses` (endpoints compartilhados, também usados por Produtos — confirmado em `admin-core/behavior.ts`, que já tem um gerenciador genérico de catálogo por `kind`). Legado (`admin-services/behavior.ts`, 416 linhas imperativas + `AdminServicesView.tsx`, 250 linhas de markup com `data-*` hooks) — primeira tela do plano com esse padrão a reescrever. **Achado**: os `<select>` de categoria/status no JSX legado tinham `<option>` **hardcoded** (Cabelos/Estética/Sobrancelhas/Unhas fixos) — na prática irrelevante porque `admin-core/behavior.ts` sobrescrevia essas opções dinamicamente via `/service-categories`/`/service-statuses` reais em tempo de execução; a tela nativa busca as opções reais desde o primeiro render, sem depender de um sobrescritor externo.

**Backend:** nenhuma mudança — reusa `/api/services` + `/api/service-categories` + `/api/service-statuses` sem alteração.

**Frontend entregue:**
- [x] `apps/web/src/admin-v2/cadastros/services/types.ts` — `Service`, `ServiceInput`, `ServiceCategory`, `ServiceStatusOption`, `CategoryOrStatusInput`.
- [x] `apps/web/src/admin-v2/shared/api.ts` — `fetchServices`/`createService`/`updateService`/`deleteService` + CRUD completo de categorias/status de serviço (**desenhado reusável pra Onda 11/Produtos**, que usa o mesmo padrão de endpoint no backend).
- [x] `apps/web/src/admin-v2/cadastros/services/components/CategoryStatusManagerModal.tsx` (novo, reusável) — modal genérico por `kind` (categoria/status), lista + criar/editar/excluir. "Em uso, não pode excluir" decidido pelo **backend** (409), não recalculado no cliente — simplifica o componente.
- [x] `apps/web/src/admin-v2/cadastros/services/components/ServiceFormModal.tsx` — criar/editar, dropdowns de categoria/status carregados de verdade da API (não hardcoded), botão "+"/"tune" abre o gerenciador, upload de imagem reusando `uploadAsset` (Onda 3).
- [x] `apps/web/src/admin-v2/cadastros/services/ServicesListView.tsx` — tabela com busca + filtro de categoria + filtro de status (regra de negócio real, necessária com 75 serviços); `DeleteConfirmModal` reusado. **Decisão de modernização documentada**: paginação numerada do legado não reproduzida (tabela rolável, mesmo padrão do resto do Admin V2, que não usa paginação em lugar nenhum) — não é regra de negócio, é escolha de UX do legado.
- [x] `AdminV2Root.tsx` — rota `cadastros/servicos`; entrada em `CADASTROS_SUBROUTE_LABELS`.
- [x] `CadastrosHubView.tsx` — card "Serviços" vira `native: true`.

**Validações executadas (todas reais):** `tsc -b` (web) limpo; `eslint` nos arquivos tocados limpo; `npm run build` (web) PASS; CSS conferido sem precisar regenerar (classes usadas já existiam no `tailwind.generated.css` das ondas anteriores); `docker compose build web` + redeploy `--force-recreate`. **E2E real contra Postgres**: baseline de 75 serviços; criado serviço de teste, categoria e status de teste; atribuídos ao serviço; `DELETE` de categoria em uso confirmado bloqueado (`409`, regra do backend); serviço excluído; categoria/status de teste excluídos (agora sem uso); banco confirmado de volta a 75. **Validação visual real** (Playwright, 10 checks, todos PASS): hub mostra "Serviços" com "Abrir →"; lista com filtro de busca funcional; criar serviço via modal; **persistência confirmada com reload**; gerenciador de categoria aberto de dentro do form de edição (modal aninhado, mesmo padrão de nesting já usado nas Ondas 5/7), cria e exclui categoria de teste; excluir serviço via `DeleteConfirmModal`; volta a 75/75 confirmado por reload — nenhum dado de teste deixado pra trás.

---

## Onda 9 — WhatsApp / Integrações ✅ CONCLUÍDA 2026-08-16

**Pergunta que a tela fecha:** *quais contatos/agendamentos o bot do WhatsApp registrou, e como configurar o fluxo de saudações e apresentação de serviços?*

**RAG feito:** `schedule.ts` já tinha `GET /concierge/sessions` (leitura, com filtro **server-side** de `search`/`status`/`from`/`to` — melhor que o legado, que buscava até 500 registros de uma vez e filtrava no cliente). As 3 configs do fluxo do bot (categorias-primeiro boolean + 2 textos de saudação) já viviam em `/api/settings/:key` genérico, mesmo padrão da Onda 2 (Entrega) — **zero cliente HTTP novo pra elas**, só reuso de `fetchSetting`/`updateSetting`. Legado (`admin-whatsapp-contacts/behavior.ts`, 361 linhas + 96 de markup) buscava tudo de uma vez e filtrava em memória — tela nativa manda os filtros na querystring, aproveitando o suporte que a rota já tinha.

**Backend:** nenhuma mudança — reusa `/api/concierge/sessions` + `/api/settings/:key` sem alteração.

**Frontend entregue:**
- [x] `apps/web/src/admin-v2/sistema/whatsapp/types.ts` — `ConciergeSession`, `ConciergeSessionStatus`.
- [x] `apps/web/src/admin-v2/shared/api.ts` — `fetchConciergeSessions` (única função nova; configs reusam `fetchSetting`/`updateSetting` da Onda 2 sem alteração).
- [x] `apps/web/src/admin-v2/shared/format.ts` — `formatDateTimeBR` (novo formatador reusável, primeira tela que precisa de data+hora juntos).
- [x] `apps/web/src/admin-v2/sistema/whatsapp/WhatsappIntegrationsView.tsx` — bloco de config (toggle categorias-primeiro com save otimista + rollback em erro, 2 textareas de saudação com botão salvar), bloco de filtros (busca/status/período + botão Atualizar, filtro server-side em vez de client-side), tabela de auditoria (badges de status com tokens semânticos: `state-info`/`state-healthy`/`state-critical`, melhor que o legado, que não tinha cor definida pra `ACTIVE`).
- [x] `AdminV2Root.tsx` — rota `sistema/whatsapp`; entrada em `SISTEMA_SUBROUTE_LABELS`.
- [x] `SistemaHubView.tsx` — card "WhatsApp / Integrações" vira `native: true`.

**Validações executadas (todas reais):** `tsc -b` (web) limpo; `eslint` nos arquivos tocados limpo; `npm run build` (web) PASS; CSS conferido sem precisar regenerar; `docker compose build web` + redeploy `--force-recreate`. **E2E real contra Postgres**: baseline confirmado (settings ainda não existiam, 404 — comportamento esperado, tratado como "usa default"; 0 sessões de concierge, ambiente sem dado de teste de WhatsApp); `PUT` das 3 configs confirmado, revertido aos valores default. **Validação visual real** (Playwright, 8 checks, todos PASS): hub mostra "WhatsApp / Integrações" com "Abrir →"; estado vazio da tabela renderiza corretamente; toggle liga/desliga e salva; **persistência confirmada com reload**; saudações editadas e salvas, revertidas ao final; busca+filtro não quebram a tela.

---

## Onda 10 — Testes e Validação ✅ CONCLUÍDA 2026-08-16 (fecha o tier M e o hub de Sistema inteiro)

**Pergunta que a tela fecha:** *os endpoints principais da API estão respondendo, e criar+excluir um registro de teste funciona ponta a ponta?*

**RAG feito — achado que mudou o desenho da tela**: o legado (`admin-tests/behavior.ts`, 385 linhas) mistura 2 tipos de checagem: (1) **13 smoke-checks de API** (`GET` em endpoints reais, útil e portável — testa o backend compartilhado, que é o mesmo pros dois frontends) e (2) **checagens de DOM do shell legado** (`.top-nav`, `.site-footer`, `[data-view="..."]`, `[data-view-trigger="..."]`, `[data-user-create-save]`, `[data-service-save]`, `[data-product-save]`, `[data-users-error]`, `[data-price-error]`). O grupo (2) verifica seletores que **só existem na árvore DOM do Admin legado** — o Admin V2 é uma app React totalmente diferente, sem nenhum desses hooks. Portar esse grupo 1:1 faria a tela nativa mostrar "FALHOU" permanentemente pra elementos que nunca existiram aqui — um falso-negativo enganoso, não uma checagem de saúde real. **Decisão**: a tela nativa mantém só o grupo (1) — os 13 smoke-checks de API, mais o teste de gravação (criar+excluir serviço/produto) e a checagem de validação de payload inválido, todos testando o backend de verdade. Documentado explicitamente no cabeçalho do componente pra não ser lido como "funcionalidade perdida" numa auditoria futura.

**Backend:** nenhuma mudança — reusa os 13 endpoints já existentes (mesma lista do legado) + `POST`/`DELETE` de `/services` e `/products` pro teste de gravação.

**Frontend entregue:**
- [x] `apps/web/src/admin-v2/shared/api.ts` — `pingApi` (smoke-check genérico, só confirma `GET` OK) e `apiRequest` (genérico com método/corpo livres, usado pro teste de gravação e validação) — evita criar 13+ funções tipadas one-off só pra "checar se responde".
- [x] `apps/web/src/admin-v2/sistema/tests/TestsView.tsx` — botão "Executar testes", 4 cards de resumo (passou/aviso/falhou/ignorado), lista de resultados com badges em tokens semânticos, mesmo gate de segurança do legado pro teste de gravação (`localStorage.admin_tests_write === "true"` OU hostname `localhost`/`127.0.0.1`).
- [x] `AdminV2Root.tsx` — rota `sistema/testes`; entrada em `SISTEMA_SUBROUTE_LABELS`.
- [x] `SistemaHubView.tsx` — card "Testes" vira `native: true`; **hub de Sistema fecha 100% nativo** (6/6 cards navegáveis) — comentário de topo e texto do header atualizados.

**Validações executadas (todas reais):** `tsc -b` (web) limpo; `eslint` nos arquivos tocados limpo; `npm run build` (web) PASS; CSS conferido sem precisar regenerar; `docker compose build web` + redeploy `--force-recreate`. **E2E real contra Postgres**: os 14 endpoints (13 + auth) confirmados `200` via `curl` antes da validação visual. **Validação visual real** (Playwright, 12 checks, todos PASS) — **essa onda é literalmente uma ferramenta de auto-teste, então rodá-la via UI já É o E2E**: clicar "Executar testes" produziu **18/18 PASSOU, 0 falhas/avisos**, incluindo os 2 testes de gravação (criar+excluir serviço e produto reais, contagem de `/services`/`/products` confirmada inalterada antes/depois) e o teste de validação (payload inválido rejeitado com 400); confirmado que nenhum ID de checagem de DOM legado (`ui:nav`, `ui:views`, etc.) aparece nos resultados — a redução de escopo foi aplicada de fato, não só documentada.

**Marco:** com a Onda 10, **tier P (7 ondas) e tier M (3 ondas) estão inteiramente concluídos** — 10 de 14 ondas do plano, hub de Sistema 100% nativo. Restam só as 4 ondas do tier G, todas em Cadastros (Produtos, Clientes, Profissionais, Usuários) — as mais pesadas do plano, incluindo o desmembramento de "Pessoas" em 3 telas independentes (`DECISION-014` regra #3).

---

## Onda 11 — Produtos ✅ CONCLUÍDA 2026-08-16 (a mais pesada do plano, primeira do tier G)

**Pergunta que a tela fecha:** *quais produtos o catálogo tem, com que categoria/status/preço/estoque, e como criar/editar/excluir um e movimentar seu estoque por unidade?*

**RAG feito:** `catalog.ts` já tinha CRUD completo de `/products` + `/product-categories` + `/product-statuses` (mesmo desenho de endpoint de Serviços, Onda 8). `inventory.ts` (`PLAN-0020`) já tinha os 4 endpoints de movimento (`/units/:unitId/products/:id/stock/{entry,consumption,loss,adjust}`), leitura cross-unit (`/inventory/cross-unit?productId=`), histórico (`/units/:unitId/products/:id/movements`) e lista de unidades (`/inventory/units`). Legado (`admin-products/behavior.ts`, 973 linhas + `AdminProductsView.tsx`, 450 linhas) — a tela mais pesada do legado inteiro, confirmando a estimativa do roadmap.

**Achado de RAG corrigido depois de um E2E real (lição de processo)**: a varredura inicial concluiu que `Product.stock` nunca era atualizado após a criação (só grep por `.product.update(`, padrão ORM) — **errado**. `applyStockMovement` (`lib/stockLedger.ts`) recalcula o campo via `$executeRaw` (SQL bruto, `syncProductGlobalStock`), que o grep por padrão ORM não pegou. Só descobri o erro criando um produto de teste de verdade, registrando movimentos reais e conferindo que `product.stock` refletia a soma correta. Corrigido: `types.ts` documenta o achado certo, e a tabela de Produtos **mostra** "Estoque total" (antes ia excluir a coluna por achar que seria sempre 0). **Lição geral**: `grep` por um padrão de código específico prova ausência só daquele padrão, não do comportamento — só E2E real prova comportamento real.

**Achado de backend confirmado (fora de escopo, `ERR-0053`)**: `DELETE /products/:id` responde `500` (não 404/409) pra qualquer produto que já teve 1+ movimento de estoque — `StockMovement.product` não tem `onDelete: Cascade` no schema. Confirmado com teste real (criar produto, mover estoque, tentar excluir → 500); produto de teste removido via SQL direto (não pela API, que não oferece caminho). Documentado, não corrigido (mudança de schema/backend, fora do escopo desta onda de frontend).

**Backend:** nenhuma mudança — reusa `/api/products` + `/api/product-categories` + `/api/product-statuses` + `/api/inventory/*` sem alteração.

**Frontend entregue:**
- [x] `apps/web/src/admin-v2/cadastros/products/types.ts` — `Product`, `ProductInput`, `ProductCategory`, `ProductStatusOption`, `InventoryUnit`, `CrossUnitStockRow`, `StockMovementRow`, `StockMovementKind`/`Input`.
- [x] `apps/web/src/admin-v2/shared/api.ts` — CRUD de produtos + categorias/status de produto + `fetchInventoryUnits`/`fetchCrossUnitStock`/`fetchStockMovements`/`postStockMovement`.
- [x] `apps/web/src/admin-v2/cadastros/services/components/CategoryStatusManagerModal.tsx` — **generalizado** com prop `entity?: "service" | "product"` (default `service`, não quebra a Onda 8) — mesmo componente serve categorias/status de Serviço **e** Produto agora, sem duplicar.
- [x] `apps/web/src/admin-v2/cadastros/products/components/StockMoveModal.tsx` (novo) — as 4 modalidades de movimento (entrada/uso/perda/ajuste), mesma validação do legado (ajuste exige razão ≥3 chars).
- [x] `apps/web/src/admin-v2/cadastros/products/components/StockHistoryModal.tsx` (novo) — histórico por unidade, sinal +/−/± por tipo de movimento.
- [x] `apps/web/src/admin-v2/cadastros/products/components/ProductFormModal.tsx` (novo) — catálogo completo (nome/categoria/SKU/preço/custo/estoque mínimo/status/destaque/descrição/benefícios até 5/imagem com upload), estoque inicial só na criação (regra do backend), painel "Estoque por unidade" só na edição (saldo real via `/inventory/cross-unit`, abre os modais de Movimentar/Histórico).
- [x] `apps/web/src/admin-v2/cadastros/products/ProductsListView.tsx` — tabela com busca + filtro categoria/status + coluna "Estoque total" (destacada em vermelho quando ≤ mínimo); `DeleteConfirmModal` reusado.
- [x] `AdminV2Root.tsx` — rota `cadastros/produtos`; entrada em `CADASTROS_SUBROUTE_LABELS`.
- [x] `CadastrosHubView.tsx` — card "Produtos" vira `native: true`.

**Decisões de modernização documentadas**: (1) coluna "Patrimônio" do legado (preço × estoque) não reproduzida — estoque em si já é suficiente na lista, patrimônio por linha não agrega muito; (2) os 4 cards de resumo do topo do legado ("Produtos ativos: 128" etc.) eram números **estáticos fabricados no JSX**, nunca calculados por `behavior.ts` — não portados (dado fake, nunca existiu de verdade); (3) paginação numerada não reproduzida, mesmo padrão das Ondas 4/8/9.

**Validações executadas (todas reais):** `tsc -b` (web) limpo; `eslint` nos arquivos tocados limpo (mesmo padrão tolerado de fetch-on-mount); `npm run build` (web) PASS (2x); **CSS regenerado proativamente** antes do rebuild (`min-w-[880px]`, `min-w-[540px]`, `max-h-[92vh]` ausentes, confirmado e corrigido antes de gastar um ciclo Docker); `docker compose build web` + redeploy `--force-recreate` (2x — 1ª pro código, 2ª pro fix do achado `Product.stock`). **E2E real contra Postgres**: baseline de 9 produtos; criado produto com estoque inicial (unidade real); `cross-unit` confirmou saldo; `entry` (+5) e `adjust` (→20) confirmados via `movements` (histórico com 3 linhas corretas); `Product.stock` confirmado refletindo a soma real (20) — achado que corrigiu o RAG inicial; `DELETE` de produto com movimento confirmado falhando com 500 (`ERR-0053`); limpeza de dados de teste via SQL direto (não pela API, que não oferece caminho pra esse caso). **Validação visual real** (Playwright, 8/9 checks automatizados PASS + 1 falso-negativo de timing confirmado correto por screenshot): hub mostra "Produtos" com "Abrir →"; criar produto via modal, **persistência confirmada com reload**; gerenciador de categoria de produto (modal generalizado) cria e exclui categoria de teste; painel de estoque abre "Movimentar", registra entrada real, painel atualiza; "Histórico" mostra o movimento real (`Entrada +5 saldo 5 razão "entrada de compra" por master`) — confirmado pela screenshot mesmo com o check automatizado marcando falso-negativo por timing; produto de teste removido via SQL, banco confirmado de volta a 9.

---

## Onda 12 — Clientes ✅ CONCLUÍDA 2026-08-16 (primeira do desmembramento de "Pessoas")

**Pergunta que a tela fecha:** *quais clientes existem, com que contato/endereço/conta vinculada, e como cadastrar/editar um?*

**RAG feito:** `schedule.ts` já tinha `GET/POST/PATCH /customers` — **sem `DELETE`** (confirmado, não fabricado; a tela nativa também não tem botão de excluir, mesma limitação do legado). Legado (`admin-people/behavior.ts`, 1728 linhas + `AdminPeopleView.tsx`, 967 linhas) é uma mega-tela com 3 abas (Clientes/Profissionais/Usuários) — desmembrada em 3 ondas nativas independentes por `DECISION-014` regra #3. Campos: nome, telefone (único), telefone alternativo, email, cidade, UF, bairro, notas, vínculo opcional com conta de usuário via ID numérico bruto (sem busca/autocomplete no legado — preservado, não modernizado, pois a tela de Usuários nativa ainda não existe pra oferecer um seletor melhor sem inventar dependência cruzada precoce).

**Backend:** nenhuma mudança — reusa `/api/customers` sem alteração.

**Frontend entregue:**
- [x] `apps/web/src/admin-v2/cadastros/customers/types.ts` — `Customer`, `CustomerInput`.
- [x] `apps/web/src/admin-v2/shared/api.ts` — `fetchCustomers`/`createCustomer`/`updateCustomer` (sem `deleteCustomer` — não existe no backend).
- [x] `apps/web/src/admin-v2/cadastros/customers/components/CustomerFormModal.tsx` — criar/editar, mesmos campos do legado.
- [x] `apps/web/src/admin-v2/cadastros/customers/CustomersListView.tsx` — tabela + busca multi-campo + filtro de UF (populado dinamicamente dos dados reais, não hardcoded); **sem coluna/botão de excluir** (capacidade que o backend não tem).
- [x] `AdminV2Root.tsx` — rota `cadastros/clientes`; entrada em `CADASTROS_SUBROUTE_LABELS`.
- [x] `CadastrosHubView.tsx` — card único "Pessoas (Clientes/Profissionais/Usuários)" **desmembrado em 3 cards**: "Clientes" (`native: true`), "Profissionais" e "Usuários" (ainda apontando pro legado, mesma URL `/admin#usuarios` — destino real, só não deep-linkado pra sub-aba específica).

**Bug real achado na validação visual (`ERR-0054`, não no E2E)**: breadcrumb e sidebar quebrados ao abrir a tela nova — `isCustomersArea` (mundo de nível superior "Clientes", analytics do `PLAN-0022`/`PLAN-0023`) usava `.includes("/clientes")`, que também casava a nova rota `/admin-v2/cadastros/clientes` (mesma substring). Corrigido ancorando a checagem ao início do path (`/^\/admin-v2\/clientes(\/|$)/`) — só casa o mundo de nível superior de verdade. Nota de processo registrada: checar colisão de slug com mundos existentes antes de nomear uma sub-rota nova.

**Validações executadas (todas reais):** `tsc -b` (web) limpo; `eslint` nos arquivos tocados limpo; `npm run build` (web) PASS (2x — 1ª pro código, 2ª pro fix do breadcrumb); **CSS regenerado proativamente** (`grid-cols-[1fr_80px_1fr]`, `min-w-[900px]` ausentes, corrigidos antes do rebuild); `docker compose build web` + redeploy `--force-recreate` (2x). **E2E real contra Postgres**: baseline 0 clientes (ambiente limpo); criado + atualizado via `curl`, confirmado; **cleanup via SQL direto** (mesma situação da Onda 11 — sem `DELETE` na API, aceitável só por ser dado de teste próprio). **Validação visual real** (Playwright, 10 checks, todos PASS — rodado 2x, 1ª rodada achou o `ERR-0054`): hub mostra os 3 cards separados (Clientes nativo, Profissionais/Usuários legado); criar cliente via UI, **persistência confirmada com reload**; editar sem erro; busca filtra corretamente; confirmado que **nenhum botão de excluir é renderizado** (capacidade real do backend, não fabricada); breadcrumb correto na 2ª rodada.

---

## Onda 13 — Profissionais ✅ CONCLUÍDA 2026-08-16 (segunda do desmembramento de "Pessoas")

**Pergunta que a tela fecha:** *quais profissionais existem, com que unidade/status/comissão/perfil de trabalho, e como editar um e gerenciar os catálogos de perfis de trabalho/comissão?*

**RAG feito:** `schedule.ts` tem `GET /professionals` (list, `include` completo: unit, user, workProfile, commissionProfile, `_count.shifts`/`_count.professionalServices`), `PATCH /professionals/:id` e `PATCH /professionals/:id/link-user` — **sem `POST /professionals`**. Confirmado varrendo `schedule.ts`, `users.ts` e `admin.ts` inteiros por `.professional.create(`: só existe em `prisma/seed.ts` e `scripts/seedAdminV2TestData.ts`, nunca numa rota HTTP — criar um usuário com `role: "PROFESSIONAL"` via `POST /users` **não** cria a linha `Professional` correspondente (nenhum hook/trigger faz isso). Achado confirmado também no legado: `admin-people` (aba Profissionais) só tem edição, nunca um botão "novo profissional" — mesma limitação real, não um gap introduzido agora. Também confirmado que `/professional-shifts` e `/professionals/:id/services` são consumidos por `admin-schedule` (Agenda), não por `admin-people` — a tela nativa preserva esse desmembramento por domínio, mostrando só as contagens (`_count`) como o legado já fazia (o único botão do legado pra essas duas coisas é "Ver agenda", que sai da tela).

**Backend:** nenhuma mudança — reusa `/api/professionals` + `/api/professional-work-profiles` + `/api/professional-commission-profiles` sem alteração.

**Frontend entregue:**
- [x] `apps/web/src/admin-v2/cadastros/professionals/types.ts` — `Professional`, `ProfessionalUpdateInput`, `ProfessionalWorkProfile(Input)`, `ProfessionalCommissionProfile(Input)`, `WORK_PROFILE_PERMISSION_GROUPS` (14 permissões em 3 grupos, mesmos rótulos/agrupamento do legado).
- [x] `apps/web/src/admin-v2/shared/api.ts` — `fetchProfessionals`/`updateProfessional`/`linkProfessionalUser` + CRUD completo de perfis de trabalho e de comissão. **Sem `createProfessional`** (não fabricado).
- [x] `apps/web/src/admin-v2/cadastros/professionals/components/WorkProfileManagerModal.tsx` (novo) — form inline (título/status/14 checkboxes agrupados) + lista + exclusão direta (backend decide "em uso" via 409, mesmo padrão do `CategoryStatusManagerModal`, Ondas 8/11).
- [x] `apps/web/src/admin-v2/cadastros/professionals/components/CommissionProfileManagerModal.tsx` (novo) — mesmo padrão, campos nome/comissão%/status.
- [x] `apps/web/src/admin-v2/cadastros/professionals/components/ProfessionalFormModal.tsx` (novo) — sempre edição (nunca criação): nome, unidade, status de vínculo, datas início/fim, perfil de trabalho (com atalho "Gerenciar perfis"), comissão %, ID de usuário vinculado (chama `link-user` só se o valor mudou, mesma lógica condicional do legado). `commissionProfileId`/`specialties` não entram no form — o legado também nunca os expõe, replicado por paridade.
- [x] `apps/web/src/admin-v2/cadastros/professionals/ProfessionalsListView.tsx` — tabela com as mesmas 11 colunas do legado (código/nome, usuário, status, início, fim, unidade, comissão, turnos, serviços, ações) + busca + filtro de unidade/status; botões de toolbar "Perfis de trabalho"/"Perfis de comissão" (mesma posição do legado, fora do modal de edição).
- [x] `AdminV2Root.tsx` — rota `cadastros/profissionais`; entrada em `CADASTROS_SUBROUTE_LABELS`. Sem risco de colisão de slug tipo `ERR-0054` — não existe nenhum mundo de nível superior "Profissionais".
- [x] `CadastrosHubView.tsx` — card "Profissionais" vira `native: true` (desmembramento de "Pessoas" fica 2/3 nativo — só falta Usuários, Onda 14).

**Nota de processo (achado não-bug)**: o comando de regeneração do `tailwind.generated.css` (documentado no próprio cabeçalho do arquivo desde a Onda 6) sobrescreve o arquivo inteiro **incluindo o comentário de cabeçalho** — não é aditivo ao comentário, só ao CSS. Cada onda que regenera precisa reescrever esse bloco manualmente ou a proveniência documentada se perde silenciosamente. Corrigido nesta onda (cabeçalho restaurado com a nota); adicionada a própria observação ao cabeçalho pra não se perder de novo.

**Bug real achado na validação visual (não no E2E via curl)**: `formatDateOnly` (coluna Início/Fim da tabela) usava `toLocaleDateString("pt-BR")` sem fixar fuso — `startedAt`/`endedAt` são armazenados como meia-noite UTC (`parseIsoDateStart`), e convertida pro fuso local do container antes de formatar, o dia exibido virava o anterior (ex.: `2026-08-13T00:00:00.000Z` mostrava "12/08/2026"). Corrigido fixando `timeZone: "UTC"` no `toLocaleDateString`. `toDateInputValue` (modal de edição) já usava `toISOString()`, que é sempre UTC — não tinha o bug, só a exibição na tabela.

**Validações executadas (todas reais):** `tsc -b` (web) limpo (2x — antes e depois do fix de data); `eslint` nos arquivos tocados — só o padrão `react-hooks/set-state-in-effect` (fetch-on-mount) já tolerado em toda tela do Admin V2, 1 ocorrência nova (total sobe de 20 pra 21, mesmo tipo, nenhum erro novo de outra categoria); `npm run build` (web) PASS (3x); `npm run test` (api) 134/134 PASS (sem mudança de backend, sem regressão); **CSS regenerado proativamente** (`min-w-[1080px]`, `grid-cols-[1fr_100px_100px]`, `grid-cols-[1fr_140px]` confirmados ausentes e corrigidos antes do rebuild Docker, lição das Ondas 6/7/11/12); `docker compose build web` + redeploy `--force-recreate` (2x — 1ª pro código, 2ª pro fix da data).

**E2E real contra Postgres (dados reais de produção, não massa de teste — cuidado redobrado, mesmo padrão das Ondas 5/11)**: baseline de 9 profissionais, 0 perfis de trabalho, 3 perfis de comissão capturado antes de qualquer mutação. `PATCH /professionals/9` (`commissionPercent`) confirmado e revertido; `PATCH .../link-user` testado como no-op (mesmo `userId`) confirmado `200`; ciclo completo de `professional-work-profiles` (criar, atualizar, atribuir a um profissional real, `DELETE` bloqueado com `409` enquanto em uso — regra do backend confirmada — desatribuir, `DELETE` `204`); ciclo completo de `professional-commission-profiles` (criar, atualizar, `DELETE` `204`); banco confirmado de volta ao estado original em todos os 3 recursos ao final (`startedAt` do profissional 9 perdeu a precisão de horário — de `T12:39:28.918Z` pra `T00:00:00.000Z` — por ser editado via `<input type="date">`, mesma limitação de precisão que o form legado tem, não uma regressão).

**Validação visual real** (Chrome real via `claude-in-chrome`, login MASTER, 13 checks, todos PASS — 1ª rodada achou o bug de fuso horário, corrigida e revalidada): hub de Cadastros mostra "Profissionais" com "Abrir →" (7/8 cards nativos, só falta Usuários); navegação real hub → lista; breadcrumb `Panorama > Cadastros > PROFISSIONAIS`; tabela com as 9 linhas reais e as 11 colunas corretas; busca por "recife" filtra pra 2/9; filtro de unidade "Recife" filtra corretamente; modal de edição abre pré-preenchido com os dados reais; salvar comissão reflete na tabela e **persiste após reload** (com as datas agora corretas nas 9 linhas); "Perfis de trabalho" abre com as 14 permissões em 3 grupos com os rótulos certos, criar+editar+excluir um perfil de teste funciona ponta a ponta (incluindo o `409` de "em uso" reproduzido de verdade ao tentar excluir um perfil atribuído via UI); "Perfis de comissão" mostra os 3 perfis reais (Cabeleireira/Esteticista/Manicure), criar+excluir um perfil de teste funciona e o `onChanged` recarrega a lista de profissionais corretamente (comissão de Camila voltou a refletir o fallback do perfil, 25%, confirmando que o revert por API já tinha surtido efeito).

---

## Onda 14 — roadmap resumido, a detalhar quando chegar a vez

Mesmo padrão de todo o programa: RAG completo (schema, payload exato, campos reais do form legado) só quando é a vez da onda. Fecha o desmembramento de "Pessoas" e o plano inteiro — sensível (gestão de role/permissão via `users.ts`), revisar escopo por papel com atenção redobrada.

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
