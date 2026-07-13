import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// QuickBooks Online CRM Integration Endpoints & Webhooks - Sync Build 1.0.4


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

// Helper to detect work type from QBO line items
function detectWorkType(lines) {
  let hasRoof = false;
  let hasSiding = false;
  let hasGutter = false;
  let hasWindow = false;

  for (const line of lines || []) {
    const desc = (line.Description || '').toLowerCase();
    if (desc.includes('roof') || desc.includes('shingle') || desc.includes('underlayment') || desc.includes('tear off')) {
      hasRoof = true;
    }
    if (desc.includes('siding') || desc.includes('hardie') || desc.includes('soffit') || desc.includes('fascia')) {
      hasSiding = true;
    }
    if (desc.includes('gutter') || desc.includes('downspout')) {
      hasGutter = true;
    }
    if (desc.includes('window') || desc.includes('double hung')) {
      hasWindow = true;
    }
  }

  const types = [];
  if (hasRoof) types.push('Roofing');
  if (hasSiding) types.push('Siding');
  if (hasGutter) types.push('Gutters');
  if (hasWindow) types.push('Windows');

  if (types.length === 0) return 'General';
  return types.join(' & ');
}

// Helper to resolve profile ID based on custom fields in QuickBooks
function resolveCreatorFromQbo(qboEntity, profiles) {
  const customFields = qboEntity.CustomField || [];
  const salesRepField = customFields.find(f => {
    const name = (f.Name || '').toLowerCase();
    return name.includes('sales') || name.includes('vendedor') || name.includes('rep') || name.includes('hecho') || name.includes('estimador');
  });
  if (salesRepField?.StringValue) {
    const repName = salesRepField.StringValue.trim().toLowerCase();
    const matchedProfile = (profiles || []).find(p => (p.full_name || '').toLowerCase() === repName);
    if (matchedProfile) return matchedProfile.id;
  }
  return null;
}

// Helper to map QBO estimate status to CRM estimate status
function mapQboEstimateStatus(qboStatus) {
  const s = (qboStatus || '').toLowerCase();
  if (s === 'accepted' || s === 'closed') return 'approved';
  if (s === 'rejected') return 'rejected';
  if (s === 'sent') return 'sent';
  return 'draft';
}

// Automated Email Helper using Resend
async function sendAutoEmailForInvoice(supabase, estimateId, contact, qboInvoiceId, qboInvoiceNumber, accessToken, qboBaseUrl, realmId) {
  try {
    const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[QBO Auto-Email] RESEND_API_KEY not configured.');
      return;
    }
    const resend = new Resend(apiKey);

    // 1. Fetch PDF from QuickBooks Online
    console.log(`[QBO Auto-Email] Fetching PDF for QBO Invoice ${qboInvoiceId}...`);
    const pdfUrl = `${qboBaseUrl}/v3/company/${realmId}/invoice/${qboInvoiceId}/pdf?minorversion=65`;
    const pdfRes = await fetch(pdfUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/pdf'
      }
    });

    if (!pdfRes.ok) {
      throw new Error(`Failed to fetch QBO PDF: ${pdfRes.statusText}`);
    }

    const arrayBuffer = await pdfRes.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    const pdfBase64 = pdfBuffer.toString('base64');

    // 2. Prepare email body
    const signingLink = `https://barbaprosystem.com/p/${estimateId}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #111111; padding: 30px 20px; text-align: center; border-bottom: 5px solid #F5C518;">
          <img src="https://barbaprosystem.com/logo-barba.png" alt="Barba Construction" style="max-height: 60px; margin-bottom: 10px;" />
          <p style="color: #888888; font-size: 12px; margin-top: 0;">Excellence in Roofing, Siding & Gutters</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #111111; margin-top: 0; font-size: 20px;">Hello ${contact.first_name || 'Client'},</h2>
          <p style="color: #444444; line-height: 1.6; font-size: 15px;">Please find attached the official invoice <strong>#${qboInvoiceNumber}</strong> from QuickBooks Online for your project proposal.</p>
          
          <p style="color: #444444; line-height: 1.6; font-size: 15px; margin-top: 25px;">To view the full contract, add your signature, and approve this proposal, please click the button below:</p>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${signingLink}" style="background-color: #F5C518; color: #000000; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 197, 24, 0.2);">
              View Proposal, Sign and Authorize
            </a>
            <p style="font-size: 12px; color: #888888; margin-top: 15px;">* The official QuickBooks invoice PDF is attached directly to this email.</p>
          </div>

          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;" />
          
          <p style="color: #444444; line-height: 1.6; font-size: 14px;">We are at your disposal for any questions or clarifications regarding this invoice.</p>
          <p style="color: #111111; line-height: 1.6; font-size: 14px; margin-top: 20px;">
            Sincerely,<br/>
            <strong>Sales Team</strong><br/>
            <span style="color: #666666;">Barba Construction</span>
          </p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; color: #888888; font-size: 12px;">
          © ${new Date().getFullYear()} Barba Construction. All rights reserved.
        </div>
      </div>
    `;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Barba Construction <info@barbaprosystem.com>',
      to: [contact.email],
      subject: `Official Proposal Invoice #${qboInvoiceNumber} - Barba Construction`,
      html: emailHtml,
      reply_to: 'info@barbaprosystem.com',
      attachments: [
        {
          filename: `Invoice-${qboInvoiceNumber}.pdf`,
          content: pdfBase64
        }
      ]
    });

    if (emailError) {
      throw new Error(emailError.message);
    }

    console.log(`[QBO Auto-Email] Email successfully sent for Invoice #${qboInvoiceNumber} to ${contact.email}.`);

    // Update status locally to 'sent'
    await supabase
      .from('estimates')
      .update({ status: 'sent', updated_at: new Date().toISOString() })
      .eq('id', estimateId);

  } catch (err) {
    console.error('[QBO Auto-Email] Error sending automated email:', err);
  }
}

