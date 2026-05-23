import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ConversationList from '../../components/inbox/ConversationList';
import ChatArea from '../../components/inbox/ChatArea';
import ContactContext from '../../components/inbox/ContactContext';

export default function InboxPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos');

  useEffect(() => {
    fetchConversations();
    
    const channel = supabase.channel('inbox-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes' }, (payload) => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversaciones')
        .select(`
          id,
          canal,
          estado,
          ultima_interaccion,
          contacts (
            id,
            first_name,
            last_name,
            phone,
            email,
            pipeline_status
          ),
          mensajes (
            id,
            contenido,
            creado_en,
            direccion,
            estado_entrega
          )
        `)
        .order('ultima_interaccion', { ascending: false });

      if (error) throw error;
      
      const processed = data.map(conv => {
        const sortedMessages = (conv.mensajes || []).sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
        const unreadCount = sortedMessages.filter(m => m.direccion === 'inbound' && m.estado_entrega === 'entregado').length;
        
        return {
          ...conv,
          mensajes: sortedMessages,
          lastMessage: sortedMessages[0] || null,
          unreadCount
        };
      });

      setConversations(processed);
      
      // Update selected conversation if it's open (using functional update to avoid stale closures)
      setSelectedConversation(prevSelected => {
        if (!prevSelected) return null;
        return processed.find(c => c.id === prevSelected.id) || prevSelected;
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setLoading(false);
    }
  };

  const markAsRead = async (convId) => {
    try {
      const { error } = await supabase
        .from('mensajes')
        .update({ estado_entrega: 'leido' })
        .eq('conversacion_id', convId)
        .eq('direccion', 'inbound')
        .eq('estado_entrega', 'entregado');
        
      if (error) throw error;
      
      // Actualizamos localmente para que sea instantáneo sin esperar al Realtime
      setConversations(prev => prev.map(c => {
        if (c.id === convId) {
          return { ...c, unreadCount: 0 };
        }
        return c;
      }));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleSelectConversation = (convId) => {
    const conv = conversations.find(c => c.id === convId);
    setSelectedConversation(conv);
    if (conv && conv.unreadCount > 0) {
      markAsRead(convId);
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (filter === 'Todos') return true;
    if (filter === 'No leídos') return c.unreadCount > 0;
    if (filter === 'WhatsApp') return c.canal === 'whatsapp';
    if (filter === 'SMS') return c.canal === 'sms';
    return true;
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[var(--bg-primary)] border-t border-[var(--border)] overflow-hidden text-[var(--text-primary)]">
      {/* Columna Izquierda: Lista de Conversaciones (30%) */}
      <div className="w-[320px] lg:w-1/3 max-w-[400px] bg-[var(--bg-secondary)] border-r border-[var(--border)] flex flex-col z-10">
        <div className="p-5 border-b border-[var(--border)]">
          <h2 className="text-xl font-[Oswald] uppercase tracking-wider text-white font-bold">Bandeja de Entrada</h2>
          <div className="mt-4">
            <input 
              type="text" 
              placeholder="Buscar cliente o número..." 
              className="w-full px-4 py-2.5 bg-[#0b0b0b] border border-[#242424] rounded-lg focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] text-sm text-[var(--text-primary)] placeholder-gray-500 transition-colors"
            />
          </div>
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
            {['Todos', 'No leídos', 'WhatsApp', 'SMS'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  filter === f 
                    ? 'bg-[var(--gold-soft)] border-[var(--gold)] text-[var(--gold)] shadow-[0_0_10px_rgba(245,197,24,0.15)]' 
                    : 'bg-[#111] border-[#222] text-[var(--text-secondary)] hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-[var(--text-secondary)] flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--gold)] rounded-full animate-spin mb-4"></div>
              Cargando mensajes...
            </div>
          ) : (
            <ConversationList 
              conversations={filteredConversations} 
              selectedId={selectedConversation?.id}
              onSelect={handleSelectConversation} 
            />
          )}
        </div>
      </div>

      {/* Columna Central: Área de Chat (45%) */}
      <div className="flex-1 flex flex-col bg-[#050505] relative z-0">
        {/* Pattern de fondo sutil (opcional) */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--gold) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        
        {selectedConversation ? (
          <ChatArea conversation={selectedConversation} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] z-10">
            <div className="w-24 h-24 mb-6 rounded-full bg-[#111] border border-[#222] flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-[var(--gold)] opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
            </div>
            <p className="text-lg font-medium tracking-wide">Selecciona una conversación</p>
            <p className="text-sm mt-2 opacity-70">Los mensajes se sincronizan automáticamente.</p>
          </div>
        )}
      </div>

      {/* Columna Derecha: Contexto CRM (25%) */}
      {selectedConversation && (
        <div className="w-[300px] lg:w-1/4 max-w-[350px] bg-[var(--bg-card)] border-l border-[var(--border)] z-10 flex-shrink-0">
          <ContactContext contact={selectedConversation.contacts} />
        </div>
      )}
    </div>
  );
}
