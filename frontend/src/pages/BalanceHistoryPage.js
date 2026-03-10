import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, RefreshCw, ArrowUp } from 'lucide-react';
import { useUser } from '../context/UserContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const fmt = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);

/* SVG Line Chart Premium */
function LineChart({ data, color = '#3A86FF', height = 200 }) {
  if (!data || data.length < 2) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5068', fontSize: 13 }}>
      Sem dados suficientes
    </div>
  );

  const vals = data.map(d => d.balance || 0);
  const max  = Math.max(...vals, 1);
  const min  = Math.min(...vals, 0);
  const range = max - min || 1;
  const W = 800, H = height;
  const pad = 12;

  const pts = vals.map((v, i) => ({
    x: pad + (i / (vals.length - 1)) * (W - pad * 2),
    y: H - pad - ((v - min) / range) * (H - pad * 2),
    v,
    label: data[i].date || '',
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;

  const isPositive = vals[vals.length - 1] >= vals[0];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Área preenchida */}
      <path d={areaD} fill="url(#chartGrad)" />
      {/* Linha principal */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
      {/* Pontos */}
      {pts.filter((_, i) => i === 0 || i === pts.length - 1 || i % Math.ceil(pts.length / 6) === 0).map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={color} opacity="0.9" />
          <circle cx={p.x} cy={p.y} r="8" fill={color} opacity="0.1" />
        </g>
      ))}
      {/* Ponto final (maior) */}
      <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="6" fill={color} />
      <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="12" fill={color} opacity="0.15" />
    </svg>
  );
}

export default function BalanceHistoryPage() {
  const { user } = useUser();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const safeBalance = Math.max(0, parseFloat(user?.balance) || 0);
  const safeProfit  = Math.max(0, parseFloat(user?.profit)  || 0);

  const fetchHistory = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const r = await fetch(`${BACKEND_URL}/api/me/balance-history`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setHistory(await r.json());
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchHistory(); }, []);

  // Calcular variação
  const first = history[0]?.balance || 0;
  const last  = history[history.length - 1]?.balance || safeBalance;
  const change = first > 0 ? ((last - first) / first * 100) : 0;
  const isPositive = change >= 0;
  const totalGain = last - first;

  // Máximo e mínimo
  const vals = history.map(d => d.balance || 0);
  const maxVal = Math.max(...vals, 0);
  const minVal = Math.min(...vals, 0);

  const card = { background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: '20px 22px' };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#f3f5ff', margin: 0, letterSpacing: '-0.02em' }}>
            Evolução do Saldo
          </h1>
          <p style={{ fontSize: 13, color: 'hsl(215,16%,60%)', margin: '4px 0 0' }}>Histórico visual dos últimos 30 dias</p>
        </div>
        <button onClick={fetchHistory}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'hsl(240,18%,14%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: 'hsl(215,16%,65%)', fontSize: 13, cursor: 'pointer' }}>
          <RefreshCw size={14} />Actualizar
        </button>
      </div>

      {/* Cards de métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }} className="dash-actions">
        {[
          { label: 'Saldo Actual',   value: fmt(safeBalance),  color: '#f3f5ff', icon: Calendar,    large: true },
          { label: 'Lucro Total',    value: `+${fmt(safeProfit)}`, color: '#22c58b', icon: TrendingUp },
          { label: 'Variação 30d',   value: `${isPositive ? '+' : ''}${change.toFixed(2)}%`, color: isPositive ? '#22c58b' : '#ef4444', icon: isPositive ? TrendingUp : TrendingDown },
          { label: 'Ganho Absoluto', value: `${totalGain >= 0 ? '+' : ''}${fmt(totalGain)}`, color: totalGain >= 0 ? '#22c58b' : '#ef4444', icon: ArrowUp },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{ ...card }}>
            <div style={{ fontSize: 10, color: 'hsl(215,16%,55%)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
            <div className="numeric" style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'var(--font-heading)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Gráfico principal */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f3f5ff' }}>Saldo ao Longo do Tempo</div>
            <div style={{ fontSize: 11, color: 'hsl(215,16%,55%)', marginTop: 2 }}>Últimos 30 dias</div>
          </div>
          {history.length > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div className="numeric" style={{ fontSize: 22, fontWeight: 900, color: isPositive ? '#22c58b' : '#ef4444', fontFamily: 'var(--font-heading)' }}>
                {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
              </div>
              <div style={{ fontSize: 11, color: 'hsl(215,16%,50%)' }}>vs. início do período</div>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5068' }}>
            A carregar gráfico…
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <LineChart data={history} color={isPositive ? '#22c58b' : '#ef4444'} height={220} />

            {/* Eixo Y: max/min */}
            <div style={{ position: 'absolute', right: 0, top: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 220, pointerEvents: 'none' }}>
              <span className="numeric" style={{ fontSize: 10, color: '#4a5068' }}>{fmt(maxVal)}</span>
              <span className="numeric" style={{ fontSize: 10, color: '#4a5068' }}>{fmt(minVal)}</span>
            </div>
          </div>
        )}

        {/* Eixo X: datas */}
        {history.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            {[0, Math.floor(history.length/4), Math.floor(history.length/2), Math.floor(3*history.length/4), history.length-1].map(i => (
              <span key={i} style={{ fontSize: 10, color: '#4a5068' }}>{history[i]?.date || ''}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tabela de histórico */}
      <div style={{ ...card }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#f3f5ff', marginBottom: 14 }}>Histórico Detalhado</div>
        {loading ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#4a5068' }}>A carregar…</div>
        ) : history.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#4a5068', fontSize: 13 }}>
            Sem histórico disponível ainda.<br />O gráfico cresce à medida que usa a plataforma.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'hsl(240,18%,10%)' }}>
                  {['Data', 'Saldo', 'Lucro', 'Variação'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().slice(0, 30).map((row, i, arr) => {
                  const prevBalance = arr[i + 1]?.balance || row.balance;
                  const diff = row.balance - prevBalance;
                  return (
                    <tr key={i} style={{ borderTop: '1px solid hsl(240,16%,14%)' }}>
                      <td style={{ padding: '8px 14px', fontSize: 12, color: '#7a8299' }}>{row.date}</td>
                      <td style={{ padding: '8px 14px' }}><span className="numeric" style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>{fmt(row.balance)}</span></td>
                      <td style={{ padding: '8px 14px' }}><span className="numeric" style={{ fontSize: 12, color: '#22c58b' }}>+{fmt(row.profit)}</span></td>
                      <td style={{ padding: '8px 14px' }}>
                        {diff !== 0 && (
                          <span className="numeric" style={{ fontSize: 11, fontWeight: 700, color: diff >= 0 ? '#22c58b' : '#ef4444', padding: '2px 7px', background: diff >= 0 ? 'rgba(34,197,139,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: 5 }}>
                            {diff >= 0 ? '+' : ''}{fmt(diff)}
                          </span>
                        )}
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
