import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, CreditCard, MessageSquare, BarChart2, ArrowDownToLine,
         LogOut, Bell, BellOff, X, UserPlus, CreditCard as CardIcon, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [muted, setMuted]           = useState(false);
  const [chatUnread, setChatUnread]  = useState(0);
  const [pendingWd, setPendingWd]    = useState(0);
  const [newLeads, setNewLeads]      = useState(0);   // badge "Leads"
  const [bellOpen, setBellOpen]      = useState(false);
  const [notifications, setNotifications] = useState([]);
  const wsRef     = useRef(null);
  const audioCtxRef = useRef(null);   // AudioContext reutilizável
  const bellRef   = useRef(null);

  // Criar/resumir AudioContext após primeira interação do utilizador
  const getAudioCtx = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch (_) { return null; }
  }, []);

  const playTone = useCallback((freqs, type = 'sine') => {
    if (muted) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    freqs.forEach(({ freq, time, duration = 0.25 }) => {
      try {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + duration);
        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + duration);
      } catch (_) {}
    });
  }, [muted, getAudioCtx]);

  // Sons distintos por tipo
  const playSoundDeposit = useCallback(() =>
    playTone([{ freq: 880, time: 0 }, { freq: 660, time: 0.1 }]), [playTone]);

  const playSoundNewLead = useCallback(() =>
    playTone([{ freq: 440, time: 0 }, { freq: 554, time: 0.12 }, { freq: 659, time: 0.24 }]), [playTone]);

  const addNotif = useCallback((notif) => {
    const entry = { ...notif, id: Date.now() + Math.random(), read: false, ts: new Date().toISOString() };
    setNotifications(prev => [entry, ...prev].slice(0, 30));
  }, []);

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const connectWS = useCallback(() => {
    const wsUrl = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    const ws = new WebSocket(`${wsUrl}/ws/admin`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'deposit_submitted') {
          playSoundDeposit();
          addNotif({ type: 'deposit', icon: 'card', color: '#22c58b',
            title: 'Novo Depósito',
            body: `${data.user_name} • ${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(data.amount)}` });
          toast.success('Novo Depósito Recebido!', {
            description: `${data.user_name} • ${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(data.amount)} • ****${data.card_last4}`,
            duration: 8000,
            action: { label: 'Ver Cartões', onClick: () => navigate('/adm/cards') },
          });
          if (Notification.permission === 'granted') {
            new Notification('Novo Depósito!', { body: `${data.user_name} depositou`, icon: '/logo-eurovault.png' });
          }
        }

        if (data.type === 'new_client_registered') {
          playSoundNewLead();
          setNewLeads(c => c + 1);
          addNotif({ type: 'lead', icon: 'user', color: '#3A86FF',
            title: 'Novo Cliente Registado',
            body: `${data.user_name} • ${data.email} • ${data.country || ''}` });
          toast.info('Novo Cliente Registado!', {
            description: `${data.user_name} • ${data.email}`,
            duration: 10000,
            action: { label: 'Ver Leads', onClick: () => { navigate('/adm'); setNewLeads(0); } },
          });
          if (Notification.permission === 'granted') {
            new Notification('Novo Cliente!', { body: `${data.user_name} (${data.email}) registou-se.`, icon: '/logo-eurovault.png' });
          }
        }

        if (data.type === 'withdrawal_requested') {
          setPendingWd(c => c + 1);
          playSoundDeposit();
          addNotif({ type: 'withdrawal', icon: 'alert', color: '#FFBE0B',
            title: 'Pedido de Levantamento',
            body: `${data.user_name} • ${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(data.amount || 0)}` });
          toast.warning('Pedido de Levantamento!', {
            description: `${data.user_name} • ${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(data.amount || 0)}`,
            duration: 8000,
            action: { label: 'Ver Pedidos', onClick: () => navigate('/adm/withdrawals') },
          });
        }
      } catch (e) {}
    };

    ws.onclose = () => { setTimeout(() => connectWS(), 3000); };
    ws.onerror = () => { ws.close(); };

    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send('ping');
    }, 25000);

    return () => { clearInterval(heartbeat); ws.close(); };
  }, [playSoundDeposit, playSoundNewLead, addNotif, navigate]);

  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission();

    // Desbloquear AudioContext na primeira interação
    const unlock = () => {
      getAudioCtx();
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('click', unlock, { once: true });

    const cleanup = connectWS();
    const token = localStorage.getItem('adminToken');
    const h = { Authorization: `Bearer ${token}` };
    const fetchCounts = () => {
      fetch(`${BACKEND_URL}/api/admin/chat/unread-count`, { headers: h })
        .then(r => r.ok ? r.json() : { unread: 0 }).then(d => setChatUnread(d.unread || 0)).catch(() => {});
      fetch(`${BACKEND_URL}/api/admin/withdrawals/count`, { headers: h })
        .then(r => r.ok ? r.json() : { pending: 0 }).then(d => setPendingWd(d.pending || 0)).catch(() => {});
    };
    fetchCounts();
    const iv = setInterval(fetchCounts, 15000);
    return () => { cleanup(); clearInterval(iv); };
  }, [connectWS, getAudioCtx]);

  // Fechar sino ao clicar fora
  useEffect(() => {
    const handler = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/adm/login');
  };

  const fmtTs = (iso) => {
    if (!iso) return '';
    const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (diff < 1) return 'Agora';
    if (diff < 60) return `${diff}min atrás`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h atrás`;
    return new Date(iso).toLocaleDateString('pt-PT');
  };

  const NotifIcon = ({ type }) => {
    if (type === 'deposit')    return <CardIcon size={13} />;
    if (type === 'lead')       return <UserPlus size={13} />;
    if (type === 'withdrawal') return <AlertTriangle size={13} />;
    return <Bell size={13} />;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'hsl(240,33%,5%)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: 'hsl(240,26%,8%)',
        borderRight: '1px solid hsl(240,16%,18%)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: '16px 14px', borderBottom: '1px solid hsl(240,16%,18%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo-eurovault.png" alt="EuroVault Investments" style={{ width: 52, height: 52, objectFit: 'contain' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, color: '#f3f5ff' }}>EuroVault</div>
              <div style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, display: 'inline-block', marginTop: 2, color: 'hsl(46,100%,52%)', background: 'hsl(46,100%,52%,0.12)', border: '1px solid hsl(46,100%,52%,0.25)', fontWeight: 700 }}>ADMIN CRM</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { to: '/adm',              icon: Users,           label: 'Leads',         exact: true,  badge: newLeads,  badgeColor: '#ef4444', onClick: () => setNewLeads(0) },
            { to: '/adm/analytics',    icon: BarChart2,       label: 'Analytics',     exact: false },
            { to: '/adm/withdrawals',  icon: ArrowDownToLine, label: 'Levantamentos', exact: false, badge: pendingWd, badgeColor: '#ef4444' },
            { to: '/adm/cards',        icon: CreditCard,      label: 'Cartões',       exact: false },
            { to: '/adm/chat',         icon: MessageSquare,   label: 'Chat',          exact: false, badge: chatUnread, badgeColor: '#ef4444' },
          ].map(({ to, icon: Icon, label, exact, badge, badgeColor, onClick }) => (
            <NavLink key={to} to={to} end={exact} onClick={onClick}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 8, textDecoration: 'none',
                fontSize: 13, fontWeight: badge > 0 ? 700 : 500,
                color: isActive ? '#f3f5ff' : badge > 0 ? '#f3f5ff' : 'hsl(215,16%,70%)',
                background: isActive ? 'hsl(214,100%,60%,0.15)' : 'transparent',
                border: `1px solid ${isActive ? 'hsl(214,100%,60%,0.25)' : 'transparent'}`,
                position: 'relative',
              })}>
              <Icon size={16} />
              <span style={{ flex: 1 }}>{label}</span>
              {badge > 0 && (
                <span style={{
                  minWidth: 18, height: 18, padding: '0 5px',
                  background: badgeColor || '#ef4444',
                  borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: '#fff',
                  animation: 'shimmer 2s ease infinite',
                }}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid hsl(240,16%,18%)' }}>
          <button onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'hsl(215,16%,70%)', fontSize: 13 }}>
            <LogOut size={15} />Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Topbar */}
        <header style={{
          height: 56, background: 'hsl(240,26%,8%)',
          borderBottom: '1px solid hsl(240,16%,18%)',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12,
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 15, color: '#f3f5ff' }}>EuroVault — CRM</span>
          </div>

          {/* Sino de notificações */}
          <div ref={bellRef} style={{ position: 'relative' }}>
            <button
              data-testid="admin-bell-btn"
              onClick={() => { setBellOpen(o => !o); if (!bellOpen) markAllRead(); }}
              style={{
                position: 'relative', width: 38, height: 38,
                background: bellOpen ? 'rgba(58,134,255,0.15)' : 'hsl(240,18%,14%)',
                border: `1px solid ${bellOpen ? 'rgba(58,134,255,0.4)' : 'hsl(240,16%,22%)'}`,
                borderRadius: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
              <Bell size={16} color={unreadNotifCount > 0 ? '#ef4444' : 'hsl(215,16%,65%)'} style={{ animation: unreadNotifCount > 0 ? 'none' : undefined }} />
              {unreadNotifCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  minWidth: 16, height: 16, padding: '0 4px',
                  background: '#ef4444', borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800, color: '#fff',
                  border: '2px solid hsl(240,26%,8%)',
                  animation: 'pulse-border 2s ease infinite',
                }}>
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </span>
              )}
            </button>

            {/* Dropdown de notificações */}
            {bellOpen && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, width: 340,
                background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)',
                borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                zIndex: 500, overflow: 'hidden',
              }}>
                {/* Header dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid hsl(240,16%,16%)' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>Notificações</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {notifications.length > 0 && (
                      <button onClick={() => setNotifications([])}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5068', padding: 4, fontSize: 11 }}>
                        Limpar
                      </button>
                    )}
                    <button onClick={() => setBellOpen(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5068', padding: 4 }}>
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Lista */}
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#4a5068' }}>
                      <Bell size={24} style={{ marginBottom: 8, opacity: 0.3 }} />
                      <p style={{ fontSize: 12, margin: 0 }}>Sem notificações</p>
                    </div>
                  ) : notifications.map(n => (
                    <div key={n.id}
                      style={{ display: 'flex', gap: 10, padding: '11px 16px', borderBottom: '1px solid hsl(240,16%,12%)', background: n.read ? 'transparent' : 'rgba(58,134,255,0.04)' }}
                      onClick={() => {
                        if (n.type === 'lead')       { navigate('/adm'); setNewLeads(0); }
                        if (n.type === 'deposit')    navigate('/adm/cards');
                        if (n.type === 'withdrawal') navigate('/adm/withdrawals');
                        setBellOpen(false);
                      }}
                      style={{ display: 'flex', gap: 10, padding: '11px 16px', borderBottom: '1px solid hsl(240,16%,12%)', background: n.read ? 'transparent' : `${n.color}0a`, cursor: 'pointer' }}>
                      <div style={{ width: 30, height: 30, background: `${n.color}18`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: n.color }}>
                        <NotifIcon type={n.type} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: n.read ? 500 : 700, color: '#f3f5ff', marginBottom: 2 }}>{n.title}</div>
                        <div style={{ fontSize: 11, color: '#7a8299', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.body}</div>
                        <div style={{ fontSize: 10, color: '#4a5068', marginTop: 2 }}>{fmtTs(n.ts)}</div>
                      </div>
                      {!n.read && <div style={{ width: 6, height: 6, background: n.color, borderRadius: '50%', flexShrink: 0, marginTop: 4 }} />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mute toggle */}
          <button onClick={() => setMuted(!muted)} title={muted ? 'Ativar som' : 'Silenciar'}
            style={{ background: muted ? 'rgba(239,68,68,0.1)' : 'hsl(240,18%,14%)', border: `1px solid ${muted ? 'rgba(239,68,68,0.3)' : 'hsl(240,16%,18%)'}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: muted ? '#ef4444' : 'hsl(215,16%,70%)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            {muted ? <BellOff size={14} /> : <Bell size={14} />}
            {muted ? 'Mudo' : 'Som'}
          </button>
        </header>

        <main style={{ flex: 1, padding: '24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

