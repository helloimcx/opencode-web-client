/**
 * OpenCode API 交互模块
 * 负责与 OpenCode Server 的所有 API 通信
 */

import { createOpencodeClient } from "https://esm.sh/@opencode-ai/sdk@latest";
import { debug, error, sseError } from "./logger.js";
import { state } from "./state.js";

/**
 * 创建 OpenCode 客户端实例
 * @param {string} baseUrl - 服务器地址
 * @returns {Object} OpenCode 客户端
 */
export function createClient(baseUrl) {
    return createOpencodeClient({ baseUrl });
}

/**
 * 获取可用的模型和提供商列表
 * @returns {Promise<Object>} 模型配置
 */
export async function fetchProviders() {
    const client = state.getClient();
    if (!client) {
        throw new Error('Client not initialized');
    }

    debug('API', 'Fetching providers...');
    const configResult = await client.config.providers();
    debug('API', 'Config result:', configResult);

    return configResult.data || configResult;
}

/**
 * 创建新会话
 * @param {string} title - 会话标题
 * @returns {Promise<string>} 会话 ID
 */
export async function createSession(title) {
    const client = state.getClient();
    if (!client) {
        throw new Error('Client not initialized');
    }

    debug('API', 'Creating session with title:', title);

    const session = await client.session.create({
        body: { title }
    });

    const sessionId = session.data?.id || session.id;

    if (!sessionId) {
        throw new Error('Failed to get session ID from response');
    }

    debug('API', 'Session created:', sessionId);
    return sessionId;
}

/**
 * 加载会话消息历史
 * @param {string} sessionId - 会话 ID
 * @returns {Promise<Array>} 消息列表
 */
export async function fetchMessages(sessionId) {
    const client = state.getClient();
    if (!client) {
        throw new Error('Client not initialized');
    }

    debug('API', 'Loading messages for session:', sessionId);

    const messages = await client.session.messages({
        path: { id: sessionId }
    });

    debug('API', 'Messages loaded:', messages);
    return messages.data || [];
}

/**
 * 发送消息到 AI
 * @param {string} sessionId - 会话 ID
 * @param {string} providerID - 提供商 ID
 * @param {string} modelID - 模型 ID
 * @param {string} text - 消息文本
 * @returns {Promise<Object>} AI 响应
 */
export async function sendPrompt(sessionId, providerID, modelID, text) {
    const client = state.getClient();
    if (!client) {
        throw new Error('Client not initialized');
    }

    debug('API', 'Sending prompt to model:', `${providerID}:${modelID}`);

    const result = await client.session.prompt({
        path: { id: sessionId },
        body: {
            model: { providerID, modelID },
            parts: [{ type: 'text', text }]
        }
    });

    debug('API', 'Prompt result:', result);
    return result;
}

/**
 * 停止当前会话的任务
 * @param {string} sessionId - 会话 ID
 * @returns {Promise<boolean>} 是否成功停止
 */
export async function abortSession(sessionId) {
    const client = state.getClient();
    if (!client) {
        throw new Error('Client not initialized');
    }

    debug('API', 'Aborting session:', sessionId);

    try {
        await client.session.abort({
            path: { id: sessionId }
        });
        debug('API', 'Session aborted successfully');
        return true;
    } catch (err) {
        error('API', 'Abort failed', err);
        return false;
    }
}

/**
 * 订阅 SSE 事件流
 * @returns {Promise<AsyncIterator>} 事件流
 */
export async function subscribeToEvents() {
    const client = state.getClient();
    if (!client) {
        throw new Error('Client not initialized');
    }

    debug('API', 'Subscribing to SSE events...');

    const events = await client.event.subscribe();
    const stream = events.stream;

    state.setEventStream(stream);

    // 启动后台事件处理
    startEventProcessing(stream);

    return stream;
}

/**
 * 启动事件处理循环
 * @param {AsyncIterator} stream - 事件流
 */
async function startEventProcessing(stream) {
    try {
        for await (const event of stream) {
            // 触发自定义事件，通知主应用
            window.dispatchEvent(new CustomEvent('opencode-event', { detail: event }));
        }
    } catch (err) {
        sseError(err);
    }
}
