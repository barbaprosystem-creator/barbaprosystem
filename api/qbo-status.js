import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase environment variables not configured on server' });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['qbo_refresh_token', 'qbo_realm_id', 'qbo_environment']);

    if (error) throw error;

    const settings = {};
    (data || []).forEach(row => {
      settings[row.key] = row.value;
    });

    const isConnected = !!settings.qbo_refresh_token;

    return res.status(200).json({
      connected: isConnected,
      realmId: settings.qbo_realm_id || null,
      environment: settings.qbo_environment || 'sandbox'
    });
  } catch (err) {
    console.error('QBO Status API error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
