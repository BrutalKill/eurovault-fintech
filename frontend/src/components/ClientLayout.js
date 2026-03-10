import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { BarChart2, CreditCard, ArrowDownToLine, Newspaper, User, Clock, LogOut, Menu, Home, ShieldCheck, TrendingUp as TrendLine } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useLang } from '../context/LangContext';
import { useCountUp } from '../hooks/useCountUp';
import Footer from './Footer';
import FloatingChat from './FloatingChat';
import LangSwitcher from './LangSwitcher';
import NotificationBell from './NotificationBell';

export default function ClientLayout() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { t } = useLang();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: '/app/dashboard',        icon: Home,      label: 'Dashboard'            },
    { to: '/app/trade',            icon: BarChart2, label: t('nav_trade')          },
    { to: '/app/deposit',          icon: CreditCard,label: t('nav_deposit')        },
    { to: '/app/withdrawal',       icon: ArrowDownToLine, label: t('nav_withdrawal') },
    { to: '/app/history',          icon: Clock,     label: t('nav_history')        },
    { to: '/app/balance-history',  icon: TrendLine, label: 'Evolução'              },
    { to: '/app/news',             icon: Newspaper, label: t('nav_news')           },
    { to: '/app/profile',          icon: User,      label: t('nav_profile')        },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const safeBalance = Math.max(0, parseFloat(user?.balance) || 0);
  const safeProfit  = Math.max(0, parseFloat(user?.profit)  || 0);
  const formatEur   = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);
  const isVerified  = user?.kyc_status === 'approved';

  // Animação counter para saldo e lucro
  const animBalance = useCountUp(safeBalance);
  const animProfit  = useCountUp(safeProfit);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'hsl(240,33%,5%)' }}>

      {/* Overlay móvel */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 260, background: 'hsl(240,26%,8%)',
        borderRight: '1px solid hsl(240,16%,18%)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 50,
        transition: 'transform 0.3s ease',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
      }} className="lg-sidebar">

        {/* Logo */}
        <div style={{ padding: '20px', borderBottom: '1px solid hsl(240,16%,18%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo-eurovault.png" alt="EuroVault Investments"
              style={{ width: 54, height: 54, objectFit: 'contain' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: '#f3f5ff' }}>EuroVault</div>
              <div style={{ fontSize: 11, color: 'hsl(46,100%,52%)' }}>Investments</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10,
                textDecoration: 'none', fontSize: 14, fontWeight: 500,
                color: isActive ? '#f3f5ff' : 'hsl(215,16%,70%)',
                background: isActive ? 'rgba(58,134,255,0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(58,134,255,0.25)' : '1px solid transparent',
                transition: 'background 0.2s, color 0.2s',
              })}>
              <Icon size={18} />{label}
            </NavLink>
          ))}
        </nav>

        {/* Cartão de saldo */}
        <div style={{ margin: '0 12px 12px', padding: '16px', background: 'hsl(240,18%,14%)', borderRadius: 12, border: '1px solid hsl(240,16%,18%)' }}>
          <div style={{ fontSize: 11, color: 'hsl(215,16%,70%)', marginBottom: 4 }}>{t('nav_total_balance')}</div>
          <div className="numeric" style={{ fontSize: 22, fontWeight: 700, color: '#f3f5ff', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
            {formatEur(animBalance)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 11, color: 'hsl(215,16%,70%)' }}>{t('nav_profit')}:</span>
            <span className="numeric" style={{ fontSize: 13, fontWeight: 600, color: 'hsl(155,72%,45%)' }}>
              +{formatEur(animProfit)}
            </span>
          </div>
          {isVerified && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, padding: '4px 8px', background: 'rgba(34,197,139,0.1)', border: '1px solid rgba(34,197,139,0.25)', borderRadius: 6 }}>
              <ShieldCheck size={11} color="#22c58b" />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#22c58b', letterSpacing: '0.04em' }}>IDENTIDADE VERIFICADA</span>
            </div>
          )}
        </div>

        {/* Sair */}
        <div style={{ padding: '12px', borderTop: '1px solid hsl(240,16%,18%)' }}>
          <button onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: 'hsl(215,16%,70%)', fontSize: 14, fontWeight: 500 }}>
            <LogOut size={16} />{t('nav_logout')}
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Topbar */}
        <header style={{
          height: 60, background: 'hsl(240,26%,8%)',
          borderBottom: '1px solid hsl(240,16%,18%)',
          display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12,
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg-hidden"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(215,16%,70%)', padding: 4 }}>
            <Menu size={22} />
          </button>
          <div style={{ flex: 1 }} />

          {/* Saldo no topbar */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ background: 'hsl(240,18%,14%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 9, padding: '5px 12px', textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'hsl(215,16%,60%)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('nav_balance')}</div>
              <div className="numeric" style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>{formatEur(animBalance)}</div>
            </div>
            <div style={{ background: 'hsl(240,18%,14%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 9, padding: '5px 12px', textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'hsl(215,16%,60%)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('nav_profit')}</div>
              <div className="numeric" style={{ fontSize: 13, fontWeight: 700, color: 'hsl(155,72%,45%)' }}>+{formatEur(animProfit)}</div>
            </div>
          </div>

          {/* Seletor de idioma */}
          <LangSwitcher />

          {/* Notificações */}
          <NotificationBell />

          {/* Avatar + badge verificado */}
          <div style={{ position: 'relative' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: isVerified ? 'linear-gradient(135deg,#22c58b,#3A86FF)' : 'hsl(214,100%,60%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            {isVerified && (
              <div title="Identidade Verificada" style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, background: '#22c58b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid hsl(240,26%,8%)' }}>
                <ShieldCheck size={8} color="#fff" />
              </div>
            )}
          </div>
        </header>

        {/* Página */}
        <main style={{ flex: 1, padding: '24px' }}>
          <Outlet />
        </main>

        {/* Rodapé */}
        <Footer />

        {/* Chat de suporte flutuante */}
        <FloatingChat />
      </div>
    </div>
  );
}
