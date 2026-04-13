import * as fs from 'fs';
import logger from './logger.js';

function hasConfiguredProviders(providerPools = {}) {
    return Object.values(providerPools || {}).some(providers => Array.isArray(providers) && providers.length > 0);
}

export function shouldRecoverProviderPoolsOnStartup(config = {}) {
    if (hasConfiguredProviders(config.providerPools)) {
        return false;
    }

    const filePath = config.PROVIDER_POOLS_FILE_PATH || 'configs/provider_pools.json';
    if (!filePath || !fs.existsSync(filePath)) {
        return true;
    }

    try {
        const poolsData = fs.readFileSync(filePath, 'utf8').trim();
        if (!poolsData) {
            return true;
        }

        return !hasConfiguredProviders(JSON.parse(poolsData));
    } catch (error) {
        logger.warn(`[Initialization] Failed to inspect provider pools file ${filePath}: ${error.message}`);
        return true;
    }
}
