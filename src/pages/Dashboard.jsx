import { useState } from 'react';
import { MoreVertical, Phone, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import './Dashboard.css';

// --- MOCK DATA --- 
const initialDeals = [
  { id: '1', client: 'John Doe', address: '123 Main St, Louisville KY', status: 'leads', value: 12500, type: 'Roofing' },
  { id: '2', client: 'Sarah Smith', address: '456 Oak Ln, Louisville KY', status: 'estimating', value: 0, type: 'Siding' },
  { id: '3', client: 'Mike Johnson', address: '789 Pine Rd, Louisville KY', status: 'in-progress', value: 24000, type: 'Full Exterior' },
  { id: '4', client: 'Emily Davis', address: '321 Elm St, Louisville KY', status: 'done', value: 8500, type: 'Windows' },
];

const COLUMNS = [
  { id: 'leads', title: 'Leads Nuevos', color: 'var(--brand-primary)' },
  { id: 'estimating', title: 'Expidiendo Estimado', color: 'var(--brand-secondary)' },
  { id: 'in-progress', title: 'En Progreso (Brigada)', color: '#3b82f6' },
  { id: 'done', title: 'Terminado', color: '#10b981' },
  { id: 'billed', title: 'Facturado (QBO)', color: '#6366f1' },
];

export default function Dashboard() {
  const [deals, setDeals] = useState(initialDeals);

  const moveDeal = (dealId, startStatus) => {
    const currentIndex = COLUMNS.findIndex(c => c.id === startStatus);
    if(currentIndex < COLUMNS.length - 1) {
      const nextStatus = COLUMNS[currentIndex + 1].id;
      setDeals(deals.map(d => d.id === dealId ? { ...d, status: nextStatus } : d));
    }
  };

  return (
    <div className="dashboard-container p-6">
      <div className="dashboard-header flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">Pipeline de Proyectos</h1>
          <p className="text-muted text-sm">Vista Kanban para seguimiento comercial y operativo.</p>
        </div>
        <button className="btn btn-primary">+ Nuevo Proyecto</button>
      </div>

      <div className="kanban-board">
        {COLUMNS.map(column => (
          <div key={column.id} className="kanban-column">
            <div className="kanban-column-header" style={{ borderTopColor: column.color }}>
              <h3 className="font-semibold">{column.title}</h3>
              <span className="kanban-badge">
                {deals.filter(d => d.status === column.id).length}
              </span>
            </div>
            
            <div className="kanban-cards">
              {deals.filter(d => d.status === column.id).map(deal => (
                <div key={deal.id} className="kanban-card">
                  <div className="flex justify-between items-center mb-2">
                    <span className="card-badge">{deal.type}</span>
                    <MoreVertical size={16} className="text-muted" />
                  </div>
                  <h4 className="font-bold">{deal.client}</h4>
                  <p className="text-sm text-muted mb-3 line-clamp-1">{deal.address}</p>
                  
                  <div className="card-footer flex justify-between items-center">
                    <span className="font-bold text-lg">${deal.value.toLocaleString()}</span>
                    
                    {column.id !== 'billed' && (
                      <button 
                         className="advance-btn" 
                         onClick={() => moveDeal(deal.id, deal.status)}
                         title="Avanzar etapa"
                      >
                         <ArrowRight size={18} />
                      </button>
                    )}
                    {column.id === 'billed' && (
                       <CheckCircle2 size={18} className="text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

