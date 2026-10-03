# PLAN-0038 — Migração Zorin → servidor Ubuntu: estrutura `/srv`, restore de dados e documentação

**Status:** 🔵 EM EXECUÇÃO — aprovado pelo usuário em 2026-10-03 (D1–D4 como propostos). **Ondas 0, 1, 2, 4 e 5 concluídas; Onda 3 concluída exceto o teste de reboot** (pendente, usuário fará depois). Plano NÃO renomeado `-DONE-` até o reboot ser validado e o Git Record preenchido.
**Data de abertura:** 2026-10-03
**Escopo macro:** `docker-compose.yml`, `.env`/`.env.docker.example`, `.gitignore`, `scripts/` (backup), `sfk.toml`, `docs/`, `memory/`. **Zero mudança em `apps/api` ou `apps/web`**, zero migration Prisma.
**Agente de apoio:** `@devops-engineer` (skill `fullstack-docker-deploy`, `deployment-procedures`) + `@database-architect` para o restore.

**Origem:** usuário migrou os arquivos do notebook Zorin para um servidor Ubuntu com estrutura `/srv/{projects,data,databases,backups,docker,models}` e pediu reconfigurar tudo, avaliar os containers e documentar a nova organização.

---

## STAR

**Situation (levantado em 2026-10-03, somente leitura):**
- Projeto em `/srv/projects/GitHub/JLR_Beauty`; `origin` e chave SSH do GitHub já funcionam (ver `MODIFICATION_LOG` de 2026-10-03).
- Docker 29.8.2 / Compose 5.6.0, `data-root=/srv/docker` (root). **Zero containers, zero volumes**, só `hello-world`. O banco e os uploads antigos **não vieram na cópia de arquivos** (viviam em volumes Docker do Zorin).
- `/srv` = único disco `sda1` (ext4, 938 GB, label `DEV-DATA`). `databases/`, `data/`, `backups/`, `models/` estão vazios.
- No Zorin (ainda ligado) os volumes `jlr_beauty_postgres_data` e `jlr_beauty_uploads_data` existem e os 4 containers estão `Up`. Export feito pelo usuário: `jlrbeauty.dump` (277 KB, `pg_dump -Fc`, **PostgreSQL 16.15**, sha256 `b7d231635076…f5a5`) e `uploads.tar.gz` (29 MB, sha256 `af74e395e94d…3bea`). **Transferência para o servidor pendente.**
- `docker-compose.yml` usa volumes nomeados (`postgres_data`, `uploads_data`) e o serviço `driveguard` (criado em `ERR-0091` por causa do HD externo montado manualmente no Zorin). `api/docker-entrypoint.sh` roda `prisma migrate deploy` a cada start; `init-api-users.sh` só roda em diretório de dados **vazio** e cria `jlr_api_rw`/`jlr_api_ro`.
- `.env` presente, com `APP_API_URL`/`APP_WEB_URL`/`CORS_ORIGIN` = `http://localhost`, `TLS_ENABLED=false`.

**Task:** (1) colocar os dados persistentes em locais previsíveis dentro de `/srv`; (2) restaurar banco e uploads do Zorin sem perda; (3) remover código morto da era do HD externo; (4) criar rotina de backup; (5) documentar tudo no projeto sem mudar o comportamento da aplicação.
**Restrições:** nunca exibir valores do `.env`; dump contém PII/hashes de senha → fora do git; backup e dados no mesmo disco **não** protegem contra falha do disco; sem commit/push sem aprovação dupla.

**Action:** ondas abaixo.

**Result esperado:** `docker compose up -d` sobe 4 serviços saudáveis (sem `driveguard`), `/admin-v2` loga com os usuários reais, mídias aparecem, contagens de linhas por tabela batem com o Zorin, dados em `/srv/databases|data`, script de backup funcionando, docs atualizados.

---

## Decisões de desenho propostas (confirmar na aprovação)

