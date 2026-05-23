const url = 'https://ddwyutisxymuvofkjhpz.supabase.co/rest/v1/conversaciones';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3l1dGlzeHltdXZvZmtqaHB6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA1MzM5NSwiZXhwIjoyMDkyNjI5Mzk1fQ.cJQgzQsy1TUa4Yk01qkBedrmM8HxYqnH3VqzVLKpUDY'; // Service Role Key

async function test() {
  const resContacts = await fetch('https://ddwyutisxymuvofkjhpz.supabase.co/rest/v1/contacts?select=id&limit=1', {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const contacts = await resContacts.json();
  const contactId = contacts[0].id;

  console.log('Using contact ID:', contactId);

  const body = {
    cliente_id: contactId,
    canal: 'email',
    estado: 'activa'
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(body)
  });
  
  const text = await res.text();
  console.log(`HTTP ${res.status}:`, text);
}
test();
