#!/bin/bash
# Backup do JLR Beauty: dump do Postgres (pg_dump -Fc) + tar dos uploads.
# Ver docs/config/SERVIDOR_UBUNTU.md e memory/plans/PLAN-0038-MIGRACAO-SERVIDOR-UBUNTU-SRV.md
#
# Uso (a partir de qualquer pasta):
#   scripts/backup.sh            gera um backup novo e aplica a retenção
#   scripts/backup.sh --verify   além disso, restaura o dump num banco TEMPORÁRIO e
#                                compara a contagem de linhas com o banco real
#
# Variáveis (opcionais, lidas do ambiente ou do .env — só os nomes abaixo):
#   JLR_BACKUP_DIR      destino            (default /srv/backups/jlr_beauty)
#   JLR_UPLOADS_DIR     origem dos uploads (default ./.data/uploads)
#   BACKUP_RETENTION    nº de backups a manter (default 14)
#
# Nunca imprime valores do .env. O dump contém PII e hashes de senha: fica em
# JLR_BACKUP_DIR (fora do git, permissão 700).
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

# Lê apenas as variáveis necessárias do .env (sem `source`, para não executar nada).
env_get() {
  [ -f .env ] || return 0
  grep -E "^$1=" .env | tail -n1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'
}

backup_dir="${JLR_BACKUP_DIR:-$(env_get JLR_BACKUP_DIR)}"
backup_dir="${backup_dir:-/srv/backups/jlr_beauty}"
uploads_dir="${JLR_UPLOADS_DIR:-$(env_get JLR_UPLOADS_DIR)}"
uploads_dir="${uploads_dir:-$repo_root/.data/uploads}"
retention="${BACKUP_RETENTION:-14}"
verify=false
[ "${1:-}" = "--verify" ] && verify=true

stamp="$(date +%Y%m%d_%H%M%S)"
dest="$backup_dir/daily/$stamp"
umask 077
mkdir -p "$dest"

echo "[backup] destino: $dest"

# O pg_dump roda dentro do container; o shell redireciona para o host.
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > "$dest/jlrbeauty.dump"

# O dump precisa ser legível pelo pg_restore, senão não é backup.
docker compose exec -T postgres pg_restore --list < "$dest/jlrbeauty.dump" > /dev/null
echo "[backup] dump ok ($(du -h "$dest/jlrbeauty.dump" | cut -f1))"

if [ -d "$uploads_dir" ]; then
  tar czf "$dest/uploads.tar.gz" -C "$uploads_dir" .
  echo "[backup] uploads ok ($(du -h "$dest/uploads.tar.gz" | cut -f1))"
else
  echo "[backup] AVISO: pasta de uploads não encontrada ($uploads_dir) — uploads fora do backup" >&2
fi

(cd "$dest" && sha256sum ./* > SHA256SUMS)

if $verify; then
  tmp_db="jlr_verify_tmp"
  echo "[verify] restaurando num banco temporário ($tmp_db)…"
  docker compose exec -T postgres sh -c "psql -U \"\$POSTGRES_USER\" -d postgres -v ON_ERROR_STOP=1 -qc 'DROP DATABASE IF EXISTS $tmp_db' -c 'CREATE DATABASE $tmp_db'"
  trap 'docker compose exec -T postgres sh -c "psql -U \"\$POSTGRES_USER\" -d postgres -qc \"DROP DATABASE IF EXISTS '"$tmp_db"'\"" >/dev/null 2>&1 || true' EXIT

  docker compose exec -T postgres sh -c "pg_restore -U \"\$POSTGRES_USER\" -d $tmp_db --no-owner --exit-on-error" < "$dest/jlrbeauty.dump"

  count_sql="SELECT format('SELECT %L AS t, count(*) AS n FROM %I', tablename, tablename) FROM pg_tables WHERE schemaname='public' ORDER BY tablename \\gexec"
  counts() {
    docker compose exec -T postgres sh -c "psql -U \"\$POSTGRES_USER\" -d $1 -At -F' ' -f -" <<< "$count_sql"
  }
  live_db="$(docker compose exec -T postgres sh -c 'printf %s "$POSTGRES_DB"')"
  live="$(counts "$live_db")"
  restored="$(counts "$tmp_db")"

  # audit_logs/refresh_tokens/login_attempts crescem com o uso entre o dump e a contagem.
  if diff <(grep -vE '^(audit_logs|refresh_tokens|login_attempts) ' <<< "$live") \
          <(grep -vE '^(audit_logs|refresh_tokens|login_attempts) ' <<< "$restored") > /dev/null; then
    echo "[verify] OK — $(wc -l <<< "$restored") tabelas, contagens idênticas ao banco real"
  else
    echo "[verify] FALHA — contagens divergem:" >&2
    diff <(echo "$live") <(echo "$restored") >&2 || true
    exit 1
  fi
fi

# Retenção: mantém só os N backups mais recentes.
mapfile -t old < <(ls -1dt "$backup_dir"/daily/*/ 2>/dev/null | tail -n +"$((retention + 1))")
for d in "${old[@]}"; do
  rm -rf -- "$d"
  echo "[backup] removido (retenção $retention): $d"
done

echo "[backup] concluído: $dest"
