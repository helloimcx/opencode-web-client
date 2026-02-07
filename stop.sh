#!/bin/bash

# Stop OpenCode Server and Web Client

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping OpenCode Web Client...${NC}"

# PID files
PID_DIR="/tmp"
OPENCODE_PID_FILE="$PID_DIR/opencode-server.pid"
HTTP_PID_FILE="$PID_DIR/opencode-web.pid"

# Stop OpenCode Server
if [ -f "$OPENCODE_PID_FILE" ]; then
    OPENCODE_PID=$(cat "$OPENCODE_PID_FILE")
    if ps -p "$OPENCODE_PID" > /dev/null 2>&1; then
        echo "Stopping OpenCode Server (PID: $OPENCODE_PID)..."
        kill "$OPENCODE_PID"
        rm -f "$OPENCODE_PID_FILE"
        echo -e "${GREEN}✓ OpenCode Server stopped${NC}"
    else
        echo -e "${YELLOW}OpenCode Server not running${NC}"
        rm -f "$OPENCODE_PID_FILE"
    fi
else
    echo -e "${YELLOW}OpenCode Server PID file not found${NC}"
fi

# Stop HTTP Server
if [ -f "$HTTP_PID_FILE" ]; then
    HTTP_PID=$(cat "$HTTP_PID_FILE")
    if ps -p "$HTTP_PID" > /dev/null 2>&1; then
        echo "Stopping HTTP Server (PID: $HTTP_PID)..."
        kill "$HTTP_PID"
        rm -f "$HTTP_PID_FILE"
        echo -e "${GREEN}✓ HTTP Server stopped${NC}"
    else
        echo -e "${YELLOW}HTTP Server not running${NC}"
        rm -f "$HTTP_PID_FILE"
    fi
else
    echo -e "${YELLOW}HTTP Server PID file not found${NC}"
fi

# Also try to kill any remaining processes by name
pkill -f "opencode serve" 2>/dev/null && echo -e "${GREEN}✓ Killed remaining opencode processes${NC}"
pkill -f "python3 -m http.server 8000" 2>/dev/null && echo -e "${GREEN}✓ Killed remaining HTTP server processes${NC}"

echo ""
echo -e "${GREEN}All services stopped.${NC}"
