import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Loader2, Send, CheckCircle, XCircle, FileText, Edit, BarChart2, X, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { useEstimatorStore } from '../store/useEstimatorStore';

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

export default function POSEstimates() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { profile } = useAuth();
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
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);

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

  // Gallery Modal state
  const [activeGalleryPhotos, setActiveGalleryPhotos] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    if (profile?.id) {
      fetchEstimates();
    }
  }, [profile?.id]);

  async function fetchEstimates() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('estimates')
        .select('*, contact:contacts!estimates_contact_id_fkey(first_name,last_name,phone,address,email), creator:profiles!estimates_created_by_fkey(full_name)')
        .eq('created_by', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setEstimates(data || []);
    } catch (err) {
      console.error('Error fetching salesperson estimates:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = async (id) => {
    try {
      await loadEstimate(id);
      navigate('/pos/estimator');
    } catch (err) {
      alert('Error loading estimate for editing: ' + err.message);
    }
  };

  async function resendEmail(est) {
    if (!est.contact?.email) {
      alert('The client does not have a registered email.');
      return;
    }
    setSendingEmailId(est.id);
    try {
      const response = await fetch('/api/send-estimate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimateId: est.id })
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Error resending email');
      }
      
      alert('Estimate and QuickBooks Invoice successfully resent by email.');
      fetchEstimates();
    } catch (err) {
      console.error('Error resending email:', err);
      alert(`Resend Error: ${err.message}`);
    } finally {
      setSendingEmailId(null);
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
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return `${e.contact?.first_name || ''} ${e.contact?.last_name || ''}`.toLowerCase().includes(s) || String(e.estimate_number).includes(s);
  });

  if (loading) {
    return (
      <div className="page-loading">
        <Loader2 size={32} className="spin" />
        <p>{t('actions.loading')}</p>
      </div>
    );
  }

  return (
    <div className="estimates-page p-6 lg:p-8 space-y-6">
      <div className="crm-toolbar flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="crm-toolbar-left">
          <h1 className="text-3xl font-bold tracking-tight">{t('estimates.title')}</h1>
          <span className="crm-count text-sm text-[#888]">{estimates.length} {t('common.total_count')}</span>
        </div>
        <div className="crm-toolbar-right flex items-center gap-3 w-full md:w-auto">
          <div className="crm-search flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm flex-1 md:flex-none">
            <Search size={16} className="text-gray-500" />
            <input 
              placeholder={t('actions.search') + '...'} 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-white w-full md:w-48 placeholder-gray-500"
            />
          </div>
          <button className="btn-primary" onClick={() => navigate('/pos/estimator')}>
            Create Estimate
          </button>
        </div>
      </div>

      <div className="estimate-tabs flex border-b border-[#2a2a2a] overflow-x-auto pb-1 gap-1">
        {[{ id: 'all', label: t('common.all') }, ...Object.entries(STATUS_MAP).map(([id, v]) => ({ id, label: v.label }))].map(tab => (
          <button 
            key={tab.id} 
            className={`estimate-tab px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
              filterStatus === tab.id 
                ? 'border-[#f97316] text-[#f97316]' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`} 
            onClick={() => setFilterStatus(tab.id)}
          >
            {tab.label}
            <span className="tab-count ml-1.5 px-1.5 py-0.5 text-[10px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-full text-gray-400 font-bold">
              {tab.id === 'all' ? estimates.length : estimates.filter(e => e.status === tab.id).length}
            </span>
          </button>
        ))}
      </div>

      <div className="crm-list bg-[var(--bg-card)] border border-[#2a2a2a]/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#111] border-b border-[#2a2a2a] text-[#888] font-bold text-xs uppercase">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">{t('estimates.client')}</th>
                <th className="px-6 py-4">{t('common.address')}</th>
                <th className="px-6 py-4">Photos</th>
                <th className="px-6 py-4">{t('estimates.total')}</th>
                <th className="px-6 py-4">{t('estimates.status')}</th>
                <th className="px-6 py-4">{t('estimates.date')}</th>
                <th className="px-6 py-4 text-right">{t('estimates.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]/40">
              {filtered.map(est => (
                <tr key={est.id} className="hover:bg-[#111]/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-[#f97316]">
                    <div>EST-{String(est.estimate_number).padStart(4, '0')}</div>
                    {est.qbo_invoice_number && (
                      <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                        QBO #{est.qbo_invoice_number}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold text-white">
                    {est.contact?.first_name} {est.contact?.last_name}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {est.contact?.address || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {renderPhotosCell(est)}
                  </td>
                  <td className="px-6 py-4 font-bold text-[#f0f0f0]">
                    {formatCurrency(est.grand_total)}
                  </td>
                  <td className="px-6 py-4">
                    <span 
                      className="px-2.5 py-1 rounded-full text-xs font-bold" 
                      style={{ 
                        backgroundColor: STATUS_MAP[est.status]?.color + '15',
                        color: STATUS_MAP[est.status]?.color,
                        border: `1px solid ${STATUS_MAP[est.status]?.color}25`
                      }}
                    >
                      {STATUS_MAP[est.status]?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {formatDate(est.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        className="p-1.5 text-gray-400 hover:text-white bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] rounded-lg transition-colors"
                        title="View PDF Preview" 
                        onClick={() => window.open(`/p/${est.id}`, '_blank')}
                      >
                        <FileText size={15} />
                      </button>
                      {(est.status === 'draft' || est.status === 'sent') && (
                        <>
                          <button 
                            className="p-1.5 text-gray-400 hover:text-[#f97316] bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] rounded-lg transition-colors"
                            title="Edit Estimate" 
                            onClick={() => handleEdit(est.id)}
                          >
                            <Edit size={15} />
                          </button>
                          <button 
                            className="p-1.5 text-gray-400 hover:text-blue-400 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] rounded-lg transition-colors disabled:opacity-40"
                            title="Resend Email" 
                            disabled={sendingEmailId === est.id}
                            onClick={() => resendEmail(est)}
                          >
                            {sendingEmailId === est.id ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
                          </button>
                        </>
                      )}
                      {est.status === 'approved' && (
                        <>
                          {est.qbo_invoice_id ? (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold flex items-center justify-center" title={`Synced to QBO: Invoice #${est.qbo_invoice_number}`}>
                              QBO #{est.qbo_invoice_number}
                            </span>
                          ) : (
                            <button 
                              className="p-1.5 text-emerald-400 hover:text-emerald-300 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] rounded-lg transition-colors"
                              title="Sync to QuickBooks" 
                              onClick={() => syncToQuickBooks(est.id)}
                              disabled={syncingId === est.id}
                            >
                              {syncingId === est.id ? <Loader2 size={15} className="spin" /> : <RefreshCw size={15} />}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-[#555] font-semibold">
                    {t('estimates.noEstimates')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PHOTO GALLERY LIGHTBOX MODAL */}
      {activeGalleryPhotos && (
        <div 
          className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setActiveGalleryPhotos(null)}
        >
          {/* Close button */}
          <button 
            onClick={() => setActiveGalleryPhotos(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-[#111]/80 hover:bg-[#222] p-3 rounded-full transition-all z-50 border border-white/10"
            title="Close"
          >
            <X size={20} />
          </button>
          
          <div 
            className="relative max-w-4xl w-full flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()} // Prevent close on body click
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
                    className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${idx === activePhotoIndex ? 'border-[#f97316] scale-105 shadow-lg shadow-[#f97316]/20' : 'border-transparent opacity-50 hover:opacity-100'}`}
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
