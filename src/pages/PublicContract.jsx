import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';
import { FileSignature, Eraser, Loader, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function PublicContract() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [items, setItems] = useState([]);
  const [contact, setContact] = useState(null);
  
  // Signature
  const canvasRef = useRef(null);
  const [signature, setSignature] = useState(null);

  useEffect(() => {
    async function fetchContract() {
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
        
        // Si ya está firmado, pre-cargar la firma
        if (est.contract_customer_sig) {
          setSignature(est.contract_customer_sig);
        }

      } catch (err) {
        console.error("Error cargando contrato:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchContract();
  }, [id]);

  useEffect(() => {
    if (loading || !canvasRef.current || signature) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Fondo blanco
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
      setSignature(canvas.toDataURL('image/jpeg', 0.8));
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
  }, [loading, signature]);

  const clearSignature = () => {
    setSignature(null);
  };

  const handleSign = async () => {
    if (!signature) {
      alert("Por favor firma en el cuadro antes de aceptar.");
      return;
    }

    setSigning(true);
    try {
      const { error } = await supabase
        .from('estimates')
        .update({
          contract_customer_sig: signature,
          contract_signed_at: new Date().toISOString(),
          status: 'approved'
        })
        .eq('id', id);

      if (error) throw error;
      
      // Actualizar estado local (para UI)
      setEstimate(prev => ({ ...prev, contract_customer_sig: signature, status: 'approved' }));
      
      // GENERAR PDF Y PROYECTO
      try {
        let { data: projects } = await supabase
          .from('projects')
          .select('id')
          .eq('estimate_id', id)
          .limit(1);
          
        let projectId = projects?.[0]?.id;

        if (!projectId) {
          const { data: newProject, error: projErr } = await supabase.from('projects').insert([{
            title: `Proyecto de ${estimate.contact?.first_name || 'Cliente'} - EST-${String(estimate.estimate_number).padStart(4,'0')}`,
            contact_id: estimate.contact_id,
            estimate_id: id,
            status: 'pending',
            sold_price: estimate.total || estimate.grand_total,
            address: estimate.contact?.address || 'Por confirmar'
          }]).select('id').single();
          
          if (!projErr && newProject) {
            projectId = newProject.id;
          } else {
            console.error("Error creating project:", projErr);
          }
        }

        if (projectId) {
          // Ocultar botones antes de la captura
          const element = document.getElementById('contract-document');
          if (element) {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
              heightLeft -= pageHeight;
            }
            
            const pdfBlob = pdf.output('blob');
            const fileName = `Contrato-EST-${String(estimate.estimate_number).padStart(4,'0')}.pdf`;
            const filePath = `${projectId}/${Date.now()}-${fileName}`;
            
            const { error: uploadError } = await supabase.storage
              .from('project-documents')
              .upload(filePath, pdfBlob, { contentType: 'application/pdf' });
              
            if (!uploadError) {
              await supabase.from('project_documents').insert({
                project_id: projectId,
                name: fileName,
                storage_path: filePath,
                file_type: 'pdf',
                created_at: new Date().toISOString()
              });
            } else {
               console.error("Error uploading PDF:", uploadError);
            }
          }
        }
      } catch (pdfErr) {
        console.error("Error generating/uploading PDF: ", pdfErr);
      }

      alert("¡Contrato firmado y aceptado exitosamente!");
      
    } catch (err) {
      console.error(err);
      alert("Error al guardar la firma: " + (err.message || err.details || JSON.stringify(err)));
    } finally {
      setSigning(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-800"><Loader className="animate-spin inline-block mr-2"/> Cargando contrato...</div>;
  if (!estimate) return <div className="p-8 text-center text-red-500">Contrato no encontrado.</div>;

  const total = estimate.total || estimate.grand_total || 0;
  const paymentTerms = estimate.contract_payment_terms || '';
  const contractDate = estimate.contract_date || estimate.created_at.split('T')[0];
  const cancellationDate = estimate.contract_cancellation_date || 'the third business day following the date of the contract execution';
  const isSigned = !!estimate.contract_customer_sig;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Options */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <img src="https://barbaprosystem.com/landing/logo.png" alt="Barba Construction" className="h-12" />
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded shadow hover:bg-gray-50">
            <Printer size={18} /> Imprimir PDF
          </button>
        </div>

        {/* Document Container to Capture */}
        <div id="contract-document" className="bg-white p-8 md:p-12 rounded-xl shadow-xl print:shadow-none print:p-0">
          <div className="text-center border-b-2 border-[#F5C518] pb-6 mb-8">
            <h1 className="text-3xl font-bold tracking-tight uppercase">Retail Construction Agreement</h1>
          </div>

          <div className="flex flex-col md:flex-row justify-between mb-10 text-sm leading-relaxed gap-6">
            <div className="w-full md:w-1/2">
              <h3 className="font-bold text-lg mb-2">Contractor:</h3>
              <p className="font-bold">Barba Construction</p>
              <p>5910 Preston Highway</p>
              <p>Louisville, KY 40219</p>
              <p>(502) 338-3720</p>
              <p>www.barbaconstruction.com</p>
            </div>
            <div className="w-full md:w-1/2 md:text-right">
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
                {paymentTerms || <span className="text-gray-400">Standard terms apply.</span>}
              </div>
              <p className="text-sm text-gray-600">Payments may be made by credit card, cash, or check.</p>
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
            <p className="font-bold mb-10 text-center">IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.</p>
            
            <div className="flex flex-col md:flex-row justify-between gap-10">
              {/* Customer Box */}
              <div className="w-full md:w-1/2">
                <div className="relative border-b-2 border-dashed border-gray-400 bg-gray-50 rounded-t-lg mb-2 flex items-center justify-center min-h-[150px]">
                  {isSigned ? (
                    <img src={estimate.contract_customer_sig} alt="Customer Signature" className="max-h-[140px] w-auto" />
                  ) : (
                    <>
                      <canvas 
                        ref={canvasRef} 
                        width={350} 
                        height={150} 
                        className="w-full cursor-crosshair touch-none"
                      />
                      <button 
                        onClick={clearSignature}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 print:hidden"
                        title="Borrar Firma"
                      >
                        <Eraser size={18} />
                      </button>
                      {!signature && <p className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none print:hidden">Firmar aquí</p>}
                    </>
                  )}
                </div>
                <p className="mt-2 text-sm font-bold uppercase">Customer Signature</p>
                <p className="mt-1 text-sm text-gray-600">Date: {isSigned ? new Date(estimate.contract_signed_at).toLocaleDateString() : contractDate}</p>
              </div>

              {/* Company Box */}
              <div className="w-full md:w-1/2">
                <div className="relative border-b-2 border-dashed border-gray-400 bg-gray-50 rounded-t-lg mb-2 flex items-center justify-center min-h-[150px]">
                  {estimate.contract_company_sig ? (
                    <img src={estimate.contract_company_sig} alt="Company Signature" className="max-h-[140px] w-auto" />
                  ) : (
                    <span className="text-gray-400 italic">No signature</span>
                  )}
                </div>
                <p className="mt-2 text-sm font-bold uppercase">Barba Construction Representative</p>
                <p className="mt-1 text-sm text-gray-600">Date: {contractDate}</p>
              </div>
            </div>
          </div>

          {!isSigned && (
            <div className="mt-10 flex justify-center print:hidden">
              <button 
                onClick={handleSign}
                disabled={signing || !signature}
                className="flex items-center gap-2 bg-[#F5C518] hover:bg-[#d4a810] text-black font-bold text-lg px-8 py-3 rounded-xl transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signing ? <Loader className="animate-spin" /> : <FileSignature />}
                Aceptar y Firmar Contrato
              </button>
            </div>
          )}

          {isSigned && (
            <div className="mt-8 text-center print:hidden">
              <div className="inline-block bg-green-100 text-green-800 px-6 py-3 rounded-lg font-bold border border-green-200">
                ✓ Este contrato ha sido firmado y aceptado el {new Date(estimate.contract_signed_at).toLocaleString()}.
              </div>
            </div>
          )}

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
    </div>
  );
}
