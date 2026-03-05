import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, CreditCard, ArrowDownToLine,
  ChevronUp, ChevronDown, Search, Activity, Info
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { toast } from 'sonner';

/* ─── Dados de activos ─── */
const ASSETS = {
  Forex: {
    label: 'Forex',
    icon: 'FX',
    operationType: 'par cambial',
    items: [
      { symbol: 'FX:EURUSD',  label: 'EUR/USD', name: 'Euro / Dólar',         price: '1,0847', change: '+0,12%', pos: true  },
      { symbol: 'FX:GBPUSD',  label: 'GBP/USD', name: 'Libra / Dólar',        price: '1,2634', change: '+0,08%', pos: true  },
      { symbol: 'FX:USDJPY',  label: 'USD/JPY', name: 'Dólar / Iene',         price: '149,82', change: '-0,21%', pos: false },
      { symbol: 'FX:AUDUSD',  label: 'AUD/USD', name: 'Dólar Aus. / USD',     price: '0,6512', change: '+0,05%', pos: true  },
      { symbol: 'FX:USDCHF',  label: 'USD/CHF', name: 'Dólar / Franco Suíço', price: '0,8974', change: '-0,09%', pos: false },
      { symbol: 'FX:EURGBP',  label: 'EUR/GBP', name: 'Euro / Libra',         price: '0,8585', change: '+0,03%', pos: true  },
      { symbol: 'FX:USDCAD',  label: 'USD/CAD', name: 'Dólar / Dólar Can.',   price: '1,3621', change: '-0,14%', pos: false },
      { symbol: 'FX:NZDUSD',  label: 'NZD/USD', name: 'Dólar NZ / USD',       price: '0,5987', change: '+0,07%', pos: true  },
    ],
  },
  Cripto: {
    label: 'Cripto',
    icon: 'BTC',
    operationType: 'criptomoeda',
    items: [
      { symbol: 'BINANCE:BTCUSDT',  label: 'BTC/USDT',  name: 'Bitcoin',       price: '95.420',  change: '+2,34%', pos: true  },
      { symbol: 'BINANCE:ETHUSDT',  label: 'ETH/USDT',  name: 'Ethereum',      price: '3.285',   change: '+1,82%', pos: true  },
      { symbol: 'BINANCE:SOLUSDT',  label: 'SOL/USDT',  name: 'Solana',        price: '187,40',  change: '+3,12%', pos: true  },
      { symbol: 'BINANCE:BNBUSDT',  label: 'BNB/USDT',  name: 'Binance Coin',  price: '412,50',  change: '-0,45%', pos: false },
      { symbol: 'BINANCE:XRPUSDT',  label: 'XRP/USDT',  name: 'Ripple',        price: '0,5821',  change: '+1,23%', pos: true  },
      { symbol: 'BINANCE:ADAUSDT',  label: 'ADA/USDT',  name: 'Cardano',       price: '0,4512',  change: '-1,02%', pos: false },
      { symbol: 'BINANCE:DOGEUSDT', label: 'DOGE/USDT', name: 'Dogecoin',      price: '0,1234',  change: '+4,56%', pos: true  },
      { symbol: 'BINANCE:AVAXUSDT', label: 'AVAX/USDT', name: 'Avalanche',     price: '38,72',   change: '+2,11%', pos: true  },
    ],
  },
  Acções: {
    label: 'Acções',
    icon: 'ACT',
    operationType: 'acção',
    items: [
      { symbol: 'NASDAQ:AAPL',  label: 'AAPL',  name: 'Apple Inc.',      price: '189,30', change: '+0,54%', pos: true  },
      { symbol: 'NASDAQ:TSLA',  label: 'TSLA',  name: 'Tesla Inc.',      price: '245,80', change: '-1,23%', pos: false },
      { symbol: 'NASDAQ:GOOGL', label: 'GOOGL', name: 'Alphabet Inc.',   price: '175,40', change: '+0,87%', pos: true  },
      { symbol: 'NASDAQ:AMZN',  label: 'AMZN',  name: 'Amazon.com',      price: '198,60', change: '+1,12%', pos: true  },
      { symbol: 'NASDAQ:MSFT',  label: 'MSFT',  name: 'Microsoft Corp.', price: '415,20', change: '+0,33%', pos: true  },
      { symbol: 'NASDAQ:META',  label: 'META',  name: 'Meta Platforms',  price: '512,40', change: '+1,67%', pos: true  },
      { symbol: 'NASDAQ:NVDA',  label: 'NVDA',  name: 'NVIDIA Corp.',    price: '875,30', change: '+3,21%', pos: true  },
      { symbol: 'NYSE:JPM',     label: 'JPM',   name: 'JPMorgan Chase',  price: '198,70', change: '-0,42%', pos: false },
    ],
  },
  Metais: {
    label: 'Metais',
    icon: 'XAU',
    operationType: 'metal precioso',
    items: [
      { symbol: 'OANDA:XAUUSD',  label: 'Ouro (XAU)',  name: 'Ouro',    price: '2.032,40', change: '+0,38%', pos: true  },
      { symbol: 'OANDA:XAGUSD',  label: 'Prata (XAG)', name: 'Prata',   price: '22,85',    change: '-0,21%', pos: false },
      { symbol: 'TVC:PLATINUM',  label: 'Platina',     name: 'Platina', price: '891,40',   change: '+0,62%', pos: true  },
      { symbol: 'TVC:PALLADIUM', label: 'Paládio',     name: 'Paládio', price: '952,30',   change: '-1,14%', pos: false },
      { symbol: 'COMEX:HG1!',    label: 'Cobre',       name: 'Cobre',   price: '3,842',    change: '+0,29%', pos: true  },
    ],
  },
  Commodities: {
    label: 'Commodities',
    icon: 'OIL',
    operationType: 'matéria-prima',
    items: [
      { symbol: 'NYMEX:CL1!', label: 'Petróleo WTI', name: 'Petróleo WTI',   price: '78,42',    change: '-0,85%', pos: false },
      { symbol: 'ICE:BRN1!',  label: 'Brent',        name: 'Petróleo Brent', price: '82,64',    change: '-0,67%', pos: false },
      { symbol: 'NYMEX:NG1!', label: 'Gás Natural',  name: 'Gás Natural',    price: '2,148',    change: '+1,23%', pos: true  },
      { symbol: 'CBOT:ZW1!',  label: 'Trigo',        name: 'Trigo',          price: '584,25',   change: '+0,72%', pos: true  },
      { symbol: 'CBOT:ZC1!',  label: 'Milho',        name: 'Milho',          price: '452,75',   change: '-0,18%', pos: false },
      { symbol: 'CBOT:ZS1!',  label: 'Soja',         name: 'Soja',           price: '1.248,50', change: '+0,45%', pos: true  },
      { symbol: 'NYMEX:RB1!', label: 'Gasolina',     name: 'Gasolina',       price: '2,312',    change: '-0,34%', pos: false },
    ],
  },
};

