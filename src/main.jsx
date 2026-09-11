import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import { LanguageProvider } from './i18n/LanguageContext.jsx';

// DEV-only diagnostics (tree-shaken in production)
if (import.meta.env.DEV) {
  import('./lib/devDiagnostics.js');
}

import { clearAllCache } from './lib/dataCache';

// App Cache & Version Control
const APP_VERSION = '2026.09.11.v2';

// Version-aware cleanup — invalidate IndexedDB data caches, NEVER purge CacheStorage or auth
try {
  const currentStoredVersion = localStorage.getItem('barba_app_version');
  if (currentStoredVersion !== APP_VERSION) {
    console.log(`[App] New version detected (${currentStoredVersion} -> ${APP_VERSION}). Purging stale IndexedDB data caches...`);

    // Remove legacy session keys if present
    localStorage.removeItem('barba-crm-session-token');

    // Invalidate all IndexedDB collections asynchronously
    clearAllCache().catch(err => console.warn('[App] clearAllCache on version update error:', err));

    localStorage.setItem('barba_app_version', APP_VERSION);
  }
} catch (e) {
  console.warn('[App] Error in version cache cleanup:', e);
}

// Clean up any legacy service workers (one-time, harmless)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('[ServiceWorker] Unregistered legacy worker:', registration);
        }
      });
    }
  }).catch(() => {});
}

// Handle stale chunk errors after deploys — with anti-infinite-reload protection
try {
  sessionStorage.setItem('chunk-error-refreshed', 'false');
} catch (e) {}

// Vite preload error handler — catches dynamic import failures before ErrorBoundary
window.addEventListener('vite:preloadError', (event) => {
  try {
    const hasReloaded = sessionStorage.getItem('vite-preload-refreshed') === 'true';
    if (!hasReloaded) {
      event.preventDefault();
      sessionStorage.setItem('vite-preload-refreshed', 'true');
      console.warn('[Vite] Preload error detected. Reloading to fetch latest chunks...');
      window.location.reload();
    } else {
      console.error('[Vite] Preload error persists after reload. Allowing error boundary to catch it.');
    }
  } catch (e) {}
});

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <LanguageProvider>
      {clientId ? (
        <GoogleOAuthProvider clientId={clientId}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </GoogleOAuthProvider>
      ) : (
        <AuthProvider>
          <App />
        </AuthProvider>
      )}
    </LanguageProvider>
  </ErrorBoundary>,
)

