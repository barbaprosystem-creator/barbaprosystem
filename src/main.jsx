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

