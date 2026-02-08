# OpenCode Web Client 技术实现文档

本文档详细说明 OpenCode Web Client 与 OpenCode SDK 通信的技术流程和实现细节。

## 目录

- [架构概述](#架构概述)
- [模块结构](#模块结构)
- [客户端初始化](#客户端初始化)
- [SDK 通信流程](#sdk-通信流程)
- [SSE 事件处理](#sse-事件处理)
- [消息发送与接收](#消息发送与接收)
- [状态管理](#状态管理)
- [模块间通信](#模块间通信)
- [错误处理](#错误处理)

---

## 架构概述

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   HTML Layer    │  │   State Layer   │  │   Event Layer   │  │
│  │  - DOM Elements │←─│  - sessionID    │  │  - SSE Stream   │  │
│  │  - UI Controls  │  │  - isConnected  │  │  - Event Router │  │
│  └─────────────────┘  └─────────────────┘  └────────┬────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OpenCode SDK (ES Module)                     │
│  import { createOpencodeClient } from "@opencode-ai/sdk"        │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Config API      │  │ Session API     │  │  Event API      │  │
│  │ - providers()   │  │ - create()      │  │ - subscribe()   │  │
│  │                 │  │ - messages()    │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                  OpenCode Server (localhost:4096)               │
│                    HTTP + SSE (Server-Sent Events)              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 模块结构

代码按照单一职责原则拆分为 9 个模块：

```
js/
├── main.js      # 入口：初始化应用
├── app.js       # 协调层：业务流程控制
├── state.js     # 状态层：集中式状态管理
├── logger.js    # 日志层：统一的日志输出
├── utils.js     # 工具层：通用函数
├── api.js       # API 层：SDK 交互封装
├── events.js    # 事件层：SSE 事件路由
├── parts.js     # 渲染层：消息片段处理
└── ui.js        # 视图层：DOM 操作
```

### 模块职责

| 模块 | 职责 | 主要导出 |
|------|------|----------|
| `main.js` | 应用入口 | `init()` |
| `app.js` | 业务协调 | `connect()`, `handleSendPrompt()` |
| `state.js` | 状态管理 | `state` 单例 |
| `logger.js` | 日志工具 | `debug()`, `error()` |
| `utils.js` | 工具函数 | `escapeHtml()`, `scrollToBottom()` |
| `api.js` | API 交互 | `createClient()`, `fetchProviders()` |
| `events.js` | 事件路由 | `handleEvent()` |
| `parts.js` | Part 处理 | `handlePartUpdated()` |
| `ui.js` | UI 操作 | `addMessage()`, `setStatus()` |

---

## 客户端初始化

### 1. 应用启动流程

```javascript
// js/main.js
import { init } from "./app.js";

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
```

### 2. 初始化步骤

```javascript
// js/app.js - init()
export function init() {
    // 1. 初始化 UI 引用
    state.initUI();

    // 2. 设置存储的服务器 URL
    serverUrlInput.value = getStoredServerUrl();

    // 3. 绑定 DOM 事件监听器
    bindEventListeners();

    // 4. 绑定自定义事件处理器（模块间通信）
    bindCustomEventHandlers();

    // 5. 如果有存储的 URL，自动连接
    if (getStoredServerUrl()) {
        connect();
    }
}
```

### 3. SDK 客户端创建

```javascript
// js/api.js - createClient()
export function createClient(baseUrl) {
    return createOpencodeClient({ baseUrl });
}

// 使用
import { createClient } from "./api.js";
const client = createClient(serverUrl);
state.setClient(client);
```

---

## SDK 通信流程

所有 SDK 交互集中在 `js/api.js` 模块中：

### 获取配置

```javascript
// js/api.js
export async function fetchProviders() {
    const client = state.getClient();
    const configResult = await client.config.providers();
    return configResult.data || configResult;
}
```

### 创建会话

```javascript
export async function createSession(title) {
    const client = state.getClient();
    const session = await client.session.create({
        body: { title }
    });
    return session.data?.id || session.id;
}
```

### 发送消息

```javascript
export async function sendPrompt(sessionId, providerID, modelID, text) {
    const client = state.getClient();
    const result = await client.session.prompt({
        path: { id: sessionId },
        body: {
            model: { providerID, modelID },
            parts: [{ type: 'text', text }]
        }
    });
    return result;
}
```

### 停止任务

```javascript
export async function abortSession(sessionId) {
    const client = state.getClient();
    await client.session.abort({
        path: { id: sessionId }
    });
}
```

### 订阅 SSE 事件

```javascript
export async function subscribeToEvents() {
    const client = state.getClient();
    const events = await client.event.subscribe();
    const stream = events.stream;

    state.setEventStream(stream);

    // 启动后台事件处理
    (async () => {
        for await (const event of stream) {
            // 触发自定义事件
            window.dispatchEvent(new CustomEvent('opencode-event', { detail: event }));
        }
    })();
}
```

---

## SSE 事件处理

### 事件路由架构

```
SSE Stream (api.js)
        │
        ▼ 触发自定义事件
window.dispatchEvent('opencode-event')
        │
        ▼ app.js 监听并路由
handleEvent() → 判断事件类型
        │
        ▼ 触发特定事件
'opencode:message:created'
'opencode:part:updated'
'opencode:session:status'
        │
        ▼ 各模块监听处理
events.js, parts.js, ui.js
```

### 事件类型处理

```javascript
// js/events.js
export function handleEvent(event) {
    const eventType = extractEventType(event);
    const properties = extractProperties(event);

    // 会话过滤
    if (!isCurrentSessionEvent(properties)) {
        return;
    }

    // 路由到对应处理器
    routeEvent(eventType, properties);
}

function routeEvent(eventType, properties) {
    if (matchEventType(eventType, EVENT_TYPES.MESSAGE_CREATED)) {
        triggerHandler('message:created', properties);
    }
    else if (matchEventType(eventType, EVENT_TYPES.PART_UPDATED)) {
        triggerHandler('part:updated', properties.part || properties);
    }
    // ... 其他类型
}
```

### Part 类型处理

```javascript
// js/parts.js
export function handlePartUpdated(part) {
    switch (part.type) {
        case 'text':
            handleTextPart(contentDiv, partId, part);
            break;
        case 'reasoning':
            handleReasoningPart(contentDiv, partId, part);
            break;
        case 'tool-call':
            handleToolCallPart(contentDiv, partId, part);
            break;
    }
}
```

---

## 消息发送与接收

### 发送流程

```
用户输入 → handleSendPrompt()
    │
    ├── 1. 状态检查
    ├── 2. 更新 UI 状态
    ├── 3. 显示用户消息
    ├── 4. 显示处理指示器
    ├── 5. 创建 AbortController
    │
    ▼
sendPrompt() API 调用
    │
    ├── HTTP 响应（最终结果）
    └── SSE 事件（实时流式）
        │
        ▼
    UI 更新
```

### 双重接收机制

```javascript
// app.js
const result = await sendPromptApi(sessionId, providerID, modelID, text);

// HTTP 响应处理
if (responseText && !state.getDynamicUI('assistantMessageDiv')) {
    const assistantDiv = createAssistantMessage(responseText);
    chatContainer.appendChild(assistantDiv);
}

// SSE 实时更新（通过事件监听）
window.addEventListener('opencode:part:updated', (e) => {
    handlePartUpdated(e.detail);
});
```

---

## 状态管理

### 状态结构

```javascript
// js/state.js
class AppState {
    constructor() {
        this._state = {
            client: null,
            currentSessionId: null,
            isConnected: false,
            isProcessing: false,
            eventStream: null,
            abortController: null,
            ui: { /* DOM 引用 */ },
            dynamicUI: { /* 动态创建的 DOM 引用 */ }
        };
    }
}
```

### 状态访问

```javascript
import { state } from "./state.js";

// 获取状态
const clientId = state.getCurrentSessionId();

// 设置状态
state.setConnected(true);
state.setProcessing(true);

// UI 访问
const chatContainer = state.getUI('chatContainer');
```

### 持久化存储

```javascript
// js/utils.js
export function getStoredServerUrl(defaultUrl) {
    return localStorage.getItem('opencode_serverUrl') || defaultUrl;
}

export function storeSessionId(sessionId) {
    localStorage.setItem('opencode_sessionId', sessionId);
}
```

---

## 模块间通信

### 自定义事件机制

解耦模块间通信，避免循环依赖：

```javascript
// 发送事件（events.js）
window.dispatchEvent(new CustomEvent('opencode:part:updated', {
    detail: partData
}));

// 监听事件（app.js）
window.addEventListener('opencode:part:updated', (e) => {
    handlePartUpdated(e.detail);
});
```

### 自定义事件列表

| 事件名 | 触发时机 | 数据 | 监听模块 |
|--------|----------|------|----------|
| `opencode-event` | 收到 SSE 原始事件 | event | app.js |
| `opencode:message:created` | 消息创建 | message | app.js |
| `opencode:message:updated` | 消息更新 | message | app.js |
| `opencode:part:updated` | Part 更新 | part | app.js → parts.js |
| `opencode:session:status` | 会话状态变化 | status | app.js |
| `opencode:processing:show` | 显示处理指示器 | null | ui.js |
| `opencode:processing:hide` | 隐藏处理指示器 | null | ui.js |
| `opencode:reload:messages` | 重新加载消息 | null | app.js |

---

## 错误处理

### 连接错误

```javascript
// js/app.js
export async function connect() {
    try {
        // ...
    } catch (err) {
        error('connect', err);
        setStatus('offline');
        addSystemMessage('连接失败: ' + err.message);
    }
}
```

### 发送错误与自动重试

```javascript
export async function handleSendPrompt(isRetry = false) {
    try {
        await sendPromptApi(...);
    } catch (err) {
        // 检查用户取消
        if (err.name === 'AbortError') {
            addSystemMessage('任务已停止');
            return;
        }

        // 付费模型失败，自动切换免费模型重试
        const isK25Paid = currentModel.includes('k2.5') && !currentModel.includes('-free');
        if (isK25Paid && !isRetry) {
            const freeModel = findFreeK25Model();
            if (freeModel) {
                addSystemMessage('模型请求失败，自动切换模型重试...');
                await handleSendPrompt(true);  // 重试
                return;
            }
        }

        addMessage('error', '发送失败: ' + err.message);
    }
}
```

### SSE 错误

```javascript
// js/api.js
async function startEventProcessing(stream) {
    try {
        for await (const event of stream) {
            window.dispatchEvent(new CustomEvent('opencode-event', { detail: event }));
        }
    } catch (err) {
        sseError(err);  // 记录错误，可考虑自动重连
    }
}
```

---

## 安全注意事项

### HTML 转义

所有用户内容在渲染前都经过转义：

```javascript
// js/utils.js
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

### CORS 配置

OpenCode Server 必须允许跨域请求。默认情况下，SDK 会处理 CORS。

### API Key 安全

API Key 存储在 Server 端，客户端不接触敏感凭据。

---

## 调试日志

统一的日志格式方便调试：

```javascript
// js/logger.js
debug('API', 'Fetching providers...');
logEvent('message.part.updated', partData);
error('connect', err);
```

日志前缀：
- `[DEBUG]` - 调试信息
- `[INFO]` - 一般信息
- `[EVENT]` - SSE 事件
- `[ERROR]` - 错误信息

---

## 相关文档

- [OpenCode SDK 文档](./opencode-sdk.md)
- [SSE 事件结构文档](./opencode-sse-events.md)
- [模块说明文档](../js/README.md)
