import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Loader2, MapPin, Calendar, User, TrendingUp, ChevronRight, Plus, X, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import ProjectDetail from './ProjectDetail';

const STATUS_MAP = {
  pending:     { label: 'Pendiente',   color: '#6b7280' },
  scheduled:   { label: 'Agendado',    color: '#3b82f6' },
  in_progress: { label: 'En Progreso', color: '#f59e0b' },
  completed:   { label: 'Completado',  color: '#10b981' },
  on_hold:     { label: 'En Espera',   color: '#ef4444' },
};

const EMPTY_FORM = { title: '', address: '', sold_price: 0, status: 'pending', start_date: '' };

export default function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Create modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProject, setNewProject] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null); // project object
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  // ── CREATE ──────────────────────────────────────────
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('projects').insert([{
        title: newProject.title,
        address: newProject.address,
        sold_price: Number(newProject.sold_price),
        status: newProject.status,
        start_date: newProject.start_date || null,
      }]);
      if (error) throw error;
      setCreateModalOpen(false);
      setNewProject(EMPTY_FORM);
      fetchProjects();
    } catch (err) {
      alert('Error creando proyecto: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── EDIT ────────────────────────────────────────────
  const openEdit = (e, project) => {
    e.stopPropagation();
    setEditProject({
      id: project.id,
      title: project.title || '',
      address: project.address || '',
      sold_price: project.sold_price || 0,
      status: project.status || 'pending',
      start_date: project.start_date ? project.start_date.slice(0, 10) : '',
      progress_pct: project.progress_pct || 0,
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const { error } = await supabase.from('projects').update({
        title: editProject.title,
        address: editProject.address,
        sold_price: Number(editProject.sold_price),
        status: editProject.status,
        start_date: editProject.start_date || null,
        progress_pct: Number(editProject.progress_pct),
      }).eq('id', editProject.id);
      if (error) throw error;
      setEditModalOpen(false);
      setEditProject(null);
      fetchProjects();
    } catch (err) {
      alert('Error actualizando proyecto: ' + err.message);
    } finally {
      setEditSaving(false);
    }
  };

  // ── DELETE ──────────────────────────────────────────
  const openDelete = (e, project) => {
    e.stopPropagation();
    setDeleteTarget(project);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const { error } = await supabase.from('projects').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      setDeleteTarget(null);
      fetchProjects();
    } catch (err) {
      alert('Error eliminando proyecto: ' + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── DETAIL VIEW ─────────────────────────────────────
  if (selectedProjectId) {
    return (
      <div className="projects-page">
        <ProjectDetail projectId={selectedProjectId} onBack={() => setSelectedProjectId(null)} />
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
            style={{ cursor: 'pointer', position: 'relative' }}
            title="Ver pipeline del proyecto"
          >
            {/* Action buttons — top right corner */}
            <div
              style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px', zIndex: 10 }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={e => openEdit(e, project)}
                title="Editar proyecto"
                style={{
                  width: '30px', height: '30px', borderRadius: '8px', border: 'none',
                  background: 'rgba(59,130,246,0.15)', color: '#3b82f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'background 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(59,130,246,0.3)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(59,130,246,0.15)'}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={e => openDelete(e, project)}
                title="Eliminar proyecto"
                style={{
                  width: '30px', height: '30px', borderRadius: '8px', border: 'none',
                  background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'background 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.3)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="project-card-header">
              <span className="project-number">PRJ-{String(project.project_number).padStart(4, '0')}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="stage-badge" style={{ background: STATUS_MAP[project.status]?.color }}>
                  {STATUS_MAP[project.status]?.label}
                </span>
                <ChevronRight size={14} color="#6b7280" />
              </div>
            </div>
            <h3 className="project-title" style={{ paddingRight: '72px' }}>{project.title}</h3>
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

      {/* ── CREATE MODAL ─────────────────────────────── */}
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

      {/* ── EDIT MODAL ───────────────────────────────── */}
      {editModalOpen && editProject && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="modal-content crm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Proyecto</h2>
              <button className="modal-close" onClick={() => setEditModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="crm-form">
              <div className="crm-form-grid">
                <div className="form-group full-width">
                  <label>Título del Proyecto *</label>
                  <input required value={editProject.title} onChange={e => setEditProject({...editProject, title: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label>Dirección</label>
                  <input value={editProject.address} onChange={e => setEditProject({...editProject, address: e.target.value})} placeholder="Dirección de la obra" />
                </div>
                <div className="form-group">
                  <label>Precio de Venta ($)</label>
                  <input type="number" min="0" step="0.01" value={editProject.sold_price} onChange={e => setEditProject({...editProject, sold_price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select value={editProject.status} onChange={e => setEditProject({...editProject, status: e.target.value})}>
                    {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Fecha de Inicio</label>
                  <input type="date" value={editProject.start_date} onChange={e => setEditProject({...editProject, start_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Progreso (%) — {editProject.progress_pct}%</label>
                  <input
                    type="range" min="0" max="100" step="5"
                    value={editProject.progress_pct}
                    onChange={e => setEditProject({...editProject, progress_pct: e.target.value})}
                    style={{ width: '100%', accentColor: '#f59e0b' }}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={editSaving}>
                  {editSaving ? <Loader2 size={18} className="spin" /> : null}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION ──────────────────────── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <AlertTriangle size={28} color="#ef4444" />
              </div>
              <h2 style={{ color: '#fff', marginBottom: '8px' }}>¿Eliminar proyecto?</h2>
              <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.5' }}>
                Estás a punto de eliminar permanentemente el proyecto:<br />
                <strong style={{ color: '#fff' }}>"{deleteTarget.title}"</strong><br />
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-actions" style={{ paddingTop: '8px' }}>
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                style={{
                  padding: '10px 20px', borderRadius: '10px', border: 'none',
                  background: '#ef4444', color: '#fff', fontWeight: '700',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  opacity: deleteLoading ? 0.7 : 1
                }}
              >
                {deleteLoading ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



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

