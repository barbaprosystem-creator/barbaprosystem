/**
 * Script para crear usuarios de prueba en Supabase Auth + Profiles
 * Ejecutar: node scripts/create-users.js
 */

const SUPABASE_URL = 'https://gstddhmhqrjmognwhwhl.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const users = [
  {
    email: 'vendedor@barba.com',
    password: 'barba2026!',
    full_name: 'Carlos Mendez',
    role: 'salesperson'
  },
  {
    email: 'vendedor2@barba.com',
    password: 'barba2026!',
    full_name: 'Pedro Ramirez',
    role: 'salesperson'
  },
  {
    email: 'vendedor3@barba.com',
    password: 'barba2026!',
    full_name: 'Ana Lopez',
    role: 'salesperson'
  },
  {
    email: 'supervisor@barba.com',
    password: 'barba2026!',
    full_name: 'Miguel Torres',
    role: 'supervisor'
  },
  {
    email: 'supervisor2@barba.com',
    password: 'barba2026!',
    full_name: 'Roberto Diaz',
    role: 'supervisor'
  },
  {
    email: 'oficina@barba.com',
    password: 'barba2026!',
    full_name: 'Laura Garcia',
    role: 'office'
  }
];

async function createUser(user) {
  // 1. Create auth user
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name, role: user.role },
    }),
  });

  const authData = await authRes.json();

  if (!authRes.ok) {
    // If user already exists, try to get their ID
    if (authData.msg?.includes('already') || authData.message?.includes('already')) {
      console.log(`⚠️  ${user.email} ya existe, actualizando perfil...`);
      // Get existing user by email
      const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=50`, {
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'apikey': SERVICE_ROLE_KEY,
        },
      });
      const listData = await listRes.json();
      const existingUser = listData.users?.find(u => u.email === user.email);
      if (existingUser) {
        await upsertProfile(existingUser.id, user);
        return;
      }
    }
    console.error(`❌ Error creando ${user.email}:`, authData.message || authData.msg || JSON.stringify(authData));
    return;
  }

  console.log(`✅ Auth creado: ${user.email} (${user.role}) — ID: ${authData.id}`);

  // 2. Create/update profile
  await upsertProfile(authData.id, user);
}

async function upsertProfile(userId, user) {
  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      id: userId,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      is_active: true,
    }),
  });

  if (profileRes.ok) {
    console.log(`   ✅ Perfil OK: ${user.full_name} → ${user.role}`);
  } else {
    const err = await profileRes.text();
    console.error(`   ❌ Error perfil:`, err);
  }
}

async function main() {
  if (!SERVICE_ROLE_KEY) {
    console.error('❌ Falta SUPABASE_SERVICE_ROLE_KEY');
    console.log('Ejecuta: $env:SUPABASE_SERVICE_ROLE_KEY="tu-key"; node scripts/create-users.js');
    process.exit(1);
  }

  console.log('🚀 Creando 6 usuarios para Barba Pro System...\n');
  console.log('   3 Vendedores, 2 Supervisores, 1 Oficina\n');

  for (const user of users) {
    await createUser(user);
    console.log('');
  }

  console.log('═══════════════════════════════════════');
  console.log('✅ Proceso completado. Credenciales:\n');
  console.log('  📧 vendedor@barba.com   / barba2026!  (Vendedor)');
  console.log('  📧 vendedor2@barba.com  / barba2026!  (Vendedor)');
  console.log('  📧 vendedor3@barba.com  / barba2026!  (Vendedor)');
  console.log('  📧 supervisor@barba.com / barba2026!  (Supervisor)');
  console.log('  📧 supervisor2@barba.com/ barba2026!  (Supervisor)');
  console.log('  📧 oficina@barba.com    / barba2026!  (Oficina)');
  console.log('\n  🔑 Admin existente: admin@barba.com / Admin123!');
  console.log('═══════════════════════════════════════');
}

main();
