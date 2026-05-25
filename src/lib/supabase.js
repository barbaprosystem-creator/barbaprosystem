import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env.VITE_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : '') ||
  '';

const supabaseAnonKey =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env.VITE_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY : '') ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'barba-crm-auth-token', // Add custom storage key to prevent collisions and force fresh session
  },
  realtime: {
    // Disable realtime to prevent WebSocket DNS resolution hanging on init
    params: { eventsPerSecond: 10 },
    timeout: 4000,
  },
});
