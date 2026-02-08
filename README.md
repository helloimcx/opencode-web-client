# OpenCode Web Client

基于 OpenCode SDK 的网页版客户端，用于与 OpenCode Server 交互。

## 前置要求

1. **OpenCode Server** - 确保已安装并运行
   ```bash
   # 检查是否已安装
   opencode --version

   # 如未安装，执行：
   npm install -g opencode-ai

   # 启动 Server
   opencode
   ```

2. **Python 3** - 用于启动 HTTP 服务器
   ```bash
   python3 --version
   ```

## 快速启动

### 方式一：使用启动脚本（推荐）

```bash
# 启动服务
./start.sh

# 停止服务
./stop.sh

# 重启服务
./restart.sh
```

### 方式二：Python HTTP Server

```bash
# 在项目目录下执行
cd /path/to/opencode-web-client

# 启动 HTTP 服务器（端口 8000）
python3 -m http.server 8000
```

访问：http://localhost:8000/opencode-client.html

### 方式三：后台进程

```bash
# 启动后台服务
nohup python3 -m http.server 8000 > /tmp/opencode-web.log 2>&1 &
echo $! > /tmp/opencode-web.pid

# 停止后台服务
pkill -f "python3 -m http.server 8000"
```

## 测试

```bash
# 运行 E2E 测试
python tests/test_client.py

# 运行控制台测试
python tests/test_console.py
```

## 使用说明

1. 打开浏览器访问 http://localhost:8000/opencode-client.html
2. 确认 OpenCode Server 正在运行（默认 http://localhost:4096）
3. 点击"连接"按钮
4. 点击"新建会话"
5. 选择模型（默认优先选择 kimi:k2p5，备选免费模型）
6. 输入指令，点击"发送"

## 配置说明

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| Server URL | http://localhost:4096 | OpenCode Server 地址 |
| 模型 | kimi:k2p5 (付费) / kimi:k2.5-free (免费) | 优先选择付费版，失败自动切换免费版 |

## 远程部署

如需将 Web 客户端部署到远程服务器：

1. 将以下文件/目录上传到 Web 服务器：
   - `opencode-client.html`
   - `js/` (整个目录)

2. 无需修改配置（Server URL 可在界面中设置）

## 常见问题

**Q: 连接失败怎么办？**
- 检查 OpenCode Server 是否运行：`curl http://localhost:4096/config/providers`
- 检查端口是否正确

**Q: 收不到 AI 回复？**
- 打开浏览器开发者工具 (F12) 查看 Console 日志
- 确认选择的模型已配置 API Key

**Q: 如何更换端口？**
- 修改启动命令中的端口号：`python3 -m http.server 8080`

## 目录结构

```
opencode-web-client/
├── opencode-client.html      # Web 客户端页面
├── js/                       # JavaScript 模块
│   ├── main.js              # 应用入口
│   ├── app.js               # 主应用逻辑
│   ├── state.js             # 状态管理
│   ├── logger.js            # 日志工具
│   ├── utils.js             # 工具函数
│   ├── api.js               # SDK API 交互
│   ├── events.js            # SSE 事件处理
│   ├── parts.js             # 消息片段处理
│   ├── ui.js                # UI 操作
│   └── README.md            # 模块说明
├── tests/                    # 测试文件
│   ├── test_client.py        # E2E 测试
│   └── test_console.py       # 控制台测试
├── docs/                     # 文档
│   ├── opencode-sdk.md       # SDK API 参考
│   ├── opencode-sse-events.md # SSE 事件结构
│   └── client-implementation.md # 技术实现文档
├── start.sh                  # 启动脚本
├── stop.sh                   # 停止脚本
├── restart.sh                # 重启脚本
├── CLAUDE.md                 # Claude Code 指南
└── README.md                 # 本文档
```
