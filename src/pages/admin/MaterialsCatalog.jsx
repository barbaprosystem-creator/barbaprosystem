import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  PackageSearch, Plus, Search, Edit2, Trash2, Link as LinkIcon, AlertCircle, Settings2, Calculator, Save 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MaterialsCatalog() {
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' or 'recipes'
  const [materials, setMaterials] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  
  const [newMaterial, setNewMaterial] = useState({
    name: '', category: 'Roofing', unit_of_measure: 'Bundle', estimated_price: '', store_url: ''
  });

  const [newRecipe, setNewRecipe] = useState({
    service_type: 'roofing', material_id: '', calculation_variable: 'squares', coverage_per_unit: '', waste_factor_percent: '0'
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'catalog') {
        const { data, error } = await supabase.from('materials_catalog').select('*').order('category', { ascending: true });
        if (!error && data) setMaterials(data);
      } else {
        const { data: recipesData, error: recipesError } = await supabase
          .from('service_material_recipes')
          .select('*, material:materials_catalog(*)');
        if (!recipesError && recipesData) setRecipes(recipesData);
        
        // Also fetch materials for the recipe dropdown
        const { data: matData } = await supabase.from('materials_catalog').select('id, name');
        if (matData) setMaterials(matData);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('materials_catalog').insert([{
        ...newMaterial,
        estimated_price: parseFloat(newMaterial.estimated_price) || 0
      }]);
      if (!error) {
        setIsAddingMaterial(false);
        setNewMaterial({ name: '', category: 'Roofing', unit_of_measure: 'Bundle', estimated_price: '', store_url: '' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRecipe = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('service_material_recipes').insert([{
        ...newRecipe,
        coverage_per_unit: parseFloat(newRecipe.coverage_per_unit) || 1,
        waste_factor_percent: parseFloat(newRecipe.waste_factor_percent) || 0
      }]);
      if (!error) {
        setIsAddingRecipe(false);
        setNewRecipe({ service_type: 'roofing', material_id: '', calculation_variable: 'squares', coverage_per_unit: '', waste_factor_percent: '0' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteMaterial = async (id) => {
    if(!window.confirm("¿Estás seguro de eliminar este material?")) return;
    await supabase.from('materials_catalog').delete().eq('id', id);
    fetchData();
  };

  const deleteRecipe = async (id) => {
    if(!window.confirm("¿Estás seguro de eliminar esta receta?")) return;
    await supabase.from('service_material_recipes').delete().eq('id', id);
    fetchData();
  };

  const filteredMaterials = materials.filter(m => m.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div className="header-content">
          <h1>Gestión de Materiales y Fórmulas</h1>
          <p>Configura el Catálogo de Ferretería y las Fórmulas Automáticas de Materiales.</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => activeTab === 'catalog' ? setIsAddingMaterial(true) : setIsAddingRecipe(true)}
          >
            <Plus size={18} />
            {activeTab === 'catalog' ? 'Añadir Material' : 'Añadir Fórmula'}
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-4 border-b border-white/10 mb-6">
        <button 
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${activeTab === 'catalog' ? 'border-[#E2FF00] text-[#E2FF00]' : 'border-transparent text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('catalog')}
        >
          <div className="flex items-center gap-2">
            <PackageSearch size={18} />
            Catálogo de Materiales
          </div>
        </button>
        <button 
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${activeTab === 'recipes' ? 'border-[#E2FF00] text-[#E2FF00]' : 'border-transparent text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('recipes')}
        >
          <div className="flex items-center gap-2">
            <Settings2 size={18} />
            Fórmulas (Recetas) por Servicio
          </div>
        </button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E2FF00] mr-3"></div>
          Cargando datos...
        </div>
      ) : activeTab === 'catalog' ? (
        <div className="bg-[#18181A] rounded-xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar material..." 
                className="w-full bg-[#2A2A2E] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#E2FF00]"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <span className="text-sm text-gray-400">{filteredMaterials.length} materiales</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Nombre del Material</th>
                  <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Categoría</th>
                  <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Unidad</th>
                  <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Precio Est.</th>
                  <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider text-center">Enlace</th>
                  <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMaterials.map(mat => (
                  <tr key={mat.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-medium text-white">{mat.name}</td>
                    <td className="p-4 text-gray-400">
                      <span className="bg-white/10 px-2 py-1 rounded text-xs">{mat.category}</span>
                    </td>
                    <td className="p-4 text-gray-400">{mat.unit_of_measure}</td>
                    <td className="p-4 text-[#E2FF00] font-mono">${mat.estimated_price?.toFixed(2) || '0.00'}</td>
                    <td className="p-4 text-center">
                      {mat.store_url ? (
                        <a href={mat.store_url} target="_blank" rel="noreferrer" className="inline-flex text-blue-400 hover:text-blue-300">
                          <LinkIcon size={16} />
                        </a>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteMaterial(mat.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredMaterials.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      No hay materiales en el catálogo. Usa el botón "Añadir Material" para empezar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#18181A] rounded-xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-start gap-3">
            <Calculator className="text-[#E2FF00] mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-medium text-white">¿Cómo funcionan las fórmulas?</h3>
              <p className="text-sm text-gray-400 mt-1">El sistema tomará la "Variable" (ej. Squares), la dividirá por la "Cobertura" y le sumará el "Desperdicio" para generar la Orden de Compra.</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Servicio</th>
                  <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Material Requerido</th>
                  <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Variable</th>
                  <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Cobertura (X Und)</th>
                  <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Desperdicio</th>
                  <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recipes.map(recipe => (
                  <tr key={recipe.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <span className="bg-[#E2FF00]/10 text-[#E2FF00] px-2 py-1 rounded text-xs font-medium uppercase tracking-wider">
                        {recipe.service_type}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-white">{recipe.material?.name || 'Material Eliminado'}</td>
                    <td className="p-4 text-gray-400 font-mono text-sm">{recipe.calculation_variable}</td>
                    <td className="p-4 text-white">
                      1 {recipe.material?.unit_of_measure} <span className="text-gray-500">=</span> <span className="text-blue-400 font-mono">{recipe.coverage_per_unit}</span> {recipe.calculation_variable}
                    </td>
                    <td className="p-4 text-red-400 font-mono text-sm">+{recipe.waste_factor_percent}%</td>
                    <td className="p-4 flex justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteRecipe(recipe.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {recipes.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      No hay fórmulas configuradas. Añade una fórmula para automatizar los cálculos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD MATERIAL */}
      <AnimatePresence>
        {isAddingMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#18181A] rounded-xl border border-white/10 w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-5 border-b border-white/10">
                <h3 className="text-lg font-medium text-white">Añadir Nuevo Material</h3>
              </div>
              <form onSubmit={handleAddMaterial} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Nombre</label>
                  <input required type="text" className="w-full bg-[#2A2A2E] border border-white/10 rounded-lg px-3 py-2 text-white" 
                    value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} placeholder="Ej. Quikrete 80lb" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Categoría</label>
                    <select className="w-full bg-[#2A2A2E] border border-white/10 rounded-lg px-3 py-2 text-white"
                      value={newMaterial.category} onChange={e => setNewMaterial({...newMaterial, category: e.target.value})}>
                      <option value="Roofing">Roofing</option>
                      <option value="Fencing">Fencing</option>
                      <option value="Concrete">Concrete</option>
                      <option value="Wood">Wood</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Unidad</label>
                    <select className="w-full bg-[#2A2A2E] border border-white/10 rounded-lg px-3 py-2 text-white"
                      value={newMaterial.unit_of_measure} onChange={e => setNewMaterial({...newMaterial, unit_of_measure: e.target.value})}>
                      <option value="Bundle">Bundle</option>
                      <option value="Piece">Piece (Pieza)</option>
                      <option value="Box">Box (Caja)</option>
                      <option value="Roll">Roll (Rollo)</option>
                      <option value="Bag">Bag (Bolsa)</option>
                      <option value="Bucket">Bucket (Cubeta)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Precio Estimado ($)</label>
                  <input type="number" step="0.01" className="w-full bg-[#2A2A2E] border border-white/10 rounded-lg px-3 py-2 text-white font-mono" 
                    value={newMaterial.estimated_price} onChange={e => setNewMaterial({...newMaterial, estimated_price: e.target.value})} placeholder="34.50" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Enlace a Tienda (Menards/Home Depot)</label>
                  <input type="url" className="w-full bg-[#2A2A2E] border border-white/10 rounded-lg px-3 py-2 text-white" 
                    value={newMaterial.store_url} onChange={e => setNewMaterial({...newMaterial, store_url: e.target.value})} placeholder="https://..." />
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button type="button" onClick={() => setIsAddingMaterial(false)} className="flex-1 py-2 text-gray-400 hover:text-white transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-[#E2FF00] text-black font-semibold rounded-lg hover:bg-[#d4f000] transition-colors flex justify-center items-center gap-2">
                    <Save size={18} /> Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD RECIPE */}
      <AnimatePresence>
        {isAddingRecipe && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#18181A] rounded-xl border border-white/10 w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-5 border-b border-white/10">
                <h3 className="text-lg font-medium text-white">Configurar Fórmula de Cálculo</h3>
              </div>
              <form onSubmit={handleAddRecipe} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Servicio</label>
                  <select required className="w-full bg-[#2A2A2E] border border-white/10 rounded-lg px-3 py-2 text-white"
                    value={newRecipe.service_type} onChange={e => setNewRecipe({...newRecipe, service_type: e.target.value})}>
                    <option value="roofing">Roofing (General)</option>
                    <option value="fencing">Fencing (General)</option>
                    <option value="siding">Siding</option>
                    <option value="gutters">Gutters</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Material a Calcular</label>
                  <select required className="w-full bg-[#2A2A2E] border border-white/10 rounded-lg px-3 py-2 text-white"
                    value={newRecipe.material_id} onChange={e => setNewRecipe({...newRecipe, material_id: e.target.value})}>
                    <option value="">-- Selecciona un Material --</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Se basa en (Variable)</label>
                    <select required className="w-full bg-[#2A2A2E] border border-white/10 rounded-lg px-3 py-2 text-white"
                      value={newRecipe.calculation_variable} onChange={e => setNewRecipe({...newRecipe, calculation_variable: e.target.value})}>
                      <option value="squares">Squares</option>
                      <option value="linear_feet">Linear Feet</option>
                      <option value="posts_count">Posts (Cantidad)</option>
                      <option value="fixed_amount">Fixed (Fijo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Desperdicio (%)</label>
                    <input required type="number" step="1" className="w-full bg-[#2A2A2E] border border-white/10 rounded-lg px-3 py-2 text-white font-mono" 
                      value={newRecipe.waste_factor_percent} onChange={e => setNewRecipe({...newRecipe, waste_factor_percent: e.target.value})} placeholder="10" />
                  </div>
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                  <label className="block text-xs text-blue-400 uppercase tracking-wider mb-2">Regla de Cobertura (La Matemática)</label>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span>1 Unidad cubre</span>
                    <input required type="number" step="0.01" className="w-20 bg-[#2A2A2E] border border-white/10 rounded px-2 py-1 text-white font-mono" 
                      value={newRecipe.coverage_per_unit} onChange={e => setNewRecipe({...newRecipe, coverage_per_unit: e.target.value})} placeholder="0.33" />
                    <span>{newRecipe.calculation_variable}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Ej. Si seleccionaste Squares y Shingles: 1 Bundle cubre 0.33 Squares.</p>
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button type="button" onClick={() => setIsAddingRecipe(false)} className="flex-1 py-2 text-gray-400 hover:text-white transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-[#E2FF00] text-black font-semibold rounded-lg hover:bg-[#d4f000] transition-colors flex justify-center items-center gap-2">
                    <Save size={18} /> Guardar Fórmula
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
