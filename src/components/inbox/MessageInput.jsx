import React, { useState } from 'react';

export default function MessageInput({ onSend }) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-[#111] px-4 py-3 border-t border-[#222]">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-4xl mx-auto">
        {/* Attach Button */}
        <button type="button" className="p-2 text-[#888] hover:text-[var(--gold)] hover:bg-[#222] rounded-full transition-colors flex-shrink-0" title="Adjuntar archivo">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
          </svg>
        </button>
        
        {/* Templates Button */}
        <button type="button" className="p-2 text-[#888] hover:text-[var(--gold)] hover:bg-[#222] rounded-full transition-colors flex-shrink-0" title="Usar plantilla">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </button>

        {/* Input Textarea */}
        <div className="flex-1 bg-[#1a1a1a] rounded-full shadow-inner border border-[#333] focus-within:border-[#555] transition-colors overflow-hidden relative flex items-center mx-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            className="w-full max-h-32 py-2.5 px-4 resize-none outline-none border-none focus:ring-0 text-[14px] bg-transparent text-[var(--text-primary)] placeholder-[#666]"
            rows={1}
            style={{ height: 'auto', minHeight: '40px' }}
          />
        </div>

        {/* Send Button */}
        <button 
          type="submit" 
          disabled={!message.trim()}
          className={`w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 transition-all duration-200 ${
            message.trim() 
              ? 'bg-[var(--gold)] text-black hover:bg-[var(--gold-hover)] hover:scale-105 shadow-[0_0_15px_rgba(245,197,24,0.3)]' 
              : 'bg-[#222] text-[#555] cursor-not-allowed'
          }`}
        >
          <svg className="w-5 h-5 translate-x-[-1px] translate-y-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
          </svg>
        </button>
      </form>
    </div>
  );
}
