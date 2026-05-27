import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';
import { Plus, Save, Trash2, Tag, Search, X, Edit2, Check, Sparkles, Loader2 } from 'lucide-react';
import { analyzeMarketPrices } from '../../lib/ai';

const CATEGORIES = ['roofing', 'siding', 'gutters', 'windows', 'fences', 'deck', 'general', 'labor', 'other'];
const UNIT_TYPES  = ['sq', 'linear_ft', 'unit', 'sqft', 'hour', 'each'];

const EMPTY_FORM = {
  category: 'roofing', item_name: '', description: '',
  unit_type: 'sq', sell_price: '',
};

export default function PricingSettings() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');
  const [showAdd, setShowAdd]     = useState(false);
  const [newItem, setNewItem]     = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [analyzingMarket, setAnalyzingMarket] = useState(false);

  // Inline edit state
  const [editId, setEditId]       = useState(null);
  const [editForm, setEditForm]   = useState({});

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from('price_catalog').select('*').order('category').order('item_name');
    if (!error) setItems(data || []);
    setLoading(false);
  }

  async function addItem() {
    if (!newItem.item_name || !newItem.sell_price) return;
    setSaving(true);
    const payload = {
      category: newItem.category,
      item_name: newItem.item_name,
      description: newItem.description,
      unit_type: newItem.unit_type,
      base_cost: 0,
      margin_pct: 0,
      sell_price: parseFloat(newItem.sell_price),
    };
    const { error } = await supabase.from('price_catalog').insert(payload);
    if (!error) {
      setShowAdd(false);
      setNewItem(EMPTY_FORM);
      fetchItems();
    }
    setSaving(false);
  }

  function startEdit(item) {
    setEditId(item.id);
    setEditForm({
      category:    item.category,
      item_name:   item.item_name,
      description: item.description || '',
      unit_type:   item.unit_type,
      sell_price:  String(item.sell_price || 0),
    });
  }

  function cancelEdit() { setEditId(null); setEditForm({}); }

  async function saveEdit() {
    setSaving(true);
    const payload = {
      category: editForm.category,
      item_name: editForm.item_name,
      description: editForm.description,
      unit_type: editForm.unit_type,
      sell_price: parseFloat(editForm.sell_price),
    };
    const { error } = await supabase.from('price_catalog').update(payload).eq('id', editId);
    if (!error) { cancelEdit(); fetchItems(); }
    setSaving(false);
  }

  async function deleteItem(id) {
    if (!confirm('Delete this pricing item?')) return;
    await supabase.from('price_catalog').delete().eq('id', id);
    fetchItems();
  }

  async function toggleConvertUnitAI(id, currentValue) {
    const newValue = !currentValue;
    // Optimistic update
    setItems(prev => prev.map(item => item.id === id ? { ...item, convert_unit_ai: newValue } : item));
    
    const { error } = await supabase
      .from('price_catalog')
      .update({ convert_unit_ai: newValue })
      .eq('id', id);
      
    if (error) {
      // Revert if error
      setItems(prev => prev.map(item => item.id === id ? { ...item, convert_unit_ai: currentValue } : item));
      alert('Error saving conversion setting: ' + error.message);
    }
  }

  async function analyzeMarket() {
    if (items.length === 0) {
      alert('No items to analyze.');
      return;
    }
    if (!confirm('Analyze current market prices using AI? This will take a few seconds.')) return;
    setAnalyzingMarket(true);
    try {
      const marketData = await analyzeMarketPrices(items);
      
      // Update each item in the database
      const promises = Object.entries(marketData).map(async ([id, price]) => {
        // Ensure price is a number
        const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : Number(price);
        
        const { error } = await supabase.from('price_catalog').update({ 
          market_price: isNaN(numPrice) ? null : numPrice, 
          market_price_updated_at: new Date().toISOString() 
        }).eq('id', id);
        
        if (error) throw error;
      });
      
      await Promise.all(promises);
      await fetchItems();
      alert('Market analysis completed successfully.');
    } catch (err) {
      alert('Error analyzing market: ' + err.message);
    } finally {
      setAnalyzingMarket(false);
    }
  }

  const filtered = items.filter(item => {
    if (filter !== 'all' && item.category !== filter) return false;
    if (search && !item.item_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const catCounts = items.reduce((acc, i) => { acc[i.category] = (acc[i.category] || 0) + 1; return acc; }, {});



  return (
    <div className="pricing-page">
      <header className="admin-page-header">
        <div>
          <h1><Tag size={22} /> Pricing</h1>
          <p className="text-muted">Edit your direct selling prices for estimators.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={analyzeMarket} disabled={analyzingMarket} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
            {analyzingMarket ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {analyzingMarket ? 'Analyzing...' : 'Analyze Market (AI)'}
          </button>
          <button className="btn-primary" onClick={() => { setShowAdd(!showAdd); setEditId(null); }}>
            <Plus size={18} /> Add Item
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="pricing-toolbar">
        <div className="pricing-search">
          <Search size={16} />
          <input type="text" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="pricing-filters">
          <button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            All ({items.length})
          </button>
          {CATEGORIES.filter(c => catCounts[c]).map(cat => (
            <button key={cat} className={`filter-chip ${filter === cat ? 'active' : ''}`} onClick={() => setFilter(cat)}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)} ({catCounts[cat]})
            </button>
          ))}
        </div>
      </div>

      {/* Add New Form */}
      {showAdd && (
        <div className="pricing-add-form">
          <div className="pricing-add-header">
            <h3>New Pricing Item</h3>
            <button className="btn-icon" onClick={() => setShowAdd(false)}><X size={16} /></button>
          </div>
          <div className="pricing-form-grid">
            <div className="pricing-form-field">
              <label>Category</label>
              <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="pricing-form-field">
              <label>Item Name *</label>
              <input placeholder="e.g. Shingle 3-Tab" value={newItem.item_name}
                onChange={e => setNewItem({ ...newItem, item_name: e.target.value })} />
            </div>
            <div className="pricing-form-field" style={{ gridColumn: 'span 2' }}>
              <label>Description</label>
              <input placeholder="Optional description..." value={newItem.description}
                onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
            </div>
            <div className="pricing-form-field">
              <label>Unit</label>
              <select value={newItem.unit_type} onChange={e => setNewItem({ ...newItem, unit_type: e.target.value })}>
                {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="pricing-form-field">
              <label>Sale Price ($) *</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={newItem.sell_price}
                onChange={e => setNewItem({ ...newItem, sell_price: e.target.value })} />
            </div>
          </div>
          <div className="pricing-form-actions">
            <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary" onClick={addItem} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="pricing-table-wrap">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>Loading prices...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
            No items found. {items.length === 0 ? 'Add your first item above.' : 'Try another filter.'}
          </div>
        ) : (
          <table className="pricing-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Item / Description</th>
                <th>Unit</th>
                <th>Sale Price</th>
                <th>AI Conv.</th>
                <th>Market (AI)</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                editId === item.id ? (
                  /* ── EDIT ROW ── */
                  <tr key={item.id} className="pricing-row-editing">
                    <td>
                      <select className="pricing-inline-input" value={editForm.category}
                        onChange={e => setEditForm({ ...editForm, category: e.target.value })}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td>
                      <input className="pricing-inline-input" value={editForm.item_name}
                        onChange={e => setEditForm({ ...editForm, item_name: e.target.value })}
                        placeholder="Name" />
                      <input className="pricing-inline-input pricing-desc-input" value={editForm.description}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Description (optional)" />
                    </td>
                    <td>
                      <select className="pricing-inline-input" value={editForm.unit_type}
                        onChange={e => setEditForm({ ...editForm, unit_type: e.target.value })}>
                        {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td>
                      <input className="pricing-inline-input" type="number" min="0" step="0.01"
                        value={editForm.sell_price}
                        onChange={e => setEditForm({ ...editForm, sell_price: e.target.value })} />
                    </td>
                    <td style={{ color: '#888' }}>-</td>
                    <td style={{ color: '#888' }}>-</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon success" onClick={saveEdit} title="Save" disabled={saving}>
                          <Check size={15} />
                        </button>
                        <button className="btn-icon" onClick={cancelEdit} title="Cancel">
                          <X size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* ── VIEW ROW ── */
                  <tr key={item.id}>
                    <td><span className="category-badge">{item.category}</span></td>
                    <td className="item-name-cell">
                      <div className="pricing-item-name">{item.item_name}</div>
                      {item.description && <div className="pricing-item-desc">{item.description}</div>}
                    </td>
                    <td className="unit-type">{item.unit_type}</td>
                    <td className="sell-price" style={{ fontSize: '15px' }}>{formatCurrency(item.sell_price)}</td>
                    <td>
                      <button
                        onClick={() => toggleConvertUnitAI(item.id, item.convert_unit_ai)}
                        title={item.convert_unit_ai ? "Deactivate AI unit conversion" : "Activate automatic unit conversion for the AI"}
                        style={{
                          background: item.convert_unit_ai ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${item.convert_unit_ai ? '#f97316' : '#444'}`,
                          borderRadius: '6px',
                          color: item.convert_unit_ai ? '#f97316' : '#888',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s',
                        }}
                      >
                        <Sparkles size={12} />
                        {item.convert_unit_ai ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      {item.market_price ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                           <span style={{ color: '#c084fc', fontWeight: 'bold' }}>{formatCurrency(item.market_price)}</span>
                           <span style={{ fontSize: '10px', color: '#666' }}>
                             Updated {new Date(item.market_price_updated_at).toLocaleDateString('en-US')}
                           </span>
                        </div>
                      ) : (
                        <span style={{ color: '#555', fontStyle: 'italic', fontSize: '12px' }}>Not analyzed</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon" onClick={() => startEdit(item)} title="Edit">
                          <Edit2 size={15} />
                        </button>
                        <button className="btn-icon danger" onClick={() => deleteItem(item.id)} title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
