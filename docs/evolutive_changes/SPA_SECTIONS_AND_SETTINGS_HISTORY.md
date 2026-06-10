# SPA Sections and Settings History

Data de referencia: 2026-02-26
Escopo: consolidar, em um unico lugar, a evolucao da estrategia de seccionamento da SPA publica e do painel `Secoes SPA` no Admin.

## 1) Resumo executivo
- A decisao de quebrar telas em componentes menores por secao foi formalizada na rodada de modularizacao da Home e da pagina de Franquias.
- Foi criado um painel administrativo (`Secoes SPA`) para ligar/desligar secoes publicas.
- A primeira persistencia usava arquivo (`sectionToggles.ts`) e funcionava localmente, mas gerou instabilidade em producao por dependencia de filesystem.
- A solucao final migrou a persistencia para banco via `settings`, com chave `public.sectionToggles` e leitura publica em runtime.
- Na rodada de branding global, a marca tambem passou a ser dinamica via `settings`, com chave `public.branding` e cache/runtime dedicado.

## 2) Linha do tempo consolidada

### 2026-02-17 - Modularizacao de secoes da SPA publica
- Home e paginas publicas passaram a usar composicao por secoes/componentes.
- Base de toggles criada em `apps/web/src/modules/public-site/sectionToggles.ts`.
- Referencia no log: `memory/MODIFICATION_LOG.md` (entrada 2026-02-17 18:48:09).

### 2026-02-17 - Criacao da tela Admin `Secoes SPA`
- Criado modulo `admin-section-toggles` com view + island React.
- Integracao no Admin e endpoints protegidos para leitura/escrita dos toggles.
- Persistencia inicial: arquivo `sectionToggles.ts` via API.
- Referencia no log: `memory/MODIFICATION_LOG.md` (entrada 2026-02-17 19:12:37).

### 2026-02-24 - Hotfix de path para producao
- Ajustada resolucao de caminho no backend para reduzir falhas de leitura/escrita do arquivo em ambientes com `cwd` diferente.
- Referencia no log: entradas 2026-02-24 15:12:46 e 15:14:29.

### 2026-02-24 - Migracao final para `settings`
- Persistencia de toggles saiu de arquivo e foi para banco.
- Chave canonicamente usada: `public.sectionToggles`.
- Novo endpoint publico criado para consumo de runtime no site.
- Paginas publicas passaram a usar store runtime com fallback local.
- Referencia no log: entradas 2026-02-24 19:15:00 e 19:36:00.

### 2026-02-27 - Branding global dinamico + cache/runtime
- Backend ganhou modulo dedicado de branding com cache TTL em memoria por instancia.
- Novos endpoints de branding:
  - `GET /api/admin/branding`
  - `PUT /api/admin/branding`
  - `GET /api/public/branding`
- Frontend ganhou runtime store de branding com bootstrap unico por carregamento:
  - `apps/web/src/modules/public-site/branding.runtime.ts`
- Admin ganhou view dedicada `Branding`:
  - `apps/web/src/modules/admin-branding/components/AdminBrandingView.tsx`
- Textos/logo hardcoded de marca foram migrados para variaveis dinamicas (`fullName`, `shortName`, `logoUrl`) nos pontos estruturais.

## 3) Arquitetura atual (fonte de verdade)

### Backend
- Fonte principal: tabela/model de configuracoes (`settings`), chave `public.sectionToggles`.
- Endpoints:
  - `GET /api/admin/section-toggles`
  - `PUT /api/admin/section-toggles`
  - `GET /api/public/section-toggles`
- Branding global:
  - chave `public.branding`
  - endpoints `GET/PUT /api/admin/branding` e `GET /api/public/branding`
  - cache TTL em memoria no service de branding.
- Comportamento esperado:
  - Admin le/salva snapshot completo das toggles.
  - Publico consome toggles em runtime sem depender de novo build para cada ajuste.

### Frontend (public-site)
- Base local + tipo: `apps/web/src/modules/public-site/sectionToggles.ts`.
- Runtime store: `apps/web/src/modules/public-site/sectionToggles.runtime.ts`.
- Branding:
  - defaults/tipo: `apps/web/src/modules/public-site/branding.ts`
  - runtime store: `apps/web/src/modules/public-site/branding.runtime.ts`
- Paginas que consomem toggles runtime:
  - `HomeContent.tsx`
  - `AssinaturasContent.tsx`
  - `FranquiasContent.tsx`
- Componentes estruturais que consomem branding runtime:
  - menus (`PublicMenu`, `FranquiasMenu`)
  - footer (`PublicSiteFooter`)
  - secoes institucionais/publicas (home/franquias)
  - header do admin (`AdminContent`).

### Frontend (admin)
- Tela de gestao:
  - `apps/web/src/modules/admin-section-toggles/components/AdminSectionTogglesView.tsx`
  - `apps/web/src/modules/admin-section-toggles/components/AdminSectionTogglesViewIsland.tsx`
- Tela de branding:
  - `apps/web/src/modules/admin-branding/components/AdminBrandingView.tsx`
  - `apps/web/src/modules/admin-branding/components/AdminBrandingViewIsland.tsx`

## 4) Beneficios de manutencao obtidos
- Quebra por secao reduziu acoplamento de telas extensas.
- Reuso de secoes entre paginas publicas ficou mais simples.
- Toggle operacional via Admin reduziu necessidade de deploy para ajustes de exibicao.
- Persistencia em banco eliminou fragilidade de filesystem em producao.

## 5) Riscos e cuidados operacionais
- Garantir coerencia de payload da chave `public.sectionToggles` (schema e fallback).
- Homologar sempre o fluxo Admin salvar -> Publico refletir -> refresh.
- Manter textos e labels da tela `Secoes SPA` alinhados com UX e padrao de idioma.

## 6) Fontes primarias desta consolidacao
- `memory/MODIFICATION_LOG.md` (entradas de 2026-02-17 e 2026-02-24 relacionadas a modularizacao/toggles/settings).
- `documentations/MODULES_CATALOG.md` (mapa de modulos).
- `documentations/REFACTOR_REQUIREMENTS.md` (diretriz de modularizacao por dominio).
- `documentations/VITE_REACT_MIGRATION_PLAN.md` (plano-base de migracao para React modular).
- `documentations/REACT_MIGRATION_FINAL_SUMMARY.md` (contexto de consolidacao de runtime React e `/settings`).
