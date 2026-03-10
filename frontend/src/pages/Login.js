import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, TrendingUp, Eye, EyeOff, ArrowRight, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '../context/LangContext';
import LangSwitcher from '../components/LangSwitcher';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

/* ── Ticker de cotações animado ── */
const TICKER_ITEMS = [
  { label: 'EUR/USD', price: '1,0847', change: '+0,12%', pos: true  },
  { label: 'BTC/USD', price: '95.420', change: '+2,34%', pos: true  },
  { label: 'GOLD',    price: '2.032',  change: '+0,38%', pos: true  },
  { label: 'S&P 500', price: '5.117',  change: '+0,67%', pos: true  },
  { label: 'ETH/USD', price: '3.285',  change: '+1,82%', pos: true  },
  { label: 'GBP/USD', price: '1,2634', change: '+0,08%', pos: true  },
  { label: 'NASDAQ',  price: '17.890', change: '-0,22%', pos: false },
  { label: 'EUR/GBP', price: '0,8585', change: '+0,03%', pos: true  },
  { label: 'CRUDE OIL',price: '78,42', change: '-0,85%', pos: false },
  { label: 'SILVER',  price: '22,85',  change: '-0,21%', pos: false },
];

/* ── Estatísticas hero ── */
const STATS = [
  { value: '€2.4B',  label: 'Volume gerido'   },
  { value: '150k+',  label: 'Investidores'     },
  { value: '99.9%',  label: 'Uptime'           },
  { value: '24/7',   label: 'Suporte activo'   },
];

