#!/bin/bash

# Restart OpenCode Server and Web Client

# Colors
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Restarting OpenCode Web Client...${NC}"
echo ""

# Stop services
./stop.sh

# Wait for processes to fully stop
sleep 2

echo ""
echo "Restarting..."
echo ""

# Start services
./start.sh
