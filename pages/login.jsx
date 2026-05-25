import LoginPage from '../src/components/auth/LoginPage';
import { useAuth } from '../src/hooks/useAuth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Login() {
  const { signIn, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.replace('/admin');
    }
  }, [session, router]);

  return <LoginPage onAuth={signIn} />;
}
