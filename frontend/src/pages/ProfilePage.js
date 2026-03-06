import React, { useState, useEffect, useRef } from 'react';
import { Save, Shield, TrendingUp, Upload, CheckCircle, Clock, AlertCircle, Target, Monitor, Smartphone, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '../context/UserContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const COUNTRIES = ['Portugal','Espanha','França','Alemanha','Itália','Países Baixos','Bélgica','Suíssa','Suécia','Noruega','Dinamarca','Polónia','Hungria','República Checa','Ruménia','Brasil','Reino Unido','Outro'];

export default function ProfilePage() {
  const { user, fetchUser } = useUser();
  const [form, setForm] = useState({ full_name: '', phone: '', country: 'Portugal' });
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus]     = useState(null);
  const [kycUploading, setKycUploading] = useState(false);
  const [kycDocType, setKycDocType]   = useState('bi');
  const fileInputRef = useRef(null);

  // Goals
  const [goalAmount, setGoalAmount]   = useState('');
  const [goalLabel, setGoalLabel]     = useState('A minha meta');
  const [savingGoal, setSavingGoal]   = useState(false);

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
      toast.success('Perfil actualizado com sucesso!');
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
    if (!amt || amt <= 0) { toast.error('Valor inválido para a meta'); return; }
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

  const handleKycUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ficheiro demasiado grande', { description: 'Máximo 10 MB.' });
      return;
    }
    setKycUploading(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('doc_type', kycDocType);
      const res = await fetch(`${BACKEND_URL}/api/kyc/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Erro no upload');
      }
      toast.success('Documento enviado com sucesso!', { description: 'A equipa irá rever em breve.' });
      setKycStatus({ status: 'pendente', doc_type: kycDocType });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setKycUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const kycIcon = !kycStatus ? null
    : kycStatus.status === 'aprovado' ? <CheckCircle size={15} color="#22c58b" />
    : kycStatus.status === 'pendente' ? <Clock size={15} color="#FFBE0B" />
    : <AlertCircle size={15} color="#ef4444" />;

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
              <label style={labelStyle}>Nome Completo</label>
              <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Endereço de E-mail</label>
              <input type="email" disabled value={user?.email || ''}
                style={{ ...inputStyle, background: 'hsl(240,18%,10%)', color: 'hsl(215,16%,50%)', cursor: 'not-allowed' }} />
            </div>
            <div>
              <label style={labelStyle}>Número de Telemóvel</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+351 912 345 678" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>País de Residência</label>
              <select value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} style={inputStyle}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button data-testid="profile-save-button" type="submit" disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 24px', background: loading ? 'hsl(214,100%,60%,0.4)' : 'hsl(214,100%,60%)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              <Save size={15} />{loading ? 'A guardar…' : 'Guardar Alterações'}
            </button>
          </form>
        </div>

        {/* Resumo da conta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={card}>
            <div style={{ fontSize: 12, color: 'hsl(215,16%,70%)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, fontWeight: 700 }}>Resumo da Conta</div>
            {[
              { label: 'Saldo disponível', value: formatEur(safeBalance), color: '#f3f5ff' },
              { label: 'Lucro acumulado',  value: `+${formatEur(safeProfit)}`, color: 'hsl(155,72%,45%)' },
              { label: 'Estado da conta',  value: user?.status || 'Activa', color: 'hsl(214,100%,60%)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid hsl(240,16%,18%)' }}>
                <span style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>{label}</span>
                <span className="numeric" style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>Membro desde</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f3f5ff' }}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-PT') : '—'}
              </span>
            </div>
          </div>

          {/* Indicadores */}
          <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontSize: 12, color: 'hsl(215,16%,70%)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, fontWeight: 700 }}>Indicadores</div>
            {[
              { icon: TrendingUp, label: 'Rendimento total', value: `+${formatEur(safeProfit)}`, color: 'hsl(155,72%,45%)' },
              { icon: Shield,     label: 'Nível de segurança', value: '2FA activo', color: 'hsl(214,100%,60%)' },
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
            Alterar Palavra-passe
          </button>
        </div>
      </div>

      {/* ── Metas de Investimento ── */}
      <div style={{ marginTop: 20, ...card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(255,190,11,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={17} color="#FFBE0B" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f3f5ff' }}>Meta de Investimento</div>
            <div style={{ fontSize: 12, color: 'hsl(215,16%,55%)' }}>Define um objetivo e acompanha o progresso</div>
          </div>
        </div>

        {/* Barra de progresso */}
        {user?.goal_amount > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'hsl(215,16%,70%)' }}>{user.goal_label || 'A minha meta'}</span>
              <span className="numeric" style={{ fontSize: 12, fontWeight: 700, color: '#FFBE0B' }}>
                {Math.min(100, Math.round((safeBalance / user.goal_amount) * 100))}%
              </span>
            </div>
            <div style={{ height: 8, background: 'hsl(240,18%,14%)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (safeBalance / user.goal_amount) * 100)}%`,
                background: 'linear-gradient(90deg, #FFBE0B, #22c58b)',
                borderRadius: 4,
                transition: 'width 0.8s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span className="numeric" style={{ fontSize: 11, color: '#22c58b' }}>{formatEur(safeBalance)}</span>
              <span className="numeric" style={{ fontSize: 11, color: 'hsl(215,16%,50%)' }}>Meta: {formatEur(user.goal_amount)}</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={labelStyle}>Nome da Meta</label>
            <input type="text" value={goalLabel} onChange={e => setGoalLabel(e.target.value)}
              placeholder="Ex: Reforma, Férias, Casa…"
              style={inputStyle} data-testid="goal-label-input" />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={labelStyle}>Valor Alvo (€)</label>
            <input type="number" min="1" value={goalAmount} onChange={e => setGoalAmount(e.target.value)}
              placeholder="Ex: 10000"
              style={inputStyle} data-testid="goal-amount-input" />
          </div>
          <button onClick={handleSaveGoal} disabled={savingGoal} data-testid="goal-save-btn"
            style={{ padding: '11px 20px', background: savingGoal ? 'rgba(255,190,11,0.3)' : '#FFBE0B', border: 'none', borderRadius: 10, color: '#06061a', fontSize: 13, fontWeight: 800, cursor: savingGoal ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <Target size={14} />{savingGoal ? 'A guardar…' : 'Guardar Meta'}
          </button>
        </div>
      </div>

      {/* ── Histórico de Sessões ── */}
      <div style={{ marginTop: 20, ...card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(58,134,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={17} color="#3A86FF" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f3f5ff' }}>Histórico de Sessões</div>
            <div style={{ fontSize: 12, color: 'hsl(215,16%,55%)' }}>Últimos acessos à sua conta</div>
          </div>
        </div>
        {sessions.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'hsl(215,16%,45%)', fontSize: 13 }}>
            Sem sessões registadas ainda.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.map((s, i) => {
              const DevIcon = getDeviceIcon(s.user_agent);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'hsl(240,18%,10%)', borderRadius: 10, border: '1px solid hsl(240,16%,16%)' }}>
                  <div style={{ width: 34, height: 34, background: 'rgba(58,134,255,0.08)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <DevIcon size={15} color="#3A86FF" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f3f5ff' }}>
                      {getDeviceLabel(s.user_agent)} · {getBrowserLabel(s.user_agent)}
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: 'hsl(215,16%,55%)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Globe size={10} />{s.ip}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'hsl(215,16%,50%)', textAlign: 'right', flexShrink: 0 }}>
                    {s.created_at ? new Date(s.created_at).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </div>
                  {i === 0 && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 5, background: 'rgba(34,197,139,0.12)', color: '#22c58b', border: '1px solid rgba(34,197,139,0.25)', fontWeight: 700, flexShrink: 0 }}>Atual</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verificação KYC */}
      <div style={{ marginTop: 20, ...card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(58,134,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={17} color="#3A86FF" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f3f5ff' }}>Verificação de Identidade (KYC)</div>
            <div style={{ fontSize: 12, color: 'hsl(215,16%,55%)' }}>Envie o seu documento para activar saques completos</div>
          </div>
          {kycStatus && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: kycStatus.status === 'aprovado' ? 'rgba(34,197,139,0.12)' : kycStatus.status === 'pendente' ? 'rgba(255,190,11,0.12)' : 'rgba(239,68,68,0.12)',
              color: kycStatus.status === 'aprovado' ? '#22c58b' : kycStatus.status === 'pendente' ? '#FFBE0B' : '#ef4444',
              border: `1px solid ${kycStatus.status === 'aprovado' ? 'rgba(34,197,139,0.25)' : kycStatus.status === 'pendente' ? 'rgba(255,190,11,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}>
              {kycIcon}
              {kycStatus.status === 'aprovado' ? 'Verificado' : kycStatus.status === 'pendente' ? 'Em revisão' : 'Rejeitado'}
            </div>
          )}
        </div>

        {kycStatus?.status === 'aprovado' ? (
          <div style={{ padding: '16px', background: 'rgba(34,197,139,0.06)', border: '1px solid rgba(34,197,139,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={18} color="#22c58b" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#22c58b' }}>Identidade verificada com sucesso</div>
              <div style={{ fontSize: 11, color: 'hsl(215,16%,60%)', marginTop: 2 }}>A sua conta tem acesso completo a todos os serviços.</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '0 0 auto' }}>
              <label style={labelStyle}>Tipo de Documento</label>
              <select
                value={kycDocType}
                onChange={e => setKycDocType(e.target.value)}
                style={{ ...inputStyle, width: 'auto', minWidth: 200 }}
                data-testid="kyc-doc-type-select"
              >
                <option value="bi">Bilhete de Identidade / CC</option>
                <option value="passport">Passaporte</option>
                <option value="driver_license">Carta de Condução</option>
                <option value="proof_address">Comprovativo de Morada</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={labelStyle}>Ficheiro (PDF, JPG, PNG — máx. 10 MB)</label>
              <div
                onClick={() => !kycUploading && fileInputRef.current?.click()}
                data-testid="kyc-upload-area"
                style={{
                  padding: '18px', border: '2px dashed hsl(240,16%,25%)', borderRadius: 10,
                  textAlign: 'center', cursor: kycUploading ? 'not-allowed' : 'pointer',
                  background: 'hsl(240,18%,10%)',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => { if (!kycUploading) e.currentTarget.style.borderColor = '#3A86FF'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(240,16%,25%)'; }}
              >
                <Upload size={20} color={kycUploading ? '#4a5068' : '#3A86FF'} style={{ marginBottom: 6 }} />
                <div style={{ fontSize: 13, color: kycUploading ? '#4a5068' : 'hsl(215,16%,70%)', fontWeight: 500 }}>
                  {kycUploading ? 'A enviar…' : 'Clique para seleccionar ficheiro'}
                </div>
                {kycStatus?.status === 'pendente' && (
                  <div style={{ fontSize: 11, color: '#FFBE0B', marginTop: 6 }}>Documento já enviado — aguarda revisão</div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleKycUpload}
                style={{ display: 'none' }}
                data-testid="kyc-file-input"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
