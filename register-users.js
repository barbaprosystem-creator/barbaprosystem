import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple dotenv alternative
const envPath = resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

const usersToCreate = [
  {
    email: 'luisbarbaconstruct@gmail.com',
    password: 'BarbaPassword2026!',
    meta: { full_name: 'Luis', role: 'salesperson' }
  },
  {
    email: 'yandeivisgranado@gmail.com',
    password: 'BarbaPassword2026!',
    meta: { full_name: 'Yandeivis', role: 'salesperson' }
  },
  {
    email: 'barbafence5910@gmail.com',
    password: 'BarbaPassword2026!',
    meta: { full_name: 'Oficina 1', role: 'office' }
  },
  {
    email: 'barbaconstruct@gmail.com',
    password: 'BarbaPassword2026!',
    meta: { full_name: 'Admin / Oficina', role: 'admin' }
  }
];

async function registerUsers() {
  console.log('Iniciando registro de usuarios...');
  
  for (const user of usersToCreate) {
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: user.meta
      }
    });

    if (error) {
      console.error(`❌ Error registrando a ${user.email}:`, error.message);
    } else {
      console.log(`✅ Registrado exitosamente: ${user.email}`);
      console.log(`   - ID: ${data.user.id}`);
      
      // Update profiles table if it exists
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: user.meta.full_name,
          role: user.meta.role,
          is_active: true
        });
        
      if (profileError) {
        console.warn(`   - Warning: No se pudo actualizar la tabla 'profiles': ${profileError.message}`);
      } else {
        console.log(`   - Perfil actualizado en BD.`);
      }
    }
  }
  
  console.log('\n¡Proceso finalizado!');
  console.log('NOTA: La contraseña temporal para todos es: BarbaPassword2026!');
}

registerUsers();
