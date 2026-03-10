import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '../context/LangContext';
import LangSwitcher from '../components/LangSwitcher';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Indicativos por país (ordem: mais comuns primeiro)
const DIAL_CODES = [
  { code: '+351', flag: '🇵🇹', name: 'Portugal'          },
  { code: '+34',  flag: '🇪🇸', name: 'Espanha'           },
  { code: '+33',  flag: '🇫🇷', name: 'França'            },
  { code: '+49',  flag: '🇩🇪', name: 'Alemanha'          },
  { code: '+39',  flag: '🇮🇹', name: 'Itália'            },
  { code: '+31',  flag: '🇳🇱', name: 'Países Baixos'     },
  { code: '+32',  flag: '🇧🇪', name: 'Bélgica'           },
  { code: '+41',  flag: '🇨🇭', name: 'Suíça'             },
  { code: '+46',  flag: '🇸🇪', name: 'Suécia'            },
  { code: '+47',  flag: '🇳🇴', name: 'Noruega'           },
  { code: '+45',  flag: '🇩🇰', name: 'Dinamarca'         },
  { code: '+48',  flag: '🇵🇱', name: 'Polónia'           },
  { code: '+36',  flag: '🇭🇺', name: 'Hungria'           },
  { code: '+420', flag: '🇨🇿', name: 'República Checa'   },
  { code: '+40',  flag: '🇷🇴', name: 'Roménia'           },
  { code: '+55',  flag: '🇧🇷', name: 'Brasil'            },
  { code: '+44',  flag: '🇬🇧', name: 'Reino Unido'       },
  { code: '+1',   flag: '🇺🇸', name: 'EUA'               },
  { code: '+54',  flag: '🇦🇷', name: 'Argentina'         },
  { code: '+52',  flag: '🇲🇽', name: 'México'            },
  { code: '+57',  flag: '🇨🇴', name: 'Colômbia'          },
  { code: '+56',  flag: '🇨🇱', name: 'Chile'             },
  { code: '+51',  flag: '🇵🇪', name: 'Peru'              },
  { code: '+351', flag: '🇵🇹', name: 'Outro'             },
];

const COUNTRIES = ['Portugal','Espanha','França','Alemanha','Itália','Países Baixos','Bélgica','Suíça','Suécia','Noruega','Dinamarca','Polónia','Hungria','República Checa','Roménia','Brasil','Reino Unido','Outro'];

export default function Register() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', country: 'Portugal', phone: '' });
  const [dialCode, setDialCode] = useState('+351');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fullPhone = form.phone ? `${dialCode} ${form.phone}` : '';
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, phone: fullPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao criar conta');
      localStorage.setItem('token', data.token);
      toast.success('Conta criada com sucesso!');
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // fontSize: 16 obrigatório para evitar zoom automático no iOS
  const inp = { width: '100%', padding: '12px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 16, outline: 'none', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };

  // Sincronizar indicativo quando país muda
  const handleCountryChange = (country) => {
    setForm(f => ({ ...f, country }));
    const found = DIAL_CODES.find(d => d.name === country);
    if (found) setDialCode(found.code);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(240,33%,5%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(900px circle at 20% 10%, rgba(58,134,255,0.12), transparent 60%), radial-gradient(700px circle at 85% 25%, rgba(255,190,11,0.07), transparent 55%)' }} />

      <div style={{ position: 'absolute', top: 20, right: 24, zIndex: 10 }}>
        <LangSwitcher />
      </div>

      <div style={{ width: '100%', maxWidth: 480, background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 20, padding: '40px 36px', boxShadow: '0 18px 48px rgba(0,0,0,0.5)', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <img src="/logo-eurovault.png" alt="EuroVault" style={{ width: 48, height: 48, objectFit: 'contain' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#f3f5ff' }}>EuroVault</div>
            <div style={{ fontSize: 11, color: 'hsl(46,100%,52%)', fontWeight: 600 }}>Investments</div>
          </div>
        </div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>{t('reg_title')}</h2>
        <p style={{ fontSize: 13, color: 'hsl(215,16%,70%)', marginBottom: 24 }}>{t('reg_subtitle')}</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Nome */}
          <div>
            <label style={lbl}>{t('reg_name')}</label>
            <input data-testid="register-full_name-input" type="text" required
              value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
              placeholder={t('reg_name_ph')} style={inp} />
          </div>

          {/* E-mail */}
          <div>
            <label style={lbl}>{t('reg_email')}</label>
            <input data-testid="register-email-input" type="email" required
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder={t('reg_email_ph')} style={inp} />
          </div>

          {/* País */}
          <div>
            <label style={lbl}>{t('profile_country')}</label>
            <select value={form.country} onChange={e => handleCountryChange(e.target.value)}
              style={{ ...inp, appearance: 'none', WebkitAppearance: 'none' }}>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Telemóvel com indicativo */}
          <div>
            <label style={lbl}>{t('profile_phone')} <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(opcional)</span></label>
            <div style={{ display: 'flex', gap: 8 }}>
              {/* Seletor de indicativo */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <select
                  value={dialCode}
                  onChange={e => setDialCode(e.target.value)}
                  style={{
                    padding: '12px 32px 12px 10px',
                    background: 'hsl(240,18%,12%)',
                    border: '1px solid hsl(240,16%,22%)',
                    borderRadius: 10, color: '#f3f5ff', fontSize: 15,
                    outline: 'none', cursor: 'pointer',
                    appearance: 'none', WebkitAppearance: 'none',
                    minWidth: 90,
                  }}>
                  {DIAL_CODES.map((d, i) => (
                    <option key={i} value={d.code}>{d.flag} {d.code}</option>
                  ))}
                </select>
                <ChevronDown size={13} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#7a8299', pointerEvents: 'none' }} />
              </div>
              {/* Número */}
              <input
                data-testid="register-phone-input"
                type="tel" inputMode="numeric"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value.replace(/[^0-9 ()+-]/g, '') })}
                placeholder="912 345 678"
                style={{ ...inp, flex: 1 }}
              />
            </div>
            <div style={{ fontSize: 11, color: '#4a5068', marginTop: 4 }}>
              {dialCode} {form.phone || '000 000 000'}
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={lbl}>{t('reg_password')}</label>
            <div style={{ position: 'relative' }}>
              <input data-testid="register-password-input" type={showPass ? 'text' : 'password'} required minLength={6}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••" style={{ ...inp, paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(215,16%,70%)', padding: 0 }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button data-testid="register-submit-button" type="submit" disabled={loading}
            style={{ width: '100%', padding: '13px', background: loading ? 'hsl(214,100%,60%,0.5)' : 'hsl(214,100%,60%)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
            {loading ? t('reg_loading') : t('reg_btn')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <span style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>{t('reg_have_account')} </span>
          <Link to="/login" style={{ fontSize: 13, color: 'hsl(214,100%,60%)', fontWeight: 600, textDecoration: 'none' }}>{t('reg_login')}</Link>
        </div>
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'hsl(240,18%,12%)', borderRadius: 10, border: '1px solid hsl(240,16%,22%)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={12} color="hsl(155,72%,45%)" />
          <span style={{ fontSize: 11, color: 'hsl(215,16%,70%)' }}>{t('reg_terms')}</span>
        </div>
      </div>
    </div>
  );
}
