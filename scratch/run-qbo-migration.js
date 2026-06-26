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
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Supabase URL or Service Role Key not found in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
  const query = `
    ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS qbo_customer_id TEXT;
    ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS qbo_invoice_id TEXT;
    ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS qbo_invoice_number TEXT;
  `;
  
  console.log("Running migration...");
  const { data, error } = await supabase.rpc('exec_sql', { query });

  if (error) {
    console.error("Migration failed:", error);
  } else {
    console.log("Migration executed successfully! Columns added.");
  }
}

runMigration();
