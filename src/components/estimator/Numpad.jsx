import { Delete } from 'lucide-react';

const KEYS = ['7','8','9','4','5','6','1','2','3','.','0','⌫'];

export default function Numpad({ value, unit = 'LF', onAppend, onBackspace, onClear, onSubmit, submitLabel = 'Agregar al Estimado', submitColor = 'bg-orange-500 hover:bg-orange-400' }) {
  return (
    <div className="space-y-5">
      {/* Display */}
      <div className="bg-slate-900 rounded-2xl p-6 text-center border border-slate-700/50">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{unit}</p>
        <p className="text-6xl font-black text-white tabular-nums leading-none">{value}</p>
        <p className="text-sm text-slate-500 mt-2">{unit}</p>
      </div>

      {/* Numpad grid */}
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map(key => (
          <button
            key={key}
            onClick={() => key === '⌫' ? onBackspace() : onAppend(key)}
            className={`h-14 rounded-xl font-bold text-xl transition-all active:scale-95 border
              ${key === '⌫'
                ? 'bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-300 border-slate-600/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700/50'
              }`}
          >
            {key === '⌫' ? <Delete size={20} className="mx-auto" /> : key}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onClear}
          className="flex-none px-5 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 text-sm font-semibold transition-all"
        >
          Limpiar
        </button>
        <button
          onClick={onSubmit}
          className={`flex-1 py-4 rounded-xl text-white font-bold text-base transition-all active:scale-[0.98] shadow-lg ${submitColor}`}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
