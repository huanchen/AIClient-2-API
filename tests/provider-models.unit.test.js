import { describe, expect, test } from '@jest/globals';
import {
    extractModelIdsFromNativeList,
    getConfiguredSupportedModels,
    getEquivalentProviderModelIds,
    normalizeRequestedModelForProtocol,
    normalizeRequestedModelForProvider,
    providerSupportsModel,
    toPublicProviderModelId,
    usesManagedModelList
} from '../src/providers/provider-models.js';

describe('provider-models helpers', () => {
    test('recognizes managed model list providers', () => {
        expect(usesManagedModelList('openai-custom')).toBe(true);
        expect(usesManagedModelList('openaiResponses-custom-lab')).toBe(true);
        expect(usesManagedModelList('gemini-cli-oauth')).toBe(false);
    });

    test('normalizes supported models for managed providers', () => {
        expect(getConfiguredSupportedModels('openai-custom', {
            supportedModels: [' gpt-4o-mini ', '', 'gpt-4o-mini', 'gpt-4.1']
        })).toEqual(['gpt-4.1', 'gpt-4o-mini']);

        expect(getConfiguredSupportedModels('gemini-cli-oauth', {
            supportedModels: ['gemini-2.5-flash']
        })).toEqual([]);
    });

    test('extracts model ids from openai-style model lists', () => {
        expect(extractModelIdsFromNativeList({
            data: [
                { id: 'gpt-4o-mini' },
                { id: 'gpt-4.1' }
            ]
        }, 'openai-custom')).toEqual(['gpt-4.1', 'gpt-4o-mini']);
    });

    test('normalizes Claude client aliases at protocol level', () => {
        expect(normalizeRequestedModelForProtocol('claude', 'default')).toBe('claude-sonnet-4-6');
        expect(normalizeRequestedModelForProtocol('claude', 'Sonnet (1M context)')).toBe('claude-sonnet-4-6');
        expect(normalizeRequestedModelForProtocol('claude', 'opus')).toBe('claude-opus-4-6');
        expect(normalizeRequestedModelForProtocol('claude', 'Haiku')).toBe('claude-haiku-4-5');
        expect(normalizeRequestedModelForProtocol('claude', 'claude-sonnet-4.6')).toBe('claude-sonnet-4-6');
    });

    test('normalizes Codex client aliases at protocol level', () => {
        expect(normalizeRequestedModelForProtocol('openai_responses', 'gpt-5.3-codex (default)')).toBe('gpt-5.3-codex');
        expect(normalizeRequestedModelForProtocol('openai_responses', 'gpt-5.4 (current)')).toBe('gpt-5.4');
        expect(normalizeRequestedModelForProtocol('openai', 'gpt-5.4')).toBe('gpt-5.4');
    });

    test('normalizes Antigravity Claude aliases for requests', () => {
        expect(normalizeRequestedModelForProvider('gemini-antigravity', 'claude-sonnet-4-6'))
            .toBe('gemini-claude-sonnet-4-6');
        expect(normalizeRequestedModelForProvider('gemini-antigravity', 'claude-opus-4-6'))
            .toBe('gemini-claude-opus-4-6-thinking');
        expect(normalizeRequestedModelForProvider('gemini-antigravity', 'claude-opus-4.6'))
            .toBe('gemini-claude-opus-4-6-thinking');
        expect(normalizeRequestedModelForProvider('gemini-antigravity', 'gemini-claude-sonnet-4-6'))
            .toBe('gemini-claude-sonnet-4-6');
    });

    test('normalizes Claude aliases for Gemini CLI and Kiro target models', () => {
        expect(normalizeRequestedModelForProvider('gemini-cli-oauth', 'claude-sonnet-4-6'))
            .toBe('gemini-3.1-pro-preview');
        expect(normalizeRequestedModelForProvider('gemini-cli-oauth', 'claude-haiku-4.5'))
            .toBe('gemini-3.1-pro-preview');
        expect(normalizeRequestedModelForProvider('claude-kiro-oauth', 'claude-opus-4-6'))
            .toBe('claude-sonnet-4-5');
        expect(normalizeRequestedModelForProvider('claude-kiro-oauth', 'claude-haiku-4.5'))
            .toBe('claude-haiku-4-5');
    });

    test('normalizes Codex client aliases for Codex provider requests', () => {
        expect(normalizeRequestedModelForProvider('openai-codex-oauth', 'gpt-5.3-codex (default)'))
            .toBe('gpt-5.3-codex');
        expect(normalizeRequestedModelForProvider('openai-codex-oauth', 'gpt-5.4 (current)'))
            .toBe('gpt-5.4');
    });

    test('exposes public Claude model ids for Antigravity aliases', () => {
        expect(toPublicProviderModelId('gemini-antigravity', 'gemini-claude-sonnet-4-6'))
            .toBe('claude-sonnet-4-6');
        expect(toPublicProviderModelId('gemini-antigravity', 'gemini-claude-opus-4-6-thinking'))
            .toBe('claude-opus-4-6');
        expect(toPublicProviderModelId('gemini-antigravity', 'gemini-3-flash'))
            .toBe('gemini-3-flash');
    });

    test('matches equivalent Antigravity model ids across client and internal names', () => {
        expect(getEquivalentProviderModelIds('gemini-antigravity', 'claude-opus-4-6')).toEqual([
            'claude-opus-4-6',
            'claude-opus-4-6-thinking',
            'gemini-claude-opus-4-6-thinking'
        ]);

        expect(providerSupportsModel('gemini-antigravity', 'claude-sonnet-4-6', [
            'gemini-claude-sonnet-4-6'
        ])).toBe(true);

        expect(providerSupportsModel('gemini-antigravity', 'gemini-claude-opus-4-6-thinking', [
            'claude-opus-4-6'
        ])).toBe(true);
    });

    test('matches provider targets when Claude aliases route to Gemini CLI and Kiro', () => {
        expect(providerSupportsModel('gemini-cli-oauth', 'claude-sonnet-4-6', [
            'gemini-3.1-pro-preview'
        ])).toBe(true);

        expect(providerSupportsModel('claude-kiro-oauth', 'claude-opus-4-6', [
            'claude-sonnet-4-5'
        ])).toBe(true);

        expect(providerSupportsModel('claude-kiro-oauth', 'claude-haiku-4.5', [
            'claude-haiku-4-5'
        ])).toBe(true);
    });

    test('matches Codex client aliases against Codex supported models', () => {
        expect(providerSupportsModel('openai-codex-oauth', 'gpt-5.3-codex (default)', [
            'gpt-5.3-codex'
        ])).toBe(true);

        expect(providerSupportsModel('openai-codex-oauth', 'gpt-5.4 (current)', [
            'gpt-5.4'
        ])).toBe(true);
    });
});
