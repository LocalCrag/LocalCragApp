#!/usr/bin/env bash
set -euo pipefail

# Local E2E runner for Cypress. Expects test-e2e.cfg server config in /server/src/config directory.
#
# What it does:
# - ensures the e2e database exists (as configured in test-e2e.cfg)
# - drops all tables (by recreating the public schema)
# - runs the cypress DB seeding script (server/scripts/setup_cypress_db.py)
# - starts server + client
# - waits for health checks
# - runs Cypress

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$ROOT_DIR/server"
CLIENT_DIR="$ROOT_DIR/client"

SERVER_HOST="${SERVER_HOST:-127.0.0.1}"
SERVER_PORT="${SERVER_PORT:-5001}"
CLIENT_HOST="${CLIENT_HOST:-localhost}"
CLIENT_PORT="${CLIENT_PORT:-4201}"

LOCALCRAG_CONFIG_PATH="${ROOT_DIR}/server/src/config/test-e2e.cfg"

SERVER_PID=""
CLIENT_PID=""

cleanup() {
  local exit_code=$?
  set +e

  if [[ -n "${CLIENT_PID}" ]] && kill -0 "$CLIENT_PID" 2>/dev/null; then
    kill "$CLIENT_PID" 2>/dev/null || true
    wait "$CLIENT_PID" 2>/dev/null || true
  fi

  if [[ -n "${SERVER_PID}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi

  exit $exit_code
}
trap cleanup EXIT INT TERM

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

wait_for_http() {
  local url="$1"
  local name="$2"
  local timeout_seconds="${3:-120}"

  local start
  start=$(date +%s)
  while true; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "$name is up: $url"
      return 0
    fi

    local now
    now=$(date +%s)
    if (( now - start >= timeout_seconds )); then
      echo "Timed out waiting for $name at $url" >&2
      return 1
    fi

    sleep 1
  done
}

cfg_get() {
  local key="$1"
  local file="$2"

  local line
  line="$(grep -E "^[[:space:]]*${key}[[:space:]]*=" "$file" | tail -n 1 || true)"
  [[ -n "$line" ]] || return 1

  local val
  val="${line#*=}"
  val="$(echo "$val" | sed -E 's/^[[:space:]]*//; s/[[:space:]]*$//')"
  val="$(echo "$val" | sed -E "s/^'(.*)'$/\1/; s/^\"(.*)\"$/\1/")"

  printf '%s' "$val"
}

parse_pg_uri() {
  # Parses: postgresql://user:pass@host:port/dbname
  local uri="$1"

  uri="${uri#postgresql://}"

  local auth_part="${uri%%@*}"
  local host_db_part="${uri#*@}"

  local user="${auth_part%%:*}"
  local pass="${auth_part#*:}"
  if [[ "$pass" == "$auth_part" ]]; then
    pass=""
  fi

  local hostport="${host_db_part%%/*}"
  local dbname="${host_db_part#*/}"

  local host="${hostport%%:*}"
  local port="${hostport#*:}"
  if [[ "$port" == "$hostport" ]]; then
    port="5432"
  fi

  printf '%s\n' "$user" "$pass" "$host" "$port" "$dbname"
}

main() {
  require_cmd psql
  require_cmd curl

  if [[ ! -f "${LOCALCRAG_CONFIG_PATH}" ]]; then
    echo "Missing config: ${LOCALCRAG_CONFIG_PATH}" >&2
    exit 1
  fi

  local pg_uri
  pg_uri="$(cfg_get SQLALCHEMY_DATABASE_URI "${LOCALCRAG_CONFIG_PATH}")" || {
    echo "Missing SQLALCHEMY_DATABASE_URI in ${LOCALCRAG_CONFIG_PATH}" >&2
    exit 1
  }

  local parsed
  parsed="$(parse_pg_uri "$pg_uri")" || {
    echo "Failed to parse SQLALCHEMY_DATABASE_URI: $pg_uri" >&2
    exit 1
  }

  local DB_USER DB_PASSWORD DB_HOST DB_PORT DB_NAME
  DB_USER="$(echo "$parsed" | sed -n '1p')"
  DB_PASSWORD="$(echo "$parsed" | sed -n '2p')"
  DB_HOST="$(echo "$parsed" | sed -n '3p')"
  DB_PORT="$(echo "$parsed" | sed -n '4p')"
  DB_NAME="$(echo "$parsed" | sed -n '5p')"

  echo "Using config: ${LOCALCRAG_CONFIG_PATH}"
  echo "Using DB: ${DB_NAME} (${DB_USER}@${DB_HOST}:${DB_PORT})"

  export PGPASSWORD="${DB_PASSWORD}"

  echo "Ensuring database exists: ${DB_NAME}"
  psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -v ON_ERROR_STOP=1 \
    -c "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" \
    | grep -q 1 \
    || psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -v ON_ERROR_STOP=1 \
      -c "CREATE DATABASE \"${DB_NAME}\";"

  echo "Resetting schema (dropping all tables)"
  psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 \
    -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO ${DB_USER}; GRANT ALL ON SCHEMA public TO public;"

  echo "Creating uuid extension"
  psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 \
    -f "${SERVER_DIR}/scripts/create_uuid_extension.sql"

  echo "Setting up/seeding database for Cypress"
  (
    cd "${ROOT_DIR}/server"
    export PYTHONPATH=".:src"
    export LOCALCRAG_CONFIG="${LOCALCRAG_CONFIG_PATH}"
    pipenv run python3 scripts/setup_cypress_db.py
  )

  echo "Starting server"
  (
    cd "${ROOT_DIR}/server/src"
    export PYTHONPATH=".:${ROOT_DIR}/server/src"
    export LOCALCRAG_CONFIG="${LOCALCRAG_CONFIG_PATH}"
    pipenv run flask run --host="${SERVER_HOST}" --port="${SERVER_PORT}"
  ) >/tmp/localcrag-e2e-server.log 2>&1 &
  SERVER_PID=$!

  echo "Starting client"
  (
    cd "${CLIENT_DIR}"
    npm run start -- --host 0.0.0.0 --port "${CLIENT_PORT}"
  ) >/tmp/localcrag-e2e-client.log 2>&1 &
  CLIENT_PID=$!

  wait_for_http "http://${SERVER_HOST}:${SERVER_PORT}/api/health" "server" 180
  wait_for_http "http://${CLIENT_HOST}:${CLIENT_PORT}" "client" 180

  echo "Running Cypress"
  (
    cd "${CLIENT_DIR}"
    # Prefer headless for a single command. Override with CYPRESS_MODE=open.
    if [[ "${CYPRESS_MODE:-run}" == "open" ]]; then
      npm run cypress
    else
      npx cypress run
    fi
  )

  echo "Cypress finished. Logs: /tmp/localcrag-e2e-server.log and /tmp/localcrag-e2e-client.log"
}

main "$@"
