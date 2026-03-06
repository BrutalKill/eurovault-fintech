import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '../context/LangContext';
import LangSwitcher from '../components/LangSwitcher';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const COUNTRIES = ['Portugal','Espanha','França','Alemanha','Itália','Países Baixos','Bélgica','Suíssa','Suécia','Noruega','Dinamarca','Polónia','Hungria','República Checa','Ruménia','Brasil','Reino Unido','Outro'];

export default function Register() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', country: 'Portugal', phone: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao criar conta');
      localStorage.setItem('token', data.token);
      toast.success('Conta criada com sucesso!');
      navigate('/app/trade');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(240,33%,5%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(900px circle at 20% 10%, rgba(58,134,255,0.12), transparent 60%), radial-gradient(700px circle at 85% 25%, rgba(255,190,11,0.07), transparent 55%)' }} />

      {/* Seletor de idioma */}
      <div style={{ position: 'absolute', top: 20, right: 24, zIndex: 10 }}>
        <LangSwitcher />
      </div>

      <div style={{ width: '100%', maxWidth: 480, background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 20, padding: '40px 36px', boxShadow: '0 18px 48px rgba(0,0,0,0.5)', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <img src="/logo-eurovault.png" alt="EuroVault" style={{ width: 48, height: 48, objectFit: 'contain' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#f3f5ff' }}>EuroVault</div>
            <div style={{ fontSize: 11, color: 'hsl(46,100%,52%)', fontWeight: 600 }}>Investments</div>
          </div>
        </div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#f3f5ff', marginBottom: 6 }}>{t('reg_title')}</h2>
        <p style={{ fontSize: 13, color: 'hsl(215,16%,70%)', marginBottom: 28 }}>{t('reg_subtitle')}</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            [t('reg_name'),  'full_name', 'text',  t('reg_name_ph'),  true],
            [t('reg_email'), 'email',     'email', t('reg_email_ph'), true],
            [t('profile_phone'), 'phone', 'tel',   '+351 912 345 678', false],
          ].map(([label, key, type, placeholder, required]) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input data-testid={`register-${key}-input`} type={type} required={required}
                value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder} style={inputStyle} />
            </div>
          ))}
          <div>
            <label style={labelStyle}>{t('profile_country')}</label>
            <select value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} style={inputStyle}>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{t('reg_password')}</label>
            <div style={{ position: 'relative' }}>
              <input data-testid="register-password-input" type={showPass ? 'text' : 'password'} required minLength={6}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder={t('reg_password_ph')} style={{ ...inputStyle, paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(215,16%,70%)', padding: 0 }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button data-testid="register-submit-button" type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', background: loading ? 'hsl(214,100%,60%,0.5)' : 'hsl(214,100%,60%)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
            {loading ? t('reg_loading') : t('reg_btn')}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>{t('reg_have_account')} </span>
          <Link to="/login" style={{ fontSize: 13, color: 'hsl(214,100%,60%)', fontWeight: 600, textDecoration: 'none' }}>{t('reg_login')}</Link>
        </div>
        <div style={{ marginTop: 16, padding: '10px 14px', background: 'hsl(240,18%,12%)', borderRadius: 10, border: '1px solid hsl(240,16%,22%)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={12} color="hsl(155,72%,45%)" />
          <span style={{ fontSize: 11, color: 'hsl(215,16%,70%)' }}>{t('reg_terms')}</span>
        </div>
      </div>
    </div>
  );
}
