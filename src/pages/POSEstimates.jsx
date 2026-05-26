import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Loader2, Send, CheckCircle, XCircle, FileText, Edit, BarChart2 } from 'lucide-react';
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
      alert('Error al cargar el estimado para edición: ' + err.message);
    }
  };

  async function resendEmail(est) {
    if (!est.contact?.email) {
      alert('El cliente no tiene correo registrado.');
      return;
    }
    setSendingEmailId(est.id);
    try {
      const { data: items } = await supabase.from('estimate_items').select('*').eq('estimate_id', est.id);
      const formatMoney = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
      
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: est.contact.email,
          subject: `Reenvío: Propuesta de Proyecto EST-${String(est.estimate_number).padStart(4,'0')} - Barba Construction`,
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
                  <strong>${profile?.full_name || 'Equipo de Ventas'}</strong><br/>
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
        throw new Error(result.error || 'Error al reenviar el correo');
      }
      
      // Update estimate status to sent if it was draft
      if (est.status === 'draft') {
        await supabase.from('estimates').update({ status: 'sent', updated_at: new Date().toISOString() }).eq('id', est.id);
        fetchEstimates();
      }
      alert('Estimado reenviado correctamente por correo.');
    } catch (err) {
      console.error('Error al reenviar el correo:', err);
      alert(`Error de Resend: ${err.message}`);
    } finally {
      setSendingEmailId(null);
    }
  }

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
            Crear Estimado
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
                    EST-{String(est.estimate_number).padStart(4, '0')}
                  </td>
                  <td className="px-6 py-4 font-semibold text-white">
                    {est.contact?.first_name} {est.contact?.last_name}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {est.contact?.address || '-'}
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
                        title="Ver PDF Preview" 
                        onClick={() => window.open(`/p/${est.id}`, '_blank')}
                      >
                        <FileText size={15} />
                      </button>
                      {(est.status === 'draft' || est.status === 'sent') && (
                        <>
                          <button 
                            className="p-1.5 text-gray-400 hover:text-[#f97316] bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] rounded-lg transition-colors"
                            title="Editar Estimado" 
                            onClick={() => handleEdit(est.id)}
                          >
                            <Edit size={15} />
                          </button>
                          <button 
                            className="p-1.5 text-gray-400 hover:text-blue-400 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] rounded-lg transition-colors disabled:opacity-40"
                            title="Reenviar por Correo" 
                            disabled={sendingEmailId === est.id}
                            onClick={() => resendEmail(est)}
                          >
                            {sendingEmailId === est.id ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-[#555] font-semibold">
                    {t('estimates.noEstimates')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
