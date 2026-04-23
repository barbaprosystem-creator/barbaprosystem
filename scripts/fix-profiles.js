/**
 * Script para insertar perfiles de los usuarios ya creados
 */

const SUPABASE_URL = 'https://gstddhmhqrjmognwhwhl.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const profiles = [
  { id: '18dae440-be1b-4fe9-9e46-493f427701de', full_name: 'Carlos Mendez', role: 'salesperson' },
  { id: 'a324fdec-c1c8-4119-94f0-a8bd96a3ed62', full_name: 'Pedro Ramirez', role: 'salesperson' },
  { id: 'de25857b-9969-4314-9048-3942dc6e8671', full_name: 'Ana Lopez', role: 'salesperson' },
  { id: '255b5ca0-1c56-4ce8-930e-04f7abf585bb', full_name: 'Miguel Torres', role: 'supervisor' },
  { id: '25d051b9-de28-4f9e-a228-a8132b3def35', full_name: 'Roberto Diaz', role: 'supervisor' },
  { id: 'c4701644-0860-4013-88e2-111ba62b25d1', full_name: 'Laura Garcia', role: 'office' },
];

async function main() {
  if (!SERVICE_ROLE_KEY) { console.error('❌ Falta key'); process.exit(1); }

  // First, check which columns exist in profiles
  const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&limit=1`, {
    headers: { 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'apikey': SERVICE_ROLE_KEY },
  });
  const checkData = await checkRes.json();
  console.log('Columnas detectadas:', checkData.length > 0 ? Object.keys(checkData[0]).join(', ') : 'tabla vacía, insertando directamente...');

  for (const p of profiles) {
    const payload = { id: p.id, full_name: p.full_name, role: p.role, is_active: true };
    
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok || res.status === 201) {
      console.log(`✅ Perfil OK: ${p.full_name} → ${p.role}`);
    } else {
      const err = await res.text();
      console.error(`❌ Error ${p.full_name}:`, err);
    }
  }
}

main();
