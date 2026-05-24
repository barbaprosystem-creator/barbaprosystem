import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { chatWithAiTrainer } from '../../lib/ai';
import { Bot, User, Send, Loader2, Sparkles, Database, Code, Mic, MicOff } from 'lucide-react';
import PinLock from '../../components/PinLock';

const SETUP_SQL = `
CREATE TABLE IF NOT EXISTS ai_training_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
`;

export default function AITrainingChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    fetchHistory();
    setupSpeechRecognition();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition no está soportado en este navegador.');
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setInput(prev => prev + ' ' + finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_training_chats')
        .select('role, content, created_at')
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Supabase fetch error:", error);
        // Si hay cualquier error al hacer fetch, asumimos que falta la tabla y mostramos el Setup SQL
        setSetupRequired(true);
        return;
      }
      setMessages(data || []);
    } catch (err) {
      console.error(err);
      setSetupRequired(true);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    
    const userMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Guardar mensaje del usuario en bd
      await supabase.from('ai_training_chats').insert({ role: 'user', content: userMessage.content });

      // Obtener el historial formateado para la IA (limitamos a los últimos 10 mensajes para contexto)
      const chatHistory = [...messages.slice(-9), userMessage].map(m => ({ role: m.role, content: m.content }));
      
      // Llamar a la IA
      const response = await chatWithAiTrainer(chatHistory);
      
      const assistantReply = response.reply;
      const aiMessage = { role: 'assistant', content: assistantReply };
      
      setMessages(prev => [...prev, aiMessage]);
      await supabase.from('ai_training_chats').insert({ role: 'assistant', content: assistantReply });

      // Si la IA decide guardar el precio
      if (response.action === 'save_price' && response.data) {
        const { category, item_name, unit_type, sell_price } = response.data;
        
        const { error: insertError } = await supabase.from('price_catalog').insert({
          category: category || 'general',
          item_name: item_name,
          unit_type: unit_type || 'each',
          base_cost: 0,
          margin_pct: 0,
          sell_price: sell_price || 0
        });

        if (insertError) {
          const errMsg = "Hubo un error guardando en la base de datos: " + insertError.message;
          setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
          await supabase.from('ai_training_chats').insert({ role: 'assistant', content: errMsg });
        } else {
          // Confirmación extra si se quiere, pero la IA ya debe haber mandado su propio texto en reply
        }
      }

    } catch (err) {
      console.error(err);
      const errorMsg = { role: 'assistant', content: 'Lo siento, ha ocurrido un error procesando tu solicitud: ' + err.message };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (setupRequired) {
    return (
      <div className="admin-page p-6 lg:p-8 flex items-center justify-center min-h-[80vh]">
        <div className="bg-[#1e293b] border border-[#374151] rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
            <Database size={32} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Configuración de Base de Datos Requerida</h2>
          <p className="text-[#9ca3af] mb-6">
            Para que la IA recuerde el historial de entrenamiento, necesitas ejecutar este código SQL en tu base de datos de Supabase.
          </p>
          <div className="bg-[#0f172a] rounded-xl border border-[#374151] p-4 mb-6 relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
              <Code size={16} className="text-[#6b7280]" />
            </div>
            <pre className="text-[#e2e8f0] text-sm overflow-x-auto whitespace-pre-wrap font-mono">
              {SETUP_SQL}
            </pre>
          </div>
          <p className="text-[#6b7280] text-sm italic mb-6">
            Ve al panel de Supabase → SQL Editor → Nuevo Query → Pega este código y presiona RUN.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/20"
          >
            Ya ejecuté el SQL, recargar página
          </button>
        </div>
      </div>
    );
  }

  return (
    <PinLock pin="2012" title="Entrenamiento IA — Restringido">
      <div className="admin-page p-6 lg:p-8 h-[calc(100vh-80px)] flex flex-col">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Entrenamiento de Inteligencia Artificial</h1>
            <p className="text-[#9ca3af] text-sm">Enséñale nuevos precios y servicios al sistema</p>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-[#1e293b] border border-[#374151] rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gradient-to-b from-[#1e293b] to-[#0f172a]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-[#6b7280] max-w-md mx-auto">
                <Bot size={48} className="mb-4 opacity-50" />
                <h3 className="text-white font-bold mb-2">¡Hola Lazaro! Soy tu Asistente de IA.</h3>
                <p className="text-sm">
                  Dime qué nuevos precios o servicios quieres agregar al catálogo. Por ejemplo: <br/><br/>
                  <span className="text-[#f97316] italic">"Agrega el servicio de pintura de gabinetes a $300 cada uno"</span>
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' 
                      ? 'bg-orange-500/20 text-orange-400' 
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                  </div>
                  
                  {/* Bubble */}
                  <div className={`rounded-2xl p-4 ${
                    msg.role === 'user' 
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/10' 
                      : 'bg-[#2a364a] border border-[#374151] text-[#e2e8f0]'
                  }`}>
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex gap-4 max-w-3xl mr-auto animate-pulse">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot size={20} className="text-blue-400" />
                </div>
                <div className="rounded-2xl p-4 bg-[#2a364a] border border-[#374151] flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-blue-400" />
                  <span className="text-blue-400 text-sm">Pensando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[#1e293b] border-t border-[#374151]">
            <div className="max-w-4xl mx-auto flex items-end gap-2 bg-[#0f172a] p-2 rounded-xl border border-[#374151] focus-within:border-blue-500/50 transition-colors">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isListening ? "Escuchando... (habla ahora)" : "Escribe tu instrucción a la IA... (ej. Agrega limpieza de canaletas a $250)"}
                className="flex-1 bg-transparent border-none text-white p-3 resize-none outline-none max-h-32 min-h-[50px]"
                rows={1}
                disabled={loading}
              />
              <button
                onClick={toggleListening}
                disabled={loading}
                className={`w-12 h-12 flex-shrink-0 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-0.5 ${
                  isListening ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse' : 'bg-[#1e293b] hover:bg-[#374151] text-[#9ca3af]'
                }`}
                title={isListening ? "Detener micrófono" : "Dictar por voz"}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-12 h-12 flex-shrink-0 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-0.5 mr-0.5"
              >
                <Send size={20} className={input.trim() ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} />
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-xs text-[#6b7280]">
                La IA analizará tu solicitud, pedirá confirmación, y guardará los precios en la base de datos oficial.
              </span>
            </div>
          </div>
          
        </div>
      </div>
    </PinLock>
  );
}
