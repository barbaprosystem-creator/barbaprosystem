import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Search, Plus, Mail, Phone, Eye, Edit2 } from 'lucide-react';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      setClients(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = clients.filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Mis Clientes</h1>
          <p className="text-[#888888]">{filtered.length} contactos</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2 bg-[#0d0d0d] border border-[#2a2a2a]/50 rounded-xl px-4 py-2 w-full sm:w-64 focus-within:border-[var(--accent)] transition-colors">
            <Search size={18} className="text-[#555555]" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-600"
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-orange-400 text-black font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.2)] active:scale-95 w-full sm:w-auto justify-center">
            <Plus size={18} /> Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#555555] gap-4">
            <Users size={40} className="animate-pulse text-slate-700" />
            <p className="text-sm font-medium uppercase tracking-widest">Cargando clientes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#555555] gap-4">
            <Search size={48} className="text-slate-700" />
            <p className="text-sm font-medium">No se encontraron clientes que coincidan con la busqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1a1a1a]/50 bg-[#0d0d0d]/50">
                  <th className="py-4 px-6 text-xs font-bold text-[#888888] uppercase tracking-wider">Nombre</th>
                  <th className="py-4 px-6 text-xs font-bold text-[#888888] uppercase tracking-wider">Contacto</th>
                  <th className="py-4 px-6 text-xs font-bold text-[#888888] uppercase tracking-wider">Estado</th>
                  <th className="py-4 px-6 text-xs font-bold text-[#888888] uppercase tracking-wider">Fuente</th>
                  <th className="py-4 px-6 text-xs font-bold text-[#888888] uppercase tracking-wider">Fecha</th>
                  <th className="py-4 px-6 text-xs font-bold text-[#888888] uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map((client) => {
                  const s = statusMap[client.status] || { label: client.status || 'âEUR"', cls: 'bg-[#1a1a1a] text-[#c0c0c0] border-[#2a2a2a]' };
                  return (
                    <tr key={client.id} className="hover:bg-[#1a1a1a]/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-sm">
                            {client.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="font-semibold text-[#e0e0e0]">{client.full_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1 text-sm">
                          {client.email && (
                            <span className="flex items-center gap-2 text-[#c0c0c0]">
                              <Mail size={14} className="text-[#555555]" /> {client.email}
                            </span>
                          )}
                          {client.phone && (
                            <span className="flex items-center gap-2 text-[#888888]">
                              <Phone size={14} className="text-slate-600" /> {client.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${s.cls}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-[#888888]">
                        {client.source || 'âEUR"'}
                      </td>
                      <td className="py-4 px-6 text-sm text-[#888888] font-medium">
                        {new Date(client.created_at).toLocaleDateString('es', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center gap-2">
                          <button className="p-2 text-[#888888] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg transition-colors" title="Ver">
                            <Eye size={18} />
                          </button>
                          <button className="p-2 text-[#888888] hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="Editar">
                            <Edit2 size={18} />
                          </button>
                        </div>
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
  );
}

