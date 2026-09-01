import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Loader2, MapPin, Calendar, User, TrendingUp, ChevronRight, Plus, X, Pencil, Trash2, AlertTriangle, Briefcase, Home, RefreshCw, Receipt } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import ProjectDetail from './ProjectDetail';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../hooks/useAuth';


const STATUS_COLORS = {
  pending:     '#6b7280',
  scheduled:   '#3b82f6',
  in_progress: '#f59e0b',
  completed:   '#10b981',
  on_hold:     '#ef4444',
};

const EMPTY_FORM = { title: '', address: '', sold_price: 0, status: 'pending', start_date: '', contact_id: '', project_type: 'standard', purchase_price: 0 };

export default function ProjectsList() {
  const { t } = useLanguage();
  const { role } = useAuth();


  const STATUS_MAP = {
    pending:     { label: t('status.pending'),    color: STATUS_COLORS.pending },
    scheduled:   { label: t('status.scheduled'),  color: STATUS_COLORS.scheduled },
    in_progress: { label: t('status.inProgress'), color: STATUS_COLORS.in_progress },
    completed:   { label: t('status.completed'),  color: STATUS_COLORS.completed },
    on_hold:     { label: t('status.onHold'),     color: STATUS_COLORS.on_hold },
  };

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectTypeFilter, setProjectTypeFilter] = useState('standard');


  // Contacts for project linking
  const [contacts, setContacts] = useState([]);
  const [newCustomer, setNewCustomer] = useState({ first_name: '', last_name: '', phone: '', email: '' });

  // Create modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProject, setNewProject] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);


  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [syncingQbo, setSyncingQbo] = useState(false);
  const [sortBy, setSortBy] = useState('date-desc');

  async function syncRecentQboData() {
    setSyncingQbo(true);
    try {
      const res = await fetch('/api/qbo-pull-recent', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import recent QBO updates');
      }
      alert(`Sincronización de QuickBooks completada!\n\n` +
            `Estimados de QuickBooks procesados: ${data.estimatesProcessed || 0}\n` +
            `Nuevos estimados cargados: ${data.estimatesCreated || 0}\n` +
            `Facturas procesadas: ${data.invoicesProcessed || 0}\n` +
            `Nuevos proyectos/facturas cargadas: ${data.invoicesCreated || 0}\n` +
            `Clientes nuevos agregados: ${data.customersCreated || 0}`);
      await fetchProjects();
    } catch (err) {
      console.error(err);
      alert('Error en la sincronización de QuickBooks: ' + err.message);
    } finally {
      setSyncingQbo(false);
    }
  }

  useEffect(() => {
    fetchProjects();
    fetchContacts();

    // Run incremental background sync from QBO quietly on mount with safety timeout & 10min session cooldown
    const lastPull = sessionStorage.getItem('barba_qbo_last_pull');
    const now = Date.now();
    let timeoutId = null;
    const controller = new AbortController();

    if (!lastPull || now - parseInt(lastPull, 10) > 10 * 60 * 1000) {
      sessionStorage.setItem('barba_qbo_last_pull', now.toString());
      timeoutId = setTimeout(() => controller.abort(), 3500);

      fetch('/api/qbo-pull-recent', { method: 'POST', signal: controller.signal })
        .then(res => {
          if (timeoutId) clearTimeout(timeoutId);
          if (!res.ok) return null;
          return res.json();
        })
        .then(data => {
          if (data && (data.invoicesCreated > 0 || data.customersCreated > 0 || data.estimatesCreated > 0)) {
            console.log(`[QBO Projects Sync] Loaded ${data.invoicesCreated} invoices, ${data.estimatesCreated} estimates.`);
            fetchProjects();
          }
        })
        .catch(() => {
          if (timeoutId) clearTimeout(timeoutId);
        });
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  async function fetchContacts() {
    try {
      console.log("[ProjectsList] fetchContacts started...");
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .order('first_name');
      if (error) {
        console.error("[ProjectsList] fetchContacts error:", error);
        throw error;
      }
      console.log("[ProjectsList] fetchContacts count:", data?.length || 0);
      setContacts(data || []);
    } catch (err) {
      console.error("[ProjectsList] fetchContacts caught exception:", err);
      setContacts([]);
    }
  }

  async function fetchProjects() {
    setLoading(true);
    try {
      console.log("[ProjectsList] fetchProjects started...");
      let allData = [];
      let page = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('projects')
          .select('*, contact:contacts!projects_contact_id_fkey(first_name,last_name,phone), supervisor:profiles!projects_supervisor_id_fkey(full_name), estimate:estimates(qbo_invoice_number, qbo_invoice_id, qbo_estimate_id), project_expenses(id)')
          .order('created_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) {
          console.error("[ProjectsList] fetchProjects error page " + page, error);
          throw error;
        }
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < pageSize) break;
        page++;
      }
      console.log("[ProjectsList] fetchProjects count:", allData.length);
      setProjects(allData);
    } catch (err) {
      console.error("[ProjectsList] fetchProjects caught exception:", err);
      alert('Error fetching projects: ' + err.message);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }


  // ── CREATE ──────────────────────────────────────────
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    console.log("[ProjectsList] handleCreateSubmit started...");
    setSaving(true);
    try {
      let finalContactId = newProject.contact_id;
      console.log("[ProjectsList] initial contact_id:", finalContactId);
      
      if (newProject.contact_id === 'new_customer') {
        console.log("[ProjectsList] creating new contact...", newCustomer);
        const { data: contactData, error: contactError } = await supabase
          .from('contacts')
          .insert({
            first_name: newCustomer.first_name,
            last_name: newCustomer.last_name,
            phone: newCustomer.phone || null,
            email: newCustomer.email || null,
            pipeline_status: 'contacted',
          })
          .select()
          .single();
        if (contactError) {
          console.error("[ProjectsList] contact creation error:", contactError);
          throw contactError;
        }
        finalContactId = contactData.id;
        console.log("[ProjectsList] contact created successfully. ID:", finalContactId);
        
        try {
          await fetchContacts();
        } catch (cErr) {
          console.error("[ProjectsList] fetchContacts error during customer creation:", cErr);
        }
      }

      const insertPayload = {
        title: newProject.title,
        address: newProject.address,
        sold_price: Number(newProject.sold_price) || 0,
        status: newProject.status || 'pending',
        start_date: newProject.start_date || null,
        contact_id: finalContactId || null,
        project_type: projectTypeFilter || 'standard',
        purchase_price: projectTypeFilter === 'fix_flip' ? (Number(newProject.purchase_price) || 0) : 0,
      };
      
      console.log("[ProjectsList] inserting project payload:", insertPayload);
      
      const { data: insertedData, error: insertError } = await supabase
        .from('projects')
        .insert([insertPayload])
        .select();
        
      if (insertError) {
        console.error("[ProjectsList] project insert error:", insertError);
        throw insertError;
      }
      
      console.log("[ProjectsList] project inserted successfully:", insertedData);
      
      setCreateModalOpen(false);
      setNewProject(EMPTY_FORM);
      setNewCustomer({ first_name: '', last_name: '', phone: '', email: '' });
      
      console.log("[ProjectsList] fetching projects after creation...");
      await fetchProjects();
      console.log("[ProjectsList] handleCreateSubmit finished successfully!");
    } catch (err) {
      console.error("[ProjectsList] handleCreateSubmit caught error:", err);
      alert('Error creating project: ' + err.message);
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
      contact_id: project.contact_id || '',
      project_type: project.project_type || 'standard',
      purchase_price: project.purchase_price || 0,
    });
    setNewCustomer({ first_name: '', last_name: '', phone: '', email: '' });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    console.log("[ProjectsList] handleEditSubmit started...");
    setEditSaving(true);
    try {
      let finalContactId = editProject.contact_id;
      console.log("[ProjectsList] initial edit contact_id:", finalContactId);
      
      if (editProject.contact_id === 'new_customer') {
        console.log("[ProjectsList] creating new contact for edit...", newCustomer);
        const { data: contactData, error: contactError } = await supabase
          .from('contacts')
          .insert({
            first_name: newCustomer.first_name,
            last_name: newCustomer.last_name,
            phone: newCustomer.phone || null,
            email: newCustomer.email || null,
            pipeline_status: 'contacted',
          })
          .select()
          .single();
        if (contactError) {
          console.error("[ProjectsList] edit contact creation error:", contactError);
          throw contactError;
        }
        finalContactId = contactData.id;
        console.log("[ProjectsList] edit contact created. ID:", finalContactId);
        
        try {
          await fetchContacts();
        } catch (cErr) {
          console.error("[ProjectsList] fetchContacts error during edit customer creation:", cErr);
        }
      }

      const updatePayload = {
        title: editProject.title,
        address: editProject.address,
        sold_price: Number(editProject.sold_price) || 0,
        status: editProject.status || 'pending',
        start_date: editProject.start_date || null,
        progress_pct: Number(editProject.progress_pct) || 0,
        contact_id: finalContactId || null,
        project_type: editProject.project_type || 'standard',
        purchase_price: editProject.project_type === 'fix_flip' ? (Number(editProject.purchase_price) || 0) : 0,
      };
      
      console.log("[ProjectsList] updating project ID:", editProject.id, "payload:", updatePayload);
      
      const { error: updateError } = await supabase
        .from('projects')
        .update(updatePayload)
        .eq('id', editProject.id);
        
      if (updateError) {
        console.error("[ProjectsList] project update error:", updateError);
        throw updateError;
      }
      
      console.log("[ProjectsList] project updated successfully.");
      
      setEditModalOpen(false);
      setEditProject(null);
      setNewCustomer({ first_name: '', last_name: '', phone: '', email: '' });
      
      console.log("[ProjectsList] fetching projects after edit...");
      await fetchProjects();
      console.log("[ProjectsList] handleEditSubmit finished successfully!");
    } catch (err) {
      console.error("[ProjectsList] handleEditSubmit caught error:", err);
      alert('Error updating project: ' + err.message);
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
    console.log("[ProjectsList] handleDelete started. ID:", deleteTarget.id);
    setDeleteLoading(true);
    try {
      const projectId = deleteTarget.id;
      
      // 1. Delete client payments
      await supabase.from('payments').delete().eq('project_id', projectId);
      
      // 2. Delete project photos
      await supabase.from('project_photos').delete().eq('project_id', projectId);
      
      // 3. Delete project documents
      await supabase.from('project_documents').delete().eq('project_id', projectId);
      
      // 4. Delete project materials (BOM)
      await supabase.from('project_materials').delete().eq('project_id', projectId);
      
      // 5. Unlink project from brigades (set current_project_id to NULL)
      await supabase.from('brigades').update({ current_project_id: null }).eq('current_project_id', projectId);
      // Also clear project_id if it exists
      try {
        await supabase.from('brigades').update({ project_id: null }).eq('project_id', projectId);
      } catch (_) {}
      
      // 6. Delete project expenses
      await supabase.from('project_expenses').delete().eq('project_id', projectId);

      // 7. Delete project itself
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) {
        console.error("[ProjectsList] delete project error:", error);
        throw error;
      }
      console.log("[ProjectsList] project deleted successfully.");
      setDeleteTarget(null);
      await fetchProjects();
    } catch (err) {
      console.error("[ProjectsList] handleDelete caught error:", err);
      alert('Error deleting project: ' + err.message);
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

  const typeFilteredProjects = projects.filter(p => {
    const type = p.project_type || 'standard';
    return type === projectTypeFilter;
  });

  const filtered = typeFilteredProjects.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;

    if (!search) return true;
    const s = search.toLowerCase();
    return p.title?.toLowerCase().includes(s) ||
      `${p.contact?.first_name || ''} ${p.contact?.last_name || ''}`.toLowerCase().includes(s) ||
      p.address?.toLowerCase().includes(s);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date-desc') {
      const dateA = a.start_date || a.created_at || 0;
      const dateB = b.start_date || b.created_at || 0;
      const timeA = new Date(dateA).getTime() || 0;
      const timeB = new Date(dateB).getTime() || 0;
      return timeB - timeA;
    }
    if (sortBy === 'date-asc') {
      const dateA = a.start_date || a.created_at || 0;
      const dateB = b.start_date || b.created_at || 0;
      const timeA = new Date(dateA).getTime() || 0;
      const timeB = new Date(dateB).getTime() || 0;
      return timeA - timeB;
    }
    if (sortBy === 'price-desc') {
      return (b.sold_price || 0) - (a.sold_price || 0);
    }
    if (sortBy === 'price-asc') {
      return (a.sold_price || 0) - (b.sold_price || 0);
    }
    if (sortBy === 'number-desc') {
      return (b.project_number || 0) - (a.project_number || 0);
    }
    if (sortBy === 'number-asc') {
      return (a.project_number || 0) - (b.project_number || 0);
    }
    if (sortBy === 'client-asc') {
      const nameA = `${a.contact?.first_name || ''} ${a.contact?.last_name || ''}`.trim();
      const nameB = `${b.contact?.first_name || ''} ${b.contact?.last_name || ''}`.trim();
      return nameA.localeCompare(nameB);
    }
    if (sortBy === 'client-desc') {
      const nameA = `${a.contact?.first_name || ''} ${a.contact?.last_name || ''}`.trim();
      const nameB = `${b.contact?.first_name || ''} ${b.contact?.last_name || ''}`.trim();
      return nameB.localeCompare(nameA);
    }
    return 0;
  });

  if (loading) return <div className="page-loading"><Loader2 size={32} className="spin" /><p>{t('actions.loading')}</p></div>;

  return (
    <div className="projects-page">
      <div className="crm-toolbar">
        <div className="crm-toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <h1>{t('projects.title')}</h1>
            <span className="crm-count">{typeFilteredProjects.length} {t('common.total_count')}</span>
          </div>
          
          {role === 'admin' && (
            <div className="flex bg-slate-900 border border-slate-700/60 p-1 rounded-xl ml-4 select-none">
              <button
                type="button"
                onClick={() => setProjectTypeFilter('standard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-250 cursor-pointer ${
                  projectTypeFilter === 'standard'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Briefcase size={13} />
                <span>Standard</span>
              </button>
              <button
                type="button"
                onClick={() => setProjectTypeFilter('fix_flip')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-250 cursor-pointer ${
                  projectTypeFilter === 'fix_flip'
                    ? 'bg-amber-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Home size={13} />
                <span>Fix & Flip</span>
              </button>
            </div>
          )}
        </div>
        <div className="crm-toolbar-right">
          <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-2 text-sm text-gray-400">
            <span className="text-xs whitespace-nowrap">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-0 text-white py-1 focus:outline-none cursor-pointer font-bold text-xs"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="price-desc">Sold Price (High-Low)</option>
              <option value="price-asc">Sold Price (Low-High)</option>
              <option value="number-desc">Project # (High-Low)</option>
              <option value="number-asc">Project # (Low-High)</option>
              <option value="client-asc">Client Name (A-Z)</option>
              <option value="client-desc">Client Name (Z-A)</option>
            </select>
          </div>
          <div className="crm-search">
            <Search size={16} />
            <input placeholder={t('projects.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button 
            disabled={syncingQbo}
            className="bg-[#10b981] hover:bg-[#059669] text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors disabled:opacity-50"
            onClick={syncRecentQboData}
          >
            <RefreshCw size={16} className={syncingQbo ? 'animate-spin' : ''}/>
            <span>{syncingQbo ? 'Syncing QBO...' : 'Sync QBO'}</span>
          </button>
          <button className="btn-primary" onClick={() => setCreateModalOpen(true)}>
            <Plus size={18} /><span>{t('projects.newProject')}</span>
          </button>
        </div>
      </div>


      {/* Status Tabs */}
      <div className="estimate-tabs">
        <button className={`estimate-tab ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>
          {t('common.all')} <span className="tab-count">{typeFilteredProjects.length}</span>
        </button>
        {Object.entries(STATUS_MAP).map(([id, v]) => (
          <button key={id} className={`estimate-tab ${filterStatus === id ? 'active' : ''}`} onClick={() => setFilterStatus(id)}>
            {v.label} <span className="tab-count">{typeFilteredProjects.filter(p => p.status === id).length}</span>
          </button>
        ))}
      </div>

      {/* Project Cards Grid */}
      <div className="projects-grid">
        {sorted.map(project => (
          <div
            key={project.id}
            className="project-card"
            onClick={() => setSelectedProjectId(project.id)}
            style={{ cursor: 'pointer' }}
            title="View project pipeline"
          >
            <div className="project-card-header">
              <span className="project-number">PRJ-{String(project.project_number).padStart(4, '0')}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                {project.project_expenses && project.project_expenses.length > 0 && (
                  <span 
                    className="stage-badge" 
                    style={{ 
                      background: 'rgba(245,158,11,0.12)', 
                      color: '#d97706', 
                      border: '1px solid rgba(245,158,11,0.25)',
                      fontWeight: 'bold',
                      fontSize: '10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                    title={`${project.project_expenses.length} gastos registrados`}
                  >
                    <Receipt size={10} />
                    <span>{project.project_expenses.length} Gastos</span>
                  </span>
                )}
                {project.estimate?.qbo_invoice_number && (
                  <span 
                    className="stage-badge" 
                    style={{ 
                      background: 'rgba(16,185,129,0.12)', 
                      color: '#10b981', 
                      border: '1px solid rgba(16,185,129,0.25)',
                      fontWeight: 'bold',
                      fontSize: '10px'
                    }}
                    title={`Linked QBO Invoice #${project.estimate.qbo_invoice_number}`}
                  >
                    QBO #{project.estimate.qbo_invoice_number}
                  </span>
                )}
                <span className="stage-badge" style={{ background: STATUS_MAP[project.status]?.color }}>
                  {STATUS_MAP[project.status]?.label}
                </span>
                {/* Edit / Delete inline buttons */}
                <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={e => openEdit(e, project)}
                    title="Edit project"
                    style={{
                      width: '26px', height: '26px', borderRadius: '6px', border: 'none',
                      background: 'rgba(59,130,246,0.15)', color: '#3b82f6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(59,130,246,0.3)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(59,130,246,0.15)'}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={e => openDelete(e, project)}
                    title="Delete project"
                    style={{
                      width: '26px', height: '26px', borderRadius: '6px', border: 'none',
                      background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.3)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
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
            {project.project_type === 'fix_flip' && project.purchase_price > 0 && (
              <div className="project-detail text-amber-400 font-semibold">
                <Home size={14} className="text-amber-500" />
                <span>Purchase Price: {formatCurrency(project.purchase_price)}</span>
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
                <span>{project.start_date ? formatDate(project.start_date) : t('projects.noDate')}</span>
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
            <p>{t('projects.noProjects')}{filterStatus !== 'all' ? ` with status "${STATUS_MAP[filterStatus]?.label}"` : ''}</p>
            <p className="text-sm">{t('projects.createdAutomatically')}</p>
          </div>
        )}
      </div>

      {/* ── CREATE MODAL ─────────────────────────────── */}
      {createModalOpen && (
        <div className="modal-overlay" onClick={() => setCreateModalOpen(false)}>
          <div className="modal-content crm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('projects.manualProject')}</h2>
              <button className="modal-close" onClick={() => setCreateModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSubmit} className="crm-form">
              <div className="crm-form-grid">
                <div className="form-group full-width">
                  <label>{t('projects.title_field')} *</label>
                  <input required value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} placeholder="e.g., Smith Family Roof Replacement" />
                </div>
                <div className="form-group full-width">
                  <label>{t('projects.address')}</label>
                  <input value={newProject.address} onChange={e => setNewProject({...newProject, address: e.target.value})} placeholder={t('projects.address')} />
                </div>
                <div className="form-group">
                  <label>{t('projects.salePrice')} ($)</label>
                  <input type="number" min="0" step="0.01" value={newProject.sold_price} onChange={e => setNewProject({...newProject, sold_price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>{t('common.status')}</label>
                  <select value={newProject.status} onChange={e => setNewProject({...newProject, status: e.target.value})}>
                    {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('projects.startDate')}</label>
                  <input type="date" value={newProject.start_date} onChange={e => setNewProject({...newProject, start_date: e.target.value})} />
                </div>

                {projectTypeFilter === 'fix_flip' && (
                  <div className="form-group">
                    <label>Purchase Price ($)</label>
                    <input type="number" min="0" step="0.01" value={newProject.purchase_price} onChange={e => setNewProject({...newProject, purchase_price: e.target.value})} />
                  </div>
                )}


                <div className="form-group">
                  <label>Client</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                    value={newProject.contact_id || ''}
                    onChange={e => setNewProject({ ...newProject, contact_id: e.target.value })}
                  >
                    <option value="">-- No Client --</option>
                    <option value="new_customer" className="text-blue-400 font-bold">+ New Customer</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                    ))}
                  </select>
                </div>

                {newProject.contact_id === 'new_customer' && (
                  <div className="col-span-full bg-slate-900/60 p-4 border border-slate-700 rounded-lg space-y-3 mt-2">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">New Client Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">First Name *</label>
                        <input
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                          value={newCustomer.first_name || ''}
                          onChange={e => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
                          required={newProject.contact_id === 'new_customer'}
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Last Name *</label>
                        <input
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                          value={newCustomer.last_name || ''}
                          onChange={e => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
                          required={newProject.contact_id === 'new_customer'}
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Phone</label>
                        <input
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                          value={newCustomer.phone || ''}
                          onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                          placeholder="(502) 555-0100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Email</label>
                        <input
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                          value={newCustomer.email || ''}
                          onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setCreateModalOpen(false)}>{t('actions.cancel')}</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={18} className="spin" /> : null}
                  {t('actions.create')} {t('projects.title')}
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
              <h2>{t('actions.edit')} {t('projects.title')}</h2>
              <button className="modal-close" onClick={() => setEditModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="crm-form">
              <div className="crm-form-grid">
                <div className="form-group full-width">
                  <label>{t('projects.title_field')} *</label>
                  <input required value={editProject.title} onChange={e => setEditProject({...editProject, title: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label>{t('projects.address')}</label>
                  <input value={editProject.address} onChange={e => setEditProject({...editProject, address: e.target.value})} placeholder={t('projects.address')} />
                </div>
                <div className="form-group">
                  <label>{t('projects.salePrice')} ($)</label>
                  <input type="number" min="0" step="0.01" value={editProject.sold_price} onChange={e => setEditProject({...editProject, sold_price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>{t('common.status')}</label>
                  <select value={editProject.status} onChange={e => setEditProject({...editProject, status: e.target.value})}>
                    {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('projects.startDate')}</label>
                  <input type="date" value={editProject.start_date} onChange={e => setEditProject({...editProject, start_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>{t('projects.progress')} (%) — {editProject.progress_pct}%</label>
                  <input
                    type="range" min="0" max="100" step="5"
                    value={editProject.progress_pct}
                    onChange={e => setEditProject({...editProject, progress_pct: e.target.value})}
                    style={{ width: '100%', accentColor: '#f59e0b' }}
                  />
                </div>

                {editProject.project_type === 'fix_flip' && (
                  <div className="form-group">
                    <label>Purchase Price ($)</label>
                    <input type="number" min="0" step="0.01" value={editProject.purchase_price} onChange={e => setEditProject({...editProject, purchase_price: e.target.value})} />
                  </div>
                )}


                <div className="form-group">
                  <label>Client</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                    value={editProject.contact_id || ''}
                    onChange={e => setEditProject({ ...editProject, contact_id: e.target.value })}
                  >
                    <option value="">-- No Client --</option>
                    <option value="new_customer" className="text-blue-400 font-bold">+ New Customer</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                    ))}
                  </select>
                </div>

                {editProject.contact_id === 'new_customer' && (
                  <div className="col-span-full bg-slate-900/60 p-4 border border-slate-700 rounded-lg space-y-3 mt-2">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">New Client Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">First Name *</label>
                        <input
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                          value={newCustomer.first_name || ''}
                          onChange={e => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
                          required={editProject.contact_id === 'new_customer'}
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Last Name *</label>
                        <input
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                          value={newCustomer.last_name || ''}
                          onChange={e => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
                          required={editProject.contact_id === 'new_customer'}
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Phone</label>
                        <input
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                          value={newCustomer.phone || ''}
                          onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                          placeholder="(502) 555-0100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Email</label>
                        <input
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                          value={newCustomer.email || ''}
                          onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditModalOpen(false)}>{t('actions.cancel')}</button>
                <button type="submit" className="btn-primary" disabled={editSaving}>
                  {editSaving ? <Loader2 size={18} className="spin" /> : null}
                  {t('actions.save')}
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
              <h2 style={{ color: '#fff', marginBottom: '8px' }}>{t('projects.deleteConfirm')}</h2>
              <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.5' }}>
                <strong style={{ color: '#fff' }}>"{deleteTarget.title}"</strong><br />
                {t('projects.deleteWarning')}
              </p>
            </div>
            <div className="modal-actions" style={{ paddingTop: '8px' }}>
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>
                {t('actions.cancel')}
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
                {t('actions.yes')}, {t('actions.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
