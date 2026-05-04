import { useEstimatorStore } from '../../store/useEstimatorStore';
import Numpad from './Numpad';

const TYPES = [
  { id: '2_ton',        label: '2 Ton System (AC+Furnace)', desc: '$6,500' },
  { id: '2.5_ton',      label: '2.5 Ton System',            desc: '$7,000' },
  { id: '3_ton',        label: '3 Ton System',              desc: '$7,500' },
  { id: '3.5_ton',      label: '3.5 Ton System',            desc: '$8,000' },
  { id: '4_ton',        label: '4 Ton System',              desc: '$8,500' },
  { id: '5_ton',        label: '5 Ton System',              desc: '$9,500' },
  { id: 'mini_split',   label: 'Mini-Split (Single Zone)',  desc: '$3,500' },
  { id: 'water_heater', label: 'Water Heater (40 Gal)',     desc: '$1,800' },
];

export default function HVACConfigurator() {
  const { hvacConfig, setHvacField, hvacAppend, hvacBackspace, hvacClear, addHvacToReceipt } = useEstimatorStore();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-cyan-400 flex-none" />
        <h3 className="text-xl font-bold text-[#f0f0f0]">Configuracion de HVAC</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-7">
          <div className="space-y-3">
            <p className="text-xs font-bold text-[#888888] uppercase tracking-widest">Tipo</p>
            <div className="grid grid-cols-2 gap-3">
              {TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setHvacField('type', t.id)}
                  className={`flex flex-col gap-1 px-4 py-4 rounded-2xl border-2 font-semibold transition-all duration-200 text-left
                    ${hvacConfig.type === t.id
                      ? 'bg-cyan-500/20 border-cyan-400/70 text-cyan-300'
                      : 'bg-[#1a1a1a]/60 border-[#2a2a2a]/40 text-[#888888] hover:border-[#444444] hover:text-[#e0e0e0] hover:bg-[#1a1a1a]'
                    }`}
                >
                  <span className="text-sm font-bold leading-tight">{t.label}</span>
                  <span className="text-[11px] text-[#555555] font-normal">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#0d0d0d]/70 rounded-2xl p-5 border border-[#2a2a2a]/40 space-y-2">
            <p className="text-xs text-[#555555] font-medium uppercase tracking-wider">Vista previa del item</p>
            <p className="text-[#f0f0f0] font-bold text-lg leading-snug">
              {TYPES.find(t => t.id === hvacConfig.type)?.label}
            </p>
            <p className="text-sm text-[#888888]">{hvacConfig.quantity || 0} unidad(es)</p>
          </div>
        </div>

        <Numpad
          value={hvacConfig.quantity}
          unit="Unidades"
          onAppend={hvacAppend}
          onBackspace={hvacBackspace}
          onClear={hvacClear}
          onSubmit={addHvacToReceipt}
          submitColor="bg-cyan-600 hover:bg-cyan-500"
        />
      </div>
    </div>
  );
}
