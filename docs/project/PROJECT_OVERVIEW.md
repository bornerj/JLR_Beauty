# Project Overview

## Summary
- Monorepo with active **backend** (`apps/api`) and **frontend** (`apps/web`) running in normal dev mode.
- Backend: Express + Prisma + MySQL with Zod validation and JWT auth.
- Frontend: Vite + React modular (SPA como fonte principal; sem dependencia operacional de HTML legado no runtime).
- Conteudo do frontend React e definido no codigo/fonte (sem pipeline mini-CMS por atributos HTML).
- Agenda, disponibilidade, concierge (web/WhatsApp) e operacao de agendamentos sao implementados internamente no aplicativo (backend + banco proprios).

## Current Status (2026-02-25)
- Admin SPA at `http://localhost:5174/admin` renders through React components (`apps/web/src/pages/Admin.tsx` + `apps/web/src/components/pages/AdminContent.tsx`), including admin views as TSX modules, and binds modular behaviors from `apps/web/src/modules/admin-core/behavior.ts` (sem acoplamento direto a `legacy/*.behavior`).
- Rotas publicas principais (`/`, `/franquias`, `/assinaturas`) renderizam conteudo em TSX nativo nos componentes `apps/web/src/components/pages/*Content.tsx`; a rota `/checkout` atua como alias/redirecionamento para `/?checkout=1`.
- API + UI are wired to the database for products, services, memberships, orders, leads, subscriptions, agenda/concierge e operacao de atendimento via WhatsApp (Z-API).
- Branding global da aplicacao agora e dinamico via `settings` (`public.branding`), consumido por runtime store no frontend e editavel por tela Admin dedicada.
- Agenda interna cobre unidades, vinculo profissional-servico, escalas por data, calculo de disponibilidade, reserva de slots e lista de espera.
- Concierge (WEB/WHATSAPP) persiste sessoes e eventos, gera/resume agendamento e alimenta a operacao/admin de atendimento.
- Product/service catalogs now have separate categories and statuses in the database schema.
- Upload endpoint is available at `/api/uploads` with local storage under `apps/api/uploads` and static serving at `/uploads`.
- Legacy root HTML files (`admin.html`, `index_base.html`, `franquias.html`, `checkout.html`) are not present in the current workspace.
- `docs/config/INTEGRATIONS.md` atualmente cobre apenas o fluxo WhatsApp (Z-API).
- Existem endpoints placeholder para provedores externos (`/trinx/*`) e mock de pagamento, mas eles nao compoem o fluxo principal de agenda atual.
- Pending verification: user avatar upload/save flow in the admin UI still needs confirmation in the running environment.

## Pages (Entry Points)
- React entry points (Vite):
  - `apps/web/index.html` -> `apps/web/src/main.tsx`
- SPA route aliases/compatibility:
  - `/admin.html` redirects to `/admin`
  - `/checkout` redirects to `/?checkout=1`

## Assets & Data
- `images/`: Local brand images (logo etc.).
- `documentations/`: snapshots SQL e seeds de referencia para estrutura/dados operacionais.
  - `documentations/db_sql.sql`: snapshot estrutural legado/parcial (nem sempre reflete todas as evolucoes recentes do schema Prisma).
  - `documentations/seed_carnaval.sql` e `documentations/seed_carnaval_data_only*.sql`: snapshots mais ricos com dados de agenda, slots, escalas e concierge.

## Apps (Current)
- `apps/api`: Express API (TypeScript) with Prisma + MySQL.
  - Auth: `/auth/login`, `/auth/register`, `/auth/me`.
  - Protected routes use `requireAuth` / `requireAdmin`.
- `apps/web`: Vite + React frontend modular com rotas publicas e Admin em TSX nativo.
- `apps/web`: nao ha `src/legacy` ou `src/templates` no workspace atual; o runtime ativo e baseado em TSX + modulos.

## Styling & Build (Current Snapshot)
- `tailwind.config.js`: Tailwind config (colors, fonts, radius).
- Legacy root Tailwind artifacts (`tailwind.input.css`, `tailwind.css`, `compile_tailwind.ps1`, `compile_tailwind.bat`) are not present in the current workspace snapshot.

