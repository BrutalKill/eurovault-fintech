import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, MessageCircle, Phone, Mail, Globe, Clock,
         TrendingUp, Plus, Send, ChevronDown, LogOut, Activity, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const fmt = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);
const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const STATUS_OPTIONS = ['Novo','Depositado','Call Later','Low Potential','No Answer','VIP','Bloqueado'];
const STATUS_STYLES = {
  'Novo':          { bg:'rgba(58,134,255,0.12)', color:'#3A86FF', border:'rgba(58,134,255,0.25)' },
  'Depositado':    { bg:'rgba(34,197,139,0.12)', color:'#22c58b', border:'rgba(34,197,139,0.25)' },
  'Call Later':    { bg:'rgba(255,190,11,0.12)', color:'#FFBE0B', border:'rgba(255,190,11,0.25)' },
  'Low Potential': { bg:'rgba(122,130,153,0.12)',color:'#7a8299', border:'rgba(122,130,153,0.25)'},
  'No Answer':     { bg:'rgba(30,30,48,0.8)',   color:'#4a5068', border:'#26263a'                },
  'VIP':           { bg:'rgba(245,158,11,0.15)', color:'#F59E0B', border:'rgba(245,158,11,0.3)'  },
  'Bloqueado':     { bg:'rgba(239,68,68,0.12)',  color:'#ef4444', border:'rgba(239,68,68,0.25)'  },
};

