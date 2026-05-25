import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import { LanguageProvider } from './i18n/LanguageContext.jsx';

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

