import { useState, useEffect } from 'react';
import { Trash2, Send, Save, FileText } from 'lucide-react';
import { useEstimatorStore } from '../../store/useEstimatorStore';
import { supabase } from '../../lib/supabase';

const SERVICE_COLORS = {
  roofing: 'text-amber-400',
  siding:  'text-emerald-400',
  windows: 'text-purple-400',
  gutters: 'text-blue-400',
};

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function ReceiptSidebar() {
  const { receiptItems, removeItem, taxRate, setTaxRate, getSubtotal, getTax, getGrandTotal } = useEstimatorStore();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('contacts').select('id, full_name').order('full_name')
      .then(({ data }) => setClients(data || []));
  }, []);

  const handleSave = async (status) => {
    if (!selectedClient || receiptItems.length === 0) return;
    setSaving(true);
    const subtotal = getSubtotal();
    const tax     = getTax();
    const total   = getGrandTotal();

    const { data: estimate, error } = await supabase
      .from('estimates')
      .insert({ contact_id: selectedClient, status, subtotal, tax_amount: tax, total, tax_rate: taxRate })
      .select()
      .single();

    if (!error && estimate) {
      await supabase.from('estimate_items').insert(
        receiptItems.map(item => ({
          estimate_id: estimate.id,
          description: item.name,
          details: item.details,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.total,
          service_type: item.service,
        }))
      );
    }
    setSaving(false);
    if (!error) alert('Estimado guardado correctamente.');
  };

  const subtotal = getSubtotal();
  const tax      = getTax();
  const total    = getGrandTotal();

  return (
    <div className="admin-card flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-[#2a2a2a]/50 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <FileText size={18} className="text-orange-400" />
        </div>
        <div>
          <h2 className="font-bold text-[#f0f0f0] leading-tight">Resumen del Estimado</h2>
          <p className="text-xs text-[#888888]">{receiptItems.length} item(s)</p>
        </div>
      </div>

      {/* Client */}
      <div className="p-5 border-b border-[#2a2a2a]/50 space-y-1.5">
        <p className="text-xs font-bold text-[#888888] uppercase tracking-widest">Cliente</p>
        <select
          value={selectedClient}
          onChange={e => setSelectedClient(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-[#0d0d0d] border border-[#2a2a2a]/60 text-[#f0f0f0] text-sm focus:outline-none focus:border-[#F5C518]/60 transition-colors"
        >
          <option value="">âEUR" Seleccionar cliente âEUR"</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
        </select>
      </div>

      {/* Items */}
      <div className="flex-1 p-5 space-y-3 min-h-0 overflow-y-auto max-h-80">
        {receiptItems.length === 0 ? (
          <div className="text-center py-10 text-[#555555]">
            <FileText size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Agrega servicios al estimado</p>
          </div>
        ) : (
          receiptItems.map(item => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-[#0d0d0d]/60 border border-[#2a2a2a]/40">
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-tight ${SERVICE_COLORS[item.service] || 'text-[#e0e0e0]'}`}>{item.name}</p>
                <p className="text-xs text-[#555555] mt-0.5">{item.details}</p>
              </div>
              <div className="flex items-center gap-2 flex-none">
                <span className="text-sm font-bold text-[#f0f0f0]">{fmt(item.total)}</span>
                <button onClick={() => removeItem(item.id)} className="p-1 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-[#555555] transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      <div className="p-5 border-t border-[#2a2a2a]/50 space-y-3">
        <div className="flex justify-between text-sm text-[#888888]">
          <span>Subtotal</span>
          <span>{fmt(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-[#888888]">
          <div className="flex items-center gap-2">
            <span>Impuesto</span>
            <input
              type="number" min="0" max="30" step="0.5"
              value={taxRate}
              onChange={e => setTaxRate(e.target.value)}
              className="w-14 px-2 py-1 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a]/60 text-[#f0f0f0] text-xs text-center focus:outline-none focus:border-[#F5C518]/60"
            />
            <span>%</span>
          </div>
          <span>{fmt(tax)}</span>
        </div>
        <div className="flex justify-between items-baseline pt-2 border-t border-[#2a2a2a]/50">
          <span className="text-base font-bold text-[#f0f0f0]">Total</span>
          <span className="text-2xl font-black text-orange-400">{fmt(total)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-5 pt-0 grid grid-cols-2 gap-3">
        <button
          onClick={() => handleSave('draft')}
          disabled={saving || !selectedClient || receiptItems.length === 0}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a]/50 text-[#c0c0c0] text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Save size={16} />
          Borrador
        </button>
        <button
          onClick={() => handleSave('sent')}
          disabled={saving || !selectedClient || receiptItems.length === 0}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
        >
          <Send size={16} />
          Enviar
        </button>
      </div>
    </div>
  );
}

