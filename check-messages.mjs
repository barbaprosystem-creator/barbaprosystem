import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = readFileSync('.env', 'utf-8');
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('=').map(part => part.trim().replace(/^"|"$/g, '')))
);

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

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
