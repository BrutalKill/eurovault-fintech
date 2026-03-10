import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, TrendingUp, BarChart2, Globe, Zap, Droplets,
         Landmark, ExternalLink, Clock, Tag } from 'lucide-react';
import { useLang } from '../context/LangContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const CATEGORIES = {
  'Macro':      { icon: Landmark,   color: '#3A86FF',  bg: 'rgba(58,134,255,0.1)',  border: 'rgba(58,134,255,0.25)',  label: 'Macro/BCE' },
  'FX':         { icon: Globe,      color: '#22c58b',  bg: 'rgba(34,197,139,0.1)',  border: 'rgba(34,197,139,0.25)',  label: 'Forex'     },
  'Forex':      { icon: Globe,      color: '#22c58b',  bg: 'rgba(34,197,139,0.1)',  border: 'rgba(34,197,139,0.25)',  label: 'Forex'     },
  'Ações':      { icon: TrendingUp, color: '#FFBE0B',  bg: 'rgba(255,190,11,0.1)',  border: 'rgba(255,190,11,0.25)',  label: 'Ações'     },
  'Commodities':{ icon: Droplets,   color: '#F59E0B',  bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)', label: 'Commodities'},
  'Crypto':     { icon: Zap,        color: '#a855f7',  bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.25)', label: 'Cripto'    },
};

const DEFAULT_CAT = { icon: BarChart2, color: '#7a8299', bg: 'rgba(122,130,153,0.1)', border: 'rgba(122,130,153,0.2)', label: 'Geral' };

const SOURCE_FAVICONS = {
  'Reuters':       '🔴',
  'Yahoo Finance': '🟣',
  'CoinDesk':      '🟡',
  'Financial Times': '🟠',
  'CNBC':          '🔵',
  'Bloomberg':     '⚫',
  'Investing.com': '🟢',
  'Markit':        '⬜',
};

