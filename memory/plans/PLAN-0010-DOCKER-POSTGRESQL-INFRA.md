# PLAN-0010 — Docker + PostgreSQL + Infraestrutura VPS

Status: AGUARDANDO APROVAÇÃO
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
- [ ] 1. Alterar `apps/api/prisma/schema.prisma`: `provider = "postgresql"`
- [ ] 2. Revisar tipos incompatíveis MySQL→PostgreSQL no schema:
  - `@db.Text` → mantido (PostgreSQL suporta)
  - `@db.Decimal` → mantido
  - `Json?` → mantido (PostgreSQL usa `jsonb` automaticamente via Prisma)
  - Enums Prisma → verificar se precisam de ajuste (PostgreSQL cria tipos nativos)
- [ ] 3. Apagar todas as migrations antigas (`prisma/migrations/`) — PostgreSQL inicia do zero
- [ ] 4. Executar `npx prisma migrate dev --name init_postgresql` com banco PostgreSQL local para gerar a migration limpa
- [ ] 5. Atualizar `prisma/seed.ts` se houver referências MySQL-específicas
- [ ] 6. Verificar `npm run build` em apps/api após mudança do provider

### Fase 2 — Correção de Section Toggles
- [ ] 7. Em `apps/api/src/routes/index.ts`: remover funções `getSectionTogglesFileCandidates`, `resolveSectionTogglesFilePath`, `parseSectionTogglesFromSource`, `buildSectionToggleLiteral`, `readSectionTogglesFile`, `writeSectionTogglesFile` (~70 linhas)
- [ ] 8. Simplificar `GET /public/section-toggles` e `PUT /admin/section-toggles` para usar apenas `readSectionTogglesFromSettings()` e `saveSectionTogglesToSettings()` (já existem)
- [ ] 9. Remover imports de `fs` e `path` que eram usados só pelos toggles (verificar se outros endpoints ainda precisam — upload usa fs, manter)
- [ ] 10. Testar: GET /api/public/section-toggles retorna defaults quando Setting não existe

### Fase 3 — Dockerfiles
- [ ] 11. Criar `apps/api/Dockerfile`:
  ```
  Estágio build: node:20-alpine, npm ci, npx prisma generate, npm run build
  Estágio prod: node:20-alpine, só dist/ e node_modules prod, CMD node dist/server.js
  ```
- [ ] 12. Criar `apps/web/Dockerfile`:
  ```
  Estágio build: node:20-alpine, npm ci, npm run build (gera dist/)
  Estágio prod: nginx:alpine, COPY dist/ → /usr/share/nginx/html, nginx.conf custom
  ```

### Fase 4 — nginx
- [ ] 13. Criar `nginx/nginx.conf`:
  - `upstream api { server api:3001; }`
  - `/api/` → proxy_pass ao api
  - `/uploads/` → proxy_pass ao api (serve arquivos)
  - `/` → try_files para o SPA (fallback para index.html)
  - Headers de segurança (X-Frame-Options, nosniff, etc.)
  - Gzip habilitado para assets estáticos

### Fase 5 — Docker Compose
- [ ] 14. Criar `docker-compose.yml` na raiz do projeto:
  ```yaml
  services:
    postgres:
      image: postgres:16-alpine
      volumes: [postgres_data:/var/lib/postgresql/data]
      env: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD

    api:
      build: ./apps/api
      depends_on: [postgres]
      volumes: [uploads_data:/app/uploads]
      env_file: .env
      ports: interno apenas

    web:
      build: ./apps/web
      depends_on: [api]
      (sem porta exposta diretamente)

    nginx:
      image: nginx:alpine
      ports: ["80:80"]
      volumes: [./nginx/nginx.conf:/etc/nginx/conf.d/default.conf]
      depends_on: [api, web]

  volumes:
    postgres_data:
    uploads_data:
  ```
- [ ] 15. Criar `.env.docker.example` com todos os vars necessários (sem Railway/Vercel vars)
- [ ] 16. Criar `.env` de desenvolvimento local (não commitado)

### Fase 6 — Documentação e Limpeza
- [ ] 17. Criar `docs/config/DEPLOY_VPS.md` com checklist de deploy:
  - Requisitos de sistema (Ubuntu 22.04+, Docker, Docker Compose v2)
  - Passos: clonar, copiar .env, `docker-compose up -d --build`
  - Como rodar seed: `docker-compose exec api npx prisma db seed`
  - Como fazer backup do PostgreSQL
  - Como adicionar SSL com Certbot + nginx (quando tiver domínio)
- [ ] 18. Atualizar `kernel/project.toml`: remover hosting Railway/Vercel, adicionar seção `[hosting.docker]`
- [ ] 19. Remover referências a Railway e Vercel de `docs/config/INTEGRATIONS.md` e outros docs relevantes

### Fase 7 — Validação
- [ ] 20. `docker-compose build` — todos os stages completam sem erro
- [ ] 21. `docker-compose up` — todos os containers sobem (postgres healthy, api conecta ao banco, web serve)
- [ ] 22. `docker-compose exec api npx prisma migrate deploy` — migration aplica sem erro
- [ ] 23. `docker-compose exec api npx prisma db seed` — seed executa
- [ ] 24. Acessar `http://localhost` — site público carrega
- [ ] 25. Acessar `http://localhost/api/health` — retorna `{"status":"ok"}`
- [ ] 26. Acessar `http://localhost/api/health/db` — retorna `{"status":"ok","db":{"connected":true}}`
- [ ] 27. Login de admin funciona
- [ ] 28. Upload de imagem funciona e persiste após `docker-compose restart api`
- [ ] 29. Section toggles GET/PUT funcionam sem erros de arquivo
- [ ] 30. `npm run lint` em apps/web — zero erros

---

## Validation

- [ ] `docker-compose up` sobe sem erros de startup nos 4 serviços
- [ ] `http://localhost` carrega o site público
- [ ] `http://localhost/api/health/db` retorna connected: true
- [ ] Upload de imagem: arquivo persiste após restart do container api
- [ ] GET /api/public/section-toggles retorna JSON válido
- [ ] Nenhuma chamada a `fs.writeFileSync` na codebase (grep confirma)
- [ ] Nenhuma referência a `RAILWAY_` ou `VERCEL_` em variáveis de ambiente necessárias

---

## Continuidade

- Último passo concluído: aguardando aprovação do usuário
- Próximo passo planejado: item 1 (alterar provider no schema.prisma)

---

## Registro Git da Entrega

*(a preencher após execução)*

- Passo 1 (Revisão pré-commit): —
- Passo 2 (Autorização de commit): —
- Passo 3 (Confirmação do commit): —
- Passo 4 (Autorização e resultado do push): —
- Status do push: PENDENTE
