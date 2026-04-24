import { useEffect, useState } from 'react';
import { useEstimatorStore } from '../store/useEstimatorStore';
import { supabase } from '../lib/supabase';
import ServiceConfigurator from '../components/estimator/ServiceConfigurator';
import ReceiptSidebar from '../components/estimator/ReceiptSidebar';
import { User, Search, CheckCircle, Loader2, X, FileText } from 'lucide-react';

function ClientSearch({ onSelect, onClear, selectedContact }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase.from('contacts')
        .select('id, first_name, last_name, phone, address')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(6);
      setResults(data || []);
      setLoading(false);
      setOpen(true);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  if (selectedContact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px', background: '#10b98115', borderRadius: '12px',
        border: '2px solid #10b98155',
      }}>
        <CheckCircle size={20} color="#10b981" />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: '700', color: '#10b981', fontSize: '15px' }}>
            {selectedContact.first_name} {selectedContact.last_name}
          </p>
          {selectedContact.phone && (
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>{selectedContact.phone}</p>
          )}
        </div>
        <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 16px', background: '#1e293b', borderRadius: '12px',
        border: '2px solid #374151',
      }}>
        {loading ? <Loader2 size={16} className="spin" color="#6b7280" /> : <Search size={16} color="#6b7280" />}
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar cliente por nombre o telÃ©fono..."
          style={{
            background: 'none', border: 'none', outline: 'none',
            color: '#e2e8f0', fontSize: '14px', flex: 1,
          }}
          onFocus={() => results.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: '#1e293b', border: '1px solid #374151', borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', marginTop: '4px', overflow: 'hidden',
        }}>
          {results.map(c => (
            <button
              key={c.id}
              onMouseDown={() => { onSelect(c); setQuery(''); setOpen(false); setResults([]); }}
              style={{
                width: '100%', padding: '12px 16px', background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'left', display: 'flex', gap: '12px',
                alignItems: 'center', borderBottom: '1px solid #374151',
                color: '#e2e8f0', transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#334155'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: '#f9731622', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: '700', color: '#f97316', fontSize: '14px',
              }}>
                {c.first_name?.[0]}{c.last_name?.[0]}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>{c.first_name} {c.last_name}</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>
                  {c.phone || 'Ã¢EUR"'} {c.address ? `Ã· ${c.address}` : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Estimator() {
  const { fetchPrices, receiptItems, getGrandTotal, getSubtotal, clearReceipt } = useEstimatorStore();
  const [contact, setContact] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [estimateNum, setEstimateNum] = useState(null);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  const handleSave = async () => {
    if (!receiptItems.length) { alert('Agrega al menos un servicio al estimado.'); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        contact_id: contact?.id || null,
        created_by: user?.id,
        status: 'draft',
        work_type: [...new Set(receiptItems.map(i => i.service))].join(', '),
        subtotal: getSubtotal(),
        grand_total: getGrandTotal(),
        scope_of_work: receiptItems.map(i => `${i.name}: ${i.details}`).join('\n'),
        valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      };
      const { data, error } = await supabase.from('estimates').insert(payload).select('estimate_number').single();
      if (error) throw error;
      setEstimateNum(data.estimate_number);
      setSaved(true);
      clearReceipt();
    } catch (err) { alert('Error al guardar: ' + err.message); }
    finally { setSaving(false); }
  };

  if (saved) {
    return (
      <div className="admin-page p-6 lg:p-8">
        <div style={{
          maxWidth: '480px', margin: '80px auto', textAlign: 'center',
          background: '#1e293b', borderRadius: '20px', padding: '48px 32px',
          border: '1px solid #374151',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>Ã¢Å...</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '800' }}>Ã¡Estimado Guardado!</h2>
          <p style={{ color: '#9ca3af', marginBottom: '8px' }}>
            Estimado #{String(estimateNum).padStart(4, '0')} creado exitosamente.
          </p>
          {contact && (
            <p style={{ color: '#f97316', fontWeight: '600', marginBottom: '24px' }}>
              Cliente: {contact.first_name} {contact.last_name}
            </p>
          )}
          <button
            className="btn-primary"
            style={{ width: '100%' }}
            onClick={() => { setSaved(false); setContact(null); setEstimateNum(null); }}
          >
            <FileText size={18} /> Nuevo Estimado
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Estimado</h1>
        <p className="text-[#888888]">Selecciona servicios y genera un presupuesto para el cliente</p>
      </div>

      {/* Client Selector */}
      <div className="bg-[var(--bg-card)] border border-[#2a2a2a]/60 rounded-2xl p-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <User size={18} color="#f97316" />
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Cliente (opcional)</h2>
        </div>
        <ClientSearch
          selectedContact={contact}
          onSelect={setContact}
          onClear={() => setContact(null)}
        />
      </div>

      {/* Main 2-column layout */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0">
          <ServiceConfigurator />
        </div>
        <div className="w-full xl:w-96 xl:sticky xl:top-6 flex-none">
          <ReceiptSidebar />
          {receiptItems.length > 0 && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%', marginTop: '16px', padding: '16px',
                background: '#f97316', borderRadius: '12px', border: 'none',
                cursor: 'pointer', color: '#fff', fontWeight: '800',
                fontSize: '15px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '10px',
                boxShadow: '0 4px 20px rgba(249,115,22,0.4)',
              }}
            >
              {saving ? <Loader2 size={20} className="spin" /> : <FileText size={20} />}
              {saving ? 'Guardando...' : 'Guardar Estimado'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

