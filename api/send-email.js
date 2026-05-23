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
    const { to, subject, html, text, fromName = 'Barba Construction' } = req.body;

    if (!to || !subject) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: to, subject' });
    }

    let finalHtml = html;
    
    if (!finalHtml && text) {
      // Create a nice HTML template for plain text
      const formattedText = text.replace(/\n/g, '<br />');
      finalHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px; color: #111; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
          .header { background-color: #111; padding: 30px 20px; text-align: center; border-bottom: 4px solid #FACB00; }
          .header img { max-height: 60px; }
          .content { padding: 40px 30px; font-size: 16px; line-height: 1.6; color: #374151; }
          .footer { background-color: #fafafa; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; }
          .footer p { margin: 5px 0; }
          .contact-info { display: inline-block; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb; width: 100%; }
          .contact-info a { color: #d97706; text-decoration: none; font-weight: bold; }
          .reply-note { margin-top: 20px; font-size: 12px; color: #9ca3af; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://barbaprosystem.com/landing/logo.png" alt="Barba Construction Logo" />
          </div>
          <div class="content">
            ${formattedText}
          </div>
          <div class="footer">
            <p><strong style="color: #111; font-size: 15px;">Barba Construction</strong></p>
            <p style="color: #d97706;">Building Excellence, Restoring Trust.</p>
            <div class="contact-info">
              <p>📍 5910 Preston Hwy, Louisville, KY 40219</p>
              <p>📞 <a href="tel:+15023058421">(502) 305-8421</a> | ✉️ <a href="mailto:barbaconstruct@gmail.com">barbaconstruct@gmail.com</a></p>
              <p>🌐 <a href="https://barbaprosystem.com">barbaprosystem.com</a></p>
            </div>
            <p class="reply-note">
              Puedes responder a este correo para comunicarte directamente con nuestro equipo.
            </p>
          </div>
        </div>
      </body>
      </html>
      `;
    }

    // Usamos el dominio verificado barbaprosystem.com
    const { data, error } = await resend.emails.send({
      from: `${fromName} <info@barbaprosystem.com>`,
      to: [to],
      subject: subject,
      html: finalHtml || '',
      text: text || '',
      reply_to: 'info@barbaprosystem.com'
    });

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
