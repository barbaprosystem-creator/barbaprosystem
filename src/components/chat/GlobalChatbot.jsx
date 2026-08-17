import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Database } from 'lucide-react';
import { askCopilot } from '../../lib/ai';
import { supabase } from '../../lib/supabase';

export default function GlobalChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello, I am Barba Copilot. I know the company\'s pricing rules and have access to live CRM data. How can I help you today?' }
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

      let ctx = "LIVE CRM DATA (Use these if the user asks about projects, payments, or crews):\n\n";
      
      ctx += "Recent projects:\n";
      if (pData && pData.length > 0) {
        ctx += pData.map(p => `- ${p.title} (Status: ${p.status}, Start: ${p.start_date || 'N/A'})`).join('\n') + "\n\n";
      } else {
        ctx += "No recent projects.\n\n";
      }

      ctx += "Pending Payments:\n";
      if (payData && payData.length > 0) {
        ctx += payData.map(p => `- Payment of $${p.amount} (Status: ${p.status}, Due: ${p.due_date || 'N/A'})`).join('\n') + "\n\n";
      } else {
        ctx += "No pending payments.\n\n";
      }

      ctx += "Crews/Active Supervisors:\n";
      if (bData && bData.length > 0) {
        ctx += bData.map(b => `- ${b.full_name}`).join('\n') + "\n";
      } else {
        ctx += "No active supervisors.\n";
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
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-[#FACB00] rounded-full flex items-center justify-center text-black shadow-2xl hover:scale-110 transition-transform z-50 touch-manipulation"
      >
        <Bot size={24} className="sm:w-7 sm:h-7" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 w-[calc(100vw-24px)] sm:w-96 max-w-[420px] h-[550px] max-h-[82vh] bg-[#111] border border-[#222] shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden font-sans">
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
          <button onClick={() => setIsOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded transition-colors" title="Close">
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
                <Loader2 size={14} className="animate-spin" /> Processing request...
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
            placeholder="Ask a question in plain English..."
            className="w-full bg-[#151515] text-white rounded-lg pl-4 pr-10 py-3 border border-[#333] focus:outline-none focus:border-[#FACB00] transition-colors text-base sm:text-sm"
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
