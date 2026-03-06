import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, CreditCard, ArrowDownToLine, Clock, Target, Star, ArrowRight, Activity, Zap } from 'lucide-react';
import { useUser } from '../context/UserContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const fmt = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);

/* Mini sparkline SVG */
function Sparkline({ data, color = '#3A86FF', height = 48 }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => d.balance || 0);
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals, 0);
  const range = max - min || 1;
  const w = 200, h = height;
  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [history, setHistory]       = useState([]);
  const [referral, setReferral]     = useState(null);
  const [demoMode, setDemoMode]     = useState(false);
  const [togglingDemo, setTogglingDemo] = useState(false);

  const safeBalance = Math.max(0, parseFloat(user?.balance) || 0);
  const safeProfit  = Math.max(0, parseFloat(user?.profit)  || 0);
  const goalAmount  = parseFloat(user?.goal_amount) || 0;
  const goalLabel   = user?.goal_label || '';
  const goalPct     = goalAmount > 0 ? Math.min(100, Math.round(safeBalance / goalAmount * 100)) : 0;

  useEffect(() => {
    setDemoMode(user?.demo_mode || false);
  }, [user?.demo_mode]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    fetch(`${BACKEND_URL}/api/me/balance-history`, { headers: h })
      .then(r => r.ok ? r.json() : []).then(setHistory).catch(() => {});
    fetch(`${BACKEND_URL}/api/me/referral`, { headers: h })
      .then(r => r.ok ? r.json() : null).then(setReferral).catch(() => {});
  }, []);

  const handleToggleDemo = async () => {
    setTogglingDemo(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${BACKEND_URL}/api/me/demo`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ demo_mode: !demoMode }),
      });
      if (res.ok) {
        setDemoMode(d => !d);
        window.location.reload();
      }
    } catch (_) {}
    setTogglingDemo(false);
  };

  const QUICK_ACTIONS = [
    { icon: CreditCard,      label: 'Depositar',      color: '#3A86FF', path: '/app/deposit'    },
    { icon: TrendingUp,      label: 'Negociar',       color: '#22c58b', path: '/app/trade'      },
    { icon: ArrowDownToLine, label: 'Levantar',       color: '#FFBE0B', path: '/app/withdrawal' },
    { icon: Clock,           label: 'Histórico',      color: '#F59E0B', path: '/app/history'    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header + Demo toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#f3f5ff', margin: 0 }}>
            Bom dia, {user?.full_name?.split(' ')[0] || 'Investidor'} 👋
          </h1>
          <p style={{ fontSize: 13, color: 'hsl(215,16%,60%)', margin: '4px 0 0' }}>
            {demoMode ? '🎮 Conta Demo activa — saldo virtual €10.000' : 'Aqui está o resumo da sua conta'}
          </p>
        </div>
        <button onClick={handleToggleDemo} disabled={togglingDemo}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: demoMode ? 'rgba(255,190,11,0.15)' : 'rgba(34,197,139,0.1)', border: `1px solid ${demoMode ? 'rgba(255,190,11,0.35)' : 'rgba(34,197,139,0.25)'}`, borderRadius: 10, color: demoMode ? '#FFBE0B' : '#22c58b', fontSize: 13, fontWeight: 700, cursor: togglingDemo ? 'not-allowed' : 'pointer' }}>
          <Zap size={14} />{togglingDemo ? '…' : demoMode ? 'Sair da Demo' : 'Conta Demo'}
        </button>
      </div>

      {/* Cards de saldo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="dash-cards">
        <style>{`.dash-cards { grid-template-columns: repeat(3,1fr); } @media(max-width:768px){ .dash-cards{ grid-template-columns: repeat(2,1fr) !important; } } @media(max-width:500px){ .dash-cards{ grid-template-columns: 1fr !important; } }`}</style>

        {/* Saldo */}
        <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: '20px 22px', gridColumn: 'span 2' }} className="dash-balance-card">
          <style>{`.dash-balance-card { grid-column: span 2; } @media(max-width:500px){ .dash-balance-card{ grid-column: span 1 !important; } }`}</style>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: 'hsl(215,16%,60%)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Saldo Total</div>
              <div className="numeric" style={{ fontSize: 36, fontWeight: 800, color: '#f3f5ff', fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em' }}>
                {fmt(safeBalance)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: 13, color: 'hsl(215,16%,60%)' }}>Lucro acumulado:</span>
                <span className="numeric" style={{ fontSize: 14, fontWeight: 700, color: '#22c58b' }}>+{fmt(safeProfit)}</span>
              </div>
            </div>
            <div style={{ width: 120, opacity: 0.7 }}>
              <Sparkline data={history} color="#3A86FF" />
            </div>
          </div>
          {/* Mini gráfico de linha */}
          {history.length > 1 && (
            <div style={{ marginTop: 12, height: 40, opacity: 0.6 }}>
              <Sparkline data={history} color="#22c58b" height={40} />
            </div>
          )}
        </div>

        {/* Lucro */}
        <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid rgba(34,197,139,0.2)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'hsl(215,16%,60%)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            <Activity size={11} style={{ marginRight: 5 }} />Lucro Diário
          </div>
          <div className="numeric" style={{ fontSize: 26, fontWeight: 800, color: '#22c58b', fontFamily: 'var(--font-heading)' }}>
            {user?.daily_profit_rate > 0 ? `${user.daily_profit_rate}%` : '—'}
          </div>
          <div style={{ fontSize: 11, color: 'hsl(215,16%,55%)', marginTop: 6 }}>
            {user?.daily_profit_rate > 0 ? `+${fmt(safeBalance * user.daily_profit_rate / 100)} / dia` : 'Taxa não definida'}
          </div>
        </div>
      </div>

      {/* Ações rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }} className="dash-actions">
        <style>{`.dash-actions { grid-template-columns: repeat(4,1fr); } @media(max-width:600px){ .dash-actions{ grid-template-columns: repeat(2,1fr) !important; } }`}</style>
        {QUICK_ACTIONS.map(({ icon: Icon, label, color, path }) => (
          <button key={path} onClick={() => navigate(path)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 12px', background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 14, cursor: 'pointer', transition: 'border-color 0.2s', color }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}14`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(240,16%,18%)'; e.currentTarget.style.background = 'hsl(240,26%,8%)'; }}>
            <div style={{ width: 40, height: 40, background: `${color}18`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={18} color={color} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)' }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Meta de investimento + Referidos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="dash-meta">
        <style>{`.dash-meta { grid-template-columns: 1fr 1fr; } @media(max-width:700px){ .dash-meta{ grid-template-columns: 1fr !important; } }`}</style>

        {/* Meta */}
        {goalAmount > 0 ? (
          <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <Target size={16} color="#FFBE0B" />
              <div style={{ fontWeight: 700, fontSize: 14, color: '#f3f5ff' }}>{goalLabel || 'Meta de Investimento'}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="numeric" style={{ fontSize: 14, fontWeight: 700, color: '#22c58b' }}>{fmt(safeBalance)}</span>
              <span className="numeric" style={{ fontSize: 13, color: 'hsl(215,16%,55%)' }}>Meta: {fmt(goalAmount)}</span>
            </div>
            <div style={{ height: 10, background: 'hsl(240,18%,14%)', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, #FFBE0B, #22c58b)', borderRadius: 5, width: `${goalPct}%`, transition: 'width 1s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: '#FFBE0B', fontWeight: 700 }}>{goalPct}% atingido</span>
              <span className="numeric" style={{ fontSize: 11, color: 'hsl(215,16%,50%)' }}>
                Faltam {fmt(Math.max(0, goalAmount - safeBalance))}
              </span>
            </div>
          </div>
        ) : (
          <button onClick={() => navigate('/app/profile')}
            style={{ background: 'hsl(240,26%,8%)', border: '1px dashed hsl(240,16%,24%)', borderRadius: 16, padding: '20px 22px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'hsl(215,16%,50%)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#FFBE0B'; e.currentTarget.style.background = 'rgba(255,190,11,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(240,16%,24%)'; e.currentTarget.style.background = 'hsl(240,26%,8%)'; }}>
            <Target size={24} color="#FFBE0B" style={{ opacity: 0.6 }} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>Definir Meta de Investimento</div>
            <div style={{ fontSize: 11 }}>Acompanhe o progresso rumo ao seu objetivo</div>
          </button>
        )}

        {/* Referidos */}
        {referral && (
          <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <Star size={16} color="#3A86FF" />
              <div style={{ fontWeight: 700, fontSize: 14, color: '#f3f5ff' }}>Programa de Referidos</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Convidados', value: referral.count },
                { label: 'Convertidos', value: referral.converted },
                { label: 'Bónus', value: fmt(referral.bonus) },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div className="numeric" style={{ fontSize: 18, fontWeight: 800, color: '#3A86FF', fontFamily: 'var(--font-heading)' }}>{value}</div>
                  <div style={{ fontSize: 10, color: 'hsl(215,16%,55%)' }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '8px 12px', background: 'rgba(58,134,255,0.08)', borderRadius: 9, border: '1px solid rgba(58,134,255,0.2)' }}>
              <div style={{ fontSize: 10, color: '#7a8299', marginBottom: 3 }}>O seu link de convite</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                <code style={{ fontSize: 11, color: '#3A86FF', fontFamily: 'monospace' }}>
                  {window.location.origin}/ref/{referral.referral_code}
                </code>
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/ref/${referral.referral_code}`); }}
                  style={{ fontSize: 10, padding: '3px 8px', background: '#3A86FF', border: 'none', borderRadius: 5, color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                  Copiar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Acesso rápido a Negociar */}
      <button onClick={() => navigate('/app/trade')}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'linear-gradient(135deg, rgba(58,134,255,0.15), rgba(34,197,139,0.08))', border: '1px solid rgba(58,134,255,0.3)', borderRadius: 16, cursor: 'pointer', width: '100%' }}
        onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(58,134,255,0.22), rgba(34,197,139,0.14))'}
        onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(58,134,255,0.15), rgba(34,197,139,0.08))'}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: 'rgba(58,134,255,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={18} color="#3A86FF" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: '#f3f5ff' }}>Ir para Negociar</div>
            <div style={{ fontSize: 12, color: 'hsl(215,16%,60%)' }}>Forex, Cripto, Acções, Metais e Commodities</div>
          </div>
        </div>
        <ArrowRight size={18} color="#3A86FF" />
      </button>
    </div>
  );
}
