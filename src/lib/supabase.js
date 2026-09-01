import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL);
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    throw new Error('Missing Supabase environment variables. Check your .env file.');
  }
}

// Migrate legacy sessionStorage token to localStorage if exists
if (typeof window !== 'undefined') {
  try {
    const legacySessionToken = window.sessionStorage.getItem('barba-crm-session-token');
    if (legacySessionToken && !window.localStorage.getItem('barba-crm-auth-token')) {
      window.localStorage.setItem('barba-crm-auth-token', legacySessionToken);
    }
  } catch (e) {}
}

const safeUrl = supabaseUrl || 'https://ddwyutisxymuvofkjhpz.supabase.co';
const safeKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'barba-crm-auth-token',
  },
  realtime: {
    // Disable realtime to prevent WebSocket DNS resolution hanging on init
    params: { eventsPerSecond: 10 },
    timeout: 4000,
  },
});
