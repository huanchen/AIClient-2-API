import { convertData } from '../convert/convert.js';
import { MODEL_PROTOCOL_PREFIX, MODEL_PROVIDER } from '../utils/constants.js';

/**
 * 各提供商支持的模型列表
 * 用于前端UI选择不支持的模型
 */
export const PROVIDER_MODELS = {
    'gemini-cli-oauth': [
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.5-pro',
        'gemini-2.5-pro-preview-06-05',
        'gemini-2.5-flash-preview-09-2025',
        'gemini-3-pro-preview',
        'gemini-3-flash-preview',
        'gemini-3.1-pro-preview',
        'gemini-3.1-flash-lite-preview',
    ],
    'gemini-antigravity': [
        'gemini-3-flash',
        'gemini-3.1-pro-high',
        'gemini-3.1-pro-low',
        'gemini-3.1-flash-image',
        'gemini-3-flash-agent',
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash-thinking',
        'gemini-claude-sonnet-4-6',
        'gemini-claude-opus-4-6-thinking',
    ],
    'claude-custom': [],
    'claude-kiro-oauth': [
        'claude-haiku-4-5',
        'claude-opus-4-6',
        'claude-sonnet-4-6',
        'claude-opus-4-5',
        'claude-opus-4-5-20251101',
        'claude-sonnet-4-5',
        'claude-sonnet-4-5-20250929',
        'claude-sonnet-4-20250514',
        'claude-3-7-sonnet-20250219'
    ],
    'openai-custom': [],
    'openaiResponses-custom': [],
    'openai-qwen-oauth': [
        'coder-model',
        'vision-model',
        'qwen3-coder-plus',
        'qwen3-coder-flash',
    ],
    'openai-iflow': [
        // iFlow 特有模型
        'iflow-rome-30ba3b',
        // Qwen 模型
        'qwen3-coder-plus',
        'qwen3-max',
        'qwen3-vl-plus',
        'qwen3-max-preview',
        'qwen3-32b',
        'qwen3-235b-a22b-thinking-2507',
        'qwen3-235b-a22b-instruct',
        'qwen3-235b',
        // Kimi 模型
        'kimi-k2-0905',
        'kimi-k2',
        // GLM 模型
        'glm-4.6',
        // DeepSeek 模型
        'deepseek-v3.2',
        'deepseek-r1',
        'deepseek-v3',
        // 手动定义
        'glm-4.7',
        'glm-5',
        'kimi-k2.5',
        'minimax-m2.1',
        'minimax-m2.5',
    ],
    'openai-codex-oauth': [
        'gpt-5',
        'gpt-5-codex',
        'gpt-5-codex-mini',
        'gpt-5.1',
        'gpt-5.1-codex',
        'gpt-5.1-codex-mini',
        'gpt-5.1-codex-max',
        'gpt-5.2',
        'gpt-5.2-codex',
        'gpt-5.3-codex',
        'gpt-5.3-codex-spark',
        'gpt-5.4',
        'gpt-5.4-mini',
    ],
    'forward-api': [],
    'grok-custom': [
        'grok-4.1-mini',
        'grok-4.1-thinking',
        'grok-4.20',
        'grok-4.20-auto',
        'grok-4.20-fast',
        'grok-4.20-expert',
        'grok-4.20-heavy',
        'grok-imagine-1.0',
        'grok-imagine-1.0-edit',
        'grok-imagine-1.0-fast',
        'grok-imagine-1.0-fast-edit',
        'grok-4.1-mini-nsfw',
        'grok-4.1-thinking-nsfw',
        'grok-4.20-nsfw',
        'grok-4.20-auto-nsfw',
        'grok-4.20-fast-nsfw',
        'grok-4.20-expert-nsfw',
        'grok-4.20-heavy-nsfw',
        'grok-imagine-1.0-nsfw',
        'grok-imagine-1.0-edit-nsfw',
        'grok-imagine-1.0-fast-nsfw',
        'grok-imagine-1.0-fast-edit-nsfw'
    ]
};

export const MANAGED_MODEL_LIST_PROVIDERS = [
    'openai-custom',
    'openaiResponses-custom',
    'claude-custom'
];

