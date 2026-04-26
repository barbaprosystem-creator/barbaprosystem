import { useEstimatorStore } from '../../store/useEstimatorStore';
import Numpad from './Numpad';

const TYPES = [
  { id: 'double_hung', label: 'Double Hung',    desc: 'Mas comun, dos paneles' },
  { id: 'single_hung', label: 'Single Hung',    desc: 'Panel inferior movible' },
  { id: 'casement',    label: 'Casement',       desc: 'Bisagra lateral, full-open' },
  { id: 'sliding',     label: 'Sliding',        desc: 'Deslizante horizontal' },
  { id: 'picture',     label: 'Picture / Fixed', desc: 'Sin apertura, vista panoramica' },
  { id: 'bay',         label: 'Bay Window',     desc: 'Triple panel en angulo' },
];

const SIZES = [
  { id: 'small',  label: 'Pequeno',  desc: 'Hasta 24" - 36"' },
  { id: 'medium', label: 'Mediano',  desc: '28" - 54" aprox.' },
  { id: 'large',  label: 'Grande',   desc: '36" - 60" y mas' },
];

export default function WindowsConfigurator() {
  const { windowsConfig, setWindowsField, windowsAppend, windowsBackspace, windowsClear, addWindowsToReceipt } = useEstimatorStore();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-purple-400 flex-none" />
        <h3 className="text-xl font-bold text-[#f0f0f0]">Configuracion de Ventanas</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Options col */}
        <div className="space-y-7">
          {/* Type */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-[#888888] uppercase tracking-widest">Tipo</p>
            <div className="grid grid-cols-2 gap-3">
              {TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setWindowsField('type', t.id)}
                  className={`flex flex-col gap-1 px-4 py-4 rounded-2xl border-2 font-semibold transition-all duration-200 text-left
                    ${windowsConfig.type === t.id
                      ? 'bg-purple-500/20 border-purple-400/70 text-purple-300'
                      : 'bg-[#1a1a1a]/60 border-[#2a2a2a]/40 text-[#888888] hover:border-[#444444] hover:text-[#e0e0e0] hover:bg-[#1a1a1a]'
                    }`}
                >
                  <span className="text-sm font-bold leading-tight">{t.label}</span>
                  <span className="text-[11px] text-[#555555] font-normal">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-[#888888] uppercase tracking-widest">Tamano</p>
            <div className="flex gap-3">
              {SIZES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setWindowsField('size', s.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-4 px-3 rounded-2xl border-2 transition-all duration-200 text-center
                    ${windowsConfig.size === s.id
                      ? 'bg-purple-500/20 border-purple-400/70 text-purple-300'
                      : 'bg-[#1a1a1a]/60 border-[#2a2a2a]/40 text-[#888888] hover:border-[#444444] hover:text-[#e0e0e0] hover:bg-[#1a1a1a]'
                    }`}
                >
                  <span className="text-base font-bold leading-tight">{s.label}</span>
                  <span className="text-[10px] text-[#555555] font-normal">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-[#0d0d0d]/70 rounded-2xl p-5 border border-[#2a2a2a]/40 space-y-2">
            <p className="text-xs text-[#555555] font-medium uppercase tracking-wider">Vista previa del item</p>
            <p className="text-[#f0f0f0] font-bold text-lg leading-snug">
              {TYPES.find(t => t.id === windowsConfig.type)?.label}{' '}
              - {SIZES.find(s => s.id === windowsConfig.size)?.label}
            </p>
            <p className="text-sm text-[#888888]">{windowsConfig.quantity || 0} unidad(es)</p>
          </div>
        </div>

        {/* Numpad */}
        <Numpad
          value={windowsConfig.quantity}
          unit="Unidades"
          onAppend={windowsAppend}
          onBackspace={windowsBackspace}
          onClear={windowsClear}
          onSubmit={addWindowsToReceipt}
          submitColor="bg-purple-600 hover:bg-purple-500"
        />
      </div>
    </div>
  );
}

