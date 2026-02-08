/**
 * Part 处理模块
 * 负责处理消息片段（text、reasoning、tool-call 等）的渲染和更新
 */

import { state } from "./state.js";
import { debug } from "./logger.js";
import { escapeHtml, scrollToBottom, truncate } from "./utils.js";

/**
 * Part 类型常量
 */
export const PartType = {
    TEXT: 'text',
    REASONING: 'reasoning',
    STEP_START: 'step-start',
    STEP_FINISH: 'step-finish',
    TOOL_CALL: 'tool-call',
    TOOL_CALL_ALT: 'toolCall'
};

/**
 * 处理 Part 更新事件
 * @param {object} part - Part 对象
 */
export function handlePartUpdated(part) {
    debug('Part updated:', part);

    // 过滤当前会话
    if (part.sessionID && part.sessionID !== state.getCurrentSessionId()) {
        return;
    }

    // 确保 AI 消息容器存在
    ensureAssistantMessageContainer();

    const contentDiv = getAssistantContentDiv();
    if (!contentDiv) return;

    const partId = part.id;
    const partType = part.type;

    debug('Part', 'Type:', partType, 'ID:', partId, 'Delta:', part.delta, 'Text:', part.text?.substring(0, 50));

    // 根据 Part 类型分发处理
    switch (partType) {
        case PartType.TEXT:
            handleTextPart(contentDiv, partId, part);
            break;

        case PartType.REASONING:
            handleReasoningPart(contentDiv, partId, part);
            break;

        case PartType.STEP_START:
            triggerProcessingShow();
            break;

        case PartType.STEP_FINISH:
            triggerProcessingHide();
            break;

        case PartType.TOOL_CALL:
        case PartType.TOOL_CALL_ALT:
            handleToolCallPart(contentDiv, partId, part);
            break;

        default:
            handleUnknownPart(contentDiv, partId, partType, part);
    }
}

/**
 * 确保 AI 消息容器存在
 */
function ensureAssistantMessageContainer() {
    if (!state.getDynamicUI('assistantMessageDiv')) {
        const chatContainer = state.getUI('chatContainer');
        const messageDiv = createAssistantMessage('');
        chatContainer.appendChild(messageDiv);
        state.setDynamicUI('assistantMessageDiv', messageDiv);
    }
}

/**
 * 获取 AI 消息内容容器
 * @returns {HTMLElement|null} 内容容器元素
 */
function getAssistantContentDiv() {
    const assistantDiv = state.getDynamicUI('assistantMessageDiv');
    return assistantDiv?.querySelector('.message-content') || null;
}

/**
 * 处理文本 Part
 * @param {HTMLElement} contentDiv - 内容容器
 * @param {string} partId - Part ID
 * @param {object} part - Part 数据
 */
function handleTextPart(contentDiv, partId, part) {
    const textContent = part.text || '';
    if (!textContent) return;

    let textDiv = contentDiv.querySelector(`.text-block[data-part-id="${partId}"]`);

    if (!textDiv) {
        textDiv = createTextBlockElement(partId);
        contentDiv.appendChild(textDiv);
    }

    // 只在内容变长时更新（SSE 发送累积文本）
    if (textContent.length > textDiv.textContent.length) {
        textDiv.textContent = textContent;
        scrollToBottom(state.getUI('chatContainer'));
    }
}

/**
 * 创建文本块元素
 * @param {string} partId - Part ID
 * @returns {HTMLElement} 文本块元素
 */
function createTextBlockElement(partId) {
    const textDiv = document.createElement('div');
    textDiv.className = 'text-block stream-text';
    textDiv.setAttribute('data-part-id', partId || 'unknown');
    textDiv.style.whiteSpace = 'pre-wrap';
    return textDiv;
}

/**
 * 处理推理 Part
 * @param {HTMLElement} contentDiv - 内容容器
 * @param {string} partId - Part ID
 * @param {object} part - Part 数据
 */
function handleReasoningPart(contentDiv, partId, part) {
    let reasoningDiv = contentDiv.querySelector(`.reasoning-inline[data-part-id="${partId}"]`);

    if (!reasoningDiv) {
        reasoningDiv = createReasoningElement(partId);
        contentDiv.appendChild(reasoningDiv);
    }

    const reasoningText = part.text || '';
    if (reasoningText.length > reasoningDiv.textContent.length) {
        reasoningDiv.textContent = reasoningText;
        scrollToBottom(state.getUI('chatContainer'));
    }
}

/**
 * 创建推理元素
 * @param {string} partId - Part ID
 * @returns {HTMLElement} 推理元素
 */
function createReasoningElement(partId) {
    const reasoningDiv = document.createElement('div');
    reasoningDiv.className = 'reasoning-inline';
    reasoningDiv.setAttribute('data-part-id', partId || 'unknown');
    reasoningDiv.style.color = '#888';
    reasoningDiv.style.fontStyle = 'italic';
    reasoningDiv.style.fontSize = '0.85rem';
    reasoningDiv.style.marginBottom = '8px';
    reasoningDiv.style.padding = '8px';
    reasoningDiv.style.background = '#1a1a2e';
    reasoningDiv.style.borderRadius = '4px';
    reasoningDiv.style.whiteSpace = 'pre-wrap';
    return reasoningDiv;
}

