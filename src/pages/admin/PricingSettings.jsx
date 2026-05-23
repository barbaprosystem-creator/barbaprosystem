import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';
import { Plus, Save, Trash2, Tag, Search, X, Edit2, Check } from 'lucide-react';

const CATEGORIES = ['roofing', 'siding', 'gutters', 'windows', 'fences', 'deck', 'general', 'labor', 'other'];
const UNIT_TYPES  = ['sq', 'linear_ft', 'unit', 'sqft', 'hour', 'each'];

const EMPTY_FORM = {
  category: 'roofing', item_name: '', description: '',
  unit_type: 'sq', base_cost: '', margin_pct: '30',
};

function calcSellPrice(base, margin) {
  const b = parseFloat(base)   || 0;
  const m = parseFloat(margin) || 0;
  return b > 0 ? b / (1 - m / 100) : 0;
}

export default function PricingSettings() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');
  const [showAdd, setShowAdd]     = useState(false);
  const [newItem, setNewItem]     = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

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
    if (!newItem.item_name || !newItem.base_cost) return;
    setSaving(true);
    const payload = {
      ...newItem,
      base_cost:  parseFloat(newItem.base_cost),
      margin_pct: parseFloat(newItem.margin_pct),
      sell_price: calcSellPrice(newItem.base_cost, newItem.margin_pct),
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
      base_cost:   String(item.base_cost),
      margin_pct:  String(item.margin_pct),
    });
  }

  function cancelEdit() { setEditId(null); setEditForm({}); }

  async function saveEdit() {
    setSaving(true);
    const payload = {
      ...editForm,
      base_cost:  parseFloat(editForm.base_cost),
      margin_pct: parseFloat(editForm.margin_pct),
      sell_price: calcSellPrice(editForm.base_cost, editForm.margin_pct),
    };
    const { error } = await supabase.from('price_catalog').update(payload).eq('id', editId);
    if (!error) { cancelEdit(); fetchItems(); }
    setSaving(false);
  }

  async function deleteItem(id) {
    if (!confirm('¿Eliminar este ítem de precios?')) return;
    await supabase.from('price_catalog').delete().eq('id', id);
    fetchItems();
  }

  const filtered = items.filter(item => {
    if (filter !== 'all' && item.category !== filter) return false;
    if (search && !item.item_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const catCounts = items.reduce((acc, i) => { acc[i.category] = (acc[i.category] || 0) + 1; return acc; }, {});

  // Computed sell price preview
  const previewSell = calcSellPrice(editForm.base_cost, editForm.margin_pct);

  return (
    <div className="pricing-page">
      <header className="admin-page-header">
        <div>
          <h1><Tag size={22} /> Motor de Precios</h1>
          <p className="text-muted">Edita costos base, márgenes y precios de venta. Los vendedores solo ven el precio final.</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowAdd(!showAdd); setEditId(null); }}>
          <Plus size={18} /> Agregar Ítem
        </button>
      </header>

      {/* Filters */}
      <div className="pricing-toolbar">
        <div className="pricing-search">
          <Search size={16} />
          <input type="text" placeholder="Buscar ítems..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="pricing-filters">
          <button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            Todos ({items.length})
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
            <h3>Nuevo Ítem de Precio</h3>
            <button className="btn-icon" onClick={() => setShowAdd(false)}><X size={16} /></button>
          </div>
          <div className="pricing-form-grid">
            <div className="pricing-form-field">
              <label>Categoría</label>
              <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="pricing-form-field">
              <label>Nombre del Ítem *</label>
              <input placeholder="ej: Shingle 3-Tab" value={newItem.item_name}
                onChange={e => setNewItem({ ...newItem, item_name: e.target.value })} />
            </div>
            <div className="pricing-form-field" style={{ gridColumn: 'span 2' }}>
              <label>Descripción</label>
              <input placeholder="Descripción opcional..." value={newItem.description}
                onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
            </div>
            <div className="pricing-form-field">
              <label>Unidad</label>
              <select value={newItem.unit_type} onChange={e => setNewItem({ ...newItem, unit_type: e.target.value })}>
                {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="pricing-form-field">
              <label>Costo Base ($) *</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={newItem.base_cost}
                onChange={e => setNewItem({ ...newItem, base_cost: e.target.value })} />
            </div>
            <div className="pricing-form-field">
              <label>Margen (%)</label>
              <input type="number" min="0" max="90" placeholder="30" value={newItem.margin_pct}
                onChange={e => setNewItem({ ...newItem, margin_pct: e.target.value })} />
            </div>
            <div className="pricing-form-field">
              <label>Precio de Venta (preview)</label>
              <div className="pricing-sell-preview">{formatCurrency(calcSellPrice(newItem.base_cost, newItem.margin_pct))}</div>
            </div>
          </div>
          <div className="pricing-form-actions">
            <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancelar</button>
            <button className="btn-primary" onClick={addItem} disabled={saving}>
              <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Ítem'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="pricing-table-wrap">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>Cargando precios...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
            No se encontraron ítems. {items.length === 0 ? 'Agrega tu primer ítem arriba.' : 'Intenta otro filtro.'}
          </div>
        ) : (
          <table className="pricing-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Ítem / Descripción</th>
                <th>Unidad</th>
                <th>Costo Base</th>
                <th>Margen</th>
                <th>Precio Venta</th>
                <th style={{ width: 100 }}>Acciones</th>
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
                        placeholder="Nombre" />
                      <input className="pricing-inline-input pricing-desc-input" value={editForm.description}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Descripción (opcional)" />
                    </td>
                    <td>
                      <select className="pricing-inline-input" value={editForm.unit_type}
                        onChange={e => setEditForm({ ...editForm, unit_type: e.target.value })}>
                        {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td>
                      <input className="pricing-inline-input" type="number" min="0" step="0.01"
                        value={editForm.base_cost}
                        onChange={e => setEditForm({ ...editForm, base_cost: e.target.value })} />
                    </td>
                    <td>
                      <input className="pricing-inline-input" type="number" min="0" max="90"
                        value={editForm.margin_pct}
                        onChange={e => setEditForm({ ...editForm, margin_pct: e.target.value })} />
                      <span style={{ color: '#666', fontSize: 11 }}>%</span>
                    </td>
                    <td className="sell-price">{formatCurrency(previewSell)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon success" onClick={saveEdit} title="Guardar" disabled={saving}>
                          <Check size={15} />
                        </button>
                        <button className="btn-icon" onClick={cancelEdit} title="Cancelar">
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
                      <strong>{item.item_name}</strong>
                      {item.description && <small>{item.description}</small>}
                    </td>
                    <td>{item.unit_type}</td>
                    <td>{formatCurrency(item.base_cost)}</td>
                    <td>{item.margin_pct}%</td>
                    <td className="sell-price">{formatCurrency(item.sell_price || calcSellPrice(item.base_cost, item.margin_pct))}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon" onClick={() => startEdit(item)} title="Editar">
                          <Edit2 size={15} />
                        </button>
                        <button className="btn-icon danger" onClick={() => deleteItem(item.id)} title="Eliminar">
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
