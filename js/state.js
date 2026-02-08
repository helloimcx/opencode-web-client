/**
 * 应用状态管理模块
 * 使用单例模式管理全局状态
 */

class AppState {
    constructor() {
        this._state = {
            // OpenCode 客户端实例
            client: null,
            // 当前会话 ID
            currentSessionId: null,
            // 连接状态
            isConnected: false,
            // 消息处理状态
            isProcessing: false,
            // SSE 事件流
            eventStream: null,
            // 取消控制器
            abortController: null,
            // UI 元素引用
            ui: {
                statusDot: null,
                statusText: null,
                chatContainer: null,
                promptInput: null,
                sendBtn: null,
                stopBtn: null,
                serverUrlInput: null,
                connectBtn: null,
                newSessionBtn: null,
                modelSelect: null
            },
            // 动态创建的 UI 元素引用
            dynamicUI: {
                processingIndicator: null,
                assistantMessageDiv: null,
                currentReasoningDiv: null
            }
        };
    }

    /**
     * 获取状态值
     * @param {string} key - 状态键
     * @returns {*} 状态值
     */
    get(key) {
        return this._state[key];
    }

    /**
     * 设置状态值
     * @param {string} key - 状态键
     * @param {*} value - 状态值
     */
    set(key, value) {
        this._state[key] = value;
    }

    /**
     * 获取客户端实例
     * @returns {Object|null} OpenCode 客户端
     */
    getClient() {
        return this._state.client;
    }

    /**
     * 设置客户端实例
     * @param {Object} client - OpenCode 客户端
     */
    setClient(client) {
        this._state.client = client;
    }

    /**
     * 获取当前会话 ID
     * @returns {string|null} 会话 ID
     */
    getCurrentSessionId() {
        return this._state.currentSessionId;
    }

    /**
     * 设置当前会话 ID
     * @param {string} sessionId - 会话 ID
     */
    setCurrentSessionId(sessionId) {
        this._state.currentSessionId = sessionId;
    }

    /**
     * 获取连接状态
     * @returns {boolean} 是否已连接
     */
    isConnected() {
        return this._state.isConnected;
    }

    /**
     * 设置连接状态
     * @param {boolean} connected - 连接状态
     */
    setConnected(connected) {
        this._state.isConnected = connected;
    }

    /**
     * 获取处理状态
     * @returns {boolean} 是否正在处理
     */
    isProcessing() {
        return this._state.isProcessing;
    }

    /**
     * 设置处理状态
     * @param {boolean} processing - 处理状态
     */
    setProcessing(processing) {
        this._state.isProcessing = processing;
    }

    /**
     * 获取事件流
     * @returns {AsyncIterator|null} SSE 事件流
     */
    getEventStream() {
        return this._state.eventStream;
    }

    /**
     * 设置事件流
     * @param {AsyncIterator} stream - SSE 事件流
     */
    setEventStream(stream) {
        this._state.eventStream = stream;
    }

    /**
     * 获取取消控制器
     * @returns {AbortController|null} 取消控制器
     */
    getAbortController() {
        return this._state.abortController;
    }

    /**
     * 设置取消控制器
     * @param {AbortController} controller - 取消控制器
     */
    setAbortController(controller) {
        this._state.abortController = controller;
    }

    /**
     * 初始化 UI 元素引用
     */
    initUI() {
        this._state.ui.statusDot = document.getElementById('statusDot');
        this._state.ui.statusText = document.getElementById('statusText');
        this._state.ui.chatContainer = document.getElementById('chatContainer');
        this._state.ui.promptInput = document.getElementById('promptInput');
        this._state.ui.sendBtn = document.getElementById('sendBtn');
        this._state.ui.stopBtn = document.getElementById('stopBtn');
        this._state.ui.serverUrlInput = document.getElementById('serverUrl');
        this._state.ui.connectBtn = document.getElementById('connectBtn');
        this._state.ui.newSessionBtn = document.getElementById('newSessionBtn');
        this._state.ui.modelSelect = document.getElementById('modelSelect');
    }

    /**
     * 获取 UI 元素
     * @param {string} name - UI 元素名称
     * @returns {HTMLElement|null} UI 元素
     */
    getUI(name) {
        return this._state.ui[name];
    }

    /**
     * 获取动态 UI 元素
     * @param {string} name - UI 元素名称
     * @returns {HTMLElement|null} UI 元素
     */
    getDynamicUI(name) {
        return this._state.dynamicUI[name];
    }

    /**
     * 设置动态 UI 元素
     * @param {string} name - UI 元素名称
     * @param {HTMLElement} element - UI 元素
     */
    setDynamicUI(name, element) {
        this._state.dynamicUI[name] = element;
    }

    /**
     * 重置动态 UI 元素
     */
    resetDynamicUI() {
        this._state.dynamicUI = {
            processingIndicator: null,
            assistantMessageDiv: null,
            currentReasoningDiv: null
        };
    }
}

// 导出单例实例
export const state = new AppState();

// 同时导出类以便测试
export { AppState };
