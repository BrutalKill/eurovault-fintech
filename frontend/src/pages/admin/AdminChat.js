import { useLang } from '../../context/LangContext';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Send, MessageCircle, User, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '';

const fmtDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function AdminChat() {
  const { t } = useLang();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected]           = useState(null);
  const [messages, setMessages]           = useState([]);
  const [reply, setReply]                 = useState('');
  const [sending, setSending]             = useState(false);
  const [search, setSearch]               = useState('');
  const [templates, setTemplates]         = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const bottomRef                         = useRef(null);

  const fetchConversations = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (e) {}
  }, []);

  const fetchMessages = useCallback(async (userId) => {
    const token = localStorage.getItem('adminToken');
    if (!token || !userId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/chat/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchConversations();
    const iv = setInterval(fetchConversations, 8000);
    // Carregar templates
    const token = localStorage.getItem('adminToken');
    fetch(`${BACKEND_URL}/api/admin/chat/templates_list`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(setTemplates).catch(() => {});
    return () => clearInterval(iv);
  }, [fetchConversations]);

  useEffect(() => {
    if (selected) {
      fetchMessages(selected.user_id);
      const iv = setInterval(() => fetchMessages(selected.user_id), 5000);
      return () => clearInterval(iv);
    }
  }, [selected, fetchMessages]);

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/chat/${selected.user_id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: reply.trim() }),
      });
      if (res.ok) {
        setReply('');
        await fetchMessages(selected.user_id);
        await fetchConversations();
      } else {
        toast.error('Erro ao enviar resposta');
      }
    } catch (e) {
      toast.error('Erro de ligação');
    }
    setSending(false);
  };

  const filtered = conversations.filter(c =>
    !search || c.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.user_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', gap: 0, background: '#111118', border: '1px solid #26263a', borderRadius: 16, overflow: 'hidden' }}>

      {/* Lista de conversas */}
      <div style={{ width: 280, borderRight: '1px solid #26263a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 14px', borderBottom: '1px solid #26263a' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: '#f3f5ff', marginBottom: 10 }}>
            Conversas
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#7a8299' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar…"
              style={{ width: '100%', padding: '7px 10px 7px 28px', background: '#0e0e1a', border: '1px solid #26263a', borderRadius: 8, color: '#f3f5ff', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: '#4a5068' }}>
              <MessageCircle size={24} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p style={{ fontSize: 12, margin: 0 }}>Sem conversas ainda</p>
            </div>
          ) : filtered.map(conv => {
            const isSelected = selected?.user_id === conv.user_id;
            return (
              <div
                key={conv.user_id}
                data-testid="admin-chat-conv-item"
                onClick={() => setSelected(conv)}
                style={{
                  padding: '12px 14px', cursor: 'pointer',
                  background: isSelected ? 'rgba(58,134,255,0.10)' : 'transparent',
                  borderLeft: `2px solid ${isSelected ? '#3A86FF' : 'transparent'}`,
                  borderBottom: '1px solid #1a1a2a',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#3A86FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {conv.user_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f3f5ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.user_name || conv.user_email}
                    </div>
                    <div style={{ fontSize: 10, color: '#7a8299', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                      {conv.last_message || '…'}
                    </div>
                  </div>
                  {conv.unread_count > 0 && (
                    <div style={{ width: 18, height: 18, background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {conv.unread_count}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 10, color: '#26263a', marginTop: 4, textAlign: 'right' }}>
                  {fmtDate(conv.last_message_at)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Área de mensagens */}
      {!selected ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#4a5068' }}>
          <MessageCircle size={40} style={{ opacity: 0.2 }} />
          <p style={{ fontSize: 13, margin: 0 }}>Seleccione uma conversa</p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header da conversa */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #26263a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#3A86FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
              {selected.user_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>{selected.user_name}</div>
              <div style={{ fontSize: 11, color: '#7a8299' }}>{selected.user_email}</div>
            </div>
          </div>

          {/* Mensagens */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: 60, color: '#4a5068' }}>
                <Clock size={24} style={{ marginBottom: 8, opacity: 0.3 }} />
                <p style={{ fontSize: 12, margin: 0 }}>Sem mensagens ainda</p>
              </div>
            ) : messages.map((m, i) => {
              const isAdmin = m.sender === 'admin';
              return (
                <div key={i} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
                  {!isAdmin && (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#26263a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={12} color="#7a8299" />
                    </div>
                  )}
                  <div style={{
                    maxWidth: '65%', padding: '8px 12px',
                    borderRadius: isAdmin ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                    background: isAdmin ? '#3A86FF' : '#1e1e30',
                    color: '#f3f5ff', fontSize: 13, lineHeight: 1.5,
                  }}>
                    <div>{m.message}</div>
                    <div style={{ fontSize: 10, color: isAdmin ? 'rgba(255,255,255,0.6)' : '#4a5068', marginTop: 3, textAlign: 'right' }}>
                      {fmtTime(m.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Caixa de resposta */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #26263a', background: '#0e0e1a', flexShrink: 0 }}>
            {/* Templates rápidos */}
            {showTemplates && templates.length > 0 && (
              <div style={{ marginBottom: 8, background: '#111118', border: '1px solid #26263a', borderRadius: 10, overflow: 'hidden', maxHeight: 180, overflowY: 'auto' }}>
                {templates.map(tpl => (
                  <button key={tpl.id} onClick={() => { setReply(tpl.text); setShowTemplates(false); }}
                    style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', borderBottom: '1px solid #1e1e30', cursor: 'pointer', textAlign: 'left', color: '#e8eaf6', fontSize: 12 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(58,134,255,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ fontSize: 10, color: '#3A86FF', fontWeight: 700, marginBottom: 2 }}>{tpl.label}</div>
                    <div style={{ color: '#7a8299', fontSize: 11 }}>{tpl.text.slice(0, 60)}…</div>
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
              <button onClick={() => setShowTemplates(s => !s)} title="Templates rápidos"
                style={{ width: 34, height: 34, background: showTemplates ? 'rgba(58,134,255,0.2)' : '#1e1e30', border: `1px solid ${showTemplates ? 'rgba(58,134,255,0.4)' : '#26263a'}`, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap size={14} color={showTemplates ? '#3A86FF' : '#7a8299'} />
              </button>
              <input
                data-testid="admin-chat-reply-input"
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                placeholder="Escrever resposta…"
                style={{ flex: 1, padding: '9px 12px', background: '#111118', border: '1px solid #26263a', borderRadius: 9, color: '#f3f5ff', fontSize: 13, outline: 'none' }}
              />
              <button
                data-testid="admin-chat-send-btn"
                onClick={handleReply}
                disabled={sending || !reply.trim()}
                style={{ width: 40, height: 40, background: reply.trim() ? '#3A86FF' : '#1e1e30', border: 'none', borderRadius: 9, cursor: reply.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <Send size={15} color="#fff" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
