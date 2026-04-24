import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Loader2, DollarSign, CheckCircle, Clock, AlertTriangle, Plus, Bell, X, BellRing } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';

const STATUS_MAP = {
  pending:  { label: 'Pendiente', color: '#f59e0b', icon: Clock },
  received: { label: 'Recibido',  color: '#10b981', icon: CheckCircle },
  overdue:  { label: 'Vencido',   color: '#ef4444', icon: AlertTriangle },
};
const TYPE_MAP = { deposit: 'Deposito', partial: 'Parcial', final: 'Final' };
const METHOD_MAP = { check: 'Cheque', zelle: 'Zelle', cash: 'Efectivo', card: 'Tarjeta', financing: 'Financiamiento' };

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function AddPaymentModal({ projects, contacts, onSave, onClose }) {
  const [form, setForm] = useState({
    project_id: '', contact_id: '', amount: '',
    payment_type: 'deposit', payment_method: 'check',
    status: 'pending', due_date: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-fill contact when project changes
  const handleProjectChange = (projectId) => {
    set('project_id', projectId);
    const proj = projects.find(p => p.id === projectId);
    if (proj?.contact_id) set('contact_id', proj.contact_id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (!payload.project_id) delete payload.project_id;
      if (!payload.contact_id) delete payload.contact_id;
      if (!payload.due_date) delete payload.due_date;
      const { error } = await supabase.from('payments').insert(payload);
      if (error) throw error;
      onSave();
    } catch (err) { alert('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content crm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h2>Registrar Pago</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="crm-form">
          <div className="crm-form-grid">
            <div className="form-group full-width">
              <label>Proyecto</label>
              <select value={form.project_id} onChange={e => handleProjectChange(e.target.value)} required>
                <option value="">Ã¢EUR" Selecciona proyecto Ã¢EUR"</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    PRJ-{String(p.project_number).padStart(4,'0')} Ã¢EUR" {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Monto *</label>
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" step="0.01" required />
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <select value={form.payment_type} onChange={e => set('payment_type', e.target.value)}>
                <option value="deposit">Deposito</option>
                <option value="partial">Parcial</option>
                <option value="final">Final</option>
              </select>
            </div>
            <div className="form-group">
              <label>MÃ©todo</label>
              <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
                <option value="check">Cheque</option>
                <option value="zelle">Zelle</option>
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="financing">Financiamiento</option>
              </select>
            </div>
            <div className="form-group">
              <label>Estado</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="pending">Pendiente</option>
                <option value="received">Recibido</option>
                <option value="overdue">Vencido</option>
              </select>
            </div>
            <div className="form-group">
              <label>Fecha de Vencimiento</label>
              <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
            <div className="form-group full-width">
              <label>Notas</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Loader2 size={18} className="spin" /> : <DollarSign size={16} />}
              Registrar Pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReminderModal({ payment, onClose }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [method, setMethod] = useState('both');

  const handleSend = async () => {
    setSending(true);
    // Log the reminder in payment_reminders_log
    try {
      await supabase.from('payment_reminders_log').insert({
        payment_id: payment.id,
        reminder_type: 'manual',
        channel: method,
        sent_at: new Date().toISOString(),
        message_body: `Recordatorio de pago: ${formatCurrency(payment.amount)} vence el ${formatDate(payment.due_date)}`,
      });
      // Update reminder flags
      const updates = {};
      if (method === 'sms' || method === 'both') updates.reminder_sent_5d = true;
      await supabase.from('payments').update(updates).eq('id', payment.id);
      setSent(true);
    } catch (err) { alert('Error: ' + err.message); }
    finally { setSending(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f9731622', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BellRing size={28} color="#f97316" />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: '20px' }}>Enviar Recordatorio</h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
            {payment.contact?.first_name} {payment.contact?.last_name} Ã¢EUR" {formatCurrency(payment.amount)}
          </p>
          {payment.due_date && (
            <p style={{ color: '#f59e0b', fontSize: '13px', marginTop: '4px' }}>
              Vence: {formatDate(payment.due_date)}
            </p>
          )}
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#10b981', fontSize: '40px', marginBottom: '12px' }}>Ã¢Å...</div>
            <p style={{ color: '#10b981', fontWeight: '600' }}>Recordatorio registrado</p>
            <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
              Cuando Twilio/Resend estÃ© configurado, se enviarÃ¡ automÃ¡ticamente.
            </p>
            <button className="btn-primary" onClick={onClose} style={{ marginTop: '20px', width: '100%' }}>Cerrar</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {[
                { id: 'sms',   label: 'Ã°Å¸"Â± Solo SMS',          desc: 'Mensaje de texto via Twilio' },
                { id: 'email', label: 'Ã°Å¸"Â§ Solo Email',         desc: 'Correo via Resend' },
                { id: 'both',  label: 'Ã°Å¸"Â±Ã°Å¸"Â§ SMS + Email',      desc: 'Ambos canales (recomendado)' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setMethod(opt.id)}
                  style={{
                    padding: '14px 16px', borderRadius: '10px', textAlign: 'left',
                    border: `2px solid ${method === opt.id ? '#f97316' : '#374151'}`,
                    background: method === opt.id ? '#f9731611' : '#1e293b',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: '600', color: method === opt.id ? '#f97316' : '#e2e8f0', fontSize: '14px' }}>{opt.label}</div>
                  <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px' }}>{opt.desc}</div>
                </button>
              ))}
            </div>
            <div style={{ background: '#1e293b', borderRadius: '8px', padding: '12px', marginBottom: '20px', fontSize: '12px', color: '#9ca3af' }}>
              Ã¢Å¡Â Ã¯Â¸Â <strong style={{ color: '#f59e0b' }}>Pendiente configuracion:</strong> Twilio y Resend deben estar configurados para envio real. Por ahora se registra el intento.
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
              <button className="btn-primary" onClick={handleSend} disabled={sending} style={{ flex: 2 }}>
                {sending ? <Loader2 size={16} className="spin" /> : <Bell size={16} />}
                Enviar Recordatorio
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentTracker() {
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [reminderPay, setReminderPay] = useState(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [pRes, prRes] = await Promise.all([
      supabase.from('payments')
        .select('*, project:projects!payments_project_id_fkey(title,project_number,contact_id), contact:contacts!payments_contact_id_fkey(first_name,last_name,phone)')
        .order('due_date', { ascending: true }),
      supabase.from('projects')
        .select('id,title,project_number,contact_id')
        .in('status', ['scheduled','in_progress']),
    ]);
    setPayments(pRes.data || []);
    setProjects(prRes.data || []);
    setLoading(false);
  }

  async function markReceived(id) {
    await supabase.from('payments').update({ status: 'received', paid_at: new Date().toISOString() }).eq('id', id);
    fetchData();
  }

  const filtered = payments.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return p.project?.title?.toLowerCase().includes(s) ||
      `${p.contact?.first_name || ''} ${p.contact?.last_name || ''}`.toLowerCase().includes(s);
  });

  const totals = {
    total:    payments.reduce((s, p) => s + (p.amount || 0), 0),
    received: payments.filter(p => p.status === 'received').reduce((s, p) => s + (p.amount || 0), 0),
    pending:  payments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0),
    overdue:  payments.filter(p => p.status === 'overdue').reduce((s, p) => s + (p.amount || 0), 0),
  };

  if (loading) return <div className="page-loading"><Loader2 size={32} className="spin" /><p>Cargando pagos...</p></div>;

  return (
    <div className="payments-page">
      <div className="crm-toolbar">
        <div className="crm-toolbar-left">
          <h1>Pagos</h1>
          <span className="crm-count">{payments.length} registros</span>
        </div>
        <div className="crm-toolbar-right">
          <div className="crm-search">
            <Search size={16} />
            <input placeholder="Buscar proyecto o cliente..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={18} /><span>Registrar Pago</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="payment-summary">
        {[
          { label: 'Total Facturado', val: totals.total,    icon: DollarSign,  cls: '',        filter: 'all' },
          { label: 'Recibido',        val: totals.received, icon: CheckCircle, cls: 'success', filter: 'received' },
          { label: 'Pendiente',       val: totals.pending,  icon: Clock,       cls: 'warning', filter: 'pending' },
          { label: 'Vencido',         val: totals.overdue,  icon: AlertTriangle,cls: 'danger', filter: 'overdue' },
        ].map(card => (
          <div
            key={card.filter}
            className={`payment-summary-card ${card.cls} ${filterStatus === card.filter ? 'active-filter' : ''}`}
            onClick={() => setFilterStatus(filterStatus === card.filter ? 'all' : card.filter)}
            style={{ cursor: 'pointer' }}
          >
            <card.icon size={20} />
            <div>
              <p className="summary-label">{card.label}</p>
              <p className="summary-value">{formatCurrency(card.val)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="crm-list">
        <table>
          <thead>
            <tr>
              <th>Proyecto</th><th>Cliente</th><th>Tipo</th>
              <th>MÃ©todo</th><th>Monto</th><th>Estado</th>
              <th>Vence</th><th>Pagado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(pay => {
              const days = daysUntil(pay.due_date);
              const isDueSoon = pay.status === 'pending' && days !== null && days <= 5 && days >= 0;
              const isOverdue = pay.status === 'overdue' || (pay.status === 'pending' && days !== null && days < 0);
              return (
                <tr key={pay.id} className="crm-list-row" style={{ background: isOverdue ? '#ef444408' : isDueSoon ? '#f59e0b08' : undefined }}>
                  <td>PRJ-{String(pay.project?.project_number || 0).padStart(4, '0')}</td>
                  <td className="lead-name-cell">{pay.contact?.first_name} {pay.contact?.last_name}</td>
                  <td>{TYPE_MAP[pay.payment_type] || pay.payment_type}</td>
                  <td style={{ fontSize: '12px', color: '#9ca3af' }}>{METHOD_MAP[pay.payment_method] || pay.payment_method}</td>
                  <td className="est-total">{formatCurrency(pay.amount)}</td>
                  <td>
                    <span className="stage-badge" style={{ background: STATUS_MAP[pay.status]?.color }}>
                      {STATUS_MAP[pay.status]?.label}
                    </span>
                  </td>
                  <td>
                    {pay.due_date ? (
                      <span style={{ color: isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : '#e2e8f0', fontWeight: (isOverdue || isDueSoon) ? '700' : '400', fontSize: '13px' }}>
                        {formatDate(pay.due_date)}
                        {days !== null && pay.status === 'pending' && (
                          <span style={{ display: 'block', fontSize: '11px', color: isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : '#6b7280' }}>
                            {days < 0 ? `${Math.abs(days)}d vencido` : days === 0 ? 'Ã¡Hoy!' : `${days}d restantes`}
                          </span>
                        )}
                      </span>
                    ) : 'Ã¢EUR"'}
                  </td>
                  <td style={{ fontSize: '13px' }}>{pay.paid_at ? formatDate(pay.paid_at) : 'Ã¢EUR"'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {pay.status === 'pending' && (
                        <button className="icon-btn success" title="Marcar Recibido" onClick={() => markReceived(pay.id)}>
                          <CheckCircle size={15} />
                        </button>
                      )}
                      {(pay.status === 'pending' || pay.status === 'overdue') && (
                        <button
                          className="icon-btn"
                          title="Enviar Recordatorio"
                          onClick={() => setReminderPay(pay)}
                          style={{ color: '#f97316', borderColor: '#f9731644' }}
                        >
                          <Bell size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="crm-empty-row">No hay pagos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddPaymentModal
          projects={projects}
          contacts={[]}
          onSave={() => { setShowAdd(false); fetchData(); }}
          onClose={() => setShowAdd(false)}
        />
      )}
      {reminderPay && (
        <ReminderModal
          payment={reminderPay}
          onClose={() => { setReminderPay(null); fetchData(); }}
        />
      )}
    </div>
  );
}

