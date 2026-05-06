import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, MapPin, User, Calendar, DollarSign, Camera, BarChart3, Loader2, CheckCircle2, Clock, AlertCircle, Plus, PackageSearch } from 'lucide-react';
import WeeklyPipelineBoard from '../../components/projects/WeeklyPipelineBoard';
import ProjectMaterialsTab from '../../components/projects/ProjectMaterialsTab';
import { formatCurrency, formatDate } from '../../lib/utils';

const STATUS_MAP = {
  pending:     { label: 'Pendiente',   color: '#6b7280' },
  scheduled:   { label: 'Agendado',    color: '#3b82f6' },
  in_progress: { label: 'En Progreso', color: '#f59e0b' },
  completed:   { label: 'Completado',  color: '#10b981' },
  on_hold:     { label: 'En Espera',   color: '#ef4444' },
};

const TABS = [
  { id: 'pipeline', label: 'Pipeline Semanal', Icon: BarChart3 },
  { id: 'materials', label: 'Materiales (BOM)', Icon: PackageSearch },
  { id: 'payments', label: 'Pagos',            Icon: DollarSign },
  { id: 'photos',   label: 'Fotos',            Icon: Camera },
];

export default function ProjectDetail({ projectId, onBack }) {
  const { role } = useAuth();
  const [project, setProject] = useState(null);
  const [payments, setPayments] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pipeline');

  const canEdit = role === 'admin' || role === 'supervisor';

  useEffect(() => {
    if (projectId) fetchAll();
  }, [projectId]);

  async function fetchAll() {
    setLoading(true);

    // MOCK FALLBACK LOGIC
    if (projectId === 'mock-proj-1' || projectId === 'mock-proj-2') {
      const isMock1 = projectId === 'mock-proj-1';
      
      setProject({
        id: projectId,
        project_number: isMock1 ? 1001 : 1002,
        title: isMock1 ? 'Residencia Familia Pérez' : 'Renovación Siding María',
        status: isMock1 ? 'in_progress' : 'scheduled',
        start_date: new Date(Date.now() - 5 * 86400000).toISOString(),
        target_end_date: new Date(Date.now() + 10 * 86400000).toISOString(),
        address: isMock1 ? '123 Main St, Springfield' : '456 Oak Ave, Springfield',
        contact: {
          first_name: isMock1 ? 'Juan' : 'María',
          last_name: isMock1 ? 'Pérez' : 'Gómez',
          phone: isMock1 ? '(555) 123-4567' : '(555) 987-6543',
          email: isMock1 ? 'juan.perez@example.com' : 'maria.g@example.com'
        },
        supervisor: {
          full_name: isMock1 ? 'Carlos Barba' : 'Ana Supervisor'
        }
      });

      setPayments([
        {
          id: `pay-1-${projectId}`,
          project_id: projectId,
          payment_type: 'deposit',
          amount: isMock1 ? 5000 : 2500,
          status: 'received',
          due_date: new Date(Date.now() - 7 * 86400000).toISOString(),
          paid_at: new Date(Date.now() - 6 * 86400000).toISOString(),
        },
        {
          id: `pay-2-${projectId}`,
          project_id: projectId,
          payment_type: isMock1 ? 'partial' : 'final',
          amount: isMock1 ? 5000 : 6000,
          status: 'pending',
          due_date: new Date(Date.now() + 5 * 86400000).toISOString(),
        },
        ...(isMock1 ? [{
          id: `pay-3-${projectId}`,
          project_id: projectId,
          payment_type: 'final',
          amount: 5000,
          status: 'pending',
          due_date: new Date(Date.now() + 15 * 86400000).toISOString(),
        }] : [])
      ]);

      setPhotos([]); // Photos would require real storage URLs to render without errors unless we use a placeholder image URL
      setLoading(false);
      return;
    }

    const [{ data: proj }, { data: pays }, { data: pics }] = await Promise.all([
      supabase.from('projects')
        .select('*, contact:contacts!projects_contact_id_fkey(first_name,last_name,phone,email), supervisor:profiles!projects_supervisor_id_fkey(full_name)')
        .eq('id', projectId)
        .single(),
      supabase.from('payments')
        .select('*')
        .eq('project_id', projectId)
        .order('due_date'),
      supabase.from('project_photos')
        .select('*')
        .eq('project_id', projectId)
        .order('taken_at', { ascending: false }),
    ]);
    setProject(proj);
    setPayments(pays || []);
    setPhotos(pics || []);
    setLoading(false);
  }

  async function markPaymentReceived(id) {
    await supabase.from('payments').update({ status: 'received', paid_at: new Date().toISOString() }).eq('id', id);
    fetchAll();
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-[#555555]">
      <Loader2 size={28} className="animate-spin mr-3" />
      <span>Cargando proyecto...</span>
    </div>
  );

  if (!project) return (
    <div className="text-center py-20 text-[#555555]">Proyecto no encontrado.</div>
  );

  const status = STATUS_MAP[project.status] || STATUS_MAP.pending;
  const totalPaid = payments.filter(p => p.status === 'received').reduce((s, p) => s + p.amount, 0);
  const totalOwed = payments.filter(p => p.status !== 'received').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-[#888888] hover:text-[#e0e0e0] hover:border-[#444444] transition-all text-sm font-medium"
        >
          <ArrowLeft size={16} /> Proyectos
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-[#555555] uppercase tracking-wider">
              PRJ-{String(project.project_number).padStart(4, '0')}
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{ background: status.color }}
            >
              {status.label}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#f0f0f0] mt-1 truncate">{project.title}</h1>
        </div>
      </div>

      {/* Info cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {project.contact && (
          <div className="bg-[#1a1a1a]/50 border border-[#2a2a2a]/40 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center flex-none">
              <User size={18} className="text-violet-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-[#555555] uppercase tracking-wider">Cliente</p>
              <p className="text-sm font-bold text-[#f0f0f0] truncate">
                {project.contact.first_name} {project.contact.last_name}
              </p>
              {project.contact.phone && (
                <p className="text-xs text-[#888888]">{project.contact.phone}</p>
              )}
            </div>
          </div>
        )}

        {project.address && (
          <div className="bg-[#1a1a1a]/50 border border-[#2a2a2a]/40 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center flex-none">
              <MapPin size={18} className="text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-[#555555] uppercase tracking-wider">Direccion</p>
              <p className="text-sm font-bold text-[#f0f0f0] truncate">{project.address}</p>
            </div>
          </div>
        )}

        <div className="bg-[#1a1a1a]/50 border border-[#2a2a2a]/40 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-none">
            <DollarSign size={18} className="text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-[#555555] uppercase tracking-wider">Cobrado</p>
            <p className="text-sm font-bold text-emerald-400">{formatCurrency(totalPaid)}</p>
            {totalOwed > 0 && (
              <p className="text-xs text-amber-400">{formatCurrency(totalOwed)} pendiente</p>
            )}
          </div>
        </div>

        <div className="bg-[#1a1a1a]/50 border border-[#2a2a2a]/40 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center flex-none">
            <Calendar size={18} className="text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-[#555555] uppercase tracking-wider">Inicio</p>
            <p className="text-sm font-bold text-[#f0f0f0]">
              {project.start_date ? formatDate(project.start_date) : 'Sin definir'}
            </p>
            {project.target_end_date && (
              <p className="text-xs text-[#888888]">Fin: {formatDate(project.target_end_date)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 border-b border-[#2a2a2a]/50 pb-0">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold border-b-2 transition-all ${
              activeTab === id
                ? 'border-violet-500 text-violet-300 bg-violet-500/10'
                : 'border-transparent text-[#555555] hover:text-[#c0c0c0] hover:bg-[#1a1a1a]/50'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-[#1a1a1a]/30 border border-[#2a2a2a]/40 rounded-2xl p-6">
        {/* PIPELINE TAB */}
        {activeTab === 'pipeline' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#f0f0f0]">Pipeline Semanal de Obra</h3>
                <p className="text-sm text-[#888888] mt-0.5">
                  Progreso por semanas del calendario.{' '}
                  {canEdit ? 'Click en una tarea para cambiar estado.' : ''}
                </p>
              </div>
            </div>
            <WeeklyPipelineBoard
              projectId={projectId}
              startDate={project.start_date}
              canEdit={canEdit}
            />
          </div>
        )}

        {/* MATERIALS TAB */}
        {activeTab === 'materials' && (
          <ProjectMaterialsTab projectId={projectId} />
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#f0f0f0]">Historial de Pagos</h3>
            {payments.length === 0 ? (
              <p className="text-sm text-[#555555] text-center py-8">No hay pagos registrados para este proyecto.</p>
            ) : (
              <div className="space-y-3">
                {payments.map(pay => {
                  const isPending = pay.status === 'pending';
                  const isOverdue = pay.status === 'overdue';
                  const isDone = pay.status === 'received';
                  return (
                    <div
                      key={pay.id}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        isDone ? 'bg-emerald-500/5 border-emerald-500/20' :
                        isOverdue ? 'bg-red-500/5 border-red-500/30' :
                        'bg-[#1a1a1a]/50 border-[#2a2a2a]/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-none ${
                          isDone ? 'bg-emerald-500/20' : isOverdue ? 'bg-red-500/20' : 'bg-amber-500/20'
                        }`}>
                          {isDone ? <CheckCircle2 size={16} className="text-emerald-400" /> :
                           isOverdue ? <AlertCircle size={16} className="text-red-400" /> :
                           <Clock size={16} className="text-amber-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#e0e0e0]">
                            {pay.payment_type === 'deposit' ? 'Deposito' :
                             pay.payment_type === 'partial' ? 'Pago Parcial' : 'Pago Final'}
                          </p>
                          {pay.due_date && (
                            <p className="text-xs text-[#555555]">Vence: {formatDate(pay.due_date)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-lg font-extrabold ${isDone ? 'text-emerald-400' : 'text-[#f0f0f0]'}`}>
                          {formatCurrency(pay.amount)}
                        </span>
                        {isPending && canEdit && (
                          <button
                            onClick={() => markPaymentReceived(pay.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors"
                          >
                            <CheckCircle2 size={13} /> Recibido
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PHOTOS TAB */}
        {activeTab === 'photos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#f0f0f0]">Fotos del Proyecto</h3>
            </div>
            {photos.length === 0 ? (
              <div className="text-center py-12 text-[#555555]">
                <Camera size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No hay fotos todavia.</p>
                <p className="text-xs text-slate-600 mt-1">El supervisor puede subir fotos desde la app.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {photos.map(photo => (
                  <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a]/40 group">
                    <img
                      src={supabase.storage.from('project-photos').getPublicUrl(photo.storage_path).data.publicUrl}
                      alt={photo.caption || 'Foto de proyecto'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-xs text-white truncate">{photo.caption}</p>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        photo.photo_type === 'before' ? 'bg-blue-500/80 text-white' :
                        photo.photo_type === 'after' ? 'bg-emerald-500/80 text-white' :
                        photo.photo_type === 'issue' ? 'bg-red-500/80 text-white' :
                        'bg-[#2a2a2a]/80 text-[#c0c0c0]'
                      }`}>
                        {photo.photo_type === 'before' ? 'Antes' :
                         photo.photo_type === 'after' ? 'Despues' :
                         photo.photo_type === 'issue' ? 'Problema' : 'Progreso'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

