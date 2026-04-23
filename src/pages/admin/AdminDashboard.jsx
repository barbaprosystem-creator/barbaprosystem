import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';
import {
  DollarSign,
  Users,
  FileText,
  FolderKanban,
  TrendingUp,
  Clock,
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="stat-card" style={{ '--accent': accent }}>
      <div className="stat-card-icon">
        <Icon size={22} />
      </div>
      <div className="stat-card-data">
        <span className="stat-card-value">{value}</span>
        <span className="stat-card-label">{label}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    activeProjects: 0,
    estimatesSent: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    closedThisMonth: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const [leads, projects, estimates, payments] = await Promise.all([
        supabase.from('contacts').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id, sold_price').eq('status', 'in_progress'),
        supabase.from('estimates').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
        supabase.from('payments').select('amount').eq('status', 'pending'),
      ]);

      const revenue = (projects.data || []).reduce((sum, p) => sum + (p.sold_price || 0), 0);
      const pending = (payments.data || []).reduce((sum, p) => sum + (p.amount || 0), 0);

      setStats({
        totalLeads: leads.count || 0,
        activeProjects: projects.data?.length || 0,
        estimatesSent: estimates.count || 0,
        totalRevenue: revenue,
        pendingPayments: pending,
        closedThisMonth: 0,
      });
    }
    fetchStats();
  }, []);

  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <h1>Dashboard</h1>
        <p className="text-muted">Welcome to Barba Pro System</p>
      </header>

      <div className="stats-grid">
        <StatCard icon={Users} label="Total Leads" value={stats.totalLeads} accent="#60a5fa" />
        <StatCard icon={FolderKanban} label="Active Projects" value={stats.activeProjects} accent="#34d399" />
        <StatCard icon={FileText} label="Estimates Sent" value={stats.estimatesSent} accent="#fbbf24" />
        <StatCard icon={DollarSign} label="Revenue (Active)" value={formatCurrency(stats.totalRevenue)} accent="#a78bfa" />
        <StatCard icon={Clock} label="Pending Payments" value={formatCurrency(stats.pendingPayments)} accent="#fb923c" />
        <StatCard icon={TrendingUp} label="Closed This Month" value={stats.closedThisMonth} accent="#f472b6" />
      </div>

      <div className="dashboard-sections">
        <section className="dash-section">
          <h2>Recent Activity</h2>
          <p className="text-muted">Activity feed will appear here once the team starts using the system.</p>
        </section>
      </div>
    </div>
  );
}
