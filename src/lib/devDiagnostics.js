/**
 * Development Diagnostics for Barba CRM
 * ──────────────────────────────────────
 * Only active when import.meta.env.DEV === true
 * Provides cache size, request counts, and sync duration metrics.
 * 
 * Usage in browser console:
 *   window.__barba_diag()     → full diagnostic report
 *   window.__barba_cache()    → cache sizes only
 */

import { getCacheDiagnostics } from './dataCache';

const IS_DEV = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

// Request counter
let requestCount = 0;
let syncDurations = [];

export function trackRequest() {
  if (!IS_DEV) return;
  requestCount++;
}

export function trackSyncDuration(table, durationMs) {
  if (!IS_DEV) return;
  syncDurations.push({ table, durationMs, at: new Date().toISOString() });
  if (syncDurations.length > 100) syncDurations = syncDurations.slice(-50);
}

async function runDiagnostics() {
  const cacheDiag = await getCacheDiagnostics();
  
  // localStorage usage
  let lsSize = 0;
  let lsKeys = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const val = localStorage.getItem(key);
      const bytes = (key.length + (val?.length || 0)) * 2; // UTF-16
      lsSize += bytes;
      if (key.startsWith('barba')) {
        lsKeys.push({ key, bytes });
      }
    }
  } catch {}

  // sessionStorage usage
  let ssSize = 0;
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      const val = sessionStorage.getItem(key);
      ssSize += (key.length + (val?.length || 0)) * 2;
    }
  } catch {}

  const report = {
    '🗄️ IndexedDB': cacheDiag,
    '📦 localStorage': { 
      totalBytes: lsSize, 
      totalKB: (lsSize / 1024).toFixed(1) + ' KB',
      barbaKeys: lsKeys 
    },
    '📦 sessionStorage': { 
      totalBytes: ssSize, 
      totalKB: (ssSize / 1024).toFixed(1) + ' KB' 
    },
    '🌐 Requests': { count: requestCount },
    '⏱️ Sync Durations': syncDurations.slice(-10),
  };

  console.table(cacheDiag.collections);
  console.log('[Barba Diagnostics]', report);
  return report;
}

// Expose to console in DEV
if (IS_DEV && typeof window !== 'undefined') {
  window.__barba_diag = runDiagnostics;
  window.__barba_cache = async () => {
    const d = await getCacheDiagnostics();
    console.table(d.collections);
    console.log('Total records in IndexedDB:', d.totalRecords);
    return d;
  };
}

export default { trackRequest, trackSyncDuration };
