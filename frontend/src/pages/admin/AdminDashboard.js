import React, { useState, useEffect, useCallback } from 'react';
import { Search, Edit2, Check, X, TrendingUp, Percent } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const STATUS_OPTIONS = ['Novo', 'Depositado', 'Call Later', 'Low Potential', 'No Answer', 'VIP', 'Bloqueado'];

const STATUS_STYLES = {
  'Novo':           { bg: 'rgba(58,134,255,0.12)',  color: '#3A86FF',  border: 'rgba(58,134,255,0.25)' },
  'Depositado':     { bg: 'rgba(34,197,139,0.12)',  color: '#22c58b',  border: 'rgba(34,197,139,0.25)' },
  'Call Later':     { bg: 'rgba(255,190,11,0.12)',  color: '#FFBE0B',  border: 'rgba(255,190,11,0.25)' },
  'Low Potential':  { bg: 'rgba(122,130,153,0.12)', color: '#7a8299',  border: 'rgba(122,130,153,0.25)' },
  'No Answer':      { bg: 'rgba(30,30,48,0.8)',     color: '#4a5068',  border: '#26263a' },
  'VIP':            { bg: 'rgba(245,158,11,0.15)',  color: '#F59E0B',  border: 'rgba(245,158,11,0.3)' },
  'Bloqueado':      { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444',  border: 'rgba(239,68,68,0.25)' },
};

const fmt = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);

export default function AdminDashboard() {
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Estado de edição: null | { userId, balance, profit, daily_profit_rate }
  const [editing, setEditing]     = useState(null);
  const [editVals, setEditVals]   = useState({ balance: '', profit: '', daily_profit_rate: '' });
  const [saving, setSaving]       = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState({});

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUsers(await res.json());
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => {
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
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
      toast.success(`Estado actualizado: ${newStatus}`);
    } catch { toast.error('Erro ao actualizar estado'); }
    finally { setUpdatingStatus(p => ({ ...p, [userId]: false })); }
  };

  /* ── Edição inline ── */
  const startEdit = (user) => {
    setEditing(user.id);
    setEditVals({
      balance:           String(user.balance || 0),
      profit:            String(user.profit  || 0),
      daily_profit_rate: String(user.daily_profit_rate || 0),
    });
  };

  const saveEdit = async (userId) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');

      // Saldo + Lucro
      await fetch(`${BACKEND_URL}/api/admin/users/${userId}/balance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          balance: parseFloat(editVals.balance) || 0,
          profit:  Math.max(0, parseFloat(editVals.profit) || 0),
        }),
      });

      // Taxa diária
      const rate = parseFloat(editVals.daily_profit_rate) || 0;
      await fetch(`${BACKEND_URL}/api/admin/users/${userId}/daily-rate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ daily_profit_rate: rate }),
      });

      setUsers(prev => prev.map(u => u.id === userId ? {
        ...u,
        balance:           parseFloat(editVals.balance) || 0,
        profit:            Math.max(0, parseFloat(editVals.profit) || 0),
        daily_profit_rate: rate,
      } : u));
      setEditing(null);
      toast.success('Dados actualizados com sucesso!');
    } catch { toast.error('Erro ao guardar'); }
    finally { setSaving(false); }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'Todos' || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  /* ── Estilos comuns ── */
  const inp = (extra = {}) => ({
    padding: '5px 8px', background: '#0e0e1a',
    border: '1px solid rgba(58,134,255,0.4)',
    borderRadius: 7, color: '#f3f5ff', fontSize: 12, outline: 'none',
    ...extra,
  });

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>
            Dashboard de Leads
          </h1>
          <p style={{ fontSize: 13, color: '#7a8299' }}>{users.length} utilizador{users.length !== 1 ? 'es' : ''} registado{users.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Estatísticas rápidas */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Total',      value: users.length,                                     color: '#f3f5ff' },
            { label: 'Depositados',value: users.filter(u => u.status === 'Depositado').length, color: '#22c58b' },
            { label: 'Novos',      value: users.filter(u => u.status === 'Novo').length,      color: '#3A86FF' },
            { label: 'Com taxa',   value: users.filter(u => u.daily_profit_rate > 0).length,  color: '#FFBE0B' },
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
                {['Nome / E-mail', 'País', 'Estado', 'Saldo', 'Lucro', '% Diária', 'Acções'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#7a8299', fontSize: 13 }}>A carregar…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#7a8299', fontSize: 13 }}>Nenhum lead encontrado</td></tr>
              ) : filtered.map((user, idx) => {
                const ss = STATUS_STYLES[user.status] || STATUS_STYLES['Novo'];
                const isEd = editing === user.id;
                const hasRate = (user.daily_profit_rate || 0) > 0;

                return (
                  <tr key={user.id} data-testid="admin-lead-row"
                    style={{ borderTop: '1px solid #1a1a2a', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>

                    {/* Nome */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f3f5ff' }}>{user.full_name}</div>
                      <div style={{ fontSize: 11, color: '#4a5068' }}>{user.email}</div>
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
                        style={{ padding: '4px 8px', background: ss.bg, border: `1px solid ${ss.border}`, borderRadius: 6, color: ss.color, fontSize: 11, fontWeight: 700, cursor: 'pointer', outline: 'none', appearance: 'none' }}>
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
                            style={inp({ width: 70 })} />
                          <span style={{ fontSize: 11, color: '#7a8299' }}>%/dia</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span className="numeric" style={{ fontSize: 13, fontWeight: 700, color: hasRate ? '#FFBE0B' : '#4a5068' }}>
                            {hasRate ? `${user.daily_profit_rate}%` : '—'}
                          </span>
                          {hasRate && (
                            <span style={{ fontSize: 9, color: '#22c58b', background: 'rgba(34,197,139,0.1)', border: '1px solid rgba(34,197,139,0.2)', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>ACTIVO</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Acções */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      {isEd ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => saveEdit(user.id)} disabled={saving}
                            style={{ padding: '6px 10px', background: 'rgba(34,197,139,0.12)', border: '1px solid rgba(34,197,139,0.3)', borderRadius: 7, color: '#22c58b', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={13} />{saving ? 'A guardar…' : 'Guardar'}
                          </button>
                          <button onClick={() => setEditing(null)}
                            style={{ padding: '6px', background: 'transparent', border: '1px solid #26263a', borderRadius: 7, color: '#7a8299', cursor: 'pointer' }}>
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <button data-testid="admin-edit-balance-button" onClick={() => startEdit(user)}
                          style={{ padding: '6px 12px', background: 'rgba(58,134,255,0.1)', border: '1px solid rgba(58,134,255,0.25)', borderRadius: 7, color: '#3A86FF', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Edit2 size={12} />Editar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legenda da % diária */}
      <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,190,11,0.06)', border: '1px solid rgba(255,190,11,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Percent size={13} color="#FFBE0B" />
        <p style={{ fontSize: 11, color: '#7a8299', margin: 0 }}>
          <strong style={{ color: '#FFBE0B' }}>% Diária:</strong> O sistema aplica automaticamente a percentagem ao saldo do cliente a cada actualização. Ex.: 1% sobre 10.000€ = +100€/dia acumulados.
        </p>
      </div>
    </div>
  );
}
