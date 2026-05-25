import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  BarChart3, TrendingUp, DollarSign, Users, FileText, FolderKanban,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import PinLock from '../../components/PinLock';
import { useLanguage } from '../../i18n/LanguageContext';

const COLORS = {
  completed:   '#10b981',
  in_progress: '#f59e0b',
  cancelled:   '#ef4444',
};
const PIE_PALETTE = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#06b6d4','#ec4899','#ef4444','#f97316'];

function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rpt-tooltip">
      <p className="rpt-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600, fontSize: 13 }}>
          {p.name}: {typeof p.value === 'number' && p.value > 999 ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const { t } = useLanguage();
  const [loading, setLoading]           = useState(true);
  const [stats, setStats]               = useState({});
  const [statusChart, setStatusChart]   = useState([]);
  const [typeChart, setTypeChart]       = useState([]);
  const [revenueChart, setRevenueChart] = useState([]);
  const [topProjects, setTopProjects]   = useState([]);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [projectsRes, expensesRes, contactsRes, estimatesRes] = await Promise.all([
      supabase.from('projects').select('id,title,status,sold_price,total_costs,notes'),
      supabase.from('project_expenses').select('type,amount'),
      supabase.from('contacts').select('id,pipeline_status'),
      supabase.from('estimates').select('id,status'),
    ]);

    const projects  = projectsRes.data  || [];
    const expenses  = expensesRes.data  || [];
    const contacts  = contactsRes.data  || [];
    const estimates = estimatesRes.data || [];

    const totalRevenue   = projects.reduce((s, p) => s + (p.sold_price  || 0), 0);
    const totalCosts     = projects.reduce((s, p) => s + (p.total_costs || 0), 0);
    const totalProfit    = totalRevenue - totalCosts;
    const completedCount = projects.filter(p => p.status === 'completed').length;
    const inProgCount    = projects.filter(p => p.status === 'in_progress').length;
    const cancelledCount = projects.filter(p => p.status === 'cancelled').length;
    const avgTicket      = projects.length ? totalRevenue / projects.length : 0;
    const laborTotal     = expenses.filter(e => e.type === 'labor').reduce((s, e) => s + (e.amount || 0), 0);
    const matTotal       = expenses.filter(e => e.type === 'material').reduce((s, e) => s + (e.amount || 0), 0);
    const margin         = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

    setStats({ totalRevenue, totalCosts, totalProfit, completedCount, inProgCount, cancelledCount,
               avgTicket, laborTotal, matTotal, margin, totalProjects: projects.length,
               totalContacts: contacts.length, totalEstimates: estimates.length });

    setStatusChart([
      { name: 'Completados', value: completedCount, color: '#10b981' },
      { name: 'En Ejecución', value: inProgCount,    color: '#f59e0b' },
      { name: 'Cancelados',   value: cancelledCount, color: '#ef4444' },
    ].filter(d => d.value > 0));

    const typeMap = {};
    projects.forEach(p => {
      const m = (p.notes || '').match(/Tipo:\s*([^\n\]]+)/);
      const type = m ? m[1].trim() : 'Otros';
      if (!typeMap[type]) typeMap[type] = { revenue: 0, count: 0 };
      typeMap[type].revenue += p.sold_price || 0;
      typeMap[type].count++;
    });
    setTypeChart(
      Object.entries(typeMap)
        .map(([name, d]) => ({ name, revenue: d.revenue, count: d.count }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8)
    );

    setRevenueChart([
      { name: 'Ingresos',  value: totalRevenue, fill: '#10b981' },
      { name: 'Gastos',    value: totalCosts,   fill: '#ef4444' },
      { name: 'Ganancia',  value: totalProfit,  fill: '#3b82f6' },
    ]);

    setTopProjects(
      [...projects]
        .sort((a, b) => (b.sold_price || 0) - (a.sold_price || 0))
        .slice(0, 10)
        .map(p => {
          const m = (p.notes || '').match(/Tipo:\s*([^\n\]]+)/);
          return {
            name:    p.title.replace(/^[^—]+—\s*/, '').substring(0, 32),
            type:    m ? m[1].trim() : '',
            revenue: p.sold_price  || 0,
            costs:   p.total_costs || 0,
            status:  p.status,
          };
        })
    );

    setLoading(false);
  }

  if (loading) return (
    <div className="rpt-loading">
      <div className="rpt-spinner" />
      <span>{t('actions.loading')}</span>
    </div>
  );

  const kpis = [
    { label: 'Proyectos',      value: stats.totalProjects,                icon: FolderKanban, color: '#3b82f6' },
    { label: 'Ingresos 2026',  value: formatCurrency(stats.totalRevenue), icon: DollarSign,   color: '#10b981' },
    { label: 'Ganancia Bruta', value: formatCurrency(stats.totalProfit),  icon: TrendingUp,   color: '#06b6d4' },
    { label: 'Margen',         value: `${stats.margin}%`,                 icon: BarChart3,    color: '#8b5cf6' },
    { label: 'Ticket Prom.',   value: formatCurrency(stats.avgTicket),    icon: FileText,     color: '#f59e0b' },
    { label: 'Contactos',      value: stats.totalContacts,                icon: Users,        color: '#ec4899' },
  ];

  const statusRows = [
    { label: '✅ Completados',  count: stats.completedCount, color: '#10b981', pct: Math.round((stats.completedCount / stats.totalProjects) * 100) },
    { label: '🔄 En Ejecución', count: stats.inProgCount,    color: '#f59e0b', pct: Math.round((stats.inProgCount    / stats.totalProjects) * 100) },
    { label: '❌ Cancelados',   count: stats.cancelledCount, color: '#ef4444', pct: Math.round((stats.cancelledCount / stats.totalProjects) * 100) },
  ];

  const statusColors = { completed: '#10b981', in_progress: '#f59e0b', cancelled: '#ef4444' };
  const statusLabels = { completed: 'Completado', in_progress: 'En Ejecución', cancelled: 'Cancelado' };

  return (
    <PinLock pin="2012" title="Reportes & Analytics — Restringido">
    <div className="reports-page">
      {/* Header */}
      <div className="crm-toolbar">
        <div className="crm-toolbar-left">
          <h1>{t('reports.title')} & Analytics</h1>
          <span className="rpt-subtitle">2026 · Tiempo real</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="rpt-kpi-grid">
        {kpis.map(k => (
          <div key={k.label} className="rpt-kpi-card">
            <div className="rpt-kpi-icon" style={{ background: `${k.color}18`, color: k.color }}>
              <k.icon size={20} />
            </div>
            <div className="rpt-kpi-body">
              <p className="rpt-kpi-label">{k.label}</p>
              <p className="rpt-kpi-value">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status Strip */}
      <div className="rpt-status-strip">
        {statusRows.map(s => (
          <div key={s.label} className="rpt-status-card" style={{ borderColor: `${s.color}33` }}>
            <div className="rpt-status-header">
              <span className="rpt-status-name">{s.label}</span>
              <span className="rpt-status-count" style={{ color: s.color }}>{s.count}</span>
            </div>
            <div className="rpt-progress-track">
              <div className="rpt-progress-fill" style={{ background: s.color, width: `${s.pct || 0}%` }} />
            </div>
            <span className="rpt-progress-pct">{s.pct || 0}% del total</span>
          </div>
        ))}
      </div>

      {/* Revenue vs Costs + Pie */}
      <div className="rpt-charts-row">
        {/* Bar chart */}
        <div className="rpt-chart-card rpt-chart-main">
          <h2 className="rpt-chart-title">💰 Ingresos vs Gastos vs Ganancia</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueChart} margin={{ top: 0, right: 0, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CurrencyTooltip />} />
              <Bar dataKey="value" name="Monto" radius={[6, 6, 0, 0]}>
                {revenueChart.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Mini stats */}
          <div className="rpt-mini-stats">
            <div className="rpt-mini-stat">
              <p style={{ color: '#8b5cf6' }}>{formatCurrency(stats.laborTotal)}</p>
              <span>Mano de Obra</span>
            </div>
            <div className="rpt-mini-stat">
              <p style={{ color: '#f59e0b' }}>{formatCurrency(stats.matTotal)}</p>
              <span>Materiales</span>
            </div>
            <div className="rpt-mini-stat">
              <p style={{ color: '#10b981' }}>{stats.margin}%</p>
              <span>Margen Neto</span>
            </div>
          </div>
        </div>

        {/* Pie chart */}
        <div className="rpt-chart-card rpt-chart-pie">
          <h2 className="rpt-chart-title">📊 Estado de Proyectos</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusChart} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                paddingAngle={3} dataKey="value">
                {statusChart.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="rpt-pie-legend">
            {statusChart.map(s => (
              <div key={s.name} className="rpt-pie-legend-item">
                <div className="rpt-pie-dot" style={{ background: s.color }} />
                <span>{s.name}</span>
                <strong>{s.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Types bar (horizontal) */}
      <div className="rpt-section-pad">
        <div className="rpt-chart-card">
          <h2 className="rpt-chart-title">🔨 Ingresos por Tipo de Trabajo (Top 8)</h2>
          <div className="rpt-horizontal-chart-wrap">
            <ResponsiveContainer width="100%" height={Math.max(220, typeChart.length * 36)}>
              <BarChart data={typeChart} layout="vertical"
                margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#ccc', fontSize: 11 }}
                  axisLine={false} tickLine={false} width={110} />
                <Tooltip content={<CurrencyTooltip />} />
                <Bar dataKey="revenue" name="Ingresos" radius={[0, 6, 6, 0]}>
                  {typeChart.map((_, i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 10 Projects */}
      <div className="rpt-section-pad">
        <div className="rpt-chart-card">
          <h2 className="rpt-chart-title">🏆 Top 10 Proyectos por Ingreso</h2>
          {/* Mobile cards view */}
          <div className="rpt-top-cards">
            {topProjects.map((p, i) => (
              <div key={i} className="rpt-top-card">
                <div className="rpt-top-card-rank">#{i + 1}</div>
                <div className="rpt-top-card-body">
                  <p className="rpt-top-card-name">{p.name}</p>
                  <p className="rpt-top-card-type">{p.type}</p>
                </div>
                <div className="rpt-top-card-right">
                  <p className="rpt-top-card-revenue">{formatCurrency(p.revenue)}</p>
                  <span className="rpt-status-badge" style={{
                    background: `${statusColors[p.status] || '#888'}22`,
                    color: statusColors[p.status] || '#888',
                  }}>
                    {statusLabels[p.status] || p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </PinLock>
  );
}