/**
 * 处理工具调用 Part
 * @param {HTMLElement} contentDiv - 内容容器
 * @param {string} partId - Part ID
 * @param {object} part - Part 数据
 */
function handleToolCallPart(contentDiv, partId, part) {
    let toolDiv = contentDiv.querySelector(`.tool-inline[data-part-id="${partId}"]`);

    if (!toolDiv) {
        debug('Tool call', part);

        const toolName = part.name || part.toolName || part.tool || 'unknown';
        const toolArgs = part.arguments || part.args || {};
        const toolResult = part.result || part.output;

        toolDiv = createToolInlineElement(partId, toolName, toolArgs, toolResult);
        contentDiv.appendChild(toolDiv);
        scrollToBottom(state.getUI('chatContainer'));
    }
}

/**
 * 创建工具调用行内元素
 * @param {string} partId - Part ID
 * @param {string} toolName - 工具名称
 * @param {object} toolArgs - 工具参数
 * @param {any} toolResult - 工具结果
 * @returns {HTMLElement} 工具元素
 */
function createToolInlineElement(partId, toolName, toolArgs, toolResult) {
    const toolDiv = document.createElement('div');
    toolDiv.className = 'tool-inline';
    toolDiv.setAttribute('data-part-id', partId || 'unknown');
    toolDiv.style.color = '#4ade80';
    toolDiv.style.fontSize = '0.85rem';
    toolDiv.style.marginTop = '4px';
    toolDiv.style.padding = '4px 8px';
    toolDiv.style.background = '#1a2a1a';
    toolDiv.style.borderRadius = '4px';
    toolDiv.style.border = '1px solid #2a3a2a';

    let toolText = `🔧 ${toolName}`;
    if (Object.keys(toolArgs).length > 0) {
        toolText += `(${truncate(JSON.stringify(toolArgs), 50)}...)`;
    }
    if (toolResult) {
        toolText += ' ✓';
    }

    toolDiv.textContent = toolText;
    return toolDiv;
}

/**
 * 处理未知类型的 Part
 * @param {HTMLElement} contentDiv - 内容容器
 * @param {string} partId - Part ID
 * @param {string} partType - Part 类型
 * @param {object} part - Part 数据
 */
function handleUnknownPart(contentDiv, partId, partType, part) {
    // 检查是否看起来像工具调用
    if (part.name || part.toolName || part.tool) {
        debug('Tool call - unknown type', partType, part);

        const toolName = part.name || part.toolName || part.tool || 'unknown';
        const toolArgs = part.arguments || part.args || {};
        const toolResult = part.result || part.output;

        let toolDiv = contentDiv.querySelector(`.tool-inline[data-part-id="${partId || 'unknown'}"]`);
        if (!toolDiv) {
            toolDiv = createToolInlineElement(partId || 'unknown', toolName, toolArgs, toolResult);
            contentDiv.appendChild(toolDiv);
            scrollToBottom(state.getUI('chatContainer'));
        }
    } else {
        debug('Unknown Part type', partType, part);
    }
}

/**
 * 触发显示处理指示器
 */
function triggerProcessingShow() {
    window.dispatchEvent(new CustomEvent('opencode:processing:show'));
}

/**
 * 触发隐藏处理指示器
 */
function triggerProcessingHide() {
    window.dispatchEvent(new CustomEvent('opencode:processing:hide'));
}

/**
 * 创建 AI 消息元素
 * @param {string} content - 消息内容
 * @returns {HTMLElement} 消息元素
 */
export function createAssistantMessage(content) {
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
 * 将 Part 转换为 HTML 字符串（用于加载历史消息）
 * @param {object} p - Part 对象
 * @returns {string} HTML 字符串
 */
export function partToHtml(p) {
    const partId = p.id || 'unknown';

    switch (p.type) {
        case PartType.TEXT:
            return `<div class="text-block stream-text" style="white-space: pre-wrap;" data-part-id="${partId}">${escapeHtml(p.text || '')}</div>`;

        case PartType.REASONING:
            return `<div class="reasoning-inline" data-part-id="${partId}" style="color: #888; font-style: italic; font-size: 0.85rem; margin-bottom: 8px; padding: 8px; background: #1a1a2e; border-radius: 4px; white-space: pre-wrap;">${escapeHtml(p.text || p.content || '')}</div>`;

        case PartType.TOOL_CALL:
        case PartType.TOOL_CALL_ALT:
        case 'tool':
            const toolName = p.name || p.toolName || p.tool || 'unknown';
            const toolArgs = p.arguments || p.args || {};
            let toolText = `🔧 ${toolName}`;
            if (Object.keys(toolArgs).length > 0) {
                toolText += `(${truncate(JSON.stringify(toolArgs), 50)}...)`;
            }
            if (p.result || p.output) {
                toolText += ' ✓';
            }
            return `<div class="tool-inline" data-part-id="${partId}" style="color: #4ade80; font-size: 0.85rem; margin-top: 4px; padding: 4px 8px; background: #1a2a1a; border-radius: 4px; border: 1px solid #2a3a2a;">${escapeHtml(toolText)}</div>`;

        case PartType.STEP_START:
        case PartType.STEP_FINISH:
            return ''; // 跳过步骤标记

        default:
            if (p.text) {
                return `<div class="text-block stream-text" style="white-space: pre-wrap;" data-part-id="${partId}">${escapeHtml(p.text)}</div>`;
            }
            return '';
    }
}