| # | Proposta | Alternativa |
|---|---|---|
| D1 | **Bind mounts em `/srv`**: Postgres → `/srv/databases/jlr_beauty/postgres`; uploads → `/srv/data/jlr_beauty/uploads`; dumps → `/srv/backups/jlr_beauty/`. Caminhos via variáveis `JLR_PG_DATA_DIR`/`JLR_UPLOADS_DIR`/`JLR_BACKUP_DIR` (default relativo ao repo, para continuar portável). | Manter volumes nomeados em `/srv/docker/volumes` (opaco, root-only) |
| D2 | **Remover `driveguard`** (e o `depends_on` do `nginx`). A causa raiz (drive externo montando depois do Docker) não existe mais. `ERR-0033`/`ERR-0091` ficam como histórico, com nota "superado pela migração". | Manter por precaução (código morto) |
| D3 | **Backup**: `scripts/backup.sh` (`pg_dump -Fc` + `tar` dos uploads, retenção configurável, sha256), agendável por cron. **Fora de escopo**: cópia offsite (ver Riscos). | Sem rotina automática |
| D4 | Manter `/srv/projects/GitHub/JLR_Beauty` como raiz do repo; `/srv/models` não é usado por este projeto (documentar só como "reservado para modelos de IA do servidor"). | — |

---

## Ondas

### Onda 0 — Pré-requisitos (usuário)
- [ ] Copiar `jlrbeauty.dump` e `uploads.tar.gz` do Zorin para `/srv/backups/jlr_beauty/migracao-zorin/` (WinSCP).
- [ ] **Critério:** `sha256sum` no servidor = hashes acima. Se divergir, refazer a cópia.
- [ ] **Não** desligar nem limpar o Zorin até a Onda 4 estar validada (é o rollback).

### Onda 1 — Estrutura `/srv` e compose
- [ ] Criar `/srv/databases/jlr_beauty/postgres`, `/srv/data/jlr_beauty/uploads`, `/srv/backups/jlr_beauty` (dono `jbsystemas`; o entrypoint do `postgres:16` ajusta o dono do PGDATA ao iniciar como root).
- [ ] `docker-compose.yml`: trocar `postgres_data`/`uploads_data` por bind mounts com variáveis (D1); remover `driveguard` e a dependência (D2); remover bloco `volumes:` nomeados; atualizar o comentário do `ERR-0033/0091`.
- [ ] `.env`: acrescentar `JLR_PG_DATA_DIR`, `JLR_UPLOADS_DIR`, `JLR_BACKUP_DIR` (só caminhos; sem tocar em segredos). `.env.docker.example` e `sfk.toml [environments.docker].vars` recebem os **nomes**.
- [ ] `.gitignore`: ignorar o default relativo `.data/`.
- [ ] `docker compose config` sem erro; checar porta 80 livre no host.

### Onda 2 — Subir e restaurar
- [ ] `docker compose build` (api/web/postgres) — primeira build neste host; checar `ETIMEDOUT`/IPv6 (`ERR-0044` já mitigado nos Dockerfiles).
- [ ] Subir **só o `postgres`** (cria o banco vazio + roles `jlr_api_rw/ro` via init). **Não subir a `api` antes do restore** (o entrypoint rodaria `migrate deploy` num banco vazio e conflitaria com o restore).
- [ ] `pg_restore --clean --if-exists --no-owner -d jlrbeauty` do dump (formato custom, via `docker compose exec -T`); registrar avisos/erros.
- [ ] Extrair `uploads.tar.gz` em `/srv/data/jlr_beauty/uploads` (preservando estrutura).
- [ ] Subir `api`, `web`, `nginx`. O `migrate deploy` deve ser no-op (tabela `_prisma_migrations` veio no dump).
- [ ] **Validação do restore:** contagem de linhas por tabela (Zorin × servidor, mesma query nos dois), `_prisma_migrations` sem pendências, RLS/roles presentes (`\du`, `pg_policies`), nº de arquivos em uploads = nº do tar.

### Onda 3 — Validação funcional
- [ ] `docker compose ps` — 4 serviços saudáveis; `GET /health`.
- [ ] Login MASTER em `/admin-v2`, navegação por Panorama/Operação/Cadastros, Galeria de Mídias com imagens reais, site público (Home/Franquias/Assinaturas) renderizando textos e imagens do banco.
- [ ] `docker compose restart` e **reboot do servidor**: dados persistem em `/srv/databases|data`, serviços voltam sozinhos (`restart: unless-stopped`).
- [ ] `apps/api` `npm run test` e `tsc -b` **não se aplicam** (código intocado) — não executar só por ritual.

