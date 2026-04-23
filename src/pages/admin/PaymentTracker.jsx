import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Loader2, DollarSign, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';

const STATUS_MAP = {
  pending: { label: 'Pendiente', color: '#f59e0b', icon: Clock },
  received: { label: 'Recibido', color: '#10b981', icon: CheckCircle },
  overdue: { label: 'Vencido', color: '#ef4444', icon: AlertTriangle },
};

const TYPE_MAP = {
  deposit: 'Depósito',
  partial: 'Parcial',
  final: 'Final',
};

export default function PaymentTracker() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { fetchPayments(); }, []);

  async function fetchPayments() {
    setLoading(true);
    const { data } = await supabase
      .from('payments')
      .select('*, project:projects!payments_project_id_fkey(title, project_number), contact:contacts!payments_contact_id_fkey(first_name, last_name)')
      .order('created_at', { ascending: false });
    setPayments(data || []);
    setLoading(false);
  }

  async function markReceived(id) {
    await supabase.from('payments').update({ status: 'received', paid_at: new Date().toISOString() }).eq('id', id);
    fetchPayments();
  }

  const filtered = payments.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return p.project?.title?.toLowerCase().includes(s) ||
      `${p.contact?.first_name || ''} ${p.contact?.last_name || ''}`.toLowerCase().includes(s);
  });

  const totals = {
    total: payments.reduce((s, p) => s + (p.amount || 0), 0),
    received: payments.filter(p => p.status === 'received').reduce((s, p) => s + (p.amount || 0), 0),
    pending: payments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0),
    overdue: payments.filter(p => p.status === 'overdue').reduce((s, p) => s + (p.amount || 0), 0),
  };

  if (loading) return <div className="page-loading"><Loader2 size={32} className="spin" /><p>Cargando pagos...</p></div>;

  return (
    <div className="payments-page">
      <div className="crm-toolbar">
        <div className="crm-toolbar-left">
          <h1>Pagos</h1>
        </div>
        <div className="crm-toolbar-right">
          <div className="crm-search">
            <Search size={16} />
            <input placeholder="Buscar pago..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="payment-summary">
        <div className="payment-summary-card">
          <DollarSign size={20} />
          <div>
            <p className="summary-label">Total Facturado</p>
            <p className="summary-value">{formatCurrency(totals.total)}</p>
          </div>
        </div>
        <div className="payment-summary-card success">
          <CheckCircle size={20} />
          <div>
            <p className="summary-label">Recibido</p>
            <p className="summary-value">{formatCurrency(totals.received)}</p>
          </div>
        </div>
        <div className="payment-summary-card warning">
          <Clock size={20} />
          <div>
            <p className="summary-label">Pendiente</p>
            <p className="summary-value">{formatCurrency(totals.pending)}</p>
          </div>
        </div>
        <div className="payment-summary-card danger">
          <AlertTriangle size={20} />
          <div>
            <p className="summary-label">Vencido</p>
            <p className="summary-value">{formatCurrency(totals.overdue)}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="crm-list">
        <table>
          <thead>
            <tr>
              <th>Proyecto</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Vencimiento</th>
              <th>Pagado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(pay => (
              <tr key={pay.id} className="crm-list-row">
                <td>PRJ-{String(pay.project?.project_number || 0).padStart(4, '0')}</td>
                <td className="lead-name-cell">{pay.contact?.first_name} {pay.contact?.last_name}</td>
                <td>{TYPE_MAP[pay.payment_type] || pay.payment_type}</td>
                <td className="est-total">{formatCurrency(pay.amount)}</td>
                <td>
                  <span className="stage-badge" style={{ background: STATUS_MAP[pay.status]?.color }}>
                    {STATUS_MAP[pay.status]?.label}
                  </span>
                </td>
                <td>{pay.due_date ? formatDate(pay.due_date) : '—'}</td>
                <td>{pay.paid_at ? formatDate(pay.paid_at) : '—'}</td>
                <td>
                  {pay.status === 'pending' && (
                    <button className="icon-btn success" title="Marcar Recibido" onClick={() => markReceived(pay.id)}>
                      <CheckCircle size={15} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="crm-empty-row">No hay pagos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
