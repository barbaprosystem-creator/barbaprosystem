import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Loader2, X } from 'lucide-react';

export default function DailyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ project_id:'', work_completed:'', crew_count:0, weather:'clear', issues:'' });
  const [projects, setProjects] = useState([]);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data:{user} } = await supabase.auth.getUser();
    const [reps, projs] = await Promise.all([
      supabase.from('daily_reports').select('*,project:projects!daily_reports_project_id_fkey(title,project_number)').eq('reported_by',user.id).order('report_date',{ascending:false}),
      supabase.from('projects').select('id,title,project_number').eq('supervisor_id',user.id),
    ]);
    setReports(reps.data||[]);
    setProjects(projs.data||[]);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { data:{user} } = await supabase.auth.getUser();
    await supabase.from('daily_reports').insert({
      project_id: form.project_id, reported_by: user.id,
      report_date: new Date().toISOString().split('T')[0],
      work_completed: form.work_completed, crew_count: form.crew_count,
      weather: form.weather, issues: form.issues
    });
    setShowForm(false); setForm({ project_id:'', work_completed:'', crew_count:0, weather:'clear', issues:'' }); fetchData();
  }

  if(loading) return <div className="page-loading"><Loader2 size={32} className="spin"/><p>Cargando reportes...</p></div>;

  return (
    <div className="reports-page">
      <div className="crm-toolbar">
        <div className="crm-toolbar-left"><h1>Reportes Diarios</h1><span className="crm-count">{reports.length}</span></div>
        <div className="crm-toolbar-right"><button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={18}/><span>Nuevo Reporte</span></button></div>
      </div>
      <div className="crm-list">
        <table>
          <thead><tr><th>Fecha</th><th>Proyecto</th><th>Resumen</th><th>Crew</th><th>Clima</th></tr></thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id} className="crm-list-row">
                <td>{r.report_date}</td>
                <td>PRJ-{String(r.project?.project_number||0).padStart(4,'0')}</td>
                <td>{r.work_completed?.substring(0,80)}{r.work_completed?.length>80?'...':''}</td>
                <td>{r.crew_count}</td>
                <td>{r.weather}</td>
              </tr>
            ))}
            {reports.length===0 && <tr><td colSpan={5} className="crm-empty-row">No hay reportes aún</td></tr>}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content crm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Nuevo Reporte Diario</h2><button className="modal-close" onClick={() => setShowForm(false)}><X size={20}/></button></div>
            <form onSubmit={handleSubmit} className="crm-form">
              <div className="crm-form-grid">
                <div className="form-group full-width"><label>Proyecto *</label>
                  <select value={form.project_id} onChange={e => setForm({...form,project_id:e.target.value})} required>
                    <option value="">Seleccionar...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>PRJ-{String(p.project_number).padStart(4,'0')} — {p.title}</option>)}
                  </select>
                </div>
                <div className="form-group full-width"><label>Trabajo completado *</label><textarea value={form.work_completed} onChange={e => setForm({...form,work_completed:e.target.value})} rows={4} required placeholder="¿Qué se hizo hoy?"/></div>
                <div className="form-group"><label>Crew</label><input type="number" value={form.crew_count} onChange={e => setForm({...form,crew_count:+e.target.value})}/></div>
                <div className="form-group"><label>Clima</label>
                  <select value={form.weather} onChange={e => setForm({...form,weather:e.target.value})}>
                    <option value="clear">Despejado</option><option value="cloudy">Nublado</option><option value="rain">Lluvia</option><option value="snow">Nieve</option>
                  </select>
                </div>
                <div className="form-group full-width"><label>Problemas</label><textarea value={form.issues} onChange={e => setForm({...form,issues:e.target.value})} rows={2} placeholder="Bloqueos..."/></div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Enviar Reporte</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
