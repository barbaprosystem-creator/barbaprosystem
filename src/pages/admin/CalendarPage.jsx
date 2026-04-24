import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { ChevronLeft, ChevronRight, Plus, X, Briefcase, Users } from 'lucide-react';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'MiÃ©', 'Jue', 'Vie', 'SÃ¡b'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const SALES_TYPES = {
  appointment: { label: 'Cita',           color: '#3b82f6' },
  inspection:  { label: 'InspecciÃ³n',     color: '#f59e0b' },
  follow_up:   { label: 'Seguimiento',    color: '#8b5cf6' },
  other:       { label: 'Otro',           color: '#6b7280' },
};

const PROJECT_TYPES = {
  project_start: { label: 'Inicio Proyecto', color: '#10b981' },
  payment_due:   { label: 'Pago Vence',      color: '#ef4444' },
  inspection:    { label: 'InspecciÃ³n',      color: '#f59e0b' },
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

function CalendarGrid({ activeTab, cur, onDayClick }) {
  const y = cur.getFullYear(), m = cur.getMonth();
  const { eventTypes } = TAB_CONFIGS[activeTab];
  const [events, setEvents] = useState([]);
  const { profile, role } = useAuth();

  useEffect(() => {
    fetchEvents(y, m, activeTab);
  }, [y, m, activeTab]);

  async function fetchEvents(year, month, tab) {
    const start = new Date(year, month, 1).toISOString();
    const end   = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('calendar_type', TAB_CONFIGS[tab].calendarType)
      .gte('start_time', start)
      .lte('start_time', end)
      .order('start_time');

    // Salesperson only sees their own events in sales calendar
    if (tab === 'sales' && role === 'salesperson') {
      query = query.eq('created_by', profile.id);
    }

    const { data } = await query;
    setEvents(data || []);
  }

  const today = new Date();
  const isToday = (d) => today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function getDateStr(day) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function getEventsForDay(day) {
    const ds = getDateStr(day);
    return events.filter(e => e.start_time?.substring(0, 10) === ds);
  }

  const accentClass = activeTab === 'sales' ? 'cal-day-accent-violet' : 'cal-day-accent-emerald';

  return (
    <div className="calendar-grid">
      {WEEKDAYS.map(d => <div key={d} className="cal-weekday">{d}</div>)}
      {cells.map((day, i) => {
        if (!day) return <div key={`e${i}`} className="cal-day empty" />;
        const de = getEventsForDay(day);
        return (
          <div
            key={day}
            className={`cal-day ${isToday(day) ? 'today' : ''} ${de.length ? 'has-events' : ''}`}
            onClick={() => onDayClick(getDateStr(day))}
          >
            <span className="cal-day-number">{day}</span>
            <div className="cal-day-events">
              {de.slice(0, 2).map(ev => {
                const typeColor = eventTypes[ev.event_type]?.color || '#6b7280';
                const typeLabel = eventTypes[ev.event_type]?.label || ev.event_type;
                return (
                  <div
                    key={ev.id}
                    className="cal-event-dot"
                    style={{ background: typeColor }}
                    title={ev.title}
                  >
                    <span className="cal-event-label">{ev.title}</span>
                  </div>
                );
              })}
              {de.length > 2 && <span className="cal-more">+{de.length - 2}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CalendarPage() {
  const { profile, role } = useAuth();
  const [activeTab, setActiveTab] = useState('sales');
  const [cur, setCur] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selDate, setSelDate] = useState(null);
  const [form, setForm] = useState({ title: '', event_type: 'appointment', description: '' });

  const y = cur.getFullYear(), m = cur.getMonth();
  const tabConfig = TAB_CONFIGS[activeTab];

  // Only admin/office can see projects calendar
  const canAccessProjects = role === 'admin' || role === 'office';

  function handleDayClick(dateStr) {
    setSelDate(dateStr);
    setForm({ title: '', event_type: tabConfig.defaultType, description: '' });
    setShowForm(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('calendar_events').insert({
      title: form.title,
      event_type: form.event_type,
      description: form.description,
      start_time: new Date(selDate).toISOString(),
      all_day: true,
      created_by: user.id,
      calendar_type: tabConfig.calendarType,
      // For sales events, assign to current user
      assigned_to: activeTab === 'sales' ? user.id : null,
    });
    setShowForm(false);
    setForm({ title: '', event_type: tabConfig.defaultType, description: '' });
    // Trigger re-fetch in CalendarGrid by changing cur slightly then back
    setCur(new Date(cur));
  }

  return (
    <div className="calendar-page">
      <div className="crm-toolbar">
        <div className="crm-toolbar-left">
          <h1>Calendario</h1>
        </div>
        <div className="crm-toolbar-right">
          <button
            className="btn-primary"
            onClick={() => {
              setSelDate(new Date().toISOString().split('T')[0]);
              setForm({ title: '', event_type: tabConfig.defaultType, description: '' });
              setShowForm(true);
            }}
          >
            <Plus size={18} />
            <span>Nuevo Evento</span>
          </button>
        </div>
      </div>

      {/* Dual Tab Selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(100,116,139,0.3)', paddingBottom: '0' }}>
        {Object.entries(TAB_CONFIGS).map(([id, cfg]) => {
          if (id === 'projects' && !canAccessProjects) return null;
          const Icon = cfg.Icon;
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px 12px 0 0',
                border: 'none',
                borderBottom: isActive
                  ? `2px solid ${id === 'sales' ? '#8b5cf6' : '#10b981'}`
                  : '2px solid transparent',
                background: isActive
                  ? id === 'sales' ? 'rgba(139,92,246,0.1)' : 'rgba(16,185,129,0.1)'
                  : 'transparent',
                color: isActive
                  ? id === 'sales' ? '#c4b5fd' : '#6ee7b7'
                  : '#64748b',
                fontWeight: isActive ? '700' : '500',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={16} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Tab description */}
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
        {tabConfig.description} â€” <em>{tabConfig.privateNote}</em>
      </p>

      {/* Month navigation */}
      <div className="calendar-nav">
        <button className="cal-nav-btn" onClick={() => setCur(new Date(y, m - 1, 1))}>
          <ChevronLeft size={20} />
        </button>
        <h2 className="cal-month-label">{MONTHS[m]} {y}</h2>
        <button className="cal-nav-btn" onClick={() => setCur(new Date(y, m + 1, 1))}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {Object.entries(tabConfig.eventTypes).map(([key, val]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: val.color }} />
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{val.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <CalendarGrid
        key={`${activeTab}-${y}-${m}`}
        activeTab={activeTab}
        cur={cur}
        onDayClick={handleDayClick}
      />

      {/* Modal: New Event */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content crm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Evento â€” {selDate}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px', paddingLeft: '4px' }}>
              Calendario: <strong style={{ color: activeTab === 'sales' ? '#c4b5fd' : '#6ee7b7' }}>
                {tabConfig.label}
              </strong>
            </p>
            <form onSubmit={handleCreate} className="crm-form">
              <div className="crm-form-grid">
                <div className="form-group full-width">
                  <label>TÃ­tulo *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    required
                    placeholder="Ej: Cita con cliente"
                  />
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <select
                    value={form.event_type}
                    onChange={e => setForm({ ...form, event_type: e.target.value })}
                  >
                    {Object.entries(tabConfig.eventTypes).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Notas</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    placeholder="Detalles del evento..."
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Crear Evento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

