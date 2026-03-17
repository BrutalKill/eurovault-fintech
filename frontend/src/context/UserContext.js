import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const UserContext  = createContext(null);

// ── Disparar notificação com logo e som ───────────────────────────────────────
function pushNotif(title, body, tag = '') {
  if (Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, {
      body,
      icon: '/logo-eurovault.png',
      badge: '/logo-eurovault.png',
      tag: tag || title,
      renotify: true,
    });
    n.onclick = () => { window.focus(); n.close(); };
    // Auto-fechar após 8s
    setTimeout(() => n.close(), 8000);
  } catch (_) {}
}

const fmtEur = (v) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);

export function UserProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const fetchingRef = useRef(false);
  const prevRef     = useRef(null); // snapshot anterior para comparação

  // ── Pedir permissão de notificações ───────────────────────────────────────
  const requestNotifPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    return result;
  }, []);

  // ── Comparar estados e disparar notificações ──────────────────────────────
  const triggerNotifications = useCallback((prev, next) => {
    if (!prev || Notification.permission !== 'granted') return;

    // 1. Saldo subiu
    const balanceDiff = next.balance - prev.balance;
    if (balanceDiff > 0.5) {
      pushNotif(
        'Saldo Actualizado',
        `O seu saldo subiu ${fmtEur(balanceDiff)}. Novo saldo: ${fmtEur(next.balance)}`,
        'balance-up'
      );
    }

    // 2. Saldo desceu (levantamento aprovado)
    if (balanceDiff < -0.5) {
      pushNotif(
        'Levantamento Processado',
        `${fmtEur(Math.abs(balanceDiff))} foram transferidos. Saldo actual: ${fmtEur(next.balance)}`,
        'balance-down'
      );
    }

    // 3. Lucro subiu
    const profitDiff = next.profit - prev.profit;
    if (profitDiff > 0.01) {
      pushNotif(
        'Lucro Actualizado',
        `+${fmtEur(profitDiff)} de rendimento acumulado. Total: ${fmtEur(next.profit)}`,
        'profit-up'
      );
    }

    // 4. KYC aprovado
    if (prev.kyc_status !== 'approved' && next.kyc_status === 'approved') {
      pushNotif(
        'Identidade Verificada!',
        'A sua conta foi verificada com sucesso. Acesso completo desbloqueado.',
        'kyc-approved'
      );
    }

    // 5. KYC rejeitado
    if (prev.kyc_status !== 'rejected' && next.kyc_status === 'rejected') {
      pushNotif(
        'Verificação Rejeitada',
        'O documento KYC foi rejeitado. Por favor envie novamente no perfil.',
        'kyc-rejected'
      );
    }
  }, []);

  const fetchUser = useCallback(async () => {
    const tok = localStorage.getItem('token');
    if (!tok) return;
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const res = await fetch(`${BACKEND_URL}/api/me`, {
        headers: { Authorization: `Bearer ${tok}` }
      });
      if (!res.ok) {
        if (res.status === 401) { localStorage.removeItem('token'); setUser(null); }
        return;
      }
      let data;
      try { data = await res.json(); } catch (_) { return; }

      data.profit  = Math.max(0, parseFloat(data.profit)  || 0);
      data.balance = Math.max(0, parseFloat(data.balance) || 0);

      // Disparar notificações baseadas em diferenças
      if (prevRef.current) {
        triggerNotifications(prevRef.current, data);
      }
      prevRef.current = data;

      setUser(data);
    } catch (_) {}
    finally { fetchingRef.current = false; }
  }, [triggerNotifications]);

  useEffect(() => {
    const tok = localStorage.getItem('token');
    if (!tok) return;
    fetchUser();
    const interval = setInterval(fetchUser, 15000); // 15s
    const onVisible = () => { if (document.visibilityState === 'visible') fetchUser(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchUser]);

  return (
    <UserContext.Provider value={{ user, setUser, fetchUser, notifPermission, requestNotifPermission }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
};
