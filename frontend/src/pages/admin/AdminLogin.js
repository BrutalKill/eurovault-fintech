import { useLang } from '../../context/LangContext';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Shield, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import LangSwitcher from '../../components/LangSwitcher';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [form, setForm]       = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState('');

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
      if (!res.ok) throw new Error(data.detail || t('adm_login_error'));
      localStorage.setItem('adminToken', data.token);
      toast.success(t('adm_login_success'));
      navigate('/adm');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: '#f3f5ff',
    fontSize: 15, outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .2s, background .2s',
    fontFamily: 'inherit',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#04040f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: 24,
    }}>

      {/* ── Fundo luxuoso ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* Textura de pontos dourados */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,190,11,0.08) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        {/* Orbs de luz */}
        <div style={{ position:'absolute', top:'-15%', left:'30%', width:600, height:600, background:'radial-gradient(circle, rgba(58,134,255,0.12) 0%, transparent 65%)', borderRadius:'50%', filter:'blur(40px)' }} />
        <div style={{ position:'absolute', bottom:'-10%', right:'20%', width:500, height:500, background:'radial-gradient(circle, rgba(255,190,11,0.07) 0%, transparent 65%)', borderRadius:'50%', filter:'blur(40px)' }} />
        <div style={{ position:'absolute', top:'40%', left:'-10%', width:400, height:400, background:'radial-gradient(circle, rgba(34,197,139,0.06) 0%, transparent 65%)', borderRadius:'50%', filter:'blur(50px)' }} />
        {/* Linhas diagonais finas */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(45deg, rgba(255,190,11,0.015) 0px, rgba(255,190,11,0.015) 1px, transparent 1px, transparent 40px)', backgroundSize:'40px 40px' }} />
      </div>

      {/* ── Card central premium ── */}
      <div style={{
        width: '100%', maxWidth: 420,
        position: 'relative', zIndex: 1,
      }}>
        {/* Brilho dourado atrás do card */}
        <div style={{
          position:'absolute', top:-20, left:-20, right:-20, bottom:-20,
          background:'radial-gradient(ellipse at center, rgba(255,190,11,0.08) 0%, transparent 60%)',
          borderRadius:28, filter:'blur(12px)', pointerEvents:'none',
        }} />

        <div style={{
          background:'linear-gradient(160deg, rgba(14,14,28,0.97) 0%, rgba(8,8,18,0.98) 100%)',
          border:'1px solid rgba(255,190,11,0.15)',
          borderRadius:22,
          padding:'40px 36px',
          boxShadow:[
            '0 40px 80px rgba(0,0,0,0.8)',
            '0 0 0 1px rgba(255,255,255,0.04) inset',
            '0 1px 0 rgba(255,190,11,0.15) inset',
          ].join(','),
          position:'relative', overflow:'hidden',
        }}>

          {/* Barra dourada no topo */}
          <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:2, background:'linear-gradient(90deg, transparent, #FFBE0B, transparent)', borderRadius:2 }} />

          {/* Banner de acesso restrito */}
          <div style={{
            display:'flex', alignItems:'center', gap:9,
            padding:'10px 14px', marginBottom:28,
            background:'rgba(239,68,68,0.07)',
            border:'1px solid rgba(239,68,68,0.18)',
            borderRadius:10,
          }}>
            <AlertTriangle size={13} color="#ef4444" />
            <span style={{ fontSize:12, color:'rgba(239,68,68,0.9)', fontWeight:600, letterSpacing:'0.02em' }}>{t('adm_login_title')} — {t('adm_login_subtitle')}</span>
          </div>

          {/* LangSwitcher no login */}
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:20 }}>
            <LangSwitcher compact />
          </div>

          {/* Logo + Título */}
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ position:'relative', width:64, height:64, margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1px solid rgba(255,190,11,0.35)', background:'radial-gradient(circle, rgba(255,190,11,0.08), transparent 70%)' }} />
              <div style={{ position:'absolute', inset:4, borderRadius:'50%', border:'1px solid rgba(255,190,11,0.15)' }} />
              <img src="/logo-eurovault.png" alt="EuroVault" style={{ width:38, height:38, objectFit:'contain', position:'relative', zIndex:1 }} />
            </div>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:19, fontWeight:900, color:'#f3f5ff', letterSpacing:'-0.01em' }}>EuroVault</div>
            <div style={{ fontSize:10, color:'#FFBE0B', fontWeight:700, letterSpacing:'0.2em', marginTop:2 }}>INVESTMENTS</div>
            <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(255,190,11,0.2),transparent)', margin:'14px 0' }} />
            <h2 style={{ fontFamily:'var(--font-heading)', fontSize:24, fontWeight:800, color:'#ffffff', margin:0, letterSpacing:'-0.01em' }}>{t('adm_login_title')}</h2>
            <p style={{ fontSize:12, color:'hsl(215,16%,50%)', margin:'5px 0 0', letterSpacing:'0.02em' }}>EuroVault CRM — {t('adm_login_subtitle')}</p>
          </div>

          {/* Erro */}
          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 13px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:9, marginBottom:16 }}>
              <AlertTriangle size={13} color="#ef4444" />
              <span style={{ fontSize:12, color:'#ef4444' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* Utilizador */}
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'hsl(215,16%,55%)', marginBottom:7, textTransform:'uppercase', letterSpacing:'0.1em' }}>{t('adm_login_user')}</label>
              <input
                data-testid="admin-username-input"
                type="text" autoComplete="username" required
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder={t('adm_login_user')}
                style={inp}
                onFocus={e => { e.target.style.borderColor='rgba(255,190,11,0.5)'; e.target.style.background='rgba(255,190,11,0.04)'; }}
                onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.04)'; }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'hsl(215,16%,55%)', marginBottom:7, textTransform:'uppercase', letterSpacing:'0.1em' }}>{t('adm_login_password')}</label>
              <div style={{ position:'relative' }}>
                <input
                  data-testid="admin-password-input"
                  type={showPass ? 'text' : 'password'} autoComplete="current-password" required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••••"
                  style={{ ...inp, paddingRight: 44 }}
                  onFocus={e => { e.target.style.borderColor='rgba(255,190,11,0.5)'; e.target.style.background='rgba(255,190,11,0.04)'; }}
                  onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.04)'; }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'hsl(215,16%,45%)', padding:0 }}>
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {/* Botão */}
            <button
              data-testid="admin-login-submit-button"
              type="submit" disabled={loading}
              style={{
                width:'100%', padding:'14px',
                background: loading ? 'rgba(255,190,11,0.3)' : 'linear-gradient(135deg, #cc9a00, #FFBE0B, #f0a800)',
                border:'none', borderRadius:13,
                color:'#06061a', fontSize:15, fontWeight:900,
                cursor: loading ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                fontFamily:'var(--font-heading)', letterSpacing:'0.03em',
                boxShadow: loading ? 'none' : '0 4px 24px rgba(255,190,11,0.35), 0 0 0 1px rgba(255,190,11,0.1)',
                transition:'opacity .2s, transform .1s',
                marginTop:6,
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.opacity='0.9'; e.currentTarget.style.transform='translateY(-1px)'; }}}
              onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='translateY(0)'; }}
            >
              {loading ? (
                <><div style={{ width:16, height:16, border:'2px solid rgba(0,0,0,0.3)', borderTopColor:'#06061a', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />{t('adm_login_loading')}</>
              ) : (
                <><Lock size={15}/>{t('adm_login_btn')}<ArrowRight size={15}/></>
              )}
            </button>
          </form>

          {/* Rodapé */}
          <div style={{ marginTop:20, padding:'10px 14px', background:'rgba(34,197,139,0.05)', border:'1px solid rgba(34,197,139,0.12)', borderRadius:9, display:'flex', alignItems:'center', gap:8 }}>
            <Lock size={11} color="#22c58b" />
            <span style={{ fontSize:11, color:'hsl(215,16%,50%)' }}>Sessão encriptada e registada por auditoria.</span>
          </div>

          {/* Selos */}
          <div style={{ display:'flex', gap:6, marginTop:16, justifyContent:'center', flexWrap:'wrap' }}>
            {['CMVM 327', 'MiFID II', 'SSL 256-bit'].map(b => (
              <span key={b} style={{ fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:5, background:'rgba(255,190,11,0.06)', border:'1px solid rgba(255,190,11,0.15)', color:'rgba(255,190,11,0.7)', letterSpacing:'0.07em' }}>{b}</span>
            ))}
          </div>

          {/* Barra dourada no fundo */}
          <div style={{ position:'absolute', bottom:0, left:'30%', right:'30%', height:1, background:'linear-gradient(90deg, transparent, rgba(255,190,11,0.15), transparent)' }} />
        </div>
      </div>
    </div>
  );
}
