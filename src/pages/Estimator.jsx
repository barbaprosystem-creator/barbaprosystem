import { useEffect, useState } from 'react';
import { useEstimatorStore } from '../store/useEstimatorStore';
import { supabase } from '../lib/supabase';
import ServiceConfigurator from '../components/estimator/ServiceConfigurator';
import ReceiptSidebar from '../components/estimator/ReceiptSidebar';
import JobsitePhotos from '../components/estimator/JobsitePhotos';
import AIEstimateGenerator from '../components/estimator/AIEstimateGenerator';
import { User, Search, CheckCircle, Loader2, X, FileText, Sparkles, Settings2 } from 'lucide-react';

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
          placeholder="Search client by name or phone..."
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
                  {c.phone || '-'} {c.address ? `. ${c.address}` : ''}
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
  const { 
    fetchPrices, 
    receiptItems, 
    getGrandTotal, 
    getSubtotal, 
    clearReceipt,
    selectedContactId,
    setSelectedContactId,
    editingEstimateId,
    setEditingEstimateId,
    notes,
    setNotes
  } = useEstimatorStore();
  
  const [contact, setContact] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [estimateNum, setEstimateNum] = useState(null);
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' or 'manual'
  const [scans, setScans] = useState([]);
  const [showScanImporter, setShowScanImporter] = useState(false);

  const store = useEstimatorStore();

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  useEffect(() => {
    if (!selectedContactId) {
      setContact(null);
      setScans([]);
      return;
    }
    supabase.from('contacts')
      .select('id, first_name, last_name, phone, address')
      .eq('id', selectedContactId)
      .single()
      .then(({ data }) => {
        if (data) setContact(data);
      });

    // Fetch mobile scans for client
    supabase.from('jobsite_scans')
      .select('*')
      .eq('contact_id', selectedContactId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setScans(data);
        }
      });
  }, [selectedContactId]);

  const handleImportScanValue = (scan, type) => {
    if (type === 'siding') {
      store.setSidingField('sqft', String(scan.wall_area_sqft));
      alert(`Imported ${scan.wall_area_sqft} sqft into Siding!`);
    } else if (type === 'gutters') {
      store.setGutterField('feet', String(scan.perimeter_ft));
      alert(`Imported ${scan.perimeter_ft} LF into Gutters!`);
    } else if (type === 'fences') {
      store.setFencesField('lf', String(scan.perimeter_ft));
      alert(`Imported ${scan.perimeter_ft} LF into Fences!`);
    } else if (type === 'windows') {
      store.setWindowsField('quantity', String(scan.window_count));
      alert(`Imported ${scan.window_count} windows into Windows!`);
    } else if (type === 'doors') {
      store.setDoorsField('quantity', String(scan.door_count));
      alert(`Imported ${scan.door_count} doors into Doors!`);
    } else if (type === 'roofing') {
      const sq = Math.round(scan.floor_area_sqft / 100);
      store.setRoofingField('squares', String(sq));
      alert(`Imported ${sq} SQ (calculated from ${scan.floor_area_sqft} sqft floor area) into Roofing!`);
    }
  };

  const handleImportAll = (scan) => {
    store.setSidingField('sqft', String(scan.wall_area_sqft || 0));
    store.setGutterField('feet', String(scan.perimeter_ft || 0));
    store.setFencesField('lf', String(scan.perimeter_ft || 0));
    store.setWindowsField('quantity', String(scan.window_count || 0));
    store.setDoorsField('quantity', String(scan.door_count || 0));
    const sq = Math.round((scan.floor_area_sqft || 0) / 100);
    store.setRoofingField('squares', String(sq));
    alert('All mobile measurements imported to configurators!');
    setShowScanImporter(false);
  };

  const handleSave = async () => {
    if (!receiptItems.length) { alert('Add at least one service to the estimate.'); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let photoUrls = [];
      if (photos.length > 0) {
        for (const p of photos) {
          try {
            const fileExt = p.file.name.split('.').pop() || 'jpg';
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            const filePath = `${user?.id || 'public'}/${fileName}`;
            
            const { error: uploadError } = await supabase.storage.from('jobsite_photos').upload(filePath, p.file);
            if (!uploadError) {
              const { data } = supabase.storage.from('jobsite_photos').getPublicUrl(filePath);
              photoUrls.push(data.publicUrl);
            } else {
              console.error('Error uploading photo:', uploadError);
            }
          } catch (e) {
            console.error('Upload catch error:', e);
          }
        }
      }

      let finalScope = receiptItems.map(i => `${i.name}: ${i.details}`).join('\n');
      if (photoUrls.length > 0) {
        finalScope += '\n\n[INSPECTION PHOTOS]\n' + photoUrls.join('\n');
      }

      const payload = {
        contact_id: selectedContactId || null,
        created_by: user?.id,
        status: 'draft',
        work_type: [...new Set(receiptItems.map(i => i.service))].join(', '),
        subtotal: getSubtotal(),
        grand_total: getGrandTotal(),
        scope_of_work: finalScope,
        notes: notes,
        valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      };

      let estId;
      let estNum;

      if (editingEstimateId) {
        const { data, error } = await supabase
          .from('estimates')
          .update(payload)
          .eq('id', editingEstimateId)
          .select('id, estimate_number')
          .single();
        if (error) throw error;
        estId = data.id;
        estNum = data.estimate_number;

        // Delete previous items to reinsert updated list
        await supabase.from('estimate_items').delete().eq('estimate_id', editingEstimateId);
      } else {
        const { data, error } = await supabase
          .from('estimates')
          .insert(payload)
          .select('id, estimate_number')
          .single();
        if (error) throw error;
        estId = data.id;
        estNum = data.estimate_number;
      }

      // Save estimate items
      if (receiptItems.length > 0) {
        await supabase.from('estimate_items').insert(
          receiptItems.map(item => ({
            estimate_id: estId,
            description: item.name,
            details: item.details,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            service_type: item.service
          }))
        );
      }

      setEstimateNum(estNum);
      setSaved(true);
      clearReceipt();
      setPhotos([]);
      setEditingEstimateId(null);
      setSelectedContactId('');
    } catch (err) { alert('Error saving: ' + err.message); }
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
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✓</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '800' }}>Estimate Saved!</h2>
          <p style={{ color: '#9ca3af', marginBottom: '8px' }}>
            Estimate #{String(estimateNum).padStart(4, '0')} created successfully.
          </p>
          {contact && (
            <p style={{ color: '#f97316', fontWeight: '600', marginBottom: '24px' }}>
              Client: {contact.first_name} {contact.last_name}
            </p>
          )}
          <button
            className="btn-primary"
            style={{ width: '100%' }}
            onClick={() => { setSaved(false); setContact(null); setEstimateNum(null); }}
          >
            <FileText size={18} /> New Estimate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">New Estimate</h1>
        <p className="text-[#888888]">Select services and generate a quote for the client</p>
      </div>

      {/* Client Selector */}
      <div className="bg-[var(--bg-card)] border border-[#2a2a2a]/60 rounded-2xl p-6 space-y-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <User size={18} color="#f97316" />
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Client (optional)</h2>
        </div>
        <ClientSearch
          selectedContact={contact}
          onSelect={(c) => setSelectedContactId(c.id)}
          onClear={() => setSelectedContactId('')}
        />

        {scans.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-[#f97316]/10 border border-[#f97316]/30 rounded-xl mt-3 animation-fade-in">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-sm font-bold text-[#e2e8f0]">LiDAR Mobile Scan Detected</p>
                <p className="text-xs text-slate-400">
                  {scans.length} scan(s) available. Last scan on {new Date(scans[0].created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowScanImporter(true)}
              className="px-4 py-2 text-xs font-bold text-black bg-[#f97316] rounded-lg hover:bg-[#e06612] transition-colors"
            >
              Import Measurements
            </button>
          </div>
        )}
      </div>

      <JobsitePhotos photos={photos} setPhotos={setPhotos} />

      {/* Mode Selector */}
      <div className="flex gap-4 mb-6 border-b border-[#374151] pb-2">
        <button 
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-4 py-2 font-bold transition-colors ${activeTab === 'ai' ? 'text-[#f97316] border-b-2 border-[#f97316]' : 'text-[#9ca3af] hover:text-white'}`}
        >
          <Sparkles size={18} />
          AI Assistant (Voice/Text)
        </button>
        <button 
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-4 py-2 font-bold transition-colors ${activeTab === 'manual' ? 'text-[#f97316] border-b-2 border-[#f97316]' : 'text-[#9ca3af] hover:text-white'}`}
        >
          <Settings2 size={18} />
          Manual Configuration
        </button>
      </div>

      {/* Main 2-column layout */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0">
          {activeTab === 'ai' ? (
            <AIEstimateGenerator />
          ) : (
            <ServiceConfigurator />
          )}
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
              {saving ? 'Saving...' : 'Save Estimate'}
            </button>
          )}
        </div>
      </div>

      {/* Scan Importer Modal */}
      {showScanImporter && scans.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#e2e8f0]">Import LiDAR Measurements</h3>
                <p className="text-xs text-slate-400">Select which measurement to load into the configurator</p>
              </div>
              <button 
                onClick={() => setShowScanImporter(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {scans.map((scan, idx) => (
                <div key={scan.id} className="bg-slate-950/60 p-4 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs text-slate-500 font-bold border-b border-slate-800/50 pb-2">
                    <span>SCAN #{scans.length - idx} ({scan.scan_type.toUpperCase()})</span>
                    <span>{new Date(scan.created_at).toLocaleString()}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                      <div>
                        <p className="text-xs text-slate-500">Wall Area</p>
                        <p className="font-bold text-[#e2e8f0]">{scan.wall_area_sqft} sqft</p>
                      </div>
                      <button
                        onClick={() => handleImportScanValue(scan, 'siding')}
                        className="px-2.5 py-1 text-[11px] font-bold bg-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/30 rounded transition"
                      >
                        To Siding
                      </button>
                    </div>

                    <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                      <div>
                        <p className="text-xs text-slate-500">Floor Area</p>
                        <p className="font-bold text-[#e2e8f0]">{scan.floor_area_sqft} sqft</p>
                      </div>
                      <button
                        onClick={() => handleImportScanValue(scan, 'roofing')}
                        className="px-2.5 py-1 text-[11px] font-bold bg-[#f59e0b]/20 text-[#f59e0b] hover:bg-[#f59e0b]/30 rounded transition"
                      >
                        To Roof
                      </button>
                    </div>

                    <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                      <div>
                        <p className="text-xs text-slate-500">Perimeter</p>
                        <p className="font-bold text-[#e2e8f0]">{scan.perimeter_ft} LF</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleImportScanValue(scan, 'gutters')}
                          className="px-2 py-0.5 text-[10px] font-bold bg-[#3b82f6]/20 text-[#3b82f6] hover:bg-[#3b82f6]/30 rounded transition"
                        >
                          To Gutters
                        </button>
                        <button
                          onClick={() => handleImportScanValue(scan, 'fences')}
                          className="px-2 py-0.5 text-[10px] font-bold bg-[#34d399]/20 text-[#34d399] hover:bg-[#34d399]/30 rounded transition"
                        >
                          To Fences
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                      <div>
                        <p className="text-xs text-slate-500">Windows & Doors</p>
                        <p className="font-bold text-[#e2e8f0]">W: {scan.window_count} | D: {scan.door_count}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleImportScanValue(scan, 'windows')}
                          className="px-2 py-0.5 text-[10px] font-bold bg-[#8b5cf6]/20 text-[#8b5cf6] hover:bg-[#8b5cf6]/30 rounded transition"
                        >
                          W
                        </button>
                        <button
                          onClick={() => handleImportScanValue(scan, 'doors')}
                          className="px-2 py-0.5 text-[10px] font-bold bg-[#fb7185]/20 text-[#fb7185] hover:bg-[#fb7185]/30 rounded transition"
                        >
                          D
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleImportAll(scan)}
                    className="w-full mt-3 py-2 bg-[#f97316] text-black font-bold text-xs rounded-lg hover:bg-[#e06612] transition-colors"
                  >
                    Import All Measurements to Configurator
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowScanImporter(false)}
                className="px-5 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
