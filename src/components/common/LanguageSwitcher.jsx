import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function LanguageSwitcher() {
  const { lang, switchLang } = useLanguage();

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '4px',
      background: '#1a1a1a', padding: '4px', borderRadius: '10px',
      border: '1px solid #333', width: '100%', justifyContent: 'center'
    }}>
      <span style={{ fontSize: '13px', marginRight: '4px' }}>🌐</span>
      <button
        onClick={() => switchLang('es')}
        style={{
          flex: 1, padding: '5px 0', fontSize: '12px', fontWeight: '700',
          borderRadius: '7px', border: 'none', cursor: 'pointer',
          background: lang === 'es' ? '#FACB00' : 'transparent',
          color: lang === 'es' ? '#000' : '#888',
          transition: 'all 0.2s'
        }}
      >
        ES
      </button>
      <button
        onClick={() => switchLang('en')}
        style={{
          flex: 1, padding: '5px 0', fontSize: '12px', fontWeight: '700',
          borderRadius: '7px', border: 'none', cursor: 'pointer',
          background: lang === 'en' ? '#FACB00' : 'transparent',
          color: lang === 'en' ? '#000' : '#888',
          transition: 'all 0.2s'
        }}
      >
        EN
      </button>
    </div>
  );
}
