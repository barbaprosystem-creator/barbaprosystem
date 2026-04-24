import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Loader2, MapPin, Calendar, User, TrendingUp, ChevronRight } from 'lucide-react';
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
  const [selectedProjectId, setSelectedProjectId] = useState(null); // ← detail view

  useEffect(() => { fetchProjects(); }, []);

  async function fetchProjects() {
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('*, contact:contacts!projects_contact_id_fkey(first_name,last_name,phone), supervisor:profiles!projects_supervisor_id_fkey(full_name)')
      .order('created_at', { ascending: false });
    setProjects(data || []);
    setLoading(false);
  }

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
            <p className="text-sm">Los proyectos se crean cuando un estimado es aprobado</p>
          </div>
        )}
      </div>
    </div>
  );
}
