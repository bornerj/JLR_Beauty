# PLAN-0026 — Admin V2: Cadastros e Sistema nativos (reescrita, não reskin)

**Status:** 🔄 EXECUTING_WITH_PLAN — Ondas 1-9 ✅ CONCLUÍDAS 2026-08-16 (tier P completo + Ondas 8/Serviços e 9/WhatsApp do tier M), todas validadas por E2E real + visual real. Ondas 10-14 aguardando execução. Autorização em pé (usuário, 2026-08-16): commit sem aprovação por onda, push adiado pro final.
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

## Ondas 10 a 14 — roadmap resumido, a detalhar quando chegar a vez

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
