import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase environment variables not configured on server' });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const qboKeys = [
      'qbo_access_token',
      'qbo_refresh_token',
      'qbo_expires_at',
      'qbo_realm_id',
      'qbo_environment'
    ];

    const { error } = await supabase
      .from('system_settings')
      .delete()
      .in('key', qboKeys);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('QBO Disconnect API error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
