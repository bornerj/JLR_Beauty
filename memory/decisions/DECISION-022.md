# DECISION-022 — Hospedagem: notebook Zorin → servidor Ubuntu com estrutura `/srv`; dados em bind mounts

Status: ACTIVE
Date: 2026-10-03

## Contexto

O projeto vivia num notebook Zorin Linux, num HD secundário dual-boot montado manualmente
(`/media/jeiel/...`), com PostgreSQL e uploads em volumes nomeados do Docker. Gerou um serviço de
contingência (`driveguard`, `ERR-0091`) e um script manual pós-boot (`fix-nginx.sh`, `ERR-0033`).
O usuário montou um servidor Ubuntu com estrutura `/srv/{projects,data,databases,backups,docker,models}`
e migrou o projeto para `/srv/projects/GitHub/JLR_Beauty`. A cópia de arquivos **não** trouxe banco nem
uploads (viviam em volumes Docker); foram exportados do Zorin (`pg_dump -Fc`, PG 16.15, + tar) e
restaurados (`PLAN-0038`, contagens por tabela idênticas, 41/41).

## Decisão

1. **Código** em `/srv/projects/GitHub/JLR_Beauty` (remote GitHub e chave SSH inalterados).
2. **Dados persistentes em bind mounts** sob `/srv`, parametrizados por `JLR_PG_DATA_DIR`,
   `JLR_UPLOADS_DIR`, `JLR_BACKUP_DIR` (default relativo `./.data/` para dev portável). Volumes
   nomeados `postgres_data`/`uploads_data` removidos.
3. **`driveguard` e `scripts/fix-nginx.sh` removidos** — causa raiz (drive externo montando depois do
   Docker) deixou de existir. `ERR-0033`/`ERR-0091` ficam como histórico, marcados "superado".
4. **Backup** por `scripts/backup.sh` (dump custom + uploads + SHA256SUMS, retenção, `--verify` com restore
   em banco temporário). Agendamento e cópia offsite: dispensados pelo usuário em 2026-10-03 (só há dados de teste) — reavaliar antes de dado real.
5. A aplicação (`apps/*`, schema, integrações) **não muda**.

## Consequências

- Dados visíveis e copiáveis direto do host; backup/restore independem do nome dos volumes.
- Boot do servidor não exige mais ação manual para o nginx.
- **Risco aceito/registrado:** `/srv` é um disco único — backup local não cobre falha de disco (offsite pendente).
- `CORS_ORIGIN` precisa listar cada endereço de acesso (login 403 em 2026-10-03 ao acessar por IP).
- Ver `docs/config/SERVIDOR_UBUNTU.md` para o mapa de `/srv` e a operação.
- Supera, para fins de ambiente, as notas de `ERR-0033`/`ERR-0091`; não conflita com nenhuma `DECISION` ACTIVE
  (verificado: 013–021 tratam de Admin V2, estoque, pagamento e conteúdo, não de hospedagem).
- **Adendo 2026-10-04 (PLAN-0039):** `docker-compose.yml`, `docker/postgres/init-api-users.sh` e `.env.docker.example` deixaram de ter senhas default
  para `jlr_api_rw`/`jlr_api_ro`. `DB_API_RW_PASSWORD` e `DB_API_RO_PASSWORD` agora são **obrigatórias** no `.env` (o compose e o init falham com
  mensagem clara se faltarem). Os diretórios `/srv/{databases,data,backups}` não devem ser movidos com a stack no ar (ver `SERVIDOR_UBUNTU.md`).
  Cron e cópia offsite do backup foram dispensados enquanto só houver dados de teste — reavaliar antes de dado real.

