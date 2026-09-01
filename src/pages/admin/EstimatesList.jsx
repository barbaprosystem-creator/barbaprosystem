import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Loader2, Send, CheckCircle, XCircle, Trash2, FileSignature, BarChart2, X, Edit, RefreshCw } from 'lucide-react';
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
  const [profiles, setProfiles] = useState([]);
  const [sortBy, setSortBy] = useState('date-desc');

  // Gallery Modal state
  const [activeGalleryPhotos, setActiveGalleryPhotos] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // QuickBooks sync state
  const [syncingId, setSyncingId] = useState(null);
  const [syncingQbo, setSyncingQbo] = useState(false);

  useEffect(() => { 
    fetchEstimates();
    fetchProfiles();
    
    // Run incremental background sync from QBO quietly on mount with safety timeout & 10min session cooldown
    const lastPull = sessionStorage.getItem('barba_qbo_last_pull');
    const now = Date.now();
    let timeoutId = null;
    const controller = new AbortController();

    if (!lastPull || now - parseInt(lastPull, 10) > 10 * 60 * 1000) {
      sessionStorage.setItem('barba_qbo_last_pull', now.toString());
      timeoutId = setTimeout(() => controller.abort(), 3500);

      fetch('/api/qbo-pull-recent', { method: 'POST', signal: controller.signal })
        .then(res => {
          if (timeoutId) clearTimeout(timeoutId);
          if (!res.ok) return null;
          return res.json();
        })
        .then(data => {
          if (data && (data.invoicesCreated > 0 || data.customersCreated > 0 || data.estimatesCreated > 0)) {
            console.log(`[QBO Background Sync] Loaded ${data.invoicesCreated} invoices, ${data.estimatesCreated} estimates, and ${data.customersCreated} customers.`);
            fetchEstimates();
          }
        })
        .catch(() => {
          if (timeoutId) clearTimeout(timeoutId);
        });
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  async function fetchProfiles() {
    const { data } = await supabase.from('profiles').select('id, full_name').order('full_name');
    setProfiles(data || []);
  }

  async function updateCreator(estimateId, creatorId) {
    const val = creatorId === '' ? null : creatorId;
    const { error } = await supabase
      .from('estimates')
      .update({ created_by: val })
      .eq('id', estimateId);

    if (error) {
      alert("Error updating creator: " + error.message);
    } else {
      setEstimates(prev => prev.map(est => {
        if (est.id === estimateId) {
          const profile = profiles.find(p => p.id === val);
          return {
            ...est,
            created_by: val,
            creator: profile ? { full_name: profile.full_name } : null
          };
        }
        return est;
      }));
    }
  }

  async function syncRecentQboData() {
    setSyncingQbo(true);
    try {
      const res = await fetch('/api/qbo-pull-recent', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import recent QBO updates');
      }
      alert(`Sincronización de QuickBooks completada!\n\n` +
            `Estimados de QuickBooks procesados: ${data.estimatesProcessed || 0}\n` +
            `Nuevos estimados cargados: ${data.estimatesCreated || 0}\n` +
            `Facturas procesadas: ${data.invoicesProcessed || 0}\n` +
            `Nuevos proyectos/facturas cargadas: ${data.invoicesCreated || 0}\n` +
            `Clientes nuevos agregados: ${data.customersCreated || 0}`);
      fetchEstimates();
    } catch (err) {
      console.error(err);
      alert('Error en la sincronización de QuickBooks: ' + err.message);
    } finally {
      setSyncingQbo(false);
    }
  }

  async function fetchEstimates() {
    setLoading(true);
    try {
      let allData = [];
      let page = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase.from('estimates')
          .select('*, contact:contacts!estimates_contact_id_fkey(first_name,last_name,phone,address,email), creator:profiles!estimates_created_by_fkey(full_name)')
          .order('created_at',{ascending:false})
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < pageSize) break;
        page++;
      }
      setEstimates(allData);
    } catch (err) {
      console.error("Error fetching estimates:", err);
      alert("Error fetching estimates: " + err.message);
      setEstimates([]);
    } finally {
      setLoading(false);
    }
  }

  async function syncToQuickBooks(estimateId) {
    setSyncingId(estimateId);
    try {
      const res = await fetch('/api/qbo-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimateId })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync');
      }
      alert(`Successfully synced to QuickBooks! Invoice ID: ${data.qboInvoiceNumber}`);
      fetchEstimates();
    } catch (err) {
      console.error(err);
      alert('Error syncing to QuickBooks: ' + err.message);
    } finally {
      setSyncingId(null);
    }
  }
  async function updateStatus(id, status) {
    const est = estimates.find(e => e.id === id);
    if (!est) return;

    if (status === 'sent') {
      if (!est.contact?.email) {
        alert('Estimate marked as sent. (The client does not have a registered email to notify)');
        await supabase.from('estimates').update({status, updated_at: new Date().toISOString()}).eq('id', id);
        fetchEstimates();
        return;
      }
      try {
        const response = await fetch('/api/send-estimate-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estimateId: id })
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Error al enviar el correo');
        }
        alert('Estimate and QuickBooks Invoice sent by email successfully.');
        fetchEstimates();
      } catch (err) {
        console.error('Error sending email:', err);
        alert(`Resend Error: ${err.message}`);
      }
      return;
    }

    await supabase.from('estimates').update({status,updated_at:new Date().toISOString()}).eq('id',id);
    
    // Automation: Create project if estimate is approved
    if (status === 'approved') {
      await supabase.from('projects').insert([{
        title: `Project for ${est.contact?.first_name || 'Client'} - EST-${String(est.estimate_number).padStart(4,'0')}`,
        contact_id: est.contact_id,
        estimate_id: est.id,
        status: 'pending',
        sold_price: est.total || est.grand_total,
        address: est.contact?.address || 'To be confirmed',
        start_date: new Date().toISOString().split('T')[0]
      }]);
      // Automate QBO sync
      syncToQuickBooks(id).catch(console.error);
    }
    
    fetchEstimates();
  }

  async function deleteEstimate(id) {
    if(!confirm('Delete this estimate?')) return;
    try {
      await supabase.from('estimate_items').delete().eq('estimate_id',id);
      await supabase.from('projects').update({ estimate_id: null }).eq('estimate_id',id);
      const { error } = await supabase.from('estimates').delete().eq('id',id);
      if (error) throw error;
      fetchEstimates();
    } catch (err) {
      alert("Error deleting estimate: " + err.message);
    }
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

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date-desc') {
      const timeA = new Date(a.created_at || 0).getTime() || 0;
      const timeB = new Date(b.created_at || 0).getTime() || 0;
      return timeB - timeA;
    }
    if (sortBy === 'date-asc') {
      const timeA = new Date(a.created_at || 0).getTime() || 0;
      const timeB = new Date(b.created_at || 0).getTime() || 0;
      return timeA - timeB;
    }
    if (sortBy === 'number-desc') {
      return (b.estimate_number || 0) - (a.estimate_number || 0);
    }
    if (sortBy === 'number-asc') {
      return (a.estimate_number || 0) - (b.estimate_number || 0);
    }
    if (sortBy === 'amount-desc') {
      return (b.grand_total || 0) - (a.grand_total || 0);
    }
    if (sortBy === 'amount-asc') {
      return (a.grand_total || 0) - (b.grand_total || 0);
    }
    if (sortBy === 'client-asc') {
      const nameA = `${a.contact?.first_name || ''} ${a.contact?.last_name || ''}`.trim();
      const nameB = `${b.contact?.first_name || ''} ${b.contact?.last_name || ''}`.trim();
      return nameA.localeCompare(nameB);
    }
    if (sortBy === 'client-desc') {
      const nameA = `${a.contact?.first_name || ''} ${a.contact?.last_name || ''}`.trim();
      const nameB = `${b.contact?.first_name || ''} ${b.contact?.last_name || ''}`.trim();
      return nameB.localeCompare(nameA);
    }
    return 0;
  });

  if(loading) return <div className="page-loading"><Loader2 size={32} className="spin"/><p>{t('actions.loading')}</p></div>;

  return (
    <div className="estimates-page">
      <div className="crm-toolbar">
        <div className="crm-toolbar-left"><h1>{t('estimates.title')}</h1><span className="crm-count">{estimates.length} {t('common.total_count')}</span></div>
        <div className="crm-toolbar-right">
          <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-2 text-sm text-gray-400">
            <span className="text-xs whitespace-nowrap">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-0 text-white py-1 focus:outline-none cursor-pointer font-bold text-xs"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="number-desc">Estimate # (High-Low)</option>
              <option value="number-asc">Estimate # (Low-High)</option>
              <option value="amount-desc">Total Amount (High-Low)</option>
              <option value="amount-asc">Total Amount (Low-High)</option>
              <option value="client-asc">Client Name (A-Z)</option>
              <option value="client-desc">Client Name (Z-A)</option>
            </select>
          </div>
          <div className="crm-search"><Search size={16}/><input placeholder={t('actions.search') + '...'} value={search} onChange={e => setSearch(e.target.value)}/></div>
          <button className="bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#333] text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors" onClick={() => setShowSummaryModal(true)}>
            <BarChart2 size={16}/><span>{t('estimates.salesSummary')}</span>
          </button>
          <button 
            disabled={syncingQbo}
            className="bg-[#10b981] hover:bg-[#059669] text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors disabled:opacity-50"
            onClick={syncRecentQboData}
          >
            <RefreshCw size={16} className={syncingQbo ? 'animate-spin' : ''}/>
            <span>{syncingQbo ? 'Syncing QBO...' : 'Sync QBO'}</span>
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
            {sorted.map(est => (
              <tr key={est.id} className="crm-list-row">
                <td className="est-number">
                  <div>EST-{String(est.estimate_number).padStart(4,'0')}</div>
                  {est.qbo_invoice_number && (
                    <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                      QBO #{est.qbo_invoice_number}
                    </div>
                  )}
                </td>
                <td className="lead-name-cell">{est.contact?.first_name} {est.contact?.last_name}</td>
                <td>{est.contact?.address||'-'}</td>
                <td>{renderPhotosCell(est)}</td>
                <td className="est-total">{formatCurrency(est.grand_total)}</td>
                <td><span className="stage-badge" style={{background:STATUS_MAP[est.status]?.color}}>{STATUS_MAP[est.status]?.label}</span></td>
                <td>
                  <select
                    value={est.created_by || ''}
                    onChange={(e) => updateCreator(est.id, e.target.value)}
                    className="bg-[#111] text-xs border border-[#333] text-gray-300 rounded px-1 py-0.5 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[120px]"
                  >
                    <option value="">-</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </td>
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
                    <div className="flex items-center gap-2" style={{ display: 'inline-flex' }}>
                      <button className="icon-btn" title="Generate Contract" onClick={() => navigate(`/admin/contract/${est.id}`)}>
                        <FileSignature size={15}/>
                      </button>
                      {est.qbo_invoice_id ? (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold" title={`Synced to QBO: Invoice #${est.qbo_invoice_number}`}>
                          QBO #{est.qbo_invoice_number}
                        </span>
                      ) : (
                        <button 
                          className="icon-btn" 
                          style={{ color: '#10b981' }} 
                          title="Sync to QuickBooks" 
                          onClick={() => syncToQuickBooks(est.id)}
                          disabled={syncingId === est.id}
                        >
                          {syncingId === est.id ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                        </button>
                      )}
                    </div>
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
