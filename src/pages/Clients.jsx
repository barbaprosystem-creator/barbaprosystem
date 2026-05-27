import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Search, Plus, Mail, Phone, Eye, Edit2, X, Loader2, MessageCircle } from 'lucide-react';
import OmnichannelChat from '../components/chat/OmnichannelChat';
import ClientDetail from './admin/ClientDetail';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [viewClient, setViewClient] = useState(null);
  const [chatModal, setChatModal] = useState({ open: false, cliente: null });
  const [saving, setSaving] = useState(false);
  const defaultClientState = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    source: 'other',
    pipeline_status: 'new_lead',
    sms_opt_in: false
  };
  const [currentClient, setCurrentClient] = useState(defaultClientState);

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

  const handleSaveClient = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const payload = { ...currentClient };
    delete payload.created_at;
    delete payload.updated_at;

    if (payload.id) {
      const { data, error } = await supabase
        .from('contacts')
        .update(payload)
        .eq('id', payload.id)
        .select();
        
      if (!error && data) {
        setClients(clients.map(c => c.id === data[0].id ? data[0] : c));
        setShowModal(false);
        setCurrentClient(defaultClientState);
      } else {
        console.error(error);
        alert('Error updating client.');
      }
    } else {
      // Auto-assign to current salesperson if the user has that role
      if (profile?.role === 'salesperson') {
        payload.assigned_to = profile.id;
      }

      const { data, error } = await supabase
        .from('contacts')
        .insert([payload])
        .select();
        
      if (!error && data) {
        setClients([data[0], ...clients]);
        setShowModal(false);
        setCurrentClient(defaultClientState);
      } else {
        console.error(error);
        alert('Error creating client.');
      }
    }
    setSaving(false);
  };

  const filtered = clients.filter(c =>
    c.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const statusMap = {
    new_lead: { label: 'New Lead', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    contacted: { label: 'Contacted', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    appointment_set: { label: 'Appointment Set', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    estimate_sent: { label: 'Estimate Sent', cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    closed_won: { label: 'Won', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    closed_lost: { label: 'Lost', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  };

  return (
    <>
      {viewClient ? (
        <ClientDetail clientId={viewClient} onBack={() => setViewClient(null)} />
      ) : (
        <div className="admin-page p-6 lg:p-10 space-y-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight">My Clients</h1>
              <p className="text-[#888888]">{filtered.length} contacts</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2 bg-[#0d0d0d] border border-[#2a2a2a]/50 rounded-xl px-4 py-2 w-full sm:w-64 focus-within:border-[var(--accent)] transition-colors">
                <Search size={18} className="text-[#555555]" />
                <input
                  type="text"
                  placeholder="Search client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-600"
                />
              </div>
              <button 
                onClick={() => { setCurrentClient(defaultClientState); setShowModal(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-orange-400 text-black font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.2)] active:scale-95 w-full sm:w-auto justify-center"
              >
                <Plus size={18} /> New Client
              </button>
            </div>
          </div>

          <div className="admin-card overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#555555] gap-4">
                <Users size={40} className="animate-pulse text-slate-700" />
                <p className="text-sm font-medium uppercase tracking-widest">Loading clients...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#555555] gap-4">
                <Search size={48} className="text-slate-700" />
                <p className="text-sm font-medium">No clients found matching the search.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1a1a1a]/50 bg-[#0d0d0d]/50">
                      <th className="py-4 px-6 text-xs font-bold text-[#888888] uppercase tracking-wider">Name</th>
                      <th className="py-4 px-6 text-xs font-bold text-[#888888] uppercase tracking-wider">Contact</th>
                      <th className="py-4 px-6 text-xs font-bold text-[#888888] uppercase tracking-wider">Status</th>
                      <th className="py-4 px-6 text-xs font-bold text-[#888888] uppercase tracking-wider">Source</th>
                      <th className="py-4 px-6 text-xs font-bold text-[#888888] uppercase tracking-wider">Date</th>
                      <th className="py-4 px-6 text-xs font-bold text-[#888888] uppercase tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filtered.map((client) => {
                      const s = statusMap[client.pipeline_status] || { label: client.pipeline_status || '-', cls: 'bg-[#1a1a1a] text-[#c0c0c0] border-[#2a2a2a]' };
                      return (
                        <tr key={client.id} className="hover:bg-[#1a1a1a]/30 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-sm">
                                {client.first_name?.[0]?.toUpperCase() || '?'}
                              </div>
                              <span className="font-semibold text-[#e0e0e0]">{client.first_name} {client.last_name}</span>
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
                            {client.source || '-'}
                          </td>
                          <td className="py-4 px-6 text-sm text-[#888888] font-medium">
                            {new Date(client.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex justify-center gap-2">
                              <button 
                                onClick={() => setChatModal({ open: true, cliente: client })}
                                className="p-2 text-[#888888] hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-colors" title="Chat"
                              >
                                <MessageCircle size={18} />
                              </button>
                              <button 
                                onClick={() => setViewClient(client.id)}
                                className="p-2 text-[#888888] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg transition-colors" title="View 360 File">
                                <Eye size={18} />
                              </button>
                              <button 
                                onClick={() => { setCurrentClient(client); setShowModal(true); }}
                                className="p-2 text-[#888888] hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="Edit"
                              >
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

          {/* Modal: Nuevo Cliente */}
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-5 border-b border-[#333] flex items-center justify-between bg-[#161616]">
                  <h2 className="text-xl font-bold text-white">{currentClient.id ? 'Edit Client' : 'New Client'}</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-[#222] rounded-xl text-[#888] hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleSaveClient} className="p-6 space-y-5">
                  <div className="flex gap-4">
                    <div className="space-y-1 flex-1">
                      <label className="text-sm font-medium text-[#aaa]">First Name <span className="text-[var(--accent)]">*</span></label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. John"
                        value={currentClient.first_name}
                        onChange={(e) => setCurrentClient({ ...currentClient, first_name: e.target.value })}
                        className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                      />
                    </div>
                    <div className="space-y-1 flex-1">
                      <label className="text-sm font-medium text-[#aaa]">Last Name <span className="text-[var(--accent)]">*</span></label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Smith"
                        value={currentClient.last_name}
                        onChange={(e) => setCurrentClient({ ...currentClient, last_name: e.target.value })}
                        className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-[#aaa]">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. john@email.com"
                      value={currentClient.email}
                      onChange={(e) => setCurrentClient({ ...currentClient, email: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-[#aaa]">Phone</label>
                    <input
                      type="tel"
                      placeholder="e.g. (555) 123-4567"
                      value={currentClient.phone}
                      onChange={(e) => setCurrentClient({ ...currentClient, phone: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-[#aaa]">Source</label>
                    <select
                      value={currentClient.source}
                      onChange={(e) => setCurrentClient({ ...currentClient, source: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                    >
                      <option value="other">Other (Manual)</option>
                      <option value="web">Website</option>
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="google">Google</option>
                      <option value="phone">Phone</option>
                      <option value="referral">Referral</option>
                      <option value="walk_in">Walk-in</option>
                      <option value="tiktok">TikTok</option>
                    </select>
                  </div>

                  <div className="flex items-start gap-3 mt-4 bg-[#1a1a1a] p-3 rounded-xl border border-[#333]">
                    <input 
                      type="checkbox" 
                      id="internalSmsOptIn"
                      checked={currentClient.sms_opt_in}
                      onChange={(e) => setCurrentClient({...currentClient, sms_opt_in: e.target.checked})}
                      className="mt-1 w-4 h-4 rounded border-[#333] text-[var(--accent)] focus:ring-[var(--accent)] bg-[#222]"
                    />
                    <label htmlFor="internalSmsOptIn" className="text-xs text-[#888] leading-tight">
                      <strong className="text-white">SMS Consent (A2P 10DLC):</strong> The client verbally or in writing agreed to receive text messages about their project. Data will not be shared with third parties.
                    </label>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-3 px-4 border border-[#333] hover:bg-[#222] text-white font-medium rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 py-3 px-4 bg-[var(--accent)] hover:bg-orange-400 text-black font-semibold rounded-xl transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Client'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* Modal: Chat Omnicanal */}
          {chatModal.open && chatModal.cliente && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-2xl h-[80vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-[#333] flex items-center justify-between bg-[#161616]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold">
                      {chatModal.cliente.first_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white leading-tight">
                        {chatModal.cliente.first_name} {chatModal.cliente.last_name}
                      </h2>
                      <p className="text-xs text-[#888]">{chatModal.cliente.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setChatModal({ open: false, cliente: null })}
                    className="p-2 hover:bg-[#222] rounded-xl text-[#888] hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <OmnichannelChat 
                    clienteId={chatModal.cliente.id} 
                    clienteTelefono={chatModal.cliente.phone} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
