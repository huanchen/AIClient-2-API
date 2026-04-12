import { afterEach, describe, expect, jest, test } from '@jest/globals';

jest.mock('../src/providers/adapter.js', () => ({
    getRegisteredProviders: jest.fn(() => [
        'gemini-cli-oauth',
        'gemini-antigravity',
        'claude-custom',
        'claude-kiro-oauth',
        'openai-custom',
        'openaiResponses-custom',
        'openai-codex-oauth',
        'grok-custom'
    ]),
    getServiceAdapter: jest.fn(() => null)
}));

import { ProviderPoolManager } from '../src/providers/provider-pool-manager.js';
import { resetClientModelRoutingRules } from '../src/providers/provider-models.js';

const managedInstances = [];

function createClaudeCustomNode(overrides = {}) {
    return {
        uuid: 'claude-node',
        isHealthy: true,
        isDisabled: false,
        needsRefresh: false,
        CLAUDE_API_KEY: 'test-claude-key',
        CLAUDE_BASE_URL: 'https://example.com/v1',
        ...overrides
    };
}

function createOpenAiCustomNode(overrides = {}) {
    return {
        uuid: 'openai-node',
        isHealthy: true,
        isDisabled: false,
        needsRefresh: false,
        OPENAI_API_KEY: 'test-openai-key',
        OPENAI_BASE_URL: 'https://example.com/v1',
        ...overrides
    };
}

function createManager(providerPools, globalConfig = {}) {
    const manager = new ProviderPoolManager(providerPools, {
        saveDebounceTime: 600000,
        globalConfig: {
            PROVIDER_POOLS_FILE_PATH: 'tests/.tmp-provider-model-routing.json',
            providerFallbackChain: {},
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
    resetClientModelRoutingRules();
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
        const codexSelected = await manager.selectProvider('gemini-cli-oauth', 'gpt-5.4');

        expect(selected).not.toBeNull();
        expect(selected.uuid).toBe('gem-1');
        expect(codexSelected).not.toBeNull();
        expect(codexSelected.uuid).toBe('gem-1');
    });

    test('Antigravity accepts Codex requests via Claude alias mapping during provider selection', async () => {
        const manager = createManager({
            'gemini-antigravity': [
                { uuid: 'anti-1', isHealthy: true, isDisabled: false, needsRefresh: false }
            ]
        });

        const selected = await manager.selectProvider('gemini-antigravity', 'gpt-5.4');

        expect(selected).not.toBeNull();
        expect(selected.uuid).toBe('anti-1');
    });

    test('Kiro accepts Claude family requests and routes them through Sonnet or Haiku targets', async () => {
        const manager = createManager({
            'claude-kiro-oauth': [
                { uuid: 'kiro-1', isHealthy: true, isDisabled: false, needsRefresh: false }
            ]
        });

        const opusSelected = await manager.selectProvider('claude-kiro-oauth', 'claude-opus-4-6');
        const haikuSelected = await manager.selectProvider('claude-kiro-oauth', 'claude-haiku-4.5');
        const codexSelected = await manager.selectProvider('claude-kiro-oauth', 'gpt-5.4');

        expect(opusSelected).not.toBeNull();
        expect(opusSelected.uuid).toBe('kiro-1');
        expect(haikuSelected).not.toBeNull();
        expect(haikuSelected.uuid).toBe('kiro-1');
        expect(codexSelected).not.toBeNull();
        expect(codexSelected.uuid).toBe('kiro-1');
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

    test('Claude custom accepts Codex requests when configured supported models only expose Sonnet', async () => {
        const manager = createManager({
            'claude-custom': [
                createClaudeCustomNode({
                    uuid: 'claude-1',
                    supportedModels: ['claude-sonnet-4-5']
                })
            ]
        });

        const selected = await manager.selectProvider('claude-custom', 'gpt-5.4');

        expect(selected).not.toBeNull();
        expect(selected.uuid).toBe('claude-1');
    });

    test('suffixed Claude custom placeholder nodes are marked unhealthy and never selected', async () => {
        const manager = createManager({
            'claude-custom-baoshiapi': [
                {
                    uuid: 'placeholder-1',
                    customName: 'BAOSHIAPI',
                    isHealthy: true,
                    isDisabled: false,
                    needsRefresh: false,
                    usageCount: 0,
                    errorCount: 0
                }
            ]
        });

        const selected = await manager.selectProvider('claude-custom-baoshiapi', 'claude-opus-4-6');
        const status = manager.providerStatus['claude-custom-baoshiapi'][0].config;

        expect(selected).toBeNull();
        expect(status.isHealthy).toBe(false);
        expect(status.lastErrorMessage).toBe('[Config Validation] Missing required fields: CLAUDE_API_KEY, CLAUDE_BASE_URL');
    });

    test('OpenAI custom accepts Claude requests when only gpt-5.4 is configured', async () => {
        const manager = createManager({
            'openai-custom': [
                createOpenAiCustomNode({
                    uuid: 'openai-1',
                    supportedModels: ['gpt-5.4']
                })
            ]
        });

        const selected = await manager.selectProvider('openai-custom', 'claude-sonnet-4-6');

        expect(selected).not.toBeNull();
        expect(selected.uuid).toBe('openai-1');
    });

    test('configurable routing rules change provider-side model compatibility checks', async () => {
        const providerPools = {
            'gemini-cli-oauth': [
                {
                    uuid: 'gem-override',
                    isHealthy: true,
                    isDisabled: false,
                    needsRefresh: false,
                    notSupportedModels: ['gemini-3.1-pro-preview']
                }
            ]
        };

        const defaultManager = createManager(providerPools);
        const defaultSelected = await defaultManager.selectProvider('gemini-cli-oauth', 'claude-sonnet-4-6');

        const overriddenManager = createManager(providerPools, {
            clientModelRoutingRules: {
                providerTargets: {
                    geminiCli: {
                        defaultModel: 'gemini-2.5-flash'
                    }
                }
            }
        });
        const overriddenSelected = await overriddenManager.selectProvider('gemini-cli-oauth', 'claude-sonnet-4-6');

        expect(defaultSelected).toBeNull();
        expect(overriddenSelected).not.toBeNull();
        expect(overriddenSelected.uuid).toBe('gem-override');
    });
});
