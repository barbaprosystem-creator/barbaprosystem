import { useState, useEffect } from 'react';
import { Search, Satellite, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { useEstimatorStore } from '../../store/useEstimatorStore';

export default function SolarScanWidget() {
  const [address, setAddress] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const { setRoofingField } = useEstimatorStore();

  const handleScan = () => {
    if (!address.trim()) return;
    setScanning(true);
    setResult(null);

    // Simulamos la llamada a Google Solar API (2 segundos)
    setTimeout(() => {
      const mockResult = {
        areaSqFt: 3500,
        squares: '35',
        pitch: '6/12',
        confidence: '98%',
      };
      
      setResult(mockResult);
      // Actualizamos el estado del store del configurador
      setRoofingField('squares', mockResult.squares);
      setScanning(false);
    }, 2500);
  };

  return (
    <div className="bg-[#151515] rounded-2xl border border-amber-500/20 overflow-hidden mb-8 relative">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/10 via-amber-400 to-amber-500/10" />

      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Satellite className="text-amber-400" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#f0f0f0] m-0">Google Solar Scan</h3>
            <p className="text-xs text-[#888888] m-0">Estima medidas de techo via satélite</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" size={18} />
            <input 
              type="text" 
              placeholder="Ej: 123 Main St, Louisville, KY" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-[#f0f0f0] text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-[#555]"
            />
          </div>
          <button
            onClick={handleScan}
            disabled={!address.trim() || scanning}
            className="bg-amber-600 hover:bg-amber-500 disabled:bg-[#2a2a2a] disabled:text-[#666] text-white px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center min-w-[140px]"
          >
            {scanning ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Escaneando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search size={16} /> Buscar
              </span>
            )}
          </button>
        </div>

        {/* Scan Animation / Result Area */}
        {scanning && (
          <div className="mt-6 flex flex-col items-center justify-center py-6 border-t border-[#2a2a2a]/40">
            <div className="relative w-16 h-16 mb-4">
              {/* Radar pulse effect */}
              <div className="absolute inset-0 border-2 border-amber-500 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-2 border-2 border-amber-400 rounded-full animate-ping opacity-40" style={{ animationDelay: '300ms' }}></div>
              <div className="absolute inset-0 bg-amber-500/10 rounded-full flex items-center justify-center">
                <Satellite size={28} className="text-amber-400 animate-pulse" />
              </div>
            </div>
            <p className="text-sm font-semibold text-amber-400 animate-pulse">Obteniendo geometría del techo...</p>
          </div>
        )}

        {result && !scanning && (
          <div className="mt-6 border-t border-[#2a2a2a]/40 pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-emerald-400 mb-1">
                  <CheckCircle2 size={16} /> Análisis Satelital Completo
                </p>
                <p className="text-xs text-[#888888]">Los "Squares" se han auto-rellenado en el cotizador.</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#888888] uppercase tracking-wider mb-1">Confianza (IA)</p>
                <p className="text-sm font-bold text-[#f0f0f0]">{result.confidence}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-5">
              <div className="bg-[#0d0d0d] p-3 rounded-xl border border-[#2a2a2a]">
                <p className="text-xs text-[#555] uppercase tracking-wider mb-1">Área Total</p>
                <p className="text-lg font-bold text-[#f0f0f0]">{result.areaSqFt} <span className="text-xs text-[#888]">sq ft</span></p>
              </div>
              <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/30">
                <p className="text-xs text-amber-500/70 uppercase tracking-wider mb-1">Squares (Auto)</p>
                <p className="text-lg font-bold text-amber-400">{result.squares}</p>
              </div>
              <div className="bg-[#0d0d0d] p-3 rounded-xl border border-[#2a2a2a]">
                <p className="text-xs text-[#555] uppercase tracking-wider mb-1">Inclinación (Pitch)</p>
                <p className="text-lg font-bold text-[#f0f0f0]">{result.pitch}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