export default function Login() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [tick, setTick] = useState(0);

  /* Animated counter for stats */
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Credenciais inválidas');
      localStorage.setItem('token', data.token);
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      toast.success('Sessão iniciada com sucesso!');
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#06061a', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* ── Fundo: imagem de cidade + overlay ── */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(https://images.unsplash.com/photo-1630983410779-88aba3aac0ce?crop=entropy&cs=srgb&fm=jpg&q=80&w=1920)`,
        backgroundSize: 'cover', backgroundPosition: 'center 30%',
        opacity: 0.38,
      }} />

      {/* ── Gradient overlay — mais leve no mobile para ver a imagem ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 80% 60% at 10% 20%, rgba(58,134,255,0.22) 0%, transparent 70%),
          radial-gradient(ellipse 60% 50% at 90% 80%, rgba(255,190,11,0.10) 0%, transparent 60%),
          linear-gradient(180deg, rgba(6,6,26,0.45) 0%, rgba(6,6,26,0.65) 60%, rgba(6,6,26,0.92) 100%)
        `,
      }} />

      {/* ── Orbs animados ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[
          { w: 500, h: 500, top: '-10%', left: '-5%',  bg: 'rgba(58,134,255,0.08)',  blur: 120, dur: '20s' },
          { w: 400, h: 400, top: '50%',  left: '60%',  bg: 'rgba(255,190,11,0.06)',  blur: 100, dur: '25s' },
          { w: 300, h: 300, top: '10%',  left: '75%',  bg: 'rgba(34,197,139,0.07)',  blur: 80,  dur: '18s' },
          { w: 350, h: 350, top: '70%',  left: '10%',  bg: 'rgba(248,113,113,0.05)', blur: 90,  dur: '22s' },
        ].map((orb, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: orb.w, height: orb.h,
            top: orb.top, left: orb.left,
            background: orb.bg,
            borderRadius: '50%',
            filter: `blur(${orb.blur}px)`,
            animation: `orbFloat${i} ${orb.dur} ease-in-out infinite alternate`,
          }} />
        ))}
      </div>

      {/* ── Header ── */}
      <header style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/logo-eurovault.png" alt="EuroVault" style={{ width: 36, height: 36, objectFit: 'contain' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: '#f3f5ff', letterSpacing: '-0.01em' }}>EuroVault</div>
            <div style={{ fontSize: 9, color: 'hsl(46,100%,52%)', fontWeight: 700, letterSpacing: '0.1em' }}>INVESTMENTS</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LangSwitcher compact />
          <Link to="/register" style={{
            padding: '7px 14px', borderRadius: 9,
            border: '1px solid rgba(58,134,255,0.4)',
            color: 'hsl(214,100%,70%)', fontSize: 12, fontWeight: 600,
            textDecoration: 'none', background: 'rgba(58,134,255,0.08)',
            whiteSpace: 'nowrap',
          }} className="hide-mobile-inline">{t('login_create')}</Link>
        </div>
      </header>

      {/* ── Conteúdo principal ── */}
      <div style={{
        position: 'relative', zIndex: 10, flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 60,
        padding: '20px 80px',
        boxSizing: 'border-box',
      }} className="login-main">

        {/* ── Coluna esquerda: Hero ── */}
        <div style={{ flex: 1, maxWidth: 640, animation: 'fadeInUp 0.7s ease both', display: 'flex', flexDirection: 'column' }} className="hide-mobile">
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28,
            padding: '6px 16px', borderRadius: 20,
            background: 'rgba(58,134,255,0.12)',
            border: '1px solid rgba(58,134,255,0.3)',
          }}>
            <div style={{ width: 7, height: 7, background: '#22c58b', borderRadius: '50%', animation: 'shimmer 2s ease infinite' }} />
            <span style={{ fontSize: 12, color: 'hsl(214,100%,75%)', fontWeight: 700, letterSpacing: '0.05em' }}>
              MERCADOS ABERTOS · TEMPO REAL
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 3.5vw, 52px)',
            fontWeight: 800, color: '#ffffff', lineHeight: 1.08,
            marginBottom: 16, letterSpacing: '-0.03em',
            textShadow: '0 2px 20px rgba(0,0,0,0.8)',
          }}>
            {t('login_hero1')}<br />
            <span style={{
              background: 'linear-gradient(135deg, #3A86FF 0%, #22c58b 50%, #FFBE0B 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {t('login_hero2')}
            </span>
          </h1>

          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.80)', marginBottom: 28, lineHeight: 1.65, maxWidth: 460, textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}>
            {t('login_desc')}
          </p>

          {/* Estatísticas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 32, maxWidth: 340 }}>
            {STATS.map(({ value, label }) => (
              <div key={label} style={{
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, textAlign: 'left',
                backdropFilter: 'blur(8px)',
              }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#f3f5ff', fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em' }}>{value}</div>
                <div style={{ fontSize: 11, color: 'hsl(215,16%,55%)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            {[
              { icon: Shield,     text: t('login_reg1'), color: '#3A86FF' },
              { icon: Lock,       text: t('login_reg2'), color: '#22c58b' },
              { icon: TrendingUp, text: t('login_reg3'), color: '#FFBE0B' },
            ].map(({ icon: Icon, text, color }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 24, height: 24, background: `${color}18`, borderRadius: 7, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={12} color={color} />
                </div>
                <span style={{ fontSize: 11, color: 'hsl(215,16%,65%)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Coluna direita: Formulário ── */}
        <div style={{ width: 420, flexShrink: 0, animation: 'fadeInUp 0.9s ease both' }}>

          {/* Hero mobile — só aparece no mobile, acima do card */}
          <div style={{ textAlign: 'center', marginBottom: 20, padding: '0 8px' }} className="mobile-hero-text">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 12, padding: '5px 14px', borderRadius: 20, background: 'rgba(58,134,255,0.15)', border: '1px solid rgba(58,134,255,0.35)' }}>
              <div style={{ width: 6, height: 6, background: '#22c58b', borderRadius: '50%', animation: 'shimmer 2s ease infinite' }} />
              <span style={{ fontSize: 11, color: '#3A86FF', fontWeight: 700, letterSpacing: '0.05em' }}>MERCADOS EM TEMPO REAL</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: '0 0 8px', letterSpacing: '-0.02em', textShadow: '0 2px 16px rgba(0,0,0,0.9)' }}>
              {t('login_hero1')}<br />
              <span style={{ background: 'linear-gradient(135deg, #3A86FF, #22c58b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {t('login_hero2')}
              </span>
            </h1>
          </div>

          <div style={{
            background: 'rgba(8,8,22,0.82)',
            backdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 24, padding: '36px 28px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(58,134,255,0.08) inset',
          }}>
            {/* Cabeçalho do card */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 56, height: 56, margin: '0 auto 14px',
                background: 'linear-gradient(135deg, rgba(58,134,255,0.2), rgba(34,197,139,0.1))',
                borderRadius: 16, border: '1px solid rgba(58,134,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img src="/logo-eurovault.png" alt="EuroVault" style={{ width: 36, height: 36, objectFit: 'contain' }} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#ffffff', marginBottom: 6, letterSpacing: '-0.02em' }}>{t('login_title')}</h2>
              <p style={{ fontSize: 13, color: 'hsl(215,16%,60%)' }}>{t('login_subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(215,16%,65%)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{t('login_email')}</label>
                <input data-testid="login-email-input" type="email" required value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="exemplo@gmail.com"
                  style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#f3f5ff', fontSize: 16, outline: 'none', boxSizing: 'border-box', transition: 'border-color .2s' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(58,134,255,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(215,16%,65%)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{t('login_password')}</label>
                <div style={{ position: 'relative' }}>
                  <input data-testid="login-password-input" type={showPass ? 'text' : 'password'} required
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '12px 44px 12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#f3f5ff', fontSize: 16, outline: 'none', boxSizing: 'border-box', transition: 'border-color .2s' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(58,134,255,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(215,16%,55%)', padding: 0 }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button data-testid="login-submit-button" type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '13px',
                  background: loading
                    ? 'rgba(58,134,255,0.4)'
                    : 'linear-gradient(135deg, #2563eb 0%, #3A86FF 50%, #1d9bf0 100%)',
                  border: 'none', borderRadius: 12, color: '#fff',
                  fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: 'var(--font-heading)',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(58,134,255,0.4)',
                  transition: 'opacity .2s, transform .1s',
                  letterSpacing: '0.02em',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                {loading ? t('login_loading') : <>{t('login_btn')}<ArrowRight size={16} /></>}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <span style={{ fontSize: 13, color: 'hsl(215,16%,55%)' }}>{t('login_no_account')} </span>
              <Link data-testid="login-register-link" to="/register"
                style={{ fontSize: 13, color: '#3A86FF', fontWeight: 700, textDecoration: 'none' }}>{t('login_create')}</Link>
            </div>

            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(34,197,139,0.07)', borderRadius: 10, border: '1px solid rgba(34,197,139,0.15)' }}>
              <Lock size={12} color="#22c58b" />
              <span style={{ fontSize: 11, color: 'hsl(215,16%,58%)' }}>{t('login_secure')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Ticker de preços ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(8px)',
        overflow: 'hidden', height: 42,
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          display: 'flex', gap: 0,
          animation: 'tickerScroll 30s linear infinite',
          whiteSpace: 'nowrap',
        }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 28px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'hsl(215,16%,70%)', letterSpacing: '0.05em' }}>{item.label}</span>
              <span className="numeric" style={{ fontSize: 12, fontWeight: 700, color: '#f3f5ff' }}>{item.price}</span>
              <span className="numeric" style={{ fontSize: 11, fontWeight: 700, color: item.pos ? '#22c58b' : '#ef4444' }}>{item.change}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
