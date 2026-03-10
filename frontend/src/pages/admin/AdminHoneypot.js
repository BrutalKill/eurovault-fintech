import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, RefreshCw, Globe, Clock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const PATH_RISK = {
  '/phpmyadmin': { level: 'Alto',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  '/wp-admin':   { level: 'Alto',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  '/.env':       { level: 'Crítico',color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  '/backup.sql': { level: 'Alto',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  '/api/config': { level: 'Médio',  color: '#FFBE0B', bg: 'rgba(255,190,11,0.12)' },
  '/admin-panel':{ level: 'Alto',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
};

export default function AdminHoneypot() {
  const [logs, setLogs]     = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const r = await fetch(`${BACKEND_URL}/api/admin/honeypot-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) setLogs(await r.json());
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); const iv = setInterval(fetchLogs, 10000); return () => clearInterval(iv); }, []);

  const byPath = logs.reduce((acc, l) => { acc[l.path] = (acc[l.path] || 0) + 1; return acc; }, {});
  const byIP   = logs.reduce((acc, l) => { acc[l.ip]   = (acc[l.ip]   || 0) + 1; return acc; }, {});

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff', margin: 0 }}>
            Honeypot — Log de Intrusões
          </h1>
          <p style={{ fontSize: 13, color: '#7a8299', margin: '4px 0 0' }}>
            Tentativas de acesso a rotas falsas · {logs.length} entradas registadas
          </p>
        </div>
        <button onClick={fetchLogs}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(58,134,255,0.1)', border: '1px solid rgba(58,134,255,0.25)', borderRadius: 9, color: '#3A86FF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          <RefreshCw size={13} />Actualizar
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { icon: Shield,       color: '#ef4444', label: 'Total Tentativas', value: logs.length },
          { icon: Globe,        color: '#FFBE0B', label: 'IPs Únicos',        value: Object.keys(byIP).length },
          { icon: AlertTriangle,color: '#a855f7', label: 'Rota Mais Atacada', value: Object.keys(byPath).sort((a,b) => byPath[b]-byPath[a])[0] || '—' },
        ].map(({ icon: Icon, color, label, value }) => (
          <div key={label} style={{ background: '#111118', border: `1px solid ${color}20`, borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: `${color}15`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#7a8299' }}>{label}</div>
              <div className="numeric" style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'var(--font-heading)' }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#4a5068' }}>A carregar…</div>
      ) : logs.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#4a5068' }}>
          <Shield size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
          <p style={{ fontSize: 13, margin: 0 }}>Nenhuma tentativa registada ainda</p>
          <p style={{ fontSize: 11, color: '#26263a', marginTop: 6 }}>As tentativas aparecerão aqui em tempo real</p>
        </div>
      ) : (
        <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d0d1a' }}>
                  {['Data/Hora', 'Rota Acedida', 'Nível', 'IP', 'User-Agent'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...logs].reverse().map((log, i) => {
                  const risk = PATH_RISK[log.path] || { level: 'Baixo', color: '#3A86FF', bg: 'rgba(58,134,255,0.08)' };
                  return (
                    <tr key={i} style={{ borderTop: '1px solid #1a1a2a' }}>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#7a8299' }}>
                          <Clock size={11} />
                          {log.ts ? new Date(log.ts).toLocaleString('pt-PT', { day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit' }) : '—'}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <code style={{ fontSize: 12, color: risk.color, background: risk.bg, padding: '2px 8px', borderRadius: 5, fontFamily: 'monospace' }}>
                          {log.method} {log.path}
                        </code>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, background: risk.bg, color: risk.color, border: `1px solid ${risk.color}30`, fontWeight: 800 }}>
                          {risk.level}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 12, color: '#e8eaf6', fontFamily: 'monospace' }}>{log.ip || '—'}</span>
                      </td>
                      <td style={{ padding: '10px 14px', maxWidth: 220 }}>
                        <span style={{ fontSize: 10, color: '#4a5068', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.user_agent || '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info para o formador */}
      <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(58,134,255,0.06)', border: '1px solid rgba(58,134,255,0.15)', borderRadius: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#3A86FF', marginBottom: 8 }}>📚 Rotas Honeypot Activas</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['/.env', '/config.json', '/.git/config', '/wp-admin', '/wp-login.php', '/phpmyadmin',
            '/admin', '/administrator', '/panel', '/backup.sql', '/database.sql',
            '/api/v1/config', '/api/config'].map(r => (
            <code key={r} style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(58,134,255,0.1)', borderRadius: 5, color: '#7a8299', fontFamily: 'monospace' }}>{r}</code>
          ))}
        </div>
      </div>
    </div>
  );
}
