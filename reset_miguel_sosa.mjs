import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwyutisxymuvofkjhpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3l1dGlzeHltdXZvZmtqaHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNTMzOTUsImV4cCI6MjA5MjYyOTM5NX0.MUsRX_h5TZJ2LeS-iXFpdQK3bIV6GOBO2-DW1m9MdsA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function resetMiguelSosaEstimate() {
  console.log("Buscando a Miguel Sosa en contactos...");
  const { data: contacts, error: contactError } = await supabase
    .from('contacts')
    .select('id, first_name, last_name')
    .eq('first_name', 'Miguel')
    .eq('last_name', 'Sosa');

  if (contactError) {
    console.error("Error buscando contacto:", contactError);
    return;
  }

  if (!contacts || contacts.length === 0) {
    console.log("No se encontró el contacto Miguel Sosa.");
    return;
  }

  const contactId = contacts[0].id;
  console.log(`Encontrado Miguel Sosa con ID: ${contactId}`);

  console.log("Buscando estimaciones de este contacto...");
  const { data: estimates, error: estError } = await supabase
    .from('estimates')
    .select('id, status')
    .eq('contact_id', contactId);

  if (estError) {
    console.error("Error buscando estimaciones:", estError);
    return;
  }

  if (!estimates || estimates.length === 0) {
    console.log("No se encontraron estimaciones para Miguel Sosa.");
    return;
  }

  for (const est of estimates) {
    console.log(`Actualizando estimado ${est.id} de '${est.status}' a 'draft'...`);
    const { error: updateError } = await supabase
      .from('estimates')
      .update({ status: 'draft' })
      .eq('id', est.id);
      
    if (updateError) {
      console.error(`Error actualizando estimado ${est.id}:`, updateError);
    } else {
      console.log(`Estimado ${est.id} actualizado a draft exitosamente.`);
    }
  }
}

resetMiguelSosaEstimate();
