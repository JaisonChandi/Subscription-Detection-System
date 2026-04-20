#!/bin/bash
# ════════════════════════════════════════════════════════════════
#  Subscription Detection System — VIEW DATABASE
#  Quickly inspect all data in PostgreSQL
# ════════════════════════════════════════════════════════════════

DB_NAME="subscription_db"
DB_USER="postgres"
DB_PASSWORD="postgres"
PSQL_BIN=$(find /Library/PostgreSQL /usr/local /opt/homebrew -name "psql" -type f 2>/dev/null | head -1)
if [ -z "$PSQL_BIN" ]; then PSQL_BIN="psql"; fi

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║   📊  Subscription Detection System — DATABASE   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check connection
if ! PGPASSWORD="$DB_PASSWORD" "$PSQL_BIN" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &>/dev/null; then
  echo -e "${RED}❌ Cannot connect to database '${DB_NAME}'. Is PostgreSQL running?${NC}"
  exit 1
fi

# ── Summary ────────────────────────────────────────────────────
echo -e "${YELLOW}── Summary ──────────────────────────────────────────${NC}"
PGPASSWORD="$DB_PASSWORD" "$PSQL_BIN" -U "$DB_USER" -d "$DB_NAME" -c "
  SELECT
    COUNT(*)                                        AS total_subscriptions,
    COUNT(*) FILTER (WHERE status = 'Active')       AS active,
    COUNT(*) FILTER (WHERE status != 'Active')      AS inactive,
    COALESCE(SUM(cost), 0)                          AS total_cost,
    COALESCE(SUM(cost) FILTER (WHERE billing_cycle = 'Monthly'), 0) AS monthly_cost,
    COALESCE(SUM(cost) FILTER (WHERE billing_cycle = 'Yearly'), 0)  AS yearly_cost
  FROM subscriptions;
"

# ── All Subscriptions ─────────────────────────────────────────
echo -e "${YELLOW}── All Subscriptions ────────────────────────────────${NC}"
PGPASSWORD="$DB_PASSWORD" "$PSQL_BIN" -U "$DB_USER" -d "$DB_NAME" --pset="border=2" -c "
  SELECT
    id,
    name,
    category,
    '$' || cost         AS cost,
    billing_cycle,
    start_date,
    renewal_date,
    status,
    LEFT(description, 30) AS description
  FROM subscriptions
  ORDER BY id;
"

ROW_COUNT=$(PGPASSWORD="$DB_PASSWORD" "$PSQL_BIN" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM subscriptions;" | tr -d ' ')

if [ "$ROW_COUNT" = "0" ]; then
  echo -e "${YELLOW}  ⚪ No subscriptions found. Add some via http://localhost:3001${NC}"
fi

echo -e "\n${GREEN}Done.${NC}"
