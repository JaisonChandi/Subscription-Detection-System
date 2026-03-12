#!/bin/bash
# ════════════════════════════════════════════════════════════════
#  Subscription Detection System — STOP
#  Gracefully shut everything down 🛑
# ════════════════════════════════════════════════════════════════

BACKEND_PORT=5001
FRONTEND_PORT=3001

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${RED}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║   🛑  Subscription Detection System — STOP       ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Stop frontend
FRONTEND_PIDS=$(lsof -ti:${FRONTEND_PORT} 2>/dev/null)
if [ -n "$FRONTEND_PIDS" ]; then
  echo "$FRONTEND_PIDS" | xargs kill -9 2>/dev/null
  echo -e "  ${GREEN}✅ Frontend stopped (port ${FRONTEND_PORT})${NC}"
else
  echo -e "  ⚪ Frontend was not running"
fi

# Stop backend
BACKEND_PIDS=$(lsof -ti:${BACKEND_PORT} 2>/dev/null)
if [ -n "$BACKEND_PIDS" ]; then
  echo "$BACKEND_PIDS" | xargs kill -9 2>/dev/null
  echo -e "  ${GREEN}✅ Backend stopped (port ${BACKEND_PORT})${NC}"
else
  echo -e "  ⚪ Backend was not running"
fi

# Clean up log files
rm -f /tmp/sds-backend.log /tmp/sds-frontend.log

echo ""
echo -e "${GREEN}🔔 All services stopped.${NC}"
