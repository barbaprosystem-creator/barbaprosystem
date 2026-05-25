import '../src/index.css';
import { AuthProvider, useAuth } from '../src/hooks/useAuth';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ErrorBoundary from '../src/components/common/ErrorBoundary';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

const PUBLIC_PATHS = ['/', '/login', '/catalog', '/privacy', '/terms', '/eula', '/contact'];
const PUBLIC_PREFIXES = ['/p/', '/contract/'];

function AuthGate({ Component, pageProps }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  const isPublic =
    PUBLIC_PATHS.includes(router.pathname) ||
    PUBLIC_PREFIXES.some((p) => router.pathname.startsWith(p));

  useEffect(() => {
    if (!loading && !session && !isPublic) {
      router.replace('/login');
    }
  }, [loading, session, isPublic, router]);

  const getLayout = Component.getLayout || ((page) => page);

  if (loading && !isPublic) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Cargando Barba Pro...</p>
      </div>
    );
  }

  return getLayout(<Component {...pageProps} />);
}

export default function MyApp({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={clientId}>
        <AuthProvider>
          <AuthGate Component={Component} pageProps={pageProps} />
        </AuthProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}
