import { useState, useEffect } from 'react';
import { Trash2, Send, Save, FileText, Sparkles } from 'lucide-react';
import { useEstimatorStore } from '../../store/useEstimatorStore';
import { supabase } from '../../lib/supabase';
import AiProposalModal from './AiProposalModal';

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
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const getClientName = () => {
    if (!selectedClient) return '';
    const c = clients.find(cl => cl.id === selectedClient);
    return c ? `${c.first_name} ${c.last_name}` : '';
  };

  useEffect(() => {
    supabase.from('contacts').select('id, first_name, last_name, email').order('first_name')
      .then(({ data }) => setClients(data || []));
  }, []);

  const handleSave = async (status, aiProposalText = null) => {
    if (!selectedClient || receiptItems.length === 0) return;
    setSaving(true);
    const subtotal = getSubtotal();
    const tax     = getTax();
    const total   = getGrandTotal();

    // En el futuro guardaremos aiProposalText en un campo 'notes' o 'ai_proposal' de la DB
    const { data: estimate, error } = await supabase
      .from('estimates')
      .insert({ contact_id: selectedClient, status, subtotal, tax_amount: tax, total, tax_rate: taxRate, notes: aiProposalText })
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

      // Si el estado es 'sent', enviar el correo al cliente
      if (status === 'sent') {
        const client = clients.find(c => c.id === selectedClient);
        if (client && client.email) {
          try {
            const response = await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: client.email,
                subject: 'Tu Propuesta de Proyecto - Barba Construction',
                html: `
                  <h2>Hola ${client.first_name},</h2>
                  <p>Adjunto encontrarás la propuesta de tu proyecto:</p>
                  <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; font-family: serif;">
                    ${aiProposalText ? aiProposalText.replace(/\n/g, '<br/>') : 'Propuesta de servicios.'}
                  </div>
                  <h3>Resumen de Inversión</h3>
                  <ul>
                    ${receiptItems.map(item => `<li>${item.name} (${item.quantity}) - ${fmt(item.total)}</li>`).join('')}
                  </ul>
                  <p><strong>Subtotal:</strong> ${fmt(subtotal)}</p>
                  <p><strong>Total Estimado:</strong> ${fmt(total)}</p>
                  <p>Gracias por confiar en Barba Construction.</p>
                `
              })
            });

            const result = await response.json();
            if (!response.ok) {
              throw new Error(result.error || 'Error desconocido al enviar el correo');
            }

            alert('Estimado guardado y enviado por correo.');
          } catch (err) {
            console.error('Error al enviar el correo:', err);
            alert(`Error de Resend: ${err.message}\n\nNota: Si estás en modo prueba de Resend, solo puedes enviar correos a tu propia dirección verificada.`);
          }
        } else {
          alert('Estimado guardado, pero el cliente no tiene un correo electrónico registrado.');
        }
      } else {
        alert('Estimado guardado como borrador.');
      }
    } else {
      console.error(error);
      alert('Error al guardar el estimado.');
    }
    setSaving(false);
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
          <option value="">-- Seleccionar cliente --</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
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
      <div className="p-5 pt-0 flex flex-col gap-3">
        <button
          onClick={() => setIsAiModalOpen(true)}
          disabled={saving || !selectedClient || receiptItems.length === 0}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-purple-500/30 text-purple-300 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(168,85,247,0.15)]"
        >
          <Sparkles size={16} />
          ✨ Generar Propuesta IA
        </button>
        
        <div className="grid grid-cols-2 gap-3">
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
            Solo Enviar
          </button>
        </div>
      </div>

      <AiProposalModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)}
        items={receiptItems}
        total={getGrandTotal()}
        clientName={getClientName()}
        onSaveAndSend={async (aiText) => {
          setIsAiModalOpen(false);
          await handleSave('sent', aiText);
        }}
      />
    </div>
  );
}

