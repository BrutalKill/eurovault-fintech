import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const fetchingRef = useRef(false); // evita chamadas concorrentes

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (fetchingRef.current) return; // já está a ir buscar — ignorar
    fetchingRef.current = true;
    try {
      const res = await fetch(`${BACKEND_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          setUser(null);
        }
        return;
      }
      // Ler o body UMA única vez
      let data;
      try { data = await res.json(); } catch (_) { return; }

      data.profit  = Math.max(0, parseFloat(data.profit)  || 0);
      data.balance = Math.max(0, parseFloat(data.balance) || 0);

      setUser(prev => {
        if (prev && Notification.permission === 'granted') {
          const fmtEur = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);
          if (data.balance - prev.balance > 0.01)
            new Notification('Saldo actualizado', { body: `+${fmtEur(data.balance - prev.balance)} na sua conta`, icon: '/logo-eurovault.png' });
        }
        return data;
      });
    } catch (_) {}
    finally { fetchingRef.current = false; }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetchUser();
    const interval = setInterval(fetchUser, 20000); // 20s (menos agressivo)
    const onVisible = () => { if (document.visibilityState === 'visible') fetchUser(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchUser]);

  return (
    <UserContext.Provider value={{ user, setUser, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
};
