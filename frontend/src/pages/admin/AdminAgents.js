import { useLang } from '../../context/LangContext';
import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Trash2, Users, Eye, X, Check, MessageCircle, Mail, Phone, Globe } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const STATUS_STYLES = {
  'Novo':       { color:'#3A86FF', bg:'rgba(58,134,255,0.12)',  border:'rgba(58,134,255,0.25)' },
  'Depositado': { color:'#22c58b', bg:'rgba(34,197,139,0.12)',  border:'rgba(34,197,139,0.25)' },
  'Call Later': { color:'#FFBE0B', bg:'rgba(255,190,11,0.12)',  border:'rgba(255,190,11,0.25)' },
  'No Answer':  { color:'#4a5068', bg:'rgba(30,30,48,0.8)',     border:'#26263a'               },
  'VIP':        { color:'#F59E0B', bg:'rgba(245,158,11,0.15)',  border:'rgba(245,158,11,0.3)'  },
};

function CreateAgentModal({ onClose, onCreated }) {
  const [form, setForm]     = useState({ full_name: '', email: '', password: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/agents`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao criar agente');
      toast.success(`Agente ${data.full_name} criado!`);
      onCreated();
      onClose();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const inp = { width: '100%', padding: '10px 12px', background: '#0e0e1a', border: '1px solid #26263a', borderRadius: 9, color: '#f3f5ff', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: '#7a8299', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 201, background: '#111118', border: '1px solid rgba(58,134,255,0.3)', borderRadius: 20, padding: '28px 26px', width: 420, maxWidth: '95vw', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(58,134,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserPlus size={16} color="#3A86FF" /></div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#f3f5ff', margin: 0 }}>Criar Novo Agente</h3>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#7a8299' }}><X size={18} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            ['Nome Completo', 'full_name', 'text', 'Nome do agente', true],
            ['E-mail', 'email', 'email', 'agente@gmail.com', true],
            ['Password', 'password', 'password', '••••••••', true],
          ].map(([label, key, type, placeholder, required]) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <input type={type} required={required} placeholder={placeholder} value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })} style={inp} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #26263a', borderRadius: 10, color: '#7a8299', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ flex: 2, padding: '10px', background: saving ? '#1e1e30' : '#3A86FF', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 3px 12px rgba(58,134,255,0.35)' }}>
              {saving ? t('adm_agents_creating') : t('adm_agents_create_btn')}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default function AdminAgents() {
  const { t } = useLang();
  const [agents, setAgents]           = useState([]);
  const [leads, setLeads]             = useState([]); // leads do agente seleccionado
  const [allLeads, setAllLeads]       = useState([]); // todos os leads p/ atribuição
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [comments, setComments]       = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [commentText, setCommentText] = useState('');

  const token = localStorage.getItem('adminToken');
  const h = { Authorization: `Bearer ${token}` };

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/agents`, { headers: h });
      if (res.ok) setAgents(await res.json());
    } catch (_) {}
    setLoading(false);
  }, []); // eslint-disable-line

  const fetchAllLeads = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users`, { headers: h });
      if (res.ok) {
        const data = await res.json();
        setAllLeads(data);
      }
    } catch (_) {}
  }, []); // eslint-disable-line

  useEffect(() => { fetchAgents(); fetchAllLeads(); }, [fetchAgents, fetchAllLeads]);

  const viewAgentLeads = async (agent) => {
    setSelectedAgent(agent);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/agents/${agent.id}/leads`, { headers: h });
      if (res.ok) setLeads(await res.json());
    } catch (_) {}
  };

  const deleteAgent = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/api/admin/agents/${id}`, { method: 'DELETE', headers: h });
      setAgents(prev => prev.filter(a => a.id !== id));
      toast.success('Agente eliminado');
    } catch (_) {}
    setConfirmDelete(null);
  };

  const assignLead = async (leadId, agentId) => {
    try {
      await fetch(`${BACKEND_URL}/api/admin/leads/${leadId}/assign`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', ...h },
        body: JSON.stringify({ agent_id: agentId || null }),
      });
      toast.success(agentId ? 'Lead atribuído!' : 'Atribuição removida');
      fetchAllLeads();
      if (selectedAgent) viewAgentLeads(selectedAgent);
    } catch (_) {}
  };

  const viewComments = async (lead) => {
    setSelectedLead(lead);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/leads/${lead.id}/comments`, { headers: h });
      if (res.ok) setComments(await res.json());
    } catch (_) {}
  };

  const addComment = async () => {
    if (!commentText.trim() || !selectedLead) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/leads/${selectedLead.id}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...h },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      if (res.ok) { const data = await res.json(); setComments(prev => [...prev, data]); setCommentText(''); }
    } catch (_) {}
  };

  return (
    <div>
      {showCreate && <CreateAgentModal onClose={() => setShowCreate(false)} onCreated={fetchAgents} />}

      {/* Modal comentários */}
      {selectedLead && (
        <>
          <div onClick={() => setSelectedLead(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, backdropFilter: 'blur(3px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 201, background: '#111118', border: '1px solid #26263a', borderRadius: 18, width: 460, maxWidth: '95vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #26263a', display: 'flex', alignItems: 'center', gap: 10 }}>
              <MessageCircle size={16} color="#3A86FF" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f3f5ff' }}>Comentários — {selectedLead.full_name}</div>
                <div style={{ fontSize: 11, color: '#7a8299' }}>{selectedLead.email}</div>
              </div>
              <button onClick={() => setSelectedLead(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a8299' }}><X size={16} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#4a5068', fontSize: 12 }}>Sem comentários</div>
              ) : comments.map((c, i) => (
                <div key={i} style={{ padding: '8px 12px', background: c.author === 'admin' ? 'rgba(58,134,255,0.08)' : '#0e0e1a', border: `1px solid ${c.author === 'admin' ? 'rgba(58,134,255,0.2)' : '#1e1e30'}`, borderRadius: 9 }}>
                  <div style={{ fontSize: 10, color: c.author === 'admin' ? '#3A86FF' : '#FFBE0B', fontWeight: 700, marginBottom: 4 }}>
                    {c.author_name} · {c.created_at ? new Date(c.created_at).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                  <div style={{ fontSize: 13, color: '#e8eaf6' }}>{c.text}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 14px', borderTop: '1px solid #26263a', display: 'flex', gap: 7, background: '#0a0a18' }}>
              <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addComment(); }}
                placeholder="Adicionar comentário…"
                style={{ flex: 1, background: '#111118', border: '1px solid #26263a', borderRadius: 8, padding: '8px 11px', color: '#f3f5ff', fontSize: 12, outline: 'none' }} />
              <button onClick={addComment} disabled={!commentText.trim()}
                style={{ width: 34, height: 34, background: commentText.trim() ? '#3A86FF' : '#1e1e30', border: 'none', borderRadius: 8, cursor: commentText.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={14} color="#fff" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <>
          <div onClick={() => setConfirmDelete(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 201, background: '#111118', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16, padding: '24px 22px', width: 340, textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
            <Trash2 size={22} color="#ef4444" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: '#f3f5ff', margin: '0 0 20px' }}>Eliminar <strong>{confirmDelete.name}</strong>?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '9px', background: 'transparent', border: '1px solid #26263a', borderRadius: 9, color: '#7a8299', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
              <button onClick={() => deleteAgent(confirmDelete.id)} style={{ flex: 1, padding: '9px', background: '#ef4444', border: 'none', borderRadius: 9, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Eliminar</button>
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff', margin: 0 }}>{`${t('adm_agents_title')}`}</h1>
          <p style={{ fontSize: 13, color: '#7a8299', margin: '4px 0 0' }}>Gerir agentes, atribuir leads e ver comentários</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/crm" target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,190,11,0.1)', border: '1px solid rgba(255,190,11,0.25)', borderRadius: 9, color: '#FFBE0B', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            🔗 Abrir CRM Agentes
          </a>
          <button onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: '#3A86FF', border: 'none', borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 12px rgba(58,134,255,0.35)' }}>
            <UserPlus size={14} />Criar Agente
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedAgent ? '340px 1fr' : '1fr', gap: 20, alignItems: 'start' }}>

        {/* Lista de agentes */}
        <div>
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#4a5068' }}>A carregar…</div>
          ) : agents.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#4a5068', background: '#111118', border: '1px solid #26263a', borderRadius: 14 }}>
              <Users size={28} style={{ opacity: 0.2, marginBottom: 10 }} />
              <p style={{ fontSize: 13, margin: '0 0 14px' }}>Nenhum agente criado ainda</p>
              <button onClick={() => setShowCreate(true)} style={{ padding: '8px 20px', background: '#3A86FF', border: 'none', borderRadius: 9, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Criar primeiro agente
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {agents.map(agent => (
                <div key={agent.id} style={{ background: '#111118', border: `1px solid ${selectedAgent?.id === agent.id ? 'rgba(58,134,255,0.4)' : '#26263a'}`, borderRadius: 14, padding: '14px 16px', cursor: 'pointer', transition: 'border-color .15s' }}
                  onClick={() => viewAgentLeads(agent)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#3A86FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {agent.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>{agent.full_name}</div>
                      <div style={{ fontSize: 11, color: '#4a5068', display: 'flex', alignItems: 'center', gap: 5 }}><Mail size={9} />{agent.email}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="numeric" style={{ fontSize: 16, fontWeight: 800, color: '#3A86FF', fontFamily: 'var(--font-heading)' }}>{agent.leads_count}</div>
                      <div style={{ fontSize: 9, color: '#4a5068' }}>leads</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setConfirmDelete({ id: agent.id, name: agent.full_name }); }}
                      style={{ width: 28, height: 28, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Trash2 size={12} color="#ef4444" />
                    </button>
                  </div>
                  {agent.phone && <div style={{ fontSize: 10, color: '#4a5068', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={9} />{agent.phone}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leads do agente seleccionado */}
        {selectedAgent && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f3f5ff' }}>Leads de {selectedAgent.full_name}</div>
                <div style={{ fontSize: 12, color: '#7a8299', marginTop: 2 }}>{leads.length} leads atribuídos</div>
              </div>
              <button onClick={() => setSelectedAgent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a8299' }}><X size={16} /></button>
            </div>

            {/* Atribuir lead ao agente */}
            <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7a8299', marginBottom: 8 }}>ATRIBUIR LEAD</div>
              <select onChange={e => { if (e.target.value) assignLead(e.target.value, selectedAgent.id); e.target.value = ''; }}
                style={{ width: '100%', padding: '8px 10px', background: '#0e0e1a', border: '1px solid #26263a', borderRadius: 8, color: '#f3f5ff', fontSize: 12, outline: 'none' }}>
                <option value="">Seleccionar lead para atribuir…</option>
                {allLeads.filter(l => l.assigned_agent !== selectedAgent.id).map(l => (
                  <option key={l.id} value={l.id}>{l.full_name} ({l.email}) — {l.assigned_agent ? 'Já atribuído' : 'Disponível'}</option>
                ))}
              </select>
            </div>

            {leads.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#4a5068', background: '#111118', border: '1px solid #26263a', borderRadius: 12 }}>
                <p style={{ fontSize: 12, margin: 0 }}>Sem leads atribuídos</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {leads.map(lead => {
                  const ss = STATUS_STYLES[lead.status] || STATUS_STYLES['Novo'];
                  return (
                    <div key={lead.id} style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, fontWeight: 700 }}>{lead.status}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#f3f5ff' }}>{lead.full_name}</span>
                        </div>
                        <div style={{ fontSize: 10, color: '#4a5068', display: 'flex', gap: 10 }}>
                          <span>{lead.email}</span>
                          {lead.country && <span><Globe size={9} style={{ marginRight: 3 }} />{lead.country}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => viewComments(lead)} title="Ver comentários"
                          style={{ width: 30, height: 30, background: lead.comment_count > 0 ? 'rgba(58,134,255,0.12)' : 'transparent', border: `1px solid ${lead.comment_count > 0 ? 'rgba(58,134,255,0.3)' : '#26263a'}`, borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                          <MessageCircle size={13} color={lead.comment_count > 0 ? '#3A86FF' : '#4a5068'} />
                          {lead.comment_count > 0 && <span style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, background: '#3A86FF', borderRadius: '50%', fontSize: 8, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{lead.comment_count}</span>}
                        </button>
                        <button onClick={() => assignLead(lead.id, null)} title="Remover atribuição"
                          style={{ width: 30, height: 30, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={12} color="#ef4444" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
