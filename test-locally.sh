#!/bin/bash

# Local AI Testing Script
# This script runs AI user testing against a local backend instance

set -e  # Exit on error

# Parse arguments
PARTICIPANTS=${1:-50}  # Default to 50 if not specified

echo "🚀 Starting Local AI Testing..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Show usage if help requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
  echo "Usage: ./test-locally.sh [PARTICIPANTS]"
  echo ""
  echo "Arguments:"
  echo "  PARTICIPANTS    Number of AI participants to simulate (default: 50)"
  echo ""
  echo "Examples:"
  echo "  ./test-locally.sh           # Run with 50 participants"
  echo "  ./test-locally.sh 100       # Run with 100 participants"
  echo "  ./test-locally.sh 10        # Run with 10 participants"
  exit 0
fi

# Store original values
ORIGINAL_API_URL=$(grep "^API_BASE_URL=" ai-testing/.env | cut -d '=' -f2)
echo -e "${BLUE}📋 Original API URL: $ORIGINAL_API_URL${NC}"

# Cleanup function to restore settings
cleanup() {
  echo ""
  echo -e "${YELLOW}🔄 Restoring production settings...${NC}"
  sed -i.bak "s|^API_BASE_URL=.*|API_BASE_URL=$ORIGINAL_API_URL|" ai-testing/.env
  rm -f ai-testing/.env.bak

  # Kill backend if still running
  if [ ! -z "$BACKEND_PID" ]; then
    echo -e "${YELLOW}🛑 Stopping local backend (PID: $BACKEND_PID)...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
  fi

  echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Trap cleanup on script exit
trap cleanup EXIT INT TERM

# 1. Update ai-testing/.env to point to localhost
echo -e "${BLUE}⚙️  Configuring ai-testing to use localhost...${NC}"
sed -i.bak 's|^API_BASE_URL=.*|API_BASE_URL=http://localhost:3000/api|' ai-testing/.env
echo -e "${GREEN}✅ Updated ai-testing/.env${NC}"
echo ""

# 2. Start backend in background
echo -e "${BLUE}🔧 Starting local backend...${NC}"
cd backend
node src/index.js &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
sleep 3

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
  echo -e "${RED}❌ Backend failed to start${NC}"
  exit 1
fi

# Test backend health
if curl -s http://localhost:3000/api/health > /dev/null; then
  echo -e "${GREEN}✅ Backend running on http://localhost:3000${NC}"
else
  echo -e "${YELLOW}⚠️  Backend started but health check failed${NC}"
fi
echo ""

# 3. Show current model configuration
BACKEND_MODEL=$(grep "^INFOMANIAK_MODEL=" backend/.env | cut -d '=' -f2)
AI_MODEL=$(grep "^INFOMANIAK_MODEL=" ai-testing/.env | cut -d '=' -f2)
echo -e "${BLUE}📊 Test Configuration:${NC}"
echo -e "  Participants: ${GREEN}$PARTICIPANTS${NC}"
echo -e "  Chatbot (backend): ${GREEN}$BACKEND_MODEL${NC}"
echo -e "  Question Gen (ai-testing): ${GREEN}$AI_MODEL${NC}"
echo ""

# 4. Build and run AI testing
echo -e "${BLUE}🔨 Building AI testing...${NC}"
cd ai-testing
npm run build

echo ""
echo -e "${BLUE}🤖 Starting AI user simulation...${NC}"
echo ""
npm run test -- --participants=$PARTICIPANTS

# Cleanup will run automatically via trap
