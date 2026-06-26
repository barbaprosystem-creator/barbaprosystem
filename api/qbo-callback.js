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

  const { code, realmId, redirectUri } = req.body;

  if (!code || !realmId || !redirectUri) {
    return res.status(400).json({ error: 'Missing code, realmId, or redirectUri in request body' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const qboClientId = process.env.QBO_CLIENT_ID;
  const qboClientSecret = process.env.QBO_CLIENT_SECRET;
  const qboEnv = process.env.QBO_ENVIRONMENT || 'sandbox';

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase environment variables not configured on server' });
  }

  if (!qboClientId || !qboClientSecret) {
    return res.status(500).json({ error: 'QuickBooks Client ID or Secret not configured in environment variables' });
  }

  try {
    // 1. Exchange authorization code for tokens
    const basicAuth = Buffer.from(`${qboClientId}:${qboClientSecret}`).toString('base64');
    
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      }).toString()
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok || tokens.error) {
      console.error('Error exchanging QBO code for tokens:', tokens);
      return res.status(tokenResponse.status).json({
        error: 'Failed to exchange QuickBooks tokens',
        details: tokens.error_description || tokens.error
      });
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    
    // 2. Save tokens in system_settings table
    const supabase = createClient(supabaseUrl, serviceKey);

    const upsertRows = [
      { key: 'qbo_access_token', value: tokens.access_token, updated_at: new Date().toISOString() },
      { key: 'qbo_refresh_token', value: tokens.refresh_token, updated_at: new Date().toISOString() },
      { key: 'qbo_expires_at', value: expiresAt, updated_at: new Date().toISOString() },
      { key: 'qbo_realm_id', value: realmId, updated_at: new Date().toISOString() },
      { key: 'qbo_environment', value: qboEnv, updated_at: new Date().toISOString() }
    ];

    const { error: dbError } = await supabase
      .from('system_settings')
      .upsert(upsertRows);

    if (dbError) {
      throw dbError;
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('QBO Callback API error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
