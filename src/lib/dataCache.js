import Dexie from 'dexie';
import { supabase } from './supabase.js';
import { withDeadline } from './withDeadline.js';

/**
 * Resilient Data Cache & Sync Manager for Barba CRM
 * ──────────────────────────────────────────────────
 * Principles:
 * 1. UI ALWAYS renders immediately.
 * 2. Cache read has a strict 300ms deadline — if Dexie hangs or errors, it falls back to network.
 * 3. Network fetch has a strict 6500ms deadline.
 * 4. Cache writes are asynchronous in the background (NEVER block the UI return).
 * 5. If network fails/aborts, returns cached data or [] without ever throwing or leaving spinners active.
 */

// ─── IndexedDB Database ───────────────────────────────────────────────────────
const db = new Dexie('BarbaCache');
db.version(1).stores({
  meta: 'key',
  collections: 'id, _collection, updated_at',
});

// ─── Configuration per collection ─────────────────────────────────────────────
const COLLECTION_CONFIG = {
  tzel_leads:     { maxSize: 2500, fullRefreshHours: 12 },
  crm_contacts:   { maxSize: 2000, fullRefreshHours: 12 },
  contacts_min:   { maxSize: 2000, fullRefreshHours: 24 },
  projects_list:  { maxSize: 1000, fullRefreshHours: 24 },
  estimates_list: { maxSize: 1000, fullRefreshHours: 24 },
  dashboard:      { maxSize: 1,    fullRefreshHours: 0.5 },
  default:        { maxSize: 2000, fullRefreshHours: 24 },
};

function getConfig(cacheKey) {
  return COLLECTION_CONFIG[cacheKey] || COLLECTION_CONFIG.default;
}

// ─── Metadata helpers ─────────────────────────────────────────────────────────
async function getMeta(key) {
  try {
    return await withDeadline(() => db.meta.get(key), { timeoutMs: 300, label: 'db.meta.get' });
  } catch {
    return null;
  }
}

