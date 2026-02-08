# JavaScript 模块说明

本目录包含 OpenCode Web Client 的所有 JavaScript 模块，按照单一职责原则进行组织。

## 模块结构

```
js/
├── main.js      # 应用入口，负责初始化
├── app.js       # 主应用逻辑，协调各模块
├── state.js     # 状态管理（单例模式）
├── logger.js    # 日志工具
├── utils.js     # 通用工具函数
├── api.js       # OpenCode SDK API 交互
├── events.js    # SSE 事件处理和路由
├── parts.js     # 消息片段（Part）处理
└── ui.js        # UI 操作和 DOM 更新
```

## 模块职责

### main.js
- 应用入口点
- 负责在 DOM 准备好后初始化应用

### app.js
- 主应用逻辑
- 业务流程协调
- DOM 事件绑定
- 自定义事件处理器注册
- 导出主要业务函数：`connect()`, `handleCreateSession()`, `handleSendPrompt()`, `handleStopPrompt()`

### state.js
- 全局状态管理（单例模式）
- 客户端实例、会话状态、UI 引用管理
- 提供统一的 get/set 接口

### logger.js
- 统一的日志输出
- 支持不同日志级别：DEBUG, INFO, EVENT, WARN, ERROR
- 提供带前缀的格式化日志

### utils.js
- 通用工具函数
- HTML 转义（防止 XSS）
- localStorage 封装
- 字符串截断和格式化

### api.js
- OpenCode SDK 交互封装
- 所有 API 调用集中管理
- 函数列表：
  - `createClient()` - 创建客户端
  - `fetchProviders()` - 获取模型列表
  - `createSession()` - 创建会话
  - `fetchMessages()` - 获取消息历史
  - `sendPrompt()` - 发送消息
  - `abortSession()` - 停止任务
  - `subscribeToEvents()` - 订阅 SSE 事件

### events.js
- SSE 事件处理
- 事件类型路由
- 通过自定义事件与 UI 层解耦

### parts.js
- 消息片段（Part）处理
- 支持 text、reasoning、tool-call 等类型
- 流式内容更新逻辑

### ui.js
- 所有 DOM 操作
- UI 状态更新
- 消息渲染
- 按钮状态管理

## 模块间通信

模块间通过以下方式通信：

1. **直接导入** - 下层模块被上层模块导入使用
2. **自定义事件** - 使用 CustomEvent 实现解耦通信

```javascript
// 发送事件
window.dispatchEvent(new CustomEvent('opencode:part:updated', { detail: partData }));

// 监听事件
window.addEventListener('opencode:part:updated', (e) => {
    handlePartUpdated(e.detail);
});
```

## 自定义事件列表

| 事件名 | 触发时机 | 数据 |
|--------|----------|------|
| `opencode-event` | 收到 SSE 原始事件 | event 对象 |
| `opencode:message:created` | 消息创建 | message 对象 |
| `opencode:message:updated` | 消息更新 | message 对象 |
| `opencode:part:updated` | Part 更新 | part 对象 |
| `opencode:session:status` | 会话状态变化 | status 对象 |
| `opencode:processing:show` | 显示处理指示器 | null |
| `opencode:processing:hide` | 隐藏处理指示器 | null |
| `opencode:reload:messages` | 重新加载消息 | null |
