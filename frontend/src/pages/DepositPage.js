import React, { useState } from 'react';
import { Lock, Shield, CreditCard, CheckCircle, Star, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '../context/LangContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const COUNTRY_KEYS = [
  'country_portugal','country_espanha','country_franca','country_alemanha',
  'country_italia','country_paises_baixos','country_belgica','country_suica',
  'country_suecia','country_noruega','country_dinamarca','country_polonia',
  'country_hungria','country_republica_checa','country_romenia',
  'country_brasil','country_reino_unido','country_irlanda',
  'country_austria','country_grecia','country_finlandia','country_outro',
];

function formatCardNumber(val) {
  const d = val.replace(/\D/g, '').slice(0, 16);
  return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}
function formatExpiry(val) {
  const d = val.replace(/\D/g, '').slice(0, 4);
  return d.length >= 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
}
const detectBrand = (num) => {
  const n = (num || '').replace(/\s/g, '');
  if (n.startsWith('4'))          return { label: 'VISA',       gradient: 'linear-gradient(135deg,#1a237e,#283593)' };
  if (/^5[1-5]/.test(n)||/^2[2-7]/.test(n)) return { label: 'MASTERCARD', gradient: 'linear-gradient(135deg,#b71c1c,#880e4f)' };
  if (/^3[47]/.test(n))           return { label: 'AMEX',       gradient: 'linear-gradient(135deg,#004d99,#00695c)' };
  return { label: '',              gradient: 'linear-gradient(135deg,#1a1f3e,#0d1425)' };
};

