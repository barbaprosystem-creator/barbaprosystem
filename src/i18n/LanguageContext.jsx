import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations } from './translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return 'en';
  });

  const switchLang = useCallback((newLang) => {
    // Keep locked to 'en'
    setLang('en');
  }, []);

  // t('nav.dashboard') → returns the translation string
  const t = useCallback((key) => {
    const parts = key.split('.');
    let result = translations[lang];
    for (const part of parts) {
      result = result?.[part];
    }
    // Fallback to English if key not found
    if (result === undefined) {
      let fallback = translations['en'];
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
