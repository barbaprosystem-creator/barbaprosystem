import { useEstimatorStore } from '../../store/useEstimatorStore';
import Numpad from './Numpad';

const TYPES = [
  { id: 'entry_no_glass', label: 'Entry Door (No Glass)', desc: '$1,500 each' },
  { id: 'entry_glass',    label: 'Entry Door (With Glass)', desc: '$2,000 - $3,500 each' },
  { id: 'patio_sliding',  label: 'Patio Sliding Door', desc: '$2,500 each' },
  { id: 'french',         label: 'French Doors', desc: '$4,500 each' },
];

export default function DoorsConfigurator() {
  const { doorsConfig, setDoorsField, doorsAppend, doorsBackspace, doorsClear, addDoorsToReceipt } = useEstimatorStore();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-rose-400 flex-none" />
        <h3 className="text-xl font-bold text-[#f0f0f0]">Configuracion de Puertas</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-7">
          <div className="space-y-3">
            <p className="text-xs font-bold text-[#888888] uppercase tracking-widest">Tipo</p>
            <div className="grid grid-cols-2 gap-3">
              {TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setDoorsField('type', t.id)}
                  className={`flex flex-col gap-1 px-4 py-4 rounded-2xl border-2 font-semibold transition-all duration-200 text-left
                    ${doorsConfig.type === t.id
                      ? 'bg-rose-500/20 border-rose-400/70 text-rose-300'
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
              {TYPES.find(t => t.id === doorsConfig.type)?.label}
            </p>
            <p className="text-sm text-[#888888]">{doorsConfig.quantity || 0} unidad(es)</p>
          </div>
        </div>

        <Numpad
          value={doorsConfig.quantity}
          unit="Unidades"
          onAppend={doorsAppend}
          onBackspace={doorsBackspace}
          onClear={doorsClear}
          onSubmit={addDoorsToReceipt}
          submitColor="bg-rose-600 hover:bg-rose-500"
        />
      </div>
    </div>
  );
}
