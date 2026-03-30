import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { Activity, Clock, AlertTriangle, Zap, Server, RefreshCw, CheckCircle } from 'lucide-react';
import { useLang } from '../../context/LangContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

const fmt = (v, unit = '') => v === null || v === undefined ? '—' : `${v}${unit}`;

function StatCard({ icon: Icon, label, value, unit = '', color, sublabel }) {
  return (
    <div style={{ background: '#111118', border: `1px solid ${color}25`, borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 42, height: 42, background: `${color}15`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 10, color: '#7a8299', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{label}</div>
        <div className="numeric" style={{ fontSize: 22, fontWeight: 900, color, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
          {fmt(value, unit)}
        </div>
        {sublabel && <div style={{ fontSize: 10, color: '#4a5068', marginTop: 3 }}>{sublabel}</div>}
      </div>
    </div>
  );
}

const CHART_STYLE = {
  background: '#111118', border: '1px solid #1e1e30',
  borderRadius: 14, padding: '18px 20px 10px',
};
const TOOLTIP_STYLE = {
  background: '#0d0d1a', border: '1px solid #26263a',
  borderRadius: 10, fontSize: 12, color: '#f3f5ff',
};

export default function AdminObservability() {
  const { t } = useLang();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/metrics`, { headers: authH() });
      if (res.ok) {
        setData(await res.json());
        setLastFetch(new Date());
      }
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMetrics();
    if (!autoRefresh) return;
    const iv = setInterval(fetchMetrics, 10000);
    return () => clearInterval(iv);
  }, [fetchMetrics, autoRefresh]);

  const cur = data?.current || {};
  const ts  = data?.timeseries || [];

  const latencyColor = cur.avg_latency_ms > 500 ? '#ef4444' : cur.avg_latency_ms > 200 ? '#FFBE0B' : '#22c58b';
  const errorColor   = cur.errors_per_min > 10  ? '#ef4444' : cur.errors_per_min > 3   ? '#FFBE0B' : '#22c58b';
  const healthStatus = !data ? 'unknown' : cur.error_rate_pct > 5 ? 'degraded' : 'healthy';

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff', margin: 0 }}>
            Observability Dashboard
          </h1>
          <p style={{ fontSize: 13, color: '#7a8299', margin: '4px 0 0' }}>
            Server metrics · real-time · 30-minute window
            {lastFetch && <span style={{ marginLeft: 8, color: '#3a3d5a' }}>· Updated {lastFetch.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Status badge */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: healthStatus === 'healthy' ? 'rgba(34,197,139,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${healthStatus === 'healthy' ? 'rgba(34,197,139,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 9, fontSize: 12, fontWeight: 700, color: healthStatus === 'healthy' ? '#22c58b' : '#ef4444' }}>
            {healthStatus === 'healthy' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
            {healthStatus === 'healthy' ? 'Healthy' : 'Degraded'}
          </span>
          {/* Auto-refresh toggle */}
          <button onClick={() => setAutoRefresh(a => !a)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: autoRefresh ? 'rgba(58,134,255,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${autoRefresh ? 'rgba(58,134,255,0.3)' : '#26263a'}`, borderRadius: 9, color: autoRefresh ? '#3A86FF' : '#7a8299', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Activity size={12} style={autoRefresh ? { animation: 'shimmer 2s ease infinite' } : {}} />
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
          <button onClick={() => { setLoading(true); fetchMetrics(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid #26263a', borderRadius: 9, color: '#7a8299', fontSize: 12, cursor: 'pointer' }}>
            <RefreshCw size={12} style={loading ? { animation: 'spin .8s linear infinite' } : {}} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard icon={Clock}         label="Avg Latency"       value={cur.avg_latency_ms}  unit=" ms" color={latencyColor}  sublabel={`p95: ${fmt(cur.p95_latency_ms, ' ms')}`} />
        <StatCard icon={AlertTriangle} label="Errors / min"      value={cur.errors_per_min}  unit=""    color={errorColor}    sublabel={`${fmt(cur.error_rate_pct, '%')} error rate`} />
        <StatCard icon={Zap}           label="Requests / min"    value={cur.requests_per_min} unit=""   color="#3A86FF"       sublabel="last 60 seconds" />
        <StatCard icon={Server}        label="Uptime"            value={data?.uptime?.human} unit=""    color="#22c58b"       sublabel={`${(data?.total_requests || 0).toLocaleString()} total requests`} />
      </div>

      {/* ── Response Latency Chart ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={CHART_STYLE}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Clock size={14} color="#3A86FF" />Response Latency (ms)
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#4a5068' }}>30-min window · 1-min slots</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={ts} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3A86FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3A86FF" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" />
              <XAxis dataKey="time" tick={{ fill: '#4a5068', fontSize: 10 }} interval={4} />
              <YAxis tick={{ fill: '#4a5068', fontSize: 10 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} ms`, 'Latency']} />
              <Area type="monotone" dataKey="latency" stroke="#3A86FF" strokeWidth={2} fill="url(#latGrad)" dot={false} activeDot={{ r: 4, fill: '#3A86FF' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Errors per Minute Chart ── */}
        <div style={CHART_STYLE}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
            <AlertTriangle size={14} color="#ef4444" />Errors per Minute
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#4a5068' }}>4xx + 5xx responses</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ts} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" />
              <XAxis dataKey="time" tick={{ fill: '#4a5068', fontSize: 10 }} interval={4} />
              <YAxis tick={{ fill: '#4a5068', fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, 'Errors']} />
              <Bar dataKey="errors" fill="#ef4444" radius={[3, 3, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Request Volume Chart ── */}
      <div style={CHART_STYLE}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Zap size={14} color="#22c58b" />Request Volume
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#4a5068' }}>Total requests per minute · last 30 minutes</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={ts} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22c58b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c58b" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" />
            <XAxis dataKey="time" tick={{ fill: '#4a5068', fontSize: 10 }} interval={4} />
            <YAxis tick={{ fill: '#4a5068', fontSize: 10 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, 'Requests']} />
            <Area type="monotone" dataKey="requests" stroke="#22c58b" strokeWidth={2} fill="url(#reqGrad)" dot={false} activeDot={{ r: 4, fill: '#22c58b' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Info footer ── */}
      <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(58,134,255,0.05)', border: '1px solid rgba(58,134,255,0.12)', borderRadius: 10, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Data source', value: 'In-memory ring buffer (10k entries)' },
          { label: 'Collection', value: 'Every HTTP request via middleware' },
          { label: 'Retention', value: '~10,000 requests in memory' },
          { label: 'Auto-refresh', value: autoRefresh ? 'Every 10s' : 'Paused' },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: 9, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
            <div style={{ fontSize: 12, color: '#7a8299', marginTop: 2 }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
