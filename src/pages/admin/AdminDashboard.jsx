import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  DollarSign, Users, FileText, FolderKanban,
  TrendingUp, Clock, AlertTriangle, CheckCircle,
  Phone, MapPin, Bell,
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
          <p style={{ margin: '0 0 4px', fontWeight: '700', color: '#ef4444', fontSize: '14px' }}>
            âš ï¸ {overdue.length} pago{overdue.length > 1 ? 's' : ''} vencido{overdue.length > 1 ? 's' : ''}
          </p>
        )}
        {dueSoon.length > 0 && (
          <p style={{ margin: 0, fontWeight: '600', color: '#f59e0b', fontSize: '13px' }}>
            ðŸ• {dueSoon.length} pago{dueSoon.length > 1 ? 's' : ''} vence en menos de 3 dÃ­as
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0, activeProjects: 0, estimatesSent: 0,
    totalRevenue: 0, pendingPayments: 0, closedThisMonth: 0,
    overduePayments: 0, wonLeads: 0,
  });
  const [recentLeads, setRecentLeads] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [leadsRes, projectsRes, estimatesRes, paymentsRes, recentLeadsRes] = await Promise.all([
        supabase.from('contacts').select('id, pipeline_status', { count: 'exact' }),
        supabase.from('projects').select('id, title, status, progress_pct, sold_price, project_number, address').in('status', ['in_progress', 'scheduled']),
        supabase.from('estimates').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
        supabase.from('payments').select('id, amount, status, due_date, contact:contacts!payments_contact_id_fkey(first_name,last_name), project:projects!payments_project_id_fkey(title)'),
        supabase.from('contacts').select('id, first_name, last_name, phone, address, pipeline_status, source, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      const allContacts = leadsRes.data || [];
      const allProjects = projectsRes.data || [];
      const allPayments = paymentsRes.data || [];

      const revenue = allProjects.filter(p => p.status === 'in_progress').reduce((s, p) => s + (p.sold_price || 0), 0);
      const pending = allPayments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);
      const overdue = allPayments.filter(p => p.status === 'overdue').reduce((s, p) => s + (p.amount || 0), 0);
      const won = allContacts.filter(c => c.pipeline_status === 'closed_won').length;

      setStats({
        totalLeads: leadsRes.count || 0,
        activeProjects: allProjects.filter(p => p.status === 'in_progress').length,
        estimatesSent: estimatesRes.count || 0,
        totalRevenue: revenue,
        pendingPayments: pending,
        closedThisMonth: won,
        overduePayments: overdue,
        wonLeads: won,
      });

      setRecentLeads(recentLeadsRes.data || []);
      setActiveProjects(allProjects.filter(p => p.status === 'in_progress'));
      setPayments(allPayments);
      setLoading(false);
    }
    fetchAll();
  }, []);

  const SOURCE_ICONS = {
    google: 'ðŸ”', facebook: 'ðŸ“˜', instagram: 'ðŸ“¸',
    tiktok: 'ðŸŽµ', referral: 'ðŸ¤', phone: 'ðŸ“ž',
    walk_in: 'ðŸš¶', web: 'ðŸŒ', other: 'ðŸ“‹',
  };

  const STAGE_COLORS = {
    new_lead: '#3b82f6', contacted: '#f59e0b', appointment_set: '#8b5cf6',
    estimate_sent: '#06b6d4', closed_won: '#10b981', closed_lost: '#ef4444',
  };
  const STAGE_LABELS = {
    new_lead: 'Nuevo', contacted: 'Contactado', appointment_set: 'Cita',
    estimate_sent: 'Estimado', closed_won: 'Ganado', closed_lost: 'Perdido',
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">Barba Construction â€” Resumen operativo</p>
        </div>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>
          {new Date().toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </header>

      <AlertBanner payments={payments} />

      <div className="stats-grid">
        <StatCard icon={Users}        label="Total Leads"        value={stats.totalLeads}               accent="#60a5fa" sub={`${stats.wonLeads} ganados`} />
        <StatCard icon={FolderKanban} label="Proyectos Activos"  value={stats.activeProjects}           accent="#34d399" />
        <StatCard icon={FileText}     label="Estimados Enviados" value={stats.estimatesSent}            accent="#fbbf24" />
        <StatCard icon={DollarSign}   label="Revenue en Obra"    value={formatCurrency(stats.totalRevenue)}  accent="#a78bfa" />
        <StatCard icon={Clock}        label="Pagos Pendientes"   value={formatCurrency(stats.pendingPayments)} accent="#fb923c" />
        <StatCard icon={AlertTriangle}label="Pagos Vencidos"     value={formatCurrency(stats.overduePayments)} accent="#ef4444" />
      </div>

      <div className="dashboard-sections">
        {/* Active Projects */}
        <section className="dash-section">
          <h2>Proyectos en Obra</h2>
          {activeProjects.length === 0 ? (
            <p className="text-muted">No hay proyectos activos.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeProjects.map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '16px', background: '#1e293b', borderRadius: '12px',
                  border: '1px solid #374151',
                }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '10px',
                    background: '#f9731622', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0,
                  }}>
                    <FolderKanban size={20} color="#f97316" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontWeight: '700', fontSize: '14px', color: '#e2e8f0' }}>
                      PRJ-{String(p.project_number).padStart(4,'0')} â€” {p.title}
                    </p>
                    {p.address && (
                      <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={11} /> {p.address}
                      </p>
                    )}
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
                  </div>
                  {p.sold_price && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: 0, fontWeight: '700', color: '#10b981', fontSize: '15px' }}>
                        {formatCurrency(p.sold_price)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Leads */}
        <section className="dash-section">
          <h2>Leads Recientes</h2>
          {recentLeads.length === 0 ? (
            <p className="text-muted">No hay leads todavÃ­a.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentLeads.map(lead => (
                <div key={lead.id} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px', background: '#1e293b', borderRadius: '12px',
                  border: '1px solid #374151',
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
                      <span style={{ fontSize: '11px' }}>{SOURCE_ICONS[lead.source] || 'ðŸ“‹'}</span>
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
                      {new Date(lead.created_at).toLocaleDateString('es')}
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

