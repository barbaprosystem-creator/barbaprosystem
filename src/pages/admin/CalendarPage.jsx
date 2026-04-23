import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

const WEEKDAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const EVENT_COLORS = { appointment:'#3b82f6', inspection:'#f59e0b', project_start:'#10b981', follow_up:'#8b5cf6', payment_due:'#ef4444', other:'#6b7280' };
const EVENT_LABELS = { appointment:'Cita', inspection:'Inspección', project_start:'Inicio Proyecto', follow_up:'Seguimiento', payment_due:'Pago Vence', other:'Otro' };

export default function CalendarPage() {
  const [cur, setCur] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selDate, setSelDate] = useState(null);
  const [form, setForm] = useState({ title:'', event_type:'appointment', description:'' });

  const y = cur.getFullYear(), m = cur.getMonth();
  const firstDay = new Date(y,m,1).getDay();
  const days = new Date(y,m+1,0).getDate();

  useEffect(() => { fetchEvents(); }, [m,y]);

  async function fetchEvents() {
    const start = new Date(y,m,1).toISOString();
    const end = new Date(y,m+1,0,23,59,59).toISOString();
    const { data } = await supabase.from('calendar_events').select('*').gte('start_time',start).lte('start_time',end).order('start_time');
    setEvents(data||[]);
  }

  async function handleCreate(e) {
    e.preventDefault();
    const { data:{user} } = await supabase.auth.getUser();
    await supabase.from('calendar_events').insert({ title:form.title, event_type:form.event_type, description:form.description, start_time:new Date(selDate).toISOString(), all_day:true, created_by:user.id });
    setShowForm(false); setForm({title:'',event_type:'appointment',description:''}); fetchEvents();
  }

  const today = new Date();
  const isToday = (d) => today.getFullYear()===y && today.getMonth()===m && today.getDate()===d;
  const cells = []; for(let i=0;i<firstDay;i++) cells.push(null); for(let d=1;d<=days;d++) cells.push(d);

  function getDateStr(day) { return `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`; }
  function getEventsForDay(day) { const ds = getDateStr(day); return events.filter(e => e.start_time?.substring(0,10)===ds); }

  return (
    <div className="calendar-page">
      <div className="crm-toolbar">
        <div className="crm-toolbar-left"><h1>Calendario</h1></div>
        <div className="crm-toolbar-right">
          <button className="btn-primary" onClick={() => { setSelDate(new Date().toISOString().split('T')[0]); setShowForm(true); }}><Plus size={18}/><span>Nuevo Evento</span></button>
        </div>
      </div>
      <div className="calendar-nav">
        <button className="cal-nav-btn" onClick={() => setCur(new Date(y,m-1,1))}><ChevronLeft size={20}/></button>
        <h2 className="cal-month-label">{MONTHS[m]} {y}</h2>
        <button className="cal-nav-btn" onClick={() => setCur(new Date(y,m+1,1))}><ChevronRight size={20}/></button>
      </div>
      <div className="calendar-grid">
        {WEEKDAYS.map(d => <div key={d} className="cal-weekday">{d}</div>)}
        {cells.map((day,i) => {
          if(!day) return <div key={`e${i}`} className="cal-day empty"/>;
          const de = getEventsForDay(day);
          return (
            <div key={day} className={`cal-day ${isToday(day)?'today':''} ${de.length?'has-events':''}`} onClick={() => { setSelDate(getDateStr(day)); setShowForm(true); }}>
              <span className="cal-day-number">{day}</span>
              <div className="cal-day-events">
                {de.slice(0,2).map(ev => <div key={ev.id} className="cal-event-dot" style={{background:EVENT_COLORS[ev.event_type]||'#666'}} title={ev.title}><span className="cal-event-label">{ev.title}</span></div>)}
                {de.length>2 && <span className="cal-more">+{de.length-2}</span>}
              </div>
            </div>
          );
        })}
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content crm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Nuevo Evento — {selDate}</h2><button className="modal-close" onClick={() => setShowForm(false)}><X size={20}/></button></div>
            <form onSubmit={handleCreate} className="crm-form">
              <div className="crm-form-grid">
                <div className="form-group full-width"><label>Título *</label><input value={form.title} onChange={e => setForm({...form,title:e.target.value})} required placeholder="Ej: Cita con cliente"/></div>
                <div className="form-group"><label>Tipo</label><select value={form.event_type} onChange={e => setForm({...form,event_type:e.target.value})}>{Object.entries(EVENT_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                <div className="form-group full-width"><label>Notas</label><textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} rows={3}/></div>
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
