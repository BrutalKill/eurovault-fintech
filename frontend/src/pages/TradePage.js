import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, CreditCard, ArrowDownToLine, BarChart2, Activity } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function TradePage() {
  const { user, fetchUser } = useUser();
  const navigate = useNavigate();
  const chartRef = useRef(null);
  const [chartLoaded, setChartLoaded] = useState(false);

  useEffect(() => { fetchUser(); }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    const container = chartRef.current;
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: 'FX:EURUSD',
      interval: 'D',
      timezone: 'Europe/Lisbon',
      theme: 'dark',
      style: '1',
      locale: 'pt',
      enable_publishing: false,
      backgroundColor: 'rgba(10, 10, 15, 0)',
      gridColor: 'rgba(255, 255, 255, 0.04)',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com'
    });

    container.appendChild(script);
    setTimeout(() => setChartLoaded(true), 1500);
  }, []);

  const formatEur = (val) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val || 0);
  const profitPositive = (user?.profit || 0) >= 0;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>Negociar</h1>
        <p style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>Mercado EUR/USD em tempo real</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 20 }} className="trade-grid">
        <style>{`@media (max-width: 1100px) { .trade-grid { grid-template-columns: 1fr !important; } }`}</style>

        {/* Chart */}
        <div
          data-testid="trade-tradingview-container"
          style={{
            background: 'hsl(240,26%,8%)',
            border: '1px solid hsl(240,16%,18%)',
            borderRadius: 16,
            overflow: 'hidden',
            height: 520,
            position: 'relative'
          }}
        >
          {!chartLoaded && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <Activity size={32} color="hsl(214,100%,60%)" />
              <span style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>A carregar gráfico...</span>
            </div>
          )}
          <div
            ref={chartRef}
            className="tradingview-widget-container"
            style={{ width: '100%', height: '100%' }}
          >
            <div className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }}></div>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Balance Card */}
          <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 11, color: 'hsl(215,16%,70%)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Saldo Disponível</div>
            <div
              data-testid="trade-balance-eur"
              className="numeric"
              style={{ fontSize: 28, fontWeight: 700, color: '#f3f5ff', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              {formatEur(user?.balance)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <span style={{ fontSize: 12, color: 'hsl(215,16%,70%)' }}>P/L Total:</span>
              <span
                data-testid="trade-profit-eur"
                className="numeric"
                style={{ fontSize: 14, fontWeight: 700, color: profitPositive ? 'hsl(155,72%,45%)' : 'hsl(0,78%,54%)', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {profitPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {profitPositive ? '+' : ''}{formatEur(user?.profit)}
              </span>
            </div>
          </div>

          {/* Market info */}
          <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 12, color: 'hsl(215,16%,70%)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>EUR/USD</div>
            {[
              { label: 'Abertura', value: '1.0842' },
              { label: 'Var. 24h', value: '+0.0015 (+0.14%)' },
              { label: 'Mínimo', value: '1.0831' },
              { label: 'Máximo', value: '1.0878' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
                <span style={{ color: 'hsl(215,16%,70%)' }}>{label}</span>
                <span className="numeric" style={{ color: value.startsWith('+') ? 'hsl(155,72%,45%)' : '#f3f5ff', fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <button
            data-testid="trade-deposit-cta"
            onClick={() => navigate('/app/deposit')}
            style={{ width: '100%', padding: '13px', background: 'hsl(214,100%,60%)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <CreditCard size={16} />
            Depositar Fundos
          </button>

          <button
            data-testid="trade-withdrawal-cta"
            onClick={() => navigate('/app/withdrawal')}
            style={{ width: '100%', padding: '13px', background: 'hsl(240,18%,14%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 12, color: '#f3f5ff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <ArrowDownToLine size={16} />
            Levantar Fundos
          </button>

          {/* Performance summary */}
          <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 12, color: 'hsl(215,16%,70%)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Desempenho</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, textAlign: 'center', padding: '12px 8px', background: 'hsl(240,18%,12%)', borderRadius: 10 }}>
                <div className="numeric" style={{ fontSize: 18, fontWeight: 700, color: 'hsl(214,100%,60%)', fontFamily: 'var(--font-heading)' }}>0</div>
                <div style={{ fontSize: 11, color: 'hsl(215,16%,70%)', marginTop: 4 }}>Operações</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '12px 8px', background: 'hsl(240,18%,12%)', borderRadius: 10 }}>
                <div className="numeric" style={{ fontSize: 18, fontWeight: 700, color: profitPositive ? 'hsl(155,72%,45%)' : 'hsl(0,78%,54%)', fontFamily: 'var(--font-heading)' }}>0%</div>
                <div style={{ fontSize: 11, color: 'hsl(215,16%,70%)', marginTop: 4 }}>Rendimento</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
