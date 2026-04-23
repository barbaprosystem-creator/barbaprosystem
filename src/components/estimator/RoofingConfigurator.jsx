import React, { useState } from 'react';
import { Home, Factory, CornerDownLeft } from 'lucide-react';

export default function RoofingConfigurator() {
  const [profile, setProfile] = useState('asphalt');
  const [squares, setSquares] = useState('0');

  const appendDigit = (digit) => {
    setSquares(prev => {
      if (prev === '0' && digit !== '.') return digit;
      if (digit === '.' && prev.includes('.')) return prev;
      return prev + digit;
    });
  };

  const clearDigits = () => setSquares('0');

  return (
    <div className="mt-6 admin-card flex flex-col gap-8 w-full p-8">
      <div className="flex items-center gap-4">
        <div className="h-[2px] bg-[var(--accent)]/50 flex-1 rounded-full"></div>
        <span className="text-xs font-bold tracking-[0.2em] text-[var(--accent)]">CONFIGURACIÓN DE TECHO</span>
        <div className="h-[2px] bg-slate-800 flex-1 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Toggles & Profiles */}
        <div className="flex flex-col gap-8">
          <div>
            <label className="text-xs font-bold tracking-widest text-slate-400 mb-4 block">TIPO DE MATERIAL</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setProfile('asphalt')}
                className={`p-5 rounded-xl flex flex-col items-center gap-3 border transition-all active:scale-95 ${
                  profile === 'asphalt' 
                  ? 'bg-[var(--accent)] text-black border-[var(--accent)] shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                  : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                }`}
              >
                <Home size={36} />
                <span className="text-xs font-bold uppercase tracking-widest text-center">Asphalt Shingle</span>
              </button>
              <button 
                onClick={() => setProfile('metal')}
                className={`p-5 rounded-xl flex flex-col items-center gap-3 border transition-all active:scale-95 ${
                  profile === 'metal' 
                  ? 'bg-[var(--accent)] text-black border-[var(--accent)] shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                  : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                }`}
              >
                <Factory size={36} />
                <span className="text-xs font-bold uppercase tracking-widest text-center">Metal Standing Seam</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Custom Numpad for Measurement */}
        <div className="flex flex-col gap-6">
          <div>
            <label className="text-xs font-bold tracking-widest text-slate-400 block mb-3">SQUARES TOTALES</label>
            <div className="bg-slate-900 border border-slate-700/50 p-5 rounded-2xl flex items-center justify-between shadow-inner">
              <span className={`text-5xl font-bold tracking-tight ${squares === '0' ? 'text-slate-600' : 'text-[var(--accent)]'}`}>
                {squares}
              </span>
              <span className="text-slate-500 font-bold">SQ</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button 
                key={num}
                onClick={() => appendDigit(num.toString())}
                className="h-20 bg-slate-800 rounded-xl flex items-center justify-center text-2xl font-semibold text-slate-200 border border-slate-700 hover:bg-slate-700 hover:border-slate-500 active:scale-95 transition-all shadow-sm"
              >
                {num}
              </button>
            ))}
            <button 
              onClick={clearDigits}
              className="h-20 bg-red-950/30 rounded-xl flex items-center justify-center text-xl font-bold text-red-500 border border-red-900/50 hover:bg-red-900/40 active:scale-95 transition-all"
            >
              C
            </button>
            <button 
              onClick={() => appendDigit('0')}
              className="h-20 bg-slate-800 rounded-xl flex items-center justify-center text-2xl font-semibold text-slate-200 border border-slate-700 hover:bg-slate-700 hover:border-slate-500 active:scale-95 transition-all shadow-sm"
            >
              0
            </button>
            <button 
              onClick={() => {
                clearDigits();
              }}
              className="h-20 bg-[var(--accent)] rounded-xl flex items-center justify-center text-black hover:bg-orange-400 active:scale-95 transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)]"
            >
              <CornerDownLeft size={32} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
