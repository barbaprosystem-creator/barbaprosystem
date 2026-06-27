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

  // Save new tokens
  const upsertRows = [
    { key: 'qbo_access_token', value: tokens.access_token, updated_at: new Date().toISOString() },
    { key: 'qbo_refresh_token', value: tokens.refresh_token, updated_at: new Date().toISOString() },
    { key: 'qbo_expires_at', value: expiresAt, updated_at: new Date().toISOString() }
  ];

  const { error: dbError } = await supabase
    .from('system_settings')
    .upsert(upsertRows);

  if (dbError) throw dbError;

  return tokens.access_token;
}

// Helper to log intuit_tid from QBO API response headers
function logQboTid(response, label) {
  const tid = response.headers.get('intuit_tid');
  if (tid) {
    console.log(`[QuickBooks TID] ${label}: ${tid}`);
  }
  return tid || 'N/A';
}

// Core helper to sync an estimate to QBO
export async function syncEstimateToQBO(supabase, estimateId) {
  const qboClientId = process.env.QBO_CLIENT_ID;
  const qboClientSecret = process.env.QBO_CLIENT_SECRET;

  if (!qboClientId || !qboClientSecret) {
    throw new Error('QuickBooks Client ID or Secret not configured in environment variables');
  }

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
    throw new Error('QuickBooks is not connected. Please connect it in settings.');
  }

  // 2. Validate / Refresh token
  let accessToken = settings.qbo_access_token;
  const expiresAt = settings.qbo_expires_at ? new Date(settings.qbo_expires_at).getTime() : 0;
  const now = Date.now();

  // Refresh if expired or expiring in less than 2 minutes
  if (!accessToken || expiresAt - now < 120000) {
    console.log('QBO token expired or near expiration. Refreshing...');
    accessToken = await refreshQboToken(supabase, settings, qboClientId, qboClientSecret);
  }

  const realmId = settings.qbo_realm_id;
  const qboEnv = settings.qbo_environment || 'sandbox';
  const qboBaseUrl = qboEnv === 'production' 
    ? 'https://quickbooks.api.intuit.com' 
    : 'https://sandbox-quickbooks.api.intuit.com';

  // 3. Fetch estimate + contact details + items
  const { data: estimate, error: estError } = await supabase
    .from('estimates')
    .select('*, contact:contacts(*)')
    .eq('id', estimateId)
    .single();

  if (estError) throw estError;
  if (!estimate) {
    throw new Error('Estimate not found');
  }

  const { data: estimateItems, error: itemsError } = await supabase
    .from('estimate_items')
    .select('*')
    .eq('estimate_id', estimateId);

  if (itemsError) throw itemsError;

  const contact = estimate.contact;
  if (!contact) {
    throw new Error('Estimate has no associated client contact');
  }

  let qboCustomerId = contact.qbo_customer_id;

  // 4. Resolve Customer in QuickBooks
  if (qboCustomerId) {
    // Verify if customer exists in QBO
    const custCheckRes = await fetch(`${qboBaseUrl}/v3/company/${realmId}/customer/${qboCustomerId}?minorversion=65`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    logQboTid(custCheckRes, 'Customer Check');
    if (custCheckRes.status === 404) {
      // Customer was deleted in QBO, force recreation
      qboCustomerId = null;
    }
  }

  if (!qboCustomerId) {
    // Search by Email first, then by DisplayName
    let searchData = null;
    if (contact.email) {
      const query = `SELECT * FROM Customer WHERE PrimaryEmailAddr = '${contact.email.replace(/'/g, "\\'")}'`;
      const searchRes = await fetch(`${qboBaseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=65`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/text'
        }
      });
      logQboTid(searchRes, 'Customer Search by Email');
      if (searchRes.ok) {
        const resJson = await searchRes.json();
        if (resJson.QueryResponse?.Customer?.length > 0) {
          searchData = resJson.QueryResponse.Customer[0];
        }
      }
    }

    if (!searchData) {
      // Search by DisplayName
      const displayName = `${contact.first_name} ${contact.last_name}`.trim();
      const query = `SELECT * FROM Customer WHERE DisplayName = '${displayName.replace(/'/g, "\\'")}'`;
      const searchRes = await fetch(`${qboBaseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=65`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/text'
        }
      });
      logQboTid(searchRes, 'Customer Search by Name');
      if (searchRes.ok) {
        const resJson = await searchRes.json();
        if (resJson.QueryResponse?.Customer?.length > 0) {
          searchData = resJson.QueryResponse.Customer[0];
        }
      }
    }

    if (searchData) {
      qboCustomerId = searchData.Id;
      // Update contact locally
      await supabase
        .from('contacts')
        .update({ qbo_customer_id: qboCustomerId })
        .eq('id', contact.id);
    } else {
      // Create new Customer in QBO
      const displayName = `${contact.first_name} ${contact.last_name}`.trim();
      const createPayload = {
        GivenName: contact.first_name,
        FamilyName: contact.last_name,
        DisplayName: displayName,
        PrimaryPhone: contact.phone ? { FreeFormNumber: contact.phone } : null,
        PrimaryEmailAddr: contact.email ? { Address: contact.email } : null,
        BillAddr: contact.address ? {
          Line1: contact.address,
          City: contact.city || '',
          CountrySubDivisionCode: contact.state || 'KY',
          PostalCode: contact.zip || ''
        } : null
      };

      const createRes = await fetch(`${qboBaseUrl}/v3/company/${realmId}/customer?minorversion=65`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(createPayload)
      });

      const tid = logQboTid(createRes, 'Customer Create');
      const createJson = await createRes.json();
      if (!createRes.ok || !createJson.Customer) {
        console.error('Error creating Customer in QBO:', createJson);
        throw new Error(`Failed to create Customer in QBO (TID: ${tid}): ${createJson.Fault?.Error?.[0]?.Message || createRes.statusText}`);
      }

      qboCustomerId = createJson.Customer.Id;
      // Update contact locally
      await supabase
        .from('contacts')
        .update({ qbo_customer_id: qboCustomerId })
        .eq('id', contact.id);
    }
  }

  // 5. Create Invoice in QuickBooks
  const invoiceNum = `EST-${String(estimate.estimate_number).padStart(4, '0')}`;
  const invoiceLineItems = (estimateItems || []).map(item => {
    const desc = `${item.description} ${item.details ? ' - ' + item.details : ''}`.trim();
    const amount = parseFloat(item.line_total || (item.quantity * item.unit_price));
    return {
      Description: desc,
      Amount: amount,
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: {
        ItemRef: {
          value: '1',
          name: 'Services'
        },
        UnitPrice: parseFloat(item.unit_price),
        Qty: parseFloat(item.quantity)
      }
    };
  });

  const invoicePayload = {
    CustomerRef: {
      value: qboCustomerId
    },
    DocNumber: invoiceNum,
    Line: invoiceLineItems,
    BillEmail: contact.email ? { Address: contact.email } : null,
    CustomerMemo: {
      value: estimate.notes || 'Thank you for your business!'
    }
  };

  // First try: Create invoice with CRM's estimate number as DocNumber
  let invoiceRes = await fetch(`${qboBaseUrl}/v3/company/${realmId}/invoice?minorversion=65`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(invoicePayload)
  });

  let tid = logQboTid(invoiceRes, 'Invoice Create Try 1');
  let invoiceJson = await invoiceRes.json();

  // If duplicate DocNumber error occurs, retry without DocNumber
  const isDuplicateError = invoiceJson.Fault?.Error?.some(e => e.Message?.includes('Duplicate') || e.code === '6140');
  if (!invoiceRes.ok && isDuplicateError) {
    console.warn(`DocNumber ${invoiceNum} already exists in QBO. Retrying without DocNumber...`);
    delete invoicePayload.DocNumber;
    
    invoiceRes = await fetch(`${qboBaseUrl}/v3/company/${realmId}/invoice?minorversion=65`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(invoicePayload)
    });
    tid = logQboTid(invoiceRes, 'Invoice Create Try 2');
    invoiceJson = await invoiceRes.json();
  }

  if (!invoiceRes.ok || !invoiceJson.Invoice) {
    console.error('Error creating Invoice in QBO:', invoiceJson);
    throw new Error(`Failed to create Invoice in QBO (TID: ${tid}): ${invoiceJson.Fault?.Error?.[0]?.Message || invoiceRes.statusText}`);
  }

  const qboInvoiceId = invoiceJson.Invoice.Id;
  const qboInvoiceNumber = invoiceJson.Invoice.DocNumber;

  // 6. Update estimate in Supabase
  const { error: finalUpdateError } = await supabase
    .from('estimates')
    .update({
      qbo_invoice_id: qboInvoiceId,
      qbo_invoice_number: qboInvoiceNumber
    })
    .eq('id', estimateId);

  if (finalUpdateError) throw finalUpdateError;

  return {
    success: true,
    qboInvoiceId,
    qboInvoiceNumber,
    accessToken,
    qboBaseUrl,
    realmId
  };
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

  const { estimateId } = req.body;
  if (!estimateId) {
    return res.status(400).json({ error: 'Missing estimateId in request body' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase environment variables not configured on server' });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const result = await syncEstimateToQBO(supabase, estimateId);
    return res.status(200).json(result);
  } catch (err) {
    console.error('QBO Sync API error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
