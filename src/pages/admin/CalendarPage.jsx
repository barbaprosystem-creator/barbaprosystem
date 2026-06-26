import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Plus, X, Briefcase, Users, CalendarSync, Link as LinkIcon, CheckCircle2, RefreshCw, Trash2, Pencil } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

const locales = { 'en': enUS };

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const PALETTE_COLORS = [
  { label: 'Blue (Default)', hex: '#3b82f6' },
  { label: 'Green', hex: '#10b981' },
  { label: 'Yellow', hex: '#f59e0b' },
  { label: 'Red', hex: '#ef4444' },
  { label: 'Purple', hex: '#8b5cf6' },
  { label: 'Pink', hex: '#ec4899' },
  { label: 'Indigo', hex: '#6366f1' },
  { label: 'Teal', hex: '#14b8a6' },
];

const GOOGLE_EVENT_COLORS = {
  '1': '#7986cb',  // Lavender
  '2': '#33b679',  // Sage
  '3': '#8e24aa',  // Grape
  '4': '#e67e22',  // Flamingo
  '5': '#f6bf26',  // Banana
  '6': '#f4511e',  // Tangerine
  '7': '#039be5',  // Peacock
  '8': '#616161',  // Graphite
  '9': '#3f51b5',  // Blueberry
  '10': '#0b8043', // Basil
  '11': '#d50000', // Tomato
};

const getGoogleColorId = (hex) => {
  if (!hex) return null;
  const mapping = {
    '#3b82f6': '7',  // Peacock
    '#10b981': '10', // Basil
    '#f59e0b': '5',  // Banana
    '#ef4444': '11', // Tomato
    '#8b5cf6': '3',  // Grape
    '#ec4899': '4',  // Flamingo
    '#6366f1': '1',  // Lavender
    '#14b8a6': '2',  // Sage
  };
  return mapping[hex.toLowerCase()] || null;
};

const toDateTimeLocalString = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
};

const parseDateTimeLocal = (str) => {
  return str ? new Date(str) : new Date();
};


const SALES_TYPES = {
  appointment: { label: 'Appointment', color: '#3b82f6' },
  inspection:  { label: 'Inspection',  color: '#f59e0b' },
  follow_up:   { label: 'Follow-up',    color: '#8b5cf6' },
  other:       { label: 'Other',        color: '#6b7280' },
};

const PROJECT_TYPES = {
  project_start: { label: 'Project Start', color: '#10b981' },
  payment_due:   { label: 'Payment Due',   color: '#ef4444' },
  inspection:    { label: 'Inspection',    color: '#f59e0b' },
  other:         { label: 'Other',         color: '#6b7280' },
};

const TAB_CONFIGS = {
  sales: {
    label: 'Sales & Appointments',
    Icon: Users,
    calendarType: 'sales',
    eventTypes: SALES_TYPES,
    defaultType: 'appointment',
    color: 'violet',
    description: 'Client appointments, follow-ups, and sales visits',
    privateNote: 'Each salesperson only sees their own events.',
  },
  projects: {
    label: 'Office & Projects',
    Icon: Briefcase,
    calendarType: 'projects',
    eventTypes: PROJECT_TYPES,
    defaultType: 'project_start',
    color: 'emerald',
    description: 'Project milestones, payment dates, and site progress',
    privateNote: 'Visible to Admin and Office.',
  },
};

