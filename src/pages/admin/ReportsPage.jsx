import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart3, TrendingUp, DollarSign, Users, FileText, FolderKanban } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export default function ReportsPage() {
  const [stats, setStats] = useState({ leads:0, estimates:0, projects:0, revenue:0, avgDeal:0, convRate:0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    setLoading(true);
    const [leads, estimates, projects, payments] = await Promise.all([
      supabase.from('leads').select('id,status', { count:'exact' }),
      supabase.from('estimates').select('id,status,grand_total', { count:'exact' }),
      supabase.from('projects').select('id,sold_price,status', { count:'exact' }),
      supabase.from('payments').select('amount,status'),
    ]);

    const estData = estimates.data || [];
    const projData = projects.data || [];
    const payData = payments.data || [];
    const wonLeads = (leads.data||[]).filter(l => l.status === 'won').length;
    const totalLeads = leads.count || 1;

    setStats({
      leads: totalLeads,
      estimates: estimates.count || 0,
      projects: projects.count || 0,
      revenue: payData.filter(p => p.status==='received').reduce((s,p) => s+(p.amount||0), 0),
      avgDeal: projData.length ? projData.reduce((s,p) => s+(p.sold_price||0),0)/projData.length : 0,
      convRate: Math.round((wonLeads/totalLeads)*100),
    });

    const { data: activity } = await supabase.from('activity_log').select('*,user:profiles!activity_log_user_id_fkey(full_name)').order('created_at',{ascending:false}).limit(20);
    setRecentActivity(activity || []);
    setLoading(false);
  }

  const cards = [
    { label:'Total Leads', value:stats.leads, icon:Users, color:'#3b82f6' },
    { label:'Estimados', value:stats.estimates, icon:FileText, color:'#8b5cf6' },
    { label:'Proyectos', value:stats.projects, icon:FolderKanban, color:'#f59e0b' },
    { label:'Ingresos Cobrados', value:formatCurrency(stats.revenue), icon:DollarSign, color:'#10b981' },
    { label:'Ticket Promedio', value:formatCurrency(stats.avgDeal), icon:TrendingUp, color:'#06b6d4' },
    { label:'Tasa de Conversion', value:`${stats.convRate}%`, icon:BarChart3, color:'#ec4899' },
  ];

  return (
    <div className="reports-page">
      <div className="crm-toolbar">
        <div className="crm-toolbar-left"><h1>Reportes</h1></div>
      </div>

      <div className="reports-grid">
        {cards.map(c => (
          <div key={c.label} className="report-card">
            <div className="report-card-icon" style={{background:`${c.color}20`, color:c.color}}>
              <c.icon size={22}/>
            </div>
            <div>
              <p className="report-card-label">{c.label}</p>
              <p className="report-card-value">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="reports-section">
        <h2>Actividad Reciente</h2>
        {recentActivity.length > 0 ? (
          <div className="activity-list">
            {recentActivity.map(a => (
              <div key={a.id} className="activity-item">
                <div className="activity-dot"/>
                <div className="activity-content">
                  <span className="activity-user">{a.user?.full_name || 'Sistema'}</span>
                  <span className="activity-action">{a.action}</span>
                  <span className="activity-time">{new Date(a.created_at).toLocaleString('es')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#888888]" style={{padding:'2rem',textAlign:'center'}}>No hay actividad registrada aun. Las acciones de los usuarios apareceran aqui.</p>
        )}
      </div>
    </div>
  );
}

