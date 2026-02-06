# OpenCode SSE 事件结构文档

## 概述

OpenCode Server 通过 Server-Sent Events (SSE) 推送实时事件。使用 SDK 的 `client.event.subscribe()` 订阅。

```javascript
const events = await client.event.subscribe();
for await (const event of events.stream) {
    console.log(event.type, event.properties);
}
```

## 事件结构

所有事件遵循以下结构：

```javascript
{
    "type": "事件类型",
    "properties": {
        // 事件数据，根据类型不同而不同
    }
}
```

## 事件类型列表

### 1. server.connected

服务器连接成功事件。

```json
{
    "type": "server.connected",
    "properties": {}
}
```

### 2. session.created

会话创建事件。

```json
{
    "type": "session.created",
    "properties": {
        "info": {
            "id": "ses_xxx",
            "slug": "witty-pixel",
            "version": "1.1.53",
            "projectID": "global",
            "directory": "/Users/xxx",
            "title": "会话标题",
            "time": {
                "created": 1770361678744,
                "updated": 1770361678744
            }
        }
    }
}
```

### 3. session.updated

会话更新事件。

```json
{
    "type": "session.updated",
    "properties": {
        "info": {
            // 同 session.created
            "summary": {
                "additions": 0,
                "deletions": 0,
                "files": 0
            }
        }
    }
}
```

### 4. session.status

会话状态变更事件。

```json
{
    "type": "session.status",
    "properties": {
        "sessionID": "ses_xxx",
        "status": {
            "type": "busy"  // 或 "idle"
        }
    }
}
```

### 5. session.idle

会话进入空闲状态。

```json
{
    "type": "session.idle",
    "properties": {
        "sessionID": "ses_xxx"
    }
}
```

### 6. session.diff

会话差异事件（文件变更）。

```json
{
    "type": "session.diff",
    "properties": {
        "sessionID": "ses_xxx",
        "diff": []  // 文件差异数组
    }
}
```

### 7. message.created

消息创建事件。

```json
{
    "type": "message.created",
    "properties": {
        "info": {
            "id": "msg_xxx",
            "sessionID": "ses_xxx",
            "role": "user",  // 或 "assistant"
            "time": {
                "created": 1770361681295
            }
        }
    }
}
```

### 8. message.updated

消息更新事件。

```json
{
    "type": "message.updated",
    "properties": {
        "info": {
            "id": "msg_xxx",
            "sessionID": "ses_xxx",
            "role": "assistant",
            "time": {
                "created": 1770361681359,
                "completed": 1770361690184
            },
            "parentID": "msg_xxx",
            "modelID": "minimax-m2.1-free",
            "providerID": "opencode",
            "mode": "sisyphus",
            "agent": "sisyphus",
            "cost": 0,
            "tokens": {
                "input": 360,
                "output": 97,
                "reasoning": 0,
                "cache": {
                    "read": 0,
                    "write": 24093
                }
            },
            "finish": "stop"
        }
    }
}
```

### 9. message.part.updated ⭐ 核心

消息片段更新事件（最常用，包含流式内容）。

```json
{
    "type": "message.part.updated",
    "properties": {
        "part": {
            "id": "prt_xxx",
            "sessionID": "ses_xxx",
            "messageID": "msg_xxx",
            "type": "text | reasoning | step-start | step-finish | tool-call",
            "text": "内容（对于 text/reasoning 类型）",
            "delta": "增量内容（流式更新时）",
            "time": {
                "start": 1770361688675,
                "end": 1770361690113
            },
            "metadata": {
                "anthropic": {
                    "signature": "..."
                }
            }
        }
    }
}
```

#### Part 类型详解

**text 类型** - AI 回复文本
```json
{
    "type": "message.part.updated",
    "properties": {
        "part": {
            "type": "text",
            "text": "你好！有什么我可以帮你的吗？",
            "delta": "吗？"  // 增量（流式）
        }
    }
}
```

**reasoning 类型** - AI 思考过程
```json
{
    "type": "message.part.updated",
    "properties": {
        "part": {
            "type": "reasoning",
            "text": "用户用中文说\"你好\"，这是一个简单的问候...",
            "time": {
                "start": 1770361688675,
                "end": 1770361690113
            }
        }
    }
}
```

**step-start 类型** - 处理步骤开始
```json
{
    "type": "message.part.updated",
    "properties": {
        "part": {
            "type": "step-start"
        }
    }
}
```

**step-finish 类型** - 处理步骤完成
```json
{
    "type": "message.part.updated",
    "properties": {
        "part": {
            "type": "step-finish",
            "reason": "stop",
            "cost": 0,
            "tokens": {
                "input": 360,
                "output": 97,
                "reasoning": 0,
                "cache": {
                    "read": 0,
                    "write": 24093
                }
            }
        }
    }
}
```

**tool-call 类型** - 工具调用（如需要）
```json
{
    "type": "message.part.updated",
    "properties": {
        "part": {
            "type": "tool-call",
            "name": "file.read",
            "arguments": {
                "path": "/path/to/file"
            },
            "result": {
                // 工具执行结果
            }
        }
    }
}
```

## 事件流示例

```
用户发送消息 "你好"
    ↓
session.status {type: "busy"}          ← AI 开始处理
    ↓
message.created {role: "user"}         ← 用户消息创建
    ↓
message.part.updated {type: "text"}    ← 用户消息内容
    ↓
message.created {role: "assistant"}    ← AI 消息创建
    ↓
message.part.updated {type: "step-start"}         ← 处理开始
    ↓
message.part.updated {type: "reasoning", delta: "用户用"}     ← 思考中
    ↓
message.part.updated {type: "reasoning", delta: "中文说..."}   ← 思考继续
    ↓
message.part.updated {type: "reasoning", text: "完整思考"}     ← 思考完成
    ↓
message.part.updated {type: "text", delta: "你好！"}           ← 回复开始
    ↓
message.part.updated {type: "text", delta: "有什么我可以..."}   ← 回复继续
    ↓
message.part.updated {type: "text", text: "你好！有什么我可以帮你的吗？"}  ← 回复完成
    ↓
message.part.updated {type: "step-finish"}        ← 处理完成
    ↓
message.updated {role: "assistant", finish: "stop"}  ← 消息完成
    ↓
session.status {type: "idle"}         ← AI 空闲
    ↓
session.idle                            ← 会话空闲
```

## 实现要点

1. **会话过滤**: 通过 `properties.sessionID` 判断事件是否属于当前会话
2. **流式文本**: 使用 `delta` 字段追加内容，`text` 字段获取完整内容
3. **思考过程**: `reasoning` 类型包含 AI 的推理过程
4. **状态管理**: 根据 `session.status` 显示加载状态

## 代码示例

```javascript
// 订阅事件
const events = await client.event.subscribe();

for await (const event of events.stream) {
    const { type, properties } = event;

    // 过滤当前会话
    if (properties.sessionID && properties.sessionID !== currentSessionId) {
        continue;
    }

    switch (type) {
        case 'message.part.updated':
            const part = properties.part;
            switch (part.type) {
                case 'text':
                    // 追加 delta 或更新 text
                    appendText(part.delta || part.text);
                    break;
                case 'reasoning':
                    showReasoning(part.text);
                    break;
                case 'step-start':
                    showLoading();
                    break;
                case 'step-finish':
                    hideLoading();
                    break;
            }
            break;

        case 'session.status':
            if (properties.status?.type === 'busy') {
                showLoading();
            } else if (properties.status?.type === 'idle') {
                hideLoading();
            }
            break;
    }
}
```
