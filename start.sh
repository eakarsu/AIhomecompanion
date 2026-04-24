#!/bin/bash

# ============================================
# AI Home Companion - Startup Script
# ============================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║        🏠 AI Home Companion 🤖           ║"
echo "  ║     Smart Living, Simplified              ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Load environment variables
if [ -f .env ]; then
  set -a
  source .env
  set +a
  echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
  echo -e "${RED}✗ .env file not found! Please create one.${NC}"
  exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# ============================================
# Step 1: Clean up used ports (aggressively)
# ============================================
echo -e "\n${BLUE}▸ Cleaning up ports...${NC}"

cleanup_port() {
  local port=$1
  local attempts=0
  while [ $attempts -lt 3 ]; do
    local pids=$(lsof -ti :$port 2>/dev/null || true)
    if [ -z "$pids" ]; then
      break
    fi
    echo -e "${YELLOW}  Killing processes on port $port: $pids${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 2
    attempts=$((attempts + 1))
  done
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT
cleanup_port 5173

# Final verify ports are free
for port in $BACKEND_PORT $FRONTEND_PORT; do
  if lsof -ti :$port &>/dev/null; then
    echo -e "${RED}✗ Port $port still in use. Please free it manually.${NC}"
    exit 1
  fi
done
echo -e "${GREEN}✓ Ports $BACKEND_PORT and $FRONTEND_PORT are free${NC}"

# ============================================
# Step 2: Check PostgreSQL
# ============================================
echo -e "\n${BLUE}▸ Checking PostgreSQL...${NC}"
if command -v pg_isready &>/dev/null; then
  if pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} &>/dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
  else
    echo -e "${YELLOW}  Starting PostgreSQL...${NC}"
    if command -v brew &>/dev/null; then
      brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    fi
    sleep 3
    if pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} &>/dev/null; then
      echo -e "${GREEN}✓ PostgreSQL started${NC}"
    else
      echo -e "${RED}✗ Could not start PostgreSQL. Please start it manually.${NC}"
      exit 1
    fi
  fi
else
  echo -e "${YELLOW}  pg_isready not found, assuming PostgreSQL is running${NC}"
fi

# ============================================
# Step 3: Create database if not exists
# ============================================
echo -e "\n${BLUE}▸ Setting up database...${NC}"
createdb -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} ${DB_NAME:-smarthome} 2>/dev/null && \
  echo -e "${GREEN}✓ Database '${DB_NAME}' created${NC}" || \
  echo -e "${GREEN}✓ Database '${DB_NAME}' already exists${NC}"

# ============================================
# Step 4: Install backend dependencies
# ============================================
echo -e "\n${BLUE}▸ Installing backend dependencies...${NC}"
cd "$PROJECT_DIR/backend"
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# ============================================
# Step 5: Seed database
# ============================================
echo -e "\n${BLUE}▸ Seeding database with sample data...${NC}"
cd "$PROJECT_DIR/backend"
node seed.js
if [ $? -ne 0 ]; then
  echo -e "${RED}✗ Database seeding failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Database seeded${NC}"

# ============================================
# Step 6: Install frontend dependencies
# ============================================
echo -e "\n${BLUE}▸ Installing frontend dependencies...${NC}"
cd "$PROJECT_DIR/frontend"
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# ============================================
# Step 7: Start backend with hot reload (nodemon)
# ============================================
echo -e "\n${BLUE}▸ Starting backend on port ${BACKEND_PORT} (with hot reload)...${NC}"
cd "$PROJECT_DIR/backend"
npx nodemon server.js &
BACKEND_PID=$!

# Wait and verify backend is up
echo -e "  Waiting for backend to start..."
for i in $(seq 1 10); do
  sleep 1
  if curl -s http://localhost:${BACKEND_PORT}/api/health &>/dev/null; then
    echo -e "${GREEN}✓ Backend started and healthy (PID: $BACKEND_PID)${NC}"
    break
  fi
  if [ $i -eq 10 ]; then
    echo -e "${RED}✗ Backend failed to start. Check logs above.${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
  fi
done

# ============================================
# Step 8: Start frontend with hot reload (Vite)
# ============================================
echo -e "\n${BLUE}▸ Starting frontend on port ${FRONTEND_PORT} (with hot reload)...${NC}"
cd "$PROJECT_DIR/frontend"
npx vite --port $FRONTEND_PORT --host &
FRONTEND_PID=$!
sleep 3

# Verify frontend is up
if curl -s http://localhost:${FRONTEND_PORT}/ &>/dev/null; then
  echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
else
  echo -e "${YELLOW}  Frontend may still be starting...${NC}"
fi

# ============================================
# Summary
# ============================================
echo -e "\n${CYAN}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║         🚀 Application Running!          ║"
echo "  ╠══════════════════════════════════════════╣"
echo "  ║                                          ║"
echo "  ║  Frontend: http://localhost:${FRONTEND_PORT}          ║"
echo "  ║  Backend:  http://localhost:${BACKEND_PORT}          ║"
echo "  ║                                          ║"
echo "  ║  Login:    admin@smarthome.com           ║"
echo "  ║  Password: admin123                      ║"
echo "  ║                                          ║"
echo "  ║  Hot reload is ON for both servers       ║"
echo "  ║  Press Ctrl+C to stop all services       ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================
# Graceful shutdown
# ============================================
shutdown() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  # Give processes a moment then force-kill anything still on the ports
  sleep 1
  cleanup_port $BACKEND_PORT
  cleanup_port $FRONTEND_PORT
  echo -e "${GREEN}✓ All services stopped${NC}"
  exit 0
}

trap shutdown SIGINT SIGTERM

# Keep running while both servers are alive
while true; do
  # Check if backend is still running
  if ! kill -0 $BACKEND_PID 2>/dev/null; then
    # nodemon may have respawned, check if port is still alive
    if ! lsof -ti :$BACKEND_PORT &>/dev/null; then
      echo -e "${RED}Backend stopped unexpectedly. Restarting...${NC}"
      cd "$PROJECT_DIR/backend"
      npx nodemon server.js &
      BACKEND_PID=$!
    fi
  fi
  # Check if frontend is still running
  if ! lsof -ti :$FRONTEND_PORT &>/dev/null; then
    echo -e "${RED}Frontend stopped unexpectedly. Restarting...${NC}"
    cd "$PROJECT_DIR/frontend"
    npx vite --port $FRONTEND_PORT --host &
    FRONTEND_PID=$!
  fi
  sleep 5
done
