import Dexie from 'dexie';
import { supabase } from './supabase.js';

/**
 * Smart Data Cache & Incremental Sync Manager for Barba CRM
 * ─────────────────────────────────────────────────────────
 * Architecture: Supabase → incremental delta → IndexedDB → React state
 *
 * Key properties:
 * • 0ms instantaneous UI loads from IndexedDB (async, non-blocking)
 * • Background delta syncs via updated_at filter
 * • Full refresh every 24h to purge ghost records (deleted in Supabase)
 * • Per-collection version & size limits
 * • NO localStorage for large datasets (prevents main-thread freezes)
 */

// ─── IndexedDB Database ───────────────────────────────────────────────────────
const CACHE_VERSION = 2; // Bump this when schema changes to force re-sync

const db = new Dexie('BarbaCache');
db.version(CACHE_VERSION).stores({
  // Generic key-value metadata store
  meta: 'key',
  // Data collections — indexed by id for fast single-record updates
  collections: 'id, _collection, updated_at',
});

// ─── Configuration per collection ─────────────────────────────────────────────
const COLLECTION_CONFIG = {
  tzel_leads:     { maxSize: 2000, fullRefreshHours: 12 },
  contacts_min:   { maxSize: 2000, fullRefreshHours: 24 },
  projects_list:  { maxSize: 1000, fullRefreshHours: 24 },
  estimates_list: { maxSize: 1000, fullRefreshHours: 24 },
  dashboard:      { maxSize: 1,    fullRefreshHours: 0.5 }, // 30 min
  default:        { maxSize: 2000, fullRefreshHours: 24 },
};

function getConfig(cacheKey) {
  return COLLECTION_CONFIG[cacheKey] || COLLECTION_CONFIG.default;
}

// ─── Metadata helpers ─────────────────────────────────────────────────────────
async function getMeta(key) {
  try {
    return await db.meta.get(key);
  } catch {
    return null;
  }
}

