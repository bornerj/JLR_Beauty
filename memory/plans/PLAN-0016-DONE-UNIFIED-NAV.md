# PLAN-0016 — Unified Navigation Menu
# Menu consistente e coerente nas três telas SPA (Home, Assinaturas, Franquias)

**Status:** DONE
**Criado em:** 2026-06-20
**Agente:** frontend-architect

---

## Objetivo

Unificar o menu de navegação das três telas SPA (Home, Assinaturas, Franquias) em um único
componente — com o visual da tela principal (Home) como base — e atualizar os dropdowns para
refletir as seções reais de cada página (especialmente Franquias, que agora tem 18 seções).

---

## STAR

### SITUATION — Estado atual

| Componente | Usado em | Problema |
|------------|----------|---------|
| `PublicMenu.tsx` | Home + Assinaturas | Sem dropdown para seções de Assinaturas |
| `FranquiasMenu.tsx` | Franquias | Dropdown com 3 anchors obsoletos (`#models`, `#vision`, `#contact`) — Franquias agora tem 18 seções |
| `PublicLayout.tsx` | Todas | Branch `isFranquias` rende nav diferente |
| `MissionSection.tsx` | Franquias + Assinaturas | Sem `id=` — não pode ser linkada por anchor |

**Inconsistências detectadas entre os dois menus:**
- `Colecao` (PublicMenu) vs `Coleção` (FranquiasMenu) — typo no PublicMenu
- Mobile menu do FranquiasMenu tem itens diferentes do PublicMenu
- CTA do dropdown JLR Beauty: `text-forest` (PublicMenu) vs `text-black` (FranquiasMenu)

**Seções reais de cada página (mapa completo):**

| Página | Seções com anchor | Seções sem anchor |
|--------|-------------------|-------------------|
| Home | `#services`, `#about`, `#spotlightprod`, `#products`, `#Colecao`, `#testimonials`, `#membership` | — |
| Assinaturas | `#membership`, `#about`, `#testimonials` | Hero, MissionSection (sem id) |
| Franquias | `#about`, `#vision`, `#founder`, `#benefits`, `#models`, `#fran01`, `#fran02`, `#fran03`, `#gestao-app`, `#fluxo-caixa`, `#marketing-crm`, `#expansao`, `#perfil-franqueado`, `#suporte-franqueadora`, `#etapas-abertura`, `#contact` | Hero, MissionSection (sem id) |

### TASK

1. Criar um único componente de nav (`UnifiedNav`) com o visual/estrutura de `PublicMenu` como base
2. Atualizar dropdown **Assinaturas** com anchors internos da página `/assinaturas`
3. Atualizar dropdown **Franquias** com ~7 anchors de landmark (não todos os 18 — UX first)
4. Corrigir inconsistências visuais entre os menus
5. Adicionar `id="mission"` em `MissionSection.tsx`
6. Simplificar `PublicLayout.tsx` — remover branch `isFranquias`, usar um único nav
7. Atualizar mobile menu unificado

### ACTION — Etapas de execução

Ver seção de checklist abaixo.

### RESULT

- Um único arquivo de nav (sem código duplicado)
- Os três menus visuais idênticos em estrutura e estilo
- Dropdown de Assinaturas com 3 anchors de seção
- Dropdown de Franquias com 7 anchors de landmark agrupados
- `MissionSection` navegável por anchor
- Mobile menu cobre as três páginas

---

## Estrutura do Nav Unificado (proposta)

### Desktop — top-level (da esquerda para direita)

```
[Logo] | [JLR Beauty ▾] | [ASSINATURAS ▾] | [FRANQUIAS ▾] | [Produtos ▾] | [NavStatusActions]
```

### Dropdown: JLR Beauty (sem mudança de conteúdo, corrigir CTA)

| Item | Ícone | Destino |
|------|-------|---------|
| Tratamentos | `spa` | `/#services` |
| Assinaturas | `card_membership` | `/assinaturas` |
| Quem Somos | `storefront` | `/#about` |
| Depoimentos | `reviews` | `/#testimonials` |
| CTA 1: `[shortName]` | — | `/` |
| CTA 2: `Contato` | — | `/#contact` |

### Dropdown: ASSINATURAS (NOVO)

