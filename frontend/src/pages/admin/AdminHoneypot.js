import React, { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, RefreshCw, Globe, Clock, Terminal, Wifi } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const PATH_RISK = {
  '/phpmyadmin':  { level: 'Crítico', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  '/wp-admin':    { level: 'Alto',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  '/.env':        { level: 'Crítico', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  '/backup.sql':  { level: 'Alto',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  '/api/config':  { level: 'Médio',   color: '#FFBE0B', bg: 'rgba(255,190,11,0.12)' },
  '/admin-panel': { level: 'Alto',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  '/admin':       { level: 'Alto',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  '/administrator':{ level:'Alto',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
};

function getRisk(path) {
  if (!path) return { level: 'Baixo', color: '#3A86FF', bg: 'rgba(58,134,255,0.08)' };
  const pl = path.toLowerCase();
  for (const [k, v] of Object.entries(PATH_RISK)) {
    if (pl.includes(k.toLowerCase())) return v;
  }
  if (pl.includes('.env') || pl.includes('.git') || pl.includes('passwd')) {
    return { level: 'Crítico', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' };
  }
  if (pl.includes('sql') || pl.includes('backup') || pl.includes('dump')) {
    return { level: 'Alto', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
  }
  if (pl.includes('wp-') || pl.includes('phpmyadmin') || pl.includes('shell')) {
    return { level: 'Alto', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
  }
  return { level: 'Baixo', color: '#3A86FF', bg: 'rgba(58,134,255,0.08)' };
}

const SOURCE_LABELS = {
  'frontend_404': { label: 'Página 404',  color: '#FFBE0B' },
  'middleware':   { label: 'Middleware',  color: '#a855f7' },
  '404_handler':  { label: 'Handler 404', color: '#f97316' },
};

export default function AdminHoneypot() {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchLogs = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    try {
      const r = await fetch(`${BACKEND_URL}/api/admin/honeypot-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const data = await r.json();
        setLogs(Array.isArray(data) ? data : []);
        setLastUpdated(new Date());
      }
    } catch (_) {}
    setLoading(false);
  }, []);

  // Carregar na montagem + polling a cada 10s
  useEffect(() => {
    fetchLogs();
    const iv = setInterval(fetchLogs, 10000);
    return () => clearInterval(iv);
  }, [fetchLogs]);

  const byPath = logs.reduce((acc, l) => { acc[l.path] = (acc[l.path] || 0) + 1; return acc; }, {});
  const byIP   = logs.reduce((acc, l) => { acc[l.ip]   = (acc[l.ip]   || 0) + 1; return acc; }, {});
  const topPath = Object.keys(byPath).sort((a, b) => byPath[b] - byPath[a])[0] || '—';
  const criticalCount = logs.filter(l => getRisk(l.path).level === 'Crítico').length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff', margin: 0 }}>
            Honeypot — Log de Intrusões
          </h1>
          <p style={{ fontSize: 13, color: '#7a8299', margin: '4px 0 0' }}>
            {logs.length} tentativas registadas
            {lastUpdated && (
              <span style={{ marginLeft: 8, color: '#3a3d5a' }}>
                · Actualizado: {lastUpdated.toLocaleTimeString('pt-PT')}
              </span>
            )}
          </p>
        </div>
        <button
          data-testid="honeypot-refresh-btn"
          onClick={() => { setLoading(true); fetchLogs(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(58,134,255,0.1)', border: '1px solid rgba(58,134,255,0.25)', borderRadius: 9, color: '#3A86FF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          <RefreshCw size={13} style={loading ? { animation: 'spin .8s linear infinite' } : {}} />
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { icon: Shield,        color: '#ef4444', label: 'Total Tentativas',   value: logs.length },
          { icon: AlertTriangle, color: '#a855f7', label: 'Nível Crítico',       value: criticalCount },
          { icon: Globe,         color: '#FFBE0B', label: 'IPs Únicos',          value: Object.keys(byIP).length },
          { icon: Terminal,      color: '#22c58b', label: 'Rota + Atacada',      value: topPath.length > 20 ? topPath.slice(0,18)+'…' : topPath },
        ].map(({ icon: Icon, color, label, value }) => (
          <div key={label} style={{ background: '#111118', border: `1px solid ${color}20`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: `${color}15`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#7a8299', marginBottom: 2 }}>{label}</div>
              <div className="numeric" style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'var(--font-heading)' }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela */}
      {loading && logs.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#4a5068' }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(58,134,255,0.15)', borderTopColor: '#3A86FF', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 13, margin: 0 }}>A carregar registos…</p>
        </div>
      ) : logs.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#4a5068' }}>
          <Shield size={32} style={{ opacity: 0.2, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, margin: '0 0 8px', fontWeight: 600 }}>Nenhuma tentativa registada ainda</p>
          <p style={{ fontSize: 12, color: '#26263a', margin: 0 }}>Quando alguém aceder a uma rota suspeita, aparecerá aqui</p>
        </div>
      ) : (
        <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d0d1a' }}>
                  {['Data/Hora', 'Rota Acedida', 'Nível', 'Origem', 'IP', 'User-Agent'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const risk = getRisk(log.path);
                  const src  = SOURCE_LABELS[log.source] || { label: 'Backend', color: '#7a8299' };
                  return (
                    <tr key={i} style={{ borderTop: '1px solid #1a1a2a', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#7a8299' }}>
                          <Clock size={10} />
                          {log.ts ? new Date(log.ts).toLocaleString('pt-PT', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' }) : '—'}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <code style={{ fontSize: 12, color: risk.color, background: risk.bg, padding: '2px 8px', borderRadius: 5, fontFamily: 'monospace', display: 'inline-block', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={`${log.method || 'GET'} ${log.path}`}>
                          {log.method || 'GET'} {log.path}
                        </code>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, background: risk.bg, color: risk.color, border: `1px solid ${risk.color}30`, fontWeight: 800 }}>
                          {risk.level}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: `${src.color}15`, color: src.color, fontWeight: 700 }}>
                          {src.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Wifi size={10} color="#4a5068" />
                          <span style={{ fontSize: 12, color: '#e8eaf6', fontFamily: 'monospace' }}>{log.ip || '—'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', maxWidth: 200 }}>
                        <span style={{ fontSize: 10, color: '#4a5068', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={log.user_agent}>
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

      {/* Rotas activas */}
      <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(58,134,255,0.06)', border: '1px solid rgba(58,134,255,0.15)', borderRadius: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#3A86FF', marginBottom: 10 }}>Rotas Honeypot Activas + Captura Automática de 404 Suspeitos</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['/.env', '/config.json', '/.git/config', '/wp-admin', '/wp-login.php',
            '/phpmyadmin', '/admin', '/administrator', '/panel', '/backup.sql',
            '/database.sql', '/dump.sql', '/api/v1/config', '/api/config',
            '+ qualquer 404 suspeito detectado pelo React'].map(r => (
            <code key={r} style={{ fontSize: 10, padding: '3px 8px', background: r.startsWith('+') ? 'rgba(34,197,139,0.12)' : 'rgba(58,134,255,0.1)', borderRadius: 5, color: r.startsWith('+') ? '#22c58b' : '#7a8299', fontFamily: 'monospace', border: r.startsWith('+') ? '1px solid rgba(34,197,139,0.25)' : 'none' }}>{r}</code>
          ))}
        </div>
      </div>
    </div>
  );
}
