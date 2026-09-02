import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getCached, setCached } from '../../lib/dataCache';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useLanguage } from '../../i18n/LanguageContext';
import { 
  Users, Briefcase, FileText, DollarSign, Wallet, TrendingUp, AlertTriangle, Clock,
  Calendar, CheckCircle, ChevronRight, Activity, ArrowUpRight, Bell, Calendar as CalIcon,
  FolderKanban, Phone, MapPin
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, accent, sub }) {
  return (
    <div className="stat-card" style={{ '--accent': accent }}>
      <div className="stat-card-icon"><Icon size={22} /></div>
      <div className="stat-card-data">
        <span className="stat-card-value">{value}</span>
        <span className="stat-card-label">{label}</span>
        {sub && <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{sub}</span>}
      </div>
    </div>
  );
}

function AlertBanner({ payments }) {
  const overdue = payments.filter(p => p.status === 'overdue');
  const dueSoon = payments.filter(p => {
    if (p.status !== 'pending' || !p.due_date) return false;
    const days = Math.ceil((new Date(p.due_date) - new Date()) / 86400000);
    return days >= 0 && days <= 3;
  });

  if (!overdue.length && !dueSoon.length) return null;

  return (
    <div style={{
      background: '#ef444410', border: '1px solid #ef444430', borderRadius: '12px',
      padding: '16px 20px', marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '12px',
    }}>
      <Bell size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        {overdue.length > 0 && (
          <p style={{ margin: '0 0 4px', fontWeight: '700', color: '#ef4444', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
            <AlertTriangle size={14} className="mr-1.5" /> {overdue.length} overdue payment{overdue.length > 1 ? `s` : ``}
          </p>
        )}
        {dueSoon.length > 0 && (
          <p style={{ margin: 0, fontWeight: '600', color: '#f59e0b', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
            <Clock size={14} className="mr-1.5" /> {dueSoon.length} payment{dueSoon.length > 1 ? `s` : ``} due in less than 3 days
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalLeads: 0, activeProjects: 0, estimatesSent: 0,
    totalRevenue: 0, pendingPayments: 0, closedThisMonth: 0,
    overduePayments: 0, wonLeads: 0,
  });
  const [recentLeads, setRecentLeads] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleSeedTestData = async () => {
    try {
      if (!window.confirm("¿Seguro que deseas cargar los datos de prueba? Esto insertará contactos, estimados y proyectos de prueba.")) return;

      const { error: cErr } = await supabase.from('contacts').upsert([
        { id: '11111111-1111-1111-1111-111111111111', first_name: 'Juan', last_name: 'Pérez', email: 'juan.perez@example.com', phone: '555-0101', address: '123 Main St', city: 'Houston', state: 'TX', zip: '77001', source: 'web', pipeline_status: 'closed_won', lead_quality: 'hot' },
        { id: '22222222-2222-2222-2222-222222222222', first_name: 'María', last_name: 'García', email: 'maria.garcia@example.com', phone: '555-0202', address: '456 Oak Ln', city: 'Houston', state: 'TX', zip: '77002', source: 'referral', pipeline_status: 'closed_won', lead_quality: 'warm' }
      ]);
      if (cErr && cErr.code !== '23505') throw cErr; // ignore unique violation

      const { error: eErr } = await supabase.from('estimates').upsert([
        { id: '33333333-3333-3333-3333-333333333333', contact_id: '11111111-1111-1111-1111-111111111111', status: 'approved', work_type: 'Roofing', subtotal: 12000, grand_total: 12500, scope_of_work: 'Reemplazo completo de techo con GAF Timberline HDZ' },
        { id: '44444444-4444-4444-4444-444444444444', contact_id: '22222222-2222-2222-2222-222222222222', status: 'approved', work_type: 'Siding', subtotal: 8500, grand_total: 8900, scope_of_work: 'Instalación de Vinyl Siding en toda la casa' }
      ]);
      if (eErr && eErr.code !== '23505') throw eErr;

      const today = new Date();
      const dMinus2 = new Date(today); dMinus2.setDate(dMinus2.getDate() - 2);
      const dPlus5 = new Date(today); dPlus5.setDate(dPlus5.getDate() + 5);
      const dPlus3 = new Date(today); dPlus3.setDate(dPlus3.getDate() + 3);
      const dPlus10 = new Date(today); dPlus10.setDate(dPlus10.getDate() + 10);

      const { error: pErr } = await supabase.from('projects').insert([
        { contact_id: '11111111-1111-1111-1111-111111111111', estimate_id: '33333333-3333-3333-3333-333333333333', title: 'Residencia Familia Pérez - Techo', status: 'in_progress', progress_pct: 60, start_date: dMinus2.toISOString().split('T')[0], target_end_date: dPlus5.toISOString().split('T')[0], sold_price: 12500, address: '123 Main St, Houston, TX 77001', notes: 'El cliente solicitó cuidado extra con las plantas del jardín frontal.' },
        { contact_id: '22222222-2222-2222-2222-222222222222', estimate_id: '44444444-4444-4444-4444-444444444444', title: 'Renovación Siding María García', status: 'scheduled', progress_pct: 0, start_date: dPlus3.toISOString().split('T')[0], target_end_date: dPlus10.toISOString().split('T')[0], sold_price: 8900, address: '456 Oak Ln, Houston, TX 77002', notes: 'Brigada asignada para el próximo lunes.' }
      ]);
      if (pErr && pErr.code !== '23505') throw pErr;

      alert("Test data successfully loaded!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Error loading data: " + err.message);
    }
  };

  useEffect(() => {
    // 1. Instant load from IndexedDB cache (async but fast, ~1-5ms)
    (async () => {
      try {
        const cached = await getCached('dashboard');
        if (cached && cached.data?.length > 0) {
          const parsed = cached.data[0];
          if (parsed.stats) setStats(parsed.stats);
          if (parsed.recentLeads) setRecentLeads(parsed.recentLeads);
          if (parsed.activeProjects) setActiveProjects(parsed.activeProjects);
          if (parsed.payments) setPayments(parsed.payments);
          setLoading(false);
        }
      } catch (e) {}
    })();

    // 2. Background refresh
    async function loadDashboardData() {
      try {
        const [
          { data: leads, count: leadsCount },
          { data: projects, count: projectsCount },
          { count: estimatesCount },
          { data: payments },
          { data: dailyReports }
        ] = await Promise.all([
          supabase.from('contacts').select('*', { count: 'exact' }).order('created_at', { ascending: false }),
          supabase.from('projects').select('*', { count: 'exact' }).in('status', ['in_progress', 'scheduled']).order('start_date', { ascending: true }),
          supabase.from('estimates').select('*', { count: 'exact' }).eq('status', 'sent'),
          supabase.from('payments').select('*').in('status', ['pending', 'overdue']),
          supabase.from('daily_reports').select('id, project_id, report_date, issues, work_completed, created_at').order('report_date', { ascending: false }).limit(100)
        ]);

        let totalRevenue = projects?.reduce((sum, p) => sum + (p.sold_price || 0), 0) || 0;
        let pendingPayments = payments?.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        let overduePayments = payments?.filter(p => p.status === 'overdue').reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        let wonLeads = leads?.filter(l => l.pipeline_status === 'closed_won').length || 0;
        let finalLeadsCount = leadsCount || 0;
        let finalProjectsCount = projectsCount || 0;
        let finalEstimatesCount = estimatesCount || 0;
        let finalRecentLeads = leads?.slice(0, 5) || [];
        
        // Attach latest daily notes and timeline status to active projects
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let finalActiveProjects = (projects?.slice(0, 8) || []).map(p => {
          const latestReport = dailyReports?.find(r => r.project_id === p.id);
          const noteText = latestReport?.issues || latestReport?.work_completed || null;

          let timeline = null;
          if (p.target_end_date) {
            const end = new Date(p.target_end_date);
            end.setHours(0, 0, 0, 0);
            const diffDays = Math.round((end.getTime() - today.getTime()) / (1000 * 3600 * 24));
            
            if (diffDays < 0) {
              timeline = {
                status: 'delayed',
                days: Math.abs(diffDays),
                label: `Retrasado ${Math.abs(diffDays)}d`,
                color: '#ef4444',
                bg: '#ef444420',
                border: '#ef444440'
              };
            } else if (diffDays === 0) {
              timeline = {
                status: 'today',
                days: 0,
                label: 'Termina Hoy',
                color: '#f59e0b',
                bg: '#f59e0b20',
                border: '#f59e0b40'
              };
            } else {
              timeline = {
                status: 'on_track',
                days: diffDays,
                label: `Faltan ${diffDays}d`,
                color: '#10b981',
                bg: '#10b98120',
                border: '#10b98140'
              };
            }
          }

          return {
            ...p,
            latestNote: noteText,
            latestNoteDate: latestReport?.report_date,
            timeline
          };
        });
        
        let sortedPayments = payments?.sort((a, b) => {
          if (a.status === 'overdue' && b.status !== 'overdue') return -1;
          if (b.status === 'overdue' && a.status !== 'overdue') return 1;
          return new Date(a.due_date || 0) - new Date(b.due_date || 0);
        }) || [];
        let finalPayments = sortedPayments.slice(0, 5);

        const computedStats = {
          totalLeads: finalLeadsCount,
          activeProjects: finalProjectsCount,
          estimatesSent: finalEstimatesCount,
          totalRevenue,
          pendingPayments,
          closedThisMonth: wonLeads, 
          overduePayments,
          wonLeads
        };

        setStats(computedStats);
        setRecentLeads(finalRecentLeads);
        setActiveProjects(finalActiveProjects);
        setPayments(finalPayments);

        // Save to IndexedDB cache
        setCached('dashboard', [{
          id: 'dashboard_data',
          stats: computedStats,
          recentLeads: finalRecentLeads,
          activeProjects: finalActiveProjects,
          payments: finalPayments,
          cachedAt: Date.now()
        }]).catch(() => {});

      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const SOURCE_ICONS = {
    google: 'Google', facebook: 'Facebook', instagram: 'Instagram',
    tiktok: 'TikTok', referral: 'Referral', phone: 'Phone',
    walk_in: 'Walk-in', web: 'Web', other: 'Other',
  };

  const STAGE_COLORS = {
    new_lead: '#3b82f6', contacted: '#f59e0b', appointment_set: '#8b5cf6',
    estimate_sent: '#06b6d4', closed_won: '#10b981', closed_lost: '#ef4444',
  };
  const STAGE_LABELS = {
    new_lead: 'New', contacted: 'Contacted', appointment_set: 'Appointment',
    estimate_sent: 'Estimate', closed_won: 'Won', closed_lost: 'Lost',
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">Barba Construction - Operational summary</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </header>

      <AlertBanner payments={payments} />

      <div className="stats-grid">
        <StatCard icon={Users}        label={t('dashboard.totalLeads')}       value={stats.totalLeads}               accent="#60a5fa" sub={`${stats.wonLeads} ${t('status.won').toLowerCase()}`} />
        <StatCard icon={FolderKanban} label={t('dashboard.activeProjects')}   value={stats.activeProjects}           accent="#34d399" />
        <StatCard icon={FileText}     label={t('dashboard.estimatesSent')}    value={stats.estimatesSent}            accent="#fbbf24" />
        <StatCard icon={DollarSign}   label={t('dashboard.totalRevenue')}     value={formatCurrency(stats.totalRevenue)}  accent="#a78bfa" />
        <StatCard icon={Clock}        label={t('dashboard.pendingPayments')}  value={formatCurrency(stats.pendingPayments)} accent="#fb923c" />
        <StatCard icon={AlertTriangle}label="Overdue Payments"                 value={formatCurrency(stats.overduePayments)} accent="#ef4444" />
      </div>

      <div className="dashboard-sections">
        {/* Active Projects */}
        <section className="dash-section">
          <h2>{t('dashboard.activeProjectsList')}</h2>
          {activeProjects.length === 0 ? (
            <p className="text-muted">{t('dashboard.noProjects')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeProjects.map(p => (
                <div key={p.id} onClick={() => navigate('/admin/projects')} style={{
                  display: 'flex', flexDirection: 'column', gap: '10px',
                  padding: '16px', background: '#1e293b', borderRadius: '14px',
                  border: '1px solid #374151', cursor: 'pointer', transition: 'all 0.2s'
                }} className="hover:border-[#FACB00]/50 hover:bg-[#1e293b]/90">
                  
                  {/* Top Row: Icon, Title, Timeline Status, Price */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '10px',
                      background: '#f9731622', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0, marginTop: '2px'
                    }}>
                      <FolderKanban size={20} color="#f97316" />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                        <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: '#e2e8f0' }} className="truncate">
                          PRJ-{String(p.project_number).padStart(4,`0`)} - {p.title}
                        </p>

                        {/* Timeline Status Badge */}
                        {p.timeline && (
                          <span style={{
                            fontSize: '11px', fontWeight: '700', padding: '2px 8px',
                            borderRadius: '6px', background: p.timeline.bg,
                            color: p.timeline.color, border: `1px solid ${p.timeline.border}`,
                            display: 'flex', alignItems: 'center', gap: '4px'
                          }}>
                            {p.timeline.status === 'delayed' && <AlertTriangle size={11} />}
                            {p.timeline.status === 'today' && <Clock size={11} />}
                            {p.timeline.status === 'on_track' && <CheckCircle size={11} />}
                            {p.timeline.label}
                          </span>
                        )}
                      </div>

                      {/* Address & Target Finish Date */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#94a3b8' }}>
                        {p.address && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="truncate">
                            <MapPin size={12} color="#f59e0b" /> {p.address}
                          </span>
                        )}
                        {p.target_end_date && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} color="#60a5fa" /> Fin: <strong style={{ color: '#f8fafc' }}>{formatDate(p.target_end_date)}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {p.sold_price && (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ margin: 0, fontWeight: '800', color: '#10b981', fontSize: '15px' }}>
                          {formatCurrency(p.sold_price)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '6px', background: '#374151', borderRadius: '3px' }}>
                      <div style={{
                        width: `${p.progress_pct || 0}%`, height: '100%', borderRadius: '3px',
                        background: p.progress_pct >= 80 ? '#10b981' : p.progress_pct >= 40 ? '#f59e0b' : '#3b82f6',
                      }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', flexShrink: 0 }}>
                      {p.progress_pct || 0}%
                    </span>
                  </div>

                  {/* Latest Daily Note / Bitácora Snippet */}
                  {p.latestNote && (
                    <div style={{
                      padding: '7px 10px', background: '#8b5cf615',
                      borderRadius: '8px', border: '1px solid #8b5cf635',
                      display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px',
                      color: '#c4b5fd'
                    }}>
                      <FileText size={13} color="#a78bfa" style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: '700', color: '#e2e8f0', flexShrink: 0 }}>Última nota:</span>
                      <span style={{ color: '#ddd6fe', fontStyle: 'italic', flex: 1 }} className="truncate">
                        "{p.latestNote}"
                      </span>
                      {p.latestNoteDate && (
                        <span style={{ fontSize: '10px', color: '#a78bfa', flexShrink: 0 }}>
                          {formatDate(p.latestNoteDate)}
                        </span>
                      )}
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Leads */}
        <section className="dash-section">
          <h2>{t('dashboard.recentLeads')}</h2>
          {recentLeads.length === 0 ? (
            <p className="text-muted">{t('dashboard.noLeads')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentLeads.map(lead => (
                <div key={lead.id} onClick={() => navigate('/admin/crm')} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px', background: '#1e293b', borderRadius: '12px',
                  border: '1px solid #374151', cursor: 'pointer'
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: '#f9731622', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: '800', color: '#f97316',
                    fontSize: '14px', flexShrink: 0,
                  }}>
                    {lead.first_name?.[0]}{lead.last_name?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontWeight: '700', fontSize: '14px', color: '#e2e8f0' }}>
                      {lead.first_name} {lead.last_name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {lead.phone && (
                        <span style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Phone size={10} /> {lead.phone}
                        </span>
                      )}
                      <span style={{ fontSize: '11px' }}>{SOURCE_ICONS[lead.source] || "Otro"}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '700', padding: '3px 8px',
                      borderRadius: '6px', background: STAGE_COLORS[lead.pipeline_status] + '22',
                      color: STAGE_COLORS[lead.pipeline_status],
                    }}>
                      {STAGE_LABELS[lead.pipeline_status] || lead.pipeline_status}
                    </span>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#4b5563' }}>
                      {new Date(lead.created_at).toLocaleDateString('en-US')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}


