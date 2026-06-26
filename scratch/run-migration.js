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

async function run() {
  const sql = `
    ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS qbo_customer_id TEXT;
    ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS qbo_invoice_id TEXT;
    ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS qbo_invoice_number TEXT;
  `;
  
  console.log("Attempting to run migration via exec_sql RPC...");
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (res.ok) {
      console.log("Migration executed successfully via exec_sql RPC!");
      const data = await res.json();
      console.log("Response:", data);
    } else {
      console.log(`Failed with status ${res.status}: ${res.statusText}`);
      const text = await res.text();
      console.log("Response text:", text);
    }
  } catch (err) {
    console.error("Error connecting:", err);
  }
}

run();
