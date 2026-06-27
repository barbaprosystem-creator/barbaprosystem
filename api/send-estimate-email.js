import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { syncEstimateToQBO } from './qbo-sync.js';

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
  const resendApiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase environment variables not configured on server' });
  }

  if (!resendApiKey) {
    return res.status(500).json({ error: 'Resend API key not configured on server' });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const resend = new Resend(resendApiKey);

  try {
    // 1. Fetch estimate + contact details
    const { data: estimate, error: estError } = await supabase
      .from('estimates')
      .select('*, contact:contacts(*)')
      .eq('id', estimateId)
      .single();

    if (estError) throw estError;
    if (!estimate) {
      return res.status(404).json({ error: 'Estimate not found' });
    }

    const contact = estimate.contact;
    if (!contact || !contact.email) {
      return res.status(400).json({ error: 'Client contact has no registered email' });
    }

    // 2. Sync to QBO first to get/create invoice and fetch pdf
    let qboInvoiceId = estimate.qbo_invoice_id;
    let qboInvoiceNumber = estimate.qbo_invoice_number;
    let qboBaseUrl = '';
    let realmId = '';
    let accessToken = '';

    console.log(`Syncing estimate ${estimateId} to QBO before emailing...`);
    try {
      const qboResult = await syncEstimateToQBO(supabase, estimateId);
      qboInvoiceId = qboResult.qboInvoiceId;
      qboInvoiceNumber = qboResult.qboInvoiceNumber;
      accessToken = qboResult.accessToken;
      qboBaseUrl = qboResult.qboBaseUrl;
      realmId = qboResult.realmId;
    } catch (qboErr) {
      console.error('QuickBooks sync failed during email flow:', qboErr);
      return res.status(500).json({ 
        error: `No se pudo crear/sincronizar la factura en QuickBooks: ${qboErr.message}` 
      });
    }

    // 3. Fetch PDF from QuickBooks Online
    console.log(`Fetching PDF for QBO Invoice ${qboInvoiceId}...`);
    const pdfUrl = `${qboBaseUrl}/v3/company/${realmId}/invoice/${qboInvoiceId}/pdf?minorversion=65`;
    const pdfRes = await fetch(pdfUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/pdf'
      }
    });

    if (!pdfRes.ok) {
      const errText = await pdfRes.text();
      throw new Error(`Failed to fetch QBO Invoice PDF: ${pdfRes.statusText} - ${errText}`);
    }

    const arrayBuffer = await pdfRes.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    const pdfBase64 = pdfBuffer.toString('base64');

    // 4. Send Email via Resend attaching the QBO PDF
    const signingLink = `https://barbaprosystem.com/p/${estimateId}`;
    const formattedNotes = estimate.notes ? estimate.notes.replace(/\n/g, '<br />') : '';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #111111; padding: 30px 20px; text-align: center; border-bottom: 5px solid #F5C518;">
          <img src="https://barbaprosystem.com/logo-barba.png" alt="Barba Construction" style="max-height: 60px; margin-bottom: 10px;" />
          <p style="color: #888888; font-size: 12px; margin-top: 0;">Excellence in Roofing, Siding & Gutters</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #111111; margin-top: 0; font-size: 20px;">Hello ${contact.first_name},</h2>
          <p style="color: #444444; line-height: 1.6; font-size: 15px;">Please find attached the official invoice <strong>#${qboInvoiceNumber}</strong> from QuickBooks Online for your project proposal.</p>
          
          ${formattedNotes ? `
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #F5C518; color: #333333; font-style: italic; font-size: 15px; line-height: 1.6;">
              ${formattedNotes}
            </div>
          ` : ''}
          
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
      throw new Error(`Resend failed: ${emailError.message}`);
    }

    // 5. Update local status to 'sent'
    const { error: statusError } = await supabase
      .from('estimates')
      .update({ status: 'sent', updated_at: new Date().toISOString() })
      .eq('id', estimateId);

    if (statusError) throw statusError;

    return res.status(200).json({ success: true, emailData });

  } catch (err) {
    console.error('Send Estimate Email error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
