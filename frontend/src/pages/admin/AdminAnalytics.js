import { useLang } from '../../context/LangContext';
import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Percent, BarChart2, Globe, ArrowUp, Download, Bell,
         Brain, Target, Activity, Zap } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const fmt  = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);

/* Mini barra de gráfico */
function MiniBar({ data, color = '#3A86FF' }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.count || 0), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 48 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div style={{ width: '100%', background: color, borderRadius: '3px 3px 0 0', height: `${((d.count || 0) / max) * 100}%`, minHeight: d.count > 0 ? 3 : 0, opacity: 0.85 }} />
          {data.length <= 7 && (
            <div style={{ fontSize: 8, color: '#4a5068', marginTop: 2, whiteSpace: 'nowrap' }}>{d.day}</div>
          )}
        </div>
      ))}
    </div>
  );
}

/* Revenue Forecast Chart */
function RevenueForecastChart({ data }) {
  if (!data || (!data.historical?.length && !data.forecast?.length)) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: '#4a5068', fontSize: 12 }}>
        <TrendingUp size={24} style={{ opacity: 0.2, marginBottom: 8 }} />
        <p style={{ margin: 0 }}>Dados insuficientes para previsão (mínimo 3 dias)</p>
      </div>
    );
  }
  const all = [...(data.historical || []), ...(data.forecast || [])];
  const maxVal = Math.max(...all.map(d => d.revenue || 0), 1);
  const trendColor = data.trend === 'growing' ? '#22c58b' : data.trend === 'declining' ? '#ef4444' : '#FFBE0B';
  const histCount = data.historical?.length || 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#7a8299', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Previsão de Receita — 30 dias</span>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, background: `${trendColor}15`, color: trendColor, fontWeight: 700, border: `1px solid ${trendColor}30` }}>
            {data.trend === 'growing' ? '↑ Crescendo' : data.trend === 'declining' ? '↓ Declinando' : '→ Estável'}
          </span>
        </div>
        {data.daily_growth !== undefined && (
          <span style={{ fontSize: 11, color: trendColor, fontWeight: 700 }}>
            {data.daily_growth >= 0 ? '+' : ''}{fmt(data.daily_growth)}/dia
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80, marginBottom: 8 }}>
        {all.map((d, i) => {
          const isForecast = d.forecast === true;
          const h = Math.max(2, ((d.revenue || 0) / maxVal) * 80);
          const color = isForecast ? 'rgba(58,134,255,0.4)' : '#22c58b';
          return (
            <div key={i} title={`${d.date}: ${fmt(d.revenue)}${isForecast ? ' (previsão)' : ''}`}
              style={{ flex: 1, height: h, background: color, borderRadius: '2px 2px 0 0',
                borderTop: isForecast ? '1px dashed rgba(58,134,255,0.6)' : 'none',
                transition: 'height 0.3s ease' }} />
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, background: '#22c58b', borderRadius: 2 }} />
          <span style={{ fontSize: 10, color: '#7a8299' }}>Histórico ({histCount} pts)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, background: 'rgba(58,134,255,0.4)', borderRadius: 2, border: '1px dashed rgba(58,134,255,0.6)' }} />
          <span style={{ fontSize: 10, color: '#7a8299' }}>Previsão ML (30 dias)</span>
        </div>
      </div>
    </div>
  );
}

