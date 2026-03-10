import React, { useState, useEffect } from 'react';
import { Send, Mail, Users, User, Search, FileText, ChevronDown, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Template HTML profissional da empresa
const buildEmailHTML = (subject, body, recipientName = '') => `
<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#06061a;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#06061a;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#111118,#1a1a2e);border:1px solid #26263a;border-bottom:none;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align:left;">
              <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:22px;font-weight:900;color:#f3f5ff;letter-spacing:-0.02em;">EuroVault</span>
              <span style="display:block;font-size:10px;color:#FFBE0B;font-weight:700;letter-spacing:0.15em;margin-top:2px;">INVESTMENTS</span>
            </td>
            <td style="text-align:right;vertical-align:middle;">
              <span style="font-size:11px;color:#4a5068;">Comunicação Segura</span>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Corpo -->
      <tr><td style="background:#111118;border:1px solid #26263a;border-top:2px solid #3A86FF;padding:32px;color:#e8eaf6;">
        ${recipientName ? `<p style="color:#7a8299;font-size:13px;margin:0 0 20px;">Olá, <strong style="color:#f3f5ff;">${recipientName}</strong></p>` : ''}
        <div style="font-size:15px;line-height:1.75;color:#e8eaf6;">
          ${body.replace(/\n/g, '<br>')}
        </div>
      </td></tr>

      <!-- Rodapé -->
      <tr><td style="background:#0a0a18;border:1px solid #26263a;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#f3f5ff;">EuroVault Investments</p>
              <p style="margin:0;font-size:11px;color:#4a5068;">Regulamentado pela CySEC · Licença 409/22 · MiFID II · ICF</p>
            </td>
            <td style="text-align:right;vertical-align:middle;">
              <span style="font-size:10px;color:#26263a;">© ${new Date().getFullYear()} EuroVault</span>
            </td>
          </tr>
        </table>
        <hr style="border:none;border-top:1px solid #1a1a2a;margin:14px 0;">
        <p style="margin:0;font-size:10px;color:#26263a;line-height:1.5;">
          Este email é confidencial e destinado exclusivamente ao destinatário indicado. 
          EuroVault Investments Ltd. · Todos os direitos reservados.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>
`;

const TEMPLATES = [
  { id: 1, name: 'Boas-vindas',         subject: 'Bem-vindo à EuroVault Investments 🎉',        body: `É com grande prazer que damos as boas-vindas à EuroVault Investments!\n\nA sua conta está activa e pronta para começar a investir nos mercados europeus e globais.\n\n✅ O que pode fazer agora:\n• Explorar os mercados (Forex, Cripto, Acções)\n• Fazer o primeiro depósito\n• Completar a verificação de identidade (KYC)\n\nEstamos aqui para ajudar. Não hesite em contactar-nos através do chat.\n\nBom investimento!` },
  { id: 2, name: 'Solicitar KYC',        subject: 'Verificação de Identidade — Acção Necessária', body: `Para activar todos os serviços da sua conta EuroVault, precisamos verificar a sua identidade.\n\n📋 Documentos necessários:\n• Bilhete de Identidade / Cartão Cidadão (frente e verso)\n• Ou Passaporte válido\n\n🔒 Os seus dados são processados em total segurança e confidencialidade, em conformidade com o RGPD.\n\nAceda ao seu perfil e envie os documentos. O processo demora menos de 2 minutos.` },
  { id: 3, name: 'Depósito processado',  subject: 'O seu depósito foi processado com sucesso ✅',  body: `Temos o prazer de confirmar que o seu depósito foi recebido e processado com sucesso.\n\nO saldo está agora disponível na sua conta e pode começar a negociar imediatamente.\n\n📊 Mercados disponíveis:\n• Forex (EUR/USD, GBP/USD, USD/JPY…)\n• Criptomoedas (BTC, ETH, SOL…)\n• Acções (Apple, Tesla, Amazon…)\n• Commodities e Metais Preciosos\n\nBoas negociações!` },
  { id: 4, name: 'Levantamento',         subject: 'Pedido de Levantamento Recebido',               body: `O seu pedido de levantamento foi recebido pela nossa equipa financeira.\n\n⏱️ Prazo estimado:\n• Transferência SEPA: 1-2 dias úteis\n• Estorno no cartão: 5-10 dias úteis\n\nReceberá uma confirmação assim que o processo estiver concluído.\n\nSe tiver alguma questão, a nossa equipa está disponível através do chat.` },
  { id: 5, name: 'Follow-up',            subject: 'A sua conta EuroVault — Precisamos de falar',    body: `Gostaríamos de saber se tem alguma questão sobre a sua conta ou os nossos serviços.\n\nA nossa equipa de investimento está disponível para:\n• Analisar as melhores oportunidades de investimento para o seu perfil\n• Esclarecer dúvidas sobre a plataforma\n• Ajudar com depósitos ou levantamentos\n\nNão perca as oportunidades de mercado — contacte-nos hoje!` },
  { id: 6, name: 'VIP',                  subject: '🌟 Convite Exclusivo — Programa VIP EuroVault',  body: `Seleccionámos a sua conta para integrar o nosso programa VIP exclusivo.\n\n🏆 Benefícios do Programa VIP:\n• Gestor de conta dedicado\n• Taxas de lucro diário premium\n• Prioridade em levantamentos\n• Acesso antecipado a novos instrumentos\n• Análises de mercado personalizadas\n\nEntre em contacto connosco para saber mais sobre esta oportunidade exclusiva.` },
];

export default function AdminEmailCampaign() {
  const [leads, setLeads]           = useState([]);
  const [selected, setSelected]     = useState(new Set()); // IDs seleccionados
  const [customEmail, setCustomEmail] = useState('');
  const [subject, setSubject]       = useState('');
  const [body, setBody]             = useState('');
  const [recipientMode, setRecipientMode] = useState('leads'); // 'leads' | 'custom' | 'all'
  const [searchLead, setSearchLead] = useState('');
  const [sending, setSending]       = useState(false);
  const [results, setResults]       = useState([]); // {email, status}
  const [showPreview, setShowPreview] = useState(false);
  const [sentCount, setSentCount]   = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    fetch(`${BACKEND_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setLeads)
      .catch(() => {});
  }, []);

  const filteredLeads = leads.filter(l =>
    !searchLead || l.full_name?.toLowerCase().includes(searchLead.toLowerCase()) || l.email?.toLowerCase().includes(searchLead.toLowerCase())
  );

  const handleTemplate = (tpl) => { setSubject(tpl.subject); setBody(tpl.body); };

  const getRecipients = () => {
    if (recipientMode === 'custom') return customEmail.split(/[,;\n]/).map(e => e.trim()).filter(e => e.includes('@'));
    if (recipientMode === 'all') return leads.map(l => ({ email: l.email, name: l.full_name, id: l.id }));
    return leads.filter(l => selected.has(l.id)).map(l => ({ email: l.email, name: l.full_name, id: l.id }));
  };

  const recipients = getRecipients();

  const sendEmails = async () => {
    if (!subject.trim() || !body.trim()) { toast.error('Preencha o assunto e o corpo'); return; }
    if (recipients.length === 0) { toast.error('Seleccione pelo menos um destinatário'); return; }
    setSending(true); setSentCount(0); setResults([]);

    const token = localStorage.getItem('adminToken');
    let ok = 0;
    for (const r of recipients) {
      const email = typeof r === 'string' ? r : r.email;
      const name  = typeof r === 'string' ? '' : r.name;
      const userId = typeof r === 'object' ? r.id : null;
      try {
        const res = await fetch(
          userId ? `${BACKEND_URL}/api/admin/users/${userId}/send-email` : `${BACKEND_URL}/api/admin/email/send`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ subject, body, to: email, recipient_name: name }),
          }
        );
        const data = await res.json();
        setResults(p => [...p, { email, status: res.ok ? 'ok' : 'err', detail: data.status || data.detail }]);
        if (res.ok) { ok++; setSentCount(c => c + 1); }
      } catch (_) {
        setResults(p => [...p, { email, status: 'err', detail: 'Erro de ligação' }]);
      }
      await new Promise(r2 => setTimeout(r2, 200)); // delay entre envios
    }
    setSending(false);
    toast.success(`${ok}/${recipients.length} email${ok !== 1 ? 's' : ''} enviado${ok !== 1 ? 's' : ''} com sucesso!`);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff', margin: 0 }}>
            Campanhas de Email
          </h1>
          <p style={{ fontSize: 13, color: '#7a8299', margin: '4px 0 0' }}>
            Envie emails profissionais com a assinatura EuroVault
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 10, padding: '6px 14px', textAlign: 'center' }}>
            <div className="numeric" style={{ fontSize: 18, fontWeight: 700, color: '#3A86FF', fontFamily: 'var(--font-heading)' }}>{leads.length}</div>
            <div style={{ fontSize: 9, color: '#7a8299' }}>LEADS</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Coluna esquerda: Destinatários */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Modo de envio */}
          <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#7a8299', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Destinatários</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { k: 'leads',  icon: Users, label: `Leads seleccionados (${selected.size})` },
                { k: 'all',    icon: Users, label: `Todos os leads (${leads.length})` },
                { k: 'custom', icon: Mail,  label: 'Email personalizado' },
              ].map(({ k, icon: Icon, label }) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: recipientMode === k ? 'rgba(58,134,255,0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${recipientMode === k ? 'rgba(58,134,255,0.3)' : '#26263a'}`, borderRadius: 9, cursor: 'pointer' }}>
                  <input type="radio" value={k} checked={recipientMode === k} onChange={() => setRecipientMode(k)} style={{ accentColor: '#3A86FF' }} />
                  <Icon size={14} color={recipientMode === k ? '#3A86FF' : '#7a8299'} />
                  <span style={{ fontSize: 12, color: recipientMode === k ? '#f3f5ff' : '#7a8299', fontWeight: recipientMode === k ? 700 : 400 }}>{label}</span>
                </label>
              ))}
            </div>

            {recipientMode === 'custom' && (
              <textarea value={customEmail} onChange={e => setCustomEmail(e.target.value)}
                placeholder="email1@gmail.com&#10;email2@hotmail.com&#10;(um por linha ou separados por vírgula)"
                rows={4}
                style={{ width: '100%', marginTop: 10, padding: '10px 12px', background: '#0e0e1a', border: '1px solid #26263a', borderRadius: 9, color: '#f3f5ff', fontSize: 12, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            )}
          </div>

          {/* Lista de leads para seleccionar */}
          {recipientMode === 'leads' && (
            <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #26263a' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#4a5068' }} />
                  <input value={searchLead} onChange={e => setSearchLead(e.target.value)} placeholder="Pesquisar lead..."
                    style={{ width: '100%', padding: '7px 10px 7px 26px', background: '#0e0e1a', border: '1px solid #26263a', borderRadius: 7, color: '#f3f5ff', fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <button onClick={() => setSelected(new Set(filteredLeads.map(l => l.id)))}
                    style={{ fontSize: 10, color: '#3A86FF', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 700 }}>
                    Seleccionar todos
                  </button>
                  <button onClick={() => setSelected(new Set())}
                    style={{ fontSize: 10, color: '#7a8299', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Limpar
                  </button>
                </div>
              </div>
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {filteredLeads.map(lead => (
                  <label key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #1a1a2a', background: selected.has(lead.id) ? 'rgba(58,134,255,0.06)' : 'transparent' }}>
                    <input type="checkbox" checked={selected.has(lead.id)} onChange={e => {
                      const n = new Set(selected);
                      e.target.checked ? n.add(lead.id) : n.delete(lead.id);
                      setSelected(n);
                    }} style={{ accentColor: '#3A86FF', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#f3f5ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.full_name}</div>
                      <div style={{ fontSize: 10, color: '#4a5068', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Preview do total a enviar */}
          {recipients.length > 0 && (
            <div style={{ padding: '10px 14px', background: 'rgba(58,134,255,0.08)', border: '1px solid rgba(58,134,255,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={14} color="#3A86FF" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#3A86FF' }}>
                {recipients.length} destinatário{recipients.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Coluna direita: Composição */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Templates */}
          <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#7a8299', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
              <FileText size={13} />Templates Profissionais
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {TEMPLATES.map(tpl => (
                <button key={tpl.id} onClick={() => handleTemplate(tpl)}
                  style={{ padding: '6px 12px', background: subject === tpl.subject ? 'rgba(58,134,255,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${subject === tpl.subject ? 'rgba(58,134,255,0.4)' : '#26263a'}`, borderRadius: 8, color: subject === tpl.subject ? '#3A86FF' : '#7a8299', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Composição */}
          <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7a8299', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Assunto</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Assunto do email..."
                style={{ width: '100%', padding: '11px 14px', background: '#0e0e1a', border: '1px solid #26263a', borderRadius: 10, color: '#f3f5ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7a8299', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Mensagem</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Escreva o corpo do email..." rows={10}
                style={{ width: '100%', padding: '11px 14px', background: '#0e0e1a', border: '1px solid #26263a', borderRadius: 10, color: '#f3f5ff', fontSize: 13, outline: 'none', fontFamily: 'inherit', lineHeight: 1.7, resize: 'vertical', boxSizing: 'border-box' }} />
              <div style={{ fontSize: 11, color: '#4a5068', marginTop: 5 }}>
                💡 Use \n para saltos de linha · A assinatura da empresa é adicionada automaticamente
              </div>
            </div>

            {/* Preview + Enviar */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowPreview(!showPreview)}
                style={{ flex: 1, padding: '11px', background: 'rgba(255,255,255,0.03)', border: '1px solid #26263a', borderRadius: 11, color: '#7a8299', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                👁 {showPreview ? 'Ocultar Preview' : 'Ver Preview'}
              </button>
              <button onClick={sendEmails} disabled={sending || recipients.length === 0 || !subject || !body}
                style={{ flex: 2, padding: '11px', background: sending || recipients.length === 0 ? '#1e1e30' : 'linear-gradient(135deg,#2563eb,#3A86FF)', border: 'none', borderRadius: 11, color: '#fff', fontSize: 13, fontWeight: 800, cursor: sending || recipients.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: sending || recipients.length === 0 ? 'none' : '0 3px 12px rgba(58,134,255,0.35)' }}>
                {sending ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} />A enviar ({sentCount}/{recipients.length})…</> : <><Send size={14} />Enviar {recipients.length > 0 ? `(${recipients.length})` : ''}</>}
              </button>
            </div>
          </div>

          {/* Preview HTML */}
          {showPreview && subject && body && (
            <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #26263a', fontSize: 11, fontWeight: 700, color: '#7a8299', display: 'flex', alignItems: 'center', gap: 7 }}>
                👁 Preview do Email
              </div>
              <iframe
                srcDoc={buildEmailHTML(subject, body, 'Nome do Destinatário')}
                style={{ width: '100%', height: 500, border: 'none', display: 'block' }}
                title="Email Preview"
              />
            </div>
          )}

          {/* Resultados */}
          {results.length > 0 && (
            <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#7a8299', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Resultados de Envio
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {results.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: r.status === 'ok' ? 'rgba(34,197,139,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${r.status === 'ok' ? 'rgba(34,197,139,0.25)' : 'rgba(239,68,68,0.25)'}`, borderRadius: 8 }}>
                    {r.status === 'ok' ? <CheckCircle size={13} color="#22c58b" /> : <AlertCircle size={13} color="#ef4444" />}
                    <span style={{ fontSize: 12, color: '#e8eaf6', flex: 1 }}>{r.email}</span>
                    <span style={{ fontSize: 10, color: r.status === 'ok' ? '#22c58b' : '#ef4444', fontWeight: 700 }}>
                      {r.status === 'ok' ? 'Enviado ✓' : r.detail || 'Erro'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info sobre SMTP */}
      <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(255,190,11,0.06)', border: '1px solid rgba(255,190,11,0.2)', borderRadius: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#FFBE0B', marginBottom: 8 }}>⚙️ Configuração SMTP para envio real</div>
        <div style={{ fontSize: 11, color: '#7a8299', lineHeight: 1.6 }}>
          Adicione ao ficheiro <code style={{ background: '#0e0e1a', padding: '1px 5px', borderRadius: 4, color: '#3A86FF' }}>.env</code> do backend:<br />
          <code style={{ color: '#22c58b' }}>SMTP_HOST=smtp.gmail.com · SMTP_USER=seuEmail@gmail.com · SMTP_PASS=suaPassword · SMTP_FROM=noreply@eurovault.eu</code><br />
          Para Gmail: <strong style={{ color: '#f3f5ff' }}>Definições → Segurança → Palavras-passe de app</strong>
        </div>
      </div>
    </div>
  );
}