## Runtime Settings
- Configuracoes operacionais (ex.: fluxo WhatsApp) sao persistidas via model Prisma `Setting` (mapeado para a tabela fisica `ContentEntry` com `@@map` para compatibilidade de dados).
- API administrativa para essas configuracoes:
  - `GET /api/settings`
  - `GET /api/settings/:key`
  - `PUT /api/settings/:key`
- Exemplos de chaves operacionais vistas nos seeds: `whatsapp_flow_category_first`, `whatsapp_opening_greeting_text`, `whatsapp_completion_greeting_text`.
- Chaves publicas de runtime em uso na camada web:
  - `public.sectionToggles` (secoes SPA)
  - `public.branding` (`fullName`, `shortName`, `logoUrl`).

### Branding Global (2026-02-27)
- Backend:
  - `GET /api/admin/branding`
  - `PUT /api/admin/branding`
  - `GET /api/public/branding`
  - cache TTL em memoria por instancia no service de branding.
- Frontend:
  - runtime store: `apps/web/src/modules/public-site/branding.runtime.ts` (bootstrap/fetch unico por carregamento)
  - defaults/tipo: `apps/web/src/modules/public-site/branding.ts`
  - consumo em componentes estruturais (menus, footer, heros e header admin).
- Admin:
  - modulo `admin-branding` para manutencao de nome completo, nome curto e logo URL.

## Agenda & Concierge (Scheduling Interno)

### Modelo de dados (Prisma / MySQL)
- `Unit`: unidades com janela operacional (`hourStart`, `hourFinish`) e relacionamento com profissionais, agendamentos, slots, waitlist e sessoes de concierge.
- `Professional`: profissional vinculado a `User`, unidade, perfil de trabalho e perfil de comissao.
- `ProfessionalService`: matriz N:N que define quais servicos cada profissional pode executar.
- `ProfessionalShift`: escalas por data (`workDate`) com `hourStart`, `hourFinish`, `isActive` e indices para busca por unidade/profissional.
- `Appointment`: agendamento principal com unidade, profissional, servico, cliente (opcional), pedido (opcional), horario e status.
- `AppointmentSlot`: bloqueio granular por slot (unico por `unitId + professionalId + slotStart`) para evitar concorrencia/overbooking.
- `AppointmentWaitlistMessage`: lista de espera por unidade/data/servico/cliente.
- `ConciergeSession` e `ConciergeEvent`: historico de atendimento (WEB/WHATSAPP), passo atual, dados selecionados e trilha de mensagens.

### Motor de disponibilidade e reserva
- Implementado em `apps/api/src/lib/appointmentAvailability.ts`.
- Janela publica de agenda usa slots de `30` minutos (`SLOT_DURATION_MIN = 30`) e contexto padrao de `14` dias (`DEFAULT_SCHEDULE_DAYS = 14`).
- Periodos de disponibilidade expostos: `MORNING`, `AFTERNOON`, `EVENING`.
- A disponibilidade considera:
  - horario da unidade (`Unit.hourStart/hourFinish`);
  - duracao real do servico (`Service.durationMin`);
  - elegibilidade por matriz `ProfessionalService`;
  - escalas ativas em `ProfessionalShift`;
  - bloqueios em `AppointmentSlot`;
  - sobreposicao com agendamentos legados (`Appointment`) ainda sem slots completos.
- Criacao de agendamento (`createRemoteAppointment`) aloca profissional elegivel/ disponível, cria `Appointment` e gera `AppointmentSlot` em transacao.

### Fluxos publicos (Web Concierge)
- Endpoints publicos de agendamento/concierge:
  - `GET /api/public/concierge/options`
  - `GET /api/public/concierge/booking-context`
  - `GET /api/public/concierge/services`
  - `GET /api/public/concierge/periods`
  - `GET /api/public/concierge/slots`
  - `GET /api/public/concierge/slot-professionals`
  - `POST /api/public/concierge/book`
  - `POST /api/public/concierge/waitlist`
  - `POST /api/public/concierge/complete`
  - `POST /api/public/concierge/whatsapp-summary`
- O fluxo web concierge guia: servico -> unidade -> data -> periodo/slot -> (profissional, quando aplicavel) -> nome/telefone -> criacao de agendamento ou waitlist.

