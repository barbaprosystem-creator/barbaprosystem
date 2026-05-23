import React, { useState } from 'react';
import { X, Sparkles, FileText } from 'lucide-react';
import { generateProposalContext, refineProposalContext } from '../../lib/ai';
import { Send } from 'lucide-react';

export default function AiProposalModal({ isOpen, onClose, items, total, clientName, onSaveAndSend }) {
  const [proposalText, setProposalText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en');
  const [customInstruction, setCustomInstruction] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const text = await generateProposalContext(clientName, items, total, language);
      setProposalText(text);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!customInstruction.trim() || !proposalText) return;
    setLoading(true);
    setError(null);
    try {
      const text = await refineProposalContext(proposalText, customInstruction);
      setProposalText(text);
      setCustomInstruction('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-[#111111] border border-[#2a2a2a] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Sparkles size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#f0f0f0]">Generador de Propuestas IA</h2>
              <p className="text-xs text-[#888888]">Crea una propuesta persuasiva para {clientName || 'el cliente'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-[#1a1a1a] rounded-lg p-1 border border-[#2a2a2a]">
              <button 
                onClick={() => setLanguage('es')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${language === 'es' ? 'bg-[#333333] text-white shadow' : 'text-[#888888] hover:text-[#c0c0c0]'}`}
              >
                ES
              </button>
              <button 
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${language === 'en' ? 'bg-[#333333] text-white shadow' : 'text-[#888888] hover:text-[#c0c0c0]'}`}
              >
                EN
              </button>
            </div>
            <button onClick={onClose} className="p-2 text-[#888888] hover:text-white rounded-lg hover:bg-[#2a2a2a] transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {!proposalText && !loading && (
             <div className="text-center py-12">
               <Sparkles size={48} className="mx-auto mb-4 text-[#2a2a2a]" />
               <h3 className="text-[#f0f0f0] font-semibold mb-2">Listo para redactar</h3>
               <p className="text-[#888888] text-sm">Haz clic abajo para que el Copiloto redacte una propuesta profesional basándose en los ítems cotizados.</p>
             </div>
          )}
          
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
              <p className="text-purple-400 text-sm animate-pulse font-semibold">El Copiloto está redactando la propuesta...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {proposalText && !loading && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col h-full">
              <label className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center justify-between">
                <span>Texto de la Propuesta (Editable)</span>
                <span className="text-purple-400 font-normal capitalize">✨ Generado por IA</span>
              </label>
              <textarea 
                value={proposalText}
                onChange={(e) => setProposalText(e.target.value)}
                className="w-full flex-1 min-h-[200px] p-5 rounded-xl bg-[#0d0d0d] border border-[#2a2a2a] text-[#f0f0f0] text-sm leading-relaxed focus:outline-none focus:border-purple-500/50 resize-none shadow-inner"
              />
              
              {/* ChatGPT-like Chat Input for refinement */}
              <div className="flex gap-2 items-center bg-[#1a1a1a] p-2 rounded-xl border border-[#333]">
                <input 
                  type="text"
                  value={customInstruction}
                  onChange={e => setCustomInstruction(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRefine();
                  }}
                  placeholder="Ej: Hazlo más corto, o añade que incluiremos pintura gratis..."
                  className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none px-3 py-1"
                />
                <button 
                  onClick={handleRefine}
                  disabled={!customInstruction.trim() || loading}
                  className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50"
                  title="Aplicar cambios con IA"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#2a2a2a]/50 bg-[#0d0d0d] rounded-b-2xl flex justify-between gap-3">
           <button 
             onClick={handleGenerate}
             disabled={loading}
             className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2a2a2a] hover:bg-[#333333] text-white text-sm font-semibold transition-all disabled:opacity-50"
           >
             <Sparkles size={16} className={loading ? 'animate-pulse text-purple-400' : 'text-purple-400'} />
             {proposalText ? 'Reescribir' : 'Generar Propuesta'}
           </button>
           
           <button 
             onClick={() => onSaveAndSend(proposalText)}
             disabled={!proposalText || loading}
             className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:shadow-none"
           >
             <FileText size={16} />
             Finalizar PDF y Enviar
           </button>
        </div>

      </div>
    </div>
  );
}