| Item | Ícone | Destino |
|------|-------|---------|
| Planos & Benefícios | `card_membership` | `/assinaturas#membership` |
| Quem Somos | `storefront` | `/assinaturas#about` |
| Depoimentos | `reviews` | `/assinaturas#testimonials` |
| CTA: `Ver Planos` | — | `/assinaturas` |

### Dropdown: FRANQUIAS (RENOVADO — 7 landmarks)

| Item | Ícone | Destino | Descrição |
|------|-------|---------|-----------|
| Sobre a Marca | `storefront` | `/franquias#about` | História, visão e propósito |
| Nossos Modelos | `domain` | `/franquias#models` | Master, Prime e Essencial |
| Tecnologia & Gestão | `phone_iphone` | `/franquias#gestao-app` | App de gestão da franquia |
| Fluxo de Caixa | `trending_up` | `/franquias#fluxo-caixa` | Projeções e retorno |
| Perfil do Franqueado | `person_check` | `/franquias#perfil-franqueado` | A quem se destina |
| Etapas de Abertura | `checklist` | `/franquias#etapas-abertura` | Passo a passo |
| Seja Parceiro | `handshake` | `/franquias#contact` | Formulário de contato |
| CTA 1: `Oportunidade` | — | `/franquias` |
| CTA 2: `Seja Parceiro` | — | `/franquias#contact` |

### Dropdown: Produtos (sem mudança — apenas corrigir typo `Colecao` → `Coleção`)

### Mobile menu (unificado)

```
Tratamentos → /#services
Assinaturas → /assinaturas
  Planos & Benefícios → /assinaturas#membership
  Depoimentos → /assinaturas#testimonials
Franquias → /franquias
  Sobre a Marca → /franquias#about
  Nossos Modelos → /franquias#models
  Tecnologia & Gestão → /franquias#gestao-app
  Perfil do Franqueado → /franquias#perfil-franqueado
  Etapas de Abertura → /franquias#etapas-abertura
  Seja Parceiro → /franquias#contact
Produtos → /#products
Contato → /#contact
```

---

## Checklist de Execução

### Fase 1 — MissionSection (pré-requisito)
- [x] `MissionSection.tsx`: adicionar `id="mission"` no `<section>`

### Fase 2 — UnifiedNav
- [x] Reescrever `apps/web/src/modules/menu/components/PublicMenu.tsx` como `UnifiedNav`
  - Dropdown JLR Beauty: CTA `text-forest` consistente
  - Dropdown ASSINATURAS: adicionado (3 anchors + 1 CTA)
  - Dropdown FRANQUIAS: renovado (7 landmarks + 2 CTAs)
  - Dropdown Produtos: typo `Colecao` → `Coleção` corrigido
  - Mobile menu: unificado com seções agrupadas (Salão / Assinaturas / Franquias / Produtos)
- [x] `apps/web/src/modules/menu/components/FranquiasMenu.tsx`: re-export de 1 linha
- [x] `apps/web/src/app/layouts/PublicLayout.tsx`: branch `isFranquias` removido; `<PublicNav />` único

### Fase 3 — Validação
- [x] TypeScript API: PASS (zero erros)
- [x] Build web: PASS — vite 34.79s

---

## Arquivos Alterados (estimativa)

| Arquivo | Tipo de mudança |
|---------|----------------|
| `apps/web/src/modules/menu/components/PublicMenu.tsx` | Rewrite — UnifiedNav |
| `apps/web/src/modules/menu/components/FranquiasMenu.tsx` | Simplificar — re-export |
| `apps/web/src/app/layouts/PublicLayout.tsx` | Remover branch isFranquias |
| `apps/web/src/modules/public-site/sections/MissionSection.tsx` | Adicionar id="mission" |

**Total: 4 arquivos** — escopo ponto-a-ponto, sem novos arquivos, sem mudança de rotas.

---

## Classificação de Escopo

**STRUCTURAL** → PLAN obrigatório (afeta componente compartilhado entre 3 páginas + layout raiz).

---

## Git Record of Delivery

- Step 1 (Pre-commit review): _pendente_
- Step 2 (Commit authorization): _pendente_
- Step 3 (Commit confirmation): _pendente_
- Step 4 (Push authorization and result): _pendente_
- Push status: PENDING
