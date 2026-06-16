
# PLAN-0012 — Sistema de Edição de Textos das Páginas

Status: CONCLUÍDO
Data de abertura: 2026-06-11
Pré-requisito: PLAN-0011 concluído (rotas por domínio funcionando)
Contexto: Os textos visíveis das páginas públicas (títulos, subtítulos, CTAs, parágrafos,
depoimentos, labels de seção) estão hardcoded nos componentes React. Qualquer
alteração exige edição de código. Este plano implementa um sistema editável via
Admin, seguindo o mesmo padrão já estabelecido para `mediaSlots` e `branding`.

---

## STAR

**Situation**
Aproximadamente 50 campos de texto estão hardcoded em 11 componentes de seção
(`HomeHeroSection`, `HomeAboutSection`, `HomeCtaSection`, etc.). Muitos desses textos
contêm formatação composta: parte do texto em cor diferente, gradiente dourado ou
negrito — não é possível substituir por uma simples string. A dona do site não consegue
alterar nenhum texto sem intervenção do desenvolvedor.

**Task**
Criar um sistema de "segmentos JSON" para representar textos com estilo parcial,
armazená-los na tabela `Setting` (chave `public.pageTexts`), expô-los via API,
construir uma interface Admin organizada por página/seção, e migrar os ~50 textos
hardcoded para consumir o hook `usePageText()`.

**Action**
Cinco fases sequenciais: (0) catalogar todos os campos lendo os componentes;
(1) implementar backend (service + rotas); (2) implementar hook e renderer no frontend;
(3) construir a UI do Admin; (4) migrar os componentes de seção.
Cada fase termina com validação antes de avançar.

**Result**
Nenhum texto de marketing hardcoded nos componentes de seção. Admin > "Textos das
Páginas" permite editar qualquer texto, com suporte a segmentos estilizados. O site
renderiza os textos via API com fallback para os valores padrão do catálogo.

---

## Escopo

**In:**
- Catálogo de ~50 campos de texto com chave, tipo, valor padrão e agrupamento
- Backend: `apps/api/src/modules/pageTexts/` (catalog, service, router)
- 3 rotas: `GET /api/public/page-texts`, `GET /api/admin/page-texts`, `PUT /api/admin/page-texts`
- Frontend hook: `usePageText(key)` no padrão de `useMediaSlot`
- Componente `<RichText value={...} />` para renderizar string ou array de segmentos
- Vocabulário fechado de estilos: 6 opções mapeadas para classes CSS do projeto
- Admin UI: tela com abas por página + acordeão por seção + editor por campo
- Editor de segmentos: lista de partes com texto + dropdown de estilo + preview
- Migração dos 11 componentes de seção para `usePageText()`
- Seed: valores padrão inseridos no banco na primeira inicialização

**Out:**
- Textos dinâmicos já gerenciados por outros módulos (nomes/descrições de serviços,
  planos de assinatura, produtos — editáveis via Admin > Serviços / Memberships)
- Textos do Concierge / chatbot (escopo separado)
- Opções de dropdown do formulário de Franquias (texto de UI técnico)
- Editor WYSIWYG (Tiptap ou similar) — não será adicionada dependência externa
- Responsividade de tamanho de fonte (controlada por CSS, não pelo editor)

---

## Vocabulário de Estilos (fechado)

| ID | Nome exibido no Admin | Classe CSS aplicada |
|----|----------------------|---------------------|
| `default` | Normal | *(nenhuma extra)* |
| `gold-gradient` | Dourado gradiente ✨ | `gold-gradient-text` |
| `primary` | Verde primário | `text-primary` |
| `gold` | Dourado sólido | `text-gold` |
| `bold` | Negrito | `font-bold` |
| `uppercase` | Maiúsculas espaçadas | `uppercase tracking-widest` |

Novos estilos só entram via código — o editor não aceita valores livres.

---

## Estrutura de Dados

### Chave no banco
```
Setting.key = "public.pageTexts"
Setting.value = JSON (objeto com todas as chaves)
```

