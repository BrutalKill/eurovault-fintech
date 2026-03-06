import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, TrendingUp, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'hsl(240,33%,5%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      padding: 24,
    }}>
      {/* Gradiente de fundo */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 60% 50% at 20% 20%, rgba(58,134,255,0.12) 0%, transparent 70%),
          radial-gradient(ellipse 50% 40% at 80% 80%, rgba(255,190,11,0.08) 0%, transparent 60%)
        `,
      }} />

      {/* Número 404 grande decorativo */}
      <div style={{
        position: 'absolute',
        fontSize: 'clamp(160px, 30vw, 320px)',
        fontFamily: 'var(--font-heading)',
        fontWeight: 900,
        color: 'rgba(255,255,255,0.03)',
        letterSpacing: '-0.05em',
        userSelect: 'none',
        pointerEvents: 'none',
        lineHeight: 1,
      }}>
        404
      </div>

      {/* Logo */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, maxWidth: 480, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo-eurovault.png" alt="EuroVault" style={{ width: 52, height: 52, objectFit: 'contain' }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: '#f3f5ff' }}>EuroVault</div>
            <div style={{ fontSize: 10, color: 'hsl(46,100%,52%)', fontWeight: 700, letterSpacing: '0.1em' }}>INVESTMENTS</div>
          </div>
        </div>

        {/* Ícone e mensagem */}
        <div>
          <div style={{
            width: 72, height: 72, margin: '0 auto 20px',
            background: 'rgba(58,134,255,0.1)',
            border: '1px solid rgba(58,134,255,0.25)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={30} color="#3A86FF" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#f3f5ff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Página não encontrada
          </h1>
          <p style={{ fontSize: 15, color: 'hsl(215,16%,60%)', lineHeight: 1.6, margin: 0 }}>
            A página que procura não existe ou foi movida.<br />
            Navegue para a área principal da plataforma.
          </p>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', background: 'transparent', border: '1px solid hsl(240,16%,26%)', borderRadius: 12, color: 'hsl(215,16%,65%)', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3A86FF'; e.currentTarget.style.color = '#3A86FF'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(240,16%,26%)'; e.currentTarget.style.color = 'hsl(215,16%,65%)'; }}>
            <ArrowLeft size={15} />Voltar
          </button>
          <button onClick={() => navigate(token ? '/app/dashboard' : '/login')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', background: 'hsl(214,100%,60%)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(58,134,255,0.35)', transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <Home size={15} />{token ? 'Ir para o Dashboard' : 'Ir para o Login'}
          </button>
        </div>

        {/* Rodapé */}
        <p style={{ fontSize: 12, color: 'hsl(215,16%,40%)', margin: 0 }}>
          Código de erro: 404 · EuroVault Investments
        </p>
      </div>
    </div>
  );
}
