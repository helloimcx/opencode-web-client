/**
 * UI 操作模块
 * 负责所有 DOM 操作和界面更新
 */

import { state } from "./state.js";
import { escapeHtml, scrollToBottom, formatTime } from "./utils.js";
import { debug } from "./logger.js";

/**
 * 设置连接状态
 * @param {string} status - 状态: 'online', 'offline', 'connecting'
 */
export function setStatus(status) {
    const statusDot = state.getUI('statusDot');
    const statusText = state.getUI('statusText');

    if (statusDot) {
        statusDot.className = 'status-dot ' + status;
    }

    if (statusText) {
        const statusMap = {
            'online': '在线',
            'offline': '离线',
            'connecting': '连接中...'
        };
        statusText.textContent = statusMap[status] || status;
    }
}

/**
 * 显示处理指示器
 */
export function showProcessingIndicator() {
    const chatContainer = state.getUI('chatContainer');
    if (!chatContainer || state.getDynamicUI('processingIndicator')) return;

    const indicator = document.createElement('div');
    indicator.className = 'processing-indicator';
    indicator.innerHTML = `
        <div class="processing-header">
            <span class="processing-spinner"></span>
            <span>AI 正在处理...</span>
        </div>
        <div class="processing-steps" id="processingSteps"></div>
    `;

    chatContainer.appendChild(indicator);
    state.setDynamicUI('processingIndicator', indicator);
    scrollToBottom(chatContainer);
}

/**
 * 隐藏处理指示器
 */
export function hideProcessingIndicator() {
    const indicator = state.getDynamicUI('processingIndicator');
    if (!indicator) return;

    indicator.style.opacity = '0';
    indicator.style.transition = 'opacity 0.3s';

    setTimeout(() => {
        if (indicator && indicator.parentNode) {
            indicator.remove();
        }
        state.setDynamicUI('processingIndicator', null);
    }, 300);
}

/**
 * 更新处理步骤
 * @param {string} name - 步骤名称
 * @param {string} status - 状态: 'active', 'completed'
 * @param {string} detail - 详情
 */
export function updateProcessingStep(name, status, detail = '') {
    showProcessingIndicator();

    const indicator = state.getDynamicUI('processingIndicator');
    if (!indicator) return;

    const stepsDiv = indicator.querySelector('.processing-steps');
    let stepDiv = stepsDiv?.querySelector('.processing-step');

    if (!stepDiv) {
        stepDiv = createStepElement(name, status, detail);
        stepsDiv?.appendChild(stepDiv);
    } else {
        stepDiv.className = `processing-step ${status}`;
        const icon = stepDiv.querySelector('.step-icon');
        if (icon) {
            icon.textContent = status === 'completed' ? '✓' : '⏳';
        }
    }

    scrollToBottom(state.getUI('chatContainer'));
}

/**
 * 添加处理步骤
 * @param {string} name - 步骤名称
 * @param {string} status - 状态: 'active', 'completed'
 * @param {string} detail - 详情
 */
export function addProcessingStep(name, status = 'active', detail = '') {
    showProcessingIndicator();

    const indicator = state.getDynamicUI('processingIndicator');
    if (!indicator) return;

    const stepsDiv = indicator.querySelector('.processing-steps');
    const stepDiv = createStepElement(name, status, detail);

    stepsDiv?.appendChild(stepDiv);
    scrollToBottom(state.getUI('chatContainer'));
}

/**
 * 创建步骤元素
 * @param {string} name - 步骤名称
 * @param {string} status - 状态
 * @param {string} detail - 详情
 * @returns {HTMLElement} 步骤元素
 */
function createStepElement(name, status, detail) {
    const stepDiv = document.createElement('div');
    stepDiv.className = `processing-step ${status}`;
    stepDiv.innerHTML = `
        <span class="step-icon">${status === 'active' ? '⏳' : '✓'}</span>
        <div class="step-text">
            <div>${escapeHtml(name)}</div>
            ${detail ? `<div class="step-detail">${escapeHtml(detail)}</div>` : ''}
        </div>
    `;
    return stepDiv;
}

/**
 * 添加消息到聊天容器
 * @param {string} role - 角色: 'user', 'assistant', 'error', 'system'
 * @param {string} content - 消息内容
 * @param {boolean} scroll - 是否滚动到底部
 * @param {Array} parts - 消息片段
 */
export function addMessage(role, content, scroll = true, parts = null) {
    const chatContainer = state.getUI('chatContainer');
    if (!chatContainer) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ' + role;

    let partsHtml = '';
    if (parts) {
        partsHtml = renderPartsHtml(parts);
    } else {
        partsHtml = escapeHtml(content);
    }

    const roleLabel = {
        'user': '用户',
        'assistant': 'AI',
        'error': '错误'
    }[role] || role;

    msgDiv.innerHTML = `
        <div class="message-header">
            <span>${roleLabel}</span>
            <span>${formatTime()}</span>
        </div>
        <div class="message-content">${partsHtml}</div>
    `;

    chatContainer.appendChild(msgDiv);
    if (scroll) scrollToBottom(chatContainer);
}

/**
 * 添加带 Parts 的消息
 * @param {string} role - 角色
 * @param {string} content - 内容
 * @param {string} partsHtml - Parts HTML
 * @param {boolean} scroll - 是否滚动
 */