function NewsCard({ article, isNew }) {
  const cat = CATEGORIES[article.category] || DEFAULT_CAT;
  const CatIcon = cat.icon;
  const emoji = SOURCE_FAVICONS[article.source] || '📰';
  const hasUrl = article.url && article.url !== '#';

  return (
    <div
      data-testid="news-article-card"
      onClick={() => hasUrl && window.open(article.url, '_blank', 'noopener,noreferrer')}
      style={{
        background: 'hsl(240,26%,8%)',
        border: `1px solid ${isNew ? cat.border : 'hsl(240,16%,18%)'}`,
        borderRadius: 14, padding: '16px 18px',
        cursor: hasUrl ? 'pointer' : 'default',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (hasUrl) {
          e.currentTarget.style.borderColor = cat.border;
          e.currentTarget.style.background = 'hsl(240,26%,10%)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isNew ? cat.border : 'hsl(240,16%,18%)';
        e.currentTarget.style.background = 'hsl(240,26%,8%)';
      }}
    >
      {/* Barra lateral de cor da categoria */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: cat.color, borderRadius: '14px 0 0 14px' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Ícone da categoria */}
        <div style={{ width: 38, height: 38, background: cat.bg, border: `1px solid ${cat.border}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CatIcon size={17} color={cat.color} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, background: cat.bg, color: cat.color, border: `1px solid ${cat.border}`, fontWeight: 700 }}>
              {cat.label}
            </span>
            <span style={{ fontSize: 11, color: 'hsl(215,16%,65%)' }}>{emoji} {article.source}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'hsl(215,16%,50%)' }}>
              <Clock size={10} />{article.time}
            </span>
            {hasUrl && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: cat.color, marginLeft: 'auto' }}>
                <ExternalLink size={10} />Ver mais
              </span>
            )}
          </div>

          {/* Título */}
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: '#f3f5ff', margin: '0 0 6px', lineHeight: 1.4 }}>
            {article.title}
          </h3>

          {/* Snippet */}
          {article.snippet && (
            <p style={{ fontSize: 12, color: 'hsl(215,16%,60%)', lineHeight: 1.6, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {article.snippet}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewsPage() {
  const { t } = useLang();
  const [news, setNews]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [lastFetch, setLastFetch] = useState(null);
  const [newIds, setNewIds]       = useState(new Set());
  const [countdown, setCountdown] = useState(300); // 5 min

  const fetchNews = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/news`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setNews(prev => {
          const prevIds = new Set(prev.map(n => n.id));
          const fresh = data.filter(n => !prevIds.has(n.id));
          if (fresh.length > 0) setNewIds(new Set(fresh.map(n => n.id)));
          return data;
        });
        setLastFetch(new Date());
        setCountdown(300);
      }
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  // Auto-refresh a cada 5 minutos + countdown
  useEffect(() => {
    const refreshTimer = setInterval(() => fetchNews(false), 300_000);
    const countTimer   = setInterval(() => setCountdown(c => {
      if (c <= 1) { return 300; }
      return c - 1;
    }), 1000);
    return () => { clearInterval(refreshTimer); clearInterval(countTimer); };
  }, [fetchNews]);

  // Limpar badges de "new" após 5s
  useEffect(() => {
    if (newIds.size > 0) {
      const t = setTimeout(() => setNewIds(new Set()), 5000);
      return () => clearTimeout(t);
    }
  }, [newIds]);

  const filters = ['Todos', 'Macro', 'FX', 'Ações', 'Commodities', 'Crypto'];

  const filtered = news.filter(n => {
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'Todos' || n.category === activeFilter ||
      (activeFilter === 'FX' && n.category === 'Forex');
    return matchSearch && matchFilter;
  });

  // Contagem por categoria
  const counts = {};
  news.forEach(n => { counts[n.category] = (counts[n.category] || 0) + 1; });

  const fmtCountdown = () => `${Math.floor(countdown/60)}:${String(countdown%60).padStart(2,'0')}`;

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>Notícias Financeiras</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 7, height: 7, background: '#22c58b', borderRadius: '50%', animation: 'shimmer 2s ease infinite' }} />
            <p style={{ fontSize: 13, color: 'hsl(215,16%,65%)', margin: 0 }}>Tempo real · {filtered.length} artigos</p>
            {lastFetch && (
              <span style={{ fontSize: 11, color: 'hsl(215,16%,45%)' }}>
                · Próxima actualização em {fmtCountdown()}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => fetchNews(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: 'hsl(240,18%,14%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: 'hsl(215,16%,70%)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          <RefreshCw size={14} />{loading ? (t('news_loading').replace('…','…')) : t('news_refresh')}
        </button>
      </div>

      {/* Categorias com ícones e contadores */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        <button onClick={() => setActiveFilter('Todos')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, border: `1px solid ${activeFilter === 'Todos' ? 'rgba(58,134,255,0.4)' : 'hsl(240,16%,22%)'}`, background: activeFilter === 'Todos' ? 'rgba(58,134,255,0.12)' : 'transparent', color: activeFilter === 'Todos' ? '#3A86FF' : 'hsl(215,16%,65%)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
          <Tag size={12} />Todos
          <span style={{ fontSize: 10, background: 'rgba(58,134,255,0.2)', padding: '1px 5px', borderRadius: 4 }}>{news.length}</span>
        </button>
        {filters.slice(1).map(f => {
          const cat = CATEGORIES[f] || DEFAULT_CAT;
          const CIcon = cat.icon;
          const isActive = activeFilter === f;
          const count = counts[f] || (f === 'FX' ? (counts['Forex'] || 0) : 0);
          return (
            <button key={f} onClick={() => setActiveFilter(f)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, border: `1px solid ${isActive ? cat.border : 'hsl(240,16%,22%)'}`, background: isActive ? cat.bg : 'transparent', color: isActive ? cat.color : 'hsl(215,16%,65%)', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s' }}>
              <CIcon size={12} />{cat.label}
              {count > 0 && <span style={{ fontSize: 10, background: isActive ? `${cat.color}30` : 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 4 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Pesquisa */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(215,16%,55%)' }} />
        <input data-testid="news-search-input" type="text" placeholder="Pesquisar notícias em tempo real..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px 10px 36px', background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Lista de notícias */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: 96, background: 'hsl(240,26%,8%)', borderRadius: 14, border: '1px solid hsl(240,16%,18%)', opacity: 0.6 + i*0.08 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'hsl(215,16%,50%)' }}>
          <BarChart2 size={40} style={{ margin: '0 auto 14px', opacity: 0.3 }} />
          <p style={{ fontSize: 13, margin: 0 }}>Nenhuma notícia encontrada</p>
        </div>
      ) : (
        <div data-testid="news-article-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(article => (
            <NewsCard key={article.id} article={article} isNew={newIds.has(article.id)} />
          ))}
        </div>
      )}

      {/* Rodapé */}
      {!loading && filtered.length > 0 && (
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'hsl(215,16%,40%)' }}>
          Fontes: Reuters · Yahoo Finance · CoinDesk · Investing.com · Auto-refresh a cada 5 minutos
        </div>
      )}
    </div>
  );
}
