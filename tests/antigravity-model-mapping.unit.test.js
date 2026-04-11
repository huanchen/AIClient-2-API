import { afterEach, describe, expect, jest, test } from '@jest/globals';

jest.mock('../src/providers/adapter.js', () => ({
    getRegisteredProviders: jest.fn(() => ['gemini-cli-oauth', 'gemini-antigravity']),
    getServiceAdapter: jest.fn(() => null)
}));

import { ProviderPoolManager } from '../src/providers/provider-pool-manager.js';

const antigravityType = 'gemini-antigravity';
const primaryType = 'gemini-cli-oauth';
const managedInstances = [];

function createManager(providerPools, globalConfig = {}) {
    const manager = new ProviderPoolManager(providerPools, {
        saveDebounceTime: 600000,
        globalConfig: {
            PROVIDER_POOLS_FILE_PATH: 'tests/.tmp-provider-pools.json',
            providerFallbackChain: {
                [primaryType]: [antigravityType]
            },
            ...globalConfig
        }
    });

    if (manager.saveTimer) {
        clearTimeout(manager.saveTimer);
        manager.saveTimer = null;
    }
    manager.pendingSaves.clear();
    managedInstances.push(manager);
    return manager;
}

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

describe('Antigravity Claude model mapping', () => {
    test('fallback chain accepts Claude client model ids for Antigravity', async () => {
        const manager = createManager({
            [antigravityType]: [
                { uuid: 'anti-1', isHealthy: true, isDisabled: false, needsRefresh: false }
            ]
        });

        const selected = await manager.selectProviderWithFallback(primaryType, 'claude-sonnet-4-6');

        expect(selected).not.toBeNull();
        expect(selected.actualProviderType).toBe(antigravityType);
        expect(selected.isFallback).toBe(true);
        expect(selected.config.uuid).toBe('anti-1');
    });

    test('direct Antigravity selection matches alias-based notSupportedModels rules', async () => {
        const manager = createManager({
            [antigravityType]: [
                {
                    uuid: 'anti-1',
                    isHealthy: true,
                    isDisabled: false,
                    needsRefresh: false,
                    notSupportedModels: ['gemini-claude-sonnet-4-6']
                }
            ]
        }, {
            providerFallbackChain: {}
        });

        const selected = await manager.selectProvider(antigravityType, 'claude-sonnet-4-6');

        expect(selected).toBeNull();
    });
});
