# PLAN-0034 — Auditoria de Textos e Imagens Hardcoded (revalidação pós-Admin V2)

Status: DONE — fechado formalmente em 2026-08-24
Data de abertura: 2026-08-20
Data de fechamento: 2026-08-24
Origem: pendência levantada pelo usuário após o fechamento do `PLAN-0033` — dúvida se o
princípio do `PLAN-0012` ("nenhum texto de marketing hardcoded — tudo via banco,
editável em Admin > Textos das Páginas") ainda vale depois da migração para o Admin V2.
Agentes/skills usados na elaboração: `@project-planner` (`plan-writing`, `brainstorming`),
`@code-archaeologist` (`clean-code`, `code-review-checklist`, princípio "Chesterton's Fence").

## 🎯 Objetivo Máximo (ver `DECISION-018`)

Este plano não é só limpeza de dívida técnica isolada. **JLR Beauty/JLR é marca de
uma cliente específica** — o objetivo de fundo é preparar a base para, no futuro,
vender a mesma plataforma para outros empreendimentos via uma rotina futura
`saas-initialize` (não construída agora, apenas o horizonte que orienta os critérios
aqui). Por isso este plano cobre **texto e imagem juntos** (ambos vêm do banco, mesmo
padrão: `public.pageTexts` e `public.mediaSlots`) e sinaliza — sem necessariamente
corrigir agora — qualquer branding "JLR" preso fora do sistema de conteúdo editável
(meta tags, título de página, rodapé, nomes de rota/variável, e-mails).

---

## STAR

**Situation**
`PLAN-0012` (2026-06-11) estabeleceu o padrão: todo texto de marketing das páginas
públicas vive em `Setting.key = "public.pageTexts"`, catalogado em
`apps/api/src/modules/pageTexts/catalog.ts`, consumido via `usePageText()` +
`<RichText>`, e editável em Admin > Textos das Páginas. O catálogo cresceu de ~52
campos (PLAN-0012) para **333** (`PLAN-0015` Franquias Page Upgrade e sessões
seguintes). O Admin legado foi removido no `PLAN-0033`; o editor de Textos das
Páginas foi portado para `admin-v2/sistema/pageTexts/`, mas **nunca foi revalidado
ponta a ponta na nova casa**. Além disso, `DEBUG-HISTORY.md` já registra dois
episódios do exato problema que o usuário suspeita (`ERR-0060`: `HomeMembershipSection`
com nomes/preços hardcoded; `ERR-0062`: reconciliação parcial dos 9 flip-cards de
Serviços) e deixou explicitamente em aberto uma limpeza de chaves órfãs no catálogo —
a mesma pendência que motivou esta conversa.

**Task**
Auditar tela por tela (público + os dois editores no Admin V2 — Textos e Galeria de
Mídias) se o princípio "nenhum texto ou imagem de marketing hardcoded" continua
valendo, classificar cada achado, corrigir o que estiver fora do padrão, e sinalizar
(sem necessariamente corrigir agora) qualquer branding "JLR" preso fora do sistema de
conteúdo editável — tudo isso como passo de preparação para o objetivo máximo do
`DECISION-018` (portabilidade futura via `saas-initialize`). Não presumir que "não
usa `usePageText`/media slot" seja sempre um bug (pode ser dado real de
`Product`/`Membership`/`Service`, que é o padrão correto e diferente, ver `PLAN-0012`
seção "Out").

**Action**
Sete fases: (0) inventário automatizado já feito nesta conversa, formalizado aqui;
(1) auditoria manual tela por tela de texto; (1b) auditoria equivalente de imagens
(`mediaSlots`); (1c) checagem de consistência de nomenclatura Admin → Admin V2;
(2) cruzamento catálogo × uso real (chaves/slots órfãos, texto e imagem);
(3) correção dos achados classificados como violação real; (4) revalidação funcional
dos dois editores no Admin V2; (5) varredura leve de branding "JLR" fora do sistema
editável (só levantamento, correção fica de decisão à parte); (6) registro em memória.

**Result**
Catálogo de achados documentado (violação real / falso positivo / órfã) cobrindo
texto **e** imagem, zero conteúdo de marketing hardcoded sem cobertura em
`catalog.ts`/`mediaSlots`, chaves/slots órfãos identificados com decisão registrada,
editores de Textos e Galeria de Mídias validados no Admin V2, e um levantamento
(não correção) de onde mais "JLR" aparece hardcoded fora do sistema de conteúdo —
insumo direto para o futuro `saas-initialize`.

---

## Escopo

**In:**
- Todas as seções de `apps/web/src/modules/public-site/sections/*.tsx` (30 arquivos)
- Páginas públicas: Home, Franquias, Assinaturas, Checkout (`pages/*.tsx` +
  `components/pages/*Content.tsx`)
- `apps/api/src/modules/pageTexts/catalog.ts` (cruzamento de uso real)
- `apps/api/src/modules/mediaSlots/service.ts` e o catálogo de slots de imagem
  (cruzamento de uso real, mesmo tratamento dado a texto)
