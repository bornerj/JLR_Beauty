# PLAN-0028 — Religar conteúdo público (cards de Planos + flip-cards de Serviços) ao cadastro nativo

**Status:** 🟢 EXECUTADO 2026-08-17 — usuário aprovou os dois casos na mesma mensagem: "PLAN-0028 a - ok, pode executar. b mantenha os 9 cards e troque um dos duplicados por outro serviço real pode começar tudo". Decisão da Pergunta 2 (Caso B): opção (c) — manteve os 9 cards, card 7 ("Facial Spa", antes duplicado com o card 2) trocado pro serviço real `Drenagem Linfática Facial` (id 34). Pergunta 1 (campos novos): aprovada implicitamente pelo "pode executar"/"pode começar tudo" — sem objeção aos 4 campos (+1 técnico, `highlightOrder`, ver nota abaixo).
**Origem:** desmembrado do `PLAN-0027` (Itens 10 e 11) por instrução explícita do usuário em 2026-08-17: "encerre esse plano e abra um plano novo apenas para esses dois casos". Diretriz do usuário, vale para os dois casos: **manter o que existe hoje como está** (visual e comportamento) — só corrigir a fonte do dado. Imagem e textos passam a vir do cadastro nativo (`Service`/`Membership`), não mais da Galeria de Mídias / Textos das Páginas.
**Agentes de apoio:** `@debugger` (RAG desta sessão), `@frontend-specialist`, `@backend-specialist` (Caso B, campo novo).
**Regra de execução (quando autorizada):** um caso por vez; validar (tsc/build/test); registrar bug/decisão em `memory/logs/DEBUG-HISTORY.md`/`memory/decisions/` conforme o caso; commit só com aprovação explícita, push só com uma segunda aprovação separada.

---

## Caso A — Cards de Planos (Assinaturas/Home)

### Correção importante (RAG desta sessão corrigiu o que eu tinha dito no `PLAN-0027`)

No fechamento do `PLAN-0027` eu descrevi `HomeMembershipSection.tsx` como "100% estático, nem chega a consumir `/api/memberships`". **Isso estava errado** — investiguei a fundo pra abrir este plano e achei o contrário: `apps/web/src/modules/public-site/index.behavior.ts` já tem `loadMembershipsFromDb()`/`renderMembershipsFromDb()`, que roda no carregamento da página, busca `GET /api/public/memberships` de verdade e **substitui inteiramente** o HTML de `[data-membership-grid]` por conteúdo real (nome, título, preço, benefícios, badge "Mais Popular" via `isFeatured`). O JSX estático em `HomeMembershipSection.tsx` é só o placeholder do primeiro paint (evita layout vazio antes do JS rodar) — é sobrescrito assim que a API responde. Confirmado no código: `if (!membershipGrid || publicMemberships.length < 3) return;` — hoje existem exatamente 3 planos reais, então a condição sempre passa e o grid é sempre re-renderizado com dado real.

**O que realmente falta:** `renderMembershipsFromDb()` nunca teve nenhum `<img>` no template — a função nunca exibiu imagem nenhuma, nem da galeria nem do cadastro. Os 3 media slots que eu tinha apontado (`assinaturas_hero_card_img_01/02/03`) pertencem a `AssinaturasHeroSection.tsx`, que é **conteúdo editorial do banner hero da página `/assinaturas`** — 3 mini-cards com título/descrição de texto livre (pitch genérico, ex. tipo "sem fidelidade"), sem `data-membership-id` nem qualquer vínculo com um plano específico (Silver/Gold/Platinum). Não fazem parte deste religamento — são conteúdo hero independente e devem continuar exatamente como estão.

### Fix proposto (pequeno, aditivo — `Membership.imageUrl` já existe desde o `PLAN-0027` Item 11)

- `apps/web/src/modules/public-site/index.behavior.ts`:
  - `HomeMembershipRow` ganha `imageUrl?: string | null`.
  - `parsePublicMemberships()` passa a ler `row.imageUrl`.
  - `renderMembershipsFromDb()` renderiza um `<img>` no topo do card quando `plan.imageUrl` existir (mesmo espírito visual do `PlanCard.tsx` do Admin V2); sem imagem cadastrada, o card continua idêntico ao visual atual.
- **Nenhuma mudança de backend necessária** — `GET /api/public/memberships` já devolve `imageUrl` (herdado do Item 11 do `PLAN-0027`).

### Checklist técnico

- [ ] `imageUrl` em `HomeMembershipRow` + `parsePublicMemberships()`.
- [ ] `<img>` condicional em `renderMembershipsFromDb()` (proporção/raio consistente com o resto do card).
- [ ] `tsc -b` + `npm run build` (web) limpos.
- [ ] Validação visual real (Chrome): sem imagem cadastrada → visual idêntico ao de hoje; subir imagem em 1 plano via Admin V2 → aparece só nesse card, os outros 2 continuam sem imagem.

