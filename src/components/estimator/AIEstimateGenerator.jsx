import React, { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, Send, Bot, StopCircle, Info } from 'lucide-react';
import { generateEstimateFromText } from '../../lib/ai';
import { useEstimatorStore } from '../../store/useEstimatorStore';

export default function AIEstimateGenerator() {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef(null);
  const addItem = useEstimatorStore((state) => state.addItem);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES'; // We assume spanish

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setText(currentTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        setText('');
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert('El reconocimiento de voz no está soportado en este navegador.');
      }
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
      
      const { prices } = useEstimatorStore.getState();
      const result = await generateEstimateFromText(text, prices);
      if (result && result.items && Array.isArray(result.items)) {
        result.items.forEach(item => {
          addItem(item);
        });
        setText(''); // clear input after success
      } else {
        throw new Error('Formato devuelto por la IA no es válido');
      }
    } catch (error) {
      console.error(error);
      alert('Hubo un error generando el estimado con IA: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#1e293b] border border-[#f97316]/30 rounded-2xl p-6 mb-6 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#f97316] opacity-[0.03] rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className="w-10 h-10 rounded-full bg-[#f97316]/20 flex items-center justify-center">
          <Bot size={22} color="#f97316" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white m-0">Asistente de IA (Voz/Texto)</h2>
          <p className="text-[#9ca3af] text-sm m-0">Escribe o dicta el trabajo a realizar y la IA creará el recibo oficial.</p>
        </div>
      </div>

      <div className="relative z-10">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ej: Necesito un estimado para un techo de asfalto de 15 squares con seguro, y reemplazar 2 ventanas blancas de vinilo..."
          className="w-full bg-[#0f172a] border border-[#374151] rounded-xl p-4 text-white resize-none outline-none focus:border-[#f97316] transition-colors"
          rows={4}
          disabled={isLoading}
        ></textarea>
        
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={toggleListening}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              isListening 
                ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/50' 
                : 'bg-[#374151]/50 text-white hover:bg-[#374151] border border-transparent'
            }`}
          >
            {isListening ? (
              <>
                <StopCircle size={18} className="animate-pulse" />
                Detener Grabación
              </>
            ) : (
              <>
                <Mic size={18} />
                Dictar por Voz
              </>
            )}
          </button>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !text.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-lg font-bold shadow-lg shadow-[#f97316]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Send size={18} />
                Generar
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="mt-4 flex items-start gap-2 text-xs text-[#6b7280]">
        <Info size={14} className="mt-[2px] flex-shrink-0" />
        <p className="m-0">
          La IA utiliza automáticamente la <strong>Tabla Oficial de Precios 2026</strong>. 
          Al generar, los ítems se añadirán a tu recibo a la derecha. Puedes editar las cantidades o borrarlos si la IA se equivoca.
        </p>
      </div>
    </div>
  );
}