### Tipos de campo
```ts
type TextSegment = { text: string; style: StyleId };
type PageTextValue = string | TextSegment[];

type PageTextsMap = Record<string, PageTextValue>;
```

### Exemplo de valor armazenado
```json
{
  "home.hero.badge":    "Redefinindo a Beleza!",
  "home.hero.title":    [
    { "text": "Sua melhor versão, ", "style": "default" },
    { "text": "Eternizada",          "style": "gold-gradient" }
  ],
  "home.hero.subtitle": "Um santuário exclusivo para cabelo, pele e alma.",
  "home.hero.cta_primary":   "Agende Sua Experiencia",
  "home.hero.cta_secondary": "Rede de Franquias"
}
```

---

## Catálogo de Campos (mapa completo — a ser confirmado na Fase 0)

### Página: Home

| Chave | Campo | Tipo padrão |
|-------|-------|-------------|
| `home.hero.badge` | Badge do topo | simples |
| `home.hero.title` | Título principal (h1) | **segmentado** |
| `home.hero.subtitle` | Parágrafo do hero | simples |
| `home.hero.cta_primary` | Botão primário | simples |
| `home.hero.cta_secondary` | Botão secundário | simples |
| `home.about.label` | Label "Quem Somos" | simples |
| `home.about.title` | Título da seção Sobre | simples |
| `home.about.paragraph_1` | Primeiro parágrafo | simples |
| `home.about.paragraph_2` | Segundo parágrafo | simples |
| `home.about.stat_1_value` | Número da stat 1 (ex: "15+") | simples |
| `home.about.stat_1_label` | Label da stat 1 | simples |
| `home.about.stat_2_value` | Número da stat 2 (ex: "100%") | simples |
| `home.about.stat_2_label` | Label da stat 2 | simples |
| `home.cta.eyebrow` | Texto pequeno acima do título | simples |
| `home.cta.title` | Título do CTA | simples |
| `home.cta.subtitle` | Subtítulo do CTA | simples |
| `home.cta.button` | Texto do botão CTA | simples |
| `home.services.label` | Label da seção | simples |
| `home.services.title` | Título da seção | **segmentado** |
| `home.services.subtitle` | Subtítulo | simples |
| `home.membership.label` | Label da seção | simples |
| `home.membership.title` | Título da seção | simples |
| `home.testimonials.label` | Label da seção | simples |
| `home.testimonials.title` | Título da seção | **segmentado** |
| `home.testimonials.item_1_name` | Nome depoimento 1 | simples |
| `home.testimonials.item_1_role` | Cargo/descrição 1 | simples |
| `home.testimonials.item_1_text` | Texto do depoimento 1 | simples |
| `home.testimonials.item_2_name` | Nome depoimento 2 | simples |
| `home.testimonials.item_2_role` | Cargo/descrição 2 | simples |
| `home.testimonials.item_2_text` | Texto do depoimento 2 | simples |
| `home.testimonials.item_3_name` | Nome depoimento 3 | simples |
| `home.testimonials.item_3_role` | Cargo/descrição 3 | simples |
| `home.testimonials.item_3_text` | Texto do depoimento 3 | simples |
| `home.testimonials.item_4_name` | Nome depoimento 4 | simples |
| `home.testimonials.item_4_role` | Cargo/descrição 4 | simples |
| `home.testimonials.item_4_text` | Texto do depoimento 4 | simples |

### Página: Franquias

| Chave | Campo | Tipo padrão |
|-------|-------|-------------|
| `franquias.hero.badge` | Badge do topo | simples |
| `franquias.hero.title` | Título principal | **segmentado** |
| `franquias.hero.subtitle` | Subtítulo do hero | simples |
| `franquias.models.label` | Label da seção | simples |
| `franquias.models.title` | Título da seção | **segmentado** |
| `franquias.models.subtitle` | Subtítulo | simples |
| `franquias.vision.label` | Label da seção | simples |
| `franquias.vision.title` | Título da seção | **segmentado** |
| `franquias.vision.subtitle` | Subtítulo | simples |
| `franquias.contact.label` | Label da seção | simples |
| `franquias.contact.title` | Título da seção | simples |
| `franquias.contact.subtitle` | Subtítulo | simples |

