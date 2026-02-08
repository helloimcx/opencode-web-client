/**
 * 主应用模块
 * 负责应用初始化、事件绑定和业务流程协调
 */

import { state } from "./state.js";
import { debug, error } from "./logger.js";
import { getStoredServerUrl, storeServerUrl, getStoredSessionId, storeSessionId } from "./utils.js";
import { createClient, fetchProviders, createSession, fetchMessages, sendPrompt as sendPromptApi, abortSession, subscribeToEvents } from "./api.js";
import { handleEvent, handleMessageCreated, handleMessageUpdated } from "./events.js";
import { handlePartUpdated, createAssistantMessage, partToHtml } from "./parts.js";
import {
    setStatus,
    showProcessingIndicator,
    hideProcessingIndicator,
    addProcessingStep,
    updateProcessingStep,
    addMessage,
    addMessageWithParts,
    addSystemMessage,
    updateModelList,
    setButtonStates,
    clearChatContainer,
    updateSendButton
} from "./ui.js";

/**
 * 初始化应用
 */
export function init() {
    debug('APP', 'Initializing application...');

    // 初始化 UI 引用
    state.initUI();

    // 设置存储的服务器 URL
    const serverUrlInput = state.getUI('serverUrlInput');
    serverUrlInput.value = getStoredServerUrl();

    // 绑定事件监听器
    bindEventListeners();

    // 绑定自定义事件处理器
    bindCustomEventHandlers();

    // 如果有存储的服务器 URL，自动连接
    if (getStoredServerUrl()) {
        connect();
    }
}

/**
 * 绑定 DOM 事件监听器
 */
function bindEventListeners() {
    const connectBtn = state.getUI('connectBtn');
    const sendBtn = state.getUI('sendBtn');
    const stopBtn = state.getUI('stopBtn');
    const promptInput = state.getUI('promptInput');
    const newSessionBtn = state.getUI('newSessionBtn');

    connectBtn?.addEventListener('click', connect);
    sendBtn?.addEventListener('click', () => handleSendPrompt());
    stopBtn?.addEventListener('click', handleStopPrompt);
    promptInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSendPrompt();
        }
    });
    newSessionBtn?.addEventListener('click', handleCreateSession);
}

/**
 * 绑定自定义事件处理器（用于模块间通信）
 */
function bindCustomEventHandlers() {
    // SSE 事件
    window.addEventListener('opencode-event', (e) => {
        handleEvent(e.detail);
    });

    // 消息创建事件
    window.addEventListener('opencode:message:created', (e) => {
        handleMessageCreated(e.detail);
    });

    // 消息更新事件
    window.addEventListener('opencode:message:updated', (e) => {
        handleMessageUpdated(e.detail);
    });

    // Part 更新事件
    window.addEventListener('opencode:part:updated', (e) => {
        handlePartUpdated(e.detail);
    });

    // 处理指示器事件
    window.addEventListener('opencode:processing:show', () => {
        showProcessingIndicator();
    });

    window.addEventListener('opencode:processing:hide', () => {
        hideProcessingIndicator();
    });

    // 会话状态事件
    window.addEventListener('opencode:session:status', (e) => {
        if (e.detail?.type === 'busy') {
            showProcessingIndicator();
        } else if (e.detail?.type === 'idle') {
            hideProcessingIndicator();
        }
    });

    // 重新加载消息事件
    window.addEventListener('opencode:reload:messages', () => {
        loadMessages();
    });
}

/**
 * 连接到 OpenCode Server
 */
export async function connect() {
    try {
        setStatus('connecting');
        addSystemMessage('正在连接...');

        // 创建客户端
        const serverUrl = state.getUI('serverUrlInput').value;
        const client = createClient(serverUrl);
        state.setClient(client);

        // 获取可用模型
        const config = await fetchProviders();
        updateModelList(config);

        // 更新状态
        setStatus('online');
        state.setConnected(true);

        // 保存服务器 URL
        storeServerUrl(serverUrl);

        // 更新按钮状态
        setButtonStates({
            connected: true,
            processing: false,
            hasSession: !!state.getCurrentSessionId()
        });

        // 订阅 SSE 事件
        await subscribeToEvents();

        // 尝试恢复会话
        const savedSessionId = getStoredSessionId();
        if (savedSessionId) {
            state.setCurrentSessionId(savedSessionId);
            addSystemMessage('已连接，恢复会话 - ' + savedSessionId.slice(-8));
            await loadMessages();
            setButtonStates({ connected: true, processing: false, hasSession: true });
        } else {
            addSystemMessage('已连接，请新建会话');
        }

    } catch (err) {
        error('connect', err);
        setStatus('offline');
        addSystemMessage('连接失败: ' + err.message);
    }
}

/**
 * 创建新会话
 */
export async function handleCreateSession() {
    try {
        addSystemMessage('正在创建会话...');

        const sessionId = await createSession('Web Session ' + new Date().toLocaleTimeString());
        state.setCurrentSessionId(sessionId);
        storeSessionId(sessionId);

        clearChatContainer();
        addSystemMessage('已创建会话 - ' + sessionId.slice(-8));

        setButtonStates({ connected: true, processing: false, hasSession: true });

        await loadMessages();

    } catch (err) {
        error('createSession', err);
        addSystemMessage('创建失败: ' + err.message);
    }
}

