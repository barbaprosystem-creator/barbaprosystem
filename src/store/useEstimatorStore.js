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

  // Editing & Selection State
  selectedContactId: '',
  setSelectedContactId: (id) => set({ selectedContactId: id }),
  editingEstimateId: null,
  setEditingEstimateId: (id) => set({ editingEstimateId: id }),

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
  gutterConfig: { profile: '5-inch', size: '5', feet: '0' },
  setGutterField: (f, v) => set(s => ({ gutterConfig: { ...s.gutterConfig, [f]: v } })),
  gutterAppend: (d) => set(s => ({ gutterConfig: { ...s.gutterConfig, feet: numpadAppend(s.gutterConfig.feet, d) } })),
  gutterBackspace: () => set(s => ({ gutterConfig: { ...s.gutterConfig, feet: numpadBackspace(s.gutterConfig.feet) } })),
  gutterClear: () => set(s => ({ gutterConfig: { ...s.gutterConfig, feet: '0' } })),
  addGutterToReceipt: () => {
    const { gutterConfig, addItem } = get();
    const lf = parseFloat(gutterConfig.feet) || 0;
    if (lf <= 0) return;
    
    let unitPrice = 15.00; // Base: 5"/6" Gutters & Downspouts
    let nameLabel = 'Gutters & Downspouts';
    
    if (gutterConfig.profile === 'guard') {
      unitPrice = 8.00;
      nameLabel = 'Gutter Guard';
    } else if (gutterConfig.profile === 'soffit') {
      unitPrice = 18.00;
      nameLabel = 'Vinyl Soffit';
    } else if (gutterConfig.profile === 'fascia') {
      unitPrice = 18.00;
      nameLabel = 'Metal Wrapped Fascia';
    } else if (gutterConfig.profile === 'porch') {
      unitPrice = 35.00;
      nameLabel = 'Vinyl Porch';
    }
    
    addItem({ service: 'gutters', name: `${nameLabel}`, details: `${lf} LF @ $${unitPrice.toFixed(2)}/ft`, quantity: lf, unitPrice, total: lf * unitPrice });
  },

  // Roofing
  roofingConfig: { material: 'asphalt', squares: '0' },
  setRoofingField: (f, v) => set(s => ({ roofingConfig: { ...s.roofingConfig, [f]: v } })),
  roofingAppend: (d) => set(s => ({ roofingConfig: { ...s.roofingConfig, squares: numpadAppend(s.roofingConfig.squares, d) } })),
  roofingBackspace: () => set(s => ({ roofingConfig: { ...s.roofingConfig, squares: numpadBackspace(s.roofingConfig.squares) } })),
  roofingClear: () => set(s => ({ roofingConfig: { ...s.roofingConfig, squares: '0' } })),
  addRoofingToReceipt: () => {
    const { roofingConfig, addItem } = get();
    const inputSq = parseFloat(roofingConfig.squares) || 0;
    if (inputSq <= 0) return;
    
    // Auto-add 2 extra squares for roofing as requested
    const sq = inputSq + 2;
    
    const labels = { 
      asphalt: 'Asphalt Roof', 
      asphalt_ins: 'Asphalt Roof (Insurance Jobs)', 
      metal: 'Metal Roof (Any Color)', 
      tpo: 'TPO Roof',
      plywood: 'Plywood Replacement'
    };
    const prices = { asphalt: 350, asphalt_ins: 400, metal: 1000, tpo: 1200, plywood: 90 };
    
    const unitPrice = prices[roofingConfig.material] || 350;
    
    // Plywood is per sheet, others are per SQ
    const unitLabel = roofingConfig.material === 'plywood' ? 'sheet' : 'SQ';
    const detailStr = roofingConfig.material === 'plywood' 
      ? `${inputSq} sheets @ $${unitPrice.toFixed(2)}/sheet`
      : `${sq} SQ (Incluye 2 SQ extra) @ $${unitPrice.toFixed(2)}/SQ`;
      
    const quantity = roofingConfig.material === 'plywood' ? inputSq : sq;
    
    addItem({ service: 'roofing', name: `Techo - ${labels[roofingConfig.material]}`, details: detailStr, quantity, unitPrice, total: quantity * unitPrice });
  },

  // Siding
  sidingConfig: { material: 'vinyl_horiz', sqft: '0' },
  setSidingField: (f, v) => set(s => ({ sidingConfig: { ...s.sidingConfig, [f]: v } })),
  sidingAppend: (d) => set(s => ({ sidingConfig: { ...s.sidingConfig, sqft: numpadAppend(s.sidingConfig.sqft, d) } })),
  sidingBackspace: () => set(s => ({ sidingConfig: { ...s.sidingConfig, sqft: numpadBackspace(s.sidingConfig.sqft) } })),
  sidingClear: () => set(s => ({ sidingConfig: { ...s.sidingConfig, sqft: '0' } })),
  addSidingToReceipt: () => {
    const { sidingConfig, addItem } = get();
    const sqft = parseFloat(sidingConfig.sqft) || 0;
    if (sqft <= 0) return;
    
    const labels = { 
      vinyl_horiz: 'Vinyl Siding - Horizontal', 
      vinyl_vert: 'Vinyl Siding - Vertical', 
      hardie: 'Hardie Board (Fiber Cement)', 
      wood: 'Wood Siding' 
    };
    const sqPrices = { vinyl_horiz: 580, vinyl_vert: 850, hardie: 1500, wood: 2000 };
    
    const pricePerSq = sqPrices[sidingConfig.material] || 580;
    const squares = sqft / 100;
    const total = squares * pricePerSq;
    
    addItem({ service: 'siding', name: `Siding - ${labels[sidingConfig.material]}`, details: `${sqft} sqft (${squares.toFixed(2)} SQ) @ $${pricePerSq.toFixed(2)}/SQ`, quantity: squares, unitPrice: pricePerSq, total });
  },

  // Windows
  windowsConfig: { type: 'vinyl_white', size: 'standard', quantity: '0' },
  setWindowsField: (f, v) => set(s => ({ windowsConfig: { ...s.windowsConfig, [f]: v } })),
  windowsAppend: (d) => set(s => ({ windowsConfig: { ...s.windowsConfig, quantity: numpadAppend(s.windowsConfig.quantity, d) } })),
  windowsBackspace: () => set(s => ({ windowsConfig: { ...s.windowsConfig, quantity: numpadBackspace(s.windowsConfig.quantity) } })),
  windowsClear: () => set(s => ({ windowsConfig: { ...s.windowsConfig, quantity: '0' } })),
  addWindowsToReceipt: () => {
    const { windowsConfig, addItem } = get();
    const qty = parseFloat(windowsConfig.quantity) || 0;
    if (qty <= 0) return;
    
    const typeLabels = { 
      vinyl_white: 'Vinyl White', 
      vinyl_sand: 'Vinyl Sand', 
      vinyl_black: 'Vinyl Black', 
      basement_white: 'Basement White', 
      basement_other: 'Basement Other Color', 
      basement_egress: 'Basement Egress' 
    };
    const prices = { 
      vinyl_white: 400, vinyl_sand: 750, vinyl_black: 950, 
      basement_white: 400, basement_other: 650, basement_egress: 5800 
    };
    
    const unitPrice = prices[windowsConfig.type] || 400;
    
    addItem({ service: 'windows', name: `Ventana - ${typeLabels[windowsConfig.type]}`, details: `${qty} uds @ $${unitPrice.toFixed(2)}/ud`, quantity: qty, unitPrice, total: qty * unitPrice });
  },
  // Doors
  doorsConfig: { type: 'entry_no_glass', quantity: '0' },
  setDoorsField: (f, v) => set(s => ({ doorsConfig: { ...s.doorsConfig, [f]: v } })),
  doorsAppend: (d) => set(s => ({ doorsConfig: { ...s.doorsConfig, quantity: numpadAppend(s.doorsConfig.quantity, d) } })),
  doorsBackspace: () => set(s => ({ doorsConfig: { ...s.doorsConfig, quantity: numpadBackspace(s.doorsConfig.quantity) } })),
  doorsClear: () => set(s => ({ doorsConfig: { ...s.doorsConfig, quantity: '0' } })),
  addDoorsToReceipt: () => {
    const { doorsConfig, addItem } = get();
    const qty = parseFloat(doorsConfig.quantity) || 0;
    if (qty <= 0) return;
    
    const typeLabels = { 
      entry_no_glass: 'Entry Door (No Glass)', 
      entry_glass: 'Entry Door (With Glass)', 
      patio_sliding: 'Patio Sliding Door', 
      french: 'French Doors' 
    };
    const prices = { 
      entry_no_glass: 1500, entry_glass: 2500, patio_sliding: 2500, french: 4500 
    };
    
    const unitPrice = prices[doorsConfig.type] || 1500;
    addItem({ service: 'doors', name: `Puerta - ${typeLabels[doorsConfig.type]}`, details: `${qty} uds @ $${unitPrice.toFixed(2)}/ud`, quantity: qty, unitPrice, total: qty * unitPrice });
  },

  // Fences
  fencesConfig: { type: 'vinyl_white', lf: '0' },
  setFencesField: (f, v) => set(s => ({ fencesConfig: { ...s.fencesConfig, [f]: v } })),
  fencesAppend: (d) => set(s => ({ fencesConfig: { ...s.fencesConfig, lf: numpadAppend(s.fencesConfig.lf, d) } })),
  fencesBackspace: () => set(s => ({ fencesConfig: { ...s.fencesConfig, lf: numpadBackspace(s.fencesConfig.lf) } })),
  fencesClear: () => set(s => ({ fencesConfig: { ...s.fencesConfig, lf: '0' } })),
  addFencesToReceipt: () => {
    const { fencesConfig, addItem } = get();
    const lf = parseFloat(fencesConfig.lf) || 0;
    if (lf <= 0) return;
    
    const typeLabels = { 
      vinyl_white: 'Vinyl Fence (White, 6FT)', 
      vinyl_other: 'Vinyl Fence (Other, 6FT)', 
      wood_pine: 'Wood Fence (Pine, 6FT)', 
      wood_cedar: 'Wood Fence (Cedar, 6FT)',
      alum_black: 'Aluminum Fence (Black, 4FT)',
      chain_galv: 'Chain Link (Galvanized, 4FT)'
    };
    const prices = { 
      vinyl_white: 55, vinyl_other: 75, wood_pine: 35, wood_cedar: 55, alum_black: 45, chain_galv: 25
    };
    
    const unitPrice = prices[fencesConfig.type] || 55;
    addItem({ service: 'fences', name: `Cerca - ${typeLabels[fencesConfig.type]}`, details: `${lf} LF @ $${unitPrice.toFixed(2)}/ft`, quantity: lf, unitPrice, total: lf * unitPrice });
  },

  // HVAC
  hvacConfig: { type: '2_ton', quantity: '0' },
  setHvacField: (f, v) => set(s => ({ hvacConfig: { ...s.hvacConfig, [f]: v } })),
  hvacAppend: (d) => set(s => ({ hvacConfig: { ...s.hvacConfig, quantity: numpadAppend(s.hvacConfig.quantity, d) } })),
  hvacBackspace: () => set(s => ({ hvacConfig: { ...s.hvacConfig, quantity: numpadBackspace(s.hvacConfig.quantity) } })),
  hvacClear: () => set(s => ({ hvacConfig: { ...s.hvacConfig, quantity: '0' } })),
  addHvacToReceipt: () => {
    const { hvacConfig, addItem } = get();
    const qty = parseFloat(hvacConfig.quantity) || 0;
    if (qty <= 0) return;
    
    const typeLabels = { 
      '2_ton': '2 Ton System (AC + Furnace)', 
      '2.5_ton': '2.5 Ton System', 
      '3_ton': '3 Ton System', 
      '3.5_ton': '3.5 Ton System',
      '4_ton': '4 Ton System',
      '5_ton': '5 Ton System',
      'mini_split': 'Mini-Split (Single Zone)',
      'water_heater': 'Water Heater (40 Gal)'
    };
    const prices = { 
      '2_ton': 6500, '2.5_ton': 7000, '3_ton': 7500, '3.5_ton': 8000, '4_ton': 8500, '5_ton': 9500, 'mini_split': 3500, 'water_heater': 1800
    };
    
    const unitPrice = prices[hvacConfig.type] || 6500;
    addItem({ service: 'hvac', name: `HVAC - ${typeLabels[hvacConfig.type]}`, details: `${qty} uds @ $${unitPrice.toFixed(2)}/ud`, quantity: qty, unitPrice, total: qty * unitPrice });
  },

  // Plumbing & Chimney
  plumbConfig: { type: 'toilet', quantity: '0' },
  setPlumbField: (f, v) => set(s => ({ plumbConfig: { ...s.plumbConfig, [f]: v } })),
  plumbAppend: (d) => set(s => ({ plumbConfig: { ...s.plumbConfig, quantity: numpadAppend(s.plumbConfig.quantity, d) } })),
  plumbBackspace: () => set(s => ({ plumbConfig: { ...s.plumbConfig, quantity: numpadBackspace(s.plumbConfig.quantity) } })),
  plumbClear: () => set(s => ({ plumbConfig: { ...s.plumbConfig, quantity: '0' } })),
  addPlumbToReceipt: () => {
    const { plumbConfig, addItem } = get();
    const qty = parseFloat(plumbConfig.quantity) || 0;
    if (qty <= 0) return;
    
    const typeLabels = { 
      toilet: 'Toilet Replacement (Labor)', 
      faucet: 'Faucet Replacement (Labor)', 
      main_water: 'Main Water Line Replacement', 
      sewer: 'Sewer Line Repair',
      chimney: 'Chimney Flashing Replacement'
    };
    const prices = { 
      toilet: 350, faucet: 250, main_water: 3500, sewer: 4500, chimney: 1500
    };
    
    const unitPrice = prices[plumbConfig.type] || 350;
    addItem({ service: 'plumbing', name: `Plumbing/Ext - ${typeLabels[plumbConfig.type]}`, details: `${qty} uds @ $${unitPrice.toFixed(2)}/ud`, quantity: qty, unitPrice, total: qty * unitPrice });
  },

  loadEstimate: async (id) => {
    try {
      const { data: estimate, error: estError } = await supabase
        .from('estimates')
        .select('*')
        .eq('id', id)
        .single();
      
      if (estError) throw estError;
      
      const { data: items, error: itemsError } = await supabase
        .from('estimate_items')
        .select('*')
        .eq('estimate_id', id);
        
      if (itemsError) throw itemsError;
      
      const mappedItems = (items || []).map(item => ({
        id: item.id,
        service: item.service_type,
        name: item.description,
        details: item.details,
        quantity: parseFloat(item.quantity) || 1,
        unitPrice: parseFloat(item.unit_price) || 0,
        total: parseFloat(item.total) || 0
      }));
      
      set({
        editingEstimateId: estimate.id,
        selectedContactId: estimate.contact_id || '',
        receiptItems: mappedItems,
        taxRate: 0
      });
      
      return estimate;
    } catch (err) {
      console.error('Error loading estimate:', err);
      throw err;
    }
  },
}));
