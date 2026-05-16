import React, { useEffect, useState, useRef } from 'react';
import { supabase } from "../../lib/supabase";
import { twilioService } from '../../services/twilioService';

export default function OmnichannelChat({ clienteId, clienteTelefono }) {
  const [conversacionId, setConversacionId] = useState(null);
  const [lastInteractionDate, setLastInteractionDate] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const messagesEndRef = useRef(null);

  // Calcula si la ventana de 24 horas sigue abierta
  const is24HourWindowOpen = () => {
    if (!lastInteractionDate) return false; // Si no hay interacción previa, asumimos cerrado para WhatsApp
    const hoursSinceLastInteraction = (new Date() - new Date(lastInteractionDate)) / (1000 * 60 * 60);
    return hoursSinceLastInteraction < 24;
  };

  const windowOpen = is24HourWindowOpen();

  // 1. Cargar historial de mensajes y conversación al montar el componente
  useEffect(() => {
    const fetchMensajesYConversacion = async () => {
      // 1.1 Buscar si existe conversación activa
      const { data: conv } = await supabase
        .from('conversaciones')
        .select('id, ultima_interaccion')
        .eq('cliente_id', clienteId)
        .eq('canal', 'whatsapp')
        .single();
        
      if (conv) {
        setConversacionId(conv.id);
        setLastInteractionDate(conv.ultima_interaccion);
        
        // 1.2 Si existe, cargar mensajes
        const { data, error } = await supabase
          .from('mensajes')
          .select('*')
          .eq('conversacion_id', conv.id)
          .order('creado_en', { ascending: true });
          
        if (!error && data) setMensajes(data);
      }
    };

    if (clienteId) fetchMensajesYConversacion();
  }, [clienteId]);



  // 2. Suscribirse a Supabase Realtime para nuevos mensajes entrantes (Twilio Webhook -> DB -> UI)
  useEffect(() => {
    if (!conversacionId) return;

    const channel = supabase
      .channel(`mensajes_conversacion_${conversacionId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'mensajes', 
          filter: `conversacion_id=eq.${conversacionId}` 
        },
        (payload) => {
          // Agregar el nuevo mensaje a la lista al instante
          setMensajes((prev) => [...prev, payload.new]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversacionId]);

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  // 3. Enviar mensaje de texto normal
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !windowOpen) return;

    setEnviando(true);
    try {
      // Disparamos el mensaje a través de nuestra Edge Function
      await twilioService.sendStandardMessage(conversacionId, clienteTelefono, nuevoMensaje, 'whatsapp', clienteId);
      setNuevoMensaje('');
    } catch (error) {
      alert("Error al enviar mensaje");
    } finally {
      setEnviando(false);
    }
  };

  // 4. Enviar Mensaje de Plantilla (Saltar restricción 24h)
  const handleSendTemplate = async () => {
    setEnviando(true);
    try {
      // Ejemplo: inyectando variables dinámicas (Ej. "1" = Nombre, "2" = No. de Cotización)
      await twilioService.sendWhatsAppTemplate(conversacionId, clienteTelefono, 'cotizacion_lista', {
        "1": "Cliente",
        "2": "#EST-1024"
      }, clienteId);
      alert("Plantilla enviada exitosamente. Se ha reabierto la sesión de 24h.");
    } catch (error) {
      alert("Error al enviar la plantilla");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent overflow-hidden font-sans">
      {/* ÁREA DE MENSAJES */}
      <div className="flex-1 p-4 overflow-y-auto bg-transparent space-y-4">
        {mensajes.map((msg) => (
          <div key={msg.id} className={`flex ${msg.direccion === 'outbound' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[75%] p-3 rounded-2xl ${
                msg.direccion === 'outbound' 
                  ? 'bg-[var(--accent)] text-black rounded-br-none shadow-sm' 
                  : 'bg-[#222] border border-[#333] text-gray-100 rounded-bl-none shadow-sm'
              }`}
            >
              <p className="text-sm">{msg.contenido}</p>
              <span className={`text-[10px] mt-1 block text-right ${msg.direccion === 'outbound' ? 'text-black/60' : 'text-gray-400'}`}>
                {new Date(msg.creado_en).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ÁREA DE INPUT */}
      <div className="p-4 bg-[#111] border-t border-[#333] shrink-0">
        {!windowOpen ? (
          <div className="flex flex-col items-center justify-center p-3 gap-3 bg-red-500/10 rounded-lg border border-red-500/20 w-full">
            <p className="text-xs text-red-400 text-center leading-relaxed">
              La ventana de 24 horas de WhatsApp ha expirado o no ha sido iniciada. 
              Para continuar la conversación, debes enviar una plantilla preaprobada.
            </p>
            <button 
              onClick={handleSendTemplate}
              disabled={enviando}
              className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center shadow-sm disabled:opacity-50"
            >
              {enviando ? "Enviando..." : 'Enviar Plantilla "Cotización Lista"'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-[#333] text-white rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent text-sm transition-all placeholder:text-[#555]"
              disabled={enviando}
            />
            <button 
              type="submit"
              disabled={!nuevoMensaje.trim() || enviando}
              className="p-3 bg-[var(--accent)] hover:bg-orange-400 text-black font-medium rounded-full disabled:opacity-50 transition-colors shadow-[0_0_15px_rgba(249,115,22,0.2)] flex items-center justify-center"
              aria-label="Enviar"
            >
              {/* Ícono de enviar básico en SVG */}
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
