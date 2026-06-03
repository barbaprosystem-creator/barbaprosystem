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
    let auth;
    let calendarId = req.query.calendarId || process.env.GOOGLE_CALENDAR_ID || 'primary';

    const userRefreshToken = req.body?.user_refresh_token || req.query?.user_refresh_token;

    if (userRefreshToken) {
      // Usar calendario personal del vendedor
      auth = new google.auth.OAuth2(
        process.env.VITE_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      auth.setCredentials({ refresh_token: userRefreshToken });
      calendarId = 'primary'; // Para el calendario personal, siempre es 'primary'
    } else {
      // Usar cuenta de servicio global
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: SCOPES,
      });
    }

    const calendar = google.calendar({ version: 'v3', auth });

    if (req.method === 'GET') {
      const timeMin = new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString();

      if (userRefreshToken) {
        // 1. Configurar auth con refresh token del usuario
        const oauth2Client = new google.auth.OAuth2(
          process.env.VITE_GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: userRefreshToken });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        let allGoogleItems = [];
        let calendarListSuccess = false;

        // Intentar obtener todos los calendarios activos
        try {
          const calListRes = await calendar.calendarList.list();
          const calendars = calListRes.data.items || [];
          const activeCalendars = calendars.filter(c => c.selected || c.primary);

          if (activeCalendars.length > 0) {
            calendarListSuccess = true;
            const eventPromises = activeCalendars.map(async (cal) => {
              try {
                const res = await calendar.events.list({
                  calendarId: cal.id,
                  timeMin: timeMin,
                  maxResults: 1000,
                  singleEvents: true,
                  orderBy: 'startTime',
                });
                return (res.data.items || []).map(ev => ({
                  ...ev,
                  calendarName: cal.summary,
                  calendarColor: cal.backgroundColor || null,
                  isTask: false,
                }));
              } catch (err) {
                console.warn(`Error fetching events for calendar ${cal.id}:`, err.message);
                return [];
              }
            });
            const eventsNested = await Promise.all(eventPromises);
            allGoogleItems.push(...eventsNested.flat());
          }
        } catch (err) {
          console.warn('Could not retrieve calendar list, falling back to primary:', err.message);
        }

        // Si falló el listado de calendarios (por ejemplo, falta de scopes), consultar solo el principal
        if (!calendarListSuccess) {
          try {
            const res = await calendar.events.list({
              calendarId: 'primary',
              timeMin: timeMin,
              maxResults: 1000,
              singleEvents: true,
              orderBy: 'startTime',
            });
            const primaryEvents = (res.data.items || []).map(ev => ({
              ...ev,
              calendarName: 'Primary',
              isTask: false,
            }));
            allGoogleItems.push(...primaryEvents);
          } catch (err) {
            console.error('Error fetching primary calendar events:', err);
          }
        }

        // 2. Intentar obtener tareas de Google Tasks
        try {
          const tasksClient = google.tasks({ version: 'v1', auth: oauth2Client });
          const taskListsRes = await tasksClient.tasklists.list({ maxResults: 100 });
          const taskLists = taskListsRes.data.items || [];

          const taskPromises = taskLists.map(async (list) => {
            try {
              const res = await tasksClient.tasks.list({
                tasklist: list.id,
                showCompleted: true,
                showHidden: true,
                maxResults: 150,
              });
              return (res.data.items || []).map(task => ({
                id: task.id,
                summary: task.title || '(Untitled Task)',
                description: task.notes || '',
                start: { date: task.due ? task.due.split('T')[0] : new Date().toISOString().split('T')[0] },
                end: { date: task.due ? task.due.split('T')[0] : new Date().toISOString().split('T')[0] },
                isTask: true,
                taskStatus: task.status, // 'needsAction' o 'completed'
                taskListName: list.title,
                htmlLink: 'https://tasks.google.com/',
              }));
            } catch (err) {
              console.warn(`Error fetching tasks from list ${list.id}:`, err.message);
              return [];
            }
          });
          const tasksNested = await Promise.all(taskPromises);
          allGoogleItems.push(...tasksNested.flat());
        } catch (err) {
          console.warn('Could not retrieve Google Tasks (API disabled or missing scopes):', err.message);
        }

        return res.status(200).json(allGoogleItems);
      } else {
        // Cuenta de servicio global (comportamiento original)
        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          },
          scopes: SCOPES,
        });
        const calendar = google.calendar({ version: 'v3', auth });
        const response = await calendar.events.list({
          calendarId: calendarId,
          timeMin: timeMin,
          maxResults: 1000,
          singleEvents: true,
          orderBy: 'startTime',
        });
        return res.status(200).json(response.data.items || []);
      }
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
