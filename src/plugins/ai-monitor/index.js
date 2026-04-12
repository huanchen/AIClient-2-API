import logger from '../../utils/logger.js';

const DEFAULT_MONITOR_SETTINGS = Object.freeze({
    logFullPayloadsAtInfo: false,
    maxLogChars: 4000,
    maxCapturedStreamChunks: 40
});

function normalizeInteger(value, fallback, min = 0, max = Number.MAX_SAFE_INTEGER) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    return Math.min(max, Math.max(min, Math.floor(parsed)));
}

export function createAiMonitorSettings(config = {}) {
    return {
        logFullPayloadsAtInfo: config.AI_MONITOR_LOG_FULL_PAYLOADS === true,
        maxLogChars: normalizeInteger(
            config.AI_MONITOR_MAX_LOG_CHARS,
            DEFAULT_MONITOR_SETTINGS.maxLogChars,
            256,
            200000
        ),
        maxCapturedStreamChunks: normalizeInteger(
            config.AI_MONITOR_MAX_CAPTURED_STREAM_CHUNKS,
            DEFAULT_MONITOR_SETTINGS.maxCapturedStreamChunks,
            1,
            500
        )
    };
}

export function summarizePayloadShape(payload) {
    if (payload == null) {
        return 'null';
    }

    if (Array.isArray(payload)) {
        return `array(len=${payload.length})`;
    }

    if (typeof payload === 'string') {
        return `string(len=${payload.length})`;
    }

    if (typeof payload === 'object') {
        return `object(keys=${Object.keys(payload).length})`;
    }

    return typeof payload;
}

export function formatPayloadForLog(payload, maxLogChars = DEFAULT_MONITOR_SETTINGS.maxLogChars) {
    let serialized;

    try {
        serialized = JSON.stringify(payload);
    } catch (error) {
        serialized = `[Unserializable payload: ${error.message}]`;
    }

    if (serialized.length <= maxLogChars) {
        return {
            text: serialized,
            truncated: false,
            totalChars: serialized.length
        };
    }

    return {
        text: `${serialized.slice(0, maxLogChars)}... [truncated ${serialized.length - maxLogChars} chars]`,
        truncated: true,
        totalChars: serialized.length
    };
}

export function createStreamCacheEntry(fromProvider, toProvider, settings = DEFAULT_MONITOR_SETTINGS) {
    return {
        nativeChunks: [],
        convertedChunks: [],
        nativeChunkCount: 0,
        convertedChunkCount: 0,
        nativeDroppedCount: 0,
        convertedDroppedCount: 0,
        fromProvider,
        toProvider,
        maxCapturedChunks: settings.maxCapturedStreamChunks
    };
}

export function appendChunkSample(cache, listKey, countKey, droppedKey, value) {
    if (value == null) {
        return;
    }

    const chunks = Array.isArray(value) ? value.filter(item => item != null) : [value];
    if (chunks.length === 0) {
        return;
    }

    cache[countKey] += chunks.length;

    for (const chunk of chunks) {
        if (cache[listKey].length < cache.maxCapturedChunks) {
            cache[listKey].push(chunk);
        } else {
            cache[droppedKey] += 1;
        }
    }
}

function hasProtocolConversion(fromProvider, toProvider) {
    return fromProvider !== toProvider;
}

function getPayloadLogLevel(settings) {
    return settings.logFullPayloadsAtInfo ? 'info' : 'debug';
}

function logPayload(label, payload, settings) {
    const logLevel = getPayloadLogLevel(settings);
    if (!logger.shouldLog(logLevel)) {
        return;
    }

    const formatted = formatPayloadForLog(payload, settings.maxLogChars);
    logger[logLevel](`${label}: ${formatted.text}`);
}

function logPayloadSummary(label, payload) {
    logger.info(`${label}: ${summarizePayloadShape(payload)}`);
}

function logRequestPair(traceRequestId, originalRequestBody, processedRequestBody, fromProvider, toProvider, model, settings) {
    const hasConversion = hasProtocolConversion(fromProvider, toProvider) || originalRequestBody !== processedRequestBody;
    logger.info(`[AI Monitor][${traceRequestId}] >>> Req Protocol: ${fromProvider}${hasConversion ? ` -> ${toProvider}` : ''} | Model: ${model}`);

    if (hasConversion) {
        logPayloadSummary(`[AI Monitor][${traceRequestId}] [Req Original Summary]`, originalRequestBody);
        logPayloadSummary(`[AI Monitor][${traceRequestId}] [Req Processed Summary]`, processedRequestBody);
        logPayload(`[AI Monitor][${traceRequestId}] [Req Original]`, originalRequestBody, settings);
        logPayload(`[AI Monitor][${traceRequestId}] [Req Processed]`, processedRequestBody, settings);
        return;
    }

    logPayloadSummary(`[AI Monitor][${traceRequestId}] [Req Summary]`, originalRequestBody);
    logPayload(`[AI Monitor][${traceRequestId}] [Req]`, originalRequestBody, settings);
}

function logUnaryPair(requestId, nativeResponse, clientResponse, fromProvider, toProvider, settings) {
    const hasConversion = hasProtocolConversion(fromProvider, toProvider) || nativeResponse !== clientResponse;
    logger.info(`[AI Monitor][${requestId}] <<< Res Protocol: ${hasConversion ? `${toProvider} -> ` : ''}${fromProvider} (Unary)`);

    if (hasConversion) {
        logPayloadSummary(`[AI Monitor][${requestId}] [Res Native Summary]`, nativeResponse);
        logPayloadSummary(`[AI Monitor][${requestId}] [Res Converted Summary]`, clientResponse);
        logPayload(`[AI Monitor][${requestId}] [Res Native]`, nativeResponse, settings);
        logPayload(`[AI Monitor][${requestId}] [Res Converted]`, clientResponse, settings);
        return;
    }

    logPayloadSummary(`[AI Monitor][${requestId}] [Res Summary]`, nativeResponse);
    logPayload(`[AI Monitor][${requestId}] [Res]`, nativeResponse, settings);
}