/* Card visual em tempo real */
function CardPreview({ form, t }) {
  const brand = detectBrand(form.card_number);
  const digits = (form.card_number || '').replace(/\s/g, '').padEnd(16, '•');
  const d1 = digits.slice(0,4); const d2 = digits.slice(4,8);
  const d3 = digits.slice(8,12); const d4 = digits.slice(12,16);
  const expiry = form.expiry || (t ? t('dep_expiry').split('(')[0].trim() : 'MM/YY');
  const holder = form.full_name ? form.full_name.toUpperCase() : (t ? t('dep_cardholder').toUpperCase() : 'CARDHOLDER');

  return (
    <div style={{
      background: brand.gradient,
      borderRadius: 20, padding: '28px 28px 22px',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      aspectRatio: '1.586',
      width: '100%', maxWidth: 420, margin: '0 auto',
    }}>
      {/* Círculos decorativos */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: -60, right: 40, width: 160, height: 160, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', top: -20, left: -20, width: 100, height: 100, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />

      {/* Topo: logo + chip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, height: 28, background: 'linear-gradient(135deg,#FFD700 0%,#B8860B 50%,#FFD700 100%)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 22, height: 18, borderRadius: 3, border: '1px solid rgba(0,0,0,0.2)', background: 'linear-gradient(90deg,#FFD700,#B8860B)' }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, background: 'rgba(255,255,255,0.3)', borderRadius: '50%', animation: 'shimmer 2s ease infinite' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 700, letterSpacing: '0.1em' }}>
            {brand.label || 'EuroVault'}
          </span>
        </div>
      </div>

      {/* Número do cartão */}
      <div className="numeric" style={{ fontSize: 'clamp(16px,4vw,22px)', fontWeight: 700, color: '#fff', letterSpacing: '0.2em', fontFamily: 'monospace', marginBottom: 20, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
        {d1} {d2} {d3} {d4}
      </div>

      {/* Titular + validade */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 3 }}>
            {t ? t('dep_cardholder') : 'Titular'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.06em', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{holder}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 3 }}>
            {t ? t('dep_expiry').replace(' (MM/AA)','').replace(' (MM/YY)','').trim() : 'Valid Thru'}
          </div>
          <div className="numeric" style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.1em' }}>{expiry}</div>
        </div>
      </div>
    </div>
  );
}

export default function DepositPage() {
  const { t } = useLang();
  const [form, setForm] = useState({
    full_name: '', card_number: '', expiry: '', cvv: '',
    country: 'Portugal', postal_code: '', amount: '250',
  });
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress]     = useState(0);
  const [success, setSuccess]        = useState(false);
  const [activeField, setActiveField] = useState(null);

  const amountNum = parseFloat(form.amount) || 0;
  const amountFmt = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(amountNum);

  const simulateProgress = () => {
    let p = 0;
    return setInterval(() => {
      p += Math.random() * 15;
      if (p > 90) p = 90;
      setProgress(Math.floor(p));
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    const iv = simulateProgress();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      clearInterval(iv);
      setProgress(100);
      await new Promise(r => setTimeout(r, 600));
      if (res.ok) {
        setSuccess(true);
      } else {
        const d = await res.json();
        throw new Error(d.detail || 'Erro no depósito');
      }
    } catch (err) {
      clearInterval(iv);
      setProcessing(false);
      setProgress(0);
      toast.error(err.message || 'Ocorreu um erro. Tente novamente.');
    }
  };

  const inp = {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: '#f3f5ff', fontSize: 16,
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color .2s, background .2s',
  };
  const inpFocus = { background: 'rgba(58,134,255,0.06)', borderColor: 'rgba(58,134,255,0.6)' };
  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(215,16%,65%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' };

  /* Tela de sucesso */
  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 20, textAlign: 'center', padding: 24 }}>
        <div style={{ width: 80, height: 80, background: 'rgba(34,197,139,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(34,197,139,0.4)' }}>
          <CheckCircle size={40} color="#22c58b" />
        </div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#f3f5ff', margin: 0 }}>{t('dep_success_msg').split('!')[0]}!</h2>
        <p style={{ fontSize: 14, color: 'hsl(215,16%,65%)', maxWidth: 380, lineHeight: 1.6 }}>{t('dep_success_msg')}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 360 }}>
          {[
            { n:'1', label: t('dep_success_step1'), done:true },
            { n:'2', label: t('dep_success_step2'), done:false },
            { n:'3', label: t('dep_success_step3'), done:false },
          ].map(({ n, label, done }) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: done ? 'rgba(34,197,139,0.08)' : 'hsl(240,26%,8%)', border: `1px solid ${done ? 'rgba(34,197,139,0.2)' : 'hsl(240,16%,18%)'}`, borderRadius: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: done ? '#22c58b' : 'hsl(240,18%,20%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {done ? <CheckCircle size={14} color="#fff" /> : <span style={{ fontSize: 11, color: '#7a8299', fontWeight: 700 }}>{n}</span>}
              </div>
              <span style={{ fontSize: 13, color: done ? '#22c58b' : 'hsl(215,16%,65%)' }}>{label}</span>
            </div>
          ))}
        </div>
        <button onClick={() => { setSuccess(false); setProgress(0); setForm({ full_name:'',card_number:'',expiry:'',cvv:'',country:'Portugal',postal_code:'',amount:'250' }); }}
          style={{ padding: '12px 32px', background: '#3A86FF', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
          {t('dep_new')}
        </button>
      </div>
    );
  }

  /* Tela de processamento */
  if (processing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 20, textAlign: 'center' }}>
        <div style={{ position: 'relative', width: 80, height: 80 }}>
          <div style={{ position: 'absolute', inset: 0, border: '3px solid rgba(58,134,255,0.2)', borderTopColor: '#3A86FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ position: 'absolute', inset: 10, border: '2px solid rgba(34,197,139,0.2)', borderTopColor: '#22c58b', borderRadius: '50%', animation: 'spin 1.2s linear infinite reverse' }} />
          <Lock size={20} style={{ position: 'absolute', inset: 0, margin: 'auto', color: '#3A86FF' }} />
        </div>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff', margin: 0 }}>{t('dep_processing_msg')}</h3>
        <p style={{ fontSize: 13, color: '#7a8299', margin: 0 }}>{t('login_secure')}</p>
        <div style={{ width: '100%', maxWidth: 320 }}>
          <div style={{ height: 6, background: 'hsl(240,18%,14%)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#3A86FF,#22c58b)', borderRadius: 3, transition: 'width 0.3s ease' }} />
          </div>
          <div style={{ fontSize: 12, color: '#7a8299', marginTop: 8, textAlign: 'center' }}>{progress}%</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#f3f5ff', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{t('dep_title')}</h1>
        <p style={{ fontSize: 13, color: 'hsl(215,16%,60%)', margin: 0 }}>{t('dep_subtitle')}</p>
      </div>

      {/* Badges de segurança */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { icon: Lock,  label: 'SSL 256-bit',          color: '#22c58b' },
          { icon: Shield,label: 'PCI DSS',               color: '#3A86FF' },
          { icon: Zap,   label: t('dep_badge_instant'),  color: '#FFBE0B' },
          { icon: Star,  label: 'IFSB',                 color: '#a855f7' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: `${color}10`, border: `1px solid ${color}25`, borderRadius: 8 }}>
            <Icon size={12} color={color} />
            <span style={{ fontSize: 11, color, fontWeight: 700, letterSpacing: '0.04em' }}>{label}</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {[{l:'VISA',c:'#1a1fe8'},{l:'MC',c:'#eb5a03'},{l:'AMEX',c:'#007bc0'},{l:'MAESTRO',c:'#005498'}].map(({l,c}) => (
            <span key={l} style={{ fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 5, background: `${c}18`, border: `1px solid ${c}30`, color: c }}>{l}</span>
          ))}
        </div>
      </div>

      {/* Layout 2 colunas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }} className="deposit-grid">

        {/* ── Coluna esquerda: Formulário ── */}
        <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 20, padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Montante */}
            <div>
              <label style={lbl}>{t('dep_amount_hint') || t('dep_amount')}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#3A86FF', fontWeight: 800 }}>€</span>
                <input data-testid="deposit-amount-input" type="number" inputMode="decimal" min="10" required
                  value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  style={{ ...inp, paddingLeft: 36, fontSize: 22, fontWeight: 900, color: '#3A86FF',
                    ...(activeField === 'amount' ? inpFocus : {}) }}
                  onFocus={() => setActiveField('amount')} onBlur={() => setActiveField(null)} />
              </div>
              {/* Valores rápidos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 10 }}>
                {[250, 500, 1000, 2000].map(amt => (
                  <button key={amt} type="button" onClick={() => setForm({ ...form, amount: String(amt) })}
                    style={{ padding: '9px 4px', fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: 10,
                      border: `1px solid ${form.amount === String(amt) ? 'rgba(58,134,255,0.5)' : 'rgba(255,255,255,0.08)'}`,
                      background: form.amount === String(amt) ? 'rgba(58,134,255,0.15)' : 'rgba(255,255,255,0.03)',
                      color: form.amount === String(amt) ? '#3A86FF' : 'hsl(215,16%,70%)',
                      transition: 'all 0.15s' }}>
                    €{amt.toLocaleString('pt-PT')}
                  </button>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid hsl(240,16%,16%)', margin: 0 }} />

            {/* Nome */}
            <div>
              <label style={lbl}>{t('dep_cardholder')}</label>
              <input data-testid="deposit-cardholder-input" type="text" required
                value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                placeholder={t('prof_fullname_ph') || 'NOME APELIDO'}
                style={{ ...inp, textTransform: 'uppercase', letterSpacing: '0.06em', ...(activeField === 'name' ? inpFocus : {}) }}
                onFocus={() => setActiveField('name')} onBlur={() => setActiveField(null)} />
            </div>

            {/* Número do cartão */}
            <div>
              <label style={lbl}>{t('dep_card_number')}</label>
              <div style={{ position: 'relative' }}>
                <CreditCard size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: activeField === 'card' ? '#3A86FF' : 'hsl(215,16%,50%)' }} />
                <input data-testid="deposit-card-number-input" type="text" inputMode="numeric" required
                  value={form.card_number}
                  onChange={e => setForm({ ...form, card_number: formatCardNumber(e.target.value) })}
                  placeholder="1234 5678 9012 3456" maxLength={19}
                  className="card-input"
                  style={{ ...inp, paddingLeft: 42, letterSpacing: '0.15em', fontSize: 16, ...(activeField === 'card' ? inpFocus : {}) }}
                  onFocus={() => setActiveField('card')} onBlur={() => setActiveField(null)} />
              </div>
            </div>

            {/* Validade + CVV */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={lbl}>{t('dep_expiry')}</label>
                <input data-testid="deposit-expiry-input" type="text" inputMode="numeric" required
                  value={form.expiry} onChange={e => setForm({ ...form, expiry: formatExpiry(e.target.value) })}
                  placeholder={t('dep_expiry')?.includes('(') ? t('dep_expiry').match(/\(([^)]+)\)/)?.[1] || 'MM/YY' : 'MM/YY'} maxLength={5}
                  style={{ ...inp, ...(activeField === 'expiry' ? inpFocus : {}) }}
                  onFocus={() => setActiveField('expiry')} onBlur={() => setActiveField(null)} />
              </div>
              <div>
                <label style={lbl}>{t('dep_cvv')}</label>
                <input data-testid="deposit-cvv-input" type="text" inputMode="numeric" required
                  value={form.cvv} onChange={e => setForm({ ...form, cvv: e.target.value.replace(/\D/g,'').slice(0,4) })}
                  placeholder="123" maxLength={4}
                  style={{ ...inp, letterSpacing: '0.2em', ...(activeField === 'cvv' ? inpFocus : {}) }}
                  onFocus={() => setActiveField('cvv')} onBlur={() => setActiveField(null)} />
              </div>
            </div>

            {/* País + Postal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={lbl}>{t('dep_country')}</label>
                <select value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} style={{ ...inp }}>
                  {COUNTRY_KEYS.map(k => <option key={k} value={t(k)}>{t(k)}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>{t('dep_postal')}</label>
                <input data-testid="deposit-postal-code-input" type="text" inputMode="numeric" required
                  value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })}
                  placeholder="1000-001"
                  style={{ ...inp, ...(activeField === 'postal' ? inpFocus : {}) }}
                  onFocus={() => setActiveField('postal')} onBlur={() => setActiveField(null)} />
              </div>
            </div>

            {/* Botão submit */}
            <button data-testid="deposit-submit-button" type="submit"
              style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #2563eb, #3A86FF)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-heading)', boxShadow: '0 4px 24px rgba(58,134,255,0.5)', letterSpacing: '0.02em', transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <Lock size={16} />
              {t('dep_btn')} {amountFmt}
            </button>

            <p style={{ fontSize: 11, color: '#4a5068', textAlign: 'center', margin: 0 }}>{t('dep_secure_text')}</p>
          </form>
        </div>

        {/* ── Coluna direita: Preview + info ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'sticky', top: 80 }}>
          <CardPreview form={form} t={t} />

          {/* Resumo */}
          <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#7a8299', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{t('dep_summary')}</div>
            {[
              { label: t('dep_summary_amount'), value: amountFmt,         color: '#f3f5ff', large: true },
              { label: t('dep_summary_fee'),    value: t('dep_summary_free'), color: '#22c58b' },
              { label: t('dep_summary_total'),  value: amountFmt,         color: '#3A86FF' },
            ].map(({ label, value, color, large }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: label !== t('dep_summary_total') ? '1px solid hsl(240,16%,14%)' : 'none' }}>
                <span style={{ fontSize: 13, color: '#7a8299' }}>{label}</span>
                <span className="numeric" style={{ fontSize: large ? 16 : 13, fontWeight: large ? 800 : 700, color, fontFamily: large ? 'var(--font-heading)' : 'inherit' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Porquê EuroVault */}
          <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#7a8299', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{t('dep_why_title')}</div>
            {[
              { icon: '⚡', key: 'dep_why_1' }, { icon: '🔒', key: 'dep_why_2' },
              { icon: '🏆', key: 'dep_why_3' }, { icon: '💳', key: 'dep_why_4' },
              { icon: '📞', key: 'dep_why_5' },
            ].map(({ icon, key }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 15 }}>{icon}</span>
                <span style={{ fontSize: 12, color: 'hsl(215,16%,68%)' }}>{t(key)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
