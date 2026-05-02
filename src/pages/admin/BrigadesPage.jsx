import React, { useState } from 'react';
import {
  HardHat,
  MapPin,
  CalendarCheck,
  Phone,
  Tool,
  Users,
  Search,
  Filter,
  Plus,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

const MOCK_BRIGADES = [
  {
    id: 1,
    name: "Brigada Alpha",
    foreman: "Carlos Ruiz",
    phone: "(555) 123-4567",
    serviceType: "Siding & Gutters",
    membersCount: 4,
    status: "working", // working, available, delayed
    currentProject: {
      name: "Renovación Familia Smith",
      address: "123 Maple Street, Houston, TX 77002",
      jobDescription: "Instalación de 20 squares de Siding de Vinilo y Gutters.",
      startDate: "2026-04-28",
      estimatedCompletion: "2026-05-03",
      progress: 75
    }
  },
  {
    id: 2,
    name: "Brigada Beta",
    foreman: "Luis Mendoza",
    phone: "(555) 987-6543",
    serviceType: "Roofing",
    membersCount: 6,
    status: "working",
    currentProject: {
      name: "Techo Comercial Downtown",
      address: "880 Commerce Blvd, Houston, TX 77010",
      jobDescription: "Reemplazo completo de techo de metal arquitectónico.",
      startDate: "2026-04-20",
      estimatedCompletion: "2026-05-05",
      progress: 60
    }
  },
  {
    id: 3,
    name: "Brigada Delta",
    foreman: "Miguel Ángel",
    phone: "(555) 456-7890",
    serviceType: "Remodeling",
    membersCount: 3,
    status: "available",
    currentProject: null
  },
  {
    id: 4,
    name: "Brigada Omega",
    foreman: "José Hernández",
    phone: "(555) 222-3333",
    serviceType: "Fences & Decks",
    membersCount: 4,
    status: "delayed",
    currentProject: {
      name: "Deck Residencial Heights",
      address: "442 Heights Blvd, Houston, TX 77007",
      jobDescription: "Construcción de Deck de madera tratada.",
      startDate: "2026-05-01",
      estimatedCompletion: "2026-05-04",
      progress: 10
    }
  }
];

export default function BrigadesPage() {
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredBrigades = MOCK_BRIGADES.filter(b => 
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
        <button className="bg-[#FACB00] text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#e0b600] transition-colors">
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
                      <Tool size={14} />
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
                    <button className="mt-4 text-[#FACB00] font-bold text-sm hover:underline">
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
    </div>
  );
}
