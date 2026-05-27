import React from 'react';
import { Link } from 'react-router-dom';

export default function ContactContext({ contact }) {
  if (!contact) return null;

  const getStatusColor = (status) => {
    const colors = {
      new_lead: 'bg-[var(--gold-soft)] text-[var(--gold)] border border-[var(--border-gold)]',
      contacted: 'bg-blue-900/30 text-blue-400 border border-blue-900/50',
      appointment_set: 'bg-purple-900/30 text-purple-400 border border-purple-900/50',
      estimate_sent: 'bg-orange-900/30 text-orange-400 border border-orange-900/50',
      closed_won: 'bg-green-900/30 text-green-400 border border-green-900/50',
      closed_lost: 'bg-red-900/30 text-red-400 border border-red-900/50'
    };
    return colors[status] || 'bg-[#222] text-[#888] border border-[#333]';
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="p-6 h-full flex flex-col overflow-y-auto bg-[var(--bg-card)]">
      {/* Perfil Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-24 h-24 rounded-full bg-[#111] border border-[var(--border-gold)] text-[var(--gold)] flex items-center justify-center font-bold text-4xl mb-4 shadow-[0_0_20px_rgba(245,197,24,0.1)]">
          {contact.first_name ? contact.first_name.charAt(0).toUpperCase() : '?'}
        </div>
        <h2 className="text-xl font-bold text-white mb-1">{contact.first_name} {contact.last_name}</h2>
        <span className={`mt-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${getStatusColor(contact.pipeline_status)}`}>
          {formatStatus(contact.pipeline_status)}
        </span>
      </div>

      {/* Información de Contacto */}
      <div className="space-y-4 mb-8">
        <h3 className="text-xs font-bold text-[#666] uppercase tracking-[2px] border-b border-[#222] pb-2">Details</h3>
        
        {contact.phone && (
          <div className="flex items-center gap-3 text-gray-300">
            <svg className="w-5 h-5 text-[var(--gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
            <span className="text-sm">{contact.phone}</span>
          </div>
        )}
        
        {contact.email && (
          <div className="flex items-center gap-3 text-gray-300">
            <svg className="w-5 h-5 text-[var(--gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            <span className="text-sm truncate">{contact.email}</span>
          </div>
        )}
      </div>

      {/* Acciones Rápidas */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#666] uppercase tracking-[2px] border-b border-[#222] pb-2 mb-4">Actions</h3>
        
        <Link 
          to={`/admin/clients/${contact.id}`}
          className="w-full flex items-center gap-3 p-3.5 bg-[#111] hover:bg-[#1a1a1a] hover:border-[var(--border-gold)] text-gray-300 rounded-xl transition-all border border-[#222] shadow-sm text-sm"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          View Profile
        </Link>

        <button className="w-full flex items-center gap-3 p-3.5 bg-[var(--gold-soft)] hover:bg-[rgba(245,197,24,0.15)] text-[var(--gold)] rounded-xl transition-all border border-[var(--border-gold)] shadow-sm text-left text-sm font-medium">
          <svg className="w-5 h-5 text-[var(--gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Create Estimate
        </button>

        <button className="w-full flex items-center gap-3 p-3.5 bg-[#111] hover:bg-[#1a1a1a] text-gray-300 rounded-xl transition-all border border-[#222] shadow-sm text-left text-sm">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          New Project
        </button>
      </div>

      <div className="mt-auto pt-8">
        <p className="text-[10px] text-center text-[#444] uppercase tracking-widest font-mono">
          ID: {contact.id.substring(0, 8)}
        </p>
      </div>
    </div>
  );
}
