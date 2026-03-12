import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MessageCircle, Phone, Mail, Globe, Clock,
  TrendingUp, Send, LogOut, X, ChevronDown, Calendar,
  Camera, DollarSign, Activity, User, Copy, CheckCircle,
  BarChart3, AlertCircle, Zap, Filter
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const fmt = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 60000);
  if (diff < 2) return 'Agora';
  if (diff < 60) return `Há ${diff}min`;
  if (diff < 1440) return `Há ${Math.floor(diff / 60)}h`;
  if (diff < 2880) return 'Ontem';
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const fmtFull = (iso) => iso
  ? new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—';

const STATUS_OPTIONS = ['Novo', 'Depositado', 'Call Later', 'Low Potential', 'No Answer', 'VIP', 'Bloqueado'];
const STATUS_STYLES = {
  'Novo':          { color: '#3A86FF', bg: 'rgba(58,134,255,0.12)',  border: 'rgba(58,134,255,0.3)',  glow: 'rgba(58,134,255,0.2)'  },
  'Depositado':    { color: '#22c58b', bg: 'rgba(34,197,139,0.12)',  border: 'rgba(34,197,139,0.3)',  glow: 'rgba(34,197,139,0.2)'  },
  'Call Later':    { color: '#FFBE0B', bg: 'rgba(255,190,11,0.12)',  border: 'rgba(255,190,11,0.3)',  glow: 'rgba(255,190,11,0.2)'  },
  'Low Potential': { color: '#7a8299', bg: 'rgba(122,130,153,0.08)', border: 'rgba(122,130,153,0.2)', glow: 'rgba(122,130,153,0.1)' },
  'No Answer':     { color: '#4a5068', bg: 'rgba(30,30,48,0.6)',     border: '#26263a',               glow: 'rgba(30,30,48,0.4)'    },
  'VIP':           { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)',  glow: 'rgba(245,158,11,0.25)' },
  'Bloqueado':     { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.3)',   glow: 'rgba(239,68,68,0.15)'  },
};

const COUNTRY_FLAGS = {
  'Portugal': '🇵🇹', 'Brasil': '🇧🇷', 'Spain': '🇪🇸', 'España': '🇪🇸',
  'France': '🇫🇷', 'França': '🇫🇷', 'Germany': '🇩🇪', 'Alemanha': '🇩🇪',
  'Italy': '🇮🇹', 'Itália': '🇮🇹', 'United Kingdom': '🇬🇧', 'Reino Unido': '🇬🇧',
  'Netherlands': '🇳🇱', 'Holanda': '🇳🇱', 'Belgium': '🇧🇪', 'Bélgica': '🇧🇪',
};
const getFlag = (c) => COUNTRY_FLAGS[c] || '🌍';

