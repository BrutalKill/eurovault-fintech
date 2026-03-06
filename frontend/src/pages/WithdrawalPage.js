import React, { useState } from 'react';
import { Building2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function WithdrawalPage() {
  const [activeTab, setActiveTab] = useState('sepa');
  const [sepaForm, setSepaForm] = useState({ account_name: '', iban: '', bic: '', amount: '', note: '' });
  const [chargebackSubmitted, setChargebackSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submitSepa = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/withdrawal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ method: 'sepa', ...sepaForm, amount: parseFloat(sepaForm.amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao processar');
      toast.success('Pedido de transferência SEPA enviado com sucesso!');
      setSepaForm({ account_name: '', iban: '', bic: '', amount: '', note: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitChargeback = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/withdrawal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ method: 'chargeback' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao processar');
      setChargebackSubmitted(true);
      toast.success('Pedido de estorno enviado!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>Levantamento de Fundos</h1>
        <p style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>Escolha o método de levantamento</p>
      </div>

      {/* Tabs */}
      <div data-testid="withdrawal-method-tabs" style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {[
          { id: 'sepa', icon: Building2, label: 'Transferência SEPA' },
          { id: 'chargeback', icon: CreditCard, label: 'Estorno no Cartão' },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 9, border: 'none',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: activeTab === id ? 'hsl(214,100%,60%)' : 'transparent',
              color: activeTab === id ? '#fff' : 'hsl(215,16%,70%)',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 20 }} className="withdrawal-grid">

        {/* SEPA Tab */}
        {activeTab === 'sepa' && (
          <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '10px 14px', background: 'hsl(214,100%,60%,0.08)', borderRadius: 10, border: '1px solid hsl(214,100%,60%,0.2)' }}>
              <Building2 size={14} color="hsl(214,100%,60%)" />
              <span style={{ fontSize: 12, color: 'hsl(215,16%,70%)' }}>Transferência SEPA (IBAN) — prazo típico 1–2 dias úteis</span>
            </div>

            <form onSubmit={submitSepa} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                ['Nome do Titular', 'account_name', 'text', 'João Silva'],
                ['IBAN', 'iban', 'text', 'PT50 0035 0013 0000 0070 8330 5'],
                ['Código BIC/SWIFT', 'bic', 'text', 'BCOMPTPL'],
                ['Montante (€)', 'amount', 'number', '0.00'],
              ].map(([label, key, type, placeholder]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                  <input
                    type={type} required
                    value={sepaForm[key]}
                    onChange={e => setSepaForm({ ...sepaForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    style={{ width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nota (opcional)</label>
                <textarea
                  value={sepaForm.note}
                  onChange={e => setSepaForm({ ...sepaForm, note: e.target.value })}
                  placeholder="Referência ou nota adicional..."
                  rows={3}
                  style={{ width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <button
                data-testid="withdrawal-sepa-submit-button"
                type="submit" disabled={loading}
                style={{ width: '100%', padding: '13px', background: loading ? 'hsl(214,100%,60%,0.4)' : 'hsl(214,100%,60%)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'A enviar...' : 'Confirmar Transferência SEPA'}
              </button>
            </form>
          </div>
        )}

        {/* Chargeback Tab */}
        {activeTab === 'chargeback' && (
          <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: 28 }}>
            {chargebackSubmitted ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ width: 56, height: 56, background: 'hsl(155,72%,45%,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle size={28} color="hsl(155,72%,45%)" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: '#f3f5ff', marginBottom: 8 }}>Pedido Enviado!</h3>
                <p style={{ fontSize: 13, color: 'hsl(215,16%,70%)', lineHeight: 1.6 }}>O seu pedido de estorno foi registado. A nossa equipa entrará em contacto dentro de 2-3 dias úteis.</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '10px 14px', background: 'hsl(36,95%,55%,0.08)', borderRadius: 10, border: '1px solid hsl(36,95%,55%,0.2)' }}>
                  <AlertCircle size={14} color="hsl(36,95%,55%)" />
                  <span style={{ fontSize: 12, color: 'hsl(215,16%,70%)' }}>Estorno será devolvido ao cartão original do depósito</span>
                </div>

                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 600, color: '#f3f5ff', marginBottom: 16 }}>Como funciona o estorno?</h3>

                {[
                  'O pedido é submetido à nossa equipa financeira',
                  'Verificamos o histórico de depósitos da sua conta',
                  'O montante é devolvido ao cartão de crédito/débito original',
                  'Prazo: 5-10 dias úteis (dependendo do banco emissor)',
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 24, height: 24, background: 'hsl(214,100%,60%,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: 'hsl(214,100%,60%)' }}>{i + 1}</div>
                    <span style={{ fontSize: 13, color: 'hsl(215,16%,70%)', lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}

                <button
                  data-testid="withdrawal-chargeback-submit-button"
                  onClick={submitChargeback} disabled={loading}
                  style={{ width: '100%', padding: '13px', background: loading ? 'hsl(0,78%,54%,0.4)' : 'hsl(0,78%,54%)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 20 }}
                >
                  {loading ? 'A processar...' : 'Iniciar Pedido de Estorno'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Info panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Prazo SEPA', value: '1-2 dias úteis' },
            { label: 'Montante mínimo', value: '€10.00' },
            { label: 'Taxa de levantamento', value: 'Grátis' },
            { label: 'Limite diário', value: '€50.000' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'hsl(215,16%,70%)', marginBottom: 4 }}>{label}</div>
              <div className="numeric" style={{ fontSize: 15, fontWeight: 700, color: '#f3f5ff' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
