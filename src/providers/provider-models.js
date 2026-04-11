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

const CLAUDE_PROTOCOL_MODEL_ALIASES = {
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
};

const CLAUDE_PROVIDER_MODEL_ALIASES = {
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
};

const CODEX_PROTOCOL_MODEL_ALIASES = {
    'gpt-5.3-codex': [
        'gpt-5.3-codex',
        'gpt-5.3-codex (default)'
    ],
    'gpt-5.4': [
        'gpt-5.4',
        'gpt-5.4 (current)'
    ]
};

const OPENAI_UPSTREAM_DEFAULT_MODEL = 'gpt-5.4';
const GEMINI_UPSTREAM_DEFAULT_MODEL = 'gemini-3.1-pro-preview';
const KIRO_UPSTREAM_DEFAULT_MODEL = 'claude-sonnet-4-5';
const GROK_UPSTREAM_DEFAULT_MODEL = 'grok-4.20';
const CODEX_HIGH_CAPABILITY_MODEL = 'gpt-5.4';
const SUPPORTED_CODEX_CLIENT_MODELS = new Set([
    'gpt-5.3-codex',
    'gpt-5.4'
]);
const CLAUDE_OPUS_MODEL_PREFERENCES = [
    'claude-opus-4-6',
    'claude-opus-4-5-20251101',
    'claude-opus-4-5'
];
const CLAUDE_SONNET_MODEL_PREFERENCES = [
    'claude-sonnet-4-6',
    'claude-sonnet-4-5-20250929',
    'claude-sonnet-4-5',
    'claude-sonnet-4-20250514',
    'claude-3-7-sonnet-20250219'
];

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

const CLAUDE_PROTOCOL_MODEL_ALIAS_LOOKUP = createAliasLookup(CLAUDE_PROTOCOL_MODEL_ALIASES);
const CLAUDE_PROVIDER_MODEL_ALIAS_LOOKUP = createAliasLookup(CLAUDE_PROVIDER_MODEL_ALIASES);
const CODEX_PROTOCOL_MODEL_ALIAS_LOOKUP = createAliasLookup(CODEX_PROTOCOL_MODEL_ALIASES);

function normalizeClaudeProtocolModel(model) {
    const normalizedModel = typeof model === 'string' ? model.trim() : model;
    if (typeof normalizedModel !== 'string' || !normalizedModel) {
        return normalizedModel;
    }

    return CLAUDE_PROTOCOL_MODEL_ALIAS_LOOKUP[normalizeAliasLookupKey(normalizedModel)] || normalizedModel;
}

function normalizeClaudeProviderModel(model) {
    const normalizedModel = typeof model === 'string' ? model.trim() : model;
    if (typeof normalizedModel !== 'string' || !normalizedModel) {
        return normalizedModel;
    }

    return CLAUDE_PROVIDER_MODEL_ALIAS_LOOKUP[normalizeAliasLookupKey(normalizedModel)] || normalizedModel;
}

function normalizeCodexProtocolModel(model) {
    const normalizedModel = typeof model === 'string' ? model.trim() : model;
    if (typeof normalizedModel !== 'string' || !normalizedModel) {
        return normalizedModel;
    }

    return CODEX_PROTOCOL_MODEL_ALIAS_LOOKUP[normalizeAliasLookupKey(normalizedModel)] || normalizedModel;
}

