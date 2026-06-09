import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Loader2, Send, CheckCircle, XCircle, Trash2, FileSignature, BarChart2, X, Edit } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useEstimatorStore } from '../../store/useEstimatorStore';

const STATUS_COLORS = {
  draft: '#6b7280',
  sent: '#3b82f6',
  approved: '#10b981',
  rejected: '#ef4444',
};

// Parser helper to extract photo URLs from scope_of_work
function extractPhotosFromScope(scope) {
  if (!scope) return [];
  let parts = scope.split('[INSPECTION PHOTOS]');
  if (parts.length < 2) {
    parts = scope.split('[FOTOS DE INSPECCIÓN]');
  }
  if (parts.length < 2) return [];
  return parts[1]
    .split('\n')
    .map(url => url.trim())
    .filter(url => url.startsWith('http'));
}

export default function EstimatesList() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { loadEstimate } = useEstimatorStore();

  const STATUS_MAP = {
    draft:    { label: t('status.draft'),     color: STATUS_COLORS.draft },
    sent:     { label: t('status.sent'),      color: STATUS_COLORS.sent },
    approved: { label: t('status.approved'),  color: STATUS_COLORS.approved },
    rejected: { label: t('status.rejected'),  color: STATUS_COLORS.rejected },
  };

  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryPeriod, setSummaryPeriod] = useState('all'); // all, week, month, year

  // Gallery Modal state
  const [activeGalleryPhotos, setActiveGalleryPhotos] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

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
            subject: `Project Proposal EST-${String(est.estimate_number).padStart(4,'0')} - Barba Construction`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
                <div style="background-color: #111111; padding: 30px 20px; text-align: center; border-bottom: 5px solid #F5C518;">
                  <img src="https://barbaprosystem.com/logo-barba.png" alt="Barba Construction" style="max-height: 60px; margin-bottom: 10px;" />
                  <p style="color: #888888; font-size: 12px; margin-top: 0;">Excellence in Roofing, Siding & Gutters</p>
                </div>
                
                <div style="padding: 40px 30px;">
                  <h2 style="color: #111111; margin-top: 0; font-size: 20px;">Hello ${est.contact.first_name},</h2>
                  <p style="color: #444444; line-height: 1.6; font-size: 15px;">Please find attached the detailed proposal for your project. We want to thank you for giving us the opportunity to transform your home.</p>
                  
                  <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #F5C518; color: #333333; font-style: italic; font-size: 15px; line-height: 1.6;">
                    ${est.notes ? est.notes.replace(/\n/g, '<br/>') : 'Find the details of the services below.'}
                  </div>
                  
                  <h3 style="color: #111111; border-bottom: 1px solid #eeeeee; padding-bottom: 10px; margin-top: 35px;">Investment Summary</h3>
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    ${(items || []).map(item => `
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; color: #444444;">
                          <strong style="color: #111111;">${item.description}</strong><br/>
                          <span style="font-size: 13px; color: #888888;">Quantity: ${item.quantity}</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; text-align: right; color: #111111; font-weight: bold;">
                          ${formatMoney(item.total)}
                        </td>
                      </tr>
                    `).join('')}
                  </table>
                  
                  <div style="text-align: right; padding-top: 10px;">
                    <p style="margin: 5px 0; color: #666666; font-size: 15px;">Subtotal: ${formatMoney(est.subtotal || 0)}</p>
                    <p style="margin: 5px 0; color: #111111; font-size: 20px; font-weight: 900;">Estimated Total: <span style="color: #e65100;">${formatMoney(est.grand_total || est.total || 0)}</span></p>
                  </div>

                  <div style="text-align: center; margin: 40px 0;">
                    <a href="https://barbaprosystem.com/p/${est.id}" style="background-color: #F5C518; color: #000000; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 197, 24, 0.2);">
                      View Estimate, Sign and Authorize
                    </a>
                    <p style="font-size: 12px; color: #888888; margin-top: 15px;">* Click the button to view the official PDF, sign it, and approve the project.</p>
                  </div>

                  <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;" />
                  
                  <p style="color: #444444; line-height: 1.6; font-size: 14px;">I remain at your entire disposal for any questions or clarifications you may need regarding this proposal.</p>
                  <p style="color: #111111; line-height: 1.6; font-size: 14px; margin-top: 20px;">
                    Sincerely,<br/>
                    <strong>Sales Team</strong><br/>
                    <span style="color: #666666;">Barba Construction</span>
                  </p>
                </div>
                <div style="background-color: #f5f5f5; padding: 15px; text-align: center; color: #888888; font-size: 12px;">
                  © ${new Date().getFullYear()} Barba Construction. All rights reserved.
                </div>
              </div>
            `
          })
        });
        
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Error desconocido al enviar el correo');
        }
        
        alert('Estimate sent by email successfully.');
      } catch (err) {
        console.error('Error sending email:', err);
        alert(`Resend Error: ${err.message}\n\nNote: If you are in Resend test mode, you can only send emails to your own verified address.`);
      }
    } else if (status === 'sent') {
      alert('Estimate marked as sent. (The client does not have a registered email to notify)');
    }

    // Automation: Create project if estimate is approved
    if (status === 'approved') {
      await supabase.from('projects').insert([{
        title: `Project for ${est.contact?.first_name || 'Client'} - EST-${String(est.estimate_number).padStart(4,'0')}`,
        contact_id: est.contact_id,
        estimate_id: est.id,
        status: 'pending',
        sold_price: est.total || est.grand_total,
        address: est.contact?.address || 'To be confirmed'
      }]);
    }
    
    fetchEstimates();
  }

  async function deleteEstimate(id) {
    if(!confirm('Delete this estimate?')) return;
    await supabase.from('estimate_items').delete().eq('estimate_id',id);
    await supabase.from('estimates').delete().eq('id',id);
    fetchEstimates();
  }

  const renderPhotosCell = (est) => {
    const urls = extractPhotosFromScope(est.scope_of_work);
    if (urls.length === 0) return <span className="text-[#555]">-</span>;
    return (
      <div 
        onClick={() => { setActiveGalleryPhotos(urls); setActivePhotoIndex(0); }}
        className="relative w-10 h-10 rounded-lg overflow-hidden border border-[#2a2a2a] cursor-pointer hover:scale-105 transition-all shadow-md group flex items-center justify-center bg-[#111]"
      >
        <img 
          src={urls[0]} 
          alt="Inspection" 
          className="w-full h-full object-cover"
        />
        {urls.length > 1 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-bold text-white group-hover:bg-black/40 transition-colors">
            +{urls.length - 1}
          </div>
        )}
      </div>
    );
  };

  const filtered = estimates.filter(e => {
    if(filterStatus!=='all' && e.status!==filterStatus) return false;
    if(!search) return true;
    const s = search.toLowerCase();
    return `${e.contact?.first_name||''} ${e.contact?.last_name||''}`.toLowerCase().includes(s) || String(e.estimate_number).includes(s);
  });

  if(loading) return <div className="page-loading"><Loader2 size={32} className="spin"/><p>{t('actions.loading')}</p></div>;

  return (
    <div className="estimates-page">
      <div className="crm-toolbar">
        <div className="crm-toolbar-left"><h1>{t('estimates.title')}</h1><span className="crm-count">{estimates.length} {t('common.total_count')}</span></div>
        <div className="crm-toolbar-right">
          <div className="crm-search"><Search size={16}/><input placeholder={t('actions.search') + '...'} value={search} onChange={e => setSearch(e.target.value)}/></div>
          <button className="bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#333] text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors" onClick={() => setShowSummaryModal(true)}>
            <BarChart2 size={16}/><span>{t('estimates.salesSummary')}</span>
          </button>
          <button className="btn-primary" onClick={() => navigate('/admin/estimator')}><Plus size={18}/><span>{t('estimates.newEstimate')}</span></button>
        </div>
      </div>
      <div className="estimate-tabs">
        {[{id:'all',label:t('common.all')},...Object.entries(STATUS_MAP).map(([id,v])=>({id,label:v.label}))].map(tab => (
          <button key={tab.id} className={`estimate-tab ${filterStatus===tab.id?'active':''}`} onClick={() => setFilterStatus(tab.id)}>
            {tab.label}<span className="tab-count">{tab.id==='all'?estimates.length:estimates.filter(e=>e.status===tab.id).length}</span>
          </button>
        ))}
      </div>
      <div className="crm-list">
        <table>
          <thead><tr><th>#</th><th>{t('estimates.client')}</th><th>{t('common.address')}</th><th>Photos</th><th>{t('estimates.total')}</th><th>{t('estimates.status')}</th><th>Created by</th><th>{t('estimates.date')}</th><th>{t('estimates.actions')}</th></tr></thead>
          <tbody>
            {filtered.map(est => (
              <tr key={est.id} className="crm-list-row">
                <td className="est-number">EST-{String(est.estimate_number).padStart(4,'0')}</td>
                <td className="lead-name-cell">{est.contact?.first_name} {est.contact?.last_name}</td>
                <td>{est.contact?.address||'-'}</td>
                <td>{renderPhotosCell(est)}</td>
                <td className="est-total">{formatCurrency(est.grand_total)}</td>
                <td><span className="stage-badge" style={{background:STATUS_MAP[est.status]?.color}}>{STATUS_MAP[est.status]?.label}</span></td>
                <td>{est.creator?.full_name||'-'}</td>
                <td>{formatDate(est.created_at)}</td>
                <td className="est-actions">
                  {(est.status==='draft' || est.status==='sent') && (
                    <>
                      <button 
                        className="icon-btn" 
                        title="Edit Estimate" 
                        onClick={async () => {
                          try {
                            await loadEstimate(est.id);
                            navigate('/admin/estimator');
                          } catch (err) {
                            alert('Error loading estimate for editing: ' + err.message);
                          }
                        }}
                      >
                        <Edit size={15}/>
                      </button>
                      <button className="icon-btn" title="Send by email" onClick={() => updateStatus(est.id,'sent')}>
                        <Send size={15}/>
                      </button>
                    </>
                  )}
                  {est.status==='sent' && <>
                    <button className="icon-btn success" title="Approve" onClick={() => updateStatus(est.id,'approved')}><CheckCircle size={15}/></button>
                    <button className="icon-btn danger" title="Reject" onClick={() => updateStatus(est.id,'rejected')}><XCircle size={15}/></button>
                  </>}
                  {est.status==='approved' && (
                    <button className="icon-btn" title="Generate Contract" onClick={() => navigate(`/admin/contract/${est.id}`)}>
                      <FileSignature size={15}/>
                    </button>
                  )}
                  <button className="icon-btn danger" title="Delete" onClick={() => deleteEstimate(est.id)}><Trash2 size={15}/></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="9" className="text-center py-8 text-[#888]">{t('estimates.noEstimates')}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* MODAL RESUMEN VENTAS */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-[#222] rounded-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <BarChart2 className="text-[#FACB00]" /> Sales Summary and Commissions
                </h3>
                <p className="text-sm text-gray-400">Total estimates and commissions calculation (5% on approved).</p>
              </div>
              <button onClick={() => setShowSummaryModal(false)}><X className="text-gray-400 hover:text-white" /></button>
            </div>

            {/* TABS DE PERIODO */}
            <div className="flex gap-2 mb-4">
              {[
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
                { id: 'year', label: 'This Year' },
                { id: 'all', label: 'All-Time History' }
              ].map(p => (
                <button 
                  key={p.id}
                  onClick={() => setSummaryPeriod(p.id)}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${summaryPeriod === p.id ? 'bg-[#FACB00] text-black' : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#333]'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            
            <div className="bg-[#1a1a1a] rounded-lg border border-[#333] overflow-hidden">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-[#222] text-gray-400 font-bold uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Salesperson</th>
                    <th className="px-4 py-3 text-center">Sent (Qty)</th>
                    <th className="px-4 py-3 text-right">Sent Amount</th>
                    <th className="px-4 py-3 text-center">Approved (Qty)</th>
                    <th className="px-4 py-3 text-right">Approved Amount</th>
                    <th className="px-4 py-3 text-right text-[#FACB00]">Commission (5%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333]">
                  {Object.entries(
                    estimates.reduce((acc, est) => {
                      if (est.status !== 'sent' && est.status !== 'approved') return acc;
                      
                      // Filtrar por fecha (usamos created_at o updated_at, por defecto updated_at si existe y está aprobado, sino created_at)
                      const dateToUse = new Date((est.status === 'approved' ? est.updated_at : est.created_at) || est.created_at);
                      const now = new Date();
                      
                      if (summaryPeriod === 'year' && dateToUse.getFullYear() !== now.getFullYear()) return acc;
                      if (summaryPeriod === 'month' && (dateToUse.getFullYear() !== now.getFullYear() || dateToUse.getMonth() !== now.getMonth())) return acc;
                      if (summaryPeriod === 'week') {
                        const day = now.getDay();
                        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                        const startOfWeek = new Date(now.setDate(diff));
                        startOfWeek.setHours(0,0,0,0);
                        if (dateToUse < startOfWeek) return acc;
                      }

                      const name = est.creator?.full_name || 'No Salesperson';
                      if (!acc[name]) acc[name] = { sentCount: 0, sentAmount: 0, appCount: 0, appAmount: 0 };
                      if (est.status === 'sent') {
                        acc[name].sentCount++;
                        acc[name].sentAmount += Number(est.grand_total || 0);
                      } else {
                        acc[name].appCount++;
                        acc[name].appAmount += Number(est.grand_total || 0);
                      }
                      return acc;
                    }, {})
                  ).map(([name, stats]) => (
                    <tr key={name} className="hover:bg-[#2a2a2a] transition-colors">
                      <td className="px-4 py-3 font-bold text-white">{name}</td>
                      <td className="px-4 py-3 text-center text-blue-400">{stats.sentCount}</td>
                      <td className="px-4 py-3 text-right text-blue-400">{formatCurrency(stats.sentAmount)}</td>
                      <td className="px-4 py-3 text-center text-emerald-400 font-bold">{stats.appCount}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-bold">{formatCurrency(stats.appAmount)}</td>
                      <td className="px-4 py-3 text-right text-[#FACB00] font-bold">{formatCurrency(stats.appAmount * 0.05)}</td>
                    </tr>
                  ))}
                  {Object.keys(
                    estimates.reduce((acc, est) => {
                      if (est.status !== 'sent' && est.status !== 'approved') return acc;
                      const dateToUse = new Date((est.status === 'approved' ? est.updated_at : est.created_at) || est.created_at);
                      const now = new Date();
                      if (summaryPeriod === 'year' && dateToUse.getFullYear() !== now.getFullYear()) return acc;
                      if (summaryPeriod === 'month' && (dateToUse.getFullYear() !== now.getFullYear() || dateToUse.getMonth() !== now.getMonth())) return acc;
                      if (summaryPeriod === 'week') {
                        const day = now.getDay();
                        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                        const startOfWeek = new Date(now.setDate(diff));
                        startOfWeek.setHours(0,0,0,0);
                        if (dateToUse < startOfWeek) return acc;
                      }
                      acc[1]=1; return acc;
                    }, {})
                  ).length === 0 && (
                    <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-500">No sales data for this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* PHOTO GALLERY LIGHTBOX MODAL */}
      {activeGalleryPhotos && (
        <div 
          className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-[100] p-4"
          onClick={() => setActiveGalleryPhotos(null)}
        >
          {/* Close button */}
          <button 
            onClick={() => setActiveGalleryPhotos(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-[#111]/80 hover:bg-[#222] p-3 rounded-full transition-all z-[110] border border-white/10"
            title="Close"
          >
            <X size={20} />
          </button>
          
          <div 
            className="relative max-w-4xl w-full flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main Stage */}
            <div className="relative w-full aspect-[4/3] max-h-[70vh] bg-black rounded-2xl overflow-hidden border border-[#222] flex items-center justify-center shadow-2xl">
              <img 
                src={activeGalleryPhotos[activePhotoIndex]} 
                alt={`Inspection Photo ${activePhotoIndex + 1}`}
                className="max-w-full max-h-full object-contain select-none"
              />
              
              {activeGalleryPhotos.length > 1 && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIndex((prev) => (prev === 0 ? activeGalleryPhotos.length - 1 : prev - 1));
                    }}
                    className="absolute left-4 w-12 h-12 rounded-full bg-[#111]/80 hover:bg-[#222] text-white flex items-center justify-center border border-white/10 hover:scale-105 active:scale-95 transition-all text-lg font-bold"
                  >
                    ‹
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIndex((prev) => (prev === activeGalleryPhotos.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-4 w-12 h-12 rounded-full bg-[#111]/80 hover:bg-[#222] text-white flex items-center justify-center border border-white/10 hover:scale-105 active:scale-95 transition-all text-lg font-bold"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            
            {/* Thumbnail Strip */}
            {activeGalleryPhotos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto max-w-full pb-2 px-4 no-scrollbar">
                {activeGalleryPhotos.map((url, idx) => (
                  <button
                    key={url}
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${idx === activePhotoIndex ? 'border-[#f97316] scale-105 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <img src={url} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}
            
            <p className="text-white/60 text-xs font-semibold tracking-widest uppercase">
              Photo {activePhotoIndex + 1} of {activeGalleryPhotos.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
