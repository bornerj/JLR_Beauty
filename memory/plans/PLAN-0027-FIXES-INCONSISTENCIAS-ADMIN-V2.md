# PLAN-0027 — Fixes pontuais de inconsistências/bugs reportados pelo usuário

**Status:** 🟡 ENCERRADO PELO CONTEÚDO 2026-08-17 — usuário mandou encerrar este plano ("encerre esse plano e abra um plano novo apenas para esses dois casos"). Todos os itens (1-11) estão resolvidos, corrigidos ou explicitamente encaminhados: Itens 1-3, 5, 6, 7, 8, 9 concluídos; Item 4 concluído (decisão do usuário — chave de identidade corrigida); Itens 10 e 11 concluídos na parte de dado/cadastro (filtro Destaque, `isFeatured` reconciliado, `Membership.imageUrl`), e a parte de arquitetura pendente de cada um ("religar" a renderização pública pra consumir o cadastro nativo) foi **desmembrada para `PLAN-0028-RELIGAR-CONTEUDO-SERVICOS-PLANOS-CADASTRO-NATIVO.md`** — não fica solta aqui. Sem pendência de item neste plano.
**Nota sobre fechamento formal (`DONE`):** por regra do kernel (`.sfk/kernel/RULES.md` §10/§13), um plano só pode virar `-DONE-` com o Git Record de Delivery completo (commit + push com aprovação explícita, cada um separado). Esse plano está com o conteúdo 100% fechado e pronto para revisão pré-commit (ver seção "Git Record of Delivery" no fim do arquivo), mas **ainda não foi commitado nem pushado** — segue com o nome atual (sem `-DONE-`) até essa autorização acontecer, mesmo padrão já usado no `PLAN-0025`.
**Origem:** usuário começou a citar inconsistências/bugs percebidos em uso real do Admin V2; cada item é investigado (RAG + causa raiz) antes de entrar aqui. Este plano é o backlog único de todos os itens até a autorização de execução.
**Agentes de apoio:** `@debugger` (causa raiz, todos os itens), `@frontend-specialist` / `@backend-specialist` conforme o item.
**Regra de execução (quando autorizada):** um fix por vez quando fizer sentido isolar; validar (build/tsc/test conforme o caso); registrar cada bug real em `memory/logs/DEBUG-HISTORY.md` (ERR-XXXX) antes de fechar o item; commit só com aprovação explícita, push só com uma segunda aprovação separada.

---

## Item 1 — Cadastro > Clientes aparece vazio; Panorama > Clientes mostra 17

**Reportado:** "em Panorama/Cadastro/Clientes não aparece cliente nenhum. em Panorama/Clientes aparecem 17 ao todo."

**Causa raiz:** não é um bug de query/filtro/RBAC — são **duas fontes de dados estruturalmente diferentes**.
- `Cadastro > Clientes` (nativa, `PLAN-0026` Onda 12) lê a tabela `Customer` do Prisma via `GET /api/customers` (`apps/api/src/routes/schedule.ts:549-557`). Essa tabela está **genuinamente vazia** (`SELECT COUNT(*) FROM "Customer"` → `0`) porque nada no fluxo real de pedido/agendamento grava nela — ela só seria populada via `POST /customers` da própria tela nativa, que ninguém usou ainda.
- `Panorama > Clientes` (`PLAN-0022`, "Clientes como Fluxo de Relacionamento") **não lê `Customer`** — deriva os 17 clientes agregando `Order` + `Appointment` + `Subscription` por identidade (email > telefone > nome), em `apps/api/src/modules/intelligence/customers/service.ts:69-90` (comentário do próprio arquivo, linha 12: *"100% derivado"*).
- Confirmado no próprio `PLAN-0026` (linha 298): *"baseline 0 clientes (ambiente limpo)"* já era esperado no momento da entrega da tela nativa.

**Diferença/comparação:**

| Aspecto | Cadastro > Clientes (nativa) | Panorama > Clientes (fluxo) |
|---|---|---|
| Endpoint | `GET /api/customers` (`schedule.ts:549`) | `GET /api/admin-v2/customers` (`adminV2.ts:282`) |
| Fonte de dados | tabela `Customer` (Prisma) | `Order` + `Appointment` + `Subscription` derivados |
| RBAC | `requireAdmin` | `requireAdmin` |
| Filtro de unidade | nenhum (`Customer` não tem `unitId`) | `unitScope` opcional (`service.ts:72`) |
| Resultado hoje | 0 (tabela vazia) | 17 (identidades únicas em pedidos/agendamentos) |

