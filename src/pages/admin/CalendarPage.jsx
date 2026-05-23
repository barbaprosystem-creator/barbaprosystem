import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Plus, X, Briefcase, Users, CalendarSync, Link as LinkIcon, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

const locales = { 'es': es };

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const SALES_TYPES = {
  appointment: { label: 'Cita',        color: '#3b82f6' },
  inspection:  { label: 'Inspección',  color: '#f59e0b' },
  follow_up:   { label: 'Seguimiento', color: '#8b5cf6' },
  other:       { label: 'Otro',        color: '#6b7280' },
};

const PROJECT_TYPES = {
  project_start: { label: 'Inicio Proyecto', color: '#10b981' },
  payment_due:   { label: 'Pago Vence',      color: '#ef4444' },
  inspection:    { label: 'Inspección',      color: '#f59e0b' },
  other:         { label: 'Otro',            color: '#6b7280' },
};

const TAB_CONFIGS = {
  sales: {
    label: 'Ventas & Citas',
    Icon: Users,
    calendarType: 'sales',
    eventTypes: SALES_TYPES,
    defaultType: 'appointment',
    color: 'violet',
    description: 'Citas con clientes, seguimientos y visitas de ventas',
    privateNote: 'Cada vendedor solo ve sus propios eventos.',
  },
  projects: {
    label: 'Oficina & Proyectos',
    Icon: Briefcase,
    calendarType: 'projects',
    eventTypes: PROJECT_TYPES,
    defaultType: 'project_start',
    color: 'emerald',
    description: 'Hitos de proyectos, fechas de pago y avance de obra',
    privateNote: 'Visible para Admin y Oficina.',
  },
};

