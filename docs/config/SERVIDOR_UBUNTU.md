# Servidor Ubuntu — organização em `/srv` e operação do JLR Beauty

> Desde 2026-10-03 o projeto roda num servidor Ubuntu (antes: notebook Zorin Linux, disco
> secundário em `/media/jeiel/...`). **A aplicação não mudou** — só onde ficam o código, os
> dados e os backups. Origem da mudança: `memory/plans/PLAN-0038-DONE-MIGRACAO-SERVIDOR-UBUNTU-SRV.md`
> e `memory/decisions/DECISION-022.md`.

## Mapa do `/srv`

`/srv` é uma partição única (`/dev/sda1`, ext4, label `DEV-DATA`, ~938 GB).

| Caminho | Dono | O que guarda | JLR Beauty usa? |
|---|---|---|---|
| `/srv/projects/GitHub/JLR_Beauty` | `jbsystemas` | **Código** (clone do `git@github.com:bornerj/JLR_Beauty.git`), `.env`, memória SFK | sim |
| `/srv/databases/jlr_beauty/postgres` | UID 999 (aparece como `dnsmasq` no host), modo 700 | **Dados do PostgreSQL** (bind mount em `/var/lib/postgresql/data`) | sim |
| `/srv/data/jlr_beauty/uploads` | `jbsystemas` | **Uploads** do Admin — imagens/mídias (bind mount em `/app/uploads`) | sim |
| `/srv/backups/jlr_beauty` | `jbsystemas` (`daily/` modo 700) | **Backups**: `daily/AAAAMMDD_HHMMSS/{jlrbeauty.dump,uploads.tar.gz,SHA256SUMS}`; `migracao-zorin/` guarda o export original do Zorin | sim |
| `/srv/docker` | `root` (modo 710) | `data-root` do Docker (imagens, camadas, volumes anônimos) — definido em `/etc/docker/daemon.json` | indireto |
| `/srv/models` | `jbsystemas` | Modelos de IA do servidor | não (reservado) |
| `/srv/lost+found` | `root` | Recuperação do ext4 | não |

Os três caminhos de dados do projeto são variáveis do `.env` (só **nomes** no `sfk.toml`; nunca
valores secretos):

| Variável | Valor no servidor | Default se omitida |
|---|---|---|
| `JLR_PG_DATA_DIR` | `/srv/databases/jlr_beauty/postgres` | `./.data/postgres` |
| `JLR_UPLOADS_DIR` | `/srv/data/jlr_beauty/uploads` | `./.data/uploads` |
| `JLR_BACKUP_DIR` | `/srv/backups/jlr_beauty` | `/srv/backups/jlr_beauty` (no `backup.sh`) |

O default relativo (`./.data/`, ignorado pelo git) mantém o projeto rodando em qualquer máquina
de desenvolvimento sem `/srv`.

## O que **não** mudou

Código, `apps/api`, `apps/web`, schema Prisma, migrations, nginx, portas (`80` público;
API `3001` interna), integrações (Mercado Pago, Z-API, Brevo) e as regras do SFK. Nenhuma
mudança de comportamento da aplicação.

## O que mudou

1. **Volumes nomeados → bind mounts** (`postgres_data`/`uploads_data` deixaram de existir): os
   dados são pastas comuns em `/srv`, visíveis e copiáveis sem passar pelo Docker.
2. **Serviço `driveguard` e `scripts/fix-nginx.sh` removidos.** Existiam por causa do HD externo do
   Zorin, montado à mão depois do Docker (`ERR-0033`/`ERR-0091`). O `/srv` é um disco fixo, montado
   no boot — a causa raiz não existe mais.
3. **`CORS_ORIGIN` precisa listar todo endereço pelo qual o navegador acessa** o sistema
   (`ERR` registrado em 2026-10-03: login dava 403 ao acessar por IP). Atual:
   `http://localhost,http://10.10.10.2,http://192.168.0.14`. Novo endereço/domínio → acrescentar
   (separado por vírgula) e recriar a API: `docker compose up -d api` (`restart` **não** relê o `.env`).

## Operação diária (na raiz do projeto)

```bash
cd /srv/projects/GitHub/JLR_Beauty
docker compose ps                     # estado dos serviços
docker compose up -d                  # subir tudo
docker compose up -d --build api web  # após mudar código
docker compose logs -f api            # logs
docker compose down                   # parar (os dados em /srv permanecem)
```

Ao reiniciar o servidor, os containers voltam sozinhos (`restart: unless-stopped`). Não há mais
passo manual pós-boot.

## Backup

```bash
scripts/backup.sh            # dump (pg_dump -Fc) + uploads + SHA256SUMS; mantém os 14 mais recentes
scripts/backup.sh --verify   # idem + restaura num banco TEMPORÁRIO e compara contagens por tabela
```

- Variáveis opcionais: `BACKUP_RETENTION` (default 14), `JLR_BACKUP_DIR`.
- Agendamento sugerido (**não instalado** — decidir e instalar com `crontab -e`):
  `30 3 * * * /srv/projects/GitHub/JLR_Beauty/scripts/backup.sh >> /srv/backups/jlr_beauty/backup.log 2>&1`
- ⚠️ **Disco único:** `/srv/databases`, `/srv/data` e `/srv/backups` ficam na mesma partição. O
  backup protege contra erro humano e corrupção lógica, **não contra falha do disco**. Copie
  `/srv/backups/jlr_beauty/daily/` periodicamente para outro disco/máquina (offsite) — ainda não
  configurado.
- ⚠️ Os dumps contêm dados pessoais e hashes de senha: modo 700, fora do git, nunca em chat.

## Restore (banco novo ou recuperação)

Backup zerado/novo servidor — **suba só o Postgres antes** (a API roda `migrate deploy` no boot e
conflitaria com o restore num banco vazio):

```bash
cd /srv/projects/GitHub/JLR_Beauty
mkdir -p /srv/databases/jlr_beauty/postgres /srv/data/jlr_beauty/uploads
docker compose up -d postgres        # init cria o banco vazio + roles jlr_api_rw/ro
B=/srv/backups/jlr_beauty/daily/<AAAAMMDD_HHMMSS>
( cd "$B" && sha256sum -c SHA256SUMS )
docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --exit-on-error' < "$B/jlrbeauty.dump"
tar xzf "$B/uploads.tar.gz" -C /srv/data/jlr_beauty/uploads
docker compose up -d                 # api: "No pending migrations"
```

## Docker e permissões

- `docker` roda sem sudo para o usuário `jbsystemas` (grupo `docker`).
- `/srv/docker` é do root: não mexer à mão. Para ver espaço: `docker system df`.
- A pasta do Postgres pertence ao UID 999 do container (no host o nome é `dnsmasq`, mera coincidência
  de UID) e tem modo 700: **`jbsystemas` não consegue ler os arquivos dela diretamente**. É esperado —
  para backup use `scripts/backup.sh` (`pg_dump`), nunca copie essa pasta com o banco no ar.

## Pendências conhecidas do ambiente

- Teste de **reboot do servidor** (dados persistem + serviços voltam) — aguardando janela.
- Backup **offsite** e agendamento via cron — dispensados em 2026-10-03 (só há dados de teste). Reavaliar antes de entrar dado real.
- Senhas das roles `jlr_api_rw`/`jlr_api_ro` iguais aos defaults de desenvolvimento versionados
  (achado de segurança, plano próprio).
- HTTPS/domínio: `PLAN-0019` (bloqueado). `APP_WEB_URL` ainda `http://localhost`.
