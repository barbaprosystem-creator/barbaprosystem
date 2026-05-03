import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwyutisxymuvofkjhpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3l1dGlzeHltdXZvZmtqaHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNTMzOTUsImV4cCI6MjA5MjYyOTM5NX0.MUsRX_h5TZJ2LeS-iXFpdQK3bIV6GOBO2-DW1m9MdsA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listContacts() {
  const { data: contacts } = await supabase.from('contacts').select('id, first_name, last_name').limit(10).order('created_at', { ascending: false });
  console.log("Contactos recientes:", contacts);
  
  const { data: ests } = await supabase.from('estimates').select('id, status, contact_id').limit(10).order('created_at', { ascending: false });
  console.log("Estimados recientes:", ests);
}

listContacts();