// Automated SMS Helper using Twilio
async function sendAutoSmsForPayment(supabase, contact, amount, projectTitle) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+14155238886';

    if (!accountSid || !authToken) {
      console.warn('[QBO Auto-SMS] Twilio credentials missing.');
      return;
    }

    if (!contact.phone) {
      console.warn(`[QBO Auto-SMS] Contact ${contact.id} has no registered phone number.`);
      return;
    }

    const cleanedPhone = contact.phone.trim();
    const smsBody = `Barba Construction: Hemos recibido su pago de $${amount} para el proyecto "${projectTitle}". Su estado ahora es "En Progreso". Nos comunicaremos pronto para coordinar la fecha de inicio. ¡Gracias por su confianza!`;

    console.log(`[QBO Auto-SMS] Sending SMS to ${cleanedPhone}...`);
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const params = new URLSearchParams();
    params.append('To', cleanedPhone);
    params.append('From', fromNumber);
    params.append('Body', smsBody);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
      },
      body: params.toString()
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[QBO Auto-SMS] Twilio API error:', data);
      return;
    }

    console.log(`[QBO Auto-SMS] SMS sent successfully. Message SID: ${data.sid}`);

    // Insert into db (conversaciones and mensajes) to keep sync with inbox
    // 1. Search or create SMS conversation
    let { data: conversacion, error: convError } = await supabase
      .from('conversaciones')
      .select('id')
      .eq('cliente_id', contact.id)
      .eq('canal', 'sms')
      .eq('estado', 'activa')
      .maybeSingle();

    if (!conversacion) {
      const { data: nuevaConv, error: nuevaConvError } = await supabase
        .from('conversaciones')
        .insert([{
          cliente_id: contact.id,
          canal: 'sms',
          estado: 'activa'
        }])
        .select()
        .single();
      
      if (!nuevaConvError && nuevaConv) {
        conversacion = nuevaConv;
      }
    } else {
      await supabase
        .from('conversaciones')
        .update({ ultima_interaccion: new Date().toISOString() })
        .eq('id', conversacion.id);
    }

    if (conversacion) {
      const { error: msgError } = await supabase
        .from('mensajes')
        .insert([{
          conversacion_id: conversacion.id,
          direccion: 'outbound',
          contenido: smsBody,
          twilio_message_sid: data.sid,
          estado_entrega: 'enviado'
        }]);

      if (msgError) {
        console.error('[QBO Auto-SMS] Error saving message to database:', msgError);
      }
    }

  } catch (err) {
    console.error('[QBO Auto-SMS] Error sending automated SMS:', err);
  }
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
    const custCheckRes = await fetch(`${qboBaseUrl}/v3/company/${realmId}/customer/${qboCustomerId}?minorversion=65`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    logQboTid(custCheckRes, 'Customer Check');
    if (custCheckRes.status === 404) {
      qboCustomerId = null;
    }
  }

  if (!qboCustomerId) {
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
      await supabase
        .from('contacts')
        .update({ qbo_customer_id: qboCustomerId })
        .eq('id', contact.id);
    } else {
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = req.query.action || req.body.action;

  if (!action) {
    return res.status(400).json({ error: 'Missing action parameter' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase environment variables not configured on server' });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    switch (action) {
      case 'status': {
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
        
        const { data, error } = await supabase
          .from('system_settings')
          .select('key, value')
          .in('key', ['qbo_refresh_token', 'qbo_realm_id', 'qbo_environment']);

        if (error) throw error;

        const settings = {};
        (data || []).forEach(row => {
          settings[row.key] = row.value;
        });

        return res.status(200).json({
          connected: !!settings.qbo_refresh_token,
          realmId: settings.qbo_realm_id || null,
          environment: settings.qbo_environment || 'sandbox'
        });
      }

      case 'callback': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        const { code, realmId, redirectUri } = req.body;
        const qboClientId = process.env.QBO_CLIENT_ID;
        const qboClientSecret = process.env.QBO_CLIENT_SECRET;
        const qboEnv = process.env.QBO_ENVIRONMENT || 'sandbox';

        if (!code || !realmId || !redirectUri) {
          return res.status(400).json({ error: 'Missing code, realmId, or redirectUri in request body' });
        }
        if (!qboClientId || !qboClientSecret) {
          return res.status(500).json({ error: 'QuickBooks Client ID or Secret not configured' });
        }

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
        const upsertRows = [
          { key: 'qbo_access_token', value: tokens.access_token, updated_at: new Date().toISOString() },
          { key: 'qbo_refresh_token', value: tokens.refresh_token, updated_at: new Date().toISOString() },
          { key: 'qbo_expires_at', value: expiresAt, updated_at: new Date().toISOString() },
          { key: 'qbo_realm_id', value: realmId, updated_at: new Date().toISOString() },
          { key: 'qbo_environment', value: qboEnv, updated_at: new Date().toISOString() }
        ];

        const { error: dbError } = await supabase.from('system_settings').upsert(upsertRows);
        if (dbError) throw dbError;

        return res.status(200).json({ success: true });
      }

      case 'disconnect': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        const qboKeys = ['qbo_access_token', 'qbo_refresh_token', 'qbo_expires_at', 'qbo_realm_id', 'qbo_environment'];
        const { error } = await supabase.from('system_settings').delete().in('key', qboKeys);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'sync': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        const { estimateId } = req.body;
        if (!estimateId) return res.status(400).json({ error: 'Missing estimateId in request body' });
        const result = await syncEstimateToQBO(supabase, estimateId);
        return res.status(200).json(result);
      }

      case 'webhook': {
        console.log("[QBO Webhook] Received webhook notification from QuickBooks.");
        try {
          await supabase.from('system_settings').upsert({
            key: 'last_webhook_received',
            value: JSON.stringify({
              time: new Date().toISOString(),
              headers: req.headers,
              body: req.body
            }),
            updated_at: new Date().toISOString()
          });
        } catch (logErr) {
          console.error("Error logging webhook to DB:", logErr);
        }

        try {
          const signature = req.headers['intuit-signature'];
          
          // Fetch settings to check for the verifier token
          const { data: settingsData } = await supabase
            .from('system_settings')
            .select('key, value')
            .in('key', ['qbo_verifier_token']);
            
          const settings = {};
          (settingsData || []).forEach(row => { settings[row.key] = row.value; });
          
          const verifierToken = settings.qbo_verifier_token || process.env.QBO_VERIFIER_TOKEN;
          
          if (verifierToken && signature) {
            const crypto = await import('crypto');
            const payloadStr = JSON.stringify(req.body);
            const hash = crypto
              .createHmac('sha256', verifierToken)
              .update(payloadStr, 'utf8')
              .digest('base64');
              
            const verified = crypto.timingSafeEqual(
              Buffer.from(hash, 'base64'),
              Buffer.from(signature, 'base64')
            );
            
            if (!verified) {
              console.warn("[QBO Webhook] Signature verification failed. Webhook ignored.");
              return res.status(401).send('Invalid signature');
            }
            console.log("[QBO Webhook] Signature verified successfully.");
          }
        } catch (err) {
          console.error("[QBO Webhook] Error verifying signature:", err);
          return res.status(500).json({ error: 'Signature verification error' });
        }
        // Fall through to pull-recent sync
      }

      case 'pull-recent':
      case 'bulk-import': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        
        // 1. Fetch QBO settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('system_settings')
          .select('key, value')
          .in('key', ['qbo_access_token', 'qbo_refresh_token', 'qbo_expires_at', 'qbo_realm_id', 'qbo_environment']);

        if (settingsError) throw settingsError;

        const settings = {};
        (settingsData || []).forEach(row => { settings[row.key] = row.value; });

        if (!settings.qbo_refresh_token) {
          return res.status(400).json({ error: 'QuickBooks is not connected.' });
        }

        let accessToken = settings.qbo_access_token;
        const expiresAt = settings.qbo_expires_at ? new Date(settings.qbo_expires_at).getTime() : 0;
        if (!accessToken || expiresAt - Date.now() < 120000) {
          const qboClientId = process.env.QBO_CLIENT_ID;
          const qboClientSecret = process.env.QBO_CLIENT_SECRET;
          accessToken = await refreshQboToken(supabase, settings, qboClientId, qboClientSecret);
        }

        const realmId = settings.qbo_realm_id;
        const qboEnv = settings.qbo_environment || 'sandbox';
        const qboBaseUrl = qboEnv === 'production' ? 'https://quickbooks.api.intuit.com' : 'https://sandbox-quickbooks.api.intuit.com';

        // Fetch local contacts & estimates & profiles
        const [{ data: localContacts }, { data: localEstimates }, { data: allProfiles }] = await Promise.all([
          supabase.from('contacts').select('*'),
          supabase.from('estimates').select('*'),
          supabase.from('profiles').select('id, full_name')
        ]);

        const qboCustomerIdToSupabaseId = {};
        (localContacts || []).forEach(c => {
          if (c.qbo_customer_id) {
            qboCustomerIdToSupabaseId[c.qbo_customer_id] = c.id;
          }
        });

        // Define queries based on action
        let customerQuery = '';
        let invoiceQuery = '';
        let estimateQuery = '';

        if (action === 'pull-recent' || action === 'webhook') {
          // Sync last 60 days of changes to be safe and cover recent activities
          const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000);
          const sinceTimeStr = sixtyDaysAgo.toISOString().split('.')[0] + 'Z';
          customerQuery = `SELECT * FROM Customer WHERE Metadata.LastUpdatedTime >= '${sinceTimeStr}' STARTPOSITION 1 MAXRESULTS 500`;
          invoiceQuery = `SELECT * FROM Invoice WHERE Metadata.LastUpdatedTime >= '${sinceTimeStr}' STARTPOSITION 1 MAXRESULTS 500`;
          estimateQuery = `SELECT * FROM Estimate WHERE Metadata.LastUpdatedTime >= '${sinceTimeStr}' STARTPOSITION 1 MAXRESULTS 500`;
        } else {
          // Bulk Import (everything since 2026-01-01)
          customerQuery = `SELECT * FROM Customer WHERE Metadata.CreateTime >= '2026-01-01T00:00:00-05:00' STARTPOSITION 1 MAXRESULTS 1000`;
          invoiceQuery = `SELECT * FROM Invoice WHERE TxnDate >= '2026-01-01' STARTPOSITION 1 MAXRESULTS 1000`;
          estimateQuery = `SELECT * FROM Estimate WHERE Metadata.CreateTime >= '2026-01-01T00:00:00-05:00' STARTPOSITION 1 MAXRESULTS 1000`;
        }

        // Fetch Customers from QBO
        const customerRes = await fetch(`${qboBaseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(customerQuery)}&minorversion=65`, {
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
        });
        if (!customerRes.ok) throw new Error(`QBO Customers fetch failed: ${customerRes.statusText}`);
        const customerJson = await customerRes.json();
        const qboCustomers = customerJson.QueryResponse?.Customer || [];

        let customersMatched = 0;
        let customersCreated = 0;

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
            const updates = { qbo_customer_id: qboId };
            if (!matchedContact.phone && phone) updates.phone = phone;
            if (!matchedContact.address && address) updates.address = address;
            if (!matchedContact.city && city) updates.city = city;
            if (!matchedContact.state && state) updates.state = state;
            if (!matchedContact.zip && zip) updates.zip = zip;

            await supabase.from('contacts').update(updates).eq('id', matchedContact.id);
            customersMatched++;
            qboCustomerIdToSupabaseId[qboId] = matchedContact.id;
          } else {
            const { data: newContactData, error: insertContactError } = await supabase.from('contacts').insert({
              first_name: firstName,
              last_name: lastName,
              email: email || null,
              phone: phone || null,
              address: address || null,
              city: city || null,
              state: state || null,
              zip: zip || null,
              qbo_customer_id: qboId
            }).select();

            if (insertContactError) throw insertContactError;
            if (newContactData && newContactData.length > 0) {
              qboCustomerIdToSupabaseId[qboId] = newContactData[0].id;
            }
            customersCreated++;
          }
        }

        // Fetch Estimates from QBO (estimateQuery defined above)
        const estimateRes = await fetch(`${qboBaseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(estimateQuery)}&minorversion=65`, {
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
        });
        if (!estimateRes.ok) throw new Error(`QBO Estimates fetch failed: ${estimateRes.statusText}`);
        const estimateJson = await estimateRes.json();
        const qboEstimates = estimateJson.QueryResponse?.Estimate || [];

        let estimatesMatched = 0;
        let estimatesCreated = 0;

        for (const qboEst of qboEstimates) {
          const estId = qboEst.Id;
          const docNum = qboEst.DocNumber || '';
          
          let matchedEst = localEstimates.find(e => e.qbo_estimate_id === estId);
          if (!matchedEst && docNum) {
            const parsedNum = parseInt(docNum.replace(/\D/g, ''), 10);
            if (!isNaN(parsedNum)) {
              matchedEst = localEstimates.find(e => e.estimate_number === parsedNum);
            }
          }

          const activeContact = localContacts.find(c => c.id === (matchedEst ? matchedEst.contact_id : null));
          const resolvedCreatorId = resolveCreatorFromQbo(qboEst, allProfiles) || activeContact?.assigned_to || null;
          const mappedStatus = mapQboEstimateStatus(qboEst.TxnStatus);

          if (matchedEst) {
            const updates = { 
              qbo_estimate_id: estId, 
              status: mappedStatus,
              updated_at: qboEst.Metadata?.LastUpdatedTime || new Date().toISOString()
            };
            if (resolvedCreatorId && !matchedEst.created_by) {
              updates.created_by = resolvedCreatorId;
            }
            await supabase.from('estimates').update(updates).eq('id', matchedEst.id);
            estimatesMatched++;
          } else {
            const qboCustId = qboEst.CustomerRef.value;
            let contactId = qboCustomerIdToSupabaseId[qboCustId];
            
            if (!contactId) {
              const { data: dbCont } = await supabase.from('contacts').select('id, assigned_to').eq('qbo_customer_id', qboCustId).single();
              if (dbCont) {
                contactId = dbCont.id;
                qboCustomerIdToSupabaseId[qboCustId] = contactId;
              }
            }

            const activeContactForNew = localContacts.find(c => c.id === contactId);
            const creatorId = resolveCreatorFromQbo(qboEst, allProfiles) || activeContactForNew?.assigned_to || null;

            if (contactId) {
              const lines = qboEst.Line || [];
              const workType = detectWorkType(lines);
              const subtotal = parseFloat(qboEst.TotalAmt || 0);
              const grandTotal = parseFloat(qboEst.TotalAmt || 0);
              const notes = qboEst.CustomerMemo?.value || 'Imported from QuickBooks Online Estimate';
              const createdAt = qboEst.TxnDate ? (qboEst.TxnDate + 'T12:00:00Z') : (qboEst.Metadata?.CreateTime || new Date().toISOString());
              const updatedAt = qboEst.Metadata?.LastUpdatedTime || new Date().toISOString();

              const { data: doubleCheck } = await supabase
                .from('estimates')
                .select('id')
                .eq('qbo_estimate_id', estId)
                .maybeSingle();

              if (doubleCheck) {
                console.log(`[QBO Sync] Prevented duplicate insertion for QBO Estimate ${estId} in real-time.`);
                continue;
              }

              const insertPayload = {
                contact_id: contactId,
                status: mappedStatus,
                work_type: workType,
                subtotal: subtotal,
                grand_total: grandTotal,
                notes: notes,
                scope_of_work: 'Imported from QuickBooks Online Estimate',
                qbo_estimate_id: estId,
                created_by: creatorId,
                created_at: createdAt,
                updated_at: updatedAt
              };

              if (docNum) {
                const parsedNum = parseInt(docNum.replace(/\D/g, ''), 10);
                if (!isNaN(parsedNum)) {
                  insertPayload.estimate_number = parsedNum;
                }
              }

              const { data: newEstData, error: newEstErr } = await supabase
                .from('estimates')
                .insert(insertPayload)
                .select();

              if (newEstErr) {
                console.error(`Error inserting estimate for QBO Estimate ${estId}:`, newEstErr);
                continue;
              }

              if (newEstData && newEstData.length > 0) {
                const newEst = newEstData[0];
                
                const itemsToInsert = [];
                for (const line of lines) {
                  if (line.DetailType === 'SalesItemLineDetail') {
                    const detail = line.SalesItemLineDetail || {};
                    itemsToInsert.push({
                      estimate_id: newEst.id,
                      description: line.Description || detail.ItemRef?.name || 'Services',
                      quantity: parseFloat(detail.Qty || 1),
                      unit_price: parseFloat(detail.UnitPrice || line.Amount || 0),
                      created_at: createdAt
                    });
                  }
                }

                if (itemsToInsert.length > 0) {
                  const { error: itemsErr } = await supabase
                    .from('estimate_items')
                    .insert(itemsToInsert);
                  if (itemsErr) {
                    console.error(`Error inserting items for QBO Estimate ${estId}:`, itemsErr);
                  }
                }

                estimatesCreated++;
              }
            }
          }
        }

        // Fetch Invoices from QBO (invoiceQuery defined above)
        const invoiceRes = await fetch(`${qboBaseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(invoiceQuery)}&minorversion=65`, {
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
        });
        if (!invoiceRes.ok) throw new Error(`QBO Invoices fetch failed: ${invoiceRes.statusText}`);
        const invoiceJson = await invoiceRes.json();
        const qboInvoices = invoiceJson.QueryResponse?.Invoice || [];

        let invoicesMatched = 0;
        let invoicesCreated = 0;

        for (const qboInv of qboInvoices) {
          const invId = qboInv.Id;
          const docNum = qboInv.DocNumber || '';
          
          let matchedEst = localEstimates.find(e => e.qbo_invoice_id === invId);
          
          // Try matching via LinkedTxn to find the original Estimate ID from QuickBooks
          if (!matchedEst) {
            const linkedTxns = qboInv.LinkedTxn || [];
            const estimateLink = linkedTxns.find(lt => lt.TxnType === 'Estimate');
            if (estimateLink) {
              matchedEst = localEstimates.find(e => e.qbo_estimate_id === estimateLink.TxnId);
            }
          }

          // Fallback to matching by estimate number
          if (!matchedEst && docNum) {
            const parsedNum = parseInt(docNum.replace(/\D/g, ''), 10);
            if (!isNaN(parsedNum)) {
              matchedEst = localEstimates.find(e => e.estimate_number === parsedNum);
            }
          }

          if (matchedEst) {
            const resolvedCreatorId = resolveCreatorFromQbo(qboInv, allProfiles);
            const updates = { qbo_invoice_id: invId, qbo_invoice_number: docNum };
            if (matchedEst.status !== 'approved') updates.status = 'approved';

            // Set qbo_estimate_id if we have it in LinkedTxn and it's not set
            const linkedTxns = qboInv.LinkedTxn || [];
            const estimateLink = linkedTxns.find(lt => lt.TxnType === 'Estimate');
            if (estimateLink && !matchedEst.qbo_estimate_id) {
              updates.qbo_estimate_id = estimateLink.TxnId;
            }

            if (resolvedCreatorId && !matchedEst.created_by) {
              updates.created_by = resolvedCreatorId;
            }
            await supabase.from('estimates').update(updates).eq('id', matchedEst.id);
            invoicesMatched++;

            // Resolve contact and details
            const contactObj = localContacts.find(c => c.id === matchedEst.contact_id);
            const clientName = contactObj ? `${contactObj.first_name} ${contactObj.last_name}` : 'Client';
            const workType = detectWorkType(qboInv.Line);
            const grandTotal = parseFloat(qboInv.TotalAmt || 0);
            const balance = parseFloat(qboInv.Balance || 0);
            const hasPayment = balance < grandTotal;

            if (hasPayment) {
              // Fetch matched projects if they exist
              const { data: matchedProjList } = await supabase
                .from('projects')
                .select('*')
                .eq('estimate_id', matchedEst.id);

              if (matchedProjList && matchedProjList.length > 0) {
                const matchedProj = matchedProjList[0];
                const projUpdates = {
                  sold_price: grandTotal,
                  // Update status based on QuickBooks balance
                  status: balance === 0 ? 'completed' : matchedProj.status
                };
                await supabase.from('projects').update(projUpdates).eq('id', matchedProj.id);
              } else {
                // Create project since it does not exist for this approved estimate and has a payment
                await supabase.from('projects').insert({
                  estimate_id: matchedEst.id,
                  contact_id: matchedEst.contact_id,
                  title: `${clientName} - ${workType}`,
                  status: balance === 0 ? 'completed' : 'in_progress',
                  sold_price: grandTotal,
                  address: contactObj?.address || 'To be confirmed',
                  created_at: qboInv.TxnDate ? (qboInv.TxnDate + 'T12:00:00Z') : (qboInv.Metadata?.CreateTime || new Date().toISOString()),
                  start_date: qboInv.TxnDate || (qboInv.Metadata?.CreateTime || new Date().toISOString()).split('T')[0]
                });
                invoicesCreated++;
              }
            }
          } else {
            const qboCustId = qboInv.CustomerRef.value;
            let contactId = qboCustomerIdToSupabaseId[qboCustId];
            
            if (!contactId) {
              const { data: dbCont } = await supabase.from('contacts').select('id').eq('qbo_customer_id', qboCustId).single();
              if (dbCont) {
                contactId = dbCont.id;
                qboCustomerIdToSupabaseId[qboCustId] = contactId;
              }
            }

            if (!contactId) {
              console.log(`Contact not found in local DB/map. Fetching Customer ${qboCustId} from QBO on-the-fly...`);
              try {
                const custRes = await fetch(`${qboBaseUrl}/v3/company/${realmId}/customer/${qboCustId}?minorversion=65`, {
                  headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
                });
                if (custRes.ok) {
                  const custJson = await custRes.json();
                  const qboCust = custJson.Customer;
                  if (qboCust) {
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

                    const { data: newContactData, error: insertContactError } = await supabase.from('contacts').insert({
                      first_name: firstName,
                      last_name: lastName,
                      email: email || null,
                      phone: phone || null,
                      address: address || null,
                      city: city || null,
                      state: state || null,
                      zip: zip || null,
                      qbo_customer_id: qboCustId
                    }).select();

                    if (!insertContactError && newContactData && newContactData.length > 0) {
                      contactId = newContactData[0].id;
                      qboCustomerIdToSupabaseId[qboCustId] = contactId;
                      customersCreated++;
                    }
                  }
                }
              } catch (custErr) {
                console.error(`Failed to fetch QBO customer ${qboCustId} on-the-fly:`, custErr);
              }
            }

            if (contactId) {
              const lines = qboInv.Line || [];
              const workType = detectWorkType(lines);
              const subtotal = parseFloat(qboInv.TotalAmt || 0);
              const grandTotal = parseFloat(qboInv.TotalAmt || 0);
              const balance = parseFloat(qboInv.Balance || 0);
              const notes = qboInv.CustomerMemo?.value || 'Imported from QuickBooks Online';
              const createdAt = qboInv.TxnDate ? (qboInv.TxnDate + 'T12:00:00Z') : (qboInv.Metadata?.CreateTime || new Date().toISOString());
              const updatedAt = qboInv.Metadata?.LastUpdatedTime || new Date().toISOString();

              const resolvedCreatorId = resolveCreatorFromQbo(qboInv, allProfiles);
              const linkedTxns = qboInv.LinkedTxn || [];
              const estimateLink = linkedTxns.find(lt => lt.TxnType === 'Estimate');

              const { data: doubleCheckInvList } = await supabase
                .from('estimates')
                .select('id')
                .eq('qbo_invoice_id', invId);

              if (doubleCheckInvList && doubleCheckInvList.length > 0) {
                const doubleCheckInv = doubleCheckInvList[0];
                console.log(`[QBO Sync] Estimate already exists for QBO Invoice ${invId} (ID: ${doubleCheckInv.id}).`);
                
                const hasPayment = balance < grandTotal;
                if (hasPayment) {
                  const { data: matchedProjList } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('estimate_id', doubleCheckInv.id);

                  if (matchedProjList && matchedProjList.length > 0) {
                    const matchedProj = matchedProjList[0];
                    const projUpdates = {
                      sold_price: grandTotal,
                      status: balance === 0 ? 'completed' : matchedProj.status
                    };
                    await supabase.from('projects').update(projUpdates).eq('id', matchedProj.id);
                  } else {
                    const { data: contactObj } = await supabase
                      .from('contacts')
                      .select('*')
                      .eq('id', contactId)
                      .single();

                    const clientName = contactObj ? `${contactObj.first_name} ${contactObj.last_name}` : 'Client';
                    const projectAddress = contactObj?.address || qboInv.BillAddr?.Line1 || '';

                    const { error: projErr } = await supabase.from('projects').insert({
                      estimate_id: doubleCheckInv.id,
                      contact_id: contactId,
                      title: `${clientName} - ${workType}`,
                      status: balance === 0 ? 'completed' : 'in_progress',
                      sold_price: grandTotal,
                      address: projectAddress,
                      created_at: createdAt,
                      start_date: createdAt.split('T')[0]
                    });

                    if (!projErr) {
                      invoicesCreated++;
                      // Trigger automated SMS for payment received
                      if (contactObj) {
                        const paymentAmount = grandTotal - balance;
                        const projectTitle = `${clientName} - ${workType}`;
                        sendAutoSmsForPayment(supabase, contactObj, paymentAmount.toFixed(2), projectTitle);
                      }
                    }
                  }
                }
                continue;
              }

              const insertPayload = {
                contact_id: contactId,
                status: 'approved',
                work_type: workType,
                subtotal: subtotal,
                grand_total: grandTotal,
                notes: notes,
                scope_of_work: 'Imported from QuickBooks Online',
                qbo_invoice_id: invId,
                qbo_invoice_number: docNum,
                qbo_estimate_id: estimateLink ? estimateLink.TxnId : null,
                created_by: resolvedCreatorId || null,
                created_at: createdAt,
                updated_at: updatedAt
              };

              if (docNum) {
                const parsedNum = parseInt(docNum.replace(/\D/g, ''), 10);
                if (!isNaN(parsedNum)) {
                  insertPayload.estimate_number = parsedNum;
                }
              }

              const { data: newEstData, error: newEstErr } = await supabase
                .from('estimates')
                .insert(insertPayload)
                .select();

              if (newEstErr) {
                console.error(`Error inserting estimate for QBO Invoice ${invId}:`, newEstErr);
                continue;
              }

              if (newEstData && newEstData.length > 0) {
                const newEst = newEstData[0];
                
                const { data: contactObj } = await supabase
                  .from('contacts')
                  .select('*')
                  .eq('id', contactId)
                  .single();
                
                // Trigger automated email with invoice PDF from QBO
                if (contactObj && contactObj.email) {
                  sendAutoEmailForInvoice(supabase, newEst.id, contactObj, invId, docNum, accessToken, qboBaseUrl, realmId);
                }
                
                const clientName = contactObj ? `${contactObj.first_name} ${contactObj.last_name}` : 'Client';
                const projectAddress = contactObj?.address || qboInv.BillAddr?.Line1 || '';
                const hasPayment = balance < grandTotal;

                if (hasPayment) {
                  const { error: projErr } = await supabase
                    .from('projects')
                    .insert({
                      estimate_id: newEst.id,
                      contact_id: contactId,
                      title: `${clientName} - ${workType}`,
                      status: balance === 0 ? 'completed' : 'in_progress',
                      sold_price: grandTotal,
                      address: projectAddress,
                      created_at: createdAt,
                      start_date: createdAt.split('T')[0]
                    });

                  if (projErr) {
                    console.error(`Error inserting project for QBO Invoice ${invId}:`, projErr);
                  } else {
                    invoicesCreated++;
                    // Trigger automated SMS for payment received
                    if (contactObj) {
                      const paymentAmount = grandTotal - balance;
                      const projectTitle = `${clientName} - ${workType}`;
                      sendAutoSmsForPayment(supabase, contactObj, paymentAmount.toFixed(2), projectTitle);
                    }
                  }
                }

                const itemsToInsert = [];
                for (const line of lines) {
                  if (line.DetailType === 'SalesItemLineDetail') {
                    const detail = line.SalesItemLineDetail || {};
                    itemsToInsert.push({
                      estimate_id: newEst.id,
                      description: line.Description || detail.ItemRef?.name || 'Services',
                      quantity: parseFloat(detail.Qty || 1),
                      unit_price: parseFloat(detail.UnitPrice || line.Amount || 0),
                      created_at: createdAt
                    });
                  }
                }

                if (itemsToInsert.length > 0) {
                  const { error: itemsErr } = await supabase
                    .from('estimate_items')
                    .insert(itemsToInsert);
                  if (itemsErr) {
                    console.error(`Error inserting items for QBO Invoice ${invId}:`, itemsErr);
                  }
                }
              }
            } else {
              console.warn(`Could not find contact for QBO Customer ID: ${qboCustId} matching Invoice ${invId}`);
            }
          }
        }

        return res.status(200).json({
          success: true,
          customersProcessed: qboCustomers.length,
          customersMatched,
          customersCreated,
          estimatesProcessed: qboEstimates.length,
          estimatesMatched,
          estimatesCreated,
          invoicesProcessed: qboInvoices.length,
          invoicesMatched,
          invoicesCreated
        });
      }

      default: {
        return res.status(400).json({ error: `Unsupported action: ${action}` });
      }
    }
  } catch (err) {
    console.error(`QBO API [action=${action}] error:`, err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
