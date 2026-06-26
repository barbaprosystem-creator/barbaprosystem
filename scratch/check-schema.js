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
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Key not found in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data: cols, error } = await supabase.rpc('exec_sql', {
    query: `SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name IN ('estimates', 'estimate_items') 
            ORDER BY table_name, ordinal_position;`
  });

  if (error) {
    console.error("RPC exec_sql failed, trying basic select:", error);
    // Basic fallback: just fetch 1 empty record (or metadata if possible)
    const { data: est, error: estErr } = await supabase.from('estimates').select('*').limit(1);
    console.log("Estimates keys:", est && est[0] ? Object.keys(est[0]) : "No records / empty");
    const { data: items, error: itemsErr } = await supabase.from('estimate_items').select('*').limit(1);
    console.log("Estimate items keys:", items && items[0] ? Object.keys(items[0]) : "No records / empty");
  } else {
    console.log("Columns metadata:\n");
    cols.forEach(c => {
      console.log(`${c.table_name}.${c.column_name} (${c.data_type})`);
    });
  }
}

checkSchema();
