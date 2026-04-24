import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const numpadAppend = (current, digit) => {
  if (current === '0' && digit !== '.') return digit;
  if (digit === '.' && current.includes('.')) return current;
  return current + digit;
};
const numpadBackspace = (current) => current.length > 1 ? current.slice(0, -1) : '0';

export const useEstimatorStore = create((set, get) => ({
  activeCategory: null,
  setActiveCategory: (cat) => set(s => ({ activeCategory: s.activeCategory === cat ? null : cat })),

  prices: [],
  loadingPrices: false,
  fetchPrices: async () => {
    set({ loadingPrices: true });
    const { data } = await supabase.from('price_catalog').select('*');
    set({ prices: data || [], loadingPrices: false });
  },

  // Receipt
  receiptItems: [],
  taxRate: 0,
  addItem: (item) => set(s => ({ receiptItems: [{ ...item, id: Date.now() }, ...s.receiptItems] })),
  removeItem: (id) => set(s => ({ receiptItems: s.receiptItems.filter(i => i.id !== id) })),
  clearReceipt: () => set({ receiptItems: [] }),
  setTaxRate: (r) => set({ taxRate: parseFloat(r) || 0 }),
  getSubtotal: () => get().receiptItems.reduce((s, i) => s + i.total, 0),
  getTax: () => get().getSubtotal() * get().taxRate / 100,
  getGrandTotal: () => get().getSubtotal() + get().getTax(),

  // Gutters
  gutterConfig: { profile: 'k-style', size: '5', feet: '0' },
  setGutterField: (f, v) => set(s => ({ gutterConfig: { ...s.gutterConfig, [f]: v } })),
  gutterAppend: (d) => set(s => ({ gutterConfig: { ...s.gutterConfig, feet: numpadAppend(s.gutterConfig.feet, d) } })),
  gutterBackspace: () => set(s => ({ gutterConfig: { ...s.gutterConfig, feet: numpadBackspace(s.gutterConfig.feet) } })),
  gutterClear: () => set(s => ({ gutterConfig: { ...s.gutterConfig, feet: '0' } })),
  addGutterToReceipt: () => {
    const { gutterConfig, prices, addItem } = get();
    const lf = parseFloat(gutterConfig.feet) || 0;
    if (lf <= 0) return;
    const cat = prices.find(p => p.category?.toLowerCase() === 'gutters');
    const unitPrice = cat?.unit_price || cat?.sell_price || 12.50;
    const profileLabel = gutterConfig.profile === 'k-style' ? 'K-Style' : 'Half-Round';
    addItem({ service: 'gutters', name: `Canales ${gutterConfig.size}" ${profileLabel}`, details: `${lf} LF @ $${unitPrice.toFixed(2)}/ft`, quantity: lf, unitPrice, total: lf * unitPrice });
  },

  // Roofing
  roofingConfig: { material: 'architectural', squares: '0' },
  setRoofingField: (f, v) => set(s => ({ roofingConfig: { ...s.roofingConfig, [f]: v } })),
  roofingAppend: (d) => set(s => ({ roofingConfig: { ...s.roofingConfig, squares: numpadAppend(s.roofingConfig.squares, d) } })),
  roofingBackspace: () => set(s => ({ roofingConfig: { ...s.roofingConfig, squares: numpadBackspace(s.roofingConfig.squares) } })),
  roofingClear: () => set(s => ({ roofingConfig: { ...s.roofingConfig, squares: '0' } })),
  addRoofingToReceipt: () => {
    const { roofingConfig, prices, addItem } = get();
    const sq = parseFloat(roofingConfig.squares) || 0;
    if (sq <= 0) return;
    const labels = { architectural: 'Shingles Arquitectonicos', designer: 'Shingles Premium', metal_steel: 'Metal (Acero)', metal_alum: 'Metal (Aluminio)', tpo: 'TPO/Flat', tile: 'Teja/Tile' };
    const cat = prices.find(p => p.category?.toLowerCase() === 'roofing');
    const unitPrice = cat?.unit_price || cat?.sell_price || 350;
    addItem({ service: 'roofing', name: `Techo  -  ${labels[roofingConfig.material]}`, details: `${sq} sq @ $${unitPrice.toFixed(2)}/sq`, quantity: sq, unitPrice, total: sq * unitPrice });
  },

  // Siding
  sidingConfig: { material: 'vinyl', sqft: '0' },
  setSidingField: (f, v) => set(s => ({ sidingConfig: { ...s.sidingConfig, [f]: v } })),
  sidingAppend: (d) => set(s => ({ sidingConfig: { ...s.sidingConfig, sqft: numpadAppend(s.sidingConfig.sqft, d) } })),
  sidingBackspace: () => set(s => ({ sidingConfig: { ...s.sidingConfig, sqft: numpadBackspace(s.sidingConfig.sqft) } })),
  sidingClear: () => set(s => ({ sidingConfig: { ...s.sidingConfig, sqft: '0' } })),
  addSidingToReceipt: () => {
    const { sidingConfig, prices, addItem } = get();
    const sqft = parseFloat(sidingConfig.sqft) || 0;
    if (sqft <= 0) return;
    const labels = { vinyl: 'Vinyl Siding', hardiplank: 'HardiePlank', lp_smart: 'LP SmartSide', wood: 'Madera Natural' };
    const cat = prices.find(p => p.category?.toLowerCase() === 'siding');
    const unitPrice = cat?.unit_price || cat?.sell_price || 8.50;
    addItem({ service: 'siding', name: `Siding  -  ${labels[sidingConfig.material]}`, details: `${sqft} sqft @ $${unitPrice.toFixed(2)}/sqft`, quantity: sqft, unitPrice, total: sqft * unitPrice });
  },

  // Windows
  windowsConfig: { type: 'double_hung', size: 'medium', quantity: '0' },
  setWindowsField: (f, v) => set(s => ({ windowsConfig: { ...s.windowsConfig, [f]: v } })),
  windowsAppend: (d) => set(s => ({ windowsConfig: { ...s.windowsConfig, quantity: numpadAppend(s.windowsConfig.quantity, d) } })),
  windowsBackspace: () => set(s => ({ windowsConfig: { ...s.windowsConfig, quantity: numpadBackspace(s.windowsConfig.quantity) } })),
  windowsClear: () => set(s => ({ windowsConfig: { ...s.windowsConfig, quantity: '0' } })),
  addWindowsToReceipt: () => {
    const { windowsConfig, prices, addItem } = get();
    const qty = parseFloat(windowsConfig.quantity) || 0;
    if (qty <= 0) return;
    const typeLabels = { double_hung: 'Double Hung', single_hung: 'Single Hung', casement: 'Casement', sliding: 'Sliding', picture: 'Picture/Fixed', bay: 'Bay Window' };
    const sizeLabels = { small: 'Pequeno', medium: 'Mediano', large: 'Grande' };
    const cat = prices.find(p => p.category?.toLowerCase() === 'windows');
    const base = cat?.unit_price || cat?.sell_price || 450;
    const mult = { small: 0.8, medium: 1, large: 1.3 }[windowsConfig.size];
    const unitPrice = base * mult;
    addItem({ service: 'windows', name: `Ventana  -  ${typeLabels[windowsConfig.type]}`, details: `${qty} uds (${sizeLabels[windowsConfig.size]}) @ $${unitPrice.toFixed(2)}/ud`, quantity: qty, unitPrice, total: qty * unitPrice });
  },
}));
