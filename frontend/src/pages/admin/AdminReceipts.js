import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Download, Settings, Eraser, User, Euro,
  Calendar, StickyNote, Save, RefreshCw, CheckCircle,
  Upload, X, AlertCircle, Shield, Building2
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });
const inp = {
  width: '100%', padding: '10px 13px', background: 'hsl(240,18%,12%)',
  border: '1px solid hsl(240,16%,22%)', borderRadius: 9, color: '#f3f5ff',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

/* ─── Gerar Recibo ─── */
function TabRecibo({ provider }) {
  const [form, setForm] = useState({
    client_name: '', value: '', date: '', notes: '',
  });
  const [loading, setLoading] = useState(false);

  const fmtToday = () => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  };
  useEffect(() => { setForm(f => ({ ...f, date: fmtToday() })); }, []);

  const generate = async () => {
    if (!form.client_name.trim()) { toast.error('Indique o nome do cliente'); return; }
    if (!form.value.trim()) { toast.error('Indique o valor'); return; }
    if (!provider.name) { toast.error('Configure os dados do Prestador antes de gerar'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/generate-receipt`, {
        method: 'POST',
        headers: { ...authH(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Erro ao gerar');
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      const safe = form.client_name.replace(/\s+/g,'_').slice(0,20);
      a.href = url; a.download = `recibo_${safe}_${form.value}eur.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF gerado e descarregado!');
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  const providerOk = provider.name && provider.nif && provider.address;

  return (
    <div style={{ maxWidth: 680 }}>

      {/* Aviso se dados do prestador não configurados */}
      {!providerOk && (
        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', background: 'rgba(255,190,11,0.08)', border: '1px solid rgba(255,190,11,0.25)', borderRadius: 10, marginBottom: 20 }}>
          <AlertCircle size={15} color="#FFBE0B" style={{ flexShrink: 0, marginTop: 1 }}/>
          <span style={{ fontSize: 12, color: '#FFBE0B' }}>Configure os <strong>Dados do Prestador</strong> no tab ao lado antes de gerar o primeiro recibo.</span>
        </div>
      )}

      {/* Preview dos dados do prestador */}
      {providerOk && (
        <div style={{ display: 'flex', gap: 10, padding: '10px 14px', background: 'rgba(34,197,139,0.06)', border: '1px solid rgba(34,197,139,0.18)', borderRadius: 10, marginBottom: 20 }}>
          <Shield size={13} color="#22c58b" style={{ flexShrink: 0, marginTop: 2 }}/>
          <div style={{ fontSize: 11, color: '#22c58b', lineHeight: 1.6 }}>
            <strong>{provider.name}</strong> · NIF: {provider.nif} · {provider.address}
          </div>
        </div>
      )}

      <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottom: '1px solid #1e1e30' }}>
          <FileText size={18} color="#3A86FF"/>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f3f5ff' }}>Gerar Justificação de Recebimento</div>
            <div style={{ fontSize: 11, color: '#7a8299', marginTop: 2 }}>Contrato de Prestação de Serviços para transações IBAN</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7a8299', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <User size={11} style={{ marginRight: 5 }}/>Nome do Cliente *
            </label>
            <input value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})}
              placeholder="Nome completo do cliente / contratante"
              data-testid="receipt-client-name" style={inp}
              onFocus={e => e.target.style.borderColor = 'rgba(58,134,255,0.5)'}
              onBlur={e => e.target.style.borderColor = 'hsl(240,16%,22%)'}/>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7a8299', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <Euro size={11} style={{ marginRight: 5 }}/>Valor (€) *
            </label>
            <input value={form.value} onChange={e => setForm({...form, value: e.target.value})}
              placeholder="0.00" inputMode="decimal"
              data-testid="receipt-value" style={inp}
              onFocus={e => e.target.style.borderColor = 'rgba(34,197,139,0.5)'}
              onBlur={e => e.target.style.borderColor = 'hsl(240,16%,22%)'}/>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7a8299', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <Calendar size={11} style={{ marginRight: 5 }}/>Data
            </label>
            <input value={form.date} onChange={e => setForm({...form, date: e.target.value})}
              placeholder="DD/MM/AAAA" style={inp}
              onFocus={e => e.target.style.borderColor = 'rgba(58,134,255,0.5)'}
              onBlur={e => e.target.style.borderColor = 'hsl(240,16%,22%)'}/>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7a8299', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <StickyNote size={11} style={{ marginRight: 5 }}/>Notas Adicionais (opcional)
            </label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
              placeholder="Informações adicionais que aparecem no documento..."
              rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = 'rgba(58,134,255,0.5)'}
              onBlur={e => e.target.style.borderColor = 'hsl(240,16%,22%)'}/>
          </div>
        </div>

        {/* Preview do conteúdo do documento */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1e1e30', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Conteúdo fixo do documento
          </div>
          <div style={{ fontSize: 11, color: '#5a6280', lineHeight: 1.7 }}>
            <div style={{ marginBottom: 6 }}>
              <span style={{ color: '#7a8299', fontWeight: 600 }}>Objeto:</span> Prestação de serviços de consultoria em análise de dados financeiros e licenciamento temporário de plataforma de software de apoio à decisão.
            </div>
            <div>
              <span style={{ color: '#FFBE0B', fontWeight: 600 }}>Cláusula de Proteção:</span> O presente serviço é considerado integralmente prestado no momento da disponibilização das credenciais de acesso ou consultoria via meios telemáticos...
            </div>
          </div>
        </div>

        <button onClick={generate} disabled={loading || !providerOk}
          data-testid="generate-receipt-btn"
          style={{ width: '100%', padding: '13px', background: loading || !providerOk ? 'rgba(58,134,255,0.3)' : 'linear-gradient(135deg,#2563eb,#3A86FF)', border: 'none', borderRadius: 11, color: '#fff', fontSize: 14, fontWeight: 800, cursor: loading || !providerOk ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: loading || !providerOk ? 'none' : '0 4px 16px rgba(58,134,255,0.35)', marginTop: 4 }}>
          {loading
            ? <><RefreshCw size={15} style={{ animation: 'spin .8s linear infinite' }}/>A gerar PDF…</>
            : <><Download size={15}/>Gerar e Descarregar PDF</>}
        </button>
      </div>
    </div>
  );
}

