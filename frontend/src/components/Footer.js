import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, TrendingUp, Phone, Mail, MapPin, ExternalLink } from 'lucide-react';

const currentYear = new Date().getFullYear();

export default function Footer() {
  const s = {
    section: { marginBottom: 0 },
    title: { fontSize: 12, fontWeight: 700, color: '#f3f5ff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 },
    link: { display: 'block', fontSize: 12, color: '#7a8299', marginBottom: 8, textDecoration: 'none', cursor: 'pointer', transition: 'color .15s' },
  };

  return (
    <footer style={{
      background: '#080810',
      borderTop: '1px solid #1a1a2a',
      marginTop: 'auto',
    }}>
      {/* Barra de conformidade */}
      <div style={{ borderBottom: '1px solid #1a1a2a', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { icon: Shield, text: 'Regulamentado ESMA' },
          { icon: Lock,   text: 'SSL 256-bit Encriptado' },
          { icon: Shield, text: 'Fundo de Protecção ICF' },
          { icon: Shield, text: 'Conforme RGPD' },
          { icon: Lock,   text: 'PCI DSS Certificado' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon size={12} color="#22c58b" />
            <span style={{ fontSize: 11, color: '#7a8299', fontWeight: 600 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Conteúdo principal do rodapé */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40 }} className="footer-grid">

          {/* Coluna 1 — Marca */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <img src="/logo-eurovault.png" alt="EuroVault" style={{ width: 40, height: 40, objectFit: 'contain' }} />
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#f3f5ff' }}>EuroVault</div>
                <div style={{ fontSize: 11, color: 'hsl(46,100%,52%)', fontWeight: 600 }}>Investments</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#4a5068', lineHeight: 1.7, marginBottom: 16, maxWidth: 280 }}>
              A EuroVault Investments é uma plataforma de investimento regulamentada, focada em oferecer acesso a mercados globais com segurança, transparência e tecnologia de excelente.
            </p>
            {/* Contactos */}
            {[
              { icon: Phone, text: '+351 21 000 0000' },
              { icon: Mail,  text: 'suporte@eurovault.eu' },
              { icon: MapPin,text: 'Av. da Liberdade 110, Lisboa, Portugal' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <Icon size={12} color="#7a8299" style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#4a5068', lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Coluna 2 — Plataforma */}
          <div style={s.section}>
            <div style={s.title}>Plataforma</div>
            {[
              { to: '/app/trade',      label: 'Negociar' },
              { to: '/app/deposit',    label: 'Depósito' },
              { to: '/app/withdrawal', label: 'Levantamento' },
              { to: '/app/news',       label: 'Notícias' },
              { to: '/app/profile',    label: 'O Meu Perfil' },
            ].map(({ to, label }) => (
              <Link key={to} to={to}
                style={s.link}
                onMouseEnter={e => e.target.style.color = '#3A86FF'}
                onMouseLeave={e => e.target.style.color = '#7a8299'}>
                {label}
              </Link>
            ))}
          </div>

          {/* Coluna 3 — Legal */}
          <div style={s.section}>
            <div style={s.title}>Legal</div>
            {[
              { label: 'Termos e Condições',    page: 'termos'    },
              { label: 'Política de Privacidade',page: 'privacidade'},
              { label: 'Política de Cookies',    page: 'cookies'   },
              { label: 'Política AML/KYC',       page: 'aml'       },
              { label: 'Conflitos de Interesse', page: 'conflitos' },
            ].map(({ label, page }) => (
              <a key={label} href={`/legal?page=${page}`} target="_blank" rel="noreferrer"
                style={{ ...s.link, display: 'flex', alignItems: 'center', gap: 4 }}
                onMouseEnter={e => { e.currentTarget.style.color = '#3A86FF'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#7a8299'; }}>
                {label} <ExternalLink size={9} style={{ opacity: 0.5 }} />
              </a>
            ))}
          </div>

          {/* Coluna 4 — Suporte */}
          <div style={s.section}>
            <div style={s.title}>Suporte</div>
            {[
              { label: 'Centro de Ajuda',          href: null,  action: 'chat' },
              { label: 'FAQ — Perguntas Frequentes',href: null,  action: 'chat' },
              { label: 'Tutoriais de Negociação',   href: '/app/trade', action: 'internal' },
              { label: 'Reportar Problema',          href: null,  action: 'chat' },
              { label: 'Programa de Parceiros',      href: null,  action: 'referral' },
            ].map(({ label, href, action }) => (
              <a key={label}
                href={action === 'internal' ? href : '#'}
                onClick={e => {
                  if (action === 'chat') {
                    e.preventDefault();
                    const btn = document.querySelector('[data-testid="floating-chat-btn"]');
                    if (btn) btn.click();
                  } else if (action === 'referral') {
                    e.preventDefault();
                    window.location.href = '/app/profile#referral';
                  }
                }}
                style={{ ...s.link, display: 'flex', alignItems: 'center', gap: 4 }}
                onMouseEnter={e => { e.currentTarget.style.color = '#3A86FF'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#7a8299'; }}>
                {label}
              </a>
            ))}

            {/* Selos regulatórios */}
            <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['CySEC', 'ESMA', 'MiFID II', 'RGPD'].map(badge => (
                <span key={badge} style={{ fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 5, background: 'rgba(58,134,255,0.1)', border: '1px solid rgba(58,134,255,0.2)', color: '#3A86FF', letterSpacing: '0.06em' }}>
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Informação legal */}
        <div style={{ margin: '28px 0 20px', padding: '14px 18px', background: 'rgba(58,134,255,0.05)', border: '1px solid rgba(58,134,255,0.12)', borderRadius: 10 }}>
          <p style={{ fontSize: 11, color: '#4a5068', lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: '#7a8299' }}>Informação Legal:</strong> A EuroVault Investments é regulamentada ao abrigo da Diretiva MiFID II e supervisionada pela CySEC.
            Todos os fundos dos clientes são mantidos em contas segregadas e protegidos pelo Fundo de Compensação dos Investidores (ICF).
            A EuroVault Investments cumpre integralmente o Regulamento Geral sobre a Proteção de Dados (RGPD).
          </p>
        </div>

        {/* Barra inferior */}
        <div style={{ borderTop: '1px solid #1a1a2a', paddingTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 11, color: '#4a5068' }}>
            &copy; {currentYear} EuroVault Investments. Todos os direitos reservados.
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Termos',      page: 'termos' },
              { label: 'Privacidade', page: 'privacidade' },
              { label: 'Cookies',     page: 'cookies' },
              { label: 'AML/KYC',    page: 'aml' },
            ].map(({ label, page }) => (
              <a key={label} href={`/legal?page=${page}`} target="_blank" rel="noreferrer"
                style={{ fontSize: 11, color: '#4a5068', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = '#3A86FF'}
                onMouseLeave={e => e.target.style.color = '#4a5068'}>
                {label}
              </a>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#4a5068' }}>
            EuroVault Investments Ltd. &bull; Reg. Nº CY-12345-B &bull; Autorizada CySEC
          </div>
        </div>
      </div>
    </footer>
  );
}
