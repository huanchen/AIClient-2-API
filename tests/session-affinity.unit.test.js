import { afterEach, describe, expect, jest, test } from '@jest/globals';

jest.mock('../src/providers/adapter.js', () => ({
    getRegisteredProviders: jest.fn(() => []),
    getServiceAdapter: jest.fn(() => null)
}));
import { ProviderPoolManager } from '../src/providers/provider-pool-manager.js';

const providerType = 'openai-custom';
const managedInstances = [];

function createManager() {
    const manager = new ProviderPoolManager({
        [providerType]: [
            { uuid: 'node-a', isHealthy: true, isDisabled: false, needsRefresh: false },
            { uuid: 'node-b', isHealthy: true, isDisabled: false, needsRefresh: false }
        ]
    }, {
        saveDebounceTime: 600000,
        globalConfig: {
            PROVIDER_POOLS_FILE_PATH: 'tests/.tmp-provider-pools.json',
            sessionAffinity: {
                sessionAffinityEnabled: true,
                virtualNodesPerNode: 16,
                default5xxCoolDownMs: 60000,
                max429CoolDownMs: 3600000
            }
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
});
