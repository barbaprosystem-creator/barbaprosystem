import { useState, useEffect } from 'react';
import { Trash2, Send, Save, FileText, Sparkles } from 'lucide-react';
import { useEstimatorStore } from '../../store/useEstimatorStore';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
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
  const { profile } = useAuth();
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
    const payload = { 
      contact_id: selectedClient, 
      status, 
      subtotal, 
      grand_total: total, 
      notes: aiProposalText,
      scope_of_work: receiptItems.map(i => `${i.name}: ${i.details}`).join('\n'),
      work_type: [...new Set(receiptItems.map(i => i.service))].join(', '),
      valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      created_by: profile?.id
    };

    const { data: estimate, error } = await supabase
      .from('estimates')
      .insert(payload)
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
            const proposalLink = `https://barbaprosystem.com/p/${estimate.id}`;
            const htmlEmail = `
              <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
                <div style="background-color: #111111; padding: 30px 20px; text-align: center; border-bottom: 5px solid #F5C518;">
                  <h1 style="color: #F5C518; margin: 0; font-size: 24px; letter-spacing: 2px;">BARBA CONSTRUCTION</h1>
                  <p style="color: #888888; font-size: 12px; margin-top: 10px;">Excelencia en Roofing, Siding & Gutters</p>
                </div>
                
                <div style="padding: 40px 30px;">
                  <h2 style="color: #111111; margin-top: 0; font-size: 20px;">Hola ${client.first_name},</h2>
                  <p style="color: #444444; line-height: 1.6; font-size: 15px;">Adjunto encontrarás la propuesta detallada para tu proyecto. Queremos agradecerte por darnos la oportunidad de transformar tu hogar.</p>
                  
                  <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #F5C518; color: #333333; font-style: italic; font-size: 15px; line-height: 1.6;">
                    ${aiProposalText ? aiProposalText.replace(/\n/g, '<br/>') : 'Encuentra los detalles de los servicios a continuación.'}
                  </div>
                  
                  <h3 style="color: #111111; border-bottom: 1px solid #eeeeee; padding-bottom: 10px; margin-top: 35px;">Resumen de Inversión</h3>
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    ${receiptItems.map(item => `
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; color: #444444;">
                          <strong style="color: #111111;">${item.name}</strong><br/>
                          <span style="font-size: 13px; color: #888888;">Cantidad: ${item.quantity}</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; text-align: right; color: #111111; font-weight: bold;">
                          ${fmt(item.total)}
                        </td>
                      </tr>
                    `).join('')}
                  </table>
                  
                  <div style="text-align: right; padding-top: 10px;">
                    <p style="margin: 5px 0; color: #666666; font-size: 15px;">Subtotal: ${fmt(subtotal)}</p>
                    <p style="margin: 5px 0; color: #111111; font-size: 20px; font-weight: 900;">Total Estimado: <span style="color: #e65100;">${fmt(total)}</span></p>
                  </div>

                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${proposalLink}" style="background-color: #F5C518; color: #000000; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 197, 24, 0.2);">
                      Ver Estimado, Firmar y Autorizar
                    </a>
                    <p style="font-size: 12px; color: #888888; margin-top: 15px;">* Haz clic en el botón para ver el PDF oficial, firmarlo y aprobar el proyecto.</p>
                  </div>

                  <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;" />
                  
                  <p style="color: #444444; line-height: 1.6; font-size: 14px;">Quedo a tu entera disposición para cualquier consulta o aclaración que puedas necesitar sobre esta propuesta.</p>
                  <p style="color: #111111; line-height: 1.6; font-size: 14px; margin-top: 20px;">
                    Atentamente,<br/>
                    <strong>Miguel Sosa</strong><br/>
                    <span style="color: #666666;">Barba Construction</span>
                  </p>
                </div>
                <div style="background-color: #f5f5f5; padding: 15px; text-align: center; color: #888888; font-size: 12px;">
                  © ${new Date().getFullYear()} Barba Construction. Todos los derechos reservados.
                </div>
              </div>
            `;

            const response = await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: client.email,
                subject: `Tu Propuesta de Proyecto - Barba Construction`,
                html: htmlEmail
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

