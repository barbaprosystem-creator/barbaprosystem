import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const vars = {};
env.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    vars[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabase = createClient(vars.VITE_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error(error);
  } else {
    users.forEach(u => {
      console.log(`Email: ${u.email}, ID: ${u.id}`);
    });
  }
}
run();
