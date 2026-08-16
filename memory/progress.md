# Progress — Current Module State

> Current state of the project. Updated after each completed task.
> Complements `memory/MODIFICATION_LOG.md` (chronological history).
> This file answers the question: **"What is ready right now?"**

---

## Modules

<!-- Available states: stable | in-progress | blocked | planned | deprecated -->
<!-- Update this file whenever a PLAN-XXXX is marked as DONE -->

| Module | State | Updated | Notes |
|--------|-------|---------|-------|
| Infra Docker + PostgreSQL | stable | 2026-06-11 | docker compose up funcional, healthchecks OK, migration + seed aplicados |
| API Routes (refactor) | stable | 2026-06-11 | 9 arquivos de domínio, 6 libs, index.ts 23 linhas, builds e testes passando |
| Prisma Schema | stable | 2026-06-11 | provider=postgresql, migration init única, binaryTargets para Docker Alpine |
| Section Toggles | stable | 2026-06-11 | fs.writeFileSync removido, usa apenas tabela Setting |
| Page Texts Editor | stable | 2026-06-16 | PLAN-0012 FECHADO — 129 campos, quebra de linha, histórico (versão anterior), galeria Masonry |
| Docker Status Modal | stable | 2026-06-13 | PLAN-0013 CONCLUÍDO — modal flutuante admin, auto-fecha 10s, ícone topbar com LED |
| Mission Section | stable | 2026-06-16 | PLAN-0014 CONCLUÍDO — About Franquias + MissionSection 3-col; width corrigido (max-w-[1440px]) |
| Franquias Hero Gallery | stable | 2026-06-16 | toggle hero_gallery via section toggles — oculto por padrão, reativável pelo Admin |
| Franquias Page Upgrade | stable | 2026-06-20 | PLAN-0015 DONE — 18 seções; correções pós-entrega: ERR-0034..0039 (chaves page text, max-width, ✦ removidos, FluxoCaixa layout+slots, Etapas snake, AdminGallery grid) |
| Unified Navigation Menu | stable | 2026-06-20 | PLAN-0016 DONE — nav único para Home/Assinaturas/Franquias; dropdowns Assinaturas (novo) e Franquias (7 landmarks); mobile menu unificado |
| Home About Section Gallery | stable | 2026-06-22 | Flowbite Featured Image (1 destaque + 5 miniaturas); layout top/bottom; slots img_07/08 removidos; CSS via style inline (Docker build) |
| Franquias Fine-Tuning Visual | stable | 2026-06-21 | bg alternante A/B (13 seções, altMap dinâmico); object-contain em 3 imagens; quote circle no Founder; cards modelos reordenados (ESSENCIAL→PRIME→MASTER); nomes abaixo das imagens; botões âncora |
| Auth + Rate Limiter (Security) | stable | 2026-06-22 | PLAN-0017 CONCLUÍDO (todas 4 fases) — AuditLog, Stripe sanitization, password reset, Helmet, RLS, pg_audit, DB segregation |
| Prisma Schema | stable | 2026-06-22 | PasswordResetToken + AuditLog adicionados; passwordHash com doc comment; migration 20260622000000 aplicada |
| Infra Docker | stable | 2026-06-22 | postgres customizado (Debian+pgaudit); jlr_api_rw/ro criados; RLS ativo; init-api-users.sh para fresh deployments |
| Security Hardening Pós-Incidente (PLAN-0018) | stable | 2026-07-05 | PLAN-0018 DONE — escopo original (9 vulnerabilidades, ondas 1-4) 100% concluído, validado com penetration test end-to-end e commitado/pushed (`e01d4ef`). HMAC order tracking, rate limits cupom/concierge, least-privilege DB, RLS 5 tabelas, JWT 15min, timing jitter. SEC-27 formalmente decidido como não aplicável (DECISION-012). Ver ERR-0041, ERR-0042. |
| **SEC-30 — TLS/HTTPS ausente em produção (PLAN-0019)** | blocked | 2026-07-05 | 🔴 CRÍTICO — produção roda HTTP puro, sem domínio/TLS. Provável causa raiz real do incidente que motivou PLAN-0018. Desmembrado para `PLAN-0019-TLS-HTTPS-SETUP.md` (plano próprio, BLOCKED até usuário providenciar domínio — Let's Encrypt exige DNS). Levantar proativamente quando usuário mencionar domínio/deploy. |
| Estoque Multi-Unidade + Vendas + BI (PLAN-0020) | in-progress | 2026-07-07 | EXECUTADO ponta a ponta — ledger auditável, reserva TTL 20min+sweeper, RBAC unidade fail-closed, venda balcão (PAGO, canal+vendedor+unidade, total server-side), Stripe reserva→confirma, Loja Online (unit 3), KPIs CMV/margem/tops, admin produtos por unidade, venda manual, BI dashboard, SPA Esgotado. Validado e2e via API real; dados de teste limpos. Checklist do plano fechado; rodada 1 de validação visual concluída (4 ajustes); testes automatizados 23/23 PASS; **commitado e pushed (`ee6a61a`)**. Falta: confirmação final do usuário + pentest S10 → DONE. |
| Infra Docker — build api/web | stable | 2026-07-22 | ERR-0044 corrigido: `NODE_OPTIONS=--dns-result-order=ipv4first` em `apps/api/Dockerfile` e `apps/web/Dockerfile` (IPv6 sem rota na rede Docker causava `ETIMEDOUT` no `npm ci`). Validado com rebuild completo; containers saudáveis. Falta commit/push. |
| Menu Admin + Seções Telas (PLAN-0021) | in-progress | 2026-07-22 | Reagrupamento do menu lateral (Equipes-Metas/Perform após Vendas; grupo "Cadastro" com Produtos/Planos/Pessoas/Serviços/Entrega/Cupons; Textos movido para o Master; "Seções SPA" renomeada "Seções Telas" e retirada do Master; grupo Master movido para ser o último item do menu) + reordenação fixa (não-alfabética) de grupos/seções na tela Seções Telas para bater com a ordem real das páginas. `tsc -b` + build Docker PASS (2 rodadas). Falta: validação visual do usuário + commit/push → DONE. |
| Admin V2 — Fundação + Operação (PLAN-0022) | stable | 2026-08-15 | Retrofit do painel administrativo (`/admin-v2` em paralelo a `/admin`), branch `feature/admin-v2`. **Ondas 0-9 + RETROFIT-010b concluídas, validadas técnica e visualmente** (baseline; Shell+Scope Engine+Panorama Vivo+Health Score v1; Mapa Vivo da Rede+Diagnóstico da Unidade; Board Operacional de Pedidos+Fluxo; Mapa de Capacidade da Agenda dia×hora; Portfólio Vivo de Produtos; Performance de Serviços; Clientes como Fluxo de Relacionamento; Assinaturas como Saúde da Base; Pipeline de Franquias com migração de schema aditiva + movimentação de etapa via UI). `DECISION-013` registra as regras fixas. **Commitado, pushado e mergeado em `main`** (`28e11c1`/`c00a21d`/`63e28bf`, PR #1 fechado via merge `1479cce` em 2026-08-15). Continuação em `PLAN-0023` (Inteligência). |
| Admin V2 — Consolidação (PLAN-0024) | stable | 2026-08-15 | RETROFIT-020 (Cadastros) + RETROFIT-021 (Sistema) entregues — sidebar do Admin V2 ganha 2 "mundos" novos (hubs de cards) que linkam pras telas legadas via deep-link por hash (`/admin#<view>`, mudança cirúrgica em `admin-shell/behavior.ts`); nenhuma reescrita estética (`DECISION-013` regra #5), nenhum endpoint novo. `Segurança`/`Infra` ficam desabilitados no hub de Sistema (sem tela dedicada no legado). RETROFIT-022 (aposentar o legado) fica fora, sem critério fixado. `tsc`/build/lint limpos (17 erros pré-existentes tolerados, nenhum novo), rebuild Docker + validação visual real (Playwright, 30 checks: 12 deep-links + 2 desabilitados + regressão do clique manual no legado). **Commitado, pushado e mergeado em `main`** (`260ce97`/`f0c165e`/`c7ed771`, PR #1 fechado via merge `1479cce`). |
| Admin V2 — Polimento de UX (PLAN-0025) | stable | 2026-08-15 | 6 itens do usuário entregues: cabeçalho dos kanban com fundo próprio (`KanbanColumnHeader`, Operação/Rede/Crescimento); motivo obrigatório na mudança de etapa do Pipeline de Franquias (migração aditiva `reason` + modal); botões mortos de Google/Facebook removidos do login/cadastro (OAuth não vale a pena agora — zero infra + bloqueio real de TLS); subtítulo explicativo na Rede; contraste da Agenda-Capacidade revisado (mesma lógica vermelho=ocioso/verde=ocupado); "Valor em estoque" exposto no Panorama. **Achado sistêmico corrigido na mesma leva**: os 4 tokens semânticos `state-*` do Admin V2 nunca tinham sido compilados no CSS servido desde a Onda 1 do `PLAN-0022` (`ERR-0049`) — fix aditivo (`tailwind.generated.css`, gerado via Tailwind CLI) corrigiu cor em Health Score/Insight Engine/Radar/Gargalos/Agenda de uma vez. `tsc`/build/testes limpos (134/134 PASS), E2E real + validação visual real com checagem de pixel (não só "parece certo"). Sem commit/push (aguardando autorização). |
| Cadastros/Sistema nativos no Admin V2 (PLAN-0026) | in-progress | 2026-08-16 | `DECISION-014` (ACTIVE) substitui a regra #5 da `DECISION-013`. 14 ondas planejadas, sequenciadas por complexidade real. **Ondas 1-8 concluídas e validadas de verdade** (E2E real + visual real) — **tier P inteiro fechado** (Planos/Entrega/Branding/Cupons/Textos das Páginas/Seções Telas/Galeria de Mídias) **+ Onda 8 (Serviços), primeira do tier M**: primeira reescrita de um `behavior.ts` imperativo (416 linhas) como React declarativo, com `CategoryStatusManagerModal` genérico (novo, reusável na Onda 11/Produtos) pra categorias/status. 3 bugs reais achados e corrigidos no tier P: `ERR-0050` (schema Zod de cupom), `ERR-0051` (CSS estático — mesma causa raiz do `ERR-0049`/`ERR-0040`, regenerado + nota de processo), `ERR-0052` (z-index de modal aninhado herdado do legado). Achado de contrato recorrente (Ondas 5 e 7): telas de config-map grande sempre substituem o mapa inteiro no `PUT`, nunca fazem merge incremental. `DeleteConfirmModal` generalizado (`tone`/`confirmLabel`). `HubCard` ganhou o modo `native`; breadcrumb das sub-telas de Cadastros e Sistema refatorado pra tabela de lookup. Usuário autorizou execução autônoma do resto do plano: commit sem perguntar por onda, push só no final, próxima onda inicia sem aguardar aprovação. **Onda 9 (WhatsApp/Integrações) também concluída**: reusa `/concierge/sessions` (filtro server-side, melhor que o client-side do legado) + `/api/settings/:key` genérico (Onda 2, zero cliente novo pras 3 configs do bot). Faltam Ondas 10-14 (Testes — tier M, mais `behavior.ts` a reescrever; Produtos/Clientes/Profissionais/Usuários — tier G, as mais pesadas do plano). |
| Admin V2 — Inteligência (PLAN-0023) | stable | 2026-08-15 | Continuação do `PLAN-0022`, mesma branch. **Ondas 1-7 concluídas e validadas de verdade (E2E real + visual)**: Radar Executivo (RETROFIT-011), Gargalos (RETROFIT-012), "Onde está o dinheiro?" (RETROFIT-013), Comparador de Unidades (RETROFIT-014), Health Score evolução (RETROFIT-017), Insight Engine (RETROFIT-018, `/admin-v2/insights`, consolida Radar+Gargalos+Comparador com dedup por categoria) e Ações Recomendadas (RETROFIT-019, catálogo de sugestões em texto por categoria, botão real só quando existe tela). Validação das Ondas 6-7 fechada nesta sessão: `docker compose build` + E2E real (login MASTER, dedup/ordenação/`totalKnownImpact` conferidos, regressão OK em todos os endpoints de inteligência) + visual real via Playwright headless (extensão Chrome indisponível nesta máquina) incluindo cliques reais Panorama→Insights→Pipeline. `npm run test` (api) 162/162 PASS. **Ondas 1-7 commitadas, pushadas e mergeadas em `main`** (PR #1 fechado via merge `1479cce` em 2026-08-15) — nenhuma pendência restante nesta leva. |

---

## Technical Debt

<!-- Severity: critical | medium | low -->

| Area | Debt | Severity |
|------|------|----------|
| ~~API startup~~ | ~~Migration race condition~~ | ~~low~~ — **RESOLVIDO** docker-entrypoint.sh |
| ~~Seed~~ | ~~MASTER_EMAIL conflita com adminEmail~~ | ~~low~~ — **RESOLVIDO** seed reordenado |

---

## Recent Activity

<!-- Log of completed tasks. Summarize entries older than 30 days. -->
<!-- Format: - YYYY-MM-DD: [what was done] (PLAN-XXXX or point-in-time) -->
- 2026-06-10: Cópia do projeto JLR_AI_Studio → JLR_Beauty, git init, npm install (PLAN-0009 DONE)
- 2026-06-11: Docker Compose + PostgreSQL + Dockerfiles + nginx + migration PostgreSQL (PLAN-0010 validado)
- 2026-06-11: Refactor routes/index.ts God File → 9 arquivos de domínio + 6 libs (PLAN-0011 validado)
- 2026-06-11: Page Texts Editor — 129 campos, 11 componentes migrados, Admin UI (PLAN-0012 CONCLUÍDO)
- 2026-06-12: Docker Status Modal + fix nginx boot/inode/proxy_pass (PLAN-0013 em andamento)
- 2026-06-13: About em Franquias + MissionSection global (PLAN-0014 em andamento)
- 2026-06-16: Franquias Page Upgrade — 13 novas seções, 13 componentes TSX, ~145 page texts, ~26 media slots, 13 toggles (PLAN-0015 DONE)
- 2026-06-20: Unified Nav — menu único Home/Assinaturas/Franquias, 4 dropdowns, 7 landmarks (PLAN-0016 DONE)
- 2026-06-21: Fine-tuning Franquias — bg A/B, imagens contain, Founder circle, cards modelos (point-in-time)
- 2026-06-21: Security Fase 1 — rate limiter PostgreSQL, requireMaster/Staff, email-only login (PLAN-0017 em andamento)
- 2026-06-22: Security Fase 2 — refresh token, logout, emailVerified enforcement, verify-email flow (PLAN-0017 em andamento)
- 2026-06-22: Security Fase 3 — Helmet, DB segregation jlr_api_rw, RLS, pg_audit, health endpoints protegidos (PLAN-0017 em andamento)
- 2026-06-22: Security Fase 4 — AuditLog, Stripe payload sanitization, password reset flow, passwordHash comment (PLAN-0017 CONCLUÍDO)
