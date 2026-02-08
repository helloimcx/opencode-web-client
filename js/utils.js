/**
 * 工具函数模块
 */

/**
 * 转义 HTML 特殊字符，防止 XSS
 * @param {string} text - 需要转义的文本
 * @returns {string} 转义后的 HTML
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 滚动聊天容器到底部
 * @param {HTMLElement} container - 聊天容器元素
 */
export function scrollToBottom(container) {
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

/**
 * 格式化时间戳
 * @returns {string} 格式化的本地时间
 */
export function formatTime() {
    return new Date().toLocaleTimeString();
}

/**
 * 获取存储的服务器 URL
 * @param {string} defaultUrl - 默认 URL
 * @returns {string} 存储的 URL 或默认 URL
 */
export function getStoredServerUrl(defaultUrl = 'http://localhost:4096') {
    return localStorage.getItem('opencode_serverUrl') || defaultUrl;
}

/**
 * 保存服务器 URL
 * @param {string} url - 服务器 URL
 */
export function storeServerUrl(url) {
    localStorage.setItem('opencode_serverUrl', url);
}

/**
 * 获取存储的会话 ID
 * @returns {string|null} 会话 ID
 */
export function getStoredSessionId() {
    return localStorage.getItem('opencode_sessionId');
}

/**
 * 保存会话 ID
 * @param {string} sessionId - 会话 ID
 */
export function storeSessionId(sessionId) {
    localStorage.setItem('opencode_sessionId', sessionId);
}

/**
 * 清除存储的会话 ID
 */
export function clearStoredSessionId() {
    localStorage.removeItem('opencode_sessionId');
}

/**
 * 截断字符串并添加省略号
 * @param {string} str - 原字符串
 * @param {number} maxLength - 最大长度
 * @returns {string} 截断后的字符串
 */
export function truncate(str, maxLength) {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
}

/**
 * 格式化工具调用参数显示
 * @param {object} args - 工具参数
 * @returns {string} 格式化后的字符串
 */
export function formatToolArgs(args) {
    if (!args || Object.keys(args).length === 0) return '';
    return truncate(JSON.stringify(args, null, 2), 50);
}

/**
 * 格式化工具调用结果显示
 * @param {any} result - 工具结果
 * @returns {string} 格式化后的字符串
 */
export function formatToolResult(result) {
    if (result === undefined || result === null) return '';
    const resultStr = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    return truncate(resultStr, 500);
}
