import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Página de acesso directo via token de impersonation.
 * URL: /access/:token
 * O admin gera este link e partilha com o cliente ou usa para fazer login como ele.
 */
export default function AccessPage() {
  const { token } = useParams();
  const { setUser } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) { navigate('/login'); return; }

    // Validar o token chamando /api/me com ele
    fetch(`${BACKEND_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error('Token inválido ou expirado');
        return r.json();
      })
      .then(user => {
        localStorage.setItem('token', token);
        setUser(user);
        navigate('/app/trade', { replace: true });
      })
      .catch(() => {
        navigate('/login', { replace: true });
      });
  }, [token, navigate, setUser]);

  return (
    <div style={{
      minHeight: '100vh', background: 'hsl(240,33%,5%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, border: '3px solid #3A86FF',
        borderTopColor: 'transparent', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#7a8299', fontSize: 14 }}>A autenticar acesso directo…</p>
    </div>
  );
}
