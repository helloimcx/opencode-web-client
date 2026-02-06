# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **web-based client for OpenCode AI** - a single-page HTML application that provides a chat interface for interacting with an OpenCode Server instance. The application uses vanilla JavaScript with ES modules importing the `@opencode-ai/sdk` from esm.sh CDN.

**Architecture:** The web client is a lightweight control panel. All AI processing, tool execution, and file operations happen on the OpenCode Server (localhost:4096 by default). The client only handles UI rendering and SSE event streaming.

## Common Commands

### Development Server
```bash
# Start HTTP server on port 8000
python3 -m http.server 8000

# Access the client
open http://localhost:8000/opencode-client.html
```

### Background Service (Optional)
```bash
# Start in background
nohup python3 -m http.server 8000 > /tmp/opencode-web.log 2>&1 &
echo $! > /tmp/opencode-web.pid

# Stop background service
pkill -f "python3 -m http.server 8000"
```

### Testing
```bash
# Run Playwright E2E tests
python test_client.py
python test_console.py
```

### Prerequisites
Ensure OpenCode Server is running before starting the web client:
```bash
# Check if installed
opencode --version

# Install if needed
npm install -g opencode-ai

# Start server (default: http://localhost:4096)
opencode
```

## Architecture

```
┌─────────────────┐     HTTP/SSE      ┌──────────────────────┐
│  Web Client     │ ◄──────────────► │  OpenCode Server     │
│  (HTML/JS)      │                   │  (localhost:4096)    │
└─────────────────┘                   └──────────────────────┘
                                              │
                                              ▼
                                     ┌──────────────────────┐
                                     │  AI Providers        │
                                     │  (OpenCode/Anthropic │
                                     │   OpenAI/etc.)       │
                                     └──────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `opencode-client.html` | Main single-page web client (all UI logic embedded) |
| `test_client.py` | Playwright E2E test for the web client |
| `docs/opencode-sdk.md` | SDK API reference |
| `docs/opencode-sse-events.md` | SSE event structure documentation |

## SSE Event Handling

The client uses Server-Sent Events for real-time updates. Key event types:

- `message.part.updated` - Most important: contains streaming `text`, `reasoning`, `step-start/finish`, `tool-call`
- `session.status` - Shows `busy`/`idle` state for loading indicators
- `message.created` / `message.updated` - Message lifecycle events

Events are filtered by `sessionID` to handle only the current session.

### Part Types in `message.part.updated`

| Type | Description |
|------|-------------|
| `text` | AI response content (cumulative in `text` field) |
| `reasoning` | AI thinking process |
| `step-start` / `step-finish` | Processing step boundaries |
| `tool-call` | Tool invocation with `name`, `arguments`, `result` |

## SDK Usage

The SDK is imported from CDN:
```javascript
import { createOpencodeClient } from "https://esm.sh/@opencode-ai/sdk@latest";

const client = createOpencodeClient({
    baseUrl: "http://localhost:4096"
});
```

### Common SDK Methods

| Method | Purpose |
|--------|---------|
| `client.config.providers()` | Get available models/providers |
| `client.session.create({ body })` | Create new session |
| `client.session.messages({ path })` | Load session history |
| `client.session.prompt({ path, body })` | Send message to AI |
| `client.event.subscribe()` | Subscribe to SSE events |

## State Management

- `localStorage.opencode_serverUrl` - Persisted server URL
- `localStorage.opencode_sessionId` - Persisted session for reconnect
- Session state restored on page load if available

## No Build Process

This is a static web application:
- No package.json, npm, or bundlers
- No TypeScript
- Direct ES module imports from esm.sh
- All CSS and JavaScript embedded in the single HTML file

## Important Notes

1. **CORS**: OpenCode Server must allow cross-origin requests for the web client to work
2. **Tool Execution**: All tools (file read/write, shell commands) execute on the **server**, not the client
3. **Model Selection**: Default model is `opencode:minimax-m2.1-free` (free tier, no API key required)
4. **Remote Deployment**: To deploy remotely, update `serverUrlInput.value` in HTML and ensure server listens on `0.0.0.0`
