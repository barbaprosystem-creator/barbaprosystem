import { Resend } from 'resend';

// Inicializar Resend usando la variable de entorno que configuraremos en Vercel
const resend = new Resend(process.env.RESEND_API_KEY);

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
    const { to, subject, html, text, fromName = 'Barba Construction' } = req.body;

    if (!to || !subject) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: to, subject' });
    }

    // Usamos el dominio verificado barbaprosystem.com
    const { data, error } = await resend.emails.send({
      from: `${fromName} <info@barbaprosystem.com>`,
      to: [to],
      subject: subject,
      html: html || '',
      text: text || '',
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
