import { createClient } from '@supabase/supabase-js';

// Replace these with actual Supabase project URL and anon key from .env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMessages() {
  const { data, error } = await supabase
    .from('mensajes')
    .select('*, conversaciones(*)');
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Total mensajes:", data.length);
    console.log("Mensajes recientes:", JSON.stringify(data.slice(-5), null, 2));
  }
}

checkMessages();