### Onda 4 — Backup
- [ ] `scripts/backup.sh` (D3) + teste real: gerar dump, **restaurar num banco temporário** e comparar contagens (backup não testado não é backup).
- [ ] Sugestão de linha de cron em `docs/` (não instalar crontab sem aprovação).
- [ ] Só então o Zorin pode deixar de ser a cópia de segurança.

### Onda 5 — Documentação e memória
- [ ] `docs/config/SERVIDOR_UBUNTU.md` novo: mapa de `/srv`, onde ficam código/dados/DB/backups/Docker, comandos de operação (subir, parar, backup, restore), permissões, o que **não** muda no projeto.
- [ ] `docs/config/DEPLOY_VPS.md` e `docs/integrations/*` — corrigir referências ao ambiente antigo, se houver.
- [ ] `sfk.toml`: `[hosting.docker]`/`[hosting.database]` (volume → bind mount), nova seção `[hosting.server]` (host Ubuntu, `/srv`), `[environments.docker].vars`. **Só nomes, nunca valores.**
- [ ] `memory/decisions/DECISION-022.md` (provedor/hospedagem mudou — regra do kernel: mudança de hospedagem vira DECISION).
- [ ] `memory/logs/DEBUG-HISTORY.md`: nota de "superado" em `ERR-0033`/`ERR-0091`; backfill do `ERR-0088` (pendência antiga, mesma sessão de higiene) **se aprovado**.
- [ ] `memory/progress.md` (módulo "Infra Docker" + Resume Panel), `memory/MODIFICATION_LOG.md` (START/END do plano), `memory/PR-XXXX-DESCRIPTION.md`.
- [ ] `memory/logs/BUILD-HISTORY.md`: registrar o restore (qual dump, quando, por quê) — exigência do kernel para mudança de dados.

---

## Progresso (2026-10-03)

- **Onda 0 ✅** hashes sha256 do dump e do tar conferidos no servidor (OK); tar com 69 arquivos.
- **Onda 1 ✅** bind mounts em `/srv/databases|data/jlr_beauty`, `driveguard` removido, variáveis `JLR_*` em `.env`/`.env.docker.example`/`sfk.toml`, `.data/` no `.gitignore`; `docker compose config` OK; porta 80 livre.
- **Onda 2 ✅** build das 3 imagens OK; `postgres` subiu sozinho (init criou `jlr_api_rw/ro`); `pg_restore --clean --if-exists --no-owner --exit-on-error` **exit 0, sem erros**; 41 tabelas, `_prisma_migrations` 15/15 aplicadas (= 15 pastas no repo), 26 policies RLS em 8 tabelas; 69 arquivos de upload extraídos (30 MB); `api` subiu com "No pending migrations".
- **Onda 3 parcial**: `docker compose ps` — postgres/api/nginx `healthy`, web `Up`; site `GET /` = 200; `GET /uploads/<arquivo restaurado>` = 200. **Pendente:** conferência de contagens contra o Zorin, login MASTER no `/admin-v2` pelo usuário, teste de reboot do servidor (feito pelo usuário).
- **Achado (risco 4 confirmado):** `DB_API_RW_PASSWORD` e `DB_API_RO_PASSWORD` do `.env` são **iguais aos defaults** de desenvolvimento escritos no `docker-compose.yml` e `init-api-users.sh` (versionados no GitHub). Não corrigido neste plano — trocar exige recriar as roles e atualizar `DATABASE_URL`; registrar como item separado.

