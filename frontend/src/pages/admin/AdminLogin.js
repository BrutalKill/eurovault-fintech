import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Shield, Users, TrendingUp, BarChart2, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Mini KPI cards decorativos no lado esquerdo
const KPI_CARDS = [
  { icon: Users,       label: 'Leads Activos',     value: '—',    color: '#3A86FF' },
  { icon: TrendingUp,  label: 'Capital Gerido',     value: '—',    color: '#22c58b' },
  { icon: BarChart2,   label: 'Ordens Hoje',        value: '—',    color: '#FFBE0B' },
  { icon: Shield,      label: 'Sistema Seguro',     value: '100%', color: '#a855f7' },
];

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Credenciais inválidas');
      localStorage.setItem('adminToken', data.token);
      toast.success('Acesso concedido!');
      navigate('/adm');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#06061a',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── Fundo animado ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* Grid de pontos */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(58,134,255,0.15) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        {/* Gradientes */}
        <div style={{
          position: 'absolute', inset: 0,
          background: [
            'radial-gradient(ellipse 60% 50% at 0% 0%, rgba(58,134,255,0.18) 0%, transparent 60%)',
            'radial-gradient(ellipse 50% 60% at 100% 100%, rgba(34,197,139,0.12) 0%, transparent 60%)',
            'radial-gradient(ellipse 40% 40% at 50% 50%, rgba(168,85,247,0.06) 0%, transparent 70%)',
          ].join(',')
        }} />
        {/* Linhas decorativas */}
        {[20, 40, 60, 80].map(left => (
          <div key={left} style={{
            position: 'absolute', left: `${left}%`, top: 0, bottom: 0,
            width: 1, background: 'rgba(58,134,255,0.06)',
          }} />
        ))}
        {[25, 50, 75].map(top => (
          <div key={top} style={{
            position: 'absolute', top: `${top}%`, left: 0, right: 0,
            height: 1, background: 'rgba(58,134,255,0.04)',
          }} />
        ))}
      </div>

      {/* ── Painel esquerdo — Info CRM ── */}
      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 80px',
        position: 'relative', zIndex: 1,
      }} className="hide-mobile">

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 56 }}>
          <img src="/logo-eurovault.png" alt="EuroVault" style={{ width: 52, height: 52, objectFit: 'contain' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 900, color: '#f3f5ff', letterSpacing: '-0.02em' }}>EuroVault</div>
            <div style={{ fontSize: 10, color: '#FFBE0B', fontWeight: 700, letterSpacing: '0.15em' }}>ADMIN CRM</div>
          </div>
        </div>

        {/* Título */}
        <h1 style={{
          fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px,3.5vw,52px)',
          fontWeight: 900, color: '#ffffff', lineHeight: 1.1,
          marginBottom: 16, letterSpacing: '-0.03em',
          textShadow: '0 2px 20px rgba(0,0,0,0.5)',
        }}>
          Painel de
          <span style={{
            display: 'block',
            background: 'linear-gradient(135deg, #3A86FF, #22c58b)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Controlo
          </span>
        </h1>
        <p style={{ fontSize: 15, color: 'hsl(215,16%,65%)', marginBottom: 48, lineHeight: 1.6, maxWidth: 420 }}>
          Plataforma de gestão de clientes e investimentos.
          Acesso restrito a pessoal autorizado.
        </p>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 480 }}>
          {KPI_CARDS.map(({ icon: Icon, label, value, color }) => (
            <div key={label} style={{
              padding: '16px 18px',
              background: `${color}0a`,
              border: `1px solid ${color}20`,
              borderRadius: 14,
              display: 'flex', alignItems: 'center', gap: 12,
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ width: 38, height: 38, background: `${color}18`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={17} color={color} />
              </div>
              <div>
                <div className="numeric" style={{ fontSize: 17, fontWeight: 900, color, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>{value}</div>
                <div style={{ fontSize: 10, color: 'hsl(215,16%,55%)', marginTop: 1 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Selos de segurança */}
        <div style={{ display: 'flex', gap: 10, marginTop: 48, flexWrap: 'wrap' }}>
          {['CySEC Lic. 409/22', 'MiFID II', 'SSL 256-bit', 'Auditado'].map(badge => (
            <span key={badge} style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 6, background: 'rgba(58,134,255,0.08)', border: '1px solid rgba(58,134,255,0.2)', color: '#3A86FF', letterSpacing: '0.05em' }}>
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* ── Painel direito — Formulário ── */}
      <div style={{
        width: '100%', maxWidth: 460,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 32px',
        position: 'relative', zIndex: 1,
        flexShrink: 0,
      }}>
        <div style={{
          width: '100%',
          background: 'rgba(8,8,22,0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          padding: '40px 36px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>

          {/* Aviso de acesso restrito */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', marginBottom: 28,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10,
          }}>
            <AlertTriangle size={14} color="#ef4444" />
            <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>Acesso restrito — Apenas pessoal autorizado</span>
          </div>

          {/* Header do form */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, margin: '0 auto 14px', background: 'linear-gradient(135deg, rgba(58,134,255,0.2), rgba(34,197,139,0.1))', borderRadius: 16, border: '1px solid rgba(58,134,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={24} color="#3A86FF" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: '#f3f5ff', margin: '0 0 6px', letterSpacing: '-0.01em' }}>Autenticar</h2>
            <p style={{ fontSize: 13, color: 'hsl(215,16%,55%)', margin: 0 }}>EuroVault CRM — Área Administrativa</p>
          </div>

          {/* Erro */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, marginBottom: 18 }}>
              <AlertTriangle size={14} color="#ef4444" />
              <span style={{ fontSize: 13, color: '#ef4444' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Utilizador */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(215,16%,60%)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Utilizador</label>
              <input
                data-testid="admin-username-input"
                type="text" autoComplete="username" required
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="Identificador de acesso"
                style={{
                  width: '100%', padding: '13px 14px', fontSize: 15,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, color: '#f3f5ff', outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color .2s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(58,134,255,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(215,16%,60%)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  data-testid="admin-password-input"
                  type={showPass ? 'text' : 'password'} autoComplete="current-password" required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••••"
                  style={{
                    width: '100%', padding: '13px 44px 13px 14px', fontSize: 15,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, color: '#f3f5ff', outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color .2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(58,134,255,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(215,16%,50%)', padding: 0 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Botão */}
            <button
              data-testid="admin-login-submit-button"
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? 'rgba(58,134,255,0.3)' : 'linear-gradient(135deg, #2563eb, #3A86FF)',
                border: 'none', borderRadius: 13, color: '#fff',
                fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'var(--font-heading)', letterSpacing: '0.02em',
                boxShadow: loading ? 'none' : '0 4px 24px rgba(58,134,255,0.45)',
                transition: 'opacity .2s',
                marginTop: 4,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              {loading ? (
                <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />A autenticar…</>
              ) : (
                <><Lock size={15} />Entrar no Painel<ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Rodapé de segurança */}
          <div style={{ marginTop: 22, padding: '12px 14px', background: 'rgba(34,197,139,0.06)', border: '1px solid rgba(34,197,139,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={12} color="#22c58b" />
            <span style={{ fontSize: 11, color: 'hsl(215,16%,55%)' }}>Sessão encriptada e registada por auditoria.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
