import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { 
  PackageSearch, Plus, Loader2, Save, ShoppingCart, CheckCircle2, FileText, Settings2, Trash2, Calculator 
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ProjectMaterialsTab({ projectId }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [projectData, setProjectData] = useState(null);
  
  // Generator State
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [services, setServices] = useState([]);
  
  const [selectedService, setSelectedService] = useState('');
  const [variableInput, setVariableInput] = useState(''); // e.g. 30 Squares

  useEffect(() => {
    fetchOrder();
    fetchAvailableServices();
  }, [projectId]);

  async function fetchOrder() {
    setLoading(true);

    if (projectId === 'mock-proj-1' || projectId === 'mock-proj-2') {
      const isMock1 = projectId === 'mock-proj-1';
      setProjectData({
        title: isMock1 ? 'Perez Family Residence' : 'Maria Siding Renovation',
        contact: { first_name: isMock1 ? 'Juan' : 'Maria', last_name: isMock1 ? 'Perez' : 'Gomez', address: isMock1 ? '123 Main St, Springfield' : '456 Oak Ave, Springfield' }
      });
      setOrder({ id: `order-${projectId}`, project_id: projectId, status: 'draft', total_estimated_cost: isMock1 ? 4500 : 2300, created_at: new Date().toISOString() });
      setItems([
        { id: `item-1-${projectId}`, order_id: `order-${projectId}`, material_id: 'm1', calculated_quantity: 20.5, manual_adjustment: 0, final_quantity: 21, unit_price: 150, total_price: 3150, material: { name: 'Siding CertainTeed Monogram', unit_of_measure: 'Square' } },
        { id: `item-2-${projectId}`, order_id: `order-${projectId}`, material_id: 'm2', calculated_quantity: 45, manual_adjustment: 5, final_quantity: 50, unit_price: 27, total_price: 1350, material: { name: 'OSB Plywood 7/16', unit_of_measure: 'Sheet' } }
      ]);
      setLoading(false);
      return;
    }

    const { data: orders } = await supabase
      .from('material_orders')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (orders && orders.length > 0) {
      setOrder(orders[0]);
      const { data: orderItems } = await supabase
        .from('material_order_items')
        .select('*, material:materials_catalog(*)')
        .eq('order_id', orders[0].id)
        .order('id');
      setItems(orderItems || []);
    }

    const { data: projData } = await supabase
      .from('projects')
      .select('*, contact:contacts(first_name,last_name,address,phone)')
      .eq('id', projectId)
      .single();
    if(projData) setProjectData(projData);

    setLoading(false);
  }

  async function fetchAvailableServices() {
    // Find unique service types that have formulas
    const { data } = await supabase
      .from('service_material_recipes')
      .select('service_type, calculation_variable');
    
    if (data) {
      const uniqueServices = [];
      const map = new Map();
      for (const item of data) {
        if(!map.has(item.service_type)){
          map.set(item.service_type, true);
          uniqueServices.push({
            type: item.service_type,
            variable: item.calculation_variable
          });
        }
      }
      setServices(uniqueServices);
      if (uniqueServices.length > 0) setSelectedService(uniqueServices[0].type);
    }
  }

  async function generateOrder(e) {
    e.preventDefault();
    if (!selectedService || !variableInput) return;
    setIsGenerating(true);

    try {
      // 1. Get recipes for this service
      const { data: serviceRecipes } = await supabase
        .from('service_material_recipes')
        .select('*, material:materials_catalog(*)')
        .eq('service_type', selectedService);

      if (!serviceRecipes || serviceRecipes.length === 0) {
        alert('No formulas configured for this service.');
        setIsGenerating(false);
        return;
      }

      const inputVal = parseFloat(variableInput);
      let totalEstimatedCost = 0;

      // 2. Create material order
      const { data: newOrder, error: orderError } = await supabase
        .from('material_orders')
        .insert([{
          project_id: projectId,
          status: 'draft',
          created_by: profile.id
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Generate items based on math
      const orderItems = serviceRecipes.map(recipe => {
        // Base Math: variable / coverage
        let calcQty = inputVal / recipe.coverage_per_unit;
        
        // Add Waste Factor
        if (recipe.waste_factor_percent > 0) {
          calcQty = calcQty * (1 + (recipe.waste_factor_percent / 100));
        }

        const price = recipe.material.estimated_price || 0;
        const total = calcQty * price;
        totalEstimatedCost += total;

        return {
          order_id: newOrder.id,
          material_id: recipe.material_id,
          calculated_quantity: calcQty,
          manual_adjustment: 0,
          final_quantity: Math.ceil(calcQty), // Round up for hardware store orders
          unit_price: price,
          total_price: Math.ceil(calcQty) * price
        };
      });

      await supabase.from('material_order_items').insert(orderItems);
      await supabase.from('material_orders').update({ total_estimated_cost: totalEstimatedCost }).eq('id', newOrder.id);

      setIsGenerating(false);
      fetchOrder();
    } catch (err) {
      console.error(err);
      alert('Error generating material order.');
      setIsGenerating(false);
    }
  }

  async function updateAdjustment(itemId, newAdjustment) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const finalQty = Math.max(0, Math.ceil(item.calculated_quantity) + newAdjustment);
    const newTotal = finalQty * item.unit_price;

    // Optimistic UI Update
    setItems(items.map(i => i.id === itemId ? { ...i, manual_adjustment: newAdjustment, final_quantity: finalQty, total_price: newTotal } : i));

    await supabase.from('material_order_items')
      .update({ 
        manual_adjustment: newAdjustment,
        final_quantity: finalQty,
        total_price: newTotal
      })
      .eq('id', itemId);

    // Recalculate Total Order Cost
    const { data: updatedItems } = await supabase.from('material_order_items').select('total_price').eq('order_id', order.id);
    if (updatedItems) {
      const newGrandTotal = updatedItems.reduce((acc, curr) => acc + curr.total_price, 0);
      setOrder({ ...order, total_estimated_cost: newGrandTotal });
      await supabase.from('material_orders').update({ total_estimated_cost: newGrandTotal }).eq('id', order.id);
    }
  }

  function exportToPDF() {
    if (!order || !items.length) return;
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('BARBA CONSTRUCTION', 14, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('Material Order (BOM)', 14, 30);
    
    // Project Info
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    if (projectData) {
      doc.text(`Project: ${projectData.title}`, 14, 45);
      doc.text(`Client: ${projectData.contact?.first_name || ''} ${projectData.contact?.last_name || ''}`, 14, 51);
      doc.text(`Address: ${projectData.contact?.address || projectData.address || ''}`, 14, 57);
    }
    
    // Order Info
    const orderNumber = order.id.split('-')[0].toUpperCase();
    doc.text(`Order Num: #${orderNumber}`, 140, 45);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 140, 51);
    
    // Items Table
    const tableData = items.map(item => [
      item.material?.name || 'Unknown Material',
      `${item.final_quantity} ${item.material?.unit_of_measure}`,
      formatCurrency(item.unit_price),
      formatCurrency(item.total_price)
    ]);
    
    doc.autoTable({
      startY: 65,
      head: [['Material', 'Quantity to Order', 'Unit Price', 'Total Cost']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });
    
    // Total
    const finalY = doc.lastAutoTable.finalY || 65;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Estimated Cost: ${formatCurrency(order.total_estimated_cost)}`, 140, finalY + 15);
    
    doc.save(`BOM_${orderNumber}.pdf`);
  }

  async function deleteOrder() {
    if(!confirm('Are you sure you want to delete this material order?')) return;
    await supabase.from('material_orders').delete().eq('id', order.id);
    setOrder(null);
    setItems([]);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12 text-[#555555]">
      <Loader2 size={24} className="animate-spin mr-3" />
      <span>Loading materials...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {!order && !isGenerating && (
        <div className="text-center py-16 border-2 border-dashed border-[#2a2a2a]/50 rounded-2xl bg-[#1a1a1a]/30">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <ShoppingCart size={28} className="text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-[#f0f0f0]">Purchase Order Generator</h3>
          <p className="text-sm text-[#888888] mt-2 mb-6 max-w-sm mx-auto">
            Automates the exact list of materials you need to buy based on project measurements.
          </p>
          <button 
            onClick={() => setIsGenerating(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors"
          >
            <Settings2 size={18} />
            Create Purchase Order (BOM)
          </button>
        </div>
      )}

      {isGenerating && !order && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a1a] border border-[#2a2a2a]/60 rounded-2xl p-6 max-w-lg mx-auto"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Calculator size={20} className="text-[#E2FF00]" /> 
            Configure Math
          </h3>
          <form onSubmit={generateOrder} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-2">Service to Perform</label>
              <select 
                className="w-full bg-[#2a2a2a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#E2FF00] focus:ring-1 focus:ring-[#E2FF00] transition-colors"
                value={selectedService}
                onChange={e => setSelectedService(e.target.value)}
                required
              >
                {services.map(s => (
                  <option key={s.type} value={s.type}>{s.type.toUpperCase()}</option>
                ))}
              </select>
            </div>
            
            {selectedService && (
              <div>
                <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-2">
                  Measurement (In {services.find(s => s.type === selectedService)?.variable})
                </label>
                <input 
                  type="number" step="0.1" required
                  placeholder="e.g. 30"
                  className="w-full bg-[#2a2a2a] border border-[#333] rounded-xl px-4 py-3 text-white font-mono text-lg focus:border-[#E2FF00] transition-colors"
                  value={variableInput}
                  onChange={e => setVariableInput(e.target.value)}
                />
                <p className="text-xs text-[#666] mt-2">
                  The system will cross-reference this measurement with the administrator's "Recipe" to generate the shopping list.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setIsGenerating(false)}
                className="flex-1 py-3 text-[#888] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 bg-[#E2FF00] text-black font-bold rounded-xl hover:bg-[#d4f000] transition-colors flex justify-center items-center gap-2"
              >
                Calculate Materials <CheckCircle2 size={18} />
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {order && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#1a1a1a]/50 p-5 border border-[#2a2a2a]/50 rounded-2xl">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 font-bold text-xs rounded-full uppercase tracking-widest">
                  Order #{order.id.split('-')[0]}
                </span>
                <span className="text-xs text-[#666]">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-white">Bill of Materials</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-4">
                <p className="text-xs text-[#888] uppercase tracking-wider font-bold">Estimated Cost</p>
                <p className="text-xl font-black text-[#E2FF00]">{formatCurrency(order.total_estimated_cost)}</p>
              </div>
              <button onClick={exportToPDF} className="p-3 bg-[#2a2a2a] hover:bg-[#333] text-white rounded-xl transition-colors">
                <FileText size={18} />
              </button>
              <button onClick={deleteOrder} className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <div className="bg-[#1a1a1a]/30 border border-[#2a2a2a]/40 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
                    <th className="p-4 text-xs font-bold text-[#888] uppercase tracking-wider">Material</th>
                    <th className="p-4 text-xs font-bold text-[#888] uppercase tracking-wider text-center">Base Calculation</th>
                    <th className="p-4 text-xs font-bold text-[#888] uppercase tracking-wider text-center">Manual Adjustment</th>
                    <th className="p-4 text-xs font-bold text-[#E2FF00] uppercase tracking-wider text-center">Order (Final)</th>
                    <th className="p-4 text-xs font-bold text-[#888] uppercase tracking-wider text-right">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]/50">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-[#1a1a1a]/50 transition-colors group">
                      <td className="p-4">
                        <p className="font-bold text-[#e0e0e0]">{item.material?.name}</p>
                        <p className="text-xs text-[#666]">{formatCurrency(item.unit_price)} / {item.material?.unit_of_measure}</p>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-[#888] font-mono">{item.calculated_quantity.toFixed(1)}</span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center bg-[#2a2a2a] rounded-lg border border-[#333] overflow-hidden">
                          <button 
                            onClick={() => updateAdjustment(item.id, item.manual_adjustment - 1)}
                            className="px-3 py-1 text-[#888] hover:text-white hover:bg-[#333] transition-colors"
                          >-</button>
                          <span className="w-10 text-center font-bold text-white text-sm">
                            {item.manual_adjustment > 0 ? '+' : ''}{item.manual_adjustment}
                          </span>
                          <button 
                            onClick={() => updateAdjustment(item.id, item.manual_adjustment + 1)}
                            className="px-3 py-1 text-[#888] hover:text-white hover:bg-[#333] transition-colors"
                          >+</button>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-block px-3 py-1 bg-[#E2FF00]/10 border border-[#E2FF00]/20 rounded-lg text-[#E2FF00] font-black font-mono">
                          {item.final_quantity} {item.material?.unit_of_measure}s
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-[#e0e0e0]">
                        {formatCurrency(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-[#1a1a1a]/50 border-t border-[#2a2a2a] text-center">
              <p className="text-xs text-[#666]">
                Manual adjustments are automatically saved. If the formula calculated 12.3, the system requests 13.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
