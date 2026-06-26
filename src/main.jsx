import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import { LanguageProvider } from './i18n/LanguageContext.jsx';

// Clean up any legacy service workers that might be aggressively caching index.html or API responses
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

// Intercept all GET fetch requests to Supabase or the local API to prevent browser caching
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : (input && input.url ? input.url : ''));
  const method = (init && init.method) ? init.method.toUpperCase() : 'GET';
  
  if (method === 'GET' && (url.includes('/api/') || url.includes('.supabase.co'))) {
    init = init || {};
    init.cache = 'no-store';
  }
  return originalFetch(input, init);
};

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <GoogleOAuthProvider clientId={clientId}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </GoogleOAuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
)

