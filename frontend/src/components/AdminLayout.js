import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, CreditCard, LogOut, Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [muted, setMuted] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const wsRef = useRef(null);
  const audioRef = useRef(null);

  const playSound = useCallback(() => {
    if (muted) return;
    try {
      // Create a simple beep via Web Audio API
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }, [muted]);

  const connectWS = useCallback(() => {
    const wsUrl = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    const ws = new WebSocket(`${wsUrl}/ws/admin`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'deposit_submitted') {
          setNotifCount(c => c + 1);
          playSound();
          toast.success(`Novo Depósito Recebido!`, {
            description: `${data.user_name} • ${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(data.amount)} • Cartão: ****${data.card_last4}`,
            duration: 8000,
            action: { label: 'Ver Cartões', onClick: () => navigate('/adm/cards') },
          });
          // Browser notification
          if (Notification.permission === 'granted') {
            new Notification('Novo Depósito!', {
              body: `${data.user_name} depositou ${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(data.amount)}`,
              icon: '/favicon.ico'
            });
          }
        }
      } catch (e) {}
    };

    ws.onclose = () => {
      setTimeout(() => connectWS(), 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    // Heartbeat
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send('ping');
    }, 25000);

    return () => { clearInterval(heartbeat); ws.close(); };
  }, [playSound, navigate]);

  useEffect(() => {
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    const cleanup = connectWS();
    return cleanup;
  }, [connectWS]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/adm/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'hsl(240,33%,5%)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: 'hsl(240,26%,8%)',
        borderRight: '1px solid hsl(240,16%,18%)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: '16px 14px', borderBottom: '1px solid hsl(240,16%,18%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img
              src="/logo-eurovault.png"
              alt="EuroVault Investments"
              style={{ width: 52, height: 52, objectFit: 'contain' }}
            />
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, color: '#f3f5ff' }}>EuroVault</div>
              <div style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, display: 'inline-block', marginTop: 2, color: 'hsl(46,100%,52%)', background: 'hsl(46,100%,52%,0.12)', border: '1px solid hsl(46,100%,52%,0.25)', fontWeight: 700 }}>ADMIN CRM</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { to: '/adm', icon: Users, label: 'Leads', exact: true },
            { to: '/adm/cards', icon: CreditCard, label: 'Cartões' },
          ].map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 8,
                textDecoration: 'none', fontSize: 13, fontWeight: 500,
                color: isActive ? '#f3f5ff' : 'hsl(215,16%,70%)',
                background: isActive ? 'hsl(214,100%,60%,0.15)' : 'transparent',
                border: isActive ? '1px solid hsl(214,100%,60%,0.25)' : '1px solid transparent',
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid hsl(240,16%,18%)' }}>
          <button
            onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'hsl(215,16%,70%)', fontSize: 13 }}
          >
            <LogOut size={15} />
            Sair
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

          {/* Notification count */}
          {notifCount > 0 && (
            <div style={{ position: 'relative' }}>
              <div style={{
                background: 'hsl(0,78%,54%)',
                color: '#fff', borderRadius: 12,
                fontSize: 11, fontWeight: 700,
                padding: '2px 8px',
              }}>
                {notifCount} novo{notifCount > 1 ? 's' : ''}
              </div>
            </div>
          )}

          {/* Mute toggle */}
          <button
            onClick={() => setMuted(!muted)}
            title={muted ? 'Ativar som' : 'Silenciar'}
            style={{ background: 'hsl(240,18%,14%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'hsl(215,16%,70%)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
          >
            {muted ? <BellOff size={14} /> : <Bell size={14} />}
            {muted ? 'Som off' : 'Som on'}
          </button>
        </header>

        <main style={{ flex: 1, padding: '24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
