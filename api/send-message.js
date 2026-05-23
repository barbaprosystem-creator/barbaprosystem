export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, body, canal } = req.body;

  if (!to || !body) {
    return res.status(400).json({ error: 'Faltan parámetros: "to" o "body" son requeridos.' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+14155238886'; 

  if (!accountSid || !authToken) {
    console.error("Twilio credentials missing in environment variables.");
    return res.status(500).json({ error: 'Falta configuración de Twilio en el servidor.' });
  }

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    // Si el canal es whatsapp, Twilio requiere que los números tengan el prefijo "whatsapp:"
    const finalTo = canal === 'whatsapp' ? `whatsapp:${to}` : to;
    const finalFrom = canal === 'whatsapp' ? `whatsapp:${fromNumber}` : fromNumber;

    const params = new URLSearchParams();
    params.append('To', finalTo);
    params.append('From', finalFrom);
    params.append('Body', body);

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
      console.error("Error desde Twilio:", data);
      return res.status(response.status).json({ 
        error: 'Error al enviar mensaje por Twilio.', 
        details: data 
      });
    }

    // Success
    return res.status(200).json({ 
      success: true, 
      messageSid: data.sid,
      status: data.status 
    });

  } catch (error) {
    console.error('Error enviando mensaje:', error);
    return res.status(500).json({ error: 'Error interno al enviar el mensaje.' });
  }
}