- `apps/web/src/admin-v2/sistema/pageTexts/` e `.../mediaGallery/` (revalidação
  funcional pós-porte, incluindo checagem de nome de tela/label vs. chave de catálogo
  original do Admin legado)
- Levantamento leve (grep, sem correção nesta fase) de "JLR"/"JLR Beauty" hardcoded
  fora de `pageTexts`/`mediaSlots`: `<title>`, meta tags, rodapé, `seed.ts`,
  templates de e-mail/WhatsApp, nomes de variável/rota que carreguem a marca

**Out:**
- UI técnica sem intenção de marketing editável pelo dono do negócio (labels de
  botão "Fechar"/"Entrar", mensagens de erro de formulário) — critério herdado do
  `PLAN-0012` ("Out"), mas **cada arquivo do grupo abaixo precisa ser confirmado
  individualmente, não descartado por suposição** (Chesterton's Fence):
  `AccessDeniedBanner.tsx`, `AuthModalsSection.tsx`, `CartModalSection.tsx`,
  `ConciergeWidgetSection.tsx`
- Textos/imagens já geridos por outras entidades de banco (nome/preço/descrição/foto
  de `Product`, `Service`, `Membership`) — esse é o padrão *correto* pós-`ERR-0062`,
  não uma regressão a corrigir
- Rotas/telas do Admin V2 fora de `sistema/pageTexts/` e `.../mediaGallery/` (não são
  conteúdo de marketing, são ferramenta interna)
- **Construção do `saas-initialize` em si** — fica como backlog futuro (`DECISION-018`),
  este plano só levanta o terreno, não implementa a rotina de reset

---

## Checklist de Execução

### Fase 0 — Inventário (já executado nesta conversa)
- [x] Listar todos os arquivos de seção pública (30)
- [x] Identificar quais usam `usePageText()` (24) e quais não (6)
- [x] Ler `HomeProductsSection.tsx` e `FranquiasModelDetailSection.tsx` — confirmados
      como falsos positivos (dados reais de API / props repassadas)
- [x] Consultar `DEBUG-HISTORY.md` — achados prévios relacionados (`ERR-0058`,
      `ERR-0060`, `ERR-0062`) e pendência de chaves órfãs já documentada, não resolvida
- [x] Confirmar que o editor de Textos das Páginas foi portado para
      `admin-v2/sistema/pageTexts/PageTextsView.tsx` durante o `PLAN-0033`

### Fase 1 — Auditoria tela por tela (classificar cada campo de texto visível)
Para cada seção, ler o JSX completo e classificar todo texto visível ao usuário final em:
`A` = via `usePageText`/`RichText` (OK) · `B` = via entidade de banco real (OK, fora de
escopo do pageTexts por design) · `C` = UI técnica sem intenção editorial (OK, mas
confirmado, não presumido) · `D` = hardcoded sem cobertura de banco (**violação — corrigir**)

- [x] `AccessDeniedBanner.tsx` — classificado `C`
- [x] `AuthModalsSection.tsx` — classificado `C`
- [x] `CartModalSection.tsx` — classificado `C` (com ressalva, ver achados)
- [x] `ConciergeWidgetSection.tsx` — classificado `C` (já usa `branding` corretamente
      onde precisa)
- [x] `HomeProductsSection.tsx` — classificado `D` (achado grande, ver achados)
- [x] `FranquiasModelDetailSection.tsx` — confirmado `A`: os 3 callers
      (`FranquiasFran01/02/03Section.tsx`) passam 100% dos campos via
      `usePageText`/`useMediaSlot`, zero literal inline
- [x] Revisão grep-assisted das 30 seções (varredura de heading/parágrafo/label
      literal fora de `RichText`/`usePageText`) — achados listados abaixo
- [x] `components/pages/HomeContent.tsx`, `FranquiasContent.tsx`,
      `AssinaturasContent.tsx` — limpos, sem texto literal (wrappers finos).
      `CheckoutContent.tsx` (1034 linhas) — só labels transacionais de checkout
      (Cupom, Total a pagar, Forma de entrega, etc.), classificado `C` por
      consistência com Cart/Auth (fora do escopo do `pageTexts` por desenho)

### Achados da Fase 1 (texto)

| # | Arquivo | Achado | Classe | Ação recomendada |
|---|---------|--------|--------|-------------------|
| 1 | `HomeProductsSection.tsx:209-210` | Eyebrow "Luxo em Casa" + título "Produtos em Destaque" hardcoded | `D` | Migrar p/ `usePageText`, novas chaves `home.products.*` |
| 2 | `HomeProductsSection.tsx:213,219` | "Ver Todos os Produtos" (link, duplicado 2x) hardcoded | `D` | Idem — inconsistente com outros CTAs do site que já são pageText |
| 3 | `HomeProductsSection.tsx:323` | "Frete gratis em pedidos acima de R$ 150,00. Devolucao em 30 dias." hardcoded, **desconectado** do valor real (`checkout.freeShippingThreshold`, `apps/api/src/lib/currencyUtils.ts`) | `D` | Migrar p/ pageText **e** interpolar o valor real da política de frete, não duplicar o número |
| 4 | `HomeProductsSection.tsx:334-335` | "Outros Produtos para seu conforto" + "Coleção Completa" hardcoded | `D` | Migrar p/ `usePageText` |
| 5 | `HomeServicesSection.tsx:280-289` | Modal "Menu Completo": eyebrow + título "Tratamentos por Categoria" + subtítulo, todos hardcoded (o link que abre o modal já é pageText, `home.services.catalog_link`, mas o conteúdo do modal em si não) | `D` | Migrar p/ `usePageText`, novas chaves `home.services.catalog_modal_*` |
| 6 | `HomeMembershipSection.tsx:25-104` | 3 cards de fallback (Silver/Radiance R$99, Gold/Luminosity R$189, Platinum/Ethereal R$299 + benefícios) **hardcoded como fallback** exibido quando a API falha ou há <3 planos cadastrados (`index.behavior.ts` comentário `// keep static fallback from HTML`) | `D` (achado do objetivo SaaS, `DECISION-018`) | Fallback é intencional (nunca mostrar vazio), mas o **conteúdo** do fallback é 100% JLR-específico — trocar por fallback genérico (ex.: "Plano A/B/C", sem preço fictício) ou por 3 registros em `pageTexts` |
| 7 | `FranquiasModelsSection.tsx:67,108,149` | Label "Investimento Inicial" repetido 3x (idêntico nos 3 cards, hardcoded) | `D` (menor) | Migrar p/ 1 chave só (`franquias.models.investment_label`), reusada nos 3 |
| 8 | `CartModalSection.tsx:25` | "R$ 150,00" hardcoded como placeholder inicial (é sobrescrito por JS via `/api/public/checkout/shipping-policy`) | `C` com ressalva | Não é bug funcional (JS corrige), mas o fallback (`DEFAULT_FREE_SHIPPING_THRESHOLD=150` em `index.behavior.ts`) também é JLR-específico — mesma raiz do achado #3 |
| 9 | `FranquiasContactSection.tsx` (labels do form: Nome Completo, Endereço de Email, etc.) | Labels de campo de formulário hardcoded | `C` | Consistente com o precedente de `AuthModalsSection` (labels de campo padrão = UI técnica, fora do escopo do `pageTexts`) — não é violação |

**Resumo:** 7 achados `D` reais concentrados em **3 arquivos** (`HomeProductsSection.tsx`,
`HomeServicesSection.tsx`, `HomeMembershipSection.tsx`) + 1 menor (`FranquiasModelsSection.tsx`).
Todos os 3 arquivos principais têm um traço em comum: são telas/blocos que **não
existiam no catálogo original do `PLAN-0012`** (produtos e o modal de catálogo de
serviços vieram depois; o fallback de assinaturas nunca foi migrado). O achado #6 é o
mais relevante para o objetivo do `DECISION-018` — é exatamente o cenário descrito
pelo usuário: conteúdo JLR-específico que aparece para o usuário final sem passar
pelo banco.

### Fase 1b — Auditoria equivalente para imagens (`mediaSlots`) — CONCLUÍDA
- [x] Listado todos os 30 arquivos de seção: 18 usam `useMediaSlot` corretamente
      (Class A), `FranquiasModelDetailSection.tsx` recebe imagem via prop dos 3
      callers já auditados (Class A). Os outros 11 não usam `useMediaSlot` — checados
      um a um por `<img>`/`backgroundImage`/caminho literal `/images/`
- [x] `HomeServicesSection.tsx` (flip-cards) — confirmado `Service.imageUrl` real
      (Class B, pattern correto pós-`ERR-0062`), nenhum resquício de slot antigo
      referenciado em paralelo
- [x] `PublicMenu.tsx` (logo) — já 100% dinâmico via `branding.logoUrl` (Class A,
      implementação exemplar)
- [x] `mediaSlots.ts` (78 `fallbackUrl`, fotos reais da JLR) — **não é achado**: é o
      mesmo padrão do `defaultValue` em `pageTexts/catalog.ts` (conteúdo atual do
      tenant, não bug). Relevante só pro futuro `saas-initialize` (`DECISION-018`),
      fora do escopo de "violação hardcoded" desta fase
- [x] Varredura de wrappers de página (`HomeContent`/`FranquiasContent`/
      `AssinaturasContent`/`CheckoutContent`) — limpos após a correção do achado #A

**Achados da Fase 1b (imagem):**

| # | Arquivo(s) | Achado | Classe | Correção aplicada |
|---|-----------|--------|--------|---------------------|
| A | `HomeProductsSection.tsx`, `CheckoutContent.tsx`, `index.behavior.ts` (cart) | Fallback "sem imagem" hardcoded **3x duplicado**, apontando pra uma foto real de produto da JLR (`/images/products/jlr_argan.webp`) — mostra o produto errado de verdade quando outro produto não tem foto cadastrada | `D` | Constante única `NO_PRODUCT_IMAGE_URL` em `apps/web/src/lib/assetUrls.ts`, apontando pra novo SVG neutro `apps/web/public/images/no-product-image.svg` (silhueta cinza genérica, sem depender de nenhum produto real) |
| B | `NavStatusActions.tsx` (avatar do usuário logado no menu) | Fallback de avatar hardcoded pra uma foto real da seção "Sobre" (`/images/about_img1.webp`) — usuário sem foto de perfil via a foto do salão como se fosse a própria foto | `D` | Trocado por ícone genérico Material Symbols (`account_circle`), sem depender de imagem nenhuma |

**Validações:** `apps/web` `tsc -b` + `vite build` PASS (215 módulos), `npm run lint`
sem erro novo nos arquivos tocados.

### Fase 1c — Consistência de nomenclatura Admin → Admin V2 — CONCLUÍDA
- [x] `PageTextsView.tsx` (`SECTION_LABELS`) — comparado contra as seções reais do
      catálogo (`grep -oE 'section: "[a-z_0-9]+"' catalog.ts | sort -u` → 23 seções).
      **Achado real**: só 10/23 tinham rótulo amigável; as outras 13 caíam no
      fallback `?? section` e apareciam com a chave técnica crua (`fran01`,
      `gestao_app`, `perfil`, `products` — inclusive a seção que a própria Fase 3
      deste plano acabou de criar) pra quem edita o conteúdo no Admin. **Corrigido**:
      13 rótulos adicionados (`Modelo Master/Prime/Essencial (detalhes)`, `Gestão via
      App`, `Fluxo de Caixa`, `Marketing & CRM`, `Expansão`, `Perfil do Franqueado`,
      `Suporte da Franqueadora`, `Etapas de Abertura`, `Benefícios`, `Fundadora`,
      `Produtos`)
- [x] Achado colateral: rótulo `membership` mapeava pra "Assinaturas" — mesmo texto
      da aba de página `assinaturas` (`PAGE_LABELS`), ambíguo (é a seção de
      assinaturas *dentro* da Home, não a página Assinaturas). **Corrigido**: renomeado
      pra "Assinaturas (Home)"
- [x] `MediaGalleryView.tsx` — checado o agrupamento por página (`<h3>{page}</h3>`,
      raw string maiúsculo via CSS): não usa uma tabela de rótulos separada como o
      `PageTextsView` (usa `slot.label` já pronto do próprio catálogo pra cada item),
      então não sofre do mesmo problema — nenhum achado aqui. Cabeçalho de página
      mostra a chave raw (`home`/`franquias`/`assinaturas`/`checkout`), que já lê bem
      em PT-BR maiúsculo — inconsistência cosmética menor com o `PageTextsView`
      (Title Case vs. UPPERCASE), não corrigida (baixo impacto, funciona)
- [x] Varredura por referência a nome de tela do Admin legado que não existe mais
      (`admin legado`, `AdminContent`, `admin antigo`) dentro de `admin-v2/`: todas as
      ocorrências são comentários de código documentando a migração (úteis,
      não-visíveis ao usuário) — nenhuma referência viva quebrada. `"Seções Telas"`
      (`SectionTogglesView.tsx`) é uma tela **nativa e funcional** do Admin V2
      (`PLAN-0026`), não um resquício do legado — fora de escopo desta fase (é
      grafia/gramática, não portabilidade)

### Fase 2 — Cruzamento catálogo × uso real (chaves/slots órfãos) — CONCLUÍDA
- [x] Extraídas as 342 chaves de `catalog.ts` e os 78 slots de `mediaSlots.ts`
- [x] Cross-reference automatizado: para cada chave/slot, `grep -rl` no frontend
      (`.tsx`/`.ts`) confirmando pelo menos 1 arquivo com uso literal (nenhuma chamada
      usa chave dinâmica via template string — confirmado, cross-reference é confiável)
- [x] **45 órfãos encontrados, todos em 1 único cluster**: os 9 flip-cards de
      Serviços da Home (exatamente o que `ERR-0062` já tinha sinalizado, agora
      quantificado) — **36 chaves de texto** (`home.services.card_{1-9}_{front_label,
      front_tagline, back_label, back_desc}`) + **9 slots de imagem**
      (`home_services_card_img_{01-09}`). Zero órfãos em qualquer outro lugar do
      catálogo (Franquias, Assinaturas, Global — todos os 306 campos restantes e 69
      slots restantes têm uso confirmado)
- [x] **Consultado o banco real (Docker Postgres ao vivo)** pra saber se há conteúdo
      editado sendo perdido: os 45 valores em `ContentEntry` (`public.pageTexts` /
      `public.mediaSlots`) foram comparados byte-a-byte contra os `defaultValue`/
      `fallbackUrl` do catálogo — **100% idênticos**. Nenhum dos 45 campos foi editado
      pela dona do site antes da migração pra `Service.imageUrl`/`highlightLabel` etc.
      (`PLAN-0028`) — são puro seed nunca tocado, remover não perde histórico editorial
- [x] Decisão do usuário: **remover só do código** (`catalog.ts`/`mediaSlots.ts`
      backend e frontend), **deixar os 45 valores como estão no Postgres**
      (`ContentEntry`) — não excluir do banco

**Execução da decisão:**
- `apps/api/src/modules/pageTexts/catalog.ts` — 36 chaves `home.services.card_*`
  removidas (342 → 306 chaves)
- `apps/api/src/modules/mediaSlots/service.ts` — 9 ids removidos de `MEDIA_SLOT_IDS`
  **e** de `PUBLIC_MEDIA_SLOT_CATALOG` (achado extra: esse arquivo duplica o catálogo
  em 2 listas internas + o catálogo do frontend = 3 fontes da mesma lista de 78/69
  slots, mantidas manualmente em sincronia — dívida de arquitetura, fora do escopo
  desta correção, registrada aqui como observação para um plano futuro)
- `apps/web/src/modules/public-site/mediaSlots.ts` — 9 slots removidos (78 → 69)
- Comentários de rastreabilidade deixados nos 3 arquivos apontando pra este plano
- `seed.ts` não precisou de edição (deriva de `PAGE_TEXT_CATALOG` automaticamente);
  não há seed de `mediaSlots` no backend (módulo é só runtime + catálogo estático)
- Dado antigo (45 valores) **permanece intacto** em `ContentEntry.value` no Postgres —
  chaves órfãs dentro do JSON armazenado, inofensivas (nunca lidas, catálogo é quem
  define o que é exposto/editável)

**Validações:** `apps/api` `tsc -b` + `npm run build` + `npm run test` (134/134 PASS —
confirma que o self-check de integridade de `mediaSlots/service.ts`, que lança erro em
runtime se `MEDIA_SLOT_IDS` e `PUBLIC_MEDIA_SLOT_CATALOG` saírem de sincronia, passou);
`apps/web` `tsc -b` + `vite build` PASS (215 módulos, bundle 895→893 KB), `npm run
lint` sem erro novo (contagem confirmada: 306 chaves de texto, 69 slots de imagem em
ambos os catálogos frontend/backend).

### Fase 3 — Correção dos achados `D` (violação real, texto e imagem) — CONCLUÍDA (texto)
- [x] Para cada campo `D`: entrada adicionada em `catalog.ts`, componente migrado para
      `usePageText()` + `RichText`. `seed.ts` não precisou de edição — deriva
      automaticamente de `PAGE_TEXT_CATALOG` (`apps/api/prisma/seed.ts:619-627`)
- [x] Validar build: `npm run build` em `apps/api` (PASS) e `apps/web` (PASS,
      `tsc -b` + `vite build`, 215 módulos, sem erro/warning novo)
- [x] `npm run lint` (`apps/web`) — 0 erros novos nos arquivos tocados (28 erros
      pré-existentes em `ServiceMatrixView.tsx`/`RadarView.tsx`/
      `FranquiasEtapasAberturaSection.tsx`, arquivos não tocados por este plano)
- [x] `npm run test` (`apps/api`) — 134/134 PASS

**Correções aplicadas:**

| # | Achado | Chave(s) nova(s) em `catalog.ts` | Arquivo migrado |
|---|--------|-----------------------------------|-------------------|
| 1-2 | Eyebrow/título/CTA "Ver Todos os Produtos" | `home.products.label`, `.title`, `.cta_view_all` | `HomeProductsSection.tsx` |
| 3 | Nota de frete/devolução | `home.products.shipping_note` | `HomeProductsSection.tsx` |
| 4 | "Outros Produtos.../Coleção Completa" | `home.products.collection_eyebrow`, `.collection_title` | `HomeProductsSection.tsx` |
| 5 | Modal "Menu Completo" | `home.services.catalog_modal_eyebrow`, `.title`, `.subtitle` | `HomeServicesSection.tsx` |
| 6 | Fallback de 3 planos fictícios (Silver/Gold/Platinum) | `home.membership.empty_state` — **fallback trocado por mensagem genérica, sem preço/nome fictício**, em vez de virar 3 registros paralelos de plano (evita 2ª fonte de verdade concorrendo com a tabela `Membership`) | `HomeMembershipSection.tsx` |
| 7 | "Investimento Inicial" duplicado 3x | `franquias.models.investment_label` (1 chave, reusada) | `FranquiasModelsSection.tsx` |

**Nota sobre o achado #6:** a lógica de `index.behavior.ts` que só troca o fallback
quando há **>=3** planos reais cadastrados (`if (!membershipGrid || publicMemberships.length < 3) return;`)
não foi alterada — está fora do escopo desta correção (é comportamento funcional, não
texto hardcoded) e fica registrada aqui como observação para decisão futura: hoje, um
cliente com 1-2 planos reais cadastrados vê a mensagem genérica de fallback em vez dos
planos reais que já tem.

### Fase 4 — Revalidação funcional dos editores (Admin V2) — CONCLUÍDA
Rebuild + restart real dos containers Docker (`api`/`web`, imagens rebuildadas a
partir do código já corrigido pelas Fases 1-3) e teste ponta a ponta no browser
(Chrome, sessão logada como `master`/Administrador).

- [x] Abrir Admin V2 > Sistema > Textos das Páginas — carregou **306 campo(s)**
      (confirma a contagem pós-Fase 2: 342 − 36 órfãs = 306)
- [x] Confirmar carregamento das 4 abas (Home/Franquias/Missão & Valores/Assinaturas)
- [x] **Confirmado visualmente 3 achados anteriores, todos corretos no editor real**:
      seção "SERVIÇOS" com **6 campos** (não mais 42 — as 36 órfãs sumiram do editor);
      seção "PRODUTOS" (rótulo amigável, não a chave crua `products` — achado da Fase
      1c); seção "ASSINATURAS (HOME)" (rótulo desambiguado, não colide mais com a aba
      "Assinaturas" — achado colateral da Fase 1c)
- [x] Editado 1 campo simples (Título da seção "Produtos") — salvo, recarregado a
      home pública com hard-reload, **confirmado reflexo real** ("Produtos em
      Destaque [TESTE PLAN-0034]" apareceu na seção Produtos) — **revertido e salvo
      de novo**, confirmado reflexo do valor original
- [x] Editado 1 campo segmentado (parte "Eternizada" do H1 do Hero, estilo "Dourado
      gradiente") — salvo, recarregado a home pública, **confirmado reflexo real**
      (texto "Eternizada [TESTE]" renderizado com o gradiente dourado aplicado) —
      **revertido e salvo de novo**, confirmado reflexo do valor original
- [x] Histórico ("Restaurar versão anterior") — botão presente e habilitado
      (confirma que o backend está disponibilizando snapshot anterior); **teste ativo
      pulado deliberadamente** por segurança, pra não arriscar reintroduzir os valores
      de teste através de uma cadeia de restaurações confusa depois de várias saves
      seguidas nesta sessão
- [x] Abrir Admin V2 > Sistema > Galeria de Mídias — carregou **69 slots** (confirma
      a contagem pós-Fase 2: 78 − 9 = 69), grupo "HOME" com **11 slots** (20 − 9 = 11,
      as 9 miniaturas "Home Serviços - Card N" não aparecem mais), grupo "FRANQUIAS"
      com 52 slots (inalterado)
- [x] Aberto o modal de edição de 1 slot (`home_hero_bg_01`) — preview, campo de URL,
      fallback, botões Upload/Reverter fallback funcionam; fechado sem salvar (não
      precisava de mudança real, só validar que o modal abre e funciona)
- [x] Console do browser sem erros durante toda a sessão de teste

**Nenhum dado de teste ficou para trás** — os 2 campos usados no teste (título da
seção Produtos, segmento "Eternizada" do Hero) foram revertidos ao valor original e
salvos de novo antes de encerrar.

### Fase 5 — Levantamento de branding "JLR" fora do sistema editável — CONCLUÍDA
- [x] `grep -rniE "\bjlr\b"` em `admin-v2/` inteiro + restante do frontend (fora do
      que a Fase 1 já cobriu em `public-site/`)
- [x] Achados classificados e **corrigidos** (usuário pediu explicitamente, saindo do
      "só mapeamento" original):
  - **`apps/web/index.html:6`** `<title>JLR Beauty | Salao & Spa de Luxo</title>` —
      estático, visível (aba do navegador, SEO). Mantido como está (é o `<title>`
      correto pré-render para *este* deploy — bom para SEO/crawlers sem JS, análogo a
      um valor de `.env`, editável por deploy). **Corrigido em paralelo**: agora
      `branding.runtime.ts` sincroniza `document.title` com o branding real assim que
      carrega/muda (`${branding.fullName} | Salão & Spa de Luxo`), então a aba reflete
      qualquer edição feita no Admin sem precisar editar `index.html` a cada vez.
  - **`admin-v2/shell/AdminTopbar.tsx:27`** `"JLR Beauty Admin V2"` hardcoded no
      topbar do Admin V2 (visível pra equipe interna) — **corrigido**: trocado por
      `branding.fullName` (mesmo hook do site público, sem Provider extra necessário —
      é external store, funciona em qualquer árvore React). `"Admin V2"` continua
      fixo, é rótulo da ferramenta, não do tenant.
  - `BrandingSettingsView.tsx` — placeholders "Ex.: JLR Beauty"/"Ex.: JLR" no campo
      onde a cliente digita o nome da marca — cosmético (é só exemplo de
      preenchimento), **não corrigido**, baixa prioridade
  - Prefixo `jlr.`/`jlr:` em chaves de `localStorage` e nomes de evento JS internos
      (`jlr:cart-updated`, `jlr:auth-state-changed`, `jlr.public.branding.snapshot.v1`,
      etc.) e 1 comentário de código (`PublicMenu.tsx`) — **não corrigidos**, zero
      visibilidade pro usuário final, é só namespace técnico, sem urgência
- [x] `apps/web/index.html` — checado por completo: só tem `<title>` (já tratado
      acima) + `viewport` + links de fonte Google; **não existe** nenhuma outra meta
      tag (`og:title`, `og:description`, `twitter:card`, `description`) no HTML —
      nada mais a corrigir aqui. Observação à parte (não é achado de hardcoding, é
      lacuna de conteúdo): não há meta description/Open Graph nenhuma, o que é ruim
      pra SEO/compartilhamento — fora do escopo deste plano, não corrigido
- [x] `apps/api/prisma/seed.ts` — 1 achado cosmético: e-mails fake dos profissionais
      seedados usam domínio `@jlr.local` (`profissional.${normalizedKey}@jlr.local`)
      — dado de seed/demo, nunca visível a usuário real, **não corrigido**, baixa
      prioridade (mesma categoria dos prefixos `jlr:`/`jlr.` já registrados)
- [x] Templates de e-mail/WhatsApp — nenhum template de e-mail dedicado existe no
      código; módulos de integração WhatsApp/chatbot (`lib/zapi.ts`,
      `modules/chatbot/**`) varridos por "jlr" — **zero ocorrências**, limpo
- [x] `sfk.toml` — 2 ocorrências de "JLR" (`[project] name`, `[project.team] company`)
      são a identidade do **projeto/repositório em si** (arquivo por desenho
      específico de cada deploy do SFK, não conteúdo de runtime multi-tenant) —
      **não é achado**, é o padrão correto (um cliente novo teria seu próprio
      `sfk.toml`)
- [x] **1 achado real encontrado e corrigido, fora do escopo original da varredura**:
      `apps/api/src/routes/orders.ts` — descrição da linha de item no Stripe Checkout
      hardcoded `"Pagamento de compra no site JLR"` (aparece pro cliente real durante
      o pagamento e no extrato/dashboard do Stripe), sem nenhum vínculo com o sistema
      de branding. **Corrigido**: agora usa `getPublicBranding().shortName` em tempo
      de requisição (`Pagamento de compra no site ${branding.shortName}`)

**Validações:** `apps/api` `tsc -b` + `npm run build` + `npm run test` 134/134 PASS.

**Resumo da Fase 5:** 3 achados reais corrigidos no total (título da página + topbar
do Admin V2, já registrados acima; descrição do Stripe, achado desta rodada) + 3
achados cosméticos documentados e conscientemente não corrigidos (placeholders de
exemplo, prefixos de namespace técnico, domínio de e-mail de seed) por serem
invisíveis ao usuário final e de baixa prioridade frente ao objetivo do `DECISION-018`.

### Achado adicional pós-Fase 5 — número de WhatsApp hardcoded E divergente (usuário pediu recheck)

Usuário perguntou se a tela "Textos das Páginas" não estaria faltando alguma
página/seção. Resposta direta: não — as 4 páginas cobrem tudo que é conteúdo de
marketing real; Checkout não é rota própria (é overlay da Home) e seu conteúdo é
majoritariamente transacional, consistente com o precedente já estabelecido na Fase 1.
Mas ao reconferir o Checkout por completo, achado um problema mais sério que passou
batido nas fases anteriores (nenhuma delas buscava por número de telefone):

**Achado:** número de WhatsApp de contato hardcoded em **3 lugares**, sendo **2
divergentes entre si**:
- `CheckoutContent.tsx` (link "Fale Conosco"): `5511989261279`
- `index.behavior.ts` (`WHATSAPP_PHONE`, usado no mesmo link via script + no fluxo de
  assinatura): `5511978935812` — com uma linha morta comentada logo abaixo contendo o
  *outro* número, evidência de uma tentativa de correção anterior mal resolvida
- `apps/api/.../conciergeFlow.ts` (`DEFAULT_SUMMARY_PHONE`, fallback do resumo do
  concierge): `5511978935812` — este já tinha o padrão correto (`CONCIERGE_SUMMARY_PHONE`
  env var primeiro, hardcoded só como fallback), mas não estava exposto ao frontend

**Confirmado com o usuário:** o número correto é `5511978935812`.

**Correção aplicada (fonte única, ponta a ponta):**
- `apps/api/src/modules/branding/service.ts` — nova função `resolveWhatsappSupportPhone()`
  (mesma env var `CONCIERGE_SUMMARY_PHONE`, fallback `5511978935812`)
- `apps/api/src/modules/chatbot/flow/conciergeFlow.ts` — `resolveSummaryPhone` agora é
  alias da função compartilhada (removida a duplicação local)
- `apps/api/src/routes/admin.ts` — `GET /api/public/branding` passa a incluir
  `whatsappPhone` na resposta (computado da env var, **não** faz parte do schema
  editável de branding — não aparece no form de Branding do Admin)
- `apps/web/src/modules/public-site/branding.ts` + `branding.runtime.ts` — tipo
  `PublicBranding` ganhou `whatsappPhone`, normalizado com fallback
- `apps/web/src/admin-v2/sistema/branding/BrandingSettingsView.tsx` — ajustado pra
  preservar `whatsappPhone` ao salvar (não é campo editável deste form)
- `apps/web/src/components/pages/CheckoutContent.tsx` — usa `useBranding().whatsappPhone`
- `apps/web/src/modules/public-site/index.behavior.ts` — `buildWhatsappUrl()` usa
  `getBrandingSnapshot().whatsappPhone`, constante local + linha morta removidas
- `sfk.toml` — `CONCIERGE_SUMMARY_PHONE` documentado no registro de env vars (gap
  encontrado durante a investigação, corrigido em paralelo)

**Validado:** `apps/api` `tsc -b`+`build`+`test` 134/134 PASS; `apps/web` `tsc -b`+
`build`+`lint` sem erro novo; rebuild Docker real + browser: `curl /api/public/branding`
retorna `whatsappPhone: "5511978935812"`, link "Fale Conosco" no Checkout real
confirmado com `href` correto via `read_page`, console sem erros.

### Fase 6 — Memória
- [x] Bug real confirmado (número de WhatsApp hardcoded e divergente) registrado
      como `ERR-0074` em `DEBUG-HISTORY.md`
- [x] `memory/MODIFICATION_LOG.md` atualizado em tempo real ao longo de todas as
      fases desta sessão
- [x] Decisão sobre chaves/slots órfãos registrada em `memory/decisions/DECISION-019.md`
- [x] Fechamento formal executado em 2026-08-24: rename para `-DONE-` e
      preenchimento do Git Record (Step 1 — pre-commit review) abaixo. Commit/push
      ficam para aprovação explícita do usuário (Steps 2-4).

Status atualizado: **DONE — 7 fases técnicas completas e validadas, plano fechado
formalmente em 2026-08-24**. Commit ainda não realizado (aguardando aprovação
explícita do usuário — ver Git Record abaixo).

---

## Critérios de Validação

| Critério | Como validar |
|----------|---------------|
| Nenhum texto/imagem `D` (hardcoded sem banco) restante | Checklists Fase 1/1b com 100% dos arquivos classificados, zero `D` pendente |
| Catálogo sem chave/slot morto sem decisão | Lista de órfãos da Fase 2 apresentada e resolvida (mantida ou removida por decisão explícita) |
| Nomenclatura Admin V2 sem resquício do Admin legado | Fase 1c concluída, nenhuma chave/rótulo referenciando tela que não existe mais |
| Editores funcionais pós-porte | Fase 4 completa sem erro, testado no browser real (Textos e Galeria de Mídias) |
| Build limpo | `npm run build` em api e web sem erros após correções da Fase 3 |
| Levantamento de branding entregue | Lista da Fase 5 documentada e anexada ao fechamento do plano (mesmo sem correção) |

## Notas de Risco
1. **Não confundir "não usa usePageText/mediaSlot" com "bug"** — `Product`/`Service`/
   `Membership` data-driven é o padrão correto pós-`ERR-0062`, fora do escopo do
   `pageTexts`/`mediaSlots` por desenho do próprio `PLAN-0012`. Classificar antes de
   agir (Chesterton's Fence).
2. **Chaves/slots órfãos são dado, não código** — não remover do catálogo sem decisão
   explícita do usuário; risco de perder histórico de conteúdo que a dona do site
   já editou antes.
3. Escopo desta auditoria é **conteúdo de marketing visível** (texto e imagem), não
   toda string do codebase — UI técnica (mensagens de erro, labels de botão
   funcional) é legitimamente fora do padrão `pageTexts`/`mediaSlots`, mas cada caso
   do grupo "Out" precisa ser confirmado, não presumido, na Fase 1/1b.
4. **Fase 5 é só levantamento** — achar "JLR" hardcoded fora do sistema editável não
   vira correção automática neste plano; é insumo para uma decisão futura sobre como
   e quando abordar portabilidade total (`DECISION-018`).

## Git Record of Delivery
- [x] Step 1 (Pre-commit review) — 2026-08-24: 25 arquivos modificados + 4 novos
  (lista completa e validações no `MODIFICATION_LOG.md`, entrada de fechamento
  desta data). Escopo do commit é só o conteúdo do `PLAN-0034` + fix pontual de
  `.gitignore` pedido pelo usuário; mudanças não relacionadas encontradas no
  workspace (`.sfk/kernel/skills/*`, `.cursor/rules/memsession.md`,
  `.sfk/kernel/skills/memsession/`, `.codex/`) foram deliberadamente deixadas de
  fora, por instrução explícita do usuário.
- [x] Step 2 (Commit authorization) — 2026-08-24: usuário aprovou explicitamente
  ("pode commitar, git rm --cached nos arquivos de skills")
- [x] Step 3 (Commit confirmation) — 3 commits em `main`:
  `964ae52` (fecha `PLAN-0034`, 30 arquivos), `9ef303b` (destrackeia
  `.sfk/kernel/skills/`, 198 arquivos, leva separada — engine housekeeping,
  confirmada com o usuário antes de commitar por ser maior escopo que o
  previsto), `430a8e9` (registra os 2 commits acima em memória)
- [x] Step 4 (Push authorization e resultado) — 2026-08-24: usuário aprovou push
  junto com o commit do registro de memória. `git push origin main`:
  `d81d277..430a8e9 main -> main`, sucesso
- Push status: COMPLETED
