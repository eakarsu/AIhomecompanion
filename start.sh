#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

load_env_file() {
  local env_file="$project_dir/.env"
  local key value
  [ -f "$env_file" ] || return 0
  while IFS='=' read -r key value; do
    key="${key#export }"
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    [ -z "${!key+x}" ] || continue
    value="${value%$'\r'}"
    if [[ "$value" == \"*\" && "$value" == *\" ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
      value="${value:1:${#value}-2}"
    fi
    export "$key=$value"
  done < "$env_file"
}

case "${1:-start}" in
  check) test -f "$project_dir/.env" || { echo "Missing .env" >&2; exit 1; }; test -d "$project_dir/backend/node_modules" || { echo "Run scripts/bootstrap.sh explicitly." >&2; exit 1; }; test -d "$project_dir/frontend/node_modules" || { echo "Run scripts/bootstrap.sh explicitly." >&2; exit 1; } ;;
  migrate) exec "$project_dir/scripts/migrate.sh" ;;
  start)
    "$0" check
    load_env_file
    export BIND_HOST="${BIND_HOST:-${BACKEND_HOST:-127.0.0.1}}"
    export BACKEND_PORT="${BACKEND_PORT:-${PORT:?PORT or BACKEND_PORT is required}}"
    export CLIENT_URL="${CLIENT_URL:-http://${FRONTEND_HOST:-127.0.0.1}:${FRONTEND_PORT:?FRONTEND_PORT or CLIENT_URL is required}}"
    export JWT_ISSUER="${JWT_ISSUER:-home-companion}"
    export JWT_AUDIENCE="${JWT_AUDIENCE:-home-companion-api}"
    for assigned_port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
      if lsof -nP -iTCP:"$assigned_port" -sTCP:LISTEN >/dev/null 2>&1; then
        echo "Assigned port $assigned_port is already occupied" >&2
        exit 1
      fi
    done
    (cd "$project_dir/backend" && exec node scripts/runtimeMigrate.js)
    (cd "$project_dir/backend" && exec node scripts/createAdmin.js)
    (cd "$project_dir/backend" && exec node server.js) &
    backend_pid=$!
    (cd "$project_dir/frontend" && exec env VITE_API_URL="http://127.0.0.1:$BACKEND_PORT/api" ./node_modules/.bin/vite --host "${FRONTEND_HOST:-127.0.0.1}" --port "$FRONTEND_PORT") &
    frontend_pid=$!
    cleanup() {
      trap - EXIT INT TERM
      kill "$backend_pid" "$frontend_pid" 2>/dev/null || true
      wait "$backend_pid" "$frontend_pid" 2>/dev/null || true
    }
    trap cleanup EXIT INT TERM
    wait "$backend_pid" "$frontend_pid"
    ;;
  *) echo "Usage: ./start.sh [check|migrate|start]" >&2; exit 64 ;;
esac
