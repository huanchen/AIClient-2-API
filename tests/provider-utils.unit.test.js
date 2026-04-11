import { describe, expect, test } from '@jest/globals';
import {
    createProviderConfig,
    extractIdentityFromCredentialsData
} from '../src/utils/provider-utils.js';

describe('provider-utils identity helpers', () => {
    test('extracts account identity from nested OpenAI-style credential payloads', () => {
        const identity = extractIdentityFromCredentialsData({
            'https://api.openai.com/profile': {
                email: 'user@example.com',
                name: 'Example User'
            },
            'https://api.openai.com/auth': {
                chatgpt_account_id: 'acct_123'
            }
        }, 'configs/codex/account.json');

        expect(identity.accountIdentifier).toBe('user@example.com');
        expect(identity.email).toBe('user@example.com');
        expect(identity.accountName).toBe('Example User');
        expect(identity.accountId).toBe('acct_123');
        expect(identity.fileLabel).toBe('account.json');
    });

    test('falls back to file name when credential payload has no identity fields', () => {
        const identity = extractIdentityFromCredentialsData({}, 'configs/codex/anonymous.json');

        expect(identity.accountIdentifier).toBe('anonymous.json');
        expect(identity.email).toBeNull();
        expect(identity.accountId).toBeNull();
        expect(identity.accountName).toBeNull();
    });

    test('applies customName when creating provider configs', () => {
        const provider = createProviderConfig({
            credPathKey: 'CODEX_OAUTH_CREDS_FILE_PATH',
            credPath: 'configs/codex/account.json',
            defaultCheckModel: 'gpt-5.4',
            customName: 'user@example.com'
        });

        expect(provider.customName).toBe('user@example.com');
        expect(provider.CODEX_OAUTH_CREDS_FILE_PATH).toBe('configs/codex/account.json');
    });
});
