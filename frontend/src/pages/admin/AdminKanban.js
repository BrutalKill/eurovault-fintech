import { useLang } from '../../context/LangContext';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Globe, CreditCard, Clock, ChevronRight,
  RefreshCw, LayoutGrid, Filter, Search, Tag
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const token = () => localStorage.getItem('adminToken');
const authH = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

const fmt = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso), now = new Date();
  const diff = Math.floor((now - d) / 60000);
  if (diff < 2)    return 'Agora';
  if (diff < 60)   return `${diff}m`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
};

// ── Colunas do funil de vendas ───────────────────────────────────────────────
const COLUMNS = [
  { id: 'Novo',         label: 'Novo',        color: '#3A86FF', bg: 'rgba(58,134,255,0.1)',  border: 'rgba(58,134,255,0.25)'  },
  { id: 'Contactado',   label: 'Contactado',  color: '#a855f7', bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.25)'  },
  { id: 'Interessado',  label: 'Interessado', color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.25)'  },
  { id: 'Call Later',   label: 'Call Later',  color: '#FFBE0B', bg: 'rgba(255,190,11,0.1)',  border: 'rgba(255,190,11,0.25)'  },
  { id: 'Depositado',   label: 'Depositado',  color: '#22c58b', bg: 'rgba(34,197,139,0.1)',  border: 'rgba(34,197,139,0.25)'  },
  { id: 'VIP',          label: 'VIP',         color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)'  },
];

const OTHER_STATUSES = ['No Answer', 'Low Potential', 'Sem Interesse', 'Bloqueado'];

const TAG_COLORS = {
  'VIP': '#F59E0B', 'Alta Prioridade': '#ef4444',
  'Precisa Mais Info': '#3A86FF', 'Quente': '#f97316',
  'Frio': '#7a8299', 'Aguarda Doc.': '#22c58b',
};

// ── Card individual do lead ──────────────────────────────────────────────────
function LeadCard({ lead, columnColor, onDragStart, onClick }) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        setIsDragging(true);
        onDragStart(e, lead);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => setIsDragging(false)}
      onClick={() => onClick(lead)}
      data-testid={`kanban-card-${lead.id}`}
      style={{
        background: isDragging ? 'rgba(58,134,255,0.08)' : 'hsl(240,26%,9%)',
        border: `1px solid ${isDragging ? columnColor + '60' : 'hsl(240,16%,18%)'}`,
        borderRadius: 11, padding: '12px 14px',
        cursor: 'grab', marginBottom: 8, transition: 'all .15s',
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isDragging ? `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${columnColor}40` : 'none',
        userSelect: 'none',
      }}
      onMouseEnter={e => { if (!isDragging) e.currentTarget.style.borderColor = columnColor + '40'; }}
      onMouseLeave={e => { if (!isDragging) e.currentTarget.style.borderColor = 'hsl(240,16%,18%)'; }}
    >
      {/* Nome + online indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${columnColor}25`, border: `1.5px solid ${columnColor}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: columnColor }}>
            {lead.full_name?.[0]?.toUpperCase()}
          </div>
          {lead.is_online && (
            <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: '#22c58b', border: '1.5px solid hsl(240,26%,9%)' }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f3f5ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.full_name}</div>
          <div style={{ fontSize: 10, color: '#5a6280', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Globe size={8}/>{lead.country || '—'}
          </div>
        </div>
      </div>

      {/* Saldo */}
      {lead.balance > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', background: 'rgba(34,197,139,0.07)', border: '1px solid rgba(34,197,139,0.15)', borderRadius: 6, marginBottom: 6 }}>
          <CreditCard size={9} color="#22c58b"/>
          <span className="numeric" style={{ fontSize: 11, fontWeight: 800, color: '#22c58b' }}>{fmt(lead.balance)}</span>
        </div>
      )}

      {/* Tags */}
      {lead.tags && lead.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 5 }}>
          {lead.tags.slice(0, 2).map(t => (
            <span key={t} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 6, background: `${TAG_COLORS[t] || '#a0a0c0'}15`, color: TAG_COLORS[t] || '#a0a0c0', fontWeight: 700, border: `1px solid ${TAG_COLORS[t] || '#a0a0c0'}30` }}>{t}</span>
          ))}
          {lead.tags.length > 2 && <span style={{ fontSize: 9, color: '#4a5068' }}>+{lead.tags.length - 2}</span>}
        </div>
      )}

      {/* Rodapé */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 9, color: '#3a3d5a', display: 'flex', alignItems: 'center', gap: 3 }}>
          <Clock size={8}/>{fmtDate(lead.created_at)}
        </div>
        <ChevronRight size={10} color="#3a3d5a"/>
      </div>
    </div>
  );
}