/* Painel de comentários de um lead */
function LeadComments({ lead, token, onClose }) {
  const [comments, setComments] = useState([]);
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const [status, setStatus]     = useState(lead.status || 'Novo');
  const bottomRef = React.useRef(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/agent/leads/${lead.id}/comments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(data => { setComments(data); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); })
      .catch(() => {});
  }, [lead.id, token]);

  const sendComment = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/agent/leads/${lead.id}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => [...prev, data]);
        setText('');
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (_) { toast.error('Erro ao enviar comentário'); }
    setSending(false);
  };

  const updateStatus = async (newStatus) => {
    try {
      await fetch(`${BACKEND_URL}/api/agent/leads/${lead.id}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      setStatus(newStatus);
      toast.success(`Estado: ${newStatus}`);
    } catch (_) {}
  };

  const ss = STATUS_STYLES[status] || STATUS_STYLES['Novo'];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 400, maxWidth: '100vw', background: '#111118', borderLeft: '1px solid #26263a', zIndex: 101, display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 60px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #26263a', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#3A86FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {lead.full_name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f3f5ff' }}>{lead.full_name}</div>
            <div style={{ fontSize: 11, color: '#7a8299' }}>{lead.email}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a8299', padding: 4 }}><X size={18} /></button>
        </div>

        {/* Info + status */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #26263a', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          {/* Info */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {lead.phone && <span style={{ fontSize: 11, color: '#7a8299', display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={11} />{lead.phone}</span>}
            {lead.country && <span style={{ fontSize: 11, color: '#7a8299', display: 'flex', alignItems: 'center', gap: 5 }}><Globe size={11} />{lead.country}</span>}
            <span className="numeric" style={{ fontSize: 11, color: '#22c58b', display: 'flex', alignItems: 'center', gap: 5 }}><TrendingUp size={11} />{fmt(lead.balance)}</span>
          </div>
          {/* Estado */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {STATUS_OPTIONS.map(s => {
              const st = STATUS_STYLES[s];
              return (
                <button key={s} onClick={() => updateStatus(s)}
                  style={{ padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 700,
                    background: status === s ? st.bg : 'transparent',
                    border: `1px solid ${status === s ? st.border : '#26263a'}`,
                    color: status === s ? st.color : '#4a5068' }}>
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comentários */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#4a5068' }}>
              <MessageCircle size={24} style={{ opacity: 0.2, marginBottom: 8 }} />
              <p style={{ fontSize: 12, margin: 0 }}>Sem comentários ainda</p>
            </div>
          ) : comments.map((c, i) => {
            const isMe = c.author === 'agent';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '78%', padding: '8px 12px',
                  borderRadius: isMe ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                  background: isMe ? '#3A86FF' : '#1e1e30',
                  color: '#f3f5ff', fontSize: 12, lineHeight: 1.5,
                }}>
                  {!isMe && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginBottom: 3, fontWeight: 700 }}>{c.author_name}</div>}
                  <div>{c.text}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 3, textAlign: 'right' }}>
                    {c.created_at ? new Date(c.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid #26263a', display: 'flex', gap: 7, background: '#0a0a18', flexShrink: 0 }}>
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment(); } }}
            placeholder="Escrever comentário…"
            style={{ flex: 1, background: '#111118', border: '1px solid #26263a', borderRadius: 9, padding: '8px 12px', color: '#f3f5ff', fontSize: 13, outline: 'none' }}
          />
          <button onClick={sendComment} disabled={sending || !text.trim()}
            style={{ width: 36, height: 36, background: text.trim() ? '#3A86FF' : '#1e1e30', border: 'none', borderRadius: 8, cursor: text.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Send size={14} color="#fff" />
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Página principal do CRM do agente ── */
export default function AgentCRM() {
  const navigate                            = useNavigate();
  const [agent, setAgent]                   = useState(null);
  const [leads, setLeads]                   = useState([]);
  const [search, setSearch]                 = useState('');
  const [statusFilter, setStatusFilter]     = useState('Todos');
  const [loading, setLoading]               = useState(true);
  const [selectedLead, setSelectedLead]     = useState(null);
  const token = localStorage.getItem('agentToken');

  const fetchData = useCallback(async () => {
    if (!token) { navigate('/crm/login'); return; }
    try {
      const [meRes, leadsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/agent/me`,    { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/agent/leads`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!meRes.ok) { localStorage.removeItem('agentToken'); navigate('/crm/login'); return; }
      setAgent(await meRes.json());
      if (leadsRes.ok) setLeads(await leadsRes.json());
    } catch (_) {}
    setLoading(false);
  }, [token, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const logout = () => { localStorage.removeItem('agentToken'); navigate('/crm/login'); };

  const filtered = leads.filter(l => {
    const m = !search || l.full_name?.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase());
    const s = statusFilter === 'Todos' || l.status === statusFilter;
    return m && s;
  });

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#06061a', display:'flex', alignItems:'center', justifyContent:'center', color:'#7a8299', fontSize:13 }}>
      A carregar…
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#06061a', display: 'flex', flexDirection: 'column' }}>
      {selectedLead && <LeadComments lead={selectedLead} token={token} onClose={() => setSelectedLead(null)} />}

      {/* Topbar */}
      <header style={{ background: '#111118', borderBottom: '1px solid #26263a', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', top: 0, zIndex: 30 }}>
        <img src="/logo-eurovault.png" alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: '#f3f5ff' }}>EuroVault</span>
        <span style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(58,134,255,0.12)', border: '1px solid rgba(58,134,255,0.25)', borderRadius: 5, color: '#3A86FF', fontWeight: 700, letterSpacing: '0.08em' }}>CRM AGENTE</span>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 13, color: '#f3f5ff', fontWeight: 600 }}>
          Olá, {agent?.full_name?.split(' ')[0] || 'Agente'} 👋
        </div>
        <button onClick={logout} title="Sair"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'transparent', border: '1px solid #26263a', borderRadius: 8, color: '#7a8299', fontSize: 12, cursor: 'pointer' }}>
          <LogOut size={13} />Sair
        </button>
      </header>

      {/* Conteúdo */}
      <div style={{ flex: 1, padding: 24, maxWidth: 1100, margin: '0 auto', width: '100%' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total de Leads',  value: leads.length,                                          color: '#3A86FF' },
            { label: 'Depositados',     value: leads.filter(l => l.status==='Depositado').length,      color: '#22c58b' },
            { label: 'Call Later',      value: leads.filter(l => l.status==='Call Later').length,      color: '#FFBE0B' },
            { label: 'Com Comentários', value: leads.filter(l => l.comment_count > 0).length,          color: '#a855f7' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#111118', border: `1px solid ${color}20`, borderRadius: 14, padding: '16px 18px' }}>
              <div className="numeric" style={{ fontSize: 24, fontWeight: 900, color, fontFamily: 'var(--font-heading)' }}>{value}</div>
              <div style={{ fontSize: 11, color: '#7a8299', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#7a8299' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar lead…"
              style={{ width: '100%', padding: '8px 12px 8px 30px', background: '#111118', border: '1px solid #26263a', borderRadius: 9, color: '#f3f5ff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', background: '#111118', border: '1px solid #26263a', borderRadius: 9, color: '#f3f5ff', fontSize: 13, outline: 'none' }}>
            <option value="Todos">Todos os estados</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Tabela */}
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#7a8299' }}>A carregar…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#4a5068' }}>
            <Users size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
            <p style={{ fontSize: 13, margin: 0 }}>Sem leads atribuídos</p>
          </div>
        ) : (
          <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0d0d1a' }}>
                    {['Estado','Nome / E-mail','País','Saldo','Comentários','Registo'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead, i) => {
                    const ss = STATUS_STYLES[lead.status] || STATUS_STYLES['Novo'];
                    return (
                      <tr key={lead.id} style={{ borderTop: '1px solid #1a1a2a', cursor: 'pointer', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
                        onClick={() => setSelectedLead(lead)}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(58,134,255,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {lead.status || 'Novo'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#f3f5ff' }}>{lead.full_name}</div>
                          <div style={{ fontSize: 11, color: '#4a5068' }}>{lead.email}</div>
                        </td>
                        <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 12, color: '#7a8299' }}>{lead.country || '—'}</span></td>
                        <td style={{ padding: '10px 14px' }}><span className="numeric" style={{ fontSize: 13, fontWeight: 700, color: '#22c58b' }}>{fmt(lead.balance)}</span></td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MessageCircle size={13} color={lead.comment_count > 0 ? '#3A86FF' : '#26263a'} />
                            <span style={{ fontSize: 12, color: lead.comment_count > 0 ? '#3A86FF' : '#4a5068', fontWeight: lead.comment_count > 0 ? 700 : 400 }}>
                              {lead.comment_count || 0}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 11, color: '#4a5068' }}>{fmtDate(lead.created_at)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
