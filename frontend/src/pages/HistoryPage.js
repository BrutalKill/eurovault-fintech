import React, { useState, useEffect, useCallback } from 'react';
import { Clock, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const fmt = (v) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export default function HistoryPage() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const cardStyle = {
    background: 'hsl(240,26%,8%)',
    border: '1px solid hsl(240,16%,18%)',
    borderRadius: 16,
    padding: 24,
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>
            Histórico de Ordens
          </h1>
          <p style={{ fontSize: 13, color: 'hsl(215,16%,70%)', margin: 0 }}>
            Todas as suas operações registadas
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchOrders(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'hsl(240,18%,14%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: 'hsl(215,16%,70%)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          data-testid="history-refresh-btn"
        >
          <RefreshCw size={13} />Actualizar
        </button>
      </div>

      <div style={cardStyle}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'hsl(215,16%,50%)' }}>
            <Clock size={28} style={{ marginBottom: 10, opacity: 0.4 }} />
            <p style={{ fontSize: 13, margin: 0 }}>A carregar histórico…</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'hsl(215,16%,50%)' }}>
            <Clock size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(215,16%,60%)', margin: '0 0 6px' }}>
              Nenhuma operação registada
            </p>
            <p style={{ fontSize: 12, color: 'hsl(215,16%,45%)', margin: 0 }}>
              As suas ordens aparecerão aqui após negociar.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table data-testid="history-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'hsl(240,18%,10%)' }}>
                  {['Instrumento', 'Lado', 'Montante', 'Alavancagem', 'Exposição', 'Preço', 'Data / Hora'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(215,16%,40%)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => {
                  const isBuy = order.side === 'comprar';
                  return (
                    <tr key={order.id || idx}
                      data-testid="history-order-row"
                      style={{ borderTop: '1px solid hsl(240,16%,14%)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>

                      {/* Instrumento */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>{order.asset_label}</div>
                        <div style={{ fontSize: 10, color: 'hsl(215,16%,50%)', marginTop: 1 }}>{order.asset_name}</div>
                      </td>

                      {/* Lado */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                          background: isBuy ? 'rgba(34,197,139,0.12)' : 'rgba(239,68,68,0.12)',
                          color: isBuy ? '#22c58b' : '#ef4444',
                          border: `1px solid ${isBuy ? 'rgba(34,197,139,0.25)' : 'rgba(239,68,68,0.25)'}`,
                        }}>
                          {isBuy ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {isBuy ? 'Compra' : 'Venda'}
                        </span>
                      </td>

                      {/* Montante */}
                      <td style={{ padding: '12px 14px' }}>
                        <span className="numeric" style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>
                          {fmt(order.amount)}
                        </span>
                      </td>

                      {/* Alavancagem */}
                      <td style={{ padding: '12px 14px' }}>
                        <span className="numeric" style={{ fontSize: 12, fontWeight: 700, color: 'hsl(214,100%,60%)' }}>
                          {order.leverage || '1:1'}
                        </span>
                      </td>

                      {/* Exposição */}
                      <td style={{ padding: '12px 14px' }}>
                        <span className="numeric" style={{ fontSize: 12, fontWeight: 700, color: 'hsl(215,16%,70%)' }}>
                          {fmt(order.exposure || order.amount)}
                        </span>
                      </td>

                      {/* Preço */}
                      <td style={{ padding: '12px 14px' }}>
                        <span className="numeric" style={{ fontSize: 12, color: 'hsl(215,16%,70%)' }}>
                          {order.price || '—'}
                        </span>
                      </td>

                      {/* Data */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 11, color: 'hsl(215,16%,55%)' }}>
                          {fmtDate(order.created_at)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
