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

### 方式一：Python HTTP Server（推荐用于开发测试）

```bash
# 在项目目录下执行
cd /Users/mochuxian/code/opencode-skd

# 启动 HTTP 服务器（端口 8000）
python3 -m http.server 8000
```

访问：http://localhost:8000/opencode-client.html

### 方式二：使用后台进程

```bash
# 启动后台服务
nohup python3 -m http.server 8000 > /tmp/opencode-web.log 2>&1 &

# 记录进程 ID
echo $! > /tmp/opencode-web.pid
```

### 方式三：使用系统服务（生产环境）

创建 `/usr/local/etc/opencode-web.plist`（macOS LaunchAgent）：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.opencode.web</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>-m</string>
        <string>http.server</string>
        <string>8000</string>
        <string>--directory</string>
        <string>/Users/mochuxian/code/opencode-skd</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>/Users/mochuxian/code/opencode-skd</string>
</dict>
</plist>
```

加载服务：
```bash
launchctl load ~/Library/LaunchAgents/com.opencode-web.plist
launchctl start com.opencode-web
```

## 停止服务

### 停止前台服务
```bash
# 按 Ctrl + C
```

### 停止后台进程
```bash
# 查找并杀掉进程
pkill -f "python3 -m http.server 8000"

# 或使用保存的 PID
if [ -f /tmp/opencode-web.pid ]; then
    kill $(cat /tmp/opencode-web.pid)
    rm /tmp/opencode-web.pid
fi
```

### 停止系统服务
```bash
launchctl unload ~/Library/LaunchAgents/com.opencode-web.plist
```

## 使用说明

1. 打开浏览器访问 http://localhost:8000/opencode-client.html
2. 确认 OpenCode Server 正在运行（默认 http://localhost:4096）
3. 点击"连接"按钮
4. 点击"新建会话"
5. 选择模型（默认：opencode:minimax-m2.1-free）
6. 输入指令，点击"发送"

## 配置说明

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| Server URL | http://localhost:4096 | OpenCode Server 地址 |
| 模型 | opencode:minimax-m2.1-free | 免费模型，无需 API Key |

## 远程部署

如需将 Web 客户端部署到远程服务器：

1. 将 `opencode-client.html` 上传到 Web 服务器
2. 修改页面中的默认 Server URL：
   ```javascript
   serverUrlInput.value = 'http://your-server:4096';
   ```
3. 确保 OpenCode Server 允许跨域访问

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
opencode-skd/
├── opencode-client.html      # Web 客户端页面
├── opencode-architecture.md  # 架构分析文档
└── README.md                 # 本文档
```
