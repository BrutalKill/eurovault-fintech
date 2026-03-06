import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, TrendingUp, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

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
      // Pedir permissão para notificações push
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      toast.success('Sessão iniciada com sucesso!');
      navigate('/app/trade');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(240,33%,5%)', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(900px circle at 20% 10%, rgba(58,134,255,0.12), transparent 60%), radial-gradient(700px circle at 85% 25%, rgba(255,190,11,0.07), transparent 55%)' }} />

      {/* Painel esquerdo */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 60px' }} className="hide-mobile">
        <div style={{ maxWidth: 480 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <img src="/logo-eurovault.png" alt="EuroVault Investments" style={{ width: 60, height: 60, objectFit: 'contain' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff' }}>EuroVault</div>
              <div style={{ fontSize: 13, color: 'hsl(46,100%,52%)', fontWeight: 600, letterSpacing: '0.05em' }}>Investments</div>
            </div>
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 40, fontWeight: 700, color: '#f3f5ff', marginBottom: 16, lineHeight: 1.2 }}>Invista com<br />EuroVault</h1>
          <p style={{ fontSize: 16, color: 'hsl(215,16%,70%)', marginBottom: 40, lineHeight: 1.6 }}>Aceda a mercados europeus e globais com uma plataforma segura, regulamentada e focada nos seus objectivos financeiros.</p>
          {[
            { icon: Shield,     text: 'Regulamentado pela ESMA e CySEC' },
            { icon: Lock,       text: 'Encriptação SSL de 256 bits' },
            { icon: TrendingUp, text: 'Operações em tempo real' },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, background: 'rgba(58,134,255,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={15} color="hsl(214,100%,60%)" />
              </div>
              <span style={{ fontSize: 14, color: 'hsl(215,16%,70%)' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card de login */}
      <div style={{ width: '100%', maxWidth: 440, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 20, padding: '40px 36px', boxShadow: '0 18px 48px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <img src="/logo-eurovault.png" alt="EuroVault" style={{ width: 48, height: 48, objectFit: 'contain' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#f3f5ff' }}>EuroVault</div>
              <div style={{ fontSize: 11, color: 'hsl(46,100%,52%)', fontWeight: 600 }}>Investments</div>
            </div>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#f3f5ff', marginBottom: 6 }}>Iniciar Sessão</h2>
          <p style={{ fontSize: 13, color: 'hsl(215,16%,70%)', marginBottom: 28 }}>Bem-vindo. Introduza as suas credenciais de acesso.</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Endereço de E-mail</label>
              <input data-testid="login-email-input" type="email" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="o_seu_email@exemplo.pt"
                style={{ width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Palavra-passe</label>
              <div style={{ position: 'relative' }}>
                <input data-testid="login-password-input" type={showPass ? 'text' : 'password'} required
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '11px 44px 11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(215,16%,70%)', padding: 0 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button data-testid="login-submit-button" type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px', background: loading ? 'hsl(214,100%,60%,0.5)' : 'hsl(214,100%,60%)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
              {loading ? 'A autenticar…' : 'Entrar'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <span style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>Não tem conta? </span>
            <Link data-testid="login-register-link" to="/register"
              style={{ fontSize: 13, color: 'hsl(214,100%,60%)', fontWeight: 600, textDecoration: 'none' }}>Criar conta gratuita</Link>
          </div>
          <div style={{ marginTop: 20, padding: '12px 14px', background: 'hsl(240,18%,12%)', borderRadius: 10, border: '1px solid hsl(240,16%,22%)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={12} color="hsl(155,72%,45%)" />
            <span style={{ fontSize: 11, color: 'hsl(215,16%,70%)' }}>Ligação segura e encriptada. Os seus dados estão protegidos.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
