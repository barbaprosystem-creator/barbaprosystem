import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Phone, MapPin, Calendar, X, Loader2, Star, Filter } from 'lucide-react';

const PIPELINE_STAGES = [
  { id: 'new_lead',       label: 'Nuevo',            color: '#3b82f6' },
  { id: 'contacted',      label: 'Contactado',        color: '#f59e0b' },
  { id: 'appointment_set',label: 'Cita Agendada',     color: '#8b5cf6' },
  { id: 'estimate_sent',  label: 'Estimado Enviado',  color: '#06b6d4' },
  { id: 'closed_won',     label: '✅ Ganado',          color: '#10b981' },
  { id: 'closed_lost',    label: '❌ Perdido',         color: '#ef4444' },
];

const SOURCES = [
  { id: 'google',    label: 'Google My Business', icon: '🔍', color: '#4285F4' },
  { id: 'facebook',  label: 'Facebook',           icon: '📘', color: '#1877F2' },
  { id: 'instagram', label: 'Instagram',          icon: '📸', color: '#E1306C' },
  { id: 'tiktok',    label: 'TikTok',             icon: '🎵', color: '#010101' },
  { id: 'referral',  label: 'Referido',           icon: '🤝', color: '#10b981' },
  { id: 'phone',     label: 'Llamada',            icon: '📞', color: '#6b7280' },
  { id: 'walk_in',   label: 'Walk-in',            icon: '🚶', color: '#f59e0b' },
  { id: 'web',       label: 'Sitio Web',          icon: '🌐', color: '#8b5cf6' },
  { id: 'other',     label: 'Otro',               icon: '📋', color: '#6b7280' },
];

const QUALITY = {
  hot:  { label: 'Caliente', color: '#ef4444', dot: '🔴' },
  warm: { label: 'Tibio',    color: '#f59e0b', dot: '🟡' },
  cold: { label: 'Frío',     color: '#3b82f6', dot: '🔵' },
};

const srcMap = Object.fromEntries(SOURCES.map(s => [s.id, s]));

