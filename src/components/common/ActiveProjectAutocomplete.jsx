import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Search, X, Check, Building2, User, Hash, Calendar, ArrowRight } from 'lucide-react';

/**
 * ActiveProjectAutocomplete
 * Google Maps Places Autocomplete style selector for active CRM projects.
 */
export default function ActiveProjectAutocomplete({
  projects = [],
  value = '',
  onChange,
  label = 'Assign Active Project',
  placeholder = 'Type address, client name, or project #...',
  required = false,
  allowClear = true,
  helperText = ''
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Find currently selected project object
  const selectedProject = useMemo(() => {
    return projects.find(p => String(p.id) === String(value)) || null;
  }, [projects, value]);

  // Filter projects by address, title, client name, or project number
  const filteredProjects = useMemo(() => {
    if (!query.trim()) return projects;
    const q = query.toLowerCase().trim();
    return projects.filter(p => {
      const addr = (p.address || '').toLowerCase();
      const title = (p.title || '').toLowerCase();
      const num = String(p.project_number || '');
      const clientFirst = (p.contacts?.first_name || '').toLowerCase();
      const clientLast = (p.contacts?.last_name || '').toLowerCase();
      const clientFull = `${clientFirst} ${clientLast}`.trim();

      return (
        addr.includes(q) ||
        title.includes(q) ||
        num.includes(q) ||
        clientFull.includes(q) ||
        clientFirst.includes(q) ||
        clientLast.includes(q)
      );
    });
  }, [projects, query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlight index when query or filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredProjects]);

  const handleSelect = (project) => {
    if (onChange) {
      onChange(project ? project.id : '', project || null);
    }
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange('', null);
    }
    setQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1 < filteredProjects.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 >= 0 ? prev - 1 : filteredProjects.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredProjects[highlightedIndex]) {
        handleSelect(filteredProjects[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in_progress':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">In Progress</span>;
      case 'scheduled':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Scheduled</span>;
      case 'pending':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Pending</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-gray-500/10 text-gray-400 border border-gray-500/20">{status || 'Active'}</span>;
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-sm font-medium text-gray-300">
            {label} {required && <span className="text-red-400">*</span>}
          </label>
          {selectedProject && allowClear && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <X size={12} /> Clear selection
            </button>
          )}
        </div>
      )}

      {/* Selected Project Card View */}
      {selectedProject ? (
        <div className="bg-[#141414] border border-[#333] hover:border-[#FACB00]/60 rounded-xl p-3.5 flex items-start justify-between gap-3 transition-all">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#FACB00]/10 border border-[#FACB00]/20 flex items-center justify-center text-[#FACB00] shrink-0 mt-0.5">
              <MapPin size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-white truncate">
                  {selectedProject.address || 'Address to be confirmed'}
                </p>
                {getStatusBadge(selectedProject.status)}
              </div>
              <p className="text-xs text-[#FACB00] font-medium mt-0.5 truncate">
                {selectedProject.title}
                {selectedProject.project_number && ` • #${selectedProject.project_number}`}
              </p>
              {selectedProject.contacts && (
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <User size={12} className="text-gray-500" />
                  <span>{selectedProject.contacts.first_name} {selectedProject.contacts.last_name}</span>
                  {selectedProject.contacts.phone && <span className="text-gray-500">({selectedProject.contacts.phone})</span>}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#222] rounded-lg transition-colors shrink-0"
            title="Change project"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        /* Autocomplete Search Input */
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
            <MapPin size={18} className="text-[#FACB00]" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-[#0a0a0a] border border-[#262626] text-white rounded-xl pl-11 pr-10 py-3 text-sm focus:outline-none focus:border-[#FACB00] focus:ring-1 focus:ring-[#FACB00] transition-all placeholder:text-gray-500"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                if (inputRef.current) inputRef.current.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 rounded transition-colors"
            >
              <X size={16} />
            </button>
          )}

          {/* Autocomplete Dropdown List */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 max-h-72 bg-[#121212] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-y-auto z-50 divide-y divide-[#1e1e1e]">
              <div className="p-2 bg-[#161616] text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>{query.trim() ? 'Matching Active Projects' : 'Active Projects Available'}</span>
                <span className="text-[#FACB00] font-normal lowercase">{filteredProjects.length} found</span>
              </div>

              {filteredProjects.length === 0 ? (
                <div className="p-5 text-center text-gray-400 text-sm">
                  <MapPin size={24} className="mx-auto text-gray-600 mb-2" />
                  <p className="font-medium text-gray-300">No matching projects found</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {query.trim() 
                      ? `No active project matches "${query}"`
                      : 'No active projects registered in CRM (In Progress or Scheduled).'}
                  </p>
                </div>
              ) : (
                filteredProjects.map((project, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  const clientName = project.contacts 
                    ? `${project.contacts.first_name || ''} ${project.contacts.last_name || ''}`.trim()
                    : null;

                  return (
                    <div
                      key={project.id}
                      onClick={() => handleSelect(project)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`p-3 cursor-pointer transition-colors flex items-start gap-3 ${
                        isHighlighted ? 'bg-[#202020]' : 'hover:bg-[#1a1a1a]'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#FACB00]/10 border border-[#FACB00]/20 flex items-center justify-center text-[#FACB00] shrink-0 mt-0.5">
                        <MapPin size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-white truncate">
                            {project.address || 'Address to be confirmed'}
                          </p>
                          {getStatusBadge(project.status)}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 truncate">
                          <span className="text-[#FACB00] font-medium truncate">{project.title}</span>
                          {project.project_number && (
                            <span className="text-gray-500 font-mono">#{project.project_number}</span>
                          )}
                        </div>

                        {clientName && (
                          <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                            <User size={11} /> {clientName}
                            {project.contacts?.phone && <span className="text-gray-600">({project.contacts.phone})</span>}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-gray-500 self-center">
                        <ArrowRight size={14} className={isHighlighted ? 'text-[#FACB00] translate-x-0.5 transition-transform' : ''} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
    </div>
  );
}
