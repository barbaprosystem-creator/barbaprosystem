import { useEstimatorStore } from '../../store/useEstimatorStore';
import GutterConfigurator from './GutterConfigurator';
import RoofingConfigurator from './RoofingConfigurator';
import SidingConfigurator from './SidingConfigurator';
import WindowsConfigurator from './WindowsConfigurator';
import { Droplets, Home, Layers, AppWindow, ChevronDown, ChevronUp, Tag } from 'lucide-react';

const SERVICES = [
  {
    id: 'roofing', label: 'Roofing', sub: 'Techos & Shingles',
    icon: '🏠', color: '#f59e0b',
    priceNote: 'precio por sq', unit: 'sq',
  },
  {
    id: 'siding', label: 'Siding', sub: 'Vinyl & Fiber Cement',
    icon: '🏗️', color: '#10b981',
    priceNote: 'precio por sq ft', unit: 'sqft',
  },
  {
    id: 'windows', label: 'Windows', sub: 'Ventanas & Instalación',
    icon: '🪟', color: '#8b5cf6',
    priceNote: 'precio por unidad', unit: 'ud',
  },
  {
    id: 'gutters', label: 'Gutters', sub: 'Canaletas & Bajantes',
    icon: '💧', color: '#3b82f6',
    priceNote: 'precio por pie lineal', unit: 'LF',
  },
];

const CONFIGURATORS = {
  roofing: <RoofingConfigurator />,
  siding:  <SidingConfigurator />,
  windows: <WindowsConfigurator />,
  gutters: <GutterConfigurator />,
};

export default function ServiceConfigurator() {
  const { activeCategory, setActiveCategory, prices, loadingPrices } = useEstimatorStore();

  // Get min sell_price per category from catalog
  const getPriceRange = (category) => {
    const items = prices.filter(p => p.category?.toLowerCase() === category && p.is_active);
    if (!items.length) return null;
    const min = Math.min(...items.map(p => parseFloat(p.sell_price)));
    const max = Math.max(...items.map(p => parseFloat(p.sell_price)));
    return { min, max, count: items.length };
  };

  return (
    <div className="space-y-6">
      {/* Service Type Grid */}
      <div className="bg-[var(--bg-card)] border border-slate-700/60 rounded-2xl p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Selecciona el Tipo de Servicio</h2>
          <p className="text-sm text-slate-400 mt-1">
            Precios desde el catálogo actualizado · {loadingPrices ? 'Cargando...' : `${prices.length} items`}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICES.map((svc) => {
            const isActive = activeCategory === svc.id;
            const range = getPriceRange(svc.id);

            return (
              <button
                key={svc.id}
                onClick={() => setActiveCategory(svc.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '12px', padding: '24px 16px', borderRadius: '16px', cursor: 'pointer',
                  border: `2px solid ${isActive ? svc.color : '#374151'}`,
                  background: isActive ? `${svc.color}15` : '#1e293b',
                  transition: 'all 0.2s', position: 'relative', textAlign: 'center',
                }}
              >
                {/* Service Icon */}
                <div style={{
                  width: '64px', height: '64px', borderRadius: '16px',
                  background: isActive ? `${svc.color}25` : '#0f172a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '32px', transition: 'all 0.2s',
                  border: `1px solid ${isActive ? svc.color + '44' : '#1e293b'}`,
                }}>
                  {svc.icon}
                </div>

                {/* Labels */}
                <div>
                  <p style={{
                    fontWeight: '800', fontSize: '16px', margin: '0 0 2px',
                    color: isActive ? svc.color : '#e2e8f0', letterSpacing: '-0.01em',
                  }}>
                    {svc.label}
                  </p>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>{svc.sub}</p>
                </div>

                {/* Price range from catalog */}
                {range && (
                  <div style={{
                    background: isActive ? `${svc.color}20` : '#0f172a',
                    borderRadius: '8px', padding: '6px 10px', width: '100%',
                    border: `1px solid ${isActive ? svc.color + '33' : '#374151'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Tag size={10} color={isActive ? svc.color : '#6b7280'} />
                      <span style={{ fontSize: '12px', fontWeight: '700', color: isActive ? svc.color : '#9ca3af' }}>
                        ${range.min.toFixed(0)}
                        {range.max !== range.min && `–$${range.max.toFixed(0)}`}
                      </span>
                    </div>
                    <p style={{ fontSize: '10px', color: '#4b5563', margin: '2px 0 0', textAlign: 'center' }}>
                      {svc.priceNote}
                    </p>
                  </div>
                )}

                {isActive && (
                  <div style={{
                    position: 'absolute', bottom: '-1px', left: '50%', transform: 'translateX(-50%)',
                    width: '24px', height: '12px', background: svc.color,
                    clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Configurator */}
      {activeCategory && (
        <div className="bg-[var(--bg-card)] border border-slate-700/60 rounded-2xl p-8"
          style={{ borderColor: SERVICES.find(s => s.id === activeCategory)?.color + '55' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <span style={{ fontSize: '20px' }}>{SERVICES.find(s => s.id === activeCategory)?.icon}</span>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: SERVICES.find(s => s.id === activeCategory)?.color }}>
              Configurar {SERVICES.find(s => s.id === activeCategory)?.label}
            </h3>
          </div>
          {CONFIGURATORS[activeCategory]}
        </div>
      )}
    </div>
  );
}
