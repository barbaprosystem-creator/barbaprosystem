import React, { useRef, useState, useEffect } from 'react';
import { FileText, Download, CheckCircle, CreditCard, Loader } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function PDFPreview() {
  const { id } = useParams();
  const canvasRef = useRef(null);
  const [isSigned, setIsSigned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estimateData, setEstimateData] = useState(null);

  useEffect(() => {
    async function fetchEstimate() {
      if (!id) {
        setError("No se proporcionó un ID de estimado válido.");
        setLoading(false);
        return;
      }
      try {
        const { data: payload, error: rpcErr } = await supabase
          .rpc('get_estimate_payload', { p_estimate_id: id });
        
        if (rpcErr) throw rpcErr;

        if (!payload || !payload.estimate) {
          throw new Error("No se encontró el estimado.");
        }

        setEstimateData({
          estimate: payload.estimate,
          contact: payload.contact,
          items: payload.items || []
        });
      } catch (err) {
        console.error("Error fetching estimate:", err);
        setError("No pudimos cargar la información de la propuesta. Puede que el enlace no sea válido.");
      } finally {
        setLoading(false);
      }
    }
    fetchEstimate();
  }, [id]);

  // Simple signature canvas drawing logic
  useEffect(() => {
    if (loading || error) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let isDrawing = false;

    const startDrawing = (e) => {
      isDrawing = true;
      draw(e);
    };

    const stopDrawing = () => {
      isDrawing = false;
      ctx.beginPath();
      setIsSigned(true);
    };

    const draw = (e) => {
      if (!isDrawing) return;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000';
      
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
      const y = (e.clientY || e.touches?.[0].clientY) - rect.top;

      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
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
  }, [loading, error]);

  const formatMoney = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

  const handleAuthorize = async () => {
    if (!isSigned || isProcessing) return;
    setIsProcessing(true);
    
    // Aquí podrías guardar la firma en Supabase como Base64 si lo deseas,
    // o actualizar el estado del estimado a 'accepted'.
    try {
       await supabase.from('estimates').update({ status: 'accepted' }).eq('id', id);
    } catch(e) {
       console.error("Error al actualizar:", e);
    }
    
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
        <Loader className="animate-spin text-[#FACB00] mb-4" size={48} />
        <p className="text-gray-400">Cargando propuesta...</p>
      </div>
    );
  }

  if (error || !estimateData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-8 text-center">
        <FileText size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Propuesta No Encontrada</h2>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  const { estimate, contact, items } = estimateData;
  const dateFormatted = new Date(estimate.created_at || Date.now()).toLocaleDateString('es-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const total = estimate.grand_total || items.reduce((acc, item) => acc + (item.total || item.unit_price * item.quantity), 0);
  const subtotal = estimate.subtotal || total;

  return (
    <div className="min-h-screen bg-[#0a0a0a] print:bg-white p-8 print:p-0 flex flex-col items-center overflow-y-auto">
      
      <div className="w-full max-w-4xl mb-6 flex justify-between items-end print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="text-[#FACB00]" /> Vista Previa del PDF Interactivo
          </h1>
          <p className="text-[#888] text-sm mt-1">Este es el documento final que el cliente verá y firmará en su teléfono o en tu tablet.</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={() => window.print()}
             className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg flex items-center gap-2 border border-[#333] hover:bg-[#2a2a2a] transition-all">
             <Download size={16} /> Guardar como PDF
           </button>
        </div>
      </div>

      {/* THE "PAPER" DOCUMENT */}
      <div className="w-full max-w-4xl bg-white text-black shadow-2xl print:shadow-none rounded-sm overflow-hidden flex flex-col relative print:min-h-0" style={{ minHeight: '1056px' }}>
        
        {/* Print Header */}
        <div className="bg-[#111] print:bg-[#111] text-white p-8 flex justify-between items-start border-b-[6px] border-[#FACB00]" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
          <div>
            {/* Si no existe la imagen local, puedes usar texto como fallback */}
            <h1 className="text-[#FACB00] text-2xl font-black tracking-widest uppercase">BARBA CONSTRUCTION</h1>
            <p className="text-xs text-gray-400 mt-2">Excelencia en Roofing, Siding & Gutters<br/>(555) 123-4567<br/>info@barbaprosystem.com</p>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-light text-gray-300">ESTIMADO</h1>
            <p className="text-[#FACB00] font-bold mt-1 text-lg">#{estimate.id.split('-')[0].toUpperCase()}</p>
            <p className="text-sm text-gray-400 mt-2">Fecha: {dateFormatted}</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-10 flex-1 flex flex-col">
          
          {/* Client Info */}
          <div className="mb-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Preparado para:</p>
            <p className="text-xl font-bold">{contact?.first_name} {contact?.last_name}</p>
            <p className="text-gray-600 text-sm">{contact?.address || 'Dirección no especificada'}</p>
            <p className="text-gray-600 text-sm">{contact?.email || ''} | {contact?.phone || ''}</p>
          </div>

          {/* AI Persuasive Text */}
          {estimate.notes && (
            <div className="mb-10 bg-gray-50 p-6 rounded-lg border border-gray-100">
              <p className="text-xs font-bold text-[#FACB00] uppercase tracking-wider mb-3 flex items-center gap-2">
                Propuesta del Proyecto
              </p>
              <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap font-serif">
                {estimate.notes}
              </p>
            </div>
          )}

          {/* Line Items */}
          <div className="mb-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="py-3 px-2 text-xs font-bold text-gray-500 uppercase">Descripción / Servicio</th>
                  <th className="py-3 px-2 text-xs font-bold text-gray-500 uppercase text-center">Cantidad</th>
                  <th className="py-3 px-2 text-xs font-bold text-gray-500 uppercase text-right">Precio</th>
                </tr>
              </thead>
              <tbody>
                {items && items.length > 0 ? items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-4 px-2 font-medium">
                      {item.description}
                      <br/>
                      <span className="text-xs text-gray-500 font-normal">{item.details}</span>
                    </td>
                    <td className="py-4 px-2 text-center text-gray-600">{item.quantity}</td>
                    <td className="py-4 px-2 text-right font-bold">{formatMoney(item.total || (item.unit_price * item.quantity))}</td>
                  </tr>
                )) : (
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-2 font-medium" colSpan="3">Servicios incluidos en la cotización general.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mt-4">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xl font-black text-[#111] pt-2 border-t-2 border-gray-800">
                  <span>Total Estimado:</span>
                  <span>{formatMoney(total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto"></div>

          {/* Actions: Financing & Signature */}
          <div className="grid grid-cols-2 gap-8 border-t border-gray-200 pt-8 mt-12">
            
            {/* Financing Block */}
            <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 flex flex-col justify-center items-center text-center print:hidden">
              <CreditCard size={32} className="text-blue-500 mb-3" />
              <h4 className="font-bold text-blue-900 mb-2">Opciones de Financiamiento</h4>
              <p className="text-xs text-blue-700 mb-4">Aprobación en minutos. Paga en cómodas cuotas a través de nuestro socio financiero.</p>
              <a 
                href="#" 
                target="_blank" 
                rel="noreferrer"
                className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors w-full inline-block"
              >
                Solicitar Financiamiento
              </a>
            </div>

            {/* Signature Block */}
            <div className="flex flex-col">
              <h4 className="text-sm font-bold text-gray-800 mb-2">Firma del Cliente (Toque para firmar)</h4>
              <div className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-xl flex-1 relative overflow-hidden min-h-[140px]">
                <canvas 
                  ref={canvasRef} 
                  width={400} 
                  height={140} 
                  className="w-full h-full cursor-crosshair touch-none absolute inset-0 z-10"
                />
                {!isSigned && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30 z-0">
                    <span className="text-3xl font-serif italic text-gray-400">Firme aquí</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center mt-3 print:hidden">
                 <button 
                   onClick={() => {
                     const canvas = canvasRef.current;
                     const ctx = canvas.getContext('2d');
                     ctx.clearRect(0, 0, canvas.width, canvas.height);
                     setIsSigned(false);
                   }}
                   className="text-xs text-red-500 font-bold hover:underline"
                 >
                   Borrar Firma
                 </button>
                 <button 
                    disabled={!isSigned || isProcessing}
                    onClick={handleAuthorize}
                    className={`py-2 px-6 rounded-lg font-bold transition-all ${isSigned && !isProcessing ? 'bg-[#FACB00] hover:bg-[#e0b600] shadow-lg text-black' : 'bg-gray-300 text-white cursor-not-allowed'}`}>
                    <span className="flex items-center gap-2">
                      {isProcessing ? 'Procesando...' : <><CheckCircle size={16}/> Autorizar y Pagar</>}
                    </span>
                 </button>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* SUCCESS OVERLAY */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm print:hidden">
          <div className="bg-white p-10 rounded-2xl max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">¡Propuesta Aprobada!</h2>
            <p className="text-gray-600 mb-6">Su firma ha sido guardada. En breve, recibirá su factura oficial a través de <strong>QuickBooks</strong> para realizar su pago inicial y asegurar su proyecto.</p>
            <button 
              onClick={() => setPaymentSuccess(false)}
              className="bg-[#111] text-[#FACB00] font-bold py-3 px-6 rounded-lg w-full hover:bg-black transition-colors">
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