### Fluxos de atendimento (WhatsApp / Z-API)
- Webhook de entrada: `GET/POST /api/public/webhooks/zapi`.
- Seguranca do webhook com segredo (`ZAPI_WEBHOOK_SECRET`) via header `x-zapi-secret` ou query `secret`.
- Mensagens recebidas sao persistidas/encaminhadas para o fluxo de concierge WhatsApp, que atualiza `ConciergeSession`/`ConciergeEvent`.
- O fluxo persiste passo atual (`ConciergeStep`: `SERVICE`, `UNIT`, `DATE`, `SLOT`, `NAME`, `COMPLETED`) e origem (`WEB`/`WHATSAPP`).
- Resumos e confirmacoes podem ser enviados via Z-API (`sendZApiTextMessage`) e auditados no historico de eventos.

### Operacao Admin (Agenda / Atendimento)
- Endpoints administrativos de agenda e atendimento:
  - `GET/POST/PATCH /api/appointments`
  - `GET/POST/PATCH/DELETE /api/professional-shifts`
  - `GET /api/concierge/inbox`
  - `GET /api/concierge/sessions`
  - `GET /api/concierge/waitlist`
- Regras de negocio ja aplicadas:
  - criacao de agendamento admin reutiliza o mesmo motor de disponibilidade/slots;
  - confirmacao de agendamento exige pedido vinculado e pagamento aprovado (ao atualizar status para `CONFIRMED`);
  - filtros por datas/status/search para sessoes concierge e waitlist.

### Evidencias nos snapshots SQL (`documentations/`)
- `seed_carnaval.sql` demonstra dados operacionais reais de agenda/concierge, incluindo:
  - unidades com horarios (`hourStart/hourFinish`);
  - profissionais, matriz `professionalservice` e escalas `professionalshift`;
  - `appointment` + `appointmentslot` (bloqueio granular);
  - `conciergesession` + `conciergeevent` com trilha de mensagens WHATSAPP/WEB;
  - configuracoes de fluxo WhatsApp em `contententry`.
- Os comentarios do seed mostram volumes aproximados de referencia (ex.: dezenas/centenas de eventos, slots e escalas), reforcando que a agenda interna ja esta operacional e modelada.

## UI Behaviors (Current)
- Public-site interactions (cart, concierge, CTA bindings, filters/UX flows) run through React + modular behavior files, primarily `apps/web/src/modules/public-site/index.behavior.ts`.
- Admin interactions (CRUD helpers, tests, WhatsApp contacts/auditoria, settings bindings) run through `apps/web/src/modules/admin-*/behavior.ts`.
- Admin forms for services/users support image/avatar handling and previews in the React admin flow.

## Change Log
- `memory/MODIFICATION_LOG.md`: chronological record of modifications starting 2026-01-27 (latest entries at the bottom of the file).
- Recent highlights:
  - 2026-01-30: role MASTER + guards, admin role management UI/API, and “Acesso restrito” notice on index.
  - 2026-01-30: confirmation logged that changes are being documented.
- `docs/config/INTEGRATIONS.md`: active integration contract doc focused on WhatsApp (Z-API).
- `docs/config/DEPLOY_ENV_REFERENCE.md`: referencia operacional de dominios e variaveis de ambiente (Vercel + Railway + Stripe webhook).
- `docs/project/REQUIREMENTS.md`: backlog of requirements to implement.
- `memory/WORKFLOW_MEMORY_PLAYBOOK.md`: manual de governanca de trabalho e memoria (bootstrap/rules/system/modification_log/plan/decision/skills).
- Some previously referenced planning/migration docs (e.g. `docs/evolutive_changes/ROADMAP.md`, `docs/evolutive_changes/REACT_MIGRATION_GUIDE.md`, `docs/evolutive_changes/NEXT_SESSION_CHECKLIST_2026-02-17.md`) are archived under `docs/evolutive_changes/`.

## Testing Strategy (Current + Expansion)
This project is currently running as full-stack (React + Express + Prisma + MySQL). The testing guidance below describes the recommended expansion of automated coverage.
See detailed guide: `docs/config/TESTING_GUIDE.md`.

### Test Pyramid
- **Unit tests**: services, validators, formatters, and utility functions (fast, isolated).
- **Integration tests**: API routes with Prisma + MySQL (or a test DB), including auth/roles.
- **E2E tests**: critical admin flows (services/users CRUD, checkout, cart).

