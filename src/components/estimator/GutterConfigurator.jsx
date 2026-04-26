import { useEstimatorStore } from '../../store/useEstimatorStore';
import Numpad from './Numpad';

const PROFILES = [
  { id: 'k-style',    label: 'K-Style',    desc: 'Mas comun, angulado' },
  { id: 'half-round', label: 'Half-Round',  desc: 'Semicircular, clasico' },
];
const SIZES = [
  { val: '5', label: '5"', desc: 'Residencial estandar' },
  { val: '6', label: '6"', desc: 'Residencial premium' },
  { val: '7', label: '7"', desc: 'Comercial / Grande' },
];

function ProfileBtn({ active, onClick, label, desc }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1.5 py-5 px-4 rounded-2xl border-2 font-semibold transition-all duration-200 text-center
        ${active
          ? 'bg-blue-500/20 border-blue-400/70 text-blue-300'
          : 'bg-[#1a1a1a]/60 border-[#2a2a2a]/40 text-[#888888] hover:border-[#444444] hover:text-[#e0e0e0] hover:bg-[#1a1a1a]'
        }`}
    >
      <span className="text-base font-bold leading-tight">{label}</span>
      {desc && <span className="text-[11px] text-[#555555] font-normal">{desc}</span>}
    </button>
  );
}

function SizeBtn({ active, onClick, label, desc }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-4 px-3 rounded-2xl border-2 font-bold transition-all duration-200 text-center
        ${active
          ? 'bg-blue-500/20 border-blue-400/70 text-blue-300'
          : 'bg-[#1a1a1a]/60 border-[#2a2a2a]/40 text-[#888888] hover:border-[#444444] hover:text-[#e0e0e0] hover:bg-[#1a1a1a]'
        }`}
    >
      <span className="text-xl font-extrabold leading-none">{label}</span>
      {desc && <span className="text-[10px] text-[#555555] font-normal">{desc}</span>}
    </button>
  );
}

export default function GutterConfigurator() {
  const { gutterConfig, setGutterField, gutterAppend, gutterBackspace, gutterClear, addGutterToReceipt } = useEstimatorStore();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-blue-400 flex-none" />
        <h3 className="text-xl font-bold text-[#f0f0f0]">Configuracion de Canales</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Options col */}
        <div className="space-y-7">

          {/* Profile */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-[#888888] uppercase tracking-widest">Perfil</p>
            <div className="flex gap-3">
              {PROFILES.map(p => (
                <ProfileBtn
                  key={p.id}
                  active={gutterConfig.profile === p.id}
                  onClick={() => setGutterField('profile', p.id)}
                  label={p.label}
                  desc={p.desc}
                />
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-[#888888] uppercase tracking-widest">Tamano</p>
            <div className="flex gap-3">
              {SIZES.map(s => (
                <SizeBtn
                  key={s.val}
                  active={gutterConfig.size === s.val}
                  onClick={() => setGutterField('size', s.val)}
                  label={s.label}
                  desc={s.desc}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-[#0d0d0d]/70 rounded-2xl p-5 border border-[#2a2a2a]/40 space-y-2">
            <p className="text-xs text-[#555555] font-medium uppercase tracking-wider">Vista previa del item</p>
            <p className="text-[#f0f0f0] font-bold text-lg leading-snug">
              Canal {gutterConfig.size}" {gutterConfig.profile === 'k-style' ? 'K-Style' : 'Half-Round'}
            </p>
            <p className="text-sm text-[#888888]">{gutterConfig.feet || 0} Pies Lineales</p>
          </div>
        </div>

        {/* Numpad */}
        <Numpad
          value={gutterConfig.feet}
          unit="Pies Lineales (LF)"
          onAppend={gutterAppend}
          onBackspace={gutterBackspace}
          onClear={gutterClear}
          onSubmit={addGutterToReceipt}
          submitColor="bg-blue-600 hover:bg-blue-500"
        />
      </div>
    </div>
  );
}