**Decisão do usuário (2026-08-16):** Opção A — materializar `Customer` automaticamente. Ao criar um pedido ou agendamento, o sistema deve fazer `upsert` em `Customer` (chave de identidade: telefone; fallback email/nome, mesma lógica de agrupamento já usada em `apps/api/src/modules/intelligence/customers/service.ts:69-90`), pra tabela nativa passar a refletir a realidade operacional.

**Fix proposto (mudança estrutural — precisa de checklist técnico próprio antes de codar):**
1. `apps/api/src/routes/orders.ts` — no fluxo de criação de `Order`, após persistir o pedido, `upsert` em `Customer` usando `customerName`/`customerEmail`/`customerPhone` do próprio pedido.
2. Fluxo de criação de `Appointment` em `apps/api/src/routes/schedule.ts` — mesmo `upsert` em `Customer` usando os dados do cliente do agendamento (`clientName`/`clientPhone`, hoje ligado a `User`, não a `Customer` — checar se precisa de campo de vínculo novo ou só duplicação por telefone).
3. Confirmar se `Customer` precisa de um campo de origem/rastreio (ex.: `source: "order" | "appointment" | "manual"`) para não confundir com cadastro manual futuro — decisão técnica a validar no início da execução deste item (RAG antes de mexer no schema).
4. Rodar um backfill único (script/seed) para materializar os 17 clientes já existentes a partir do histórico de `Order`/`Appointment`/`Subscription`, senão a tela nativa continua mostrando 0 até o próximo pedido novo.
5. Validar que isso não quebra a tabela `Customer` como está hoje (sem `unitId`, sem soft-delete) nem os relacionamentos existentes (`Customer.user`).

**Status:** ✅ CONCLUÍDO 2026-08-17. Implementado sem mudança de schema (só campos já existentes de `Customer`): `apps/api/src/lib/customerSync.ts` (novo, `syncCustomerFromContact`, upsert por telefone normalizado, best-effort/try-catch). Ligado em 2 pontos únicos de escrita — `markOrderAsPaid` (`apps/api/src/lib/fulfillmentUtils.ts`, cobre Stripe webhook + venda manual balcão) e criação de `Appointment` (`apps/api/src/lib/appointmentAvailability.ts`, único ponto de `appointment.create` do repo). Backfill único (`apps/api/scripts/backfillCustomersFromContacts.ts`, `npm run backfill:customers`, idempotente).
**Validação real:** `tsc -b` + `npm run build` + `npm run test` (134/134) limpos; rebuild Docker (api+web); backfill rodado no Postgres real → 8 clientes materializados; venda manual (`POST /orders` com `markAsPaid`) e agendamento novo (`POST /appointments`) testados via curl real, ambos materializaram `Customer` na hora (best-effort confirmado funcionando); validação visual real (Chrome) mostrando os 8 clientes na tela nativa; dados de teste (pedido/agendamento avulsos criados só pra validar) limpos do banco ao final, mantendo os 8 clientes reais.
**Achado durante a validação (não pedido, documentado como Item 4 abaixo):** o backfill trouxe 8 clientes reais (por telefone), não 17 — o Panorama tem um bug próprio de contagem duplicada, registrado em `ERR-0058`. Ver `ERR-0056` (bug corrigido) no `DEBUG-HISTORY.md`.

---

## Item 2 — Sessão expira rápido demais (logout ao trocar de aba e voltar)

**Reportado:** "o tempo também para manter o usuário logado está muito baixo. Eu saio para digitar aqui e quando volto, só logando de novo."

**Causa raiz:** `apps/web/src/lib/auth.ts:92-100` (`getToken()`) decodifica o `exp` do JWT no cliente e, se expirado (skew de só 30s, linha 80), **chama `clearAuth()` e devolve `null` na hora — sem nunca tentar renovar via refresh token**. O access token dura `JWT_EXPIRES_IN=15m` (`.env:25`, usado em `apps/api/src/lib/auth.ts:12`). O backend já tem um fluxo de refresh completo e funcional (cookie httpOnly `jlr_rt`, 7 dias, `POST /api/auth/refresh` em `apps/api/src/routes/auth.ts:259-299`), mas **nenhum lugar do frontend chama esse endpoint** (confirmado: `grep -rn "auth/refresh" apps/web/src` sem resultado; `grep -rn "status === 401" apps/web/src` sem resultado — não existe interceptor de 401 nem renovação silenciosa).

