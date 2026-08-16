import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Radar, Search, Filter, Copy, Check, ExternalLink, Flame, Sparkles,
  MapPin, DollarSign, Clock, MessageSquare, ArrowRight, RefreshCw,
  Phone, UserCheck, Shield, Home, Wrench, Layers
} from 'lucide-react';

const CATEGORY_COLORS = {
  ROOFING_SIDING_GUTTERS: { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5', label: '🏠 Techos & Canaletas' },
  RENOVATION_REMODEL: { bg: '#fef3c7', text: '#d97706', border: '#fcd34d', label: '🍳 Remodelación & Baños' },
  NEW_CONSTRUCTION_GROUND_UP: { bg: '#e0e7ff', text: '#4f46e5', border: '#a5b4fc', label: '🏢 Obra Nueva / Subcontratos' },
  CONCRETE_ASPHALT_PAVING: { bg: '#f3f4f6', text: '#374151', border: '#d1d5db', label: '🏗️ Concreto & Albañilería' },
  FENCE_PERIMETER_SECURITY: { bg: '#dcfce7', text: '#16a34a', border: '#86efac', label: '🛡️ Cercas & Portones' },
  FIRE_WATER_REBUILD: { bg: '#ffedd5', text: '#ea580c', border: '#fdba74', label: '🌪️ Tormentas / Daños' },
  FOUNDATION_WATERPROOFING: { bg: '#e0f2fe', text: '#0284c7', border: '#7dd3fc', label: '💧 Cimentación / Sótano' }
};

export default function TzelLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [selectedQuality, setSelectedQuality] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);
  const [activeSpeechTab, setActiveSpeechTab] = useState({});

  useEffect(() => {
    fetchTzelLeads();
  }, []);

  const fetchTzelLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .or('source.ilike.%tzel%,source.ilike.%facebook%,source.ilike.%linkedin%,notes.ilike.%SPEECH DE VENTA%')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      console.error('Error cargando leads de TZEL:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseNotes = (notesText) => {
    if (!notesText) return { summary: '', need: '', speeches: {}, raw: '' };

    const result = {
      summary: '',
      need: '',
      speeches: {
        spanishDM: '',
        spanishComment: '',
        englishDM: '',
        callOpening: ''
      },
      raw: notesText,
      originalUrl: ''
    };

    const lines = notesText.split('\n');
    let currentSection = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('🎯 NECESIDAD:')) {
        result.need = line.replace('🎯 NECESIDAD:', '').trim();
      } else if (line.includes('💰 VALOR ESTIMADO:')) {
        result.estimatedValue = line.replace('💰 VALOR ESTIMADO:', '').trim();
      } else if (line.includes('🔗 ENLACE ORIGINAL:')) {
        result.originalUrl = line.replace('🔗 ENLACE ORIGINAL:', '').trim();
      } else if (line.includes('SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM):')) {
        currentSection = 'spanishDM';
      } else if (line.includes('COMENTARIO PÚBLICO SUGERIDO:')) {
        currentSection = 'spanishComment';
      } else if (line.includes('SALES PITCH (ENGLISH):')) {
        currentSection = 'englishDM';
      } else if (line.includes('APERTURA TELEFÓNICA:')) {
        currentSection = 'callOpening';
      } else if (line.includes('DETALLES ORIGINALES:')) {
        currentSection = 'rawDetails';
      } else if (currentSection && !line.startsWith('===') && !line.startsWith('📄')) {
        const cleaned = line.replace(/^"/, '').replace(/"$/, '');
        if (cleaned) {
          if (!result.speeches[currentSection]) result.speeches[currentSection] = cleaned;
          else result.speeches[currentSection] += ' ' + cleaned;
        }
      }
    }

    if (!result.speeches.spanishDM) {
      result.speeches.spanishDM = `Hola, vi tu publicación buscando especialista de construcción en el área. En Barba Construction contamos con experiencia local en Louisville y fotos de proyectos similares. Estamos a la orden para un estimado gratis.`;
    }

    return result;
  };

  const handleCopy = (id, text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedId(`${id}-${type}`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePromoteToPipeline = async (leadId) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ pipeline_status: 'new_lead', source: 'referral' })
        .eq('id', leadId);

      if (error) throw error;
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, pipeline_status: 'new_lead' } : l));
      alert('✅ Lead movido exitosamente al Pipeline Principal de Ventas.');
    } catch (err) {
      alert('Error moviendo lead: ' + err.message);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch =
        `${l.first_name || ''} ${l.last_name || ''} ${l.address || ''} ${l.city || ''} ${l.notes || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesLocation =
        selectedLocation === 'ALL' ||
        (selectedLocation === 'IN' && (l.state === 'IN' || l.address?.includes('Indiana') || l.city?.includes('Clarksville') || l.city?.includes('New Albany'))) ||
        (selectedLocation === 'KY' && (l.state === 'KY' || l.city?.includes('Louisville')));

      const matchesQuality =
        selectedQuality === 'ALL' ||
        (selectedQuality === 'hot' && l.lead_quality === 'hot') ||
        (selectedQuality === 'warm' && l.lead_quality === 'warm');

      return matchesSearch && matchesLocation && matchesQuality;
    });
  }, [leads, search, selectedLocation, selectedQuality]);

  const totalEstimatedValue = useMemo(() => {
    return filteredLeads.reduce((acc, l) => {
      const valMatch = l.notes?.match(/VALOR ESTIMADO:\s*\$?([\d,]+)/);
      if (valMatch) {
        const num = parseInt(valMatch[1].replace(/,/g, ''), 10);
        return acc + (isNaN(num) ? 0 : num);
      }
      return acc + 8500;
    }, 0);
  }, [filteredLeads]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Visual */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-400">
              <Radar className="animate-spin-slow" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                📡 Radar de Leads TZEL
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-500/30">
                  En Vivo
                </span>
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Oportunidades de Construcción, Techos, Reformas y Subcontratos con Speeches de Venta por IA
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchTzelLeads}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-600/30"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Actualizando...' : 'Actualizar Radar'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Layers size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{filteredLeads.length}</div>
            <div className="text-xs font-medium text-slate-500">Leads Calificados</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <Flame size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {filteredLeads.filter(l => l.lead_quality === 'hot').length}
            </div>
            <div className="text-xs font-medium text-slate-500">Leads Calientes (Goteras/Urgencias)</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">
              ${totalEstimatedValue.toLocaleString()}
            </div>
            <div className="text-xs font-medium text-slate-500">Volumen Estimado Total</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">100% IA</div>
            <div className="text-xs font-medium text-slate-500">Speeches de Venta Listos</div>
          </div>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por cliente, necesidad, calle o ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">🌐 Todas las Zonas (KY & IN)</option>
            <option value="KY">📍 Louisville Metro (KY)</option>
            <option value="IN">📍 Sur de Indiana (IN)</option>
          </select>

          <select
            value={selectedQuality}
            onChange={(e) => setSelectedQuality(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">🔥 Toda Calidad</option>
            <option value="hot">🔴 Hot (Alta Urgencia)</option>
            <option value="warm">🟡 Warm (Media)</option>
          </select>
        </div>
      </div>

      {/* Grid de Leads */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
          <RefreshCw className="animate-spin mx-auto mb-3 text-indigo-600" size={32} />
          <p className="font-medium text-slate-700">Cargando oportunidades del Radar TZEL...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
          <Radar size={48} className="mx-auto mb-3 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-800">No se encontraron leads con estos filtros</h3>
          <p className="text-sm text-slate-500 mt-1">Prueba cambiando los criterios de búsqueda o actualiza el radar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredLeads.map((lead) => {
            const parsed = parseNotes(lead.notes);
            const activeTab = activeSpeechTab[lead.id] || 'dm';

            return (
              <div
                key={lead.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                {/* Top Card Header */}
                <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-slate-900">
                        {lead.first_name} {lead.last_name !== 'Potencial' ? lead.last_name : ''}
                      </span>
                      {lead.lead_quality === 'hot' && (
                        <span className="flex items-center gap-1 text-[11px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                          <Flame size={12} /> Hot Lead
                        </span>
                      )}
                      <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                        {lead.source || 'Facebook'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-slate-400" />
                        {lead.city || 'Louisville'}, {lead.state || 'KY'}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <DollarSign size={12} />
                        {parsed.estimatedValue || '$8,500 USD Est.'}
                      </span>
                    </div>
                  </div>

                  {parsed.originalUrl && (
                    <a
                      href={parsed.originalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200 text-xs font-semibold flex items-center gap-1"
                      title="Abrir Post Original en Facebook / LinkedIn"
                    >
                      <ExternalLink size={14} /> Post
                    </a>
                  )}
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  {/* Resumen de la Necesidad */}
                  {parsed.need && (
                    <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-950 font-medium leading-relaxed">
                      {parsed.need}
                    </div>
                  )}

                  {/* Speeches de Venta con Pestañas */}
                  <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/40">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Sparkles size={13} className="text-indigo-600" /> Speech de Venta (IA)
                      </span>

                      {/* Selector de Pestañas */}
                      <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-[11px]">
                        <button
                          onClick={() => setActiveSpeechTab(prev => ({ ...prev, [lead.id]: 'dm' }))}
                          className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                            activeTab === 'dm' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          DM / WhatsApp
                        </button>
                        <button
                          onClick={() => setActiveSpeechTab(prev => ({ ...prev, [lead.id]: 'comment' }))}
                          className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                            activeTab === 'comment' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Comentario
                        </button>
                        <button
                          onClick={() => setActiveSpeechTab(prev => ({ ...prev, [lead.id]: 'en' }))}
                          className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                            activeTab === 'en' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          English
                        </button>
                      </div>
                    </div>

                    {/* Texto del Speech Activo */}
                    <div className="relative bg-white border border-slate-200/80 rounded-lg p-3 text-xs text-slate-700 leading-relaxed font-normal min-h-[72px]">
                      {activeTab === 'dm' && (parsed.speeches.spanishDM || 'Generando speech de venta...')}
                      {activeTab === 'comment' && (parsed.speeches.spanishComment || 'Generando comentario...')}
                      {activeTab === 'en' && (parsed.speeches.englishDM || 'Generating pitch...')}

                      <button
                        onClick={() => {
                          const textToCopy =
                            activeTab === 'dm' ? parsed.speeches.spanishDM :
                            activeTab === 'comment' ? parsed.speeches.spanishComment :
                            parsed.speeches.englishDM;
                          handleCopy(lead.id, textToCopy, activeTab);
                        }}
                        className="absolute right-2 bottom-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all"
                      >
                        {copiedId === `${lead.id}-${activeTab}` ? (
                          <>
                            <Check size={12} className="text-emerald-600" /> ¡Copiado!
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copiar
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handlePromoteToPipeline(lead.id)}
                      className="text-xs font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-1.5 transition-colors py-1"
                    >
                      <UserCheck size={14} className="text-slate-400" />
                      Mover a Pipeline Principal
                    </button>

                    {parsed.originalUrl && (
                      <a
                        href={parsed.originalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-xs"
                      >
                        Contactar Cliente <ArrowRight size={13} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
