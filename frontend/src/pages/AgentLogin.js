import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function AgentLogin() {
  const navigate = useNavigate();
  const [form, setForm]         = useState({ email: '', password: '' });
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/agent/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Credenciais inválidas');
      localStorage.setItem('agentToken', data.token);
      toast.success(`Bem-vindo, ${data.agent.full_name}!`);
      navigate('/crm');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '13px 14px', fontSize: 15,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: '#f3f5ff', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color .2s, background .2s', fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#04040f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Fundo */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(58,134,255,0.07) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-10%', left: '30%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(58,134,255,0.10) 0%, transparent 65%)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        {/* Glow */}
        <div style={{ position: 'absolute', top: -20, left: -20, right: -20, bottom: -20, background: 'radial-gradient(ellipse at center, rgba(58,134,255,0.06) 0%, transparent 60%)', borderRadius: 28, filter: 'blur(12px)', pointerEvents: 'none' }} />

        <div style={{ background: 'linear-gradient(160deg, rgba(14,14,28,0.97), rgba(8,8,18,0.98))', border: '1px solid rgba(58,134,255,0.15)', borderRadius: 22, padding: '38px 34px', boxShadow: '0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 1px 0 rgba(58,134,255,0.15) inset', position: 'relative', overflow: 'hidden' }}>

          {/* Barra azul no topo */}
          <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, background: 'linear-gradient(90deg, transparent, #3A86FF, transparent)', borderRadius: 2 }} />

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 60, height: 60, margin: '0 auto 14px', background: 'rgba(58,134,255,0.1)', border: '1px solid rgba(58,134,255,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={26} color="#3A86FF" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <img src="/logo-eurovault.png" alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800, color: '#f3f5ff' }}>EuroVault</span>
            </div>
            <div style={{ fontSize: 10, color: '#3A86FF', fontWeight: 700, letterSpacing: '0.18em', marginTop: 4 }}>CRM AGENTES</div>
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(58,134,255,0.2), transparent)', margin: '14px 0' }} />
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Entrar</h2>
            <p style={{ fontSize: 12, color: 'hsl(215,16%,50%)', margin: '5px 0 0' }}>Acesso exclusivo para agentes autorizados</p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 9, marginBottom: 16 }}>
              <AlertTriangle size={13} color="#ef4444" />
              <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(215,16%,55%)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.1em' }}>E-mail</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="agente@eurovault.eu" style={inp}
                onFocus={e => { e.target.style.borderColor = 'rgba(58,134,255,0.5)'; e.target.style.background = 'rgba(58,134,255,0.04)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(215,16%,55%)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" style={{ ...inp, paddingRight: 44 }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(58,134,255,0.5)'; e.target.style.background = 'rgba(58,134,255,0.04)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(215,16%,45%)', padding: 0 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '13px', background: loading ? 'rgba(58,134,255,0.3)' : 'linear-gradient(135deg, #2563eb, #3A86FF)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-heading)', boxShadow: loading ? 'none' : '0 4px 20px rgba(58,134,255,0.4)', marginTop: 4 }}>
              {loading ? <>A autenticar…</> : <><Lock size={14} />Entrar no CRM</>}
            </button>
          </form>

          <div style={{ marginTop: 18, padding: '9px 13px', background: 'rgba(34,197,139,0.05)', border: '1px solid rgba(34,197,139,0.12)', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Lock size={11} color="#22c58b" />
            <span style={{ fontSize: 11, color: 'hsl(215,16%,50%)' }}>Sessão encriptada e registada.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
