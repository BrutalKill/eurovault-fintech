import React, { useEffect, useRef } from 'react';
import { useLang } from '../context/LangContext';

const LOCALE_MAP = { pt: 'pt', en: 'en', es: 'es' };

export default function NewsPage() {
  const { lang } = useLang();
  const containerRef = useRef(null);
  const locale = LOCALE_MAP[lang] || 'en';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Limpar widget anterior
    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      feedMode: 'all_symbols',
      colorTheme: 'dark',
      isTransparent: true,
      displayMode: 'regular',
      width: '100%',
      height: 700,
      locale,
    });
    container.appendChild(script);

    return () => { container.innerHTML = ''; };
  }, [locale]);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: '#f3f5ff', margin: 0 }}>
          {lang === 'pt' ? 'Notícias' : lang === 'es' ? 'Noticias' : 'News'}
        </h1>
        <p style={{ fontSize: 13, color: '#7a8299', margin: '4px 0 0' }}>
          {lang === 'pt' ? 'Últimas notícias dos mercados financeiros em tempo real'
            : lang === 'es' ? 'Últimas noticias de los mercados financieros en tiempo real'
            : 'Latest financial market news in real time'}
        </p>
      </div>

      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ borderRadius: 16, overflow: 'hidden', background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)' }}
      />
    </div>
  );
}
