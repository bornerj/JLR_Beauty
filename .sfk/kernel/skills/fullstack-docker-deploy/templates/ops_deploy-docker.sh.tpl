#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f ".env" ]]; then
  echo "ERROR: .env not found. Create it from .env.example first."
  exit 1
fi

echo "[1/5] Build and start production stack"
docker compose -f docker-compose.prod.yml --env-file .env up -d --build --remove-orphans

echo "[2/5] Optional backend migration"
MIGRATION_CMD="${BACKEND_MIGRATION_CMD:-}"
if [[ -n "${MIGRATION_CMD}" ]]; then
  docker compose -f docker-compose.prod.yml --env-file .env exec -T backend sh -lc "${MIGRATION_CMD}"
else
  echo "No BACKEND_MIGRATION_CMD configured. Skipping."
fi

echo "[3/5] Backend health check"
docker compose -f docker-compose.prod.yml --env-file .env exec -T backend sh -lc "wget -qO- http://localhost:3001/health >/dev/null"

echo "[4/5] Frontend health check"
docker compose -f docker-compose.prod.yml --env-file .env exec -T frontend sh -lc "wget -qO- http://localhost:3000/ >/dev/null"

echo "[5/5] Deployment complete"
docker compose -f docker-compose.prod.yml --env-file .env ps

