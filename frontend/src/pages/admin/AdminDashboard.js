import React, { useState, useEffect, useCallback } from 'react';
import { Search, Edit2, Check, X, Eye, Percent, User, Mail, Phone, Globe, Calendar,
         TrendingUp, CreditCard, StickyNote, LogIn, Copy, Clock, Filter, DollarSign, Trash2,
         Send, Plus, ChevronRight, Activity } from 'lucide-react';
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


/* ══════════════════════════════════════════════════════════════
   MODAL DE EMAIL
══════════════════════════════════════════════════════════════ */
function EmailModal({ lead, token, onClose }) {
  const [subject, setSubject] = useState('');
  const [body, setBody]       = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  const TEMPLATES = [
    { label: 'Boas-vindas',       subject: 'Bem-vindo à EuroVault Investments', body: `Olá ${lead.full_name},\n\nBem-vindo à EuroVault Investments!\n\nA sua conta está activa e pode começar a investir.\n\nAtenciosamente,\nEquipa EuroVault` },
    { label: 'Pedir KYC',         subject: 'Verificação de Identidade', body: `Olá ${lead.full_name},\n\nPara activar todos os serviços, envie o seu documento de identificação no perfil.\n\nAtenciosamente,\nEquipa EuroVault` },
    { label: 'Depósito recebido', subject: 'Depósito processado', body: `Olá ${lead.full_name},\n\nO seu depósito foi processado e está disponível na conta.\n\nAtenciosamente,\nEquipa EuroVault` },
    { label: 'Levantamento',      subject: 'Pedido de levantamento em processamento', body: `Olá ${lead.full_name},\n\nO seu pedido está a ser processado (1-2 dias úteis).\n\nAtenciosamente,\nEquipa EuroVault` },
  ];

  const sendEmail = async () => {
    if (!subject.trim() || !body.trim()) { toast.error('Preencha o assunto e o corpo'); return; }
    setSending(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${lead.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setSent(true);
      toast.success(`Email registado para ${lead.email}!`);
      setTimeout(onClose, 1500);
    } catch (e) { toast.error(e.message); }
    setSending(false);
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 301, background: '#111118', border: '1px solid rgba(58,134,255,0.3)', borderRadius: 20, width: 520, maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #26263a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(58,134,255,0.12)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={16} color="#3A86FF" /></div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f3f5ff' }}>Enviar Email</div>
              <div style={{ fontSize: 11, color: '#7a8299' }}>Para: {lead.email}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a8299', padding: 4 }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TEMPLATES.map(tpl => (
              <button key={tpl.label} onClick={() => { setSubject(tpl.subject); setBody(tpl.body); }}
                style={{ padding: '5px 11px', background: 'rgba(58,134,255,0.08)', border: '1px solid rgba(58,134,255,0.2)', borderRadius: 7, color: '#3A86FF', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                {tpl.label}
              </button>
            ))}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7a8299', marginBottom: 5 }}>ASSUNTO</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Assunto do email..."
              style={{ width: '100%', padding: '10px 12px', background: '#0e0e1a', border: '1px solid #26263a', borderRadius: 9, color: '#f3f5ff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7a8299', marginBottom: 5 }}>MENSAGEM</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Corpo do email..." rows={7}
              style={{ width: '100%', padding: '10px 12px', background: '#0e0e1a', border: '1px solid #26263a', borderRadius: 9, color: '#f3f5ff', fontSize: 13, outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid #26263a', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #26263a', borderRadius: 10, color: '#7a8299', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={sendEmail} disabled={sending || sent}
            style={{ flex: 2, padding: '10px', background: sent ? 'rgba(34,197,139,0.15)' : sending ? '#1e1e30' : 'linear-gradient(135deg,#2563eb,#3A86FF)', border: `1px solid ${sent ? 'rgba(34,197,139,0.3)':'transparent'}`, borderRadius: 10, color: sent ? '#22c58b' : '#fff', fontSize: 13, fontWeight: 700, cursor: sending||sent?'not-allowed':'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: sending||sent?'none':'0 3px 12px rgba(58,134,255,0.3)' }}>
            <Send size={14} />{sent ? 'Enviado!' : sending ? 'A enviar…' : `Enviar para ${lead.email}`}
          </button>
        </div>
      </div>
    </>
  );
}


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
  // Follow-up
  const [followupDate, setFollowupDate] = useState(lead.followup_date ? lead.followup_date.slice(0,16) : '');
  const [followupNote, setFollowupNote] = useState(lead.followup_note || '');
  const [savingFu, setSavingFu]   = useState(false);
  // Audit log
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  // Notes history
  const [notesHistory, setNotesHistory] = useState([]);
  // KYC docs
  const [kycDocs, setKycDocs]       = useState([]);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [updatingKyc, setUpdatingKyc] = useState({});
  // ── NOVAS: timeline de notas + email ──
  const [notesTimeline, setNotesTimeline] = useState([]);
  const [newNoteText, setNewNoteText]     = useState('');
  const [addingNote, setAddingNote]       = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const ss = STATUS_STYLES[lead.status] || STATUS_STYLES['Novo'];
  const token = localStorage.getItem('adminToken');

  // Carregar notas + timeline
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/admin/users/${lead.id}/notes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { notes: '' })
      .then(d => setNotes(d.notes || ''))
      .catch(() => {});
    fetch(`${BACKEND_URL}/api/admin/users/${lead.id}/notes/timeline`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setNotesTimeline)
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
    if (activeTab === 'audit') {
      setLoadingAudit(true);
      Promise.all([
        fetch(`${BACKEND_URL}/api/admin/users/${lead.id}/audit`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
        fetch(`${BACKEND_URL}/api/admin/users/${lead.id}/notes/history`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      ]).then(([audit, nh]) => {
        setAuditLogs(audit);
        setNotesHistory(nh);
        setLoadingAudit(false);
      }).catch(() => setLoadingAudit(false));
    }
    if (activeTab === 'kyc') {
      setLoadingKyc(true);
      fetch(`${BACKEND_URL}/api/admin/users/${lead.id}/kyc-docs`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(d => { setKycDocs(d); setLoadingKyc(false); })
        .catch(() => setLoadingKyc(false));
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
    if (!notes.trim() && notes !== '') {
      toast.error('Escreva alguma nota antes de guardar.');
      return;
    }
    setSavingNotes(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${lead.id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Erro HTTP ${res.status}`);
      }
      toast.success('Notas guardadas com sucesso!');
    } catch (e) {
      toast.error('Erro ao guardar notas: ' + (e.message || 'tente novamente'));
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAddNoteTimeline = async () => {
    if (!newNoteText.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${lead.id}/notes/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: newNoteText.trim() }),
      });
      if (res.ok) {
        const newEntry = { id: Date.now(), text: newNoteText.trim(), created_at: new Date().toISOString() };
        setNotesTimeline(prev => [newEntry, ...prev]);
        setNotes(newNoteText.trim());
        setNewNoteText('');
        toast.success('Nota adicionada!');
      }
    } catch (_) { toast.error('Erro ao adicionar nota'); }
    setAddingNote(false);
  };

  const handleDeleteNoteTimeline = async (noteId) => {
    try {
      await fetch(`${BACKEND_URL}/api/admin/users/${lead.id}/notes/timeline/${noteId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      setNotesTimeline(prev => prev.filter(n => n.id !== noteId));
    } catch (_) {}
  };

  const handleKycStatus = async (docId, status) => {
    setUpdatingKyc(p => ({ ...p, [docId]: true }));
    try {
      await fetch(`${BACKEND_URL}/api/admin/users/${lead.id}/kyc-docs/${docId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      setKycDocs(prev => prev.map(d => d.id === docId ? { ...d, status } : d));
      toast.success(`Documento ${status === 'approved' ? 'aprovado' : 'rejeitado'}!`);
    } catch (_) { toast.error('Erro ao actualizar documento'); }
    setUpdatingKyc(p => ({ ...p, [docId]: false }));
  };

  const handleSaveFollowup = async () => {    setSavingFu(true);
    try {
      await fetch(`${BACKEND_URL}/api/admin/users/${lead.id}/followup`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ followup_date: followupDate || null, followup_note: followupNote }),
      });
      toast.success('Follow-up agendado!');
    } catch (_) { toast.error('Erro ao agendar follow-up'); }
    setSavingFu(false);
  };

  const TABS = [
    { key: 'finance',  label: 'Financeiro',  icon: TrendingUp },
    { key: 'notes',    label: 'Notas',        icon: StickyNote },
    { key: 'deposits', label: 'Depósitos',    icon: CreditCard },
    { key: 'kyc',      label: 'KYC',          icon: User       },
    { key: 'followup', label: 'Follow-up',    icon: Clock },
    { key: 'audit',    label: 'Histórico',    icon: Filter },
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
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowEmailModal(true)} title="Enviar email"
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'rgba(58,134,255,0.1)', border: '1px solid rgba(58,134,255,0.25)', borderRadius: 8, color: '#3A86FF', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              <Send size={12} />Email
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#7a8299', padding: 4 }}><X size={20} /></button>
          </div>
        </div>

        {/* Modal de Email */}
        {showEmailModal && (
          <EmailModal
            lead={lead}
            token={token}
            onClose={() => setShowEmailModal(false)}
          />
        )}

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

          {/* ── Tab: Notas (Timeline) ── */}
          {activeTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Caixa de nova nota */}
              <div style={{ display: 'flex', gap: 8 }}>
                <textarea
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAddNoteTimeline(); }}
                  placeholder="Escreva uma nota... (Ctrl+Enter para guardar)"
                  rows={3}
                  style={{ flex: 1, padding: '10px 12px', background: '#0e0e1a', border: '1px solid #26263a', borderRadius: 10, color: '#f3f5ff', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
                />
                <button onClick={handleAddNoteTimeline} disabled={addingNote || !newNoteText.trim()}
                  style={{ width: 40, background: newNoteText.trim() ? '#22c58b' : '#1e1e30', border: 'none', borderRadius: 10, cursor: newNoteText.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Plus size={16} color="#fff" />
                </button>
              </div>

              {/* Timeline */}
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {notesTimeline.length > 0 ? `${notesTimeline.length} nota${notesTimeline.length !== 1 ? 's' : ''}` : 'Sem notas ainda'}
              </div>

              {notesTimeline.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#4a5068' }}>
                  <StickyNote size={24} style={{ opacity: 0.2, marginBottom: 8 }} />
                  <p style={{ fontSize: 12, margin: 0 }}>Adicione a primeira nota sobre este lead</p>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  {/* Linha vertical da timeline */}
                  <div style={{ position: 'absolute', left: 14, top: 8, bottom: 8, width: 2, background: 'linear-gradient(180deg,#3A86FF,rgba(58,134,255,0.1))', borderRadius: 1 }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {notesTimeline.map((n, i) => (
                      <div key={n.id || i} style={{ display: 'flex', gap: 12, paddingBottom: 14 }}>
                        {/* Ponto da timeline */}
                        <div style={{ width: 30, height: 30, background: i === 0 ? '#3A86FF' : '#1e1e30', border: `2px solid ${i === 0 ? '#3A86FF' : '#26263a'}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                          <StickyNote size={12} color={i === 0 ? '#fff' : '#7a8299'} />
                        </div>
                        {/* Conteúdo */}
                        <div style={{ flex: 1, background: i === 0 ? 'rgba(58,134,255,0.06)' : '#0e0e1a', border: `1px solid ${i === 0 ? 'rgba(58,134,255,0.2)' : '#1e1e30'}`, borderRadius: 10, padding: '10px 12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <span style={{ fontSize: 10, color: '#4a5068', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={9} />
                              {n.created_at ? new Date(n.created_at).toLocaleString('pt-PT', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—'}
                            </span>
                            <button onClick={() => handleDeleteNoteTimeline(n.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#26263a', padding: 2 }}
                              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                              onMouseLeave={e => e.currentTarget.style.color = '#26263a'}>
                              <X size={11} />
                            </button>
                          </div>
                          <p style={{ fontSize: 13, color: '#e8eaf6', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{n.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

          {/* ── Tab: KYC ── */}
          {activeTab === 'kyc' && (
            <div>
              {loadingKyc ? (
                <div style={{ padding: '30px 0', textAlign: 'center', color: '#4a5068', fontSize: 12 }}>A carregar documentos KYC…</div>
              ) : kycDocs.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#4a5068' }}>
                  <User size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p style={{ fontSize: 12, margin: 0 }}>Nenhum documento KYC enviado</p>
                  <p style={{ fontSize: 11, color: '#26263a', marginTop: 4 }}>O cliente ainda não submeteu documentos de identidade.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Badge de estado geral */}
                  {(() => {
                    const statuses = kycDocs.map(d => d.status);
                    const allApproved = statuses.every(s => s === 'approved');
                    const anyRejected = statuses.some(s => s === 'rejected');
                    const color = allApproved ? '#22c58b' : anyRejected ? '#ef4444' : '#FFBE0B';
                    const label = allApproved ? '✓ Todos aprovados' : anyRejected ? '✗ Tem documentos rejeitados' : '⏳ Aguarda revisão';
                    return (
                      <div style={{ padding: '8px 12px', background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 8, fontSize: 12, fontWeight: 700, color }}>
                        {label} · {kycDocs.length} documento{kycDocs.length !== 1 ? 's' : ''}
                      </div>
                    );
                  })()}

                  {kycDocs.map(doc => {
                    const isImg   = doc.content_type?.startsWith('image/');
                    const docLabel = doc.doc_type?.replace('_frente','').replace('_verso','').replace('bi','BI/CC').replace('passport','Passaporte').replace('driver_license','Carta Condução');
                    const side     = doc.doc_type?.includes('frente') ? 'Frente' : doc.doc_type?.includes('verso') ? 'Verso' : '';
                    const stColor  = doc.status === 'approved' ? '#22c58b' : doc.status === 'rejected' ? '#ef4444' : '#FFBE0B';
                    const stBg     = doc.status === 'approved' ? 'rgba(34,197,139,0.08)' : doc.status === 'rejected' ? 'rgba(239,68,68,0.08)' : 'rgba(255,190,11,0.08)';
                    const stLabel  = doc.status === 'approved' ? 'Aprovado' : doc.status === 'rejected' ? 'Rejeitado' : 'Pendente';
                    const busy     = updatingKyc[doc.id];

                    return (
                      <div key={doc.id} style={{ background: '#0e0e1a', border: `1px solid ${stColor}30`, borderRadius: 12, overflow: 'hidden' }}>
                        {/* Cabeçalho do documento */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #1e1e30' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>
                              {docLabel} {side && `— ${side}`}
                            </div>
                            <div style={{ fontSize: 10, color: '#4a5068', marginTop: 2 }}>{doc.filename}</div>
                          </div>
                          <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 6, background: stBg, color: stColor, border: `1px solid ${stColor}40`, fontWeight: 700 }}>
                            {stLabel}
                          </span>
                        </div>

                        {/* Preview da imagem (se for imagem) */}
                        {isImg && (
                          <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e1e30', background: '#06060f' }}>
                            <img
                              src={`${BACKEND_URL}/api/admin/kyc/${doc.id}/preview`}
                              alt={doc.filename}
                              style={{ width: '100%', maxHeight: 180, objectFit: 'contain', borderRadius: 6, display: 'block' }}
                              onError={e => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        )}

                        {/* Acções */}
                        <div style={{ display: 'flex', gap: 8, padding: '10px 14px', flexWrap: 'wrap' }}>
                          <a href={`${BACKEND_URL}/api/admin/kyc/${doc.id}/download`} target="_blank" rel="noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'rgba(58,134,255,0.08)', border: '1px solid rgba(58,134,255,0.2)', borderRadius: 7, color: '#3A86FF', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
                            ↓ Download
                          </a>
                          <button onClick={() => handleKycStatus(doc.id, 'approved')} disabled={busy || doc.status === 'approved'}
                            style={{ flex: 1, padding: '6px 10px', background: doc.status === 'approved' ? 'rgba(34,197,139,0.15)' : 'rgba(34,197,139,0.08)', border: `1px solid rgba(34,197,139,${doc.status === 'approved' ? '0.4' : '0.2'})`, borderRadius: 7, color: '#22c58b', cursor: busy || doc.status === 'approved' ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 700 }}>
                            {busy ? '…' : '✓ Aprovar'}
                          </button>
                          <button onClick={() => handleKycStatus(doc.id, 'rejected')} disabled={busy || doc.status === 'rejected'}
                            style={{ flex: 1, padding: '6px 10px', background: doc.status === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)', border: `1px solid rgba(239,68,68,${doc.status === 'rejected' ? '0.4' : '0.2'})`, borderRadius: 7, color: '#ef4444', cursor: busy || doc.status === 'rejected' ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 700 }}>
                            {busy ? '…' : '✗ Rejeitar'}
                          </button>
                        </div>
                        {doc.created_at && (
                          <div style={{ padding: '0 14px 8px', fontSize: 10, color: '#4a5068' }}>
                            Enviado em: {new Date(doc.created_at).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Follow-up ── */}
          {activeTab === 'followup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 12, color: '#7a8299' }}>Agende o próximo contacto com este lead.</div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#7a8299', marginBottom: 6 }}>Data e Hora do Contacto</label>
                <input type="datetime-local" value={followupDate}
                  onChange={e => setFollowupDate(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: '#0e0e1a', border: '1px solid rgba(255,190,11,0.3)', borderRadius: 8, color: '#FFBE0B', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#7a8299', marginBottom: 6 }}>Nota do Follow-up</label>
                <textarea value={followupNote} onChange={e => setFollowupNote(e.target.value)}
                  placeholder="Ex: Cliente interessado em investir €5.000, ligar às 15h…"
                  rows={4}
                  style={{ width: '100%', padding: '10px 12px', background: '#0e0e1a', border: '1px solid #26263a', borderRadius: 8, color: '#f3f5ff', fontSize: 12, resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }} />
              </div>
              {followupDate && (
                <div style={{ padding: '10px 12px', background: 'rgba(255,190,11,0.08)', border: '1px solid rgba(255,190,11,0.2)', borderRadius: 8, fontSize: 12, color: '#FFBE0B' }}>
                  ⏰ Agendado para: {new Date(followupDate).toLocaleString('pt-PT')}
                </div>
              )}
              <button onClick={handleSaveFollowup} disabled={savingFu}
                style={{ padding: '10px', background: savingFu ? '#1e1e30' : '#FFBE0B', border: 'none', borderRadius: 10, color: '#06061a', fontSize: 13, fontWeight: 800, cursor: savingFu ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Check size={14} />{savingFu ? 'A guardar…' : 'Agendar Follow-up'}
              </button>
              {lead.followup_date && (
                <button onClick={() => { setFollowupDate(''); handleSaveFollowup(); }}
                  style={{ padding: '8px', background: 'transparent', border: '1px solid #26263a', borderRadius: 8, color: '#7a8299', fontSize: 12, cursor: 'pointer' }}>
                  Limpar agendamento
                </button>
              )}
            </div>
          )}

          {/* ── Tab: Histórico / Audit ── */}
          {activeTab === 'audit' && (
            <div>
              {loadingAudit ? (
                <div style={{ padding: '30px 0', textAlign: 'center', color: '#4a5068', fontSize: 12 }}>A carregar…</div>
              ) : (
                <>
                  {notesHistory.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Histórico de Notas</div>
                      {notesHistory.map((n, i) => (
                        <div key={i} style={{ padding: '8px 10px', background: '#0e0e1a', border: '1px solid #1e1e30', borderRadius: 7, marginBottom: 6 }}>
                          <div style={{ fontSize: 10, color: '#4a5068', marginBottom: 3 }}>{n.created_at ? new Date(n.created_at).toLocaleString('pt-PT') : '—'}</div>
                          <div style={{ fontSize: 12, color: '#7a8299', fontStyle: 'italic' }}>"{n.notes_preview}…"</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {auditLogs.length === 0 && notesHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#4a5068', padding: '30px 0', fontSize: 12 }}>Sem histórico registado</div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Acções do Admin</div>
                      {auditLogs.map((l, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: i > 0 ? '1px solid #1a1a2a' : 'none' }}>
                          <span style={{ fontSize: 12, color: '#e8eaf6' }}>{l.action}</span>
                          <span style={{ fontSize: 10, color: '#4a5068' }}>{l.created_at ? new Date(l.created_at).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
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
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>Dashboard de Leads</h1>
          <p style={{ fontSize: 13, color: '#7a8299', margin: 0 }}>{users.length} utilizadores · do mais recente</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={handleExportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', background: 'rgba(34,197,139,0.1)', border: '1px solid rgba(34,197,139,0.25)', borderRadius: 9, color: '#22c58b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Copy size={12} />CSV
          </button>
          {[
            { label: 'Total',       value: users.length,                                        color: '#f3f5ff' },
            { label: 'Depositados', value: users.filter(u => u.status === 'Depositado').length,  color: '#22c58b' },
            { label: 'Hoje',        value: countToday,                                          color: '#3A86FF' },
            { label: 'Esta semana', value: countWeek,                                           color: '#FFBE0B' },
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
          <input data-testid="admin-leads-search-input" type="text" placeholder="Pesquisar por nome ou e-mail…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 30px', background: '#111118', border: '1px solid #26263a', borderRadius: 9, color: '#f3f5ff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', background: '#111118', border: '1px solid #26263a', borderRadius: 9, color: '#f3f5ff', fontSize: 13, outline: 'none' }}>
          <option value="Todos">Todos os estados</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
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

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 14px', background: 'rgba(58,134,255,0.1)', border: '1px solid rgba(58,134,255,0.3)', borderRadius: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#3A86FF' }}>{selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}</span>
          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
            style={{ padding: '6px 10px', background: '#0e0e1a', border: '1px solid rgba(58,134,255,0.4)', borderRadius: 7, color: '#f3f5ff', fontSize: 12, outline: 'none' }}>
            <option value="">Mudar estado para…</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={applyBulkStatus} disabled={!bulkStatus || applyingBulk}
            style={{ padding: '6px 14px', background: bulkStatus ? '#3A86FF' : '#1e1e30', border: 'none', borderRadius: 7, color: '#fff', fontSize: 12, fontWeight: 700, cursor: bulkStatus ? 'pointer' : 'not-allowed' }}>
            {applyingBulk ? 'A aplicar…' : 'Aplicar'}
          </button>
          <button onClick={() => setSelectedIds(new Set())}
            style={{ padding: '6px 10px', background: 'transparent', border: '1px solid #26263a', borderRadius: 7, color: '#7a8299', fontSize: 12, cursor: 'pointer' }}>
            Cancelar
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
                {['#', 'Nome / E-mail', 'País', 'Saldo', 'Lucro', '% Dia', 'Acções'].map(h => (
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
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
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
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          <button onClick={() => setSelectedLead(user)} title="Ver detalhes"
                            style={{ padding: '6px 10px', background: 'rgba(58,134,255,0.08)', border: '1px solid rgba(58,134,255,0.2)', borderRadius: 7, color: '#3A86FF', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Eye size={12} />Ver
                          </button>
                          <button data-testid="admin-edit-balance-button" onClick={() => startEdit(user)}
                            style={{ padding: '6px 10px', background: 'rgba(255,190,11,0.08)', border: '1px solid rgba(255,190,11,0.2)', borderRadius: 7, color: '#FFBE0B', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Edit2 size={12} />Editar
                          </button>
                          {/* Botão enviar para agente */}
                          <button
                            onClick={() => setAssignModal({ id: user.id, name: user.full_name, assigned_agent: user.assigned_agent, assigned_agent_name: user.assigned_agent_name })}
                            title={user.assigned_agent_name ? `Agente: ${user.assigned_agent_name}` : 'Enviar para agente'}
                            style={{ padding: '6px 10px', background: user.assigned_agent ? 'rgba(168,85,247,0.12)' : 'rgba(122,130,153,0.08)', border: `1px solid ${user.assigned_agent ? 'rgba(168,85,247,0.3)' : 'rgba(122,130,153,0.2)'}`, borderRadius: 7, color: user.assigned_agent ? '#a855f7' : '#7a8299', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <LogIn size={12} />{user.assigned_agent_name ? user.assigned_agent_name.split(' ')[0] : 'Agente'}
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
          <strong style={{ color: '#FFBE0B' }}>% Diária:</strong> O sistema aplica automaticamente a percentagem ao saldo a cada actualização. Ex.: 1% sobre €10.000 = +€100/dia.
        </p>
      </div>
    </div>
  );
}
