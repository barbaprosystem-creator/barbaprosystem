import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import { LanguageProvider } from './i18n/LanguageContext.jsx';

// App Cache & Version Control
const APP_VERSION = '2026.09.01.v1';

// Automatic cache & storage cleanup on version mismatch
try {
  const currentStoredVersion = localStorage.getItem('barba_app_version');
  if (currentStoredVersion !== APP_VERSION) {
    console.log(`[App] New version detected (${currentStoredVersion} -> ${APP_VERSION}). Purging stale caches & legacy storage...`);
    
    // Clear stale data caches on version bump while preserving active auth token
    localStorage.removeItem('barba-crm-session-token');

    // Clear stale cached profiles
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('barba_profile_')) {
        localStorage.removeItem(key);
      }
    });

    // Clear CacheStorage
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      }).catch(() => {});
    }

    localStorage.setItem('barba_app_version', APP_VERSION);
  }
} catch (e) {
  console.warn('[App] Error in version cache cleanup:', e);
}

// Clean up any legacy service workers and caches that might be aggressively caching index.html or API responses
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('[ServiceWorker] Unregistered legacy worker:', registration);
        }
      });
    }
  }).catch((err) => {
    console.error('[ServiceWorker] Error checking registrations:', err);
  });
}

// Reset chunk error refresh flag on successful app initialization
try {
  sessionStorage.setItem('chunk-error-refreshed', 'false');
} catch (e) {}

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')).render(
  <StrictMode>
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
    </ErrorBoundary>
  </StrictMode>,
)

