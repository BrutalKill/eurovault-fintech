import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, CreditCard, ArrowDownToLine, ChevronUp, ChevronDown, Search, Star, Activity } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { toast } from 'sonner';

const ASSETS = {
  Forex: [
    { symbol: 'FX:EURUSD', label: 'EUR/USD', name: 'Euro / Dólar', price: '1.0847', change: '+0.12%', pos: true },
    { symbol: 'FX:GBPUSD', label: 'GBP/USD', name: 'Libra / Dólar', price: '1.2634', change: '+0.08%', pos: true },
    { symbol: 'FX:USDJPY', label: 'USD/JPY', name: 'Dólar / Iene', price: '149.82', change: '-0.21%', pos: false },
    { symbol: 'FX:AUDUSD', label: 'AUD/USD', name: 'Dólar Aus. / USD', price: '0.6512', change: '+0.05%', pos: true },
    { symbol: 'FX:USDCHF', label: 'USD/CHF', name: 'Dólar / Franco', price: '0.8974', change: '-0.09%', pos: false },
    { symbol: 'FX:EURGBP', label: 'EUR/GBP', name: 'Euro / Libra', price: '0.8585', change: '+0.03%', pos: true },
    { symbol: 'FX:USDCAD', label: 'USD/CAD', name: 'Dólar / CAD', price: '1.3621', change: '-0.14%', pos: false },
    { symbol: 'FX:NZDUSD', label: 'NZD/USD', name: 'Dólar NZ / USD', price: '0.5987', change: '+0.07%', pos: true },
  ],
  Crypto: [
    { symbol: 'BINANCE:BTCUSDT', label: 'BTC/USDT', name: 'Bitcoin', price: '95.420', change: '+2.34%', pos: true },
    { symbol: 'BINANCE:ETHUSDT', label: 'ETH/USDT', name: 'Ethereum', price: '3.285', change: '+1.82%', pos: true },
    { symbol: 'BINANCE:SOLUSDT', label: 'SOL/USDT', name: 'Solana', price: '187.40', change: '+3.12%', pos: true },
    { symbol: 'BINANCE:BNBUSDT', label: 'BNB/USDT', name: 'Binance Coin', price: '412.50', change: '-0.45%', pos: false },
    { symbol: 'BINANCE:XRPUSDT', label: 'XRP/USDT', name: 'Ripple', price: '0.5821', change: '+1.23%', pos: true },
    { symbol: 'BINANCE:ADAUSDT', label: 'ADA/USDT', name: 'Cardano', price: '0.4512', change: '-1.02%', pos: false },
    { symbol: 'BINANCE:DOGEUSDT', label: 'DOGE/USDT', name: 'Dogecoin', price: '0.1234', change: '+4.56%', pos: true },
    { symbol: 'BINANCE:AVAXUSDT', label: 'AVAX/USDT', name: 'Avalanche', price: '38.72', change: '+2.11%', pos: true },
  ],
  Ações: [
    { symbol: 'NASDAQ:AAPL', label: 'AAPL', name: 'Apple Inc.', price: '189.30', change: '+0.54%', pos: true },
    { symbol: 'NASDAQ:TSLA', label: 'TSLA', name: 'Tesla Inc.', price: '245.80', change: '-1.23%', pos: false },
    { symbol: 'NASDAQ:GOOGL', label: 'GOOGL', name: 'Alphabet Inc.', price: '175.40', change: '+0.87%', pos: true },
    { symbol: 'NASDAQ:AMZN', label: 'AMZN', name: 'Amazon.com', price: '198.60', change: '+1.12%', pos: true },
    { symbol: 'NASDAQ:MSFT', label: 'MSFT', name: 'Microsoft Corp.', price: '415.20', change: '+0.33%', pos: true },
    { symbol: 'NASDAQ:META', label: 'META', name: 'Meta Platforms', price: '512.40', change: '+1.67%', pos: true },
    { symbol: 'NASDAQ:NVDA', label: 'NVDA', name: 'NVIDIA Corp.', price: '875.30', change: '+3.21%', pos: true },
    { symbol: 'NYSE:JPM',   label: 'JPM',  name: 'JPMorgan Chase', price: '198.70', change: '-0.42%', pos: false },
  ],
  Metais: [
    { symbol: 'OANDA:XAUUSD', label: 'XAU/USD', name: 'Ouro', price: '2.032', change: '+0.38%', pos: true },
    { symbol: 'OANDA:XAGUSD', label: 'XAG/USD', name: 'Prata', price: '22.85', change: '-0.21%', pos: false },
    { symbol: 'TVC:PLATINUM', label: 'PLAT', name: 'Platina', price: '891.40', change: '+0.62%', pos: true },
    { symbol: 'TVC:PALLADIUM', label: 'PALL', name: 'Paládio', price: '952.30', change: '-1.14%', pos: false },
    { symbol: 'OANDA:XPDUSD', label: 'XPD/USD', name: 'Paládio USD', price: '948.50', change: '+0.15%', pos: true },
    { symbol: 'COMEX:HG1!', label: 'COBRE', name: 'Cobre', price: '3.842', change: '+0.29%', pos: true },
  ],
  Commodities: [
    { symbol: 'NYMEX:CL1!', label: 'WTI', name: 'Petróleo WTI', price: '78.42', change: '-0.85%', pos: false },
    { symbol: 'NYMEX:NG1!', label: 'GÁS NAT.', name: 'Gás Natural', price: '2.148', change: '+1.23%', pos: true },
    { symbol: 'NYMEX:RB1!', label: 'GASOLINA', name: 'Gasolina', price: '2.312', change: '-0.34%', pos: false },
    { symbol: 'CBOT:ZW1!', label: 'TRIGO', name: 'Trigo', price: '584.25', change: '+0.72%', pos: true },
    { symbol: 'CBOT:ZC1!', label: 'MILHO', name: 'Milho', price: '452.75', change: '-0.18%', pos: false },
    { symbol: 'CBOT:ZS1!', label: 'SOJA', name: 'Soja', price: '1248.50', change: '+0.45%', pos: true },
    { symbol: 'ICE:BRN1!', label: 'BRENT', name: 'Petróleo Brent', price: '82.64', change: '-0.67%', pos: false },
    { symbol: 'NYMEX:HO1!', label: 'FUEL', name: 'Heating Oil', price: '2.641', change: '+0.92%', pos: true },
  ],
};

