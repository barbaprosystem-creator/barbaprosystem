import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  try {
    // 1. Get or create a dummy contact
    let contactId;
    const { data: contacts } = await supabase.from('contacts').select('id').limit(1);
    if (contacts && contacts.length > 0) {
      contactId = contacts[0].id;
    } else {
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert([{ first_name: 'Test', last_name: 'User' }])
        .select()
        .single();
      if (contactError) throw contactError;
      contactId = newContact.id;
    }
    
    console.log("Using contactId:", contactId);
    
    // 2. Insert dummy estimate
    const { data: estimate, error: estError } = await supabase
      .from('estimates')
      .insert([{
        contact_id: contactId,
        status: 'draft',
        work_type: 'gutters',
        subtotal: 150,
        grand_total: 150,
        scope_of_work: 'Gutters: 10 LF @ $15.00/ft',
        notes: 'Test note'
      }])
      .select()
      .single();
      
    if (estError) {
      console.error("Error inserting estimate:", estError);
      return;
    }
    
    console.log("Estimate inserted successfully:", estimate);
    
    // 3. Insert dummy estimate item with the full production payload (including details and service_type, omitting total)
    console.log("Attempting insert with details and service_type:");
    const { data: items, error: itemError } = await supabase
      .from('estimate_items')
      .insert([{
        estimate_id: estimate.id,
        description: 'Gutters & Downspouts',
        details: '10 LF @ $15.00/ft',
        quantity: 10,
        unit_price: 15,
        service_type: 'gutters'
      }])
      .select();
      
    if (itemError) {
      console.error("Error inserting estimate item:", itemError);
    } else {
      console.log("SUCCESS inserting estimate item!", items);
      console.log("Details loaded:", items[0].details);
      console.log("Service type loaded:", items[0].service_type);
      console.log("Generated line_total is:", items[0].line_total);
    }
    
    // Cleanup
    await supabase.from('estimates').delete().eq('id', estimate.id);
    console.log("Cleanup done.");
    
  } catch (err) {
    console.error("Test insert failed:", err);
  }
}

testInsert();
