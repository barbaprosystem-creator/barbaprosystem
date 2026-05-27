import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://example.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3MjUwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.signature');

try {
  const query = supabase.from('profiles').select('*').eq('id', '123').single();
  console.log("query methods:", Object.keys(query).filter(m => m.toLowerCase().includes('abort') || m.toLowerCase().includes('signal')));
  console.log("abortSignal exists:", typeof query.abortSignal);
} catch (err) {
  console.error("Error checking query object:", err);
}