Não é timer de inatividade nem handler de blur/visibilitychange — é puramente o relógio de 15 min do access token combinado com o refresh token nunca ser usado.

**Evidência:**
```ts
// apps/web/src/lib/auth.ts:92-100
export function getToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  if (isTokenExpired(token)) {
    clearAuth();
    return null;
  }
  return token;
}
```

**Fix mínimo proposto:** em `apps/web/src/lib/auth.ts`, antes do `clearAuth()` dentro de `getToken()`, tentar renovar via `POST ${API_URL}/api/auth/refresh` (`credentials: "include"`, usa o cookie `jlr_rt`); em caso de sucesso, `setToken(novoToken)` e seguir normalmente; só chamar `clearAuth()` se o refresh também falhar (401/erro). Como `getToken()` hoje é síncrona e usada em várias call sites, o fix real precisa introduzir um caminho assíncrono (`ensureFreshToken()` ou equivalente) — mantém o desenho de segurança já decidido no `PLAN-0017` (access token curto + refresh de 7 dias), só termina a integração que ficou incompleta.

**Status:** ✅ CONCLUÍDO 2026-08-17. Implementado sem mudar `getToken()` síncrono nem tocar nos 103 call sites que o usam (evita scope-drift): `refreshAccessToken()` + `initSessionKeepAlive()` novos em `apps/web/src/lib/auth.ts` (interval de 5min + `visibilitychange`, disparado via `AUTH_STATE_EVENT` já existente), chamado uma vez em `apps/web/src/main.tsx`. `apps/web/src/app/RequireAdmin.tsx` também passou a tentar refresh antes de decidir "sessão negada" (fecha o caso de reload após ausência longa).
**Validação real:** `tsc -b` limpo; rebuild Docker; `POST /api/auth/refresh` testado via curl real com cookie de sessão real (renovou o token); confirmado que a string `auth/refresh` está no bundle JS de produção servido pelo nginx. Ver `ERR-0057` no `DEBUG-HISTORY.md`.

---

## Item 3 — Cadastro > Cupons sem filtro de data (ativos vs. expirados)

**Reportado:** "tela admin-v2/cupons não tem os filtros de data que no admin antigo tem. um cupom tem data de início e data fim de validade e precisamos ver os ativos e os que já expiraram."

**Causa raiz (achado que corrige a premissa do report):** não é uma regressão do porte da Onda 4 — **o Admin antigo/legado de cupons (`apps/web/src/modules/admin-discount-coupons/components/AdminDiscountCouponsView.tsx`) também nunca teve filtro de data**. Confirmado lendo o arquivo inteiro e via grep (`filtro|filter` sem nenhuma ocorrência no módulo). A tela nativa (`apps/web/src/admin-v2/cadastros/coupons/CouponsListView.tsx`) é porte fiel do legado — como o legado nunca filtrava, o nativo também não filtra. O único "status" hoje é o campo `isActive` (booleano manual, setado no form), não uma comparação de datas contra `now()`.
Isso não muda a necessidade real que você descreveu — só significa que é uma **feature nova**, não a reintrodução de algo que existia.

**Modelo de dados:** `apps/api/prisma/schema.prisma:154-167`, `model DiscountCoupon` — `startsAt DateTime?` (linha 162), `endsAt DateTime?` (linha 163), `isActive Boolean @default(true)` (linha 164, manual). Sem enum/status calculado.

**Endpoint atual:** `apps/api/src/routes/admin.ts:491-496` — `GET /discount-coupons` sempre devolve todos os cupons, sem query params de filtro. Usado sem alteração por ambas as telas.

**Fix proposto (client-side, sem mudança de backend — volume de cupons não justifica filtro server-side):**
- `apps/web/src/admin-v2/cadastros/coupons/CouponsListView.tsx` — adicionar estado de filtro perto da declaração de `state` (linha ~35), com lógica derivada comparando `startsAt`/`endsAt` com `new Date()`: **Ativo agora** (`isActive` && dentro do intervalo), **Expirado** (`endsAt < now`), **Agendado** (`startsAt > now`), **Todos**. Renderizar um segmented control/dropdown acima da tabela (perto da linha ~126-141) e aplicar o filtro antes do `.map()` (linha ~163).

