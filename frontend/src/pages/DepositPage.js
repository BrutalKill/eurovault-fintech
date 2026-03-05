import React, { useState } from 'react';
import { Lock, Shield, CreditCard, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const COUNTRIES = ['Portugal','Espanha','França','Alemanha','Itália','Países Baixos','Bélgica','Suícia','Suécia','Noruega','Dinamarca','Polónia','Hungria','República Checa','Ruménia','Brasil','Reino Unido','Outro'];

function formatCardNumber(val) {
  const digits = val.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 2) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

export default function DepositPage() {
  const [form, setForm] = useState({
    full_name: '', card_number: '', expiry: '', cvv: '',
    country: 'Portugal', postal_code: '', amount: '250'
  });
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  const simulateProgress = () => {
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15;
      if (p > 90) p = 90;
      setProgress(Math.floor(p));
    }, 300);
    return interval;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    const interval = simulateProgress();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          card_number: form.card_number.replace(/\s/g, ''),
          amount: parseFloat(form.amount)
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao processar');
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setProcessing(false);
        setSuccess(true);
      }, 500);
    } catch (err) {
      clearInterval(interval);
      setProcessing(false);
      setProgress(0);
      toast.error(err.message);
    }
  };

  if (success) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 20, padding: '48px 40px', maxWidth: 420, width: '100%' }}>
          <div style={{ width: 64, height: 64, background: 'hsl(155,72%,45%,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={32} color="hsl(155,72%,45%)" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#f3f5ff', marginBottom: 10 }}>Depósito Enviado!</h2>
          <p style={{ fontSize: 14, color: 'hsl(215,16%,70%)', marginBottom: 24, lineHeight: 1.6 }}>O seu pedido de depósito foi recebido e está a ser processado. Será notificado assim que for confirmado.</p>
          <button
            onClick={() => { setSuccess(false); setForm({ full_name: '', card_number: '', expiry: '', cvv: '', country: 'Portugal', postal_code: '', amount: '250' }); }}
            style={{ padding: '11px 28px', background: 'hsl(214,100%,60%)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Novo Depósito
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>Depositar Fundos</h1>
        <p style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>Pagamento seguro por cartão de crédito/débito</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 20 }} className="deposit-grid">
        <style>{`@media (max-width: 900px) { .deposit-grid { grid-template-columns: 1fr !important; } }`}</style>

        {/* Form */}
        <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: 28 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '12px 16px', background: 'hsl(155,72%,45%,0.08)', borderRadius: 10, border: '1px solid hsl(155,72%,45%,0.2)' }}>
            <Lock size={16} color="hsl(155,72%,45%)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(155,72%,45%)' }}>Pagamento Seguro</span>
            <span style={{ fontSize: 12, color: 'hsl(215,16%,70%)', marginLeft: 4 }}>Os seus dados são encriptados SSL 256-bit</span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Amount */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Montante (EUR)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'hsl(215,16%,70%)', fontWeight: 700 }}>€</span>
                <input
                  data-testid="deposit-amount-input"
                  type="number" min="50" required
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px 11px 30px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 15, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {[250, 500, 1000, 5000].map(amt => (
                  <button key={amt} type="button" onClick={() => setForm({ ...form, amount: String(amt) })}
                    style={{ flex: 1, padding: '7px', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 8, border: '1px solid hsl(240,16%,22%)', background: form.amount === String(amt) ? 'hsl(214,100%,60%)' : 'hsl(240,18%,12%)', color: form.amount === String(amt) ? '#fff' : 'hsl(215,16%,70%)' }}
                  >
                    €{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Cardholder */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nome no Cartão</label>
              <input
                data-testid="deposit-cardholder-input"
                type="text" required
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                placeholder="NOME APELIDO"
                style={{ width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Card number */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Número do Cartão</label>
              <div style={{ position: 'relative' }}>
                <CreditCard size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(215,16%,70%)' }} />
                <input
                  data-testid="deposit-card-number-input"
                  type="text" required
                  value={form.card_number}
                  onChange={e => setForm({ ...form, card_number: formatCardNumber(e.target.value) })}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="card-input"
                  style={{ width: '100%', padding: '11px 14px 11px 38px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 15, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Expiry + CVV */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Validade</label>
                <input
                  data-testid="deposit-expiry-input"
                  type="text" required
                  value={form.expiry}
                  onChange={e => setForm({ ...form, expiry: formatExpiry(e.target.value) })}
                  placeholder="MM/AA"
                  maxLength={5}
                  style={{ width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CVV</label>
                <input
                  data-testid="deposit-cvv-input"
                  type="text" required
                  value={form.cvv}
                  onChange={e => setForm({ ...form, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="123"
                  maxLength={4}
                  style={{ width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Country + Postal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>País</label>
                <select
                  data-testid="deposit-country-select"
                  value={form.country}
                  onChange={e => setForm({ ...form, country: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Código Postal</label>
                <input
                  data-testid="deposit-postal-code-input"
                  type="text" required
                  value={form.postal_code}
                  onChange={e => setForm({ ...form, postal_code: e.target.value })}
                  placeholder="1000-001"
                  style={{ width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Processing state */}
            {processing && (
              <div data-testid="deposit-processing-indicator" style={{ padding: '16px', background: 'hsl(214,100%,60%,0.08)', border: '1px solid hsl(214,100%,60%,0.2)', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(214,100%,60%)' }}>A processar pagamento...</span>
                  <span className="numeric" style={{ fontSize: 13, color: 'hsl(214,100%,60%)' }}>{progress}%</span>
                </div>
                <div style={{ height: 4, background: 'hsl(240,18%,14%)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'hsl(214,100%,60%)', borderRadius: 4, width: `${progress}%`, transition: 'width 0.3s ease' }} />
                </div>
                <p style={{ fontSize: 11, color: 'hsl(215,16%,70%)', marginTop: 8 }}>Por favor aguarde. Não feche esta janela.</p>
              </div>
            )}

            <button
              data-testid="deposit-submit-button"
              type="submit" disabled={processing}
              style={{ width: '100%', padding: '14px', background: processing ? 'hsl(214,100%,60%,0.4)' : 'hsl(214,100%,60%)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Lock size={16} />
              {processing ? 'A processar...' : `Depositar €${form.amount || '0'}`}
            </button>
          </form>
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff', marginBottom: 16, fontFamily: 'var(--font-heading)' }}>Resumo do Depósito</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>Montante</span>
              <span className="numeric" style={{ fontSize: 15, fontWeight: 700, color: '#f3f5ff' }}>€{form.amount || '0'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>Taxa</span>
              <span className="numeric" style={{ fontSize: 13, fontWeight: 600, color: 'hsl(155,72%,45%)' }}>Grátis</span>
            </div>
            <div style={{ borderTop: '1px solid hsl(240,16%,18%)', paddingTop: 12, marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f3f5ff' }}>Total</span>
                <span className="numeric" style={{ fontSize: 16, fontWeight: 700, color: 'hsl(214,100%,60%)' }}>€{form.amount || '0'}</span>
              </div>
            </div>
          </div>

          {[
            { icon: Shield, title: 'Pagamento Seguro', desc: 'Encriptado com SSL 256-bit. Os seus dados estão protegidos.' },
            { icon: CheckCircle, title: 'Processamento Rápido', desc: 'Depósitos são creditados em 1-2 horas úteis.' },
            { icon: Lock, title: 'Privacidade', desc: 'Não armazenamos o CVV do seu cartão após o processamento.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12 }}>
              <div style={{ width: 32, height: 32, background: 'hsl(155,72%,45%,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={14} color="hsl(155,72%,45%)" />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 11, color: 'hsl(215,16%,70%)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