### Decisão pendente

Nenhuma — é aditivo, baixo risco, não muda nada visualmente até alguém subir uma imagem pelo cadastro. Só falta autorização de execução.

### Status: ✅ CONCLUÍDO 2026-08-17

Implementado exatamente como proposto — `HomeMembershipRow`/`parsePublicMemberships`/`renderMembershipsFromDb` em `apps/web/src/modules/public-site/index.behavior.ts` ganharam `imageUrl`, renderizado num `<div class="mb-4 h-36 ...">` só quando o plano tem imagem cadastrada. Nenhuma mudança de backend (endpoint já devolvia o campo desde o `PLAN-0027` Item 11). `tsc -b` + build web limpos.

---

## Caso B — Flip-cards de Serviços (Home)

### Achado confirmado

`HomeServicesSection.tsx` é o único lugar sem nenhuma hidratação dinâmica equivalente à do Caso A — não existe nenhuma função tipo `renderServicesFromDb()` em `index.behavior.ts` (`grep` por "flipcard"/"flip-card" não retornou nada). Os 9 cards são JSX fixo, cada um com `useMediaSlot` (imagem) + 4×`usePageText` (front_label/front_tagline/back_label/back_desc) + atributos `data-concierge-category`/`data-concierge-service` escritos como texto literal no código.

### Por que isso NÃO é um fix pequeno (achado novo desta investigação)

Fui ler os valores padrão reais dos 36 textos (`apps/api/src/modules/pageTexts/catalog.ts`) pra desenhar o mapeamento de campos antes de propor código, e achei um problema real: **front_label, front_tagline, back_label e back_desc são 4 textos genuinamente distintos entre si e diferentes do nome operacional do serviço** — não dá pra simplesmente reaproveitar `Service.name`/`Service.description` sem perder conteúdo. Exemplos reais (valores padrão hoje, `ContentEntry` está vazio pra essas chaves — ninguém customizou, todo mundo vê o default):

| Card | front_label | back_label | Serviço real correspondente (`Service.name`) |
|---|---|---|---|
| 1 | Arte Capilar | Arte Capilar | Hidratação Capilar |
| 4 | Terapia Capilar | Spa Capilar | Terapia Capilar |
| 5 | Lashes | Extensão de Cílios | Extensão De Cilios |
| 6 | Brows | Micropigmentação | Design de Sobrancelha |
| 8 | Nails | Manicure | Manicure + Pedicure |

`front_label`/`back_label` são rótulos de marketing estilizados (às vezes em inglês, tipo "Lashes"/"Nails"/"Brows"), diferentes do nome operacional do serviço no cadastro. `Service` (schema atual) só tem `name` + `description` — nenhum dos dois cobre "rótulo de marketing curto" nem "tagline separada". Pra manter o conteúdo **exatamente como está hoje** (a instrução foi clara), a única forma correta é o cadastro de Serviço ganhar campos dedicados ao card de destaque — não dá pra reaproveitar `name`/`description` sem trocar o texto que aparece no site.

### Achado adicional: 9 cards visuais, só 8 serviços reais distintos

Card 2 ("Pele Clínica") e card 7 ("Facial Spa") apontam pro mesmo serviço real, `Limpeza de Pele` (achado já documentado no `PLAN-0027` Item 10). Se cada card passa a ser "1 registro de `Service`", um único `Service` só pode ter 1 conjunto de front/back label — não dá pra ele aparecer 2x com textos diferentes na mesma grade. Isso trava a decisão de schema até você decidir o que fazer com esse card duplicado.

### Decisões de produto necessárias (bloqueiam o código — preciso da sua resposta antes de implementar)

**Pergunta 1 — campos novos em `Service`:** autorizo adicionar 4 campos opcionais (só relevantes quando `isFeatured = true`): `highlightLabel`, `highlightTagline`, `highlightBackLabel`, `highlightDescription` (migração aditiva, `String?`, sem default — mesmo padrão do `Membership.imageUrl` do Item 11)? Migro os 36 textos que já existem hoje como valor inicial desses campos nos 8 serviços já marcados Destaque — você só revisa/ajusta depois, não perde nada do texto atual.

