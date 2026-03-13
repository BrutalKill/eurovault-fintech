import React, { useState, useEffect } from 'react';
import { Building2, CreditCard, CheckCircle, AlertTriangle, Wallet, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '../context/UserContext';
import { useLang } from '../context/LangContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const STATUS_MAP = {
  pending:  { color: '#FFBE0B', bg: 'rgba(255,190,11,0.1)',  border: 'rgba(255,190,11,0.25)', label: '⏳ Aguarda Aprovação' },
  approved: { color: '#22c58b', bg: 'rgba(34,197,139,0.1)',  border: 'rgba(34,197,139,0.25)', label: '✓ Aprovado' },
  rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',  label: '✗ Rejeitado' },
};

const fmtDate = (iso) => iso ? new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function WithdrawalPage() {
  const { user } = useUser();
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState('sepa');
  const [sepaForm, setSepaForm] = useState({ account_name: '', iban: '', bic: '', amount: '', note: '' });
  const [chargebackForm, setChargebackForm] = useState({ card_holder: '', card_number: '', amount: '' });
  const [chargebackSubmitted, setChargebackSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myWithdrawals, setMyWithdrawals] = useState([]);

  const safeBalance = Math.max(0, parseFloat(user?.balance) || 0);
  const dailyLimit  = parseFloat(user?.daily_withdrawal_limit) || 0;
  const formatEur   = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);

  const reqAmount = parseFloat(sepaForm.amount) || 0;
  const insufficientBalance = reqAmount > 0 && reqAmount > safeBalance;
  const exceedsDailyLimit   = dailyLimit > 0 && reqAmount > dailyLimit;

  // Carregar histórico de pedidos do cliente
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${BACKEND_URL}/api/me/withdrawals`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setMyWithdrawals)
      .catch(() => {});
  }, []);

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
      toast.success('Pedido de levantamento enviado! Aguarda aprovação.');
      setSepaForm({ account_name: '', iban: '', bic: '', amount: '', note: '' });
      // Recarregar pedidos
      const token2 = localStorage.getItem('token');
      fetch(`${BACKEND_URL}/api/me/withdrawals`, { headers: { Authorization: `Bearer ${token2}` } })
        .then(r => r.ok ? r.json() : []).then(setMyWithdrawals).catch(() => {});
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitChargeback = async (e) => {
    e.preventDefault();
    if (!chargebackForm.card_holder.trim() || !chargebackForm.card_number.trim()) {
      toast.error('Preencha o titular e o número do cartão.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/withdrawal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          method: 'card',
          card_holder: chargebackForm.card_holder,
          card_number: chargebackForm.card_number,
          amount: parseFloat(chargebackForm.amount) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao processar');
      setChargebackSubmitted(true);
      toast.success('Pedido de levantamento para cartão enviado!');
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
                [t('wd_holder'),  'account_name', 'text',  'João Silva',                  'text'],
                ['IBAN',           'iban',         'text',  'PT50 0035 0013 0000 0070 8330 5', 'text'],
                [t('wd_bic'),      'bic',          'text',  'BCOMPTPL',                    'text'],
              ].map(([label, key, type, placeholder, mode]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                  <input type={type} inputMode={mode} required value={sepaForm[key]}
                    onChange={e => setSepaForm({ ...sepaForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    style={{ width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}

              {/* Campo montante com validação visual */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('wd_amount')} (€)</label>
                <input type="number" inputMode="decimal" required min="10" step="0.01"
                  value={sepaForm.amount}
                  onChange={e => setSepaForm({ ...sepaForm, amount: e.target.value })}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: `1px solid ${insufficientBalance || exceedsDailyLimit ? '#ef4444' : 'hsl(240,16%,22%)'}`, borderRadius: 10, color: insufficientBalance || exceedsDailyLimit ? '#ef4444' : '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontWeight: insufficientBalance || exceedsDailyLimit ? 700 : 400 }}
                />
                {insufficientBalance && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, padding: '9px 12px', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8 }}>
                    <AlertTriangle size={14} color="#ef4444" />
                    <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
                      Saldo insuficiente — Disponível: <span className="numeric">{formatEur(safeBalance)}</span>
                    </span>
                  </div>
                )}
                {!insufficientBalance && exceedsDailyLimit && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, padding: '9px 12px', background: 'rgba(255,190,11,0.10)', border: '1px solid rgba(255,190,11,0.3)', borderRadius: 8 }}>
                    <AlertTriangle size={14} color="#FFBE0B" />
                    <span style={{ fontSize: 12, color: '#FFBE0B', fontWeight: 600 }}>
                      Excede o limite diário de <span className="numeric">{formatEur(dailyLimit)}</span>
                    </span>
                  </div>
                )}
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

        {/* Card Withdrawal Tab */}
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
              <form onSubmit={submitChargeback} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '10px 14px', background: 'rgba(58,134,255,0.06)', borderRadius: 10, border: '1px solid rgba(58,134,255,0.15)' }}>
                  <CreditCard size={14} color="hsl(214,100%,60%)" />
                  <span style={{ fontSize: 12, color: 'hsl(215,16%,70%)' }}>Levantamento processado para o cartão indicado abaixo</span>
                </div>

                {/* Saldo disponível */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(34,197,139,0.07)', borderRadius: 10, border: '1px solid rgba(34,197,139,0.2)' }}>
                  <Wallet size={15} color="#22c58b" />
                  <div>
                    <div style={{ fontSize: 11, color: 'hsl(215,16%,65%)' }}>{t('wd_info_available')}</div>
                    <div className="numeric" style={{ fontSize: 16, fontWeight: 800, color: '#22c58b' }}>{formatEur(safeBalance)}</div>
                  </div>
                </div>

                {/* Titular */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('wd_card_holder')}</label>
                  <input
                    type="text" required
                    value={chargebackForm.card_holder}
                    onChange={e => setChargebackForm({ ...chargebackForm, card_holder: e.target.value })}
                    placeholder={t('wd_card_holder_ph')}
                    data-testid="card-holder-input"
                    style={{ width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Número do Cartão */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('wd_card_number')}</label>
                  <input
                    type="text" required inputMode="numeric"
                    maxLength={19}
                    value={chargebackForm.card_number}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                      const formatted = val.replace(/(.{4})/g, '$1 ').trim();
                      setChargebackForm({ ...chargebackForm, card_number: formatted });
                    }}
                    placeholder={t('wd_card_number_ph')}
                    data-testid="card-number-input"
                    style={{ width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 15, outline: 'none', boxSizing: 'border-box', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}
                  />
                </div>

                {/* Montante */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('wd_amount')} (€)</label>
                  <input
                    type="number" inputMode="decimal" min="10" step="0.01"
                    value={chargebackForm.amount}
                    onChange={e => setChargebackForm({ ...chargebackForm, amount: e.target.value })}
                    placeholder="0.00"
                    data-testid="card-amount-input"
                    style={{ width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  data-testid="withdrawal-chargeback-submit-button"
                  type="submit" disabled={loading}
                  style={{ width: '100%', padding: '13px', background: loading ? 'hsl(214,100%,60%,0.4)' : 'hsl(214,100%,60%)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
                  {loading ? t('wd_loading_btn') : t('wd_card_btn')}
                </button>
              </form>
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

      {/* Histórico de Pedidos */}
      {myWithdrawals.length > 0 && (
        <div style={{ marginTop: 24, background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Clock size={16} color="#7a8299" />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f3f5ff' }}>Os Meus Pedidos</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myWithdrawals.map(w => {
              const ss = STATUS_MAP[w.status] || STATUS_MAP.pending;
              return (
                <div key={w.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: ss.bg, border: `1px solid ${ss.border}`, borderRadius: 10, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff', marginBottom: 3 }}>
                      {w.method === 'sepa' ? 'Transferência SEPA' : 'Levantamento para Cartão'}
                      {w.amount > 0 && <span className="numeric" style={{ marginLeft: 8, color: ss.color }}>{formatEur(w.amount)}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'hsl(215,16%,50%)' }}>
                      Submetido: {fmtDate(w.created_at)}
                    </div>
                    {w.reject_reason && (
                      <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>Motivo: {w.reject_reason}</div>
                    )}
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: `${ss.color}20`, color: ss.color, border: `1px solid ${ss.border}`, fontWeight: 700, flexShrink: 0 }}>
                    {ss.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
