import React from 'react';
import { useEstimatorStore } from '../../store/useEstimatorStore';
import GutterConfigurator from './GutterConfigurator';
import RoofingConfigurator from './RoofingConfigurator';
import SidingConfigurator from './SidingConfigurator';
import WindowsConfigurator from './WindowsConfigurator';
import { Box, Droplets, Hammer, Grid, MapPin } from 'lucide-react';

const CATEGORIES = [
  { id: 'roofing', title: 'Techos', desc: 'Composite & Metal', icon: Box, status: 'LISTO' },
  { id: 'siding', title: 'Siding', desc: 'Vinyl & Plank', icon: Hammer, status: 'LISTO' },
  { id: 'windows', title: 'Ventanas', desc: 'Double Hung / Casement', icon: Grid, status: 'LISTO' },
  { id: 'gutters', title: 'Canales', desc: 'Seamless Aluminum', icon: Droplets, status: 'ACTIVO' },
];

export default function ServiceConfigurator() {
  const { activeCategory, setActiveCategory } = useEstimatorStore();

  const renderConfigurator = () => {
    switch (activeCategory) {
      case 'gutters': return <GutterConfigurator />;
      case 'roofing': return <RoofingConfigurator />;
      case 'siding': return <SidingConfigurator />;
      case 'windows': return <WindowsConfigurator />;
      default: return null;
    }
  };

  return (
    <section className="flex flex-col gap-8 w-full">
      <div className="flex items-center justify-between mb-4 flex-none">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Categorías de Servicio</h2>
          <p className="text-slate-400 text-sm mt-1">Selecciona la categoría para configurar el trabajo</p>
        </div>
        <div className="bg-slate-800/50 rounded-full px-4 py-2 border border-slate-700 flex items-center gap-2">
          <MapPin size={16} className="text-[var(--accent)]" />
          <span className="text-xs font-bold tracking-widest text-slate-300">NUEVO CLIENTE</span>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 gap-4 lg:gap-6 w-full">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.icon;
          return (
            <div 
              key={cat.id}
              onClick={() => setActiveCategory(isActive ? null : cat.id)}
              className={`p-6 rounded-xl transition-all cursor-pointer group active:scale-[0.98] ${
                isActive 
                ? 'bg-slate-800 border-2 border-[var(--accent)] shadow-[0_0_15px_rgba(249,115,22,0.1)]'
                : 'bg-slate-900 border border-slate-700 hover:border-slate-500'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`transition-colors ${
                  isActive ? 'text-[var(--accent)]' : 'text-slate-500 group-hover:text-slate-300'
                }`}>
                  <Icon size={32} />
                </span>
                <span className={`text-[10px] tracking-widest px-2 py-1 rounded font-bold ${
                  isActive ? 'bg-[var(--accent)] text-black' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isActive ? 'ACTIVO' : cat.status}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-1 text-slate-100">{cat.title}</h3>
              <p className="text-xs text-slate-400 uppercase tracking-widest">{cat.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Configurator Panel (Revealed dynamically) */}
      <div className="mt-4">
        {renderConfigurator()}
      </div>
    </section>
  );
}