**Pergunta 2 — 9 cards ou reorganizar o duplicado:**
- **(a) 8 cards** — 1 por serviço com Destaque, sem duplicar "Limpeza de Pele". Mais simples e mais correto (nunca mostra o mesmo serviço 2x), mas muda a contagem visual de 9 pra 8.
- **(b) Mantém 9 cards fixos**, com 1 deles ficando "sem serviço vinculado" (conteúdo manual, fora do cadastro). Mais fiel ao "manter como está" na contagem, mas quebra a regra de "tudo vem do cadastro" pra esse 1 card específico.
- **(c) Você re-associa um dos 2 cards duplicados a outro serviço real** (ex.: trocar o card 7/"Facial Spa" pra outro serviço de Estética Facial ainda não coberto, marcando-o como Destaque). Os 9 cards viram 9 serviços distintos de verdade — nenhuma exceção, nenhuma perda de contagem.

**Minha recomendação:** opção (c) — resolve a duplicidade na raiz e preserva os 9 cards com dado 100% real, sem caso especial. Mas é decisão de produto sua, não vou escolher por conta própria.

### Fix proposto (depois das 2 decisões acima)

1. Migração Prisma aditiva em `Service`: `highlightLabel`, `highlightTagline`, `highlightBackLabel`, `highlightDescription` (todos `String?`).
2. Backend (`apps/api/src/routes/catalog.ts`): 4 campos novos no schema Zod de create/update de Serviço (opcionais) + no endpoint já usado pelo Admin V2.
3. Novo endpoint público leve e aditivo: `GET /api/public/services/featured` — devolve `id, name, imageUrl, highlightLabel, highlightTagline, highlightBackLabel, highlightDescription, serviceCategory.name` só dos serviços com `isFeatured = true`; não mexe no `/public/services/catalog` já existente (usado pelo modal "Menu Completo").
4. `ServiceFormModal.tsx` (Admin V2) — 4 campos novos, visíveis só quando "Destaque" está marcado (evita poluir o form dos outros ~67 serviços sem Destaque).
5. `HomeServicesSection.tsx` — passa a buscar `/api/public/services/featured` e renderizar os cards via `.map()` (React puro), preservando classes/CSS/estrutura visual atuais 1:1. `data-open-concierge`/`data-concierge-category`/`data-concierge-service` passam a vir de dado real (`serviceCategory.name`/`service.name`), deixam de ser texto solto fixo no código.
6. Script de migração de dado único (mesmo espírito do backfill do Item 1 do `PLAN-0027`): copia os 36 valores de `ContentEntry` (`home.services.card_N_*`) + os 9 media slots pros novos campos/`imageUrl` dos serviços corretos — zero perda de conteúdo atual.
7. Decisão futura, não urgente: depois de confirmado que o fluxo novo funciona, as chaves antigas em Textos das Páginas/Galeria de Mídias pra esses 9 slots ficam órfãs (nenhuma tela mais usa) — decidir depois se removem do catálogo ou ficam inertes; registrar como nota, não travar este plano por causa disso.

### Checklist técnico completo

- [x] Usuário decide Pergunta 1 (campos novos) e Pergunta 2 — opção (c), card 7 trocado por `Drenagem Linfática Facial` (id 34)
- [x] Migração Prisma aditiva (`20260817190000_add_service_highlight_fields`) + `prisma generate`
- [x] Backend: schema Zod + rota admin (create/update Service) + endpoint público novo `GET /public/services/featured`
- [x] Frontend Admin V2: campos novos no `ServiceFormModal.tsx` (bloco condicional, só aparece com Destaque marcado)
- [x] Frontend público: `HomeServicesSection.tsx` data-driven, visual preservado 1:1 (mesmas classes/estrutura, com skeleton de loading nos 9 slots)
- [x] Script de migração de dado — `apps/api/scripts/seedServiceHighlights.ts` (`npm run seed:service-highlights`), idempotente
- [x] `tsc -b` + build (api + web) limpos
- [x] Rebuild Docker + validação E2E real (endpoint novo) — `GET /public/services/featured` retornando os 9 serviços corretos e ordenados; `PATCH /memberships/:id` com `imageUrl` round-trip
- [x] Validação visual real (Chrome) — 9 flip-cards com labels/imagens corretos preservando o layout; flip via hover + botão "Agendar" abrindo o concierge com o serviço certo pré-preenchido (unidade sendo a próxima pergunta, confirmando o pré-fill funcionou); card do plano Silver exibindo imagem quando cadastrada (teste feito e revertido)
- [x] Registrar achado/decisão em `DEBUG-HISTORY.md` (`ERR-0062`)
- [x] Limpar dados de teste ao final — não houve dado de teste avulso (só o seed definitivo dos 9 serviços já existentes); a imagem de teste no plano Silver (usada só pra validar a renderização) foi revertida para vazio ao final

### Achado técnico adicional durante a implementação (não estava no plano original)

