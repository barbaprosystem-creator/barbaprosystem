import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: contacts } = await supabase.from('contacts').select('id').limit(1);
  if (!contacts || contacts.length === 0) {
    console.log("No contacts found");
    return;
  }
  const contactId = contacts[0].id;
  
  console.log("Testing insert with contact:", contactId);
  
  const { data, error } = await supabase
    .from('conversaciones')
    .insert([{
      cliente_id: contactId,
      canal: 'email',
      estado: 'activa'
    }])
    .select()
    .single();
    
  if (error) {
    console.error("INSERT ERROR email:", JSON.stringify(error, null, 2));
  } else {
    console.log("Success email:", data);
  }

  const { data: d2, error: e2 } = await supabase
    .from('conversaciones')
    .insert([{
      cliente_id: contactId,
      canal: 'whatsapp',
      estado: 'activa'
    }])
    .select()
    .single();
    
  if (e2) {
    console.error("INSERT ERROR whatsapp:", JSON.stringify(e2, null, 2));
  } else {
    console.log("Success whatsapp:", d2);
  }
}

test();
