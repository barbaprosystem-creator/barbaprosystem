import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Printer, Download } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export default function ProfitTracker() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // 1. Fetch projects with contacts
      const { data: projectsData, error: projError } = await supabase
        .from('projects')
        .select('id, title, address, sold_price, contact:contacts(first_name, last_name)')
        .order('created_at', { ascending: false });

      if (projError) throw projError;

      // 2. Fetch all expenses
      const { data: expensesData, error: expError } = await supabase
        .from('project_expenses')
        .select('project_id, type, amount');
        
      if (expError) {
         console.warn("No se pudo cargar project_expenses o la tabla no existe.");
      }

      const expenses = expensesData || [];

      // 3. Process and combine
      const combined = (projectsData || []).map(proj => {
        const projExpenses = expenses.filter(e => e.project_id === proj.id);
        const material = projExpenses.filter(e => e.type === 'material').reduce((sum, e) => sum + Number(e.amount), 0);
        const labor = projExpenses.filter(e => e.type === 'labor').reduce((sum, e) => sum + Number(e.amount), 0);
        const soldPrice = Number(proj.sold_price || 0);
        const profit = soldPrice - material - labor;

        return {
          id: proj.id,
          client: proj.contact ? `${proj.contact.first_name} ${proj.contact.last_name}` : 'Sin Cliente',
          address: proj.address || 'Sin Dirección',
          service: proj.title || 'Proyecto',
          soldPrice,
          material,
          labor,
          profit
        };
      });

      setData(combined);
    } catch (error) {
      console.error('Error fetching profit data:', error);
      alert('Error al cargar los datos financieros.');
    } finally {
      setLoading(false);
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    // Forzamos a Excel a entender que el separador es coma
    let csvContent = "sep=,\nCLIENTE,DIRECCION,SERVICIO,PRECIO COBRADO,MATERIAL,MANO DE OBRA,GANANCIA\n";
    
    data.forEach(row => {
      // Limpiar y escapar comillas por si acaso
      const client = `"${(row.client || '').replace(/"/g, '""')}"`;
      const address = `"${(row.address || '').replace(/"/g, '""')}"`;
      const service = `"${(row.service || '').replace(/"/g, '""')}"`;
      
      const line = `${client},${address},${service},${row.soldPrice},${row.material},${row.labor},${row.profit}`;
      csvContent += line + "\n";
    });

    // Totals line
    csvContent += `"TOTAL","","",${totalSoldPrice},${totalMaterial},${totalLabor},${totalProfit}\n`;

    // Pasamos el BOM exacto en bytes para UTF-8 y luego el string
    const bomBytes = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bomBytes, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Barba_Construction_Profit_Tracker.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateServiceTitle = async (id, newTitle) => {
    // Optimistic update
    setData(prev => prev.map(item => item.id === id ? { ...item, service: newTitle } : item));
    // DB update (we use project title as service type for now)
    await supabase.from('projects').update({ title: newTitle }).eq('id', id);
  };

  if (loading) {
    return <div className="page-loading"><Loader2 size={32} className="spin" /><p>Cargando datos financieros...</p></div>;
  }

  const totalSoldPrice = data.reduce((sum, row) => sum + row.soldPrice, 0);
  const totalMaterial = data.reduce((sum, row) => sum + row.material, 0);
  const totalLabor = data.reduce((sum, row) => sum + row.labor, 0);
  const totalProfit = data.reduce((sum, row) => sum + row.profit, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Project Profit Tracker</h1>
          <p className="text-gray-400 mt-1">Resumen financiero de costos y ganancias por proyecto.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#333] rounded-lg transition-colors">
            <Download size={18} /> Exportar CSV
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-[#FACB00] hover:bg-[#e0b600] text-black font-bold rounded-lg transition-colors">
            <Printer size={18} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Printable Area / Table Container */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden print:bg-white print:text-black print:border-none print:shadow-none">
        
        {/* Print Only Header */}
        <div className="hidden print:block text-center p-8 pb-4">
          <h1 className="text-3xl font-black uppercase tracking-wider text-black">Barba Construction</h1>
          <h2 className="text-xl font-bold uppercase tracking-wide mt-1 text-gray-800">Project Profit Tracker</h2>
          <div className="w-24 h-1 bg-black mx-auto mt-4"></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm print:border-collapse print:border-2 print:border-black">
            <thead className="bg-[#1a1a1a] text-gray-400 uppercase text-xs print:bg-[#FACB00] print:text-black print:font-black">
              <tr>
                <th className="px-4 py-3 print:border-2 print:border-black">Cliente</th>
                <th className="px-4 py-3 print:border-2 print:border-black">Dirección</th>
                <th className="px-4 py-3 print:border-2 print:border-black">Servicio</th>
                <th className="px-4 py-3 text-right print:border-2 print:border-black">Precio Cobrado</th>
                <th className="px-4 py-3 text-right print:border-2 print:border-black">Material</th>
                <th className="px-4 py-3 text-right print:border-2 print:border-black">Mano de Obra</th>
                <th className="px-4 py-3 text-right text-[#FACB00] print:border-2 print:border-black print:text-black">Ganancia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222] print:divide-none">
              {data.map((row, index) => (
                <tr key={row.id} className="hover:bg-[#1a1a1a] transition-colors print:hover:bg-transparent print:bg-white">
                  <td className="px-4 py-3 font-medium text-white print:text-black print:border-2 print:border-black">{row.client}</td>
                  <td className="px-4 py-3 text-gray-300 print:text-black print:border-2 print:border-black">{row.address}</td>
                  <td className="px-0 py-0 print:border-2 print:border-black print:px-4 print:py-3 print:text-black">
                    <input 
                      className="w-full h-full px-4 py-3 bg-transparent border-none outline-none text-gray-300 hover:bg-[#222] focus:bg-[#222] focus:text-white transition-colors print:hidden" 
                      value={row.service}
                      onChange={(e) => updateServiceTitle(row.id, e.target.value)}
                      title="Editar servicio (se guardará automáticamente)"
                    />
                    <span className="hidden print:inline">{row.service}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300 print:text-black print:border-2 print:border-black">{formatCurrency(row.soldPrice)}</td>
                  <td className="px-4 py-3 text-right text-gray-300 print:text-black print:border-2 print:border-black">{formatCurrency(row.material)}</td>
                  <td className="px-4 py-3 text-right text-gray-300 print:text-black print:border-2 print:border-black">{formatCurrency(row.labor)}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-400 print:text-green-700 print:border-2 print:border-black">{formatCurrency(row.profit)}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500 font-medium print:border-2 print:border-black">
                    No hay proyectos registrados aún.
                  </td>
                </tr>
              )}
              {/* TOTALS ROW */}
              <tr className="bg-[#1a1a1a] text-white font-bold uppercase tracking-wider print:bg-[#ffe785] print:text-black print:font-black">
                <td className="px-4 py-4 print:border-2 print:border-black" colSpan="3">TOTAL</td>
                <td className="px-4 py-4 text-right print:border-2 print:border-black">{formatCurrency(totalSoldPrice)}</td>
                <td className="px-4 py-4 text-right print:border-2 print:border-black">{formatCurrency(totalMaterial)}</td>
                <td className="px-4 py-4 text-right print:border-2 print:border-black">{formatCurrency(totalLabor)}</td>
                <td className="px-4 py-4 text-right text-[#FACB00] text-lg print:border-2 print:border-black print:text-black">{formatCurrency(totalProfit)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-[#161616] border-t border-[#222] print:bg-white print:border-none print:mt-4">
          <p className="font-bold text-gray-400 print:text-gray-800">FÓRMULA:</p>
          <p className="text-gray-500 print:text-gray-700">Ganancia = Precio Cobrado - Material - Mano de Obra</p>
          <p className="text-gray-600 text-xs mt-2 print:hidden">*Nota: Puedes editar la columna "Servicio" haciendo clic directamente sobre el texto de la tabla.</p>
        </div>
      </div>
    </div>
  );
}
