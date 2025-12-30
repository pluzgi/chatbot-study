#!/bin/bash

# Production AI Testing Script
# Runs AI user testing against production backend

set -e  # Exit on error

# Parse arguments
PARTICIPANTS=${1:-50}  # Default to 50 if not specified

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Show usage if help requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
  echo "Usage: ./test-production.sh [PARTICIPANTS]"
  echo ""
  echo "Arguments:"
  echo "  PARTICIPANTS    Number of AI participants to simulate (default: 50)"
  echo ""
  echo "Examples:"
  echo "  ./test-production.sh           # Run with 50 participants"
  echo "  ./test-production.sh 100       # Run with 100 participants"
  echo "  ./test-production.sh 10        # Run with 10 participants"
  echo ""
  echo "Note: This runs against PRODUCTION backend"
  exit 0
fi

echo "🚀 Starting Production AI Testing..."
echo ""

# Get current configuration
PROD_URL=$(grep "^API_BASE_URL=" ai-testing/.env | cut -d '=' -f2)
AI_MODEL=$(grep "^INFOMANIAK_MODEL=" ai-testing/.env | cut -d '=' -f2)

echo -e "${BLUE}📊 Test Configuration:${NC}"
echo -e "  Backend: ${GREEN}$PROD_URL${NC}"
echo -e "  Participants: ${GREEN}$PARTICIPANTS${NC}"
echo -e "  Question Generator Model: ${GREEN}$AI_MODEL${NC}"
echo ""

# Health check
echo -e "${BLUE}🏥 Checking production backend health...${NC}"
if curl -s "${PROD_URL}/../../health" > /dev/null; then
  echo -e "${GREEN}✅ Backend is healthy${NC}"
else
  echo -e "${RED}❌ Backend health check failed${NC}"
  echo "Check if production backend is running"
  exit 1
fi
echo ""

# Build AI testing
echo -e "${BLUE}🔨 Building AI testing...${NC}"
cd ai-testing
npm run build

echo ""
echo -e "${BLUE}🤖 Starting AI user simulation...${NC}"
echo -e "${YELLOW}Testing against: $PROD_URL${NC}"
echo ""

# Run tests
npm run test -- --participants=$PARTICIPANTS

echo ""
echo -e "${GREEN}✅ Testing complete!${NC}"
