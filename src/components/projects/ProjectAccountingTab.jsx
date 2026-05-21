import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, Upload, Receipt, Plus, Search, Loader2, AlertCircle, FileText, CheckCircle2, User, HardHat, Camera } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { extractReceiptData } from '../../lib/ai';

export default function ProjectAccountingTab({ projectId }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({ type: 'material', amount: '', vendor: '', date: new Date().toISOString().split('T')[0], description: '' });
  const fileInputRef = useRef(null);

  useEffect(() => { fetchExpenses(); }, [projectId]);

  async function fetchExpenses() {
    setLoading(true);
    if (projectId === 'mock-proj-1' || projectId === 'mock-proj-2') {
      setExpenses([
        { id: 'exp-1', type: 'material', amount: 2500, vendor: 'Home Depot', date: '2026-05-01', description: 'Madera y clavos' },
        { id: 'exp-2', type: 'labor', amount: 1200, vendor: 'Carlos Ramírez (Brigada)', date: '2026-05-05', description: 'Pago semanal avance de techo' },
        { id: 'exp-3', type: 'material', amount: 850, vendor: 'ABC Roofing Supply', date: '2026-05-06', description: 'Shingles' },
      ]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from('project_expenses').select('*').eq('project_id', projectId).order('date', { ascending: false });
    
    if (error) {
      // Si la tabla no existe aún, mostramos mock data
      console.warn('Tabla project_expenses posiblemente no existe. Mostrando datos de prueba.');
      setExpenses([
        { id: 'exp-1', type: 'material', amount: 2500, vendor: 'Home Depot', date: '2026-05-01', description: 'Materiales iniciales' },
        { id: 'exp-2', type: 'labor', amount: 1200, vendor: 'Brigada Siding', date: '2026-05-05', description: 'Pago primer avance' },
      ]);
    } else {
      setExpenses(data || []);
    }
    setLoading(false);
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAiLoading(true);
    try {
      // Comprimir la imagen para evitar error 413 Payload Too Large
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Extraer base64 comprimido a JPEG calidad 80%
          const base64String = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
          
          try {
            // Llamar a IA
            const extracted = await extractReceiptData(base64String, 'image/jpeg');
            if (extracted) {
              setForm(prev => ({
                ...prev,
                amount: extracted.total || prev.amount,
                vendor: extracted.vendor || prev.vendor,
                date: extracted.date || prev.date,
                description: extracted.items?.join(', ') || prev.description
              }));
              alert('¡Datos extraídos con éxito de la imagen!');
            }
          } catch (err) {
            console.error(err);
            alert('Error al procesar los datos de la IA.');
          } finally {
            setAiLoading(false);
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert('Error al leer la imagen.');
      setAiLoading(false);
    }
  };

  const submitExpense = async (e) => {
    e.preventDefault();
    if (projectId.startsWith('mock-')) {
      setExpenses([{ id: `exp-${Date.now()}`, ...form, amount: Number(form.amount) }, ...expenses]);
      setShowModal(false);
      return;
    }

    const payload = { project_id: projectId, ...form, amount: Number(form.amount) };
    const { error } = await supabase.from('project_expenses').insert(payload);
    
    if (error) {
      alert('Error guardando gasto. Asegúrate de haber creado la tabla project_expenses en Supabase.');
    } else {
      fetchExpenses();
      setShowModal(false);
      setForm({ type: 'material', amount: '', vendor: '', date: new Date().toISOString().split('T')[0], description: '' });
    }
  };

  const totalMaterials = expenses.filter(e => e.type === 'material').reduce((acc, e) => acc + Number(e.amount), 0);
  const totalLabor = expenses.filter(e => e.type === 'labor').reduce((acc, e) => acc + Number(e.amount), 0);
  const totalOther = expenses.filter(e => e.type === 'other').reduce((acc, e) => acc + Number(e.amount), 0);
  const grandTotal = totalMaterials + totalLabor + totalOther;

  if (loading) return <div className="p-8 text-center text-gray-500 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111] p-5 rounded-xl border border-[#222]">
          <div className="flex items-center gap-3 mb-2 text-gray-400">
            <Receipt size={18} /> <span className="text-sm font-bold uppercase">Materiales</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalMaterials)}</p>
        </div>
        <div className="bg-[#111] p-5 rounded-xl border border-[#222]">
          <div className="flex items-center gap-3 mb-2 text-gray-400">
            <HardHat size={18} /> <span className="text-sm font-bold uppercase">Labor / Brigadas</span>
          </div>
          <p className="text-2xl font-bold text-[#FACB00]">{formatCurrency(totalLabor)}</p>
        </div>
        <div className="bg-[#111] p-5 rounded-xl border border-[#222]">
          <div className="flex items-center gap-3 mb-2 text-gray-400">
            <AlertCircle size={18} /> <span className="text-sm font-bold uppercase">Otros Gastos</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalOther)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-900/20 to-red-600/10 p-5 rounded-xl border border-red-500/20">
          <div className="flex items-center gap-3 mb-2 text-red-400">
            <DollarSign size={18} /> <span className="text-sm font-bold uppercase">Gasto Total</span>
          </div>
          <p className="text-3xl font-black text-red-500">{formatCurrency(grandTotal)}</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">Registro de Gastos</h3>
        <button onClick={() => setShowModal(true)} className="bg-[#FACB00] hover:bg-[#e0b600] text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2">
          <Plus size={18} /> Nuevo Gasto
        </button>
      </div>

      {/* Lista de Gastos */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#1a1a1a] text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Proveedor / Trabajador</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222]">
            {expenses.map(exp => (
              <tr key={exp.id} className="hover:bg-[#1a1a1a] transition-colors">
                <td className="px-4 py-3 text-gray-300">{formatDate(exp.date)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    exp.type === 'material' ? 'bg-blue-500/20 text-blue-400' :
                    exp.type === 'labor' ? 'bg-[#FACB00]/20 text-[#FACB00]' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {exp.type}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-white">{exp.vendor}</td>
                <td className="px-4 py-3 text-gray-400 max-w-[200px] truncate" title={exp.description}>{exp.description}</td>
                <td className="px-4 py-3 text-right font-bold text-white">{formatCurrency(exp.amount)}</td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                  <FileText size={32} className="mx-auto mb-2 opacity-50" />
                  No hay gastos registrados para este proyecto.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Nuevo Gasto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111] border border-[#222] rounded-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-[#222]">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><DollarSign className="text-[#FACB00]"/> Registrar Gasto</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              {/* Sección AI */}
              <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2 mb-2">
                  <Camera size={16} /> Escanear Recibo / Factura con IA
                </h4>
                <p className="text-xs text-blue-300 mb-3 opacity-80">
                  Sube una foto del recibo de Home Depot o la factura y nuestra IA extraerá el total, fecha y proveedor automáticamente.
                </p>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={aiLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                  {aiLoading ? 'Analizando imagen...' : 'Subir Foto de Recibo'}
                </button>
              </div>

              <form id="expense-form" onSubmit={submitExpense} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tipo de Gasto</label>
                    <select 
                      value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FACB00]"
                    >
                      <option value="material">Materiales / Insumos</option>
                      <option value="labor">Pago a Brigada / Labor</option>
                      <option value="other">Otros (Permisos, etc)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Monto Total ($)</label>
                    <input 
                      required type="number" step="0.01" min="0"
                      value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FACB00]"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                    {form.type === 'labor' ? 'Nombre del Trabajador / Brigada' : 'Proveedor (Ej. Home Depot)'}
                  </label>
                  <input 
                    required type="text"
                    value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FACB00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Fecha</label>
                  <input 
                    required type="date"
                    value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FACB00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descripción / Notas</label>
                  <textarea 
                    value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FACB00] min-h-[80px]"
                    placeholder="Detalles de la compra o pago..."
                  />
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-[#222] flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg bg-[#222] hover:bg-[#333] text-white font-bold transition-colors">Cancelar</button>
              <button form="expense-form" type="submit" className="flex-1 py-2 rounded-lg bg-[#FACB00] hover:bg-[#e0b600] text-black font-bold transition-colors">Guardar Gasto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
