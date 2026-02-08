/**
 * 日志模块
 * 提供统一的前缀日志输出
 */

// 日志级别
const LogLevel = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    EVENT: 'EVENT',
    WARN: 'WARN',
    ERROR: 'ERROR'
};

/**
 * 格式化日志前缀
 * @param {string} level - 日志级别
 * @param {string} tag - 日志标签
 * @returns {string} 格式化后的前缀
 */
function formatPrefix(level, tag) {
    return `[${level}]${tag ? ` [${tag}]` : ''}`;
}

/**
 * 调试日志
 * @param {string} tag - 日志标签
 * @param {...any} args - 日志参数
 */
export function debug(tag, ...args) {
    console.log(formatPrefix(LogLevel.DEBUG, tag), ...args);
}

/**
 * 信息日志
 * @param {string} tag - 日志标签
 * @param {...any} args - 日志参数
 */
export function info(tag, ...args) {
    console.log(formatPrefix(LogLevel.INFO, tag), ...args);
}

/**
 * 事件日志
 * @param {string} tag - 事件类型
 * @param {...any} args - 事件数据
 */
export function logEvent(tag, ...args) {
    console.log(formatPrefix(LogLevel.EVENT, tag), ...args);
}

/**
 * 原始事件日志（完整 JSON）
 * @param {string} eventName - 事件名称
 * @param {object} event - 事件对象
 */
export function logEventRaw(eventName, event) {
    console.log(`[EVENT RAW] ${eventName}`, JSON.stringify(event));
}

/**
 * 警告日志
 * @param {string} tag - 日志标签
 * @param {...any} args - 日志参数
 */
export function warn(tag, ...args) {
    console.warn(formatPrefix(LogLevel.WARN, tag), ...args);
}

/**
 * 错误日志
 * @param {string} tag - 错误标签
 * @param {Error|string} error - 错误对象或消息
 * @param {...any} args - 额外参数
 */
export function error(tag, error, ...args) {
    console.error(formatPrefix(LogLevel.ERROR, tag), error, ...args);
}

/**
 * SSE 错误日志
 * @param {Error} err - 错误对象
 */
export function sseError(err) {
    console.error('[SSE Error]', err);
}

/**
 * 跳过日志（用于调试事件过滤）
 * @param {string} reason - 跳过原因
 * @param {...any} args - 相关数据
 */
export function skip(reason, ...args) {
    console.log('[SKIP]', reason, ...args);
}

/**
 * 处理日志（标记事件处理）
 * @param {string} handler - 处理器名称
 * @param {...any} args - 相关数据
 */
export function handle(handler, ...args) {
    console.log(`[HANDLE] ${handler}`, ...args);
}

/**
 * 未处理类型日志
 * @param {string} type - 未处理的类型
 */
export function unhandled(type) {
    console.log('[Unhandled Event Type]', type);
}
