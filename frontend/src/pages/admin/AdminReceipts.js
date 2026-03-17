import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Download, Building2, Eraser, User, Euro,
  Calendar, StickyNote, Save, RefreshCw, CheckCircle,
  Upload, X, AlertCircle, Shield, EyeOff, Lock
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });
const inp = {
  width: '100%', padding: '10px 13px', background: 'hsl(240,18%,12%)',
  border: '1px solid hsl(240,16%,22%)', borderRadius: 9, color: '#f3f5ff',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

/* ── Formulário partilhado pelos dois geradores ── */
function ReceiptForm({ onGenerate, loading, endpoint, providerOk }) {
  const [form, setForm] = useState({ client_name: '', value: '', date: '', notes: '' });
  const fmtToday = () => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  };
  useEffect(() => { setForm(f => ({ ...f, date: fmtToday() })); }, []);

  const go = async () => {
    if (!form.client_name.trim()) { toast.error('Indique o nome do cliente'); return; }
    if (!form.value.trim())       { toast.error('Indique o valor'); return; }
    if (!providerOk)              { toast.error('Configure os Dados do Prestador primeiro'); return; }
    await onGenerate(form, endpoint);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7a8299', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <User size={10} style={{ marginRight: 5 }}/>Nome do Cliente *
        </label>
        <input value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})}
          placeholder="Nome completo do cliente / contratante" style={inp}
          onFocus={e => e.target.style.borderColor='rgba(58,134,255,0.5)'}
          onBlur={e => e.target.style.borderColor='hsl(240,16%,22%)'}/>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7a8299', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <Euro size={10} style={{ marginRight: 5 }}/>Valor (€) *
          </label>
          <input value={form.value} onChange={e => setForm({...form, value: e.target.value})}
            placeholder="0.00" inputMode="decimal" style={inp}
            onFocus={e => e.target.style.borderColor='rgba(34,197,139,0.5)'}
            onBlur={e => e.target.style.borderColor='hsl(240,16%,22%)'}/>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7a8299', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <Calendar size={10} style={{ marginRight: 5 }}/>Data
          </label>
          <input value={form.date} onChange={e => setForm({...form, date: e.target.value})}
            placeholder="DD/MM/AAAA" style={inp}
            onFocus={e => e.target.style.borderColor='rgba(58,134,255,0.5)'}
            onBlur={e => e.target.style.borderColor='hsl(240,16%,22%)'}/>
        </div>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7a8299', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <StickyNote size={10} style={{ marginRight: 5 }}/>Notas (opcional)
        </label>
        <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
          placeholder="Informações adicionais..." rows={2}
          style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}/>
      </div>

      <button onClick={go} disabled={loading || !providerOk}
        style={{ width: '100%', padding: '13px', background: loading || !providerOk ? 'rgba(58,134,255,0.25)' : 'linear-gradient(135deg,#2563eb,#3A86FF)', border: 'none', borderRadius: 11, color: '#fff', fontSize: 14, fontWeight: 800, cursor: loading || !providerOk ? 'not-allowed':'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: loading || !providerOk ? 'none':'0 4px 16px rgba(58,134,255,0.35)', marginTop: 4 }}>
        {loading
          ? <><RefreshCw size={15} style={{ animation: 'spin .8s linear infinite' }}/>A gerar PDF…</>
          : <><Download size={15}/>Gerar e Descarregar PDF</>}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MODELO 1 — RECIBO CLIENTE (COM MARCA)
═══════════════════════════════════════════ */
function TabCliente({ provider, loading, onGenerate }) {
  const providerOk = !!(provider.name && provider.nif && provider.address);

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Badge de identidade */}
      <div style={{ display: 'flex', gap: 12, padding: '14px 18px', background: 'rgba(58,134,255,0.08)', border: '1px solid rgba(58,134,255,0.2)', borderRadius: 12, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, background: 'rgba(58,134,255,0.15)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Shield size={18} color="#3A86FF"/>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#3A86FF', marginBottom: 3 }}>Documento Comercial — Para o Cliente</div>
          <div style={{ fontSize: 11, color: '#5a6280', lineHeight: 1.5 }}>
            Contém logo EuroVault, marca d'água e design premium.<br/>
            <span style={{ color: '#3A86FF' }}>Serve para dar confiança ao cliente.</span>
          </div>
        </div>
      </div>

      {/* Preview do prestador configurado */}
      {providerOk ? (
        <div style={{ display: 'flex', gap: 8, padding: '9px 13px', background: 'rgba(34,197,139,0.06)', border: '1px solid rgba(34,197,139,0.18)', borderRadius: 9, marginBottom: 18 }}>
          <CheckCircle size={13} color="#22c58b" style={{ flexShrink: 0, marginTop: 1 }}/>
          <span style={{ fontSize: 11, color: '#22c58b' }}>
            <b>{provider.name}</b> · NIF: {provider.nif} · {provider.address}
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, padding: '9px 13px', background: 'rgba(255,190,11,0.07)', border: '1px solid rgba(255,190,11,0.2)', borderRadius: 9, marginBottom: 18 }}>
          <AlertCircle size={13} color="#FFBE0B" style={{ flexShrink: 0, marginTop: 1 }}/>
          <span style={{ fontSize: 11, color: '#FFBE0B' }}>Configure os <b>Dados do Prestador</b> primeiro.</span>
        </div>
      )}

      <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, paddingBottom: 12, borderBottom: '1px solid #1e1e30' }}>
          <FileText size={16} color="#3A86FF"/>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>Gerar Recibo com Marca EuroVault</div>
            <div style={{ fontSize: 10, color: '#7a8299' }}>Logo + Marca d'água + Design premium · Objeto: Consultoria Tecnológica</div>
          </div>
        </div>

        {/* Preview do conteúdo */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1e1e30', borderRadius: 8, padding: '10px 13px', fontSize: 11, color: '#5a6280', lineHeight: 1.7 }}>
          <div><span style={{ color: '#7a8299', fontWeight: 600 }}>Título:</span> Contrato de Prestação de Serviços de Consultoria Tecnológica e Licenciamento</div>
          <div><span style={{ color: '#7a8299', fontWeight: 600 }}>Objeto:</span> Prestação de serviços de consultoria em análise de dados financeiros e licenciamento temporário de software.</div>
          <div><span style={{ color: '#FFBE0B', fontWeight: 600 }}>Cláusula:</span> Serviço integralmente prestado na disponibilização de credenciais ou consultoria telemática…</div>
        </div>

        <ReceiptForm onGenerate={onGenerate} loading={loading} endpoint="generate-receipt" providerOk={providerOk} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MODELO 2 — DOCUMENTO BANCO (NEUTRO)
═══════════════════════════════════════════ */
function TabBanco({ provider, loading, onGenerate }) {
  const providerOk = !!(provider.name && provider.nif && provider.address);

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Badge de alerta/segurança */}
      <div style={{ display: 'flex', gap: 12, padding: '14px 18px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 12, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, background: 'rgba(239,68,68,0.12)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <EyeOff size={18} color="#ef4444"/>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 3 }}>Documento Neutro — Para o Banco</div>
          <div style={{ fontSize: 11, color: '#5a6280', lineHeight: 1.5 }}>
            <span style={{ color: '#ef4444', fontWeight: 600 }}>ZERO referência à EuroVault</span> — sem logo, sem cores, sem marca d'água.<br/>
            Aparência de documento Word simples. Prestador independente. Ficheiro: <code style={{ background: '#1e1e30', padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>prestacao_servicos.pdf</code>
          </div>
        </div>
      </div>

      {/* Checklist de segurança */}
      <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Variáveis de segurança activas</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {[
            '✓ Zero logo EuroVault',
            '✓ Zero marca d\'água',
            '✓ Zero cores da plataforma',
            '✓ Zero links ou referências',
            '✓ Texto preto/branco puro',
            '✓ Nome genérico do ficheiro',
          ].map(item => (
            <div key={item} style={{ fontSize: 10, color: '#22c58b', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Lock size={8} color="#22c58b"/>{item}
            </div>
          ))}
        </div>
      </div>

      {/* Preview do prestador */}
      {providerOk ? (
        <div style={{ display: 'flex', gap: 8, padding: '9px 13px', background: 'rgba(34,197,139,0.06)', border: '1px solid rgba(34,197,139,0.18)', borderRadius: 9, marginBottom: 18 }}>
          <CheckCircle size={13} color="#22c58b" style={{ flexShrink: 0, marginTop: 1 }}/>
          <span style={{ fontSize: 11, color: '#22c58b' }}>Cabeçalho apenas com: <b>{provider.name}</b> · NIF: {provider.nif}</span>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, padding: '9px 13px', background: 'rgba(255,190,11,0.07)', border: '1px solid rgba(255,190,11,0.2)', borderRadius: 9, marginBottom: 18 }}>
          <AlertCircle size={13} color="#FFBE0B" style={{ flexShrink: 0, marginTop: 1 }}/>
          <span style={{ fontSize: 11, color: '#FFBE0B' }}>Configure os <b>Dados do Prestador</b> primeiro.</span>
        </div>
      )}

      <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, paddingBottom: 12, borderBottom: '1px solid #1e1e30' }}>
          <EyeOff size={16} color="#ef4444"/>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>Gerar Documento Neutro (Banco)</div>
            <div style={{ fontSize: 10, color: '#7a8299' }}>Preto/branco puro · Prestador independente · Nome genérico</div>
          </div>
        </div>

        {/* Preview do conteúdo */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1e1e30', borderRadius: 8, padding: '10px 13px', fontSize: 11, color: '#5a6280', lineHeight: 1.7 }}>
          <div><span style={{ color: '#7a8299', fontWeight: 600 }}>Cabeçalho:</span> Apenas Nome do Prestador + NIF + Morada</div>
          <div><span style={{ color: '#7a8299', fontWeight: 600 }}>Serviço:</span> Serviços de consultoria em informática, licenciamento de software e suporte técnico remoto.</div>
          <div><span style={{ color: '#FFBE0B', fontWeight: 600 }}>Cláusula:</span> Serviço prestado via meios telemáticos, sem direito de arrependimento...</div>
          <div><span style={{ color: '#ef4444', fontWeight: 600 }}>Ficheiro:</span> prestacao_servicos.pdf</div>
        </div>

        <ReceiptForm onGenerate={onGenerate} loading={loading} endpoint="generate-receipt-bank" providerOk={providerOk} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   LIMPEZA EXIF
═══════════════════════════════════════════ */
function TabExif() {
  const [file, setFile]   = useState(null);
  const [preview, setPrev] = useState(null);
  const [loading, setLoad] = useState(false);
  const [done, setDone]   = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) { toast.error('Máx. 20MB'); return; }
    setFile(f); setDone(false);
    const r = new FileReader();
    r.onload = ev => setPrev(ev.target.result);
    r.readAsDataURL(f);
  };

  const clean = async () => {
    if (!file) return;
    setLoad(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${BACKEND_URL}/api/admin/clean-image`, { method:'POST', headers:authH(), body:fd });
      if (!res.ok) throw new Error((await res.json()).detail || 'Erro');
      const blob = await res.blob();
      const disp = res.headers.get('Content-Disposition') || '';
      const nm   = (disp.match(/filename="(.+?)"/) || [])[1] || 'doc_limpo.jpg';
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = nm; a.click();
      URL.revokeObjectURL(url);
      setDone(true);
      toast.success('Metadados EXIF removidos! Ficheiro renomeado.');
    } catch (e) { toast.error(e.message); }
    setLoad(false);
  };

  const reset = () => { setFile(null); setPrev(null); setDone(false); if (fileRef.current) fileRef.current.value=''; };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, paddingBottom: 12, borderBottom: '1px solid #1e1e30' }}>
          <Eraser size={16} color="#FFBE0B"/>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>Sanitização de Metadados EXIF</div>
            <div style={{ fontSize: 10, color: '#7a8299' }}>Remove GPS, data, dispositivo e software de imagens WhatsApp</div>
          </div>
        </div>

        <div style={{ background:'rgba(255,190,11,0.05)', border:'1px solid rgba(255,190,11,0.15)', borderRadius:9, padding:'9px 13px', display:'flex', gap:8 }}>
          <AlertCircle size={12} color="#FFBE0B" style={{ flexShrink:0, marginTop:2 }}/>
          <span style={{ fontSize:11, color:'#FFBE0B', lineHeight:1.6 }}>Comprovantes do WhatsApp podem ter GPS e data/hora originais nos metadados. Esta função remove tudo e renomeia o ficheiro para eliminar rastreio.</span>
        </div>

        <div onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f=e.dataTransfer.files[0]; if(f){handleFile({target:{files:[f]}});} }}
          style={{ border:`2px dashed ${file ? 'rgba(34,197,139,0.4)':'rgba(255,255,255,0.1)'}`, borderRadius:11, padding:'24px 20px', textAlign:'center', cursor:'pointer', background: file?'rgba(34,197,139,0.03)':'rgba(255,255,255,0.02)', transition:'all .2s' }}>
          {preview ? (
            <div>
              <img src={preview} alt="preview" style={{ maxHeight:120, maxWidth:'100%', borderRadius:7, objectFit:'contain', marginBottom:8 }}/>
              <div style={{ fontSize:12, color:'#22c58b', fontWeight:600 }}>{file.name}</div>
              <div style={{ fontSize:10, color:'#4a5068' }}>{(file.size/1024).toFixed(1)} KB</div>
            </div>
          ) : (
            <>
              <Upload size={26} color="#4a5068" style={{ marginBottom:8 }}/>
              <div style={{ fontSize:13, fontWeight:600, color:'#7a8299' }}>Clique ou arraste a imagem</div>
              <div style={{ fontSize:11, color:'#4a5068', marginTop:3 }}>JPG · PNG · WebP · máx. 20MB</div>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFile} style={{ display:'none' }}/>

        {done && (
          <div style={{ display:'flex', gap:9, padding:'10px 14px', background:'rgba(34,197,139,0.08)', border:'1px solid rgba(34,197,139,0.25)', borderRadius:9 }}>
            <CheckCircle size={14} color="#22c58b" style={{ flexShrink:0 }}/>
            <div style={{ fontSize:12, color:'#22c58b', fontWeight:600 }}>Imagem limpa! EXIF removido, ficheiro renomeado sem rastreio.</div>
          </div>
        )}

        <div style={{ display:'flex', gap:9 }}>
          {file && <button onClick={reset} style={{ padding:'10px 14px', background:'transparent', border:'1px solid #26263a', borderRadius:9, color:'#7a8299', fontSize:12, cursor:'pointer' }}>Limpar</button>}
          <button onClick={clean} disabled={!file||loading}
            style={{ flex:1, padding:'12px', background:!file||loading?'rgba(217,119,6,0.2)':'linear-gradient(135deg,#b45309,#D97706)', border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:800, cursor:!file||loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:!file?'none':'0 4px 12px rgba(217,119,6,0.3)' }}>
            {loading
              ? <><RefreshCw size={14} style={{ animation:'spin .8s linear infinite' }}/>A limpar…</>
              : <><Eraser size={14}/>Remover Metadados e Descarregar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DADOS DO PRESTADOR
═══════════════════════════════════════════ */
function TabProvider({ provider, setProvider }) {
  const [form, setForm]   = useState({ name:'', nif:'', address:'', signature_name:'' });
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm({ name:provider.name||'', nif:provider.nif||'', address:provider.address||'', signature_name:provider.signature_name||'' }); }, [provider]);

  const save = async () => {
    if (!form.name.trim()||!form.nif.trim()||!form.address.trim()) { toast.error('Preencha nome, NIF e morada'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/receipt-provider`, { method:'PUT', headers:{...authH(),'Content-Type':'application/json'}, body:JSON.stringify(form) });
      if (!res.ok) throw new Error('Erro');
      setProvider(form);
      toast.success('Dados do prestador guardados!');
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ background:'hsl(240,26%,8%)', border:'1px solid hsl(240,16%,18%)', borderRadius:14, padding:'20px 22px', display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, paddingBottom:12, borderBottom:'1px solid #1e1e30' }}>
          <Building2 size={16} color="#3A86FF"/>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#f3f5ff' }}>Dados do Prestador de Serviços (Laranja)</div>
            <div style={{ fontSize:10, color:'#7a8299' }}>Aparecem em ambos os documentos como titular da conta IBAN</div>
          </div>
        </div>

        <div style={{ background:'rgba(58,134,255,0.05)', border:'1px solid rgba(58,134,255,0.15)', borderRadius:9, padding:'9px 13px', display:'flex', gap:8 }}>
          <Shield size={12} color="#3A86FF" style={{ flexShrink:0, marginTop:1 }}/>
          <span style={{ fontSize:11, color:'#3A86FF', lineHeight:1.6 }}>Estes dados identificam o titular da conta no documento. Certifique-se de que correspondem exactamente ao titular do IBAN.</span>
        </div>

        {[
          ['Nome Completo / Razão Social *', 'name', 'João Manuel da Silva'],
          ['NIF *', 'nif', '123 456 789'],
          ['Morada Completa *', 'address', 'Rua das Flores 10, 1000-000 Lisboa'],
          ['Nome para Assinatura Digital', 'signature_name', 'Nome que aparece na assinatura'],
        ].map(([label, field, ph]) => (
          <div key={field}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#7a8299', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</label>
            <input value={form[field]} onChange={e => setForm({...form,[field]:e.target.value})} placeholder={ph} style={inp}
              onFocus={e => e.target.style.borderColor='rgba(58,134,255,0.5)'}
              onBlur={e => e.target.style.borderColor='hsl(240,16%,22%)'}/>
          </div>
        ))}

        <button onClick={save} disabled={saving}
          style={{ width:'100%', padding:'12px', background:saving?'rgba(58,134,255,0.3)':'linear-gradient(135deg,#2563eb,#3A86FF)', border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:800, cursor:saving?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:saving?'none':'0 4px 14px rgba(58,134,255,0.35)', marginTop:4 }}>
          <Save size={14}/>{saving ? 'A guardar…' : 'Guardar Dados do Prestador'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PÁGINA PRINCIPAL
═══════════════════════════════════════════ */
export default function AdminReceipts() {
  const [tab, setTab]           = useState('cliente');
  const [provider, setProvider] = useState({ name:'', nif:'', address:'', signature_name:'' });
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/admin/receipt-provider`, { headers: authH() })
      .then(r => r.ok ? r.json() : {})
      .then(d => setProvider(d || {}))
      .catch(() => {});
  }, []);

  const handleGenerate = async (form, endpoint) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/${endpoint}`, {
        method: 'POST',
        headers: { ...authH(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Erro ao gerar');
      }
      const blob = await res.blob();
      const disp = res.headers.get('Content-Disposition') || '';
      const nm   = (disp.match(/filename="(.+?)"/) || [])[1] || 'documento.pdf';
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = nm; a.click();
      URL.revokeObjectURL(url);
      toast.success(`PDF "${nm}" gerado e descarregado!`);
    } catch (e) {
      toast.error(e.message);
    }
    setLoading(false);
  };

  const providerOk = !!(provider.name && provider.nif && provider.address);

  const TABS = [
    { id:'cliente',  label:'Recibo Cliente', sub:'Com Marca EuroVault',  icon:FileText,   color:'#3A86FF'  },
    { id:'banco',    label:'Doc. Banco',      sub:'Neutro / Zero Marca', icon:EyeOff,     color:'#ef4444'  },
    { id:'exif',     label:'Limpar EXIF',     sub:'Metadados de imagens', icon:Eraser,     color:'#FFBE0B'  },
    { id:'provider', label:'Prestador',       sub:'Dados do laranja',    icon:Building2,  color:'#22c58b'  },
  ];

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontFamily:'var(--font-heading)', fontSize:22, fontWeight:800, color:'#f3f5ff', margin:0 }}>Gerador de Documentos</h1>
        <p style={{ fontSize:13, color:'#7a8299', margin:'4px 0 0' }}>Dois geradores de PDF distintos com bases de código separadas</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        {TABS.map(({ id, label, sub, icon:Icon, color }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)}
              style={{ display:'flex', flexDirection:'column', gap:2, padding:'10px 16px', borderRadius:12, border:`1px solid ${active ? color+'40' : 'hsl(240,16%,18%)'}`, cursor:'pointer', background: active ? `${color}14` : 'hsl(240,26%,8%)', transition:'all .2s', position:'relative' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <Icon size={14} color={active ? color : '#5a6280'}/>
                <span style={{ fontSize:13, fontWeight:700, color: active ? color : '#7a8299' }}>{label}</span>
              </div>
              <span style={{ fontSize:9, color: active ? color+'cc' : '#3a3d5a', fontWeight:600 }}>{sub}</span>
              {id === 'provider' && !providerOk && (
                <span style={{ position:'absolute', top:4, right:4, width:7, height:7, borderRadius:'50%', background:'#ef4444', animation:'shimmer 2s ease infinite' }}/>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'cliente'  && <TabCliente  provider={provider} loading={loading} onGenerate={handleGenerate} />}
      {tab === 'banco'    && <TabBanco    provider={provider} loading={loading} onGenerate={handleGenerate} />}
      {tab === 'exif'     && <TabExif />}
      {tab === 'provider' && <TabProvider provider={provider} setProvider={setProvider} />}
    </div>
  );
}