/* ══════════════════════════════════════════════════════════════
   COMMENT DRAWER
══════════════════════════════════════════════════════════════ */
function CommentDrawer({ lead, token, onClose }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/agent/leads/${lead.id}/comments`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setComments(data);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .catch(() => {});
  }, [lead.id, token]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/agent/leads/${lead.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (res.ok) {
        const d = await res.json();
        setComments(p => [...p, d]);
        setText('');
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (_) { toast.error('Erro ao enviar'); }
    setSending(false);
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 400, maxWidth: '95vw',
        background: 'linear-gradient(180deg, #0f0f1e 0%, #080812 100%)',
        borderLeft: '1px solid rgba(58,134,255,0.2)', zIndex: 201,
        display: 'flex', flexDirection: 'column', boxShadow: '-24px 0 80px rgba(0,0,0,0.6)'
      }}>
        {/* Header do drawer */}
        <div style={{ padding: '20px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(58,134,255,0.04)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#3A86FF,#22c58b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
              {lead.full_name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#f3f5ff', fontFamily: 'var(--font-heading)' }}>{lead.full_name}</div>
              <div style={{ fontSize: 11, color: '#7a8299', marginTop: 1 }}>{comments.length} comentário{comments.length !== 1 ? 's' : ''}</div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, cursor: 'pointer', color: '#7a8299', padding: '6px 8px', display: 'flex' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Lista de comentários */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#4a5068' }}>
              <MessageCircle size={28} style={{ opacity: 0.15, marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, margin: '0 0 4px', fontWeight: 600, color: '#4a5068' }}>Sem notas ainda</p>
              <p style={{ fontSize: 11, margin: 0, color: '#26263a' }}>Adicione o primeiro comentário sobre este lead</p>
            </div>
          ) : comments.map((c, i) => {
            const isMe = c.author === 'agent';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%', padding: '10px 14px',
                  borderRadius: isMe ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                  background: isMe ? 'linear-gradient(135deg,#2563eb,#3A86FF)' : 'rgba(255,255,255,0.06)',
                  border: isMe ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  color: '#f3f5ff', fontSize: 13, lineHeight: 1.55,
                  boxShadow: isMe ? '0 4px 16px rgba(58,134,255,0.25)' : 'none'
                }}>
                  {!isMe && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 3, fontWeight: 700 }}>{c.author_name}</div>}
                  {c.text}
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 4, textAlign: 'right' }}>
                    {c.created_at ? new Date(c.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input de comentário */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Escrever nota… (Enter para enviar)"
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#f3f5ff', fontSize: 13, outline: 'none', transition: 'border-color .2s' }}
              onFocus={e => e.target.style.borderColor = 'rgba(58,134,255,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button
              onClick={send} disabled={sending || !text.trim()}
              style={{ width: 40, height: 40, background: text.trim() ? 'linear-gradient(135deg,#2563eb,#3A86FF)' : 'rgba(255,255,255,0.04)', border: 'none', borderRadius: 10, cursor: text.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: text.trim() ? '0 4px 12px rgba(58,134,255,0.35)' : 'none', transition: 'all .2s' }}>
              <Send size={15} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   CARD DO LEAD — DETALHADO E MODERNO
══════════════════════════════════════════════════════════════ */
function LeadCard({ lead, token, onComment, onStatusChange }) {
  const [status, setStatus] = useState(lead.status || 'Novo');
  const [showStatus, setShowStatus] = useState(false);
  const [copied, setCopied] = useState(false);
  const ss = STATUS_STYLES[status] || STATUS_STYLES['Novo'];

  const changeStatus = async (newStatus) => {
    try {
      await fetch(`${BACKEND_URL}/api/agent/leads/${lead.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      setStatus(newStatus);
      onStatusChange(lead.id, newStatus);
      toast.success(`Estado: ${newStatus}`);
    } catch (_) {}
    setShowStatus(false);
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(lead.email || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const profit = lead.profit || 0;
  const balance = lead.balance || 0;

  return (
    <div
      data-testid={`lead-card-${lead.id}`}
      style={{
        background: 'linear-gradient(160deg, rgba(14,14,26,0.98) 0%, rgba(10,10,20,0.99) 100%)',
        border: `1px solid rgba(255,255,255,0.07)`,
        borderRadius: 18, overflow: 'hidden', transition: 'all .25s',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = ss.border;
        e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${ss.border}`;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Barra de status no topo */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${ss.color}, ${ss.color}80)` }} />

      <div style={{ padding: '18px 20px 16px' }}>
        {/* ROW 1 — Avatar + Nome + Status Badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 50, height: 50, borderRadius: '50%',
              background: `linear-gradient(135deg, ${ss.color}40, ${ss.color}20)`,
              border: `2px solid ${ss.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 900, color: ss.color, fontFamily: 'var(--font-heading)',
            }}>
              {lead.full_name?.[0]?.toUpperCase()}
            </div>
            {/* Dot de status online (se visto recentemente) */}
            {lead.last_seen && (new Date() - new Date(lead.last_seen)) < 600000 && (
              <div style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: '#22c58b', border: '2px solid #080812' }} />
            )}
          </div>

          {/* Nome + Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#f3f5ff', fontFamily: 'var(--font-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {lead.full_name}
              </span>
              {status === 'Depositado' && (
                <CheckCircle size={14} color="#22c58b" style={{ flexShrink: 0 }} />
              )}
              {status === 'VIP' && (
                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 4, color: '#F59E0B', letterSpacing: '0.08em' }}>VIP</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#5a6280', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Globe size={10} />
              <span>{lead.country ? `${getFlag(lead.country)} ${lead.country}` : '—'}</span>
            </div>
          </div>

          {/* Botão de comentários */}
          <button
            onClick={() => onComment(lead)}
            data-testid={`comment-btn-${lead.id}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 11px',
              background: lead.comment_count > 0 ? 'rgba(58,134,255,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${lead.comment_count > 0 ? 'rgba(58,134,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 9, cursor: 'pointer',
              color: lead.comment_count > 0 ? '#3A86FF' : '#4a5068',
              flexShrink: 0, transition: 'all .15s'
            }}
          >
            <MessageCircle size={13} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>{lead.comment_count || 0}</span>
          </button>
        </div>

        {/* ROW 2 — Email + Telefone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9 }}>
            <Mail size={12} color="#5a6280" />
            <span style={{ fontSize: 12, color: '#9ca3c0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.email}</span>
            <button onClick={copyEmail} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#22c58b' : '#4a5068', padding: '0 2px', transition: 'color .2s', flexShrink: 0 }}>
              {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
            </button>
          </div>

          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(255,190,11,0.04)', border: '1px solid rgba(255,190,11,0.15)', borderRadius: 9, textDecoration: 'none', transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,190,11,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,190,11,0.04)'}
            >
              <Phone size={12} color="#FFBE0B" />
              <span style={{ fontSize: 12, color: '#FFBE0B', fontWeight: 600 }}>{lead.phone}</span>
              <span style={{ fontSize: 10, color: '#4a5068', marginLeft: 'auto' }}>Toque para ligar</span>
            </a>
          )}
        </div>

        {/* ROW 3 — Saldo + Lucro + Último Acesso */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          <div style={{ background: 'rgba(34,197,139,0.07)', border: '1px solid rgba(34,197,139,0.18)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, color: '#22c58b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
              <DollarSign size={8} />SALDO
            </div>
            <div className="numeric" style={{ fontSize: 15, fontWeight: 900, color: '#22c58b', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
              {fmt(balance)}
            </div>
          </div>

          <div style={{ background: profit > 0 ? 'rgba(58,134,255,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${profit > 0 ? 'rgba(58,134,255,0.18)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, color: profit > 0 ? '#3A86FF' : '#4a5068', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
              <TrendingUp size={8} />LUCRO
            </div>
            <div className="numeric" style={{ fontSize: 15, fontWeight: 900, color: profit > 0 ? '#3A86FF' : '#4a5068', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
              {fmt(profit)}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={8} />REGISTO
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6a7290', lineHeight: 1.2 }}>
              {fmtDate(lead.created_at)}
            </div>
          </div>
        </div>

        {/* ROW 4 — Último Acesso */}
        {lead.last_seen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 9, marginBottom: 12 }}>
            <Activity size={11} color="#5a6280" />
            <span style={{ fontSize: 11, color: '#5a6280' }}>Último acesso: <span style={{ color: '#7a8299', fontWeight: 600 }}>{fmtDate(lead.last_seen)}</span></span>
          </div>
        )}

        {/* Follow-up */}
        {lead.followup_date && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', background: 'rgba(255,190,11,0.05)', border: '1px solid rgba(255,190,11,0.18)', borderRadius: 9, marginBottom: 12 }}>
            <Calendar size={11} color="#FFBE0B" />
            <span style={{ fontSize: 11, color: '#FFBE0B', fontWeight: 600 }}>Follow-up: {fmtFull(lead.followup_date)}</span>
            {lead.followup_note && <span style={{ fontSize: 10, color: '#5a6280', marginLeft: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {lead.followup_note}</span>}
          </div>
        )}

        {/* ROW 5 — Estado + Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
          <span style={{ fontSize: 10, color: '#3a3d5a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estado:</span>
          <button
            onClick={() => setShowStatus(!showStatus)}
            data-testid={`status-btn-${lead.id}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
              borderRadius: 8, cursor: 'pointer',
              background: ss.bg, border: `1px solid ${ss.border}`,
              color: ss.color, fontSize: 11, fontWeight: 800,
              transition: 'all .15s', letterSpacing: '0.02em'
            }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: ss.color, display: 'inline-block', flexShrink: 0 }} />
            {status} <ChevronDown size={11} />
          </button>

          {showStatus && (
            <>
              <div onClick={() => setShowStatus(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
              <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 60, background: '#0d0d1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 6, zIndex: 31, boxShadow: '0 16px 48px rgba(0,0,0,0.7)', minWidth: 170 }}>
                {STATUS_OPTIONS.map(s => {
                  const st = STATUS_STYLES[s];
                  return (
                    <button key={s} onClick={() => changeStatus(s)}
                      style={{ width: '100%', padding: '8px 12px', background: status === s ? st.bg : 'transparent', border: `1px solid ${status === s ? st.border : 'transparent'}`, borderRadius: 8, color: status === s ? st.color : '#5a6280', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'left', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8, transition: 'all .1s' }}
                      onMouseEnter={e => { if (status !== s) { e.currentTarget.style.background = st.bg; e.currentTarget.style.color = st.color; } }}
                      onMouseLeave={e => { if (status !== s) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5a6280'; } }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                      {s}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DROPDOWN DO PERFIL DO AGENTE
══════════════════════════════════════════════════════════════ */
function AgentProfileDropdown({ agent, token, onLogout, onPhotoUpdate }) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Foto muito grande (máx. 2MB)');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const res = await fetch(`${BACKEND_URL}/api/agent/profile/photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao carregar foto');
      onPhotoUpdate(data.photo_url);
      toast.success('Foto de perfil atualizada!');
      setOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Avatar clicável */}
      <button
        onClick={() => setOpen(!open)}
        data-testid="agent-profile-btn"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative' }}>
          {agent?.photo_url ? (
            <img
              src={agent.photo_url}
              alt={agent.full_name}
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(58,134,255,0.4)' }}
            />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#3A86FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#fff', border: '2px solid rgba(58,134,255,0.3)' }}>
              {agent?.full_name?.[0]?.toUpperCase()}
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#22c58b', border: '2px solid #080812' }} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e8eaf6', lineHeight: 1 }}>{agent?.full_name}</div>
          <div style={{ fontSize: 10, color: '#3A86FF', marginTop: 2, fontWeight: 600 }}>Agente</div>
        </div>
        <ChevronDown size={14} color="#5a6280" style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }} />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 10px)', right: 0,
            background: 'linear-gradient(160deg,#0f0f1e,#080812)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
            padding: 14, zIndex: 51, width: 240,
            boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
          }}>
            {/* Foto grande + nome */}
            <div style={{ textAlign: 'center', marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 10px' }}>
                {agent?.photo_url ? (
                  <img src={agent.photo_url} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(58,134,255,0.4)' }} />
                ) : (
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#3A86FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#fff', border: '3px solid rgba(58,134,255,0.3)' }}>
                    {agent?.full_name?.[0]?.toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  title="Alterar foto"
                  style={{ position: 'absolute', bottom: 0, right: -2, width: 24, height: 24, borderRadius: '50%', background: '#3A86FF', border: '2px solid #080812', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
                  onMouseLeave={e => e.currentTarget.style.background = '#3A86FF'}
                >
                  <Camera size={12} color="#fff" />
                </button>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#f3f5ff', fontFamily: 'var(--font-heading)' }}>{agent?.full_name}</div>
              <div style={{ fontSize: 11, color: '#5a6280', marginTop: 2 }}>{agent?.email}</div>
            </div>

            {/* Botão de alterar foto */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              data-testid="change-photo-btn"
              style={{ width: '100%', padding: '9px 12px', background: 'rgba(58,134,255,0.08)', border: '1px solid rgba(58,134,255,0.2)', borderRadius: 10, color: '#3A86FF', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 8, transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(58,134,255,0.14)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(58,134,255,0.08)'}
            >
              <Camera size={14} />
              {uploading ? 'A carregar…' : 'Alterar foto de perfil'}
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              data-testid="logout-btn"
              style={{ width: '100%', padding: '9px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
            >
              <LogOut size={14} />Sair
            </button>
          </div>
        </>
      )}

      {/* Input de arquivo oculto */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handlePhotoChange}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL — AGENT CRM
══════════════════════════════════════════════════════════════ */
export default function AgentCRM() {
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [commentLead, setCommentLead] = useState(null);
  const token = localStorage.getItem('agentToken');

  const fetchData = useCallback(async () => {
    if (!token) { navigate('/crm/login'); return; }
    try {
      const [meRes, leadsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/agent/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/agent/leads`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!meRes.ok) { localStorage.removeItem('agentToken'); navigate('/crm/login'); return; }
      setAgent(await meRes.json());
      if (leadsRes.ok) setLeads(await leadsRes.json());
    } catch (_) {}
    setLoading(false);
  }, [token, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = (leadId, newStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  };

  const handleComment = (lead) => setCommentLead(lead);

  const logout = () => { localStorage.removeItem('agentToken'); navigate('/crm/login'); };

  const handlePhotoUpdate = (photoUrl) => {
    setAgent(prev => ({ ...prev, photo_url: photoUrl }));
  };

  const filtered = leads.filter(l => {
    const m = !search
      || l.full_name?.toLowerCase().includes(search.toLowerCase())
      || l.email?.toLowerCase().includes(search.toLowerCase())
      || l.phone?.includes(search)
      || l.country?.toLowerCase().includes(search.toLowerCase());
    const s = statusFilter === 'Todos' || l.status === statusFilter;
    return m && s;
  });

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s).length;
    return acc;
  }, {});

  const totalBalance = leads.reduce((s, l) => s + (l.balance || 0), 0);
  const depositedCount = counts['Depositado'] || 0;
  const callLaterCount = counts['Call Later'] || 0;

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#06061a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#7a8299' }}>
        <div style={{ width: 44, height: 44, border: '3px solid rgba(58,134,255,0.15)', borderTopColor: '#3A86FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ fontSize: 13, margin: 0, fontWeight: 600 }}>A carregar CRM…</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#06061a', display: 'flex', flexDirection: 'column' }}>
      {/* Drawer de comentários */}
      {commentLead && (
        <CommentDrawer
          lead={commentLead}
          token={token}
          onClose={() => {
            fetch(`${BACKEND_URL}/api/agent/leads`, { headers: { Authorization: `Bearer ${token}` } })
              .then(r => r.ok ? r.json() : leads)
              .then(data => { setLeads(data); setCommentLead(null); })
              .catch(() => setCommentLead(null));
          }}
        />
      )}

      {/* ── HEADER ── */}
      <header style={{
        background: 'rgba(8,8,18,0.98)', borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', gap: 16,
        position: 'sticky', top: 0, zIndex: 30, backdropFilter: 'blur(20px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <img src="/logo-eurovault.png" alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <div>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 900, color: '#f3f5ff', letterSpacing: '-0.01em' }}>EuroVault</span>
            <span style={{ fontSize: 9, padding: '2px 7px', marginLeft: 7, background: 'rgba(58,134,255,0.12)', border: '1px solid rgba(58,134,255,0.25)', borderRadius: 5, color: '#3A86FF', fontWeight: 800, letterSpacing: '0.1em' }}>CRM</span>
          </div>
        </div>

        {/* Stats rápidas no header */}
        <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }}>
            <User size={11} color="#5a6280" />
            <span className="numeric" style={{ fontSize: 13, fontWeight: 800, color: '#f3f5ff', fontFamily: 'var(--font-heading)' }}>{leads.length}</span>
            <span style={{ fontSize: 10, color: '#4a5068' }}>leads</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', background: 'rgba(34,197,139,0.06)', border: '1px solid rgba(34,197,139,0.15)', borderRadius: 8 }}>
            <CheckCircle size={11} color="#22c58b" />
            <span className="numeric" style={{ fontSize: 13, fontWeight: 800, color: '#22c58b', fontFamily: 'var(--font-heading)' }}>{depositedCount}</span>
            <span style={{ fontSize: 10, color: '#22c58b', opacity: 0.7 }}>dep.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', background: 'rgba(34,197,139,0.04)', border: '1px solid rgba(34,197,139,0.1)', borderRadius: 8 }}>
            <BarChart3 size={11} color="#22c58b" />
            <span className="numeric" style={{ fontSize: 13, fontWeight: 800, color: '#22c58b', fontFamily: 'var(--font-heading)' }}>{fmt(totalBalance)}</span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Perfil do Agente */}
        <AgentProfileDropdown
          agent={agent}
          token={token}
          onLogout={logout}
          onPhotoUpdate={handlePhotoUpdate}
        />
      </header>

      {/* ── CORPO ── */}
      <div style={{ flex: 1, padding: '22px 24px', maxWidth: 1300, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Barra de filtros */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#4a5068' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar por nome, email, telefone ou país…"
              data-testid="agent-search-input"
              style={{ width: '100%', padding: '10px 14px 10px 36px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 11, color: '#f3f5ff', fontSize: 13, outline: 'none', boxSizing: 'border-box', transition: 'border-color .2s' }}
              onFocus={e => e.target.style.borderColor = 'rgba(58,134,255,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
            />
          </div>

          {/* Filtros de status */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Filter size={12} color="#4a5068" />
            {['Todos', ...STATUS_OPTIONS].map(s => {
              const st = STATUS_STYLES[s];
              const active = statusFilter === s;
              return (
                <button key={s} onClick={() => setStatusFilter(s)}
                  style={{
                    padding: '6px 11px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${active && st ? st.border : active ? 'rgba(58,134,255,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    background: active && st ? st.bg : active ? 'rgba(58,134,255,0.12)' : 'transparent',
                    color: active && st ? st.color : active ? '#3A86FF' : '#4a5068',
                    transition: 'all .15s', whiteSpace: 'nowrap'
                  }}>
                  {s}{s !== 'Todos' && counts[s] > 0 && ` (${counts[s]})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contador de resultados */}
        {search || statusFilter !== 'Todos' ? (
          <div style={{ marginBottom: 14, fontSize: 12, color: '#4a5068' }}>
            {filtered.length} lead{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            {(search || statusFilter !== 'Todos') && (
              <button onClick={() => { setSearch(''); setStatusFilter('Todos'); }}
                style={{ marginLeft: 10, background: 'none', border: 'none', color: '#3A86FF', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                Limpar filtros
              </button>
            )}
          </div>
        ) : null}

        {/* Grid de cards */}
        {filtered.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#4a5068' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <User size={28} style={{ opacity: 0.15 }} />
            </div>
            <p style={{ fontSize: 15, margin: '0 0 6px', fontWeight: 700, color: '#3a3d5a' }}>Nenhum lead encontrado</p>
            <p style={{ fontSize: 12, margin: 0, color: '#26263a' }}>
              {search || statusFilter !== 'Todos' ? 'Tente outros filtros ou limpe a pesquisa' : 'Aguarda atribuição de leads pelo administrador'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {filtered.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                token={token}
                onComment={handleComment}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
