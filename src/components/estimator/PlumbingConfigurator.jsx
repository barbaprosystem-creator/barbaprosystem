import { useEstimatorStore } from '../../store/useEstimatorStore';
import Numpad from './Numpad';

const TYPES = [
  { id: 'toilet',     label: 'Toilet Replacement (Labor)',   desc: '$350' },
  { id: 'faucet',     label: 'Faucet Replacement (Labor)',   desc: '$250' },
  { id: 'main_water', label: 'Main Water Line Replacement',  desc: '$3,500' },
  { id: 'sewer',      label: 'Sewer Line Repair',            desc: '$4,500' },
  { id: 'chimney',    label: 'Chimney Flashing Replacement', desc: '$1,500' },
];

export default function PlumbingConfigurator() {
  const { plumbConfig, setPlumbField, plumbAppend, plumbBackspace, plumbClear, addPlumbToReceipt } = useEstimatorStore();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-blue-500 flex-none" />
        <h3 className="text-xl font-bold text-[#f0f0f0]">Configuracion de Plomeria / Chimenea</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-7">
          <div className="space-y-3">
            <p className="text-xs font-bold text-[#888888] uppercase tracking-widest">Tipo</p>
            <div className="grid grid-cols-2 gap-3">
              {TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setPlumbField('type', t.id)}
                  className={`flex flex-col gap-1 px-4 py-4 rounded-2xl border-2 font-semibold transition-all duration-200 text-left
                    ${plumbConfig.type === t.id
                      ? 'bg-blue-500/20 border-blue-400/70 text-blue-300'
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
              {TYPES.find(t => t.id === plumbConfig.type)?.label}
            </p>
            <p className="text-sm text-[#888888]">{plumbConfig.quantity || 0} unidad(es)</p>
          </div>
        </div>

        <Numpad
          value={plumbConfig.quantity}
          unit="Unidades"
          onAppend={plumbAppend}
          onBackspace={plumbBackspace}
          onClear={plumbClear}
          onSubmit={addPlumbToReceipt}
          submitColor="bg-blue-600 hover:bg-blue-500"
        />
      </div>
    </div>
  );
}
