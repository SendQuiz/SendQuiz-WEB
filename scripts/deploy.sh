#!/usr/bin/env bash
set -euo pipefail
cd /opt/sendquiz
: "${SEND_WEB_IMAGE:?SEND_WEB_IMAGE is required}"
docker compose -p sendquiz pull send-web
docker compose -p sendquiz run --rm --no-deps send-web node scripts/migrate-db.ts
docker compose -p sendquiz up -d --no-deps --wait --wait-timeout 120 send-web
curl --fail --silent --show-error --retry 5 --retry-delay 2 --retry-all-errors https://sendquiz.net/ -o /dev/null
curl --fail --silent --show-error https://www.sendquiz.net/ -o /dev/null
