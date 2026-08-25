# DECISION-020 — Múltiplos `<h1>` nas páginas públicas são intencionais (arquitetura de seções independentes)

Status: ACTIVE
Date: 2026-08-24

## Contexto

O `seo_checker.py` (rodado via `.sfk/kernel/scripts/checklist.py` numa sessão de
auditoria geral, fora do escopo do `admin-v2`) apontou "Multiple H1 tags (3)" em
`HomeProductsSection.tsx` — 3 `<h1>` no arquivo (nome do produto em destaque, eyebrow
da coleção, título "Coleção Completa"), somados ao `<h1>` legítimo de
`HomeHeroSection.tsx`, resultando em 4 `<h1>` na mesma página `/` renderizada.
Investigação técnica confirmou o achado (não é falso positivo — as seções realmente
renderizam juntas por padrão) e propôs correção (rebaixar pra `h2`/`p`, mesmo padrão
já usado em `HomeCtaSection.tsx` pro eyebrow). O usuário rejeitou a correção.

## Decisão

**Não corrigir.** As páginas públicas deste projeto são compostas por **seções
independentes** (`apps/web/src/modules/public-site/sections/*.tsx`), montadas via
toggles (`homeSections.*`) e reordenáveis/ativáveis individualmente pelo Admin V2.
Cada seção pode legitimamente ter seu próprio `<h1>` — múltiplos `<h1>` na página
composta final é uma **consequência intencional e aceita** dessa arquitetura, não um
bug de acessibilidade/SEO a ser corrigido caso a caso.

## Consequences

- `HomeProductsSection.tsx` (linhas 260, 343, 344) permanece com os 3 `<h1>` como
  estão — nenhuma mudança de código.
- Achados futuros de "múltiplos H1" em `seo_checker.py` ou ferramentas equivalentes,
  **dentro de `apps/web/src/modules/public-site/sections/`**, devem ser tratados
  como ruído esperado desta decisão, não reabertos como bug — a menos que o usuário
  peça uma revisão explícita da arquitetura de seções em si.
- Esta decisão é específica de `public-site/sections/` — não se estende
  automaticamente a outras áreas (ex.: Admin V2, onde cada tela é uma página real de
  SPA, não uma composição de seções independentes).
