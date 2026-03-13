import React, { useState, useEffect, useCallback } from 'react';
import { ArrowDownToLine, Check, X, Clock, RefreshCw, Building2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const fmt = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);
const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const STATUS_STYLES = {
  pending:  { bg: 'rgba(255,190,11,0.12)',  color: '#FFBE0B',  border: 'rgba(255,190,11,0.3)',  label: '⏳ Pendente'  },
  approved: { bg: 'rgba(34,197,139,0.12)',  color: '#22c58b',  border: 'rgba(34,197,139,0.3)',  label: '✓ Aprovado'  },
  rejected: { bg: 'rgba(239,68,68,0.10)',   color: '#ef4444',  border: 'rgba(239,68,68,0.3)',   label: '✗ Rejeitado' },
};

/* Modal de rejeição com motivo */
function RejectModal({ onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  return (
    <>
      <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 301, background: '#111118', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 18, padding: '28px 24px', width: 380, maxWidth: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700, color: '#f3f5ff', margin: '0 0 12px' }}>Motivo da Rejeição</h3>
        <p style={{ fontSize: 13, color: '#7a8299', margin: '0 0 16px' }}>Opcional — será registado no histórico do lead.</p>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Ex: Saldo insuficiente, documentação incompleta…"
          rows={3}
          style={{ width: '100%', padding: '10px 12px', background: '#0e0e1a', border: '1px solid #26263a', borderRadius: 9, color: '#f3f5ff', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #26263a', borderRadius: 9, color: '#7a8299', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={() => onConfirm(reason)} style={{ flex: 1, padding: '10px', background: '#ef4444', border: 'none', borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Rejeitar
          </button>
        </div>
      </div>
    </>
  );
}

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [statusFilter, setStatusFilter]   = useState('pending');
  const [processing, setProcessing]       = useState({});
  const [rejectTarget, setRejectTarget]   = useState(null); // id a rejeitar

  const fetchWithdrawals = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/withdrawals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setWithdrawals(await res.json());
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchWithdrawals(); }, [fetchWithdrawals]);

  const handleReview = async (id, status, reason = '') => {
    const token = localStorage.getItem('adminToken');
    setProcessing(p => ({ ...p, [id]: true }));
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/withdrawals/${id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, reject_reason: reason }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || 'Erro');
      }
      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status, reject_reason: reason } : w));
      toast.success(status === 'approved' ? '✓ Levantamento aprovado!' : '✗ Levantamento rejeitado');
    } catch (e) {
      toast.error(e.message || 'Erro ao processar pedido');
    }
    setProcessing(p => ({ ...p, [id]: false }));
    setRejectTarget(null);
  };

  const filtered = withdrawals.filter(w => statusFilter === 'all' || w.status === statusFilter);
  const counts   = {
    pending:  withdrawals.filter(w => w.status === 'pending').length,
    approved: withdrawals.filter(w => w.status === 'approved').length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length,
  };

  return (
    <div>
      {rejectTarget && (
        <RejectModal
          onConfirm={(reason) => handleReview(rejectTarget, 'rejected', reason)}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff', margin: 0 }}>
            Pedidos de Levantamento
          </h1>
          <p style={{ fontSize: 13, color: '#7a8299', margin: '4px 0 0' }}>
            Aprovar ou rejeitar pedidos dos clientes
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => { setLoading(true); fetchWithdrawals(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', background: 'rgba(58,134,255,0.1)', border: '1px solid rgba(58,134,255,0.25)', borderRadius: 9, color: '#3A86FF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <RefreshCw size={13} />Actualizar
          </button>
          {/* Estatísticas */}
          {[
            { label: 'Pendentes', value: counts.pending,  color: '#FFBE0B' },
            { label: 'Aprovados', value: counts.approved, color: '#22c58b' },
            { label: 'Rejeitados',value: counts.rejected, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 10, padding: '6px 12px', textAlign: 'center' }}>
              <div className="numeric" style={{ fontSize: 16, fontWeight: 700, color, fontFamily: 'var(--font-heading)' }}>{value}</div>
              <div style={{ fontSize: 9, color: '#7a8299', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtro por estado */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[
          { k: 'pending',  l: '⏳ Pendentes' },
          { k: 'approved', l: '✓ Aprovados' },
          { k: 'rejected', l: '✗ Rejeitados' },
          { k: 'all',      l: 'Todos' },
        ].map(({ k, l }) => (
          <button key={k} onClick={() => setStatusFilter(k)}
            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${statusFilter === k ? 'rgba(58,134,255,0.4)' : '#26263a'}`,
              background: statusFilter === k ? 'rgba(58,134,255,0.12)' : 'transparent',
              color: statusFilter === k ? '#3A86FF' : '#7a8299' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#4a5068' }}>A carregar…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#4a5068' }}>
          <ArrowDownToLine size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
          <p style={{ fontSize: 13, margin: 0 }}>Sem pedidos {statusFilter !== 'all' ? `"${statusFilter}"` : ''}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(w => {
            const ss = STATUS_STYLES[w.status] || STATUS_STYLES.pending;
            const busy = processing[w.id];
            const isSepa = w.method === 'sepa';

            return (
              <div key={w.id} style={{ background: '#111118', border: `1px solid ${w.status === 'pending' ? 'rgba(255,190,11,0.2)' : '#26263a'}`, borderRadius: 14, overflow: 'hidden' }}>
                {/* Cabeçalho do pedido */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #1e1e30' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, background: isSepa ? 'rgba(58,134,255,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isSepa ? <Building2 size={16} color="#3A86FF" /> : <CreditCard size={16} color="#ef4444" />}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#f3f5ff' }}>{w.user_name || w.user_email}</div>
                      <div style={{ fontSize: 11, color: '#4a5068' }}>{w.user_email}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="numeric" style={{ fontSize: 18, fontWeight: 800, color: '#f3f5ff', fontFamily: 'var(--font-heading)' }}>
                      {w.amount > 0 ? fmt(w.amount) : 'Para Cartão'}
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, fontWeight: 700 }}>
                      {ss.label}
                    </span>
                  </div>
                </div>

                {/* Detalhes */}
                <div style={{ padding: '12px 18px', borderBottom: '1px solid #1e1e30' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#4a5068', textTransform: 'uppercase', marginBottom: 2 }}>Método</div>
                      <div style={{ fontSize: 12, color: '#e8eaf6' }}>{isSepa ? 'Transferência SEPA' : 'Levantamento para Cartão'}</div>
                    </div>
                    {!isSepa && w.card_holder && (
                      <div>
                        <div style={{ fontSize: 10, color: '#4a5068', textTransform: 'uppercase', marginBottom: 2 }}>Titular do Cartão</div>
                        <div style={{ fontSize: 12, color: '#e8eaf6' }}>{w.card_holder}</div>
                      </div>
                    )}
                    {!isSepa && w.card_number && (
                      <div>
                        <div style={{ fontSize: 10, color: '#4a5068', textTransform: 'uppercase', marginBottom: 2 }}>Número do Cartão</div>
                        <div className="numeric" style={{ fontSize: 12, color: '#e8eaf6', letterSpacing: '0.08em' }}>{w.card_number}</div>
                      </div>
                    )}
                    {isSepa && w.account_name && (
                      <div>
                        <div style={{ fontSize: 10, color: '#4a5068', textTransform: 'uppercase', marginBottom: 2 }}>Titular</div>
                        <div style={{ fontSize: 12, color: '#e8eaf6' }}>{w.account_name}</div>
                      </div>
                    )}
                    {isSepa && w.iban && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ fontSize: 10, color: '#4a5068', textTransform: 'uppercase', marginBottom: 2 }}>IBAN</div>
                        <div className="numeric" style={{ fontSize: 12, color: '#e8eaf6', letterSpacing: '0.05em' }}>{w.iban}</div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 10, color: '#4a5068', textTransform: 'uppercase', marginBottom: 2 }}>Submetido</div>
                      <div style={{ fontSize: 11, color: '#7a8299' }}>{fmtDate(w.created_at)}</div>
                    </div>
                    {w.reviewed_at && (
                      <div>
                        <div style={{ fontSize: 10, color: '#4a5068', textTransform: 'uppercase', marginBottom: 2 }}>Revisto</div>
                        <div style={{ fontSize: 11, color: '#7a8299' }}>{fmtDate(w.reviewed_at)}</div>
                      </div>
                    )}
                    {w.note && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ fontSize: 10, color: '#4a5068', textTransform: 'uppercase', marginBottom: 2 }}>Nota do Cliente</div>
                        <div style={{ fontSize: 12, color: '#7a8299', fontStyle: 'italic' }}>"{w.note}"</div>
                      </div>
                    )}
                    {w.reject_reason && (
                      <div style={{ gridColumn: 'span 2', padding: '8px 10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7 }}>
                        <div style={{ fontSize: 10, color: '#ef4444', textTransform: 'uppercase', marginBottom: 2 }}>Motivo da Rejeição</div>
                        <div style={{ fontSize: 12, color: '#ef4444' }}>{w.reject_reason}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acções (só para pendentes) */}
                {w.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 10, padding: '12px 18px' }}>
                    <button
                      onClick={() => handleReview(w.id, 'approved')}
                      disabled={busy}
                      style={{ flex: 1, padding: '10px', background: busy ? '#1e1e30' : 'rgba(34,197,139,0.12)', border: '1px solid rgba(34,197,139,0.3)', borderRadius: 9, color: '#22c58b', fontSize: 13, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Check size={15} />{busy ? 'A processar…' : 'Aprovar Levantamento'}
                    </button>
                    <button
                      onClick={() => setRejectTarget(w.id)}
                      disabled={busy}
                      style={{ flex: 1, padding: '10px', background: busy ? '#1e1e30' : 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 9, color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <X size={15} />Rejeitar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
