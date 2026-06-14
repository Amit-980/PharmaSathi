#!/bin/sh
set -eu

mkdir -p backups
timestamp="$(date +%Y%m%d-%H%M%S)"
docker compose exec -T database pg_dump \
  -U "${POSTGRES_USER:?POSTGRES_USER is required}" \
  -d "${POSTGRES_DB:?POSTGRES_DB is required}" \
  --format=custom > "backups/pharmasathi-${timestamp}.dump"

find backups -type f -name 'pharmasathi-*.dump' -mtime +30 -delete
echo "Backup created: backups/pharmasathi-${timestamp}.dump"
