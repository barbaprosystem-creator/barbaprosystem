import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Loader2, MapPin, Calendar, User, TrendingUp, ChevronRight, Plus, X } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import ProjectDetail from './ProjectDetail';

const STATUS_MAP = {
  pending:     { label: 'Pendiente',   color: '#6b7280' },
  scheduled:   { label: 'Agendado',    color: '#3b82f6' },
  in_progress: { label: 'En Progreso', color: '#f59e0b' },
  completed:   { label: 'Completado',  color: '#10b981' },
  on_hold:     { label: 'En Espera',   color: '#ef4444' },
};

export default function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedProjectId, setSelectedProjectId] = useState(null); // -> detail view
  
  // Manual project creation
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '', address: '', sold_price: 0, status: 'pending', start_date: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  async function fetchProjects() {
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('*, contact:contacts!projects_contact_id_fkey(first_name,last_name,phone), supervisor:profiles!projects_supervisor_id_fkey(full_name)')
      .order('created_at', { ascending: false });
    const fetchedProjects = data || [];
    setProjects(fetchedProjects);
    setLoading(false);
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: newProject.title,
        address: newProject.address,
        sold_price: Number(newProject.sold_price),
        status: newProject.status,
        start_date: newProject.start_date || null
      };
      const { error } = await supabase.from('projects').insert([payload]);
      if (error) throw error;
      setCreateModalOpen(false);
      setNewProject({ title: '', address: '', sold_price: 0, status: 'pending', start_date: '' });
      fetchProjects();
    } catch (err) {
      alert('Error creando proyecto: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // If a project is selected, render the detail view
  if (selectedProjectId) {
    return (
      <div className="projects-page">
        <ProjectDetail
          projectId={selectedProjectId}
          onBack={() => setSelectedProjectId(null)}
        />
      </div>
    );
  }

  const filtered = projects.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return p.title?.toLowerCase().includes(s) ||
      `${p.contact?.first_name || ''} ${p.contact?.last_name || ''}`.toLowerCase().includes(s) ||
      p.address?.toLowerCase().includes(s);
  });

  if (loading) return <div className="page-loading"><Loader2 size={32} className="spin" /><p>Cargando proyectos...</p></div>;

  return (
    <div className="projects-page">
      <div className="crm-toolbar">
        <div className="crm-toolbar-left">
          <h1>Proyectos</h1>
          <span className="crm-count">{projects.length} total</span>
        </div>
        <div className="crm-toolbar-right">
          <div className="crm-search">
            <Search size={16} />
            <input placeholder="Buscar proyecto..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={() => setCreateModalOpen(true)}>
            <Plus size={18} /><span>Nuevo Proyecto</span>
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="estimate-tabs">
        <button className={`estimate-tab ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>
          Todos <span className="tab-count">{projects.length}</span>
        </button>
        {Object.entries(STATUS_MAP).map(([id, v]) => (
          <button key={id} className={`estimate-tab ${filterStatus === id ? 'active' : ''}`} onClick={() => setFilterStatus(id)}>
            {v.label} <span className="tab-count">{projects.filter(p => p.status === id).length}</span>
          </button>
        ))}
      </div>

      {/* Project Cards Grid */}
      <div className="projects-grid">
        {filtered.map(project => (
          <div
            key={project.id}
            className="project-card"
            onClick={() => setSelectedProjectId(project.id)}
            style={{ cursor: 'pointer' }}
            title="Ver pipeline del proyecto"
          >
            <div className="project-card-header">
              <span className="project-number">PRJ-{String(project.project_number).padStart(4, '0')}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="stage-badge" style={{ background: STATUS_MAP[project.status]?.color }}>
                  {STATUS_MAP[project.status]?.label}
                </span>
                <ChevronRight size={14} color="#6b7280" />
              </div>
            </div>
            <h3 className="project-title">{project.title}</h3>
            {project.contact && (
              <div className="project-detail">
                <User size={14} />
                <span>{project.contact.first_name} {project.contact.last_name}</span>
              </div>
            )}
            {project.address && (
              <div className="project-detail">
                <MapPin size={14} />
                <span>{project.address}</span>
              </div>
            )}
            {project.supervisor && (
              <div className="project-detail">
                <User size={14} />
                <span>Supervisor: {project.supervisor.full_name}</span>
              </div>
            )}

            {/* Progress Bar */}
            <div className="project-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${project.progress_pct || 0}%` }} />
              </div>
              <span className="progress-label">{project.progress_pct || 0}%</span>
            </div>

            <div className="project-card-footer">
              <div className="project-dates">
                <Calendar size={13} />
                <span>{project.start_date ? formatDate(project.start_date) : 'Sin fecha'}</span>
              </div>
              {project.sold_price > 0 && (
                <span className="project-price">{formatCurrency(project.sold_price)}</span>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="projects-empty">
            <TrendingUp size={48} />
            <p>No hay proyectos{filterStatus !== 'all' ? ` con estado "${STATUS_MAP[filterStatus]?.label}"` : ''}</p>
            <p className="text-sm">Los proyectos se crean automáticamente al aprobar estimados, o puedes crearlos manualmente.</p>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {createModalOpen && (
        <div className="modal-overlay" onClick={() => setCreateModalOpen(false)}>
          <div className="modal-content crm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Proyecto Manual</h2>
              <button className="modal-close" onClick={() => setCreateModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSubmit} className="crm-form">
              <div className="crm-form-grid">
                <div className="form-group full-width">
                  <label>Título del Proyecto *</label>
                  <input required value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} placeholder="Ej. Cambio de techo Familia Smith" />
                </div>
                <div className="form-group full-width">
                  <label>Dirección</label>
                  <input value={newProject.address} onChange={e => setNewProject({...newProject, address: e.target.value})} placeholder="Dirección de la obra" />
                </div>
                <div className="form-group">
                  <label>Precio de Venta ($)</label>
                  <input type="number" min="0" step="0.01" value={newProject.sold_price} onChange={e => setNewProject({...newProject, sold_price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select value={newProject.status} onChange={e => setNewProject({...newProject, status: e.target.value})}>
                    {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Fecha de Inicio</label>
                  <input type="date" value={newProject.start_date} onChange={e => setNewProject({...newProject, start_date: e.target.value})} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setCreateModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={18} className="spin" /> : null}
                  Crear Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