/**
 * 加载消息历史
 */
export async function loadMessages() {
    const sessionId = state.getCurrentSessionId();
    if (!sessionId || !state.getClient()) return;

    try {
        const messages = await fetchMessages(sessionId);
        const chatContainer = state.getUI('chatContainer');
        chatContainer.innerHTML = '';

        messages.forEach(msg => {
            const role = msg.info?.role || 'user';

            // 跳过系统消息
            if (role === 'system') return;

            debug('load message', role, msg);

            let hasContent = false;
            let partsHtml = '';

            // 处理所有 Parts
            if (msg.parts && Array.isArray(msg.parts)) {
                partsHtml = msg.parts
                    .map(p => partToHtml(p))
                    .filter(html => html)
                    .join('');

                hasContent = partsHtml.length > 0;
            }

            if (hasContent) {
                addMessageWithParts(role, '', partsHtml, false);
            }
        });

        scrollToBottom(chatContainer);

    } catch (err) {
        error('loadMessages', err);
    }
}

/**
 * 发送消息
 * @param {boolean} isRetry - 是否是重试
 */
export async function handleSendPrompt(isRetry = false) {
    const promptInput = state.getUI('promptInput');
    const text = promptInput.value.trim();

    if (!text || !state.getCurrentSessionId() || state.isProcessing()) return;

    state.setProcessing(true);
    state.resetDynamicUI();

    // 更新 UI
    if (!isRetry) {
        addMessage('user', text);
        promptInput.value = '';
    }

    updateSendButton(true, '', true);
    setButtonStates({ connected: true, processing: true, hasSession: true });

    showProcessingIndicator();
    addProcessingStep('发送消息...', 'active');

    try {
        const [providerID, modelID] = state.getUI('modelSelect').value.split(':');

        updateProcessingStep('发送消息...', 'completed');
        addProcessingStep('AI 思考中...', 'active');

        // 创建 AbortController
        const abortController = new AbortController();
        state.setAbortController(abortController);

        // 发送消息
        const result = await sendPromptApi(
            state.getCurrentSessionId(),
            providerID,
            modelID,
            text
        );

        debug('prompt result', result);

        updateProcessingStep('AI 思考中...', 'completed');
        hideProcessingIndicator();

        // 处理响应
        const messageObj = result.data || result;
        let responseText = '';

        if (messageObj.parts) {
            responseText = messageObj.parts
                .filter(p => p.type === 'text')
                .map(p => p.text)
                .join('\n');
        }

        // 如果 SSE 还没有创建消息，创建一个
        if (responseText && !state.getDynamicUI('assistantMessageDiv')) {
            const chatContainer = state.getUI('chatContainer');
            const assistantDiv = createAssistantMessage(responseText);
            chatContainer.appendChild(assistantDiv);
            state.setDynamicUI('assistantMessageDiv', assistantDiv);
        }

        scrollToBottom(state.getUI('chatContainer'));

    } catch (err) {
        error('sendPrompt', err);

        // 检查是否是用户取消
        if (err.name === 'AbortError' || err.message?.includes('abort')) {
            hideProcessingIndicator();
            addSystemMessage('任务已停止');
            return;
        }

        // 检查是否是付费模型失败，自动切换免费模型重试
        const currentModel = state.getUI('modelSelect').value;
        const isK25Paid = currentModel.includes('k2.5') && !currentModel.includes('-free');

        if (isK25Paid && !isRetry) {
            const modelSelect = state.getUI('modelSelect');
            const options = Array.from(modelSelect.options);
            const freeK25Model = options.find(opt => opt.value.includes('k2.5') && opt.value.includes('-free'));

            if (freeK25Model) {
                addSystemMessage('模型请求失败，自动切换模型重试...');
                modelSelect.value = freeK25Model.value;
                hideProcessingIndicator();

                // 重试
                await handleSendPrompt(true);
                return;
            }
        }

        hideProcessingIndicator();
        addMessage('error', '发送失败: ' + err.message, false);

    } finally {
        state.setProcessing(false);
        state.setAbortController(null);
        updateSendButton(false, '发送');
        setButtonStates({ connected: true, processing: false, hasSession: true });
    }
}

/**
 * 停止当前任务
 */
export async function handleStopPrompt() {
    if (!state.isProcessing() || !state.getCurrentSessionId()) return;

    const stopBtn = state.getUI('stopBtn');
    stopBtn.disabled = true;
    stopBtn.innerHTML = '<span class="loading"></span>';

    try {
        // 取消请求
        const abortController = state.getAbortController();
        if (abortController) {
            abortController.abort();
        }

        // 调用服务器中止 API
        await abortSession(state.getCurrentSessionId());

        addSystemMessage('已停止任务...');

    } catch (err) {
        error('stopPrompt', err);
        addSystemMessage('停止失败: ' + err.message);
    } finally {
        stopBtn.innerHTML = '停止';
    }
}

/**
 * 滚动到底部
 */
function scrollToBottom(container) {
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}