function logAggregatedStream(traceRequestId, cache, settings) {
    const hasConversion = hasProtocolConversion(cache.fromProvider, cache.toProvider);
    logger.info(
        `[AI Monitor][${traceRequestId}] <<< Stream Response Aggregated: ${hasConversion ? `${cache.toProvider} -> ` : ''}${cache.fromProvider} | Native: total=${cache.nativeChunkCount}, captured=${cache.nativeChunks.length}, dropped=${cache.nativeDroppedCount} | Converted: total=${cache.convertedChunkCount}, captured=${cache.convertedChunks.length}, dropped=${cache.convertedDroppedCount}`
    );

    if (hasConversion) {
        logPayload(`[AI Monitor][${traceRequestId}] [Res Native Sample]`, cache.nativeChunks, settings);
        logPayload(`[AI Monitor][${traceRequestId}] [Res Converted Sample]`, cache.convertedChunks, settings);
        return;
    }

    logPayload(`[AI Monitor][${traceRequestId}] [Res Sample]`, cache.nativeChunks, settings);
}

/**
 * AI 接口监控插件
 * 功能：
 * 1. 捕获 AI 接口的请求参数（转换前和转换后）
 * 2. 捕获 AI 接口的响应结果（转换前和转换后，流式响应聚合输出）
 */
const aiMonitorPlugin = {
    name: 'ai-monitor',
    version: '1.1.0',
    description: 'AI 接口监控插件 - 捕获请求和响应参数（全链路协议转换监控，流式聚合输出，用于调试和分析）',
    type: 'middleware',
    _priority: 100,

    // 用于存储流式响应的中间状态
    streamCache: new Map(),
    settings: { ...DEFAULT_MONITOR_SETTINGS },

    async init(config) {
        this.settings = createAiMonitorSettings(config);
        logger.info(
            `[AI Monitor Plugin] Initialized (fullPayloadsAtInfo=${this.settings.logFullPayloadsAtInfo}, maxLogChars=${this.settings.maxLogChars}, maxCapturedStreamChunks=${this.settings.maxCapturedStreamChunks})`
        );
    },

    /**
     * 中间件：初始化请求上下文
     */
    async middleware(req, res, requestUrl, config) {
        const aiPaths = ['/v1/chat/completions', '/v1/responses', '/v1/messages', '/v1beta/models'];
        const isAiPath = aiPaths.some(path => requestUrl.pathname.includes(path));

        if (isAiPath && req.method === 'POST') {
            // 在监控插件中生成请求标识，并存入 config 以供全链路追踪
            const requestId = Date.now() + Math.random().toString(36).substring(2, 10);
            config._monitorRequestId = requestId;
        }

        return { handled: false };
    },

    hooks: {
        /**
         * 请求转换后的钩子
         */
        async onContentGenerated(config) {
            const {
                originalRequestBody,
                processedRequestBody,
                fromProvider,
                toProvider,
                model,
                _monitorRequestId,
                _pluginRequestId,
                isStream
            } = config;

            if (!originalRequestBody) {
                return;
            }

            const traceRequestId = _pluginRequestId || _monitorRequestId;
            const settings = aiMonitorPlugin.settings;

            setImmediate(() => {
                logRequestPair(traceRequestId, originalRequestBody, processedRequestBody, fromProvider, toProvider, model, settings);
            });

            if (isStream && traceRequestId) {
                setTimeout(() => {
                    const cache = aiMonitorPlugin.streamCache.get(traceRequestId);
                    if (!cache) {
                        return;
                    }

                    logAggregatedStream(traceRequestId, cache, settings);
                    aiMonitorPlugin.streamCache.delete(traceRequestId);
                }, 2000);
            }
        },

        /**
         * 非流式响应转换监控
         */
        async onUnaryResponse({ nativeResponse, clientResponse, fromProvider, toProvider, requestId }) {
            const settings = aiMonitorPlugin.settings;

            setImmediate(() => {
                const reqId = requestId || 'N/A';
                logUnaryPair(reqId, nativeResponse, clientResponse, fromProvider, toProvider, settings);
            });
        },

        /**
         * 流式响应分块转换监控 - 聚合数据
         */
        async onStreamChunk({ nativeChunk, chunkToSend, fromProvider, toProvider, requestId }) {
            if (!requestId) {
                return;
            }

            if (!aiMonitorPlugin.streamCache.has(requestId)) {
                aiMonitorPlugin.streamCache.set(
                    requestId,
                    createStreamCacheEntry(fromProvider, toProvider, aiMonitorPlugin.settings)
                );
            }

            const cache = aiMonitorPlugin.streamCache.get(requestId);
            appendChunkSample(cache, 'nativeChunks', 'nativeChunkCount', 'nativeDroppedCount', nativeChunk);
            appendChunkSample(cache, 'convertedChunks', 'convertedChunkCount', 'convertedDroppedCount', chunkToSend);
        },

        /**
         * 内部请求转换监控
         */
        async onInternalRequestConverted({ requestId, internalRequest, converterName }) {
            const settings = aiMonitorPlugin.settings;

            setImmediate(() => {
                const reqId = requestId || 'N/A';
                logger.info(
                    `[AI Monitor][${reqId}] >>> Internal Req Converted [${converterName}]: ${summarizePayloadShape(internalRequest)}`
                );
                logPayload(`[AI Monitor][${reqId}] [Internal Req Converted]`, internalRequest, settings);
            });
        }
    }
};

export default aiMonitorPlugin;
