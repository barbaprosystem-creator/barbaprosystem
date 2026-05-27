import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, Users, FileText, DollarSign, Clock, Activity, ArrowRight, CalendarDays, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function POSDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // States
  const [loading, setLoading] = useState(true);
  const [summaryPeriod, setSummaryPeriod] = useState('all');
  const [recentLeads, setRecentLeads] = useState([]);
  
  const [stats, setStats] = useState({
    leads: 0,
    estimates: 0,
    approvedCount: 0,
    approvedRevenue: 0,
    commission: 0
  });

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        setLoading(true);
        const [
          { data: leads, count: leadsCount },
          { count: estimatesCount },
          { data: estimates }
        ] = await Promise.all([
          supabase.from('contacts').select('*', { count: 'exact' }).eq('assigned_to', user.id).order('created_at', { ascending: false }),
          supabase.from('estimates').select('*', { count: 'exact' }).eq('created_by', user.id),
          supabase.from('estimates').select('grand_total, status, updated_at').eq('created_by', user.id)
        ]);

        // Filter approved estimates based on summaryPeriod
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        let approvedCount = 0;
        let approvedRevenue = 0;

        (estimates || []).forEach(e => {
          if (e.status === 'approved' || e.status === 'accepted') {
            const dateToUse = new Date(e.updated_at || new Date());
            
            let include = false;
            if (summaryPeriod === 'all') include = true;
            else if (summaryPeriod === 'week' && dateToUse >= startOfWeek) include = true;
            else if (summaryPeriod === 'month' && dateToUse >= startOfMonth) include = true;
            else if (summaryPeriod === 'year' && dateToUse >= startOfYear) include = true;

            if (include) {
              approvedCount++;
              approvedRevenue += (e.grand_total || 0);
            }
          }
        });

        let finalLeads = leads?.slice(0, 5) || [];
        
        setStats({
          leads: leadsCount || 0,
          estimates: estimatesCount || 0,
          approvedCount,
          approvedRevenue,
          commission: approvedRevenue * 0.05
        });

        setRecentLeads(finalLeads);
      } catch (err) {
        console.error('Error loading POS dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, summaryPeriod]);

  const kpis = [
    { label: 'Total Leads', value: stats.leads, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Approved', value: stats.approvedCount, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Approved Amount', value: `$${stats.approvedRevenue.toLocaleString('en-US', {minimumFractionDigits: 2})}`, icon: DollarSign, color: 'text-[var(--accent)]', bg: 'bg-[var(--accent)]/10' },
    { label: 'My Commission (5%)', value: `$${stats.commission.toLocaleString('en-US', {minimumFractionDigits: 2})}`, icon: Wallet, color: 'text-[#facb00]', bg: 'bg-[#facb00]/10', glow: true },
  ];

  const statusMap = {
    nuevo: { label: 'New', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    contactado: { label: 'Contacted', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    cita: { label: 'Appointment', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    estimado_enviado: { label: 'Estimate Sent', cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    ganado: { label: 'Won', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    perdido: { label: 'Lost', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  };

  return (
    <div className="admin-page p-6 lg:p-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Summary</h1>
          <p className="text-[#888888]">Performance and generated commissions</p>
        </div>
        
        {/* Time Filters */}
        <div className="flex bg-[#1a1a1a] border border-[#333] rounded-lg p-1">
          <button 
            onClick={() => setSummaryPeriod('week')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${summaryPeriod === 'week' ? 'bg-[#333] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            This Week
          </button>
          <button 
            onClick={() => setSummaryPeriod('month')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${summaryPeriod === 'month' ? 'bg-[#333] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            This Month
          </button>
          <button 
            onClick={() => setSummaryPeriod('year')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${summaryPeriod === 'year' ? 'bg-[#333] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            This Year
          </button>
          <button 
            onClick={() => setSummaryPeriod('all')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${summaryPeriod === 'all' ? 'bg-[#333] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`admin-card p-6 flex items-center gap-5 transition-colors ${kpi.glow ? 'border-[#facb00]/30 shadow-[0_0_15px_rgba(250,203,0,0.1)]' : 'hover:border-[var(--accent)]/50'}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
              <kpi.icon size={28} />
            </div>
            <div className="flex flex-col">
              <span className={`text-2xl font-bold tracking-tight ${kpi.glow ? 'text-[#facb00]' : ''}`}>
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
            <h2 className="text-lg font-bold">Recent Leads</h2>
          </div>
          <Link to="/pos/pipeline" className="text-sm text-[var(--accent)] hover:underline flex items-center gap-1 font-medium">
            Go to CRM Pipeline <ArrowRight size={16} />
          </Link>
        </div>
        
        <div className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#555555] gap-4">
              <Clock size={40} className="animate-spin text-slate-700" />
              <p className="text-sm font-medium uppercase tracking-widest">Loading data...</p>
            </div>
          ) : recentLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#555555] gap-4">
              <Users size={48} className="text-slate-700" />
              <p className="text-sm font-medium">You have no leads assigned yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1a1a1a]/50 bg-[#0d0d0d]/50">
                    <th className="py-4 px-6 text-xs font-bold text-[#888888] uppercase tracking-wider">Client</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#888888] uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#888888] uppercase tracking-wider">Source</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#888888] uppercase tracking-wider text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {recentLeads.map((lead) => {
                    const s = statusMap[lead.status] || { label: lead.status, cls: 'bg-[#1a1a1a] text-[#c0c0c0] border-[#2a2a2a]' };
                    return (
                      <tr key={lead.id} onClick={() => navigate('/pos/pipeline')} className="hover:bg-[#1a1a1a]/50 transition-colors cursor-pointer">
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
                          {new Date(lead.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
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
