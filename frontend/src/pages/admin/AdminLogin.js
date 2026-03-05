import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'hsl(240,33%,5%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(600px circle at 50% 30%, rgba(58,134,255,0.08), transparent 60%)' }} />

      <div style={{ width: '100%', maxWidth: 400, background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 20, padding: '36px 32px', boxShadow: '0 18px 48px rgba(0,0,0,0.6)', position: 'relative' }}>
        {/* Security banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, padding: '10px 14px', background: 'hsl(36,95%,55%,0.08)', borderRadius: 10, border: '1px solid hsl(36,95%,55%,0.2)' }}>
          <ShieldAlert size={14} color="hsl(36,95%,55%)" />
          <span style={{ fontSize: 11, color: 'hsl(215,16%,70%)' }}>Acesso restrito. Apenas pessoal autorizado.</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 36, height: 36, background: 'hsl(46,100%,52%)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={18} color="#000" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#f3f5ff' }}>BrokerEurope</div>
            <div style={{ fontSize: 10, color: 'hsl(46,100%,52%)', fontWeight: 700, letterSpacing: '0.1em' }}>PAINEL ADM</div>
          </div>
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff', marginBottom: 20 }}>Autenticar</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Utilizador</label>
            <input
              data-testid="admin-login-username-input"
              type="text" required
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="brokereurope"
              style={{ width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                data-testid="admin-login-password-input"
                type={showPass ? 'text' : 'password'} required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                style={{ width: '100%', padding: '11px 44px 11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(215,16%,70%)', padding: 0 }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            data-testid="admin-login-submit-button"
            type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', background: loading ? 'hsl(46,100%,52%,0.4)' : 'hsl(46,100%,52%)', border: 'none', borderRadius: 10, color: '#000', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}
          >
            {loading ? 'A verificar...' : 'Entrar no Painel'}
          </button>
        </form>

        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'hsl(240,18%,12%)', borderRadius: 10 }}>
          <Lock size={11} color="hsl(155,72%,45%)" />
          <span style={{ fontSize: 11, color: 'hsl(215,16%,70%)' }}>Sessão encriptada e registada por auditoria.</span>
        </div>
      </div>
    </div>
  );
}
