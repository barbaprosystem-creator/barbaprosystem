import React, { useRef, useState, useEffect } from 'react';
import { FileText, Download, CheckCircle, CreditCard } from 'lucide-react';

export default function PDFPreview() {
  const canvasRef = useRef(null);
  const [isSigned, setIsSigned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Random data setup
  const client = {
    name: "Sr. Juan Pérez",
    address: "123 Maple Street, Houston, TX 77002",
    date: new Date().toLocaleDateString('es-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    estimateId: "EST-8842-B"
  };

  const aiText = `Gracias por confiar en Barba Construction para la renovación de su hogar. Hemos diseñado esta propuesta considerando los más altos estándares de calidad y durabilidad que caracterizan a nuestra empresa. 

Para su propiedad, realizaremos la instalación de 20 squares de Siding de Vinilo Premium en color Charcoal, reemplazando la barrera de humedad y garantizando el aislamiento correcto. Además, instalaremos 150 pies lineales de Gutters K-Style sin costuras de 6 pulgadas para asegurar un drenaje perfecto y proteger los cimientos de su casa. 

En Barba Construction, nuestro trabajo está respaldado por nuestra Garantía de Excelencia. Puede revisar el detalle de inversión a continuación.`;

  const items = [
    { name: "Siding de Vinilo Premium (Charcoal)", qty: "20 squares", price: 8500.00 },
    { name: "Fascia y Soffit (Reparación)", qty: "50 ft", price: 1200.00 },
    { name: "Gutters Seamless K-Style 6\"", qty: "150 ft", price: 1800.00 },
  ];

  const total = items.reduce((acc, item) => acc + item.price, 0);

  // Simple signature canvas drawing logic
  useEffect(() => {
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
  }, []);

  const formatMoney = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const handleAuthorize = () => {
    if (!isSigned || isProcessing) return;
    setIsProcessing(true);
    
    // Simular guardado de firma en base de datos y redirección a Stripe
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
    }, 2000);
  };

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
            <img src="/logo-barba.png" alt="Barba Construction" className="h-20 object-contain" />
            <p className="text-xs text-gray-400 mt-4">123 Builder Lane, Houston TX<br/>(555) 123-4567<br/>info@barbaconstruction.com</p>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-light text-gray-300">ESTIMADO</h1>
            <p className="text-[#FACB00] font-bold mt-1 text-lg">{client.estimateId}</p>
            <p className="text-sm text-gray-400 mt-2">Fecha: {client.date}</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-10 flex-1 flex flex-col">
          
          {/* Client Info */}
          <div className="mb-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Preparado para:</p>
            <p className="text-xl font-bold">{client.name}</p>
            <p className="text-gray-600 text-sm">{client.address}</p>
          </div>

          {/* AI Persuasive Text */}
          <div className="mb-10 bg-gray-50 p-6 rounded-lg border border-gray-100">
            <p className="text-xs font-bold text-[#FACB00] uppercase tracking-wider mb-3 flex items-center gap-2">
              Propuesta del Proyecto generada por IA
            </p>
            <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap font-serif">
              {aiText}
            </p>
          </div>

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
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-4 px-2 font-medium">{item.name}</td>
                    <td className="py-4 px-2 text-center text-gray-600">{item.qty}</td>
                    <td className="py-4 px-2 text-right font-bold">{formatMoney(item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mt-4">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>{formatMoney(total)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Impuestos (8.25%):</span>
                  <span>{formatMoney(total * 0.0825)}</span>
                </div>
                <div className="flex justify-between text-xl font-black text-[#111] pt-2 border-t-2 border-gray-800">
                  <span>Total:</span>
                  <span>{formatMoney(total * 1.0825)}</span>
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
              <button className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors w-full">
                Solicitar Financiamiento
              </button>
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
            <h2 className="text-2xl font-black text-gray-900 mb-2">¡Propuesta Autorizada!</h2>
            <p className="text-gray-600 mb-6">Su firma ha sido guardada de forma segura. En un escenario real, sería redirigido a la pasarela de pagos (Stripe) ahora mismo.</p>
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
