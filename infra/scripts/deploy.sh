#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

if [[ ! -f .env.production ]]; then
  echo "Missing .env.production. Copy .env.production.example and set real values first." >&2
  exit 1
fi

docker compose --env-file .env.production config --quiet
docker compose --env-file .env.production build api
docker compose --env-file .env.production up -d
docker compose --env-file .env.production ps

echo
echo "Deployment started. Check: curl http://127.0.0.1/api/healthz"