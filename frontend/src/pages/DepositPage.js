import React, { useState } from 'react';
import { Lock, Shield, CreditCard, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const COUNTRIES = ['Portugal','Espanha','França','Alemanha','Itália','Países Baixos','Bélgica','Suíça','Suécia','Noruega','Dinamarca','Polónia','Hungria','República Checa','Roménia','Brasil','Reino Unido','Outro'];

function formatCardNumber(val) {
  const d = val.replace(/\D/g, '').slice(0, 16);
  return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}
function formatExpiry(val) {
  const d = val.replace(/\D/g, '').slice(0, 4);
  return d.length >= 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
}

export default function DepositPage() {
  const [form, setForm] = useState({
    full_name: '', card_number: '', expiry: '', cvv: '',
    country: 'Portugal', postal_code: '', amount: '250',
  });
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress]     = useState(0);
  const [success, setSuccess]        = useState(false);

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
        <div style={{ textAlign: 'center', ...card, maxWidth: 420, width: '100%' }}>
          <div style={{ width: 64, height: 64, background: 'rgba(34,197,139,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={32} color="#22c58b" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#f3f5ff', marginBottom: 10 }}>Depósito Enviado!</h2>
          <p style={{ fontSize: 14, color: 'hsl(215,16%,70%)', marginBottom: 24, lineHeight: 1.6 }}>O seu pedido foi recebido e está a ser processado. Será notificado assim que for confirmado.</p>
          <button onClick={() => { setSuccess(false); setForm({ full_name:'', card_number:'', expiry:'', cvv:'', country:'Portugal', postal_code:'', amount:'250' }); }}
            style={{ padding: '11px 28px', background: 'hsl(214,100%,60%)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Novo Depósito
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>Depósito</h1>
        <p style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>Pagamento seguro por cartão de crédito / débito</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 20 }} className="deposit-grid">
        <style>{`@media (max-width: 900px) { .deposit-grid { grid-template-columns: 1fr !important; } }`}</style>

        {/* Formulário */}
        <div style={card}>
          {/* Cabeçalho seguro */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '12px 16px', background: 'rgba(34,197,139,0.06)', borderRadius: 10, border: '1px solid rgba(34,197,139,0.2)' }}>
            <Lock size={16} color="#22c58b" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#22c58b' }}>Pagamento Seguro</span>
            <span style={{ fontSize: 12, color: 'hsl(215,16%,70%)', marginLeft: 4 }}>Encriptação SSL 256-bit</span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Montante */}
            <div>
              <label style={label}>Montante (€)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'hsl(215,16%,70%)', fontWeight: 700 }}>€</span>
                <input data-testid="deposit-amount-input" type="number" min="50" required
                  value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  style={{ ...inp, paddingLeft: 30, fontSize: 15, fontWeight: 700 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {[250, 500, 1000, 5000].map(amt => (
                  <button key={amt} type="button" onClick={() => setForm({ ...form, amount: String(amt) })}
                    style={{ flex: 1, padding: '7px', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 8, border: '1px solid hsl(240,16%,22%)', background: form.amount === String(amt) ? 'hsl(214,100%,60%)' : 'hsl(240,18%,12%)', color: form.amount === String(amt) ? '#fff' : 'hsl(215,16%,70%)' }}>
                    €{amt}
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
                  style={{ ...inp, paddingLeft: 38, fontSize: 15, fontWeight: 600 }} />
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
                <label style={label}>CVV</label>
                <input data-testid="deposit-cvv-input" type="text" required
                  value={form.cvv}
                  onChange={e => setForm({ ...form, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="123" maxLength={4} style={inp} />
              </div>
            </div>

            {/* País + Código postal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={label}>País</label>
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

            {/* Indicador de processamento */}
            {processing && (
              <div data-testid="deposit-processing-indicator"
                style={{ padding: '14px 16px', background: 'rgba(58,134,255,0.08)', border: '1px solid rgba(58,134,255,0.2)', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#3A86FF' }}>A processar pagamento…</span>
                  <span className="numeric" style={{ fontSize: 13, color: '#3A86FF' }}>{progress}%</span>
                </div>
                <div style={{ height: 4, background: 'hsl(240,18%,14%)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#3A86FF', borderRadius: 4, width: `${progress}%`, transition: 'width 0.3s ease' }} />
                </div>
                <p style={{ fontSize: 11, color: 'hsl(215,16%,70%)', marginTop: 8, marginBottom: 0 }}>Por favor aguarde. Não feche esta janela.</p>
              </div>
            )}

            <button data-testid="deposit-submit-button" type="submit" disabled={processing}
              style={{ width: '100%', padding: '14px', background: processing ? 'rgba(58,134,255,0.4)' : 'hsl(214,100%,60%)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Lock size={16} />
              {processing ? 'A processar…' : `Confirmar Depósito de €${form.amount || '0'}`}
            </button>
          </form>
        </div>

        {/* Painel lateral */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Resumo */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff', marginBottom: 16, fontFamily: 'var(--font-heading)' }}>Resumo do Depósito</div>
            {[
              { label: 'Montante',  value: `€${form.amount || '0'}` },
              { label: 'Taxa',      value: 'Grátis', green: true },
              { label: 'Total',     value: `€${form.amount || '0'}`, big: true },
            ].map(({ label: l, value, green, big }) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, paddingBottom: big ? 0 : 10, borderBottom: big ? 'none' : '1px solid hsl(240,16%,18%)' }}>
                <span style={{ fontSize: big ? 14 : 13, fontWeight: big ? 700 : 400, color: big ? '#f3f5ff' : 'hsl(215,16%,70%)' }}>{l}</span>
                <span className="numeric" style={{ fontSize: big ? 16 : 13, fontWeight: 700, color: big ? 'hsl(214,100%,60%)' : green ? '#22c58b' : '#f3f5ff' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Garantias */}
          {[
            { icon: Shield,       title: 'Pagamento Seguro',       desc: 'Encriptado com SSL 256-bit.' },
            { icon: CheckCircle,  title: 'Processamento Rápido',   desc: 'Creditado em 1–2 horas úteis.' },
            { icon: Lock,         title: 'Privacidade',             desc: 'Não armazenamos o CVV após processamento.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12 }}>
              <div style={{ width: 32, height: 32, background: 'rgba(34,197,139,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={14} color="#22c58b" />
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
