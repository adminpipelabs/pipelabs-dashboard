/**
 * Safe caching of exchange metadata (NOT sensitive API keys)
 * Only caches exchange names, labels, and IDs - never credentials
 */

const CACHE_KEY_PREFIX = 'exchange_metadata_';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Cache exchange metadata for a client
 * @param {string} clientId - Client ID
 * @param {Array} exchanges - Array of {id, exchange, label} objects (NO credentials)
 */
export function cacheExchangeMetadata(clientId, exchanges) {
  try {
    const cacheData = {
      exchanges: exchanges.map(ex => ({
        id: ex.id,
        exchange: ex.exchange,
        label: ex.label || ex.exchange,
        // Explicitly exclude any credential fields
      })),
      timestamp: Date.now(),
    };
    
    localStorage.setItem(
      `${CACHE_KEY_PREFIX}${clientId}`,
      JSON.stringify(cacheData)
    );
  } catch (error) {
    console.warn('Failed to cache exchange metadata:', error);
  }
}

/**
 * Get cached exchange metadata for a client
 * @param {string} clientId - Client ID
 * @returns {Array|null} Cached exchanges or null if expired/not found
 */
export function getCachedExchangeMetadata(clientId) {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${clientId}`);
    if (!cached) return null;
    
    const cacheData = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;
    
    // Return null if cache expired
    if (age > CACHE_EXPIRY_MS) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${clientId}`);
      return null;
    }
    
    return cacheData.exchanges;
  } catch (error) {
    console.warn('Failed to read cached exchange metadata:', error);
    return null;
  }
}

/**
 * Clear cached exchange metadata for a client
 * @param {string} clientId - Client ID
 */
export function clearExchangeCache(clientId) {
  try {
    localStorage.removeItem(`${CACHE_KEY_PREFIX}${clientId}`);
  } catch (error) {
    console.warn('Failed to clear exchange cache:', error);
  }
}

/**
 * Clear all exchange metadata caches
 */
export function clearAllExchangeCaches() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear all exchange caches:', error);
  }
}
