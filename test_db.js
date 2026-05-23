import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://jysjngixxomludovxebh.supabase.co', // Fallback to assumed url if needed, wait, I can read the env vars
  process.env.VITE_SUPABASE_ANON_KEY || 'fake_key'
);

// I don't have the anon key easily without reading .env
