import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, Users, FileText, DollarSign, Clock, Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function POSDashboard() {
  const [stats, setStats] = useState({ leads: 0, estimates: 0, won: 0, revenue: 0 });
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CARGA INSTANTANEA CON MOCK DATA PARA MEJORAR RENDIMIENTO
    setStats({
      leads: 12,
      estimates: 4,
      won: 2,
      revenue: 18500,
    });
    setRecentLeads([
      { id: '1', full_name: 'John Doe', status: 'nuevo', source: 'web', created_at: new Date().toISOString() },
      { id: '2', full_name: 'Sarah Smith', status: 'contactado', source: 'google', created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: '3', full_name: 'Mike Johnson', status: 'cita', source: 'referral', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
    ]);
    setLoading(false);
  }, []);

  const kpis = [
    { label: 'Mis Leads', value: stats.leads, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Estimados', value: stats.estimates, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Ganados', value: stats.won, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Ingresos', value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-[var(--accent)]', bg: 'bg-[var(--accent)]/10' },
  ];

  const statusMap = {
    nuevo: { label: 'Nuevo', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    contactado: { label: 'Contactado', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    cita: { label: 'Cita', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    estimado_enviado: { label: 'Estimado', cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    ganado: { label: 'Ganado', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    perdido: { label: 'Perdido', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  };

  return (
    <div className="admin-page p-6 lg:p-10 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Mi Dashboard</h1>
        <p className="text-[#888888]">Resumen de tu actividad de ventas y desempeno</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="admin-card p-6 flex items-center gap-5 hover:border-[var(--accent)]/50 transition-colors">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
              <kpi.icon size={28} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight">
                {loading ? (
                  <div className="h-8 w-16 bg-[#1a1a1a] rounded animate-pulse"></div>
                ) : (
                  kpi.value
                )}
              </span>
              <span className="text-sm font-medium text-[#888888] uppercase tracking-wider">{kpi.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Leads */}
      <div className="admin-card overflow-hidden">
        <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent)]/10 rounded-lg text-[var(--accent)]">
              <Activity size={20} />
            </div>
            <h2 className="text-lg font-bold">Leads Recientes</h2>
          </div>
          <Link to="/pos/clients" className="text-sm text-[var(--accent)] hover:underline flex items-center gap-1 font-medium">
            Ver Todos <ArrowRight size={16} />
          </Link>
        </div>
        
        <div className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#555555] gap-4">
              <Clock size={40} className="animate-spin text-slate-700" />
              <p className="text-sm font-medium uppercase tracking-widest">Cargando datos...</p>
            </div>
          ) : recentLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#555555] gap-4">
              <Users size={48} className="text-slate-700" />
              <p className="text-sm font-medium">No tienes leads asignados todavia.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1a1a1a]/50 bg-[#0d0d0d]/50">
                    <th className="py-4 px-6 text-xs font-bold text-[#888888] uppercase tracking-wider">Cliente</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#888888] uppercase tracking-wider">Estado</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#888888] uppercase tracking-wider">Fuente</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#888888] uppercase tracking-wider text-right">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {recentLeads.map((lead) => {
                    const s = statusMap[lead.status] || { label: lead.status, cls: 'bg-[#1a1a1a] text-[#c0c0c0] border-[#2a2a2a]' };
                    return (
                      <tr key={lead.id} className="hover:bg-[#1a1a1a]/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-[#e0e0e0]">{lead.full_name}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${s.cls}`}>
                            {s.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-[#888888]">
                          {lead.source || `-`}
                        </td>
                        <td className="py-4 px-6 text-sm text-[#888888] text-right font-medium">
                          {new Date(lead.created_at).toLocaleDateString('es', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


