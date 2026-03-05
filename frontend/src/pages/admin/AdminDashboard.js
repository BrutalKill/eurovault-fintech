import React, { useState, useEffect, useCallback } from 'react';
import { Search, Edit2, Check, X, Eye, Percent, User, Mail, Phone, Globe, Calendar, TrendingUp, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const STATUS_OPTIONS = [
  'Novo',
  'Depositado',
  'Call Later',
  'Sem Interesse',
  'Low Potential',
  'No Answer',
  'VIP',
  'Bloqueado',
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

const fmt = (v) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

/* ────────────────────────────────────────────────────────────────── */
/* Drawer de detalhes do lead                                         */
/* ────────────────────────────────────────────────────────────────── */
function LeadDrawer({ lead, onClose, onStatusChange, onBalanceSave }) {
  const [editVals, setEditVals] = useState({
    balance: String(lead.balance || 0),
    profit:  String(lead.profit  || 0),
    daily_profit_rate: String(lead.daily_profit_rate || 0),
  });
  const [saving, setSaving] = useState(false);

  const ss = STATUS_STYLES[lead.status] || STATUS_STYLES['Novo'];

  const handleSave = async () => {
    setSaving(true);
    await onBalanceSave(lead.id, editVals);
    setSaving(false);
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.65)',
          zIndex: 100,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 420, maxWidth: '100vw',
        background: '#111118',
        borderLeft: '1px solid #26263a',
        zIndex: 101,
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
      }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #26263a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#3A86FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {lead.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: '#f3f5ff' }}>{lead.full_name}</div>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, fontWeight: 700 }}>
                {lead.status || 'Novo'}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#7a8299', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Informações pessoais */}
          <section>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Dados Pessoais
            </div>
            {[
              { icon: User,     label: 'Nome completo', value: lead.full_name },
              { icon: Mail,     label: 'E-mail',        value: lead.email },
              { icon: Phone,    label: 'Telemóvel',     value: lead.phone || '—' },
              { icon: Globe,    label: 'País',          value: lead.country || '—' },
              { icon: Calendar, label: 'Registado em',  value: fmtDate(lead.created_at) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, background: 'rgba(58,134,255,0.08)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={13} color="#3A86FF" />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                  <div style={{ fontSize: 13, color: '#e8eaf6', fontWeight: 500, marginTop: 1, wordBreak: 'break-all' }}>{value}</div>
                </div>
              </div>
            ))}
          </section>

          {/* Estado */}
          <section>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Estado do Lead
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {STATUS_OPTIONS.map(s => {
                const st = STATUS_STYLES[s];
                const active = lead.status === s;
                return (
                  <button key={s} onClick={() => onStatusChange(lead.id, s)}
                    style={{
                      padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                      background: active ? st.bg : 'transparent',
                      border: `1px solid ${active ? st.border : '#26263a'}`,
                      color: active ? st.color : '#7a8299',
                      transition: 'all .15s',
                    }}>
                    {s}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Financeiro */}
          <section>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Dados Financeiros
            </div>

            {[
              { label: 'Saldo actual', key: 'balance', icon: CreditCard, color: '#f3f5ff',  prefix: '€' },
              { label: 'Lucro acumulado', key: 'profit',  icon: TrendingUp, color: '#22c58b', prefix: '+€' },
            ].map(({ label, key, icon: Icon, color, prefix }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#7a8299', marginBottom: 6 }}>{label}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={14} color={color} style={{ flexShrink: 0 }} />
                  <input
                    type="number" step="0.01" min="0"
                    value={editVals[key]}
                    onChange={e => setEditVals(p => ({ ...p, [key]: e.target.value }))}
                    style={{ flex: 1, padding: '8px 12px', background: '#0e0e1a', border: '1px solid rgba(58,134,255,0.3)', borderRadius: 8, color, fontSize: 14, fontWeight: 700, outline: 'none' }}
                  />
                </div>
                <div style={{ fontSize: 11, color: '#4a5068', marginTop: 4 }}>
                  Valor actual: <span style={{ color, fontWeight: 700 }}>{prefix}{fmt(lead[key]).replace('€', '').trim()}</span>
                </div>
              </div>
            ))}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#7a8299', marginBottom: 6 }}>
                Taxa de Lucro Diária (% / dia)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Percent size={14} color="#FFBE0B" style={{ flexShrink: 0 }} />
                <input
                  type="number" step="0.01" min="0" max="100"
                  value={editVals.daily_profit_rate}
                  onChange={e => setEditVals(p => ({ ...p, daily_profit_rate: e.target.value }))}
                  style={{ flex: 1, padding: '8px 12px', background: '#0e0e1a', border: '1px solid rgba(255,190,11,0.3)', borderRadius: 8, color: '#FFBE0B', fontSize: 14, fontWeight: 700, outline: 'none' }}
                />
                <span style={{ fontSize: 12, color: '#7a8299', flexShrink: 0 }}>%/dia</span>
              </div>
              {parseFloat(editVals.daily_profit_rate) > 0 && (
                <div style={{ fontSize: 11, color: '#22c58b', marginTop: 4 }}>
                  Lucro previsto / dia: +{fmt((parseFloat(editVals.balance) || 0) * (parseFloat(editVals.daily_profit_rate) / 100))}
                </div>
              )}
            </div>

            <button onClick={handleSave} disabled={saving}
              style={{ width: '100%', padding: '11px', background: saving ? '#1e1e30' : '#3A86FF', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Check size={14} />
              {saving ? 'A guardar…' : 'Guardar Dados Financeiros'}
            </button>
          </section>
        </div>
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* Dashboard principal                                                */
/* ────────────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [selectedLead, setSelectedLead] = useState(null);

  // Edição inline rápida (saldo/lucro/taxa)
  const [editing, setEditing]   = useState(null);
  const [editVals, setEditVals] = useState({ balance: '', profit: '', daily_profit_rate: '' });
  const [saving, setSaving]     = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState({});

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Mais recente primeiro
        data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setUsers(data);
      }
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => {
    const iv = setInterval(fetchUsers, 10000);
    return () => clearInterval(iv);
  }, [fetchUsers]);

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
      toast.success(`Estado actualizado: ${newStatus}`);
    } catch { toast.error('Erro ao actualizar estado'); }
    finally { setUpdatingStatus(p => ({ ...p, [userId]: false })); }
  };

  /* ── Guardar saldo / lucro / taxa ── */
  const saveBalance = async (userId, vals) => {
    try {
      const token = localStorage.getItem('adminToken');
      const balance = parseFloat(vals.balance) || 0;
      const profit  = Math.max(0, parseFloat(vals.profit)  || 0);
      const rate    = parseFloat(vals.daily_profit_rate)    || 0;

      await fetch(`${BACKEND_URL}/api/admin/users/${userId}/balance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ balance, profit }),
      });
      await fetch(`${BACKEND_URL}/api/admin/users/${userId}/daily-rate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ daily_profit_rate: rate }),
      });

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, balance, profit, daily_profit_rate: rate } : u));
      if (selectedLead?.id === userId) setSelectedLead(p => ({ ...p, balance, profit, daily_profit_rate: rate }));
      setEditing(null);
      toast.success('Dados financeiros actualizados!');
    } catch { toast.error('Erro ao guardar'); }
  };

  /* ── Edição inline ── */
  const startEdit = (user) => {
    setEditing(user.id);
    setEditVals({
      balance:           String(user.balance           || 0),
      profit:            String(user.profit            || 0),
      daily_profit_rate: String(user.daily_profit_rate || 0),
    });
  };

  /* ── Filtro ── */
  const filtered = users.filter(u => {
    const m = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const s = statusFilter === 'Todos' || u.status === statusFilter;
    return m && s;
  });

  const inp = (extra = {}) => ({
    padding: '5px 8px', background: '#0e0e1a',
    border: '1px solid rgba(58,134,255,0.4)',
    borderRadius: 7, color: '#f3f5ff', fontSize: 12, outline: 'none', ...extra,
  });

  return (
    <div style={{ position: 'relative' }}>

      {/* Drawer de detalhes */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusChange={updateStatus}
          onBalanceSave={saveBalance}
        />
      )}

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>Dashboard de Leads</h1>
          <p style={{ fontSize: 13, color: '#7a8299', margin: 0 }}>
            {users.length} utilizador{users.length !== 1 ? 'es' : ''} · do mais recente ao mais antigo
          </p>
        </div>

        {/* Estatísticas */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',       value: users.length,                                            color: '#f3f5ff'  },
            { label: 'Depositados', value: users.filter(u => u.status === 'Depositado').length,     color: '#22c58b'  },
            { label: 'Novos',       value: users.filter(u => u.status === 'Novo').length,           color: '#3A86FF'  },
            { label: 'Com taxa',    value: users.filter(u => (u.daily_profit_rate || 0) > 0).length, color: '#FFBE0B' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 12, padding: '8px 14px', textAlign: 'center', minWidth: 64 }}>
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
          <input data-testid="admin-leads-search-input" type="text"
            placeholder="Pesquisar por nome ou e-mail…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 30px', background: '#111118', border: '1px solid #26263a', borderRadius: 9, color: '#f3f5ff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', background: '#111118', border: '1px solid #26263a', borderRadius: 9, color: '#f3f5ff', fontSize: 13, outline: 'none' }}>
          <option value="Todos">Todos os estados</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table data-testid="admin-leads-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0d0d1a' }}>
                {['#', 'Nome / E-mail', 'País', 'Estado', 'Saldo', 'Lucro', '% Diária', 'Acções'].map(h => (
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
                const isEd   = editing === user.id;
                const hasRate = (user.daily_profit_rate || 0) > 0;

                return (
                  <tr key={user.id} data-testid="admin-lead-row"
                    style={{ borderTop: '1px solid #1a1a2a', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>

                    {/* Nº */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, color: '#4a5068', fontWeight: 700 }}>{idx + 1}</span>
                    </td>

                    {/* Nome / Email */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f3f5ff' }}>{user.full_name}</div>
                      <div style={{ fontSize: 11, color: '#4a5068' }}>{user.email}</div>
                      <div style={{ fontSize: 10, color: '#26263a', marginTop: 2 }}>{fmtDate(user.created_at)}</div>
                    </td>

                    {/* País */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 12, color: '#7a8299' }}>{user.country || '—'}</span>
                    </td>

                    {/* Estado */}
                    <td style={{ padding: '12px 14px' }}>
                      <select data-testid="admin-lead-status-button"
                        value={user.status || 'Novo'}
                        onChange={e => updateStatus(user.id, e.target.value)}
                        disabled={updatingStatus[user.id]}
                        style={{ padding: '4px 8px', background: ss.bg, border: `1px solid ${ss.border}`, borderRadius: 6, color: ss.color, fontSize: 11, fontWeight: 700, cursor: 'pointer', outline: 'none', appearance: 'none', minWidth: 110 }}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>

                    {/* Saldo */}
                    <td style={{ padding: '12px 14px' }}>
                      {isEd ? (
                        <input type="number" step="0.01" value={editVals.balance}
                          onChange={e => setEditVals(p => ({ ...p, balance: e.target.value }))}
                          style={inp({ width: 90 })} />
                      ) : (
                        <span className="numeric" style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>{fmt(user.balance)}</span>
                      )}
                    </td>

                    {/* Lucro */}
                    <td style={{ padding: '12px 14px' }}>
                      {isEd ? (
                        <input type="number" step="0.01" value={editVals.profit}
                          onChange={e => setEditVals(p => ({ ...p, profit: e.target.value }))}
                          style={inp({ width: 90 })} />
                      ) : (
                        <span className="numeric" style={{ fontSize: 13, fontWeight: 700, color: '#22c58b' }}>+{fmt(user.profit)}</span>
                      )}
                    </td>

                    {/* Taxa diária */}
                    <td style={{ padding: '12px 14px' }}>
                      {isEd ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input type="number" step="0.01" min="0" max="100" value={editVals.daily_profit_rate}
                            onChange={e => setEditVals(p => ({ ...p, daily_profit_rate: e.target.value }))}
                            style={inp({ width: 66 })} />
                          <span style={{ fontSize: 11, color: '#7a8299' }}>%</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span className="numeric" style={{ fontSize: 12, fontWeight: 700, color: hasRate ? '#FFBE0B' : '#4a5068' }}>
                            {hasRate ? `${user.daily_profit_rate}%` : '—'}
                          </span>
                          {hasRate && (
                            <span style={{ fontSize: 9, color: '#22c58b', background: 'rgba(34,197,139,0.1)', border: '1px solid rgba(34,197,139,0.2)', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>ON</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Acções */}
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
                          {/* Ver detalhes */}
                          <button onClick={() => setSelectedLead(user)}
                            title="Ver todos os dados"
                            style={{ padding: '6px 10px', background: 'rgba(58,134,255,0.08)', border: '1px solid rgba(58,134,255,0.2)', borderRadius: 7, color: '#3A86FF', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Eye size={12} />Ver
                          </button>
                          {/* Edição rápida */}
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

      {/* Legenda % diária */}
      <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,190,11,0.05)', border: '1px solid rgba(255,190,11,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Percent size={13} color="#FFBE0B" />
        <p style={{ fontSize: 11, color: '#7a8299', margin: 0 }}>
          <strong style={{ color: '#FFBE0B' }}>% Diária:</strong> O sistema aplica automaticamente a percentagem ao saldo a cada actualização.
          Ex.: 1% sobre 10.000€ = +100€/dia acumulados.
        </p>
      </div>
    </div>
  );
}
