import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield, AlertTriangle, RefreshCw, Globe, Clock, Terminal, Wifi,
  Zap, Activity, Ban, ShieldCheck, ShieldAlert, Eye, CheckCircle, X, UserCheck
} from 'lucide-react';
import { useLang } from '../../context/LangContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

function getAttackLabel(path) {
  if (!path) return 'Unknown Probe';
  const pl = path.toLowerCase();
  const map = {
    '.env': 'Environment File Exposure', 'phpmyadmin': 'phpMyAdmin Probe',
    'wp-admin': 'WordPress Admin Brute Force', 'wp-login': 'WordPress Login Attack',
    'backup.sql': 'Database Backup Exposure', 'database.sql': 'SQL Database Access',
    'shell': 'Remote Shell Upload', '.git': 'Git Repository Leak',
    'passwd': 'LFI — System File Access', 'xmlrpc': 'XML-RPC Exploit',
    'config.php': 'Config File Exposure', 'sqlmap': 'SQL Injection Probe',
    'eval': 'Remote Code Execution', 'proc/self': 'Process Enumeration',
    'admin': 'Admin Panel Scan', 'dump.sql': 'SQL Dump Exposure',
  };
  for (const [k, v] of Object.entries(map)) { if (pl.includes(k)) return v; }
  return 'Suspicious Access';
}

function getRisk(path) {
  if (!path) return { key: 'low', color: '#3A86FF', bg: 'rgba(58,134,255,0.08)', border: 'rgba(58,134,255,0.2)' };
  const pl = path.toLowerCase();
  const critical = ['.env', '.git', 'passwd', 'proc/self', 'phpmyadmin'];
  const high     = ['wp-admin', 'wp-login', 'backup.sql', 'database.sql', 'dump.sql', 'shell'];
  if (critical.some(p => pl.includes(p))) return { key: 'critical', color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)' };
  if (high.some(p => pl.includes(p)))     return { key: 'high',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)'   };
  if (['config', 'xmlrpc', '.htaccess'].some(p => pl.includes(p))) return { key: 'medium', color: '#FFBE0B', bg: 'rgba(255,190,11,0.12)', border: 'rgba(255,190,11,0.3)' };
  return { key: 'low', color: '#3A86FF', bg: 'rgba(58,134,255,0.08)', border: 'rgba(58,134,255,0.2)' };
}

function getMitigation(path) {
  const r = getRisk(path);
  const map = {
    critical: { label: 'IP PERMANENTLY BANNED',  color: '#a855f7', bg: 'rgba(168,85,247,0.15)', icon: Ban        },
    high:     { label: 'IP RATE LIMITED',        color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: ShieldAlert },
    medium:   { label: 'REQUEST BLOCKED',        color: '#FFBE0B', bg: 'rgba(255,190,11,0.1)',  icon: ShieldCheck },
    low:      { label: 'LOGGED',                 color: '#3A86FF', bg: 'rgba(58,134,255,0.08)', icon: Eye         },
  };
  return map[r.key];
}

const RISK_LEVELS = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };

