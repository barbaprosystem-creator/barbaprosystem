import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Search, Plus } from 'lucide-react';

const CATEGORIES = ['Todos', 'Roofing', 'Siding', 'Windows', 'Gutters', 'Accessories'];

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('price_catalog')
        .select('*')
        .order('category', { ascending: true });
      setMaterials(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = materials.filter(m => {
    const matchCat = activeCategory === 'Todos' || m.category?.toLowerCase() === activeCategory.toLowerCase();
    const matchSearch = !search || m.item_name?.toLowerCase().includes(search.toLowerCase()) || m.sku?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="admin-page p-6 lg:p-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">CatÃ¡logo de Materiales</h1>
          <p className="text-[#888888]">{filtered.length} productos</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2 bg-[#0d0d0d] border border-[#2a2a2a]/50 rounded-xl px-4 py-2 w-full sm:w-64 focus-within:border-[var(--accent)] transition-colors">
            <Search size={18} className="text-[#555555]" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-600"
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-orange-400 text-black font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.2)] active:scale-95 w-full sm:w-auto justify-center">
            <Plus size={18} /> Agregar
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat 
              ? 'bg-[var(--accent)] text-black shadow-[0_0_10px_rgba(249,115,22,0.2)]' 
              : 'bg-[#1a1a1a]/50 text-[#888888] hover:bg-[#1a1a1a] hover:text-[#c0c0c0] border border-[#2a2a2a]/50'
            }`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#555555] gap-4 admin-card">
          <Package size={40} className="animate-pulse text-slate-700" />
          <p className="text-sm font-medium uppercase tracking-widest">Cargando catÃ¡logo...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#555555] gap-4 admin-card">
          <Package size={48} className="text-slate-700" />
          <p className="text-sm font-medium">No se encontraron materiales.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(item => (
            <div key={item.id} className="admin-card p-6 flex flex-col gap-4 hover:border-[var(--accent)]/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Package size={24} />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-[10px] font-bold tracking-wider text-[var(--accent)] uppercase">{item.category}</span>
                <h3 className="text-base font-bold text-[#e0e0e0] line-clamp-2 leading-tight">{item.item_name}</h3>
                {item.sku && <span className="text-xs text-[#555555] font-medium mt-1 uppercase">SKU: {item.sku}</span>}
              </div>
              <div className="pt-4 border-t border-[#1a1a1a] flex items-end justify-between mt-auto">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#555555] uppercase tracking-widest mb-1">Precio / {item.unit || 'EA'}</span>
                  <span className="text-xl font-bold text-[#e0e0e0]">${(item.unit_price || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

