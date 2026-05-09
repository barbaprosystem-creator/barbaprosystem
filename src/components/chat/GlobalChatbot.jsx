import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Database } from 'lucide-react';
import { askCopilot } from '../../lib/ai';
import { supabase } from '../../lib/supabase';

export default function GlobalChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hola, soy Barba Copilot. Conozco las reglas de precios de la empresa y tengo acceso a los datos del CRM en tiempo real. ¿En qué te puedo ayudar hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [globalContext, setGlobalContext] = useState('');
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Cuando se abre el chat, hacer scroll abajo y refrescar los datos en vivo
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      fetchCRMContext();
    }
  }, [messages, isOpen]);

  const fetchCRMContext = async () => {
    try {
      // Obtener datos recientes para inyectarlos como contexto
      const { data: pData } = await supabase.from('projects').select('title, status, start_date').order('created_at', { ascending: false }).limit(10);
      const { data: payData } = await supabase.from('payments').select('amount, status, due_date').neq('status', 'received').order('due_date', { ascending: true }).limit(10);
      const { data: bData } = await supabase.from('profiles').select('full_name, role').in('role', ['supervisor']).limit(10);

      let ctx = "DATOS EN VIVO DEL CRM (Úsalos si el usuario pregunta por proyectos, pagos o brigadas):\n\n";
      
      ctx += "Proyectos recientes:\n";
      if (pData && pData.length > 0) {
        ctx += pData.map(p => `- ${p.title} (Estatus: ${p.status}, Inicio: ${p.start_date || 'N/A'})`).join('\n') + "\n\n";
      } else {
        ctx += "No hay proyectos recientes.\n\n";
      }

      ctx += "Pagos Pendientes:\n";
      if (payData && payData.length > 0) {
        ctx += payData.map(p => `- Pago de $${p.amount} (Estatus: ${p.status}, Vence: ${p.due_date || 'N/A'})`).join('\n') + "\n\n";
      } else {
        ctx += "No hay pagos pendientes.\n\n";
      }

      ctx += "Brigadas/Supervisores Activos:\n";
      if (bData && bData.length > 0) {
        ctx += bData.map(b => `- ${b.full_name}`).join('\n') + "\n";
      } else {
        ctx += "No hay supervisores activos.\n";
      }
      
      setGlobalContext(ctx);
    } catch (err) {
      console.error('Error fetching global context', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsThinking(true);

    try {
      // Formatear mensajes para la API
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      
      // Llamar a la IA con los mensajes y el contexto en vivo
      const responseText = await askCopilot(apiMessages, globalContext);
      
      setMessages([...newMessages, { role: 'assistant', content: responseText }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: `❌ Error: ${err.message}` }]);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#FACB00] rounded-full flex items-center justify-center text-black shadow-2xl hover:scale-110 transition-transform z-50"
      >
        <Bot size={28} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] max-h-[80vh] bg-[#111] border border-[#222] shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-[#0a0a0a] border-b border-[#222] p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FACB00]/20 flex items-center justify-center">
            <Bot size={20} className="text-[#FACB00]" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Barba Copilot</h3>
            <p className="text-[10px] text-[#FACB00] font-mono tracking-wider flex items-center gap-1">
              <Database size={10} /> AI + LIVE CRM DATA
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded transition-colors" title="Cerrar">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Body / Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#151515]">
        <div className="flex flex-col gap-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-[#FACB00] text-black rounded-tr-none font-medium' 
                  : 'bg-[#222] text-gray-200 rounded-tl-none whitespace-pre-wrap'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-[#222] text-gray-400 p-3 rounded-xl rounded-tl-none flex items-center gap-2 text-sm">
                <Loader2 size={14} className="animate-spin" /> Procesando consulta...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-[#0a0a0a] border-t border-[#222] shrink-0">
        <div className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta en lenguaje natural..."
            className="w-full bg-[#151515] text-white rounded-lg pl-4 pr-10 py-3 border border-[#333] focus:outline-none focus:border-[#FACB00] transition-colors text-sm"
            disabled={isThinking}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isThinking}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#FACB00] disabled:text-gray-600 hover:text-amber-400 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
