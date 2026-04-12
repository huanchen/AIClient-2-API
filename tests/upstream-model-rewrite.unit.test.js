import { describe, expect, jest, test } from '@jest/globals';
import { OpenAIApiService } from '../src/providers/openai/openai-core.js';
import { OpenAIResponsesApiService } from '../src/providers/openai/openai-responses-core.js';
import { ClaudeApiService } from '../src/providers/claude/claude-core.js';
import { MODEL_PROVIDER } from '../src/utils/constants.js';

jest.mock('../src/utils/proxy-utils.js', () => ({
    configureAxiosProxy: jest.fn(),
    configureTLSSidecar: jest.fn(config => config)
}));

describe('upstream model rewrite', () => {
    test('OpenAI chat rewrites Claude-family requests to gpt-5.4', async () => {
        const service = new OpenAIApiService({
            OPENAI_API_KEY: 'test-key',
            OPENAI_BASE_URL: 'https://example.com/v1',
            MODEL_PROVIDER: MODEL_PROVIDER.OPENAI_CUSTOM
        });
        service.callApi = jest.fn().mockResolvedValue({ ok: true });

        const requestBody = { model: 'claude-sonnet-4-6', messages: [] };
        await service.generateContent('claude-sonnet-4-6', requestBody);

        expect(service.callApi).toHaveBeenCalledWith(
            '/chat/completions',
            expect.objectContaining({ model: 'gpt-5.4' })
        );
    });

    test('OpenAI responses rewrites Claude-family requests to gpt-5.4', async () => {
        const service = new OpenAIResponsesApiService({
            OPENAI_API_KEY: 'test-key',
            OPENAI_BASE_URL: 'https://example.com/v1',
            MODEL_PROVIDER: MODEL_PROVIDER.OPENAI_CUSTOM_RESPONSES
        });
        service.callApi = jest.fn().mockResolvedValue({ ok: true });

        const requestBody = { model: 'claude-haiku-4-5', input: [] };
        await service.generateContent('claude-haiku-4-5', requestBody);

        expect(service.callApi).toHaveBeenCalledWith(
            '/responses',
            expect.objectContaining({ model: 'gpt-5.4' })
        );
    });

    test('Claude custom rewrites Codex gpt-5.4 to Sonnet when Opus is unavailable', async () => {
        const service = new ClaudeApiService({
            CLAUDE_API_KEY: 'test-key',
            CLAUDE_BASE_URL: 'https://example.com',
            MODEL_PROVIDER: MODEL_PROVIDER.CLAUDE_CUSTOM,
            supportedModels: ['claude-sonnet-4-5']
        });
        service.callApi = jest.fn().mockResolvedValue({ ok: true });

        const requestBody = { model: 'gpt-5.4', messages: [] };
        await service.generateContent('gpt-5.4', requestBody);

        expect(service.callApi).toHaveBeenCalledWith(
            '/v1/messages',
            expect.objectContaining({ model: 'claude-sonnet-4-5' })
        );
    });

    test.each([
        ['https://example.com', 'https://example.com', '/v1/messages'],
        ['https://example.com/v1', 'https://example.com/v1', '/messages'],
        ['https://example.com/v1/messages', 'https://example.com/v1', '/messages']
    ])('Claude custom resolves message endpoint for base URL %s', async (configuredBaseUrl, expectedBaseUrl, expectedUrl) => {
        const service = new ClaudeApiService({
            CLAUDE_API_KEY: 'test-key',
            CLAUDE_BASE_URL: configuredBaseUrl,
            MODEL_PROVIDER: MODEL_PROVIDER.CLAUDE_CUSTOM
        });
        service.client.request = jest.fn().mockResolvedValue({ data: { ok: true } });

        const requestBody = { model: 'claude-opus-4-6', messages: [] };
        await service.generateContent('claude-opus-4-6', requestBody);

        expect(service.baseUrl).toBe(expectedBaseUrl);
        expect(service.client.request).toHaveBeenCalledWith(
            expect.objectContaining({
                url: expectedUrl,
                data: expect.objectContaining({ model: 'claude-opus-4-6' })
            })
        );
    });
});