async function setMeta(key, value) {
  try {
    await db.meta.put({ key, ...value });
  } catch (err) {
    console.warn('[DataCache] Meta write error:', err.message);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get cached items from IndexedDB for a given collection.
 * Returns { data: [], lastSync: string|null, count: number } or null.
 */
export async function getCached(cacheKey) {
  try {
    const meta = await getMeta(`sync_${cacheKey}`);
    const items = await db.collections
      .where('_collection')
      .equals(cacheKey)
      .toArray();

    if (!items || items.length === 0) return null;

    // Strip internal _collection field from returned data
    const clean = items.map(({ _collection, ...rest }) => rest);

    return {
      data: clean,
      lastSync: meta?.lastSync || null,
      count: clean.length,
    };
  } catch (err) {
    console.warn(`[DataCache] getCached(${cacheKey}) error:`, err.message);
    return null;
  }
}

/**
 * Save data items to IndexedDB for a given collection.
 * Uses bulk put for efficiency — each record is stored individually.
 */
export async function setCached(cacheKey, data, lastSync = null) {
  try {
    const nowIso = lastSync || new Date().toISOString();
    const config = getConfig(cacheKey);

    // Enforce max size — keep newest records by updated_at or created_at
    let items = Array.isArray(data) ? data : [];
    if (items.length > config.maxSize) {
      items = items
        .sort((a, b) => (b.updated_at || b.created_at || '') > (a.updated_at || a.created_at || '') ? 1 : -1)
        .slice(0, config.maxSize);
      console.warn(`[DataCache] ${cacheKey}: truncated from ${data.length} to ${config.maxSize} records`);
    }

    // Tag each item with _collection for querying, and ensure 'id' exists
    const tagged = items
      .filter(item => item && item.id)
      .map(item => ({ ...item, _collection: cacheKey }));

    // Clear old collection data and write new in a transaction
    await db.transaction('rw', db.collections, db.meta, async () => {
      await db.collections.where('_collection').equals(cacheKey).delete();
      await db.collections.bulkPut(tagged);
      await db.meta.put({ key: `sync_${cacheKey}`, lastSync: nowIso, count: tagged.length });
    });
  } catch (err) {
    console.warn(`[DataCache] setCached(${cacheKey}) error:`, err.message);
  }
}

/**
 * Update a single record in the cache without re-writing the entire collection.
 * This is the key performance improvement over the old localStorage approach.
 */
export async function updateCachedRecord(cacheKey, record) {
  if (!record || !record.id) return;
  try {
    await db.collections.put({ ...record, _collection: cacheKey });
  } catch (err) {
    console.warn(`[DataCache] updateCachedRecord(${cacheKey}) error:`, err.message);
  }
}

/**
 * Merge new/updated items into an existing list by primary key.
 * Pure function, no side effects — used internally by syncEntities.
 */
export function mergeEntities(cachedList = [], deltaList = [], keyField = 'id') {
  if (!deltaList || deltaList.length === 0) return cachedList;
  if (!cachedList || cachedList.length === 0) return deltaList;

  const map = new Map();
  for (const item of cachedList) {
    if (item && item[keyField]) map.set(item[keyField], item);
  }
  for (const delta of deltaList) {
    if (delta && delta[keyField]) map.set(delta[keyField], delta);
  }
  return Array.from(map.values());
}

/**
 * Check if a full refresh is needed (based on time since last full sync).
 */
async function needsFullRefresh(cacheKey) {
  const config = getConfig(cacheKey);
  const meta = await getMeta(`fullsync_${cacheKey}`);
  if (!meta?.timestamp) return true;

  const hoursSince = (Date.now() - new Date(meta.timestamp).getTime()) / (1000 * 60 * 60);
  return hoursSince >= config.fullRefreshHours;
}

/**
 * Intelligent fetch: delivers cached data in 0ms, then checks Supabase for deltas in background.
 * Full refresh is triggered periodically to purge ghost records (deleted in Supabase).
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
  const cached = await getCached(cacheName);

  // 1. Deliver cached data immediately (0ms from IndexedDB)
  if (!forceRefresh && cached && cached.data.length > 0) {
    if (onImmediateData) {
      onImmediateData(cached.data, false);
    }
  }

  // 2. Determine if we need a full refresh or incremental sync
  const shouldFullRefresh = forceRefresh || !cached || cached.data.length === 0 || await needsFullRefresh(cacheName);

  try {
    if (!shouldFullRefresh && cached && cached.data.length > 0 && cached.lastSync) {
      // ─── Incremental delta sync ───
      let query = supabase.from(table).select(select);
      if (filterBuilder) query = filterBuilder(query);

      query = query.or(`created_at.gt.${cached.lastSync},updated_at.gt.${cached.lastSync}`);
      query = query.order(orderBy, { ascending }).limit(500);
      if (signal) query = query.abortSignal(signal);

      const { data: delta, error } = await query;

      if (!error && delta) {
        if (delta.length > 0) {
          console.log(`[DataCache] Incremental sync for ${table}: merged ${delta.length} changes`);
          const merged = mergeEntities(cached.data, delta);
          merged.sort((a, b) => {
            const valA = a[orderBy] || '';
            const valB = b[orderBy] || '';
            return ascending ? (valA > valB ? 1 : -1) : (valB > valA ? 1 : -1);
          });
          await setCached(cacheName, merged);
          return merged;
        } else {
          // No changes — touch lastSync
          await setMeta(`sync_${cacheName}`, { lastSync: new Date().toISOString(), count: cached.count });
          return cached.data;
        }
      }
    }

    // ─── Full refresh ───
    let query = supabase.from(table).select(select);
    if (filterBuilder) query = filterBuilder(query);
    query = query.order(orderBy, { ascending }).limit(limit);
    if (signal) query = query.abortSignal(signal);

    const { data: fullData, error } = await query;
    if (error) throw error;

    if (fullData) {
      await setCached(cacheName, fullData);
      await setMeta(`fullsync_${cacheName}`, { timestamp: new Date().toISOString() });
      return fullData;
    }

    return cached?.data || [];
  } catch (err) {
    if (err.name === 'AbortError') return cached?.data || [];
    console.warn(`[DataCache] Background sync warning on ${table}:`, err.message);
    return cached?.data || [];
  }
}

/**
 * Clear all cached data for a specific collection.
 */
export async function clearCached(cacheKey) {
  try {
    await db.collections.where('_collection').equals(cacheKey).delete();
    await db.meta.delete(`sync_${cacheKey}`);
    await db.meta.delete(`fullsync_${cacheKey}`);
  } catch (err) {
    console.warn(`[DataCache] clearCached(${cacheKey}) error:`, err.message);
  }
}

/**
 * Get diagnostic info about all cached collections (DEV only).
 */
export async function getCacheDiagnostics() {
  try {
    const allMeta = await db.meta.toArray();
    const counts = {};
    for (const m of allMeta) {
      if (m.key.startsWith('sync_')) {
        const name = m.key.replace('sync_', '');
        counts[name] = { count: m.count, lastSync: m.lastSync };
      }
    }
    const totalRecords = await db.collections.count();
    return { collections: counts, totalRecords };
  } catch {
    return { collections: {}, totalRecords: 0 };
  }
}

// ─── Migration: import old localStorage caches into IndexedDB (one-time) ──────
async function migrateFromLocalStorage() {
  const migrated = await getMeta('ls_migration_done');
  if (migrated) return;

  const STORAGE_PREFIX = 'barba_cache_';
  const SYNC_TIME_PREFIX = 'barba_last_sync_';
  let migratedCount = 0;

  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
    for (const key of keys) {
      const cacheKey = key.replace(STORAGE_PREFIX, '');
      const raw = localStorage.getItem(key);
      const lastSync = localStorage.getItem(`${SYNC_TIME_PREFIX}${cacheKey}`);
      if (!raw) continue;

      try {
        const data = JSON.parse(raw);
        if (Array.isArray(data) && data.length > 0) {
          await setCached(cacheKey, data, lastSync || null);
          migratedCount++;
        }
      } catch {}

      // Clean up localStorage
      localStorage.removeItem(key);
      localStorage.removeItem(`${SYNC_TIME_PREFIX}${cacheKey}`);
    }

    // Also clean from sessionStorage
    Object.keys(sessionStorage).forEach(k => {
      if (k.startsWith(STORAGE_PREFIX) || k.startsWith(SYNC_TIME_PREFIX)) {
        sessionStorage.removeItem(k);
      }
    });

    await setMeta('ls_migration_done', { timestamp: new Date().toISOString() });
    if (migratedCount > 0) {
      console.log(`[DataCache] Migrated ${migratedCount} collections from localStorage to IndexedDB`);
    }
  } catch (err) {
    console.warn('[DataCache] localStorage migration error:', err.message);
  }
}

// Run migration on module load (async, non-blocking)
migrateFromLocalStorage();
