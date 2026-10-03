# PR-0001 — Migração para servidor Ubuntu: dados em `/srv`, backup e documentação

## Título
`chore(infra): migra para servidor Ubuntu — bind mounts em /srv, backup.sh e docs (PLAN-0038)`

## Objetivo
Adaptar o projeto ao novo servidor (`/srv/{projects,data,databases,backups,docker,models}`) sem alterar o
comportamento da aplicação, restaurar os dados vindos do notebook Zorin e documentar a nova organização.

## O que foi feito
- `docker-compose.yml`: volumes nomeados → bind mounts parametrizados (`JLR_PG_DATA_DIR`, `JLR_UPLOADS_DIR`);
  `driveguard` removido (causa raiz era o HD externo do Zorin).
- `scripts/backup.sh` novo (dump `-Fc` + uploads + SHA256SUMS + retenção + `--verify`); `scripts/fix-nginx.sh` removido.
- `docs/config/SERVIDOR_UBUNTU.md` novo; `DEPLOY_VPS.md` e `sfk.toml` atualizados.
- Memória: `PLAN-0038`, `DECISION-022`, `ERR-0096` (CORS no login por IP), `ERR-0088` (backfill), `ERR-0033/0091` marcados superados, `BUILD-HISTORY`.
- Fora do git (feito no servidor): `.env` (variáveis de caminho + `CORS_ORIGIN` com os IPs de acesso), restore do banco/uploads.

## Áreas/arquivos afetados
`docker-compose.yml`, `.env.docker.example`, `.gitignore`, `sfk.toml`, `scripts/`, `docs/config/`, `memory/`.
**Nenhuma mudança em `apps/api` ou `apps/web`; nenhuma migration.**

## Validações
`docker compose config` OK; build das 3 imagens OK; `pg_restore --exit-on-error` exit 0; contagem das 41 tabelas
idêntica Zorin × servidor; 15/15 migrations; 69 uploads servidos; login MASTER e telas confirmados pelo usuário;
`scripts/backup.sh --verify` OK (restore em banco temporário com contagens idênticas).

## Notas e riscos
- **Pendente:** teste de reboot do servidor; cron + cópia offsite do backup (disco único `sda1`).
- **Achado de segurança (fora deste PR):** senhas das roles `jlr_api_rw/ro` no `.env` iguais aos defaults versionados.
- Quem clonar em outra máquina: `.env` próprio; sem `JLR_*`, o compose usa `./.data/` (ignorado pelo git).
