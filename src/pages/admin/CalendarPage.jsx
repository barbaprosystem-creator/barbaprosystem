import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Plus, X, Briefcase, Users, CalendarSync, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const SALES_TYPES = {
  appointment: { label: 'Cita',           color: '#3b82f6' },
  inspection:  { label: 'Inspección',     color: '#f59e0b' },
  follow_up:   { label: 'Seguimiento',    color: '#8b5cf6' },
  other:       { label: 'Otro',           color: '#6b7280' },
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
  const [activeTab, setActiveTab] = useState('sales');
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', event_type: 'appointment', description: '', start: new Date(), end: new Date(), assigned_to: '' });
  const [isSyncing, setIsSyncing] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    supabase.from('profiles').select('id, full_name, role').then(({ data }) => setUsers(data || []));
  }, []);
  const [googleRefreshToken, setGoogleRefreshToken] = useState(null);

  // Intentar cargar el refresh token del usuario
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.google_refresh_token) {
        setGoogleRefreshToken(user.user_metadata.google_refresh_token);
      }
    });
  }, []);

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
          await supabase.auth.updateUser({
            data: { google_refresh_token: tokens.refresh_token }
          });
          setGoogleRefreshToken(tokens.refresh_token);
          alert('¡Calendario de Google sincronizado con éxito!');
        } else {
          alert('Tu cuenta de Google ya estaba sincronizada. Si quieres forzar una reconexión, revoca el acceso desde tu cuenta de Google.');
        }
      } catch (err) {
        console.error(err);
        alert('Hubo un error configurando tu calendario.');
      }
    },
    onError: err => console.error('Error Google Login', err),
  });

  const tabConfig = TAB_CONFIGS[activeTab];
  const canAccessProjects = role === 'admin' || role === 'office';

  const fetchEvents = useCallback(async () => {
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('calendar_type', tabConfig.calendarType);

    if (activeTab === 'sales' && role === 'salesperson') {
      query = query.eq('created_by', profile?.id);
    }

    const { data } = await query;
    if (data) {
      // Formatear para react-big-calendar
      const formatted = data.map(ev => ({
        id: ev.id,
        title: ev.title,
        start: new Date(ev.start_time),
        // Si no tiene end_time, por defecto dura 1 hora visualmente
        end: ev.end_time ? new Date(ev.end_time) : new Date(new Date(ev.start_time).getTime() + 60 * 60 * 1000),
        event_type: ev.event_type,
        desc: ev.description
      }));
      setEvents(formatted);
    }
  }, [activeTab, profile?.id, role, tabConfig.calendarType]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSelectSlot = ({ start, end }) => {
    setForm({ title: '', event_type: tabConfig.defaultType, description: '', start, end, assigned_to: profile?.id || '' });
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSyncing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Guardar en Base de Datos Supabase (CRM)
      const { data: insertedEvent, error } = await supabase.from('calendar_events').insert({
        title: form.title,
        event_type: form.event_type,
        description: form.description,
        start_time: form.start.toISOString(),
        all_day: false,
        created_by: user.id,
        calendar_type: tabConfig.calendarType,
        assigned_to: form.assigned_to || null,
      }).select().single();

      if (error) throw error;

      // 2. Sincronizar con Google Calendar API a través de la Serverless Function
      try {
        const googleEvent = {
          summary: `[${tabConfig.eventTypes[form.event_type]?.label}] ${form.title}`,
          description: form.description,
          start: { dateTime: form.start.toISOString() },
          end: { dateTime: form.end.toISOString() },
          user_refresh_token: googleRefreshToken // Si existe, usa el calendario del vendedor en vez del robot
        };

        // Esta llamada funcionará en producción (Vercel) o usando Vercel Dev localmente.
        await fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(googleEvent)
        });
      } catch (gErr) {
        console.warn('Google Sync Warning (Funciona nativamente en Vercel):', gErr);
      }

      setShowForm(false);
      fetchEvents();
    } catch (err) {
      console.error(err);
      alert('Error guardando el evento en la base de datos.');
    } finally {
      setIsSyncing(false);
    }
  };

  const eventStyleGetter = (event) => {
    const backgroundColor = tabConfig.eventTypes[event.event_type]?.color || '#6b7280';
    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.95,
        color: 'white',
        border: '0px',
        display: 'block',
        padding: '2px 6px',
        fontSize: '13px'
      }
    };
  };

  return (
    <div className="calendar-page h-full flex flex-col p-4 md:p-8">
      <div className="crm-toolbar flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Calendario</h1>
          <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
            <CalendarSync size={14} className="text-blue-400" /> Sincronización Profesional Activa
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => loginGoogle()}
            className={`btn flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              googleRefreshToken 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-white text-slate-900 hover:bg-slate-100'
            }`}
          >
            {googleRefreshToken ? <CheckCircle2 size={18} /> : <LinkIcon size={18} />}
            <span className="hidden md:inline">
              {googleRefreshToken ? 'Calendario Sincronizado' : 'Conectar Google'}
            </span>
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

      {/* Tabs Selector */}
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
              <Icon size={18} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Main Calendar View */}
      <div className="flex-1 bg-slate-900 rounded-xl p-4 shadow-xl border border-slate-800" style={{ minHeight: '600px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          culture="es"
          messages={{
            next: "Sig",
            previous: "Ant",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            date: "Fecha",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "No hay eventos en este rango."
          }}
          selectable
          onSelectSlot={handleSelectSlot}
          eventPropGetter={eventStyleGetter}
          className="barba-big-calendar"
        />
      </div>

      {/* Event Creation Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CalendarSync className="text-blue-400"/> Nuevo Evento
              </h2>
              <button className="text-slate-400 hover:text-white" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Título *</label>
                  <input
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    required
                    placeholder="Ej: Inspección Residencial"
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
                      {activeTab === 'sales' ? 'Asignar Vendedor' : 'Asignar Brigada/Staff'}
                    </label>
                    <select
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                      value={form.assigned_to}
                      onChange={e => setForm({ ...form, assigned_to: e.target.value })}
                    >
                      <option value="">-- Sin Asignar --</option>
                      {users
                        .filter(u => activeTab === 'sales' ? u.role === 'salesperson' : ['supervisor', 'admin', 'office'].includes(u.role))
                        .map(u => (
                          <option key={u.id} value={u.id}>{u.full_name}</option>
                        ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Notas (Sincronizadas con Google)</label>
                  <textarea
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    placeholder="Detalles que verá el equipo en sus celulares..."
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button type="button" className="px-5 py-2 text-slate-300 hover:bg-slate-700 rounded-lg font-medium" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2" disabled={isSyncing}>
                  {isSyncing ? 'Sincronizando...' : 'Guardar y Sincronizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
