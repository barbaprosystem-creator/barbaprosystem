import React, { useEffect, useRef } from 'react';
import MessageInput from './MessageInput';
import { supabase } from '../../lib/supabase';

export default function ChatArea({ conversation }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.mensajes]);

  const handleSendMessage = async (text, subject = '') => {
    try {
      const contentToSave = conversation.canal === 'email' && subject 
        ? `**Asunto: ${subject}**\n\n${text}` 
        : text;

      // 1. Guardar localmente en Supabase como "enviado"
      const { data: insertedData, error } = await supabase
        .from('mensajes')
        .insert([{
          conversacion_id: conversation.id,
          direccion: 'outbound',
          contenido: contentToSave,
          estado_entrega: 'enviado'
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      const contactPhone = conversation.contacts?.phone;
      const contactEmail = conversation.contacts?.email;

      // 2a. Enviar el mensaje por Twilio si es SMS o WhatsApp
      if (contactPhone && (conversation.canal === 'sms' || conversation.canal === 'whatsapp')) {
        try {
          const twilioRes = await fetch('/api/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: contactPhone,
              body: text,
              canal: conversation.canal
            })
          });
          
          if (!twilioRes.ok) {
            const errorText = await twilioRes.text();
            console.error("Error desde API de Twilio:", errorText);
            alert(`Error de conexión con Twilio: Asegúrate de haber configurado las variables en Vercel. Error: ${twilioRes.status}`);
          }
        } catch (fetchErr) {
          console.error("Error en la petición a Vercel:", fetchErr);
          alert("Error de red intentando contactar al servidor. Si estás probando en 'Local' (npm run dev), recuerda que el envío solo funciona en la versión subida a Vercel.");
        }
      } 
      // 2b. Enviar el mensaje por Resend si es Email
      else if (contactEmail && conversation.canal === 'email') {
        try {
          const emailRes = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: contactEmail,
              subject: subject || "Actualización de Barba Construction",
              text: text
            })
          });
          
          if (!emailRes.ok) {
            const errorText = await emailRes.text();
            console.error("Error desde API de Email:", errorText);
            alert(`Error enviando correo: Asegúrate de configurar RESEND_API_KEY en Vercel. Error: ${emailRes.status}`);
          }
        } catch (fetchErr) {
          console.error("Error en la petición a Vercel (Email):", fetchErr);
          alert("Error de red intentando contactar al servidor de correos.");
        }
      }
    } catch (err) {
      console.error("Error general:", err);
      alert("Hubo un error al guardar o enviar el mensaje.");
    }
  };

  const contactName = conversation.contacts ? `${conversation.contacts.first_name} ${conversation.contacts.last_name}` : 'Cliente';
  
  // Mensajes vienen ordenados desc, los invertimos para mostrarlos cronológicamente
  const chronologicalMessages = [...(conversation.mensajes || [])].reverse();

  return (
    <div className="flex flex-col h-full bg-[#0b0b0b] relative">
      {/* Pattern de fondo sutil */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--gold) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      {/* Header */}
      <div className="h-16 px-6 py-3 bg-[#111] flex items-center border-b border-[var(--border)] shadow-sm z-10 sticky top-0 relative">
        <div className="w-10 h-10 rounded-full bg-[var(--gold-soft)] border border-[var(--border-gold)] text-[var(--gold)] flex items-center justify-center font-bold text-lg mr-4">
          {contactName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="font-semibold text-white tracking-wide">{contactName}</h2>
          <p className="text-xs text-[var(--text-muted)] tracking-wider">
            {conversation.canal.toUpperCase()} • {conversation.contacts?.phone || 'Sin número'}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="text-[#666] hover:text-[var(--gold)] p-2 transition-colors rounded-full hover:bg-[#222]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </button>
          <button className="text-[#666] hover:text-[var(--gold)] p-2 transition-colors rounded-full hover:bg-[#222]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 z-10 relative">
        {chronologicalMessages.length === 0 && (
          <div className="text-center text-[var(--text-muted)] my-8 bg-[#1a1a1a] border border-[var(--border)] py-3 px-6 rounded-lg max-w-sm mx-auto shadow-lg">
            Aún no hay mensajes en esta conversación.
          </div>
        )}
        
        {chronologicalMessages.map((msg) => {
          const isOutbound = msg.direccion === 'outbound';
          
          return (
            <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[80%] md:max-w-[70%] px-4 py-2 rounded-2xl shadow-md relative ${
                  isOutbound 
                    ? 'bg-[#1e1e1e] border border-[#333] text-[var(--text-primary)] rounded-br-sm' 
                    : 'bg-[#151515] border border-[var(--border-gold)] text-[var(--text-primary)] rounded-bl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{msg.contenido}</p>
                <div className={`text-[10px] mt-1.5 flex justify-end items-center gap-1.5 ${isOutbound ? 'text-gray-500' : 'text-[var(--gold)] opacity-80'}`}>
                  {new Date(msg.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isOutbound && (
                    <span title={msg.estado_entrega}>
                      <svg className={`w-3.5 h-3.5 ${msg.estado_entrega === 'leido' ? 'text-blue-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Message Input Area */}
      <div className="z-10 relative">
        <MessageInput onSend={handleSendMessage} canal={conversation.canal} />
      </div>
    </div>
  );
}
