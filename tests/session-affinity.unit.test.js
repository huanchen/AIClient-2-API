import { afterEach, describe, expect, jest, test } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';

jest.mock('../src/providers/adapter.js', () => ({
    getRegisteredProviders: jest.fn(() => []),
    getServiceAdapter: jest.fn(() => null)
}));
import { ConsistentHashRing, ProviderPoolManager } from '../src/providers/provider-pool-manager.js';

const providerType = 'openai-custom';
const managedInstances = [];
const managedTempDirs = [];

function createOpenAiCustomNode(overrides = {}) {
    return {
        uuid: 'node',
        isHealthy: true,
        isDisabled: false,
        needsRefresh: false,
        OPENAI_API_KEY: 'test-openai-key',
        OPENAI_BASE_URL: 'https://example.com/v1',
        ...overrides
    };
}

function createManager(
    providerConfigs = [
        createOpenAiCustomNode({ uuid: 'node-a' }),
        createOpenAiCustomNode({ uuid: 'node-b' })
    ],
    options = {}
) {
    const {
        saveDebounceTime = 600000,
        globalConfig = {}
    } = options;

    const manager = new ProviderPoolManager({
        [providerType]: providerConfigs
    }, {
        saveDebounceTime,
        globalConfig: {
            PROVIDER_POOLS_FILE_PATH: 'tests/.tmp-provider-pools.json',
            sessionAffinity: {
                sessionAffinityEnabled: true,
                virtualNodesPerNode: 16,
                default5xxCoolDownMs: 60000,
                max429CoolDownMs: 3600000,
                persistEnabled: false,
                persistDebounceMs: 1
            },
            ...globalConfig,
            sessionAffinity: {
                sessionAffinityEnabled: true,
                virtualNodesPerNode: 16,
                default5xxCoolDownMs: 60000,
                max429CoolDownMs: 3600000,
                persistEnabled: false,
                persistDebounceMs: 1,
                ...(globalConfig.sessionAffinity || {})
            }
        }
    });

    if (manager.saveTimer) {
        clearTimeout(manager.saveTimer);
        manager.saveTimer = null;
    }
    if (manager.sessionAffinityPersistTimer) {
        clearTimeout(manager.sessionAffinityPersistTimer);
        manager.sessionAffinityPersistTimer = null;
    }
    manager.pendingSaves.clear();
    managedInstances.push(manager);
    return manager;
}

function seedSession(manager, sessionKey, overrides = {}) {
    const now = Date.now();
    manager.sessionAffinity.set(sessionKey, {
        boundUuid: 'node-a',
        providerType,
        createdAt: now,
        lastAccessed: now,
        cooling: new Map(),
        ...overrides
    });
}

afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    for (const manager of managedInstances.splice(0)) {
        if (manager.cleanupTimer) {
            clearInterval(manager.cleanupTimer);
        }
        if (manager.saveTimer) {
            clearTimeout(manager.saveTimer);
        }
        if (manager.sessionAffinityPersistTimer) {
            clearTimeout(manager.sessionAffinityPersistTimer);
        }
    }
    for (const dir of managedTempDirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

describe('session affinity fixes', () => {
    test('initializes consistent hash rings on startup', () => {
        const manager = createManager();
        const ring = manager.consistentHashRings.get(providerType);

        expect(ring).toBeDefined();
        expect(ring.nodeSet).toEqual(new Set(['node-a', 'node-b']));
        expect(['node-a', 'node-b']).toContain(ring.getNode('p0:test-session'));
    });

    test('records first 429 cooldown as one minute and preserves session cooling state', () => {
        const manager = createManager();
        const now = 1_700_000_000_000;
        jest.useFakeTimers();
        jest.setSystemTime(now);

        seedSession(manager, 'p0:conv-429');
        manager.recordSessionFailure('p0:conv-429', 'node-a', 429);

        const session = manager.sessionAffinity.get('p0:conv-429');
        const provider = manager.providerStatus[providerType].find(p => p.config.uuid === 'node-a').config;

        expect(session.boundUuid).toBeNull();
        expect(session.cooling.get('node-a')).toBe(now + 60000);
        expect(provider.lastCoolDownDuration).toBe(60000);
        expect(provider.scheduledRecoveryTime).toBe(new Date(now + 60000).toISOString());
        expect(manager.consistentHashRings.get(providerType).nodeSet).toEqual(new Set(['node-b']));
    });

    test('handles permanent auth cooldown without invalid date errors', () => {
        const manager = createManager();
        const now = 1_700_000_000_000;
        jest.useFakeTimers();
        jest.setSystemTime(now);

        seedSession(manager, 'p0:conv-401');

        expect(() => manager.recordSessionFailure('p0:conv-401', 'node-a', 401)).not.toThrow();

        const session = manager.sessionAffinity.get('p0:conv-401');
        const provider = manager.providerStatus[providerType].find(p => p.config.uuid === 'node-a').config;

        expect(session.cooling.get('node-a')).toBe(Infinity);
        expect(provider.isHealthy).toBe(false);
        expect(provider.scheduledRecoveryTime ?? null).toBeNull();
        expect(manager.consistentHashRings.get(providerType).nodeSet).toEqual(new Set(['node-b']));
    });

    test('cold start clears persisted unhealthy nodes that have no recovery deadline', () => {
        const manager = createManager([
            createOpenAiCustomNode({
                uuid: 'node-a',
                isHealthy: false,
                errorCount: 11,
                lastErrorTime: '2026-04-11T15:57:06.119Z',
                lastErrorMessage: 'Request failed with status code 403'
            }),
            createOpenAiCustomNode({ uuid: 'node-b' })
        ]);

        const provider = manager.providerStatus[providerType].find(p => p.config.uuid === 'node-a').config;

        expect(provider.isHealthy).toBe(true);
        expect(provider.errorCount).toBe(0);
        expect(provider.lastErrorTime).toBeNull();
        expect(provider.lastErrorMessage).toBeNull();
        expect(provider.scheduledRecoveryTime).toBeNull();
        expect(manager.consistentHashRings.get(providerType).nodeSet).toEqual(new Set(['node-a', 'node-b']));
    });

    test('reroutes a session away from a cooled node instead of dropping session state', () => {
        const manager = createManager();
        const now = 1_700_000_000_000;
        jest.useFakeTimers();
        jest.setSystemTime(now);

        seedSession(manager, 'p0:reroute', {
            cooling: new Map([['node-a', now + 60000]])
        });

        const selected = manager.selectNodeForSession(providerType, 'p0:reroute');
        const session = manager.sessionAffinity.get('p0:reroute');

        expect(selected).toBe('node-b');
        expect(session.boundUuid).toBe('node-b');
        expect(session.cooling.get('node-a')).toBe(now + 60000);
    });

    test('session affinity excludes nodes sharing the same failed endpoint identity', () => {
        const manager = createManager([
            createOpenAiCustomNode({ uuid: 'node-a', OPENAI_BASE_URL: 'https://same.example.com/v1' }),
            createOpenAiCustomNode({ uuid: 'node-b', OPENAI_BASE_URL: 'https://same.example.com/v1' }),
            createOpenAiCustomNode({ uuid: 'node-c', OPENAI_BASE_URL: 'https://other.example.com/v1' })
        ]);

        const selected = manager.selectNodeForSession(providerType, 'p0:avoid-same-endpoint', {
            excludeEndpointIdentities: ['https://same.example.com/v1']
        });
        const session = manager.sessionAffinity.get('p0:avoid-same-endpoint');

        expect(selected).toBe('node-c');
        expect(session.boundUuid).toBe('node-c');
    });

    test('does not rebind a stale hash-ring node after runtime config becomes invalid', () => {
        const manager = createManager([
            createOpenAiCustomNode({ uuid: 'node-a' })
        ]);

        const provider = manager.providerStatus[providerType].find(p => p.config.uuid === 'node-a').config;
        delete provider.OPENAI_API_KEY;
        delete provider.OPENAI_BASE_URL;
        provider.isHealthy = true;
        provider.lastErrorMessage = null;
        manager.consistentHashRings.set(providerType, new ConsistentHashRing(['node-a'], 16));

        seedSession(manager, 'p0:stale-invalid', { boundUuid: 'node-a' });

        const selected = manager.selectNodeForSession(providerType, 'p0:stale-invalid');
        const session = manager.sessionAffinity.get('p0:stale-invalid');

        expect(selected).toBeNull();
        expect(session.boundUuid).toBeNull();
        expect(provider.isHealthy).toBe(false);
        expect(provider.lastErrorMessage).toBe('[Config Validation] Missing required fields: OPENAI_API_KEY, OPENAI_BASE_URL');
    });

    test('rebuilds the ring when scheduled recovery is reached', () => {
        const manager = createManager();
        const now = 1_700_000_000_000;
        jest.useFakeTimers();
        jest.setSystemTime(now);

        const provider = manager.providerStatus[providerType].find(p => p.config.uuid === 'node-a').config;
        manager.markProviderUnhealthyWithRecoveryTime(providerType, provider, 'temporary cooldown', now - 1000);

        manager._checkAndRecoverScheduledProviders(providerType);

        expect(provider.isHealthy).toBe(true);
        expect(provider.scheduledRecoveryTime).toBeNull();
        expect(manager.consistentHashRings.get(providerType).nodeSet).toEqual(new Set(['node-a', 'node-b']));
    });

    test('links previous_response_id back to the original session binding', () => {
        const manager = createManager();

        const firstTurn = manager.extractSessionAffinityContext({}, providerType, 'gpt-5.4', {
            apiKey: 'key-1',
            ip: '10.0.0.8',
            userAgent: 'codex-cli'
        });
        const firstNode = manager.selectNodeForSession(providerType, firstTurn.sessionKey);

        manager.bindResponseIdToSession('resp_turn_1', firstTurn.sessionKey);

        const followUp = manager.extractSessionAffinityContext({
            previous_response_id: 'resp_turn_1'
        }, providerType, 'gpt-5.4', {
            apiKey: 'key-1',
            ip: '10.0.0.8',
            userAgent: 'codex-cli'
        });
        const secondNode = manager.selectNodeForSession(providerType, followUp.sessionKey);

        expect(firstTurn.sessionKey.startsWith('p2:')).toBe(true);
        expect(followUp.aliasResolved).toBe(true);
        expect(followUp.sessionKey).toBe(firstTurn.sessionKey);
        expect(secondNode).toBe(firstNode);
    });

    test('prefers metadata.user_id over transport-level weak affinity keys', () => {
        const manager = createManager();

        const session = manager.extractSessionAffinityContext({
            metadata: {
                user_id: 'user_123_account__session_abc'
            }
        }, providerType, 'gpt-5.4', {
            apiKey: 'key-1',
            ip: '10.0.0.8',
            userAgent: 'claude-cli'
        });

        expect(session.source).toBe('request.metadata.user_id');
        expect(session.aliasResolved).toBe(false);
        expect(session.sessionKey.startsWith('p2:')).toBe(true);
        expect(session.sessionKey).not.toBe(
            manager.extractSessionAffinityContext({}, providerType, 'gpt-5.4', {
                apiKey: 'key-1',
                ip: '10.0.0.8',
                userAgent: 'claude-cli'
            }).sessionKey
        );
    });

    test('builds low-token health check payloads for generic, responses, and gemini providers', () => {
        const manager = createManager();

        expect(manager._buildHealthCheckRequests('openai-custom', 'gpt-4o-mini')[0]).toEqual(
            expect.objectContaining({
                model: 'gpt-4o-mini',
                max_tokens: 1
            })
        );

        expect(manager._buildHealthCheckRequests('openaiResponses-custom', 'gpt-4o-mini')[0]).toEqual(
            expect.objectContaining({
                model: 'gpt-4o-mini',
                max_output_tokens: 1
            })
        );

        expect(manager._buildHealthCheckRequests('gemini-antigravity', 'gemini-2.5-flash')[0]).toEqual(
            expect.objectContaining({
                generationConfig: expect.objectContaining({
                    maxOutputTokens: 1
                })
            })
        );
    });

    test('scheduled health updates do not inflate usage count', () => {
        const manager = createManager();
        const provider = manager.providerStatus[providerType].find(p => p.config.uuid === 'node-a').config;
        provider.usageCount = 7;
        provider.lastUsed = '2024-01-01T00:00:00.000Z';

        manager.markProviderHealthy(providerType, provider, false, 'gpt-4o-mini', { incrementUsageCount: false });

        expect(provider.usageCount).toBe(7);
        expect(provider.lastUsed).toBe('2024-01-01T00:00:00.000Z');
    });

    test('scheduled health checks only probe abnormal nodes by default', async () => {
        const manager = createManager([
            createOpenAiCustomNode({ uuid: 'node-a', isHealthy: true }),
            createOpenAiCustomNode({ uuid: 'node-b', isHealthy: true })
        ], {
            globalConfig: {
                SCHEDULED_HEALTH_CHECK: {
                    enabled: true,
                    interval: 600000,
                    providerTypes: [providerType],
                    checkHealthyProviders: false
                }
            }
        });
        manager._checkProviderHealth = jest.fn().mockResolvedValue({
            success: true,
            modelName: 'gpt-4o-mini'
        });
        const abnormalProvider = manager.providerStatus[providerType].find((provider) => provider.config.uuid === 'node-b').config;
        abnormalProvider.isHealthy = false;
        abnormalProvider.errorCount = 11;
        abnormalProvider.lastErrorTime = '2024-01-01T00:00:00.000Z';

        await manager.performHealthChecks();

        expect(manager._checkProviderHealth).toHaveBeenCalledTimes(1);
        expect(manager._checkProviderHealth.mock.calls[0][1].uuid).toBe('node-b');
    });

    test('startup health checks can include healthy nodes when explicitly enabled', async () => {
        const manager = createManager([
            createOpenAiCustomNode({ uuid: 'node-a', isHealthy: true }),
            createOpenAiCustomNode({ uuid: 'node-b', isHealthy: true })
        ], {
            globalConfig: {
                SCHEDULED_HEALTH_CHECK: {
                    enabled: true,
                    startupRun: true,
                    interval: 600000,
                    providerTypes: [providerType],
                    checkHealthyProviders: true
                }
            }
        });
        manager._checkProviderHealth = jest.fn().mockResolvedValue({
            success: true,
            modelName: 'gpt-4o-mini'
        });

        await manager.performInitialHealthChecks();

        expect(manager._checkProviderHealth).toHaveBeenCalledTimes(2);
        expect(manager._checkProviderHealth.mock.calls.map(([, config]) => config.uuid)).toEqual(['node-a', 'node-b']);
    });

    test('restores persisted session affinity bindings and response aliases after restart', async () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai2api-session-affinity-'));
        const persistFilePath = path.join(tempDir, 'session-affinity-store.json');
        managedTempDirs.push(tempDir);

        const managerA = createManager(undefined, {
            globalConfig: {
                sessionAffinity: {
                    persistEnabled: true,
                    persistFilePath,
                    persistDebounceMs: 1
                }
            }
        });
        const now = 1_700_000_000_000;
        jest.useFakeTimers();
        jest.setSystemTime(now);

        seedSession(managerA, 'p0:persisted-session', {
            cooling: new Map([['node-b', now + 60000]])
        });
        managerA.bindResponseIdToSession('resp_turn_1', 'p0:persisted-session');
        await managerA._flushSessionAffinityPersistence();

        const managerB = createManager(undefined, {
            globalConfig: {
                sessionAffinity: {
                    persistEnabled: true,
                    persistFilePath,
                    persistDebounceMs: 1
                }
            }
        });

        const restoredSession = managerB.sessionAffinity.get('p0:persisted-session');

        expect(restoredSession).toEqual(expect.objectContaining({
            boundUuid: 'node-a',
            providerType
        }));
        expect(restoredSession.cooling).toBeInstanceOf(Map);
        expect(restoredSession.cooling.get('node-b')).toBe(now + 60000);
        expect(managerB.resolveSessionAlias('resp_turn_1')).toBe('p0:persisted-session');
    });

    test('acquireSlot prefers a different upstream endpoint when a shared endpoint is already busy', async () => {
        const manager = createManager([
            createOpenAiCustomNode({ uuid: 'node-a', OPENAI_BASE_URL: 'https://same.example.com/v1' }),
            createOpenAiCustomNode({ uuid: 'node-b', OPENAI_BASE_URL: 'https://same.example.com/v1' }),
            createOpenAiCustomNode({ uuid: 'node-c', OPENAI_BASE_URL: 'https://other.example.com/v1' })
        ]);

        const first = await manager.acquireSlot(providerType);
        const second = await manager.acquireSlot(providerType);

        expect(first.uuid).toBe('node-a');
        expect(second.uuid).toBe('node-c');

        manager.releaseSlot(providerType, first.uuid);
        manager.releaseSlot(providerType, second.uuid);
    });
});
