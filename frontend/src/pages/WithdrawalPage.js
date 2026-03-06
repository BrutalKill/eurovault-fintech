import React, { useState } from 'react';
import { Building2, CreditCard, CheckCircle, AlertCircle, AlertTriangle, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '../context/UserContext';
import { useLang } from '../context/LangContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function WithdrawalPage() {
  const { user } = useUser();
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState('sepa');
  const [sepaForm, setSepaForm] = useState({ account_name: '', iban: '', bic: '', amount: '', note: '' });
  const [chargebackSubmitted, setChargebackSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const safeBalance = Math.max(0, parseFloat(user?.balance) || 0);
  const dailyLimit  = parseFloat(user?.daily_withdrawal_limit) || 0;
  const formatEur   = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);

  const reqAmount = parseFloat(sepaForm.amount) || 0;
  const insufficientBalance = reqAmount > 0 && reqAmount > safeBalance;
  const exceedsDailyLimit   = dailyLimit > 0 && reqAmount > dailyLimit;

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
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>{t('wd_title_full')}</h1>
        <p style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>{t('wd_subtitle_full')}</p>
      </div>

      {/* Tabs */}
      <div data-testid="withdrawal-method-tabs" style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {[
          { id: 'sepa',       icon: Building2,  label: t('wd_tab_sepa') },
          { id: 'chargeback', icon: CreditCard, label: t('wd_tab_card') },
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
              <span style={{ fontSize: 12, color: 'hsl(215,16%,70%)' }}>{t('wd_sepa_info')}</span>
            </div>

            <form onSubmit={submitSepa} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Saldo disponível */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(34,197,139,0.07)', borderRadius: 10, border: '1px solid rgba(34,197,139,0.2)' }}>
                <Wallet size={15} color="#22c58b" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'hsl(215,16%,65%)' }}>{t('wd_info_available')}</div>
                  <div className="numeric" style={{ fontSize: 16, fontWeight: 800, color: '#22c58b' }}>{formatEur(safeBalance)}</div>
                </div>
                {dailyLimit > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'hsl(215,16%,55%)' }}>{t('wd_info_limit')}</div>
                    <div className="numeric" style={{ fontSize: 13, fontWeight: 700, color: '#FFBE0B' }}>{formatEur(dailyLimit)}</div>
                  </div>
                )}
              </div>

              {[
                [t('wd_holder'),  'account_name', 'text', 'João Silva'],
                ['IBAN',           'iban',         'text', 'PT50 0035 0013 0000 0070 8330 5'],
                [t('wd_bic'),      'bic',          'text', 'BCOMPTPL'],
              ].map(([label, key, type, placeholder]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                  <input type={type} required value={sepaForm[key]}
                    onChange={e => setSepaForm({ ...sepaForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    style={{ width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}

              {/* Campo montante com validação visual */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('wd_amount')} (€)</label>
                <input type="number" required min="10" step="0.01"
                  value={sepaForm.amount}
                  onChange={e => setSepaForm({ ...sepaForm, amount: e.target.value })}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: `1px solid ${insufficientBalance || exceedsDailyLimit ? '#ef4444' : 'hsl(240,16%,22%)'}`, borderRadius: 10, color: insufficientBalance || exceedsDailyLimit ? '#ef4444' : '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontWeight: insufficientBalance || exceedsDailyLimit ? 700 : 400 }}
                />
                {insufficientBalance && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, padding: '9px 12px', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8 }}>
                    <AlertTriangle size={14} color="#ef4444" />
                    <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
                      {t('wd_info_available')}: <span className="numeric">{formatEur(safeBalance)}</span>
                    </span>
                  </div>
                )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, padding: '9px 12px', background: 'rgba(255,190,11,0.10)', border: '1px solid rgba(255,190,11,0.3)', borderRadius: 8 }}>
                    <AlertTriangle size={14} color="#FFBE0B" />
                    <span style={{ fontSize: 12, color: '#FFBE0B', fontWeight: 600 }}>
                      Excede o limite diário de <span className="numeric">{formatEur(dailyLimit)}</span>
                    </span>
                  </div>
                )}
                {/* Montante válido */}
                {reqAmount > 0 && !insufficientBalance && !exceedsDailyLimit && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, padding: '9px 12px', background: 'rgba(34,197,139,0.08)', border: '1px solid rgba(34,197,139,0.2)', borderRadius: 8 }}>
                    <CheckCircle size={13} color="#22c58b" />
                    <span style={{ fontSize: 12, color: '#22c58b' }}>
                      Após levantamento, saldo restante: <span className="numeric" style={{ fontWeight: 700 }}>{formatEur(safeBalance - reqAmount)}</span>
                    </span>
                  </div>
                )}
              </div>

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
                type="submit" disabled={loading || insufficientBalance || exceedsDailyLimit}
                style={{ width: '100%', padding: '13px', background: loading || insufficientBalance || exceedsDailyLimit ? 'hsl(214,100%,60%,0.4)' : 'hsl(214,100%,60%)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading || insufficientBalance || exceedsDailyLimit ? 'not-allowed' : 'pointer' }}
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
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: '#f3f5ff', marginBottom: 8 }}>{t('wd_cb_submitted_title')}</h3>
                <p style={{ fontSize: 13, color: 'hsl(215,16%,70%)', lineHeight: 1.6 }}>{t('wd_cb_submitted_msg')}</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '10px 14px', background: 'hsl(36,95%,55%,0.08)', borderRadius: 10, border: '1px solid hsl(36,95%,55%,0.2)' }}>
                  <AlertCircle size={14} color="hsl(36,95%,55%)" />
                  <span style={{ fontSize: 12, color: 'hsl(215,16%,70%)' }}>{t('wd_cb_alert')}</span>
                </div>

                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 600, color: '#f3f5ff', marginBottom: 16 }}>{t('wd_cb_how')}</h3>

                {[t('wd_cb_step1'), t('wd_cb_step2'), t('wd_cb_step3'), t('wd_cb_step4')].map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 24, height: 24, background: 'hsl(214,100%,60%,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: 'hsl(214,100%,60%)' }}>{i + 1}</div>
                    <span style={{ fontSize: 13, color: 'hsl(215,16%,70%)', lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}

                <button data-testid="withdrawal-chargeback-submit-button"
                  onClick={submitChargeback} disabled={loading}
                  style={{ width: '100%', padding: '13px', background: loading ? 'hsl(0,78%,54%,0.4)' : 'hsl(0,78%,54%)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 20 }}>
                  {loading ? t('wd_loading_btn') : t('wd_cb_btn')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Info panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: t('wd_info_available'), value: formatEur(safeBalance),                              color: '#22c58b'  },
            { label: t('wd_info_sepa'),      value: t('wd_info_sepa_val'),                               color: '#f3f5ff'  },
            { label: t('wd_info_min'),       value: t('wd_info_min_val'),                                color: '#f3f5ff'  },
            { label: t('wd_info_fee'),       value: t('wd_info_fee_val'),                                color: '#22c58b'  },
            { label: t('wd_info_limit'),     value: dailyLimit > 0 ? formatEur(dailyLimit) : t('wd_info_no_limit'), color: dailyLimit > 0 ? '#FFBE0B' : '#f3f5ff' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'hsl(215,16%,70%)', marginBottom: 4 }}>{label}</div>
              <div className="numeric" style={{ fontSize: 15, fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
