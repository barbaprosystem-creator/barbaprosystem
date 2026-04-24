import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';
import { Plus, Save, Trash2, Tag, Search, Filter } from 'lucide-react';

const CATEGORIES = ['roofing', 'siding', 'gutters', 'windows', 'deck', 'general', 'labor'];
const UNIT_TYPES = ['sq', 'linear_ft', 'unit', 'sqft', 'hour'];

export default function PricingSettings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({
    category: 'roofing',
    item_name: '',
    description: '',
    unit_type: 'sq',
    base_cost: '',
    margin_pct: '30',
  });

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from('price_catalog')
      .select('*')
      .order('category')
      .order('item_name');

    if (!error) setItems(data || []);
    setLoading(false);
  }

  async function addItem() {
    if (!newItem.item_name || !newItem.base_cost) return;

    const { error } = await supabase.from('price_catalog').insert({
      ...newItem,
      base_cost: parseFloat(newItem.base_cost),
      margin_pct: parseFloat(newItem.margin_pct),
    });

    if (!error) {
      setShowAdd(false);
      setNewItem({ category: 'roofing', item_name: '', description: '', unit_type: 'sq', base_cost: '', margin_pct: '30' });
      fetchItems();
    }
  }

  async function updateItem(id, updates) {
    const { error } = await supabase
      .from('price_catalog')
      .update(updates)
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      fetchItems();
    }
  }

  async function deleteItem(id) {
    if (!confirm('Delete this price item?')) return;
    const { error } = await supabase.from('price_catalog').delete().eq('id', id);
    if (!error) fetchItems();
  }

  const filtered = items.filter((item) => {
    if (filter !== 'all' && item.category !== filter) return false;
    if (search && !item.item_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="pricing-page">
      <header className="admin-page-header">
        <div>
          <h1><Tag size={24} /> Price Engine</h1>
          <p className="text-muted">Manage base costs and margins. Salespeople see only the sell price.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={18} /> Add Item
        </button>
      </header>

      {/* Filters */}
      <div className="pricing-toolbar">
        <div className="pricing-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="pricing-filters">
          <button
            className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`filter-chip ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Add New Item Form */}
      {showAdd && (
        <div className="pricing-add-form">
          <h3>New Price Item</h3>
          <div className="pricing-form-grid">
            <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              placeholder="Item name"
              value={newItem.item_name}
              onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
            />
            <input
              placeholder="Description (optional)"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            />
            <select value={newItem.unit_type} onChange={(e) => setNewItem({ ...newItem, unit_type: e.target.value })}>
              {UNIT_TYPES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <input
              type="number"
              placeholder="Base cost ($)"
              value={newItem.base_cost}
              onChange={(e) => setNewItem({ ...newItem, base_cost: e.target.value })}
            />
            <input
              type="number"
              placeholder="Margin %"
              value={newItem.margin_pct}
              onChange={(e) => setNewItem({ ...newItem, margin_pct: e.target.value })}
            />
            <button className="btn-primary" onClick={addItem}>
              <Save size={16} /> Save
            </button>
          </div>
        </div>
      )}

      {/* Price Table */}
      <div className="pricing-table-wrap">
        <table className="pricing-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Item</th>
              <th>Unit</th>
              <th>Base Cost</th>
              <th>Margin</th>
              <th>Sell Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center text-muted">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="7" className="text-center text-muted">No items found. Add your first price item above.</td></tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td><span className="category-badge">{item.category}</span></td>
                  <td className="item-name-cell">
                    <strong>{item.item_name}</strong>
                    {item.description && <small>{item.description}</small>}
                  </td>
                  <td>{item.unit_type}</td>
                  <td>{formatCurrency(item.base_cost)}</td>
                  <td>{item.margin_pct}%</td>
                  <td className="sell-price">{formatCurrency(item.sell_price)}</td>
                  <td>
                    <button className="btn-icon danger" onClick={() => deleteItem(item.id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

