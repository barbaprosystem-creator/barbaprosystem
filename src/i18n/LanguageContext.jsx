import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations } from './translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('barba_lang') || 'es';
  });

  const switchLang = useCallback((newLang) => {
    setLang(newLang);
    localStorage.setItem('barba_lang', newLang);
  }, []);

  // t('nav.dashboard') → returns the translation string
  const t = useCallback((key) => {
    const parts = key.split('.');
    let result = translations[lang];
    for (const part of parts) {
      result = result?.[part];
    }
    // Fallback to Spanish if key not found in English
    if (result === undefined) {
      let fallback = translations['es'];
      for (const part of parts) {
        fallback = fallback?.[part];
      }
      return fallback ?? key;
    }
    return result;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