### Página: Assinaturas

| Chave | Campo | Tipo padrão |
|-------|-------|-------------|
| `assinaturas.hero.badge` | Badge do topo | simples |
| `assinaturas.hero.title` | Título principal | **segmentado** |
| `assinaturas.hero.subtitle` | Subtítulo | **segmentado** |
| `assinaturas.membership.label` | Label da seção | simples |
| `assinaturas.membership.title` | Título da seção | simples |

*Total estimado: ~52 campos. O número final é confirmado na Fase 0.*

---

## Arquitetura de Arquivos

```
apps/api/src/modules/pageTexts/
├── catalog.ts          ← definição de todos os campos (chave, tipo, valor padrão, página, seção)
├── service.ts          ← get/set via tabela Setting
└── router.ts           ← 3 rotas (GET public, GET admin, PUT admin)

apps/api/src/routes/
└── admin.ts            ← adicionar: router.use('/page-texts', pageTextsRouter)
                        (e equivalente no public router)

apps/web/src/modules/public-site/
└── pageTexts.runtime.ts   ← hook usePageText(key), cache client-side

apps/web/src/components/ui/
└── RichText.tsx           ← renderer: string → <span> | TextSegment[] → <span className=...>

apps/web/src/modules/admin-page-texts/
├── components/
│   ├── AdminPageTextsView.tsx         ← tela principal (abas + acordeão)
│   ├── SegmentEditor.tsx              ← editor de segmentos (lista + dropdown + preview)
│   └── AdminPageTextsViewIsland.tsx   ← wrapper com Provider/fetch
└── index.ts

apps/web/src/components/pages/
└── AdminContent.tsx    ← adicionar item "Textos das Páginas" no sidebar
```

---

## Checklist de Execução

### Fase 0 — Catalogar (leitura dos componentes)
- [ ] Ler `HomeHeroSection.tsx` — mapear todos os campos de texto
- [ ] Ler `HomeAboutSection.tsx` — mapear campos
- [ ] Ler `HomeCtaSection.tsx` — mapear campos
- [ ] Ler `HomeMembershipSection.tsx` — mapear campos (labels da seção, não os planos)
- [ ] Ler `HomeServicesSection.tsx` — mapear campos (labels da seção, não os serviços)
- [ ] Ler `HomeTestimonialsSection.tsx` — mapear campos (depoimentos hardcoded)
- [ ] Ler `FranquiasHeroSection.tsx` — mapear campos
- [ ] Ler `FranquiasModelsSection.tsx` — mapear campos estáticos
- [ ] Ler `FranquiasVisionSection.tsx` — mapear campos
- [ ] Ler `FranquiasContactSection.tsx` — mapear labels estáticos
- [ ] Ler `AssinaturasHeroSection.tsx` — mapear campos
- [ ] Finalizar catálogo com contagem real de campos e valores padrão

### Fase 1 — Backend
- [ ] Criar `apps/api/src/modules/pageTexts/catalog.ts`
  - Array de `PageTextEntry[]` com `key`, `type`, `defaultValue`, `page`, `section`, `label`
- [ ] Criar `apps/api/src/modules/pageTexts/service.ts`
  - `getPageTexts()` — lê do banco, merge com defaults do catálogo
  - `updatePageTexts(data)` — valida chaves contra catálogo, salva no banco
- [ ] Criar `apps/api/src/modules/pageTexts/router.ts`
  - `GET /` — público, sem auth
  - `GET /admin` — requireAuth
  - `PUT /admin` — requireAdmin
- [ ] Registrar rotas em `apps/api/src/routes/admin.ts` (e public)
- [ ] Validar build: `npm run build` em `apps/api`

### Fase 2 — Frontend hook e renderer
- [ ] Criar `apps/web/src/modules/public-site/pageTexts.runtime.ts`
  - `fetchPageTexts()` — GET `/api/public/page-texts`
  - `PageTextsProvider` — React Context com cache
  - `usePageText(key)` — retorna `string | TextSegment[]`
