import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrency, formatDate } from '../../lib/utils';
import { CreditCard, Car, Plus, ExternalLink, Copy, Eye, EyeOff, Save, X, Loader2, DollarSign, Image as ImageIcon } from 'lucide-react';

export default function BillsPage() {
  const [bills, setBills] = useState([]);
  const [autos, setAutos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showBillModal, setShowBillModal] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Forms state
  const [billForm, setBillForm] = useState({ name: '', address: '', amount: 0, payment_url: '', login_user: '', login_password: '' });
  const [autoForm, setAutoForm] = useState({ make: '', vin: '', insurance_number: '', insurance_amount: 0, insuranceFile: null });
  const [paymentForm, setPaymentForm] = useState({ target_type: 'bill', target_id: null, amount_paid: 0, paid_on: new Date().toISOString().split('T')[0] });
  
  // Photo upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const [editingAutoId, setEditingAutoId] = useState(null);

  // Hidden passwords state
  const [showPasswords, setShowPasswords] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    
    // Fetch bills
    const { data: billsData, error: billsErr } = await supabase.from('office_bills').select('*').order('created_at');
    // Fetch autos
    const { data: autosData, error: autosErr } = await supabase.from('company_autos').select('*').order('created_at');
    // Fetch payments
    const { data: paymentsData, error: payErr } = await supabase.from('bill_payments').select('*');

    if (billsErr || autosErr) {
       console.error("Error loading data. ¿Ejecutaste el SQL?", billsErr, autosErr);
    }

    // Attach total paid to each item
    const b = (billsData || []).map(bill => {
      const pays = (paymentsData || []).filter(p => p.target_type === 'bill' && p.target_id === bill.id);
      return { ...bill, total_paid: pays.reduce((s, p) => s + p.amount_paid, 0), payments: pays };
    });

    const a = (autosData || []).map(auto => {
      const pays = (paymentsData || []).filter(p => p.target_type === 'auto' && p.target_id === auto.id);
      return { ...auto, total_paid: pays.reduce((s, p) => s + p.amount_paid, 0), payments: pays };
    });

    setBills(b);
    setAutos(a);
    setLoading(false);
  }

  // ---- CRUD Handlers ----

  const handleSaveBill = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('office_bills').insert([billForm]);
    if (error) alert("Error guardando: " + error.message);
    else {
      setShowBillModal(false);
      setBillForm({ name: '', address: '', amount: 0, payment_url: '', login_user: '', login_password: '' });
      fetchData();
    }
  };

  const handleSaveAuto = async (e) => {
    e.preventDefault();
    setUploadingPhoto(true);

    const { insuranceFile, ...autoData } = autoForm;
    let finalPhotoUrl = null;

    // Insertar primero para tener un ID
    const { data: newAuto, error } = await supabase.from('company_autos').insert([autoData]).select().single();
    
    if (error) {
      alert("Error guardando auto: " + error.message);
      setUploadingPhoto(false);
      return;
    }

    // Si hay archivo, subirlo
    if (insuranceFile) {
      try {
        const fileExt = insuranceFile.name.split('.').pop();
        const fileName = `autos/seguro-${newAuto.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('project-documents').upload(fileName, insuranceFile);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('project-documents').getPublicUrl(fileName);
        finalPhotoUrl = publicUrl;

        // Actualizar el auto con la URL
        await supabase.from('company_autos').update({ insurance_photo_url: publicUrl }).eq('id', newAuto.id);
      } catch (err) {
        alert("El auto se guardó, pero hubo un error subiendo la foto: " + err.message);
      }
    }

    setUploadingPhoto(false);
    setShowAutoModal(false);
    setAutoForm({ make: '', vin: '', insurance_number: '', insurance_amount: 0, insuranceFile: null });
    fetchData();
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('bill_payments').insert([paymentForm]);
    if (error) alert("Error guardando pago: " + error.message);
    else {
      setShowPaymentModal(false);
      fetchData();
    }
  };

  // ---- Util Functions ----

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('¡Copiado al portapapeles!');
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openPaymentModal = (type, id, defaultAmount) => {
    setPaymentForm({
      target_type: type,
      target_id: id,
      amount_paid: defaultAmount || 0,
      paid_on: new Date().toISOString().split('T')[0]
    });
    setShowPaymentModal(true);
  };

  // ---- Photo Upload for Autos ----
  const triggerPhotoUpload = (autoId) => {
    setEditingAutoId(autoId);
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !editingAutoId) return;
    
    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `autos/seguro-${editingAutoId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('project-documents').upload(fileName, file);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('project-documents').getPublicUrl(fileName);
      
      await supabase.from('company_autos').update({ insurance_photo_url: publicUrl }).eq('id', editingAutoId);
      fetchData();
    } catch(err) {
      alert("Error subiendo foto: " + err.message);
    } finally {
      setUploadingPhoto(false);
      e.target.value = null;
    }
  };

  const totalBilesMes = bills.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const totalAutosMes = autos.reduce((sum, a) => sum + Number(a.insurance_amount || 0), 0);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 size={32} className="animate-spin text-gray-500" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-12">
      
      <input type="file" accept="image/*,.pdf" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />

      {/* SECCION BILES */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2"><CreditCard className="text-[#FACB00]" /> Cuentas por Pagar (Biles)</h2>
            <p className="text-gray-400">Administra los pagos fijos de la oficina, luz, internet, etc.</p>
          </div>
          <button onClick={() => setShowBillModal(true)} className="bg-[#FACB00] text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#e5bc00]">
            <Plus size={18} /> Añadir Cuenta
          </button>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#1a1a1a] text-gray-400 font-bold uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3">Monto / Mes</th>
                <th className="px-4 py-3">Enlace de Pago</th>
                <th className="px-4 py-3">Usuario / Contraseña</th>
                <th className="px-4 py-3 text-right">Acumulado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {bills.map(bill => (
                <tr key={bill.id} className="hover:bg-[#1a1a1a]/50">
                  <td className="px-4 py-3 font-bold text-white">{bill.name}</td>
                  <td className="px-4 py-3">{bill.address || '-'}</td>
                  <td className="px-4 py-3 text-[#FACB00] font-bold">{formatCurrency(bill.amount)}</td>
                  <td className="px-4 py-3">
                    {bill.payment_url ? (
                      <a href={bill.payment_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                        Ir al sitio <ExternalLink size={14} />
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      {bill.login_user && (
                        <div className="flex items-center gap-2 bg-[#222] px-2 py-1 rounded text-xs">
                          <span className="flex-1 truncate">{bill.login_user}</span>
                          <button onClick={() => copyToClipboard(bill.login_user)} className="text-gray-400 hover:text-white" title="Copiar Usuario"><Copy size={14} /></button>
                        </div>
                      )}
                      {bill.login_password && (
                        <div className="flex items-center gap-2 bg-[#222] px-2 py-1 rounded text-xs">
                          <span className="flex-1 font-mono tracking-widest">{showPasswords[bill.id] ? bill.login_password : '••••••••'}</span>
                          <button onClick={() => togglePasswordVisibility(bill.id)} className="text-gray-400 hover:text-white" title="Mostrar/Ocultar">
                            {showPasswords[bill.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button onClick={() => copyToClipboard(bill.login_password)} className="text-gray-400 hover:text-white" title="Copiar Contraseña"><Copy size={14} /></button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-400 font-bold">{formatCurrency(bill.total_paid)}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => openPaymentModal('bill', bill.id, bill.amount)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 mx-auto">
                      <DollarSign size={14} /> Pagar
                    </button>
                  </td>
                </tr>
              ))}
              {bills.length === 0 && <tr><td colSpan="7" className="text-center py-6 text-gray-500">No hay cuentas registradas.</td></tr>}
            </tbody>
            <tfoot className="bg-[#1a1a1a] border-t border-[#333]">
              <tr>
                <td colSpan="2" className="px-4 py-3 text-right font-bold text-gray-400">Total Mensual Estimado:</td>
                <td className="px-4 py-3 text-lg font-bold text-[#FACB00]">{formatCurrency(totalBilesMes)}</td>
                <td colSpan="4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* SECCION AUTOS */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Car className="text-blue-400" /> Flotilla (Autos)</h2>
            <p className="text-gray-400">Administra los seguros y pagos mensuales de los autos de la empresa.</p>
          </div>
          <button onClick={() => setShowAutoModal(true)} className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-500">
            <Plus size={18} /> Añadir Auto
          </button>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#1a1a1a] text-gray-400 font-bold uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Marca / Modelo</th>
                <th className="px-4 py-3">VIN Number</th>
                <th className="px-4 py-3">Póliza de Seguro</th>
                <th className="px-4 py-3">Seguro / Mes</th>
                <th className="px-4 py-3 text-right">Acumulado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {autos.map(auto => (
                <tr key={auto.id} className="hover:bg-[#1a1a1a]/50">
                  <td className="px-4 py-3 font-bold text-white">{auto.make}</td>
                  <td className="px-4 py-3 font-mono text-xs">{auto.vin || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span>{auto.insurance_number || '-'}</span>
                      {auto.insurance_photo_url ? (
                        <a href={auto.insurance_photo_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300" title="Ver foto de la póliza">
                          <ImageIcon size={16} />
                        </a>
                      ) : (
                        <button onClick={() => triggerPhotoUpload(auto.id)} className="text-gray-500 hover:text-gray-300" title="Subir foto de la póliza">
                          {uploadingPhoto && editingAutoId === auto.id ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-blue-400 font-bold">{formatCurrency(auto.insurance_amount)}</td>
                  <td className="px-4 py-3 text-right text-emerald-400 font-bold">{formatCurrency(auto.total_paid)}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => openPaymentModal('auto', auto.id, auto.insurance_amount)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 mx-auto">
                      <DollarSign size={14} /> Pagar
                    </button>
                  </td>
                </tr>
              ))}
              {autos.length === 0 && <tr><td colSpan="6" className="text-center py-6 text-gray-500">No hay autos registrados.</td></tr>}
            </tbody>
            <tfoot className="bg-[#1a1a1a] border-t border-[#333]">
              <tr>
                <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-400">Total Seguros al Mes:</td>
                <td className="px-4 py-3 text-lg font-bold text-blue-400">{formatCurrency(totalAutosMes)}</td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* MODALES */}

      {/* Modal Add Bill */}
      {showBillModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-[#222] rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Añadir Cuenta (Bill)</h3>
              <button onClick={() => setShowBillModal(false)}><X className="text-gray-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSaveBill} className="space-y-4">
              <div><label className="block text-xs text-gray-400 mb-1">Nombre</label><input required className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white" value={billForm.name} onChange={e => setBillForm({...billForm, name: e.target.value})} placeholder="Ej. Spectrum Internet" /></div>
              <div><label className="block text-xs text-gray-400 mb-1">Dirección</label><input className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white" value={billForm.address} onChange={e => setBillForm({...billForm, address: e.target.value})} /></div>
              <div><label className="block text-xs text-gray-400 mb-1">Monto Mensual ($)</label><input type="number" step="0.01" className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white" value={billForm.amount} onChange={e => setBillForm({...billForm, amount: e.target.value})} /></div>
              <div><label className="block text-xs text-gray-400 mb-1">Enlace de Pago</label><input type="url" className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white" value={billForm.payment_url} onChange={e => setBillForm({...billForm, payment_url: e.target.value})} /></div>
              <div><label className="block text-xs text-gray-400 mb-1">Usuario / Correo</label><input className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white" value={billForm.login_user} onChange={e => setBillForm({...billForm, login_user: e.target.value})} /></div>
              <div><label className="block text-xs text-gray-400 mb-1">Contraseña</label><input type="text" className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white" value={billForm.login_password} onChange={e => setBillForm({...billForm, login_password: e.target.value})} /></div>
              <button type="submit" className="w-full bg-[#FACB00] text-black font-bold py-2 rounded mt-2">Guardar Cuenta</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Auto */}
      {showAutoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-[#222] rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Añadir Auto</h3>
              <button onClick={() => setShowAutoModal(false)}><X className="text-gray-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSaveAuto} className="space-y-4">
              <div><label className="block text-xs text-gray-400 mb-1">Marca / Modelo</label><input required className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white" value={autoForm.make} onChange={e => setAutoForm({...autoForm, make: e.target.value})} placeholder="Ej. Ford F-150 2020" /></div>
              <div><label className="block text-xs text-gray-400 mb-1">VIN Number</label><input className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white" value={autoForm.vin} onChange={e => setAutoForm({...autoForm, vin: e.target.value})} /></div>
              <div><label className="block text-xs text-gray-400 mb-1">Número de Póliza de Seguro</label><input className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white" value={autoForm.insurance_number} onChange={e => setAutoForm({...autoForm, insurance_number: e.target.value})} /></div>
              <div><label className="block text-xs text-gray-400 mb-1">Monto Mensual de Seguro ($)</label><input type="number" step="0.01" className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white" value={autoForm.insurance_amount} onChange={e => setAutoForm({...autoForm, insurance_amount: e.target.value})} /></div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Foto de Tarjeta de Seguro (Opcional)</label>
                <input type="file" accept="image/*,.pdf" className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white text-sm" onChange={e => setAutoForm({...autoForm, insuranceFile: e.target.files[0]})} />
              </div>
              <button type="submit" disabled={uploadingPhoto} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded mt-2 disabled:opacity-50">
                {uploadingPhoto ? 'Guardando...' : 'Guardar Auto'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Payment */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-[#222] rounded-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Registrar Pago</h3>
              <button onClick={() => setShowPaymentModal(false)}><X className="text-gray-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSavePayment} className="space-y-4">
              <div><label className="block text-xs text-gray-400 mb-1">Monto Pagado ($)</label><input required type="number" step="0.01" className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white" value={paymentForm.amount_paid} onChange={e => setPaymentForm({...paymentForm, amount_paid: e.target.value})} /></div>
              <div><label className="block text-xs text-gray-400 mb-1">Fecha de Pago</label><input required type="date" className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white" value={paymentForm.paid_on} onChange={e => setPaymentForm({...paymentForm, paid_on: e.target.value})} /></div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded mt-2">Guardar Pago</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
