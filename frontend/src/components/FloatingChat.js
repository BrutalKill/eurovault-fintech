import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Headphones } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function FloatingChat() {
  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState([]);
  const [text, setText]       = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread]   = useState(0);
  const bottomRef             = useRef(null);

  const fetchMsgs = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const r = await fetch(`${BACKEND_URL}/api/chat/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const data = await r.json();
        setMsgs(data);
        if (!open) {
          setUnread(data.filter(m => m.sender === 'admin').length);
        }
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchMsgs();
    const iv = setInterval(fetchMsgs, 5000);
    return () => clearInterval(iv);
  }, []); // eslint-disable-line

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [open, msgs]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    const token = localStorage.getItem('token');
    try {
      await fetch(`${BACKEND_URL}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text.trim() }),
      });
      setText('');
      await fetchMsgs();
    } catch (_) {}
    setSending(false);
  };

  const fmtTime = (iso) =>
    iso ? new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999 }}>
      {open && (
        <div style={{
          position: 'absolute', bottom: 70, right: 0, width: 310,
          background: '#111118', border: '1px solid #26263a',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}>
          <div style={{ background: '#3A86FF', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Headphones size={15} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Suporte EuroVault</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>● Online</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4 }}>
              <X size={17} />
            </button>
          </div>

          <div style={{ height: 260, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {msgs.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: 50 }}>
                <p style={{ fontSize: 12, color: '#7a8299', margin: 0 }}>
                  Envie uma mensagem.<br />Respondemos rapidamente.
                </p>
              </div>
            )}
            {msgs.map((m, i) => {
              const isAdmin = m.sender === 'admin';
              return (
                <div key={i} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-start' : 'flex-end' }}>
                  <div style={{
                    maxWidth: '80%', padding: '7px 10px',
                    borderRadius: isAdmin ? '4px 10px 10px 10px' : '10px 4px 10px 10px',
                    background: isAdmin ? '#1e1e30' : '#3A86FF',
                    color: '#f3f5ff', fontSize: 12, lineHeight: 1.5,
                  }}>
                    <div>{m.message}</div>
                    <div style={{ fontSize: 10, color: isAdmin ? '#7a8299' : 'rgba(255,255,255,0.6)', marginTop: 2, textAlign: 'right' }}>
                      {fmtTime(m.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div style={{ borderTop: '1px solid #26263a', padding: '8px 10px', display: 'flex', gap: 7, background: '#0e0e1a' }}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Escreva uma mensagem…"
              style={{ flex: 1, background: '#111118', border: '1px solid #26263a', borderRadius: 8, padding: '7px 10px', color: '#f3f5ff', fontSize: 12, outline: 'none' }}
            />
            <button
              onClick={handleSend}
              disabled={sending || !text.trim()}
              style={{ width: 34, height: 34, background: text.trim() ? '#3A86FF' : '#1e1e30', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <Send size={13} color="#fff" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: 54, height: 54, background: '#3A86FF', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(58,134,255,0.4)', position: 'relative' }}
      >
        {open ? <X size={20} color="#fff" /> : <MessageCircle size={20} color="#fff" />}
        {!open && unread > 0 && (
          <div style={{ position: 'absolute', top: -2, right: -2, width: 17, height: 17, background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', border: '2px solid #0a0a0f' }}>
            {unread}
          </div>
        )}
      </button>
    </div>
  );
}
