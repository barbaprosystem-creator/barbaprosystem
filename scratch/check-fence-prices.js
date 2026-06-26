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

async function checkPrices() {
  const { data, error } = await supabase
    .from('price_catalog')
    .select('*')
    .or('category.ilike.%fence%,item_name.ilike.%fence%,item_name.ilike.%gate%,item_name.ilike.%puerta%')
    .order('category', { ascending: true });
    
  if (error) {
    console.error("Error querying catalog:", error);
  } else {
    console.log("Found items:\n");
    data.forEach(item => {
      console.log(`[${item.category}] ${item.item_name} - ${item.description || ''} | Base cost: $${item.base_cost} | Sell price: $${item.sell_price}`);
    });
  }
}

checkPrices();
