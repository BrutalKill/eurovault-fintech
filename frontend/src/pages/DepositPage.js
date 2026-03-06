import React, { useState } from 'react';
import { Lock, Shield, CreditCard, CheckCircle, Clock, Headphones, Globe, Award } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const COUNTRIES = [
  'Portugal','Espanha','França','Alemanha','Itália','Países Baixos','Bélgica','Suíça',
  'Suécia','Noruega','Dinamarca','Polónia','Hungria','República Checa','Roménia',
  'Brasil','Reino Unido','Irlanda','Áustria','Grécia','Finlândia','Outro',
];

function formatCardNumber(val) {
  const d = val.replace(/\D/g, '').slice(0, 16);
  return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}
function formatExpiry(val) {
  const d = val.replace(/\D/g, '').slice(0, 4);
  return d.length >= 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
}

/* ── Componente de badge de pagamento ── */
function PayBadge({ label, color = '#3A86FF' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800,
      background: `${color}18`, border: `1px solid ${color}30`,
      color, letterSpacing: '0.05em', whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}

export default function DepositPage() {
  const [form, setForm] = useState({
    full_name: '', card_number: '', expiry: '', cvv: '',
    country: 'Portugal', postal_code: '', amount: '250',
  });
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress]     = useState(0);
  const [success, setSuccess]        = useState(false);

  // Helpers de formatação
  const amountNum   = parseFloat(form.amount) || 0;
  const amountFmt   = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(amountNum);
  const setAmount   = (val) => setForm(prev => ({ ...prev, amount: val }));

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
        body: JSON.stringify({
          ...form,
          card_number: form.card_number.replace(/\s/g, ''),
          amount: parseFloat(form.amount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao processar');
      clearInterval(iv);
      setProgress(100);
      setTimeout(() => { setProcessing(false); setSuccess(true); }, 500);
    } catch (err) {
      clearInterval(iv);
      setProcessing(false);
      setProgress(0);
      toast.error(err.message);
    }
  };

  const card  = { background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: 28 };
  const label = { display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };
  const inp   = { width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' };

  if (success) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', ...card, maxWidth: 440, width: '100%' }}>
          <div style={{ width: 72, height: 72, background: 'rgba(34,197,139,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={36} color="#22c58b" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 700, color: '#f3f5ff', marginBottom: 10 }}>Depósito Enviado!</h2>
          <p style={{ fontSize: 14, color: 'hsl(215,16%,70%)', marginBottom: 8, lineHeight: 1.7 }}>
            O seu pedido de depósito de <strong style={{ color: '#f3f5ff' }}>€{form.amount}</strong> foi recebido com sucesso.
          </p>
          <p style={{ fontSize: 13, color: 'hsl(215,16%,60%)', marginBottom: 28, lineHeight: 1.6 }}>
            O valor será creditado na sua conta em <strong style={{ color: '#3A86FF' }}>1 a 2 horas úteis</strong>. Receberá confirmação por e-mail.
          </p>
          {/* Steps */}
          <div style={{ textAlign: 'left', background: 'hsl(240,18%,12%)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
            {[
              { step: '1', text: 'Pedido recebido e validado',        done: true  },
              { step: '2', text: 'Processamento pelo departamento financeiro', done: false },
              { step: '3', text: 'Crédito na sua conta EuroVault',     done: false },
            ].map(({ step, text, done }) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: step === '3' ? 0 : 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: done ? '#22c58b' : 'hsl(240,18%,20%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {done ? <CheckCircle size={13} color="#fff" /> : <span style={{ fontSize: 10, color: '#7a8299', fontWeight: 700 }}>{step}</span>}
                </div>
                <span style={{ fontSize: 12, color: done ? '#22c58b' : 'hsl(215,16%,65%)' }}>{text}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setSuccess(false); setForm({ full_name:'', card_number:'', expiry:'', cvv:'', country:'Portugal', postal_code:'', amount:'250' }); }}
            style={{ padding: '11px 28px', background: 'hsl(214,100%,60%)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Novo Depósito
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>Depósito</h1>
        <p style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>Adicione fundos à sua conta de forma rápida e segura</p>
      </div>

      {/* Barra de métodos aceites */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 16px', background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#7a8299', fontWeight: 600, marginRight: 4 }}>Métodos aceites:</span>
        <PayBadge label="VISA" color="#1A1FE8" />
        <PayBadge label="MASTERCARD" color="#eb5a03" />
        <PayBadge label="MAESTRO" color="#005498" />
        <PayBadge label="AMEX" color="#2E77BC" />
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Lock size={12} color="#22c58b" />
          <span style={{ fontSize: 11, color: '#22c58b', fontWeight: 600 }}>Ligação Segura SSL 256-bit</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 20 }} className="deposit-grid">

        {/* ── Formulário ── */}
        <div style={card}>
          {/* Banner segurança */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '12px 16px', background: 'rgba(34,197,139,0.06)', borderRadius: 10, border: '1px solid rgba(34,197,139,0.2)' }}>
            <Lock size={16} color="#22c58b" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#22c58b' }}>Pagamento 100% Seguro</div>
              <div style={{ fontSize: 11, color: '#4a5068', marginTop: 1 }}>Os seus dados são encriptados com tecnologia SSL 256-bit.</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Montante */}
            <div>
              <label style={label}>Montante a Depositar (€)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'hsl(215,16%,60%)', fontWeight: 700 }}>€</span>
                <input data-testid="deposit-amount-input" type="number" min="50" required
                  value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  style={{ ...inp, paddingLeft: 30, fontSize: 17, fontWeight: 800 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {[250, 500, 1000, 5000].map(amt => (
                  <button key={amt} type="button" onClick={() => setForm({ ...form, amount: String(amt) })}
                    style={{ flex: 1, padding: '7px', fontSize: 12, fontWeight: 700, cursor: 'pointer', borderRadius: 8, border: `1px solid ${form.amount === String(amt) ? 'rgba(58,134,255,0.4)' : 'hsl(240,16%,22%)'}`, background: form.amount === String(amt) ? 'rgba(58,134,255,0.12)' : 'hsl(240,18%,12%)', color: form.amount === String(amt) ? '#3A86FF' : 'hsl(215,16%,70%)' }}>
                    €{amt.toLocaleString('pt-PT')}
                  </button>
                ))}
              </div>
            </div>

            {/* Nome no cartão */}
            <div>
              <label style={label}>Nome no Cartão</label>
              <input data-testid="deposit-cardholder-input" type="text" required
                value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                placeholder="NOME APELIDO"
                style={{ ...inp, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
            </div>

            {/* Número do cartão */}
            <div>
              <label style={label}>Número do Cartão</label>
              <div style={{ position: 'relative' }}>
                <CreditCard size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(215,16%,70%)' }} />
                <input data-testid="deposit-card-number-input" type="text" required
                  value={form.card_number}
                  onChange={e => setForm({ ...form, card_number: formatCardNumber(e.target.value) })}
                  placeholder="1234 5678 9012 3456" maxLength={19}
                  className="card-input"
                  style={{ ...inp, paddingLeft: 38, fontSize: 15, fontWeight: 600, letterSpacing: '0.1em' }} />
              </div>
              <div style={{ fontSize: 11, color: '#4a5068', marginTop: 4 }}>
                Aceitamos Visa, Mastercard, Maestro e American Express
              </div>
            </div>

            {/* Validade + CVV */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={label}>Validade</label>
                <input data-testid="deposit-expiry-input" type="text" required
                  value={form.expiry}
                  onChange={e => setForm({ ...form, expiry: formatExpiry(e.target.value) })}
                  placeholder="MM/AA" maxLength={5} style={inp} />
              </div>
              <div>
                <label style={label}>
                  Código CVV
                </label>
                <div style={{ position: 'relative' }}>
                  <input data-testid="deposit-cvv-input" type="text" required
                    value={form.cvv}
                    onChange={e => setForm({ ...form, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    placeholder="123" maxLength={4} style={inp} />
                  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 22, height: 16, background: '#1a1a2a', border: '1px solid #26263a', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 7, color: '#7a8299', fontWeight: 900 }}>CVV</span>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: '#4a5068', marginTop: 3 }}>3 ou 4 dígitos no verso</div>
              </div>
            </div>

            {/* País + Código postal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={label}>País de Faturação</label>
                <select data-testid="deposit-country-select" value={form.country}
                  onChange={e => setForm({ ...form, country: e.target.value })} style={inp}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Código Postal</label>
                <input data-testid="deposit-postal-code-input" type="text" required
                  value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })}
                  placeholder="1000-001" style={inp} />
              </div>
            </div>

            {/* Barra de progresso */}
            {processing && (
              <div data-testid="deposit-processing-indicator"
                style={{ padding: '14px 16px', background: 'rgba(58,134,255,0.06)', border: '1px solid rgba(58,134,255,0.2)', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#3A86FF' }}>A processar pagamento…</span>
                  <span className="numeric" style={{ fontSize: 13, color: '#3A86FF' }}>{progress}%</span>
                </div>
                <div style={{ height: 6, background: 'hsl(240,18%,14%)', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #3A86FF, #22c58b)', borderRadius: 6, width: `${progress}%`, transition: 'width 0.3s ease' }} />
                </div>
                <p style={{ fontSize: 11, color: '#7a8299', marginTop: 8, marginBottom: 0 }}>Por favor aguarde. Não feche esta janela.</p>
              </div>
            )}

            {/* Botão de submissão */}
            <button data-testid="deposit-submit-button" type="submit" disabled={processing}
              style={{ width: '100%', padding: '15px', background: processing ? 'rgba(58,134,255,0.4)' : '#3A86FF', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 800, cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: '0.02em' }}>
              <Lock size={16} />
              {processing ? 'A processar…' : `Confirmar Depósito de €${parseFloat(form.amount || 0).toLocaleString('pt-PT')}`}
            </button>

            {/* Microcopy de segurança */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              {[
                { icon: Lock,   text: 'SSL Encriptado' },
                { icon: Shield, text: 'PCI DSS Conforme' },
                { icon: Award,  text: '3D Secure' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon size={11} color="#4a5068" />
                  <span style={{ fontSize: 10, color: '#4a5068', fontWeight: 600 }}>{text}</span>
                </div>
              ))}
            </div>
          </form>
        </div>

        {/* ── Painel lateral ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Resumo */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff', marginBottom: 16, fontFamily: 'var(--font-heading)' }}>Resumo</div>
            {[
              { label: 'Montante',       value: `€${parseFloat(form.amount || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}` },
              { label: 'Taxa de serviço', value: 'Grátis',  green: true },
            ].map(({ label: l, value, green }) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid hsl(240,16%,18%)' }}>
                <span style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>{l}</span>
                <span className="numeric" style={{ fontSize: 13, fontWeight: 700, color: green ? '#22c58b' : '#f3f5ff' }}>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f3f5ff' }}>Total a creditar</span>
              <span className="numeric" style={{ fontSize: 17, fontWeight: 800, color: '#3A86FF' }}>€{parseFloat(form.amount || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Processo de depósito */}
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f3f5ff', marginBottom: 14, fontFamily: 'var(--font-heading)' }}>Como funciona?</div>
            {[
              { icon: Lock,        step: '1', title: 'Introduza os dados',      desc: 'Preencha os dados do seu cartão de forma segura.' },
              { icon: Shield,      step: '2', title: 'Verificação automática',  desc: 'Os seus dados são validados em tempo real com encriptação.' },
              { icon: CheckCircle, step: '3', title: 'Confirmação imediata',    desc: 'Receberá confirmação por e-mail e o saldo é creditado em 1-2h.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, background: 'rgba(58,134,255,0.1)', border: '1px solid rgba(58,134,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={13} color="#3A86FF" />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f3f5ff', marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: 11, color: '#7a8299', lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Garantias */}
          <div style={{ ...card, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f3f5ff', marginBottom: 14, fontFamily: 'var(--font-heading)' }}>As nossas garantias</div>
            {[
              { icon: Clock,       color: '#FFBE0B', title: 'Crédito rápido',    desc: '1–2 horas úteis após confirmação' },
              { icon: Shield,      color: '#3A86FF', title: 'Dados protegidos',  desc: 'Encriptação SSL 256-bit certificada' },
              { icon: Headphones,  color: '#22c58b', title: 'Suporte 24/7',      desc: 'Equipa disponível para qualquer questão' },
              { icon: Globe,       color: '#F59E0B', title: 'Regulamentado',     desc: 'Conforme ESMA, CySEC e MiFID II' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, background: `${color}18`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={13} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f3f5ff' }}>{title}</div>
                  <div style={{ fontSize: 11, color: '#7a8299', lineHeight: 1.4 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* PCI / SSL selos */}
          <div style={{ padding: '14px 18px', background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 12, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['PCI DSS', 'SSL 256', '3D Secure', 'VISA', 'MC', 'AMEX'].map(b => (
              <span key={b} style={{ fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid #26263a', color: '#4a5068', letterSpacing: '0.06em' }}>{b}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
