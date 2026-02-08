/**
 * OpenCode Web Client 主入口
 *
 * 模块结构:
 * - main.js: 应用入口
 * - state.js: 状态管理
 * - logger.js: 日志工具
 * - utils.js: 工具函数
 * - api.js: OpenCode SDK 交互
 * - events.js: SSE 事件处理
 * - parts.js: 消息片段处理
 * - ui.js: UI 操作
 * - app.js: 应用主逻辑
 */

import { init } from "./app.js";

// 页面加载完成后初始化应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
