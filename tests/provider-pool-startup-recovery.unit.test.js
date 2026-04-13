import { afterEach, describe, expect, test } from '@jest/globals';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { shouldRecoverProviderPoolsOnStartup } from '../src/utils/provider-pool-recovery.js';

describe('provider pool startup recovery', () => {
    const tempDirs = [];

    function createTempPath(filename, content) {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'provider-pool-recovery-'));
        tempDirs.push(dir);
        const filePath = path.join(dir, filename);
        if (content !== undefined) {
            fs.writeFileSync(filePath, content, 'utf8');
        }
        return filePath;
    }

    afterEach(() => {
        while (tempDirs.length > 0) {
            fs.rmSync(tempDirs.pop(), { recursive: true, force: true });
        }
    });

    test('skips recovery when provider pools already contain entries', () => {
        expect(shouldRecoverProviderPoolsOnStartup({
            PROVIDER_POOLS_FILE_PATH: 'configs/provider_pools.json',
            providerPools: {
                'openai-codex-oauth': [{ uuid: 'node-1' }]
            }
        })).toBe(false);
    });

    test('recovers when provider pools file is missing', () => {
        const filePath = createTempPath('missing.json');
        fs.rmSync(filePath, { force: true });

        expect(shouldRecoverProviderPoolsOnStartup({
            PROVIDER_POOLS_FILE_PATH: filePath,
            providerPools: {}
        })).toBe(true);
    });

    test('recovers when provider pools file exists but is empty', () => {
        const filePath = createTempPath('provider_pools.json', '  ');

        expect(shouldRecoverProviderPoolsOnStartup({
            PROVIDER_POOLS_FILE_PATH: filePath,
            providerPools: {}
        })).toBe(true);
    });

    test('recovers when provider pools file only contains empty groups', () => {
        const filePath = createTempPath('provider_pools.json', JSON.stringify({
            'openai-codex-oauth': []
        }));

        expect(shouldRecoverProviderPoolsOnStartup({
            PROVIDER_POOLS_FILE_PATH: filePath,
            providerPools: {}
        })).toBe(true);
    });

    test('skips recovery when provider pools file already contains providers', () => {
        const filePath = createTempPath('provider_pools.json', JSON.stringify({
            'claude-custom-baoshiapi': [{ uuid: 'node-2' }]
        }));

        expect(shouldRecoverProviderPoolsOnStartup({
            PROVIDER_POOLS_FILE_PATH: filePath,
            providerPools: {}
        })).toBe(false);
    });
});
