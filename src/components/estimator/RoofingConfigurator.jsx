import { useEstimatorStore } from '../../store/useEstimatorStore';
import Numpad from './Numpad';
import SolarScanWidget from './SolarScanWidget';

const MATERIALS = [
  { id: 'architectural', label: 'Arquitectonico',    desc: 'Asphalt, 30-50 anos' },
  { id: 'designer',      label: 'Premium/Designer',  desc: 'Dimension alta, lifetime' },
  { id: 'metal_steel',   label: 'Metal - Acero',     desc: 'Panel standing seam' },
  { id: 'metal_alum',    label: 'Metal - Aluminio',  desc: 'Liviano, anti-corrosion' },
  { id: 'tpo',           label: 'TPO / Flat',        desc: 'Techo plano comercial' },
  { id: 'tile',          label: 'Teja / Tile',       desc: 'Ceramica o concreto' },
];

export default function RoofingConfigurator() {
  const { roofingConfig, setRoofingField, roofingAppend, roofingBackspace, roofingClear, addRoofingToReceipt } = useEstimatorStore();

  return (
    <div className="space-y-8">
      <SolarScanWidget />

      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-amber-400 flex-none" />
        <h3 className="text-xl font-bold text-[#f0f0f0]">Configuracion de Techos</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Options col */}
        <div className="space-y-7">
          <div className="space-y-3">
            <p className="text-xs font-bold text-[#888888] uppercase tracking-widest">Material</p>
            <div className="grid grid-cols-2 gap-3">
              {MATERIALS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setRoofingField('material', m.id)}
                  className={`flex flex-col gap-1 px-4 py-4 rounded-2xl border-2 font-semibold transition-all duration-200 text-left
                    ${roofingConfig.material === m.id
                      ? 'bg-amber-500/20 border-amber-400/70 text-amber-300'
                      : 'bg-[#1a1a1a]/60 border-[#2a2a2a]/40 text-[#888888] hover:border-[#444444] hover:text-[#e0e0e0] hover:bg-[#1a1a1a]'
                    }`}
                >
                  <span className="text-sm font-bold leading-tight">{m.label}</span>
                  <span className="text-[11px] text-[#555555] font-normal">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#0d0d0d]/70 rounded-2xl p-5 border border-[#2a2a2a]/40 space-y-2">
            <p className="text-xs text-[#555555] font-medium uppercase tracking-wider">Vista previa del item</p>
            <p className="text-[#f0f0f0] font-bold text-lg leading-snug">
              Techo - {MATERIALS.find(m => m.id === roofingConfig.material)?.label}
            </p>
            <p className="text-sm text-[#888888]">{roofingConfig.squares || 0} Squares (1 sq = 100 sqft)</p>
          </div>
        </div>

        {/* Numpad */}
        <Numpad
          value={roofingConfig.squares}
          unit="Squares (100 sqft)"
          onAppend={roofingAppend}
          onBackspace={roofingBackspace}
          onClear={roofingClear}
          onSubmit={addRoofingToReceipt}
          submitColor="bg-amber-600 hover:bg-amber-500"
        />
      </div>
    </div>
  );
}

