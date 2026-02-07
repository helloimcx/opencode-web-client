#!/bin/bash

# Start OpenCode Server and Web Client

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting OpenCode Web Client...${NC}"

# PID files
PID_DIR="/tmp"
OPENCODE_PID_FILE="$PID_DIR/opencode-server.pid"
HTTP_PID_FILE="$PID_DIR/opencode-web.pid"

# Check if already running
if [ -f "$OPENCODE_PID_FILE" ]; then
    OPENCODE_PID=$(cat "$OPENCODE_PID_FILE")
    if ps -p "$OPENCODE_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}OpenCode Server already running (PID: $OPENCODE_PID)${NC}"
    else
        rm -f "$OPENCODE_PID_FILE"
    fi
fi

if [ -f "$HTTP_PID_FILE" ]; then
    HTTP_PID=$(cat "$HTTP_PID_FILE")
    if ps -p "$HTTP_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}HTTP Server already running (PID: $HTTP_PID)${NC}"
    else
        rm -f "$HTTP_PID_FILE"
    fi
fi

# Start OpenCode Server
if [ ! -f "$OPENCODE_PID_FILE" ]; then
    echo "Starting OpenCode Server..."
    nohup opencode serve > "$PID_DIR/opencode-server.log" 2>&1 &
    OPENCODE_PID=$!
    echo $OPENCODE_PID > "$OPENCODE_PID_FILE"
    echo -e "${GREEN}✓ OpenCode Server started (PID: $OPENCODE_PID)${NC}"
fi

# Wait for OpenCode Server to be ready
sleep 2

# Start HTTP Server
if [ ! -f "$HTTP_PID_FILE" ]; then
    echo "Starting HTTP Server on port 8000..."
    nohup python3 -m http.server 8000 > "$PID_DIR/opencode-web.log" 2>&1 &
    HTTP_PID=$!
    echo $HTTP_PID > "$HTTP_PID_FILE"
    echo -e "${GREEN}✓ HTTP Server started (PID: $HTTP_PID)${NC}"
fi

echo ""
echo -e "${GREEN}All services started!${NC}"
echo "  OpenCode Server: http://localhost:4096"
echo "  Web Client:      http://localhost:8000/opencode-client.html"
echo ""
echo "Logs:"
echo "  OpenCode: tail -f $PID_DIR/opencode-server.log"
echo "  HTTP:      tail -f $PID_DIR/opencode-web.log"
