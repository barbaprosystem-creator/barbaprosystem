import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useEstimatorStore = create((set, get) => ({
  activeCategory: null,
  setActiveCategory: (category) => set({ activeCategory: category }),

  // Pricing Catalog
  prices: [],
  loadingPrices: false,
  fetchPrices: async () => {
    set({ loadingPrices: true });
    const { data, error } = await supabase
      .from('price_catalog')
      .select('*');
    if (!error && data) {
      set({ prices: data, loadingPrices: false });
    } else {
      set({ loadingPrices: false });
      console.error('Error fetching prices', error);
    }
  },

  // Gutter Specific State
  gutterConfig: {
    profile: 'k-style', // 'k-style' | 'half-round'
    size: '5', // '5' | '6' | '7'
    linearFeet: '0',
  },
  
  setGutterProfile: (profile) => set((state) => ({
    gutterConfig: { ...state.gutterConfig, profile }
  })),
  
  setGutterSize: (size) => set((state) => ({
    gutterConfig: { ...state.gutterConfig, size }
  })),

  // Numpad Logic
  appendDigit: (digit) => set((state) => {
    const current = state.gutterConfig.linearFeet;
    if (current === '0' && digit !== '.') {
      return { gutterConfig: { ...state.gutterConfig, linearFeet: digit } };
    }
    // Prevent multiple decimals
    if (digit === '.' && current.includes('.')) return state;
    
    return { gutterConfig: { ...state.gutterConfig, linearFeet: current + digit } };
  }),

  clearDigits: () => set((state) => ({
    gutterConfig: { ...state.gutterConfig, linearFeet: '0' }
  })),

  // Receipt
  receiptItems: [
    {
      id: 1,
      name: 'Labor (Install)',
      details: 'Estimated 6.5 Hours',
      price: 845.00,
      faded: true
    }
  ],

  addToReceipt: () => {
    const { gutterConfig, receiptItems, prices } = get();
    const lf = parseFloat(gutterConfig.linearFeet) || 0;
    if (lf === 0) return;

    // Find the right price from the catalog
    // e.g. look for "5in K-Style Gutter" or fallback to a default if not found
    const searchString = `${gutterConfig.size}in ${gutterConfig.profile === 'k-style' ? 'k-style' : 'half-round'} gutter`;
    const catalogItem = prices.find(p => p.item_name?.toLowerCase().includes(searchString.toLowerCase())) 
                     || prices.find(p => p.category === 'Gutters' && p.item_name?.toLowerCase().includes('gutter'));

    const unitPrice = catalogItem?.unit_price || 12.50; // Fallback to 12.50 if not found in db

    const newItem = {
      id: Date.now(),
      name: `Gutter Run (${gutterConfig.size}" ${gutterConfig.profile === 'k-style' ? 'K-Style' : 'Half-Round'})`,
      details: `${lf} LF @ $${unitPrice.toFixed(2)}/ft`,
      price: lf * unitPrice
    };

    set({ receiptItems: [newItem, ...receiptItems] });
  },

  calculateTotal: () => {
    return get().receiptItems.reduce((acc, item) => acc + item.price, 0);
  }
}));