/* ─── Limpeza de Metadados EXIF ─── */
function TabExif() {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) { toast.error('Ficheiro demasiado grande (máx. 20MB)'); return; }
    setFile(f);
    setDone(false);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const clean = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${BACKEND_URL}/api/admin/clean-image`, {
        method: 'POST', headers: authH(), body: formData,
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Erro ao limpar');
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="(.+?)"/);
      const cleanName = filenameMatch ? filenameMatch[1] : `doc_limpo.jpg`;
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href = url; a.download = cleanName; a.click();
      URL.revokeObjectURL(url);
      setDone(true);
      toast.success('Imagem limpa! Metadados EXIF removidos. Ficheiro renomeado.');
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  const reset = () => { setFile(null); setPreview(null); setDone(false); if (fileRef.current) fileRef.current.value = ''; };

  return (
    <div style={{ maxWidth: 580 }}>
      <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottom: '1px solid #1e1e30' }}>
          <Eraser size={18} color="#FFBE0B"/>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f3f5ff' }}>Sanitização de Metadados EXIF</div>
            <div style={{ fontSize: 11, color: '#7a8299', marginTop: 2 }}>Remove dados de localização, data e hora originais de imagens</div>
          </div>
        </div>

        {/* Info */}
        <div style={{ background: 'rgba(255,190,11,0.06)', border: '1px solid rgba(255,190,11,0.18)', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 9 }}>
          <AlertCircle size={13} color="#FFBE0B" style={{ flexShrink: 0, marginTop: 1 }}/>
          <div style={{ fontSize: 11, color: '#FFBE0B', lineHeight: 1.6 }}>
            Comprovantes recebidos via WhatsApp podem conter GPS, data/hora e dispositivo do emissor nos metadados EXIF. Esta função remove todos esses dados e renomeia o ficheiro para eliminar qualquer rastreio.
          </div>
        </div>

        {/* Drop zone */}
        <div onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { const ev = { target: { files: [f] } }; handleFile(ev); } }}
          style={{ border: `2px dashed ${file ? 'rgba(34,197,139,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', transition: 'border-color .2s, background .2s', background: file ? 'rgba(34,197,139,0.04)' : 'rgba(255,255,255,0.02)' }}>
          {preview ? (
            <div>
              <img src={preview} alt="preview" style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 8, objectFit: 'contain', marginBottom: 10 }}/>
              <div style={{ fontSize: 12, color: '#22c58b', fontWeight: 600 }}>{file.name}</div>
              <div style={{ fontSize: 10, color: '#4a5068', marginTop: 3 }}>{(file.size / 1024).toFixed(1)} KB · {file.type}</div>
            </div>
          ) : (
            <>
              <Upload size={28} color="#4a5068" style={{ marginBottom: 10 }}/>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#7a8299' }}>Clique ou arraste a imagem aqui</div>
              <div style={{ fontSize: 11, color: '#4a5068', marginTop: 4 }}>JPG, PNG, WebP · máx. 20MB</div>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFile} style={{ display: 'none' }}/>

        {/* O que será removido */}
        {file && !done && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'GPS / Localização', desc: 'Coordenadas lat/long' },
              { label: 'Data e Hora', desc: 'Data original do disparo' },
              { label: 'Dispositivo', desc: 'Modelo do telemóvel' },
              { label: 'Software', desc: 'App de câmara usada' },
            ].map(({ label, desc }) => (
              <div key={label} style={{ display: 'flex', gap: 8, padding: '8px 10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8 }}>
                <X size={12} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }}/>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>{label}</div>
                  <div style={{ fontSize: 10, color: '#4a5068' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {done && (
          <div style={{ display: 'flex', gap: 10, padding: '12px 16px', background: 'rgba(34,197,139,0.08)', border: '1px solid rgba(34,197,139,0.25)', borderRadius: 10 }}>
            <CheckCircle size={16} color="#22c58b" style={{ flexShrink: 0 }}/>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#22c58b' }}>Imagem limpa com sucesso!</div>
              <div style={{ fontSize: 11, color: '#5a6280', marginTop: 2 }}>Todos os metadados EXIF foram removidos. Ficheiro renomeado sem rastreio.</div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          {file && (
            <button onClick={reset} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid #26263a', borderRadius: 9, color: '#7a8299', fontSize: 12, cursor: 'pointer' }}>
              Limpar
            </button>
          )}
          <button onClick={clean} disabled={!file || loading}
            data-testid="clean-exif-btn"
            style={{ flex: 1, padding: '12px', background: !file || loading ? 'rgba(255,190,11,0.2)' : 'linear-gradient(135deg,#b45309,#D97706)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 800, cursor: !file || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: !file ? 'none' : '0 4px 14px rgba(217,119,6,0.35)' }}>
            {loading
              ? <><RefreshCw size={14} style={{ animation: 'spin .8s linear infinite' }}/>A limpar…</>
              : <><Eraser size={14}/>Remover Metadados e Descarregar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Dados do Prestador ─── */
function TabProvider({ provider, setProvider }) {
  const [form, setForm] = useState({ name: '', nif: '', address: '', signature_name: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm({ name: provider.name || '', nif: provider.nif || '', address: provider.address || '', signature_name: provider.signature_name || '' }); }, [provider]);

  const save = async () => {
    if (!form.name.trim() || !form.nif.trim() || !form.address.trim()) {
      toast.error('Preencha nome, NIF e morada');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/receipt-provider`, {
        method: 'PUT', headers: { ...authH(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Erro ao guardar');
      setProvider(form);
      toast.success('Dados do prestador guardados!');
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 580 }}>
      <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottom: '1px solid #1e1e30' }}>
          <Building2 size={18} color="#3A86FF"/>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f3f5ff' }}>Dados do Prestador de Serviços</div>
            <div style={{ fontSize: 11, color: '#7a8299', marginTop: 2 }}>Aparecem no campo "Dados do Prestador" de cada recibo</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 9, padding: '10px 14px', background: 'rgba(58,134,255,0.06)', border: '1px solid rgba(58,134,255,0.15)', borderRadius: 9 }}>
          <Shield size={12} color="#3A86FF" style={{ flexShrink: 0, marginTop: 1 }}/>
          <div style={{ fontSize: 11, color: '#3A86FF', lineHeight: 1.6 }}>
            Estes dados identificam a entidade prestadora no documento legal. Certifique-se de que correspondem ao titular da conta IBAN.
          </div>
        </div>

        {[
          ['Nome Completo / Razão Social *', 'name', 'text', 'Ex: João Silva ou Empresa Lda.'],
          ['NIF *', 'nif', 'text', 'Ex: 123 456 789'],
          ['Morada Completa *', 'address', 'text', 'Ex: Rua das Flores 10, 1000-000 Lisboa'],
          ['Nome para Assinatura Digital', 'signature_name', 'text', 'Nome que aparece na assinatura do PDF'],
        ].map(([label, field, type, ph]) => (
          <div key={field}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7a8299', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
            <input type={type} value={form[field]} onChange={e => setForm({...form, [field]: e.target.value})}
              placeholder={ph} style={inp}
              onFocus={e => e.target.style.borderColor = 'rgba(58,134,255,0.5)'}
              onBlur={e => e.target.style.borderColor = 'hsl(240,16%,22%)'}/>
          </div>
        ))}

        <button onClick={save} disabled={saving}
          style={{ width: '100%', padding: '12px', background: saving ? 'rgba(58,134,255,0.3)' : 'linear-gradient(135deg,#2563eb,#3A86FF)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: saving ? 'none' : '0 4px 14px rgba(58,134,255,0.35)', marginTop: 4 }}>
          <Save size={14}/>{saving ? 'A guardar…' : 'Guardar Dados do Prestador'}
        </button>
      </div>
    </div>
  );
}

/* ─── PÁGINA PRINCIPAL ─── */
export default function AdminReceipts() {
  const [tab, setTab]           = useState('recibo');
  const [provider, setProvider] = useState({ name: '', nif: '', address: '', signature_name: '' });

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/admin/receipt-provider`, { headers: authH() })
      .then(r => r.ok ? r.json() : {})
      .then(d => setProvider(d || {}))
      .catch(() => {});
  }, []);

  const TABS = [
    { id: 'recibo',   icon: FileText,   label: 'Gerar Recibo'      },
    { id: 'exif',     icon: Eraser,     label: 'Limpar Metadados'  },
    { id: 'provider', icon: Building2,  label: 'Dados do Prestador'},
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: '#f3f5ff', margin: 0 }}>Gerador de Recibos</h1>
        <p style={{ fontSize: 13, color: '#7a8299', margin: '4px 0 0' }}>
          Justificação de recebimento via IBAN · Sanitização de imagens
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {TABS.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === id ? 'hsl(214,100%,60%)' : 'transparent', color: tab === id ? '#fff' : 'hsl(215,16%,70%)', transition: 'all .2s', position: 'relative' }}>
            <Icon size={14}/>
            {label}
            {id === 'provider' && !provider.name && (
              <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'shimmer 2s ease infinite' }}/>
            )}
          </button>
        ))}
      </div>

      {tab === 'recibo'   && <TabRecibo   provider={provider} />}
      {tab === 'exif'     && <TabExif />}
      {tab === 'provider' && <TabProvider provider={provider} setProvider={setProvider} />}
    </div>
  );
}
