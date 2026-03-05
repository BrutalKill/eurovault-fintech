import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { CAT_COLORS } from './tradeData';

const fmt = (v) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);

export default function TradeOrder({ asset, activeCat, initialSide = 'comprar' }) {
  const [side, setSide]           = useState(initialSide);
  const [amount, setAmount]       = useState('100');
  const [leverage, setLeverage]   = useState('1:10');
  const [loading, setLoading]     = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  // Sempre que o modal abre com um lado diferente, actualizar o estado
  useEffect(() => {
    setSide(initialSide);
    setLastOrder(null);
  }, [initialSide]);

  const col        = CAT_COLORS[activeCat] || CAT_COLORS['Forex'];
  const assetName  = (asset.name || '').split(' / ')[0];
  const levMult    = parseInt((leverage.split(':')[1]) || 1);
  const exposure   = (parseFloat(amount || 0) * levMult)
    .toLocaleString('pt-PT', { minimumFractionDigits: 2 });
  const btnLabel   = side === 'comprar'
    ? `Abrir Operação ${assetName}`
    : `Encerrar Operação ${assetName}`;

  const handleOrder = () => {
    const amt = parseFloat(amount);
    if (!amt || isNaN(amt) || amt < 10) {
      toast.error('Montante inválido', { description: 'Mínimo €10,00.' });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setLastOrder({
        side, label: asset.label, name: assetName,
        amount: amt, leverage,
        time: new Date().toLocaleTimeString('pt-PT'),
      });
      if (side === 'comprar') {
        toast.success('Operação aberta com sucesso', {
          description: `${assetName} · ${fmt(amt)} · ${leverage}`,
          duration: 6000,
        });
      } else {
        toast.success('Operação encerrada com sucesso', {
          description: `${assetName} · ${fmt(amt)} · ${leverage}`,
          duration: 6000,
          style: {
            background: '#180a0a',
            border: '1px solid rgba(248,113,113,0.35)',
            color: '#f3f5ff',
          },
        });
      }
    }, 700);
  };

  const inp = (extra) => ({
    width: '100%', padding: '9px 12px',
    background: '#0e0e1a', border: '1px solid #26263a',
    borderRadius: 9, color: '#f3f5ff', fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
    ...extra,
  });

  const lbl = {
    display: 'block', fontSize: 10, fontWeight: 700,
    color: '#7a8299', marginBottom: 5,
    textTransform: 'uppercase', letterSpacing: '0.07em',
  };

  return (
    <div style={{
      background: '#111118',
      border: '1px solid #26263a',
      borderRadius: 14,
      overflow: 'hidden',
    }}>

      {/* ── Toggle COMPRAR / VENDER ── */}
      <div style={{ display: 'flex' }}>
        {[
          { key: 'comprar', icon: <ChevronUp size={15} />,   label: 'COMPRAR', color: '#22c58b' },
          { key: 'vender',  icon: <ChevronDown size={15} />, label: 'VENDER',  color: '#ef4444' },
        ].map(btn => (
          <button
            key={btn.key}
            onClick={() => { setSide(btn.key); setLastOrder(null); }}
            style={{
              flex: 1, padding: '14px 0',
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-heading)',
              fontSize: 14, fontWeight: 800, letterSpacing: '0.04em',
              background: side === btn.key ? btn.color : '#0e0e1a',
              color:      side === btn.key ? '#fff'    : '#7a8299',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6,
              transition: 'background .15s, color .15s',
            }}
          >
            {btn.icon}{btn.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Instrumento */}
        <div>
          <label style={lbl}>Instrumento</label>
          <div style={{
            ...inp({ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', border: `1px solid ${col.border}` })
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: col.active }}>
              {asset.label}
            </span>
            <span style={{ fontSize: 11, color: '#7a8299' }}>{asset.name}</span>
          </div>
        </div>

        {/* Montante */}
        <div>
          <label style={lbl}>Montante (€)</label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 11, top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 13, color: '#7a8299', fontWeight: 700,
            }}>€</span>
            <input
              type="number" min="10"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={inp({ paddingLeft: 26, fontSize: 14, fontWeight: 700 })}
            />
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
            {['50', '100', '250', '500'].map(v => (
              <button
                key={v} type="button"
                onClick={() => setAmount(v)}
                style={{
                  flex: 1, padding: '5px 0',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  borderRadius: 7,
                  border:      `1px solid ${amount === v ? col.border : '#26263a'}`,
                  background:  amount === v ? col.bg     : '#0e0e1a',
                  color:       amount === v ? col.active : '#7a8299',
                }}
              >
                €{v}
              </button>
            ))}
          </div>
        </div>

        {/* Alavancagem */}
        <div>
          <label style={lbl}>Alavancagem</label>
          <select
            value={leverage}
            onChange={e => setLeverage(e.target.value)}
            style={inp()}
          >
            {['1:1','1:2','1:5','1:10','1:20','1:50','1:100']
              .map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Resumo */}
        <div style={{
          background: '#0e0e1a', borderRadius: 9,
          padding: '10px 12px', border: '1px solid #1e1e30',
        }}>
          {[
            { label: 'Direcção',     value: side === 'comprar' ? '↑ Compra' : '↓ Venda', color: side === 'comprar' ? '#22c58b' : '#ef4444' },
            { label: 'Preço actual', value: asset.price, color: '#f3f5ff' },
            { label: 'Montante',     value: `€ ${parseFloat(amount || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`, color: '#f3f5ff' },
            { label: 'Exposição',    value: `€ ${exposure}`, color: col.active },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between',
              marginBottom: 5, fontSize: 11,
            }}>
              <span style={{ color: '#7a8299' }}>{label}</span>
              <span className="numeric" style={{ fontWeight: 700, color }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Última ordem */}
        {lastOrder && (
          <div style={{
            padding: '9px 12px', borderRadius: 9,
            background: lastOrder.side === 'comprar'
              ? 'rgba(34,197,139,0.08)'
              : 'rgba(239,68,68,0.08)',
            border: `1px solid ${lastOrder.side === 'comprar'
              ? 'rgba(34,197,139,0.3)'
              : 'rgba(239,68,68,0.3)'}`,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, marginBottom: 3,
              color: lastOrder.side === 'comprar' ? '#22c58b' : '#ef4444',
            }}>
              {lastOrder.side === 'comprar' ? '✓ Operação Aberta' : '✓ Operação Encerrada'}
            </div>
            <div style={{ fontSize: 10, color: '#7a8299' }}>
              {lastOrder.label} · {fmt(lastOrder.amount)} · {lastOrder.leverage} · {lastOrder.time}
            </div>
          </div>
        )}

        {/* Botão principal */}
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <button
          onClick={handleOrder}
          disabled={loading}
          style={{
            width: '100%', padding: '14px 10px',
            border: 'none', borderRadius: 11,
            cursor: loading ? 'not-allowed' : 'pointer',
            background: loading
              ? '#1e1e30'
              : side === 'comprar' ? '#22c58b' : '#ef4444',
            color: '#fff',
            fontFamily: 'var(--font-heading)',
            fontSize: 14, fontWeight: 800,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 7,
            letterSpacing: '0.03em',
            opacity: loading ? 0.6 : 1,
            transition: 'background .15s',
          }}
        >
          {loading
            ? <><Activity size={15} style={{ animation: 'spin 1s linear infinite' }} /> A processar…</>
            : side === 'comprar'
              ? <><ChevronUp size={16} />{btnLabel}</>
              : <><ChevronDown size={16} />{btnLabel}</>
          }
        </button>

        <p style={{ fontSize: 10, color: '#4a5068', textAlign: 'center', margin: 0 }}>
          Regulamentado CySEC · Fundos ICF · MiFID II
        </p>
      </div>
    </div>
  );
}
