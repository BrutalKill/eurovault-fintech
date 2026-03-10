import React, { useState } from 'react';
import { Search, Star, Globe, Zap, TrendingUp, Landmark, Droplets, BarChart2 } from 'lucide-react';
import { ASSETS, CAT_COLORS } from './tradeData';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const CAT_ICONS = { Forex: Globe, Cripto: Zap, 'Acções': TrendingUp, Metais: Landmark, Commodities: Droplets };

export default function TradeAssets({ activeCat, selectedAsset, onCatChange, onAssetSelect }) {
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ev_fav') || '[]'); } catch { return []; }
  });
  const col = CAT_COLORS[activeCat] || CAT_COLORS['Forex'];

  const toggleFav = async (symbol, e) => {
    e.stopPropagation();
    const updated = favorites.includes(symbol)
      ? favorites.filter(s => s !== symbol)
      : [...favorites, symbol];
    setFavorites(updated);
    localStorage.setItem('ev_fav', JSON.stringify(updated));
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${BACKEND_URL}/api/me/favorites`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ favorites: updated }),
      }).catch(() => {});
    }
  };

  const items = ASSETS[activeCat].items.filter(a =>
    a.label.toLowerCase().includes(search.toLowerCase()) ||
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  // Favoritos no topo (só quando não há pesquisa)
  const favItems = !search ? items.filter(a => favorites.includes(a.symbol)) : [];
  const nonFavItems = !search ? items.filter(a => !favorites.includes(a.symbol)) : items;
  const displayItems = [...favItems, ...nonFavItems];

  return (
    <div style={{
      background: 'linear-gradient(180deg, hsl(240,26%,9%) 0%, hsl(240,26%,8%) 100%)',
      border: '1px solid hsl(240,16%,18%)',
      borderRadius: 16,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 560,
    }}>

      {/* ── Categorias com ícones ── */}
      <div style={{ padding: '8px 8px 0', background: '#0a0a18', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
          {Object.keys(ASSETS).map(key => {
            const c    = CAT_COLORS[key];
            const active = activeCat === key;
            const Icon = CAT_ICONS[key] || BarChart2;
            return (
              <button key={key} onClick={() => { setSearch(''); onCatChange(key); }}
                style={{
                  flexShrink: 0, padding: '5px 9px', borderRadius: 8,
                  border: `1px solid ${active ? c.border : 'rgba(255,255,255,0.05)'}`,
                  background: active ? c.bg : 'transparent',
                  color: active ? c.active : '#4a5068',
                  fontSize: 10, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 4,
                  transition: 'all .15s',
                }}>
                <Icon size={11} />{key}
              </button>
            );
          })}
        </div>

        {/* Pesquisa */}
        <div style={{ position: 'relative', paddingBottom: 8 }}>
          <Search size={11} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-60%)', color: '#4a5068' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar…"
            style={{ width: '100%', padding: '7px 10px 7px 26px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: '#f3f5ff', fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* ── Cabeçalho ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 12px', background: 'rgba(0,0,0,0.2)' }}>
        <span style={{ fontSize: 9, color: '#26263a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Par</span>
        <span style={{ fontSize: 9, color: '#26263a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Preço / Var.</span>
      </div>

      {/* ── Lista ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {displayItems.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#4a5068', fontSize: 12 }}>Sem resultados</div>
        )}
        {displayItems.map((asset, i) => {
          const sel   = selectedAsset.symbol === asset.symbol;
          const isFav = favorites.includes(asset.symbol);
          const isFirstNonFav = !search && i === favItems.length && favItems.length > 0;
          return (
            <React.Fragment key={asset.symbol}>
              {isFirstNonFav && (
                <div style={{ padding: '4px 12px', fontSize: 8, color: '#26263a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                  TODOS
                </div>
              )}
              <div onClick={() => onAssetSelect(asset)}
                style={{
                  padding: '9px 12px', cursor: 'pointer',
                  background: sel ? col.bg : 'transparent',
                  borderLeft: `3px solid ${sel ? col.active : 'transparent'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = sel ? col.bg : 'transparent'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <button onClick={(e) => toggleFav(asset.symbol, e)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0, lineHeight: 0 }}>
                    <Star size={10} color={isFav ? '#FFBE0B' : '#26263a'} fill={isFav ? '#FFBE0B' : 'none'} />
                  </button>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: sel ? col.active : '#e8eaf6', letterSpacing: '-0.01em' }}>{asset.label}</div>
                    <div style={{ fontSize: 9, color: '#4a5068', marginTop: 1 }}>{asset.name}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="numeric" style={{ fontSize: 11, fontWeight: 700, color: sel ? '#fff' : '#c8ccdd' }}>{asset.price}</div>
                  <div className="numeric" style={{ fontSize: 10, fontWeight: 700, color: asset.pos ? '#22c58b' : '#ef4444', padding: '1px 4px', background: asset.pos ? 'rgba(34,197,139,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: 3, marginTop: 1 }}>
                    {asset.change}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