- **Onda 3 ✅ (exceto reboot):** contagens das 41 tabelas Zorin × servidor **idênticas**; login MASTER, telas, dados e imagens confirmados pelo usuário. Achado e corrigido: `ERR-0096` (login 403 — `CORS_ORIGIN` só com `localhost`; acesso por IP exige a origem na lista). **Pendente:** reboot do servidor (usuário).
- **Onda 4 ✅:** `scripts/backup.sh` — `--verify` rodou de verdade: dump legível (`pg_restore --list`), restore em banco temporário `jlr_verify_tmp` com 41 tabelas e contagens idênticas, SHA256SUMS conferidos, banco temporário removido. Cron e offsite **não** configurados (decisão do usuário).
- **Onda 5 ✅:** `docs/config/SERVIDOR_UBUNTU.md` (novo), `DEPLOY_VPS.md` ajustado, `sfk.toml` (`[hosting.server|docker|database|storage]` + vars `JLR_*`), `DECISION-022`, `DEBUG-HISTORY` (`ERR-0096` novo; `ERR-0033`/`ERR-0091` marcados SUPERADO; `ERR-0088` backfilled), `BUILD-HISTORY`, `progress.md`, `MODIFICATION_LOG`, `PR-0001-DESCRIPTION.md`. `scripts/fix-nginx.sh` removido (mesma causa raiz do `driveguard`; remoção staged no git, não commitada).

## Riscos e pontos de atenção

1. **Disco único.** `/srv/databases`, `/srv/data` e `/srv/backups` estão na mesma `sda1`: o backup protege de erro humano/corrupção, **não de falha do disco**. Recomendado (fora deste plano) uma cópia offsite ou em outro disco.
2. **Dump com PII.** `jlrbeauty.dump` tem clientes/pedidos/hashes. Fica em `/srv/backups` (fora do repo); nada disso vai para git, chat ou `memory/`.
3. **`pg_restore` sobre banco inicializado** pode gerar avisos de objetos já existentes (roles/grants do init); aceitos desde que a validação de contagens passe. Mitigação: `--clean --if-exists`.
4. **Defaults de senha no compose** (`DB_API_RW_PASSWORD:-…Dev2026!`): conferir se o `.env` os sobrescreve; se não, é um achado de segurança separado (não corrigido neste plano, só reportado).
5. **URLs `localhost`** no `.env`: aceitável para uso local/LAN; para acesso externo dependem de domínio/TLS (`PLAN-0019`, ainda bloqueado) — não alterar aqui.
6. **Rollback:** Zorin intacto + dump no servidor. Se algo falhar, `docker compose down` e apagar o conteúdo de `/srv/databases/jlr_beauty` reconstrói do zero.

## Critérios de aceite
- Hashes da transferência conferem.
- Contagens por tabela idênticas ao Zorin; login e mídias funcionando; persistência após reboot.
- `docker compose ps` com `postgres`, `api`, `web`, `nginx` saudáveis; sem `driveguard`.
- Backup gerado **e** restaurado em banco temporário com sucesso.
- `docs/config/SERVIDOR_UBUNTU.md`, `sfk.toml`, `DECISION-022`, `progress.md`, `MODIFICATION_LOG` atualizados; nenhum segredo em arquivos versionados.

## Git Record of Delivery
- Step 1 (Pre-commit review): 15 arquivos (+519/−65) listados e revisados com o usuário — compose, `.env.docker.example`, `.gitignore`, `sfk.toml`, `scripts/backup.sh` (novo), `scripts/fix-nginx.sh` (removido), `docs/config/SERVIDOR_UBUNTU.md` (novo), `DEPLOY_VPS.md`, memória. Validações: `docker compose config`, build, `pg_restore` exit 0, 41/41 contagens idênticas, `backup.sh --verify` OK. `.env` e os 2 arquivos `TIME DE AGENTES RH*.MD` fora do commit.
- Step 2 (Commit authorization): aprovação explícita do usuário em 2026-10-03.
- Step 3 (Commit confirmation): `ecf4734` / `main` / `chore(infra): migra para servidor Ubuntu — bind mounts em /srv, backup.sh e docs (PLAN-0038)` / 15 arquivos, +519/−65.
- Step 4 (Push authorization and result): aprovação separada do usuário em 2026-10-03; `git push origin main` → `6d66dd9..ecf4734`; `origin/main` = `ecf4734`.
- Push status: COMPLETED

**Plano permanece aberto (sem `-DONE-`)** até o teste de reboot do servidor ser feito e validado pelo usuário.
