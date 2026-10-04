# PR-0002 — Rotação das senhas das roles do banco e remoção dos defaults públicos

## Título
`fix(security): remove senhas default do compose/init e rotaciona jlr_api_rw/ro (PLAN-0039)`

## Objetivo
Fechar o achado de segurança do PLAN-0038: as senhas de `jlr_api_rw`/`jlr_api_ro` eram idênticas a defaults versionados no repositório.

## O que foi feito
- `docker-compose.yml` e `docker/postgres/init-api-users.sh`: fallbacks de senha removidos; variável ausente agora aborta com mensagem clara (`${VAR:?…}`).
- `.env.docker.example`: placeholders explícitos e instrução de geração (`openssl rand -hex 24`).
- Fora do git (feito no servidor): 2 senhas novas aplicadas com `ALTER ROLE`, `.env` e `DATABASE_URL` sincronizados, postgres e api recriados.
- `docs/config/SERVIDOR_UBUNTU.md`: procedimento de rotação + aviso de não mover `/srv/{databases,data,backups}`.
- Memória: `PLAN-0039`, `MODIFICATION_LOG`, `BUILD-HISTORY`, `progress.md`.

## Áreas afetadas
`docker-compose.yml`, `docker/postgres/`, `.env.docker.example`, `docs/config/`, `memory/`. **Sem mudança em `apps/*`, sem migration.**

## Validações
Senha antiga rejeitada e nova aceita pela rede (`psql -h postgres`); 41 tabelas / 15 migrations / 69 uploads intactos; api `healthy`; site e API pública 200; login MASTER confirmado pelo usuário; `docker compose config` falha sem as variáveis; nenhum valor de senha no diff.

## Riscos/observações
- Histórico do git ainda contém os defaults antigos (inertes após a rotação).
- Incidente no meio da execução: diretórios `/srv/*` movidos por engano e revertidos sem perda (ver `MODIFICATION_LOG`).
- Instalações novas passam a exigir as variáveis no `.env`.