export default function CalendarPage() {
  const { profile, role } = useAuth();
  const [activeTab, setActiveTab]           = useState('sales');
  const [crmEvents, setCrmEvents]           = useState([]);   // from Supabase
  const [googleEvents, setGoogleEvents]     = useState([]);   // from Google Calendar API
  const [showForm, setShowForm]             = useState(false);
  const [form, setForm]                     = useState({ title: '', event_type: 'appointment', description: '', start: new Date(), end: new Date(), assigned_to: '', contact_id: '', color: '', service_type: '' });
  const [newCustomer, setNewCustomer]       = useState({ first_name: '', last_name: '', phone: '', email: '' });
  const [isSyncing, setIsSyncing]           = useState(false);

  const [isFetchingGoogle, setIsFetchingGoogle] = useState(false);
  const [users, setUsers]                   = useState([]);
  const [contacts, setContacts]             = useState([]);
  const [selectedEvent, setSelectedEvent]   = useState(null);
  const [googleRefreshToken, setGoogleRefreshToken] = useState(null);

  // Load users
  useEffect(() => {
    supabase.from('profiles').select('id, full_name, role').then(({ data }) => setUsers(data || []));
  }, []);

  // Load contacts
  useEffect(() => {
    supabase.from('contacts').select('id, first_name, last_name').order('first_name').then(({ data }) => setContacts(data || []));
  }, []);

  // Load stored Google refresh token
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.google_refresh_token) {
        const token = user.user_metadata.google_refresh_token;
        setGoogleRefreshToken(token);
        // Ensure the public profile also has this token stored
        supabase.from('profiles')
          .update({ google_refresh_token: token })
          .eq('id', user.id)
          .then(({ error }) => {
            if (error) console.error('Error ensuring google token in profile:', error);
          });
      }
    });
  }, []);

  // Whenever we have a token, fetch Google events
  useEffect(() => {
    if (googleRefreshToken) fetchGoogleEvents();
  }, [googleRefreshToken]);

  const loginGoogle = useGoogleLogin({
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks.readonly',
    onSuccess: async (codeResponse) => {
      try {
        const res = await fetch('/api/calendar-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: codeResponse.code }),
        });
        if (!res.ok) throw new Error('Error exchanging code');
        const tokens = await res.json();
        if (tokens.refresh_token) {
          const { data: { user } } = await supabase.auth.getUser();
          await supabase.auth.updateUser({ data: { google_refresh_token: tokens.refresh_token } });
          await supabase.from('profiles').update({ google_refresh_token: tokens.refresh_token }).eq('id', user.id);
          setGoogleRefreshToken(tokens.refresh_token);
          alert('Google Calendar connected! Importing events...');
        } else {
          // Already connected — just re-fetch events
          fetchGoogleEvents();
          alert('Account already synced. Reloading Google events...');
        }
      } catch (err) {
        console.error(err);
        alert('There was an error connecting the calendar.');
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
      query = query.or(`created_by.eq.${profile?.id},assigned_to.eq.${profile?.id}`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching CRM events:', error);
    }
    if (data) {
      setCrmEvents(data.map(ev => ({
        id:          ev.id,
        title:       ev.title,
        start:       new Date(ev.start_time),
        end:         ev.end_time ? new Date(ev.end_time) : new Date(new Date(ev.start_time).getTime() + 60 * 60 * 1000),
        event_type:  ev.event_type,
        desc:        ev.description,
        source:      'crm',
        contact_id:  ev.contact_id,
        assigned_to: ev.assigned_to,
        custom_assigned_to: ev.custom_assigned_to,
        color:       ev.color,
        service_type: ev.service_type,
      })));
    }

  }, [activeTab, profile?.id, role, tabConfig.calendarType]);

  // ── Fetch events from Google Calendar ──────────────────────
  async function fetchGoogleEvents() {
    if (!googleRefreshToken) return;
    setIsFetchingGoogle(true);
    try {
      console.log("[CalendarPage] fetchGoogleEvents started...");
      const res = await fetch(`/api/calendar?user_refresh_token=${encodeURIComponent(googleRefreshToken)}`);
      if (!res.ok) throw new Error('Could not connect to Google Calendar');
      const items = await res.json();
      console.log("[CalendarPage] Google Calendar event items fetched count:", items?.length || 0);

      const mapped = (items || []).map(ev => {
        const startRaw = ev.start?.dateTime || ev.start?.date;
        const endRaw   = ev.end?.dateTime   || ev.end?.date;
        const start    = startRaw ? new Date(startRaw) : new Date();
        const end      = endRaw   ? new Date(endRaw)   : new Date(start.getTime() + 3600000);

        let title = ev.summary || '(No title)';
        if (ev.isTask) {
          title = `${ev.taskStatus === 'completed' ? '✔️' : '📝'} [Task] ${title}`;
        }

        return {
          id:         ev.id,
          title,
          start,
          end,
          event_type: ev.isTask ? 'google_task' : 'google',
          desc:       ev.description || '',
          source:     'google',
          htmlLink:   ev.htmlLink,
          color:      ev.isTask ? '#f59e0b' : (ev.colorId ? GOOGLE_EVENT_COLORS[ev.colorId] : ev.calendarColor || null),
          location:   ev.location || '',
          creator:    ev.creator?.email || ev.creator?.displayName || '',
          isTask:     ev.isTask || false,
          taskStatus: ev.taskStatus || null,
          taskListName: ev.taskListName || null,
          calendarName: ev.calendarName || null,
        };
      });
      setGoogleEvents(mapped);
    } catch (err) {
      console.warn('Could not load Google events:', err.message);
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
    setForm({ title: '', event_type: tabConfig.defaultType, description: '', start, end, assigned_to: profile?.id || '', custom_assigned_to: '', contact_id: '', color: '', service_type: '' });
    setNewCustomer({ first_name: '', last_name: '', phone: '', email: '' });
    setSelectedEvent(null);
    setShowForm(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowForm(true);
  };

  const handleEditClick = () => {
    if (!selectedEvent) return;
    let assignedToValue = selectedEvent.assigned_to || '';
    if (!selectedEvent.assigned_to && selectedEvent.custom_assigned_to) {
      assignedToValue = 'custom';
    }
    setForm({
      id:           selectedEvent.id,
      title:        selectedEvent.title,
      event_type:   selectedEvent.event_type || tabConfig.defaultType,
      description:  selectedEvent.desc || '',
      start:        selectedEvent.start,
      end:          selectedEvent.end,
      assigned_to:  assignedToValue,
      custom_assigned_to: selectedEvent.custom_assigned_to || '',
      contact_id:   selectedEvent.contact_id || '',
      color:        selectedEvent.color || '',
      service_type: selectedEvent.service_type || '',
    });
    setNewCustomer({ first_name: '', last_name: '', phone: '', email: '' });
    setSelectedEvent(null); // Switch details view to form edit view
  };


  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let finalContactId = form.contact_id;
      if (form.contact_id === 'new_customer') {
        const { data: contactData, error: contactError } = await supabase
          .from('contacts')
          .insert({
            first_name: newCustomer.first_name,
            last_name: newCustomer.last_name,
            phone: newCustomer.phone || null,
            email: newCustomer.email || null,
            pipeline_status: 'appointment_set', // saved to pipeline phase 'agendado' (Appointment Set)
          })
          .select()
          .single();
        if (contactError) throw contactError;
        finalContactId = contactData.id;
        // Reload contacts list
        const { data: newContacts } = await supabase.from('contacts').select('id, first_name, last_name').order('first_name');
        setContacts(newContacts || []);
      }

      const isCustomAssigned = form.assigned_to === 'custom';
      const assignedToId = isCustomAssigned ? null : (form.assigned_to || null);
      const customAssignedName = isCustomAssigned ? (form.custom_assigned_to || '') : null;

      // If form has ID, we update, otherwise insert
      if (form.id) {
        const { error } = await supabase.from('calendar_events').update({
          title:         form.title,
          event_type:    form.event_type,
          description:   form.description,
          start_time:    form.start.toISOString(),
          end_time:      form.end.toISOString(),
          assigned_to:   assignedToId,
          custom_assigned_to: customAssignedName,
          contact_id:    finalContactId || null,
          color:         form.color || null,
          service_type:  form.service_type || null,
        }).eq('id', form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('calendar_events').insert({
          title:         form.title,
          event_type:    form.event_type,
          description:   form.description,
          start_time:    form.start.toISOString(),
          end_time:      form.end.toISOString(),
          all_day:       false,
          created_by:    user.id,
          calendar_type: tabConfig.calendarType,
          assigned_to:   assignedToId,
          custom_assigned_to: customAssignedName,
          contact_id:    finalContactId || null,
          color:         form.color || null,
          service_type:  form.service_type || null,
        });
        if (error) throw error;
      }

      // 1b. Auto-transition client to appointment_set in pipeline if associated
      if (finalContactId) {
        await supabase
          .from('contacts')
          .update({ pipeline_status: 'appointment_set' })
          .eq('id', finalContactId);
      }

      // 2. Sync to Google Calendar (only on new event creation to avoid updates duplication)
      if (!form.id) {
        let targetToken = googleRefreshToken;
        const isAssignedToOther = form.assigned_to && form.assigned_to !== user.id;

        if (isAssignedToOther) {
          const { data: assignedProfile, error: profileErr } = await supabase
            .from('profiles')
            .select('google_refresh_token')
            .eq('id', form.assigned_to)
            .single();
          
          if (!profileErr && assignedProfile?.google_refresh_token) {
            targetToken = assignedProfile.google_refresh_token;
          } else {
            targetToken = null;
          }
        }

        if (targetToken) {
          try {
            await fetch('/api/calendar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                summary:     `[${tabConfig.eventTypes[form.event_type]?.label}] ${form.title}`,
                description: form.description,
                start:       { dateTime: form.start.toISOString() },
                end:         { dateTime: form.end.toISOString() },
                colorId:     getGoogleColorId(form.color),
                user_refresh_token: targetToken,
              }),
            });
          } catch (gErr) {
            console.warn('Google sync warning:', gErr);
          }
        } else if (isAssignedToOther) {
          console.info('Salesperson has not connected their Google Calendar yet. Saved only in CRM.');
        }
      }

      setShowForm(false);
      fetchCrmEvents();
      if (googleRefreshToken) fetchGoogleEvents();
    } catch (err) {
      console.error(err);
      alert('Error saving event.');
    } finally {
      setIsSyncing(false);
    }
  };


  const handleDeleteEvent = async (event) => {
    if (!confirm(`Delete "${event.title}"?`)) return;
    if (event.source === 'crm') {
      await supabase.from('calendar_events').delete().eq('id', event.id);
      fetchCrmEvents();
    }
    setSelectedEvent(null);
    setShowForm(false);
  };

  const eventStyleGetter = (event) => {
    let color = '#6b7280';
    if (event.color) {
      color = event.color;
    } else if (event.source === 'google') {
      color = '#4285f4'; // Fallback Google blue
    } else {
      color = tabConfig.eventTypes[event.event_type]?.color || '#6b7280';
    }
    return {
      style: {
        backgroundColor: color,
        borderRadius: '6px',
        opacity: 0.92,
        color: 'white',
        border: event.source === 'google' ? '2px solid rgba(255,255,255,0.2)' : '0px',
        display: 'block',
        padding: '2px 6px',
        fontSize: '13px',
      },
    };
  };


  const isViewingEvent = selectedEvent !== null;
  const syncStatus = isFetchingGoogle
    ? 'Syncing Google...'
    : googleRefreshToken
      ? `${googleEvents.length} Google events`
      : 'No Google Calendar';

  return (
    <div className="calendar-page h-full flex flex-col p-4 md:p-8">
      <div className="crm-toolbar flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
            <CalendarSync size={14} className="text-blue-400" />
            {syncStatus}
            {googleRefreshToken && (
              <span className="text-slate-600">·</span>
            )}
            {googleRefreshToken && (
              <span style={{ color: '#aaa', fontSize: 11 }}>{crmEvents.length} from CRM</span>
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
              ? <><RefreshCw size={16} className={isFetchingGoogle ? 'animate-spin' : ''} /> <span className="hidden md:inline">Refresh Google</span></>
              : <><LinkIcon size={16} /> <span className="hidden md:inline">Connect Google</span></>
            }
          </button>

          <button
            className="btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg"
            onClick={() => handleSelectSlot({ start: new Date(), end: new Date() })}
          >
            <Plus size={18} />
            <span className="hidden md:inline">New Event</span>
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
          <div className="ml-auto flex items-center gap-4 px-3 py-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#4285f4', display: 'inline-block' }} />
              Google Calendar
            </span>
            <span className="flex items-center gap-1.5">
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }} />
              Google Tasks
            </span>
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
          culture="en"
          messages={{
            next: 'Next', previous: 'Prev', today: 'Today',
            month: 'Month', week: 'Week', day: 'Day',
            agenda: 'Agenda', date: 'Date', time: 'Time',
            event: 'Event', noEventsInRange: 'No events in this range.',
          }}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          components={{
            event: ({ event }) => (
              <div className="flex flex-col h-full justify-between py-0.5">
                <div className="font-semibold truncate text-[12px] leading-snug">{event.title}</div>
                {event.service_type && (
                  <div className="text-[9px] font-bold opacity-90 bg-black/45 px-1 py-0.2 rounded w-fit truncate mt-0.5 border border-white/10 uppercase tracking-wider">
                    🛠️ {event.service_type}
                  </div>
                )}
              </div>
            )
          }}
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
                      {format(selectedEvent.start, 'PPp', { locale: enUS })}
                    </p>
                  </div>
                  <button className="text-slate-400 hover:text-white" onClick={() => { setShowForm(false); setSelectedEvent(null); }}><X size={20} /></button>
                </div>
                {selectedEvent.service_type && (
                  <div className="mb-3">
                    <span className="px-2.5 py-1 text-xs font-bold bg-slate-700 text-slate-200 rounded border border-slate-600 uppercase tracking-wider">
                      🛠️ Service: {selectedEvent.service_type}
                    </span>
                  </div>
                )}
                {selectedEvent.desc && (
                  <p className="text-slate-300 mb-4 text-sm leading-relaxed">{selectedEvent.desc}</p>
                )}
                {selectedEvent.location && (
                  <div className="mb-3 flex items-center gap-2 text-sm text-slate-300">
                    <span className="font-semibold text-slate-400">📍 Location:</span>
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.creator && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-slate-300">
                    <span className="font-semibold text-slate-400">👤 Organizer:</span>
                    <span>{selectedEvent.creator}</span>
                  </div>
                )}
                {selectedEvent.source === 'crm' && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-slate-300">
                    <span className="font-semibold text-slate-400">👤 Assigned:</span>
                    <span>
                      {selectedEvent.assigned_to
                        ? (users.find(u => u.id === selectedEvent.assigned_to)?.full_name || 'Loading...')
                        : (selectedEvent.custom_assigned_to || 'Unassigned')}
                    </span>
                  </div>
                )}
                {selectedEvent.calendarName && !selectedEvent.isTask && (
                  <div className="mb-3 flex items-center gap-2 text-sm text-slate-300">
                    <span className="font-semibold text-slate-400">📅 Google Calendar:</span>
                    <span className="px-2 py-0.5 text-xs bg-blue-500/10 text-blue-300 rounded border border-blue-500/20">{selectedEvent.calendarName}</span>
                  </div>
                )}
                {selectedEvent.isTask && (
                  <>
                    <div className="mb-3 flex items-center gap-2 text-sm text-slate-300">
                      <span className="font-semibold text-slate-400">📋 Task List:</span>
                      <span className="px-2 py-0.5 text-xs bg-yellow-500/10 text-yellow-300 rounded border border-yellow-500/20">{selectedEvent.taskListName || 'Tasks'}</span>
                    </div>
                    <div className="mb-4 flex items-center gap-2 text-sm text-slate-300">
                      <span className="font-semibold text-slate-400">Status:</span>
                      <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                        selectedEvent.taskStatus === 'completed' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {selectedEvent.taskStatus === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  </>
                )}
                {selectedEvent.htmlLink && (
                  <a href={selectedEvent.htmlLink} target="_blank" rel="noreferrer"
                    className="text-blue-400 text-sm hover:underline block mb-4">
                    {selectedEvent.isTask ? 'View in Google Tasks ↗' : 'View in Google Calendar ↗'}
                  </a>
                )}
                <div className="flex justify-between gap-3 pt-4 border-t border-slate-700">
                  <div className="flex gap-2">
                    {selectedEvent.source === 'crm' && (
                      <>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/30 transition font-medium text-sm"
                          onClick={handleEditClick}
                        >
                          <Pencil size={16} /> Edit
                        </button>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition font-medium text-sm"
                          onClick={() => handleDeleteEvent(selectedEvent)}
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                  <button className="px-5 py-2 text-slate-300 hover:bg-slate-700 rounded-lg font-medium" onClick={() => { setShowForm(false); setSelectedEvent(null); }}>
                    Close
                  </button>
                </div>
              </>
            ) : (
              /* ── Create / Edit Event ── */
              <>
                <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <CalendarSync className="text-blue-400" /> {form.id ? 'Edit Event' : 'New Event'}
                  </h2>
                  <button className="text-slate-400 hover:text-white" onClick={() => setShowForm(false)}><X size={20} /></button>
                </div>

                <form onSubmit={handleCreate}>
                  <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Title *</label>
                      <input
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition"
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        required
                        placeholder="e.g. Residential Inspection"
                        autoFocus
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Event Type</label>
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
                          {activeTab === 'sales' ? 'Assign Salesperson' : 'Assign Staff'}
                        </label>
                        <select
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                          value={form.assigned_to}
                          onChange={e => setForm({ ...form, assigned_to: e.target.value })}
                        >
                          <option value="">-- Unassigned --</option>
                          <option value="custom" className="text-blue-400 font-bold">+ Custom Name (External)</option>
                          {users
                            .filter(u => activeTab === 'sales' ? u.role === 'salesperson' : ['supervisor', 'admin', 'office'].includes(u.role))
                            .map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                        </select>
                      </div>
                    </div>

                    {form.assigned_to === 'custom' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Custom Assigned Name *</label>
                        <input
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition"
                          value={form.custom_assigned_to || ''}
                          onChange={e => setForm({ ...form, custom_assigned_to: e.target.value })}
                          required={form.assigned_to === 'custom'}
                          placeholder="Enter name"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Start Date & Time</label>
                        <input
                          type="datetime-local"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                          value={toDateTimeLocalString(form.start)}
                          onChange={e => setForm({ ...form, start: parseDateTimeLocal(e.target.value) })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">End Date & Time</label>
                        <input
                          type="datetime-local"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                          value={toDateTimeLocalString(form.end)}
                          onChange={e => setForm({ ...form, end: parseDateTimeLocal(e.target.value) })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Service Type</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition"
                        value={form.service_type || ''}
                        onChange={e => setForm({ ...form, service_type: e.target.value })}
                        placeholder="e.g. Roofing, Siding, Gutters, Repair, Inspection"
                        list="suggested-services"
                      />
                      <datalist id="suggested-services">
                        <option value="Roofing" />
                        <option value="Siding" />
                        <option value="Gutters" />
                        <option value="Windows" />
                        <option value="Repair" />
                        <option value="Inspection" />
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Event Color (Google Calendar Style)</label>
                      <div className="flex flex-wrap gap-2 p-2 bg-slate-900/40 rounded-lg border border-slate-700/50">
                        {PALETTE_COLORS.map(c => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setForm({ ...form, color: c.hex })}
                            className={`w-7 h-7 rounded-full border-2 transition-all relative ${
                              form.color === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.label}
                          >
                            {form.color === c.hex && (
                              <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
                            )}
                          </button>
                        ))}
                        {form.color && (
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, color: '' })}
                            className="text-xs text-slate-400 hover:text-white px-2 py-1 ml-auto font-medium"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Associate Client (CRM Lead)</label>
                      <select
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                        value={form.contact_id || ''}
                        onChange={e => setForm({ ...form, contact_id: e.target.value })}
                      >
                        <option value="">-- No Client --</option>
                        <option value="new_customer" className="text-blue-400 font-bold">+ New Customer</option>
                        {contacts.map(c => (
                          <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                        ))}
                      </select>
                    </div>

                    {form.contact_id === 'new_customer' && (
                      <div className="bg-slate-900/60 p-4 border border-slate-700 rounded-lg space-y-3 animation-fade-in">
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">New Client Details</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">First Name *</label>
                            <input
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                              value={newCustomer.first_name || ''}
                              onChange={e => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
                              required={form.contact_id === 'new_customer'}
                              placeholder="John"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Last Name *</label>
                            <input
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                              value={newCustomer.last_name || ''}
                              onChange={e => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
                              required={form.contact_id === 'new_customer'}
                              placeholder="Doe"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Phone</label>
                            <input
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                              value={newCustomer.phone || ''}
                              onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                              placeholder="(502) 555-0100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Email</label>
                            <input
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                              value={newCustomer.email || ''}
                              onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                              placeholder="john@example.com"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Notes</label>
                      <textarea
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        rows={3}
                        placeholder="Event details..."
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-700">
                    <button type="button" className="px-5 py-2 text-slate-300 hover:bg-slate-700 rounded-lg font-medium" onClick={() => setShowForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2" disabled={isSyncing}>
                      {isSyncing ? 'Saving...' : (form.id ? 'Save Changes' : 'Save & Sync')}
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
