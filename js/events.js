/**
 * SSE 事件处理模块
 * 负责处理来自 OpenCode Server 的 Server-Sent Events
 */

import { state } from "./state.js";
import { logEvent, logEventRaw, handle, skip, unhandled, debug } from "./logger.js";

/**
 * 事件类型映射
 * 兼容不同版本的事件类型命名
 */
const EVENT_TYPES = {
    MESSAGE_CREATED: ['message.created', 'messageCreate', 'messageCreated'],
    MESSAGE_UPDATED: ['message.updated', 'messageUpdate', 'messageUpdated'],
    PART_UPDATED: ['message.part.updated', 'messagePartUpdated', 'part.updated'],
    SESSION_STATUS: ['session.status']
};

/**
 * 检查事件类型是否匹配
 * @param {string} eventType - 事件类型
 * @param {Array<string>} patterns - 匹配模式列表
 * @returns {boolean} 是否匹配
 */
function matchEventType(eventType, patterns) {
    return patterns.some(pattern => pattern.toLowerCase() === eventType?.toLowerCase());
}

/**
 * 处理 SSE 事件
 * @param {object} event - 原始事件对象
 */
export function handleEvent(event) {
    // 记录原始事件用于调试
    logEventRaw('EVENT', event);

    // 提取事件类型和属性
    const eventType = extractEventType(event);
    const properties = extractProperties(event);

    logEvent(eventType, properties);

    // 过滤当前会话的事件
    if (!isCurrentSessionEvent(properties)) {
        skip('Not current session:', properties.sessionID, 'vs', state.getCurrentSessionId());
        return;
    }

    // 路由事件到对应的处理器
    routeEvent(eventType, properties);
}

/**
 * 提取事件类型
 * @param {object} event - 事件对象
 * @returns {string} 事件类型
 */
function extractEventType(event) {
    return event.type || event.event || event.eventType;
}

/**
 * 提取事件属性
 * @param {object} event - 事件对象
 * @returns {object} 事件属性
 */
function extractProperties(event) {
    return event.properties || event.data || event;
}

/**
 * 检查是否是当前会话的事件
 * @param {object} properties - 事件属性
 * @returns {boolean} 是否是当前会话
 */
function isCurrentSessionEvent(properties) {
    const currentSessionId = state.getCurrentSessionId();
    if (!properties.sessionID) return true; // 没有 sessionID 的事件是全局事件
    return properties.sessionID === currentSessionId;
}

/**
 * 路由事件到对应的处理器
 * @param {string} eventType - 事件类型
 * @param {object} properties - 事件属性
 */
function routeEvent(eventType, properties) {
    // message.created 事件
    if (matchEventType(eventType, EVENT_TYPES.MESSAGE_CREATED)) {
        handle('message.created');
        triggerHandler('message:created', properties);
        return;
    }

    // message.updated 事件
    if (matchEventType(eventType, EVENT_TYPES.MESSAGE_UPDATED)) {
        handle('message.updated');
        triggerHandler('message:updated', properties);
        return;
    }

    // message.part.updated 事件
    if (matchEventType(eventType, EVENT_TYPES.PART_UPDATED)) {
        handle('message.part.updated');
        const part = properties.part || properties;
        triggerHandler('part:updated', part);
        return;
    }

    // session.status 事件
    if (matchEventType(eventType, EVENT_TYPES.SESSION_STATUS)) {
        handle('session.status', properties.status);
        triggerHandler('session:status', properties.status);
        return;
    }

    // 未处理的事件类型
    unhandled(eventType);
}

/**
 * 触发自定义事件处理器
 * @param {string} handlerName - 处理器名称
 * @param {object} data - 事件数据
 */
function triggerHandler(handlerName, data) {
    window.dispatchEvent(new CustomEvent(`opencode:${handlerName}`, { detail: data }));
}

/**
 * 处理消息创建事件
 * @param {object} msg - 消息对象
 */
export function handleMessageCreated(msg) {
    const { isProcessing } = state;
    const chatContainer = state.getUI('chatContainer');

    if (msg.info?.role === 'assistant' && isProcessing()) {
        // 创建 AI 消息占位符
        if (!state.getDynamicUI('assistantMessageDiv')) {
            const messageDiv = createAssistantMessage('');
            chatContainer.appendChild(messageDiv);
            state.setDynamicUI('assistantMessageDiv', messageDiv);
        }
    }
}

/**
 * 处理消息更新事件
 * @param {object} msg - 消息对象
 */
export function handleMessageUpdated(msg) {
    debug('Message updated:', msg);

    // 在非活跃处理期间重新加载消息
    if (msg.info?.role === 'assistant' && !state.isProcessing()) {
        // 触发重新加载消息事件
        triggerHandler('reload:messages', null);
    }
}

/**
 * 处理会话状态变化
 * @param {object} statusData - 状态数据
 */
export function handleSessionStatus(statusData) {
    if (!statusData?.type) return;

    if (statusData.type === 'busy') {
        triggerHandler('processing:show', null);
    } else if (statusData.type === 'idle') {
        triggerHandler('processing:hide', null);
    }
}

/**
 * 创建 AI 消息元素
 * @param {string} content - 消息内容
 * @returns {HTMLElement} 消息元素
 */
function createAssistantMessage(content) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message assistant';
    msgDiv.innerHTML = `
        <div class="message-header">
            <span>AI</span>
            <span>${new Date().toLocaleTimeString()}</span>
        </div>
        <div class="message-content">${escapeHtml(content)}</div>
    `;
    return msgDiv;
}

/**
 * 简单的 HTML 转义
 * @param {string} text - 文本
 * @returns {string} 转义后的文本
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
