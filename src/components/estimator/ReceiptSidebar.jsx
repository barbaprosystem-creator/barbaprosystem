import React from 'react';
import { useEstimatorStore } from '../../store/useEstimatorStore';
import { Send, FileText } from 'lucide-react';

export default function ReceiptSidebar() {
  const { receiptItems, calculateTotal } = useEstimatorStore();

  const subtotal = calculateTotal();
  const tax = subtotal * 0.0825;
  const total = subtotal + tax;

  return (
    <aside className="w-full h-[calc(100vh-8rem)] admin-card flex flex-col p-0 overflow-hidden relative">
      <div className="p-5 border-b border-slate-700/50 bg-slate-800/50 flex justify-between items-center z-10">
        <h2 className="text-lg font-bold text-[var(--accent)] tracking-widest uppercase">Resumen del Estimado</h2>
        <span className="bg-emerald-500/10 text-emerald-400 font-bold tracking-widest text-[10px] px-2 py-1 rounded border border-emerald-500/20">BORRADOR</span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 relative z-10">
        {receiptItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 opacity-50">
            <FileText size={48} />
            <p className="font-bold tracking-[0.2em] text-xs">SIN ARTÍCULOS</p>
          </div>
        ) : (
          receiptItems.map((item) => (
            <div key={item.id} className={`bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl flex justify-between items-center transition-colors ${item.faded ? 'opacity-50' : ''}`}>
              <div>
                <p className="font-bold text-sm tracking-wide mb-1 text-slate-200">{item.name}</p>
                <div className="flex gap-2 text-xs text-slate-400">
                  <span>{item.details}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-[var(--accent)] tracking-tight">${item.price.toFixed(2)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-6 bg-slate-800/80 border-t border-slate-700/50 z-10 relative">
        <div className="flex justify-between text-slate-400 text-sm mb-2 font-bold tracking-widest uppercase">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-400 text-sm mb-4 font-bold tracking-widest uppercase">
          <span>Imps. Est. (8.25%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-end border-t border-slate-700/50 pt-4 mb-6">
          <span className="font-bold tracking-widest text-slate-200">TOTAL</span>
          <span className="text-4xl font-bold text-[var(--accent)] tracking-tight">${total.toFixed(2)}</span>
        </div>

        <button className="w-full bg-[var(--accent)] text-black py-4 rounded-xl font-bold text-sm tracking-widest hover:bg-orange-400 transition-all flex justify-center items-center gap-2 active:scale-[0.98]">
          <Send size={18} />
          GENERAR PROPUESTA
        </button>
      </div>
    </aside>
  );
}
