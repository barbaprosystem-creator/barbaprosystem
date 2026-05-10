import React from 'react';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher() {
  const currentLang = document.cookie.includes('googtrans=/es/en') ? 'en' : 'es';

  const setLanguage = (lang) => {
    if (lang === currentLang) return;
    
    const domain = window.location.hostname;
    if (lang === 'es') {
      // Remove Google Translate cookies to revert to default (Spanish)
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`;
    } else {
      // Set to English
      document.cookie = `googtrans=/es/en; path=/;`;
      document.cookie = `googtrans=/es/en; path=/; domain=${domain};`;
      document.cookie = `googtrans=/es/en; path=/; domain=.${domain};`;
    }
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-1 bg-[#1a1a1a] p-1 rounded-lg border border-[#333]">
      <Languages size={14} className="text-[#888] ml-2 mr-1" />
      <button
        onClick={() => setLanguage('es')}
        className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
          currentLang === 'es' ? 'bg-[#333] text-white shadow-sm' : 'text-[#888] hover:text-[#ddd]'
        }`}
      >
        ES
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
          currentLang === 'en' ? 'bg-[#333] text-white shadow-sm' : 'text-[#888] hover:text-[#ddd]'
        }`}
      >
        EN
      </button>
    </div>
  );
}
