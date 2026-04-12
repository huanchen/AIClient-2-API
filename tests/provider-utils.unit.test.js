import { describe, expect, test } from '@jest/globals';
import {
    createProviderConfig,
    extractIdentityFromCredentialsData,
    getProviderConfigValidationError,
    getRequiredProviderConfigFields,
    isCustomProviderGroupPlaceholderConfig
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

    test('keeps account identifier empty when credential payload has no identity fields', () => {
        const identity = extractIdentityFromCredentialsData({}, 'configs/codex/anonymous.json');

        expect(identity.accountIdentifier).toBeNull();
        expect(identity.displayIdentifier).toBe('anonymous.json');
        expect(identity.email).toBeNull();
        expect(identity.accountId).toBeNull();
        expect(identity.accountName).toBeNull();
    });

    test('extracts Google identity from id_token payloads', () => {
        const payload = Buffer.from(JSON.stringify({
            email: 'demo@gmail.com',
            name: 'Demo User',
            sub: 'google-user-123'
        })).toString('base64url');
        const identity = extractIdentityFromCredentialsData({
            id_token: `header.${payload}.signature`
        }, 'configs/antigravity/demo.json');

        expect(identity.accountIdentifier).toBe('demo@gmail.com');
        expect(identity.displayIdentifier).toBe('demo@gmail.com');
        expect(identity.email).toBe('demo@gmail.com');
        expect(identity.accountName).toBe('Demo User');
        expect(identity.accountId).toBe('google-user-123');
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

    test('returns required config fields for suffixed custom providers', () => {
        expect(getRequiredProviderConfigFields('claude-custom-baoshiapi')).toEqual(['CLAUDE_API_KEY', 'CLAUDE_BASE_URL']);
        expect(getRequiredProviderConfigFields('openaiResponses-custom-proxy')).toEqual(['OPENAI_API_KEY', 'OPENAI_BASE_URL']);
    });

    test('detects placeholder custom group configs and reports missing fields', () => {
        const placeholderConfig = {
            customName: 'BAOSHIAPI',
            isHealthy: true,
            isDisabled: false,
            usageCount: 0,
            errorCount: 0
        };

        expect(isCustomProviderGroupPlaceholderConfig('claude-custom-baoshiapi', placeholderConfig)).toBe(true);
        expect(getProviderConfigValidationError('claude-custom-baoshiapi', placeholderConfig)).toBe(
            '[Config Validation] Missing required fields: CLAUDE_API_KEY, CLAUDE_BASE_URL'
        );
    });
});
