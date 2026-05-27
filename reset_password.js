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
  const { data, error } = await supabase.auth.admin.updateUserById(
    '3c05662a-16b9-41a0-951b-2caf3b2d6110',
    { password: 'password123' }
  );
  if (error) {
    console.error("Error resetting password:", error);
  } else {
    console.log("Successfully reset password for admin@barba.com to 'password123'!");
  }
}
run();
