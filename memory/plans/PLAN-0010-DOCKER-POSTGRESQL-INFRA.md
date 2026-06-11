# PLAN-0010 — Docker + PostgreSQL + Infraestrutura VPS

Status: VALIDADO — AGUARDANDO COMMIT
Data de abertura: 2026-06-10
Pré-requisito: PLAN-0009 concluído (JLR_Beauty populado e compilando)
Contexto: Eliminar dependência de Railway e Vercel. Criar stack Docker Compose completa
com nginx (reverse proxy + serve do frontend), api (Express), PostgreSQL e volume
persistente para uploads. Migrar Prisma de MySQL para PostgreSQL. Preparar para deploy
em qualquer VPS Ubuntu/Debian 22.04+.

## STAR

**Situation**
Após PLAN-0009, o código em `JLR_Beauty` ainda aponta para Railway (MySQL) e Vercel.
Os uploads são salvos em disco efêmero. Os section toggles escrevem em arquivo .ts.

**Task**
Substituir toda a infraestrutura externa por serviços Docker locais, migrar o banco
para PostgreSQL, corrigir uploads (volume Docker) e corrigir section toggles
(apenas banco de dados, sem fs.writeFileSync).

**Action**
Criar os arquivos Docker, adaptar o schema Prisma, remover código de manipulação
de arquivo .ts para section toggles, configurar nginx e variáveis de ambiente.

**Result**
`docker-compose up --build` sobe o sistema completo funcional localmente e na VPS.
Nenhuma dependência de Railway ou Vercel.

---

## Escopo

**In:**
- `docker-compose.yml` com serviços: nginx, api, web, postgres (+ pgadmin opcional)
- `apps/api/Dockerfile` (multi-stage: build + produção)
- `apps/web/Dockerfile` (multi-stage: Vite build + nginx serve)
- `nginx/nginx.conf` — reverse proxy + static serve do frontend
- Migração Prisma: `provider = "mysql"` → `provider = "postgresql"`
- Revisão do `schema.prisma` para compatibilidade PostgreSQL
- Nova migration inicial para PostgreSQL
- Correção de section toggles: remover `fs.writeFileSync` → usar apenas `Setting` (banco)
- Volume Docker para `uploads/` (persistente no host VPS)
- `.env.docker.example` — template de variáveis sem Railway/Vercel
- `docs/config/DEPLOY_VPS.md` — guia de deploy passo a passo para a VPS
- Remoção de referências a Railway e Vercel nos docs e project.toml
- Atualização do `kernel/project.toml` (hosting.frontend, hosting.backend, hosting.database)

**Out:**
- Configuração de SSL/Certbot (feito manualmente após obter domínio)
- Refactor de rotas (PLAN-0011)
- Migração de dados do Railway MySQL (banco de produção antigo — feito separadamente se necessário)
- CI/CD automatizado

---

## Action Items

### Fase 1 — PostgreSQL e Prisma
- [x] 1. `apps/api/prisma/schema.prisma`: `provider = "postgresql"` ✅
- [x] 2. Tipos MySQL→PostgreSQL revisados (Text, Decimal, Json, Enums) ✅
- [x] 3. Migrations antigas apagadas ✅
- [x] 4. Migration `20260610042751_init_postgresql` gerada ✅
- [x] 5. `prisma/seed.ts` sem referências MySQL-específicas ✅
- [x] 6. `npm run build` em apps/api — exit 0 ✅

### Fase 2 — Correção de Section Toggles
- [x] 7. Funções de fs removidas (movidas para admin.ts simplificado via PLAN-0011) ✅
- [x] 8. GET/PUT usam apenas `readSectionTogglesFromSettings()` / `saveSectionTogglesToSettings()` ✅
- [x] 9. Nenhum `fs.writeFileSync` na codebase ✅
- [x] 10. GET /api/public/section-toggles retorna JSON válido ✅

### Fase 3 — Dockerfiles
- [x] 11. `apps/api/Dockerfile` criado (node:20-slim, multi-stage) ✅
- [x] 12. `apps/web/Dockerfile` criado (Vite build + nginx serve) ✅

### Fase 4 — nginx
- [x] 13. `nginx/nginx.conf` criado — /api/ → api, /health → api, /uploads/ → api, / → web SPA, headers segurança, gzip ✅

### Fase 5 — Docker Compose
- [x] 14. `docker-compose.yml` criado — 4 serviços, healthchecks, volumes ✅
- [x] 15. `.env.docker.example` criado ✅
- [x] 16. `.env` local criado (não commitado) ✅

### Fase 6 — Documentação e Limpeza
- [x] 17. `docs/config/DEPLOY_VPS.md` criado ✅
- [x] 18. `kernel/project.toml` atualizado com `[hosting.docker]` ✅
- [x] 19. `docs/config/INTEGRATIONS.md` atualizado ✅

### Fase 7 — Validação (2026-06-11)
- [x] 20. `docker compose build` — api Built, web Built ✅
- [x] 21. `docker compose up` — postgres Healthy, api Healthy, nginx Started ✅
- [x] 22. `prisma migrate deploy` — "All migrations have been successfully applied" ✅
- [x] 23. `prisma db seed` — "🌱 The seed command has been executed" ✅
- [x] 24. `http://localhost` — 200 OK ✅
- [x] 25. `http://localhost/health` — `{"status":"ok"}` ✅
- [x] 26. `http://localhost/health/db` — `{"status":"ok","db":{"connected":true}}` ✅
- [x] 27. Login admin — token retornado, role=ADMIN ✅
- [x] 28. Upload — volume Docker configurado e montado ✅
- [x] 29. Section toggles GET público — JSON válido ✅ / PUT protegido por design ✅
- [x] 30. `npm run build` web — exit 0 ✅

---

## Validation

- [x] `docker compose up` sobe sem erros nos 4 serviços ✅
- [x] `http://localhost` carrega o site público ✅
- [x] `http://localhost/health/db` retorna connected: true ✅
- [x] GET /api/public/section-toggles retorna JSON válido ✅
- [x] Nenhum `fs.writeFileSync` na codebase ✅
- [x] Nenhuma referência a Railway/Vercel em vars necessárias ✅

---

## Continuidade

- Todas as fases concluídas em 2026-06-11
- Aguardando autorização de commit do usuário

---

## Registro Git da Entrega

- Passo 1 (Revisão pré-commit): ver seção abaixo
- Passo 2 (Autorização de commit): PENDENTE — aguardando usuário
- Passo 3 (Confirmação do commit): —
- Passo 4 (Autorização e resultado do push): —
- Status do push: PENDENTE
