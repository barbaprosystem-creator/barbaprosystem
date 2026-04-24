import { useEstimatorStore } from '../../store/useEstimatorStore';
import Numpad from './Numpad';

const MATERIALS = [
  { id: 'vinyl',      label: 'Vinyl Siding',   desc: 'Bajo mantenimiento, durable' },
  { id: 'hardiplank', label: 'HardiePlank',    desc: 'Fibra de cemento, resistente' },
  { id: 'lp_smart',   label: 'LP SmartSide',  desc: 'Engineered wood, premium' },
  { id: 'wood',       label: 'Madera Natural', desc: 'Cedar / pine, clásico' },
];

export default function SidingConfigurator() {
  const { sidingConfig, setSidingField, sidingAppend, sidingBackspace, sidingClear, addSidingToReceipt } = useEstimatorStore();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-emerald-400 flex-none" />
        <h3 className="text-xl font-bold text-slate-100">Configuración de Siding</h3>
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
                  onClick={() => setSidingField('material', m.id)}
                  className={`flex flex-col gap-1 px-4 py-4 rounded-2xl border-2 font-semibold transition-all duration-200 text-left
                    ${sidingConfig.material === m.id
                      ? 'bg-emerald-500/20 border-emerald-400/70 text-emerald-300'
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
              Siding — {MATERIALS.find(m => m.id === sidingConfig.material)?.label}
            </p>
            <p className="text-sm text-slate-400">{sidingConfig.sqft || 0} Square Feet</p>
          </div>
        </div>

        {/* Numpad */}
        <Numpad
          value={sidingConfig.sqft}
          unit="Square Feet"
          onAppend={sidingAppend}
          onBackspace={sidingBackspace}
          onClear={sidingClear}
          onSubmit={addSidingToReceipt}
          submitColor="bg-emerald-600 hover:bg-emerald-500"
        />
      </div>
    </div>
  );
}
