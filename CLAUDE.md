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

### Using Scripts
```bash
./start.sh    # Start server
./stop.sh     # Stop server
./restart.sh  # Restart server
```

### Testing
```bash
# Run Playwright E2E tests
python tests/test_client.py
python tests/test_console.py
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

## Project Structure

```
js/                      # Modular JavaScript (ES6)
├── main.js             # Application entry point
├── app.js              # Main application logic
├── state.js            # State management (singleton)
├── logger.js           # Logging utilities
├── utils.js            # Helper functions
├── api.js              # OpenCode SDK interactions
├── events.js           # SSE event handling
├── parts.js            # Message part processing
├── ui.js               # UI operations
└── README.md           # Module documentation
```

### Key Files

| File | Purpose |
|------|---------|
| `opencode-client.html` | Main HTML structure with embedded CSS |
| `js/main.js` | Application entry point |
| `js/app.js` | Main business logic coordination |
| `js/state.js` | Centralized state management |
| `js/api.js` | OpenCode SDK API wrappers |
| `js/events.js` | SSE event routing |
| `js/parts.js` | Message part (text/reasoning/tool) rendering |
| `js/ui.js` | DOM manipulation |
| `tests/test_client.py` | Playwright E2E test |
| `tests/test_console.py` | Console output test |
| `docs/opencode-sdk.md` | SDK API reference |
| `docs/opencode-sse-events.md` | SSE event structure |
| `docs/client-implementation.md` | Technical implementation details |

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

## Module Communication

Modules communicate through:
1. **Direct imports** - Lower-level modules imported by upper-level modules
2. **Custom events** - Decoupled communication via CustomEvent

```javascript
// Send event
window.dispatchEvent(new CustomEvent('opencode:part:updated', { detail: partData }));

// Listen to event
window.addEventListener('opencode:part:updated', (e) => {
    handlePartUpdated(e.detail);
});
```

### Custom Events

| Event Name | Triggered When | Data |
|------------|----------------|------|
| `opencode-event` | SSE raw event received | event object |
| `opencode:message:created` | Message created | message object |
| `opencode:message:updated` | Message updated | message object |
| `opencode:part:updated` | Part updated | part object |
| `opencode:session:status` | Session status changed | status object |
| `opencode:processing:show` | Show processing indicator | null |
| `opencode:processing:hide` | Hide processing indicator | null |
| `opencode:reload:messages` | Reload messages | null |

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
| `client.session.abort({ path })` | Stop current task |
| `client.event.subscribe()` | Subscribe to SSE events |

## State Management

- **Centralized** - All state managed in `js/state.js` (singleton pattern)
- **localStorage persistence**:
  - `opencode_serverUrl` - Server URL
  - `opencode_sessionId` - Current session ID
- **State restored** on page load if available

## Important Notes

1. **CORS**: OpenCode Server must allow cross-origin requests for the web client to work
2. **Tool Execution**: All tools (file read/write, shell commands) execute on the **server**, not the client
3. **Model Selection**: Default model prioritizes `kimi:k2p5` (paid), falls back to `kimi:k2.5-free` (free tier)
4. **Remote Deployment**: To deploy remotely, ensure server listens on `0.0.0.0`

## No Build Process

This is a static web application:
- No package.json, npm, or bundlers required
- No TypeScript
- Direct ES module imports from esm.sh
- Modular JavaScript in `js/` directory