function ContactForm({ contact, onSave, onClose, salespeople }) {
  const [form, setForm] = useState(contact || {
    first_name: '', last_name: '', email: '', phone: '',
    address: '', city: '', state: 'KY', zip: '',
    source: 'phone', pipeline_status: 'new_lead',
    assigned_to: '', lead_quality: 'warm', notes: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.assigned_to) delete payload.assigned_to;
      if (!payload.lead_quality) delete payload.lead_quality;
      if (contact?.id) {
        const { error } = await supabase.from('contacts').update(payload).eq('id', contact.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('contacts').insert(payload);
        if (error) throw error;
      }
      onSave();
    } catch (err) { alert('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content crm-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{contact?.id ? 'Editar Lead' : 'Nuevo Lead'}</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Source quick-select */}
        {!contact?.id && (
          <div style={{ padding: '0 24px 16px' }}>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Origen del Lead</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {SOURCES.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => set('source', s.id)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '8px',
                    border: `2px solid ${form.source === s.id ? s.color : 'transparent'}`,
                    background: form.source === s.id ? s.color + '22' : '#1e293b',
                    color: form.source === s.id ? s.color : '#9ca3af',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="crm-form">
          <div className="crm-form-grid">
            <div className="form-group"><label>Nombre *</label><input value={form.first_name} onChange={e => set('first_name', e.target.value)} required /></div>
            <div className="form-group"><label>Apellido *</label><input value={form.last_name} onChange={e => set('last_name', e.target.value)} required /></div>
            <div className="form-group"><label>Teléfono</label><input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(502) 555-0000" /></div>
            <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="form-group full-width"><label>Dirección</label><input value={form.address} onChange={e => set('address', e.target.value)} /></div>
            <div className="form-group"><label>Ciudad</label><input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Louisville" /></div>
            <div className="form-group"><label>Estado</label><input value={form.state} onChange={e => set('state', e.target.value)} /></div>
            <div className="form-group"><label>ZIP</label><input value={form.zip} onChange={e => set('zip', e.target.value)} /></div>

            <div className="form-group">
              <label>Etapa</label>
              <select value={form.pipeline_status} onChange={e => set('pipeline_status', e.target.value)}>
                {PIPELINE_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Calidad del Lead</label>
              <select value={form.lead_quality || 'warm'} onChange={e => set('lead_quality', e.target.value)}>
                <option value="hot">🔴 Caliente</option>
                <option value="warm">🟡 Tibio</option>
                <option value="cold">🔵 Frío</option>
              </select>
            </div>
            <div className="form-group">
              <label>Asignar a</label>
              <select value={form.assigned_to || ''} onChange={e => set('assigned_to', e.target.value || null)}>
                <option value="">Sin asignar</option>
                {salespeople.map(sp => <option key={sp.id} value={sp.id}>{sp.full_name}</option>)}
              </select>
            </div>
            {contact?.id && (
              <div className="form-group">
                <label>Origen</label>
                <select value={form.source} onChange={e => set('source', e.target.value)}>
                  {SOURCES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
                </select>
              </div>
            )}
            <div className="form-group full-width"><label>Notas</label><textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3} /></div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Loader2 size={18} className="spin" /> : null}
              {contact?.id ? 'Guardar Cambios' : 'Crear Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LeadCard({ lead, onClick }) {
  const src = srcMap[lead.source];
  const q = QUALITY[lead.lead_quality];
  return (
    <div className="lead-card" draggable onDragStart={e => e.dataTransfer.setData('leadId', lead.id)} onClick={() => onClick(lead)}>
      <div className="lead-card-header">
        <span className="lead-name">{lead.first_name} {lead.last_name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {q && <span title={q.label} style={{ fontSize: '10px' }}>{q.dot}</span>}
          {src && (
            <span
              title={src.label}
              style={{
                fontSize: '11px', fontWeight: '700', padding: '2px 6px',
                borderRadius: '4px', background: src.color + '22',
                color: src.color, border: `1px solid ${src.color}44`,
              }}
            >
              {src.icon} {src.label}
            </span>
          )}
        </div>
      </div>
      {lead.phone && <div className="lead-card-detail"><Phone size={13} /><span>{lead.phone}</span></div>}
      {lead.address && <div className="lead-card-detail"><MapPin size={13} /><span>{lead.address}{lead.city ? `, ${lead.city}` : ''}</span></div>}
      {lead.assigned_profile && (
        <div className="lead-card-footer">
          <div className="lead-avatar">{lead.assigned_profile.full_name?.[0]}</div>
          <span className="lead-assigned">{lead.assigned_profile.full_name}</span>
        </div>
      )}
      <div className="lead-card-date"><Calendar size={12} /><span>{new Date(lead.created_at).toLocaleDateString('es')}</span></div>
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
  const [filterSource, setFilterSource] = useState('all');
  const [filterQuality, setFilterQuality] = useState('all');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [cRes, pRes] = await Promise.all([
      supabase.from('contacts')
        .select('*, assigned_profile:profiles!contacts_assigned_to_fkey(full_name)')
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('id,full_name,role').in('role', ['salesperson', 'admin']),
    ]);
    setContacts(cRes.data || []);
    setSalespeople(pRes.data || []);
    setLoading(false);
  }

  async function handleDrop(e, newStatus) {
    e.preventDefault();
    const id = e.dataTransfer.getData('leadId');
    if (!id) return;
    setContacts(prev => prev.map(c => c.id === id ? { ...c, pipeline_status: newStatus } : c));
    const { error } = await supabase.from('contacts')
      .update({ pipeline_status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) fetchData();
  }

  const filtered = contacts.filter(c => {
    if (filterSource !== 'all' && c.source !== filterSource) return false;
    if (filterQuality !== 'all' && c.lead_quality !== filterQuality) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return `${c.first_name} ${c.last_name}`.toLowerCase().includes(s) ||
      c.phone?.toLowerCase().includes(s) || c.address?.toLowerCase().includes(s);
  });

  const handleSave = () => { setShowForm(false); setEditLead(null); fetchData(); };
  const handleEdit = (c) => { setEditLead(c); setShowForm(true); };

  // Source stats
  const sourceCounts = SOURCES.map(s => ({
    ...s, count: contacts.filter(c => c.source === s.id).length,
  })).filter(s => s.count > 0);

  if (loading) return <div className="page-loading"><Loader2 size={32} className="spin" /><p>Cargando pipeline...</p></div>;

  return (
    <div className="crm-page">
      <div className="crm-toolbar">
        <div className="crm-toolbar-left">
          <h1>CRM Pipeline</h1>
          <span className="crm-count">{contacts.length} leads</span>
        </div>
        <div className="crm-toolbar-right">
          <div className="crm-search">
            <Search size={16} />
            <input placeholder="Buscar nombre, teléfono..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="crm-view-toggle">
            <button className={viewMode === 'kanban' ? 'active' : ''} onClick={() => setViewMode('kanban')} title="Kanban">
              <span className="material-symbols-outlined">view_kanban</span>
            </button>
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} title="Lista">
              <span className="material-symbols-outlined">view_list</span>
            </button>
          </div>
          <button className="btn-primary" onClick={() => { setEditLead(null); setShowForm(true); }}>
            <Plus size={18} /><span>Nuevo Lead</span>
          </button>
        </div>
      </div>

      {/* Source + Quality filter chips */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 0 16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={14} style={{ color: '#6b7280' }} />
        <button
          onClick={() => setFilterSource('all')}
          style={{
            padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
            border: `2px solid ${filterSource === 'all' ? '#f97316' : '#374151'}`,
            background: filterSource === 'all' ? '#f9731622' : 'transparent',
            color: filterSource === 'all' ? '#f97316' : '#9ca3af', cursor: 'pointer',
          }}
        >
          Todos ({contacts.length})
        </button>
        {sourceCounts.map(s => (
          <button
            key={s.id}
            onClick={() => setFilterSource(filterSource === s.id ? 'all' : s.id)}
            style={{
              padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
              border: `2px solid ${filterSource === s.id ? s.color : '#374151'}`,
              background: filterSource === s.id ? s.color + '22' : 'transparent',
              color: filterSource === s.id ? s.color : '#9ca3af', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            {s.icon} {s.label} ({s.count})
          </button>
        ))}
        <span style={{ color: '#374151', margin: '0 4px' }}>|</span>
        {['hot', 'warm', 'cold'].map(q => (
          <button
            key={q}
            onClick={() => setFilterQuality(filterQuality === q ? 'all' : q)}
            style={{
              padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
              border: `2px solid ${filterQuality === q ? QUALITY[q].color : '#374151'}`,
              background: filterQuality === q ? QUALITY[q].color + '22' : 'transparent',
              color: filterQuality === q ? QUALITY[q].color : '#9ca3af', cursor: 'pointer',
            }}
          >
            {QUALITY[q].dot} {QUALITY[q].label}
          </button>
        ))}
      </div>

      {viewMode === 'kanban' ? (
        <div className="crm-kanban">
          {PIPELINE_STAGES.map(stage => {
            const stageLeads = filtered.filter(c => c.pipeline_status === stage.id);
            return (
              <div key={stage.id} className="kanban-column"
                onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, stage.id)}>
                <div className="kanban-column-header">
                  <div className="kanban-stage-dot" style={{ background: stage.color }} />
                  <span className="kanban-stage-label">{stage.label}</span>
                  <span className="kanban-stage-count">{stageLeads.length}</span>
                </div>
                <div className="kanban-column-body">
                  {stageLeads.map(c => <LeadCard key={c.id} lead={c} onClick={handleEdit} />)}
                  {stageLeads.length === 0 && <div className="kanban-empty"><p>Sin leads</p></div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="crm-list">
          <table>
            <thead>
              <tr>
                <th>Nombre</th><th>Teléfono</th><th>Dirección</th>
                <th>Origen</th><th>Calidad</th><th>Etapa</th>
                <th>Asignado</th><th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const src = srcMap[c.source];
                const q = QUALITY[c.lead_quality];
                return (
                  <tr key={c.id} onClick={() => handleEdit(c)} className="crm-list-row">
                    <td className="lead-name-cell">{c.first_name} {c.last_name}</td>
                    <td>{c.phone || '—'}</td>
                    <td>{c.address ? `${c.address}${c.city ? `, ${c.city}` : ''}` : '—'}</td>
                    <td>
                      {src ? (
                        <span style={{
                          fontSize: '11px', fontWeight: '700', padding: '2px 8px',
                          borderRadius: '4px', background: src.color + '22', color: src.color,
                        }}>
                          {src.icon} {src.label}
                        </span>
                      ) : '—'}
                    </td>
                    <td>{q ? <span title={q.label}>{q.dot}</span> : '—'}</td>
                    <td>
                      <span className="stage-badge" style={{ background: PIPELINE_STAGES.find(s => s.id === c.pipeline_status)?.color }}>
                        {PIPELINE_STAGES.find(s => s.id === c.pipeline_status)?.label}
                      </span>
                    </td>
                    <td>{c.assigned_profile?.full_name || '—'}</td>
                    <td>{new Date(c.created_at).toLocaleDateString('es')}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={8} className="crm-empty-row">No hay leads</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ContactForm
          contact={editLead}
          salespeople={salespeople}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditLead(null); }}
        />
      )}
    </div>
  );
}
