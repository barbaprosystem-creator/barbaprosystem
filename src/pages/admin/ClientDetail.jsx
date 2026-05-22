import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, User, Phone, Mail, MapPin, Calendar, 
  FolderKanban, FileText, DollarSign, ShoppingCart, Loader2 
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function ClientDetail({ clientId, onBack }) {
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selections, setSelections] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (clientId) {
      fetchClientData();
    }
  }, [clientId]);

  async function fetchClientData() {
    setLoading(true);
    try {
      // Fetch contact details
      const { data: contactData } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', clientId)
        .single();
      
      setClient(contactData);

      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('contact_id', clientId)
        .order('created_at', { ascending: false });
      setProjects(projectsData || []);

      // Fetch estimates
      const { data: estimatesData } = await supabase
        .from('estimates')
        .select('*')
        .eq('contact_id', clientId)
        .order('created_at', { ascending: false });
      setEstimates(estimatesData || []);

      // Fetch payments for all projects belonging to this client
      if (projectsData && projectsData.length > 0) {
        const projectIds = projectsData.map(p => p.id);
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*, project:projects(title)')
          .in('project_id', projectIds)
          .order('created_at', { ascending: false });
        setPayments(paymentsData || []);
      }

      // Fetch catalog selections
      const { data: selectionsData } = await supabase
        .from('catalog_selections')
        .select('*')
        .eq('contact_id', clientId)
        .order('created_at', { ascending: false });
      setSelections(selectionsData || []);

    } catch (err) {
      console.error("Error fetching client 360 data:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-[#888888]">
        <Loader2 size={40} className="animate-spin mb-4" />
        <p>Cargando expediente del cliente...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <button onClick={onBack} className="btn-secondary mb-4"><ArrowLeft size={16}/> Volver</button>
        <p>No se encontró el cliente.</p>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="bg-[#1e1f2e] border-b border-[#34384c] px-6 py-6 sticky top-0 z-20">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Volver a Clientes
        </button>
        
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl font-bold border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              {client.first_name?.[0]}{client.last_name?.[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white m-0">
                {client.first_name} {client.last_name}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-[#888888]">
                {client.phone && <span className="flex items-center gap-1"><Phone size={14}/> {client.phone}</span>}
                {client.email && <span className="flex items-center gap-1"><Mail size={14}/> {client.email}</span>}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
              {client.pipeline_status?.replace('_', ' ')}
            </span>
            <p className="text-xs text-[#666666] mt-2">
              Cliente desde {formatDate(client.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-6 pt-4 bg-[#12131c] border-b border-[#34384c] overflow-x-auto">
        <button 
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'info' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('info')}
        >
          <User size={16}/> Resumen
        </button>
        <button 
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'projects' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('projects')}
        >
          <FolderKanban size={16}/> Proyectos ({projects.length})
        </button>
        <button 
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'estimates' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('estimates')}
        >
          <FileText size={16}/> Estimados ({estimates.length})
        </button>
        <button 
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'payments' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('payments')}
        >
          <DollarSign size={16}/> Pagos ({payments.length})
        </button>
        <button 
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'catalog' ? 'border-pink-500 text-pink-400' : 'border-transparent text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('catalog')}
        >
          <ShoppingCart size={16}/> Catálogo ({selections.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6">
        
        {/* TAB: INFO */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1e1f2e] p-6 rounded-2xl border border-[#34384c]">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-[#34384c] pb-2">Información de Contacto</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dirección Principal</label>
                  <p className="text-white mt-1 flex items-start gap-2">
                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                    {client.address ? `${client.address}, ${client.city || ''} ${client.state || ''} ${client.zip || ''}` : 'No registrada'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Teléfono</label>
                  <p className="text-white mt-1">{client.phone || 'No registrado'}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Correo Electrónico</label>
                  <p className="text-white mt-1">{client.email || 'No registrado'}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1e1f2e] p-6 rounded-2xl border border-[#34384c]">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-[#34384c] pb-2">Detalles Adicionales</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fuente (Origen)</label>
                  <p className="text-white mt-1 capitalize">{client.source || 'Desconocido'}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nivel de Interés</label>
                  <p className="text-white mt-1 capitalize">{client.lead_quality || 'No definido'}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notas del Cliente</label>
                  <p className="text-gray-300 mt-1 text-sm bg-[#12131c] p-3 rounded-xl border border-[#2a2d3d] min-h-[80px]">
                    {client.notes || 'Sin notas.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            {projects.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay proyectos asociados a este cliente.</p>
            ) : (
              projects.map(p => (
                <div key={p.id} className="bg-[#1e1f2e] p-5 rounded-2xl border border-[#34384c] flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-lg text-white mb-1">{p.title}</h4>
                    <p className="text-sm text-gray-400 flex items-center gap-4">
                      <span>PRJ-{String(p.project_number).padStart(4,'0')}</span>
                      <span className="flex items-center gap-1"><Calendar size={14}/> Inicio: {p.start_date ? formatDate(p.start_date) : 'TBD'}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                      {p.status}
                    </span>
                    <p className="text-lg font-black text-white">{formatCurrency(p.sold_price || 0)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: ESTIMATES */}
        {activeTab === 'estimates' && (
          <div className="space-y-4">
            {estimates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay estimados creados para este cliente.</p>
            ) : (
              estimates.map(e => (
                <div key={e.id} className="bg-[#1e1f2e] p-5 rounded-2xl border border-[#34384c] flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-lg text-white mb-1">Estimado EST-{String(e.estimate_number).padStart(4,'0')}</h4>
                    <p className="text-sm text-gray-400 flex items-center gap-4">
                      <span>Tipo: {e.work_type || 'General'}</span>
                      <span className="flex items-center gap-1"><Calendar size={14}/> {formatDate(e.created_at)}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                      {e.status}
                    </span>
                    <p className="text-lg font-black text-white">{formatCurrency(e.grand_total || 0)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: PAYMENTS */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            {payments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay pagos registrados.</p>
            ) : (
              payments.map(pay => (
                <div key={pay.id} className="bg-[#1e1f2e] p-5 rounded-2xl border border-[#34384c] flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                      Pago de {formatCurrency(pay.amount)}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-[#12131c] text-gray-400 border-[#34384c]">{pay.payment_type}</span>
                    </h4>
                    <p className="text-sm text-gray-400">{pay.project?.title}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border ${pay.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : pay.status === 'overdue' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                      {pay.status}
                    </span>
                    <p className="text-xs text-gray-500">Vence: {pay.due_date ? formatDate(pay.due_date) : 'N/A'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: CATALOG SELECTIONS */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {selections.length === 0 ? (
              <p className="text-gray-500 text-center py-8">El cliente no ha realizado selecciones en el catálogo.</p>
            ) : (
              selections.map(sel => (
                <div key={sel.id} className="bg-[#1e1f2e] p-6 rounded-2xl border border-[#34384c]">
                  <div className="flex justify-between items-start mb-4 border-b border-[#34384c] pb-4">
                    <div>
                      <h4 className="font-bold text-white flex items-center gap-2">
                        <ShoppingCart size={18} className="text-pink-400"/>
                        Selección del {formatDate(sel.created_at)}
                      </h4>
                      {sel.notes && <p className="text-sm text-gray-400 mt-1">{sel.notes}</p>}
                    </div>
                    <span className="px-3 py-1 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full text-xs font-bold uppercase">
                      {sel.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {sel.selections?.map((item, idx) => (
                      <div key={idx} className="bg-[#12131c] p-3 rounded-xl border border-[#2a2d3d] flex gap-3 items-center">
                        <div className="w-12 h-12 rounded bg-[#1e1f2e] flex-shrink-0 overflow-hidden">
                          {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-600">No img</div>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{item.name}</p>
                          <p className="text-xs text-gray-500 truncate">{item.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
