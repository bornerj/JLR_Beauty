# PLAN-0039 — Rotação das senhas das roles `jlr_api_rw` / `jlr_api_ro` e remoção dos defaults versionados

**Status:** 🟢 EXECUTADO (Ondas 1-5) em 2026-10-03 — falta confirmação de login do usuário, commit/push e rename `-DONE-`. Incidente no meio: usuário moveu `/srv/{data,databases,backups}` para `/srv/projects/` por engano; revertido sem perda antes de qualquer passo destrutivo (ver `MODIFICATION_LOG`).
**Escopo macro:** `.env` (não versionado), roles do Postgres (`ALTER ROLE`), `docker-compose.yml`, `docker/postgres/init-api-users.sh`, `.env.docker.example`, `docs/`, `memory/`. **Zero mudança em `apps/api`/`apps/web`**, zero migration Prisma.
**Agente de apoio:** `@devops-engineer` + `@security-auditor` (achado de segurança herdado do `PLAN-0038`, Riscos #4).

---

## STAR

**Situation (verificado em 2026-10-03, valores nunca exibidos):**
- `DB_API_RW_PASSWORD` e `DB_API_RO_PASSWORD` do `.env` são **idênticos** aos defaults escritos em `docker-compose.yml` (linhas 11-12) e `docker/postgres/init-api-users.sh` (`${…:-default}`), ambos versionados no GitHub (`origin` = `bornerj/JLR_Beauty`; visibilidade do repo não verificada — `gh` ausente).
- `DATABASE_URL` (usada pela API em runtime) embute a senha de `jlr_api_rw`. `DATABASE_MIGRATION_URL` usa o dono (`jlrbeauty`); `POSTGRES_PASSWORD` **já difere** do example/defaults — fica fora da rotação.
- `jlr_api_ro` não é usada por nenhum código do projeto (só aparece no compose/init) — rotacionar mesmo assim, para não deixar credencial conhecida.
- `init-api-users.sh` só roda em data dir **vazio**; portanto mudar `.env` sozinho **não** altera as roles já existentes — é preciso `ALTER ROLE`.
- Porta 5432 não é publicada no host (somente rede interna do Docker) → exposição atual é baixa; dados são de teste (`DECISION-022`).

**Task:** (1) trocar as duas senhas por valores aleatórios fortes que nunca passam por chat/log/git; (2) manter `.env`, `DATABASE_URL` e roles do banco em sincronia; (3) eliminar os defaults públicos para que a falha seja explícita, não silenciosa; (4) provar que a API segue funcionando.
**Restrições:** nunca imprimir senha; `.env` não vai a git; sem commit/push sem dupla aprovação; API fica indisponível por segundos durante o `up -d`.

**Action:** ondas abaixo. **Result:** roles com senhas novas, API `healthy` conectando com a senha nova, senha antiga **rejeitada** pelo Postgres, repo sem defaults de senha.

---

## Ondas

### Onda 1 — Preparação e rede de segurança
- [ ] Copiar `.env` para `/srv/backups/jlr_beauty/env-pre-PLAN-0039.bak` com `chmod 600` (rollback; fica fora do git e do repo).
- [ ] `scripts/backup.sh` para ter um dump fresco antes de mexer (rápido, dados de teste).
- [ ] Confirmar `docker compose ps` saudável (baseline).

### Onda 2 — Gerar e aplicar (sem exibir segredos)
- [ ] Gerar 2 senhas com `openssl rand -hex 24` (hex: seguro dentro da URL do `DATABASE_URL`, sem escape).
- [ ] `ALTER ROLE jlr_api_rw / jlr_api_ro PASSWORD …` via `psql` lendo a senha de variável de shell (não vai em argumento de processo nem em histórico).
- [ ] Reescrever no `.env`: `DB_API_RW_PASSWORD`, `DB_API_RO_PASSWORD` e a senha dentro de `DATABASE_URL` (script que não ecoa valores; `chmod 600` mantido).
- [ ] `docker compose up -d api` (recria; `restart` não relê o `.env`).

### Onda 3 — Remover os defaults públicos
- [ ] `docker-compose.yml`: `${DB_API_RW_PASSWORD:?defina no .env}` (idem RO) — falha alto se faltar.
- [ ] `docker/postgres/init-api-users.sh`: remover os fallbacks; abortar com mensagem clara se vazio.
- [ ] `.env.docker.example`: placeholders explícitos (`troque-por-senha-forte`), com comentário de como gerar (`openssl rand -hex 24`).
- [ ] `docker compose config -q` com `.env` atual passa; sem `.env` falha com a mensagem esperada.

### Onda 4 — Validação (prova, não suposição)
- [ ] `docker compose ps`: api `healthy`; `GET /` 200; login MASTER via API real (usuário faz no navegador) e um `GET /api/public/services/featured` 200.
- [ ] Do container postgres: login com a senha **antiga** (default) como `jlr_api_rw` e `jlr_api_ro` → deve **falhar** (`password authentication failed`); com a nova → ok.
- [ ] Logs da api sem erro de autenticação.
- [ ] `grep` no repo pelos defaults antigos: zero ocorrência fora de `memory/` (histórico) — e nenhum valor novo em arquivo versionado.

### Onda 5 — Documentação e memória
- [ ] `docs/config/SERVIDOR_UBUNTU.md`: seção curta "Rotação de senhas das roles" (como gerar, `ALTER ROLE`, atualizar `DATABASE_URL`, recriar api).
- [ ] `memory/MODIFICATION_LOG.md`, `memory/progress.md`, este plano → `-DONE-` com Git Record; `memory/logs/BUILD-HISTORY.md` (mudança de credencial de banco, sem valores); `PR-0002-DESCRIPTION.md`.

---

## Riscos

1. **Dessincronia** `.env` × banco derruba a API. Mitigação: Onda 2 aplica `ALTER ROLE` e `.env` na mesma execução; rollback abaixo.
2. **Histórico do git** continua contendo os defaults antigos. Aceito: depois da rotação eles não abrem mais nada; reescrever histórico (force-push) não vale o risco.
3. **Outros ambientes** que reutilizem os defaults (o notebook Zorin, ainda com a cópia antiga) continuam com a senha antiga — irrelevante para este servidor, mas vale saber.
4. **Reinstalação futura** com data dir vazio: o init agora exige as variáveis (comportamento desejado).

**Rollback:** restaurar `/srv/backups/jlr_beauty/env-pre-PLAN-0039.bak` sobre `.env`, `ALTER ROLE` de volta para o valor antigo (que está no backup), `docker compose up -d api`. Dump fresco da Onda 1 cobre o pior caso.

## Critérios de aceite
- Roles com senhas novas; senha antiga rejeitada; API `healthy`.
- Nenhum segredo (novo ou antigo) em arquivo versionado atual nem na saída da sessão.
- `docker compose config` falha com mensagem clara se faltar a senha.
- Docs, log, progress e BUILD-HISTORY atualizados.

## Git Record of Delivery
- Step 1 (Pre-commit review): _pendente_
- Step 2 (Commit authorization): _pendente_
- Step 3 (Commit confirmation): _pendente_
- Step 4 (Push authorization and result): _pendente_
- Push status: PENDING
