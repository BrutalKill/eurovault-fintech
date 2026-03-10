import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, TrendingUp, CreditCard, User, Newspaper } from 'lucide-react';
import { useLang } from '../context/LangContext';

const ITEMS = [
  { to: '/app/dashboard',  icon: Home,       labelKey: 'Dashboard' },
  { to: '/app/trade',      icon: TrendingUp, labelKey: 'trade_buy' },
  { to: '/app/deposit',    icon: CreditCard, labelKey: 'nav_deposit' },
  { to: '/app/news',       icon: Newspaper,  labelKey: 'nav_news' },
  { to: '/app/profile',    icon: User,       labelKey: 'nav_profile' },
];

export default function MobileBottomNav() {
  const { t } = useLang();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'hsl(240,26%,8%)',
      borderTop: '1px solid hsl(240,16%,18%)',
      display: 'flex', alignItems: 'stretch',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }} className="mobile-bottom-nav">
      {ITEMS.map(({ to, icon: Icon, labelKey }) => (
        <NavLink key={to} to={to}
          style={({ isActive }) => ({
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 3, padding: '8px 4px',
            textDecoration: 'none',
            color: isActive ? '#3A86FF' : 'hsl(215,16%,50%)',
            background: isActive ? 'rgba(58,134,255,0.08)' : 'transparent',
            borderTop: isActive ? '2px solid #3A86FF' : '2px solid transparent',
            transition: 'color 0.15s',
            fontSize: 9,
            fontWeight: isActive ? 700 : 500,
          })}>
          <Icon size={20} />
          <span style={{ letterSpacing: '0.02em' }}>
            {labelKey === 'Dashboard' ? 'Home'
              : labelKey === 'trade_buy' ? 'Trade'
              : t(labelKey)}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