export default function CalendarPage() {
  const { profile, role } = useAuth();
  const [activeTab, setActiveTab]           = useState('sales');
  const [crmEvents, setCrmEvents]           = useState([]);   // from Supabase
  const [googleEvents, setGoogleEvents]     = useState([]);   // from Google Calendar API
  const [showForm, setShowForm]             = useState(false);
  const [form, setForm]                     = useState({ title: '', event_type: 'appointment', description: '', start: new Date(), end: new Date(), assigned_to: '' });
  const [isSyncing, setIsSyncing]           = useState(false);
  const [isFetchingGoogle, setIsFetchingGoogle] = useState(false);
  const [users, setUsers]                   = useState([]);
  const [selectedEvent, setSelectedEvent]   = useState(null);
  const [googleRefreshToken, setGoogleRefreshToken] = useState(null);

  // Load users
  useEffect(() => {
    supabase.from('profiles').select('id, full_name, role').then(({ data }) => setUsers(data || []));
  }, []);

  // Load stored Google refresh token
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.google_refresh_token) {
        setGoogleRefreshToken(user.user_metadata.google_refresh_token);
      }
    });
  }, []);

  // Whenever we have a token, fetch Google events
  useEffect(() => {
    if (googleRefreshToken) fetchGoogleEvents();
  }, [googleRefreshToken]);

  const loginGoogle = useGoogleLogin({
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/calendar.events',
    onSuccess: async (codeResponse) => {
      try {
        const res = await fetch('/api/calendar-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: codeResponse.code }),
        });
        if (!res.ok) throw new Error('Error al intercambiar el código');
        const tokens = await res.json();
        if (tokens.refresh_token) {
          await supabase.auth.updateUser({ data: { google_refresh_token: tokens.refresh_token } });
          setGoogleRefreshToken(tokens.refresh_token);
          alert('¡Calendario de Google conectado! Importando eventos...');
        } else {
          // Already connected — just re-fetch events
          fetchGoogleEvents();
          alert('Cuenta ya sincronizada. Recargando eventos de Google...');
        }
      } catch (err) {
        console.error(err);
        alert('Hubo un error conectando el calendario.');
      }
    },
    onError: err => console.error('Error Google Login', err),
  });

  const tabConfig = TAB_CONFIGS[activeTab];
  const canAccessProjects = role === 'admin' || role === 'office';

  // ── Fetch events from Supabase ──────────────────────────────
  const fetchCrmEvents = useCallback(async () => {
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('calendar_type', tabConfig.calendarType);

    if (activeTab === 'sales' && role === 'salesperson') {
      query = query.eq('created_by', profile?.id);
    }

    const { data } = await query;
    if (data) {
      setCrmEvents(data.map(ev => ({
        id:          ev.id,
        title:       ev.title,
        start:       new Date(ev.start_time),
        end:         ev.end_time ? new Date(ev.end_time) : new Date(new Date(ev.start_time).getTime() + 60 * 60 * 1000),
        event_type:  ev.event_type,
        desc:        ev.description,
        source:      'crm',
      })));
    }
  }, [activeTab, profile?.id, role, tabConfig.calendarType]);

  // ── Fetch events from Google Calendar ──────────────────────
  async function fetchGoogleEvents() {
    if (!googleRefreshToken) return;
    setIsFetchingGoogle(true);
    try {
      const res = await fetch(`/api/calendar?user_refresh_token=${encodeURIComponent(googleRefreshToken)}`);
      if (!res.ok) throw new Error('No se pudo conectar con Google Calendar');
      const items = await res.json();

      const mapped = (items || []).map(ev => {
        const startRaw = ev.start?.dateTime || ev.start?.date;
        const endRaw   = ev.end?.dateTime   || ev.end?.date;
        const start    = startRaw ? new Date(startRaw) : new Date();
        const end      = endRaw   ? new Date(endRaw)   : new Date(start.getTime() + 3600000);
        return {
          id:         ev.id,
          title:      ev.summary || '(Sin título)',
          start,
          end,
          event_type: 'google',
          desc:       ev.description || '',
          source:     'google',
          htmlLink:   ev.htmlLink,
        };
      });
      setGoogleEvents(mapped);
    } catch (err) {
      console.warn('No se pudieron cargar eventos de Google:', err.message);
    } finally {
      setIsFetchingGoogle(false);
    }
  }

  useEffect(() => { fetchCrmEvents(); }, [fetchCrmEvents]);

  // ── Merge both event sources ────────────────────────────────
  // CRM events get priority; Google events that are NOT already in CRM are added
  const allEvents = [
    ...crmEvents,
    ...googleEvents.filter(ge => !crmEvents.some(ce => ce.title === ge.title &&
      Math.abs(ce.start - ge.start) < 60000  // same title + within 1 min = duplicate
    )),
  ];

  const handleSelectSlot = ({ start, end }) => {
    setForm({ title: '', event_type: tabConfig.defaultType, description: '', start, end, assigned_to: profile?.id || '' });
    setSelectedEvent(null);
    setShowForm(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Save in Supabase
      const { error } = await supabase.from('calendar_events').insert({
        title:         form.title,
        event_type:    form.event_type,
        description:   form.description,
        start_time:    form.start.toISOString(),
        all_day:       false,
        created_by:    user.id,
        calendar_type: tabConfig.calendarType,
        assigned_to:   form.assigned_to || null,
      });
      if (error) throw error;

      // 2. Sync to Google Calendar
      try {
        await fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary:     `[${tabConfig.eventTypes[form.event_type]?.label}] ${form.title}`,
            description: form.description,
            start:       { dateTime: form.start.toISOString() },
            end:         { dateTime: form.end.toISOString() },
            user_refresh_token: googleRefreshToken,
          }),
        });
      } catch (gErr) {
        console.warn('Google sync warning:', gErr);
      }

      setShowForm(false);
      fetchCrmEvents();
      if (googleRefreshToken) fetchGoogleEvents();
    } catch (err) {
      console.error(err);
      alert('Error guardando el evento.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteEvent = async (event) => {
    if (!confirm(`¿Eliminar "${event.title}"?`)) return;
    if (event.source === 'crm') {
      await supabase.from('calendar_events').delete().eq('id', event.id);
      fetchCrmEvents();
    }
    setSelectedEvent(null);
    setShowForm(false);
  };

  const eventStyleGetter = (event) => {
    let color = '#6b7280';
    if (event.source === 'google') {
      color = '#4285f4'; // Google blue
    } else {
      color = tabConfig.eventTypes[event.event_type]?.color || '#6b7280';
    }
    return {
      style: {
        backgroundColor: color,
        borderRadius: '6px',
        opacity: 0.92,
        color: 'white',
        border: event.source === 'google' ? '2px solid rgba(66,133,244,0.5)' : '0px',
        display: 'block',
        padding: '2px 6px',
        fontSize: '13px',
      },
    };
  };

  const isViewingEvent = selectedEvent !== null;
  const syncStatus = isFetchingGoogle
    ? 'Sincronizando Google...'
    : googleRefreshToken
      ? `${googleEvents.length} eventos de Google`
      : 'Sin Google Calendar';

  return (
    <div className="calendar-page h-full flex flex-col p-4 md:p-8">
      <div className="crm-toolbar flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Calendario</h1>
          <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
            <CalendarSync size={14} className="text-blue-400" />
            {syncStatus}
            {googleRefreshToken && (
              <span className="text-slate-600">·</span>
            )}
            {googleRefreshToken && (
              <span style={{ color: '#aaa', fontSize: 11 }}>{crmEvents.length} del CRM</span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          {/* Google sync button */}
          <button
            onClick={() => googleRefreshToken ? fetchGoogleEvents() : loginGoogle()}
            className={`btn flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              googleRefreshToken
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-white text-slate-900 hover:bg-slate-100'
            }`}
          >
            {googleRefreshToken
              ? <><RefreshCw size={16} className={isFetchingGoogle ? 'animate-spin' : ''} /> <span className="hidden md:inline">Actualizar Google</span></>
              : <><LinkIcon size={16} /> <span className="hidden md:inline">Conectar Google</span></>
            }
          </button>

          <button
            className="btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg"
            onClick={() => handleSelectSlot({ start: new Date(), end: new Date() })}
          >
            <Plus size={18} />
            <span className="hidden md:inline">Nuevo Evento</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700">
        {Object.entries(TAB_CONFIGS).map(([id, cfg]) => {
          if (id === 'projects' && !canAccessProjects) return null;
          const Icon = cfg.Icon;
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-medium transition-colors ${
                isActive
                  ? id === 'sales' ? 'bg-violet-500/10 text-violet-300 border-b-2 border-violet-500' : 'bg-emerald-500/10 text-emerald-300 border-b-2 border-emerald-500'
                  : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
              }`}
            >
              <Icon size={18} /> {cfg.label}
            </button>
          );
        })}
        {/* Google legend */}
        {googleRefreshToken && (
          <div className="ml-auto flex items-center gap-2 px-3 py-2 text-xs text-slate-500">
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#4285f4', display: 'inline-block' }} />
            Google Calendar
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="flex-1 bg-slate-900 rounded-xl p-4 shadow-xl border border-slate-800" style={{ minHeight: '600px' }}>
        <Calendar
          localizer={localizer}
          events={allEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          culture="es"
          messages={{
            next: 'Sig', previous: 'Ant', today: 'Hoy',
            month: 'Mes', week: 'Semana', day: 'Día',
            agenda: 'Agenda', date: 'Fecha', time: 'Hora',
            event: 'Evento', noEventsInRange: 'No hay eventos en este rango.',
          }}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          className="barba-big-calendar"
        />
      </div>

      {/* Modal — View or Create Event */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowForm(false); setSelectedEvent(null); }}>
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>

            {isViewingEvent ? (
              /* ── View Event Details ── */
              <>
                <div className="flex justify-between items-start border-b border-slate-700 pb-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedEvent.title}</h2>
                    <p className="text-sm text-slate-400 mt-1">
                      {selectedEvent.source === 'google' ? '📅 Google Calendar' : '🗂️ CRM'}
                      {' · '}
                      {format(selectedEvent.start, 'PPp', { locale: es })}
                    </p>
                  </div>
                  <button className="text-slate-400 hover:text-white" onClick={() => { setShowForm(false); setSelectedEvent(null); }}><X size={20} /></button>
                </div>
                {selectedEvent.desc && (
                  <p className="text-slate-300 mb-4 text-sm leading-relaxed">{selectedEvent.desc}</p>
                )}
                {selectedEvent.htmlLink && (
                  <a href={selectedEvent.htmlLink} target="_blank" rel="noreferrer"
                    className="text-blue-400 text-sm hover:underline block mb-4">
                    Ver en Google Calendar ↗
                  </a>
                )}
                <div className="flex justify-between gap-3 pt-4 border-t border-slate-700">
                  {selectedEvent.source === 'crm' ? (
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30"
                      onClick={() => handleDeleteEvent(selectedEvent)}
                    >
                      <Trash2 size={16} /> Eliminar
                    </button>
                  ) : <div />}
                  <button className="px-5 py-2 text-slate-300 hover:bg-slate-700 rounded-lg font-medium" onClick={() => { setShowForm(false); setSelectedEvent(null); }}>
                    Cerrar
                  </button>
                </div>
              </>
            ) : (
              /* ── Create Event ── */
              <>
                <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <CalendarSync className="text-blue-400" /> Nuevo Evento
                  </h2>
                  <button className="text-slate-400 hover:text-white" onClick={() => setShowForm(false)}><X size={20} /></button>
                </div>

                <form onSubmit={handleCreate}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Título *</label>
                      <input
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition"
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        required
                        placeholder="Ej: Inspección Residencial"
                        autoFocus
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Tipo de Evento</label>
                        <select
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                          value={form.event_type}
                          onChange={e => setForm({ ...form, event_type: e.target.value })}
                        >
                          {Object.entries(tabConfig.eventTypes).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">
                          {activeTab === 'sales' ? 'Asignar Vendedor' : 'Asignar Staff'}
                        </label>
                        <select
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                          value={form.assigned_to}
                          onChange={e => setForm({ ...form, assigned_to: e.target.value })}
                        >
                          <option value="">-- Sin Asignar --</option>
                          {users
                            .filter(u => activeTab === 'sales' ? u.role === 'salesperson' : ['supervisor', 'admin', 'office'].includes(u.role))
                            .map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Notas</label>
                      <textarea
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        rows={3}
                        placeholder="Detalles del evento..."
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-700">
                    <button type="button" className="px-5 py-2 text-slate-300 hover:bg-slate-700 rounded-lg font-medium" onClick={() => setShowForm(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2" disabled={isSyncing}>
                      {isSyncing ? 'Guardando...' : 'Guardar y Sincronizar'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
