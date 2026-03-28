import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useLang } from '../context/LangContext';

const LANGUAGES = [
  { code: 'pt', label: 'PT', name: 'Português', flag: 'https://flagcdn.com/w40/pt.png' },
  { code: 'en', label: 'EN', name: 'English',   flag: 'https://flagcdn.com/w40/gb.png' },
  { code: 'es', label: 'ES', name: 'Español',   flag: 'https://flagcdn.com/w40/es.png' },
];

const DROPDOWN_WIDTH = 160;

export default function LangSwitcher({ compact = false }) {
  const { lang, changeLang } = useLang();
  const [open, setOpen]       = useState(false);
  const [dropLeft, setDropLeft] = useState(false); // false = abre para a direita, true = abre para a esquerda
  const ref = useRef(null);

  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  // Fechar ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggle = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      // Se há espaço suficiente à DIREITA, abre para a direita (left: 0)
      // Caso contrário, abre para a esquerda (right: 0)
      const spaceRight = window.innerWidth - rect.left;
      setDropLeft(spaceRight < DROPDOWN_WIDTH + 16);
    }
    setOpen(o => !o);
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>

      {/* ── Botão trigger ── */}
      <button
        data-testid="lang-switcher-btn"
        onClick={handleToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: compact ? '5px 8px' : '6px 12px',
          background: open ? 'hsl(240,18%,17%)' : 'hsl(240,18%,14%)',
          border: `1px solid ${open ? 'hsl(214,100%,60%)' : 'hsl(240,16%,22%)'}`,
          borderRadius: 9, cursor: 'pointer',
          color: 'hsl(215,16%,80%)',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'hsl(214,100%,60%)';
          e.currentTarget.style.background  = 'hsl(240,18%,17%)';
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.borderColor = 'hsl(240,16%,22%)';
            e.currentTarget.style.background  = 'hsl(240,18%,14%)';
          }
        }}
      >
        {/* Bandeira */}
        <img
          src={current.flag}
          alt={current.name}
          style={{ width: 22, height: 15, borderRadius: 2, objectFit: 'cover', boxShadow: '0 1px 3px rgba(0,0,0,0.4)', flexShrink: 0 }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        {/* Label (só em modo não-compact) */}
        {!compact && (
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em' }}>
            {current.label}
          </span>
        )}
        {/* Chevron */}
        <ChevronDown
          size={12}
          color="hsl(215,16%,55%)"
          style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)', flexShrink: 0 }}
        />
      </button>

      {/* ── Dropdown com posicionamento inteligente ── */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          // Abre para a DIREITA se houver espaço, para a ESQUERDA caso contrário
          ...(dropLeft ? { right: 0 } : { left: 0 }),
          background: 'hsl(240,26%,10%)',
          border: '1px solid hsl(240,16%,22%)',
          borderRadius: 12,
          overflow: 'hidden',
          zIndex: 9999,
          minWidth: DROPDOWN_WIDTH,
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
        }}>
          {LANGUAGES.map((l) => {
            const isActive = lang === l.code;
            return (
              <button
                key={l.code}
                data-testid={`lang-option-${l.code}`}
                onClick={() => { changeLang(l.code); setOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', border: 'none', cursor: 'pointer',
                  background: isActive ? 'rgba(58,134,255,0.12)' : 'transparent',
                  color: isActive ? '#3A86FF' : 'hsl(215,16%,75%)',
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  textAlign: 'left', transition: 'background 0.1s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <img
                  src={l.flag}
                  alt={l.name}
                  style={{ width: 24, height: 16, borderRadius: 2, objectFit: 'cover', boxShadow: '0 1px 3px rgba(0,0,0,0.4)', flexShrink: 0 }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <span style={{ flex: 1 }}>{l.name}</span>
                {isActive && <Check size={13} color="#3A86FF" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
