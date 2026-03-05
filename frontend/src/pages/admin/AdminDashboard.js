import React, { useState, useEffect, useCallback } from 'react';
import { Search, Edit2, Check, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const STATUS_OPTIONS = ['Novo', 'Depositado', 'Call Later', 'Low Potential', 'No Answer', 'VIP', 'Bloqueado'];

const STATUS_STYLES = {
  'Novo': { bg: 'hsl(214,100%,60%,0.12)', color: 'hsl(214,100%,60%)', border: 'hsl(214,100%,60%,0.25)' },
  'Depositado': { bg: 'hsl(155,72%,45%,0.12)', color: 'hsl(155,72%,45%)', border: 'hsl(155,72%,45%,0.25)' },
  'Call Later': { bg: 'hsl(46,100%,52%,0.12)', color: 'hsl(46,100%,52%)', border: 'hsl(46,100%,52%,0.25)' },
  'Low Potential': { bg: 'hsl(215,16%,70%,0.12)', color: 'hsl(215,16%,70%)', border: 'hsl(215,16%,70%,0.25)' },
  'No Answer': { bg: 'hsl(240,18%,14%)', color: 'hsl(215,16%,60%)', border: 'hsl(240,16%,22%)' },
  'VIP': { bg: 'hsl(46,100%,52%,0.15)', color: 'hsl(46,100%,60%)', border: 'hsl(46,100%,52%,0.3)' },
  'Bloqueado': { bg: 'hsl(0,78%,54%,0.12)', color: 'hsl(0,78%,54%)', border: 'hsl(0,78%,54%,0.25)' },
};

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [editingBalance, setEditingBalance] = useState(null); // { userId, balance, profit }
  const [editValues, setEditValues] = useState({ balance: '', profit: '' });
  const [updatingStatus, setUpdatingStatus] = useState({});

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Listen for new deposits to refresh user list
  useEffect(() => {
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
  }, [fetchUsers]);

  const updateStatus = async (userId, newStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [userId]: true }));
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Erro');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      toast.success(`Status atualizado: ${newStatus}`);
    } catch (err) {
      toast.error('Erro ao atualizar status');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [userId]: false }));
    }
  };

  const startEditBalance = (user) => {
    setEditingBalance(user.id);
    setEditValues({ balance: String(user.balance || 0), profit: String(user.profit || 0) });
  };

  const saveBalance = async (userId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/balance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ balance: parseFloat(editValues.balance), profit: parseFloat(editValues.profit) }),
      });
      if (!res.ok) throw new Error('Erro');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, balance: parseFloat(editValues.balance), profit: parseFloat(editValues.profit) } : u));
      setEditingBalance(null);
      toast.success('Saldo atualizado!');
    } catch (err) {
      toast.error('Erro ao atualizar saldo');
    }
  };

  const formatEur = (val) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val || 0);

  const filteredUsers = users.filter(u => {
    const matchSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'Todos' || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>Dashboard de Leads</h1>
          <p style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>{users.length} utilizador{users.length !== 1 ? 'es' : ''} registado{users.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'Total', value: users.length, color: '#f3f5ff' },
            { label: 'Depositados', value: users.filter(u => u.status === 'Depositado').length, color: 'hsl(155,72%,45%)' },
            { label: 'Novos', value: users.filter(u => u.status === 'Novo').length, color: 'hsl(214,100%,60%)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 12, padding: '10px 16px', textAlign: 'center' }}>
              <div className="numeric" style={{ fontSize: 18, fontWeight: 700, color, fontFamily: 'var(--font-heading)' }}>{value}</div>
              <div style={{ fontSize: 11, color: 'hsl(215,16%,70%)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'hsl(215,16%,70%)' }} />
          <input
            data-testid="admin-leads-search-input"
            type="text"
            placeholder="Pesquisar por nome ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 32px', background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 9, color: '#f3f5ff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '9px 12px', background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 9, color: '#f3f5ff', fontSize: 13, outline: 'none' }}
        >
          <option value="Todos">Todos os status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table data-testid="admin-leads-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'hsl(240,18%,11%)' }}>
                {['Nome / Email', 'País', 'Status', 'Saldo', 'P/L', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'hsl(215,16%,70%)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'hsl(215,16%,70%)', fontSize: 13 }}>A carregar...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'hsl(215,16%,70%)', fontSize: 13 }}>Nenhum lead encontrado</td></tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const statusStyle = STATUS_STYLES[user.status] || STATUS_STYLES['Novo'];
                  const isEditing = editingBalance === user.id;

                  return (
                    <tr
                      key={user.id}
                      data-testid="admin-lead-row"
                      style={{ borderTop: '1px solid hsl(240,16%,18%)', background: idx % 2 === 0 ? 'transparent' : 'hsl(240,18%,8%,0.5)' }}
                    >
                      {/* Name/Email */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#f3f5ff' }}>{user.full_name}</div>
                        <div style={{ fontSize: 11, color: 'hsl(215,16%,60%)' }}>{user.email}</div>
                      </td>

                      {/* Country */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 12, color: 'hsl(215,16%,70%)' }}>{user.country || '-'}</span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <select
                            data-testid="admin-lead-status-button"
                            value={user.status || 'Novo'}
                            onChange={e => updateStatus(user.id, e.target.value)}
                            disabled={updatingStatus[user.id]}
                            style={{
                              padding: '4px 24px 4px 8px',
                              background: statusStyle.bg,
                              border: `1px solid ${statusStyle.border}`,
                              borderRadius: 6,
                              color: statusStyle.color,
                              fontSize: 11, fontWeight: 700,
                              cursor: 'pointer', outline: 'none',
                              appearance: 'none',
                            }}
                          >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </td>

                      {/* Balance */}
                      <td style={{ padding: '14px 16px' }}>
                        {isEditing ? (
                          <input
                            type="number" step="0.01"
                            value={editValues.balance}
                            onChange={e => setEditValues(prev => ({ ...prev, balance: e.target.value }))}
                            style={{ width: 90, padding: '5px 8px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(214,100%,60%,0.5)', borderRadius: 6, color: '#f3f5ff', fontSize: 12, outline: 'none' }}
                          />
                        ) : (
                          <span className="numeric" style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>{formatEur(user.balance)}</span>
                        )}
                      </td>

                      {/* Profit */}
                      <td style={{ padding: '14px 16px' }}>
                        {isEditing ? (
                          <input
                            type="number" step="0.01"
                            value={editValues.profit}
                            onChange={e => setEditValues(prev => ({ ...prev, profit: e.target.value }))}
                            style={{ width: 90, padding: '5px 8px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(214,100%,60%,0.5)', borderRadius: 6, color: '#f3f5ff', fontSize: 12, outline: 'none' }}
                          />
                        ) : (
                          <span className="numeric" style={{ fontSize: 13, fontWeight: 700, color: (user.profit || 0) >= 0 ? 'hsl(155,72%,45%)' : 'hsl(0,78%,54%)' }}>
                            {(user.profit || 0) >= 0 ? '+' : ''}{formatEur(user.profit)}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => saveBalance(user.id)}
                              style={{ padding: '6px 10px', background: 'hsl(155,72%,45%,0.15)', border: '1px solid hsl(155,72%,45%,0.3)', borderRadius: 7, color: 'hsl(155,72%,45%)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Check size={13} />
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingBalance(null)}
                              style={{ padding: '6px', background: 'transparent', border: '1px solid hsl(240,16%,22%)', borderRadius: 7, color: 'hsl(215,16%,70%)', cursor: 'pointer' }}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <button
                            data-testid="admin-edit-balance-button"
                            onClick={() => startEditBalance(user)}
                            style={{ padding: '6px 12px', background: 'hsl(214,100%,60%,0.1)', border: '1px solid hsl(214,100%,60%,0.25)', borderRadius: 7, color: 'hsl(214,100%,60%)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
                          >
                            <Edit2 size={12} />
                            Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
