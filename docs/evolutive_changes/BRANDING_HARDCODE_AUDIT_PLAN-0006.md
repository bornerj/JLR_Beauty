# Branding Hardcode Audit (PLAN-0006)

Data: 2026-02-27
Objetivo: mapear e classificar ocorrencias de marca hardcoded para migracao para branding dinamico.

## Classificacao por risco

- Alto risco (layout estrutural + alta visibilidade):
  - `apps/web/src/modules/menu/components/PublicMenu.tsx`
  - `apps/web/src/modules/menu/components/FranquiasMenu.tsx`
  - `apps/web/src/modules/footer/components/PublicSiteFooter.tsx`
  - `apps/web/src/components/pages/AdminContent.tsx`
  - Status: migrado para `useBranding()` (`fullName`, `shortName`, `logoUrl`).

- Medio risco (conteudo institucional/publico):
  - `apps/web/src/modules/public-site/sections/HomeTestimonialsSection.tsx`
  - `apps/web/src/modules/public-site/sections/HomeProductsSection.tsx`
  - `apps/web/src/modules/public-site/sections/HomeAboutSection.tsx`
  - `apps/web/src/modules/public-site/sections/FranquiasHeroSection.tsx`
  - `apps/web/src/modules/public-site/sections/FranquiasContactSection.tsx`
  - Status: migrado para `useBranding()`.

- Medio risco (fluxo funcional com reflexo visual):
  - `apps/web/src/modules/public-site/index.behavior.ts` (imagem de item de assinatura no carrinho)
  - `apps/api/src/modules/chatbot/flow/conciergeFlow.ts` (titulo de resumo)
  - Status: migrado para snapshot/runtime de branding no frontend e service de branding no backend.

- Baixo risco (texto interno admin):
  - `apps/web/src/modules/admin-products/components/AdminProductsView.tsx`
  - Status: migrado para `useBranding()`.

## Exclusoes intencionais (whitelist tecnica)

- Defaults/fallbacks de configuracao (nao exibicao hardcoded final):
  - `apps/api/src/modules/branding/service.ts`
  - `apps/web/src/modules/public-site/branding.ts`
- Placeholder tecnico de SKU:
  - `apps/web/src/modules/admin-products/components/AdminProductsView.tsx` (`JLR-ARG-01`)
- Identificadores tecnicos legados (`jlr:*` em eventos/keys) mantidos por compatibilidade de comportamento.

## Resultado

- Todos os pontos de exibicao de marca mapeados no audit foram centralizados para branding dinamico.
- Fonte unica de leitura no frontend: `apps/web/src/modules/public-site/branding.runtime.ts`.
- Fonte unica de persistencia/leitura no backend: `apps/api/src/modules/branding/service.ts`.

