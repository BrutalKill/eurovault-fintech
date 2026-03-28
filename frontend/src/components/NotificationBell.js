import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, TrendingUp, CreditCard, ShieldCheck, MessageCircle, Check } from 'lucide-react';
import { useUser } from '../context/UserContext';

const fmt = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);

const NOTIF_ICONS = {
  balance: TrendingUp,
  deposit: CreditCard,
  kyc:     ShieldCheck,
  chat:    MessageCircle,
  default: Bell,
};

export default function NotificationBell() {
  const { user } = useUser();
  const [open, setOpen]       = useState(false);
  const [notifs, setNotifs]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('ev_notifs') || '[]'); } catch { return []; }
  });
  const prevUser = useRef(null);
  const ref      = useRef(null);

  // Detectar mudanças no saldo/lucro e criar notificações
  useEffect(() => {
    if (!user) return;
    const prev = prevUser.current;
    if (prev) {
      const newNotifs = [];
      if (user.balance - prev.balance > 0.01) {
        newNotifs.push({ id: Date.now(), type: 'balance', read: false,
          title: 'Saldo actualizado',
          msg: `+${fmt(user.balance - prev.balance)} adicionados à sua conta`,
          ts: new Date().toISOString() });
      }
      if (user.profit - prev.profit > 0.01) {
        newNotifs.push({ id: Date.now() + 1, type: 'balance', read: false,
          title: 'Lucro actualizado',
          msg: `Novo lucro: ${fmt(user.profit)}`,
          ts: new Date().toISOString() });
      }
      if (newNotifs.length > 0) {
        setNotifs(prev => {
          const updated = [...newNotifs, ...prev].slice(0, 20);
          localStorage.setItem('ev_notifs', JSON.stringify(updated));
          return updated;
        });
      }
    }
    prevUser.current = user;
  }, [user?.balance, user?.profit]); // eslint-disable-line

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifs.filter(n => !n.read).length;

  const markAllRead = () => {
    const updated = notifs.map(n => ({ ...n, read: true }));
    setNotifs(updated);
    localStorage.setItem('ev_notifs', JSON.stringify(updated));
  };

  const clearAll = () => {
    setNotifs([]);
    localStorage.removeItem('ev_notifs');
  };

  const fmtTs = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return 'Agora';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
    return d.toLocaleDateString('pt-PT');
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        data-testid="notification-bell"
        onClick={() => { setOpen(o => !o); if (!open) markAllRead(); }}
        style={{ position: 'relative', width: 36, height: 36, background: 'hsl(240,18%,14%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Bell size={16} color="hsl(215,16%,65%)" />
        {unread > 0 && (
          <div style={{ position: 'absolute', top: -3, right: -3, width: 16, height: 16, background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', border: '2px solid hsl(240,26%,8%)' }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: '110%', right: 0, width: 320, background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.6)', zIndex: 500, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid hsl(240,16%,18%)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f3f5ff' }}>Notificações</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {notifs.length > 0 && (
                <>
                  <button onClick={markAllRead} title="Marcar tudo como lido"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a8299', padding: 4 }}>
                    <Check size={14} />
                  </button>
                  <button onClick={clearAll} title="Limpar tudo"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a8299', padding: 4 }}>
                    <X size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'hsl(215,16%,45%)' }}>
                <Bell size={24} style={{ marginBottom: 8, opacity: 0.3 }} />
                <p style={{ fontSize: 13, margin: 0 }}>Sem notificações</p>
              </div>
            ) : notifs.map(n => {
              const Icon = NOTIF_ICONS[n.type] || NOTIF_ICONS.default;
              return (
                <div key={n.id} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid hsl(240,16%,14%)', background: n.read ? 'transparent' : 'rgba(58,134,255,0.05)', transition: 'background 0.2s' }}>
                  <div style={{ width: 32, height: 32, background: 'rgba(58,134,255,0.1)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color="#3A86FF" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: '#f3f5ff', marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: 'hsl(215,16%,60%)', lineHeight: 1.4 }}>{n.msg}</div>
                    <div style={{ fontSize: 10, color: 'hsl(215,16%,40%)', marginTop: 3 }}>{fmtTs(n.ts)}</div>
                  </div>
                  {!n.read && <div style={{ width: 6, height: 6, background: '#3A86FF', borderRadius: '50%', flexShrink: 0, marginTop: 4 }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
