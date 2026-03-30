import { useLang } from '../../context/LangContext';
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Edit2, Check, X, Eye, Percent, LogIn, Copy, Filter,
         Trash2, ChevronRight, Activity, Key } from 'lucide-react';
import { toast } from 'sonner';
import { LeadDrawer } from '../../components/admin/LeadDrawer';
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

const STATUS_KEY_MAP = {
  'Novo':          'adm_status_novo',
  'Depositado':    'adm_status_depositado',
  'Call Later':    'adm_status_call_later',
  'Sem Interesse': 'adm_status_sem_interesse',
  'Low Potential': 'adm_status_low_potential',
  'No Answer':     'adm_status_no_answer',
  'VIP':           'adm_status_vip',
  'Bloqueado':     'adm_status_blocked',
  'Contactado':    'adm_status_contactado',
  'Interessado':   'adm_status_interessado',
};

const getStatusLabel = (s, tFn) => {
  const key = STATUS_KEY_MAP[s];
  return key && tFn ? tFn(key) : s;
};
const fmt = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);
const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function AdminDashboard() {
  const { t } = useLang();
  // Helper para traduzir status mantendo valor DB inalterado
  const getStatusLabel = (s) => {
    const key = STATUS_KEY_MAP[s];
    return key ? t(key) : s;
  };
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
  // Bulk actions
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStatus, setBulkStatus]   = useState('');
  const [applyingBulk, setApplyingBulk] = useState(false);
  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }
  // Assign agent
  const [agents, setAgents] = useState([]);
  const [assignModal, setAssignModal] = useState(null); // { id, name, current_agent }

  // Carregar lista de agentes
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    fetch(`${BACKEND_URL}/api/admin/agents`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setAgents)
      .catch(() => {});
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${BACKEND_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401 || res.status === 403) {
        // Token expirado — limpar e redirecionar para login
        localStorage.removeItem('adminToken');
        window.location.href = '/adm/login';
        return;
      }
      if (res.ok) {
        const data = await res.json();
        data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setUsers(prev => {
          if (prev.length === data.length &&
              prev.every((u, i) => u.id === data[i]?.id && u.status === data[i]?.status && u.balance === data[i]?.balance)) {
            return prev;
          }
          return data;
        });
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

  /* ── Bulk Actions ── */
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(u => u.id)));
    }
  };
  const applyBulkStatus = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setApplyingBulk(true);
    const token = localStorage.getItem('adminToken');
    const promises = [...selectedIds].map(id =>
      fetch(`${BACKEND_URL}/api/admin/users/${id}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: bulkStatus }),
      })
    );
    await Promise.all(promises);
    setUsers(prev => prev.map(u => selectedIds.has(u.id) ? { ...u, status: bulkStatus } : u));
    toast.success(`${selectedIds.size} leads actualizados: ${bulkStatus}`);
    setSelectedIds(new Set());
    setBulkStatus('');
    setApplyingBulk(false);
  };

  const handleAssignAgent = async (userId, agentId) => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/leads/${userId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ agent_id: agentId || null }),
      });
      if (!res.ok) throw new Error('Erro ao atribuir');
      setUsers(prev => prev.map(u => u.id === userId
        ? { ...u, assigned_agent: agentId, assigned_agent_name: agents.find(a => a.id === agentId)?.full_name || '' }
        : u
      ));
      toast.success(agentId ? `Lead enviado para ${agents.find(a => a.id === agentId)?.full_name}!` : 'Atribuição removida!');
    } catch (e) {
      toast.error(e.message || 'Erro ao atribuir lead');
    }
    setAssignModal(null);
  };

  const handleExportCSV = () => {
    const token = localStorage.getItem('adminToken');
    fetch(`${BACKEND_URL}/api/admin/export/leads`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'leads.csv'; a.click();
        URL.revokeObjectURL(url);
        toast.success('CSV exportado!');
      })
      .catch(() => toast.error('Erro ao exportar'));
  };

  const handleDeleteUser = async (userId) => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Erro ao eliminar');
      }
      setUsers(prev => prev.filter(u => u.id !== userId));
      if (selectedLead?.id === userId) setSelectedLead(null);
      setSelectedIds(prev => { const n = new Set(prev); n.delete(userId); return n; });
      toast.success('Lead eliminado com sucesso!');
    } catch (e) {
      toast.error(e.message || 'Erro ao eliminar lead');
    }
    setConfirmDelete(null);
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


      {/* Modal de atribuição de agente */}
      {assignModal && (
        <>
          <div onClick={() => setAssignModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, backdropFilter: 'blur(3px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 201, background: '#111118', border: '1px solid rgba(58,134,255,0.3)', borderRadius: 20, padding: '28px 26px', width: 400, maxWidth: '95vw', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
              <div style={{ width: 40, height: 40, background: 'rgba(58,134,255,0.1)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LogIn size={18} color="#3A86FF" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f3f5ff' }}>Enviar Lead para Agente</div>
                <div style={{ fontSize: 12, color: '#7a8299' }}>{assignModal.name}</div>
              </div>
              <button onClick={() => setAssignModal(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#7a8299' }}><X size={18} /></button>
            </div>
            {assignModal.assigned_agent_name && (
              <div style={{ padding: '9px 13px', background: 'rgba(255,190,11,0.08)', border: '1px solid rgba(255,190,11,0.2)', borderRadius: 10, marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: '#FFBE0B', fontWeight: 700, marginBottom: 2 }}>Agente actual</div>
                <div style={{ fontSize: 13, color: '#f3f5ff' }}>{assignModal.assigned_agent_name}</div>
              </div>
            )}
            <div style={{ fontSize: 11, fontWeight: 700, color: '#7a8299', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {agents.length === 0 ? 'Nenhum agente criado' : 'Escolher agente'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14, maxHeight: 240, overflowY: 'auto' }}>
              {agents.map(agent => (
                <button key={agent.id} onClick={() => handleAssignAgent(assignModal.id, agent.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                    background: assignModal.assigned_agent === agent.id ? 'rgba(58,134,255,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${assignModal.assigned_agent === agent.id ? 'rgba(58,134,255,0.4)' : '#26263a'}`,
                    borderRadius: 11, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#3A86FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {agent.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f3f5ff' }}>{agent.full_name}</div>
                    <div style={{ fontSize: 11, color: '#4a5068' }}>{agent.email} · {agent.leads_count || 0} leads</div>
                  </div>
                  {assignModal.assigned_agent === agent.id && (
                    <span style={{ fontSize: 10, padding: '2px 7px', background: 'rgba(58,134,255,0.2)', borderRadius: 5, color: '#3A86FF', fontWeight: 700 }}>ACTUAL</span>
                  )}
                </button>
              ))}
              {agents.length === 0 && (
                <p style={{ fontSize: 12, color: '#4a5068', textAlign: 'center', padding: '16px 0', margin: 0 }}>
                  Crie agentes em <strong style={{ color: '#3A86FF' }}>/adm/agents</strong> primeiro.
                </p>
              )}
            </div>
            {assignModal.assigned_agent && (
              <button onClick={() => handleAssignAgent(assignModal.id, null)}
                style={{ width: '100%', padding: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 11, color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <X size={14} />Remover Atribuição
              </button>
            )}
          </div>
        </>
      )}


      {/* Modal de confirmação de eliminação */}
      {confirmDelete && (
        <>
          <div onClick={() => setConfirmDelete(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, backdropFilter: 'blur(3px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 201, background: '#111118', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 18, padding: '32px 28px', width: 360, maxWidth: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
            <div style={{ width: 52, height: 52, background: 'rgba(239,68,68,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={22} color="#ef4444" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: '#f3f5ff', textAlign: 'center', margin: '0 0 10px' }}>
              Eliminar Lead?
            </h3>
            <p style={{ fontSize: 13, color: '#7a8299', textAlign: 'center', lineHeight: 1.6, margin: '0 0 8px' }}>
              Tem a certeza que quer eliminar <strong style={{ color: '#f3f5ff' }}>{confirmDelete.name}</strong>?
            </p>
            <p style={{ fontSize: 12, color: '#ef4444', textAlign: 'center', margin: '0 0 24px', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
              ⚠ Esta acção é irreversível. Elimina a conta e todos os dados associados (depósitos, ordens, mensagens, documentos KYC).
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #26263a', borderRadius: 10, color: '#7a8299', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={() => handleDeleteUser(confirmDelete.id)}
                style={{ flex: 1, padding: '11px', background: '#ef4444', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Eliminar
              </button>
            </div>
          </div>
        </>
      )}

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>{t('adm_dash_title')}</h1>
          <p style={{ fontSize: 13, color: '#7a8299', margin: 0 }}>{users.length} {t('adm_dash_users_count')}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={handleExportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', background: 'rgba(34,197,139,0.1)', border: '1px solid rgba(34,197,139,0.25)', borderRadius: 9, color: '#22c58b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Copy size={12} />CSV
          </button>
          {[
            { label: t('adm_dash_stat_total'),  value: users.length,                                        color: '#f3f5ff' },
            { label: t('adm_dash_stat_dep'),   value: users.filter(u => u.status === 'Depositado').length,  color: '#22c58b' },
            { label: t('adm_dash_stat_today'), value: countToday,                                          color: '#3A86FF' },
            { label: t('adm_dash_stat_week'),  value: countWeek,                                           color: '#FFBE0B' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 12, padding: '8px 14px', textAlign: 'center', minWidth: 70 }}>
              <div className="numeric" style={{ fontSize: 18, fontWeight: 700, color, fontFamily: 'var(--font-heading)' }}>{value}</div>
              <div style={{ fontSize: 10, color: '#7a8299' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: selectedIds.size > 0 ? 8 : 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#7a8299' }} />
          <input data-testid="admin-leads-search-input" type="text" placeholder={t('adm_dash_search')}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 30px', background: '#111118', border: '1px solid #26263a', borderRadius: 9, color: '#f3f5ff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', background: '#111118', border: '1px solid #26263a', borderRadius: 9, color: '#f3f5ff', fontSize: 13, outline: 'none' }}>
          <option value="Todos">{t('adm_dash_all_statuses')}</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{getStatusLabel(s, t)}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 5 }}>
          <Filter size={13} color="#7a8299" style={{ alignSelf: 'center' }} />
          {[{ k: 'all', l: t('adm_dash_all_time') }, { k: 'today', l: t('adm_dash_today') }, { k: 'week', l: t('adm_dash_week') }, { k: 'month', l: t('adm_dash_month') }].map(({ k, l }) => (
            <button key={k} onClick={() => setDateFilter(k)}
              style={{ padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1px solid ${dateFilter === k ? 'rgba(58,134,255,0.4)' : '#26263a'}`, background: dateFilter === k ? 'rgba(58,134,255,0.12)' : 'transparent', color: dateFilter === k ? '#3A86FF' : '#7a8299' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 14px', background: 'rgba(58,134,255,0.1)', border: '1px solid rgba(58,134,255,0.3)', borderRadius: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#3A86FF' }}>{selectedIds.size} {t('adm_dash_selected')}</span>
          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
            style={{ padding: '6px 10px', background: '#0e0e1a', border: '1px solid rgba(58,134,255,0.4)', borderRadius: 7, color: '#f3f5ff', fontSize: 12, outline: 'none' }}>
            <option value="">{t('adm_dash_change_status')}</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{getStatusLabel(s, t)}</option>)}
          </select>
          <button onClick={applyBulkStatus} disabled={!bulkStatus || applyingBulk}
            style={{ padding: '6px 14px', background: bulkStatus ? '#3A86FF' : '#1e1e30', border: 'none', borderRadius: 7, color: '#fff', fontSize: 12, fontWeight: 700, cursor: bulkStatus ? 'pointer' : 'not-allowed' }}>
            {applyingBulk ? t('adm_dash_applying') : t('adm_dash_apply')}
          </button>
          <button onClick={() => setSelectedIds(new Set())}
            style={{ padding: '6px 10px', background: 'transparent', border: '1px solid #26263a', borderRadius: 7, color: '#7a8299', fontSize: 12, cursor: 'pointer' }}>
            {t('adm_cancel')}
          </button>
        </div>
      )}

      {/* Tabela */}
      <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table data-testid="admin-leads-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0d0d1a' }}>
                <th style={{ padding: '11px 14px', textAlign: 'center', width: 40 }}>
                  <input type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', accentColor: '#3A86FF' }} />
                </th>
                {['#', `${t('adm_dash_col_name')} / E-mail`, t('adm_dash_col_country'), t('adm_dash_col_balance'), t('adm_dash_col_profit'), 'AI Score', t('adm_dash_col_daily'), t('adm_dash_col_actions')].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#7a8299', fontSize: 13 }}>{t('adm_loading')}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#7a8299', fontSize: 13 }}>{t('adm_dash_no_leads')}</td></tr>
              ) : filtered.map((user, idx) => {
                const ss = STATUS_STYLES[user.status] || STATUS_STYLES['Novo'];
                const isEd = editing === user.id;
                const hasRate = (user.daily_profit_rate || 0) > 0;
                const isSelected = selectedIds.has(user.id);

                return (
                  <tr key={user.id} data-testid="admin-lead-row"
                    style={{ borderTop: '1px solid #1a1a2a', background: isSelected ? 'rgba(58,134,255,0.06)' : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>

                    {/* Checkbox */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(user.id)}
                        style={{ cursor: 'pointer', accentColor: '#3A86FF' }} />
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, color: '#4a5068', fontWeight: 700 }}>{idx + 1}</span>
                    </td>

                    {/* Nome / Email com estado à esquerda + botões impersonation */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Estado integrado no lado esquerdo */}
                        <select data-testid="admin-lead-status-button"
                          value={user.status || 'Novo'} onChange={e => updateStatus(user.id, e.target.value)}
                          disabled={updatingStatus[user.id]}
                          onClick={e => e.stopPropagation()}
                          style={{ padding: '4px 7px', background: ss.bg, border: `1px solid ${ss.border}`, borderRadius: 6, color: ss.color, fontSize: 10, fontWeight: 700, cursor: 'pointer', outline: 'none', appearance: 'none', minWidth: 90, flexShrink: 0 }}>
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{getStatusLabel(s, t)}</option>)}
                        </select>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#f3f5ff' }}>{user.full_name}</span>
                            {user.is_online && (
                              <div title="Online agora" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '1px 6px', background: 'rgba(34,197,139,0.12)', border: '1px solid rgba(34,197,139,0.3)', borderRadius: 4 }}>
                                <span style={{ width: 6, height: 6, background: '#22c58b', borderRadius: '50%', display: 'inline-block', animation: 'shimmer 2s ease infinite' }} />
                                <span style={{ fontSize: 9, fontWeight: 700, color: '#22c58b', letterSpacing: '0.04em' }}>ONLINE</span>
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: '#4a5068' }}>{user.email}</div>
                          <div style={{ fontSize: 10, color: '#26263a', marginTop: 1 }}>{fmtDate(user.created_at)}</div>
                          {/* Tags inline na tabela */}
                          {user.tags && user.tags.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
                              {user.tags.slice(0,3).map(t => {
                                const TAG_COLORS = { 'VIP':'#F59E0B','Alta Prioridade':'#ef4444','Precisa Mais Info':'#3A86FF','Quente':'#FF6B35','Frio':'#7a8299','Aguarda Doc.':'#22c58b' };
                                const c = TAG_COLORS[t] || '#a0a0c0';
                                return <span key={t} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 8, background: `${c}18`, color: c, fontWeight: 700, border: `1px solid ${c}35` }}>{t}</span>;
                              })}
                              {user.tags.length > 3 && <span style={{ fontSize: 9, color: '#4a5068' }}>+{user.tags.length - 3}</span>}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
                          <button data-testid="admin-login-as-btn" onClick={() => handleLoginAs(user)} title="Entrar como este cliente"
                            style={{ width: 26, height: 26, background: 'rgba(34,197,139,0.10)', border: '1px solid rgba(34,197,139,0.25)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <LogIn size={12} color="#22c58b" />
                          </button>
                          <button data-testid="admin-copy-link-btn" onClick={() => handleCopyLink(user)} title="Copiar link de acesso directo"
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

                    {/* AI Score */}
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      {(() => {
                        const score = user.ai_score || 0;
                        const color = score >= 80 ? '#ef4444' : score >= 60 ? '#f97316' : score >= 40 ? '#FFBE0B' : '#3A86FF';
                        const label = score >= 80 ? '🔥' : score >= 60 ? '⚡' : score >= 40 ? '🌡' : '🧊';
                        return (
                          <div title={`AI Score: ${score}/100`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: `${color}15`, border: `1px solid ${color}35`, borderRadius: 8 }}>
                            <span style={{ fontSize: 10 }}>{label}</span>
                            <span className="numeric" style={{ fontSize: 12, fontWeight: 800, color }}>{score}</span>
                          </div>
                        );
                      })()}
                    </td>

                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      {isEd ? (
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => saveBalance(user.id, editVals)} disabled={saving}
                            style={{ padding: '6px 10px', background: 'rgba(34,197,139,0.12)', border: '1px solid rgba(34,197,139,0.3)', borderRadius: 7, color: '#22c58b', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={13} />{saving ? '…' : t('adm_save')}
                          </button>
                          <button onClick={() => setEditing(null)}
                            style={{ padding: '6px', background: 'transparent', border: '1px solid #26263a', borderRadius: 7, color: '#7a8299', cursor: 'pointer' }}>
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          <button onClick={() => setSelectedLead(user)} title="Ver detalhes"
                            style={{ padding: '6px 10px', background: 'rgba(58,134,255,0.08)', border: '1px solid rgba(58,134,255,0.2)', borderRadius: 7, color: '#3A86FF', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Eye size={12} />{t('adm_action_view')}
                          </button>
                          <button data-testid="admin-edit-balance-button" onClick={() => startEdit(user)}
                            style={{ padding: '6px 10px', background: 'rgba(255,190,11,0.08)', border: '1px solid rgba(255,190,11,0.2)', borderRadius: 7, color: '#FFBE0B', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Edit2 size={12} />{t('adm_action_edit')}
                          </button>
                          {/* Botão enviar para agente */}
                          <button
                            onClick={() => setAssignModal({ id: user.id, name: user.full_name, assigned_agent: user.assigned_agent, assigned_agent_name: user.assigned_agent_name })}
                            title={user.assigned_agent_name ? `Agente: ${user.assigned_agent_name}` : 'Enviar para agente'}
                            style={{ padding: '6px 10px', background: user.assigned_agent ? 'rgba(168,85,247,0.12)' : 'rgba(122,130,153,0.08)', border: `1px solid ${user.assigned_agent ? 'rgba(168,85,247,0.3)' : 'rgba(122,130,153,0.2)'}`, borderRadius: 7, color: user.assigned_agent ? '#a855f7' : '#7a8299', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <LogIn size={12} />{user.assigned_agent_name ? user.assigned_agent_name.split(' ')[0] : t('adm_action_agent')}
                          </button>
                          <button
                            data-testid="admin-delete-lead-btn"
                            onClick={() => setConfirmDelete({ id: user.id, name: user.full_name })}
                            title="Eliminar lead e conta"
                            style={{ padding: '6px 8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trash2 size={13} />
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
          <strong style={{ color: '#FFBE0B' }}>% {t('adm_dash_col_daily')}:</strong> {t('adm_dash_daily_info')}
        </p>
      </div>
    </div>
  );
}
