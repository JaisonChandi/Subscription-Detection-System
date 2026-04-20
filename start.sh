#!/bin/bash
# ════════════════════════════════════════════════════════════════
#  Subscription Detection System — START
#  One script to rule them all 🚀
# ════════════════════════════════════════════════════════════════

# Ensure common paths are in the PATH
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin

# Auto-detect project directory (works no matter where the project lives)
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT=5001
FRONTEND_PORT=3001
PSQL_BIN=$(find /Library/PostgreSQL /usr/local /opt/homebrew -name "psql" -type f 2>/dev/null | head -1)
if [ -z "$PSQL_BIN" ]; then PSQL_BIN="psql"; fi
DB_NAME="subscription_db"
DB_USER="postgres"
DB_PASSWORD="postgres"

# Colors for pretty output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_step()  { echo -e "\n${CYAN}═══ $1 ═══${NC}"; }
print_ok()    { echo -e "  ${GREEN}✅ $1${NC}"; }
print_warn()  { echo -e "  ${YELLOW}⚠️  $1${NC}"; }
print_fail()  { echo -e "  ${RED}❌ $1${NC}"; }

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║   🔔  Subscription Detection System — START      ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# ── Step 0: Kill any previous instances ────────────────────────
print_step "Step 0 — Cleaning up old processes"
lsof -ti:${BACKEND_PORT} | xargs kill -9 2>/dev/null
lsof -ti:${FRONTEND_PORT} | xargs kill -9 2>/dev/null
print_ok "Ports ${BACKEND_PORT} & ${FRONTEND_PORT} cleared"

# ── Step 1: Check PostgreSQL ──────────────────────────────────
print_step "Step 1 — Checking PostgreSQL"

if PGPASSWORD="$DB_PASSWORD" "$PSQL_BIN" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &>/dev/null; then
  print_ok "PostgreSQL is running and accessible"
else
  print_warn "PostgreSQL is NOT responding on standard connection"
  echo "       Attempting to start via Docker..."
  if command -v docker &>/dev/null; then
    cd "$PROJECT_DIR"
    docker compose up -d db
    echo "       Waiting for PostgreSQL to be ready..."
    for i in {1..15}; do
      if PGPASSWORD="$DB_PASSWORD" "$PSQL_BIN" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &>/dev/null; then
        break
      fi
      sleep 1
    done
  else
    print_fail "Docker not found and local PostgreSQL connection failed."
    print_warn "Please ensure PostgreSQL is running at localhost:5432"
    exit 1
  fi
fi

# Verify DB connection
if PGPASSWORD="$DB_PASSWORD" "$PSQL_BIN" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &>/dev/null; then
  print_ok "Connected to database '${DB_NAME}'"
else
  print_fail "Cannot connect to database '${DB_NAME}'"
  echo "       Check that PostgreSQL is running and password is correct."
  exit 1
fi

# ── Step 2: Ensure .env exists ─────────────────────────────────
print_step "Step 2 — Checking environment config"

if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
  cat > "$PROJECT_DIR/backend/.env" << ENVFILE
PORT=${BACKEND_PORT}
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
ENVFILE
  print_ok "Created backend/.env"
else
  print_ok "backend/.env already exists"
fi

# ── Step 3: Install dependencies (only if needed) ─────────────
print_step "Step 3 — Checking dependencies"

if [ ! -d "$PROJECT_DIR/backend/node_modules" ]; then
  echo "  📥 Installing backend dependencies..."
  cd "$PROJECT_DIR/backend" && npm install --silent
  print_ok "Backend dependencies installed"
else
  print_ok "Backend dependencies already installed"
fi

if [ ! -d "$PROJECT_DIR/frontend/node_modules" ]; then
  echo "  📥 Installing frontend dependencies..."
  cd "$PROJECT_DIR/frontend" && npm install --silent
  print_ok "Frontend dependencies installed"
else
  print_ok "Frontend dependencies already installed"
fi

# ── Step 4: Start backend ─────────────────────────────────────
print_step "Step 4 — Starting Backend (port ${BACKEND_PORT})"

cd "$PROJECT_DIR/backend"
npm run dev > /tmp/sds-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
for i in {1..10}; do
  if curl -s http://localhost:${BACKEND_PORT}/health &>/dev/null; then
    break
  fi
  sleep 1
done

if curl -s http://localhost:${BACKEND_PORT}/health &>/dev/null; then
  print_ok "Backend running → http://localhost:${BACKEND_PORT}  (PID: $BACKEND_PID)"
else
  print_fail "Backend failed to start. Check /tmp/sds-backend.log"
  exit 1
fi

# ── Step 5: Start frontend ────────────────────────────────────
print_step "Step 5 — Starting Frontend (port ${FRONTEND_PORT})"

cd "$PROJECT_DIR/frontend"
PORT=${FRONTEND_PORT} BROWSER=none npm start > /tmp/sds-frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to be ready
for i in {1..30}; do
  if curl -s http://localhost:${FRONTEND_PORT} &>/dev/null; then
    break
  fi
  sleep 1
done

if curl -s http://localhost:${FRONTEND_PORT} &>/dev/null; then
  print_ok "Frontend running → http://localhost:${FRONTEND_PORT}  (PID: $FRONTEND_PID)"
else
  print_warn "Frontend still compiling... check /tmp/sds-frontend.log"
fi

# ── Done! ──────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║         🎉  ALL SYSTEMS GO!                      ║"
echo "╠═══════════════════════════════════════════════════╣"
echo "║  Frontend  →  http://localhost:${FRONTEND_PORT}            ║"
echo "║  Backend   →  http://localhost:${BACKEND_PORT}            ║"
echo "║  Database  →  PostgreSQL on port 5432            ║"
echo "╠═══════════════════════════════════════════════════╣"
echo "║  To stop:  ./stop.sh                             ║"
echo "║  Logs:     /tmp/sds-backend.log                  ║"
echo "║            /tmp/sds-frontend.log                 ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Open in browser
if command -v open &>/dev/null; then
  open "http://localhost:${FRONTEND_PORT}"
fi
