import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Printer, Download, Trash2, Briefcase, Home } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import PinLock from '../../components/PinLock';

// Helper component for safe inline editing (saves on blur or enter key)
function EditableCell({ value, onSave, type = "number", className = "" }) {
  const [editingValue, setEditingValue] = useState(value);

  useEffect(() => {
    setEditingValue(value);
  }, [value]);

  const handleBlur = () => {
    const rawVal = editingValue;
    if (type === "number") {
      const numVal = Number(rawVal);
      if (numVal !== Number(value)) {
        onSave(numVal);
      }
    } else {
      if (rawVal !== value) {
        onSave(rawVal);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  return (
    <input
      type={type}
      className={`w-full h-full px-4 py-3 bg-transparent border-none outline-none transition-colors focus:bg-[#222] focus:text-white ${className}`}
      value={editingValue}
      onChange={(e) => setEditingValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}

export default function ProfitTracker() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectTypeFilter, setProjectTypeFilter] = useState('standard');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      let allProjects = [];
      let page = 0;
      const pageSize = 1000;

      // Paginated loop to fetch ALL projects (resolves 100-row limit in Supabase)
      while (true) {
        const { data: pageData, error: projError } = await supabase
          .from('projects')
          .select(`
            id, 
            project_number,
            title, 
            address, 
            sold_price, 
            project_type, 
            status, 
            created_at,
            start_date,
            contact:contacts!projects_contact_id_fkey(first_name, last_name), 
            project_expenses(type, amount)
          `)
          .order('created_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (projError) throw projError;
        if (!pageData || pageData.length === 0) break;

        allProjects = allProjects.concat(pageData);
        if (pageData.length < pageSize) break;
        page++;
      }

      // Process and combine
      const combined = allProjects.map(proj => {
        const projExpenses = proj.project_expenses || [];
        const material = projExpenses.filter(e => e.type === 'material').reduce((sum, e) => sum + Number(e.amount), 0);
        const labor = projExpenses.filter(e => e.type === 'labor').reduce((sum, e) => sum + Number(e.amount), 0);
        const soldPrice = Number(proj.sold_price || 0);
        const profit = soldPrice - material - labor;

        return {
          id: proj.id,
          projectNumber: proj.project_number ? `PRJ-${String(proj.project_number).padStart(4, '0')}` : 'N/A',
          client: proj.contact ? `${proj.contact.first_name} ${proj.contact.last_name}` : 'No Client',
          address: proj.address || 'No Address',
          service: proj.title || 'Project',
          soldPrice,
          material,
          labor,
          profit,
          projectType: proj.project_type || 'standard',
          status: proj.status || 'pending',
          createdAt: proj.created_at,
          startDate: proj.start_date
        };
      });

      setData(combined);
    } catch (error) {
      console.error('Error fetching profit data:', error);
      alert('Error loading financial data.');
    } finally {
      setLoading(false);
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = "sep=,\nPROJECT #,CLIENT,ADDRESS,SERVICE,SOLD PRICE,MATERIAL,LABOR,PROFIT\n";
    
    sortedData.forEach(row => {
      const projNum = `"${row.projectNumber}"`;
      const client = `"${(row.client || '').replace(/"/g, '""')}"`;
      const address = `"${(row.address || '').replace(/"/g, '""')}"`;
      const service = `"${(row.service || '').replace(/"/g, '""')}"`;
      
      const line = `${projNum},${client},${address},${service},${row.soldPrice},${row.material},${row.labor},${row.profit}`;
      csvContent += line + "\n";
    });

    csvContent += `"TOTAL","","","",${totalSoldPrice},${totalMaterial},${totalLabor},${totalProfit}\n`;

    const bomBytes = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bomBytes, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Barba_Construction_Profit_Tracker_${projectTypeFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Edit Service
  const updateServiceTitle = async (id, newTitle) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, service: newTitle } : item));
    await supabase.from('projects').update({ title: newTitle }).eq('id', id);
  };

  // 2. Edit Sold Price (Total)
  const updateSoldPrice = async (id, newPrice) => {
    setData(prev => prev.map(item => {
      if (item.id === id) {
        return { 
          ...item, 
          soldPrice: newPrice,
          profit: newPrice - item.material - item.labor 
        };
      }
      return item;
    }));
    await supabase.from('projects').update({ sold_price: newPrice }).eq('id', id);
  };

  // 3. Edit Material Cost (inserts a project_expense adjustment)
  const updateMaterialCost = async (id, newMaterial) => {
    const item = data.find(x => x.id === id);
    if (!item) return;

    const diff = newMaterial - item.material;
    if (diff === 0) return;

    setData(prev => prev.map(x => {
      if (x.id === id) {
        return {
          ...x,
          material: newMaterial,
          profit: x.soldPrice - newMaterial - x.labor
        };
      }
      return x;
    }));

    const adjustmentExpense = {
      project_id: id,
      type: 'material',
      amount: diff,
      vendor: 'Ajuste Profit Tracker',
      date: new Date().toISOString().split('T')[0],
      description: 'Ajuste de costo de materiales desde Profit Tracker'
    };

    await supabase.from('project_expenses').insert(adjustmentExpense);
  };

  // 4. Edit Labor Cost (inserts a project_expense adjustment)
  const updateLaborCost = async (id, newLabor) => {
    const item = data.find(x => x.id === id);
    if (!item) return;

    const diff = newLabor - item.labor;
    if (diff === 0) return;

    setData(prev => prev.map(x => {
      if (x.id === id) {
        return {
          ...x,
          labor: newLabor,
          profit: x.soldPrice - x.material - newLabor
        };
      }
      return x;
    }));

    const adjustmentExpense = {
      project_id: id,
      type: 'labor',
      amount: diff,
      vendor: 'Ajuste Profit Tracker',
      date: new Date().toISOString().split('T')[0],
      description: 'Ajuste de costo de labor desde Profit Tracker'
    };

    await supabase.from('project_expenses').insert(adjustmentExpense);
  };

  // 5. Delete Project and all cascade children
  const deleteProject = async (projectId) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este proyecto y todos sus registros asociados (pagos, gastos, materiales, fotos)? Esta acción no se puede deshacer y limpiará todo en cascada.")) {
      return;
    }

    try {
      setLoading(true);
      // Clean cascade children
      await supabase.from('payments').delete().eq('project_id', projectId);
      await supabase.from('project_photos').delete().eq('project_id', projectId);
      await supabase.from('project_documents').delete().eq('project_id', projectId);
      await supabase.from('project_materials').delete().eq('project_id', projectId);
      await supabase.from('project_expenses').delete().eq('project_id', projectId);

      // Delete parent project
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;

      setData(prev => prev.filter(item => item.id !== projectId));
      alert("Proyecto eliminado con éxito.");
    } catch (err) {
      console.error(err);
      alert("Error al eliminar el proyecto: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter combined data based on active UI selections
  const filteredData = data.filter(row => {
    const matchesType = row.projectType === projectTypeFilter;
    const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
    return matchesType && matchesStatus;
  });

  // Sort filtered data dynamically
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === 'date-desc') {
      const dateA = a.startDate || a.createdAt || 0;
      const dateB = b.startDate || b.createdAt || 0;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    }
    if (sortBy === 'date-asc') {
      const dateA = a.startDate || a.createdAt || 0;
      const dateB = b.startDate || b.createdAt || 0;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    }
    if (sortBy === 'price-desc') {
      return b.soldPrice - a.soldPrice;
    }
    if (sortBy === 'price-asc') {
      return a.soldPrice - b.soldPrice;
    }
    if (sortBy === 'number-desc') {
      const numA = parseInt(a.projectNumber.replace('PRJ-', '')) || 0;
      const numB = parseInt(b.projectNumber.replace('PRJ-', '')) || 0;
      return numB - numA;
    }
    if (sortBy === 'number-asc') {
      const numA = parseInt(a.projectNumber.replace('PRJ-', '')) || 0;
      const numB = parseInt(b.projectNumber.replace('PRJ-', '')) || 0;
      return numA - numB;
    }
    if (sortBy === 'client-asc') {
      return a.client.localeCompare(b.client);
    }
    if (sortBy === 'client-desc') {
      return b.client.localeCompare(a.client);
    }
    return 0;
  });

  if (loading) {
    return <div className="page-loading"><Loader2 size={32} className="spin" /><p>Loading financial data...</p></div>;
  }

  const totalSoldPrice = sortedData.reduce((sum, row) => sum + row.soldPrice, 0);
  const totalMaterial = sortedData.reduce((sum, row) => sum + row.material, 0);
  const totalLabor = sortedData.reduce((sum, row) => sum + row.labor, 0);
  const totalProfit = sortedData.reduce((sum, row) => sum + row.profit, 0);

  return (
    <PinLock pin="2012" title="Profit Tracker — Restricted">
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      
      {/* Title & Toolbar */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Project Profit Tracker</h1>
          <p className="text-gray-400 mt-1">Financial summary of costs and profits per project.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#333] rounded-lg transition-colors cursor-pointer text-sm font-medium">
            <Download size={17} /> Export CSV
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-[#FACB00] hover:bg-[#e0b600] text-black font-bold rounded-lg transition-colors cursor-pointer text-sm font-semibold">
            <Printer size={17} /> Print / PDF
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden">
        {/* Project Type Toggle (Standard / Fix & Flip) */}
        <div className="flex bg-[#161616] border border-[#2d2d2d] p-1 rounded-xl select-none">
          <button
            type="button"
            onClick={() => setProjectTypeFilter('standard')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-250 cursor-pointer ${
              projectTypeFilter === 'standard'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Briefcase size={14} />
            <span>Standard</span>
          </button>
          <button
            type="button"
            onClick={() => setProjectTypeFilter('fix_flip')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-250 cursor-pointer ${
              projectTypeFilter === 'fix_flip'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Home size={14} />
            <span>Fix & Flip</span>
          </button>
        </div>

        {/* Toolbar Middle/Right: Status & Sort */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#161616] border border-[#2d2d2d] text-white rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sort:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#161616] border border-[#2d2d2d] text-white rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="price-desc">Sold Price (High-Low)</option>
              <option value="price-asc">Sold Price (Low-High)</option>
              <option value="number-desc">Project # (High-Low)</option>
              <option value="number-asc">Project # (Low-High)</option>
              <option value="client-asc">Client Name (A-Z)</option>
              <option value="client-desc">Client Name (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Printable Area / Table Container */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden print:bg-white print:text-black print:border-none print:shadow-none">
        
        {/* Print Only Header */}
        <div className="hidden print:block text-center p-8 pb-4">
          <h1 className="text-3xl font-black uppercase tracking-wider text-black">Barba Construction</h1>
          <h2 className="text-xl font-bold uppercase tracking-wide mt-1 text-gray-800">
            Project Profit Tracker — {projectTypeFilter === 'fix_flip' ? 'Fix & Flip' : 'Standard'}
          </h2>
          <div className="w-24 h-1 bg-black mx-auto mt-4"></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm print:border-collapse print:border-2 print:border-black">
            <thead className="bg-[#1a1a1a] text-gray-400 uppercase text-xs print:bg-[#FACB00] print:text-black print:font-black">
              <tr>
                <th className="px-4 py-3 print:border-2 print:border-black">Project #</th>
                <th className="px-4 py-3 print:border-2 print:border-black">Client</th>
                <th className="px-4 py-3 print:border-2 print:border-black">Address</th>
                <th className="px-4 py-3 print:border-2 print:border-black">Service</th>
                <th className="px-4 py-3 text-right print:border-2 print:border-black">Sold Price</th>
                <th className="px-4 py-3 text-right print:border-2 print:border-black">Material</th>
                <th className="px-4 py-3 text-right print:border-2 print:border-black">Labor</th>
                <th className="px-4 py-3 text-right text-[#FACB00] print:border-2 print:border-black print:text-black">Profit</th>
                <th className="px-4 py-3 text-center print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222] print:divide-none">
              {sortedData.map((row) => (
                <tr key={row.id} className="hover:bg-[#1a1a1a] transition-colors print:hover:bg-transparent print:bg-white">
                  <td className="px-4 py-3 font-semibold text-gray-400 print:text-black print:border-2 print:border-black">{row.projectNumber}</td>
                  <td className="px-4 py-3 font-medium text-white print:text-black print:border-2 print:border-black">{row.client}</td>
                  <td className="px-4 py-3 text-gray-300 print:text-black print:border-2 print:border-black">{row.address}</td>
                  
                  {/* Service Cell */}
                  <td className="px-0 py-0 print:border-2 print:border-black print:px-4 print:py-3 print:text-black">
                    <div className="print:hidden h-full w-full">
                      <EditableCell 
                        type="text"
                        value={row.service}
                        onSave={(val) => updateServiceTitle(row.id, val)}
                        className="text-left text-gray-300 hover:bg-[#222]"
                      />
                    </div>
                    <span className="hidden print:inline">{row.service}</span>
                  </td>

                  {/* Sold Price Cell */}
                  <td className="px-0 py-0 print:border-2 print:border-black print:px-4 print:py-3 print:text-black">
                    <div className="print:hidden h-full w-full">
                      <EditableCell 
                        type="number"
                        value={row.soldPrice}
                        onSave={(val) => updateSoldPrice(row.id, val)}
                        className="text-right text-gray-300 hover:bg-[#222]"
                      />
                    </div>
                    <span className="hidden print:inline">{formatCurrency(row.soldPrice)}</span>
                  </td>

                  {/* Material Cell */}
                  <td className="px-0 py-0 print:border-2 print:border-black print:px-4 print:py-3 print:text-black">
                    <div className="print:hidden h-full w-full">
                      <EditableCell 
                        type="number"
                        value={row.material}
                        onSave={(val) => updateMaterialCost(row.id, val)}
                        className="text-right text-gray-300 hover:bg-[#222]"
                      />
                    </div>
                    <span className="hidden print:inline">{formatCurrency(row.material)}</span>
                  </td>

                  {/* Labor Cell */}
                  <td className="px-0 py-0 print:border-2 print:border-black print:px-4 print:py-3 print:text-black">
                    <div className="print:hidden h-full w-full">
                      <EditableCell 
                        type="number"
                        value={row.labor}
                        onSave={(val) => updateLaborCost(row.id, val)}
                        className="text-right text-gray-300 hover:bg-[#222]"
                      />
                    </div>
                    <span className="hidden print:inline">{formatCurrency(row.labor)}</span>
                  </td>

                  {/* Profit Cell */}
                  <td className={`px-4 py-3 text-right font-bold print:border-2 print:border-black ${row.profit >= 0 ? 'text-emerald-400 print:text-green-700' : 'text-red-500 print:text-red-700'}`}>
                    {formatCurrency(row.profit)}
                  </td>

                  {/* Actions Cell */}
                  <td className="px-4 py-3 text-center print:hidden">
                    <button 
                      onClick={() => deleteProject(row.id)} 
                      className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-500/10 transition-colors cursor-pointer inline-flex items-center justify-center"
                      title="Eliminar proyecto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {sortedData.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500 font-medium print:border-2 print:border-black">
                    No projects found for current filters.
                  </td>
                </tr>
              )}
              {/* TOTALS ROW */}
              <tr className="bg-[#1a1a1a] text-white font-bold uppercase tracking-wider print:bg-[#ffe785] print:text-black print:font-black">
                <td className="px-4 py-4 print:border-2 print:border-black" colSpan="4">TOTAL</td>
                <td className="px-4 py-4 text-right print:border-2 print:border-black">{formatCurrency(totalSoldPrice)}</td>
                <td className="px-4 py-4 text-right print:border-2 print:border-black">{formatCurrency(totalMaterial)}</td>
                <td className="px-4 py-4 text-right print:border-2 print:border-black">{formatCurrency(totalLabor)}</td>
                <td className="px-4 py-4 text-right text-[#FACB00] text-lg print:border-2 print:border-black print:text-black">{formatCurrency(totalProfit)}</td>
                <td className="print:hidden"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-[#161616] border-t border-[#222] print:bg-white print:border-none print:mt-4">
          <p className="font-bold text-gray-400 print:text-gray-800">FORMULA:</p>
          <p className="text-gray-500 print:text-gray-700">Profit = Sold Price - Material - Labor</p>
          <p className="text-gray-600 text-xs mt-2 print:hidden">*Note: You can edit the "Service", "Sold Price", "Material" and "Labor" columns by clicking directly on the table text.</p>
        </div>
      </div>
    </div>
    </PinLock>
  );
}
