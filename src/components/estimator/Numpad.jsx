import { Delete } from 'lucide-react';

const KEYS = ['7','8','9','4','5','6','1','2','3','.','0','DEL'];

export default function Numpad({ value, unit = 'LF', onAppend, onBackspace, onClear, onSubmit, submitLabel = 'Agregar al Estimado', submitColor = 'bg-orange-500 hover:bg-orange-400' }) {
  return (
    <div className="space-y-5">
      {/* Display */}
      <div className="bg-[#0d0d0d] rounded-2xl p-6 text-center border border-[#2a2a2a]/50">
        <p className="text-xs font-bold text-[#555555] uppercase tracking-widest mb-2">{unit}</p>
        <p className="text-6xl font-black text-white tabular-nums leading-none">{value}</p>
        <p className="text-sm text-[#555555] mt-2">{unit}</p>
      </div>

      {/* Numpad grid */}
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map(key => (
          <button
            key={key}
            onClick={() => key === 'DEL' ? onBackspace() : onAppend(key)}
            className={`h-14 rounded-xl font-bold text-xl transition-all active:scale-95 border
              ${key === 'DEL'
                ? 'bg-[#2a2a2a] hover:bg-red-500/20 hover:text-red-400 text-[#c0c0c0] border-[#333333]/50'
                : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#f0f0f0] border-[#2a2a2a]/50'
              }`}
          >
            {key === 'DEL' ? <Delete size={20} className="mx-auto" /> : key}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onClear}
          className="flex-none px-5 py-4 rounded-xl bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a]/50 text-[#c0c0c0] text-sm font-semibold transition-all"
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