// ── Coluna do Kanban ─────────────────────────────────────────────────────────
function KanbanColumn({ column, leads, onDrop, onDragStart, onDragOver, onDragLeave, isDragOver, onCardClick }) {
  const totalBalance = leads.reduce((s, l) => s + (l.balance || 0), 0);

  return (
    <div style={{ flexShrink: 0, width: 220, display: 'flex', flexDirection: 'column' }}>
      {/* Header da coluna */}
      <div style={{ padding: '10px 12px', background: column.bg, border: `1px solid ${column.border}`, borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: column.color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 800, color: column.color, flex: 1 }}>{column.label}</span>
        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', background: `${column.color}25`, border: `1px solid ${column.color}40`, borderRadius: 10, color: column.color }}>{leads.length}</span>
      </div>

      {/* Saldo total da coluna */}
      {totalBalance > 0 && (
        <div style={{ padding: '4px 12px', background: column.bg, borderLeft: `1px solid ${column.border}`, borderRight: `1px solid ${column.border}` }}>
          <span className="numeric" style={{ fontSize: 10, color: column.color, fontWeight: 700 }}>{fmt(totalBalance)}</span>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); onDragOver(column.id); }}
        onDragLeave={onDragLeave}
        onDrop={(e) => { e.preventDefault(); onDrop(column.id); }}
        style={{
          flex: 1, minHeight: 120, padding: '8px',
          background: isDragOver ? `${column.color}08` : 'hsl(240,26%,7%)',
          border: `1px solid ${isDragOver ? column.color + '50' : 'hsl(240,16%,16%)'}`,
          borderTop: 'none', borderRadius: '0 0 12px 12px',
          transition: 'background .15s, border-color .15s',
          boxShadow: isDragOver ? `inset 0 0 20px ${column.color}10` : 'none',
        }}
      >
        {leads.length === 0 ? (
          <div style={{ padding: '20px 8px', textAlign: 'center', color: '#26263a', fontSize: 11 }}>
            {isDragOver ? <span style={{ color: column.color, fontWeight: 600 }}>Largar aqui →</span> : 'Sem leads'}
          </div>
        ) : (
          leads.map(lead => (
            <LeadCard key={lead.id} lead={lead} columnColor={column.color}
              onDragStart={onDragStart} onClick={onCardClick} />
          ))
        )}
        {isDragOver && leads.length > 0 && (
          <div style={{ padding: '10px', border: `2px dashed ${column.color}60`, borderRadius: 9, textAlign: 'center', color: column.color, fontSize: 11, fontWeight: 600 }}>
            Largar aqui
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página Principal ─────────────────────────────────────────────────────────
export default function AdminKanban() {
  const { t } = useLang();
  const navigate   = useNavigate();
  const [leads, setLeads]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [dragLead, setDragLead] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [showOthers, setShowOthers] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users`, { headers: authH() });
      if (res.ok) setLeads(await res.json());
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (leadId, newStatus) => {
    try {
      await fetch(`${BACKEND_URL}/api/admin/users/${leadId}/status`, {
        method: 'PUT', headers: authH(),
        body: JSON.stringify({ status: newStatus }),
      });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      toast.success(`→ ${newStatus}`);
    } catch (_) { toast.error('Erro ao actualizar'); }
  };

  const handleDrop = (targetColId) => {
    if (!dragLead) return;
    if (dragLead.status === targetColId) { setDragOver(null); setDragLead(null); return; }
    updateStatus(dragLead.id, targetColId);
    setDragOver(null);
    setDragLead(null);
  };

  // Filtrar leads
  const filtered = leads.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.full_name?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) || l.country?.toLowerCase().includes(q);
  });

  // Agrupar por coluna
  const grouped = {};
  COLUMNS.forEach(c => { grouped[c.id] = []; });
  grouped['_others'] = [];
  filtered.forEach(l => {
    if (grouped[l.status] !== undefined) grouped[l.status].push(l);
    else grouped['_others'].push(l);
  });

  const totalLeads     = leads.length;
  const totalDeposited = leads.filter(l => l.status === 'Depositado').length;
  const totalBalance   = leads.reduce((s, l) => s + (l.balance || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px - 48px)', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexShrink: 0, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, color: '#f3f5ff', margin: 0 }}>{t('adm_kb_title')}</h1>
          <p style={{ fontSize: 12, color: '#7a8299', margin: '2px 0 0' }}>{t('adm_kb_subtitle')}</p>
        </div>
        <div style={{ flex: 1 }} />

        {/* Stats rápidas */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: t('adm_kb_total'),     value: totalLeads, color: '#7a8299' },
            { label: t('adm_kb_deposited'), value: totalDeposited, color: '#22c58b' },
            { label: t('adm_kb_capital'),   value: fmt(totalBalance), color: '#22c58b' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding: '6px 12px', background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 9, textAlign: 'center' }}>
              <div className="numeric" style={{ fontSize: 14, fontWeight: 800, color, fontFamily: 'var(--font-heading)' }}>{value}</div>
              <div style={{ fontSize: 9, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Pesquisa */}
        <div style={{ position: 'relative' }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#4a5068' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar leads…"
            style={{ padding: '8px 12px 8px 28px', background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 9, color: '#f3f5ff', fontSize: 12, outline: 'none', width: 180 }}/>
        </div>

        <button onClick={load} style={{ padding: '8px 12px', background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 9, color: '#7a8299', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
          <RefreshCw size={13} style={loading ? { animation: 'spin .8s linear infinite' } : {}}/>Actualizar
        </button>

        <button onClick={() => navigate('/adm')} style={{ padding: '8px 12px', background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 9, color: '#7a8299', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
          <LayoutGrid size={13}/>Tabela
        </button>
      </div>

      {/* Board */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', paddingBottom: 8 }}>
        <div style={{ display: 'flex', gap: 12, height: '100%', minWidth: 'max-content', paddingRight: 8 }}>
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              column={col}
              leads={grouped[col.id] || []}
              isDragOver={dragOver === col.id}
              onDragStart={(e, lead) => setDragLead(lead)}
              onDragOver={(colId) => setDragOver(colId)}
              onDragLeave={() => setDragOver(null)}
              onDrop={handleDrop}
              onCardClick={(lead) => navigate('/adm', { state: { openLead: lead.id } })}
            />
          ))}

          {/* Coluna "Outros" (estados não principais) */}
          {grouped['_others'].length > 0 && (
            <div style={{ flexShrink: 0, width: 220 }}>
              <button onClick={() => setShowOthers(o => !o)}
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid hsl(240,16%,18%)', borderRadius: showOthers ? '12px 12px 0 0' : 12, color: '#5a6280', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 0 }}>
                <Filter size={12}/>
                Outros ({grouped['_others'].length})
                <span style={{ marginLeft: 'auto', fontSize: 10, transform: showOthers ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
              </button>
              {showOthers && (
                <div style={{ background: 'hsl(240,26%,7%)', border: '1px solid hsl(240,16%,16%)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: 8 }}>
                  {grouped['_others'].map(lead => (
                    <LeadCard key={lead.id} lead={lead} columnColor="#7a8299"
                      onDragStart={(e, l) => setDragLead(l)}
                      onClick={(l) => navigate('/adm', { state: { openLead: l.id } })}/>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
