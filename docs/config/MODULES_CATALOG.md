# Modules Catalog

Catalogo atualizado da estrutura modular em runtime.
Data de referencia: 2026-02-26.

## Frontend (`apps/web/src/modules`)
1. `menu`
   - `components/PublicMenu.tsx`
   - `components/FranquiasMenu.tsx`
   - `components/NavStatusActions.tsx`
   - `hooks/useAuthStatus.ts`
   - `hooks/useDbHealthStatus.ts`
   - Responsabilidade: navegacao publica e status de sessao/saude.
2. `footer`
   - `components/PublicSiteFooter.tsx`
   - Responsabilidade: rodape do site publico.
3. `public-site`
   - `index.behavior.ts`
   - `auth.behavior.ts`
   - `video.behavior.ts`
   - `branding.ts`
   - `branding.runtime.ts`
   - `mediaSlots.ts`
   - `media.runtime.ts`
   - `sectionToggles.ts`
   - `sectionToggles.runtime.ts`
   - `sections/*Section.tsx` + `sections/index.ts`
   - Responsabilidade: comportamento operacional das rotas publicas, composicao por secoes, branding global, slots de midia e toggles de exibicao em runtime.
4. `cart`
   - `store.ts`
   - Responsabilidade: estado de carrinho no frontend e sincronizacao entre telas publicas/checkout.
5. `admin-core`
   - `behavior.ts`
   - Responsabilidade: bootstrap central do Admin.
6. `admin-shell`
   - `behavior.ts`
   - Responsabilidade: navegacao de views e modais do shell admin.
7. `admin-dashboard`
   - `components/AdminDashboardView.tsx`
   - `components/AdminDashboardViewIsland.tsx`
   - Responsabilidade: estrutura React da view principal do dashboard.
8. `admin-kpis`
   - `api/client.ts`
   - `components/AdminDashboard*Kpi*/Sales/Agenda/Commissions*.tsx`
   - `types.ts`
   - Responsabilidade: contrato e renderizacao dos KPI reais do dashboard.
9. `admin-people`
   - `behavior.ts`
   - `components/AdminPeopleView.tsx`
   - `components/AdminPeopleViewIsland.tsx`
   - Responsabilidade: clientes, profissionais e usuarios.
10. `admin-services`
   - `behavior.ts`
   - `components/AdminServicesView.tsx`
   - `components/AdminServicesViewIsland.tsx`
   - Responsabilidade: CRUD de servicos.
11. `admin-products`
   - `behavior.ts`
   - `components/AdminProductsView.tsx`
   - `components/AdminProductsViewIsland.tsx`
   - Responsabilidade: CRUD de produtos.
12. `admin-subscribers`
   - `behavior.ts`
   - `components/AdminSubscribersView.tsx`
   - `components/AdminSubscribersViewIsland.tsx`
   - Responsabilidade: assinantes/assinaturas.
13. `admin-schedule`
   - `behavior.ts`
   - `components/AdminScheduleView.tsx`
   - `components/AdminScheduleViewIsland.tsx`
   - Responsabilidade: agenda, escalas e vinculos profissional-servico.
14. `admin-whatsapp-contacts`
   - `behavior.ts`
   - `components/AdminWhatsappContactsView.tsx`
   - `components/AdminWhatsappContactsViewIsland.tsx`
   - Responsabilidade: sessoes WhatsApp e configuracoes em `/api/settings/:key`.
15. `admin-section-toggles`
   - `components/AdminSectionTogglesView.tsx`
   - `components/AdminSectionTogglesViewIsland.tsx`
   - `index.ts`
   - Responsabilidade: tela `Secoes SPA` para ligar/desligar secoes publicas com persistencia em `settings`.
16. `admin-discount-coupons`
   - `components/AdminDiscountCouponsView.tsx`
   - `components/AdminDiscountCouponsViewIsland.tsx`
   - `index.ts`
   - Responsabilidade: gestao de cupons de desconto no Admin.
17. `admin-branding`
   - `components/AdminBrandingView.tsx`
   - `components/AdminBrandingViewIsland.tsx`
   - `index.ts`
   - Responsabilidade: gestao do branding global (`fullName`, `shortName`, `logoUrl`) com persistencia em `settings`.
