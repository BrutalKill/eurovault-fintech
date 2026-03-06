import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const fmt = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);
const fmtDate = (iso) => iso ? new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function OperationsPage() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const r = await fetch(`${BACKEND_URL}/api/orders`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setOrders(await r.json());
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []); // eslint-disable-line

  const totalBuy  = orders.filter(o => o.side === 'comprar').reduce((s, o) => s + o.amount, 0);
  const totalSell = orders.filter(o => o.side === 'vender').reduce((s, o) => s + o.amount, 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>
            Histórico de Operações
          </h1>
          <p style={{ fontSize: 13, color: '#7a8299' }}>{orders.length} operação{orders.length !== 1 ? 'ões' : ''} registada{orders.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={fetchOrders} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', background: '#111118', border: '1px solid #26263a', borderRadius: 9, color: '#7a8299', cursor: 'pointer', fontSize: 12 }}>
          <RefreshCw size={13} />Actualizar
        </button>
      </div>

      {/* Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total de Operações', value: orders.length, color: '#f3f5ff' },
          { label: 'Volume de Compra',   value: fmt(totalBuy),  color: '#22c58b' },
          { label: 'Volume de Venda',    value: fmt(totalSell), color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: '#7a8299', marginBottom: 6 }}>{label}</div>
            <div className="numeric" style={{ fontSize: 18, fontWeight: 700, color, fontFamily: 'var(--font-heading)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0d0d1a' }}>
                {['Data / Hora', 'Instrumento', 'Tipo', 'Montante', 'Alavancagem', 'Preço', 'Estado'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#7a8299', fontSize: 13 }}>A carregar…</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#7a8299', fontSize: 13 }}>
                  Ainda não tem operações registadas.<br />
                  <span style={{ fontSize: 11 }}>Vá a Negociar e execute a sua primeira operação.</span>
                </td></tr>
              ) : orders.map((o, i) => (
                <tr key={o.id} style={{ borderTop: '1px solid #1a1a2a', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '11px 14px', fontSize: 11, color: '#7a8299', whiteSpace: 'nowrap' }}>{fmtDate(o.created_at)}</td>
                  <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>{o.asset_label}</div>
                    <div style={{ fontSize: 10, color: '#7a8299' }}>{o.asset_name}</div>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: o.side === 'comprar' ? 'rgba(34,197,139,0.12)' : 'rgba(239,68,68,0.12)',
                      color: o.side === 'comprar' ? '#22c58b' : '#ef4444',
                      border: `1px solid ${o.side === 'comprar' ? 'rgba(34,197,139,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    }}>
                      {o.side === 'comprar' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {o.side === 'comprar' ? 'Compra' : 'Venda'}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span className="numeric" style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>{fmt(o.amount)}</span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span className="numeric" style={{ fontSize: 12, color: '#7a8299' }}>{o.leverage}</span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span className="numeric" style={{ fontSize: 12, color: '#f3f5ff' }}>{o.price}</span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(34,197,139,0.1)', color: '#22c58b', border: '1px solid rgba(34,197,139,0.2)', fontWeight: 700 }}>
                      Executada
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
