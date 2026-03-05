import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, TrendingUp, BarChart2, Globe, Zap } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const CATEGORY_COLORS = {
  'Macro': { bg: 'hsl(214,100%,60%,0.12)', text: 'hsl(214,100%,60%)', border: 'hsl(214,100%,60%,0.25)' },
  'FX': { bg: 'hsl(155,72%,45%,0.12)', text: 'hsl(155,72%,45%)', border: 'hsl(155,72%,45%,0.25)' },
  'Ações': { bg: 'hsl(46,100%,52%,0.12)', text: 'hsl(46,100%,52%)', border: 'hsl(46,100%,52%,0.25)' },
  'Commodities': { bg: 'hsl(36,95%,55%,0.12)', text: 'hsl(36,95%,55%)', border: 'hsl(36,95%,55%,0.25)' },
  'Crypto': { bg: 'hsl(270,70%,60%,0.12)', text: 'hsl(270,70%,70%)', border: 'hsl(270,70%,60%,0.25)' },
};

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');

  const fetchNews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/news`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setNews(await res.json());
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { fetchNews(); }, []);

  const filters = ['Todos', 'Macro', 'FX', 'Ações', 'Commodities', 'Crypto'];

  const filtered = news.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'Todos' || n.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>Notícias Financeiras</h1>
          <p style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>Atualizações dos mercados europeus e globais</p>
        </div>
        <button
          onClick={fetchNews}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'hsl(240,18%,14%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: 'hsl(215,16%,70%)', cursor: 'pointer', fontSize: 13 }}
        >
          <RefreshCw size={14} />
          Atualizar
        </button>
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(215,16%,70%)' }} />
          <input
            data-testid="news-search-input"
            type="text"
            placeholder="Pesquisar notícias..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 36px', background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div data-testid="news-filter-tabs" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: '7px 14px', borderRadius: 8, border: '1px solid',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                borderColor: activeFilter === f ? 'hsl(214,100%,60%,0.4)' : 'hsl(240,16%,22%)',
                background: activeFilter === f ? 'hsl(214,100%,60%,0.12)' : 'transparent',
                color: activeFilter === f ? 'hsl(214,100%,60%)' : 'hsl(215,16%,70%)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* News list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 100, background: 'hsl(240,26%,8%)', borderRadius: 12, border: '1px solid hsl(240,16%,18%)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : (
        <div data-testid="news-article-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'hsl(215,16%,70%)' }}>
              <BarChart2 size={40} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
              <p>Nenhuma notícia encontrada</p>
            </div>
          ) : (
            filtered.map(article => {
              const catStyle = CATEGORY_COLORS[article.category] || CATEGORY_COLORS['Macro'];
              return (
                <div
                  key={article.id}
                  style={{
                    background: 'hsl(240,26%,8%)',
                    border: '1px solid hsl(240,16%,18%)',
                    borderRadius: 14,
                    padding: '18px 20px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'hsl(214,100%,60%,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'hsl(240,16%,18%)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: catStyle.bg, color: catStyle.text, border: `1px solid ${catStyle.border}`, fontWeight: 600 }}>
                      {article.category}
                    </span>
                    <span style={{ fontSize: 11, color: 'hsl(215,16%,70%)' }}>{article.source}</span>
                    <span style={{ fontSize: 11, color: 'hsl(215,16%,60%)' }}>{article.time}</span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 600, color: '#f3f5ff', marginBottom: 6, lineHeight: 1.4 }}>{article.title}</h3>
                  <p style={{ fontSize: 12, color: 'hsl(215,16%,70%)', lineHeight: 1.6 }}>{article.snippet}</p>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
