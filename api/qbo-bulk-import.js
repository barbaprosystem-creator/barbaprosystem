import { createClient } from '@supabase/supabase-js';

// Helper to refresh QBO access token
async function refreshQboToken(supabase, settings, qboClientId, qboClientSecret) {
  const basicAuth = Buffer.from(`${qboClientId}:${qboClientSecret}`).toString('base64');
  
  const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: settings.qbo_refresh_token
    }).toString()
  });

  const tokens = await response.json();

  if (!response.ok || tokens.error) {
    throw new Error(`Failed to refresh QBO token: ${tokens.error_description || tokens.error}`);
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const upsertRows = [
    { key: 'qbo_access_token', value: tokens.access_token, updated_at: new Date().toISOString() },
    { key: 'qbo_refresh_token', value: tokens.refresh_token, updated_at: new Date().toISOString() },
    { key: 'qbo_expires_at', value: expiresAt, updated_at: new Date().toISOString() }
  ];

  await supabase.from('system_settings').upsert(upsertRows);
  return tokens.access_token;
}

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
  const qboClientId = process.env.QBO_CLIENT_ID;
  const qboClientSecret = process.env.QBO_CLIENT_SECRET;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase environment variables not configured on server' });
  }

  if (!qboClientId || !qboClientSecret) {
    return res.status(500).json({ error: 'QuickBooks Client ID or Secret not configured' });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // 1. Fetch QBO settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['qbo_access_token', 'qbo_refresh_token', 'qbo_expires_at', 'qbo_realm_id', 'qbo_environment']);

    if (settingsError) throw settingsError;

    const settings = {};
    (settingsData || []).forEach(row => {
      settings[row.key] = row.value;
    });

    if (!settings.qbo_refresh_token) {
      return res.status(400).json({ error: 'QuickBooks is not connected.' });
    }

    // 2. Validate/Refresh token
    let accessToken = settings.qbo_access_token;
    const expiresAt = settings.qbo_expires_at ? new Date(settings.qbo_expires_at).getTime() : 0;
    const now = Date.now();

    if (!accessToken || expiresAt - now < 120000) {
      console.log('QBO token expired. Refreshing...');
      accessToken = await refreshQboToken(supabase, settings, qboClientId, qboClientSecret);
    }

    const realmId = settings.qbo_realm_id;
    const qboEnv = settings.qbo_environment || 'sandbox';
    const qboBaseUrl = qboEnv === 'production' 
      ? 'https://quickbooks.api.intuit.com' 
      : 'https://sandbox-quickbooks.api.intuit.com';

    // 3. Fetch all CRM Contacts & Estimates for in-memory matching
    const { data: localContacts, error: localContError } = await supabase
      .from('contacts')
      .select('*');
    if (localContError) throw localContError;

    const { data: localEstimates, error: localEstError } = await supabase
      .from('estimates')
      .select('*');
    if (localEstError) throw localEstError;

    // 4. Fetch Customers from QBO (Created in 2026)
    // QuickBooks metadata create time is in ISO format
    const customerQuery = `SELECT * FROM Customer WHERE Metadata.CreateTime >= '2026-01-01T00:00:00-05:00' STARTPOSITION 1 MAXRESULTS 1000`;
    const customerRes = await fetch(`${qboBaseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(customerQuery)}&minorversion=65`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!customerRes.ok) {
      const errText = await customerRes.text();
      throw new Error(`Failed to fetch QBO Customers: ${customerRes.statusText} - ${errText}`);
    }

    const customerJson = await customerRes.json();
    const qboCustomers = customerJson.QueryResponse?.Customer || [];

    let customersMatched = 0;
    let customersCreated = 0;

    // Process QBO Customers
    for (const qboCust of qboCustomers) {
      const qboId = qboCust.Id;
      const email = qboCust.PrimaryEmailAddr?.Address || '';
      const phone = qboCust.PrimaryPhone?.FreeFormNumber || '';
      const displayName = qboCust.DisplayName || '';
      const firstName = qboCust.GivenName || displayName.split(' ')[0] || 'Client';
      const lastName = qboCust.FamilyName || displayName.split(' ').slice(1).join(' ') || '';
      
      const billAddr = qboCust.BillAddr || {};
      const address = billAddr.Line1 || '';
      const city = billAddr.City || '';
      const state = billAddr.CountrySubDivisionCode || '';
      const zip = billAddr.PostalCode || '';

      // Match logic
      let matchedContact = localContacts.find(c => c.qbo_customer_id === qboId);
      if (!matchedContact && email) {
        matchedContact = localContacts.find(c => c.email && c.email.toLowerCase() === email.toLowerCase());
      }
      if (!matchedContact && displayName) {
        matchedContact = localContacts.find(c => {
          const localFullName = `${c.first_name || ''} ${c.last_name || ''}`.trim().toLowerCase();
          return localFullName === displayName.trim().toLowerCase();
        });
      }

      if (matchedContact) {
        // Update contact with QBO Customer ID and missing fields
        const updates = { qbo_customer_id: qboId };
        if (!matchedContact.phone && phone) updates.phone = phone;
        if (!matchedContact.address && address) updates.address = address;
        if (!matchedContact.city && city) updates.city = city;
        if (!matchedContact.state && state) updates.state = state;
        if (!matchedContact.zip && zip) updates.zip = zip;

        await supabase
          .from('contacts')
          .update(updates)
          .eq('id', matchedContact.id);
        customersMatched++;
      } else {
        // Create new contact
        await supabase
          .from('contacts')
          .insert({
            first_name: firstName,
            last_name: lastName,
            email: email || null,
            phone: phone || null,
            address: address || null,
            city: city || null,
            state: state || null,
            zip: zip || null,
            qbo_customer_id: qboId
          });
        customersCreated++;
      }
    }

    // 5. Fetch Invoices from QBO (Created in 2026)
    const invoiceQuery = `SELECT * FROM Invoice WHERE TxnDate >= '2026-01-01' STARTPOSITION 1 MAXRESULTS 1000`;
    const invoiceRes = await fetch(`${qboBaseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(invoiceQuery)}&minorversion=65`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!invoiceRes.ok) {
      const errText = await invoiceRes.text();
      throw new Error(`Failed to fetch QBO Invoices: ${invoiceRes.statusText} - ${errText}`);
    }

    const invoiceJson = await invoiceRes.json();
    const qboInvoices = invoiceJson.QueryResponse?.Invoice || [];

    let invoicesMatched = 0;

    // Process QBO Invoices
    for (const qboInv of qboInvoices) {
      const invId = qboInv.Id;
      const docNum = qboInv.DocNumber || '';
      
      // Match with local estimates
      // Check for exact matching qbo_invoice_id, or parse estimate number from docNum (e.g. EST-0037 or 37)
      let matchedEst = localEstimates.find(e => e.qbo_invoice_id === invId);
      
      if (!matchedEst && docNum) {
        const parsedNum = parseInt(docNum.replace(/\D/g, ''), 10);
        if (!isNaN(parsedNum)) {
          matchedEst = localEstimates.find(e => e.estimate_number === parsedNum);
        }
      }

      if (matchedEst) {
        // Update local estimate linking and mark status as approved since invoice exists
        const updates = {
          qbo_invoice_id: invId,
          qbo_invoice_number: docNum
        };
        
        if (matchedEst.status !== 'approved') {
          updates.status = 'approved';
        }

        await supabase
          .from('estimates')
          .update(updates)
          .eq('id', matchedEst.id);
        
        invoicesMatched++;
      }
    }

    return res.status(200).json({
      success: true,
      customersProcessed: qboCustomers.length,
      customersMatched,
      customersCreated,
      invoicesProcessed: qboInvoices.length,
      invoicesMatched
    });

  } catch (err) {
    console.error('QBO Bulk Import API error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
