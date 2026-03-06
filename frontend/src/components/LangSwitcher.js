import React, { useState, useRef, useEffect } from 'react';
import { useLang } from '../context/LangContext';

const FLAGS = { pt: '🇵🇹', en: '🇬🇧', es: '🇪🇸' };
const LABELS = { pt: 'PT', en: 'EN', es: 'ES' };

export default function LangSwitcher({ compact = false }) {
  const { lang, changeLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        data-testid="lang-switcher-btn"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: compact ? 4 : 6,
          padding: compact ? '5px 8px' : '6px 11px',
          background: 'hsl(240,18%,14%)',
          border: '1px solid hsl(240,16%,22%)',
          borderRadius: 8, cursor: 'pointer',
          color: 'hsl(215,16%,70%)',
          fontSize: 12, fontWeight: 700,
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'hsl(214,100%,60%)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'hsl(240,16%,22%)'}
      >
        <span style={{ fontSize: 14 }}>{FLAGS[lang]}</span>
        {!compact && <span>{LABELS[lang]}</span>}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '110%', right: 0,
          background: 'hsl(240,26%,10%)',
          border: '1px solid hsl(240,16%,22%)',
          borderRadius: 10, overflow: 'hidden',
          zIndex: 500, minWidth: 100,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {Object.entries(FLAGS).map(([code, flag]) => (
            <button
              key={code}
              data-testid={`lang-option-${code}`}
              onClick={() => { changeLang(code); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 14px', border: 'none', cursor: 'pointer',
                background: lang === code ? 'rgba(58,134,255,0.12)' : 'transparent',
                color: lang === code ? '#3A86FF' : 'hsl(215,16%,70%)',
                fontSize: 13, fontWeight: lang === code ? 700 : 500,
                textAlign: 'left',
              }}
              onMouseEnter={e => { if (lang !== code) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (lang !== code) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 16 }}>{flag}</span>
              <span>{{ pt: 'Português', en: 'English', es: 'Español' }[code]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
