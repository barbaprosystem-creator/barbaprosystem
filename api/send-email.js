import { Resend } from 'resend';

export default async function handler(req, res) {
  // Configuración de CORS para permitir peticiones desde el frontend
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Manejar la petición preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'La llave de Resend (RESEND_API_KEY) no está configurada en Vercel.' });
    }
    
    const resend = new Resend(apiKey);
    const { to, subject, html, text, fromName = 'Barba Construction', attachments } = req.body;

    if (!to || !subject) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: to, subject' });
    }

    let finalHtml = html;
    
    if (!finalHtml && text) {
      // Create a clean, plain-text looking email with a professional signature to avoid "Promotions" tab
      const formattedText = text.replace(/\n/g, '<br />');
      finalHtml = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #111; line-height: 1.5; max-width: 800px;">
        <div style="margin-bottom: 30px;">
          ${formattedText}
        </div>
        
        <div style="padding-top: 15px; margin-top: 30px;">
          <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 13px; color: #555;">
            <tr>
              <td style="padding-right: 15px; vertical-align: middle;">
                <img src="https://barbaprosystem.com/landing/logo.png" alt="Barba Construction" style="width: 90px; height: auto;" />
              </td>
              <td style="vertical-align: middle; border-left: 2px solid #FACB00; padding-left: 15px;">
                <strong style="color: #111; font-size: 15px; margin: 0; display: block; padding-bottom: 2px;">Barba Construction</strong>
                <span style="color: #888; font-size: 12px; display: block; padding-bottom: 8px;">Building Excellence, Restoring Trust.</span>
                <span style="color: #444; display: block; padding-bottom: 3px;">📍 5910 Preston Hwy, Louisville, KY 40219</span>
                <span style="color: #444; display: block; padding-bottom: 3px;">📞 <a href="tel:+15023058421" style="color: #1155cc; text-decoration: none;">(502) 305-8421</a> &nbsp;|&nbsp; ✉️ <a href="mailto:info@barbaprosystem.com" style="color: #1155cc; text-decoration: none;">info@barbaprosystem.com</a></span>
                <span style="color: #444; display: block;">🌐 <a href="https://barbaprosystem.com" style="color: #1155cc; text-decoration: none;">barbaprosystem.com</a></span>
              </td>
            </tr>
          </table>
        </div>
      </div>
      `;
    }

    const sendPayload = {
      from: `${fromName} <info@barbaprosystem.com>`,
      to: [to],
      subject: subject,
      html: finalHtml || '',
      text: text || '',
      reply_to: 'info@barbaprosystem.com'
    };

    if (attachments && Array.isArray(attachments)) {
      sendPayload.attachments = attachments.map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64')
      }));
    }

    // Usamos el dominio verificado barbaprosystem.com
    const { data, error } = await resend.emails.send(sendPayload);

    if (error) {
      console.error('Error de Resend API:', error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error enviando email:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
