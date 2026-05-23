import { createClient } from '@supabase/supabase-js';

// Server-side endpoint — uses service_role key so no auth needed from the client
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing estimate id' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase env vars not configured on server' });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Fetch estimate + contact + items in parallel
    const [estRes, itemsRes] = await Promise.all([
      supabase
        .from('estimates')
        .select('*, contact:contacts!estimates_contact_id_fkey(id,first_name,last_name,email,phone,address)')
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('estimate_items')
        .select('*')
        .eq('estimate_id', id)
        .order('created_at', { ascending: true }),
    ]);

    if (estRes.error) throw estRes.error;
    if (!estRes.data)  return res.status(404).json({ error: 'Estimate not found' });

    return res.status(200).json({
      estimate: estRes.data,
      contact:  estRes.data.contact || null,
      items:    itemsRes.data || [],
    });
  } catch (err) {
    console.error('get-estimate error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
