import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '../context/LangContext';
import LangSwitcher from '../components/LangSwitcher';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function AgentLogin() {
  const navigate = useNavigate();
  const { t } = useLang();
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || t('agent_login_error'));
      localStorage.setItem('agentToken', data.token);
      toast.success(t('adm_login_success'));
      navigate('/crm');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
    color: '#f3f5ff', fontSize: 15, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0A1628 0%, #06061a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      {/* LangSwitcher no topo direito */}
      <div style={{ position: 'absolute', top: 20, right: 24 }}>
        <LangSwitcher />
      </div>

      <div style={{ width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '36px 32px', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, background: 'rgba(34,197,139,0.12)', border: '2px solid rgba(34,197,139,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Users size={24} color="#22c58b" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
            {t('agent_login_title')}
          </h2>
          <p style={{ fontSize: 12, color: 'hsl(215,16%,50%)', margin: 0 }}>
            {t('agent_login_subtitle')}
          </p>
        </div>

        {/* Erro */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 9, marginBottom: 16 }}>
            <AlertTriangle size={13} color="#ef4444" />
            <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(215,16%,55%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('agent_login_email')}</label>
            <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="agent@eurovault.eu" autoComplete="email" style={inp}
              onFocus={e => e.target.style.borderColor = 'rgba(34,197,139,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(215,16%,55%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('agent_login_password')}</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} required value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••" autoComplete="current-password"
                style={{ ...inp, paddingRight: 44 }}
                onFocus={e => e.target.style.borderColor = 'rgba(34,197,139,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(215,16%,45%)', padding: 0 }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', background: loading ? 'rgba(34,197,139,0.3)' : 'linear-gradient(135deg, #15803d, #22c58b)', border: 'none', borderRadius: 13, color: '#fff', fontSize: 14, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-heading)', boxShadow: loading ? 'none' : '0 4px 20px rgba(34,197,139,0.35)', marginTop: 4 }}>
            {loading ? (
              <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />{t('agent_login_loading')}</>
            ) : (
              <><Lock size={15} />{t('agent_login_btn')}</>
            )}
          </button>
        </form>

        <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(34,197,139,0.04)', border: '1px solid rgba(34,197,139,0.1)', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={11} color="#22c58b" />
          <span style={{ fontSize: 11, color: 'hsl(215,16%,45%)' }}>{t('adm_login_audit')}</span>
        </div>
      </div>
    </div>
  );
}
