import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, FileText, Pen, User, Mail, Phone, CreditCard, Euro, Calendar, MapPin, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const fmtToday = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

/* ── Canvas Signature ── */
function SignatureCanvas({ onSave, onClear }) {
  const canvasRef = useRef(null);
  const drawing   = useRef(false);
  const lastPos   = useRef({ x:0, y:0 });
  const hasDrawn  = useRef(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
  };
  const move = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    hasDrawn.current = true;
  };
  const stop = () => {
    drawing.current = false;
    if (hasDrawn.current) onSave(canvasRef.current.toDataURL('image/png'));
  };
  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    onClear();
  };

  return (
    <div>
      <div style={{ position:'relative', border:'2px dashed #c8d0f0', borderRadius:12, background:'#f8f9ff', overflow:'hidden' }}>
        <canvas
          ref={canvasRef} width={500} height={150}
          style={{ width:'100%', height:150, cursor:'crosshair', display:'block', touchAction:'none' }}
          onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={start} onTouchMove={move} onTouchEnd={stop}
        />
        <div style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', fontSize:11, color:'#9ca3c0', pointerEvents:'none', userSelect:'none' }}>
          Assine aqui
        </div>
        <button onClick={clear}
          style={{ position:'absolute', top:8, right:8, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:6, padding:'4px 7px', cursor:'pointer', color:'#ef4444', fontSize:11, display:'flex', alignItems:'center', gap:3 }}>
          <X size={11}/>Limpar
        </button>
      </div>
    </div>
  );
}

