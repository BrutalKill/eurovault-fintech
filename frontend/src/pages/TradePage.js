import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowDownToLine, ChevronUp, ChevronDown,
         TrendingUp, Activity, Globe, Zap, Droplets, Landmark, BarChart2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useLang } from '../context/LangContext';
import { useCountUp } from '../hooks/useCountUp';
import { ASSETS, CAT_COLORS } from '../components/trade/tradeData';
import TradeAssets from '../components/trade/TradeAssets';
import TradeOrder  from '../components/trade/TradeOrder';

const fmt = (v) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);

const CAT_ICONS = {
  Forex:       Globe,
  Cripto:      Zap,
  'Acções':    TrendingUp,
  Metais:      Landmark,
  Commodities: Droplets,
};

export default function TradePage() {
  const { user }  = useUser();
  const { t }     = useLang();
  const navigate  = useNavigate();
  const iframeRef = useRef(null);

  const [activeCat, setActiveCat]         = useState('Forex');
  const [selectedAsset, setSelectedAsset] = useState(ASSETS.Forex.items[0]);
  const [showOrder, setShowOrder]         = useState(false);
  const [initSide, setInitSide]           = useState('comprar');
  const [isMobile, setIsMobile]           = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const safeBalance = Math.max(0, parseFloat(user?.balance) || 0);
  const safeProfit  = Math.max(0, parseFloat(user?.profit)  || 0);
  const animBalance = useCountUp(safeBalance);
  const animProfit  = useCountUp(safeProfit);
  const col = CAT_COLORS[activeCat] || CAT_COLORS['Forex'];

  const handleCatChange   = (key) => { setActiveCat(key); setSelectedAsset(ASSETS[key].items[0]); };
  const handleBuy         = () => { setInitSide('comprar'); setShowOrder(true); };
  const handleSell        = () => { setInitSide('vender');  setShowOrder(true); };
  const handleAssetSelect = (a) => setSelectedAsset(a);

  const chartSrc = `https://s.tradingview.com/widgetembed/?frameElementId=tv_ev&symbol=${encodeURIComponent(selectedAsset.symbol)}&interval=D&theme=dark&style=1&timezone=Europe%2FLisbon&locale=pt&withdateranges=1`;

  /* ────────────────────────────── MOBILE ────────────────────────────── */
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {showOrder && (
          <TradeOrder key={`${selectedAsset.symbol}-${initSide}`}
            asset={selectedAsset} activeCat={activeCat}
            initialSide={initSide} onClose={() => setShowOrder(false)} />
        )}

        {/* Saldo + Lucro */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(58,134,255,0.15),rgba(58,134,255,0.05))', border: '1px solid rgba(58,134,255,0.25)', borderRadius: 12, padding: '10px 14px' }}>
            <div style={{ fontSize: 9, color: 'rgba(58,134,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Saldo</div>
            <div data-testid="trade-balance-eur" className="numeric" style={{ fontSize: 17, fontWeight: 800, color: '#f3f5ff', fontFamily: 'var(--font-heading)' }}>{fmt(animBalance)}</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg,rgba(34,197,139,0.15),rgba(34,197,139,0.05))', border: '1px solid rgba(34,197,139,0.25)', borderRadius: 12, padding: '10px 14px' }}>
            <div style={{ fontSize: 9, color: 'rgba(34,197,139,0.8)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Lucro</div>
            <div data-testid="trade-profit-eur" className="numeric" style={{ fontSize: 17, fontWeight: 800, color: '#22c58b', fontFamily: 'var(--font-heading)' }}>+{fmt(animProfit)}</div>
          </div>
        </div>

        {/* Tabs categoria */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 0' }}>
          {Object.keys(ASSETS).map(key => {
            const Icon = CAT_ICONS[key] || BarChart2;
            const c = CAT_COLORS[key];
            const active = activeCat === key;
            return (
              <button key={key} onClick={() => handleCatChange(key)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, border: `1px solid ${active ? c.border : '#26263a'}`, background: active ? c.bg : 'transparent', color: active ? c.active : '#7a8299', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <Icon size={12} />{key}
              </button>
            );
          })}
        </div>

        {/* Ativo selecionado */}
        <div style={{ background: '#111118', border: `1px solid ${col.border}`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: col.bg, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: col.active, letterSpacing: '-0.02em', flexShrink: 0 }}>
            {ASSETS[activeCat].icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#f3f5ff', fontFamily: 'var(--font-heading)' }}>{selectedAsset.label}</div>
            <div style={{ fontSize: 10, color: '#7a8299' }}>{selectedAsset.name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="numeric" style={{ fontSize: 16, fontWeight: 800, color: '#f3f5ff' }}>{selectedAsset.price}</div>
            <div className="numeric" style={{ fontSize: 11, fontWeight: 700, color: selectedAsset.pos ? '#22c58b' : '#ef4444' }}>{selectedAsset.change}</div>
          </div>
        </div>

        {/* Gráfico */}
        <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, overflow: 'hidden', height: 260 }}>
          <iframe key={selectedAsset.symbol} ref={iframeRef} src={chartSrc}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            title={`Gráfico ${selectedAsset.label}`}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms" />
        </div>

        {/* COMPRAR / VENDER */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={handleBuy}
            style={{ padding: '15px 0', background: 'linear-gradient(135deg,#16a34a,#22c58b)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 20px rgba(34,197,139,0.35)', fontFamily: 'var(--font-heading)', letterSpacing: '0.03em' }}>
            <ChevronUp size={18} />{t('trade_buy')}
          </button>
          <button onClick={handleSell}
            style={{ padding: '15px 0', background: 'linear-gradient(135deg,#b91c1c,#ef4444)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 20px rgba(239,68,68,0.35)', fontFamily: 'var(--font-heading)', letterSpacing: '0.03em' }}>
            <ChevronDown size={18} />{t('trade_sell')}
          </button>
        </div>

        {/* Lista de ativos */}
        <TradeAssets activeCat={activeCat} selectedAsset={selectedAsset}
          onCatChange={handleCatChange}
          onAssetSelect={(a) => { setSelectedAsset(a); setShowOrder(false); }} />
      </div>
    );
  }

  /* ────────────────────────────── DESKTOP ────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Header com saldo animado ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(58,134,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={18} color="#3A86FF" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, color: '#f3f5ff', margin: 0, letterSpacing: '-0.02em' }}>{t('trade_title')}</h1>
            <p style={{ fontSize: 11, color: '#7a8299', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 5, height: 5, background: '#22c58b', borderRadius: '50%', display: 'inline-block', animation: 'shimmer 2s ease infinite' }} />
              {t('trade_subtitle')}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(58,134,255,0.15),rgba(58,134,255,0.05))', border: '1px solid rgba(58,134,255,0.25)', borderRadius: 12, padding: '8px 16px', textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: 'rgba(58,134,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{t('nav_balance')}</div>
            <div data-testid="trade-balance-eur" className="numeric" style={{ fontSize: 15, fontWeight: 800, color: '#f3f5ff', fontFamily: 'var(--font-heading)' }}>{fmt(animBalance)}</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg,rgba(34,197,139,0.15),rgba(34,197,139,0.05))', border: '1px solid rgba(34,197,139,0.25)', borderRadius: 12, padding: '8px 16px', textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: 'rgba(34,197,139,0.8)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{t('nav_profit')}</div>
            <div data-testid="trade-profit-eur" className="numeric" style={{ fontSize: 15, fontWeight: 800, color: '#22c58b', fontFamily: 'var(--font-heading)' }}>+{fmt(animProfit)}</div>
          </div>
        </div>
      </div>

      {/* ── Grid 3 colunas ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '248px 1fr 276px', gap: 12, alignItems: 'start' }}>

        {/* Col 1 — Activos */}
        <TradeAssets activeCat={activeCat} selectedAsset={selectedAsset}
          onCatChange={handleCatChange} onAssetSelect={handleAssetSelect} />

        {/* Col 2 — Gráfico + info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Barra de informações do ativo — design premium */}
          <div style={{
            background: 'linear-gradient(135deg, hsl(240,26%,9%) 0%, hsl(220,30%,11%) 100%)',
            border: `1px solid ${col.border}`,
            borderRadius: 14, padding: '14px 18px',
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Brilho lateral */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: col.active, borderRadius: '14px 0 0 14px' }} />

            {/* Ícone + nome */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 42, height: 42, background: col.bg, border: `1px solid ${col.border}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: col.active }}>
                {ASSETS[activeCat].icon}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>{selectedAsset.label}</div>
                <div style={{ fontSize: 11, color: '#7a8299' }}>{selectedAsset.name}</div>
              </div>
            </div>

            {/* Preço + variação */}
            <div>
              <div className="numeric" style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {selectedAsset.price}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                <span className="numeric" style={{ fontSize: 12, fontWeight: 700, color: selectedAsset.pos ? '#22c58b' : '#ef4444', display: 'flex', alignItems: 'center', gap: 2 }}>
                  {selectedAsset.pos ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {selectedAsset.change}
                </span>
                <span style={{ fontSize: 10, color: '#4a5068' }}>24h</span>
              </div>
            </div>

            {/* Separador */}
            <div style={{ height: 36, width: 1, background: 'rgba(255,255,255,0.08)' }} />

            {/* Métricas extra */}
            {[
              { label: 'Tipo', value: ASSETS[activeCat].operationType || activeCat },
              { label: 'Tendência', value: selectedAsset.pos ? '↑ Alta' : '↓ Baixa', color: selectedAsset.pos ? '#22c58b' : '#ef4444' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontSize: 9, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{label}</div>
                <div className="numeric" style={{ fontSize: 12, fontWeight: 700, color: color || '#e8eaf6' }}>{value}</div>
              </div>
            ))}

            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 7, background: col.bg, color: col.active, border: `1px solid ${col.border}`, fontWeight: 800, letterSpacing: '0.06em' }}>
              {activeCat.toUpperCase()}
            </span>
          </div>

          {/* TradingView */}
          <div data-testid="trade-tradingview-container"
            style={{ background: '#0a0a18', border: '1px solid #1e1e30', borderRadius: 16, overflow: 'hidden', height: 460, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <iframe key={selectedAsset.symbol} ref={iframeRef} src={chartSrc}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              title={`Gráfico ${selectedAsset.label}`}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms" />
          </div>

          {/* Aviso regulatório */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: 'rgba(58,134,255,0.05)', border: '1px solid rgba(58,134,255,0.12)', borderRadius: 10 }}>
            <span style={{ fontSize: 14 }}>🛡️</span>
            <p style={{ fontSize: 11, color: '#4a5068', margin: 0 }}>
              Plataforma registada na <strong style={{ color: '#7a8299' }}>IFSB Reg. No. JP-999888777</strong> · <strong style={{ color: '#7a8299' }}>MiFID II</strong> · Empresa de Investimento <strong style={{ color: '#7a8299' }}>Classe 3</strong>
            </p>
          </div>
        </div>

        {/* Col 3 — Painel de ordem + cotasções */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <TradeOrder asset={selectedAsset} activeCat={activeCat} />

          {/* Cotações Forex */}
          <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              {t('trade_forex_quotes')}
            </div>
            {ASSETS.Forex.items.slice(0, 5).map(a => (
              <div key={a.symbol}
                onClick={() => { handleCatChange('Forex'); setSelectedAsset(a); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'opacity 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.65'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#e8eaf6' }}>{a.label}</span>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span className="numeric" style={{ fontSize: 11, color: '#e8eaf6' }}>{a.price}</span>
                  <span className="numeric" style={{ fontSize: 10, fontWeight: 700, minWidth: 48, textAlign: 'right', color: a.pos ? '#22c58b' : '#ef4444', padding: '1px 5px', background: a.pos ? 'rgba(34,197,139,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: 4 }}>
                    {a.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <button data-testid="trade-deposit-cta" onClick={() => navigate('/app/deposit')}
            style={{ width: '100%', padding: '11px', background: 'linear-gradient(135deg,#2563eb,#3A86FF)', border: 'none', borderRadius: 11, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 3px 12px rgba(58,134,255,0.35)', transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <CreditCard size={13} />{t('trade_deposit_btn')}
          </button>
          <button data-testid="trade-withdrawal-cta" onClick={() => navigate('/app/withdrawal')}
            style={{ width: '100%', padding: '11px', background: 'transparent', border: '1px solid hsl(240,16%,22%)', borderRadius: 11, color: 'hsl(215,16%,65%)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#7a8299'; e.currentTarget.style.color = '#f3f5ff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(240,16%,22%)'; e.currentTarget.style.color = 'hsl(215,16%,65%)'; }}>
            <ArrowDownToLine size={13} />{t('trade_withdrawal_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}
