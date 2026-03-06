import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowDownToLine, ChevronUp, ChevronDown, Info } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { ASSETS, CAT_COLORS } from '../components/trade/tradeData';
import TradeAssets from '../components/trade/TradeAssets';
import TradeOrder  from '../components/trade/TradeOrder';

const fmt = (v) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);

export default function TradePage() {
  const { user }    = useUser();
  const navigate    = useNavigate();
  const iframeRef   = useRef(null);

  const [activeCat, setActiveCat]         = useState('Forex');
  const [selectedAsset, setSelectedAsset] = useState(ASSETS.Forex.items[0]);
  const [showOrder, setShowOrder]         = useState(false);
  const [initSide, setInitSide]           = useState('comprar');
  const [isMobile, setIsMobile]           = useState(() => window.innerWidth < 1024);

  // Actualiza isMobile ao redimensionar a janela
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const safeBalance = Math.max(0, parseFloat(user?.balance) || 0);
  const safeProfit  = Math.max(0, parseFloat(user?.profit)  || 0);
  const col = CAT_COLORS[activeCat] || CAT_COLORS['Forex'];

  const handleCatChange = (key) => {
    setActiveCat(key);
    setSelectedAsset(ASSETS[key].items[0]);
  };

  const handleBuy          = () => { setInitSide('comprar'); setShowOrder(true); };
  const handleSell         = () => { setInitSide('vender');  setShowOrder(true); };
  const handleAssetSelect  = (a) => setSelectedAsset(a);

  const chartSrc = `https://s.tradingview.com/widgetembed/?frameElementId=tv_ev&symbol=${encodeURIComponent(selectedAsset.symbol)}&interval=D&theme=dark&style=1&timezone=Europe%2FLisbon&locale=pt&withdateranges=1`;

  /* ────────── MOBILE ────────── */
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Painel de ordem inline — SEM position:fixed, sem modal */}
        {showOrder && (
          <TradeOrder
            key={`${selectedAsset.symbol}-${initSide}`}
            asset={selectedAsset}
            activeCat={activeCat}
            initialSide={initSide}
            onClose={() => setShowOrder(false)}
          />
        )}

        {/* Saldo + Lucro */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, background: '#111118', border: '1px solid #26263a', borderRadius: 10, padding: '8px 12px' }}>
            <div style={{ fontSize: 10, color: '#7a8299', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Saldo</div>
            <div data-testid="trade-balance-eur" className="numeric" style={{ fontSize: 16, fontWeight: 700, color: '#f3f5ff' }}>{fmt(safeBalance)}</div>
          </div>
          <div style={{ flex: 1, background: '#111118', border: '1px solid #26263a', borderRadius: 10, padding: '8px 12px' }}>
            <div style={{ fontSize: 10, color: '#7a8299', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lucro</div>
            <div data-testid="trade-profit-eur" className="numeric" style={{ fontSize: 16, fontWeight: 700, color: '#22c58b' }}>+{fmt(safeProfit)}</div>
          </div>
        </div>

        {/* Activo + botões */}
        <div style={{ background: '#111118', border: `1px solid ${col.border}`, borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#f3f5ff' }}>
                {selectedAsset.label}
              </div>
              <div style={{ fontSize: 11, color: '#7a8299' }}>{selectedAsset.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="numeric" style={{ fontSize: 20, fontWeight: 800, color: '#f3f5ff', fontFamily: 'var(--font-heading)' }}>
                {selectedAsset.price}
              </div>
              <div className="numeric" style={{ fontSize: 12, fontWeight: 700, color: selectedAsset.pos ? '#22c58b' : '#ef4444' }}>
                {selectedAsset.change}
              </div>
            </div>
          </div>

          {/* COMPRAR / VENDER */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              onClick={handleBuy}
              style={{ padding: '15px 0', background: '#22c58b', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <ChevronUp size={18} />COMPRAR
            </button>
            <button
              onClick={handleSell}
              style={{ padding: '15px 0', background: '#ef4444', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <ChevronDown size={18} />VENDER
            </button>
          </div>
        </div>

        {/* Gráfico */}
        <div
          data-testid="trade-tradingview-container"
          style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 12, overflow: 'hidden', height: 280 }}
        >
          <iframe
            key={selectedAsset.symbol}
            src={chartSrc}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            title={`Gráfico ${selectedAsset.label}`}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>

        {/* Lista de activos */}
        <TradeAssets
          activeCat={activeCat}
          selectedAsset={selectedAsset}
          onCatChange={handleCatChange}
          onAssetSelect={(a) => { setSelectedAsset(a); setShowOrder(false); }}
        />
      </div>
    );
  }

  /* ────────── DESKTOP ────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff', margin: 0 }}>
            Negociar
          </h1>
          <p style={{ fontSize: 12, color: '#7a8299', margin: '2px 0 0' }}>Mercados globais em tempo real</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 10, padding: '7px 14px' }}>
            <div style={{ fontSize: 10, color: '#7a8299', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Saldo</div>
            <div data-testid="trade-balance-eur" className="numeric" style={{ fontSize: 14, fontWeight: 700, color: '#f3f5ff' }}>{fmt(safeBalance)}</div>
          </div>
          <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 10, padding: '7px 14px' }}>
            <div style={{ fontSize: 10, color: '#7a8299', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lucro</div>
            <div data-testid="trade-profit-eur" className="numeric" style={{ fontSize: 14, fontWeight: 700, color: '#22c58b' }}>+{fmt(safeProfit)}</div>
          </div>
        </div>
      </div>

      {/* Grid 3 colunas */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 272px', gap: 12, alignItems: 'start' }}>

        {/* Col 1 — Activos */}
        <TradeAssets
          activeCat={activeCat}
          selectedAsset={selectedAsset}
          onCatChange={handleCatChange}
          onAssetSelect={handleAssetSelect}
        />

        {/* Col 2 — Gráfico */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Barra do activo */}
          <div style={{
            background: '#111118', border: '1px solid #26263a',
            borderRadius: 12, padding: '12px 16px',
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ width: 36, height: 36, background: col.bg, border: `1px solid ${col.border}`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: col.active, letterSpacing: '-0.02em' }}>
              {ASSETS[activeCat].icon}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: '#f3f5ff' }}>{selectedAsset.label}</div>
              <div style={{ fontSize: 11, color: '#7a8299' }}>{selectedAsset.name}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="numeric" style={{ fontSize: 20, fontWeight: 700, color: '#f3f5ff', fontFamily: 'var(--font-heading)' }}>{selectedAsset.price}</span>
              <span className="numeric" style={{ fontSize: 13, fontWeight: 700, color: selectedAsset.pos ? '#22c58b' : '#ef4444' }}>
                {selectedAsset.pos ? <ChevronUp size={13} style={{ display: 'inline' }} /> : <ChevronDown size={13} style={{ display: 'inline' }} />}
                {selectedAsset.change}
              </span>
            </div>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 6, background: col.bg, color: col.active, border: `1px solid ${col.border}`, fontWeight: 700 }}>
              {activeCat.toUpperCase()}
            </span>
          </div>

          {/* TradingView */}
          <div
            data-testid="trade-tradingview-container"
            style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, overflow: 'hidden', height: 440 }}
          >
            <iframe
              key={selectedAsset.symbol}
              ref={iframeRef}
              src={chartSrc}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              title={`Gráfico ${selectedAsset.label}`}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(58,134,255,0.06)', border: '1px solid rgba(58,134,255,0.15)', borderRadius: 10 }}>
            <Info size={13} style={{ color: '#3A86FF', flexShrink: 0 }} />
            <p style={{ fontSize: 11, color: '#7a8299', margin: 0, lineHeight: 1.5 }}>
              Plataforma regulamentada pela CySEC · MiFID II · Fundos protegidos ICF
            </p>
          </div>
        </div>

        {/* Col 3 — Painel de ordem */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <TradeOrder asset={selectedAsset} activeCat={activeCat} />

          {/* Cotações rápidas */}
          <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#7a8299', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Cotações Forex
            </div>
            {ASSETS.Forex.items.slice(0, 5).map(a => (
              <div key={a.symbol}
                onClick={() => { handleCatChange('Forex'); setSelectedAsset(a); }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7, cursor: 'pointer', padding: '2px 0' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: '#e8eaf6' }}>{a.label}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="numeric" style={{ fontSize: 11, color: '#e8eaf6' }}>{a.price}</span>
                  <span className="numeric" style={{ fontSize: 10, fontWeight: 700, minWidth: 52, textAlign: 'right', color: a.pos ? '#22c58b' : '#ef4444' }}>{a.change}</span>
                </div>
              </div>
            ))}
          </div>

          <button data-testid="trade-deposit-cta" onClick={() => navigate('/app/deposit')}
            style={{ width: '100%', padding: '10px', background: '#3A86FF', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <CreditCard size={13} />Depósito
          </button>
          <button data-testid="trade-withdrawal-cta" onClick={() => navigate('/app/withdrawal')}
            style={{ width: '100%', padding: '10px', background: '#151522', border: '1px solid #26263a', borderRadius: 10, color: '#e8eaf6', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <ArrowDownToLine size={13} />Levantamento
          </button>
        </div>
      </div>
    </div>
  );
}
