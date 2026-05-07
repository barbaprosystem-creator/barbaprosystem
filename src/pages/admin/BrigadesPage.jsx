import React, { useState } from 'react';
import {
  HardHat,
  MapPin,
  CalendarCheck,
  Phone,
  Wrench,
  Users,
  Search,
  Filter,
  Plus,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  X
} from 'lucide-react';

const INITIAL_BRIGADES = [
  {
    id: 'brigade-1',
    name: 'Brigada Alfa',
    foreman: 'Carlos Ramírez',
    serviceType: 'Roofing',
    phone: '(555) 123-4567',
    membersCount: 5,
    status: 'working',
    currentProject: {
      name: 'Residencia Familia Pérez',
      address: '123 Main St, Houston, TX',
      jobDescription: 'Instalación de techo nuevo (Architectural Shingles 30yr).',
      estimatedCompletion: '2026-05-15',
      progress: 60
    }
  },
  {
    id: 'brigade-2',
    name: 'Brigada Siding Pro',
    foreman: 'Luis Hernández',
    serviceType: 'Siding',
    phone: '(555) 987-6543',
    membersCount: 4,
    status: 'available',
    currentProject: null
  }
];


export default function BrigadesPage() {
  const [brigades, setBrigades] = useState(INITIAL_BRIGADES);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedBrigade, setSelectedBrigade] = useState(null);
  const [newProject, setNewProject] = useState({
    name: '',
    address: '',
    jobDescription: '',
    estimatedCompletion: ''
  });
  const [newBrigadeData, setNewBrigadeData] = useState({
    name: '',
    foreman: '',
    serviceType: 'Roofing',
    phone: '',
    membersCount: 1,
  });

  const handleAssignClick = (brigade) => {
    setSelectedBrigade(brigade);
    setNewProject({
      name: '',
      address: '',
      jobDescription: '',
      estimatedCompletion: ''
    });
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    setBrigades(prev => prev.map(b => {
      if (b.id === selectedBrigade.id) {
        return {
          ...b,
          status: 'working',
          currentProject: {
            ...newProject,
            startDate: new Date().toISOString().split('T')[0],
            progress: 0
          }
        };
      }
      return b;
    }));
    setAssignModalOpen(false);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'working':
        return { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Trabajando', icon: CheckCircle2 };
      case 'available':
        return { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Disponible', icon: Clock };
      case 'delayed':
        return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Con Retraso', icon: AlertCircle };
      default:
        return { color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/20', label: 'Desconocido', icon: Clock };
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const newBrigade = {
      id: `brigade-${Date.now()}`,
      name: newBrigadeData.name,
      foreman: newBrigadeData.foreman,
      serviceType: newBrigadeData.serviceType,
      phone: newBrigadeData.phone,
      membersCount: Number(newBrigadeData.membersCount),
      status: 'available',
      currentProject: null
    };
    setBrigades([...brigades, newBrigade]);
    setCreateModalOpen(false);
    setNewBrigadeData({
      name: '', foreman: '', serviceType: 'Roofing', phone: '', membersCount: 1
    });
  };

  const filteredBrigades = brigades.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.foreman.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col bg-[#0a0a0a] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <HardHat className="text-[#FACB00]" size={32} /> 
            Gestión de Brigadas
          </h1>
          <p className="text-gray-400 mt-2">Monitoreo en tiempo real de los equipos de trabajo en campo.</p>
        </div>
        <button 
          onClick={() => setCreateModalOpen(true)}
          className="bg-[#FACB00] text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#e0b600] transition-colors"
        >
          <Plus size={20} />
          Nueva Brigada
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o jefe de brigada..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111] border border-[#222] text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#FACB00] transition-colors"
          />
        </div>
        <button className="bg-[#111] border border-[#222] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#1a1a1a] transition-colors">
          <Filter size={20} /> Filtros
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBrigades.map(brigade => {
          const status = getStatusConfig(brigade.status);
          const StatusIcon = status.icon;

          return (
            <div key={brigade.id} className="bg-[#111] rounded-xl border border-[#222] overflow-hidden flex flex-col hover:border-[#333] transition-colors">
              
              {/* Card Header */}
              <div className="p-5 border-b border-[#222]">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">{brigade.name}</h3>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                      <Wrench size={14} />
                      <span>{brigade.serviceType}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full border flex items-center gap-1.5 text-xs font-bold ${status.bg} ${status.color} ${status.border}`}>
                    <StatusIcon size={14} />
                    {status.label}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-[#FACB00] font-bold">
                      {brigade.foreman.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Foreman</p>
                      <p className="font-medium">{brigade.foreman}</p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Phone size={14} />
                      <span>{brigade.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 mt-1">
                      <Users size={14} />
                      <span>{brigade.membersCount} miembros</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body (Current Project) */}
              <div className="p-5 flex-1 flex flex-col bg-[#0a0a0a]/50">
                {brigade.currentProject ? (
                  <>
                    <h4 className="text-sm font-bold text-gray-200 mb-2">Trabajo Actual</h4>
                    <p className="text-[#FACB00] font-medium mb-1">{brigade.currentProject.name}</p>
                    
                    <div className="flex items-start gap-2 text-gray-400 text-sm mb-4">
                      <MapPin size={16} className="mt-0.5 shrink-0" />
                      <span className="leading-tight">{brigade.currentProject.address}</span>
                    </div>

                    <div className="bg-[#111] rounded-lg p-3 border border-[#222] mb-4">
                      <p className="text-xs text-gray-500 mb-1">Descripción del trabajo:</p>
                      <p className="text-sm text-gray-300">{brigade.currentProject.jobDescription}</p>
                    </div>

                    <div className="mt-auto">
                      <div className="flex justify-between items-center text-sm mb-2">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <CalendarCheck size={16} />
                          <span>Libre el:</span>
                        </div>
                        <span className="font-bold text-white">{brigade.currentProject.estimatedCompletion}</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-[#222] rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full ${brigade.status === 'delayed' ? 'bg-red-500' : 'bg-[#FACB00]'}`} 
                          style={{ width: `${brigade.currentProject.progress}%` }}
                        />
                      </div>
                      <p className="text-right text-xs text-gray-500 mt-1">{brigade.currentProject.progress}% Completado</p>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                      <Clock size={32} className="text-blue-500" />
                    </div>
                    <p className="text-gray-300 font-medium">Brigada Disponible</p>
                    <p className="text-gray-500 text-sm mt-1">Lista para ser asignada a un nuevo proyecto.</p>
                    <button 
                      onClick={() => handleAssignClick(brigade)}
                      className="mt-4 text-[#FACB00] font-bold text-sm hover:underline"
                    >
                      Asignar Proyecto
                    </button>
                  </div>
                )}
              </div>
              
              {/* Card Actions */}
              <div className="p-3 border-t border-[#222] flex justify-end">
                <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#222] transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Assign Project Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111] border border-[#222] rounded-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-[#222]">
              <h2 className="text-xl font-bold text-white">Asignar Proyecto</h2>
              <button onClick={() => setAssignModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Brigada Seleccionada</label>
                <div className="w-full bg-[#0a0a0a] border border-[#222] text-gray-300 rounded-lg px-4 py-2.5">
                  {selectedBrigade?.name} - {selectedBrigade?.foreman}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre del Proyecto</label>
                <input 
                  required
                  type="text" 
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#FACB00] transition-colors"
                  placeholder="Ej. Renovación Familia Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Dirección</label>
                <input 
                  required
                  type="text" 
                  value={newProject.address}
                  onChange={(e) => setNewProject({...newProject, address: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#FACB00] transition-colors"
                  placeholder="Ej. 123 Main St, Houston, TX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Descripción del Trabajo</label>
                <textarea 
                  required
                  value={newProject.jobDescription}
                  onChange={(e) => setNewProject({...newProject, jobDescription: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#FACB00] transition-colors min-h-[80px]"
                  placeholder="Ej. Instalación de Siding..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Fecha Estimada de Completación</label>
                <input 
                  required
                  type="date" 
                  value={newProject.estimatedCompletion}
                  onChange={(e) => setNewProject({...newProject, estimatedCompletion: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#FACB00] transition-colors"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg font-bold text-gray-400 bg-[#222] hover:bg-[#333] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-lg font-bold text-black bg-[#FACB00] hover:bg-[#e0b600] transition-colors"
                >
                  Confirmar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Brigade Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111] border border-[#222] rounded-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-[#222]">
              <h2 className="text-xl font-bold text-white">Nueva Brigada</h2>
              <button onClick={() => setCreateModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre de la Brigada</label>
                <input 
                  required
                  type="text" 
                  value={newBrigadeData.name}
                  onChange={(e) => setNewBrigadeData({...newBrigadeData, name: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#FACB00] transition-colors"
                  placeholder="Ej. Brigada Alfa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Jefe de Brigada (Foreman)</label>
                <input 
                  required
                  type="text" 
                  value={newBrigadeData.foreman}
                  onChange={(e) => setNewBrigadeData({...newBrigadeData, foreman: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#FACB00] transition-colors"
                  placeholder="Ej. Lázaro Barba"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Especialidad (Servicio)</label>
                <select 
                  value={newBrigadeData.serviceType}
                  onChange={(e) => setNewBrigadeData({...newBrigadeData, serviceType: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#FACB00] transition-colors"
                >
                  <option value="Roofing">Roofing</option>
                  <option value="Siding">Siding</option>
                  <option value="Gutters">Gutters</option>
                  <option value="Framing">Framing</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Teléfono de Contacto</label>
                <input 
                  required
                  type="text" 
                  value={newBrigadeData.phone}
                  onChange={(e) => setNewBrigadeData({...newBrigadeData, phone: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#FACB00] transition-colors"
                  placeholder="Ej. (555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Cantidad de Miembros</label>
                <input 
                  required
                  type="number" 
                  min="1"
                  value={newBrigadeData.membersCount}
                  onChange={(e) => setNewBrigadeData({...newBrigadeData, membersCount: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#FACB00] transition-colors"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg font-bold text-gray-400 bg-[#222] hover:bg-[#333] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-lg font-bold text-black bg-[#FACB00] hover:bg-[#e0b600] transition-colors"
                >
                  Crear Brigada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