function getSupportedCodexClientModel(model) {
    const canonicalModel = normalizeCodexProtocolModel(model);
    return SUPPORTED_CODEX_CLIENT_MODELS.has(canonicalModel) ? canonicalModel : null;
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

    if (canonicalCodexModel === CODEX_HIGH_CAPABILITY_MODEL) {
        return selectPreferredModel(
            supportedModels,
            [...CLAUDE_OPUS_MODEL_PREFERENCES, ...CLAUDE_SONNET_MODEL_PREFERENCES],
            CLAUDE_OPUS_MODEL_PREFERENCES[0]
        );
    }

    return selectPreferredModel(
        supportedModels,
        CLAUDE_SONNET_MODEL_PREFERENCES,
        CLAUDE_SONNET_MODEL_PREFERENCES[0]
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

const ANTIGRAVITY_MODEL_ALIASES = {
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
};

const ANTIGRAVITY_MODEL_ALIAS_LOOKUP = Object.values(ANTIGRAVITY_MODEL_ALIASES).reduce((lookup, aliasConfig) => {
    aliasConfig.equivalents.forEach(modelId => {
        lookup[modelId] = aliasConfig;
    });
    return lookup;
}, {});

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
            ANTIGRAVITY_MODEL_ALIAS_LOOKUP[providerModel] ||
            ANTIGRAVITY_MODEL_ALIAS_LOOKUP[canonicalModel] ||
            ANTIGRAVITY_MODEL_ALIAS_LOOKUP[normalizedModel];
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
            return ANTIGRAVITY_MODEL_ALIAS_LOOKUP[codexClaudeTarget]?.internal || codexClaudeTarget;
        }

        const canonicalModel = normalizeClaudeProviderModel(normalizedModel);
        if (isClaudeOpusModel(canonicalModel)) {
            return ANTIGRAVITY_MODEL_ALIAS_LOOKUP['claude-opus-4-6']?.internal || canonicalModel;
        }
        if (isClaudeFamilyModel(canonicalModel)) {
            return ANTIGRAVITY_MODEL_ALIAS_LOOKUP['claude-sonnet-4-6']?.internal || canonicalModel;
        }

        return ANTIGRAVITY_MODEL_ALIAS_LOOKUP[canonicalModel]?.internal ||
            ANTIGRAVITY_MODEL_ALIAS_LOOKUP[normalizedModel]?.internal ||
            normalizedModel;
    }

    if (isGeminiCliProviderType(providerType)) {
        const canonicalCodexModel = getSupportedCodexClientModel(normalizedModel);
        if (canonicalCodexModel) {
            return GEMINI_UPSTREAM_DEFAULT_MODEL;
        }

        const canonicalModel = normalizeClaudeProviderModel(normalizedModel);
        if (isClaudeFamilyModel(canonicalModel)) {
            return GEMINI_UPSTREAM_DEFAULT_MODEL;
        }
        return normalizedModel;
    }

    if (isKiroProviderType(providerType)) {
        const canonicalCodexModel = getSupportedCodexClientModel(normalizedModel);
        if (canonicalCodexModel) {
            return KIRO_UPSTREAM_DEFAULT_MODEL;
        }

        const canonicalModel = normalizeClaudeProviderModel(normalizedModel);
        if (isClaudeHaikuModel(canonicalModel)) {
            return 'claude-haiku-4-5';
        }
        if (isClaudeFamilyModel(canonicalModel)) {
            return KIRO_UPSTREAM_DEFAULT_MODEL;
        }
        return normalizedModel;
    }

    if (isCodexProviderType(providerType)) {
        const canonicalClaudeModel = normalizeClaudeProviderModel(normalizedModel);
        if (isClaudeFamilyModel(canonicalClaudeModel)) {
            return OPENAI_UPSTREAM_DEFAULT_MODEL;
        }
        return normalizeCodexProtocolModel(normalizedModel);
    }

    if (isOpenAICustomProviderType(providerType) || isOpenAIResponsesProviderType(providerType)) {
        const canonicalClaudeModel = normalizeClaudeProviderModel(normalizedModel);
        if (isClaudeFamilyModel(canonicalClaudeModel)) {
            return OPENAI_UPSTREAM_DEFAULT_MODEL;
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
            return GROK_UPSTREAM_DEFAULT_MODEL;
        }

        const canonicalClaudeModel = normalizeClaudeProviderModel(normalizedModel);
        if (isClaudeFamilyModel(canonicalClaudeModel)) {
            return GROK_UPSTREAM_DEFAULT_MODEL;
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
        return ANTIGRAVITY_MODEL_ALIAS_LOOKUP[canonicalModel]?.public ||
            ANTIGRAVITY_MODEL_ALIAS_LOOKUP[normalizedModel]?.public ||
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
