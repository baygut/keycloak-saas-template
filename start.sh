#!/usr/bin/env bash
# start.sh — Bootstrap the full keycloak-saas-template stack from zero.
#
# What it does:
#   1. Verify prerequisites
#   2. npm install (if node_modules is absent)
#   3. docker compose up -d
#   4. Wait for Postgres, Keycloak, and OpenFGA to be ready
#   5. Ensure .env.local exists with required base vars
#   6. npm run db:push  (creates/migrates the SQLite schema)
#   7. node scripts/seed.mjs  (idempotent blog seed)
#   8. npm run openfga:bootstrap  (store + model + owner tuples → .env.local)
#   9. npm run dev  (Next.js dev server, backgrounded)
#  10. Wait for http://localhost:3000 and print a ready banner

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

info()    { echo -e "${CYAN}[start]${RESET} $*"; }
success() { echo -e "${GREEN}[start]${RESET} $*"; }
warn()    { echo -e "${YELLOW}[start]${RESET} $*"; }
die()     { echo -e "${RED}[start] ERROR:${RESET} $*" >&2; exit 1; }

# ── 1. Prerequisites ────────────────────────────────────────────────────────

for cmd in node npm docker curl; do
  command -v "$cmd" &>/dev/null || die "'$cmd' is not installed or not in PATH."
done

docker info &>/dev/null || die "Docker daemon is not running. Start Docker and try again."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── 2. npm install ───────────────────────────────────────────────────────────

if [[ ! -d node_modules ]]; then
  info "node_modules not found — running npm install..."
  npm install --silent
  success "npm install complete."
fi

# ── 3. Docker Compose ────────────────────────────────────────────────────────

info "Starting Docker services (Keycloak, Postgres, OpenFGA)..."
docker compose up -d
success "Docker Compose started."

# ── 4. Wait for services ─────────────────────────────────────────────────────

wait_http() {
  local name="$1" url="$2" max="${3:-120}" interval=3
  info "Waiting for $name at $url ..."
  local elapsed=0
  until curl -sf "$url" &>/dev/null; do
    sleep "$interval"
    elapsed=$((elapsed + interval))
    if [[ $elapsed -ge $max ]]; then
      die "$name did not become ready within ${max}s. Check 'docker compose logs'."
    fi
    echo -ne "  ${YELLOW}waiting${RESET} ${elapsed}s / ${max}s\r"
  done
  echo -e "  ${GREEN}ready${RESET} (${elapsed}s)                 "
  success "$name is ready."
}

wait_port() {
  local name="$1" host="$2" port="$3" max="${4:-60}" interval=3
  info "Waiting for $name on $host:$port ..."
  local elapsed=0
  until (echo > /dev/tcp/"$host"/"$port") &>/dev/null; do
    sleep "$interval"
    elapsed=$((elapsed + interval))
    if [[ $elapsed -ge $max ]]; then
      die "$name port $port did not open within ${max}s."
    fi
    echo -ne "  ${YELLOW}waiting${RESET} ${elapsed}s / ${max}s\r"
  done
  echo -e "  ${GREEN}open${RESET} (${elapsed}s)                   "
  success "$name is ready."
}

wait_port "Postgres"  "127.0.0.1" 5432 90
wait_http "OpenFGA"   "http://localhost:8081/healthz"     30
wait_http "Keycloak"  "http://localhost:9000/health/ready" 30

# ── 5. Ensure .env.local ─────────────────────────────────────────────────────

ENV_LOCAL=".env.local"

# Append a KEY=VALUE line only if the key is not already present in the file.
ensure_env_var() {
  local file="$1" key="$2" value="$3"
  if ! grep -q "^${key}=" "$file" 2>/dev/null; then
    echo "${key}=${value}" >> "$file"
    info "  Added ${key} to $file"
  fi
}

if [[ ! -f "$ENV_LOCAL" ]]; then
  info "Creating $ENV_LOCAL..."
  touch "$ENV_LOCAL"
fi