- [ ] Criar `apps/web/src/components/ui/RichText.tsx`
  - `STYLE_CLASS_MAP` — mapa de StyleId → className
  - Se `string`: `<>{value}</>`
  - Se `TextSegment[]`: `<>{segments.map(s => <span className={...}>{s.text}</span>)}</>`
- [ ] Integrar `PageTextsProvider` no `PublicLayout` ou equivalente
- [ ] Validar build: `npm run build` em `apps/web`

### Fase 3 — Admin UI
- [ ] Criar `AdminPageTextsViewIsland.tsx`
  - Fetch `GET /api/admin/page-texts` + PUT para salvar
- [ ] Criar `SegmentEditor.tsx`
  - Lista de segmentos com `<input>` (texto) + `<select>` (estilo) + botão remover
  - Botão "Adicionar parte"
  - Preview inline: renderiza os segmentos com as classes reais
- [ ] Criar `AdminPageTextsView.tsx`
  - Abas no topo: Home | Franquias | Assinaturas
  - Acordeão por seção dentro de cada aba
  - Para campo simples: `<textarea>`
  - Para campo segmentado: `<SegmentEditor>`
  - Botão "Salvar alterações" por seção ou global
- [ ] Adicionar item "Textos das Páginas" no sidebar em `AdminContent.tsx`
- [ ] Validar build + testar no browser

### Fase 4 — Migração dos componentes
- [ ] `HomeHeroSection.tsx` — substituir textos por `usePageText()`
- [ ] `HomeAboutSection.tsx` — substituir textos
- [ ] `HomeCtaSection.tsx` — substituir textos
- [ ] `HomeMembershipSection.tsx` — substituir labels da seção
- [ ] `HomeServicesSection.tsx` — substituir labels da seção
- [ ] `HomeTestimonialsSection.tsx` — substituir depoimentos hardcoded
- [ ] `FranquiasHeroSection.tsx` — substituir textos
- [ ] `FranquiasModelsSection.tsx` — substituir textos estáticos
- [ ] `FranquiasVisionSection.tsx` — substituir textos
- [ ] `FranquiasContactSection.tsx` — substituir labels estáticos
- [ ] `AssinaturasHeroSection.tsx` — substituir textos
- [ ] Confirmar: nenhum texto de marketing hardcoded restante nos componentes

### Fase 5 — Seed e defaults
- [ ] Verificar se `seed.ts` já inicializa `pageTexts` com os valores padrão
- [ ] Se não: adicionar bloco `upsert` para `public.pageTexts` em `seed.ts`
- [ ] Testar `docker compose down -v && docker compose up -d` — site deve renderizar com textos corretos desde o boot

---

## Critérios de Validação

| Critério | Como validar |
|----------|-------------|
| Textos carregam da API | DevTools > Network: `GET /api/public/page-texts` retorna JSON com todos os campos |
| Segmentos renderizam com estilo | "Eternizada" aparece com gradiente dourado no hero |
| Fallback funciona | Remover chave do banco → componente usa valor padrão do catálogo |
| Admin salva e reflete | Editar um campo no Admin → recarregar página pública → texto atualizado |
| Editor de segmentos funciona | Adicionar/remover parte, trocar estilo, preview correto |
| Nenhum texto hardcoded | `grep -r '"Redefinindo\|Eternizada\|Sua melhor versão\|Convite Exclusivo'` apps/web/src/modules/public-site → zero resultados |
| Build limpo | `npm run build` em api e web sem erros |

---

## Notas de Risco

1. **Fallback obrigatório:** o hook `usePageText` deve retornar o valor padrão do catálogo
   se a chave não existir no banco — garante que o site não quebra numa instalação limpa.
2. **Cache client-side:** igual ao `mediaSlots`, evitar refetch a cada render.
   Usar um Provider no nível do layout com fetch único por sessão.
