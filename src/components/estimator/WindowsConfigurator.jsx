import { useEstimatorStore } from '../../store/useEstimatorStore';
import Numpad from './Numpad';

const TYPES = [
  { id: 'double_hung', label: 'Double Hung',    desc: 'Más común, dos paneles' },
  { id: 'single_hung', label: 'Single Hung',    desc: 'Panel inferior movible' },
  { id: 'casement',    label: 'Casement',       desc: 'Bisagra lateral, full-open' },
  { id: 'sliding',     label: 'Sliding',        desc: 'Deslizante horizontal' },
  { id: 'picture',     label: 'Picture / Fixed', desc: 'Sin apertura, vista panorámica' },
  { id: 'bay',         label: 'Bay Window',     desc: 'Triple panel en ángulo' },
];

const SIZES = [
  { id: 'small',  label: 'Pequeño',  desc: 'Hasta 24×36"' },
  { id: 'medium', label: 'Mediano',  desc: '28×54" aprox.' },
  { id: 'large',  label: 'Grande',   desc: '36×60" y más' },
];

export default function WindowsConfigurator() {
  const { windowsConfig, setWindowsField, windowsAppend, windowsBackspace, windowsClear, addWindowsToReceipt } = useEstimatorStore();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-purple-400 flex-none" />
        <h3 className="text-xl font-bold text-slate-100">Configuración de Ventanas</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Options col */}
        <div className="space-y-7">
          {/* Type */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo</p>
            <div className="grid grid-cols-2 gap-3">
              {TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setWindowsField('type', t.id)}
                  className={`flex flex-col gap-1 px-4 py-4 rounded-2xl border-2 font-semibold transition-all duration-200 text-left
                    ${windowsConfig.type === t.id
                      ? 'bg-purple-500/20 border-purple-400/70 text-purple-300'
                      : 'bg-slate-800/60 border-slate-700/40 text-slate-400 hover:border-slate-500 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                >
                  <span className="text-sm font-bold leading-tight">{t.label}</span>
                  <span className="text-[11px] text-slate-500 font-normal">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tamaño</p>
            <div className="flex gap-3">
              {SIZES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setWindowsField('size', s.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-4 px-3 rounded-2xl border-2 transition-all duration-200 text-center
                    ${windowsConfig.size === s.id
                      ? 'bg-purple-500/20 border-purple-400/70 text-purple-300'
                      : 'bg-slate-800/60 border-slate-700/40 text-slate-400 hover:border-slate-500 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                >
                  <span className="text-base font-bold leading-tight">{s.label}</span>
                  <span className="text-[10px] text-slate-500 font-normal">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-900/70 rounded-2xl p-5 border border-slate-700/40 space-y-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Vista previa del ítem</p>
            <p className="text-slate-100 font-bold text-lg leading-snug">
              {TYPES.find(t => t.id === windowsConfig.type)?.label}{' '}
              — {SIZES.find(s => s.id === windowsConfig.size)?.label}
            </p>
            <p className="text-sm text-slate-400">{windowsConfig.quantity || 0} unidad(es)</p>
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
