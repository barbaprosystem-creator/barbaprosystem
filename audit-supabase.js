const BASE = 'https://ddwyutisxymuvofkjhpz.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3l1dGlzeHltdXZvZmtqaHB6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA1MzM5NSwiZXhwIjoyMDkyNjI5Mzk1fQ.cJQgzQsy1TUa4Yk01qkBedrmM8HxYqnH3VqzVLKpUDY';
const headers = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` };

async function check(label, url) {
  try {
    const res = await fetch(url, { headers });
    const data = await res.json();
    const count = Array.isArray(data) ? data.length : (data?.error ? `❌ ERROR: ${data.error}` : JSON.stringify(data).slice(0,80));
    console.log(`${label}: HTTP ${res.status} | rows/result: ${count}`);
    return { status: res.status, data };
  } catch(e) {
    console.log(`${label}: ❌ NETWORK ERROR - ${e.message}`);
    return null;
  }
}

async function run() {
  console.log('\n========== SUPABASE AUDIT ==========\n');

  // 1. Check all required tables exist
  console.log('--- TABLAS ---');
  const tables = ['contacts','profiles','estimates','estimate_items','projects','payments','conversaciones','mensajes','brigades','brigade_members','project_photos','project_expenses','project_documents','project_materials','calendar_tokens','products','services','activity_log'];
  for (const t of tables) {
    await check(t, `${BASE}/rest/v1/${t}?select=id&limit=1`);
  }

  // 2. Check storage buckets
  console.log('\n--- STORAGE BUCKETS ---');
  const bucketsRes = await fetch(`${BASE}/storage/v1/bucket`, { headers });
  const buckets = await bucketsRes.json();
  if (Array.isArray(buckets)) {
    if (buckets.length === 0) {
      console.log('❌ No hay buckets creados!');
    } else {
      buckets.forEach(b => console.log(`✅ Bucket: ${b.name} (${b.public ? 'público' : 'privado'})`));
    }
    const hasPhotos = buckets.some(b => b.name === 'jobsite_photos');
    const hasDocs = buckets.some(b => b.name === 'project-documents');
    if (!hasPhotos) console.log('❌ FALTA bucket: jobsite_photos');
    if (!hasDocs) console.log('❌ FALTA bucket: project-documents');
  } else {
    console.log('Storage response:', JSON.stringify(buckets));
  }

  // 3. Check check constraint on canal
  console.log('\n--- CHECK CONSTRAINT (canal) ---');
  const convRes = await fetch(`${BASE}/rest/v1/conversaciones?select=canal&limit=50`, { headers });
  const convData = await convRes.json();
  if (Array.isArray(convData)) {
    const channels = [...new Set(convData.map(c => c.canal))];
    console.log('Canales existentes:', channels.join(', ') || 'ninguno (tabla vacía)');
  }

  // 4. Test insert with 'email' channel
  console.log('\n--- TEST INSERT EMAIL ---');
  const contactRes = await fetch(`${BASE}/rest/v1/contacts?select=id&limit=1`, { headers });
  const contacts = await contactRes.json();
  if (contacts[0]?.id) {
    const testRes = await fetch(`${BASE}/rest/v1/conversaciones`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ cliente_id: contacts[0].id, canal: 'email', estado: 'activa' })
    });
    if (testRes.status === 201) {
      console.log('✅ INSERT email conversation: OK (constraint actualizado)');
    } else {
      const err = await testRes.text();
      console.log(`❌ INSERT email conversation: HTTP ${testRes.status} - ${err}`);
    }
  }

  console.log('\n====================================\n');
}
run();
