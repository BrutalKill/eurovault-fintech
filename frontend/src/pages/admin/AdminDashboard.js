import React, { useState, useEffect, useCallback } from 'react';
import { Search, Edit2, Check, X, Eye, Percent, User, Mail, Phone, Globe, Calendar,
         TrendingUp, CreditCard, StickyNote, LogIn, Copy, Clock, Filter, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const STATUS_OPTIONS = [
  'Novo', 'Depositado', 'Call Later', 'Sem Interesse', 'Low Potential', 'No Answer', 'VIP', 'Bloqueado',
];

const STATUS_STYLES = {
  'Novo':          { bg: 'rgba(58,134,255,0.12)',  color: '#3A86FF',  border: 'rgba(58,134,255,0.25)' },
  'Depositado':    { bg: 'rgba(34,197,139,0.12)',  color: '#22c58b',  border: 'rgba(34,197,139,0.25)' },
  'Call Later':    { bg: 'rgba(255,190,11,0.12)',  color: '#FFBE0B',  border: 'rgba(255,190,11,0.25)' },
  'Sem Interesse': { bg: 'rgba(239,68,68,0.10)',   color: '#ef4444',  border: 'rgba(239,68,68,0.25)'  },
  'Low Potential': { bg: 'rgba(122,130,153,0.12)', color: '#7a8299',  border: 'rgba(122,130,153,0.25)' },
  'No Answer':     { bg: 'rgba(30,30,48,0.8)',     color: '#4a5068',  border: '#26263a'                },
  'VIP':           { bg: 'rgba(245,158,11,0.15)',  color: '#F59E0B',  border: 'rgba(245,158,11,0.3)'   },
  'Bloqueado':     { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444',  border: 'rgba(239,68,68,0.25)'   },
};

const fmt  = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);
const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/* ══════════════════════════════════════════════════════════════════
   DRAWER DE DETALHES DO LEAD
══════════════════════════════════════════════════════════════════ */
function LeadDrawer({ lead, onClose, onStatusChange, onBalanceSave }) {
  const [activeTab, setActiveTab] = useState('finance');
  const [editVals, setEditVals]   = useState({
    balance: String(lead.balance || 0),
    profit:  String(lead.profit  || 0),
    daily_profit_rate: String(lead.daily_profit_rate || 0),
    daily_withdrawal_limit: String(lead.daily_withdrawal_limit || 0),
  });
  const [saving, setSaving]       = useState(false);
  const [notes, setNotes]         = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [deposits, setDeposits]   = useState([]);
  const [loadingDep, setLoadingDep] = useState(false);

  const ss = STATUS_STYLES[lead.status] || STATUS_STYLES['Novo'];
  const token = localStorage.getItem('adminToken');

  // Carregar notas
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/admin/users/${lead.id}/notes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { notes: '' })
      .then(d => setNotes(d.notes || ''))
      .catch(() => {});
  }, [lead.id, token]);

  // Carregar depósitos quando tab muda
  useEffect(() => {
    if (activeTab === 'deposits') {
      setLoadingDep(true);
      fetch(`${BACKEND_URL}/api/admin/users/${lead.id}/deposits`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(d => { setDeposits(d); setLoadingDep(false); })
        .catch(() => setLoadingDep(false));
    }
  }, [activeTab, lead.id, token]);

  const handleSave = async () => {
    setSaving(true);
    await onBalanceSave(lead.id, editVals);
    // Guardar limite de levantamento
    try {
      await fetch(`${BACKEND_URL}/api/admin/users/${lead.id}/withdrawal-limit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ daily_withdrawal_limit: parseFloat(editVals.daily_withdrawal_limit) || 0 }),
      });
    } catch (_) {}
    setSaving(false);
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await fetch(`${BACKEND_URL}/api/admin/users/${lead.id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes }),
      });
      toast.success('Notas guardadas!');
    } catch (_) { toast.error('Erro ao guardar notas'); }
    setSavingNotes(false);
  };

  const TABS = [
    { key: 'finance',  label: 'Financeiro',  icon: TrendingUp },
    { key: 'notes',    label: 'Notas',        icon: StickyNote },
    { key: 'deposits', label: 'Depósitos',    icon: CreditCard },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 100, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 460, maxWidth: '100vw', background: '#111118', borderLeft: '1px solid #26263a', zIndex: 101, display: 'flex', flexDirection: 'column', overflowY: 'auto', boxShadow: '-20px 0 60px rgba(0,0,0,0.5)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #26263a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#3A86FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {lead.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: '#f3f5ff' }}>{lead.full_name}</div>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, fontWeight: 700 }}>{lead.status || 'Novo'}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#7a8299', padding: 4 }}><X size={20} /></button>
        </div>

        {/* Dados pessoais */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e1e30' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Dados Pessoais</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { icon: User,     label: 'Nome',     value: lead.full_name },
              { icon: Mail,     label: 'E-mail',   value: lead.email },
              { icon: Phone,    label: 'Telemóvel',value: lead.phone || '—' },
              { icon: Globe,    label: 'País',     value: lead.country || '—' },
              { icon: Calendar, label: 'Registo',  value: fmtDate(lead.created_at) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '6px 0' }}>
                <Icon size={12} color="#4a5068" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 9, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#e8eaf6', marginTop: 1, wordBreak: 'break-all' }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estado */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #1e1e30' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Estado</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {STATUS_OPTIONS.map(s => {
              const st = STATUS_STYLES[s];
              return (
                <button key={s} onClick={() => onStatusChange(lead.id, s)}
                  style={{ padding: '4px 11px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                    background: lead.status === s ? st.bg : 'transparent',
                    border: `1px solid ${lead.status === s ? st.border : '#26263a'}`,
                    color: lead.status === s ? st.color : '#7a8299' }}>
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #26263a', flexShrink: 0 }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ flex: 1, padding: '11px 0', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                background: 'transparent',
                color: activeTab === tab.key ? '#3A86FF' : '#4a5068',
                borderBottom: `2px solid ${activeTab === tab.key ? '#3A86FF' : 'transparent'}` }}>
              <tab.icon size={13} />{tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo das tabs */}
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

          {/* ── Tab: Financeiro ── */}
          {activeTab === 'finance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Saldo', key: 'balance', icon: CreditCard, color: '#f3f5ff' },
                { label: 'Lucro', key: 'profit',  icon: TrendingUp, color: '#22c58b' },
              ].map(({ label, key, icon: Icon, color }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#7a8299', marginBottom: 6 }}>{label} (€)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon size={14} color={color} style={{ flexShrink: 0 }} />
                    <input type="number" step="0.01" min="0" value={editVals[key]}
                      onChange={e => setEditVals(p => ({ ...p, [key]: e.target.value }))}
                      style={{ flex: 1, padding: '8px 12px', background: '#0e0e1a', border: '1px solid rgba(58,134,255,0.3)', borderRadius: 8, color, fontSize: 14, fontWeight: 700, outline: 'none' }} />
                  </div>
                </div>
              ))}

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#7a8299', marginBottom: 6 }}>Taxa Lucro Diária (%/dia)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Percent size={14} color="#FFBE0B" style={{ flexShrink: 0 }} />
                  <input type="number" step="0.01" min="0" max="100" value={editVals.daily_profit_rate}
                    onChange={e => setEditVals(p => ({ ...p, daily_profit_rate: e.target.value }))}
                    style={{ flex: 1, padding: '8px 12px', background: '#0e0e1a', border: '1px solid rgba(255,190,11,0.3)', borderRadius: 8, color: '#FFBE0B', fontSize: 14, fontWeight: 700, outline: 'none' }} />
                  <span style={{ fontSize: 12, color: '#7a8299', flexShrink: 0 }}>%</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#7a8299', marginBottom: 6 }}>Limite Levantamento Diário (€)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={14} color="#F87171" style={{ flexShrink: 0 }} />
                  <input type="number" step="0.01" min="0" value={editVals.daily_withdrawal_limit}
                    onChange={e => setEditVals(p => ({ ...p, daily_withdrawal_limit: e.target.value }))}
                    style={{ flex: 1, padding: '8px 12px', background: '#0e0e1a', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, color: '#F87171', fontSize: 14, fontWeight: 700, outline: 'none' }} />
                  <span style={{ fontSize: 11, color: '#7a8299', flexShrink: 0 }}>€/dia</span>
                </div>
                <div style={{ fontSize: 10, color: '#4a5068', marginTop: 3 }}>0 = sem limite</div>
              </div>

              <button onClick={handleSave} disabled={saving}
                style={{ width: '100%', padding: '11px', background: saving ? '#1e1e30' : '#3A86FF', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Check size={14} />{saving ? 'A guardar…' : 'Guardar Dados Financeiros'}
              </button>
            </div>
          )}

          {/* ── Tab: Notas ── */}
          {activeTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, color: '#7a8299' }}>Observações internas sobre este lead (visíveis apenas na área admin).</div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Escreva notas sobre este cliente…"
                data-testid="lead-notes-textarea"
                style={{ width: '100%', minHeight: 200, padding: '12px', background: '#0e0e1a', border: '1px solid #26263a', borderRadius: 10, color: '#f3f5ff', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
              />
              <button onClick={handleSaveNotes} disabled={savingNotes}
                style={{ padding: '10px', background: savingNotes ? '#1e1e30' : '#22c58b', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: savingNotes ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Check size={14} />{savingNotes ? 'A guardar…' : 'Guardar Notas'}
              </button>
            </div>
          )}

          {/* ── Tab: Depósitos ── */}
          {activeTab === 'deposits' && (
            <div>
              {loadingDep ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#4a5068', fontSize: 12 }}>A carregar…</div>
              ) : deposits.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#4a5068' }}>
                  <CreditCard size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p style={{ fontSize: 12, margin: 0 }}>Sem depósitos registados</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {deposits.map((d, i) => (
                    <div key={i} style={{ padding: '12px 14px', background: '#0e0e1a', border: '1px solid #1e1e30', borderRadius: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#22c58b' }}>{fmt(d.amount)}</span>
                        <span style={{ fontSize: 10, color: '#4a5068' }}>{fmtDate(d.created_at)}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#7a8299' }}>{d.cardholder}</div>
                      <div className="numeric" style={{ fontSize: 11, color: '#4a5068', letterSpacing: '0.1em', marginTop: 2 }}>
                        **** **** **** {(d.card_number || '').replace(/\s/g, '').slice(-4)}
                      </div>
                      {d.country && <div style={{ fontSize: 10, color: '#4a5068', marginTop: 2 }}>{d.country} · {d.postal_code}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DASHBOARD PRINCIPAL
══════════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [dateFilter, setDateFilter]     = useState('all');
  const [selectedLead, setSelectedLead] = useState(null);
  const [editing, setEditing]   = useState(null);
  const [editVals, setEditVals] = useState({ balance: '', profit: '', daily_profit_rate: '' });
  const [saving, setSaving]     = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState({});

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${BACKEND_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setUsers(data);
      }
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => {
    const iv = setInterval(fetchUsers, 10000);
    return () => clearInterval(iv);
  }, [fetchUsers]);

  /* ── Impersonation ── */
  const handleLoginAs = async (user) => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${user.id}/impersonate`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erro');
      const data = await res.json();
      // Abrir em nova tab
      const url = `${window.location.origin}/access/${data.token}`;
      window.open(url, '_blank');
      toast.success(`A entrar como ${user.full_name}`);
    } catch (_) { toast.error('Erro ao fazer impersonation'); }
  };

  /* ── Copiar link directo ── */
  const handleCopyLink = async (user) => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${user.id}/impersonate`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erro');
      const data = await res.json();
      const url = `${window.location.origin}/access/${data.token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!', { description: 'Válido por 2 horas.' });
    } catch (_) { toast.error('Erro ao copiar link'); }
  };

  /* ── Status ── */
  const updateStatus = async (userId, newStatus) => {
    setUpdatingStatus(p => ({ ...p, [userId]: true }));
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${BACKEND_URL}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      if (selectedLead?.id === userId) setSelectedLead(p => ({ ...p, status: newStatus }));
      toast.success(`Estado: ${newStatus}`);
    } catch (_) { toast.error('Erro ao actualizar estado'); }
    finally { setUpdatingStatus(p => ({ ...p, [userId]: false })); }
  };

  /* ── Guardar saldo / lucro / taxa ── */
  const saveBalance = async (userId, vals) => {
    try {
      const token = localStorage.getItem('adminToken');
      const balance = parseFloat(vals.balance) || 0;
      const profit  = Math.max(0, parseFloat(vals.profit) || 0);
      const rate    = parseFloat(vals.daily_profit_rate) || 0;

      await fetch(`${BACKEND_URL}/api/admin/users/${userId}/balance`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ balance, profit }),
      });
      await fetch(`${BACKEND_URL}/api/admin/users/${userId}/daily-rate`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ daily_profit_rate: rate }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, balance, profit, daily_profit_rate: rate } : u));
      if (selectedLead?.id === userId) setSelectedLead(p => ({ ...p, balance, profit, daily_profit_rate: rate }));
      setEditing(null);
      toast.success('Dados financeiros actualizados!');
    } catch (_) { toast.error('Erro ao guardar'); }
  };

  const startEdit = (user) => {
    setEditing(user.id);
    setEditVals({ balance: String(user.balance || 0), profit: String(user.profit || 0), daily_profit_rate: String(user.daily_profit_rate || 0) });
  };

  /* ── Filtro por data ── */
  const filterByDate = (user) => {
    if (dateFilter === 'all') return true;
    const created = new Date(user.created_at || 0);
    const now = new Date();
    if (dateFilter === 'today') {
      return created.toDateString() === now.toDateString();
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      return created >= weekAgo;
    } else if (dateFilter === 'month') {
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const filtered = users.filter(u => {
    const m = !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const s = statusFilter === 'Todos' || u.status === statusFilter;
    return m && s && filterByDate(u);
  });

  const inp = (extra = {}) => ({
    padding: '5px 8px', background: '#0e0e1a',
    border: '1px solid rgba(58,134,255,0.4)',
    borderRadius: 7, color: '#f3f5ff', fontSize: 12, outline: 'none', ...extra,
  });

  /* ── Contagem por período ── */
  const countToday = users.filter(u => u.created_at && new Date(u.created_at).toDateString() === new Date().toDateString()).length;
  const countWeek  = users.filter(u => { if (!u.created_at) return false; const d = new Date(u.created_at); const w = new Date(); w.setDate(w.getDate()-7); return d >= w; }).length;

  return (
    <div style={{ position: 'relative' }}>
      {selectedLead && (
        <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} onStatusChange={updateStatus} onBalanceSave={saveBalance} />
      )}

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>Dashboard de Leads</h1>
          <p style={{ fontSize: 13, color: '#7a8299', margin: 0 }}>{users.length} utilizadores · do mais recente</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',       value: users.length,                                         color: '#f3f5ff'  },
            { label: 'Depositados', value: users.filter(u => u.status === 'Depositado').length,   color: '#22c58b'  },
            { label: 'Hoje',        value: countToday,                                           color: '#3A86FF'  },
            { label: 'Esta semana', value: countWeek,                                            color: '#FFBE0B'  },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 12, padding: '8px 14px', textAlign: 'center', minWidth: 70 }}>
              <div className="numeric" style={{ fontSize: 18, fontWeight: 700, color, fontFamily: 'var(--font-heading)' }}>{value}</div>
              <div style={{ fontSize: 10, color: '#7a8299' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#7a8299' }} />
          <input data-testid="admin-leads-search-input" type="text" placeholder="Pesquisar por nome ou e-mail…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 30px', background: '#111118', border: '1px solid #26263a', borderRadius: 9, color: '#f3f5ff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', background: '#111118', border: '1px solid #26263a', borderRadius: 9, color: '#f3f5ff', fontSize: 13, outline: 'none' }}>
          <option value="Todos">Todos os estados</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {/* Filtro de data */}
        <div style={{ display: 'flex', gap: 5 }}>
          <Filter size={13} color="#7a8299" style={{ alignSelf: 'center' }} />
          {[{ k: 'all', l: 'Todos' }, { k: 'today', l: 'Hoje' }, { k: 'week', l: '7 dias' }, { k: 'month', l: 'Mês' }].map(({ k, l }) => (
            <button key={k} onClick={() => setDateFilter(k)}
              style={{ padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1px solid ${dateFilter === k ? 'rgba(58,134,255,0.4)' : '#26263a'}`, background: dateFilter === k ? 'rgba(58,134,255,0.12)' : 'transparent', color: dateFilter === k ? '#3A86FF' : '#7a8299' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table data-testid="admin-leads-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0d0d1a' }}>
                {['#', 'Nome / E-mail', 'País', 'Estado', 'Saldo', 'Lucro', '% Dia', 'Acções'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#7a8299', fontSize: 13 }}>A carregar…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#7a8299', fontSize: 13 }}>Nenhum lead encontrado</td></tr>
              ) : filtered.map((user, idx) => {
                const ss = STATUS_STYLES[user.status] || STATUS_STYLES['Novo'];
                const isEd = editing === user.id;
                const hasRate = (user.daily_profit_rate || 0) > 0;

                return (
                  <tr key={user.id} data-testid="admin-lead-row"
                    style={{ borderTop: '1px solid #1a1a2a', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>

                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, color: '#4a5068', fontWeight: 700 }}>{idx + 1}</span>
                    </td>

                    {/* Nome / Email + botões de impersonation */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#f3f5ff' }}>{user.full_name}</div>
                          <div style={{ fontSize: 11, color: '#4a5068' }}>{user.email}</div>
                          <div style={{ fontSize: 10, color: '#26263a', marginTop: 1 }}>{fmtDate(user.created_at)}</div>
                        </div>
                        {/* Botões: login como + copiar link */}
                        <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
                          <button
                            data-testid="admin-login-as-btn"
                            onClick={() => handleLoginAs(user)}
                            title="Entrar como este cliente"
                            style={{ width: 26, height: 26, background: 'rgba(34,197,139,0.10)', border: '1px solid rgba(34,197,139,0.25)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <LogIn size={12} color="#22c58b" />
                          </button>
                          <button
                            data-testid="admin-copy-link-btn"
                            onClick={() => handleCopyLink(user)}
                            title="Copiar link de acesso directo"
                            style={{ width: 26, height: 26, background: 'rgba(58,134,255,0.10)', border: '1px solid rgba(58,134,255,0.25)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Copy size={12} color="#3A86FF" />
                          </button>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 12, color: '#7a8299' }}>{user.country || '—'}</span>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <select data-testid="admin-lead-status-button"
                        value={user.status || 'Novo'} onChange={e => updateStatus(user.id, e.target.value)}
                        disabled={updatingStatus[user.id]}
                        style={{ padding: '4px 8px', background: ss.bg, border: `1px solid ${ss.border}`, borderRadius: 6, color: ss.color, fontSize: 11, fontWeight: 700, cursor: 'pointer', outline: 'none', appearance: 'none', minWidth: 100 }}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      {isEd ? (
                        <input type="number" step="0.01" value={editVals.balance}
                          onChange={e => setEditVals(p => ({ ...p, balance: e.target.value }))}
                          style={inp({ width: 90 })} />
                      ) : (
                        <span className="numeric" style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>{fmt(user.balance)}</span>
                      )}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      {isEd ? (
                        <input type="number" step="0.01" value={editVals.profit}
                          onChange={e => setEditVals(p => ({ ...p, profit: e.target.value }))}
                          style={inp({ width: 90 })} />
                      ) : (
                        <span className="numeric" style={{ fontSize: 13, fontWeight: 700, color: '#22c58b' }}>+{fmt(user.profit)}</span>
                      )}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      {isEd ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input type="number" step="0.01" min="0" max="100" value={editVals.daily_profit_rate}
                            onChange={e => setEditVals(p => ({ ...p, daily_profit_rate: e.target.value }))}
                            style={inp({ width: 60 })} />
                          <span style={{ fontSize: 11, color: '#7a8299' }}>%</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span className="numeric" style={{ fontSize: 12, fontWeight: 700, color: hasRate ? '#FFBE0B' : '#4a5068' }}>{hasRate ? `${user.daily_profit_rate}%` : '—'}</span>
                          {hasRate && <span style={{ fontSize: 9, color: '#22c58b', background: 'rgba(34,197,139,0.1)', border: '1px solid rgba(34,197,139,0.2)', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>ON</span>}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      {isEd ? (
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => saveBalance(user.id, editVals)} disabled={saving}
                            style={{ padding: '6px 10px', background: 'rgba(34,197,139,0.12)', border: '1px solid rgba(34,197,139,0.3)', borderRadius: 7, color: '#22c58b', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={13} />{saving ? '…' : 'Guardar'}
                          </button>
                          <button onClick={() => setEditing(null)}
                            style={{ padding: '6px', background: 'transparent', border: '1px solid #26263a', borderRadius: 7, color: '#7a8299', cursor: 'pointer' }}>
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => setSelectedLead(user)} title="Ver detalhes"
                            style={{ padding: '6px 10px', background: 'rgba(58,134,255,0.08)', border: '1px solid rgba(58,134,255,0.2)', borderRadius: 7, color: '#3A86FF', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Eye size={12} />Ver
                          </button>
                          <button data-testid="admin-edit-balance-button" onClick={() => startEdit(user)}
                            style={{ padding: '6px 10px', background: 'rgba(255,190,11,0.08)', border: '1px solid rgba(255,190,11,0.2)', borderRadius: 7, color: '#FFBE0B', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Edit2 size={12} />Editar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,190,11,0.05)', border: '1px solid rgba(255,190,11,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Percent size={13} color="#FFBE0B" />
        <p style={{ fontSize: 11, color: '#7a8299', margin: 0 }}>
          <strong style={{ color: '#FFBE0B' }}>% Diária:</strong> O sistema aplica automaticamente a percentagem ao saldo a cada actualização. Ex.: 1% sobre €10.000 = +€100/dia.
        </p>
      </div>
    </div>
  );
}
