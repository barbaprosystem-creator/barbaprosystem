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

  const { to, body } = req.body;

  if (!to || !body) {
    return res.status(400).json({ error: 'Faltan parámetros: "to" o "body" son requeridos.' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  // If the user wants to use a specific number, let's use the one from env, or a fallback if not set.
  // We'll hardcode +14155238886 as default, or use process.env.TWILIO_PHONE_NUMBER
  const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+14155238886'; 

  if (!accountSid || !authToken) {
    console.error("Twilio credentials missing in environment variables.");
    return res.status(500).json({ error: 'Falta configuración de Twilio en el servidor.' });
  }

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const params = new URLSearchParams();
    params.append('To', to);
    params.append('From', fromNumber);
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
