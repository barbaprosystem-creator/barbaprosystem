import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';
import { ArrowLeft, Send, Printer, FileText, Loader, Eraser } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ContractBuilder() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [items, setItems] = useState([]);
  const [contact, setContact] = useState(null);
  
  // Signatures
  const companyCanvasRef = useRef(null);
  const [companySig, setCompanySig] = useState(null);
  // Editable fields
  const [paymentTerms, setPaymentTerms] = useState('');
  const [contractDate, setContractDate] = useState(new Date().toISOString().split('T')[0]);
  
  const defaultCancelDate = new Date();
  defaultCancelDate.setDate(defaultCancelDate.getDate() + 3);
  const [cancellationDate, setCancellationDate] = useState(defaultCancelDate.toISOString().split('T')[0]);
  
  const printRef = useRef(null);

  useEffect(() => {
    async function fetchEstimate() {
      try {
        const { data: est, error: estErr } = await supabase
          .from('estimates')
          .select(`*, contact:contact_id(*)`)
          .eq('id', id)
          .single();
          
        if (estErr) throw estErr;
        
        const { data: itemsData, error: itemsErr } = await supabase
          .from('estimate_items')
          .select('*')
          .eq('estimate_id', id);
          
        if (itemsErr) throw itemsErr;

        setEstimate(est);
        setContact(est.contact);
        setItems(itemsData || []);
        
        const total = est.total || est.grand_total || 0;
        if (total < 20000) {
          setPaymentTerms(`Deposit: The Customer agrees to pay a deposit of 50% (${formatCurrency(total * 0.5)}) upon signing this Agreement to secure scheduling and materials procurement.\n\nFinal Payment: The remaining balance of 50% (${formatCurrency(total * 0.5)}) will be due upon satisfactory completion of the project and approval by the Customer.`);
        } else {
          setPaymentTerms('');
        }

      } catch (err) {
        console.error("Error cargando estimado:", err);
        alert("Error cargando datos para el contrato.");
      } finally {
        setLoading(false);
      }
    }
    fetchEstimate();
  }, [id]);

  // Hook up drawing logic for a canvas
  const setupCanvas = (canvas, setSig) => {
    const ctx = canvas.getContext('2d');
    
    // Rellenar de blanco para evitar fondo negro en firmas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    let isDrawing = false;

    const startDrawing = (e) => {
      isDrawing = true;
      draw(e);
    };

    const stopDrawing = () => {
      isDrawing = false;
      ctx.beginPath();
      // Usar jpeg para reducir tamaño
      setSig(canvas.toDataURL('image/jpeg', 0.8));
    };

    const draw = (e) => {
      if (!isDrawing) return;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000';
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); }, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  };

  useEffect(() => {
    if (loading) return;
    const cleanupCompany = setupCanvas(companyCanvasRef.current, setCompanySig);
    return () => {
      if (cleanupCompany) cleanupCompany();
    };
  }, [loading]);

  const clearSignature = (canvasRef, setSig) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setSig(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSend = async () => {
    if (!contact?.email) {
      alert("El cliente no tiene un correo electrónico registrado.");
      return;
    }
    
    if (!paymentTerms.trim()) {
      alert("Por favor define los términos de pago antes de enviar el contrato.");
      return;
    }

    setSending(true);
    try {
      if (!companySig) {
        alert("Por favor firma el contrato como compañía antes de enviarlo.");
        setSending(false);
        return;
      }

      // 1. Guardar en Supabase
      const { error: updateErr } = await supabase
        .from('estimates')
        .update({
          contract_payment_terms: paymentTerms,
          contract_company_sig: companySig,
          contract_date: contractDate,
          contract_cancellation_date: cancellationDate,
          status: 'sent'
        })
        .eq('id', id);

      if (updateErr) {
        if (updateErr.message.includes('column') || updateErr.code === 'PGRST204') {
          throw new Error('Las columnas del contrato no existen en la base de datos. Debes correr el código SQL que te di para actualizar la tabla "estimates".');
        }
        throw updateErr;
      }

      // 2. Enviar email con el enlace
      const contractUrl = `https://barbaprosystem.com/contract/${id}`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111; padding: 20px;">
          <h2 style="color: #F5C518;">Contract for your Project</h2>
          <p>Hello ${contact.first_name},</p>
          <p>Your construction contract from Barba Construction is ready for your review and signature.</p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${contractUrl}" style="background-color: #F5C518; color: #111; font-weight: bold; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Review and Sign Contract</a>
          </div>
          <p>If the button doesn't work, copy and paste this link in your browser:</p>
          <p><a href="${contractUrl}">${contractUrl}</a></p>
          <p>Thank you,<br/>Barba Construction</p>
        </div>
      `;

      let bodyStr;
      try {
        bodyStr = JSON.stringify({
          to: contact.email,
          subject: `Construction Contract - ${contact.first_name} ${contact.last_name || ''}`,
          html: htmlContent
        });
      } catch (e) {
        throw new Error('Error al generar el documento. Verifica los datos.');
      }

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr
      });

      const textRes = await response.text();
      let result;
      try {
        result = JSON.parse(textRes);
      } catch (e) {
        throw new Error('El servidor devolvió una respuesta inválida. ' + textRes.substring(0, 50));
      }

      if (!response.ok) throw new Error(result.error || 'Error al enviar email');

      alert('Contrato enviado correctamente al cliente.');
      router.push('/admin/estimates');

    } catch (err) {
      console.error(err);
      alert('Error al enviar contrato: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-white"><Loader className="animate-spin inline-block mr-2"/> Cargando contrato...</div>;
  if (!estimate) return <div className="p-8 text-center text-red-500">Estimado no encontrado.</div>;

  const total = estimate.total || estimate.grand_total || 0;
  const requiresManualPayment = total >= 20000;

  return (
    <div className="p-6 max-w-5xl mx-auto pb-24 print:p-0">
      {/* Header Actions (hidden in print) */}
      <div className="flex items-center justify-between mb-6 print:hidden">
      <button onClick={() => router.back()} className="text-gray-400 hover:text-white flex items-center gap-2">
          <ArrowLeft size={20} /> Volver a Estimados
        </button>
        <div className="flex items-center gap-3">
          <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Printer size={18} /> Imprimir PDF
          </button>
          <button 
            onClick={handleSend} 
            disabled={sending}
            className="flex items-center gap-2 bg-[#F5C518] hover:bg-[#d4a810] text-black font-bold px-5 py-2 rounded-lg transition-colors"
          >
            {sending ? <Loader className="animate-spin w-5 h-5" /> : <Send size={18} />}
            Enviar al Cliente
          </button>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 mb-8 print:hidden">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <FileText className="text-[#F5C518]" /> Configuración del Contrato
        </h2>
        <p className="text-gray-400 mb-6 text-sm">El monto total es <strong>{formatCurrency(total)}</strong>. 
          {requiresManualPayment 
            ? " Al ser mayor a $20,000, debes definir los términos de pago manualmente." 
            : " Se ha aplicado automáticamente el formato de 50% anticipo / 50% al finalizar."}
        </p>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1">Fecha del Contrato</label>
              <input 
                type="date" 
                value={contractDate}
                onChange={(e) => setContractDate(e.target.value)}
                className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1">Fecha Límite de Cancelación</label>
              <input 
                type="date" 
                value={cancellationDate}
                onChange={(e) => setCancellationDate(e.target.value)}
                className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Términos de Pago (Editable)</label>
            <textarea 
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="Ej: Deposit of $X upon signing, 30% upon material delivery, remainder upon completion..."
              className="w-full h-32 bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-white focus:border-[#F5C518] outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Contract Document Preview */}
      <div 
        ref={printRef}
        className="bg-white text-black p-10 md:p-16 rounded-xl shadow-2xl print:shadow-none print:p-0"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        <div className="text-center border-b-2 border-[#F5C518] pb-6 mb-8">
          <h1 className="text-3xl font-bold tracking-tight uppercase">Retail Construction Agreement</h1>
        </div>

        <div className="flex justify-between mb-10 text-sm leading-relaxed">
          <div className="w-1/2 pr-4">
            <h3 className="font-bold text-lg mb-2">Contractor:</h3>
            <p className="font-bold">Barba Construction</p>
            <p>5910 Preston Highway</p>
            <p>Louisville, KY 40219</p>
            <p>(502) 338-3720</p>
            <p>www.barbaconstruction.com</p>
          </div>
          <div className="w-1/2 pl-4 text-right">
            <h3 className="font-bold text-lg mb-2">Customer:</h3>
            <p className="font-bold">{contact?.first_name} {contact?.last_name || ''}</p>
            <p>{contact?.address || 'Address pending'}</p>
            <p>{contact?.phone || 'Phone pending'}</p>
            <p className="mt-2"><strong>Date:</strong> {contractDate}</p>
          </div>
        </div>

        <div className="space-y-6 text-[15px] leading-relaxed">
          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-gray-200 pb-1">1. Scope of Work</h3>
            <p className="mb-2">The Contractor agrees to provide all materials and labor necessary to complete the following work:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              {items.map(item => (
                <li key={item.id}>
                  <strong>{item.description}</strong> (Qty: {item.quantity}) - {formatCurrency(item.total)}
                </li>
              ))}
            </ul>
            <p className="font-bold text-lg text-right">Total Project Cost: {formatCurrency(total)}</p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-gray-200 pb-1">2. Payment Terms</h3>
            <p className="mb-2">The total cost for the work described in this Agreement is <strong>{formatCurrency(total)}</strong>.</p>
            <div className="bg-gray-50 p-4 border-l-4 border-[#F5C518] whitespace-pre-line my-3 italic">
              {paymentTerms || <span className="text-gray-400">Términos de pago pendientes...</span>}
            </div>
            <p className="text-sm text-gray-600">Payments may be made by credit card, cash, or check. A processing fee of 2.9% applies to in-person credit card transactions, and a 3.9% processing fee applies to credit card transactions conducted over the phone.</p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-gray-200 pb-1">3. Materials and Ownership of Excess Materials</h3>
            <p>Barba Construction may purchase additional materials beyond the estimated project requirements as a precaution to avoid delays in the event that extra materials are needed during installation. Any unused or excess materials purchased for this project shall remain the sole property of Barba Construction and may be removed from the job site upon project completion. The Customer acknowledges that the purchase of additional materials is a standard practice intended to ensure timely project completion and does not entitle the Customer to ownership of unused materials.</p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-gray-200 pb-1">4. Change Orders</h3>
            <p>Any changes to the original scope of work must be documented in a written change order signed by both parties. Change orders may result in additional charges or changes to the project timeline.</p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-gray-200 pb-1">5. Responsibilities of the Parties</h3>
            <p className="font-bold mt-2">Barba Construction Responsibilities:</p>
            <ul className="list-disc pl-6 mb-2">
              <li>Perform all work in a professional and timely manner.</li>
              <li>Comply with all applicable building codes and regulations.</li>
              <li>Maintain a clean and safe worksite.</li>
            </ul>
            <p className="font-bold mt-2">Customer Responsibilities:</p>
            <ul className="list-disc pl-6">
              <li>Provide access to the property for the Contractor and its subcontractors during normal business hours.</li>
              <li>Communicate any concerns or issues promptly to Barba Construction.</li>
              <li>Ensure timely payment according to the terms of this Agreement.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-gray-200 pb-1">6. Warranties</h3>
            <p>Barba Construction provides a 2-year workmanship warranty for the work performed under this Agreement. Manufacturer warranties for materials may apply separately.</p>
          </section>

          <section className="print:break-before-page">
            <h3 className="font-bold text-lg mb-2 border-b border-gray-200 pb-1">7. Permits and Approvals</h3>
            <p>Barba Construction will obtain all necessary permits required for the scope of work. The cost of permits is included in the total project price unless otherwise specified.</p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-gray-200 pb-1">8. Termination</h3>
            <p>This Agreement may be terminated by mutual written consent or if either party fails to perform their obligations. In the event of termination, the Customer agrees to pay for all work completed up to the date of termination, including any non-refundable costs incurred by Barba Construction.</p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-gray-200 pb-1">9. Governing Law</h3>
            <p>This Agreement shall be governed by the laws of the Commonwealth of Kentucky.</p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-gray-200 pb-1">10. Entire Agreement</h3>
            <p>This Agreement constitutes the entire understanding between the parties and supersedes any prior agreements. Any amendments must be in writing and signed by both parties.</p>
          </section>
        </div>

        {/* Signatures */}
        <div className="mt-16 pt-8 border-t border-gray-300">
          <p className="font-bold mb-10">IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.</p>
          
          <div className="flex flex-col md:flex-row justify-between gap-10">
            <div className="w-full md:w-1/2">
              <div className="border-b-2 border-dashed border-gray-300 bg-gray-50 rounded-t-lg mb-2 h-[150px] flex items-center justify-center">
                <span className="text-gray-400 italic">Firma del cliente (vía enlace web)</span>
              </div>
              <p className="mt-2 text-sm font-bold uppercase">Customer Signature</p>
              <p className="mt-1 text-sm text-gray-600">Date: {contractDate}</p>
            </div>

            <div className="w-full md:w-1/2">
              <div className="relative border-b-2 border-dashed border-gray-300 bg-gray-50 rounded-t-lg mb-2">
                <canvas 
                  ref={companyCanvasRef} 
                  width={400} 
                  height={150} 
                  className="w-full cursor-crosshair touch-none"
                />
                <button 
                  onClick={() => clearSignature(companyCanvasRef, setCompanySig)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 print:hidden"
                  title="Borrar Firma"
                >
                  <Eraser size={18} />
                </button>
                {!companySig && <p className="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none print:hidden">Firmar aquí</p>}
              </div>
              <p className="mt-2 text-sm font-bold uppercase">Barba Construction Representative</p>
              <p className="mt-1 text-sm text-gray-600">Date: {contractDate}</p>
            </div>
          </div>
        </div>

        {/* Right of Rescission Notice */}
        <div className="mt-16 border-t-2 border-dashed border-gray-400 pt-8 print:break-before-page">
          <h2 className="text-xl font-bold text-center mb-6 uppercase">Right of Rescission Notice</h2>
          
          <div className="bg-gray-50 p-6 border border-gray-200 rounded text-sm mb-6">
            <p className="font-bold mb-2">Notice of Right to Cancel</p>
            <p className="mb-4">You, the consumer, have the right to cancel this contract without penalty or obligation by delivering written notice of your intent to cancel to the contractor no later than midnight of <strong>{cancellationDate}</strong>.</p>
            
            <p className="mb-4">If you cancel, any payments made by you under this contract will be returned within 10 business days of the contractor's receipt of your cancellation notice. However, if cancellation occurs after <strong>{cancellationDate}</strong>, the contractor will retain fifty percent (50%) of the deposit as a cancellation fee, and the remaining fifty percent (50%) will be refunded to you within 10 business days.</p>
            
            <p className="font-bold mb-2">How to Cancel</p>
            <p>To cancel this contract, you must notify the contractor in writing. Send your cancellation notice to the following address:</p>
            <p className="mt-2 font-bold">BARBA CONSTRUCTION</p>
            <p>5910 PRESTON HWY</p>
            <p>(502) 338-3720</p>
            <p>barbaconstruct@gmail.com</p>
          </div>
        </div>
        
      </div>
    </div>
  );
}
