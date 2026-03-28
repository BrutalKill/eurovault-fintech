import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Activity, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { CAT_COLORS } from './tradeData';
import { useLang } from '../../context/LangContext';
import { useUser } from '../../context/UserContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const fmt = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);

export default function TradeOrder({ asset, activeCat, initialSide = 'comprar' }) {
  const { t, lang } = useLang();
  const { user, fetchUser } = useUser();
  const [side, setSide]           = useState(initialSide);
  const [amount, setAmount]       = useState('100');
  const [leverage, setLeverage]   = useState('1:10');
  const [loading, setLoading]     = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [balanceResult, setBalanceResult] = useState(null);
  // ── Posição aberta neste ativo ──
  const [openPosition, setOpenPosition] = useState(null); // null = a carregar, number = valor
  const [loadingPos, setLoadingPos]     = useState(false);

  const safeBalance = Math.max(0, parseFloat(user?.balance) || 0);
  const reqAmount   = parseFloat(amount) || 0;
  const insufficient    = side === 'comprar' && reqAmount > safeBalance && reqAmount > 0;
  const noPosition      = side === 'vender' && openPosition !== null && openPosition <= 0;
  const exceedsPosition = side === 'vender' && openPosition !== null && openPosition > 0 && reqAmount > openPosition;
  const cannotSell      = noPosition || exceedsPosition;

  // Buscar posição aberta ao mudar de ativo ou de lado para "vender"
  useEffect(() => {
    setSide(initialSide);
    setLastOrder(null);
    setBalanceResult(null);
    setOpenPosition(null);
  }, [initialSide, asset?.label]);

  useEffect(() => {
    if (side !== 'vender' || !asset?.label) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoadingPos(true);
    fetch(`${BACKEND_URL}/api/orders/position?asset_label=${encodeURIComponent(asset.label)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setOpenPosition(d.open_position); })
      .catch(() => {})
      .finally(() => setLoadingPos(false));
  }, [side, asset?.label]);

  const col        = CAT_COLORS[activeCat] || CAT_COLORS['Forex'];
  const assetName  = (asset.name || '').split(' / ')[0];
  const levMult    = parseInt((leverage.split(':')[1]) || 1);
  const exposure   = (parseFloat(amount || 0) * levMult)
    .toLocaleString('pt-PT', { minimumFractionDigits: 2 });
  const btnLabel   = side === 'comprar'
    ? `${t('trade_open_btn')} ${assetName}`
    : `${t('trade_close_btn')} ${assetName}`;

  const handleOrder = async () => {
    const amt = parseFloat(amount);
    if (!amt || isNaN(amt) || amt < 10) {
      toast.error('Montante inválido', { description: 'Mínimo €10,00.' });
      return;
    }
    if (insufficient) {
      toast.error('Saldo insuficiente', { description: `Disponível: ${fmt(safeBalance)}` });
      return;
    }
    if (cannotSell) {
      if (noPosition) toast.error(`Sem posição em ${asset.label}`, { description: 'Compre este ativo primeiro.' });
      else toast.error('Excede a posição aberta', { description: `Máximo: ${fmt(openPosition)}` });
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          asset_label: asset.label, asset_name: asset.name,
          side, amount: amt, leverage, price: asset.price, category: activeCat,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao executar ordem');

      await fetchUser();

      const balBefore = data.balance_before || 0;
      const balAfter  = data.balance_after  || 0;
      const gain      = balAfter - balBefore;

      setBalanceResult({ before: balBefore, after: balAfter, gain });
      setLastOrder({ side, label: asset.label, name: assetName, amount: amt, leverage, time: new Date().toLocaleTimeString('pt-PT') });

      if (side === 'comprar') {
        toast.success('Operação aberta!', {
          description: `${fmt(amt)} debitados · Novo saldo: ${fmt(balAfter)}`,
          duration: 7000, icon: '📉',
        });
      } else {
        toast.success('Operação encerrada!', {
          description: `${fmt(amt + Math.abs(gain))} creditados · Novo saldo: ${fmt(balAfter)}`,
          duration: 7000, icon: '📈',
          style: { background: '#050f0a', border: '1px solid rgba(34,197,139,0.35)', color: '#f3f5ff' },
        });
      }
    } catch (e) {
      toast.error(e.message || 'Erro ao executar ordem');
    } finally {
      setLoading(false);
    }
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
      background: 'linear-gradient(180deg, hsl(240,26%,9%) 0%, hsl(240,26%,8%) 100%)',
      border: `1px solid ${side === 'comprar' ? 'rgba(34,197,139,0.3)' : 'rgba(239,68,68,0.3)'}`,
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: side === 'comprar'
        ? '0 0 30px rgba(34,197,139,0.08)'
        : '0 0 30px rgba(239,68,68,0.08)',
      transition: 'border-color 0.3s, box-shadow 0.3s',
    }}>

      {/* ── Toggle COMPRAR / VENDER — Premium ── */}
      <div style={{ display: 'flex', padding: '6px', gap: 6, background: '#0a0a18' }}>
        {[
          { key: 'comprar', icon: <ChevronUp size={16} />,   label: t('trade_buy'),  color: '#22c58b', grad: 'linear-gradient(135deg,#16a34a,#22c58b)' },
          { key: 'vender',  icon: <ChevronDown size={16} />, label: t('trade_sell'), color: '#ef4444', grad: 'linear-gradient(135deg,#b91c1c,#ef4444)' },
        ].map(btn => (
          <button
            key={btn.key}
            data-testid={`trade-${btn.key}-toggle`}
            onClick={() => { setSide(btn.key); setLastOrder(null); }}
            style={{
              flex: 1, padding: '12px 0',
              border: `1px solid ${side === btn.key ? btn.color + '50' : 'transparent'}`,
              borderRadius: 11, cursor: 'pointer',
              fontFamily: 'var(--font-heading)',
              fontSize: 13, fontWeight: 900, letterSpacing: '0.05em',
              background: side === btn.key ? btn.grad : 'transparent',
              color: side === btn.key ? '#fff' : '#4a5068',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6,
              transition: 'all .2s',
              boxShadow: side === btn.key ? `0 4px 16px ${btn.color}40` : 'none',
            }}
          >
            {btn.icon}{btn.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '14px 14px 14px', display: 'flex', flexDirection: 'column', gap: 11 }}>

        {/* Instrumento */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px', background: '#0a0a18',
          border: `1px solid ${col.border}`, borderRadius: 10,
        }}>
          <div>
            <div style={{ fontSize: 9, color: col.active, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 1 }}>{t('trade_instrument')}</div>
            <span style={{ fontSize: 14, fontWeight: 800, color: col.active, fontFamily: 'var(--font-heading)' }}>{asset.label}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="numeric" style={{ fontSize: 16, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-heading)' }}>{asset.price}</div>
            <div className="numeric" style={{ fontSize: 10, fontWeight: 700, color: asset.pos ? '#22c58b' : '#ef4444' }}>{asset.change}</div>
          </div>
        </div>

        {/* Montante */}
        <div>
          <label style={lbl}>{t('trade_amount')}</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: side === 'comprar' ? '#22c58b' : '#ef4444', fontWeight: 900 }}>€</span>
            <input
              type="number" inputMode="decimal" min="10"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={inp({ paddingLeft: 28, fontSize: 16, fontWeight: 900, color: '#fff', border: `1px solid rgba(255,255,255,0.1)` })}
            />
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: 7 }}>
            {['50', '100', '250', '500'].map(v => (
              <button key={v} type="button" onClick={() => setAmount(v)}
                style={{ flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 800, cursor: 'pointer', borderRadius: 8,
                  border: `1px solid ${amount === v ? col.border : 'rgba(255,255,255,0.06)'}`,
                  background: amount === v ? col.bg : 'rgba(255,255,255,0.02)',
                  color: amount === v ? col.active : '#4a5068',
                  transition: 'all .15s',
                }}>
                €{v}
              </button>
            ))}
          </div>
          {/* Alerta saldo insuficiente (compra) */}
          {insufficient && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7, padding: '7px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8 }}>
              <AlertTriangle size={12} color="#ef4444" />
              <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>
                Saldo insuficiente — disponível {fmt(safeBalance)}
              </span>
            </div>
          )}
          {/* Info posição aberta (venda) */}
          {side === 'vender' && (
            <div style={{ marginTop: 7, padding: '8px 11px', background: noPosition ? 'rgba(239,68,68,0.08)' : exceedsPosition ? 'rgba(255,190,11,0.08)' : 'rgba(34,197,139,0.07)', border: `1px solid ${noPosition ? 'rgba(239,68,68,0.3)' : exceedsPosition ? 'rgba(255,190,11,0.3)' : 'rgba(34,197,139,0.25)'}`, borderRadius: 8 }}>
              {loadingPos ? (
                <span style={{ fontSize: 11, color: '#4a5068' }}>A verificar posição…</span>
              ) : noPosition ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={12} color="#ef4444" />
                  <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>
                    Sem posição aberta em {asset.label} — compre primeiro
                  </span>
                </div>
              ) : exceedsPosition ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={12} color="#FFBE0B" />
                  <span style={{ fontSize: 11, color: '#FFBE0B', fontWeight: 700 }}>
                    Máximo disponível para venda: {fmt(openPosition)}
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#22c58b' }}>
                  <span style={{ fontWeight: 600 }}>Posição aberta disponível</span>
                  <span className="numeric" style={{ fontWeight: 800 }}>{fmt(openPosition)}</span>
                </div>
              )}
            </div>
          )}
          {/* Saldo disponível (compra) */}
          {!insufficient && safeBalance > 0 && side === 'comprar' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#4a5068' }}>
              <span>Saldo disponível</span>
              <span className="numeric" style={{ color: '#22c58b', fontWeight: 700 }}>{fmt(safeBalance)}</span>
            </div>
          )}
        </div>

        {/* Alavancagem */}
        <div>
          <label style={lbl}>{t('trade_leverage')}</label>
          <select value={leverage} onChange={e => setLeverage(e.target.value)} style={inp({ background: '#0a0a18', border: '1px solid rgba(255,255,255,0.08)' })}>
            {['1:1','1:2','1:5','1:10','1:20','1:50','1:100'].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Resumo */}
        <div style={{ background: '#0a0a18', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {[
            { label: t('trade_direction'), value: side === 'comprar' ? `↑ ${t('hist_buy')}` : `↓ ${t('hist_sell')}`, color: side === 'comprar' ? '#22c58b' : '#ef4444' },
            { label: t('trade_price'),     value: asset.price, color: '#f3f5ff' },
            { label: t('trade_amount').replace(' (€)',''), value: `€ ${parseFloat(amount || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`, color: '#f3f5ff' },
            { label: t('trade_exposure'),  value: `€ ${exposure}`, color: col.active },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11 }}>
              <span style={{ color: '#4a5068' }}>{label}</span>
              <span className="numeric" style={{ fontWeight: 700, color }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Última ordem + resultado do saldo */}
        {lastOrder && (
          <div style={{ padding: '10px 12px', borderRadius: 9, background: lastOrder.side === 'comprar' ? 'rgba(34,197,139,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${lastOrder.side === 'comprar' ? 'rgba(34,197,139,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: lastOrder.side === 'comprar' ? '#22c58b' : '#ef4444', display: 'flex', alignItems: 'center', gap: 5 }}>
              {lastOrder.side === 'comprar' ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
              {lastOrder.side === 'comprar' ? t('trade_order_opened') : t('trade_order_closed')}
            </div>
            <div style={{ fontSize: 10, color: '#7a8299', marginBottom: balanceResult ? 6 : 0 }}>{lastOrder.label} · {fmt(lastOrder.amount)} · {lastOrder.leverage} · {lastOrder.time}</div>
            {balanceResult && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 6 }}>
                <div>
                  <div style={{ fontSize: 9, color: '#4a5068' }}>Antes</div>
                  <div className="numeric" style={{ fontSize: 11, fontWeight: 700, color: '#7a8299' }}>{fmt(balanceResult.before)}</div>
                </div>
                <div style={{ fontSize: 14, color: balanceResult.gain >= 0 ? '#22c58b' : '#ef4444' }}>→</div>
                <div>
                  <div style={{ fontSize: 9, color: '#4a5068' }}>Depois</div>
                  <div className="numeric" style={{ fontSize: 12, fontWeight: 900, color: balanceResult.gain >= 0 ? '#22c58b' : '#ef4444', fontFamily: 'var(--font-heading)' }}>{fmt(balanceResult.after)}</div>
                </div>
                {balanceResult.gain > 0 && (
                  <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color: '#22c58b', background: 'rgba(34,197,139,0.12)', padding: '3px 8px', borderRadius: 5 }}>
                    +{fmt(balanceResult.gain)} lucro
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Botão principal */}
        <button data-testid="trade-submit-order-btn" onClick={handleOrder}
          disabled={loading || insufficient || cannotSell}
          style={{
            width: '100%', padding: '14px 10px',
            border: 'none', borderRadius: 12,
            cursor: loading || insufficient || cannotSell ? 'not-allowed' : 'pointer',
            background: insufficient || cannotSell ? '#1e1e30' : loading ? '#1e1e30'
              : side === 'comprar' ? 'linear-gradient(135deg,#16a34a,#22c58b)'
              : 'linear-gradient(135deg,#b91c1c,#ef4444)',
            color: '#fff', fontFamily: 'var(--font-heading)',
            fontSize: 14, fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            letterSpacing: '0.04em',
            boxShadow: loading || insufficient || cannotSell ? 'none'
              : side === 'comprar' ? '0 4px 20px rgba(34,197,139,0.4)'
              : '0 4px 20px rgba(239,68,68,0.4)',
            opacity: loading || insufficient || cannotSell ? 0.5 : 1,
            transition: 'all .2s',
          }}>
          {loading
            ? <><Activity size={15} style={{ animation: 'spin 1s linear infinite' }} /> {t('trade_processing')}</>
            : insufficient
              ? <><AlertTriangle size={15} />Saldo Insuficiente</>
              : noPosition
              ? <><AlertTriangle size={15} />Sem posição em {asset.label}</>
              : exceedsPosition
              ? <><AlertTriangle size={15} />Excede posição aberta ({fmt(openPosition)})</>
              : side === 'comprar'
                ? <><ChevronUp size={16} />{btnLabel}</>
                : <><ChevronDown size={16} />{btnLabel}</>
          }
        </button>

        <p style={{ fontSize: 10, color: '#26263a', textAlign: 'center', margin: 0 }}>
          {t('trade_reg_info')}
        </p>
      </div>
    </div>
  );
}