export const DEFAULT_CLIENT_MODEL_ROUTING_RULES = {
    protocolModelAliases: {
        claude: {
            'claude-sonnet-4-6': [
                'claude-sonnet-4-6',
                'claude-sonnet-4.6',
                'gemini-claude-sonnet-4-6',
                'default',
                'default (recommended)',
                'sonnet',
                'sonnet (1m context)',
                'sonnet-1m',
                'sonnet 1m',
                'claude-sonnet-4-6-1m',
                'claude-sonnet-4.6-1m'
            ],
            'claude-opus-4-6': [
                'claude-opus-4-6',
                'claude-opus-4.6',
                'claude-opus-4-6-thinking',
                'claude-opus-4.6-thinking',
                'gemini-claude-opus-4-6-thinking',
                'opus',
                'opus (1m context)',
                'opus-1m',
                'opus 1m',
                'claude-opus-4-6-1m',
                'claude-opus-4.6-1m'
            ],
            'claude-haiku-4-5': [
                'claude-haiku-4-5',
                'claude-haiku-4.5',
                'claude-haiku-4-5-20251001',
                'haiku'
            ],
            'claude-sonnet-4-5': [
                'claude-sonnet-4-5',
                'claude-sonnet-4.5',
                'claude-sonnet-4-5-20250929',
                'claude-sonnet-4-20250514'
            ],
            'claude-opus-4-5': [
                'claude-opus-4-5',
                'claude-opus-4.5',
                'claude-opus-4-5-20251101'
            ]
        },
        openai: {
            'gpt-5.3-codex': [
                'gpt-5.3-codex',
                'gpt-5.3-codex (default)'
            ],
            'gpt-5.4': [
                'gpt-5.4',
                'gpt-5.4 (current)'
            ]
        }
    },
    providerModelAliases: {
        claude: {
            'claude-sonnet-4-6': [
                'claude-sonnet-4-6',
                'claude-sonnet-4.6',
                'gemini-claude-sonnet-4-6',
                'sonnet (1m context)',
                'sonnet-1m',
                'sonnet 1m',
                'claude-sonnet-4-6-1m',
                'claude-sonnet-4.6-1m'
            ],
            'claude-opus-4-6': [
                'claude-opus-4-6',
                'claude-opus-4.6',
                'claude-opus-4-6-thinking',
                'claude-opus-4.6-thinking',
                'gemini-claude-opus-4-6-thinking',
                'opus (1m context)',
                'opus-1m',
                'opus 1m',
                'claude-opus-4-6-1m',
                'claude-opus-4.6-1m'
            ],
            'claude-haiku-4-5': [
                'claude-haiku-4-5',
                'claude-haiku-4.5',
                'claude-haiku-4-5-20251001'
            ],
            'claude-sonnet-4-5': [
                'claude-sonnet-4-5',
                'claude-sonnet-4.5',
                'claude-sonnet-4-5-20250929',
                'claude-sonnet-4-20250514'
            ],
            'claude-opus-4-5': [
                'claude-opus-4-5',
                'claude-opus-4.5',
                'claude-opus-4-5-20251101'
            ]
        }
    },
    providerTargets: {
        openaiCompatible: {
            defaultModel: 'gpt-5.4'
        },
        geminiCli: {
            defaultModel: 'gemini-3.1-pro-preview'
        },
        kiro: {
            defaultModel: 'claude-sonnet-4-5',
            haikuModel: 'claude-haiku-4-5'
        },
        grokCompatible: {
            defaultModel: 'grok-4.20'
        },
        antigravity: {
            sonnetModel: 'claude-sonnet-4-6',
            opusModel: 'claude-opus-4-6'
        },
        codexToClaude: {
            highCapabilityModel: 'gpt-5.4',
            supportedClientModels: [
                'gpt-5.3-codex',
                'gpt-5.4'
            ],
            highCapabilityPreferredModels: [
                'claude-opus-4-6',
                'claude-opus-4-5-20251101',
                'claude-opus-4-5',
                'claude-sonnet-4-6',
                'claude-sonnet-4-5-20250929',
                'claude-sonnet-4-5',
                'claude-sonnet-4-20250514',
                'claude-3-7-sonnet-20250219'
            ],
            standardPreferredModels: [
                'claude-sonnet-4-6',
                'claude-sonnet-4-5-20250929',
                'claude-sonnet-4-5',
                'claude-sonnet-4-20250514',
                'claude-3-7-sonnet-20250219'
            ]
        }
    },
    antigravityAliases: {
        'claude-sonnet-4-6': {
            internal: 'gemini-claude-sonnet-4-6',
            public: 'claude-sonnet-4-6',
            equivalents: ['claude-sonnet-4-6', 'gemini-claude-sonnet-4-6']
        },
        'claude-opus-4-6': {
            internal: 'gemini-claude-opus-4-6-thinking',
            public: 'claude-opus-4-6',
            equivalents: ['claude-opus-4-6', 'claude-opus-4-6-thinking', 'gemini-claude-opus-4-6-thinking']
        }
    }
};

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cloneRuleValue(value) {
    if (Array.isArray(value)) {
        return value.map(item => cloneRuleValue(item));
    }

    if (isPlainObject(value)) {
        return Object.entries(value).reduce((result, [key, nestedValue]) => {
            result[key] = cloneRuleValue(nestedValue);
            return result;
        }, {});
    }

    return value;
}