const CATEGORY_ICONS = {
  Forex: '💱',
  Crypto: '₿',
  Ações: '📈',
  Metais: '🥇',
  Commodities: '🛢️',
};

const CATEGORY_COLORS = {
  Forex:      { active: 'hsl(214,100%,60%)', bg: 'hsl(214,100%,60%,0.12)', border: 'hsl(214,100%,60%,0.3)' },
  Crypto:     { active: 'hsl(36,95%,55%)',   bg: 'hsl(36,95%,55%,0.12)',   border: 'hsl(36,95%,55%,0.3)' },
  Ações:      { active: 'hsl(155,72%,45%)',  bg: 'hsl(155,72%,45%,0.12)',  border: 'hsl(155,72%,45%,0.3)' },
  Metais:     { active: 'hsl(46,100%,52%)',  bg: 'hsl(46,100%,52%,0.12)',  border: 'hsl(46,100%,52%,0.3)' },
  Commodities:{ active: 'hsl(0,78%,60%)',    bg: 'hsl(0,78%,60%,0.12)',    border: 'hsl(0,78%,60%,0.3)' },
};

export default function TradePage() {
  const { user, fetchUser } = useUser();
  const navigate = useNavigate();
  const iframeRef = useRef(null);

  const [activeCategory, setActiveCategory] = useState('Forex');
  const [selectedAsset, setSelectedAsset] = useState(ASSETS.Forex[0]);
  const [search, setSearch] = useState('');
  const [orderType, setOrderType] = useState('comprar'); // 'comprar' | 'vender'
  const [amount, setAmount] = useState('100');
  const [leverage, setLeverage] = useState('1:10');
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => { fetchUser(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formatEur = (val) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val || 0);
  const profitPositive = (user?.profit || 0) >= 0;

  const filteredAssets = ASSETS[activeCategory].filter(a =>
    a.label.toLowerCase().includes(search.toLowerCase()) ||
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const catColor = CATEGORY_COLORS[activeCategory];

  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset);
    setSearch('');
  };

  const handleOrder = (type) => {
    setOrderLoading(true);
    setTimeout(() => {
      setOrderLoading(false);
      if (type === 'comprar') {
        toast.success(`Ordem de Compra enviada!`, {
          description: `${selectedAsset.label} • €${amount} • Alavancagem ${leverage}`,
        });
      } else {
        toast.error(`Ordem de Venda enviada!`, {
          description: `${selectedAsset.label} • €${amount} • Alavancagem ${leverage}`,
          style: { background: 'hsl(0,78%,20%)', border: '1px solid hsl(0,78%,40%)' },
        });
      }
    }, 800);
  };

  const chartSrc = `https://s.tradingview.com/widgetembed/?frameElementId=tv_chart&symbol=${encodeURIComponent(selectedAsset.symbol)}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=0&theme=dark&style=1&timezone=Europe%2FLisbon&withdateranges=1&locale=pt`;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#f3f5ff', marginBottom: 2 }}>Negociar</h1>
          <p style={{ fontSize: 12, color: 'hsl(215,16%,70%)' }}>Mercados globais em tempo real</p>
        </div>
        {/* Balance chip */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 10, padding: '8px 16px' }}>
            <span style={{ fontSize: 11, color: 'hsl(215,16%,70%)' }}>Saldo: </span>
            <span data-testid="trade-balance-eur" className="numeric" style={{ fontSize: 14, fontWeight: 700, color: '#f3f5ff' }}>{formatEur(user?.balance)}</span>
          </div>
          <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 10, padding: '8px 16px' }}>
            <span style={{ fontSize: 11, color: 'hsl(215,16%,70%)' }}>P/L: </span>
            <span data-testid="trade-profit-eur" className="numeric" style={{ fontSize: 14, fontWeight: 700, color: profitPositive ? 'hsl(155,72%,45%)' : 'hsl(0,78%,54%)' }}>
              {profitPositive ? '+' : ''}{formatEur(user?.profit)}
            </span>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0,1fr) 280px', gap: 14 }} className="trade-main-grid">
        <style>{`
          @media (max-width: 1300px) { .trade-main-grid { grid-template-columns: 220px minmax(0,1fr) 260px !important; } }
          @media (max-width: 1024px) { .trade-main-grid { grid-template-columns: 1fr !important; } }
        `}</style>

        {/* ─── LEFT: Asset list ─── */}
        <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Category tabs */}
          <div style={{ padding: '10px 10px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {Object.keys(ASSETS).map(cat => {
                const c = CATEGORY_COLORS[cat];
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => { setActiveCategory(cat); setSelectedAsset(ASSETS[cat][0]); setSearch(''); }}
                    style={{
                      padding: '5px 10px', borderRadius: 7, border: `1px solid ${isActive ? c.border : 'transparent'}`,
                      background: isActive ? c.bg : 'transparent',
                      color: isActive ? c.active : 'hsl(215,16%,65%)',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
            {/* Search */}
            <div style={{ position: 'relative', marginTop: 6 }}>
              <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'hsl(215,16%,55%)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Pesquisar ${activeCategory}...`}
                style={{ width: '100%', padding: '7px 10px 7px 28px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,20%)', borderRadius: 8, color: '#f3f5ff', fontSize: 11, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Asset rows */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
            {filteredAssets.map(asset => {
              const isSelected = selectedAsset.symbol === asset.symbol;
              return (
                <div
                  key={asset.symbol}
                  onClick={() => handleSelectAsset(asset)}
                  style={{
                    padding: '9px 12px', cursor: 'pointer',
                    background: isSelected ? catColor.bg : 'transparent',
                    borderLeft: isSelected ? `2px solid ${catColor.active}` : '2px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'hsl(240,18%,12%)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? catColor.active : '#f3f5ff' }}>{asset.label}</div>
                    <div style={{ fontSize: 10, color: 'hsl(215,16%,60%)', marginTop: 1 }}>{asset.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="numeric" style={{ fontSize: 11, fontWeight: 700, color: '#f3f5ff' }}>{asset.price}</div>
                    <div className="numeric" style={{ fontSize: 10, fontWeight: 600, color: asset.pos ? 'hsl(155,72%,45%)' : 'hsl(0,78%,54%)' }}>
                      {asset.change}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── CENTER: Chart ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Asset header */}
          <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, background: catColor.bg, border: `1px solid ${catColor.border}`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                {CATEGORY_ICONS[activeCategory]}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#f3f5ff' }}>{selectedAsset.label}</div>
                <div style={{ fontSize: 11, color: 'hsl(215,16%,65%)' }}>{selectedAsset.name}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="numeric" style={{ fontSize: 22, fontWeight: 700, color: '#f3f5ff', fontFamily: 'var(--font-heading)' }}>{selectedAsset.price}</span>
              <span className="numeric" style={{ fontSize: 13, fontWeight: 700, color: selectedAsset.pos ? 'hsl(155,72%,45%)' : 'hsl(0,78%,54%)' }}>
                {selectedAsset.pos ? <ChevronUp size={14} style={{ display: 'inline', marginBottom: -2 }} /> : <ChevronDown size={14} style={{ display: 'inline', marginBottom: -2 }} />}
                {selectedAsset.change}
              </span>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: catColor.bg, color: catColor.active, border: `1px solid ${catColor.border}`, fontWeight: 700 }}>{activeCategory}</span>
            </div>
          </div>

          {/* TradingView iframe */}
          <div
            data-testid="trade-tradingview-container"
            style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 14, overflow: 'hidden', height: 440 }}
          >
            <iframe
              key={selectedAsset.symbol}
              ref={iframeRef}
              src={chartSrc}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowTransparency="true"
              title={`Chart ${selectedAsset.label}`}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </div>
        </div>

        {/* ─── RIGHT: Order panel ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Buy/Sell toggle */}
          <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'flex' }}>
              <button
                onClick={() => setOrderType('comprar')}
                style={{
                  flex: 1, padding: '14px 0', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800,
                  background: orderType === 'comprar' ? 'hsl(155,72%,45%)' : 'hsl(240,18%,12%)',
                  color: orderType === 'comprar' ? '#fff' : 'hsl(215,16%,60%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                <ChevronUp size={16} />
                COMPRAR
              </button>
              <button
                onClick={() => setOrderType('vender')}
                style={{
                  flex: 1, padding: '14px 0', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800,
                  background: orderType === 'vender' ? 'hsl(0,78%,54%)' : 'hsl(240,18%,12%)',
                  color: orderType === 'vender' ? '#fff' : 'hsl(215,16%,60%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                <ChevronDown size={16} />
                VENDER
              </button>
            </div>

            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Instrument */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(215,16%,65%)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Instrumento</label>
                <div style={{ padding: '9px 12px', background: 'hsl(240,18%,12%)', border: `1px solid ${catColor.border}`, borderRadius: 9, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: catColor.active }}>{selectedAsset.label}</span>
                  <span style={{ fontSize: 11, color: 'hsl(215,16%,65%)' }}>{selectedAsset.name}</span>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(215,16%,65%)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Montante (€)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'hsl(215,16%,55%)', fontWeight: 700 }}>€</span>
                  <input
                    type="number" min="10"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px 10px 26px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 9, color: '#f3f5ff', fontSize: 14, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
                  {['50', '100', '250', '500'].map(v => (
                    <button key={v} type="button" onClick={() => setAmount(v)}
                      style={{ flex: 1, padding: '5px', fontSize: 11, fontWeight: 600, cursor: 'pointer', borderRadius: 6, border: `1px solid ${amount === v ? catColor.border : 'hsl(240,16%,22%)'}`, background: amount === v ? catColor.bg : 'hsl(240,18%,12%)', color: amount === v ? catColor.active : 'hsl(215,16%,65%)' }}
                    >€{v}</button>
                  ))}
                </div>
              </div>

              {/* Leverage */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(215,16%,65%)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Alavancagem</label>
                <select
                  value={leverage}
                  onChange={e => setLeverage(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 9, color: '#f3f5ff', fontSize: 13, outline: 'none' }}
                >
                  {['1:1', '1:5', '1:10', '1:20', '1:50', '1:100'].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Order summary */}
              <div style={{ background: 'hsl(240,18%,11%)', borderRadius: 9, padding: '10px 12px', border: '1px solid hsl(240,16%,20%)' }}>
                {[
                  { label: 'Preço atual', value: selectedAsset.price },
                  { label: 'Montante', value: `€ ${amount || '0'}` },
                  { label: 'Alavancagem', value: leverage },
                  { label: 'Posição total', value: `€ ${(parseFloat(amount || 0) * parseInt((leverage.split(':')[1]) || 1)).toLocaleString('pt-PT')}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                    <span style={{ color: 'hsl(215,16%,60%)' }}>{label}</span>
                    <span className="numeric" style={{ fontWeight: 700, color: '#f3f5ff' }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Action button */}
              <button
                onClick={() => handleOrder(orderType)}
                disabled={orderLoading}
                style={{
                  width: '100%', padding: '15px', border: 'none', borderRadius: 11,
                  background: orderLoading ? 'hsl(240,18%,18%)' : orderType === 'comprar' ? 'hsl(155,72%,45%)' : 'hsl(0,78%,54%)',
                  color: '#fff', fontSize: 15, fontWeight: 800, cursor: orderLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 0.2s',
                  letterSpacing: '0.04em',
                }}
              >
                {orderLoading ? (
                  <><Activity size={16} style={{ animation: 'spin 1s linear infinite' }} /> A processar...</>
                ) : orderType === 'comprar' ? (
                  <><ChevronUp size={18} /> COMPRAR {selectedAsset.label}</>
                ) : (
                  <><ChevronDown size={18} /> VENDER {selectedAsset.label}</>
                )}
              </button>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(215,16%,60%)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Cotações Rápidas</div>
            {ASSETS.Forex.slice(0, 4).map(a => (
              <div key={a.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#f3f5ff' }}>{a.label}</span>
                <div style={{ textAlign: 'right' }}>
                  <span className="numeric" style={{ fontSize: 11, color: '#f3f5ff', marginRight: 6 }}>{a.price}</span>
                  <span className="numeric" style={{ fontSize: 11, fontWeight: 700, color: a.pos ? 'hsl(155,72%,45%)' : 'hsl(0,78%,54%)' }}>{a.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Deposit CTA */}
          <button
            data-testid="trade-deposit-cta"
            onClick={() => navigate('/app/deposit')}
            style={{ width: '100%', padding: '11px', background: 'hsl(214,100%,60%)', border: 'none', borderRadius: 11, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          >
            <CreditCard size={14} />
            Depositar Fundos
          </button>
          <button
            data-testid="trade-withdrawal-cta"
            onClick={() => navigate('/app/withdrawal')}
            style={{ width: '100%', padding: '11px', background: 'hsl(240,18%,14%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 11, color: '#f3f5ff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          >
            <ArrowDownToLine size={14} />
            Levantar Fundos
          </button>
        </div>
      </div>
    </div>
  );
}
