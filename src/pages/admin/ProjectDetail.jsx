import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, MapPin, User, Calendar, DollarSign, Camera, BarChart3, Loader2, CheckCircle2, Clock, AlertCircle, Plus, PackageSearch, FileText, X } from 'lucide-react';
import WeeklyPipelineBoard from '../../components/projects/WeeklyPipelineBoard';
import ProjectAccountingTab from '../../components/projects/ProjectAccountingTab';
import ProjectPhotosTab from '../../components/projects/ProjectPhotosTab';
import ProjectDocumentsTab from '../../components/projects/ProjectDocumentsTab';
import ProjectMaterialsTab from '../../components/projects/ProjectMaterialsTab';
import { formatCurrency, formatDate } from '../../lib/utils';

const STATUS_MAP = {
  pending:     { label: 'Pending',     color: '#6b7280' },
  scheduled:   { label: 'Scheduled',   color: '#3b82f6' },
  in_progress: { label: 'In Progress', color: '#f59e0b' },
  completed:   { label: 'Completed',   color: '#10b981' },
  on_hold:     { label: 'On Hold',     color: '#ef4444' },
};

const TABS = [
  { id: 'pipeline', label: 'Weekly Pipeline', Icon: BarChart3 },
  { id: 'materials', label: 'Materials (BOM)', Icon: PackageSearch },
  { id: 'accounting', label: 'Accounting',      Icon: DollarSign },
  { id: 'payments', label: 'Client Payments',   Icon: DollarSign },
  { id: 'photos',   label: 'Photos',            Icon: Camera },
  { id: 'documents',label: 'Documents',         Icon: FileText },
];

export default function ProjectDetail({ projectId, onBack }) {
  const { role } = useAuth();
  const [project, setProject] = useState(null);
  const [payments, setPayments] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pipeline');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ payment_type: 'partial', amount: '', due_date: new Date().toISOString().split('T')[0] });
  const [savingPayment, setSavingPayment] = useState(false);

  const canEdit = role === 'admin' || role === 'supervisor';

  useEffect(() => {
    if (projectId) fetchAll();
  }, [projectId]);

  async function fetchAll() {
    setLoading(true);

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

  async function handleAddPayment(e) {
    e.preventDefault();
    setSavingPayment(true);
    try {
      const { error } = await supabase.from('payments').insert({
        project_id: projectId,
        payment_type: paymentForm.payment_type,
        amount: Number(paymentForm.amount),
        due_date: paymentForm.due_date,
        status: 'pending'
      });
      if (error) throw error;
      setShowPaymentModal(false);
      setPaymentForm({ payment_type: 'partial', amount: '', due_date: new Date().toISOString().split('T')[0] });
      fetchAll();
    } catch(err) {
      alert("Error adding payment");
    } finally {
      setSavingPayment(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-[#555555]">
      <Loader2 size={28} className="animate-spin mr-3" />
      <span>Loading project...</span>
    </div>
  );

  if (!project) return (
    <div className="text-center py-20 text-[#555555]">Project not found.</div>
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
          <ArrowLeft size={16} /> Projects
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
              <p className="text-[11px] text-[#555555] uppercase tracking-wider">Client</p>
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
              <p className="text-[11px] text-[#555555] uppercase tracking-wider">Address</p>
              <p className="text-sm font-bold text-[#f0f0f0] truncate">{project.address}</p>
            </div>
          </div>
        )}

        <div className="bg-[#1a1a1a]/50 border border-[#2a2a2a]/40 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-none">
            <DollarSign size={18} className="text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-[#555555] uppercase tracking-wider">Collected</p>
            <p className="text-sm font-bold text-emerald-400">{formatCurrency(totalPaid)}</p>
            {totalOwed > 0 && (
              <p className="text-xs text-amber-400">{formatCurrency(totalOwed)} pending</p>
            )}
          </div>
        </div>

        <div className="bg-[#1a1a1a]/50 border border-[#2a2a2a]/40 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center flex-none">
            <Calendar size={18} className="text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-[#555555] uppercase tracking-wider">Start</p>
            <p className="text-sm font-bold text-[#f0f0f0]">
              {project.start_date ? formatDate(project.start_date) : 'Not defined'}
            </p>
            {project.target_end_date && (
              <p className="text-xs text-[#888888]">End: {formatDate(project.target_end_date)}</p>
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
                <h3 className="text-base font-bold text-[#f0f0f0]">Weekly Work Pipeline</h3>
                <p className="text-sm text-[#888888] mt-0.5">
                  Weekly calendar progress.{' '}
                  {canEdit ? 'Click a task to change status.' : ''}
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

        {/* ACCOUNTING TAB */}
        {activeTab === 'accounting' && (
          <ProjectAccountingTab projectId={projectId} />
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-[#f0f0f0]">Payment History</h3>
              {canEdit && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-xs font-bold text-white transition-colors"
                >
                  <Plus size={14} /> New Payment
                </button>
              )}
            </div>
            {payments.length === 0 ? (
              <p className="text-sm text-[#555555] text-center py-8">No payments registered for this project.</p>
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
                            {pay.payment_type === 'deposit' ? 'Deposit' :
                             pay.payment_type === 'partial' ? 'Partial Payment' : 'Final Payment'}
                          </p>
                          {pay.due_date && (
                            <p className="text-xs text-[#555555]">Due: {formatDate(pay.due_date)}</p>
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
                            <CheckCircle2 size={13} /> Received
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
          <ProjectPhotosTab projectId={projectId} />
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <ProjectDocumentsTab projectId={projectId} />
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111] border border-[#222] rounded-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-[#222]">
              <h2 className="text-xl font-bold text-white">New Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            
            <form id="payment-form" onSubmit={handleAddPayment} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Payment Type</label>
                <select 
                  value={paymentForm.payment_type} onChange={e => setPaymentForm({...paymentForm, payment_type: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#3b82f6]"
                >
                  <option value="deposit">Deposit (Down Payment)</option>
                  <option value="partial">Partial Payment / Draw</option>
                  <option value="final">Final Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Total Amount ($)</label>
                <input 
                  required type="number" step="0.01" min="0"
                  value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#3b82f6]"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Due Date</label>
                <input 
                  required type="date"
                  value={paymentForm.due_date} onChange={e => setPaymentForm({...paymentForm, due_date: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#3b82f6]"
                />
              </div>
            </form>
            
            <div className="p-5 border-t border-[#222] flex gap-3">
              <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-2 rounded-lg bg-[#222] hover:bg-[#333] text-white font-bold transition-colors">Cancel</button>
              <button form="payment-form" type="submit" disabled={savingPayment} className="flex-1 py-2 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold transition-colors disabled:opacity-50">
                {savingPayment ? 'Saving...' : 'Save Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
