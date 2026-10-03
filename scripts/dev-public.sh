#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEV_HOST="dev.sendquiz.net"
PUBLIC_URL="https://${DEV_HOST}"
NEXT_PORT="${PORT:-3006}"
CERT_DIR=".cache/dev-certs"
CERT_FILE="${CERT_DIR}/${DEV_HOST}.pem"
KEY_FILE="${CERT_DIR}/${DEV_HOST}-key.pem"

cd "$ROOT_DIR"

echo "로컬 개발 서버 URL: ${PUBLIC_URL}"

ensure_dev_host_mapping() {
  local resolved_ips
  resolved_ips="$(dscacheutil -q host -a name "$DEV_HOST" 2>/dev/null | awk '/ip_address:/ { print $2 }' | sort -u | tr '\n' ' ')"

  if printf '%s\n' "$resolved_ips" | grep -Eq '(^| )(127\.|::1)( |$)'; then
    return
  fi

  echo "${DEV_HOST}을 로컬 개발 서버(127.0.0.1)로 매핑합니다."
  echo "sendquiz.net은 프로덕션 도메인이므로 수정하지 않습니다."

  local hosts_tmp
  hosts_tmp="$(mktemp)"
  awk -v host="$DEV_HOST" '
    /^[[:space:]]*#/ { print; next }
    {
      keep = 1
      for (i = 1; i <= NF; i++) {
        if ($i == host) keep = 0
      }
      if (keep) print
    }
  ' /etc/hosts > "$hosts_tmp"
  printf '127.0.0.1 %s\n' "$DEV_HOST" >> "$hosts_tmp"

  if [[ -w /etc/hosts ]]; then
    cp "$hosts_tmp" /etc/hosts
  else
    sudo cp "$hosts_tmp" /etc/hosts
  fi
  rm -f "$hosts_tmp"

  dscacheutil -flushcache >/dev/null 2>&1 || true
  killall -HUP mDNSResponder >/dev/null 2>&1 || true
}

ensure_dev_host_mapping

if lsof -nP -iTCP:443 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "443 포트는 이미 사용 중입니다. 기존 Caddy 게이트웨이를 사용하고 Send Next만 ${NEXT_PORT}에서 실행합니다."
  PORT="$NEXT_PORT" next dev -H 127.0.0.1 -p "$NEXT_PORT"
  exit $?
fi

mkdir -p "$CERT_DIR"
if [[ ! -f "$CERT_FILE" || ! -f "$KEY_FILE" ]]; then
  mkcert -cert-file "$CERT_FILE" -key-file "$KEY_FILE" "$DEV_HOST"
fi

caddy run --config Caddyfile.dev --adapter caddyfile &
CADDY_PID=$!

PORT="$NEXT_PORT" next dev -H 127.0.0.1 -p "$NEXT_PORT" &
NEXT_PID=$!

cleanup() {
  kill "$CADDY_PID" "$NEXT_PID" 2>/dev/null || true
  wait "$CADDY_PID" "$NEXT_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

while kill -0 "$CADDY_PID" 2>/dev/null && kill -0 "$NEXT_PID" 2>/dev/null; do
  sleep 1
done
