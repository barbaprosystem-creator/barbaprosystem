import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'barba-crm-auth-token', // Add custom storage key to prevent collisions and force fresh session
    // Bypass navigator.locks to prevent deadlocks (stuck loading spinner) in headless/multiple tab environments
    lock: async (name, acquireTimeout, fn) => {
      return await fn();
    },
  },
  realtime: {
    // Disable realtime to prevent WebSocket DNS resolution hanging on init
    params: { eventsPerSecond: 10 },
    timeout: 4000,
  },
});

