import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export default async function handler(req, res) {
  // CORS Headers para permitir llamadas desde el frontend local y en producción
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        // Reemplazamos los saltos de linea literales \n por saltos reales
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: SCOPES,
    });

    const calendar = google.calendar({ version: 'v3', auth });
    
    // Si no enviamos un ID de calendario desde el front, usamos el del sistema o el primary de la cuenta de servicio
    // (Nota: es ideal compartir un calendario con la cuenta de servicio y usar su ID aquí)
    const calendarId = req.query.calendarId || process.env.GOOGLE_CALENDAR_ID || 'primary';

    if (req.method === 'GET') {
      // Obtener eventos
      const response = await calendar.events.list({
        calendarId: calendarId,
        timeMin: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(), // Desde hace 1 mes
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime',
      });
      return res.status(200).json(response.data.items || []);
    } 
    
    if (req.method === 'POST') {
      // Crear evento nuevo
      const event = req.body;
      const response = await calendar.events.insert({
        calendarId: calendarId,
        requestBody: event,
      });
      return res.status(200).json(response.data);
    }

    if (req.method === 'DELETE') {
      // Eliminar evento
      const { eventId } = req.query;
      if (!eventId) return res.status(400).json({ error: 'Falta el eventId' });
      
      await calendar.events.delete({
        calendarId: calendarId,
        eventId: eventId,
      });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error en API de Google Calendar:', error);
    return res.status(500).json({ error: error.message || 'Error del servidor' });
  }
}
