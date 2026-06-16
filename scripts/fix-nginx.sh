#!/bin/bash
# Reativa o nginx após montar o drive de desenvolvimento.
# Necessário toda vez que o computador é ligado, pois o Docker sobe
# antes do drive externo ser montado manualmente pelo usuário.
# Ver: memory/logs/DEBUG-HISTORY.md — ERR-0033
set -e

echo "Recriando container nginx com config do drive montado..."
docker compose up -d --force-recreate nginx
echo "Nginx pronto. Acesse http://localhost"
