import { supabase } from './supabase.js';

/**
 * Smart Data Cache & Incremental Sync Manager for Barba CRM
 * Enables 0ms instantaneous UI loads with intelligent background delta syncs.
 */

const STORAGE_PREFIX = 'barba_cache_';
const SYNC_TIME_PREFIX = 'barba_last_sync_';

/**
 * Get cached items from local storage
 */
export function getCached(key) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`) || sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
    const lastSync = localStorage.getItem(`${SYNC_TIME_PREFIX}${key}`) || sessionStorage.getItem(`${SYNC_TIME_PREFIX}${key}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      data: Array.isArray(data) ? data : [],
      lastSync: lastSync || null,
      count: Array.isArray(data) ? data.length : 0
    };
  } catch (err) {
    console.warn(`[DataCache] Error reading ${key}:`, err);
    return null;
  }
}

/**
 * Save data items to local storage
 */
export function setCached(key, data, lastSync = null) {
  if (typeof window === 'undefined') return;
  try {
    const nowIso = lastSync || new Date().toISOString();
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
    localStorage.setItem(`${SYNC_TIME_PREFIX}${key}`, nowIso);
    // Mirror in sessionStorage for fallback
    sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
    sessionStorage.setItem(`${SYNC_TIME_PREFIX}${key}`, nowIso);
  } catch (err) {
    console.warn(`[DataCache] Storage quota exceeded or error on ${key}:`, err);
    try {
      // If localStorage is full, save in sessionStorage
      sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
    } catch (_) {}
  }
}

/**
 * Merge new/updated items into an existing list by primary key
 */
export function mergeEntities(cachedList = [], deltaList = [], keyField = 'id') {
  if (!deltaList || deltaList.length === 0) return cachedList;
  if (!cachedList || cachedList.length === 0) return deltaList;

  const map = new Map();
  // Put existing
  for (const item of cachedList) {
    if (item && item[keyField]) {
      map.set(item[keyField], item);
    }
  }
  // Upsert delta
  for (const delta of deltaList) {
    if (delta && delta[keyField]) {
      map.set(delta[keyField], delta);
    }
  }

  return Array.from(map.values());
}

/**
 * Intelligent fetch: delivers cached data in 0ms, then checks Supabase only for deltas in the background
 */
export async function syncEntities({
  table,
  cacheKey,
  select = '*',
  orderBy = 'created_at',
  ascending = false,
  limit = 2000,
  filterBuilder = null,
  forceRefresh = false,
  onImmediateData = null,
  signal = null
}) {
  const cacheName = cacheKey || table;
  const cached = getCached(cacheName);

  // 1. Deliver cached data immediately (0ms)
  if (!forceRefresh && cached && cached.data.length > 0) {
    if (onImmediateData) {
      onImmediateData(cached.data, false);
    }
  }

  // 2. Perform background sync
  try {
    // If we have cached data and lastSync, query only modified/new records
    if (!forceRefresh && cached && cached.data.length > 0 && cached.lastSync) {
      let query = supabase.from(table).select(select);

      if (filterBuilder) {
        query = filterBuilder(query);
      }

      // Query records created or updated after lastSync
      query = query.or(`created_at.gt.${cached.lastSync},updated_at.gt.${cached.lastSync}`);
      query = query.order(orderBy, { ascending }).limit(500);

      if (signal) {
        query = query.abortSignal(signal);
      }

      const { data: delta, error } = await query;

      if (!error && delta) {
        if (delta.length > 0) {
          console.log(`[DataCache] Incremental sync for ${table}: merged ${delta.length} changes`);
          const merged = mergeEntities(cached.data, delta);
          // Sort merged result
          merged.sort((a, b) => {
            const valA = a[orderBy] || 0;
            const valB = b[orderBy] || 0;
            return ascending ? (valA > valB ? 1 : -1) : (valB > valA ? 1 : -1);
          });
          setCached(cacheName, merged);
          return merged;
        } else {
          // No changes found, touch lastSync timestamp
          setCached(cacheName, cached.data);
          return cached.data;
        }
      }
    }

    // 3. Fallback to full fetch if no cache or force refresh
    let query = supabase.from(table).select(select);
    if (filterBuilder) {
      query = filterBuilder(query);
    }
    query = query.order(orderBy, { ascending }).limit(limit);

    if (signal) {
      query = query.abortSignal(signal);
    }

    const { data: fullData, error } = await query;
    if (error) throw error;

    if (fullData) {
      setCached(cacheName, fullData);
      return fullData;
    }

    return cached?.data || [];
  } catch (err) {
    if (err.name === 'AbortError') return cached?.data || [];
    console.warn(`[DataCache] Background sync warning on ${table}:`, err.message);
    return cached?.data || [];
  }
}