export function addMessageWithParts(role, content, partsHtml, scroll = true) {
    const chatContainer = state.getUI('chatContainer');
    if (!chatContainer) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ' + role;

    let contentHtml = '';
    if (content) {
        contentHtml = `<div class="stream-text">${escapeHtml(content)}</div>`;
    }

    const roleLabel = {
        'user': '用户',
        'assistant': 'AI',
        'error': '错误'
    }[role] || role;

    msgDiv.innerHTML = `
        <div class="message-header">
            <span>${roleLabel}</span>
            <span>${formatTime()}</span>
        </div>
        <div class="message-content">${contentHtml}${partsHtml}</div>
    `;

    chatContainer.appendChild(msgDiv);
    if (scroll) scrollToBottom(chatContainer);
}

/**
 * 添加系统消息
 * @param {string} text - 消息文本
 */
export function addSystemMessage(text) {
    const chatContainer = state.getUI('chatContainer');
    if (!chatContainer) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'message system';
    msgDiv.textContent = text;
    chatContainer.appendChild(msgDiv);
    scrollToBottom(chatContainer);
}

/**
 * 渲染 Parts HTML
 * @param {Array} parts - Parts 数组
 * @returns {string} HTML 字符串
 */
function renderPartsHtml(parts) {
    return parts.map(p => {
        switch (p.type) {
            case 'text':
                return `<div class="stream-text">${escapeHtml(p.text)}</div>`;

            case 'reasoning':
                return `
                    <div class="reasoning-block">
                        <div class="reasoning-header" onclick="this.nextElementSibling.classList.toggle('collapsed')">
                            <span>🧠</span>
                            <span>思考过程</span>
                            <span style="margin-left: auto;">▼</span>
                        </div>
                        <div class="reasoning-content">${escapeHtml(p.text || p.content || '')}</div>
                    </div>`;

            case 'step-start':
            case 'step-finish':
                return ''; // 跳过步骤标记

            default:
                return '';
        }
    }).join('');
}

/**
 * 更新模型列表
 * @param {object} config - 配置对象
 */
export function updateModelList(config) {
    const modelSelect = state.getUI('modelSelect');
    if (!modelSelect) return;

    modelSelect.innerHTML = '';

    const models = [];
    const providers = config.providers || config.all || [];

    providers.forEach(p => {
        const providerID = p.providerID || p.id;
        const providerModels = p.models || {};
        Object.entries(providerModels).forEach(([modelId, modelInfo]) => {
            models.push({
                value: `${providerID}:${modelId}`,
                label: modelId,
                cost: modelInfo.cost?.input || 0
            });
        });
    });

    models.sort((a, b) => a.cost - b.cost);

    models.forEach(m => {
        const option = document.createElement('option');
        option.value = m.value;
        option.textContent = m.label;
        modelSelect.appendChild(option);
    });

    // 选择默认模型
    selectDefaultModel(models, modelSelect);
}

/**
 * 选择默认模型
 * @param {Array} models - 模型列表
 * @param {HTMLSelectElement} modelSelect - 选择器元素
 */
function selectDefaultModel(models, modelSelect) {
    // 优先选择 kimi k2.5 付费版
    const kimiK25Model = models.find(m => m.value.includes('k2p5') && !m.value.includes('-free'));
    if (kimiK25Model) {
        modelSelect.value = kimiK25Model.value;
        return;
    }

    // 备选：k2.5 免费版
    const kimiK25FreeModel = models.find(m => m.value.includes('k2.5') && m.value.includes('-free'));
    if (kimiK25FreeModel) {
        modelSelect.value = kimiK25FreeModel.value;
        return;
    }

    // 再次备选：其他免费模型
    const freeModel = models.find(m => m.cost === 0);
    if (freeModel) {
        modelSelect.value = freeModel.value;
    }
}

/**
 * 设置按钮状态
 */
export function setButtonStates({ connected, processing, hasSession }) {
    const connectBtn = state.getUI('connectBtn');
    const sendBtn = state.getUI('sendBtn');
    const stopBtn = state.getUI('stopBtn');
    const newSessionBtn = state.getUI('newSessionBtn');
    const promptInput = state.getUI('promptInput');

    if (connectBtn) {
        connectBtn.disabled = connected;
        connectBtn.textContent = connected ? '已连接' : '连接';
    }

    if (sendBtn) {
        sendBtn.disabled = !hasSession || processing;
    }

    if (stopBtn) {
        stopBtn.disabled = !processing;
        stopBtn.style.display = processing ? 'inline-block' : 'none';
    }

    if (newSessionBtn) {
        newSessionBtn.disabled = !connected;
    }

    if (promptInput) {
        promptInput.disabled = !connected;
    }
}

/**
 * 清空聊天容器
 */
export function clearChatContainer() {
    const chatContainer = state.getUI('chatContainer');
    if (chatContainer) {
        chatContainer.innerHTML = '';
    }
}

/**
 * 更新发送按钮状态
 * @param {boolean} disabled - 是否禁用
 * @param {string} text - 按钮文本
 * @param {boolean} isLoading - 是否显示加载中
 */
export function updateSendButton(disabled, text, isLoading = false) {
    const sendBtn = state.getUI('sendBtn');
    if (!sendBtn) return;

    sendBtn.disabled = disabled;
    if (isLoading) {
        sendBtn.innerHTML = '<span class="loading"></span>';
    } else {
        sendBtn.textContent = text;
    }
}
