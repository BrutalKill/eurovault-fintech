import React, { useState } from 'react';
import { User, Lock, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '../context/UserContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const COUNTRIES = ['Portugal','Espanha','França','Alemanha','Itália','Países Baixos','Bélgica','Suícia','Suécia','Noruega','Dinamarca','Brasil','Reino Unido','Outro'];

export default function ProfilePage() {
  const { user, fetchUser } = useUser();
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '', country: user?.country || 'Portugal' });
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) setForm({ full_name: user.full_name || '', phone: user.phone || '', country: user.country || 'Portugal' });
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Erro ao atualizar');
      await fetchUser();
      toast.success('Perfil atualizado com sucesso!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatEur = (val) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val || 0);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#f3f5ff', marginBottom: 4 }}>Meu Perfil</h1>
        <p style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>Gira os dados da sua conta</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 20 }} className="profile-grid">
        <style>{`@media (max-width: 900px) { .profile-grid { grid-template-columns: 1fr !important; } }`}</style>

        {/* Profile form */}
        <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, background: 'hsl(214,100%,60%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff' }}>
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div data-testid="profile-name" style={{ fontSize: 16, fontWeight: 700, color: '#f3f5ff' }}>{user?.full_name}</div>
              <div data-testid="profile-email" style={{ fontSize: 12, color: 'hsl(215,16%,70%)' }}>{user?.email}</div>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nome Completo</label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                style={{ width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
              <input
                type="email" disabled
                value={user?.email || ''}
                style={{ width: '100%', padding: '11px 14px', background: 'hsl(240,18%,10%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 10, color: 'hsl(215,16%,50%)', fontSize: 14, outline: 'none', boxSizing: 'border-box', cursor: 'not-allowed' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Telefone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+351 912 345 678"
                style={{ width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(215,16%,70%)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>País</label>
              <select
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
                style={{ width: '100%', padding: '11px 14px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 10, color: '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              >
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <button
              data-testid="profile-save-button"
              type="submit" disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 24px', background: loading ? 'hsl(214,100%,60%,0.4)' : 'hsl(214,100%,60%)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              <Save size={15} />
              {loading ? 'A guardar...' : 'Guardar Alterações'}
            </button>
          </form>
        </div>

        {/* Account summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 12, color: 'hsl(215,16%,70%)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Resumo da Conta</div>

            {[
              { label: 'Saldo', value: formatEur(user?.balance), color: '#f3f5ff' },
              { label: 'P/L', value: `${(user?.profit || 0) >= 0 ? '+' : ''}${formatEur(user?.profit)}`, color: (user?.profit || 0) >= 0 ? 'hsl(155,72%,45%)' : 'hsl(0,78%,54%)' },
              { label: 'Status', value: user?.status || 'Novo', color: 'hsl(214,100%,60%)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid hsl(240,16%,18%)' }}>
                <span style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>{label}</span>
                <span className="numeric" style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'hsl(215,16%,70%)' }}>Membro desde</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f3f5ff' }}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-PT') : '-'}
              </span>
            </div>
          </div>

          <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(0,78%,54%,0.2)', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <AlertTriangle size={14} color="hsl(36,95%,55%)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(36,95%,55%)' }}>Zona de Perigo</span>
            </div>
            <p style={{ fontSize: 12, color: 'hsl(215,16%,70%)', marginBottom: 12, lineHeight: 1.5 }}>Encerrar a conta removerá permanentemente todos os dados associados.</p>
            <button
              data-testid="profile-change-password-button"
              style={{ width: '100%', padding: '9px', background: 'transparent', border: '1px solid hsl(0,78%,54%,0.4)', borderRadius: 9, color: 'hsl(0,78%,54%)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Solicitar Encerramento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
