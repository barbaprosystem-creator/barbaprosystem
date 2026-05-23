import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import {
  BarChart3, TrendingUp, DollarSign, Users, FileText,
  FolderKanban, CheckCircle2, Clock, XCircle, Wrench
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

const COLORS = {
  completed:   '#10b981',
  in_progress: '#f59e0b',
  cancelled:   '#ef4444',
  blue:        '#3b82f6',
  purple:      '#8b5cf6',
  cyan:        '#06b6d4',
};

const PIE_PALETTE = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#06b6d4','#ec4899','#ef4444','#f97316'];

// Custom tooltip for currency
function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#1a1a2e', border:'1px solid #333', borderRadius:8, padding:'10px 14px' }}>
      <p style={{ color:'#aaa', fontSize:12, marginBottom:4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight:600, fontSize:13 }}>
          {p.name}: {typeof p.value === 'number' && p.value > 1000 ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [loading, setLoading]           = useState(true);
  const [stats, setStats]               = useState({});
  const [statusChart, setStatusChart]   = useState([]);
  const [typeChart, setTypeChart]       = useState([]);
  const [revenueChart, setRevenueChart] = useState([]);
  const [expenseChart, setExpenseChart] = useState([]);
  const [topProjects, setTopProjects]   = useState([]);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [projectsRes, expensesRes, contactsRes, estimatesRes] = await Promise.all([
      supabase.from('projects').select('id,title,status,sold_price,total_costs,progress_pct,notes,created_at'),
      supabase.from('project_expenses').select('project_id,type,amount,description'),
      supabase.from('contacts').select('id,pipeline_status,created_at'),
      supabase.from('estimates').select('id,status,grand_total'),
    ]);

    const projects  = projectsRes.data  || [];
    const expenses  = expensesRes.data  || [];
    const contacts  = contactsRes.data  || [];
    const estimates = estimatesRes.data || [];

    // --- KPI Stats ---
    const totalRevenue   = projects.reduce((s, p) => s + (p.sold_price || 0), 0);
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

    // --- Status pie chart ---
    setStatusChart([
      { name: 'Completados', value: completedCount, color: COLORS.completed },
      { name: 'En Ejecución', value: inProgCount,    color: COLORS.in_progress },
      { name: 'Cancelados',  value: cancelledCount,  color: COLORS.cancelled },
    ].filter(d => d.value > 0));

    // --- Project types bar chart (top 10) ---
    const typeMap = {};
    projects.forEach(p => {
      const rawNote = p.notes || '';
      const typeMatch = rawNote.match(/Tipo:\s*([^\n\]]+)/);
      const type = typeMatch ? typeMatch[1].trim() : 'Otros';
      if (!typeMap[type]) typeMap[type] = { revenue: 0, count: 0 };
      typeMap[type].revenue += p.sold_price || 0;
      typeMap[type].count++;
    });
    const typeData = Object.entries(typeMap)
      .map(([name, d]) => ({ name, revenue: d.revenue, count: d.count }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    setTypeChart(typeData);

    // --- Revenue vs Costs bar (by status group) ---
    setRevenueChart([
      { name: 'Ingresos Totales', value: totalRevenue, fill: '#10b981' },
      { name: 'Gastos Totales',   value: totalCosts,   fill: '#ef4444' },
      { name: 'Ganancia Bruta',   value: totalProfit,  fill: '#3b82f6' },
    ]);

    // --- Expense breakdown ---
    setExpenseChart([
      { name: 'Mano de Obra', value: laborTotal, fill: '#8b5cf6' },
      { name: 'Materiales',   value: matTotal,   fill: '#f59e0b' },
      { name: 'Otros',        value: totalCosts - laborTotal - matTotal > 0 ? totalCosts - laborTotal - matTotal : 0, fill: '#06b6d4' },
    ].filter(d => d.value > 0));

    // --- Top 10 projects by revenue ---
    const top = [...projects]
      .sort((a, b) => (b.sold_price || 0) - (a.sold_price || 0))
      .slice(0, 10)
      .map(p => {
        const typeMatch = (p.notes || '').match(/Tipo:\s*([^\n\]]+)/);
        const type = typeMatch ? typeMatch[1].trim() : '';
        const name = p.title.replace(/^[^—]+—\s*/, '').substring(0, 35);
        return { name, type, revenue: p.sold_price || 0, costs: p.total_costs || 0, status: p.status };
      });
    setTopProjects(top);

    setLoading(false);
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:'#888' }}>
      <div style={{ textAlign:'center' }}>
        <div className="spinner" style={{ width:40, height:40, border:'3px solid #333', borderTop:'3px solid #10b981', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 12px' }}/>
        Cargando reportes...
      </div>
    </div>
  );

  const kpis = [
    { label: 'Total Proyectos',    value: stats.totalProjects,           icon: FolderKanban,  color: '#3b82f6' },
    { label: 'Ingresos 2026',      value: formatCurrency(stats.totalRevenue), icon: DollarSign,    color: '#10b981' },
    { label: 'Ganancia Bruta',     value: formatCurrency(stats.totalProfit),  icon: TrendingUp,    color: '#06b6d4' },
    { label: 'Margen de Ganancia', value: `${stats.margin}%`,            icon: BarChart3,     color: '#8b5cf6' },
    { label: 'Ticket Promedio',    value: formatCurrency(stats.avgTicket),    icon: FileText,      color: '#f59e0b' },
    { label: 'Contactos',          value: stats.totalContacts,           icon: Users,         color: '#ec4899' },
  ];

  const statusLabels = { completed:'Completado', in_progress:'En Ejecución', cancelled:'Cancelado' };
  const statusColors = { completed: COLORS.completed, in_progress: COLORS.in_progress, cancelled: COLORS.cancelled };

  return (
    <div className="reports-page" style={{ padding: '0 0 40px' }}>
      {/* Header */}
      <div className="crm-toolbar">
        <div className="crm-toolbar-left">
          <h1>Reportes & Analytics</h1>
          <span style={{ color:'#888', fontSize:13, marginLeft:8 }}>2026 — Actualizado en tiempo real</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16, padding:'0 24px 24px' }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background:'#141420', border:'1px solid #222', borderRadius:12, padding:'18px 20px', display:'flex', gap:14, alignItems:'center' }}>
            <div style={{ width:44, height:44, borderRadius:10, background:`${k.color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <k.icon size={20} color={k.color}/>
            </div>
            <div>
              <p style={{ color:'#666', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3 }}>{k.label}</p>
              <p style={{ color:'#fff', fontSize:20, fontWeight:700 }}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status summary strip */}
      <div style={{ display:'flex', gap:12, padding:'0 24px 24px' }}>
        {[
          { label:'✅ Completados', count: stats.completedCount, color:'#10b981', pct: Math.round((stats.completedCount/stats.totalProjects)*100) },
          { label:'🔄 En Ejecución', count: stats.inProgCount, color:'#f59e0b', pct: Math.round((stats.inProgCount/stats.totalProjects)*100) },
          { label:'❌ Cancelados', count: stats.cancelledCount, color:'#ef4444', pct: Math.round((stats.cancelledCount/stats.totalProjects)*100) },
        ].map(s => (
          <div key={s.label} style={{ flex:1, background:'#141420', border:`1px solid ${s.color}33`, borderRadius:12, padding:'14px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ color:'#ccc', fontSize:13 }}>{s.label}</span>
              <span style={{ color:s.color, fontWeight:700, fontSize:18 }}>{s.count}</span>
            </div>
            <div style={{ background:'#222', borderRadius:4, height:6 }}>
              <div style={{ background:s.color, width:`${s.pct||0}%`, height:6, borderRadius:4, transition:'width 0.8s ease' }}/>
            </div>
            <span style={{ color:'#555', fontSize:11, marginTop:4, display:'block' }}>{s.pct}% del total</span>
          </div>
        ))}
      </div>

      {/* Charts row 1: Revenue vs Costs + Status Pie */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:20, padding:'0 24px 20px' }}>
        {/* Revenue vs Costs bar */}
        <div style={{ background:'#141420', border:'1px solid #222', borderRadius:14, padding:'20px 24px' }}>
          <h2 style={{ color:'#fff', fontSize:15, fontWeight:600, marginBottom:20 }}>💰 Ingresos vs Gastos vs Ganancia</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueChart} margin={{ top:0, right:0, bottom:0, left:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222"/>
              <XAxis dataKey="name" tick={{ fill:'#888', fontSize:12 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'#888', fontSize:11 }} axisLine={false} tickLine={false}
                     tickFormatter={v => `$${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<CurrencyTooltip/>}/>
              <Bar dataKey="value" name="Monto" radius={[6,6,0,0]}>
                {revenueChart.map((entry, i) => <Cell key={i} fill={entry.fill}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Expense breakdown below */}
          <div style={{ display:'flex', gap:16, marginTop:16, paddingTop:16, borderTop:'1px solid #1f1f2e' }}>
            <div style={{ flex:1, textAlign:'center' }}>
              <p style={{ color:'#8b5cf6', fontWeight:700, fontSize:16 }}>{formatCurrency(stats.laborTotal)}</p>
              <p style={{ color:'#666', fontSize:11, marginTop:2 }}>Mano de Obra</p>
            </div>
            <div style={{ flex:1, textAlign:'center' }}>
              <p style={{ color:'#f59e0b', fontWeight:700, fontSize:16 }}>{formatCurrency(stats.matTotal)}</p>
              <p style={{ color:'#666', fontSize:11, marginTop:2 }}>Materiales</p>
            </div>
            <div style={{ flex:1, textAlign:'center' }}>
              <p style={{ color:'#10b981', fontWeight:700, fontSize:16 }}>{stats.margin}%</p>
              <p style={{ color:'#666', fontSize:11, marginTop:2 }}>Margen Neto</p>
            </div>
          </div>
        </div>

        {/* Status Pie */}
        <div style={{ background:'#141420', border:'1px solid #222', borderRadius:14, padding:'20px 24px' }}>
          <h2 style={{ color:'#fff', fontSize:15, fontWeight:600, marginBottom:10 }}>📊 Estado de Proyectos</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusChart} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                   paddingAngle={3} dataKey="value">
                {statusChart.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:4 }}>
            {statusChart.map(s => (
              <div key={s.name} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:10, height:10, borderRadius:2, background:s.color, flexShrink:0 }}/>
                <span style={{ color:'#ccc', fontSize:13, flex:1 }}>{s.name}</span>
                <span style={{ color:'#fff', fontWeight:600, fontSize:13 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2: Top types bar */}
      <div style={{ padding:'0 24px 20px' }}>
        <div style={{ background:'#141420', border:'1px solid #222', borderRadius:14, padding:'20px 24px' }}>
          <h2 style={{ color:'#fff', fontSize:15, fontWeight:600, marginBottom:20 }}>🔨 Ingresos por Tipo de Trabajo (Top 10)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={typeChart} layout="vertical" margin={{ top:0, right:20, bottom:0, left:130 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false}/>
              <XAxis type="number" tick={{ fill:'#888', fontSize:11 }} axisLine={false} tickLine={false}
                     tickFormatter={v => `$${(v/1000).toFixed(0)}k`}/>
              <YAxis type="category" dataKey="name" tick={{ fill:'#ccc', fontSize:12 }} axisLine={false} tickLine={false} width={125}/>
              <Tooltip content={<CurrencyTooltip/>}/>
              <Bar dataKey="revenue" name="Ingresos" fill="#3b82f6" radius={[0,6,6,0]}>
                {typeChart.map((_, i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 10 Projects Table */}
      <div style={{ padding:'0 24px 20px' }}>
        <div style={{ background:'#141420', border:'1px solid #222', borderRadius:14, padding:'20px 24px' }}>
          <h2 style={{ color:'#fff', fontSize:15, fontWeight:600, marginBottom:16 }}>🏆 Top 10 Proyectos por Ingreso</h2>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #222' }}>
                {['#','Cliente','Tipo de Trabajo','Ingresos','Gastos','Estado'].map(h => (
                  <th key={h} style={{ padding:'8px 12px', color:'#666', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', textAlign:'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topProjects.map((p, i) => (
                <tr key={i} style={{ borderBottom:'1px solid #1a1a1a' }}>
                  <td style={{ padding:'10px 12px', color:'#555', fontSize:13 }}>{i+1}</td>
                  <td style={{ padding:'10px 12px', color:'#fff', fontSize:13, fontWeight:500 }}>{p.name}</td>
                  <td style={{ padding:'10px 12px', color:'#888', fontSize:12 }}>{p.type}</td>
                  <td style={{ padding:'10px 12px', color:'#10b981', fontSize:13, fontWeight:600 }}>{formatCurrency(p.revenue)}</td>
                  <td style={{ padding:'10px 12px', color:'#ef4444', fontSize:13 }}>{formatCurrency(p.costs)}</td>
                  <td style={{ padding:'10px 12px' }}>
                    <span style={{
                      padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600,
                      background: `${statusColors[p.status] || '#888'}22`,
                      color: statusColors[p.status] || '#888',
                    }}>
                      {statusLabels[p.status] || p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
