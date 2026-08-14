import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';
import ActiveProjectAutocomplete from '../../components/common/ActiveProjectAutocomplete';
import {
  HardHat, MapPin, CalendarCheck, Phone, Wrench, Users, Search, Filter,
  Plus, MoreVertical, CheckCircle2, Clock, AlertCircle, X, Trash2, Unlock, Loader2
} from 'lucide-react';

export default function BrigadesPage() {
  const [brigades, setBrigades] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedBrigade, setSelectedBrigade] = useState(null);
  
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  const [newBrigadeData, setNewBrigadeData] = useState({
    name: '',
    foreman: '',
    serviceType: 'Roofing',
    phone: '',
    membersCount: 1,
    projectId: ''
  });

  const [menuOpenId, setMenuOpenId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    fetchData();
    
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [brigadesRes, projectsRes] = await Promise.all([
        supabase.from('brigades').select('*, currentProject:projects(id, title, address, target_end_date, progress_pct, notes)').order('created_at', { ascending: false }),
        supabase.from('projects').select('id, title, address, status, project_number, target_end_date, progress_pct, notes, contacts(first_name, last_name, phone)').not('status', 'in', '("completed","cancelled")').order('created_at', { ascending: false })
      ]);
      
      if (brigadesRes.error) {
        if (brigadesRes.error.code === '42P01') {
          console.warn("Table brigades does not exist.");
          setBrigades([]);
        } else {
          console.error(brigadesRes.error);
        }
      } else {
        setBrigades(brigadesRes.data || []);
      }
      
      if (!projectsRes.error) {
        setActiveProjects(projectsRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleAssignClick = (brigade) => {
    setSelectedBrigade(brigade);
    setSelectedProjectId(brigade.current_project_id || '');
    setAssignModalOpen(true);
    setMenuOpenId(null);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return alert("Por favor selecciona un proyecto");
    setSaving(true);
    
    const { error } = await supabase.from('brigades').update({
      current_project_id: selectedProjectId,
      status: 'working'
    }).eq('id', selectedBrigade.id);

    if (error) {
      console.error("[BrigadesPage] Assign error:", error);
      alert(`Error al asignar proyecto: ${error.message || 'Error desconocido'}`);
    } else {
      await fetchData();
      setAssignModalOpen(false);
    }
    setSaving(false);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const { error } = await supabase.from('brigades').insert({
      name: newBrigadeData.name,
      foreman: newBrigadeData.foreman,
      service_type: newBrigadeData.serviceType,
      phone: newBrigadeData.phone,
      members_count: Number(newBrigadeData.membersCount),
      current_project_id: newBrigadeData.projectId || null,
      status: newBrigadeData.projectId ? 'working' : 'available'
    });

    if (error) {
      console.error("[BrigadesPage] Create error:", error);
      alert(`Error al crear brigada: ${error.message || 'Verifica que hayas ejecutado el script SQL en Supabase.'}`);
    } else {
      await fetchData();
      setCreateModalOpen(false);
      setNewBrigadeData({ name: '', foreman: '', serviceType: 'Roofing', phone: '', membersCount: 1, projectId: '' });
    }
    setSaving(false);
  };

  const handleReleaseBrigade = async (brigadeId) => {
    if (!confirm('Are you sure you want to release this crew from their current project?')) return;
    setMenuOpenId(null);
    const { error } = await supabase.from('brigades').update({
      current_project_id: null,
      status: 'available'
    }).eq('id', brigadeId);
    
    if (error) {
      console.error("[BrigadesPage] Release error:", error);
      alert(`Error al liberar brigada: ${error.message || 'Error desconocido'}`);
    } else {
      fetchData();
    }
  };

  const handleDeleteBrigade = async (brigadeId) => {
    if (!confirm('Are you sure you want to delete this crew completely?')) return;
    setMenuOpenId(null);
    const { error } = await supabase.from('brigades').delete().eq('id', brigadeId);
    if (error) {
      console.error("[BrigadesPage] Delete error:", error);
      alert(`Error al eliminar brigada: ${error.message || 'Error desconocido'}`);
    } else {
      fetchData();
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'working':
        return { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Working', icon: CheckCircle2 };
      case 'available':
        return { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Available', icon: Clock };
      case 'delayed':
        return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Delayed', icon: AlertCircle };
      default:
        return { color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/20', label: 'Unknown', icon: Clock };
    }
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
            Crew Management
          </h1>
          <p className="text-gray-400 mt-2">Real-time monitoring of field work teams.</p>
        </div>
        <button 
          onClick={() => setCreateModalOpen(true)}
          className="bg-[#FACB00] text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#e0b600] transition-colors"
        >
          <Plus size={20} />
          New Crew
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder="Search by crew name or foreman..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111] border border-[#222] text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#FACB00] transition-colors"
          />
        </div>
        <button className="bg-[#111] border border-[#222] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#1a1a1a] transition-colors">
          <Filter size={20} /> Filters
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex-1 flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-[#FACB00]" size={40} />
        </div>
      ) : brigades.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-[#111] border border-dashed border-[#333] rounded-xl">
          <Users size={48} className="text-gray-600 mb-4" />
          <h3 className="text-xl font-bold text-gray-300">No crews registered</h3>
          <p className="text-gray-500 mt-2 max-w-md">Start by adding your first crew and assigning them to active projects to monitor their progress.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBrigades.map(brigade => {
            const status = getStatusConfig(brigade.status);
            const StatusIcon = status.icon;

            return (
              <div key={brigade.id} className="bg-[#111] rounded-xl border border-[#222] flex flex-col hover:border-[#333] transition-colors relative">
                
                {/* Card Header */}
                <div className="p-5 border-b border-[#222]">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-white">{brigade.name}</h3>
                      <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                        <Wrench size={14} />
                        <span>{brigade.service_type}</span>
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
                        {brigade.foreman ? brigade.foreman.charAt(0).toUpperCase() : 'B'}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Foreman</p>
                        <p className="font-medium">{brigade.foreman || 'No asignado'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center">
                      {brigade.phone && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Phone size={14} />
                          <span>{brigade.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-400 mt-1">
                        <Users size={14} />
                        <span>{brigade.members_count} members</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body (Current Project) */}
                <div className="p-5 flex-1 flex flex-col bg-[#0a0a0a]/50 rounded-b-xl">
                  {brigade.currentProject ? (
                    <>
                      <h4 className="text-sm font-bold text-gray-200 mb-2">Current Work</h4>
                      <p className="text-[#FACB00] font-medium mb-1 truncate">{brigade.currentProject.title}</p>
                      
                      <div className="flex items-start gap-2 text-gray-400 text-sm mb-4">
                        <MapPin size={16} className="mt-0.5 shrink-0" />
                        <span className="leading-tight line-clamp-2">{brigade.currentProject.address}</span>
                      </div>

                      {brigade.currentProject.notes && (
                        <div className="bg-[#111] rounded-lg p-3 border border-[#222] mb-4 line-clamp-3">
                          <p className="text-xs text-gray-500 mb-1">Project notes:</p>
                          <p className="text-sm text-gray-300">{brigade.currentProject.notes}</p>
                        </div>
                      )}

                      <div className="mt-auto">
                        <div className="flex justify-between items-center text-sm mb-2">
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <CalendarCheck size={16} />
                            <span>Free on:</span>
                          </div>
                          <span className="font-bold text-white">
                            {brigade.currentProject.target_end_date ? formatDate(brigade.currentProject.target_end_date) : 'No end date'}
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-[#222] rounded-full h-2 mt-2">
                          <div 
                            className={`h-2 rounded-full ${brigade.status === 'delayed' ? 'bg-red-500' : 'bg-[#FACB00]'}`} 
                            style={{ width: `${brigade.currentProject.progress_pct || 0}%` }}
                          />
                        </div>
                        <p className="text-right text-xs text-gray-500 mt-1">{brigade.currentProject.progress_pct || 0}% Completed</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                      <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                        <Clock size={32} className="text-blue-500" />
                      </div>
                      <p className="text-gray-300 font-medium">Crew Available</p>
                      <p className="text-gray-500 text-sm mt-1">Ready to be assigned to a new project.</p>
                      <button 
                        onClick={() => handleAssignClick(brigade)}
                        className="mt-4 text-[#FACB00] font-bold text-sm hover:underline"
                      >
                        Assign Project
                      </button>
                    </div>
                  )}
                </div>
                
                {/* 3 Dots Menu Button */}
                <div className="absolute bottom-3 right-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === brigade.id ? null : brigade.id);
                    }}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#222] transition-colors"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* Dropdown Menu */}
                  {menuOpenId === brigade.id && (
                    <div ref={menuRef} className="absolute bottom-full right-0 mb-2 w-48 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-xl overflow-hidden z-10">
                      {brigade.current_project_id ? (
                        <button 
                          onClick={() => handleReleaseBrigade(brigade.id)}
                          className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-[#2a2a2a] flex items-center gap-2"
                        >
                          <Unlock size={16} className="text-blue-400" />
                          Release Crew
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleAssignClick(brigade)}
                          className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-[#2a2a2a] flex items-center gap-2"
                        >
                          <Plus size={16} className="text-emerald-400" />
                          Assign Project
                        </button>
                      )}
                      <div className="h-px bg-[#333] w-full" />
                      <button 
                        onClick={() => handleDeleteBrigade(brigade.id)}
                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Delete Crew
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Assign Project Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-[#222]">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <HardHat size={22} className="text-[#FACB00]" />
                  Asignar Proyecto Activo
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Selecciona el proyecto activo donde estará trabajando la brigada.
                </p>
              </div>
              <button onClick={() => setAssignModalOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Brigada Seleccionada</label>
                <div className="w-full bg-[#0a0a0a] border border-[#222] text-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#FACB00]/10 flex items-center justify-center text-[#FACB00] font-bold text-xs">
                      {selectedBrigade?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="font-bold text-white">{selectedBrigade?.name}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400 text-sm">{selectedBrigade?.foreman}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                    {selectedBrigade?.service_type}
                  </span>
                </div>
              </div>

              <div>
                <ActiveProjectAutocomplete
                  projects={activeProjects}
                  value={selectedProjectId}
                  onChange={(id) => setSelectedProjectId(id)}
                  label="Buscar y Asignar Proyecto Activo"
                  placeholder="Escribe dirección, cliente, # proyecto o título..."
                  required
                  helperText="Busca rápidamente por dirección de obra, nombre del cliente o número de proyecto."
                />
              </div>
              
              <div className="pt-3 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-400 bg-[#1c1c1c] hover:bg-[#262626] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={saving || !selectedProjectId}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-black bg-[#FACB00] hover:bg-[#e0b600] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar Asignación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Brigade Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-lg overflow-hidden my-8 shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-[#222]">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <HardHat size={22} className="text-[#FACB00]" />
                  Nueva Brigada (New Crew)
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Registra un equipo de trabajo en campo y asígnale un proyecto activo.
                </p>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre de la Brigada *</label>
                <input 
                  required
                  type="text" 
                  value={newBrigadeData.name}
                  onChange={(e) => setNewBrigadeData({...newBrigadeData, name: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#262626] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#FACB00] transition-colors"
                  placeholder="ej. Alpha Crew / Brigada Roofing 1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Capataz / Foreman *</label>
                  <input 
                    required
                    type="text" 
                    value={newBrigadeData.foreman}
                    onChange={(e) => setNewBrigadeData({...newBrigadeData, foreman: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-[#262626] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#FACB00] transition-colors"
                    placeholder="ej. Lazaro Barba"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Especialidad *</label>
                  <select 
                    value={newBrigadeData.serviceType}
                    onChange={(e) => setNewBrigadeData({...newBrigadeData, serviceType: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-[#262626] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#FACB00] transition-colors"
                  >
                    <option value="Roofing">Roofing</option>
                    <option value="Siding">Siding</option>
                    <option value="Gutters">Gutters</option>
                    <option value="Framing">Framing</option>
                    <option value="Concrete">Concrete</option>
                    <option value="Remodeling">Remodeling</option>
                    <option value="Decking">Decking</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Teléfono de Contacto *</label>
                  <input 
                    required
                    type="text" 
                    value={newBrigadeData.phone}
                    onChange={(e) => setNewBrigadeData({...newBrigadeData, phone: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-[#262626] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#FACB00] transition-colors"
                    placeholder="ej. (502) 555-1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nº de Miembros *</label>
                  <input 
                    required
                    type="number" 
                    min="1"
                    value={newBrigadeData.membersCount}
                    onChange={(e) => setNewBrigadeData({...newBrigadeData, membersCount: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-[#262626] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#FACB00] transition-colors"
                  />
                </div>
              </div>

              {/* Google-like Address Autocomplete for Active Projects */}
              <div className="pt-2 border-t border-[#222]">
                <ActiveProjectAutocomplete
                  projects={activeProjects}
                  value={newBrigadeData.projectId}
                  onChange={(id) => setNewBrigadeData(prev => ({ ...prev, projectId: id }))}
                  label="Asignar Proyecto Activo (Opcional)"
                  placeholder="Buscar por dirección de obra, cliente o #..."
                  allowClear
                  helperText="Opcional: Si seleccionas un proyecto activo ahora, la brigada quedará asignada y marcada 'En Trabajo'."
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-[#222]">
                <button 
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-400 bg-[#1c1c1c] hover:bg-[#262626] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-black bg-[#FACB00] hover:bg-[#e0b600] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : 'Crear Brigada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
