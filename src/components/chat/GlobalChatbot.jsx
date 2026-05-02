import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, ChevronLeft, Briefcase, HardHat, DollarSign, Loader2 } from 'lucide-react';
import { askCopilot } from '../../lib/ai';

const MOCK_DATA = {
  projects: [
    { id: 1, title: 'Renovación Familia Smith', details: 'Siding y Gutters, Iniciado 2026-04-28, Avance 75%' },
    { id: 2, title: 'Techo Comercial Downtown', details: 'Roofing, Iniciado 2026-04-20, Avance 60%' },
    { id: 3, title: 'Deck Residencial Heights', details: 'Fences & Decks, Iniciado 2026-05-01, Retrasado' }
  ],
  brigades: [
    { id: 1, title: 'Brigada Alpha', details: 'Foreman: Carlos Ruiz, 4 miembros, Trabajando en Familia Smith' },
    { id: 2, title: 'Brigada Beta', details: 'Foreman: Luis Mendoza, 6 miembros, Trabajando en Comercial Downtown' },
    { id: 3, title: 'Brigada Delta', details: 'Foreman: Miguel Ángel, 3 miembros, Disponible' }
  ],
  payments: [
    { id: 1, title: 'Factura #001 - Familia Smith', details: 'Pendiente de pago inicial de $4,250' },
    { id: 2, title: 'Factura #002 - Comercial Downtown', details: 'Pagado en su totalidad' }
  ]
};

export default function GlobalChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState(null); // 'projects', 'brigades', 'payments'
  const [context, setContext] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, context]);

  const handleSelectCategory = (cat) => {
    setCategory(cat);
  };

  const handleSelectContextItem = (item) => {
    const contextString = `Nombre: ${item.title} | Detalles: ${item.details}`;
    setContext(contextString);
    setMessages([{ 
      role: 'assistant', 
      content: `¡Entendido! Tengo el contexto de **${item.title}**. ¿Qué deseas saber o hacer con este registro?` 
    }]);
  };

  const handleReset = () => {
    setCategory(null);
    setContext(null);
    setMessages([]);
    setInput('');
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
      // Formatear los mensajes para enviarlos a la API (solo user y assistant)
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      
      const responseText = await askCopilot(apiMessages, context);
      
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
            <p className="text-[10px] text-[#FACB00] font-mono tracking-wider">AI ORACLE ONLINE</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {category && (
            <button onClick={handleReset} className="p-1.5 text-gray-400 hover:text-white rounded transition-colors" title="Volver al inicio">
              <ChevronLeft size={18} />
            </button>
          )}
          <button onClick={() => setIsOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded transition-colors" title="Cerrar">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#151515]">
        
        {!category && !context && (
          <div className="h-full flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4">
            <h4 className="text-gray-300 text-sm font-bold mb-4 text-center">¿Sobre qué quieres consultar hoy?</h4>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => handleSelectCategory('projects')} className="bg-[#0a0a0a] border border-[#222] hover:border-[#FACB00] hover:bg-[#FACB00]/5 p-4 rounded-xl flex items-center gap-3 transition-all text-left">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Briefcase size={20} /></div>
                <div>
                  <p className="text-white font-bold text-sm">Proyectos</p>
                  <p className="text-gray-500 text-xs">Estatus y detalles de obras</p>
                </div>
              </button>
              <button onClick={() => handleSelectCategory('brigades')} className="bg-[#0a0a0a] border border-[#222] hover:border-[#FACB00] hover:bg-[#FACB00]/5 p-4 rounded-xl flex items-center gap-3 transition-all text-left">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><HardHat size={20} /></div>
                <div>
                  <p className="text-white font-bold text-sm">Brigadas</p>
                  <p className="text-gray-500 text-xs">Ubicación y carga de trabajo</p>
                </div>
              </button>
              <button onClick={() => handleSelectCategory('payments')} className="bg-[#0a0a0a] border border-[#222] hover:border-[#FACB00] hover:bg-[#FACB00]/5 p-4 rounded-xl flex items-center gap-3 transition-all text-left">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><DollarSign size={20} /></div>
                <div>
                  <p className="text-white font-bold text-sm">Estado de Pagos</p>
                  <p className="text-gray-500 text-xs">Facturas y saldos pendientes</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {category && !context && (
          <div className="animate-in fade-in slide-in-from-right-4">
            <h4 className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-3">Selecciona un registro</h4>
            <div className="space-y-2">
              {MOCK_DATA[category].map(item => (
                <button 
                  key={item.id}
                  onClick={() => handleSelectContextItem(item)}
                  className="w-full text-left bg-[#0a0a0a] border border-[#222] p-3 rounded-lg hover:border-[#FACB00] transition-colors"
                >
                  <p className="text-white text-sm font-bold">{item.title}</p>
                  <p className="text-gray-500 text-xs mt-1 line-clamp-1">{item.details}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {context && (
          <div className="flex flex-col gap-4">
            {messages.map((msg, i) => (
              <div key={i} className={\`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
                <div className={\`max-w-[85%] p-3 rounded-xl text-sm \${
                  msg.role === 'user' 
                    ? 'bg-[#FACB00] text-black rounded-tr-none font-medium' 
                    : 'bg-[#222] text-gray-200 rounded-tl-none'
                }\`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-[#222] text-gray-400 p-3 rounded-xl rounded-tl-none flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Pensando...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

      </div>

      {/* Input */}
      {context && (
        <form onSubmit={handleSend} className="p-3 bg-[#0a0a0a] border-t border-[#222] shrink-0">
          <div className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregúntale a la IA..."
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
      )}
    </div>
  );
}