/* Agent Performance Matrix */
function AgentMatrix({ agents }) {
  if (!agents || agents.length === 0) {
    return <div style={{ padding: '24px 0', textAlign: 'center', color: '#4a5068', fontSize: 12 }}>Nenhum agente com leads atribuídos</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {agents.map((agent, i) => {
        const convPct = agent.conversion_rate || 0;
        const scoreColor = agent.avg_ai_score >= 60 ? '#22c58b' : agent.avg_ai_score >= 40 ? '#FFBE0B' : '#3A86FF';
        return (
          <div key={agent.id} style={{ padding: '12px 14px', background: '#0e0e1a', border: '1px solid #1e1e30', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#3A86FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {agent.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>{agent.name}</div>
                  <div style={{ fontSize: 10, color: '#4a5068' }}>{agent.email}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#7a8299' }}>Capital Gerido</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#22c58b' }}>{fmt(agent.capital_managed)}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 8 }}>
              {[
                { label: 'Leads',       value: agent.leads_assigned,   color: '#3A86FF' },
                { label: 'Convertidos', value: agent.leads_converted,  color: '#22c58b' },
                { label: 'AI Score',    value: `${agent.avg_ai_score}`, color: scoreColor },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center', background: '#111118', borderRadius: 8, padding: '8px 6px' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color, fontFamily: 'var(--font-heading)' }}>{value}</div>
                  <div style={{ fontSize: 9, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: '#7a8299' }}>Taxa de Conversão</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: convPct >= 50 ? '#22c58b' : convPct >= 25 ? '#FFBE0B' : '#ef4444' }}>{convPct}%</span>
              </div>
              <div style={{ height: 5, background: '#1e1e30', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${convPct}%`, background: convPct >= 50 ? '#22c58b' : convPct >= 25 ? '#FFBE0B' : '#ef4444', borderRadius: 3, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalytics() {
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [followups, setFollowups] = useState([]);
  const [pendingKyc, setPendingKyc] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState(null);
  const [agentPerf, setAgentPerf] = useState([]);
  const [mlInfo, setMlInfo] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const h = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${BACKEND_URL}/api/admin/analytics`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND_URL}/api/admin/followups`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${BACKEND_URL}/api/admin/kyc/pending`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${BACKEND_URL}/api/admin/analytics/revenue-forecast`, { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${BACKEND_URL}/api/admin/analytics/agent-performance`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${BACKEND_URL}/api/admin/ml/info`, { headers: h }).then(r => r.ok ? r.json() : null),
    ]).then(([analytics, fu, kyc, fc, agents, ml]) => {
      setData(analytics);
      setFollowups(fu);
      setPendingKyc(kyc);
      setForecast(fc);
      setAgentPerf(agents);
      setMlInfo(ml);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleExport = () => {
    const token = localStorage.getItem('adminToken');
    window.open(`${BACKEND_URL}/api/admin/export/leads?token=${token}`, '_blank');
    fetch(`${BACKEND_URL}/api/admin/export/leads`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.blob()).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'leads.csv'; a.click();
      URL.revokeObjectURL(url);
    });
  };

  if (loading) return (
    <div style={{ padding: '60px 0', textAlign: 'center', color: '#4a5068' }}>A carregar analytics…</div>
  );

  const KPIS = data ? [
    { icon: Users,      label: 'Total de Leads',     value: data.total_users,                  color: '#3A86FF', bg: 'rgba(58,134,255,0.1)'  },
    { icon: TrendingUp, label: 'Depositados',         value: data.deposited,                    color: '#22c58b', bg: 'rgba(34,197,139,0.1)'  },
    { icon: Percent,    label: 'Taxa de Conversão',   value: `${data.conversion_rate}%`,        color: '#FFBE0B', bg: 'rgba(255,190,11,0.1)'  },
    { icon: DollarSign, label: 'Capital Total (€)',   value: fmt(data.total_balance),           color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
    { icon: ArrowUp,    label: 'Novos Hoje',          value: data.new_today,                    color: '#22c58b', bg: 'rgba(34,197,139,0.08)' },
    { icon: BarChart2,  label: 'Ordens Hoje',         value: data.orders_today,                 color: '#3A86FF', bg: 'rgba(58,134,255,0.08)' },
  ] : [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff', margin: 0 }}>{t('anal_title')}</h1>
          <p style={{ fontSize: 13, color: '#7a8299', margin: '4px 0 0' }}>Visão geral do negócio em tempo real</p>
        </div>
        <button onClick={handleExport}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: 'rgba(34,197,139,0.12)', border: '1px solid rgba(34,197,139,0.3)', borderRadius: 10, color: '#22c58b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Download size={14} />{t('anal_export')}
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gap: 14, marginBottom: 24 }} className="analytics-grid">
        {KPIS.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, background: bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#7a8299', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{label}</div>
              <div className="numeric" style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gap: 16, marginBottom: 24 }} className="analytics-charts">

        {/* Registos por dia */}
        <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7a8299', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Registos — Últimos 14 dias</div>
          <MiniBar data={data?.registrations_by_day || []} color="#3A86FF" />
        </div>

        {/* Top países */}
        <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7a8299', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
            <Globe size={12} style={{ marginRight: 6 }} />Top Países
          </div>
          {(data?.top_countries || []).map(({ country, count }, i) => (
            <div key={country} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#4a5068', minWidth: 16 }}>{i + 1}.</span>
              <div style={{ flex: 1, height: 6, background: '#1e1e30', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#3A86FF', borderRadius: 3, width: `${Math.round(count / (data.total_users || 1) * 100)}%` }} />
              </div>
              <span style={{ fontSize: 12, color: '#e8eaf6', minWidth: 80 }}>{country}</span>
              <span className="numeric" style={{ fontSize: 12, fontWeight: 700, color: '#3A86FF', minWidth: 24 }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Follow-ups pendentes */}
      {followups.length > 0 && (
        <div style={{ background: '#111118', border: '1px solid rgba(255,190,11,0.25)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Bell size={15} color="#FFBE0B" />
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFBE0B' }}>Follow-ups Pendentes ({followups.length})</div>
          </div>
          {followups.map((f, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: i > 0 ? '1px solid #1a1a2a' : 'none' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f3f5ff' }}>{f.full_name}</div>
                <div style={{ fontSize: 11, color: '#7a8299' }}>{f.followup_note || 'Sem nota'}</div>
              </div>
              <div style={{ fontSize: 11, color: '#FFBE0B' }}>
                {f.followup_date ? new Date(f.followup_date).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ML Revenue Forecast ── */}
      <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, background: 'rgba(34,197,139,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={15} color="#22c58b" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>Revenue Forecasting</div>
            <div style={{ fontSize: 11, color: '#7a8299' }}>Regressão linear sobre dados históricos</div>
          </div>
          {mlInfo && (
            <div style={{ marginLeft: 'auto', fontSize: 10, padding: '3px 9px', borderRadius: 5, background: mlInfo.model_loaded ? 'rgba(34,197,139,0.1)' : 'rgba(255,190,11,0.1)', color: mlInfo.model_loaded ? '#22c58b' : '#FFBE0B', border: `1px solid ${mlInfo.model_loaded ? 'rgba(34,197,139,0.3)' : 'rgba(255,190,11,0.3)'}`, fontWeight: 700 }}>
              {mlInfo.model_loaded ? 'ML Activo' : 'Regras'}
            </div>
          )}
        </div>
        <RevenueForecastChart data={forecast} />
      </div>

      {/* ── Agent Performance Matrix ── */}
      {agentPerf.length > 0 && (
        <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, background: 'rgba(168,85,247,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={15} color="#a855f7" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>Agent Performance Matrix</div>
              <div style={{ fontSize: 11, color: '#7a8299' }}>Ranking de agentes por conversão e capital gerido</div>
            </div>
          </div>
          <AgentMatrix agents={agentPerf} />
        </div>
      )}

      {/* KYC Pendentes */}
      {pendingKyc.length > 0 && (
        <div style={{ background: '#111118', border: '1px solid rgba(58,134,255,0.25)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#3A86FF', marginBottom: 14 }}>KYC Pendentes de Revisão ({pendingKyc.length})</div>
          {pendingKyc.map((k, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: i > 0 ? '1px solid #1a1a2a' : 'none' }}>
              <div style={{ fontSize: 12, color: '#e8eaf6' }}>{k.user_id?.slice(-6)} — {k.doc_type}</div>
              <div style={{ fontSize: 11, color: '#4a5068' }}>
                {k.created_at ? new Date(k.created_at).toLocaleDateString('pt-PT') : '—'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
