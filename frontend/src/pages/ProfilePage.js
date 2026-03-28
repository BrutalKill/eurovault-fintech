import React, { useState, useEffect, useRef } from 'react';
import { Save, Shield, TrendingUp, Upload, CheckCircle, Clock, AlertCircle, Target, Monitor, Smartphone, Globe, Edit2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '../context/UserContext';
import { useLang } from '../context/LangContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const COUNTRY_KEYS = [
  'country_portugal','country_espanha','country_franca','country_alemanha',
  'country_italia','country_paises_baixos','country_belgica','country_suica',
  'country_suecia','country_noruega','country_dinamarca','country_polonia',
  'country_hungria','country_republica_checa','country_romenia',
  'country_brasil','country_reino_unido','country_outro',
];

export default function ProfilePage() {
  const { user, fetchUser } = useUser();
  const { t } = useLang();
  const [form, setForm] = useState({ full_name: '', phone: '', country: 'Portugal' });
  const [loading, setLoading] = useState(false);
  // KYC — estado separado por face
  const [kycStatus, setKycStatus]         = useState(null);
  const [kycDocType, setKycDocType]       = useState('bi');
  const [kycUploading, setKycUploading]   = useState({ frente: false, verso: false });
  const frontRef = useRef(null);
  const backRef  = useRef(null);

  // Goals
  const [goalAmount, setGoalAmount]   = useState('');
  const [goalLabel, setGoalLabel]     = useState('A minha meta');
  const [savingGoal, setSavingGoal]   = useState(false);
  const [editingGoal, setEditingGoal] = useState(false); // modo de edição da meta

  // Sessions
  const [sessions, setSessions]       = useState([]);

  useEffect(() => {
    if (user) {
      setForm({ full_name: user.full_name || '', phone: user.phone || '', country: user.country || 'Portugal' });
      if (user.goal_amount) setGoalAmount(String(user.goal_amount));
      if (user.goal_label) setGoalLabel(user.goal_label);
    }
  }, [user]);

  useEffect(() => { fetchUser(); }, []); // eslint-disable-line

  // Carregar estado KYC
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${BACKEND_URL}/api/kyc/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setKycStatus(data); })
      .catch(() => {});
    // Carregar sessões
    fetch(`${BACKEND_URL}/api/me/sessions`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => setSessions(data))
      .catch(() => {});
  }, []); // eslint-disable-line

  const safeBalance = Math.max(0, parseFloat(user?.balance) || 0);
  const safeProfit  = Math.max(0, parseFloat(user?.profit)  || 0);
  const formatEur = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Erro ao actualizar');
      await fetchUser();
      toast.success(t('prof_saved'));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const card = { background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: 28 };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };
  const inputStyle = { width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' };

  const handleSaveGoal = async () => {
    const amt = parseFloat(goalAmount);
    if (!amt || amt <= 0) { toast.error(t('err_goal_invalid')); return; }
    setSavingGoal(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/api/me/goal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ goal_amount: amt, goal_label: goalLabel || 'A minha meta' }),
      });
      await fetchUser();
      toast.success('Meta definida com sucesso!');
    } catch (_) { toast.error('Erro ao guardar meta'); }
    setSavingGoal(false);
  };

  // Detectar dispositivo a partir do user-agent
  const getDeviceLabel = (ua) => {
    if (!ua) return 'Desconhecido';
    if (/Mobile|Android|iPhone/i.test(ua)) return 'Telemóvel';
    if (/Tablet|iPad/i.test(ua)) return 'Tablet';
    return 'Computador';
  };
  const getDeviceIcon = (ua) => {
    if (/Mobile|Android|iPhone/i.test(ua)) return Smartphone;
    return Monitor;
  };
  const getBrowserLabel = (ua) => {
    if (!ua) return '';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Browser';
  };

  const handleKycUpload = async (side, e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ficheiro demasiado grande', { description: 'Máximo 10 MB.' });
      return;
    }
    setKycUploading(p => ({ ...p, [side]: true }));
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('doc_type', `${kycDocType}_${side}`); // ex: bi_frente, bi_verso
      const res = await fetch(`${BACKEND_URL}/api/kyc/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Erro no upload');
      }
      toast.success(`${side === 'frente' ? 'Frente' : 'Verso'} enviado com sucesso!`, { description: 'A equipa irá rever em breve.' });
      // Recarregar estado KYC
      fetch(`${BACKEND_URL}/api/kyc/status`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setKycStatus(data); })
        .catch(() => {});
    } catch (err) {
      toast.error(err.message);
    } finally {
      setKycUploading(p => ({ ...p, [side]: false }));
      if (side === 'frente' && frontRef.current) frontRef.current.value = '';
      if (side === 'verso'  && backRef.current)  backRef.current.value  = '';
    }
  };

  const kycIcon = !kycStatus ? null
    : kycStatus.kyc_status === 'approved' ? <CheckCircle size={15} color="#22c58b" />
    : kycStatus.kyc_status === 'pending'  ? <Clock size={15} color="#FFBE0B" />
    : <AlertCircle size={15} color="#ef4444" />;

  const kycBadgeLabel = kycStatus?.kyc_status === 'approved' ? t('kyc_verified')
    : kycStatus?.kyc_status === 'pending' ? t('kyc_pending')
    : kycStatus?.kyc_status === 'rejected' ? t('kyc_rejected') : null;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>O Meu Perfil</h1>
        <p style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>Gere os dados da sua conta</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 20 }} className="profile-grid">

        {/* Formulário */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, background: 'hsl(214,100%,60%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff' }}>
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div data-testid="profile-name" style={{ fontSize: 16, fontWeight: 700, color: '#f3f5ff' }}>{user?.full_name}</div>
              <div data-testid="profile-email" style={{ fontSize: 12, color: 'hsl(215,16%,70%)' }}>{user?.email}</div>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>{t('profile_fullname')}</label>
              <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('profile_email')}</label>
              <input type="email" disabled value={user?.email || ''}
                style={{ ...inputStyle, background: 'hsl(240,18%,10%)', color: 'hsl(215,16%,50%)', cursor: 'not-allowed' }} />
            </div>
            <div>
              <label style={labelStyle}>{t('profile_phone')}</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+351 912 345 678" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('profile_country')}</label>
              <select value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} style={inputStyle}>
                {COUNTRY_KEYS.map(k => <option key={k} value={t(k)}>{t(k)}</option>)}
              </select>
            </div>
            <button data-testid="profile-save-button" type="submit" disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 24px', background: loading ? 'hsl(214,100%,60%,0.4)' : 'hsl(214,100%,60%)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              <Save size={15} />{loading ? t('prof_saving_btn') : t('prof_save_btn')}
            </button>
          </form>
        </div>

        {/* Resumo da conta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={card}>
            <div style={{ fontSize: 12, color: 'hsl(215,16%,70%)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, fontWeight: 700 }}>{t('prof_account_summary')}</div>
            {[
              { label: t('dash_available_balance'), value: formatEur(safeBalance), color: '#f3f5ff' },
              { label: t('nav_profit'),              value: `+${formatEur(safeProfit)}`, color: 'hsl(155,72%,45%)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid hsl(240,16%,18%)' }}>
                <span style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>{label}</span>
                <span className="numeric" style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>{t('prof_member_since')}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f3f5ff' }}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-PT') : '—'}
              </span>
            </div>
          </div>

          {/* Indicadores */}
          <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontSize: 12, color: 'hsl(215,16%,70%)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, fontWeight: 700 }}>{t('profile_indicators')}</div>
            {[
              { icon: TrendingUp, label: t('prof_total_return'),   value: `+${formatEur(safeProfit)}`, color: 'hsl(155,72%,45%)' },
              { icon: Shield,     label: t('prof_security_label'), value: t('prof_2fa_active'),        color: 'hsl(214,100%,60%)' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, background: `${color}18`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={13} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'hsl(215,16%,65%)' }}>{label}</div>
                  <div className="numeric" style={{ fontSize: 13, fontWeight: 700, color }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
          <button data-testid="profile-change-password-button"
            style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid hsl(240,16%,26%)', borderRadius: 10, color: 'hsl(215,16%,60%)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {t('prof_change_pw')}
          </button>
        </div>
      </div>

      {/* ── Metas de Investimento ── */}
      <div style={{ marginTop: 20, ...card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(255,190,11,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={17} color="#FFBE0B" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f3f5ff' }}>Meta de Investimento</div>
            <div style={{ fontSize: 12, color: 'hsl(215,16%,55%)' }}>Define um objetivo e acompanha o progresso</div>
          </div>
          {/* Botão editar / cancelar */}
          {user?.goal_amount > 0 && (
            <button
              onClick={() => setEditingGoal(e => !e)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: editingGoal ? 'rgba(239,68,68,0.1)' : 'rgba(255,190,11,0.1)', border: `1px solid ${editingGoal ? 'rgba(239,68,68,0.3)' : 'rgba(255,190,11,0.3)'}`, borderRadius: 8, color: editingGoal ? '#ef4444' : '#FFBE0B', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {editingGoal ? <><X size={12} />{t('adm_cancel')}</> : <><Edit2 size={12} />{t('prof_goal_edit')}</>}
            </button>
          )}
        </div>

        {/* Barra de progresso (só quando há meta e não está a editar) */}
        {user?.goal_amount > 0 && !editingGoal && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f3f5ff' }}>{user.goal_label || 'A minha meta'}</span>
              <span className="numeric" style={{ fontSize: 12, fontWeight: 700, color: '#FFBE0B' }}>
                {Math.min(100, Math.round((safeBalance / user.goal_amount) * 100))}%
              </span>
            </div>
            <div style={{ height: 10, background: 'hsl(240,18%,14%)', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (safeBalance / user.goal_amount) * 100)}%`, background: 'linear-gradient(90deg, #FFBE0B, #22c58b)', borderRadius: 5, transition: 'width 0.8s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span className="numeric" style={{ fontSize: 11, color: '#22c58b' }}>{formatEur(safeBalance)}</span>
              <span className="numeric" style={{ fontSize: 11, color: 'hsl(215,16%,50%)' }}>Meta: {formatEur(user.goal_amount)}</span>
            </div>
          </div>
        )}

        {/* Formulário (editar ou criar) */}
        {(editingGoal || !user?.goal_amount) && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 170 }}>
              <label style={labelStyle}>Nome da Meta</label>
              <input type="text" value={goalLabel} onChange={e => setGoalLabel(e.target.value)}
                placeholder="Ex: Casa, Reforma, Viagem…" style={inputStyle} data-testid="goal-label-input" />
            </div>
            <div style={{ flex: 1, minWidth: 130 }}>
              <label style={labelStyle}>Valor Alvo (€)</label>
              <input type="number" inputMode="decimal" min="1" value={goalAmount} onChange={e => setGoalAmount(e.target.value)}
                placeholder="Ex: 10000" style={inputStyle} data-testid="goal-amount-input" />
            </div>
            <button onClick={async () => { await handleSaveGoal(); setEditingGoal(false); }} disabled={savingGoal} data-testid="goal-save-btn"
              style={{ padding: '11px 18px', background: savingGoal ? 'rgba(255,190,11,0.3)' : '#FFBE0B', border: 'none', borderRadius: 10, color: '#06061a', fontSize: 13, fontWeight: 800, cursor: savingGoal ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <Target size={14} />{savingGoal ? 'A guardar…' : user?.goal_amount ? 'Actualizar' : 'Definir Meta'}
            </button>
          </div>
        )}
      </div>

      {/* Verificação KYC */}
      <div style={{ marginTop: 20, ...card }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(58,134,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={17} color="#3A86FF" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f3f5ff' }}>Verificação de Identidade (KYC)</div>
            <div style={{ fontSize: 12, color: 'hsl(215,16%,55%)' }}>Envie a frente e o verso do documento para activar saques completos</div>
          </div>
          {kycStatus?.kyc_status && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: kycStatus.kyc_status === 'approved' ? 'rgba(34,197,139,0.12)' : kycStatus.kyc_status === 'pending' ? 'rgba(255,190,11,0.12)' : 'rgba(239,68,68,0.12)',
              color:      kycStatus.kyc_status === 'approved' ? '#22c58b'              : kycStatus.kyc_status === 'pending' ? '#FFBE0B'              : '#ef4444',
              border:    `1px solid ${kycStatus.kyc_status === 'approved' ? 'rgba(34,197,139,0.25)' : kycStatus.kyc_status === 'pending' ? 'rgba(255,190,11,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}>
              {kycIcon}
              {kycBadgeLabel}
            </div>
          )}
        </div>

        {kycStatus?.kyc_status === 'approved' ? (
          <div style={{ padding: '16px', background: 'rgba(34,197,139,0.06)', border: '1px solid rgba(34,197,139,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={18} color="#22c58b" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#22c58b' }}>Identidade verificada com sucesso</div>
              <div style={{ fontSize: 11, color: 'hsl(215,16%,60%)', marginTop: 2 }}>A sua conta tem acesso completo a todos os serviços.</div>
            </div>
          </div>
        ) : (
          <>
            {/* Tipo de documento */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Tipo de Documento</label>
              <select value={kycDocType} onChange={e => setKycDocType(e.target.value)}
                style={{ ...inputStyle, maxWidth: 280 }} data-testid="kyc-doc-type-select">
                <option value="bi">{t('prof_bi_label')}</option>
                <option value="passport">{t('prof_passport_label')}</option>
                <option value="driver_license">{t('prof_license_label')}</option>
              </select>
            </div>

            {/* Frente e Verso */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="kyc-grid">
              {[
                { side: 'frente', label: 'Frente do Documento', ref: frontRef },
                { side: 'verso',  label: 'Verso do Documento',  ref: backRef  },
              ].map(({ side, label, ref: inputRef }) => {
                const uploaded  = kycStatus?.documents?.find(d => d.doc_type === `${kycDocType}_${side}`);
                const uploading = kycUploading[side];
                const stColor   = uploaded?.status === 'approved' ? '#22c58b' : uploaded?.status === 'rejected' ? '#ef4444' : '#FFBE0B';
                const stLabel   = uploaded?.status === 'approved' ? '✓ Aprovado' : uploaded?.status === 'rejected' ? '✗ Rejeitado' : '⏳ Em revisão';

                return (
                  <div key={side}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(215,16%,65%)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {side === 'frente' ? '🪪 Frente' : '🔄 Verso'} — {label}
                    </div>
                    <div
                      onClick={() => !uploading && !uploaded && inputRef.current?.click()}
                      data-testid={`kyc-upload-${side}`}
                      style={{
                        padding: '22px 14px',
                        border: `2px dashed ${uploaded ? stColor + '55' : 'hsl(240,16%,25%)'}`,
                        borderRadius: 12, textAlign: 'center',
                        cursor: uploading || uploaded ? 'default' : 'pointer',
                        background: uploaded ? `${stColor}0a` : 'hsl(240,18%,10%)',
                        transition: 'all 0.2s', minHeight: 120,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                      onMouseEnter={e => { if (!uploading && !uploaded) e.currentTarget.style.borderColor = '#3A86FF'; }}
                      onMouseLeave={e => { if (!uploading && !uploaded) e.currentTarget.style.borderColor = uploaded ? stColor + '55' : 'hsl(240,16%,25%)'; }}
                    >
                      {uploading ? (
                        <>
                          <div style={{ width: 24, height: 24, border: '2px solid #3A86FF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          <span style={{ fontSize: 12, color: '#7a8299' }}>A enviar…</span>
                        </>
                      ) : uploaded ? (
                        <>
                          <CheckCircle size={22} color={stColor} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: stColor }}>{stLabel}</span>
                          <span style={{ fontSize: 10, color: '#4a5068', wordBreak: 'break-all', maxWidth: '90%' }}>{uploaded.filename}</span>
                          <button onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
                            style={{ fontSize: 10, padding: '3px 10px', background: 'transparent', border: `1px solid ${stColor}50`, borderRadius: 6, color: stColor, cursor: 'pointer', marginTop: 2 }}>
                            Substituir
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload size={22} color="#3A86FF" />
                          <span style={{ fontSize: 12, color: 'hsl(215,16%,70%)', fontWeight: 500 }}>Clique para enviar</span>
                          <span style={{ fontSize: 10, color: '#4a5068' }}>JPG, PNG ou PDF · máx. 10 MB</span>
                        </>
                      )}
                    </div>
                    <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
                      onChange={e => handleKycUpload(side, e)} style={{ display: 'none' }} />
                  </div>
                );
              })}
            </div>

            {/* Aviso de privacidade */}
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(58,134,255,0.06)', border: '1px solid rgba(58,134,255,0.15)', borderRadius: 9, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Shield size={13} color="#3A86FF" style={{ marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 11, color: 'hsl(215,16%,60%)', lineHeight: 1.5, margin: 0 }}>
                Os seus documentos são armazenados de forma segura e utilizados exclusivamente para verificação de identidade, em conformidade com o RGPD e regulamentação IFSB.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
