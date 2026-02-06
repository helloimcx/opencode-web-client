# OpenCode 架构分析

## 架构概览

```
┌─────────────────┐     HTTP/SSE      ┌──────────────────────┐
│  Web Client     │ ◄──────────────► │  OpenCode Server     │
│  (SDK)          │                   │  (localhost:4096)    │
└─────────────────┘                   └──────────────────────┘
                                              │
                                              ▼
                                     ┌──────────────────────┐
                                     │  AI Providers        │
                                     │  (OpenCode/Anthropic │
                                     │   OpenAI/etc.)       │
                                     └──────────────────────┘
```

## 执行流程分析

### 1. SDK 的作用

SDK **只是客户端封装**，负责：
- 发送 HTTP 请求到 Server
- 处理响应（JSON 解析、类型转换）
- 提供 Server-Sent Events (SSE) 流式订阅

```javascript
// SDK 源码本质就是 HTTP 调用
prompt(e){
  return (e.client??this._client).post({
    url: "/session/{id}/message",  // HTTP POST
    ...e,
    headers: {"Content-Type": "application/json", ...e.headers}
  })
}
```

### 2. Server 的职责

所有核心逻辑都在 **Server 端执行**：
- AI 对话和推理（调用 LLM API）
- 工具调用决策和执行
- 文件读写操作
- Shell 命令执行
- Session 管理

### 3. 对话输出流程

```
用户输入消息
    │
    ▼
SDK: client.session.prompt() ──POST──► Server: /session/{id}/message
                                              │
                                              ▼
                                    Server 处理:
                                    1. 将消息添加到 Session
                                    2. 调用 AI Provider API
                                    3. AI 返回响应（可能包含工具调用）
                                    4. Server 执行工具（如读取文件）
                                    5. 将结果返回给 AI 继续处理
                                    6. 最终响应返回
                                              │
                                              ▼
◄────JSON Response (Assistant Message)──────┘
    {
      "info": {"role": "assistant", ...},
      "parts": [
        {"type": "text", "text": "AI 回复"}
      ]
    }
```

### 4. 工具调用流程

```
AI 决定需要调用工具
    │
    ▼
Server 识别工具调用 (如 file.read, find.text)
    │
    ▼
Server 在本地执行工具
    │
    ▼
将工具结果返回给 AI
    │
    ▼
AI 基于工具结果生成最终回复
```

**重要：工具调用完全在 Server 端执行**，Client 只是被动接收结果。

### 5. 实时事件流 (SSE)

对于实时更新，SDK 使用 SSE：

```javascript
// 订阅服务器事件
const events = await client.event.subscribe();
for await (const event of events.stream) {
  console.log(event.type, event.properties);
}
```

这可以实时接收：
- 消息更新
- 工具执行进度
- 状态变化

## 远程服务器部署

**可以！** OpenCode Server 完全支持远程部署。

### 本地连接
```javascript
const client = createOpencodeClient({
  baseUrl: "http://localhost:4096"
});
```

### 远程连接
```javascript
const client = createOpencodeClient({
  baseUrl: "https://your-server.com:4096"
});
```

### 注意事项
1. **安全性**：远程部署需要配置认证（API Key、OAuth）
2. **文件访问**：Server 会操作**它所在机器**的文件系统，不是客户端的
3. **网络延迟**：AI 响应时间会增加网络往返延迟
4. **CORS**：Web 客户端需要 Server 配置允许跨域

### 启动远程 Server
```bash
# 在远程服务器上
opencode --host 0.0.0.0 --port 4096
```

## 总结

| 组件 | 职责 | 位置 |
|------|------|------|
| SDK | HTTP 客户端封装 | 浏览器/Node.js |
| Server | AI 交互、工具执行、文件操作 | 服务器（本地或远程） |
| AI Provider | LLM 服务 | OpenCode/Anthropic/OpenAI 等 |

Web 客户端本质上是**一个轻量级的控制面板**，所有繁重工作都在 OpenCode Server 上完成。
