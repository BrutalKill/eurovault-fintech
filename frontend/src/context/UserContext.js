import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
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
      const data = await res.json();
      // Garantir que profit nunca é negativo no frontend
      data.profit = Math.max(0, parseFloat(data.profit) || 0);
      data.balance = Math.max(0, parseFloat(data.balance) || 0);

      // Notificação push quando saldo ou lucro sobe
      setUser(prev => {
        if (prev && Notification.permission === 'granted') {
          const fmtEur = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);
          if (data.balance - prev.balance > 0.01)
            new Notification('Saldo actualizado', { body: `+${fmtEur(data.balance - prev.balance)} na sua conta`, icon: '/logo-eurovault.png' });
          if (data.profit - prev.profit > 0.01)
            new Notification('Lucro actualizado', { body: `Novo lucro: ${fmtEur(data.profit)}`, icon: '/logo-eurovault.png' });
        }
        return data;
      });
    } catch (e) {}
  }, []);

  // Polling automático a cada 15 segundos para sincronizar com o painel ADM
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetchUser(); // Chamada inicial

    const interval = setInterval(fetchUser, 15000);

    // Sincronizar ao voltar ao separador
    const onFocus = () => fetchUser();
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onFocus);
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