18. `admin-media-gallery`
   - `components/AdminMediaGalleryView.tsx`
   - `components/AdminMediaGalleryViewIsland.tsx`
   - `index.ts`
   - Responsabilidade: gestao do catalogo institucional de imagens por slot (`settings.public.mediaSlots`) com upload/reversao.
19. `admin-goals`
   - `components/AdminGoalsView.tsx`
   - `components/AdminGoalsViewIsland.tsx`
   - Responsabilidade: metas.
20. `admin-performance`
   - `components/AdminPerformanceView.tsx`
   - `components/AdminPerformanceViewIsland.tsx`
   - Responsabilidade: performance.
21. `admin-plans`
   - `components/AdminPlansView.tsx`
   - `components/AdminPlansViewIsland.tsx`
   - Responsabilidade: planos.
22. `admin-sales`
   - `components/AdminSalesView.tsx`
   - `components/AdminSalesViewIsland.tsx`
   - Responsabilidade: vendas.
23. `admin-tests`
   - `behavior.ts`
   - `components/AdminTestsView.tsx`
   - `components/AdminTestsViewIsland.tsx`
   - Responsabilidade: suite de testes internos da tela admin.
24. `admin-leads`
   - `behavior.ts`
   - Responsabilidade: filtros/paginacao/atualizacao de leads.
25. `admin-orders`
   - `behavior.ts`
   - Responsabilidade: filtros/paginacao/atualizacao de pedidos.
26. `chatbot`
   - `api/client.ts`
   - `types.ts`
   - `README.md`
   - Responsabilidade: contrato frontend para fluxo de concierge.

## Backend (`apps/api/src/modules`)
1. `chatbot`
   - `flow/conciergeFlow.ts`
   - `opening/conciergeOpening.ts`
   - `inbox/conciergeInbox.ts`
   - `retention/conciergeRetention.ts`
   - `integrations/zapi.ts`
   - Responsabilidade: fluxo concierge (site/WhatsApp), inbox e retencao.
2. `admin/kpis`
   - `dashboardKpis.ts`
   - `dashboardSalesSeries.ts`
   - `dashboardAgendaSummary.ts`
   - `dashboardCommissionsSummary.ts`
   - `period.ts`
   - `index.ts`
   - Responsabilidade: agregacoes KPI para o dashboard admin.
3. `branding`
   - `service.ts`
   - Responsabilidade: leitura/escrita de branding global com cache TTL em memoria e persistencia em `settings`.
4. `mediaSlots`
   - `service.ts`
   - Responsabilidade: catalogo de slots institucionais de imagem, leitura/escrita com cache TTL e persistencia em `settings.public.mediaSlots`.

## Endpoints estruturais relevantes (fora de `modules`)
1. `apps/api/src/routes/index.ts`
   - `/api/admin/section-toggles` (GET/PUT)
   - `/api/public/section-toggles` (GET)
   - `/api/admin/branding` (GET/PUT)
   - `/api/public/branding` (GET)
   - `/api/admin/media-slots` (GET/PUT)
   - `/api/public/media-slots` (GET)
   - Responsabilidade: contratos de toggles, branding global e media slots institucionais com persistencia em `settings`.

## Shared Frontend (`apps/web/src/shared`)
1. `dom.ts`
   - Responsabilidade: helpers de eventos/cleanup para behaviors.
2. `usePortalTarget.ts`
   - Responsabilidade: resolve/alinha targets de portal para islands.

## Compatibilidade atual
1. Frontend
   - wrappers em `apps/web/src/components/public/*` ainda existem para composicao/layout.
2. Backend
   - wrappers de compatibilidade permanecem em `apps/api/src/lib/concierge*.ts` e `apps/api/src/lib/zapi.ts`.

## Pendencias abertas
1. Limpeza fisica definitiva de artefatos legados neutralizados (`cms/*`, `data/content*`) em ambiente com permissao de exclusao.
2. Opcional de saneamento de schema: migrar a tabela fisica de `ContentEntry` para `Setting` (hoje o model Prisma `Setting` usa `@@map("ContentEntry")` para compatibilidade).
3. Rodar homologacao E2E completa do admin apos ultima rodada de limpeza (principalmente pessoas, dashboard, `Secoes SPA` e WhatsApp).