const CAT_COLORS = {
  'Forex':       { active: '#3A86FF', bg: 'rgba(58,134,255,0.12)',  border: 'rgba(58,134,255,0.3)'  },
  'Cripto':      { active: '#FFBE0B', bg: 'rgba(255,190,11,0.12)',  border: 'rgba(255,190,11,0.3)'  },
  'Acções':      { active: '#22c58b', bg: 'rgba(34,197,139,0.12)',  border: 'rgba(34,197,139,0.3)'  },
  'Metais':      { active: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)'  },
  'Commodities': { active: '#F87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
};

export default function TradePage() {
  const { user, fetchUser } = useUser();
  const navigate = useNavigate();
  const iframeRef = useRef(null);

  const [activeCat, setActiveCat] = useState('Forex');
  const [selectedAsset, setSelectedAsset] = useState(ASSETS.Forex.items[0]);
  const [search, setSearch] = useState('');
  const [side, setSide] = useState('comprar');   // 'comprar' | 'vender'
  const [amount, setAmount] = useState('100');
  const [leverage, setLeverage] = useState('1:10');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => { fetchUser(); }, []); // eslint-disable-line

  const safeProfit  = Math.max(0, parseFloat(user?.profit)  || 0);
  const safeBalance = Math.max(0, parseFloat(user?.balance) || 0);
  const fmt = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);

  const cat = ASSETS[activeCat];
  const col = CAT_COLORS[activeCat];
  const filtered = cat.items.filter(a =>
    a.label.toLowerCase().includes(search.toLowerCase()) ||
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCatChange = (key) => {
    setActiveCat(key);
    setSelectedAsset(ASSETS[key].items[0]);
    setSearch('');
  };

  const leverageMultiplier = parseInt(leverage.split(':')[1] || 1);
  const totalExposure = (parseFloat(amount || 0) * leverageMultiplier).toLocaleString('pt-PT');

  /* ── Texto dinâmico do botão — "Abrir Operação Bitcoin" ── */
  const assetShortName = selectedAsset.name.split(' / ')[0].split(' ')[0]; // ex: "Bitcoin", "Euro", "Ouro"
  const actionLabelFull = side === 'comprar'
    ? `Abrir Operação ${assetShortName}`
    : `Encerrar Operação ${assetShortName}`;

  const handleOrder = () => {
    if (!amount || parseFloat(amount) < 10) {
      toast.error('Montante inválido', { description: 'O montante mínimo por operação é €10,00.' });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Ambas as ordens usam toast.success — sem confusão com erros do sistema
      if (side === 'comprar') {
        toast.success(`Operação aberta com sucesso`, {
          description: `Abrir Operação ${assetShortName} · €${amount} · Alavancagem ${leverage}`,
          duration: 6000,
        });
      } else {
        toast.success(`Operação encerrada com sucesso`, {
          description: `Encerrar Operação ${assetShortName} · €${amount} · Alavancagem ${leverage}`,
          duration: 6000,
          style: { background: 'hsl(240,26%,10%)', border: '1px solid rgba(248,113,113,0.3)', color: '#f3f5ff' },
        });
      }
    }, 900);
  };

  const chartSrc = `https://s.tradingview.com/widgetembed/?frameElementId=tv_${activeCat}&symbol=${encodeURIComponent(selectedAsset.symbol)}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=0&theme=dark&style=1&timezone=Europe%2FLisbon&withdateranges=1&locale=pt`;

  /* ── Estilos inline reutilizáveis ── */
  const inputStyle = {
    width: '100%', padding: '9px 12px',
    background: '#12121f', border: '1px solid #26263a',
    borderRadius: 9, color: '#f3f5ff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = {
    display: 'block', fontSize: 10, fontWeight: 700,
    color: '#7a8299', marginBottom: 5,
    textTransform: 'uppercase', letterSpacing: '0.07em',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Cabeçalho ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff', margin: 0 }}>Negociar</h1>
          <p style={{ fontSize: 12, color: '#7a8299', margin: '2px 0 0' }}>Mercados globais em tempo real</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 10, padding: '7px 14px' }}>
            <span style={{ fontSize: 11, color: '#7a8299' }}>Saldo </span>
            <span data-testid="trade-balance-eur" className="numeric" style={{ fontSize: 14, fontWeight: 700, color: '#f3f5ff' }}>{fmt(safeBalance)}</span>
          </div>
          <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 10, padding: '7px 14px' }}>
            <span style={{ fontSize: 11, color: '#7a8299' }}>Lucro </span>
            <span data-testid="trade-profit-eur" className="numeric" style={{ fontSize: 14, fontWeight: 700, color: '#22c58b' }}>
              +{fmt(safeProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Layout principal: lista | gráfico | ordem ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr 272px',
        gap: 12, alignItems: 'start',
      }} className="trade-grid">
        <style>{`
          @media(max-width:1280px){ .trade-grid{ grid-template-columns: 200px 1fr 252px !important; } }
          @media(max-width:1024px){ .trade-grid{ grid-template-columns: 1fr !important; } }
        `}</style>

        {/* ══ COLUNA ESQUERDA: Lista de activos ══ */}
        <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 560 }}>

          {/* Categorias — barra horizontal com scroll */}
          <div style={{ borderBottom: '1px solid #26263a', padding: '10px 10px 0' }}>
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 10 }}
              className="cat-scroll">
              <style>{`.cat-scroll::-webkit-scrollbar{height:3px}.cat-scroll::-webkit-scrollbar-thumb{background:#26263a;border-radius:2px}`}</style>
              {Object.keys(ASSETS).map(key => {
                const c = CAT_COLORS[key];
                const active = activeCat === key;
                const iconStyle = {
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 18, height: 16, fontSize: 8, fontWeight: 900,
                  background: active ? c.active : 'rgba(255,255,255,0.08)',
                  color: active ? '#fff' : '#7a8299',
                  borderRadius: 4, marginRight: 5, letterSpacing: '-0.02em',
                  flexShrink: 0,
                };
                return (
                  <button key={key} onClick={() => handleCatChange(key)}
                    style={{
                      flexShrink: 0, padding: '6px 12px', borderRadius: 8,
                      border: `1px solid ${active ? c.border : 'transparent'}`,
                      background: active ? c.bg : 'transparent',
                      color: active ? c.active : '#7a8299',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex', alignItems: 'center',
                      transition: 'background .15s, color .15s',
                    }}>
                    <span style={iconStyle}>{ASSETS[key].icon}</span>
                    {key}
                  </button>
                );
              })}
            </div>

            {/* Pesquisa */}
            <div style={{ position: 'relative', paddingBottom: 10 }}>
              <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-60%)', color: '#7a8299' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={`Pesquisar em ${activeCat}…`}
                style={{ ...inputStyle, padding: '7px 10px 7px 28px', fontSize: 11 }} />
            </div>
          </div>

          {/* Linha de cabeçalho da tabela */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 12px', borderBottom: '1px solid #1a1a2a' }}>
            <span style={{ fontSize: 10, color: '#4a5068', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Instrumento</span>
            <span style={{ fontSize: 10, color: '#4a5068', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Var.</span>
          </div>

          {/* Lista */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#7a8299', fontSize: 12 }}>Sem resultados</div>
            ) : filtered.map(asset => {
              const sel = selectedAsset.symbol === asset.symbol;
              return (
                <div key={asset.symbol} onClick={() => { setSelectedAsset(asset); setSearch(''); }}
                  style={{
                    padding: '9px 12px', cursor: 'pointer',
                    background: sel ? col.bg : 'transparent',
                    borderLeft: `2px solid ${sel ? col.active : 'transparent'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'background .12s',
                  }}
                  onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: sel ? col.active : '#e8eaf6' }}>{asset.label}</div>
                    <div style={{ fontSize: 10, color: '#7a8299', marginTop: 1 }}>{asset.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="numeric" style={{ fontSize: 11, fontWeight: 700, color: '#e8eaf6' }}>{asset.price}</div>
                    <div className="numeric" style={{ fontSize: 10, fontWeight: 600, color: asset.pos ? '#22c58b' : '#ef4444' }}>{asset.change}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══ COLUNA CENTRAL: Gráfico ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Barra do activo seleccionado */}
          <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ width: 38, height: 38, background: col.bg, border: `1px solid ${col.border}`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: col.active, letterSpacing: '-0.02em' }}>
              {cat.icon}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: '#f3f5ff' }}>{selectedAsset.label}</div>
              <div style={{ fontSize: 11, color: '#7a8299' }}>{selectedAsset.name}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginLeft: 4 }}>
              <span className="numeric" style={{ fontSize: 20, fontWeight: 700, color: '#f3f5ff', fontFamily: 'var(--font-heading)' }}>{selectedAsset.price}</span>
              <span className="numeric" style={{ fontSize: 13, fontWeight: 700, color: selectedAsset.pos ? '#22c58b' : '#ef4444', display: 'flex', alignItems: 'center', gap: 2 }}>
                {selectedAsset.pos ? <ChevronUp size={13} /> : <ChevronDown size={13} />}{selectedAsset.change}
              </span>
            </div>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 6, background: col.bg, color: col.active, border: `1px solid ${col.border}`, fontWeight: 700, letterSpacing: '0.05em' }}>
              {activeCat.toUpperCase()}
            </span>
          </div>

          {/* Gráfico TradingView */}
          <div data-testid="trade-tradingview-container"
            style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, overflow: 'hidden', height: 440 }}>
            <iframe key={selectedAsset.symbol} ref={iframeRef} src={chartSrc}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowTransparency="true" title={`Gráfico ${selectedAsset.label}`}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms" />
          </div>

          {/* Aviso legal */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', background: 'rgba(58,134,255,0.06)', border: '1px solid rgba(58,134,255,0.15)', borderRadius: 10 }}>
            <Info size={13} style={{ color: '#3A86FF', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 11, color: '#7a8299', margin: 0, lineHeight: 1.5 }}>
              A negociação de instrumentos financeiros envolve risco de perda. Certifique-se de que compreende os riscos antes de investir. O desempenho passado não garante resultados futuros.
            </p>
          </div>
        </div>

        {/* ══ COLUNA DIREITA: Painel de ordens ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Cartão da ordem */}
          <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, overflow: 'hidden' }}>

            {/* Toggle Comprar / Vender */}
            <div style={{ display: 'flex', borderBottom: '1px solid #26263a' }}>
              {[
                { key: 'comprar', icon: <ChevronUp size={14}/>, label: 'Comprar', color: '#22c58b', hoverBg: 'rgba(34,197,139,0.15)' },
                { key: 'vender',  icon: <ChevronDown size={14}/>, label: 'Vender',  color: '#ef4444', hoverBg: 'rgba(239,68,68,0.15)' },
              ].map(btn => (
                <button key={btn.key} onClick={() => setSide(btn.key)}
                  style={{
                    flex: 1, padding: '13px 0', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 800,
                    letterSpacing: '0.04em',
                    background: side === btn.key
                      ? (btn.key === 'comprar' ? '#22c58b' : '#ef4444')
                      : '#0e0e1a',
                    color: side === btn.key ? '#fff' : '#7a8299',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    transition: 'background .18s, color .18s',
                  }}>
                  {btn.icon}{btn.label.toUpperCase()}
                </button>
              ))}
            </div>

            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 13 }}>

              {/* Instrumento */}
              <div>
                <label style={labelStyle}>Instrumento ({cat.operationType})</label>
                <div style={{ padding: '9px 12px', background: '#0e0e1a', border: `1px solid ${col.border}`, borderRadius: 9, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: col.active }}>{selectedAsset.label}</span>
                  <span style={{ fontSize: 10, color: '#7a8299' }}>{selectedAsset.name}</span>
                </div>
              </div>

              {/* Montante */}
              <div>
                <label style={labelStyle}>Montante (€)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#7a8299', fontWeight: 700 }}>€</span>
                  <input type="number" min="10" value={amount} onChange={e => setAmount(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 26, fontSize: 14, fontWeight: 700 }} />
                </div>
                {/* Atalhos de montante */}
                <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
                  {['50', '100', '250', '500'].map(v => (
                    <button key={v} onClick={() => setAmount(v)} type="button"
                      style={{
                        flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        borderRadius: 7, border: `1px solid ${amount === v ? col.border : '#26263a'}`,
                        background: amount === v ? col.bg : '#0e0e1a',
                        color: amount === v ? col.active : '#7a8299',
                        transition: 'all .12s',
                      }}>€{v}</button>
                  ))}
                </div>
              </div>

              {/* Alavancagem */}
              <div>
                <label style={labelStyle}>Alavancagem</label>
                <select value={leverage} onChange={e => setLeverage(e.target.value)} style={inputStyle}>
                  {['1:1', '1:2', '1:5', '1:10', '1:20', '1:50', '1:100'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Resumo da operação */}
              <div style={{ background: '#0e0e1a', borderRadius: 9, padding: '10px 12px', border: '1px solid #1e1e30' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#7a8299', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Resumo da Operação</div>
                {[
                  { label: 'Direcção',       value: side === 'comprar' ? '↑ Longa'  : '↓ Curta',    color: side === 'comprar' ? '#22c58b' : '#ef4444' },
                  { label: 'Preço actual',   value: selectedAsset.price,                               color: '#f3f5ff' },
                  { label: 'Montante',       value: `€ ${parseFloat(amount||0).toLocaleString('pt-PT', {minimumFractionDigits:2})}`, color: '#f3f5ff' },
                  { label: 'Alavancagem',    value: leverage,                                           color: '#f3f5ff' },
                  { label: 'Exposição total',value: `€ ${totalExposure}`,                              color: col.active },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11 }}>
                    <span style={{ color: '#7a8299' }}>{label}</span>
                    <span className="numeric" style={{ fontWeight: 700, color }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Botão de acção principal — texto dinâmico */}
              <button onClick={handleOrder} disabled={loading}
                style={{
                  width: '100%', padding: '14px 10px',
                  border: 'none', borderRadius: 11, cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? '#1e1e30' : (side === 'comprar' ? '#22c58b' : '#ef4444'),
                  color: '#fff',
                  fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  letterSpacing: '0.03em',
                  transition: 'background .18s, opacity .18s',
                  opacity: loading ? 0.6 : 1,
                }}>
                {loading ? (
                  <><Activity size={15} style={{ animation: 'spin 1s linear infinite' }} /> A processar…</>
                ) : side === 'comprar' ? (
                  <><ChevronUp size={16} />{actionLabelFull}</>
                ) : (
                  <><ChevronDown size={16} />{actionLabelFull}</>
                )}
              </button>
              <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

              {/* Aviso risco */}
              <p style={{ fontSize: 10, color: '#4a5068', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                As CFD são instrumentos complexos. Existe risco de perda rápida.
              </p>
            </div>
          </div>

          {/* Cotações rápidas — apenas Forex */}
          <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#7a8299', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Cotações Forex</div>
            {ASSETS.Forex.items.slice(0, 5).map(a => (
              <div key={a.symbol} onClick={() => { handleCatChange('Forex'); setSelectedAsset(a); }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7, cursor: 'pointer', padding: '3px 0' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#e8eaf6' }}>{a.label}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="numeric" style={{ fontSize: 11, color: '#e8eaf6' }}>{a.price}</span>
                  <span className="numeric" style={{ fontSize: 10, fontWeight: 700, color: a.pos ? '#22c58b' : '#ef4444', minWidth: 52, textAlign: 'right' }}>{a.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* CTAs secundários */}
          <button data-testid="trade-deposit-cta" onClick={() => navigate('/app/deposit')}
            style={{ width: '100%', padding: '10px', background: '#3A86FF', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <CreditCard size={13} />Depositar Fundos
          </button>
          <button data-testid="trade-withdrawal-cta" onClick={() => navigate('/app/withdrawal')}
            style={{ width: '100%', padding: '10px', background: '#151522', border: '1px solid #26263a', borderRadius: 10, color: '#e8eaf6', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <ArrowDownToLine size={13} />Levantar Fundos
          </button>
        </div>
      </div>
    </div>
  );
}
