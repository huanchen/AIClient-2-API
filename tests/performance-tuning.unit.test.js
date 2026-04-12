import { afterEach, describe, expect, jest, test } from '@jest/globals';

jest.mock('../src/providers/adapter.js', () => ({
    getRegisteredProviders: jest.fn(() => []),
    getServiceAdapter: jest.fn(() => null)
}));

import {
    appendChunkSample,
    createAiMonitorSettings,
    createStreamCacheEntry,
    formatPayloadForLog
} from '../src/plugins/ai-monitor/index.js';
import {
    getCredentialSwitchRetryDelayMs,
    getCredentialSwitchRetrySettings
} from '../src/utils/common.js';
import { ProviderPoolManager } from '../src/providers/provider-pool-manager.js';

const managedInstances = [];

afterEach(() => {
    jest.restoreAllMocks();
    for (const manager of managedInstances.splice(0)) {
        if (manager.cleanupTimer) {
            clearInterval(manager.cleanupTimer);
        }
        if (manager.saveTimer) {
            clearTimeout(manager.saveTimer);
        }
    }
});

describe('performance tuning helpers', () => {
    test('AI monitor settings clamp invalid values to safe defaults', () => {
        expect(createAiMonitorSettings({
            AI_MONITOR_LOG_FULL_PAYLOADS: true,
            AI_MONITOR_MAX_LOG_CHARS: 32,
            AI_MONITOR_MAX_CAPTURED_STREAM_CHUNKS: 9999
        })).toEqual({
            logFullPayloadsAtInfo: true,
            maxLogChars: 256,
            maxCapturedStreamChunks: 500
        });
    });

    test('AI monitor stream capture keeps bounded samples while tracking dropped chunks', () => {
        const settings = createAiMonitorSettings({
            AI_MONITOR_MAX_CAPTURED_STREAM_CHUNKS: 2
        });
        const cache = createStreamCacheEntry('gemini-antigravity', 'claude', settings);

        appendChunkSample(cache, 'nativeChunks', 'nativeChunkCount', 'nativeDroppedCount', [{ id: 1 }, { id: 2 }, { id: 3 }]);
        appendChunkSample(cache, 'convertedChunks', 'convertedChunkCount', 'convertedDroppedCount', { id: 'a' });
        appendChunkSample(cache, 'convertedChunks', 'convertedChunkCount', 'convertedDroppedCount', [{ id: 'b' }, { id: 'c' }]);

        expect(cache.nativeChunkCount).toBe(3);
        expect(cache.nativeChunks).toEqual([{ id: 1 }, { id: 2 }]);
        expect(cache.nativeDroppedCount).toBe(1);
        expect(cache.convertedChunkCount).toBe(3);
        expect(cache.convertedChunks).toEqual([{ id: 'a' }, { id: 'b' }]);
        expect(cache.convertedDroppedCount).toBe(1);
    });

    test('AI monitor payload formatter truncates oversized bodies', () => {
        const formatted = formatPayloadForLog({ text: 'x'.repeat(80) }, 40);

        expect(formatted.truncated).toBe(true);
        expect(formatted.totalChars).toBeGreaterThan(40);
        expect(formatted.text).toContain('[truncated');
    });

    test('credential switch retry settings normalize swapped ranges', () => {
        expect(getCredentialSwitchRetrySettings({
            CREDENTIAL_SWITCH_MAX_RETRIES: 7,
            CREDENTIAL_SWITCH_RETRY_MIN_DELAY_MS: 1200,
            CREDENTIAL_SWITCH_RETRY_MAX_DELAY_MS: 300
        })).toEqual({
            maxRetries: 7,
            minDelayMs: 300,
            maxDelayMs: 1200
        });
    });

    test('credential switch retry delay respects configured range', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.5);

        expect(getCredentialSwitchRetryDelayMs({
            minDelayMs: 100,
            maxDelayMs: 800
        })).toBe(450);
    });

    test('provider pool manager picks debounce from global config when explicit option is absent', () => {
        const manager = new ProviderPoolManager({}, {
            globalConfig: {
                PROVIDER_POOL_SAVE_DEBOUNCE_MS: 4500
            }
        });
        managedInstances.push(manager);

        expect(manager.saveDebounceTime).toBe(4500);
    });
});
