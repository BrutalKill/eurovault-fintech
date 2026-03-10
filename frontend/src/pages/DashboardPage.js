import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, CreditCard, ArrowDownToLine, Clock,
  Target, Star, ArrowRight, Activity, ShieldCheck,
  Zap, BarChart2, Users, ChevronRight,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useCountUp } from '../hooks/useCountUp';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const fmt = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);

/* Sparkline */
function Sparkline({ data, color = '#3A86FF', height = 56 }) {
  if (!data || data.length < 2) {
    return <div style={{ height, background: 'rgba(58,134,255,0.06)', borderRadius: 8 }} />;
  }
  const vals = data.map(d => d.balance || 0);
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals, 0);
  const range = max - min || 1;
  const w = 200, h = height;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill="url(#sg)" points={`0,${h} ${pts} ${w},${h}`} />
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" points={pts} />
    </svg>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const navigate  = useNavigate();
  const [history, setHistory]       = useState([]);
  const [referral, setReferral]     = useState(null);
  const [activities, setActivities] = useState([]);

  const safeBalance = Math.max(0, parseFloat(user?.balance) || 0);
  const safeProfit  = Math.max(0, parseFloat(user?.profit)  || 0);
  const goalAmount  = parseFloat(user?.goal_amount) || 0;
  const goalLabel   = user?.goal_label || '';
  const goalPct     = goalAmount > 0 ? Math.min(100, Math.round(safeBalance / goalAmount * 100)) : 0;
  const isVerified  = user?.kyc_status === 'approved';
  const dailyRate   = parseFloat(user?.daily_profit_rate) || 0;

  // Animações de contador
  const animBalance = useCountUp(safeBalance);
  const animProfit  = useCountUp(safeProfit);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    fetch(`${BACKEND_URL}/api/me/balance-history`, { headers: h })
      .then(r => r.ok ? r.json() : []).then(setHistory).catch(() => {});
    fetch(`${BACKEND_URL}/api/me/referral`, { headers: h })
      .then(r => r.ok ? r.json() : null).then(setReferral).catch(() => {});
    fetch(`${BACKEND_URL}/api/me/activity`, { headers: h })
      .then(r => r.ok ? r.json() : []).then(setActivities).catch(() => {});
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const firstName = user?.full_name?.split(' ')[0] || 'Investidor';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960, margin: '0 auto' }}>

      {/* ── Hero: saldo principal ── */}
      <div style={{
        background: 'linear-gradient(135deg, hsl(240,33%,9%) 0%, hsl(220,40%,12%) 100%)',
        border: '1px solid hsl(240,16%,20%)',
        borderRadius: 20, padding: '28px 28px 20px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decoração de fundo */}
        <div style={{ position: 'absolute', top: -40, right: -30, width: 180, height: 180, background: 'radial-gradient(circle, rgba(58,134,255,0.15), transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 140, height: 140, background: 'radial-gradient(circle, rgba(34,197,139,0.1), transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 13, color: 'hsl(215,16%,60%)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
              {greeting}, <strong style={{ color: '#f3f5ff' }}>{firstName}</strong>
              {isVerified && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '2px 8px', background: 'rgba(34,197,139,0.15)', border: '1px solid rgba(34,197,139,0.3)', borderRadius: 5, color: '#22c58b', fontWeight: 700 }}><ShieldCheck size={9} />VERIFICADO</span>}
            </p>
            <div className="numeric" style={{ fontSize: 'clamp(28px,6vw,44px)', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {fmt(animBalance)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 12, color: 'hsl(215,16%,60%)' }}>Lucro acumulado</span>
              <span className="numeric" style={{ fontSize: 14, fontWeight: 700, color: '#22c58b' }}>+{fmt(animProfit)}</span>
              {dailyRate > 0 && (
                <span style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(255,190,11,0.12)', border: '1px solid rgba(255,190,11,0.25)', borderRadius: 5, color: '#FFBE0B', fontWeight: 700 }}>
                  <Zap size={10} style={{ marginRight: 3 }} />{dailyRate}%/dia
                </span>
              )}
            </div>
          </div>
          <div style={{ minWidth: 140, maxWidth: 200, flex: 1 }}>
            <Sparkline data={history} color="#3A86FF" height={60} />
          </div>
        </div>

        {/* Barra de progresso da meta (inline no hero) */}
        {goalAmount > 0 && (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid hsl(240,16%,18%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'hsl(215,16%,60%)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Target size={11} color="#FFBE0B" />{goalLabel || 'Meta de Investimento'}
              </span>
              <span className="numeric" style={{ fontSize: 12, fontWeight: 700, color: '#FFBE0B' }}>{goalPct}%</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${goalPct}%`, background: 'linear-gradient(90deg, #FFBE0B, #22c58b)', borderRadius: 3, transition: 'width 1s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span className="numeric" style={{ fontSize: 10, color: '#22c58b' }}>{fmt(safeBalance)}</span>
              <span className="numeric" style={{ fontSize: 10, color: 'hsl(215,16%,45%)' }}>/ {fmt(goalAmount)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Ações rápidas ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }} className="dash-actions">
        {[
          { icon: CreditCard,      label: 'Depositar', color: '#3A86FF', bg: 'rgba(58,134,255,0.1)',  path: '/app/deposit'    },
          { icon: TrendingUp,      label: 'Negociar',  color: '#22c58b', bg: 'rgba(34,197,139,0.1)',  path: '/app/trade'      },
          { icon: ArrowDownToLine, label: 'Levantar',  color: '#FFBE0B', bg: 'rgba(255,190,11,0.1)',  path: '/app/withdrawal' },
          { icon: Clock,           label: 'Histórico', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', path: '/app/history'    },
        ].map(({ icon: Icon, label, color, bg, path }) => (
          <button key={path} onClick={() => navigate(path)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 10px', background: bg, border: `1px solid ${color}25`, borderRadius: 14, cursor: 'pointer', transition: 'transform 0.15s, border-color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}25`; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <div style={{ width: 42, height: 42, background: `${color}20`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={19} color={color} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'hsl(215,16%,75%)' }}>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Grid inferior: actividades + referidos + estado ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="dash-meta">

        {/* Actividades recentes */}
        <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Activity size={15} color="#3A86FF" />Actividades Recentes
            </div>
            <button onClick={() => navigate('/app/history')}
              style={{ fontSize: 11, color: '#3A86FF', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
              Ver tudo <ChevronRight size={11} />
            </button>
          </div>
          {activities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'hsl(215,16%,40%)' }}>
              <BarChart2 size={24} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p style={{ fontSize: 12, margin: 0 }}>Sem actividades ainda.<br />Comece por fazer um depósito.</p>
            </div>
          ) : activities.map((act, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < activities.length - 1 ? '1px solid hsl(240,16%,14%)' : 'none' }}>
              <div style={{ width: 30, height: 30, background: act.type === 'deposit' ? 'rgba(58,134,255,0.1)' : act.type === 'kyc' ? 'rgba(34,197,139,0.1)' : 'rgba(255,190,11,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
                {act.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e8eaf6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.label}</div>
                <div style={{ fontSize: 10, color: 'hsl(215,16%,45%)', marginTop: 1 }}>
                  {act.created_at ? new Date(act.created_at).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
              {act.amount > 0 && (
                <span className="numeric" style={{ fontSize: 12, fontWeight: 700, color: '#22c58b', flexShrink: 0 }}>+{fmt(act.amount)}</span>
              )}
            </div>
          ))}
        </div>

        {/* Coluna direita: Referidos + KYC */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Card Programa de Referidos */}
          {referral && (
            <div style={{ background: 'linear-gradient(135deg, rgba(34,197,139,0.1), rgba(58,134,255,0.08))', border: '1px solid rgba(34,197,139,0.2)', borderRadius: 16, padding: '18px 20px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Users size={15} color="#22c58b" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>Programa de Parceiros</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[{ label: 'Convidados', value: referral.count }, { label: 'Bónus Total', value: fmt(referral.bonus) }].map(({ label, value }) => (
                  <div key={label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 12px' }}>
                    <div className="numeric" style={{ fontSize: 18, fontWeight: 800, color: '#22c58b', fontFamily: 'var(--font-heading)' }}>{value}</div>
                    <div style={{ fontSize: 11, color: 'hsl(215,16%,55%)', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/app/referral')}
                style={{ width: '100%', padding: '9px', background: 'rgba(34,197,139,0.15)', border: '1px solid rgba(34,197,139,0.3)', borderRadius: 10, color: '#22c58b', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Star size={13} fill="#22c58b" />Ver Programa Completo <ChevronRight size={12} />
              </button>
            </div>
          )}

          {/* Card KYC / Estado */}
          <div style={{
            background: isVerified ? 'rgba(34,197,139,0.07)' : 'rgba(255,190,11,0.06)',
            border: `1px solid ${isVerified ? 'rgba(34,197,139,0.2)' : 'rgba(255,190,11,0.2)'}`,
            borderRadius: 16, padding: '16px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, background: isVerified ? 'rgba(34,197,139,0.15)' : 'rgba(255,190,11,0.12)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 20 }}>{isVerified ? '✅' : '📋'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: isVerified ? '#22c58b' : '#FFBE0B' }}>
                  {isVerified ? '✓ Identidade Verificada' : 'KYC Pendente'}
                </div>
                <div style={{ fontSize: 11, color: 'hsl(215,16%,55%)', marginTop: 2 }}>
                  {isVerified ? 'Acesso completo à plataforma' : 'Envie os seus documentos'}
                </div>
              </div>
            </div>
            {!isVerified && (
              <button onClick={() => navigate('/app/profile')}
                style={{ width: '100%', marginTop: 12, padding: '8px', background: 'rgba(58,134,255,0.12)', border: '1px solid rgba(58,134,255,0.25)', borderRadius: 9, color: '#3A86FF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Verificar Agora →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── CTA Negociar ── */}
      <button onClick={() => navigate('/app/trade')}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(58,134,255,0.18) 0%, rgba(34,197,139,0.10) 100%)',
          border: '1px solid rgba(58,134,255,0.3)', borderRadius: 18, cursor: 'pointer', width: '100%',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(58,134,255,0.25) 0%, rgba(34,197,139,0.15) 100%)'; e.currentTarget.style.borderColor = 'rgba(58,134,255,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(58,134,255,0.18) 0%, rgba(34,197,139,0.10) 100%)'; e.currentTarget.style.borderColor = 'rgba(58,134,255,0.3)'; }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, background: 'rgba(58,134,255,0.2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingUp size={22} color="#3A86FF" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800, color: '#f3f5ff' }}>Mercados Abertos</div>
            <div style={{ fontSize: 12, color: 'hsl(215,16%,60%)', marginTop: 2 }}>Forex · Cripto · Ações · Metais · Commodities</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, background: '#22c58b', borderRadius: '50%', animation: 'shimmer 2s ease infinite' }} />
          <span style={{ fontSize: 12, color: '#22c58b', fontWeight: 700 }}>Tempo Real</span>
          <ArrowRight size={18} color="#3A86FF" />
        </div>
      </button>
    </div>
  );
}
