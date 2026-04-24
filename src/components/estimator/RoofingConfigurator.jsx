import { useEstimatorStore } from '../../store/useEstimatorStore';
import Numpad from './Numpad';

const MATERIALS = [
  { id: 'architectural', label: 'Arquitectónico',    desc: 'Asphalt, 30-50 años' },
  { id: 'designer',      label: 'Premium/Designer',  desc: 'Dimensión alta, lifetime' },
  { id: 'metal_steel',   label: 'Metal — Acero',     desc: 'Panel standing seam' },
  { id: 'metal_alum',    label: 'Metal — Aluminio',  desc: 'Liviano, anti-corrosión' },
  { id: 'tpo',           label: 'TPO / Flat',        desc: 'Techo plano comercial' },
  { id: 'tile',          label: 'Teja / Tile',       desc: 'Cerámica o concreto' },
];

export default function RoofingConfigurator() {
  const { roofingConfig, setRoofingField, roofingAppend, roofingBackspace, roofingClear, addRoofingToReceipt } = useEstimatorStore();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-amber-400 flex-none" />
        <h3 className="text-xl font-bold text-slate-100">Configuración de Techos</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Options col */}
        <div className="space-y-7">
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Material</p>
            <div className="grid grid-cols-2 gap-3">
              {MATERIALS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setRoofingField('material', m.id)}
                  className={`flex flex-col gap-1 px-4 py-4 rounded-2xl border-2 font-semibold transition-all duration-200 text-left
                    ${roofingConfig.material === m.id
                      ? 'bg-amber-500/20 border-amber-400/70 text-amber-300'
                      : 'bg-slate-800/60 border-slate-700/40 text-slate-400 hover:border-slate-500 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                >
                  <span className="text-sm font-bold leading-tight">{m.label}</span>
                  <span className="text-[11px] text-slate-500 font-normal">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/70 rounded-2xl p-5 border border-slate-700/40 space-y-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Vista previa del ítem</p>
            <p className="text-slate-100 font-bold text-lg leading-snug">
              Techo — {MATERIALS.find(m => m.id === roofingConfig.material)?.label}
            </p>
            <p className="text-sm text-slate-400">{roofingConfig.squares || 0} Squares (1 sq = 100 sqft)</p>
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
