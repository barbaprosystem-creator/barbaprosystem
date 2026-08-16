import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Search, Filter, Copy, Check, ExternalLink, Flame, Sparkles,
  MapPin, MessageSquare, ArrowRight, RefreshCw,
  Phone, UserCheck, Shield, Home, Wrench, Layers, Tag
} from 'lucide-react';

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

      // 1. FILTRO ESTRICTO: Excluir licitaciones públicas y expedientes
      const filteredOnlyPrivateLeads = (data || []).filter(l => {
        const name = (l.first_name || '').toLowerCase();
        const notes = (l.notes || '').toLowerCase();
        const isPublicBid =
          name.includes('promotor') ||
          name.includes('expediente') ||
          notes.includes('expediente municipal') ||
          notes.includes('government_bid') ||
          notes.includes('lojic gis') ||
          notes.includes('zonificación') ||
          notes.includes('licitación pública');
        return !isPublicBid;
      });

      // 2. DEDUPLICACIÓN EN MEMORIA GARANTIZADA: Evita mostrar duplicados
      const seenFingerprints = new Set();
      const uniqueLeads = [];

      for (const lead of filteredOnlyPrivateLeads) {
        const name = (lead.first_name || '').toLowerCase().trim();
        const addr = (lead.address || '').toLowerCase().trim();
        const noteSnippet = (lead.notes || '').slice(0, 80).replace(/\s+/g, ' ').trim().toLowerCase();
        const fingerprint = `${name}_${addr}_${noteSnippet}`;

        if (!seenFingerprints.has(fingerprint)) {
          seenFingerprints.add(fingerprint);
          uniqueLeads.push(lead);
        }
      }

      setLeads(uniqueLeads);
    } catch (err) {
      console.error('Error cargando leads de TZEL:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseNotes = (notesText, lead) => {
    if (!notesText) {
      return {
        need: 'Cliente solicita cotización para trabajos de construcción o reparación.',
        speeches: {
          spanishDM: 'Hola, vi tu publicación buscando contratista en Louisville. En Barba Construction tenemos cuadrilla local y fotos de obras similares. ¿Qué día podemos pasar a darte un estimado gratis?',
          spanishComment: 'Hola, te enviamos fotos y presupuesto aproximado por mensaje privado. ¡A la orden para una visita gratuita!',
          englishDM: 'Hi, saw your post looking for local contractors in Louisville. We offer free on-site estimates. Let us know when works best for you!'
        },
        originalUrl: '',
        resolvedName: lead?.first_name || 'Cliente Potencial'
      };
    }

    const result = {
      need: '',
      speeches: {
        spanishDM: '',
        spanishComment: '',
        englishDM: ''
      },
      originalUrl: '',
      resolvedName: ''
    };

    const lines = notesText.split('\n');
    let currentSection = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('🎯 NECESIDAD:')) {
        result.need = line.replace('🎯 NECESIDAD:', '').trim();
      } else if (line.includes('🔗 ENLACE ORIGINAL:') || line.includes('🔗 Enlace')) {
        const urlMatch = line.match(/https?:\/\/[^\s]+/);
        if (urlMatch) result.originalUrl = urlMatch[0];
      } else if (line.includes('SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM):')) {
        currentSection = 'spanishDM';
      } else if (line.includes('COMENTARIO PÚBLICO SUGERIDO:')) {
        currentSection = 'spanishComment';
      } else if (line.includes('SALES PITCH (ENGLISH):')) {
        currentSection = 'englishDM';
      } else if (line.includes('APERTURA TELEFÓNICA:') || line.includes('DETALLES ORIGINALES:')) {
        currentSection = '';
      } else if (currentSection && !line.startsWith('===') && !line.startsWith('📄')) {
        const cleaned = line.replace(/^"/, '').replace(/"$/, '').trim();
        if (cleaned) {
          if (!result.speeches[currentSection]) result.speeches[currentSection] = cleaned;
          else result.speeches[currentSection] += ' ' + cleaned;
        }
      }
    }

    // Resolver nombre limpio
    let displayName = lead.first_name || '';
    if (lead.last_name && lead.last_name !== 'Potencial') {
      displayName += ` ${lead.last_name}`;
    }

    if (displayName.includes('Vecino de Facebook') || displayName.includes('Vecino del Grupo')) {
      const groupMatch = notesText.match(/Grupo:\s*"?([^"\n]+)"?/);
      if (groupMatch) {
        displayName = `Solicitud en ${groupMatch[1]}`;
      } else {
        displayName = `Cliente en ${lead.city || 'Louisville'}`;
      }
    }

    result.resolvedName = displayName;

    if (!result.speeches.spanishDM) {
      result.speeches.spanishDM = `Hola, vi tu publicación en el área de Louisville/Sur de IN. En Barba Construction contamos con experiencia y fotos de proyectos similares. Estamos disponibles para hacerte una visita y presupuesto gratis.`;
    }
    if (!result.speeches.spanishComment) {
      result.speeches.spanishComment = `Hola, te acabamos de enviar un mensaje por privado con fotos de nuestros trabajos recientes. ¡Estamos a la orden para un estimado sin compromiso!`;
    }
    if (!result.speeches.englishDM) {
      result.speeches.englishDM = `Hi, saw your post looking for local contractors in Louisville / Southern IN. We are local, fully insured and available for a free on-site estimate. Let us know when works best!`;
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

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 bg-[#0b0b0b] min-h-screen text-[#F0F0F0]">
      {/* Header Visual con Logo Oficial de TZEL */}
      <div className="bg-gradient-to-r from-[#141414] via-[#1a1a1a] to-[#141414] rounded-2xl p-6 shadow-2xl border border-[#242424] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#0b0b0b] border border-[#333] p-1.5 flex items-center justify-center shadow-inner">
              <img src="/tzel-logo.png" alt="TZEL" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                Radar de Leads TZEL
                <span className="text-[11px] font-bold bg-[#F5C518]/20 text-[#F5C518] px-2.5 py-0.5 rounded-full border border-[#F5C518]/40 uppercase tracking-wide">
                  En Vivo
                </span>
              </h1>
              <p className="text-[#8A8A8A] text-sm mt-0.5">
                Oportunidades Residenciales y Comerciales con Speeches de Venta por IA (Sin Licitaciones Públicas)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchTzelLeads}
          disabled={loading}
          className="flex items-center gap-2 bg-[#F5C518] hover:bg-[#FFD740] active:scale-95 text-black px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#F5C518]/20 cursor-pointer"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Actualizando...' : 'Actualizar Radar'}
        </button>
      </div>

      {/* KPI Cards Reales (Sin Duplicados ni Precios Ficticios) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#141414] p-5 rounded-2xl border border-[#242424] shadow-sm flex items-center gap-4 hover:border-[#333] transition-all">
          <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
            <Layers size={24} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">{filteredLeads.length}</div>
            <div className="text-xs font-semibold text-[#8A8A8A]">Leads Únicos Calificados</div>
          </div>
        </div>

        <div className="bg-[#141414] p-5 rounded-2xl border border-[#242424] shadow-sm flex items-center gap-4 hover:border-[#333] transition-all">
          <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl">
            <Flame size={24} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">
              {filteredLeads.filter(l => l.lead_quality === 'hot').length}
            </div>
            <div className="text-xs font-semibold text-[#8A8A8A]">Urgencias (Goteras/Tormentas)</div>
          </div>
        </div>

        <div className="bg-[#141414] p-5 rounded-2xl border border-[#242424] shadow-sm flex items-center gap-4 hover:border-[#333] transition-all">
          <div className="p-3 bg-[#F5C518]/10 text-[#F5C518] border border-[#F5C518]/20 rounded-xl">
            <MapPin size={24} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#F5C518]">KY & IN</div>
            <div className="text-xs font-semibold text-[#8A8A8A]">Louisville & Sur de Indiana</div>
          </div>
        </div>

        <div className="bg-[#141414] p-5 rounded-2xl border border-[#242424] shadow-sm flex items-center gap-4 hover:border-[#333] transition-all">
          <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">100% IA</div>
            <div className="text-xs font-semibold text-[#8A8A8A]">Speeches de Venta Listos</div>
          </div>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div className="bg-[#141414] p-4 rounded-2xl border border-[#242424] shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666]" size={18} />
          <input
            type="text"
            placeholder="Buscar por cliente, necesidad, calle o ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0b0b0b] border border-[#282828] rounded-xl text-sm text-[#F0F0F0] placeholder-[#555] focus:outline-none focus:border-[#F5C518] transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-3.5 py-2.5 border border-[#282828] rounded-xl text-xs font-semibold bg-[#0b0b0b] text-[#E0E0E0] focus:outline-none focus:border-[#F5C518]"
          >
            <option value="ALL">🌐 Todas las Zonas (KY & IN)</option>
            <option value="KY">📍 Louisville Metro (KY)</option>
            <option value="IN">📍 Sur de Indiana (IN)</option>
          </select>

          <select
            value={selectedQuality}
            onChange={(e) => setSelectedQuality(e.target.value)}
            className="px-3.5 py-2.5 border border-[#282828] rounded-xl text-xs font-semibold bg-[#0b0b0b] text-[#E0E0E0] focus:outline-none focus:border-[#F5C518]"
          >
            <option value="ALL">🔥 Toda Calidad</option>
            <option value="hot">🔴 Hot (Alta Urgencia)</option>
            <option value="warm">🟡 Warm (Media)</option>
          </select>
        </div>
      </div>

      {/* Grid de Leads */}
      {loading ? (
        <div className="bg-[#141414] p-12 rounded-2xl border border-[#242424] text-center text-[#8A8A8A]">
          <RefreshCw className="animate-spin mx-auto mb-3 text-[#F5C518]" size={32} />
          <p className="font-semibold text-[#F0F0F0]">Cargando oportunidades del Radar TZEL...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-[#141414] p-12 rounded-2xl border border-[#242424] text-center text-[#8A8A8A]">
          <div className="w-16 h-16 mx-auto mb-3 opacity-30">
            <img src="/tzel-logo.png" alt="TZEL" className="w-full h-full object-contain grayscale" />
          </div>
          <h3 className="text-lg font-bold text-white">No se encontraron leads con estos filtros</h3>
          <p className="text-sm text-[#777] mt-1">Prueba cambiando los criterios de búsqueda o actualiza el radar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredLeads.map((lead) => {
            const parsed = parseNotes(lead.notes, lead);
            const activeTab = activeSpeechTab[lead.id] || 'dm';

            const activeSpeechText =
              activeTab === 'dm' ? parsed.speeches.spanishDM :
              activeTab === 'comment' ? parsed.speeches.spanishComment :
              parsed.speeches.englishDM;

            return (
              <div
                key={lead.id}
                className="bg-[#141414] rounded-2xl border border-[#242424] shadow-lg hover:border-[#383838] transition-all flex flex-col overflow-hidden"
              >
                {/* Top Card Header */}
                <div className="p-5 border-b border-[#222] flex items-start justify-between gap-3 bg-[#111111]/80">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-white">
                        {parsed.resolvedName}
                      </span>
                      {lead.lead_quality === 'hot' && (
                        <span className="flex items-center gap-1 text-[11px] font-bold bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">
                          <Flame size={12} /> Hot Lead
                        </span>
                      )}
                      <span className="text-[11px] font-bold bg-[#F5C518]/15 text-[#F5C518] px-2 py-0.5 rounded-full border border-[#F5C518]/30">
                        {lead.source || 'Facebook'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#8A8A8A] mt-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-[#666]" />
                        {lead.city || 'Louisville'}, {lead.state || 'KY'}
                      </span>
                    </div>
                  </div>

                  {parsed.originalUrl && (
                    <a
                      href={parsed.originalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-[#F5C518] rounded-xl transition-colors border border-[#333] text-xs font-bold flex items-center gap-1.5"
                      title="Abrir Post Original en Facebook / LinkedIn"
                    >
                      <ExternalLink size={13} /> Ver Post
                    </a>
                  )}
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  {/* Resumen de la Necesidad */}
                  {parsed.need && (
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3.5 text-xs text-[#E0E0E0] font-medium leading-relaxed">
                      {parsed.need}
                    </div>
                  )}

                  {/* Speeches de Venta con Pestañas */}
                  <div className="border border-[#282828] rounded-xl p-4 bg-[#0e0e0e] space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#F5C518] flex items-center gap-1.5">
                        <Sparkles size={13} className="text-[#F5C518]" /> Speech de Venta (IA)
                      </span>

                      {/* Selector de Pestañas */}
                      <div className="flex items-center gap-1 bg-[#1a1a1a] p-0.5 rounded-lg text-[11px] border border-[#2a2a2a]">
                        <button
                          onClick={() => setActiveSpeechTab(prev => ({ ...prev, [lead.id]: 'dm' }))}
                          className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                            activeTab === 'dm' ? 'bg-[#F5C518] text-black shadow-xs' : 'text-[#888] hover:text-white'
                          }`}
                        >
                          DM / WhatsApp
                        </button>
                        <button
                          onClick={() => setActiveSpeechTab(prev => ({ ...prev, [lead.id]: 'comment' }))}
                          className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                            activeTab === 'comment' ? 'bg-[#F5C518] text-black shadow-xs' : 'text-[#888] hover:text-white'
                          }`}
                        >
                          Comentario
                        </button>
                        <button
                          onClick={() => setActiveSpeechTab(prev => ({ ...prev, [lead.id]: 'en' }))}
                          className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                            activeTab === 'en' ? 'bg-[#F5C518] text-black shadow-xs' : 'text-[#888] hover:text-white'
                          }`}
                        >
                          English
                        </button>
                      </div>
                    </div>

                    {/* Texto del Speech Activo (Sin solapamiento) */}
                    <div className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 text-xs text-[#D8D8D8] leading-relaxed font-normal min-h-[70px]">
                      {activeSpeechText || 'Generando speech de venta...'}
                    </div>

                    {/* Fila Dedicada para el Botón Copiar */}
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleCopy(lead.id, activeSpeechText, activeTab)}
                        className="bg-[#F5C518]/15 hover:bg-[#F5C518]/25 text-[#F5C518] border border-[#F5C518]/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {copiedId === `${lead.id}-${activeTab}` ? (
                          <>
                            <Check size={13} className="text-emerald-400" /> ¡Copiado al Portapapeles!
                          </>
                        ) : (
                          <>
                            <Copy size={13} /> Copiar Speech
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handlePromoteToPipeline(lead.id)}
                      className="text-xs font-bold text-[#8A8A8A] hover:text-[#F5C518] flex items-center gap-1.5 transition-colors py-1 cursor-pointer"
                    >
                      <UserCheck size={14} className="text-[#666]" />
                      Mover a Mi Pipeline
                    </button>

                    {parsed.originalUrl && (
                      <a
                        href={parsed.originalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#F5C518] hover:bg-[#FFD740] text-black text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
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
