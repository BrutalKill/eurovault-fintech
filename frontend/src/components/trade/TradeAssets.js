import React, { useState } from 'react';
import { Search, Star } from 'lucide-react';
import { ASSETS, CAT_COLORS } from './tradeData';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

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
      background: '#111118',
      border: '1px solid #26263a',
      borderRadius: 14,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 540,
    }}>

      {/* ── Categorias + pesquisa ── */}
      <div style={{ borderBottom: '1px solid #26263a', padding: '10px 10px 0' }}>
        <div style={{
          display: 'flex', gap: 4,
          overflowX: 'auto', paddingBottom: 8,
          scrollbarWidth: 'none',
        }}>
          {Object.keys(ASSETS).map(key => {
            const c = CAT_COLORS[key];
            const active = activeCat === key;
            return (
              <button
                key={key}
                onClick={() => { setSearch(''); onCatChange(key); }}
                style={{
                  flexShrink: 0, padding: '5px 10px', borderRadius: 7,
                  border: `1px solid ${active ? c.border : 'transparent'}`,
                  background: active ? c.bg : 'transparent',
                  color: active ? c.active : '#7a8299',
                  fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {key}
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', paddingBottom: 8 }}>
          <Search size={12} style={{
            position: 'absolute', left: 9, top: '50%',
            transform: 'translateY(-60%)', color: '#7a8299',
          }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar…"
            style={{
              width: '100%', padding: '7px 10px 7px 28px',
              background: '#0e0e1a', border: '1px solid #26263a',
              borderRadius: 8, color: '#f3f5ff', fontSize: 11,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* ── Cabeçalho ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '5px 12px', borderBottom: '1px solid #1a1a2a',
      }}>
        <span style={{ fontSize: 10, color: '#4a5068', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Instrumento</span>
        <span style={{ fontSize: 10, color: '#4a5068', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Var.</span>
      </div>

      {/* ── Lista de activos ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {displayItems.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#7a8299', fontSize: 12 }}>
            Sem resultados
          </div>
        )}
        {displayItems.map((asset, i) => {
          const sel = selectedAsset.symbol === asset.symbol;
          const isFav = favorites.includes(asset.symbol);
          const isFirstNonFav = !search && i === favItems.length && favItems.length > 0;
          return (
            <React.Fragment key={asset.symbol}>
              {isFirstNonFav && (
                <div style={{ padding: '4px 12px', fontSize: 9, color: '#4a5068', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: '#0a0a18', borderTop: '1px solid #1e1e30' }}>
                  Todos
                </div>
              )}
              <div
                onClick={() => onAssetSelect(asset)}
                style={{
                  padding: '9px 12px', cursor: 'pointer',
                  background: sel ? col.bg : 'transparent',
                  borderLeft: `2px solid ${sel ? col.active : 'transparent'}`,
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = sel ? col.bg : 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={(e) => toggleFav(asset.symbol, e)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
                    <Star size={11} color={isFav ? '#FFBE0B' : '#26263a'} fill={isFav ? '#FFBE0B' : 'none'} />
                  </button>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: sel ? col.active : '#e8eaf6' }}>{asset.label}</div>
                    <div style={{ fontSize: 10, color: '#7a8299', marginTop: 1 }}>{asset.name}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="numeric" style={{ fontSize: 11, fontWeight: 700, color: '#e8eaf6' }}>{asset.price}</div>
                  <div className="numeric" style={{ fontSize: 10, fontWeight: 600, color: asset.pos ? '#22c58b' : '#ef4444' }}>{asset.change}</div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
