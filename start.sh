#!/bin/bash
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo -e "${BLUE}┌─────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│       SRM Insider AI  v1.0.0             │${NC}"
echo -e "${BLUE}│   Submission Query Assistant             │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────┘${NC}"
echo ""

# Check Node.js
if ! command -v node &>/dev/null; then
  echo -e "${RED}❌ Node.js not found. Install from https://nodejs.org${NC}"; exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Load .env
if [ -f "$SCRIPT_DIR/backend/.env" ]; then
  set -a; source "$SCRIPT_DIR/backend/.env"; set +a
  echo -e "${GREEN}✅ Loaded backend/.env${NC}"
fi

# Check API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo -e "${YELLOW}⚠️  ANTHROPIC_API_KEY not set${NC}"
  read -p "   Paste your Anthropic API key (sk-ant-...): " KEY
  if [ -n "$KEY" ]; then
    export ANTHROPIC_API_KEY="$KEY"
    echo "ANTHROPIC_API_KEY=$KEY" > "$SCRIPT_DIR/backend/.env"
    echo -e "${GREEN}✅ Key saved to backend/.env${NC}"
  else
    echo -e "${YELLOW}   Skipping — AI chat will not work without a key${NC}"
  fi
else
  echo -e "${GREEN}✅ API key found${NC}"
fi

# Install deps
echo ""
echo "📦 Checking dependencies..."
(cd "$SCRIPT_DIR/backend" && npm install --silent 2>/dev/null)
(cd "$SCRIPT_DIR/frontend" && npm install --silent 2>/dev/null)
echo -e "${GREEN}✅ Dependencies ready${NC}"

# STEP 1: Kill everything on 3000 and 3001 FIRST
echo ""
echo "🔌 Freeing ports 3000 and 3001..."
fuser -k 3000/tcp 2>/dev/null; fuser -k 3001/tcp 2>/dev/null
sleep 2
echo -e "${GREEN}✅ Ports cleared${NC}"

# STEP 2: Start backend
echo ""
echo "🚀 Starting backend on port 3001..."
cd "$SCRIPT_DIR/backend"
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" node server.js > /tmp/srm_backend.log 2>&1 &
BACKEND_PID=$!

# Wait up to 15s for backend to be ready
READY=0
for i in $(seq 1 15); do
  sleep 1
  if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
    READY=1; break
  fi
done

if [ $READY -eq 0 ]; then
  echo -e "${RED}❌ Backend failed to start! Error log:${NC}"
  cat /tmp/srm_backend.log
  exit 1
fi
echo -e "${GREEN}✅ Backend is up on http://localhost:3001${NC}"

# STEP 3: Start frontend (after backend is confirmed running)
echo ""
echo "🌐 Starting frontend on port 3000..."
cd "$SCRIPT_DIR/frontend"
npm run dev > /tmp/srm_frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 3

# Verify frontend started
if ! fuser 3000/tcp >/dev/null 2>&1; then
  echo -e "${RED}❌ Frontend failed to start! Error log:${NC}"
  cat /tmp/srm_frontend.log
  kill $BACKEND_PID 2>/dev/null
  exit 1
fi
echo -e "${GREEN}✅ Frontend is up on http://localhost:3000${NC}"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ SRM Insider AI is fully running!${NC}"
echo ""
echo -e "     Frontend → ${BLUE}http://localhost:3000${NC}"
echo -e "     Backend  → ${BLUE}http://localhost:3001${NC}"
echo ""
echo "     Press Ctrl+C to stop"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Auto-open browser
sleep 1
if command -v open &>/dev/null; then open http://localhost:3000
elif command -v xdg-open &>/dev/null; then xdg-open http://localhost:3000; fi

cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  fuser -k 3000/tcp 2>/dev/null; fuser -k 3001/tcp 2>/dev/null
  echo "Stopped. Goodbye!"; exit 0
}
trap cleanup INT TERM
wait
