import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const UserContext  = createContext(null);

// ── Traduções inline para notificações push ───────────────────────────────────
const NOTIF_STRINGS = {
  pt: {
    balance_title: 'Saldo Actualizado', balance_body: 'O seu saldo subiu', new_balance: 'Novo saldo:',
    wd_title: 'Levantamento Processado', wd_body: 'foram transferidos. Saldo actual:',
    profit_title: 'Lucro Actualizado', profit_body: 'de rendimento acumulado. Total:',
    kyc_ok_title: 'Identidade Verificada!', kyc_ok_body: 'A sua conta foi verificada com sucesso.',
    kyc_rej_title: 'Verificação Rejeitada', kyc_rej_body: 'O documento KYC foi rejeitado.',
  },
  en: {
    balance_title: 'Balance Updated', balance_body: 'Your balance increased by', new_balance: 'New balance:',
    wd_title: 'Withdrawal Processed', wd_body: 'were transferred. Current balance:',
    profit_title: 'Profit Updated', profit_body: 'accumulated return. Total:',
    kyc_ok_title: 'Identity Verified!', kyc_ok_body: 'Your account has been verified.',
    kyc_rej_title: 'Verification Rejected', kyc_rej_body: 'KYC document rejected. Please resubmit.',
  },
  es: {
    balance_title: 'Saldo Actualizado', balance_body: 'Su saldo subió', new_balance: 'Nuevo saldo:',
    wd_title: 'Retiro Procesado', wd_body: 'fueron transferidos. Saldo actual:',
    profit_title: 'Beneficio Actualizado', profit_body: 'rendimiento acumulado. Total:',
    kyc_ok_title: '¡Identidad Verificada!', kyc_ok_body: 'Su cuenta ha sido verificada.',
    kyc_rej_title: 'Verificación Rechazada', kyc_rej_body: 'Documento KYC rechazado.',
  },
};
const getN = (key) => {
  const lang = localStorage.getItem('ev_lang') || 'pt';
  return (NOTIF_STRINGS[lang] || NOTIF_STRINGS['pt'])[key] || NOTIF_STRINGS['pt'][key] || '';
};

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
      pushNotif(getN('balance_title'), `${getN('balance_body')} ${fmtEur(balanceDiff)}. ${getN('new_balance')} ${fmtEur(next.balance)}`, 'balance-up');
    }
    // 2. Saldo desceu (levantamento aprovado)
    if (balanceDiff < -0.5) {
      pushNotif(getN('wd_title'), `${fmtEur(Math.abs(balanceDiff))} ${getN('wd_body')} ${fmtEur(next.balance)}`, 'balance-down');
    }
    // 3. Lucro subiu
    const profitDiff = next.profit - prev.profit;
    if (profitDiff > 0.01) {
      pushNotif(getN('profit_title'), `+${fmtEur(profitDiff)} ${getN('profit_body')} ${fmtEur(next.profit)}`, 'profit-up');
    }
    // 4. KYC aprovado
    if (prev.kyc_status !== 'approved' && next.kyc_status === 'approved') {
      pushNotif(getN('kyc_ok_title'), getN('kyc_ok_body'), 'kyc-approved');
    }
    // 5. KYC rejeitado
    if (prev.kyc_status !== 'rejected' && next.kyc_status === 'rejected') {
      pushNotif(getN('kyc_rej_title'), getN('kyc_rej_body'), 'kyc-rejected');
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
