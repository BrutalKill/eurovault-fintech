import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Users, TrendingUp, Copy, CheckCircle, Star, ArrowRight, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '../context/UserContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const fmt = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);

const HOW_IT_WORKS = [
  { icon: Share2,      color: '#3A86FF', title: '1. Partilhe o seu link', desc: 'Copie o seu link único de referido e partilhe com amigos, família ou nas redes sociais.' },
  { icon: Users,       color: '#22c58b', title: '2. Amigo regista-se',    desc: 'Quando alguém se regista através do seu link e efectua o primeiro depósito, é contado como convertido.' },
  { icon: Gift,        color: '#FFBE0B', title: '3. Receba €25',          desc: 'Por cada amigo que deposita, recebe automaticamente €25 de bónus na sua conta.' },
  { icon: TrendingUp,  color: '#a855f7', title: '4. Sem limite',          desc: 'Não existe limite de referidos. Quanto mais amigos convidarem, mais bónus acumula.' },
];

// Níveis baseados no valor total depositado
const TIERS = [
  { min: 10,     max: 999,      label: 'Bronze',   color: '#cd7f32', bonus: 25,  icon: '🥉', label_range: 'A partir de €10' },
  { min: 1000,   max: 4999,     label: 'Prata',    color: '#c0c0c0', bonus: 35,  icon: '🥈', label_range: '€1.000 – €4.999' },
  { min: 5000,   max: 24999,    label: 'Ouro',     color: '#FFD700', bonus: 50,  icon: '🥇', label_range: '€5.000 – €24.999' },
  { min: 25000,  max: Infinity, label: 'Platinum', color: '#3A86FF', bonus: 75,  icon: '💎', label_range: 'A partir de €25.000' },
];

