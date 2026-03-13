import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, TrendingUp, Phone, Mail, MapPin, ExternalLink } from 'lucide-react';
import { useLang } from '../context/LangContext';

const currentYear = new Date().getFullYear();

export default function Footer() {
  const { t } = useLang();
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
          { icon: Shield, text: t('footer_badge_esma')  },
          { icon: Lock,   text: t('footer_badge_ssl')   },
          { icon: Shield, text: t('footer_badge_icf')   },
          { icon: Shield, text: t('footer_badge_gdpr')  },
          { icon: Lock,   text: t('footer_badge_pci')   },
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
              {t('footer_desc')}
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
            <div style={s.title}>{t('footer_links')}</div>
            {[
              { to: '/app/trade',      label: t('nav_trade')      },
              { to: '/app/deposit',    label: t('nav_deposit')    },
              { to: '/app/withdrawal', label: t('nav_withdrawal') },
              { to: '/app/news',       label: t('nav_news')       },
              { to: '/app/referral',   label: t('footer_referral')},
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
            <div style={s.title}>{t('footer_legal')}</div>
            {[
              { label: 'Terms of Service',   to: '/legal/terms'   },
              { label: 'Privacy Policy',     to: '/legal/privacy' },
              { label: 'Refund Policy',      to: '/legal/refund'  },
              { label: 'AML Policy',         to: '/legal/aml'     },
            ].map(({ label, to }) => (
              <Link key={to} to={to} target="_blank" rel="noreferrer"
                style={{ ...s.link, display: 'flex', alignItems: 'center', gap: 4 }}
                onMouseEnter={e => { e.currentTarget.style.color = '#3A86FF'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#7a8299'; }}>
                {label} <ExternalLink size={9} style={{ opacity: 0.5 }} />
              </Link>
            ))}
          </div>

          {/* Coluna 4 — Suporte */}
          <div style={s.section}>
            <div style={s.title}>{t('footer_support')}</div>
            {[
              { label: t('footer_help'),      href: null,  action: 'chat' },
              { label: t('footer_faq'),       href: null,  action: 'chat' },
              { label: t('footer_tutorials'), href: '/app/trade', action: 'internal' },
              { label: t('footer_report'),    href: null,  action: 'chat' },
              { label: t('footer_referral'),  href: '/app/referral', action: 'internal' },
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
            &copy; {currentYear} EuroVault Investments. {t('footer_rights')}
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Terms',   to: '/legal/terms'   },
              { label: 'Privacy', to: '/legal/privacy' },
              { label: 'Refund',  to: '/legal/refund'  },
              { label: 'AML',     to: '/legal/aml'     },
            ].map(({ label, to }) => (
              <Link key={to} to={to} target="_blank"
                style={{ fontSize: 11, color: '#4a5068', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = '#3A86FF'}
                onMouseLeave={e => e.target.style.color = '#4a5068'}>
                {label}
              </Link>
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
