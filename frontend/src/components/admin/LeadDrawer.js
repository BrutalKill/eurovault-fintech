/**
 * LeadDrawer.js — Drawer de detalhes do lead (inclui EmailModal).
 * Importado por AdminDashboard.js para manter ficheiros pequenos.
 */
import { useLang } from '../../context/LangContext';
import React, { useState, useEffect } from 'react';
import { X, TrendingUp, CreditCard, User, Mail, Phone, Globe, Calendar,
         StickyNote, Clock, Filter, DollarSign, Percent, Check, Eye, EyeOff,
         Copy, Plus, Send, FileText, Key, ChevronRight } from 'lucide-react';
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

const STATUS_KEY_MAP = {
  'Novo': 'adm_status_novo', 'Depositado': 'adm_status_depositado',
  'Call Later': 'adm_status_call_later', 'Sem Interesse': 'adm_status_sem_interesse',
  'Low Potential': 'adm_status_low_potential', 'No Answer': 'adm_status_no_answer',
  'VIP': 'adm_status_vip', 'Bloqueado': 'adm_status_blocked',
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

const TAG_PRESETS = [
  { label: 'VIP',              color: '#F59E0B', bg: 'rgba(245,158,11,0.15)'  },
  { label: 'Alta Prioridade',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  { label: 'Precisa Mais Info',color: '#3A86FF', bg: 'rgba(58,134,255,0.12)' },
  { label: 'Quente',           color: '#FF6B35', bg: 'rgba(255,107,53,0.12)' },
  { label: 'Frio',             color: '#7a8299', bg: 'rgba(122,130,153,0.12)'},
  { label: 'Aguarda Doc.',     color: '#22c58b', bg: 'rgba(34,197,139,0.12)' },
];

/* ── Email Modal ── */
function EmailModal({ lead, token, onClose }) {
  const TEMPLATES = [
    { label: 'Boas-vindas', subject: `Bem-vindo à EuroVault Investments`, body: `Olá ${lead.full_name},\n\nBem-vindo!\n\nAtenciosamente,\nEquipa EuroVault` },
    { label: 'Pedir KYC',   subject: 'Verificação de Identidade', body: `Olá ${lead.full_name},\n\nEnvie o seu documento no perfil.\n\nAtenciosamente,\nEquipa EuroVault` },
    { label: 'Depósito OK', subject: 'Depósito processado', body: `Olá ${lead.full_name},\n\nO seu depósito foi processado.\n\nAtenciosamente,\nEquipa EuroVault` },
  ];
  const [subject, setSubject] = useState('');
  const [body, setBody]       = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  const sendEmail = async () => {
    if (!subject.trim() || !body.trim()) { toast.error('Preencha o assunto e o corpo'); return; }
    setSending(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${lead.id}/send-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a8299' }}><X size={18} /></button>
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
            style={{ flex: 2, padding: '10px', background: sent ? 'rgba(34,197,139,0.15)' : sending ? '#1e1e30' : 'linear-gradient(135deg,#2563eb,#3A86FF)', border: `1px solid ${sent ? 'rgba(34,197,139,0.3)':'transparent'}`, borderRadius: 10, color: sent ? '#22c58b' : '#fff', fontSize: 13, fontWeight: 700, cursor: sending||sent?'not-allowed':'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            <Send size={14} />{sent ? 'Enviado!' : sending ? 'A enviar…' : `Enviar`}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Lead Drawer ── */
export function LeadDrawer({ lead, onClose, onStatusChange, onBalanceSave }) {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState('finance');
  const [editVals, setEditVals] = useState({
    balance: String(lead.balance || 0), profit: String(lead.profit || 0),
    daily_profit_rate: String(lead.daily_profit_rate || 0),
    daily_withdrawal_limit: String(lead.daily_withdrawal_limit || 0),
  });
  const [saving, setSaving]             = useState(false);
  const [notes, setNotes]               = useState('');
  const [savingNotes, setSavingNotes]   = useState(false);
  const [deposits, setDeposits]         = useState([]);
  const [loadingDep, setLoadingDep]     = useState(false);
  const [followupDate, setFollowupDate] = useState(lead.followup_date ? lead.followup_date.slice(0,16) : '');
  const [followupNote, setFollowupNote] = useState(lead.followup_note || '');
  const [savingFu, setSavingFu]         = useState(false);
  const [auditLogs, setAuditLogs]       = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [notesHistory, setNotesHistory] = useState([]);
  const [kycDocs, setKycDocs]           = useState([]);
  const [loadingKyc, setLoadingKyc]     = useState(false);
  const [updatingKyc, setUpdatingKyc]   = useState({});
  const [notesTimeline, setNotesTimeline] = useState([]);
  const [newNoteText, setNewNoteText]   = useState('');
  const [addingNote, setAddingNote]     = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [generatingContract, setGeneratingContract] = useState(false);
  const [contractUrl, setContractUrl]   = useState('');
  const [credentials, setCredentials]   = useState(null);
  const [showPass, setShowPass]         = useState(false);
  const [editingPass, setEditingPass]   = useState(false);
  const [newPass, setNewPass]           = useState('');
  const [savingPass, setSavingPass]     = useState(false);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [tags, setTags]                 = useState(lead.tags || []);
  const [tagInput, setTagInput]         = useState('');
  const [savingTags, setSavingTags]     = useState(false);

  const token = localStorage.getItem('adminToken');
  const ss    = STATUS_STYLES[lead.status] || STATUS_STYLES['Novo'];

  const getTagStyle = (tag) => TAG_PRESETS.find(p => p.label === tag) || { color:'#a0a0c0', bg:'rgba(160,160,192,0.12)' };

  const hdr = { Authorization: `Bearer ${token}` };
  const api = (path, opts = {}) => fetch(`${BACKEND_URL}${path}`, { headers: { ...hdr, ...opts.headers }, ...opts });

  const loadCredentials = async () => {
    if (credentials) { setShowPass(p => !p); return; }
    setLoadingCreds(true);
    try {
      const res = await api(`/api/admin/users/${lead.id}/credentials`);
      if (res.ok) setCredentials(await res.json());
    } catch (_) {}
    setLoadingCreds(false); setShowPass(true);
  };

  const saveNewPassword = async () => {
    if (!newPass.trim()) return;
    setSavingPass(true);
    try {
      const res = await api(`/api/admin/users/${lead.id}/password`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setCredentials(prev => ({ ...prev, password_plain: newPass }));
      setNewPass(''); setEditingPass(false);
      toast.success('Senha alterada com sucesso!');
    } catch (e) { toast.error(e.message); }
    setSavingPass(false);
  };

  const generateContract = async () => {
    setGeneratingContract(true);
    try {
      const tplRes = await api(`/api/admin/contract-templates`);
      const templates = tplRes.ok ? await tplRes.json() : [];
      if (!templates.length) { toast.error('Crie um modelo de contrato primeiro em /adm/contracts'); return; }
      const res = await api(`/api/admin/contracts/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templates[0].id, lead_id: lead.id, preset_name: lead.full_name, preset_email: lead.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      const url = `${window.location.origin}/contract/${data.token}`;
      setContractUrl(url);
      navigator.clipboard.writeText(url);
      toast.success('Link de contrato copiado!', { duration: 8000 });
    } catch (e) { toast.error(e.message); }
    setGeneratingContract(false);
  };

  const saveTags = async (newTags) => {
    setSavingTags(true);
    try {
      await api(`/api/admin/users/${lead.id}/tags`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      });
      setTags(newTags);
    } catch (_) {}
    setSavingTags(false);
  };

  useEffect(() => {
    api(`/api/admin/users/${lead.id}/notes`).then(r => r.ok ? r.json() : { notes: '' }).then(d => setNotes(d.notes || '')).catch(() => {});
    api(`/api/admin/users/${lead.id}/notes/timeline`).then(r => r.ok ? r.json() : []).then(setNotesTimeline).catch(() => {});
  }, [lead.id]);

  useEffect(() => {
    if (activeTab === 'deposits') {
      setLoadingDep(true);
      api(`/api/admin/users/${lead.id}/deposits`).then(r => r.ok ? r.json() : []).then(d => { setDeposits(d); setLoadingDep(false); }).catch(() => setLoadingDep(false));
    }
    if (activeTab === 'audit') {
      setLoadingAudit(true);
      Promise.all([
        api(`/api/admin/users/${lead.id}/audit`).then(r => r.ok ? r.json() : []),
        api(`/api/admin/users/${lead.id}/notes/history`).then(r => r.ok ? r.json() : []),
      ]).then(([audit, nh]) => { setAuditLogs(audit); setNotesHistory(nh); setLoadingAudit(false); }).catch(() => setLoadingAudit(false));
    }
    if (activeTab === 'kyc') {
      setLoadingKyc(true);
      api(`/api/admin/users/${lead.id}/kyc-docs`).then(r => r.ok ? r.json() : []).then(d => { setKycDocs(d); setLoadingKyc(false); }).catch(() => setLoadingKyc(false));
    }
  }, [activeTab, lead.id]);

  const handleSave = async () => {
    setSaving(true);
    await onBalanceSave(lead.id, editVals);
    try {
      await api(`/api/admin/users/${lead.id}/withdrawal-limit`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_withdrawal_limit: parseFloat(editVals.daily_withdrawal_limit) || 0 }),
      });
    } catch (_) {}
    setSaving(false);
  };

  const handleAddNoteTimeline = async () => {
    if (!newNoteText.trim()) return;
    setAddingNote(true);
    try {
      const res = await api(`/api/admin/users/${lead.id}/notes/timeline`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newNoteText.trim() }),
      });
      if (res.ok) {
        setNotesTimeline(prev => [{ id: Date.now(), text: newNoteText.trim(), created_at: new Date().toISOString() }, ...prev]);
        setNewNoteText('');
        toast.success('Nota adicionada!');
      }
    } catch (_) { toast.error('Erro ao adicionar nota'); }
    setAddingNote(false);
  };

  const handleDeleteNoteTimeline = async (noteId) => {
    try {
      await api(`/api/admin/users/${lead.id}/notes/timeline/${noteId}`, { method: 'DELETE' });
      setNotesTimeline(prev => prev.filter(n => n.id !== noteId));
    } catch (_) {}
  };

  const handleKycStatus = async (docId, status) => {
    setUpdatingKyc(p => ({ ...p, [docId]: true }));
    try {
      await api(`/api/admin/users/${lead.id}/kyc-docs/${docId}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setKycDocs(prev => prev.map(d => d.id === docId ? { ...d, status } : d));
      toast.success(`Documento ${status === 'approved' ? 'aprovado' : 'rejeitado'}!`);
    } catch (_) { toast.error('Erro ao actualizar documento'); }
    setUpdatingKyc(p => ({ ...p, [docId]: false }));
  };

  const handleSaveFollowup = async () => {
    setSavingFu(true);
    try {
      await api(`/api/admin/users/${lead.id}/followup`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followup_date: followupDate || null, followup_note: followupNote }),
      });
      toast.success('Follow-up agendado!');
    } catch (_) { toast.error('Erro ao agendar follow-up'); }
    setSavingFu(false);
  };

  const TABS = [
    { key: 'finance',  label: t('adm_tab_finance'),  icon: TrendingUp },
    { key: 'tags',     label: t('adm_tab_tags'),      icon: Filter },
    { key: 'notes',    label: t('adm_tab_notes'),     icon: StickyNote },
    { key: 'deposits', label: t('adm_tab_deposits'),  icon: CreditCard },
    { key: 'kyc',      label: t('adm_tab_kyc'),       icon: User },
    { key: 'followup', label: t('adm_tab_followup'),  icon: Clock },
    { key: 'audit',    label: t('adm_tab_history'),   icon: Filter },
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
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
                  {tags.map(tag => { const ts = getTagStyle(tag); return (
                    <span key={tag} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: ts.bg, color: ts.color, fontWeight: 700, border: `1px solid ${ts.color}40` }}>{tag}</span>
                  ); })}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowEmailModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'rgba(58,134,255,0.1)', border: '1px solid rgba(58,134,255,0.25)', borderRadius: 8, color: '#3A86FF', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              <Send size={12} />{t('adm_drawer_email_btn')}
            </button>
            <button onClick={generateContract} disabled={generatingContract} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: generatingContract ? 'rgba(34,197,139,0.05)' : 'rgba(34,197,139,0.1)', border: '1px solid rgba(34,197,139,0.25)', borderRadius: 8, color: '#22c58b', fontSize: 11, fontWeight: 700, cursor: generatingContract ? 'not-allowed' : 'pointer' }}>
              <FileText size={12} />{generatingContract ? '…' : t('adm_drawer_contract_btn')}
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#7a8299', padding: 4 }}><X size={20} /></button>
          </div>
        </div>

        {showEmailModal && <EmailModal lead={lead} token={token} onClose={() => setShowEmailModal(false)} />}

        {/* Dados pessoais */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e1e30' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Dados Pessoais</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { icon: User,     label: 'Nome',      value: lead.full_name },
              { icon: Mail,     label: 'E-mail',    value: lead.email },
              { icon: Phone,    label: 'Telemóvel', value: lead.phone || '—' },
              { icon: Globe,    label: 'País',      value: lead.country || '—' },
              { icon: Calendar, label: 'Registo',   value: fmtDate(lead.created_at) },
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
                  {getStatusLabel(s, t)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Credenciais */}
        <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid #1e1e30', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <Key size={11} color="#7a8299"/>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#7a8299', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('adm_drawer_access')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#0e0e1a', border: '1px solid #1e1e30', borderRadius: 8 }}>
              <Mail size={11} color="#4a5068"/>
              <span style={{ fontSize: 12, color: '#9ca3c0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.email}</span>
              <button onClick={() => { navigator.clipboard.writeText(lead.email); toast.success('Email copiado'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5068', padding: 0 }}><Copy size={11}/></button>
            </div>
            {!editingPass ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#0e0e1a', border: '1px solid #1e1e30', borderRadius: 8 }}>
                <Key size={11} color="#4a5068"/>
                <span style={{ fontSize: 12, color: showPass && credentials?.password_plain ? '#f3f5ff' : '#4a5068', flex: 1, fontFamily: 'monospace', letterSpacing: showPass ? 'normal' : '0.2em' }}>
                  {loadingCreds ? t('adm_loading') : showPass && credentials?.password_plain ? credentials.password_plain : '••••••••'}
                </span>
                <button onClick={loadCredentials} style={{ background: 'none', border: 'none', cursor: 'pointer', color: showPass ? '#3A86FF' : '#4a5068', padding: 0 }}>
                  {showPass ? <EyeOff size={12}/> : <Eye size={12}/>}
                </button>
                {credentials?.password_plain && (
                  <button onClick={() => { navigator.clipboard.writeText(credentials.password_plain); toast.success('Senha copiada'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5068', padding: 0 }}><Copy size={11}/></button>
                )}
                <button onClick={() => setEditingPass(true)} style={{ padding: '3px 8px', background: 'rgba(255,190,11,0.1)', border: '1px solid rgba(255,190,11,0.2)', borderRadius: 6, color: '#FFBE0B', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                  {t('adm_drawer_change_pass')}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Nova senha…" autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') saveNewPassword(); if (e.key === 'Escape') { setEditingPass(false); setNewPass(''); } }}
                  style={{ flex: 1, padding: '7px 10px', background: '#0e0e1a', border: '1px solid rgba(255,190,11,0.35)', borderRadius: 8, color: '#f3f5ff', fontSize: 12, outline: 'none', fontFamily: 'monospace' }}/>
                <button onClick={saveNewPassword} disabled={savingPass || !newPass.trim()} style={{ padding: '7px 12px', background: 'rgba(34,197,139,0.12)', border: '1px solid rgba(34,197,139,0.3)', borderRadius: 8, color: '#22c58b', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  {savingPass ? '…' : t('adm_drawer_save_pass')}
                </button>
                <button onClick={() => { setEditingPass(false); setNewPass(''); }} style={{ padding: '7px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid #26263a', borderRadius: 8, color: '#4a5068', fontSize: 11, cursor: 'pointer' }}><X size={12}/></button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #26263a', flexShrink: 0, overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ flex: 1, padding: '11px 0', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                background: 'transparent', color: activeTab === tab.key ? '#3A86FF' : '#4a5068',
                borderBottom: `2px solid ${activeTab === tab.key ? '#3A86FF' : 'transparent'}`, minWidth: 60 }}>
              <tab.icon size={12} />{tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

          {activeTab === 'finance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: t('adm_fin_balance').replace(' (€)',''), key: 'balance', icon: CreditCard, color: '#f3f5ff' },
                { label: t('adm_fin_profit').replace(' (€)',''),  key: 'profit',  icon: TrendingUp, color: '#22c58b' },
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
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#7a8299', marginBottom: 6 }}>{t('adm_fin_daily_rate')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Percent size={14} color="#FFBE0B" style={{ flexShrink: 0 }} />
                  <input type="number" step="0.01" min="0" max="100" value={editVals.daily_profit_rate}
                    onChange={e => setEditVals(p => ({ ...p, daily_profit_rate: e.target.value }))}
                    style={{ flex: 1, padding: '8px 12px', background: '#0e0e1a', border: '1px solid rgba(255,190,11,0.3)', borderRadius: 8, color: '#FFBE0B', fontSize: 14, fontWeight: 700, outline: 'none' }} />
                  <span style={{ fontSize: 12, color: '#7a8299' }}>%</span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#7a8299', marginBottom: 6 }}>{t('adm_fin_daily_limit')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={14} color="#F87171" style={{ flexShrink: 0 }} />
                  <input type="number" step="0.01" min="0" value={editVals.daily_withdrawal_limit}
                    onChange={e => setEditVals(p => ({ ...p, daily_withdrawal_limit: e.target.value }))}
                    style={{ flex: 1, padding: '8px 12px', background: '#0e0e1a', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, color: '#F87171', fontSize: 14, fontWeight: 700, outline: 'none' }} />
                  <span style={{ fontSize: 11, color: '#7a8299' }}>€/dia</span>
                </div>
                <div style={{ fontSize: 10, color: '#4a5068', marginTop: 3 }}>0 = sem limite</div>
              </div>
              <button onClick={handleSave} disabled={saving}
                style={{ width: '100%', padding: '11px', background: saving ? '#1e1e30' : '#3A86FF', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Check size={14} />{saving ? t('adm_fin_saving') : t('adm_fin_save')}
              </button>
            </div>
          )}

          {activeTab === 'tags' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7a8299', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('adm_tag_active')}</div>
                {tags.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#3a3d5a', fontStyle: 'italic' }}>{t('adm_tag_empty')}</div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {tags.map(tag => {
                      const ts = getTagStyle(tag);
                      return (
                        <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 20, background: ts.bg, border: `1px solid ${ts.color}40`, color: ts.color, fontSize: 12, fontWeight: 700 }}>
                          {tag}
                          <button onClick={() => saveTags(tags.filter(x => x !== tag))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: ts.color, padding: 0, opacity: 0.7 }}>×</button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7a8299', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tags Rápidas</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {TAG_PRESETS.map(p => (
                    <button key={p.label} onClick={() => { if (!tags.includes(p.label)) saveTags([...tags, p.label]); }} disabled={tags.includes(p.label)}
                      style={{ padding: '5px 12px', borderRadius: 20, cursor: tags.includes(p.label) ? 'not-allowed' : 'pointer', background: tags.includes(p.label) ? p.bg : 'transparent', border: `1px solid ${p.color}60`, color: p.color, fontSize: 12, fontWeight: 700, opacity: tags.includes(p.label) ? 0.5 : 1 }}>
                      {tags.includes(p.label) ? '✓ ' : '+ '}{p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7a8299', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tag Personalizada</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && tagInput.trim()) { saveTags([...tags, tagInput.trim()]); setTagInput(''); } }}
                    placeholder="Escrever tag… (Enter para adicionar)"
                    style={{ flex: 1, padding: '9px 12px', background: '#0e0e1a', border: '1px solid #26263a', borderRadius: 9, color: '#f3f5ff', fontSize: 13, outline: 'none' }} />
                  <button onClick={() => { if (tagInput.trim()) { saveTags([...tags, tagInput.trim()]); setTagInput(''); } }}
                    style={{ padding: '9px 14px', background: '#3A86FF', border: 'none', borderRadius: 9, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    +
                  </button>
                </div>
              </div>
              {savingTags && <div style={{ fontSize: 11, color: '#22c58b' }}>A guardar…</div>}
            </div>
          )}

          {activeTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <textarea value={newNoteText} onChange={e => setNewNoteText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAddNoteTimeline(); }}
                  placeholder="Escreva uma nota... (Ctrl+Enter para guardar)" rows={3}
                  style={{ flex: 1, padding: '10px 12px', background: '#0e0e1a', border: '1px solid #26263a', borderRadius: 10, color: '#f3f5ff', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }} />
                <button onClick={handleAddNoteTimeline} disabled={addingNote || !newNoteText.trim()}
                  style={{ width: 40, background: newNoteText.trim() ? '#22c58b' : '#1e1e30', border: 'none', borderRadius: 10, cursor: newNoteText.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Plus size={16} color="#fff" />
                </button>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {notesTimeline.length > 0 ? `${notesTimeline.length} nota${notesTimeline.length !== 1 ? 's' : ''}` : 'Sem notas ainda'}
              </div>
              {notesTimeline.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#4a5068' }}>
                  <StickyNote size={24} style={{ opacity: 0.2, marginBottom: 8 }} />
                  <p style={{ fontSize: 12, margin: 0 }}>Adicione a primeira nota</p>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 14, top: 8, bottom: 8, width: 2, background: 'linear-gradient(180deg,#3A86FF,rgba(58,134,255,0.1))', borderRadius: 1 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {notesTimeline.map((n, i) => (
                      <div key={n.id || i} style={{ display: 'flex', gap: 12, paddingBottom: 14 }}>
                        <div style={{ width: 30, height: 30, background: i === 0 ? '#3A86FF' : '#1e1e30', border: `2px solid ${i === 0 ? '#3A86FF' : '#26263a'}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                          <StickyNote size={12} color={i === 0 ? '#fff' : '#7a8299'} />
                        </div>
                        <div style={{ flex: 1, background: i === 0 ? 'rgba(58,134,255,0.06)' : '#0e0e1a', border: `1px solid ${i === 0 ? 'rgba(58,134,255,0.2)' : '#1e1e30'}`, borderRadius: 10, padding: '10px 12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <span style={{ fontSize: 10, color: '#4a5068', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={9} />{n.created_at ? new Date(n.created_at).toLocaleString('pt-PT', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—'}
                            </span>
                            <button onClick={() => handleDeleteNoteTimeline(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#26263a', padding: 2 }} onMouseEnter={e => e.currentTarget.style.color='#ef4444'} onMouseLeave={e => e.currentTarget.style.color='#26263a'}>
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

          {activeTab === 'deposits' && (
            <div>
              {loadingDep ? <div style={{ padding: '40px 0', textAlign: 'center', color: '#4a5068', fontSize: 12 }}>A carregar…</div>
                : deposits.length === 0 ? <div style={{ padding: '40px 0', textAlign: 'center', color: '#4a5068' }}><CreditCard size={28} style={{ opacity: 0.3, marginBottom: 8 }} /><p style={{ fontSize: 12, margin: 0 }}>Sem depósitos registados</p></div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {deposits.map((d, i) => (
                      <div key={i} style={{ padding: '12px 14px', background: '#0e0e1a', border: '1px solid #1e1e30', borderRadius: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#22c58b' }}>{fmt(d.amount)}</span>
                          <span style={{ fontSize: 10, color: '#4a5068' }}>{fmtDate(d.created_at)}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#7a8299' }}>{d.cardholder}</div>
                        <div style={{ fontSize: 11, color: '#4a5068', marginTop: 2 }}>**** **** **** {(d.card_number || '').replace(/\s/g, '').slice(-4)}</div>
                        {d.country && <div style={{ fontSize: 10, color: '#4a5068', marginTop: 2 }}>{d.country} · {d.postal_code}</div>}
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {activeTab === 'kyc' && (
            <div>
              {loadingKyc ? <div style={{ padding: '30px 0', textAlign: 'center', color: '#4a5068', fontSize: 12 }}>A carregar documentos KYC…</div>
                : kycDocs.length === 0 ? <div style={{ padding: '40px 0', textAlign: 'center', color: '#4a5068' }}><User size={28} style={{ opacity: 0.3, marginBottom: 8 }} /><p style={{ fontSize: 12, margin: 0 }}>Nenhum documento KYC enviado</p></div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {kycDocs.map(doc => {
                      const isImg = doc.content_type?.startsWith('image/');
                      const stColor = doc.status === 'approved' ? '#22c58b' : doc.status === 'rejected' ? '#ef4444' : '#FFBE0B';
                      const busy = updatingKyc[doc.id];
                      return (
                        <div key={doc.id} style={{ background: '#0e0e1a', border: `1px solid ${stColor}30`, borderRadius: 12, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #1e1e30' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>{doc.doc_type?.replace('_frente','').replace('_verso','').replace('bi','BI/CC').replace('passport','Passaporte').replace('driver_license','Carta Condução')}</div>
                              <div style={{ fontSize: 10, color: '#4a5068', marginTop: 2 }}>{doc.filename}</div>
                            </div>
                            <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 6, background: `${stColor}10`, color: stColor, border: `1px solid ${stColor}40`, fontWeight: 700 }}>
                              {doc.status === 'approved' ? 'Aprovado' : doc.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                            </span>
                          </div>
                          {isImg && (
                            <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e1e30', background: '#06060f' }}>
                              <img src={`${BACKEND_URL}/api/admin/kyc/${doc.id}/preview`} alt={doc.filename}
                                style={{ width: '100%', maxHeight: 180, objectFit: 'contain', borderRadius: 6, display: 'block' }}
                                onError={e => { e.target.style.display = 'none'; }} />
                            </div>
                          )}
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
                        </div>
                      );
                    })}
                  </div>
              }
            </div>
          )}

          {activeTab === 'followup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 12, color: '#7a8299' }}>Agende o próximo contacto com este lead.</div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#7a8299', marginBottom: 6 }}>Data e Hora do Contacto</label>
                <input type="datetime-local" value={followupDate} onChange={e => setFollowupDate(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: '#0e0e1a', border: '1px solid rgba(255,190,11,0.3)', borderRadius: 8, color: '#FFBE0B', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#7a8299', marginBottom: 6 }}>Nota do Follow-up</label>
                <textarea value={followupNote} onChange={e => setFollowupNote(e.target.value)}
                  placeholder="Ex: Cliente interessado em investir €5.000, ligar às 15h…" rows={4}
                  style={{ width: '100%', padding: '10px 12px', background: '#0e0e1a', border: '1px solid #26263a', borderRadius: 8, color: '#f3f5ff', fontSize: 12, resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }} />
              </div>
              {followupDate && (
                <div style={{ padding: '10px 12px', background: 'rgba(255,190,11,0.08)', border: '1px solid rgba(255,190,11,0.2)', borderRadius: 8, fontSize: 12, color: '#FFBE0B' }}>
                  Agendado para: {new Date(followupDate).toLocaleString('pt-PT')}
                </div>
              )}
              <button onClick={handleSaveFollowup} disabled={savingFu}
                style={{ padding: '10px', background: savingFu ? '#1e1e30' : '#FFBE0B', border: 'none', borderRadius: 10, color: '#06061a', fontSize: 13, fontWeight: 800, cursor: savingFu ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Check size={14} />{savingFu ? 'A guardar…' : 'Agendar Follow-up'}
              </button>
            </div>
          )}

          {activeTab === 'audit' && (
            <div>
              {loadingAudit ? <div style={{ padding: '30px 0', textAlign: 'center', color: '#4a5068', fontSize: 12 }}>A carregar…</div>
                : (
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
                )
              }
            </div>
          )}
        </div>
      </div>
    </>
  );
}