function mergeRoutingRules(baseRules, overrideRules) {
    if (!isPlainObject(overrideRules)) {
        return cloneRuleValue(baseRules);
    }

    const mergedRules = cloneRuleValue(baseRules);
    Object.entries(overrideRules).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            mergedRules[key] = cloneRuleValue(value);
            return;
        }

        if (isPlainObject(value) && isPlainObject(mergedRules[key])) {
            mergedRules[key] = mergeRoutingRules(mergedRules[key], value);
            return;
        }

        mergedRules[key] = cloneRuleValue(value);
    });

    return mergedRules;
}

function normalizeAliasLookupKey(model) {
    if (typeof model !== 'string') {
        return '';
    }

    return model
        .trim()
        .toLowerCase()
        .replace(/[✔✓]/g, '')
        .replace(/\s*·.*$/, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function createAliasLookup(aliasMap) {
    return Object.entries(aliasMap).reduce((lookup, [canonicalModel, aliases]) => {
        const uniqueAliases = new Set([canonicalModel, ...(aliases || [])]);
        uniqueAliases.forEach(alias => {
            const normalizedKey = normalizeAliasLookupKey(alias);
            if (normalizedKey) {
                lookup[normalizedKey] = canonicalModel;
            }
        });
        return lookup;
    }, {});
}

function createAntigravityAliasLookup(aliasMap) {
    return Object.values(aliasMap || {}).reduce((lookup, aliasConfig) => {
        const equivalents = Array.isArray(aliasConfig?.equivalents) ? aliasConfig.equivalents : [];
        equivalents.forEach(modelId => {
            if (typeof modelId === 'string' && modelId.trim()) {
                lookup[modelId.trim()] = aliasConfig;
            }
        });
        return lookup;
    }, {});
}

function pickString(value, fallbackValue) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallbackValue;
}

function pickStringArray(value, fallbackValue = []) {
    if (Array.isArray(value)) {
        return value
            .filter(item => typeof item === 'string')
            .map(item => item.trim())
            .filter(Boolean);
    }

    return [...fallbackValue];
}

export function getEffectiveClientModelRoutingRules(overrideRules = {}) {
    return mergeRoutingRules(DEFAULT_CLIENT_MODEL_ROUTING_RULES, overrideRules);
}

function createRoutingState(overrideRules = {}) {
    const rules = getEffectiveClientModelRoutingRules(overrideRules);
    const providerTargets = rules.providerTargets || {};
    const antigravityAliases = isPlainObject(rules.antigravityAliases) ? rules.antigravityAliases : {};
    const codexToClaude = providerTargets.codexToClaude || {};
    const antigravityTargets = providerTargets.antigravity || {};
    const kiroTargets = providerTargets.kiro || {};

    return {
        rules,
        claudeProtocolModelAliasLookup: createAliasLookup(rules.protocolModelAliases?.claude || {}),
        claudeProviderModelAliasLookup: createAliasLookup(rules.providerModelAliases?.claude || {}),
        codexProtocolModelAliasLookup: createAliasLookup(rules.protocolModelAliases?.openai || {}),
        antigravityModelAliases: antigravityAliases,
        antigravityModelAliasLookup: createAntigravityAliasLookup(antigravityAliases),
        openaiUpstreamDefaultModel: pickString(
            providerTargets.openaiCompatible?.defaultModel,
            DEFAULT_CLIENT_MODEL_ROUTING_RULES.providerTargets.openaiCompatible.defaultModel
        ),
        geminiUpstreamDefaultModel: pickString(
            providerTargets.geminiCli?.defaultModel,
            DEFAULT_CLIENT_MODEL_ROUTING_RULES.providerTargets.geminiCli.defaultModel
        ),
        kiroUpstreamDefaultModel: pickString(
            kiroTargets.defaultModel,
            DEFAULT_CLIENT_MODEL_ROUTING_RULES.providerTargets.kiro.defaultModel
        ),
        kiroHaikuModel: pickString(
            kiroTargets.haikuModel,
            DEFAULT_CLIENT_MODEL_ROUTING_RULES.providerTargets.kiro.haikuModel
        ),
        grokUpstreamDefaultModel: pickString(
            providerTargets.grokCompatible?.defaultModel,
            DEFAULT_CLIENT_MODEL_ROUTING_RULES.providerTargets.grokCompatible.defaultModel
        ),
        antigravitySonnetModel: pickString(
            antigravityTargets.sonnetModel,
            DEFAULT_CLIENT_MODEL_ROUTING_RULES.providerTargets.antigravity.sonnetModel
        ),
        antigravityOpusModel: pickString(
            antigravityTargets.opusModel,
            DEFAULT_CLIENT_MODEL_ROUTING_RULES.providerTargets.antigravity.opusModel
        ),
        codexHighCapabilityModel: pickString(
            codexToClaude.highCapabilityModel,
            DEFAULT_CLIENT_MODEL_ROUTING_RULES.providerTargets.codexToClaude.highCapabilityModel
        ),
        supportedCodexClientModels: new Set(
            pickStringArray(
                codexToClaude.supportedClientModels,
                DEFAULT_CLIENT_MODEL_ROUTING_RULES.providerTargets.codexToClaude.supportedClientModels
            )
        ),
        claudeHighCapabilityPreferredModels: pickStringArray(
            codexToClaude.highCapabilityPreferredModels,
            DEFAULT_CLIENT_MODEL_ROUTING_RULES.providerTargets.codexToClaude.highCapabilityPreferredModels
        ),
        claudeStandardPreferredModels: pickStringArray(
            codexToClaude.standardPreferredModels,
            DEFAULT_CLIENT_MODEL_ROUTING_RULES.providerTargets.codexToClaude.standardPreferredModels
        )
    };
}

let currentClientModelRoutingRules = getEffectiveClientModelRoutingRules();
let routingState = createRoutingState(currentClientModelRoutingRules);

export function getClientModelRoutingRules() {
    return cloneRuleValue(currentClientModelRoutingRules);
}

export function getDefaultClientModelRoutingRules() {
    return cloneRuleValue(DEFAULT_CLIENT_MODEL_ROUTING_RULES);
}

export function setClientModelRoutingRules(overrideRules = {}) {
    currentClientModelRoutingRules = getEffectiveClientModelRoutingRules(overrideRules);
    routingState = createRoutingState(currentClientModelRoutingRules);
    return getClientModelRoutingRules();
}

export function resetClientModelRoutingRules() {
    return setClientModelRoutingRules({});
}

function normalizeClaudeProtocolModel(model) {
    const normalizedModel = typeof model === 'string' ? model.trim() : model;
    if (typeof normalizedModel !== 'string' || !normalizedModel) {
        return normalizedModel;
    }

    return routingState.claudeProtocolModelAliasLookup[normalizeAliasLookupKey(normalizedModel)] || normalizedModel;
}

function normalizeClaudeProviderModel(model) {
    const normalizedModel = typeof model === 'string' ? model.trim() : model;
    if (typeof normalizedModel !== 'string' || !normalizedModel) {
        return normalizedModel;
    }

    return routingState.claudeProviderModelAliasLookup[normalizeAliasLookupKey(normalizedModel)] || normalizedModel;
}

function normalizeCodexProtocolModel(model) {
    const normalizedModel = typeof model === 'string' ? model.trim() : model;
    if (typeof normalizedModel !== 'string' || !normalizedModel) {
        return normalizedModel;
    }

    return routingState.codexProtocolModelAliasLookup[normalizeAliasLookupKey(normalizedModel)] || normalizedModel;
}

function getSupportedCodexClientModel(model) {
    const canonicalModel = normalizeCodexProtocolModel(model);
    return routingState.supportedCodexClientModels.has(canonicalModel) ? canonicalModel : null;
}

function isClaudeFamilyModel(model) {
    return typeof model === 'string' && model.startsWith('claude-');
}

function isClaudeOpusModel(model) {
    return isClaudeFamilyModel(model) && model.includes('-opus-');
}

function isClaudeHaikuModel(model) {
    return isClaudeFamilyModel(model) && model.includes('-haiku-');
}

function selectPreferredModel(supportedModels = [], preferredModels = [], fallbackModel) {
    const normalizedSupportedModels = normalizeModelIds(supportedModels);
    if (normalizedSupportedModels.length === 0) {
        return fallbackModel;
    }

    for (const candidate of preferredModels) {
        if (normalizedSupportedModels.includes(candidate)) {
            return candidate;
        }
    }

    return normalizedSupportedModels[0] || fallbackModel;
}

function resolveClaudeTargetForCodex(model, supportedModels = []) {
    const canonicalCodexModel = getSupportedCodexClientModel(model);
    if (!canonicalCodexModel) {
        return null;
    }

    if (canonicalCodexModel === routingState.codexHighCapabilityModel) {
        return selectPreferredModel(
            supportedModels,
            routingState.claudeHighCapabilityPreferredModels,
            routingState.claudeHighCapabilityPreferredModels[0]
        );
    }

    return selectPreferredModel(
        supportedModels,
        routingState.claudeStandardPreferredModels,
        routingState.claudeStandardPreferredModels[0]
    );
}

export function normalizeRequestedModelForProtocol(protocol, model) {
    if (typeof model !== 'string') {
        return model;
    }

    const normalizedModel = model.trim();
    if (!normalizedModel) {
        return normalizedModel;
    }

    switch (protocol) {
        case MODEL_PROTOCOL_PREFIX.CLAUDE:
            return normalizeClaudeProtocolModel(normalizedModel);
        case MODEL_PROTOCOL_PREFIX.OPENAI:
        case MODEL_PROTOCOL_PREFIX.OPENAI_RESPONSES:
        case 'openai_responses':
        case MODEL_PROTOCOL_PREFIX.CODEX:
            return normalizeCodexProtocolModel(normalizedModel);
        default:
            return normalizedModel;
    }
}

function isAntigravityProviderType(providerType) {
    return providerType === MODEL_PROVIDER.ANTIGRAVITY ||
        (typeof providerType === 'string' && providerType.startsWith(`${MODEL_PROVIDER.ANTIGRAVITY}-`));
}

function isGeminiCliProviderType(providerType) {
    return providerType === MODEL_PROVIDER.GEMINI_CLI ||
        (typeof providerType === 'string' && providerType.startsWith(`${MODEL_PROVIDER.GEMINI_CLI}-`));
}

function isKiroProviderType(providerType) {
    return providerType === MODEL_PROVIDER.KIRO_API ||
        (typeof providerType === 'string' && providerType.startsWith(`${MODEL_PROVIDER.KIRO_API}-`));
}

function isCodexProviderType(providerType) {
    return providerType === MODEL_PROVIDER.CODEX_API ||
        (typeof providerType === 'string' && providerType.startsWith(`${MODEL_PROVIDER.CODEX_API}-`));
}

function isOpenAICustomProviderType(providerType) {
    return providerType === MODEL_PROVIDER.OPENAI_CUSTOM ||
        (typeof providerType === 'string' && providerType.startsWith(`${MODEL_PROVIDER.OPENAI_CUSTOM}-`));
}

function isOpenAIResponsesProviderType(providerType) {
    return providerType === MODEL_PROVIDER.OPENAI_CUSTOM_RESPONSES ||
        (typeof providerType === 'string' && providerType.startsWith(`${MODEL_PROVIDER.OPENAI_CUSTOM_RESPONSES}-`));
}

function isClaudeCustomProviderType(providerType) {
    return providerType === MODEL_PROVIDER.CLAUDE_CUSTOM ||
        (typeof providerType === 'string' && providerType.startsWith(`${MODEL_PROVIDER.CLAUDE_CUSTOM}-`));
}

function isGrokProviderType(providerType) {
    return providerType === MODEL_PROVIDER.GROK_CUSTOM ||
        (typeof providerType === 'string' && providerType.startsWith(`${MODEL_PROVIDER.GROK_CUSTOM}-`));
}

export function getManagedModelListProviderType(providerType) {
    return MANAGED_MODEL_LIST_PROVIDERS.find(baseType =>
        providerType === baseType || providerType.startsWith(baseType + '-')
    ) || null;
}

export function usesManagedModelList(providerType) {
    return getManagedModelListProviderType(providerType) !== null;
}

export function normalizeModelIds(models = []) {
    return [...new Set(
        (Array.isArray(models) ? models : [])
            .filter(model => typeof model === 'string')
            .map(model => model.trim())
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
}

export function getEquivalentProviderModelIds(providerType, model, supportedModels = []) {
    if (typeof model !== 'string') {
        return [];
    }

    const normalizedModel = model.trim();
    if (!normalizedModel) {
        return [];
    }

    const acceptableModelIds = new Set([normalizedModel]);

    if (isAntigravityProviderType(providerType)) {
        const canonicalModel = normalizeClaudeProviderModel(normalizedModel);
        acceptableModelIds.add(canonicalModel);
        const providerModel = normalizeRequestedModelForProvider(providerType, normalizedModel, supportedModels);
        acceptableModelIds.add(providerModel);
        const aliasConfig =
            routingState.antigravityModelAliasLookup[providerModel] ||
            routingState.antigravityModelAliasLookup[canonicalModel] ||
            routingState.antigravityModelAliasLookup[normalizedModel];
        if (aliasConfig) {
            aliasConfig.equivalents.forEach(modelId => acceptableModelIds.add(modelId));
        }
    } else if (isGeminiCliProviderType(providerType)) {
        const canonicalModel = normalizeClaudeProviderModel(normalizedModel);
        acceptableModelIds.add(canonicalModel);
        const canonicalCodexModel = getSupportedCodexClientModel(normalizedModel);
        if (canonicalCodexModel) {
            acceptableModelIds.add(canonicalCodexModel);
        }
        const providerModel = normalizeRequestedModelForProvider(providerType, normalizedModel, supportedModels);
        acceptableModelIds.add(providerModel);
    } else if (isKiroProviderType(providerType)) {
        const canonicalModel = normalizeClaudeProviderModel(normalizedModel);
        acceptableModelIds.add(canonicalModel);
        const canonicalCodexModel = getSupportedCodexClientModel(normalizedModel);
        if (canonicalCodexModel) {
            acceptableModelIds.add(canonicalCodexModel);
        }
        const providerModel = normalizeRequestedModelForProvider(providerType, normalizedModel, supportedModels);
        acceptableModelIds.add(providerModel);
    } else if (isCodexProviderType(providerType)) {
        const canonicalClaudeModel = normalizeClaudeProviderModel(normalizedModel);
        if (isClaudeFamilyModel(canonicalClaudeModel)) {
            acceptableModelIds.add(canonicalClaudeModel);
        }
        const canonicalModel = isClaudeFamilyModel(canonicalClaudeModel)
            ? canonicalClaudeModel
            : normalizeCodexProtocolModel(normalizedModel);
        acceptableModelIds.add(canonicalModel);
        const providerModel = normalizeRequestedModelForProvider(providerType, canonicalModel, supportedModels);
        acceptableModelIds.add(providerModel);
    } else if (isOpenAICustomProviderType(providerType) || isOpenAIResponsesProviderType(providerType)) {
        const canonicalClaudeModel = normalizeClaudeProviderModel(normalizedModel);
        if (isClaudeFamilyModel(canonicalClaudeModel)) {
            acceptableModelIds.add(canonicalClaudeModel);
        }
        const providerModel = normalizeRequestedModelForProvider(providerType, normalizedModel, supportedModels);
        acceptableModelIds.add(providerModel);
    } else if (isClaudeCustomProviderType(providerType)) {
        const canonicalClaudeModel = normalizeClaudeProviderModel(normalizedModel);
        if (isClaudeFamilyModel(canonicalClaudeModel)) {
            acceptableModelIds.add(canonicalClaudeModel);
        }
        const canonicalCodexModel = getSupportedCodexClientModel(normalizedModel);
        if (canonicalCodexModel) {
            acceptableModelIds.add(canonicalCodexModel);
        }
        const providerModel = normalizeRequestedModelForProvider(providerType, normalizedModel, supportedModels);
        acceptableModelIds.add(providerModel);
    } else if (isGrokProviderType(providerType)) {
        const canonicalClaudeModel = normalizeClaudeProviderModel(normalizedModel);
        if (isClaudeFamilyModel(canonicalClaudeModel)) {
            acceptableModelIds.add(canonicalClaudeModel);
        }
        const canonicalCodexModel = getSupportedCodexClientModel(normalizedModel);
        if (canonicalCodexModel) {
            acceptableModelIds.add(canonicalCodexModel);
        }
        const providerModel = normalizeRequestedModelForProvider(providerType, normalizedModel, supportedModels);
        acceptableModelIds.add(providerModel);
    }

    return normalizeModelIds([...acceptableModelIds]);
}

export function normalizeRequestedModelForProvider(providerType, model, supportedModels = []) {
    if (typeof model !== 'string') {
        return model;
    }

    const normalizedModel = model.trim();
    if (!normalizedModel) {
        return normalizedModel;
    }

    if (isAntigravityProviderType(providerType)) {
        const codexClaudeTarget = resolveClaudeTargetForCodex(normalizedModel);
        if (codexClaudeTarget) {
            return routingState.antigravityModelAliasLookup[codexClaudeTarget]?.internal || codexClaudeTarget;
        }

        const canonicalModel = normalizeClaudeProviderModel(normalizedModel);
        if (isClaudeOpusModel(canonicalModel)) {
            return routingState.antigravityModelAliasLookup[routingState.antigravityOpusModel]?.internal || canonicalModel;
        }
        if (isClaudeFamilyModel(canonicalModel)) {
            return routingState.antigravityModelAliasLookup[routingState.antigravitySonnetModel]?.internal || canonicalModel;
        }

        return routingState.antigravityModelAliasLookup[canonicalModel]?.internal ||
            routingState.antigravityModelAliasLookup[normalizedModel]?.internal ||
            normalizedModel;
    }

    if (isGeminiCliProviderType(providerType)) {
        const canonicalCodexModel = getSupportedCodexClientModel(normalizedModel);
        if (canonicalCodexModel) {
            return routingState.geminiUpstreamDefaultModel;
        }

        const canonicalModel = normalizeClaudeProviderModel(normalizedModel);
        if (isClaudeFamilyModel(canonicalModel)) {
            return routingState.geminiUpstreamDefaultModel;
        }
        return normalizedModel;
    }

    if (isKiroProviderType(providerType)) {
        const canonicalCodexModel = getSupportedCodexClientModel(normalizedModel);
        if (canonicalCodexModel) {
            return routingState.kiroUpstreamDefaultModel;
        }

        const canonicalModel = normalizeClaudeProviderModel(normalizedModel);
        if (isClaudeHaikuModel(canonicalModel)) {
            return routingState.kiroHaikuModel;
        }
        if (isClaudeFamilyModel(canonicalModel)) {
            return routingState.kiroUpstreamDefaultModel;
        }
        return normalizedModel;
    }

    if (isCodexProviderType(providerType)) {
        const canonicalClaudeModel = normalizeClaudeProviderModel(normalizedModel);
        if (isClaudeFamilyModel(canonicalClaudeModel)) {
            return routingState.openaiUpstreamDefaultModel;
        }
        return normalizeCodexProtocolModel(normalizedModel);
    }

    if (isOpenAICustomProviderType(providerType) || isOpenAIResponsesProviderType(providerType)) {
        const canonicalClaudeModel = normalizeClaudeProviderModel(normalizedModel);
        if (isClaudeFamilyModel(canonicalClaudeModel)) {
            return routingState.openaiUpstreamDefaultModel;
        }
        return normalizeCodexProtocolModel(normalizedModel);
    }

    if (isClaudeCustomProviderType(providerType)) {
        if (normalizedModel.toLowerCase().startsWith('claude-')) {
            return normalizedModel;
        }

        const codexClaudeTarget = resolveClaudeTargetForCodex(normalizedModel, supportedModels);
        if (codexClaudeTarget) {
            return codexClaudeTarget;
        }

        const canonicalClaudeModel = normalizeClaudeProviderModel(normalizedModel);
        if (isClaudeFamilyModel(canonicalClaudeModel)) {
            return canonicalClaudeModel;
        }

        return normalizedModel;
    }

    if (isGrokProviderType(providerType)) {
        if (PROVIDER_MODELS[MODEL_PROVIDER.GROK_CUSTOM].includes(normalizedModel)) {
            return normalizedModel;
        }

        const canonicalCodexModel = getSupportedCodexClientModel(normalizedModel);
        if (canonicalCodexModel) {
            return routingState.grokUpstreamDefaultModel;
        }

        const canonicalClaudeModel = normalizeClaudeProviderModel(normalizedModel);
        if (isClaudeFamilyModel(canonicalClaudeModel)) {
            return routingState.grokUpstreamDefaultModel;
        }

        return normalizedModel;
    }

    return normalizedModel;
}

export function toPublicProviderModelId(providerType, model) {
    if (typeof model !== 'string') {
        return model;
    }

    const normalizedModel = model.trim();
    if (!normalizedModel) {
        return normalizedModel;
    }

    if (isAntigravityProviderType(providerType)) {
        const canonicalModel = normalizeClaudeProviderModel(normalizedModel);
        return routingState.antigravityModelAliasLookup[canonicalModel]?.public ||
            routingState.antigravityModelAliasLookup[normalizedModel]?.public ||
            normalizedModel;
    }

    return normalizedModel;
}

export function toPublicProviderModelList(providerType, models = []) {
    return normalizeModelIds(
        (Array.isArray(models) ? models : []).map(model => toPublicProviderModelId(providerType, model))
    );
}

export function providerSupportsModel(providerType, requestedModel, supportedModels = []) {
    if (!requestedModel) {
        return true;
    }

    const normalizedSupportedModels = normalizeModelIds(supportedModels);
    if (normalizedSupportedModels.length === 0) {
        return true;
    }

    const acceptableModelIds = new Set(getEquivalentProviderModelIds(providerType, requestedModel, normalizedSupportedModels));
    return normalizedSupportedModels.some(modelId => acceptableModelIds.has(modelId));
}

function extractModelIdsFromListShape(modelList) {
    if (!modelList) {
        return [];
    }

    if (Array.isArray(modelList)) {
        return modelList.map(item => {
            if (typeof item === 'string') return item;
            return item?.id || item?.name || item?.model || null;
        }).filter(Boolean);
    }

    if (Array.isArray(modelList.data)) {
        return modelList.data.map(item => item?.id || item?.name || item?.model || null).filter(Boolean);
    }

    if (Array.isArray(modelList.models)) {
        return modelList.models.map(item => {
            if (typeof item === 'string') return item;
            return item?.id || item?.name || item?.model || null;
        }).filter(Boolean);
    }

    return [];
}

export function extractModelIdsFromNativeList(modelList, providerType) {
    let convertedModelList = modelList;

    // 只有在提供商类型与目标类型协议不同时才尝试转换
    if (providerType !== MODEL_PROVIDER.OPENAI_CUSTOM && !providerType.startsWith(MODEL_PROVIDER.OPENAI_CUSTOM + '-')) {
        try {
            convertedModelList = convertData(modelList, 'modelList', providerType, MODEL_PROVIDER.OPENAI_CUSTOM);
        } catch {
            convertedModelList = modelList;
        }
    }

    const convertedIds = normalizeModelIds(extractModelIdsFromListShape(convertedModelList));
    if (convertedIds.length > 0) {
        return convertedIds;
    }

    return normalizeModelIds(extractModelIdsFromListShape(modelList));
}

export function getConfiguredSupportedModels(providerType, providerConfig = {}) {
    if (!usesManagedModelList(providerType)) {
        return [];
    }

    return normalizeModelIds(providerConfig?.supportedModels);
}

/**
 * 获取指定提供商类型支持的模型列表
 * @param {string} providerType - 提供商类型
 * @returns {Array<string>} 模型列表
 */
export function getProviderModels(providerType) {
    if (PROVIDER_MODELS[providerType]) {
        return PROVIDER_MODELS[providerType];
    }

    // 尝试前缀匹配 (例如 openai-custom-1 -> openai-custom)
    for (const key of Object.keys(PROVIDER_MODELS)) {
        if (providerType.startsWith(key + '-')) {
            return PROVIDER_MODELS[key];
        }
    }

    return [];
}

/**
 * 获取所有提供商的模型列表
 * @returns {Object} 所有提供商的模型映射
 */
export function getAllProviderModels() {
    return PROVIDER_MODELS;
}
