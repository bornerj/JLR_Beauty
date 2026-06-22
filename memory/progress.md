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
