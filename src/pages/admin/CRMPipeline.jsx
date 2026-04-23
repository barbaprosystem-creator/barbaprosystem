import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Phone, MapPin, Calendar, X, Loader2 } from 'lucide-react';

const PIPELINE_STAGES = [
  { id:'new_lead', label:'Nuevo', color:'#3b82f6' },
  { id:'contacted', label:'Contactado', color:'#f59e0b' },
  { id:'appointment_set', label:'Cita', color:'#8b5cf6' },
  { id:'estimate_sent', label:'Estimado Enviado', color:'#06b6d4' },
  { id:'closed_won', label:'Ganado', color:'#10b981' },
  { id:'closed_lost', label:'Perdido', color:'#ef4444' },
];
const SOURCES = ['web','facebook','phone','referral','walk_in','other'];
const SOURCE_LABELS = { web:'Web', facebook:'Facebook', phone:'Teléfono', referral:'Referido', walk_in:'Puerta', other:'Otro' };

function ContactForm({ contact, onSave, onClose, salespeople }) {
  const [form, setForm] = useState(contact || {
    first_name:'', last_name:'', email:'', phone:'',
    address:'', city:'', state:'KY', zip:'',
    source:'phone', pipeline_status:'new_lead', assigned_to:'', notes:''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form };
      if(!payload.assigned_to) delete payload.assigned_to;
      if(contact?.id) {
        const { error } = await supabase.from('contacts').update(payload).eq('id', contact.id);
        if(error) throw error;
      } else {
        const { error } = await supabase.from('contacts').insert(payload);
        if(error) throw error;
      }
      onSave();
    } catch(err) { alert('Error: '+err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content crm-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{contact?.id ? 'Editar Contacto' : 'Nuevo Lead'}</h2>
          <button className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="crm-form">
          <div className="crm-form-grid">
            <div className="form-group"><label>Nombre *</label><input value={form.first_name} onChange={e => setForm({...form,first_name:e.target.value})} required/></div>
            <div className="form-group"><label>Apellido *</label><input value={form.last_name} onChange={e => setForm({...form,last_name:e.target.value})} required/></div>
            <div className="form-group"><label>Teléfono</label><input value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} placeholder="(502) 555-0000"/></div>
            <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})}/></div>
            <div className="form-group full-width"><label>Dirección</label><input value={form.address} onChange={e => setForm({...form,address:e.target.value})}/></div>
            <div className="form-group"><label>Ciudad</label><input value={form.city} onChange={e => setForm({...form,city:e.target.value})} placeholder="Louisville"/></div>
            <div className="form-group"><label>Estado</label><input value={form.state} onChange={e => setForm({...form,state:e.target.value})}/></div>
            <div className="form-group"><label>ZIP</label><input value={form.zip} onChange={e => setForm({...form,zip:e.target.value})}/></div>
            <div className="form-group"><label>Origen</label>
              <select value={form.source} onChange={e => setForm({...form,source:e.target.value})}>
                {SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Etapa</label>
              <select value={form.pipeline_status} onChange={e => setForm({...form,pipeline_status:e.target.value})}>
                {PIPELINE_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Asignar a</label>
              <select value={form.assigned_to||''} onChange={e => setForm({...form,assigned_to:e.target.value||null})}>
                <option value="">Sin asignar</option>
                {salespeople.map(sp => <option key={sp.id} value={sp.id}>{sp.full_name}</option>)}
              </select>
            </div>
            <div className="form-group full-width"><label>Notas</label><textarea value={form.notes||''} onChange={e => setForm({...form,notes:e.target.value})} rows={3}/></div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Loader2 size={18} className="spin"/> : null}
              {contact?.id ? 'Guardar' : 'Crear Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LeadCard({ lead, onClick }) {
  return (
    <div className="lead-card" draggable onDragStart={e => e.dataTransfer.setData('leadId',lead.id)} onClick={() => onClick(lead)}>
      <div className="lead-card-header">
        <span className="lead-name">{lead.first_name} {lead.last_name}</span>
        <span className="lead-source">{SOURCE_LABELS[lead.source]||'—'}</span>
      </div>
      {lead.phone && <div className="lead-card-detail"><Phone size={13}/><span>{lead.phone}</span></div>}
      {lead.address && <div className="lead-card-detail"><MapPin size={13}/><span>{lead.address}{lead.city?`, ${lead.city}`:''}</span></div>}
      {lead.assigned_profile && <div className="lead-card-footer"><div className="lead-avatar">{lead.assigned_profile.full_name?.[0]}</div><span className="lead-assigned">{lead.assigned_profile.full_name}</span></div>}
      <div className="lead-card-date"><Calendar size={12}/><span>{new Date(lead.created_at).toLocaleDateString('es')}</span></div>
    </div>
  );
}

export default function CRMPipeline() {
  const [contacts, setContacts] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('kanban');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [cRes, pRes] = await Promise.all([
      supabase.from('contacts').select('*, assigned_profile:profiles!contacts_assigned_to_fkey(full_name)').order('created_at',{ascending:false}),
      supabase.from('profiles').select('id,full_name,role').in('role',['salesperson','admin']),
    ]);
    setContacts(cRes.data||[]);
    setSalespeople(pRes.data||[]);
    setLoading(false);
  }

  async function handleDrop(e, newStatus) {
    e.preventDefault();
    const id = e.dataTransfer.getData('leadId'); if(!id) return;
    setContacts(prev => prev.map(c => c.id===id ? {...c,pipeline_status:newStatus} : c));
    const { error } = await supabase.from('contacts').update({pipeline_status:newStatus,updated_at:new Date().toISOString()}).eq('id',id);
    if(error) fetchData();
  }

  const filtered = contacts.filter(c => {
    if(!search) return true;
    const s = search.toLowerCase();
    return `${c.first_name} ${c.last_name}`.toLowerCase().includes(s) || c.phone?.toLowerCase().includes(s) || c.address?.toLowerCase().includes(s);
  });

  const handleSave = () => { setShowForm(false); setEditLead(null); fetchData(); };
  const handleEdit = (c) => { setEditLead(c); setShowForm(true); };

  if(loading) return <div className="page-loading"><Loader2 size={32} className="spin"/><p>Cargando pipeline...</p></div>;

  return (
    <div className="crm-page">
      <div className="crm-toolbar">
        <div className="crm-toolbar-left"><h1>CRM Pipeline</h1><span className="crm-count">{contacts.length} leads</span></div>
        <div className="crm-toolbar-right">
          <div className="crm-search"><Search size={16}/><input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}/></div>
          <div className="crm-view-toggle">
            <button className={viewMode==='kanban'?'active':''} onClick={() => setViewMode('kanban')} title="Kanban"><span className="material-symbols-outlined">view_kanban</span></button>
            <button className={viewMode==='list'?'active':''} onClick={() => setViewMode('list')} title="Lista"><span className="material-symbols-outlined">view_list</span></button>
          </div>
          <button className="btn-primary" onClick={() => { setEditLead(null); setShowForm(true); }}><Plus size={18}/><span>Nuevo Lead</span></button>
        </div>
      </div>

      {viewMode==='kanban' ? (
        <div className="crm-kanban">
          {PIPELINE_STAGES.map(stage => {
            const stageLeads = filtered.filter(c => c.pipeline_status===stage.id);
            return (
              <div key={stage.id} className="kanban-column" onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e,stage.id)}>
                <div className="kanban-column-header">
                  <div className="kanban-stage-dot" style={{background:stage.color}}/>
                  <span className="kanban-stage-label">{stage.label}</span>
                  <span className="kanban-stage-count">{stageLeads.length}</span>
                </div>
                <div className="kanban-column-body">
                  {stageLeads.map(c => <LeadCard key={c.id} lead={c} onClick={handleEdit}/>)}
                  {stageLeads.length===0 && <div className="kanban-empty"><p>Sin leads</p></div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="crm-list">
          <table>
            <thead><tr><th>Nombre</th><th>Teléfono</th><th>Dirección</th><th>Origen</th><th>Etapa</th><th>Asignado</th><th>Fecha</th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => handleEdit(c)} className="crm-list-row">
                  <td className="lead-name-cell">{c.first_name} {c.last_name}</td>
                  <td>{c.phone||'—'}</td>
                  <td>{c.address?`${c.address}${c.city?`, ${c.city}`:''}` :'—'}</td>
                  <td><span className="source-badge">{SOURCE_LABELS[c.source]||'—'}</span></td>
                  <td><span className="stage-badge" style={{background:PIPELINE_STAGES.find(s=>s.id===c.pipeline_status)?.color}}>{PIPELINE_STAGES.find(s=>s.id===c.pipeline_status)?.label}</span></td>
                  <td>{c.assigned_profile?.full_name||'—'}</td>
                  <td>{new Date(c.created_at).toLocaleDateString('es')}</td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={7} className="crm-empty-row">No hay leads</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <ContactForm contact={editLead} salespeople={salespeople} onSave={handleSave} onClose={() => { setShowForm(false); setEditLead(null); }}/>}
    </div>
  );
}