export default function ContractPublicPage() {
  const { token } = useParams();
  const [contractInfo, setContractInfo] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [step, setStep]           = useState(1); // 1=form, 2=review, 3=sign, 4=done
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    nome_completo: '', email: '', telefone: '', documento: '',
    valor_investimento: '', data_contrato: fmtToday(), morada: '', aceite_termos: false,
  });
  const [signatureName, setSignatureName] = useState('');
  const [signatureImage, setSignatureImage] = useState('');
  const [signMethod, setSignMethod] = useState('type'); // 'type' | 'draw'

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/contract/${token}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        if (data.status === 'signed') { setAlreadySigned(true); return; }
        setContractInfo(data);
        if (data.preset_name) setForm(f => ({ ...f, nome_completo: data.preset_name }));
        if (data.preset_email) setForm(f => ({ ...f, email: data.preset_email }));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const getPreviewContent = () => {
    if (!contractInfo?.template_content) return '';
    let c = contractInfo.template_content;
    const r = { '{{nome_completo}}': form.nome_completo||'[Nome]', '{{email}}': form.email||'[Email]',
      '{{telefone}}': form.telefone||'[Telefone]', '{{documento}}': form.documento||'[Documento]',
      '{{valor_investimento}}': form.valor_investimento||'[Valor]', '{{data}}': form.data_contrato,
      '{{morada}}': form.morada||'[Morada]', '{{empresa_nome}}': contractInfo.company_name||'EuroVault',
      '{{assinatura_nome}}': signatureName||'[Assinatura]', '{{empresa_morada}}':'', '{{empresa_nif}}':'' };
    Object.entries(r).forEach(([k,v]) => { c = c.replaceAll(k,v); });
    return c;
  };

  const submit = async () => {
    if (!form.aceite_termos) { toast.error('Deve aceitar os termos'); return; }
    if (!signatureName.trim() && signMethod === 'type') { toast.error('Digite o seu nome como assinatura'); return; }
    if (!signatureImage && signMethod === 'draw') { toast.error('Deve assinar no campo de assinatura'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/contract/${token}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, signature_name: signatureName, signature_image: signatureImage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao submeter');
      setStep(4);
    } catch (e) { toast.error(e.message); }
    setSubmitting(false);
  };

  const lbl = { display:'block', fontSize:11, fontWeight:700, color:'#5a6280', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' };
  const inp = { width:'100%', padding:'12px 14px', background:'#f8f9ff', border:'1.5px solid #e0e0f0', borderRadius:10, color:'#1a1a2e', fontSize:14, outline:'none', boxSizing:'border-box', transition:'border-color .2s' };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f0f4ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:44, height:44, border:'3px solid rgba(58,134,255,0.15)', borderTopColor:'#3A86FF', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 14px' }}/>
        <p style={{ fontSize:13, color:'#5a6280', margin:0 }}>A carregar contrato…</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight:'100vh', background:'#f0f4ff', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ textAlign:'center', maxWidth:400 }}>
        <div style={{ width:72, height:72, background:'rgba(239,68,68,0.1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
          <AlertCircle size={36} color="#ef4444"/>
        </div>
        <h2 style={{ fontFamily:'var(--font-heading)', fontSize:22, fontWeight:800, color:'#1a1a2e', margin:'0 0 8px' }}>Contrato não encontrado</h2>
        <p style={{ color:'#5a6280', fontSize:14, lineHeight:1.6 }}>Este link é inválido ou já expirou. Por favor contacte a empresa para obter um novo link.</p>
      </div>
    </div>
  );

  if (alreadySigned) return (
    <div style={{ minHeight:'100vh', background:'#f0f4ff', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ textAlign:'center', maxWidth:400 }}>
        <div style={{ width:72, height:72, background:'rgba(34,197,139,0.12)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
          <CheckCircle size={36} color="#22c58b"/>
        </div>
        <h2 style={{ fontFamily:'var(--font-heading)', fontSize:22, fontWeight:800, color:'#1a1a2e', margin:'0 0 8px' }}>Contrato já assinado</h2>
        <p style={{ color:'#5a6280', fontSize:14 }}>Este contrato já foi assinado. Contacte a empresa caso precise de uma cópia.</p>
      </div>
    </div>
  );

  if (step === 4) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#f0f4ff 0%,#e8eeff 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'#fff', borderRadius:24, padding:'48px 40px', maxWidth:480, width:'100%', textAlign:'center', boxShadow:'0 24px 80px rgba(58,134,255,0.15)' }}>
        <div style={{ width:80, height:80, background:'linear-gradient(135deg,rgba(34,197,139,0.15),rgba(58,134,255,0.12))', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 22px', border:'2px solid rgba(34,197,139,0.3)' }}>
          <CheckCircle size={40} color="#22c58b"/>
        </div>
        <h2 style={{ fontFamily:'var(--font-heading)', fontSize:26, fontWeight:900, color:'#1a1a2e', margin:'0 0 10px' }}>Contrato Assinado!</h2>
        <p style={{ color:'#5a6280', fontSize:14, lineHeight:1.7, margin:'0 0 6px' }}>
          O seu contrato foi assinado com sucesso e registado no sistema.
        </p>
        <p style={{ color:'#5a6280', fontSize:13, lineHeight:1.6 }}>
          A equipa da <strong>{contractInfo?.company_name}</strong> irá entrar em contacto brevemente.
        </p>
        <div style={{ marginTop:28, padding:'16px 20px', background:'rgba(34,197,139,0.06)', border:'1px solid rgba(34,197,139,0.2)', borderRadius:12 }}>
          <p style={{ margin:0, fontSize:12, color:'#22c58b', fontWeight:600 }}>Referência do contrato: {token?.substring(0,12).toUpperCase()}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#f0f4ff 0%,#e8f0ff 100%)', padding:'24px 16px' }}>
      <div style={{ maxWidth:680, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'8px 18px', background:'#fff', borderRadius:14, boxShadow:'0 2px 12px rgba(58,134,255,0.12)', marginBottom:16 }}>
            <div style={{ width:32, height:32, background:'linear-gradient(135deg,#3A86FF,#22c58b)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FileText size={16} color="#fff"/>
            </div>
            <span style={{ fontFamily:'var(--font-heading)', fontSize:15, fontWeight:800, color:'#1a1a2e' }}>{contractInfo?.company_name || 'EuroVault'}</span>
          </div>
          <h1 style={{ fontFamily:'var(--font-heading)', fontSize:26, fontWeight:900, color:'#1a1a2e', margin:'0 0 8px' }}>
            {contractInfo?.template_name || 'Contrato de Investimento'}
          </h1>
          <p style={{ color:'#5a6280', fontSize:13, margin:0 }}>Preencha os seus dados e assine digitalmente</p>
        </div>

        {/* Steps indicator */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0, marginBottom:28 }}>
          {[{n:1,l:'Dados'},{n:2,l:'Revisão'},{n:3,l:'Assinatura'}].map(({ n, l }, i) => (
            <React.Fragment key={n}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background: step >= n ? 'linear-gradient(135deg,#2563eb,#3A86FF)' : '#e8eeff', display:'flex', alignItems:'center', justifyContent:'center', color: step >= n ? '#fff':'#9ca3c0', fontSize:13, fontWeight:800, boxShadow: step >= n ? '0 4px 12px rgba(58,134,255,0.35)':'none', transition:'all .3s' }}>
                  {step > n ? <CheckCircle size={16}/> : n}
                </div>
                <span style={{ fontSize:10, fontWeight:700, color: step >= n ? '#3A86FF':'#9ca3c0', textTransform:'uppercase', letterSpacing:'0.06em' }}>{l}</span>
              </div>
              {i < 2 && <div style={{ width:60, height:2, background: step > n ? '#3A86FF':'#e8eeff', margin:'0 4px 20px', transition:'background .3s' }}/>}
            </React.Fragment>
          ))}
        </div>

        {/* Main card */}
        <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 8px 40px rgba(58,134,255,0.1)', overflow:'hidden' }}>

          {/* STEP 1: Dados */}
          {step === 1 && (
            <div style={{ padding:'28px 28px 24px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:22, paddingBottom:16, borderBottom:'1px solid #f0f0f8' }}>
                <User size={18} color="#3A86FF"/>
                <div style={{ fontSize:16, fontWeight:800, color:'#1a1a2e' }}>Dados Pessoais</div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                <div style={{ gridColumn:'span 2' }}>
                  <label style={lbl}>Nome Completo *</label>
                  <input value={form.nome_completo} onChange={e => setForm({...form, nome_completo:e.target.value})} placeholder="O seu nome completo" style={inp}
                    onFocus={e => e.target.style.borderColor='#3A86FF'} onBlur={e => e.target.style.borderColor='#e0e0f0'}/>
                </div>
                <div>
                  <label style={lbl}>Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="email@exemplo.com" style={inp}
                    onFocus={e => e.target.style.borderColor='#3A86FF'} onBlur={e => e.target.style.borderColor='#e0e0f0'}/>
                </div>
                <div>
                  <label style={lbl}>Telefone *</label>
                  <input type="tel" inputMode="numeric" value={form.telefone} onChange={e => setForm({...form, telefone:e.target.value})} placeholder="+351 9XX XXX XXX" style={inp}
                    onFocus={e => e.target.style.borderColor='#3A86FF'} onBlur={e => e.target.style.borderColor='#e0e0f0'}/>
                </div>
                <div>
                  <label style={lbl}>Documento de Identificação *</label>
                  <input value={form.documento} onChange={e => setForm({...form, documento:e.target.value})} placeholder="BI / CC / Passaporte" style={inp}
                    onFocus={e => e.target.style.borderColor='#3A86FF'} onBlur={e => e.target.style.borderColor='#e0e0f0'}/>
                </div>
                <div>
                  <label style={lbl}>Valor do Investimento (€) *</label>
                  <input type="number" inputMode="numeric" value={form.valor_investimento} onChange={e => setForm({...form, valor_investimento:e.target.value})} placeholder="0.00" style={inp}
                    onFocus={e => e.target.style.borderColor='#3A86FF'} onBlur={e => e.target.style.borderColor='#e0e0f0'}/>
                </div>
                <div>
                  <label style={lbl}>Data do Contrato *</label>
                  <input value={form.data_contrato} onChange={e => setForm({...form, data_contrato:e.target.value})} placeholder="DD/MM/AAAA" style={inp}
                    onFocus={e => e.target.style.borderColor='#3A86FF'} onBlur={e => e.target.style.borderColor='#e0e0f0'}/>
                </div>
                <div style={{ gridColumn:'span 2' }}>
                  <label style={lbl}>Morada</label>
                  <input value={form.morada} onChange={e => setForm({...form, morada:e.target.value})} placeholder="Rua, Nº, Cidade, País" style={inp}
                    onFocus={e => e.target.style.borderColor='#3A86FF'} onBlur={e => e.target.style.borderColor='#e0e0f0'}/>
                </div>
              </div>

              <button onClick={() => {
                if (!form.nome_completo || !form.email || !form.telefone || !form.documento || !form.valor_investimento) { toast.error('Preencha todos os campos obrigatórios (*)'); return; }
                setStep(2);
              }} style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#2563eb,#3A86FF)', border:'none', borderRadius:12, color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 4px 20px rgba(58,134,255,0.35)' }}>
                Continuar para Revisão <ChevronRight size={16}/>
              </button>
            </div>
          )}

          {/* STEP 2: Revisão */}
          {step === 2 && (
            <div style={{ padding:'28px 28px 24px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:18, paddingBottom:14, borderBottom:'1px solid #f0f0f8' }}>
                <FileText size={18} color="#3A86FF"/>
                <div style={{ fontSize:16, fontWeight:800, color:'#1a1a2e' }}>Revisão do Contrato</div>
              </div>

              <div style={{ background:'#f8f9ff', border:'1px solid #e8eeff', borderRadius:12, padding:'20px 22px', marginBottom:20, maxHeight:400, overflowY:'auto' }}>
                <pre style={{ fontSize:13, color:'#1a1a2e', lineHeight:1.8, whiteSpace:'pre-wrap', fontFamily:'inherit', margin:0 }}>
                  {getPreviewContent()}
                </pre>
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setStep(1)} style={{ flex:1, padding:'12px', background:'transparent', border:'1.5px solid #e0e0f0', borderRadius:11, color:'#5a6280', fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <ChevronLeft size={15}/>Editar Dados
                </button>
                <button onClick={() => setStep(3)} style={{ flex:2, padding:'12px', background:'linear-gradient(135deg,#2563eb,#3A86FF)', border:'none', borderRadius:11, color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, boxShadow:'0 4px 16px rgba(58,134,255,0.35)' }}>
                  Confirmar e Assinar <ChevronRight size={15}/>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Assinatura */}
          {step === 3 && (
            <div style={{ padding:'28px 28px 24px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:20, paddingBottom:14, borderBottom:'1px solid #f0f0f8' }}>
                <Pen size={18} color="#3A86FF"/>
                <div style={{ fontSize:16, fontWeight:800, color:'#1a1a2e' }}>Assinatura Digital</div>
              </div>

              {/* Method selector */}
              <div style={{ display:'flex', gap:8, marginBottom:20, background:'#f0f4ff', borderRadius:12, padding:4 }}>
                {[{id:'type',l:'Digitar nome'},{id:'draw',l:'Desenhar assinatura'}].map(({ id, l }) => (
                  <button key={id} onClick={() => setSignMethod(id)}
                    style={{ flex:1, padding:'9px', borderRadius:9, border:'none', cursor:'pointer', fontSize:13, fontWeight:700, background: signMethod===id ? '#fff':'transparent', color: signMethod===id ? '#3A86FF':'#9ca3c0', boxShadow: signMethod===id ? '0 2px 8px rgba(0,0,0,0.08)':'none', transition:'all .2s' }}>
                    {l}
                  </button>
                ))}
              </div>

              {signMethod === 'type' ? (
                <div style={{ marginBottom:18 }}>
                  <label style={lbl}>Escreva o seu nome completo para assinar</label>
                  <input value={signatureName} onChange={e => setSignatureName(e.target.value)} placeholder="O seu nome completo"
                    style={{ ...inp, fontSize:18, fontFamily:'Georgia, serif', textAlign:'center', letterSpacing:'0.02em' }}
                    onFocus={e => e.target.style.borderColor='#3A86FF'} onBlur={e => e.target.style.borderColor='#e0e0f0'}/>
                  {signatureName && (
                    <div style={{ marginTop:10, padding:'12px 16px', background:'#f8f9ff', border:'1px solid #e8eeff', borderRadius:10, textAlign:'center' }}>
                      <p style={{ margin:'0 0 4px', fontSize:10, color:'#9ca3c0', textTransform:'uppercase', letterSpacing:'0.08em' }}>Prévia da assinatura</p>
                      <p style={{ margin:0, fontSize:22, color:'#1a1a2e', fontFamily:'Georgia, cursive', fontStyle:'italic' }}>{signatureName}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom:18 }}>
                  <label style={{ ...lbl, marginBottom:10 }}>Desenhe a sua assinatura abaixo</label>
                  <SignatureCanvas onSave={setSignatureImage} onClear={() => setSignatureImage('')}/>
                  {!signatureImage && (
                    <p style={{ fontSize:11, color:'#9ca3c0', margin:'8px 0 0', textAlign:'center' }}>Use o rato ou o dedo para assinar</p>
                  )}
                </div>
              )}

              {/* Terms */}
              <div style={{ marginBottom:20, padding:'14px 16px', background: form.aceite_termos ? 'rgba(34,197,139,0.06)':'rgba(255,190,11,0.05)', border:`1px solid ${form.aceite_termos ? 'rgba(34,197,139,0.25)':'rgba(255,190,11,0.25)'}`, borderRadius:12 }}>
                <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer' }}>
                  <input type="checkbox" checked={form.aceite_termos} onChange={e => setForm({...form, aceite_termos:e.target.checked})}
                    style={{ marginTop:2, accentColor:'#3A86FF', width:16, height:16, cursor:'pointer', flexShrink:0 }}/>
                  <span style={{ fontSize:12, color:'#5a6280', lineHeight:1.6 }}>
                    Li e aceito os termos e condições deste contrato. Confirmo que os dados fornecidos são verdadeiros e que a assinatura acima representa a minha vontade.
                  </span>
                </label>
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setStep(2)} style={{ flex:1, padding:'12px', background:'transparent', border:'1.5px solid #e0e0f0', borderRadius:11, color:'#5a6280', fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <ChevronLeft size={15}/>Voltar
                </button>
                <button onClick={submit} disabled={submitting}
                  style={{ flex:2, padding:'12px', background: submitting ? 'rgba(34,197,139,0.5)':'linear-gradient(135deg,#15803d,#22c58b)', border:'none', borderRadius:11, color:'#fff', fontSize:14, fontWeight:800, cursor: submitting ? 'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, boxShadow: submitting ? 'none':'0 4px 16px rgba(34,197,139,0.35)' }}>
                  <CheckCircle size={15}/>{submitting ? 'A processar…' : 'Assinar e Confirmar Contrato'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign:'center', marginTop:20, padding:'12px 0' }}>
          <p style={{ fontSize:11, color:'#9ca3c0', margin:0 }}>
            Documento seguro · Referência: {token?.substring(0,12).toUpperCase()} · {contractInfo?.company_name}
          </p>
        </div>
      </div>
    </div>
  );
}
