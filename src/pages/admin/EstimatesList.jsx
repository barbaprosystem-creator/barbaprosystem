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
import { useNavigate } from 'react-router-dom';

export default function EstimatesList() {
  const navigate = useNavigate();
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { fetchEstimates(); }, []);

  async function fetchEstimates() {
    setLoading(true);
    const { data } = await supabase.from('estimates')
      .select('*, contact:contacts!estimates_contact_id_fkey(first_name,last_name,phone,address,email), creator:profiles!estimates_created_by_fkey(full_name)')
      .order('created_at',{ascending:false});
    setEstimates(data||[]);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    const est = estimates.find(e => e.id === id);
    if (!est) return;

    await supabase.from('estimates').update({status,updated_at:new Date().toISOString()}).eq('id',id);
    
    // Enviar correo si el estado cambia a 'sent'
    if (status === 'sent' && est.contact?.email) {
      try {
        const { data: items } = await supabase.from('estimate_items').select('*').eq('estimate_id', id);
        const formatMoney = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
        
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: est.contact.email,
            subject: `Propuesta de Proyecto EST-${String(est.estimate_number).padStart(4,'0')} - Barba Construction`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
                <div style="background-color: #111111; padding: 30px 20px; text-align: center; border-bottom: 5px solid #F5C518;">
                  <img src="https://barbaprosystem.com/logo-barba.png" alt="Barba Construction" style="max-height: 60px; margin-bottom: 10px;" />
                  <p style="color: #888888; font-size: 12px; margin-top: 0;">Excelencia en Roofing, Siding & Gutters</p>
                </div>
                
                <div style="padding: 40px 30px;">
                  <h2 style="color: #111111; margin-top: 0; font-size: 20px;">Hola ${est.contact.first_name},</h2>
                  <p style="color: #444444; line-height: 1.6; font-size: 15px;">Adjunto encontrarás la propuesta detallada para tu proyecto. Queremos agradecerte por darnos la oportunidad de transformar tu hogar.</p>
                  
                  <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #F5C518; color: #333333; font-style: italic; font-size: 15px; line-height: 1.6;">
                    ${est.notes ? est.notes.replace(/\n/g, '<br/>') : 'Encuentra los detalles de los servicios a continuación.'}
                  </div>
                  
                  <h3 style="color: #111111; border-bottom: 1px solid #eeeeee; padding-bottom: 10px; margin-top: 35px;">Resumen de Inversión</h3>
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    ${(items || []).map(item => `
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; color: #444444;">
                          <strong style="color: #111111;">${item.description}</strong><br/>
                          <span style="font-size: 13px; color: #888888;">Cantidad: ${item.quantity}</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; text-align: right; color: #111111; font-weight: bold;">
                          ${formatMoney(item.total)}
                        </td>
                      </tr>
                    `).join('')}
                  </table>
                  
                  <div style="text-align: right; padding-top: 10px;">
                    <p style="margin: 5px 0; color: #666666; font-size: 15px;">Subtotal: ${formatMoney(est.subtotal || 0)}</p>
                    <p style="margin: 5px 0; color: #111111; font-size: 20px; font-weight: 900;">Total Estimado: <span style="color: #e65100;">${formatMoney(est.grand_total || est.total || 0)}</span></p>
                  </div>

                  <div style="text-align: center; margin: 40px 0;">
                    <a href="https://barbaprosystem.com/p/${est.id}" style="background-color: #F5C518; color: #000000; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 197, 24, 0.2);">
                      Ver Estimado, Firmar y Autorizar
                    </a>
                    <p style="font-size: 12px; color: #888888; margin-top: 15px;">* Haz clic en el botón para ver el PDF oficial, firmarlo y aprobar el proyecto.</p>
                  </div>

                  <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;" />
                  
                  <p style="color: #444444; line-height: 1.6; font-size: 14px;">Quedo a tu entera disposición para cualquier consulta o aclaración que puedas necesitar sobre esta propuesta.</p>
                  <p style="color: #111111; line-height: 1.6; font-size: 14px; margin-top: 20px;">
                    Atentamente,<br/>
                    <strong>Equipo de Ventas</strong><br/>
                    <span style="color: #666666;">Barba Construction</span>
                  </p>
                </div>
                <div style="background-color: #f5f5f5; padding: 15px; text-align: center; color: #888888; font-size: 12px;">
                  © ${new Date().getFullYear()} Barba Construction. Todos los derechos reservados.
                </div>
              </div>
            `
          })
        });
        
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Error desconocido al enviar el correo');
        }
        
        alert('Estimado enviado por correo correctamente.');
      } catch (err) {
        console.error('Error al enviar el correo:', err);
        alert(`Error de Resend: ${err.message}\n\nNota: Si estás en modo prueba de Resend, solo puedes enviar correos a tu propia dirección verificada.`);
      }
    } else if (status === 'sent') {
      alert('Estimado marcado como enviado. (El cliente no tiene correo registrado para notificarle)');
    }

    // Automatizacion: Crear proyecto si se aprueba el estimado
    if (status === 'approved') {
      await supabase.from('projects').insert([{
        title: `Proyecto de ${est.contact?.first_name || 'Cliente'} - EST-${String(est.estimate_number).padStart(4,'0')}`,
        contact_id: est.contact_id,
        status: 'pending',
        sold_price: est.total || est.grand_total,
        address: est.contact?.address || 'Por confirmar'
      }]);
    }
    
    fetchEstimates();
  }

  async function deleteEstimate(id) {
    if(!confirm('?Eliminar este estimado?')) return;
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
          <button className="btn-primary" onClick={() => navigate('/pos/estimator')}><Plus size={18}/><span>Nuevo Estimado</span></button>
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
                <td>{est.contact?.address||'-'}</td>
                <td className="est-total">{formatCurrency(est.grand_total)}</td>
                <td><span className="stage-badge" style={{background:STATUS_MAP[est.status]?.color}}>{STATUS_MAP[est.status]?.label}</span></td>
                <td>{est.creator?.full_name||'-'}</td>
                <td>{formatDate(est.created_at)}</td>
                <td className="est-actions">
                  {(est.status==='draft' || est.status==='sent') && (
                    <button className="icon-btn" title="Enviar por correo" onClick={() => updateStatus(est.id,'sent')}>
                      <Send size={15}/>
                    </button>
                  )}
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

