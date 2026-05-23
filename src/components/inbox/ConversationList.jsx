import React from 'react';

const channelIcons = {
  whatsapp: '💬',
  sms: '📱',
  facebook: '📘',
  instagram: '📸',
  email: '✉️'
};

export default function ConversationList({ conversations, selectedId, onSelect }) {
  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-[var(--text-muted)] text-sm">
        No se encontraron conversaciones.
      </div>
    );
  }

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex flex-col">
      {conversations.map((conv) => {
        const contactName = conv.contacts ? `${conv.contacts.first_name} ${conv.contacts.last_name}` : 'Cliente Desconocido';
        const lastMsg = conv.lastMessage?.contenido || 'Sin mensajes';
        const timeStr = formatTime(conv.ultima_interaccion);
        const icon = channelIcons[conv.canal] || '💬';
        const isSelected = selectedId === conv.id;
        const hasUnread = conv.unreadCount > 0;

        return (
          <div 
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`p-4 border-b border-[var(--border)] cursor-pointer transition-colors flex items-start gap-3 relative ${
              isSelected 
                ? 'bg-[#1a1a1a] border-l-4 border-l-[var(--gold)]' 
                : 'bg-transparent hover:bg-[#181818] border-l-4 border-l-transparent'
            }`}
          >
            {/* Avatar Circle */}
            <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-lg relative ${
              hasUnread ? 'bg-[var(--gold-soft)] text-[var(--gold)] border border-[var(--gold-soft)]' : 'bg-[#222] text-[#888] border border-[#333]'
            }`}>
              {contactName.charAt(0).toUpperCase()}
              
              {/* Channel Icon Badge */}
              <div className="absolute -bottom-1 -right-1 text-[10px] bg-[#111] rounded-full p-[3px] border border-[#333] shadow-sm">
                {icon}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center h-12">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className={`truncate pr-2 ${hasUnread ? 'font-bold text-white' : 'font-semibold text-gray-300'}`}>
                  {contactName}
                </h3>
                <span className={`text-[10px] flex-shrink-0 ${hasUnread ? 'text-[var(--gold)] font-bold' : 'text-gray-500'}`}>
                  {timeStr}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className={`text-sm truncate pr-2 ${hasUnread ? 'text-gray-200 font-medium' : 'text-gray-500'}`}>
                  {lastMsg}
                </p>
                {/* Unread Badge */}
                {hasUnread && (
                  <div className="w-5 h-5 rounded-full bg-[var(--gold)] text-black text-[10px] font-bold flex items-center justify-center flex-shrink-0 shadow-[0_0_8px_rgba(245,197,24,0.4)]">
                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
