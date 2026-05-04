import { useEstimatorStore } from '../../store/useEstimatorStore';
import Numpad from './Numpad';

const TYPES = [
  { id: 'vinyl_white', label: 'Vinyl Fence (White, 6FT)', desc: '$55 / lf' },
  { id: 'vinyl_other', label: 'Vinyl Fence (Other, 6FT)', desc: '$75 / lf' },
  { id: 'wood_pine',   label: 'Wood Fence (Pine, 6FT)', desc: '$35 / lf' },
  { id: 'wood_cedar',  label: 'Wood Fence (Cedar, 6FT)', desc: '$55 / lf' },
  { id: 'alum_black',  label: 'Aluminum Fence (Black, 4FT)', desc: '$45 / lf' },
  { id: 'chain_galv',  label: 'Chain Link (Galv, 4FT)', desc: '$25 / lf' },
];

export default function FencesConfigurator() {
  const { fencesConfig, setFencesField, fencesAppend, fencesBackspace, fencesClear, addFencesToReceipt } = useEstimatorStore();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-[#10b981] flex-none" />
        <h3 className="text-xl font-bold text-[#f0f0f0]">Configuracion de Cercas</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-7">
          <div className="space-y-3">
            <p className="text-xs font-bold text-[#888888] uppercase tracking-widest">Tipo</p>
            <div className="grid grid-cols-2 gap-3">
              {TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setFencesField('type', t.id)}
                  className={`flex flex-col gap-1 px-4 py-4 rounded-2xl border-2 font-semibold transition-all duration-200 text-left
                    ${fencesConfig.type === t.id
                      ? 'bg-[#10b981]/20 border-[#10b981]/70 text-[#10b981]'
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
              {TYPES.find(t => t.id === fencesConfig.type)?.label}
            </p>
            <p className="text-sm text-[#888888]">{fencesConfig.lf || 0} Pies Lineales (LF)</p>
          </div>
        </div>

        <Numpad
          value={fencesConfig.lf}
          unit="Pies Lineales (LF)"
          onAppend={fencesAppend}
          onBackspace={fencesBackspace}
          onClear={fencesClear}
          onSubmit={addFencesToReceipt}
          submitColor="bg-[#10b981] hover:bg-[#059669]"
        />
      </div>
    </div>
  );
}