export default function ReferralPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [referral, setReferral] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${BACKEND_URL}/api/me/referral`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(setReferral).catch(() => {});
  }, []);

  const referralLink = referral ? `${window.location.origin}/ref/${referral.referral_code}` : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Link copiado!', { description: 'Partilhe com os seus amigos.' });
      setTimeout(() => setCopied(false), 3000);
    } catch (_) { toast.error('Erro ao copiar'); }
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'EuroVault Investments', text: 'Invista connosco e receba €25 de bónus!', url: referralLink });
    } else { copyLink(); }
  };

  const depositedAmount = Math.max(0, parseFloat(user?.balance) || 0) + Math.max(0, parseFloat(user?.profit) || 0);
  const currentTier = TIERS.slice().reverse().find(t => depositedAmount >= t.min) || TIERS[0];
  const nextTier    = TIERS[TIERS.indexOf(currentTier) + 1];

  const card = { background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: '22px 24px' };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#f3f5ff', margin: 0 }}>
            Programa de Parceiros
          </h1>
          <p style={{ fontSize: 13, color: 'hsl(215,16%,60%)', margin: '5px 0 0' }}>
            Convide amigos e ganhe €25 por cada conversão
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: `${currentTier.color}18`, border: `1px solid ${currentTier.color}40`, borderRadius: 12 }}>
          <span style={{ fontSize: 20 }}>{currentTier.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: currentTier.color }}>{currentTier.label}</div>
            <div style={{ fontSize: 10, color: 'hsl(215,16%,55%)' }}>Nível actual</div>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }} className="referral-stats">
        {[
          { label: 'Convidados', value: referral?.count || 0,     color: '#3A86FF', icon: Users    },
          { label: 'Convertidos',value: referral?.converted || 0, color: '#22c58b', icon: CheckCircle },
          { label: 'Bónus Total', value: fmt(referral?.bonus || 0), color: '#FFBE0B', icon: Gift, isText: true },
        ].map(({ label, value, color, icon: Icon, isText }) => (
          <div key={label} style={{ ...card, textAlign: 'center', borderColor: `${color}20` }}>
            <div style={{ width: 42, height: 42, background: `${color}18`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Icon size={20} color={color} />
            </div>
            <div className="numeric" style={{ fontSize: isText ? 18 : 26, fontWeight: 800, color, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
              {value}
            </div>
            <div style={{ fontSize: 12, color: 'hsl(215,16%,55%)', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Link de convite */}
      <div style={{ ...card, marginBottom: 20, background: 'linear-gradient(135deg, rgba(58,134,255,0.12), rgba(34,197,139,0.08))', borderColor: 'rgba(58,134,255,0.25)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Share2 size={16} color="#3A86FF" />O seu link único de referido
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, padding: '11px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: 10, border: '1px solid rgba(58,134,255,0.2)', overflow: 'hidden' }}>
            <div style={{ fontSize: 13, color: '#3A86FF', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {referralLink || 'A carregar…'}
            </div>
          </div>
          <button onClick={copyLink}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', background: copied ? 'rgba(34,197,139,0.2)' : '#3A86FF', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}>
            {copied ? <><CheckCircle size={14} />Copiado!</> : <><Copy size={14} />Copiar</>}
          </button>
          <button onClick={shareLink}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', background: 'rgba(255,190,11,0.12)', border: '1px solid rgba(255,190,11,0.3)', borderRadius: 10, color: '#FFBE0B', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
            <Share2 size={14} />Partilhar
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'hsl(215,16%,45%)', marginTop: 8 }}>
          O link identifica-o como referenciador. Cada pessoa só pode ser referenciada uma vez.
        </div>
      </div>

      {/* Como funciona */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#f3f5ff', marginBottom: 18 }}>Como Funciona</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }} className="referral-how">
          {HOW_IT_WORKS.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} style={{ display: 'flex', gap: 12, padding: '14px', background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 12 }}>
              <div style={{ width: 36, height: 36, background: `${color}18`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={17} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'hsl(215,16%,60%)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Níveis de parceiro */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#f3f5ff', marginBottom: 16 }}>Níveis de Parceiro</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TIERS.map(tier => {
            const isActive = tier.label === currentTier.label;
            return (
              <div key={tier.label} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                background: isActive ? `${tier.color}12` : 'transparent',
                border: `1px solid ${isActive ? tier.color + '40' : 'hsl(240,16%,18%)'}`,
                borderRadius: 12, transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: 24 }}>{tier.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: tier.color }}>{tier.label}</span>
                    {isActive && <span style={{ fontSize: 10, padding: '2px 7px', background: `${tier.color}20`, border: `1px solid ${tier.color}40`, borderRadius: 5, color: tier.color, fontWeight: 700 }}>ACTUAL</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'hsl(215,16%,55%)' }}>
                    {tier.max === Infinity ? `${tier.min}+ convertidos` : `${tier.min}–${tier.max} convertidos`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="numeric" style={{ fontSize: 16, fontWeight: 800, color: tier.color }}>€{tier.bonus}</div>
                  <div style={{ fontSize: 10, color: 'hsl(215,16%,50%)' }}>por referido</div>
                </div>
              </div>
            );
          })}
        </div>
        {nextTier && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(58,134,255,0.06)', border: '1px solid rgba(58,134,255,0.15)', borderRadius: 9, fontSize: 12, color: 'hsl(215,16%,65%)' }}>
            💡 Faltam <strong style={{ color: '#3A86FF' }}>{nextTier.min - (referral?.converted || 0)} convertidos</strong> para atingir o nível <strong style={{ color: nextTier.color }}>{nextTier.icon} {nextTier.label}</strong> (€{nextTier.bonus}/referido)
          </div>
        )}
      </div>

      {/* CTA */}
      <button onClick={() => navigate('/app/deposit')}
        style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #22c58b, #3A86FF)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'var(--font-heading)', boxShadow: '0 4px 20px rgba(58,134,255,0.3)', transition: 'opacity 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
        <Star size={18} fill="#fff" />Começar a Convidar e Ganhar Agora<ArrowRight size={18} />
      </button>
    </div>
  );
}
