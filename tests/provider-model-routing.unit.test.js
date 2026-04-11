import { afterEach, describe, expect, jest, test } from '@jest/globals';

jest.mock('../src/providers/adapter.js', () => ({
    getRegisteredProviders: jest.fn(() => [
        'gemini-cli-oauth',
        'claude-kiro-oauth',
        'openai-codex-oauth'
    ]),
    getServiceAdapter: jest.fn(() => null)
}));

import { ProviderPoolManager } from '../src/providers/provider-pool-manager.js';

const managedInstances = [];

function createManager(providerPools) {
    const manager = new ProviderPoolManager(providerPools, {
        saveDebounceTime: 600000,
        globalConfig: {
            PROVIDER_POOLS_FILE_PATH: 'tests/.tmp-provider-model-routing.json',
            providerFallbackChain: {}
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

describe('provider model routing aliases', () => {
    test('Gemini CLI accepts normalized Claude family requests during provider selection', async () => {
        const manager = createManager({
            'gemini-cli-oauth': [
                { uuid: 'gem-1', isHealthy: true, isDisabled: false, needsRefresh: false }
            ]
        });

        const selected = await manager.selectProvider('gemini-cli-oauth', 'claude-sonnet-4-6');

        expect(selected).not.toBeNull();
        expect(selected.uuid).toBe('gem-1');
    });

    test('Kiro accepts Claude family requests and routes them through Sonnet or Haiku targets', async () => {
        const manager = createManager({
            'claude-kiro-oauth': [
                { uuid: 'kiro-1', isHealthy: true, isDisabled: false, needsRefresh: false }
            ]
        });

        const opusSelected = await manager.selectProvider('claude-kiro-oauth', 'claude-opus-4-6');
        const haikuSelected = await manager.selectProvider('claude-kiro-oauth', 'claude-haiku-4.5');

        expect(opusSelected).not.toBeNull();
        expect(opusSelected.uuid).toBe('kiro-1');
        expect(haikuSelected).not.toBeNull();
        expect(haikuSelected.uuid).toBe('kiro-1');
    });

    test('Codex accepts client label aliases during provider selection', async () => {
        const manager = createManager({
            'openai-codex-oauth': [
                { uuid: 'codex-1', isHealthy: true, isDisabled: false, needsRefresh: false }
            ]
        });

        const selected = await manager.selectProvider('openai-codex-oauth', 'gpt-5.4 (current)');

        expect(selected).not.toBeNull();
        expect(selected.uuid).toBe('codex-1');
    });
});
