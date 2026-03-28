import { useLang } from '../../context/LangContext';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText, Plus, Trash2, Download, Eye, Copy, CheckCircle,
  Clock, Edit2, X, Save, Building2, Settings, Link, RefreshCw,
  Users, ChevronRight, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const token = () => localStorage.getItem('adminToken');
const authH = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

const STATUS_MAP = {
  pending:  { labelKey: 'adm_ct_pending', color: '#FFBE0B', bg: 'rgba(255,190,11,0.12)',  border: 'rgba(255,190,11,0.3)'  },
  filled:   { labelKey: 'adm_ct_filled',  color: '#3A86FF', bg: 'rgba(58,134,255,0.12)',  border: 'rgba(58,134,255,0.3)'  },
  signed:   { labelKey: 'adm_ct_signed',  color: '#22c58b', bg: 'rgba(34,197,139,0.12)',  border: 'rgba(34,197,139,0.3)'  },
};
const fmtDate = (iso) => iso ? new Date(iso).toLocaleString('pt-PT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

/* ── Modal Gerar Contrato ── */
function GenerateModal({ templates, leads, onClose, onSuccess }) {
  const { t } = useLang();
  const [templateId, setTemplateId] = useState(templates[0]?.id || '');
  const [leadId, setLeadId]         = useState('');
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [loading, setLoading]       = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied]         = useState(false);

  const SITE_URL = BACKEND_URL.replace('/api','').replace(':8001','') || window.location.origin;

  const generate = async () => {
    if (!templateId) { toast.error('Seleccione um modelo'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/contracts/generate`, {
        method: 'POST', headers: authH(),
        body: JSON.stringify({ template_id: templateId, lead_id: leadId || null, preset_name: manualName, preset_email: manualEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      const url = `${SITE_URL}/contract/${data.token}`;
      setGeneratedUrl(url);
      toast.success('Link de contrato gerado!');
      onSuccess();
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inp = { width: '100%', padding: '10px 13px', background: 'hsl(240,18%,12%)', border: '1px solid hsl(240,16%,22%)', borderRadius: 9, color: '#f3f5ff', fontSize: 13, outline: 'none', boxSizing: 'border-box' };

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:300, backdropFilter:'blur(4px)' }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:301, background:'#111118', border:'1px solid rgba(58,134,255,0.3)', borderRadius:20, width:520, maxWidth:'95vw', boxShadow:'0 32px 80px rgba(0,0,0,0.8)' }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid #1e1e30', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, background:'rgba(58,134,255,0.12)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Link size={16} color="#3A86FF" />
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'#f3f5ff' }}>{t('adm_ct_new')}</div>
            <div style={{ fontSize:11, color:'#7a8299' }}>Crie um link único para o cliente assinar</div>
          </div>
          <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#7a8299' }}><X size={18}/></button>
        </div>

        <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 }}>
          {!generatedUrl ? (
            <>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#7a8299', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Modelo de Contrato *</label>
                <select value={templateId} onChange={e => setTemplateId(e.target.value)} style={{ ...inp, appearance:'none' }}>
                  <option value="">Seleccionar modelo…</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#7a8299', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Associar a um Lead (opcional)</label>
                <select value={leadId} onChange={e => { setLeadId(e.target.value); const l = leads.find(x => x.id === e.target.value); if (l) { setManualName(l.full_name||''); setManualEmail(l.email||''); } }} style={{ ...inp, appearance:'none' }}>
                  <option value="">Preencher manualmente…</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.full_name} — {l.email}</option>)}
                </select>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#7a8299', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Nome (pré-preenchido)</label>
                  <input value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Nome do cliente" style={inp} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#7a8299', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Email (pré-preenchido)</label>
                  <input value={manualEmail} onChange={e => setManualEmail(e.target.value)} placeholder="email@exemplo.com" style={inp} />
                </div>
              </div>

              <button onClick={generate} disabled={loading || !templateId}
                style={{ width:'100%', padding:'12px', background: loading ? 'rgba(58,134,255,0.4)' : 'linear-gradient(135deg,#2563eb,#3A86FF)', border:'none', borderRadius:11, color:'#fff', fontSize:14, fontWeight:800, cursor: loading ? 'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:4, boxShadow:'0 4px 16px rgba(58,134,255,0.35)' }}>
                <Link size={15} />{loading ? 'A gerar…' : 'Gerar Link do Contrato'}
              </button>
            </>
          ) : (
            <div style={{ textAlign:'center' }}>
              <div style={{ width:56, height:56, background:'rgba(34,197,139,0.12)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                <CheckCircle size={28} color="#22c58b" />
              </div>
              <div style={{ fontSize:16, fontWeight:800, color:'#f3f5ff', marginBottom:6 }}>Link Gerado!</div>
              <div style={{ fontSize:12, color:'#7a8299', marginBottom:18 }}>Envie este link ao cliente para assinar o contrato</div>

              <div style={{ background:'hsl(240,18%,12%)', border:'1px solid rgba(34,197,139,0.25)', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <span style={{ flex:1, fontSize:12, color:'#22c58b', fontFamily:'monospace', wordBreak:'break-all', textAlign:'left' }}>{generatedUrl}</span>
                <button onClick={copyUrl} style={{ background:'none', border:'none', cursor:'pointer', color: copied ? '#22c58b':'#7a8299', flexShrink:0, transition:'color .2s' }}>
                  {copied ? <CheckCircle size={16}/> : <Copy size={16}/>}
                </button>
              </div>
              <button onClick={copyUrl} style={{ width:'100%', padding:'11px', background:'rgba(34,197,139,0.12)', border:'1px solid rgba(34,197,139,0.3)', borderRadius:10, color:'#22c58b', fontSize:13, fontWeight:700, cursor:'pointer', marginBottom:8 }}>
                {copied ? t('adm_ct_copied_ok') : t('adm_ct_copy_link')}
              </button>
              <button onClick={onClose} style={{ width:'100%', padding:'10px', background:'transparent', border:'1px solid #26263a', borderRadius:10, color:'#7a8299', fontSize:13, cursor:'pointer' }}>Fechar</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Modal Template Editor ── */
function TemplateModal({ template, onClose, onSaved }) {
  const { t } = useLang();
  const [name, setName]     = useState(template?.name || '');
  const [desc, setDesc]     = useState(template?.description || '');
  const [content, setContent] = useState(template?.content || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) { toast.error('Nome obrigatório'); return; }
    setSaving(true);
    try {
      const url = template ? `${BACKEND_URL}/api/admin/contract-templates/${template.id}` : `${BACKEND_URL}/api/admin/contract-templates`;
      const res = await fetch(url, { method: template ? 'PUT':'POST', headers: authH(), body: JSON.stringify({ name, description: desc, content }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      toast.success(template ? 'Modelo actualizado!' : 'Modelo criado!');
      onSaved();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const PLACEHOLDERS = ['{{nome_completo}}','{{email}}','{{telefone}}','{{documento}}','{{valor_investimento}}','{{data}}','{{morada}}','{{empresa_nome}}','{{empresa_morada}}','{{empresa_nif}}','{{assinatura_nome}}'];

  const inp = { width:'100%', padding:'10px 13px', background:'hsl(240,18%,12%)', border:'1px solid hsl(240,16%,22%)', borderRadius:9, color:'#f3f5ff', fontSize:13, outline:'none', boxSizing:'border-box' };

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:300, backdropFilter:'blur(4px)' }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:301, background:'#111118', border:'1px solid rgba(58,134,255,0.3)', borderRadius:20, width:700, maxWidth:'96vw', maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 32px 80px rgba(0,0,0,0.8)' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #1e1e30', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:34, height:34, background:'rgba(58,134,255,0.12)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Edit2 size={15} color="#3A86FF"/>
          </div>
          <div style={{ fontSize:14, fontWeight:700, color:'#f3f5ff' }}>{template ? 'Editar Modelo' : 'Novo Modelo'}</div>
          <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#7a8299' }}><X size={18}/></button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#7a8299', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.08em' }}>Nome do Modelo *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Contrato Padrão" style={inp} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#7a8299', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.08em' }}>Descrição</label>
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descrição opcional" style={inp} />
            </div>
          </div>

          {/* Placeholder chips */}
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#7a8299', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Placeholders disponíveis (clique para inserir)</label>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {PLACEHOLDERS.map(ph => (
                <button key={ph} onClick={() => setContent(c => c + ph)}
                  style={{ padding:'4px 9px', background:'rgba(58,134,255,0.08)', border:'1px solid rgba(58,134,255,0.2)', borderRadius:6, color:'#3A86FF', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'monospace' }}>
                  {ph}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex:1 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#7a8299', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.08em' }}>Conteúdo do Contrato</label>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="Escreva o texto do contrato aqui. Use os placeholders acima para inserir dados dinâmicos..."
              rows={18}
              style={{ ...inp, resize:'vertical', lineHeight:1.6, fontFamily:'inherit' }} />
          </div>
        </div>

        <div style={{ padding:'14px 20px', borderTop:'1px solid #1e1e30', display:'flex', gap:8, flexShrink:0 }}>
          <button onClick={onClose} style={{ flex:1, padding:'10px', background:'transparent', border:'1px solid #26263a', borderRadius:9, color:'#7a8299', fontSize:13, cursor:'pointer' }}>Cancelar</button>
          <button onClick={save} disabled={saving}
            style={{ flex:2, padding:'10px', background:'linear-gradient(135deg,#2563eb,#3A86FF)', border:'none', borderRadius:9, color:'#fff', fontSize:13, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, boxShadow:'0 4px 14px rgba(58,134,255,0.35)' }}>
            <Save size={14}/>{saving ? 'A guardar…' : 'Guardar Modelo'}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Main Component ── */
export default function AdminContracts() {
  const { t } = useLang();
  const [tab, setTab]             = useState('contracts');
  const [contracts, setContracts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [leads, setLeads]         = useState([]);
  const [company, setCompany]     = useState({ name:'', address:'', tax_number:'', email:'', phone:'', legal_text:'', logo_b64:'' });
  const [loading, setLoading]     = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null); // null=closed, false=new, obj=edit
  const [compSaving, setCompSaving] = useState(false);
  const logoRef = useRef();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, tRes, lRes, coRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/contracts`,         { headers: authH() }),
        fetch(`${BACKEND_URL}/api/admin/contract-templates`,{ headers: authH() }),
        fetch(`${BACKEND_URL}/api/admin/users`,             { headers: authH() }),
        fetch(`${BACKEND_URL}/api/admin/company-settings`,  { headers: authH() }),
      ]);
      if (cRes.ok)  setContracts(await cRes.json());
      if (tRes.ok)  setTemplates(await tRes.json());
      if (lRes.ok)  setLeads(await lRes.json());
      if (coRes.ok) setCompany(await coRes.json());
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteContract = async (id) => {
    if (!window.confirm('Eliminar contrato?')) return;
    await fetch(`${BACKEND_URL}/api/admin/contracts/${id}`, { method:'DELETE', headers: authH() });
    setContracts(prev => prev.filter(c => c.id !== id));
    toast.success('Contrato eliminado');
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm('Eliminar modelo?')) return;
    await fetch(`${BACKEND_URL}/api/admin/contract-templates/${id}`, { method:'DELETE', headers: authH() });
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Modelo eliminado');
  };

  const downloadPdf = async (contractId, name) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/contracts/${contractId}/pdf`, { headers: authH() });
      if (!res.ok) { toast.error('PDF não disponível ainda'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `contrato_${name || contractId}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error('Erro ao descarregar PDF'); }
  };

  const copyLink = (tkn) => {
    const SITE_URL = BACKEND_URL.replace('/api','').replace(':8001','') || window.location.origin;
    navigator.clipboard.writeText(`${SITE_URL}/contract/${tkn}`);
    toast.success('Link copiado!');
  };

  const saveCompany = async () => {
    setCompSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/company-settings`, { method:'PUT', headers: authH(), body: JSON.stringify(company) });
      if (!res.ok) throw new Error('Erro ao guardar');
      toast.success('Dados da empresa guardados!');
    } catch (e) { toast.error(e.message); }
    setCompSaving(false);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500000) { toast.error('Logo demasiado grande (máx 500KB)'); return; }
    const reader = new FileReader();
    reader.onload = ev => setCompany(c => ({ ...c, logo_b64: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const TABS = [
    { id:'contracts', icon:FileText, label:t('adm_ct_tab_list'), count: contracts.length },
    { id:'templates', icon:Edit2,    label:t('adm_ct_tab_models'),   count: templates.length },
    { id:'company',   icon:Building2, label:t('adm_ct_tab_company') },
  ];

  const inp = { width:'100%', padding:'10px 13px', background:'hsl(240,18%,12%)', border:'1px solid hsl(240,16%,22%)', borderRadius:9, color:'#f3f5ff', fontSize:13, outline:'none', boxSizing:'border-box' };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-heading)', fontSize:22, fontWeight:800, color:'#f3f5ff', margin:0 }}>{t('adm_ct_title')}</h1>
          <p style={{ fontSize:13, color:'#7a8299', margin:'4px 0 0' }}>{t('adm_ct_subtitle')}</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={load} style={{ padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid #26263a', borderRadius:9, color:'#7a8299', cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:12 }}>
            <RefreshCw size={13}/>Actualizar
          </button>
          {templates.length > 0 && (
            <button onClick={() => setShowGenerate(true)}
              data-testid="generate-contract-btn"
              style={{ padding:'9px 16px', background:'linear-gradient(135deg,#2563eb,#3A86FF)', border:'none', borderRadius:9, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:7, fontSize:13, fontWeight:800, boxShadow:'0 4px 14px rgba(58,134,255,0.35)' }}>
              <Plus size={15}/>Gerar Contrato
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:22, background:'hsl(240,26%,8%)', border:'1px solid hsl(240,16%,18%)', borderRadius:12, padding:4, width:'fit-content' }}>
        {TABS.map(({ id, icon:Icon, label, count }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:9, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background: tab===id ? 'hsl(214,100%,60%)' : 'transparent', color: tab===id ? '#fff' : 'hsl(215,16%,70%)', transition:'all .2s' }}>
            <Icon size={14}/>{label}
            {count !== undefined && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:5, background: tab===id ? 'rgba(255,255,255,0.2)':'rgba(255,255,255,0.06)', color: tab===id ? '#fff':'#7a8299' }}>{count}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:'60px 0', textAlign:'center', color:'#7a8299' }}>
          <div style={{ width:36, height:36, border:'3px solid rgba(58,134,255,0.15)', borderTopColor:'#3A86FF', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
          <p style={{ fontSize:13, margin:0 }}>A carregar…</p>
        </div>
      ) : (
        <>
          {/* ── CONTRATOS TAB ── */}
          {tab === 'contracts' && (
            <div>
              {contracts.length === 0 ? (
                <div style={{ textAlign:'center', padding:'80px 0', color:'#4a5068' }}>
                  <FileText size={48} style={{ opacity:.1, marginBottom:16, display:'block', margin:'0 auto 16px' }}/>
                  <p style={{ fontSize:15, fontWeight:700, margin:'0 0 6px', color:'#3a3d5a' }}>Nenhum contrato gerado ainda</p>
                  <p style={{ fontSize:12, margin:'0 0 20px', color:'#26263a' }}>Clique em "Gerar Contrato" para criar o primeiro</p>
                  {templates.length > 0 && (
                    <button onClick={() => setShowGenerate(true)} style={{ padding:'10px 22px', background:'linear-gradient(135deg,#2563eb,#3A86FF)', border:'none', borderRadius:9, color:'#fff', fontSize:13, fontWeight:800, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:7 }}>
                      <Plus size={14}/>Gerar Primeiro Contrato
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {contracts.map(c => {
                    const ss = STATUS_MAP[c.status] || STATUS_MAP.pending;
                    const SITE_URL = BACKEND_URL.replace('/api','').replace(':8001','') || window.location.origin;
                    const contractUrl = `${SITE_URL}/contract/${c.token}`;
                    return (
                      <div key={c.id} data-testid={`contract-row-${c.id}`}
                        style={{ background:'hsl(240,26%,8%)', border:'1px solid hsl(240,16%,18%)', borderRadius:14, overflow:'hidden', transition:'border-color .2s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = ss.border}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'hsl(240,16%,18%)'}>
                        {/* Linha principal */}
                        <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                          {/* Status bar */}
                          <div style={{ width:4, height:44, background:ss.color, borderRadius:2, flexShrink:0 }} />
                          {/* Icon */}
                          <div style={{ width:38, height:38, background:ss.bg, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <FileText size={16} color={ss.color}/>
                          </div>
                          {/* Info */}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:14, fontWeight:700, color:'#f3f5ff', marginBottom:3 }}>
                              {c.client_name || <span style={{ color:'#4a5068', fontStyle:'italic' }}>Aguarda preenchimento</span>}
                            </div>
                            <div style={{ fontSize:11, color:'#5a6280', display:'flex', gap:10, flexWrap:'wrap' }}>
                              {c.client_email && <span>{c.client_email}</span>}
                              {c.valor && <span style={{ color:'#22c58b', fontWeight:600 }}>€ {c.valor}</span>}
                              <span>{c.template_name}</span>
                              <span>Criado: {fmtDate(c.created_at)}</span>
                              {c.submitted_at && <span style={{ color:'#22c58b' }}>✓ {t('adm_ct_signed')}: {fmtDate(c.submitted_at)}</span>}
                            </div>
                          </div>
                          {/* Status badge */}
                          <span style={{ fontSize:11, padding:'4px 10px', borderRadius:7, background:ss.bg, color:ss.color, border:`1px solid ${ss.border}`, fontWeight:700, flexShrink:0 }}>
                            {t(ss.labelKey)}
                          </span>
                          {/* Actions */}
                          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                            {c.has_pdf && (
                              <button onClick={() => downloadPdf(c.id, c.client_name)}
                                title="Descarregar PDF"
                                style={{ padding:'7px 11px', background:'rgba(34,197,139,0.1)', border:'1px solid rgba(34,197,139,0.25)', borderRadius:8, color:'#22c58b', cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700 }}>
                                <Download size={12}/>PDF
                              </button>
                            )}
                            <button onClick={() => deleteContract(c.id)}
                              title="Eliminar contrato"
                              style={{ padding:'7px 10px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#ef4444', cursor:'pointer' }}>
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        </div>
                        {/* Linha do link — sempre visível */}
                        <div style={{ padding:'10px 18px', background:'rgba(58,134,255,0.04)', borderTop:'1px solid rgba(58,134,255,0.1)', display:'flex', alignItems:'center', gap:10 }}>
                          <Link size={11} color="#3A86FF" style={{ flexShrink:0 }} />
                          <span style={{ fontSize:12, color:'#3A86FF', fontFamily:'monospace', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {contractUrl}
                          </span>
                          <button onClick={() => copyLink(c.token)}
                            data-testid={`copy-link-btn-${c.id}`}
                            style={{ padding:'5px 12px', background:'rgba(58,134,255,0.12)', border:'1px solid rgba(58,134,255,0.3)', borderRadius:7, color:'#3A86FF', cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, flexShrink:0, whiteSpace:'nowrap' }}>
                            <Copy size={11}/>{t('adm_ct_copy_link')}
                          </button>
                          <a href={contractUrl} target="_blank" rel="noreferrer"
                            style={{ padding:'5px 10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:7, color:'#7a8299', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, flexShrink:0, textDecoration:'none' }}>
                            <Eye size={11}/>{t('adm_ct_open')}
                          </a>
                        </div>
                        {/* Linha de Certificação Digital — só para contratos assinados */}
                        {c.status === 'signed' && (c.cert_hash || c.signer_ip) && (
                          <div style={{ padding:'8px 18px', background:'rgba(34,197,139,0.03)', borderTop:'1px solid rgba(34,197,139,0.1)', display:'flex', flexWrap:'wrap', gap:14, alignItems:'center' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                              <CheckCircle size={10} color="#22c58b" style={{ flexShrink:0 }}/>
                              <span style={{ fontSize:10, color:'#4a5068', fontWeight:600 }}>CERTIFICAÇÃO DIGITAL</span>
                            </div>
                            {c.signer_ip && (
                              <span style={{ fontSize:10, color:'#5a6280' }}>
                                <span style={{ color:'#7a8299', fontWeight:600 }}>IP: </span>{c.signer_ip}
                              </span>
                            )}
                            {c.cert_timestamp && (
                              <span style={{ fontSize:10, color:'#5a6280' }}>
                                <span style={{ color:'#7a8299', fontWeight:600 }}>Timestamp: </span>{new Date(c.cert_timestamp).toLocaleString('pt-PT')}
                              </span>
                            )}
                            {c.cert_hash && (
                              <span style={{ fontSize:9, color:'#3a3d5a', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', maxWidth:220, whiteSpace:'nowrap' }} title={c.cert_hash}>
                                <span style={{ color:'#4a5068', fontWeight:600, fontFamily:'inherit' }}>SHA-256: </span>{c.cert_hash.substring(0,20)}…
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── MODELOS TAB ── */}
          {tab === 'templates' && (
            <div>
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
                <button onClick={() => setEditTemplate(false)}
                  data-testid="new-template-btn"
                  style={{ padding:'9px 16px', background:'rgba(58,134,255,0.1)', border:'1px solid rgba(58,134,255,0.25)', borderRadius:9, color:'#3A86FF', cursor:'pointer', display:'flex', alignItems:'center', gap:7, fontSize:13, fontWeight:700 }}>
                  <Plus size={14}/>Novo Modelo
                </button>
              </div>
              {templates.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 0', color:'#4a5068' }}>
                  <Edit2 size={36} style={{ opacity:.1, marginBottom:14, display:'block', margin:'0 auto 14px' }}/>
                  <p style={{ fontSize:14, margin:0, fontWeight:600 }}>Nenhum modelo criado</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {templates.map(t => (
                    <div key={t.id} style={{ background:'hsl(240,26%,8%)', border:'1px solid hsl(240,16%,18%)', borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', gap:14 }}>
                      <div style={{ width:38, height:38, background:'rgba(58,134,255,0.1)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <FileText size={16} color="#3A86FF"/>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:'#f3f5ff' }}>{t.name}</div>
                        {t.description && <div style={{ fontSize:11, color:'#7a8299', marginTop:2 }}>{t.description}</div>}
                        <div style={{ fontSize:10, color:'#3a3d5a', marginTop:3 }}>Criado: {fmtDate(t.created_at)}</div>
                      </div>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => setEditTemplate(t)}
                          style={{ padding:'7px 12px', background:'rgba(58,134,255,0.08)', border:'1px solid rgba(58,134,255,0.2)', borderRadius:8, color:'#3A86FF', cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700 }}>
                          <Edit2 size={12}/>Editar
                        </button>
                        <button onClick={() => deleteTemplate(t.id)}
                          style={{ padding:'7px 10px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#ef4444', cursor:'pointer' }}>
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── EMPRESA TAB ── */}
          {tab === 'company' && (
            <div style={{ maxWidth:680 }}>
              <div style={{ background:'hsl(240,26%,8%)', border:'1px solid hsl(240,16%,18%)', borderRadius:16, padding:28, display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4, paddingBottom:14, borderBottom:'1px solid #1e1e30' }}>
                  <Building2 size={18} color="#3A86FF"/>
                  <div style={{ fontSize:15, fontWeight:700, color:'#f3f5ff' }}>Dados da Empresa</div>
                </div>

                {/* Logo */}
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#7a8299', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.08em' }}>Logótipo da Empresa</label>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    {company.logo_b64 ? (
                      <img src={company.logo_b64} alt="logo" style={{ width:56, height:56, objectFit:'contain', borderRadius:8, border:'1px solid #26263a', background:'#fff', padding:4 }}/>
                    ) : (
                      <div style={{ width:56, height:56, borderRadius:8, border:'1px dashed #26263a', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Building2 size={22} color="#3a3d5a"/>
                      </div>
                    )}
                    <div>
                      <button onClick={() => logoRef.current?.click()} style={{ padding:'7px 14px', background:'rgba(58,134,255,0.1)', border:'1px solid rgba(58,134,255,0.25)', borderRadius:8, color:'#3A86FF', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                        {company.logo_b64 ? 'Alterar logo' : 'Carregar logo'}
                      </button>
                      {company.logo_b64 && (
                        <button onClick={() => setCompany(c => ({...c, logo_b64:''}))} style={{ marginLeft:8, padding:'7px 10px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#ef4444', cursor:'pointer', fontSize:12 }}>Remover</button>
                      )}
                      <div style={{ fontSize:10, color:'#4a5068', marginTop:4 }}>PNG, JPG — máx 500KB</div>
                    </div>
                    <input ref={logoRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleLogoUpload}/>
                  </div>
                </div>

                {[
                  ['Nome da Empresa *', 'name', 'EuroVault Investments'],
                  ['Morada', 'address', 'Av. Dom João II, N.º 35, Piso 7C, Parque das Nações, Lisboa'],
                  ['NIF / Número Fiscal', 'tax_number', 'JP-999888777'],
                  ['Email', 'email', 'suporte@eurovault.eu'],
                  ['Telefone', 'phone', '+351 21 000 0000'],
                ].map(([label, field, ph]) => (
                  <div key={field}>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#7a8299', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</label>
                    <input value={company[field] || ''} onChange={e => setCompany(c => ({...c, [field]: e.target.value}))} placeholder={ph} style={inp} />
                  </div>
                ))}

                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#7a8299', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.08em' }}>Texto Legal (rodapé do contrato)</label>
                  <textarea value={company.legal_text || ''} onChange={e => setCompany(c => ({...c, legal_text: e.target.value}))}
                    placeholder="Ex: Registada na IFSB Reg. No. JP-999888777 · MiFID II · Investment Firm Class III..."
                    rows={3} style={{ ...inp, resize:'vertical', lineHeight:1.6 }} />
                </div>

                <button onClick={saveCompany} disabled={compSaving}
                  style={{ padding:'12px', background:'linear-gradient(135deg,#2563eb,#3A86FF)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 4px 14px rgba(58,134,255,0.35)', marginTop:4 }}>
                  <Save size={15}/>{compSaving ? 'A guardar…' : 'Guardar Dados da Empresa'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showGenerate && (
        <GenerateModal templates={templates} leads={leads}
          onClose={() => setShowGenerate(false)}
          onSuccess={() => { load(); }} />
      )}
      {editTemplate !== null && (
        <TemplateModal template={editTemplate || null}
          onClose={() => setEditTemplate(null)}
          onSaved={() => { load(); setEditTemplate(null); }} />
      )}
    </div>
  );
}
