import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, Upload, Receipt, Plus, Search, Loader2, AlertCircle, FileText, CheckCircle2, User, HardHat, Camera, X, FileImage, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { extractReceiptData } from '../../lib/ai';

// Helper to clean total amount extracted by AI
const cleanTotal = (totalVal) => {
  if (totalVal === undefined || totalVal === null) return '';
  const str = String(totalVal).replace(/[$,\s]/g, '');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? '' : parsed.toFixed(2);
};

// Helper to normalize dates to YYYY-MM-DD
const cleanDate = (dateVal) => {
  if (!dateVal) return new Date().toISOString().split('T')[0];
  const str = String(dateVal).trim();
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  
  const mdMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mdMatch) {
    const [_, m, d, y] = mdMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const ymMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymMatch) {
    const [_, y, m, d] = ymMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch (e) {}

  return new Date().toISOString().split('T')[0];
};

export default function ProjectAccountingTab({ projectId }) {
  const [expenses, setExpenses]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiStatus, setAiStatus]     = useState('');   // progress message
  const [form, setForm]             = useState({ type: 'material', amount: '', vendor: '', date: new Date().toISOString().split('T')[0], description: '' });
  const [editingExpense, setEditingExpense] = useState(null);
  const fileInputRef                = useRef(null);

  useEffect(() => { fetchExpenses(); }, [projectId]);

  async function fetchExpenses() {
    setLoading(true);
    if (projectId === 'mock-proj-1' || projectId === 'mock-proj-2') {
      setExpenses([
        { id: 'exp-1', type: 'material', amount: 2500, vendor: 'Home Depot', date: '2026-05-01', description: 'Wood and nails' },
        { id: 'exp-2', type: 'labor', amount: 1200, vendor: 'Carlos Ramírez (Crew)', date: '2026-05-05', description: 'Weekly roof progress payment' },
        { id: 'exp-3', type: 'material', amount: 850, vendor: 'ABC Roofing Supply', date: '2026-05-06', description: 'Shingles' },
      ]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from('project_expenses').select('*').eq('project_id', projectId).order('date', { ascending: false });
    
    if (error) {
      // Si la tabla no existe aún, mostramos mock data
      console.warn('The project_expenses table might not exist. Showing mock data.');
      setExpenses([
        { id: 'exp-1', type: 'material', amount: 2500, vendor: 'Home Depot', date: '2026-05-01', description: 'Initial materials' },
        { id: 'exp-2', type: 'labor', amount: 1200, vendor: 'Siding Crew', date: '2026-05-05', description: 'First progress payment' },
      ]);
    } else {
      setExpenses(data || []);
    }
    setLoading(false);
  }

  // ── Convert any file (image or PDF) → base64 JPEG for vision API ──────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAiLoading(true);
    let fileToProcess = file;
    const isHEIC = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif';

    try {
      if (isHEIC) {
        setAiStatus('Converting HEIC to JPG...');
        const heic2any = (await import('heic2any')).default;
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8
        });
        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        fileToProcess = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: 'image/jpeg' });
      }

      const isPDF = fileToProcess.type === 'application/pdf' || fileToProcess.name.toLowerCase().endsWith('.pdf');
      setAiStatus(isPDF ? 'Converting PDF...' : 'Compressing image...');

      let base64String;

      if (isPDF) {
        // ── PDF path: use pdfjs-dist to render first page ──
        base64String = await renderPdfPageToBase64(fileToProcess);
      } else {
        // ── Image path: resize + compress to JPEG ──
        base64String = await resizeImageToBase64(fileToProcess);
      }

      setAiStatus('Analyzing with AI...');
      const extracted = await extractReceiptData(base64String, 'image/jpeg');

      if (extracted) {
        setForm(prev => ({
          ...prev,
          amount:      cleanTotal(extracted.total)   || prev.amount,
          vendor:      extracted.vendor              || prev.vendor,
          date:        cleanDate(extracted.date)      || prev.date,
          description: extracted.items?.join(', ')   || prev.description,
        }));
      }
      setAiStatus('');
    } catch (err) {
      console.error(err);
      alert('Error processing file: ' + (err.message || 'Unknown error'));
      setAiStatus('');
    } finally {
      setAiLoading(false);
      // reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Renders page 1 of a PDF file to a base64 JPEG string
  async function renderPdfPageToBase64(file) {
    const pdfjsLib = await import('pdfjs-dist');
    // Point to the bundled worker (Vite copies it to /assets/)
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();

    const arrayBuffer = await file.arrayBuffer();
    const pdf         = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page        = await pdf.getPage(1);

    // Render at 1.5x scale for good quality without huge size
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas   = document.createElement('canvas');
    canvas.width   = viewport.width;
    canvas.height  = viewport.height;

    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    // Return base64 without the data:... prefix
    return canvas.toDataURL('image/jpeg', 0.82).split(',')[1];
  }

  // Resizes an image file and returns base64 JPEG
  function resizeImageToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (event) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const MAX_WIDTH = 1200;
          let w = img.width;
          let h = img.height;
          if (w > MAX_WIDTH) { h = Math.round(h * MAX_WIDTH / w); w = MAX_WIDTH; }

          const canvas = document.createElement('canvas');
          canvas.width  = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.82).split(',')[1]);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const handleNewExpenseClick = () => {
    setForm({ type: 'material', amount: '', vendor: '', date: new Date().toISOString().split('T')[0], description: '' });
    setEditingExpense(null);
    setShowModal(true);
  };

  const handleEditExpenseClick = (exp) => {
    setEditingExpense(exp);
    setForm({
      type: exp.type,
      amount: String(exp.amount),
      vendor: exp.vendor,
      date: exp.date,
      description: exp.description || ''
    });
    setShowModal(true);
  };

  const handleDeleteExpense = async (exp) => {
    if (!confirm(`Are you sure you want to delete this expense of ${formatCurrency(exp.amount)} from ${exp.vendor}?`)) return;
    
    const isMock = projectId.startsWith('mock-') || String(exp.id).startsWith('exp-');
    if (isMock) {
      setExpenses(expenses.filter(e => e.id !== exp.id));
      return;
    }

    const { error } = await supabase.from('project_expenses').delete().eq('id', exp.id);
    if (error) {
      alert('Error deleting expense: ' + error.message);
    } else {
      fetchExpenses();
    }
  };

  const submitExpense = async (e) => {
    e.preventDefault();
    const isMock = projectId.startsWith('mock-') || (editingExpense && String(editingExpense.id).startsWith('exp-'));

    if (isMock) {
      if (editingExpense) {
        setExpenses(expenses.map(e => e.id === editingExpense.id ? { ...e, ...form, amount: Number(form.amount) } : e));
      } else {
        setExpenses([{ id: `exp-${Date.now()}`, ...form, amount: Number(form.amount) }, ...expenses]);
      }
      setShowModal(false);
      setEditingExpense(null);
      return;
    }

    const payload = { project_id: projectId, ...form, amount: Number(form.amount) };
    
    if (editingExpense) {
      const { error } = await supabase.from('project_expenses').update({
        type: form.type,
        amount: Number(form.amount),
        vendor: form.vendor,
        date: form.date,
        description: form.description
      }).eq('id', editingExpense.id);

      if (error) {
        alert('Error updating expense: ' + error.message);
      } else {
        fetchExpenses();
        setShowModal(false);
        setEditingExpense(null);
        setForm({ type: 'material', amount: '', vendor: '', date: new Date().toISOString().split('T')[0], description: '' });
      }
    } else {
      const { error } = await supabase.from('project_expenses').insert(payload);
      if (error) {
        alert('Error saving expense. Make sure you have created the project_expenses table in Supabase.');
      } else {
        fetchExpenses();
        setShowModal(false);
        setForm({ type: 'material', amount: '', vendor: '', date: new Date().toISOString().split('T')[0], description: '' });
      }
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
            <Receipt size={18} /> <span className="text-sm font-bold uppercase">Materials</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalMaterials)}</p>
        </div>
        <div className="bg-[#111] p-5 rounded-xl border border-[#222]">
          <div className="flex items-center gap-3 mb-2 text-gray-400">
            <HardHat size={18} /> <span className="text-sm font-bold uppercase">Labor / Crews</span>
          </div>
          <p className="text-2xl font-bold text-[#FACB00]">{formatCurrency(totalLabor)}</p>
        </div>
        <div className="bg-[#111] p-5 rounded-xl border border-[#222]">
          <div className="flex items-center gap-3 mb-2 text-gray-400">
            <AlertCircle size={18} /> <span className="text-sm font-bold uppercase">Other Expenses</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalOther)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-900/20 to-red-600/10 p-5 rounded-xl border border-red-500/20">
          <div className="flex items-center gap-3 mb-2 text-red-400">
            <DollarSign size={18} /> <span className="text-sm font-bold uppercase">Total Expense</span>
          </div>
          <p className="text-3xl font-black text-red-500">{formatCurrency(grandTotal)}</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">Expense Log</h3>
        <button onClick={handleNewExpenseClick} className="bg-[#FACB00] hover:bg-[#e0b600] text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2">
          <Plus size={18} /> New Expense
        </button>
      </div>

      {/* Lista de Gastos */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#1a1a1a] text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Vendor / Worker</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Actions</th>
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
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button 
                      onClick={() => handleEditExpenseClick(exp)}
                      className="p-1 hover:bg-[#222] rounded text-gray-400 hover:text-white transition-colors"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button 
                      onClick={() => handleDeleteExpense(exp)}
                      className="p-1 hover:bg-red-500/10 rounded text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  <FileText size={32} className="mx-auto mb-2 opacity-50" />
                  No expenses recorded for this project.
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
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <DollarSign className="text-[#FACB00]"/> {editingExpense ? 'Edit Expense' : 'Record Expense'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              {/* Sección AI */}
              <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2 mb-2">
                  <Camera size={16} /> Scan Receipt / Invoice with AI
                </h4>
                <p className="text-xs text-blue-300 mb-3 opacity-80">
                  Upload a photo of the Home Depot receipt or invoice, and our AI will automatically extract the total, date, and vendor.
                </p>
                <input 
                  type="file" 
                  accept="image/*,application/pdf,.pdf"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={aiLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                  {aiLoading ? (aiStatus || 'Processing...') : 'Upload Receipt Photo or PDF'}
                </button>
                <p className="text-[10px] text-blue-400/60 mt-2 text-center">Accepts: JPG · PNG · HEIC · PDF</p>
              </div>

              <form id="expense-form" onSubmit={submitExpense} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Expense Type</label>
                    <select 
                      value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-[#33] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FACB00]"
                    >
                      <option value="material">Materials / Supplies</option>
                      <option value="labor">Crew / Labor Payment</option>
                      <option value="other">Other (Permits, etc)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Total Amount ($)</label>
                    <input 
                      required type="number" step="0.01" min="0"
                      value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-[#33] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FACB00]"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                    {form.type === 'labor' ? 'Worker / Crew Name' : 'Vendor (e.g., Home Depot)'}
                  </label>
                  <input 
                    required type="text"
                    value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-[#33] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FACB00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Date</label>
                  <input 
                    required type="date"
                    value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-[#33] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FACB00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Description / Notes</label>
                  <textarea 
                    value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-[#33] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FACB00] min-h-[80px]"
                    placeholder="Details of purchase or payment..."
                  />
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-[#222] flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg bg-[#222] hover:bg-[#333] text-white font-bold transition-colors">Cancel</button>
              <button form="expense-form" type="submit" className="flex-1 py-2 rounded-lg bg-[#FACB00] hover:bg-[#e0b600] text-black font-bold transition-colors">
                {editingExpense ? 'Save Changes' : 'Save Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
