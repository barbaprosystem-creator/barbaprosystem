import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Loader2, Send, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';

const STATUS_MAP = {
  draft: { label:'Borrador', color:'#6b7280' },
  sent: { label:'Enviado', color:'#3b82f6' },
  approved: { label:'Aprobado', color:'#10b981' },
  rejected: { label:'Rechazado', color:'#ef4444' },
};

export default function EstimatesList() {
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { fetchEstimates(); }, []);

  async function fetchEstimates() {
    setLoading(true);
    const { data } = await supabase.from('estimates')
      .select('*, contact:contacts!estimates_contact_id_fkey(first_name,last_name,phone,address), creator:profiles!estimates_created_by_fkey(full_name)')
      .order('created_at',{ascending:false});
    setEstimates(data||[]);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    await supabase.from('estimates').update({status,updated_at:new Date().toISOString()}).eq('id',id);
    
    // Automatizacion: Crear proyecto si se aprueba el estimado
    if (status === 'approved') {
      const est = estimates.find(e => e.id === id);
      if (est) {
        await supabase.from('projects').insert([{
          title: `Proyecto de ${est.contact?.first_name || 'Cliente'} - EST-${String(est.estimate_number).padStart(4,'0')}`,
          contact_id: est.contact_id,
          status: 'pending',
          sold_price: est.grand_total,
          address: est.contact?.address || 'Por confirmar'
        }]);
      }
    }
    
    fetchEstimates();
  }

  async function deleteEstimate(id) {
    if(!confirm('Â�Eliminar este estimado?')) return;
    await supabase.from('estimate_items').delete().eq('estimate_id',id);
    await supabase.from('estimates').delete().eq('id',id);
    fetchEstimates();
  }

  const filtered = estimates.filter(e => {
    if(filterStatus!=='all' && e.status!==filterStatus) return false;
    if(!search) return true;
    const s = search.toLowerCase();
    return `${e.contact?.first_name||''} ${e.contact?.last_name||''}`.toLowerCase().includes(s) || String(e.estimate_number).includes(s);
  });

  if(loading) return <div className="page-loading"><Loader2 size={32} className="spin"/><p>Cargando estimados...</p></div>;

  return (
    <div className="estimates-page">
      <div className="crm-toolbar">
        <div className="crm-toolbar-left"><h1>Estimados</h1><span className="crm-count">{estimates.length} total</span></div>
        <div className="crm-toolbar-right">
          <div className="crm-search"><Search size={16}/><input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}/></div>
          <button className="btn-primary" onClick={() => alert('Constructor de Estimados âEUR" Proximamente')}><Plus size={18}/><span>Nuevo Estimado</span></button>
        </div>
      </div>
      <div className="estimate-tabs">
        {[{id:'all',label:'Todos'},...Object.entries(STATUS_MAP).map(([id,v])=>({id,label:v.label}))].map(tab => (
          <button key={tab.id} className={`estimate-tab ${filterStatus===tab.id?'active':''}`} onClick={() => setFilterStatus(tab.id)}>
            {tab.label}<span className="tab-count">{tab.id==='all'?estimates.length:estimates.filter(e=>e.status===tab.id).length}</span>
          </button>
        ))}
      </div>
      <div className="crm-list">
        <table>
          <thead><tr><th>#</th><th>Cliente</th><th>Direccion</th><th>Total</th><th>Estado</th><th>Creado por</th><th>Fecha</th><th>Acciones</th></tr></thead>
          <tbody>
            {filtered.map(est => (
              <tr key={est.id} className="crm-list-row">
                <td className="est-number">EST-{String(est.estimate_number).padStart(4,'0')}</td>
                <td className="lead-name-cell">{est.contact?.first_name} {est.contact?.last_name}</td>
                <td>{est.contact?.address||'âEUR"'}</td>
                <td className="est-total">{formatCurrency(est.grand_total)}</td>
                <td><span className="stage-badge" style={{background:STATUS_MAP[est.status]?.color}}>{STATUS_MAP[est.status]?.label}</span></td>
                <td>{est.creator?.full_name||'âEUR"'}</td>
                <td>{formatDate(est.created_at)}</td>
                <td className="est-actions">
                  {est.status==='draft' && <button className="icon-btn" title="Enviar" onClick={() => updateStatus(est.id,'sent')}><Send size={15}/></button>}
                  {est.status==='sent' && <>
                    <button className="icon-btn success" title="Aprobar" onClick={() => updateStatus(est.id,'approved')}><CheckCircle size={15}/></button>
                    <button className="icon-btn danger" title="Rechazar" onClick={() => updateStatus(est.id,'rejected')}><XCircle size={15}/></button>
                  </>}
                  <button className="icon-btn danger" title="Eliminar" onClick={() => deleteEstimate(est.id)}><Trash2 size={15}/></button>
                </td>
              </tr>
            ))}
            {filtered.length===0 && <tr><td colSpan={8} className="crm-empty-row">No hay estimados</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