**Status:** ✅ CONCLUÍDO 2026-08-17. Filtro client-side implementado com os rótulos **Vigentes agora / Agendados / Expirados / Todas as vigências**, contador "N de M cupom(ns)" e badge de vigência (tokens `state-healthy`/`state-info`/`state-critical`, já existentes — `DECISION-013` regra #4) ao lado da coluna Validade.
**Validação real:** `tsc -b` limpo; rebuild Docker; 3 cupons de teste criados via API (vigente/expirado/agendado), validação visual real (Chrome) confirmando badges corretos e filtro "Expirados" reduzindo a lista de 3 para 1 corretamente; cupons de teste removidos ao final.

---

## Item 4 — Panorama > Clientes conta o mesmo cliente físico 2x (achado durante o Item 1, não pedido pelo usuário)

**Como apareceu:** ao rodar o backfill do Item 1, o total materializado (por telefone, chave real de `Customer`) foi **8**, não 17. Investigado antes de assumir que era erro no backfill.

**Causa raiz:** `identityKey` (`apps/api/src/modules/intelligence/customers/service.ts:15-16`) prioriza `email > telefone > nome`. Pedidos sempre têm e-mail (agrupam por e-mail); agendamentos não têm e-mail direto e `Appointment.clientId` está `NULL` em todos os registros atuais (confirmado via SQL), então agrupam pelo fallback (telefone). Resultado: o mesmo cliente físico gera 2 entradas na Map do Panorama — uma via pedido (chave = e-mail), outra via agendamento (chave = telefone) — porque as duas fontes nunca convergem pra mesma chave quando o agendamento não tem usuário vinculado. 8 clientes reais × ~2 + 1 assinatura inadimplente = 17 (bate exatamente).

**Fix hipotético (não implementado):** trocar a prioridade da chave em `identityKey` para `telefone > email > nome` — telefone é a chave mais estável entre pedido e agendamento. Isso muda a contagem/segmentação (NOVO/ATIVO/RECORRENTE/EM_RISCO/INATIVO) do Panorama em produção, então é decisão de produto, não só técnica.

**Status:** ✅ CONCLUÍDO 2026-08-17 — usuário decidiu ("clientes duplicados, junte num único"). `identityKey` (`apps/api/src/modules/intelligence/customers/service.ts`) trocada de `email > telefone > nome` para **`telefone > email > nome`** (telefone normalizado só-dígitos, mesma normalização já usada em `customerSync.ts`/Item 1). `ERR-0058`.
**Validação real:** `tsc -b` + `npm run test` (134/134) limpos; rebuild Docker (`api`) + `up -d --force-recreate`; E2E real via `GET /api/admin-v2/customers` (17 → 9: 8 clientes reais únicos + 1 assinatura inadimplente sem pedido/agendamento correspondente); validação visual real (Chrome, NOVOS 8 + EM RISCO 1 = 9).
**Nota de escopo:** `unit-health/service.ts` e `dashboardSalesInsights.ts` implementam a mesma convenção `email > telefone > nome` de forma independente (não é um import compartilhado) e **não foram alterados** — o mesmo risco de duplicação pode existir nesses dois lugares, mas está fora do que foi pedido agora.

---

## Item 5 — Cadastro > Clientes: grid mostra o ID (`CLI-{id}`), mas o form de edição não mostra em lugar nenhum

**Reportado:** "a grid apresenta os clientes com um ID especifico para cada um, mas quando editamos, o ID não aparece, deveria ser o primeiro campo, antes do nome."

**Causa raiz:** `CustomersListView.tsx:187` renderiza `CLI-{customer.id}` na grid, mas `CustomerFormModal.tsx` (form de criar/editar) nunca recebia o ID em nenhum campo — só os campos editáveis (`name`, `phone`, etc.). Não é um bug de dado ausente (o `id` sempre existe em `editing.id`), é uma omissão de UI: o campo nunca foi desenhado no form.

**Fix:** `CustomerFormModal.tsx` — novo campo "ID" somente-leitura (`disabled`, `readOnly`) como primeiro campo do form, antes de Nome, em grid `[110px_1fr]`. Mostra `CLI-{id}` quando editando; "gerado ao salvar" quando criando (não existe ID antes do POST).

**Status:** ✅ CONCLUÍDO 2026-08-17. `ERR-0059`.

---

## Item 6 — Panorama > Clientes: não fica claro que nem todo cliente listado tem cadastro formal

**Reportado:** "precisa ficar claro que, em panorama clientes aparecem clientes que fizeram compras mas que nem todos foram cadastrados, mas soa clientes."

**Causa raiz:** não é um bug novo — é a mesma causa raiz já documentada no Item 1/`ERR-0056`: `CustomersFlowView.tsx` (Panorama) deriva a lista de `Order`+`Appointment`+`Subscription`, não da tabela `Customer` (Cadastro). A tela nunca comunicava isso ao usuário — o subtítulo só dizia "quem está entrando, ficando ou indo embora · últimos N dias", sem indicar a origem dos dados.

**Fix:** `CustomersFlowView.tsx` — linha explicativa adicionada abaixo do subtítulo: "Inclui todo mundo que comprou ou agendou, mesmo quem nunca foi cadastrado formalmente em Cadastro > Clientes — os dois números não precisam bater." Comentário de cabeçalho do arquivo também atualizado com a referência cruzada pro Item 1/Item 4.

**Status:** ✅ CONCLUÍDO 2026-08-17. Não é `ERR` novo (mesma causa raiz do `ERR-0056`) — só UI de esclarecimento, sem mudança de dado/lógica.

---

## Item 7 — Cadastro > Clientes (edição): posição de E-mail vs. ID de usuário, e o que "ID de usuário" realmente é

**Reportado:** "o campo email deve ser trocado de posição com ID de usuario, pois email é um campo grande. ID de usuario não é e acredito que já deve vir preenchido com o ID dado na gravação do banco, a não ser que seja outra coisa."

**Causa raiz/esclarecimento (corrige a premissa do report):** "ID de usuário" **não é** o ID do próprio cliente nem é preenchido automaticamente na gravação. É um campo totalmente diferente: um vínculo *opcional* com uma conta de login (`User`, tabela separada) — permite ligar um cliente cadastrado a uma conta que ele usa pra logar no site (`Customer.userId → User.id`). A maioria dos clientes não tem conta de login, então o campo fica vazio na maior parte das vezes — isso é esperado, não um bug. O ID do próprio cliente (o que a grid mostra como `CLI-{id}`) é o campo novo do Item 5, um campo diferente e somente-leitura.

**Fix:** `CustomerFormModal.tsx` — "ID de usuário" (renomeado de "ID de usuário vinculado (opcional)" para só "ID de usuário", com `title` explicando o vínculo) trocou de lugar com E-mail: agora fica ao lado de E-mail numa grid `[140px_1fr]` (campo pequeno + campo grande, como pedido), e o antigo bloco de linha inteira foi removido.

**Status:** ✅ CONCLUÍDO 2026-08-17 (mesmo commit do Item 5, `CustomerFormModal.tsx`). `ERR-0059`.

---

## Item 8 — Cupons de desconto: 2 registros de teste (3% e 10% para novos clientes)

**Pedido:** "Cupons de descontos preciso que grave pelo dois registros de teste, um dando 3% de desconto e outro 10% para novos clientes."

**Achado relevante:** `DiscountCoupon` (`schema.prisma:154-167`) não tem nenhum campo de segmentação de público (ex.: "só novos clientes") — só `percentOff`/`amountOff`/`minSubtotal`/`startsAt`/`endsAt`/`isActive`. Não existe hoje enforcement automático de "só para novos clientes" no backend; o cupom "para novos clientes" é, tecnicamente, um cupom comum — a segmentação por enquanto só existe no nome/código, não é validada em runtime (`POST` de pedido com cupom não checa se o cliente é novo). Registrado aqui para não passar a falsa impressão de que o filtro existe.

**Fix (dado de teste, via API real):** 2 cupons criados via `POST /api/discount-coupons` (mesma API que o CRUD nativo usa):
- `id 7` — código `TESTE3`, nome "Teste 3% (validação PLAN-0027)", `percentOff: 3`, ativo.
- `id 8` — código `NOVOCLIENTE10`, nome "Teste 10% Novos Clientes (validação PLAN-0027)", `percentOff: 10`, ativo.

**Status:** ✅ CONCLUÍDO 2026-08-17. Não é bug (`##bug` não se aplica) — dado de teste solicitado diretamente. Observação registrada, não bloqueia o fechamento deste item: "novos clientes" ainda não é uma regra de negócio real (sem campo/validação no backend) — se isso virar necessidade real no futuro, entra como item novo.

---

## Item 9 — Cadastro > Serviços: mesma omissão do Item 5, ID não aparece no form de edição

**Reportado:** "Serviços, ao clicar em editar, na tela de edição não aparece o ID que aparece no CRUD."

**Causa raiz:** idêntica ao Item 5 — `ServicesListView.tsx:245` mostra `SRV-{service.id}` na grid, `ServiceFormModal.tsx` nunca tinha campo de ID.

**Fix:** `ServiceFormModal.tsx` — mesmo padrão do Item 5: campo "ID" somente-leitura, primeiro campo do form, `SRV-{id}` (ou "gerado ao salvar" na criação).

**Status:** ✅ CONCLUÍDO 2026-08-17. `ERR-0059` (mesmo erro do Item 5 — causa raiz idêntica em 2 telas, um único registro de bug).

---

## Item 10 — Cadastro > Serviços: filtro por Destaque + reconciliação com os 9 flip-cards da Home

**Reportado:** "preciso filtrar pelo campo Destaque, para saber que serviços aparecem no flipcard da tela SPA inicial. inclusive é outro problema, pois nenhum serviço no crud está com essa marcação e lá temos 9 serviços nos flip cards (...) quero que abra uma linha de planejamento especifica para controlar isso (...) veja que serviços temos lá e marque na base (...) verifique se tudo que tem no flip card tem na base de serviço, pois lá tem imagem em alta definição, texto no front do flip e texto no back do flip e não me lembro onde isso foi guardado."

**Causa raiz (2 achados distintos):**

1. **Filtro ausente:** `Service.isFeatured` já existe no schema e já tinha um checkbox "Destaque (flip-cards)" no form (desde o `PLAN-0026`) — mas a listagem (`ServicesListView.tsx`) só tinha filtro de categoria/status, nunca de Destaque. Confirmado via SQL: `count(*) FILTER (WHERE "isFeatured") = 0` em 75 serviços — a marcação de fato nunca foi usada, exatamente como você percebeu.

2. **Onde o conteúdo dos flip-cards está guardado (resposta ao "não me lembro onde isso foi guardado"):** os 9 flip-cards (`HomeServicesSection.tsx`) são **conteúdo 100% estático**, e usam os 2 sistemas de "conteúdo endereçável" do projeto (`DECISION-014`), não a tabela `Service`:
   - **Imagem em alta definição** → 9 media slots (`home_services_card_img_01` a `_09`), editáveis em `Cadastro > Galeria de Mídias`.
   - **Texto do front e do back do flip** → 4 page texts por card × 9 cards = 36 textos (`home.services.card_N_front_label/front_tagline/back_label/back_desc`), editáveis em `Cadastro > Textos das Páginas`.
   - O botão "Agendar" de cada card usa `data-concierge-category`/`data-concierge-service` **hardcoded como texto literal** no JSX (ex.: `"Estetica Facial"` / `"Limpeza de Pele"`) — não referencia `Service.id` nem `ServiceCategory.id`.
   - `Service.imageUrl`/`Service.description` (os campos que o CRUD nativo edita) **não são a mesma coisa** que a imagem/texto do flip-card — são registros paralelos e desconectados. Nenhum dos 75 serviços tem `imageUrl` preenchido hoje (`has_image = false` em todos, confirmado via SQL).
   - **Conclusão prática:** marcar `isFeatured = true` num serviço **não muda o site público** — é só um registro administrativo de "este serviço real corresponde a um dos 9 cards". Religar os flip-cards pra ler de `Service` em runtime seria uma reescrita de arquitetura da seção (mesma classe de mudança do Item 11/Planos), não um fix pontual — não fiz isso sem decisão sua (ver abaixo).

**Reconciliação feita (o que você pediu: "veja que serviços temos lá e marque na base"):** cruzei os 9 `data-concierge-service` dos flip-cards com a tabela `Service` por nome. 8 dos 9 cards mapeiam pra 8 serviços reais e distintos (o card 2 "Pele Clínica" e o card 7 "Facial Spa" apontam pro **mesmo** `data-concierge-service="Limpeza de Pele"` — achado à parte, não é bug, é conteúdo de marketing reaproveitando o mesmo serviço com nomes de exibição diferentes):

| Card | Label | `data-concierge-service` | `Service.id` marcado |
|---|---|---|---|
| 1 | Arte Capilar | Hidratação Capilar | 45 |
| 2 | Pele Clínica | Limpeza de Pele | 48 |
| 3 | Terapia de Bem-Estar | Massagem Relaxante | 58 |
| 4 | Terapia Capilar | Terapia Capilar | 73 |
| 5 | Lashes | Extensão De Cílios | 42 |
| 6 | Brows | Design de Sobrancelha | 30 |
| 7 | Facial Spa | Limpeza de Pele | 48 (mesmo do card 2) |
| 8 | Nails | Manicure + Pedicure | 52 |
| 9 | Smooth | Depilação Axilas | 16 |

**Fix aplicado:**
1. `ServicesListView.tsx` — filtro "Destaque: todos/sim/não" adicionado na barra de filtros (mesmo padrão de categoria/status).
2. `UPDATE "Service" SET "isFeatured" = true WHERE id IN (16,30,42,45,48,52,58,73)` rodado no Postgres real — 8 linhas afetadas, confirmado via SELECT pós-update.

**Decisão do usuário (2026-08-17):** religar os flip-cards pra consumir o cadastro nativo (`Service`) em vez de media slots/page texts estáticos — mantendo o visual/comportamento atual como está, só corrigindo a fonte de dado. Virou item estrutural próprio, desmembrado para `PLAN-0028-RELIGAR-CONTEUDO-SERVICOS-PLANOS-CADASTRO-NATIVO.md` (checklist técnico + aprovação antes de codar, mesmo rito do Item 1).

**Status:** ✅ CONCLUÍDO (filtro + reconciliação de dados) 2026-08-17; religação da renderização pública **desmembrada para `PLAN-0028`**. `ERR-0060`.

---

## Item 11 — Cadastro > Planos: sem campo de imagem por plano (imagem hoje é fixa/posicional, vinda da galeria)

**Reportado:** "quando editamos [um plano], não há lugar para a imagem de cada plano, acho que está fixo na pagina, pegando da galeria, mas deveria estar fixo aqui no cadastro do plano. avalie a mudança e gere entrada especifica."

**Causa raiz (confirma a suspeita):** `Membership` (`schema.prisma:324-337`, antes deste item) não tinha nenhum campo de imagem — `PlanFormModal.tsx` também não tinha. A seção pública que mostra os planos (`AssinaturasHeroSection.tsx`) usa 3 media slots genéricos e **posicionais** (`assinaturas_hero_card_img_01/02/03`), sem nenhum vínculo com `Membership.id`/`name` — é o mesmo padrão do Item 10 (conteúdo endereçável desacoplado da entidade real). A seção da Home (`HomeMembershipSection.tsx`) é ainda mais hardcoded: nomes/preços/benefícios dos 3 planos (Silver/Gold/Platinum) são texto estático no JSX, nem chega a consumir `/api/memberships`.

**Fix aplicado (aditivo, sem quebrar nada existente — `DECISION-014` regra #2):**
1. Migração `20260817180000_add_membership_image` — `ALTER TABLE "Membership" ADD COLUMN "imageUrl" TEXT` (nullable, sem default, não afeta os planos existentes).
2. `apps/api/src/routes/subscriptions.ts` — `imageUrl` adicionado ao schema Zod de criar/editar e aos handlers `POST`/`PATCH /memberships`.
3. `apps/web/.../plans/types.ts` — `imageUrl` adicionado a `Membership`/`MembershipInput`.
4. `PlanFormModal.tsx` — campo "Imagem do plano" com upload real (mesmo padrão do `ServiceFormModal.tsx`: URL manual ou upload de arquivo, limite 5MB).
5. `PlanCard.tsx` — miniatura da imagem exibida no topo do card quando `imageUrl` existe.

**Decisão do usuário (2026-08-17):** religar a página pública pra ler `Membership.imageUrl` (e os demais dados reais do plano) em vez dos media slots genéricos — mantendo o visual atual, só corrigindo a fonte de dado. Desmembrado para `PLAN-0028-RELIGAR-CONTEUDO-SERVICOS-PLANOS-CADASTRO-NATIVO.md`, junto com o Item 10 (mesma classe de mudança).

**Status:** ✅ CONCLUÍDO (schema + backend + admin) 2026-08-17; religação da renderização pública **desmembrada para `PLAN-0028`**. `ERR-0061`.

---

## Próximos itens

Nenhum item pendente neste plano — encerrado por instrução do usuário em 2026-08-17. Os dois pontos de arquitetura que ficaram em aberto (religar flip-cards de Serviços e cards de Planos pra ler do cadastro nativo) foram desmembrados para `memory/plans/PLAN-0028-RELIGAR-CONTEUDO-SERVICOS-PLANOS-CADASTRO-NATIVO.md` — não tratar aqui, não reabrir este plano pra isso.

---

## Git Record of Delivery

- Step 1 (Pre-commit review): ✅ feito — ver resumo abaixo.
- Step 2 (Commit authorization): pendente — aguardando aprovação explícita do usuário.
- Step 3 (Commit confirmation): pendente.
- Step 4 (Push authorization and result): pendente — segunda aprovação separada, só depois do commit.
- Push status: PENDING

### Pre-commit review (Step 1)

**Arquivos alterados/criados por este plano** (Itens 1-11, incluindo a correção do Item 4 desta sessão):

Backend (`apps/api/`):
- `src/lib/customerSync.ts` (novo) — Item 1.
- `src/lib/fulfillmentUtils.ts`, `src/lib/appointmentAvailability.ts` — Item 1 (chamam `syncCustomerFromContact`).
- `scripts/backfillCustomersFromContacts.ts` (novo) — Item 1.
- `src/routes/subscriptions.ts` — Item 11 (`imageUrl` em Membership).
- `prisma/schema.prisma` — Item 11 (`Membership.imageUrl`).
- `prisma/migrations/20260817180000_add_membership_image/` (novo) — Item 11.
- `src/modules/intelligence/customers/service.ts`, `src/modules/intelligence/customers/types.ts` — Item 4 (`identityKey` telefone > email > nome).
- `package.json` — script `backfill:customers` (Item 1).

Frontend (`apps/web/`):
- `src/lib/auth.ts`, `src/main.tsx`, `src/app/RequireAdmin.tsx` — Item 2 (refresh/keep-alive de sessão).
- `src/admin-v2/cadastros/coupons/CouponsListView.tsx` — Item 3 (filtro de vigência).
- `src/admin-v2/cadastros/customers/components/CustomerFormModal.tsx` — Itens 5/7 (ID + reordenação).
- `src/admin-v2/customers/CustomersFlowView.tsx` — Item 6 (legenda) + Item 4 (sem mudança de código, só o dado mudou).
- `src/admin-v2/cadastros/services/components/ServiceFormModal.tsx` — Item 9 (ID).
- `src/admin-v2/cadastros/services/ServicesListView.tsx` — Item 10 (filtro Destaque).
- `src/admin-v2/cadastros/plans/types.ts`, `.../components/PlanFormModal.tsx`, `.../components/PlanCard.tsx` — Item 11 (campo de imagem).

Memória (`memory/`):
- `plans/PLAN-0027-FIXES-INCONSISTENCIAS-ADMIN-V2.md` (novo, este arquivo).
- `logs/DEBUG-HISTORY.md` — `ERR-0056` a `ERR-0061`.
- `MODIFICATION_LOG.md`, `progress.md` — registros de andamento e fechamento.

Dado (Postgres, fora do git, não versionado):
- Backfill de 8 clientes reais (Item 1).
- 8 serviços marcados `isFeatured = true` (Item 10).
- 2 cupons de teste criados (Item 8).

**Validações executadas (cobrindo toda a leva):**
- `apps/api`: `npx prisma generate` (após mudança de schema), `tsc -b` limpo, `npm run build` limpo, `npm run test` 134/134 PASS (rodado 3x ao longo da sessão, sempre verde).
- `apps/web`: `tsc -b` limpo, `npm run build` limpo.
- Rebuild Docker (`api`+`web`) + `up -d --force-recreate`, migração aplicada automaticamente no boot (confirmada via `_prisma_migrations`).
- E2E real via curl/API contra o Postgres real: venda manual, agendamento novo, refresh token, cupons, `isFeatured` count, `Membership.imageUrl` round-trip, `GET /api/admin-v2/customers` (17→9).
- Validação visual real via Chrome: clientes materializados, filtro de cupons, campo ID nos 2 forms, filtro Destaque, campo de imagem do plano, contagem 8+1=9 no Panorama.
- Dados de teste avulsos (pedidos/agendamentos criados só pra validar, 1 `Membership` de teste) removidos ao final; cupons de teste (Item 8, pedido explícito do usuário) e o backfill de clientes reais foram mantidos.
