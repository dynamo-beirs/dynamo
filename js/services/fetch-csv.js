/**
 * services/fetch-csv.js
 * Cached CSV fetcher with race-condition prevention, TTL-based invalidation,
 * and a multi-tiered caching strategy (L1 Memory -> L2 SessionStorage).
 */

/** L1 Cache: In-memory map for instant retrieval without JSON.parse overhead. */
const _memoryCache = new Map();

/** In-progress requests keyed by URL, prevents duplicate concurrent fetches. */
const activeFetches = new Map();

/** Cache time-to-live: 5 minutes in milliseconds. */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Fetches a CSV from `url`, returning a cached copy if one exists and is fresh.
 * Resolves via L1 (Memory) -> L2 (SessionStorage) -> L3 (Network).
 *
 * @param {string} url
 * @returns {Promise<string>} Raw CSV text
 */
export async function fetchCsvCached(url) {
    // 1. L1 Memory Cache: Fastest, no serialisation/parsing cost
    if (_memoryCache.has(url)) {
        return _memoryCache.get(url);
    }

    // 2. L2 SessionStorage: Fast, but requires JSON.parse
    const cachedItem = sessionStorage.getItem(url);
    if (cachedItem) {
        try {
            const { timestamp, data } = JSON.parse(cachedItem);
            if (Date.now() - timestamp < CACHE_TTL) {
                _memoryCache.set(url, data); // Promote to L1 memory cache
                return data;
            }
        } catch (e) {
            console.warn('Cache parse failed, fetching fresh data.');
        }
    }

    // 3. Prevent duplicate concurrent network requests
    if (activeFetches.has(url)) {
        return activeFetches.get(url);
    }

    // 4. L3 Network Fetch
    const fetchPromise = (async () => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const text = await res.text();

        // Store in L1 memory cache immediately
        _memoryCache.set(url, text);

        // Store in L2 sessionStorage
        try {
            sessionStorage.setItem(url, JSON.stringify({ timestamp: Date.now(), data: text }));
        } catch (e) {
            console.warn('SessionStorage full or unavailable — cache skipped.');
        }

        return text;
    })();

    activeFetches.set(url, fetchPromise);

    try {
        return await fetchPromise;
    } finally {
        activeFetches.delete(url);
    }
}