Ao trocar `HomeServicesSection.tsx` de renderização síncrona (JSX fixo, dado já disponível no primeiro paint) pra assíncrona (fetch de `/public/services/featured`), os 9 botões "Agendar" (`[data-open-concierge]`) deixam de existir no DOM no momento em que `index.behavior.ts` roda seu `document.querySelectorAll` inicial — o binding de clique (`onAll(conciergeTriggers, "click", ...)`) era direto nos elementos, não delegado, então os botões renderizados depois do fetch nunca receberiam o listener. Corrigido convertendo pra delegação em `document` (`target.closest("[data-open-concierge]")`), mesmo padrão já usado no arquivo pra `[data-membership-join]`/`[data-checkout]` — resolve o problema pra sempre, independente de quando o botão entra no DOM. `openConciergeFromTrigger` refatorada pra receber o elemento do trigger como parâmetro em vez de ler `event.currentTarget`.

Também foi necessário adicionar um 5º campo técnico não previsto na proposta original — `Service.highlightOrder` (`Int?`) — pra controlar a posição de cada card na grade de 9 (sem ele, a ordem viraria arbitrária/alfabética e mudaria o arranjo visual atual, quebrando "manter como está"). Exposto no `ServiceFormModal.tsx` como campo numérico opcional dentro do bloco de Destaque.

---

## Git Record of Delivery

- Step 1 (Pre-commit review): ✅ feito — ver resumo abaixo.
- Step 2 (Commit authorization): pendente — aguardando aprovação explícita do usuário (mesmo commit pendente do `PLAN-0027`, ainda não commitado).
- Step 3 (Commit confirmation): pendente.
- Step 4 (Push authorization and result): pendente — segunda aprovação separada, só depois do commit.
- Push status: PENDING

### Pre-commit review (Step 1)

**Arquivos alterados/criados por este plano:**

Backend (`apps/api/`):
- `src/routes/catalog.ts` — schema Zod + handlers de Serviço com os 5 campos `highlight*`; endpoint novo `GET /public/services/featured`.
- `prisma/schema.prisma` — `Service.highlightLabel/highlightTagline/highlightBackLabel/highlightDescription/highlightOrder`.
- `prisma/migrations/20260817190000_add_service_highlight_fields/` (novo).
- `scripts/seedServiceHighlights.ts` (novo) — migração única de dado, idempotente.
- `package.json` — script `seed:service-highlights`.

Frontend (`apps/web/`):
- `src/modules/public-site/index.behavior.ts` — `imageUrl` no grid de Planos (Caso A); delegação do binding de `[data-open-concierge]` (achado técnico, necessário pro Caso B funcionar).
- `src/modules/public-site/sections/HomeServicesSection.tsx` — reescrito, data-driven via `/public/services/featured`.
- `src/admin-v2/cadastros/services/types.ts`, `.../components/ServiceFormModal.tsx` — campos `highlight*` no cadastro nativo.

Memória (`memory/`):
- `plans/PLAN-0028-RELIGAR-CONTEUDO-SERVICOS-PLANOS-CADASTRO-NATIVO.md` (novo, este arquivo).
- `logs/DEBUG-HISTORY.md` — `ERR-0062`.
- `MODIFICATION_LOG.md`, `progress.md` — registros de execução.

Dado (Postgres, fora do git, não versionado):
- 9 serviços com `highlightLabel/Tagline/BackLabel/Description/Order` + `imageUrl` preenchidos (`seedServiceHighlights.ts`), incluindo `Drenagem Linfática Facial` (id 34) recém-marcado `isFeatured`.

**Validações executadas:**
- `apps/api`: `prisma generate`, `tsc -b` limpo, `npm run build` limpo, `npm run test` 134/134 PASS.
- `apps/web`: `tsc -b` limpo, `npm run build` limpo.
- Rebuild Docker (`api`+`web`) + `up -d --force-recreate`; migração `20260817190000_add_service_highlight_fields` aplicada automaticamente no boot (confirmada nos logs do container).
- Seed rodado no Postgres real (`npx tsx` dentro do container, via `docker cp` — script fonte não vai pra imagem de produção, só `dist/`; documentado aqui pra não se perder o "como" na próxima vez que precisar rodar um script assim).
- E2E real: `GET /public/services/featured` (9 serviços, ordem e conteúdo corretos), `PATCH /memberships/1` com `imageUrl` (round-trip confirmado, depois revertido).
- Visual real via Chrome: grade de 9 flip-cards idêntica ao layout anterior; flip no hover funcionando; botão "Agendar" do card religado (Drenagem Linfática Facial) abrindo o painel do concierge; card do plano Silver exibindo imagem de teste corretamente (revertida ao final).