export default function AdminHoneypot() {
  const { t } = useLang();
  const prevCriticalRef = useRef(0);
  const [criticalPulse, setCriticalPulse] = useState(false);
  const [tab, setTab] = useState('logs'); // logs | whitelist | banlist

  const [logs, setLogs]           = useState([]);
  const [whitelist, setWhitelist] = useState([]);
  const [banlist, setBanlist]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stressTesting, setStressTesting] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [logsRes, wlRes, blRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/honeypot-logs`,         { headers: authH() }),
        fetch(`${BACKEND_URL}/api/admin/security/whitelist`,    { headers: authH() }),
        fetch(`${BACKEND_URL}/api/admin/security/banlist`,      { headers: authH() }),
      ]);
      if (logsRes.ok) setLogs(await logsRes.json());
      if (wlRes.ok)   setWhitelist(await wlRes.json());
      if (blRes.ok)   setBanlist(await blRes.json());
      setLastUpdated(new Date());
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const currentCritical = logs.filter(l => getRisk(l.path).key === 'critical').length;
    if (currentCritical > prevCriticalRef.current && prevCriticalRef.current > 0) {
      setCriticalPulse(true);
      setTimeout(() => setCriticalPulse(false), 3000);
    }
    prevCriticalRef.current = currentCritical;
  }, [logs]);

  useEffect(() => { fetchAll(); const iv = setInterval(fetchAll, 10000); return () => clearInterval(iv); }, [fetchAll]);

  const unbanIP = async (ip) => {
    try {
      await fetch(`${BACKEND_URL}/api/admin/security/banlist/${encodeURIComponent(ip)}`, { method: 'DELETE', headers: authH() });
      setBanlist(prev => prev.filter(e => e.ip !== ip));
      toast.success(`IP ${ip} removed from ban list`);
    } catch (_) { toast.error('Failed to unban IP'); }
  };

  const ATTACK_TOASTS = [
    { label: 'SQL Injection',          path: '/database.sql'    },
    { label: 'Environment Exposure',   path: '/.env'            },
    { label: 'WordPress Brute Force',  path: '/wp-admin'        },
    { label: 'phpMyAdmin Probe',       path: '/phpmyadmin'      },
    { label: 'Git Repository Leak',    path: '/.git/config'     },
    { label: 'Shell Upload Attempt',   path: '/shell.php'       },
    { label: 'Database Dump Access',   path: '/backup.sql'      },
    { label: 'LFI Attack',             path: '/etc/passwd'      },
    { label: 'XML-RPC Exploit',        path: '/xmlrpc.php'      },
    { label: 'WordPress Login Attack', path: '/wp-login.php'    },
  ];

  const runStressTest = async () => {
    setStressTesting(true);
    const FAKE_IPS = ['185.220.101.47','194.165.16.11','45.142.212.55','162.247.74.27','198.54.117.200'];
    try {
      const r = await fetch(`${BACKEND_URL}/api/admin/security/stress-test`, { method: 'POST', headers: authH() });
      const data = await r.json();
      if (r.ok) {
        // Toasts sequenciais — máx 5 para evitar black screen
        ATTACK_TOASTS.slice(0, 5).forEach((attack, i) => {
          setTimeout(() => {
            const ip = FAKE_IPS[i % FAKE_IPS.length];
            const risk = getRisk(attack.path);
            const mit  = getMitigation(attack.path);
            const fn   = risk.key === 'critical' ? toast.error : risk.key === 'high' ? toast.warning : toast.info;
            fn(`${attack.label} from ${ip}`, {
              description: `${attack.path} → ${mit.label}`,
              duration: 4000,
            });
          }, i * 700);
        });
        setTimeout(() => {
          toast.success(`Stress test complete — ${data.attacks_simulated} vectors`, { duration: 5000 });
          fetchAll();
        }, ATTACK_TOASTS.slice(0,5).length * 700 + 800);
      }
    } catch (_) { toast.error('Stress test failed'); }
    setTimeout(() => setStressTesting(false), ATTACK_TOASTS.slice(0,5).length * 700 + 600);
  };

  const byIP = logs.reduce((acc, l) => { acc[l.ip] = (acc[l.ip] || 0) + 1; return acc; }, {});
  const topPath = Object.keys(logs.reduce((acc, l) => { acc[l.path] = (acc[l.path] || 0) + 1; return acc; }, {})).sort((a, b) => (byIP[b] || 0) - (byIP[a] || 0))[0] || '—';
  const criticalCount = logs.filter(l => getRisk(l.path).key === 'critical').length;

  const TABS = [
    { id: 'logs',      label: 'Intrusion Logs',  count: logs.length      },
    { id: 'whitelist', label: 'IP Whitelist',     count: whitelist.length },
    { id: 'banlist',   label: 'Ban List',         count: banlist.length   },
  ];

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff', margin: 0 }}>
            {t('hpot_title')}
          </h1>
          <p style={{ fontSize: 13, color: '#7a8299', margin: '4px 0 0' }}>
            {logs.length} {t('hpot_subtitle')}
            {lastUpdated && <span style={{ marginLeft: 8, color: '#3a3d5a' }}>· {t('hpot_updated')} {lastUpdated.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={runStressTest} disabled={stressTesting}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: stressTesting ? 'rgba(239,68,68,0.08)' : 'linear-gradient(135deg,#7c1d1d,#ef4444)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 9, color: '#fff', fontSize: 12, fontWeight: 800, cursor: stressTesting ? 'not-allowed' : 'pointer', boxShadow: stressTesting ? 'none' : '0 4px 14px rgba(239,68,68,0.35)' }}>
            {stressTesting ? <><Activity size={13} style={{ animation: 'spin .6s linear infinite' }} />Running…</> : <><Zap size={13} />Run Stress Test</>}
          </button>
          <button onClick={fetchAll} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(58,134,255,0.1)', border: '1px solid rgba(58,134,255,0.25)', borderRadius: 9, color: '#3A86FF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <RefreshCw size={13} style={loading ? { animation: 'spin .8s linear infinite' } : {}} />{t('hpot_refresh')}
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
        {[
          { icon: Shield,        color: '#ef4444', label: t('hpot_total'),         value: logs.length,                  pulse: false         },
          { icon: AlertTriangle, color: '#a855f7', label: t('hpot_critical_stat'), value: criticalCount,                pulse: criticalPulse },
          { icon: Ban,           color: '#ef4444', label: 'IPs Banned',            value: banlist.length,               pulse: false         },
          { icon: UserCheck,     color: '#22c58b', label: 'IPs Whitelisted',       value: whitelist.length,             pulse: false         },
        ].map(({ icon: Icon, color, label, value, pulse }) => (
          <div key={label} style={{ background: '#111118', border: `1px solid ${pulse ? color + '60' : color + '20'}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, animation: pulse ? 'pulse-critical 0.8s ease-in-out infinite' : 'none', boxShadow: pulse ? `0 0 20px ${color}40` : 'none', transition: 'all .3s' }}>
            <div style={{ width: 34, height: 34, background: `${color}15`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={15} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 9, color: '#7a8299', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
              <div className="numeric" style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'var(--font-heading)' }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {TABS.map(({ id, label, count }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: tab === id ? 'hsl(214,100%,60%)' : 'transparent', color: tab === id ? '#fff' : '#7a8299', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 6 }}>
            {label}
            <span style={{ fontSize: 10, padding: '1px 6px', background: tab === id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)', borderRadius: 5, color: tab === id ? '#fff' : '#4a5068' }}>{count}</span>
          </button>
        ))}
      </div>

      {/* ── LOGS TAB ── */}
      {tab === 'logs' && (
        logs.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#4a5068' }}>
            <Shield size={32} style={{ opacity: .2, display: 'block', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, margin: '0 0 6px', fontWeight: 600 }}>{t('hpot_none')}</p>
            <p style={{ fontSize: 12, margin: 0 }}>{t('hpot_none_sub')}</p>
          </div>
        ) : (
          <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 920 }}>
                <thead>
                  <tr style={{ background: '#0d0d1a' }}>
                    {['Date/Time', 'Route', 'Attack Type', 'Level', 'Origin', 'IP', 'Mitigation'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => {
                    const risk = getRisk(log.path);
                    const mit  = getMitigation(log.path);
                    const MitIcon = mit.icon;
                    const srcColors = { frontend_404: '#FFBE0B', middleware: '#a855f7', '404_handler': '#f97316' };
                    const isBanned = banlist.some(b => b.ip === log.ip);
                    return (
                      <tr key={i} style={{ borderTop: '1px solid #1a1a2a', background: risk.key === 'critical' ? 'rgba(168,85,247,0.04)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding: '9px 14px', whiteSpace: 'nowrap', fontSize: 11, color: '#7a8299' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={9} />{log.ts ? new Date(log.ts).toLocaleString() : '—'}</div>
                        </td>
                        <td style={{ padding: '9px 14px' }}>
                          <code style={{ fontSize: 11, color: risk.color, background: risk.bg, padding: '2px 7px', borderRadius: 4, fontFamily: 'monospace', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }} title={log.path}>{log.method || 'GET'} {log.path}</code>
                        </td>
                        <td style={{ padding: '9px 14px', fontSize: 11, color: risk.color, fontWeight: 600, whiteSpace: 'nowrap' }}>{getAttackLabel(log.path)}</td>
                        <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`, fontWeight: 800 }}>{RISK_LEVELS[risk.key] || risk.key}</span>
                        </td>
                        <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: `${srcColors[log.source] || '#7a8299'}15`, color: srcColors[log.source] || '#7a8299', fontWeight: 700 }}>{log.source?.replace('_', ' ') || 'backend'}</span>
                        </td>
                        <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Wifi size={9} color="#4a5068" />
                            <span style={{ fontSize: 11, color: isBanned ? '#ef4444' : '#e8eaf6', fontFamily: 'monospace' }}>{log.ip || '—'}</span>
                            {isBanned && <span style={{ fontSize: 8, padding: '1px 5px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: 3, fontWeight: 800 }}>BANNED</span>}
                          </div>
                        </td>
                        <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', background: mit.bg, border: `1px solid ${mit.color}40`, borderRadius: 6, width: 'fit-content' }}>
                            <MitIcon size={10} color={mit.color} />
                            <span style={{ fontSize: 9, fontWeight: 800, color: mit.color, letterSpacing: '0.04em' }}>{mit.label}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── WHITELIST TAB ── */}
      {tab === 'whitelist' && (
        <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: 'rgba(34,197,139,0.06)', borderBottom: '1px solid rgba(34,197,139,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserCheck size={15} color="#22c58b" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#22c58b' }}>Admin IP Whitelist</div>
              <div style={{ fontSize: 11, color: '#5a6280' }}>IPs that logged in as admin — bypassed honeypot for 24h · auto-expire</div>
            </div>
          </div>
          {whitelist.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#4a5068' }}>
              <UserCheck size={28} style={{ opacity: .15, display: 'block', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, margin: 0 }}>No whitelisted IPs yet. Login to the admin panel to add your IP.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#0d0d1a' }}>
                {['IP Address', 'Added At', 'Expires In', 'Source'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {whitelist.map((e, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #1a1a2a' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <CheckCircle size={12} color="#22c58b" />
                        <span style={{ fontSize: 12, color: '#22c58b', fontFamily: 'monospace', fontWeight: 700 }}>{e.ip}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: '#7a8299' }}>{e.added_at ? new Date(e.added_at).toLocaleString() : '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: e.expires_in_hours < 2 ? '#FFBE0B' : '#22c58b' }}>
                        {e.expires_in_hours}h remaining
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: '#4a5068' }}>{e.source || 'admin_login'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── BAN LIST TAB ── */}
      {tab === 'banlist' && (
        <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.06)', borderBottom: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Ban size={15} color="#ef4444" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>Permanent Ban List</div>
              <div style={{ fontSize: 11, color: '#5a6280' }}>IPs blocked automatically on Critical attacks — all requests return 403</div>
            </div>
          </div>
          {banlist.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#4a5068' }}>
              <Ban size={28} style={{ opacity: .15, display: 'block', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, margin: 0 }}>No banned IPs yet. Critical attacks will auto-ban the attacker's IP.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#0d0d1a' }}>
                {['IP Address', 'Banned At', 'Reason', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {banlist.map((e, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #1a1a2a' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Ban size={11} color="#ef4444" />
                        <span style={{ fontSize: 12, color: '#ef4444', fontFamily: 'monospace', fontWeight: 700 }}>{e.ip}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: '#7a8299' }}>{e.banned_at ? new Date(e.banned_at).toLocaleString() : '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <code style={{ fontSize: 10, color: '#a855f7', background: 'rgba(168,85,247,0.1)', padding: '2px 7px', borderRadius: 4 }}>{e.reason || 'critical_attack'}</code>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => unbanIP(e.ip)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid #26263a', borderRadius: 7, color: '#7a8299', fontSize: 11, cursor: 'pointer' }}>
                        <X size={11} />Unban
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
