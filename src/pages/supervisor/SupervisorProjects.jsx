import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MapPin, Calendar, User, Loader2, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import ProjectDetail from '../admin/ProjectDetail';

const STATUS_MAP = {
  pending:     { label: 'Pendiente',   color: '#6b7280' },
  scheduled:   { label: 'Agendado',    color: '#3b82f6' },
  in_progress: { label: 'En Progreso', color: '#f59e0b' },
  completed:   { label: 'Completado',  color: '#10b981' },
};

export default function SupervisorProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  useEffect(() => { fetchProjects(); }, []);

  async function fetchProjects() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('projects')
      .select('*, contact:contacts!projects_contact_id_fkey(first_name,last_name,phone)')
      .eq('supervisor_id', user.id)
      .order('created_at', { ascending: false });
    setProjects(data || []);
    setLoading(false);
  }

  if (loading) return <div className="page-loading"><Loader2 size={32} className="spin" /><p>Cargando proyectos...</p></div>;

  // Project detail view
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

  return (
    <div className="projects-page">
      <div className="crm-toolbar">
        <div className="crm-toolbar-left">
          <h1>Mis Proyectos</h1>
          <span className="crm-count">{projects.length}</span>
        </div>
      </div>
      <div className="projects-grid">
        {projects.map(p => (
          <div
            key={p.id}
            className="project-card"
            onClick={() => setSelectedProjectId(p.id)}
            style={{ cursor: 'pointer' }}
            title="Ver pipeline semanal"
          >
            <div className="project-card-header">
              <span className="project-number">PRJ-{String(p.project_number).padStart(4, '0')}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="stage-badge" style={{ background: STATUS_MAP[p.status]?.color }}>
                  {STATUS_MAP[p.status]?.label}
                </span>
                <ChevronRight size={14} color="#6b7280" />
              </div>
            </div>
            <h3 className="project-title">{p.title}</h3>
            {p.contact && (
              <div className="project-detail">
                <User size={14} />
                <span>{p.contact.first_name} {p.contact.last_name}</span>
              </div>
            )}
            {p.address && (
              <div className="project-detail">
                <MapPin size={14} />
                <span>{p.address}</span>
              </div>
            )}
            <div className="project-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${p.progress_pct || 0}%` }} />
              </div>
              <span className="progress-label">{p.progress_pct || 0}%</span>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="projects-empty">
            <p>No tienes proyectos asignados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