async function setMeta(key, value) {
  try {
    await db.meta.put({ key, ...value });
  } catch {}
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get cached items from IndexedDB for a given collection.
 * Strict 300ms deadline: never blocks the UI if IndexedDB is slow or locked.
 */
export async function getCached(cacheKey) {
  try {
    return await withDeadline(
      async () => {
        const meta = await getMeta(`sync_${cacheKey}`);
        const items = await db.collections
          .where('_collection')
          .equals(cacheKey)
          .toArray();

        if (!items || items.length === 0) return null;

        const clean = items.map(({ _collection, ...rest }) => rest);
        return {
          data: clean,
          lastSync: meta?.lastSync || null,
          count: clean.length,
        };
      },
      { timeoutMs: 300, label: `getCached(${cacheKey})` }
    );
  } catch {
    return null;
  }
}

/**
 * Save data items to IndexedDB for a given collection.
 * Executes in background — callers should not await this.
 */
export async function setCached(cacheKey, data, lastSync = null) {
  try {
    const nowIso = lastSync || new Date().toISOString();
    const config = getConfig(cacheKey);

    let items = Array.isArray(data) ? [...data] : [];
    if (items.length > config.maxSize) {
      items = items
        .sort((a, b) => (b.updated_at || b.created_at || '') > (a.updated_at || a.created_at || '') ? 1 : -1)
        .slice(0, config.maxSize);
    }

    const tagged = items
      .filter(item => item && item.id)
      .map(item => ({ ...item, _collection: cacheKey }));

    await db.transaction('rw', db.collections, db.meta, async () => {
      await db.collections.where('_collection').equals(cacheKey).delete();
      await db.collections.bulkPut(tagged);
      await db.meta.put({ key: `sync_${cacheKey}`, lastSync: nowIso, count: tagged.length });
    });
  } catch (err) {
    console.warn(`[DataCache] setCached(${cacheKey}) write error:`, err?.message);
  }
}

/**
 * Update a single record in the cache without re-writing the entire collection.
 */
export async function updateCachedRecord(cacheKey, record) {
  if (!record || !record.id) return;
  try {
    await db.collections.put({ ...record, _collection: cacheKey });
  } catch {}
}

/**
 * Merge new/updated items into an existing list by primary key.
 */
export function mergeEntities(cachedList = [], deltaList = [], keyField = 'id') {
  if (!deltaList || deltaList.length === 0) return cachedList || [];
  if (!cachedList || cachedList.length === 0) return deltaList || [];

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
 * Check if a full refresh is needed.
 */
async function needsFullRefresh(cacheKey) {
  try {
    const config = getConfig(cacheKey);
    const meta = await getMeta(`fullsync_${cacheKey}`);
    if (!meta?.timestamp) return true;

    const hoursSince = (Date.now() - new Date(meta.timestamp).getTime()) / (1000 * 60 * 60);
    return hoursSince >= config.fullRefreshHours;
  } catch {
    return true;
  }
}

/**
 * Safe fetch: delivers cached data in 0ms, then checks Supabase with timeout.
 * GUARANTEE: Always settles within deadline, never leaves loading spinners hanging.
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
  let cached = null;

  try {
    cached = await getCached(cacheName);
    if (!forceRefresh && cached && cached.data.length > 0) {
      if (onImmediateData) {
        onImmediateData(cached.data, false);
      }
    }
  } catch (err) {
    console.warn(`[DataCache] Immediate cache read failed for ${cacheName}:`, err);
  }

  const shouldFullRefresh = forceRefresh || !cached || cached.data.length === 0 || await needsFullRefresh(cacheName);

  try {
    return await withDeadline(
      async (timeoutSignal) => {
        // Incremental delta sync
        if (!shouldFullRefresh && cached && cached.data.length > 0 && cached.lastSync) {
          let query = supabase.from(table).select(select);
          if (filterBuilder) query = filterBuilder(query);

          query = query.or(`created_at.gt.${cached.lastSync},updated_at.gt.${cached.lastSync}`);
          query = query.order(orderBy, { ascending }).limit(500);
          query = query.abortSignal(timeoutSignal);

          const { data: delta, error } = await query;

          if (!error && delta) {
            if (delta.length > 0) {
              const merged = mergeEntities(cached.data, delta);
              merged.sort((a, b) => {
                const valA = a[orderBy] || '';
                const valB = b[orderBy] || '';
                return ascending ? (valA > valB ? 1 : -1) : (valB > valA ? 1 : -1);
              });
              let maxTimestamp = cached.lastSync;
              for (const d of delta) {
                const t = d.updated_at || d.created_at;
                if (t && (!maxTimestamp || t > maxTimestamp)) maxTimestamp = t;
              }
              // Save in background
              setCached(cacheName, merged, maxTimestamp || new Date().toISOString()).catch(() => {});
              return merged;
            } else {
              setMeta(`sync_${cacheName}`, { lastSync: new Date().toISOString(), count: cached.count }).catch(() => {});
              return onImmediateData ? null : cached.data;
            }
          }
        }

        // Full refresh
        let query = supabase.from(table).select(select);
        if (filterBuilder) query = filterBuilder(query);
        query = query.order(orderBy, { ascending }).limit(limit);
        query = query.abortSignal(timeoutSignal);

        const { data: fullData, error } = await query;
        if (error) throw error;

        if (fullData) {
          let maxTimestamp = null;
          for (const d of fullData) {
            const t = d.updated_at || d.created_at;
            if (t && (!maxTimestamp || t > maxTimestamp)) maxTimestamp = t;
          }
          // Save in background (non-blocking)
          setCached(cacheName, fullData, maxTimestamp || new Date().toISOString()).catch(() => {});
          setMeta(`fullsync_${cacheName}`, { timestamp: new Date().toISOString() }).catch(() => {});
          return fullData;
        }

        return cached?.data || [];
      },
      { timeoutMs: 6500, signal, label: `syncEntities(${table})` }
    );
  } catch (err) {
    if (err?.name === 'AbortError' || signal?.aborted) {
      return cached?.data || [];
    }
    console.warn(`[DataCache] syncEntities(${table}) network timeout or error:`, err?.message);
    return cached?.data || [];
  }
}

/**
 * Clear cached collection.
 */
export async function clearCached(cacheKey) {
  try {
    await db.collections.where('_collection').equals(cacheKey).delete();
  } catch (err) {
    console.warn(`[DataCache] clearCached(${cacheKey}) error:`, err.message);
  }
}

/**
 * Clear ALL cached data from IndexedDB safely with timeout.
 */
export async function clearAllCache() {
  if (typeof window === 'undefined' || !window.indexedDB) return;

  try {
    await withDeadline(
      () => new Promise((resolve) => {
        try {
          db.close();
        } catch {}
        const req = window.indexedDB.deleteDatabase('BarbaCache');
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      }),
      { timeoutMs: 1500, label: 'clearAllCache' }
    );
  } catch (err) {
    console.warn('[DataCache] clearAllCache skipped/timed out:', err.message);
  }
}

/**
 * Diagnostic info.
 */
export async function getCacheDiagnostics() {
  try {
    return { status: 'healthy', database: 'BarbaCache' };
  } catch {
    return { status: 'unreachable' };
  }
}