ensure_env_var "$ENV_LOCAL" "KEYCLOAK_URL"                  "http://localhost:8080"
ensure_env_var "$ENV_LOCAL" "KEYCLOAK_REALM"                "myrealm"
ensure_env_var "$ENV_LOCAL" "KEYCLOAK_CLIENT_ID"            "my-nextjs-client"
ensure_env_var "$ENV_LOCAL" "KEYCLOAK_CLIENT_SECRET"        ""
ensure_env_var "$ENV_LOCAL" "DATABASE_URL"                  "file:./data/app.sqlite"
ensure_env_var "$ENV_LOCAL" "NEXT_PUBLIC_APP_URL"           "http://localhost:3000"
ensure_env_var "$ENV_LOCAL" "SERVICE_NAME"                  "keycloak-saas-template"
ensure_env_var "$ENV_LOCAL" "OPENFGA_API_URL"               "http://localhost:8081"
ensure_env_var "$ENV_LOCAL" "OPENFGA_STORE_ID"              ""
ensure_env_var "$ENV_LOCAL" "OPENFGA_AUTHORIZATION_MODEL_ID" ""

success "$ENV_LOCAL is up to date."

# ── 6. DB push ───────────────────────────────────────────────────────────────

mkdir -p prisma/data
info "Pushing Prisma schema to SQLite..."
npm run db:push --silent
success "Database schema is up to date."

# ── 7. Seed data ─────────────────────────────────────────────────────────────

info "Seeding demo blog posts..."
npm run db:seed
success "Seed complete."

# ── 8. OpenFGA bootstrap ─────────────────────────────────────────────────────

# Only bootstrap if OPENFGA_STORE_ID is not already populated in .env.local
if grep -q "^OPENFGA_STORE_ID=$" "$ENV_LOCAL" 2>/dev/null || \
   ! grep -q "^OPENFGA_STORE_ID=" "$ENV_LOCAL" 2>/dev/null; then
  info "Running OpenFGA bootstrap (store + model + owner tuples)..."
  npm run openfga:bootstrap
  success "OpenFGA bootstrap complete."
else
  info "OpenFGA already bootstrapped (OPENFGA_STORE_ID present in $ENV_LOCAL). Skipping."
fi

# ── 9. Start Next.js dev server ───────────────────────────────────────────────

info "Starting Next.js dev server..."
npm run dev &
DEV_PID=$!

cleanup() {
  if kill -0 "$DEV_PID" 2>/dev/null; then
    info "Stopping Next.js dev server (PID $DEV_PID)..."
    kill "$DEV_PID"
  fi
}
trap cleanup EXIT INT TERM

# ── 10. Wait for Next.js and print banner ─────────────────────────────────────

info "Waiting for Next.js to be ready on http://localhost:3000 ..."
elapsed=0
max=120
interval=3
until curl -sf "http://localhost:3000" &>/dev/null; do
  sleep "$interval"
  elapsed=$((elapsed + interval))
  if [[ $elapsed -ge $max ]]; then
    warn "Next.js did not respond within ${max}s. It may still be compiling."
    break
  fi
  echo -ne "  ${YELLOW}waiting${RESET} ${elapsed}s / ${max}s\r"
done

echo ""
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}${GREEN}  Stack is ready!${RESET}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  ${BOLD}App${RESET}         http://localhost:3000"
echo -e "  ${BOLD}Keycloak${RESET}    http://localhost:8080  (admin / admin)"
echo -e "  ${BOLD}OpenFGA${RESET}     http://localhost:8081"
echo ""
echo -e "  ${BOLD}Demo accounts${RESET} (all use password: ${CYAN}123123${RESET})"
echo -e "    ${CYAN}demo.user${RESET}    — regular user"
echo -e "    ${CYAN}demo.user2${RESET}   — regular user"
echo -e "    ${CYAN}keymate${RESET}      — regular user"
echo -e "    ${CYAN}baygut${RESET}       — regular user"
echo -e "    ${CYAN}admin.user${RESET}   — admin (full dashboard access)"
echo ""
echo -e "  Press ${BOLD}Ctrl+C${RESET} to stop the dev server."
echo ""

# Keep script alive so Ctrl+C cleanly stops the dev server
wait "$DEV_PID"
