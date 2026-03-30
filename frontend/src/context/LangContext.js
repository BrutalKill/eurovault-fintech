/**
 * LangContext.js — EuroVault Internationalisation (i18n)
 * Supports: Portuguese (PT), English (EN), Spanish (ES)
 *
 * Translation keys are split into separate files for maintainability:
 *   context/translations/pt.js  (~900 keys)
 *   context/translations/en.js  (~600 keys)
 *   context/translations/es.js  (~650 keys)
 */
import React, { createContext, useContext, useState } from 'react';
import pt from './translations/pt';
import en from './translations/en';
import es from './translations/es';

const TRANSLATIONS = { pt, en, es };

const LangContext = createContext(null);

// Detect browser language automatically
function detectBrowserLang() {
  const saved = localStorage.getItem('ev_lang');
  if (saved && ['pt', 'en', 'es'].includes(saved)) return saved;
  const raw = (navigator.language || navigator.languages?.[0] || 'pt').toLowerCase();
  if (raw.startsWith('es')) return 'es';
  if (raw.startsWith('en')) return 'en';
  if (raw.startsWith('pt')) return 'pt';
  return 'en'; // fallback for other European languages
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => detectBrowserLang());

  const changeLang = (newLang) => {
    if (['pt', 'en', 'es'].includes(newLang)) {
      setLang(newLang);
      localStorage.setItem('ev_lang', newLang);
    }
  };

  /** Translate a key. Falls back: current lang → pt → key itself */
  const t = (key) =>
    TRANSLATIONS[lang]?.[key]
    ?? TRANSLATIONS['pt']?.[key]
    ?? key;

  return (
    <LangContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
};
