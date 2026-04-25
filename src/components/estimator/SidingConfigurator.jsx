import { useEstimatorStore } from '../../store/useEstimatorStore';
import Numpad from './Numpad';

const MATERIALS = [
  { id: 'vinyl',      label: 'Vinyl Siding',   desc: 'Bajo mantenimiento, durable' },
  { id: 'hardiplank', label: 'HardiePlank',    desc: 'Fibra de cemento, resistente' },
  { id: 'lp_smart',   label: 'LP SmartSide',  desc: 'Engineered wood, premium' },
  { id: 'wood',       label: 'Madera Natural', desc: 'Cedar / pine, clÃ¡sico' },
];

export default function SidingConfigurator() {
  const { sidingConfig, setSidingField, sidingAppend, sidingBackspace, sidingClear, addSidingToReceipt } = useEstimatorStore();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-emerald-400 flex-none" />
        <h3 className="text-xl font-bold text-[#f0f0f0]">Configuracion de Siding</h3>
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
                  onClick={() => setSidingField('material', m.id)}
                  className={`flex flex-col gap-1 px-4 py-4 rounded-2xl border-2 font-semibold transition-all duration-200 text-left
                    ${sidingConfig.material === m.id
                      ? 'bg-emerald-500/20 border-emerald-400/70 text-emerald-300'
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
              Siding - {MATERIALS.find(m => m.id === sidingConfig.material)?.label}
            </p>
            <p className="text-sm text-[#888888]">{sidingConfig.sqft || 0} Square Feet</p>
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