### Tooling (Suggested)
- **Unit/Integration**: Vitest or Jest.
- **API HTTP tests**: Supertest (Express).
- **E2E**: Playwright.
- **DB**: MySQL in Docker (or local test schema).

### Environments
- `development`: local DB, verbose logging.
- `test`: isolated DB/schema, seed data loaded before each test suite.
- `staging`: production-like config, read-only for destructive tests.

### Database & Seeding
Create a dedicated test schema, e.g. `jlr_ai_studio_test`.

Seed types:
- **Base seed**: minimal required entities (users, roles, categories).
- **Feature seed**: services/products/memberships/orders for realistic UIs.
- **Error seed**: intentionally invalid or edge-case data.

Seed scenarios (examples):
- Services with missing optional fields (null descriptions, zero price).
- Users with duplicate emails (to validate unique constraints).
- Orphan records (service referencing missing category).
- Overlong input strings to test validation and truncation.
- Unicode/emoji input to test encoding.

### Failure & Security Test Cases
**Connection errors**
- DB connection refused (wrong host/port).
- DB auth failure (invalid credentials).
- DB timeout (simulate network delay).

**SQL injection / unsafe input**
- Payloads in all text fields:
  - `' OR 1=1 --`
  - `"; DROP TABLE services; --`
  - `admin'/*`
- Ensure parameterized queries via Prisma block injection.

**Auth/permission checks**
- Access admin routes without token (401).
- Access admin routes with non-admin role (403).
- Token expired or tampered (401).

**Rate limits / abuse**
- Repeated login attempts.
- Rapid submit on form endpoints.

### Test Execution (Proposed)
- Unit: `npm run test:unit`
- Integration: `npm run test:integration` (spins up test DB + seed)
- E2E: `npm run test:e2e` (requires app running in test mode)

### Seed + Reset Process (Proposed)
1. Drop and recreate test schema.
2. Apply Prisma migrations.
3. Load base seed.
4. Load feature seed.
5. Optionally load error seed for negative tests.

### Test Data Management
- Keep seed data in versioned files under `data/seeds/`.
- Provide scripts:
  - `seed:base`
  - `seed:feature`
  - `seed:error`
  - `db:reset:test`

### Logs & Observability
- Capture API logs for failing tests.
- Record DB errors and query durations.
- Keep E2E traces/videos for flaky failures.

## React + Express + Prisma + MySQL (Current Stack)
- React: each page becomes a route with shared layout components.
- Node + Express: centralize content, products, memberships, appointments, teams, leads.
- MySQL tables (initial candidates):
  - `products`, `categories`
  - `memberships`, `membership_benefits`
  - `services`
  - `franchises`, `franchise_leads`
  - `professionals`, `teams`, `goals`, `performance_metrics`
  - `orders`, `order_items`, `payments`
  - `content_entries` (store de configuracoes operacionais/chaves de sistema)
- Data modeling: prefer Prisma or a MySQL ORM aligned with page/section needs.

## Backend Architecture (Express + Prisma)
Goal: keep business rules and data access in the backend; frontend only consumes APIs.

### Layering
- Routes -> Controllers -> Services -> Repositories -> Prisma Client.
- Controllers: HTTP input/output only (no business rules).
- Services: business rules, validation, orchestration.
- Repositories: database access via Prisma.

### Current backend structure
- `apps/api/src/server.ts` (HTTP bootstrap)
- `apps/api/src/app.ts` (Express app setup and middleware)
- `apps/api/src/routes/index.ts` (route definitions + validation schemas)
- `apps/api/src/middleware/auth.ts` (auth guards)
- `apps/api/src/lib/` (Prisma client, auth helpers, shared utilities)
- `apps/api/prisma/schema.prisma` (database model)

### API responsibilities
- CRUD for products, services, memberships, franchises, teams, orders.
- Endpoints de configuracao (`/settings`) sobre o model `Setting` (compatibilidade com tabela fisica `ContentEntry`).
- Auth + roles for admin actions.

### Frontend rule
- No business logic in frontend beyond basic form UX/validation.
- All rules, permissions, and transformations live in the API.

## Performance Note (Express vs Next.js)
- Express + SPA can have a slower first load if the JS bundle is large.
- Next.js (SSR/SSG) often improves initial render and SEO, but adds complexity.
- After the first load, SPA navigation is typically fast.
- Decision should be based on SEO/SSR needs vs simplicity.

