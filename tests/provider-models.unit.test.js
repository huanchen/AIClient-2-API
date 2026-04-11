import { describe, expect, test } from '@jest/globals';
import {
    extractModelIdsFromNativeList,
    getConfiguredSupportedModels,
    getEquivalentProviderModelIds,
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

    test('normalizes Antigravity Claude aliases for requests', () => {
        expect(normalizeRequestedModelForProvider('gemini-antigravity', 'claude-sonnet-4-6'))
            .toBe('gemini-claude-sonnet-4-6');
        expect(normalizeRequestedModelForProvider('gemini-antigravity', 'claude-opus-4-6'))
            .toBe('gemini-claude-opus-4-6-thinking');
        expect(normalizeRequestedModelForProvider('gemini-antigravity', 'gemini-claude-sonnet-4-6'))
            .toBe('gemini-claude-sonnet-4-6');
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
});
