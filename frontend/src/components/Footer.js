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
          <style>{`@media(max-width:900px){ .footer-grid{ grid-template-columns: 1fr 1fr !important; gap: 28px !important; } } @media(max-width:500px){ .footer-grid{ grid-template-columns: 1fr !important; } }`}</style>

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
              'Termos e Condições',
              'Política de Privacidade',
              'Política de Cookies',
              'Divulgação de Riscos',
              'Política AML/KYC',
              'Conflitos de Interesse',
            ].map(label => (
              <a key={label} href="#"
                style={s.link}
                onMouseEnter={e => e.target.style.color = '#3A86FF'}
                onMouseLeave={e => e.target.style.color = '#7a8299'}>
                {label}
              </a>
            ))}
          </div>

          {/* Coluna 4 — Suporte */}
          <div style={s.section}>
            <div style={s.title}>Suporte</div>
            {[
              'Centro de Ajuda',
              'FAQ — Perguntas Frequentes',
              'Tutoriais de Negociação',
              'Reportar Problema',
              'Programa de Parceiros',
            ].map(label => (
              <a key={label} href="#"
                style={s.link}
                onMouseEnter={e => e.target.style.color = '#3A86FF'}
                onMouseLeave={e => e.target.style.color = '#7a8299'}>
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

        {/* Aviso de risco */}
        <div style={{ margin: '28px 0 20px', padding: '14px 18px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10 }}>
          <p style={{ fontSize: 11, color: '#4a5068', lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: '#7a8299' }}>Aviso de Risco:</strong> A negociação de CFDs e outros instrumentos financeiros envolve risco elevado e pode resultar na perda de todo o capital investido.
            Não deverá investir capital que não possa perder. Certifique-se de que compreende os riscos associados à negociação e, se necessário, procure aconselhamento financeiro independente.
            Os resultados passados não constituem garantia de resultados futuros. A EuroVault Investments é regulamentada ao abrigo da Diretiva MiFID II.
          </p>
        </div>

        {/* Barra inferior */}
        <div style={{ borderTop: '1px solid #1a1a2a', paddingTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 11, color: '#4a5068' }}>
            &copy; {currentYear} EuroVault Investments. Todos os direitos reservados.
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {['Termos', 'Privacidade', 'Cookies', 'Risco'].map(t => (
              <a key={t} href="#" style={{ fontSize: 11, color: '#4a5068', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = '#3A86FF'}
                onMouseLeave={e => e.target.style.color = '#4a5068'}>
                {t}
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
