/**
 * services/fetch-csv.js — Cached CSV fetcher
 *
 * Provides a cached CSV fetching utility with multi-tier caching:
 * L1 (in-memory) → L2 (sessionStorage) → L3 (network).
 * Prevents duplicate concurrent requests and includes TTL-based invalidation.
 */

/* Constants */

const _memoryCache = new Map();
const activeFetches = new Map();
const CACHE_TTL = 5 * 60 * 1000;

/* Cached CSV Fetcher */

export async function fetchCsvCached(url) {
    // L1: Memory cache (fastest)
    if (_memoryCache.has(url)) {
        return _memoryCache.get(url);
    }

    // L2: SessionStorage cache
    const cachedItem = sessionStorage.getItem(url);
    if (cachedItem) {
        try {
            const { timestamp, data } = JSON.parse(cachedItem);
            if (Date.now() - timestamp < CACHE_TTL) {
                _memoryCache.set(url, data); // Promote to L1
                return data;
            }
        } catch (e) {
            console.warn('Cache parse failed, fetching fresh data.');
        }
    }

    // Prevent duplicate concurrent fetches
    if (activeFetches.has(url)) {
        return activeFetches.get(url);
    }

    // Network fetch (L3)
    const fetchPromise = (async () => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const text = await res.text();

        // Store in L1 memory cache
        _memoryCache.set(url, text);

        // Store in L2 sessionStorage
        try {
            sessionStorage.setItem(url, JSON.stringify({
                timestamp: Date.now(),
                data: text
            }));
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