import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { BarChart2, CreditCard, ArrowDownToLine, Newspaper, User, LogOut, Menu } from 'lucide-react';
import { useUser } from '../context/UserContext';

const navItems = [
  { to: '/app/trade', icon: BarChart2, label: 'Negociar' },
  { to: '/app/deposit', icon: CreditCard, label: 'Depósito' },
  { to: '/app/withdrawal', icon: ArrowDownToLine, label: 'Retirada' },
  { to: '/app/news', icon: Newspaper, label: 'Notícias' },
  { to: '/app/profile', icon: User, label: 'Perfil' },
];

export default function ClientLayout() {
  const navigate = useNavigate();
  const { user, fetchUser } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchUser(); }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatEur = (val) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val || 0);
  const profitPositive = (user?.profit || 0) >= 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'hsl(240,33%,5%)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 260,
        background: 'hsl(240,26%,8%)',
        borderRight: '1px solid hsl(240,16%,18%)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, bottom: 0, left: 0,
        zIndex: 50,
        transition: 'transform 0.3s ease',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
      }} className="lg-sidebar">
        {/* Logo */}
        <div style={{ padding: '20px 20px', borderBottom: '1px solid hsl(240,16%,18%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="https://customer-assets.emergentagent.com/job_trading-eu-hub/artifacts/t2zcbb7n_file_000000005510720a8f958a17bdf723cd.png"
              alt="EuroVault Investments"
              style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6 }}
            />
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: '#f3f5ff', letterSpacing: '-0.02em' }}>EuroVault</div>
              <div style={{ fontSize: 11, color: 'hsl(46,100%,52%)' }}>Investments</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10,
                textDecoration: 'none',
                fontSize: 14, fontWeight: 500,
                color: isActive ? '#f3f5ff' : 'hsl(215,16%,70%)',
                background: isActive ? 'hsl(214,100%,60%,0.15)' : 'transparent',
                border: isActive ? '1px solid hsl(214,100%,60%,0.25)' : '1px solid transparent',
                transition: 'background 0.2s, color 0.2s',
              })}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Balance card */}
        <div style={{ margin: '0 12px 12px', padding: '16px', background: 'hsl(240,18%,14%)', borderRadius: 12, border: '1px solid hsl(240,16%,18%)' }}>
          <div style={{ fontSize: 11, color: 'hsl(215,16%,70%)', marginBottom: 4 }}>Saldo Total</div>
          <div className="numeric" style={{ fontSize: 22, fontWeight: 700, color: '#f3f5ff', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
            {formatEur(user?.balance)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 11, color: 'hsl(215,16%,70%)' }}>P/L</span>
            <span className="numeric" style={{ fontSize: 13, fontWeight: 600, color: profitPositive ? 'hsl(155,72%,45%)' : 'hsl(0,78%,54%)' }}>
              {profitPositive ? '+' : ''}{formatEur(user?.profit)}
            </span>
          </div>
        </div>

        {/* Logout */}
        <div style={{ padding: '12px', borderTop: '1px solid hsl(240,16%,18%)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10, border: 'none',
              background: 'transparent', cursor: 'pointer',
              color: 'hsl(215,16%,70%)', fontSize: 14, fontWeight: 500,
            }}
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* Desktop sidebar always visible */}
      <style>{`
        @media (min-width: 1024px) {
          .lg-sidebar { transform: translateX(0) !important; position: fixed !important; }
          .main-content { margin-left: 260px; }
        }
        @media (max-width: 1023px) {
          .main-content { margin-left: 0; }
        }
      `}</style>

      {/* Main content */}
      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top bar */}
        <header style={{
          height: 60, background: 'hsl(240,26%,8%)',
          borderBottom: '1px solid hsl(240,16%,18%)',
          display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 16,
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(215,16%,70%)', padding: 4 }}
            className="lg-hidden"
          >
            <Menu size={22} />
          </button>
          <style>{`.lg-hidden { display: flex; } @media (min-width: 1024px) { .lg-hidden { display: none; } }`}</style>

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'hsl(214,100%,60%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff'
            }}>
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ display: 'none' }} className="sm-show">
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f3f5ff' }}>{user?.full_name || 'Utilizador'}</div>
              <div style={{ fontSize: 11, color: 'hsl(215,16%,70%)' }}>{user?.email}</div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '24px 24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