3. **Textos com `branding.fullName`:** alguns parágrafos do About usam
   `branding.fullName` interpolado (`A ${branding.fullName} é uma marca...`).
   Esses textos precisam continuar usando branding — não substituir a interpolação,
   apenas tornar o template editável com `{fullName}` como placeholder.

---

## Sumário de Execução (2026-06-11)

### Arquivos criados
- `apps/api/src/modules/pageTexts/catalog.ts` — 129 entradas, 3 páginas
- `apps/api/src/modules/pageTexts/service.ts` — cache TTL 5 min, upsert no banco
- `apps/api/src/routes/admin.ts` — 3 rotas novas (GET public, GET admin, PUT admin)
- `apps/web/src/modules/public-site/pageTexts.ts` — tipos + STYLE_CLASS_MAP + resolveText
- `apps/web/src/modules/public-site/pageTexts.runtime.ts` — usePageTexts/usePageText hooks
- `apps/web/src/components/ui/RichText.tsx` — renderer string | TextSegment[]
- `apps/web/src/modules/admin-page-texts/components/SegmentEditor.tsx`
- `apps/web/src/modules/admin-page-texts/components/AdminPageTextsView.tsx`
- `apps/web/src/modules/admin-page-texts/components/AdminPageTextsViewIsland.tsx`
- `apps/web/src/modules/admin-page-texts/index.ts`

### Arquivos modificados
- `apps/web/src/components/pages/AdminContent.tsx` — sidebar "Textos" + view panel
- `apps/web/src/pages/Admin.tsx` — <AdminPageTextsViewIsland />
- `apps/api/prisma/seed.ts` — seed `public.pageTexts` com defaults do catálogo
- 11 componentes de seção migrados para usePageText() + RichText

### TypeScript
- Ambos os apps (api + web) compilam com zero erros.

## Git Record of Delivery

### Step 1 — Pre-commit review ✅

**Arquivos alterados neste plano + sessão de fechamento:**

| Arquivo | Alteração |
|---------|-----------|
| `apps/api/src/modules/pageTexts/catalog.ts` | criado — 129 entradas, 4 páginas (home/franquias/assinaturas/global) |
| `apps/api/src/modules/pageTexts/service.ts` | criado + histórico Opção A (snapshot anterior) |
| `apps/api/src/routes/admin.ts` | 5 rotas pageTexts + 2 rotas history (GET previous, POST restore) |
| `apps/web/src/modules/public-site/pageTexts.ts` | criado — tipos + STYLE_CLASS_MAP |
| `apps/web/src/modules/public-site/pageTexts.runtime.ts` | criado + remoção de `pageTextsVersion` (lint) |
| `apps/web/src/components/ui/RichText.tsx` | criado + suporte a `\n` → `<br />` |
| `apps/web/src/modules/admin-page-texts/` | criado — AdminPageTextsView, SegmentEditor, Island |
| `apps/web/src/modules/admin-page-texts/components/AdminPageTextsView.tsx` | histórico UI (hasPrevious, handleRestore) |
| `apps/web/src/modules/admin-media-gallery/components/AdminMediaGalleryView.tsx` | Masonry Grid 4 colunas (Flowbite pattern) |

**Validações executadas:**
- `apps/api`: `npm run build` → PASS (zero erros TypeScript)
- `apps/web`: `npm run lint` → PASS (zero erros)
- `apps/web`: `npm run build` → PASS

**Funcionalidades validadas pelo usuário:**
- Editor de textos (129 campos, 4 páginas, abas + acordeão) ✅
- Segmentos estilizados (gold-gradient, bold, etc.) ✅
- Quebra de linha via `\n` no textarea ✅
- Histórico: restaurar versão anterior ✅
- Galeria Admin: Masonry Grid 4 colunas, legenda abaixo ✅

- [ ] Step 2 — Commit authorization: aguardando confirmação explícita do usuário
- [ ] Step 3 — Commit confirmation: hash / branch / mensagem / estatísticas
- [ ] Step 4 — Push authorization e resultado
- Push status: PENDING
