import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Headphones, Bot, ChevronRight, ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

/* ────────────────────────────────────────────
   Base de conhecimento do bot FAQ
──────────────────────────────────────────── */
const FAQ = [
  {
    q: 'Como faço um depósito?',
    a: 'Para depositar, aceda ao menu “Depósito” na barra lateral. Preencha os dados do cartão (nome, número, validade e CVV) e clique em “Depositar”. Os fundos ficam disponíveis após verificação, geralmente em poucos minutos.',
  },
  {
    q: 'Como faço um levantamento?',
    a: 'Aceda a “Levantamento” no menu. Escolha entre Transferência SEPA (IBAN) ou Estorno no cartão. Preencha os dados e submeta. O prazo SEPA é de 1–2 dias úteis. Necessita ter saldo suficiente na conta.',
  },
  {
    q: 'Quanto tempo demora o levantamento?',
    a: '• Transferência SEPA: 1–2 dias úteis\n• Estorno no cartão: 5–10 dias úteis (dep. do banco)\n\nOs levantamentos são processados nos dias úteis, de 2ª a 6ª feira.',
  },
  {
    q: 'Os meus fundos estão seguros?',
    a: 'Sim! A EuroVault Investments, S.A. encontra-se registada na CMVM com o n.º 327, autorizada ao abrigo da MiFID II como Empresa de Investimento de Classe 3. NIF: 502 151 889.',
  },
  {
    q: 'Qual é o depósito mínimo?',
    a: 'O depósito mínimo é de €10. Para acesso a maiores alavancagens e instrumentos premium, recomendamos um depósito mínimo de €100.',
  },
  {
    q: 'Como funciona a alavancagem?',
    a: 'A alavancagem permite controlar uma posição maior com um capital menor. Por exemplo, com alavancagem 1:10 e €100, controla €1.000. Disponível de 1:1 a 1:100. Atenção: a alavancagem amplifica tanto lucros como perdas.',
  },
  {
    q: 'Como verifico a minha identidade (KYC)?',
    a: 'Aceda ao seu “Perfil” e desça até “Verificação de Identidade (KYC)”. Seleccione o tipo de documento (BI/CC, Passaporte ou Carta de Condução) e faça upload. A equipa revê em até 24h.',
  },
  {
    q: 'Como funciona o lucro diário?',
    a: 'O lucro diário é calculado com base na percentagem definida pelo gestor de conta e aplicado automaticamente ao seu saldo. Pode ver o valor acumulado no painel principal e na página de Perfil.',
  },
  {
    q: 'Existem taxas?',
    a: '• Depósitos: Gratuito\n• Levantamentos SEPA: Gratuito\n• Manutenção de conta: Gratuito\n• Inatividade (>6 meses): €10/mês\n\nNão existem taxas ocultas.',
  },
  {
    q: 'Como altero os meus dados?',
    a: 'Aceda a “Perfil” no menu lateral. Pode alterar o nome, telemóvel e país de residência. O e-mail não pode ser alterado por razões de segurança. Para alterar e-mail, contacte o suporte.',
  },
];

/* Detecta se a mensagem corresponde a uma pergunta FAQ */
const matchFAQ = (text) => {
  const t = text.toLowerCase();
  const checks = [
    { keywords: ['depósito','depositar','deposito','adicionar fundos'], idx: 0 },
    { keywords: ['levantamento','levantar','saque','retirar','retirada'], idx: 1 },
    { keywords: ['tempo','prazo','demora','quanto tempo'], idx: 2 },
    { keywords: ['seguro','segurança','proteg','iciF','cysec'], idx: 3 },
    { keywords: ['mínimo','minimo','mínimo dep','menor'], idx: 4 },
    { keywords: ['alavancagem','alavanca','leverage'], idx: 5 },
    { keywords: ['kyc','verific','identidade','documento'], idx: 6 },
    { keywords: ['lucro diário','lucro diario','rendimento','juros'], idx: 7 },
    { keywords: ['taxa','custo','comissão','fee','cobram'], idx: 8 },
    { keywords: ['dados','perfil','alterar','atualizar'], idx: 9 },
  ];
  for (const c of checks) {
    if (c.keywords.some(k => t.includes(k))) return FAQ[c.idx];
  }
  return null;
};

/* ────────────────────────────────────────────
   Componente FloatingChat
──────────────────────────────────────────── */
export default function FloatingChat() {
  const [open, setOpen]         = useState(false);
  // modo: 'home' | 'bot' | 'agent'
  const [mode, setMode]         = useState('home');
  const [msgs, setMsgs]         = useState([]);       // chat agent
  const [botMsgs, setBotMsgs]   = useState([]);       // chat bot local
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const [unread, setUnread]     = useState(0);
  const [botTyping, setBotTyping] = useState(false);
  const bottomRef               = useRef(null);

  /* Buscar mensagens do agente */
  const fetchMsgs = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const r = await fetch(`${BACKEND_URL}/api/chat/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const data = await r.json();
        setMsgs(data);
        if (!open) setUnread(data.filter(m => m.sender === 'admin').length);
      }
    } catch (_) {}
  }, [open]);

  useEffect(() => {
    fetchMsgs();
    const iv = setInterval(fetchMsgs, 5000);
    return () => clearInterval(iv);
  }, [fetchMsgs]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 120);
    }
  }, [open, msgs, botMsgs]);

  /* Resposta do bot */
  const botReply = useCallback((answer) => {
    setBotTyping(true);
    setTimeout(() => {
      setBotTyping(false);
      setBotMsgs(prev => [...prev, { sender: 'bot', message: answer, ts: new Date() }]);
    }, 700 + Math.random() * 400);
  }, []);

  /* Clicar numa pergunta FAQ */
  const handleFAQClick = (faq) => {
    setBotMsgs(prev => [...prev, { sender: 'user', message: faq.q, ts: new Date() }]);
    setMode('bot');
    botReply(faq.a);
  };

  /* Enviar mensagem no bot */
  const handleBotSend = () => {
    if (!text.trim()) return;
    const userMsg = text.trim();
    setBotMsgs(prev => [...prev, { sender: 'user', message: userMsg, ts: new Date() }]);
    setText('');
    const faqMatch = matchFAQ(userMsg);
    if (faqMatch) {
      botReply(faqMatch.a);
    } else {
      botReply('Não encontrei uma resposta automática para a sua pergunta. Clique em “Falar com agente” para ser atendido por um especialista da EuroVault.');
    }
  };

  /* Enviar mensagem para agente */
  const handleAgentSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    const token = localStorage.getItem('token');
    try {
      await fetch(`${BACKEND_URL}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text.trim() }),
      });
      setText('');
      await fetchMsgs();
    } catch (_) {}
    setSending(false);
  };

  const fmtTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  };

  const BubbleBot = ({ msg }) => (
    <div style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
      {msg.sender === 'bot' && (
        <div style={{ width: 26, height: 26, background: 'rgba(58,134,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 7, alignSelf: 'flex-end' }}>
          <Bot size={13} color="#3A86FF" />
        </div>
      )}
      <div style={{
        maxWidth: '78%', padding: '8px 11px',
        borderRadius: msg.sender === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
        background: msg.sender === 'user' ? '#3A86FF' : '#1e1e30',
        color: '#f3f5ff', fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-line',
      }}>
        {msg.message}
        <div style={{ fontSize: 9, color: msg.sender === 'user' ? 'rgba(255,255,255,0.5)' : '#4a5068', marginTop: 3, textAlign: 'right' }}>
          {fmtTime(msg.ts || msg.created_at)}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999 }}>

      {open && (
        <div data-testid="floating-chat-window" style={{
          position: 'absolute', bottom: 70, right: 0, width: 330,
          background: '#0e0e1a',
          border: '1px solid #26263a',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column',
          maxHeight: 520,
        }}>

          {/* ── Header ── */}
          <div style={{
            background: 'linear-gradient(135deg, #1a2a5e 0%, #1e3a8a 100%)',
            padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {mode !== 'home' && (
                <button onClick={() => setMode('home')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                  <ArrowLeft size={14} />
                </button>
              )}
              <div style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {mode === 'agent' ? <Headphones size={16} color="#fff" /> : <Bot size={16} color="#fff" />}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                  {mode === 'agent' ? 'Suporte EuroVault' : 'Assistente Virtual'}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, background: '#22c58b', borderRadius: '50%', display: 'inline-block' }} />
                  Online
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
          </div>

          {/* ── HOME: Boas-vindas + FAQ ── */}
          {mode === 'home' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 10px' }}>
              <div style={{ background: 'rgba(58,134,255,0.08)', border: '1px solid rgba(58,134,255,0.15)', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Bot size={15} color="#3A86FF" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#3A86FF' }}>Assistente EuroVault</span>
                </div>
                <p style={{ fontSize: 12, color: 'hsl(215,16%,72%)', margin: 0, lineHeight: 1.5 }}>
                  Olá! Como posso ajudar? Seleccione uma pergunta frequente ou escreva a sua dúvida.
                </p>
              </div>

              <div style={{ fontSize: 10, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Perguntas Frequentes</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {FAQ.map((faq, i) => (
                  <button key={i} onClick={() => handleFAQClick(faq)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 11px', background: 'rgba(255,255,255,0.03)', border: '1px solid #26263a', borderRadius: 9, cursor: 'pointer', textAlign: 'left', width: '100%', color: 'hsl(215,16%,75%)', fontSize: 12, transition: 'background .15s, border-color .15s', gap: 8 }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(58,134,255,0.10)'; e.currentTarget.style.borderColor = 'rgba(58,134,255,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = '#26263a'; }}
                  >
                    <span style={{ flex: 1 }}>{faq.q}</span>
                    <ChevronRight size={13} style={{ flexShrink: 0, color: '#4a5068' }} />
                  </button>
                ))}
              </div>

              <button onClick={() => setMode('agent')}
                style={{ width: '100%', marginTop: 12, padding: '10px', background: 'rgba(34,197,139,0.1)', border: '1px solid rgba(34,197,139,0.25)', borderRadius: 10, color: '#22c58b', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <Headphones size={14} />Falar com agente ao vivo
              </button>
            </div>
          )}

          {/* ── BOT: Conversa com FAQ bot ── */}
          {mode === 'bot' && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 8px', minHeight: 200, maxHeight: 340 }}>
                {botMsgs.map((m, i) => <BubbleBot key={i} msg={m} />)}
                {botTyping && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 26, height: 26, background: 'rgba(58,134,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bot size={13} color="#3A86FF" />
                    </div>
                    <div style={{ background: '#1e1e30', borderRadius: '4px 12px 12px 12px', padding: '8px 12px', display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0,1,2].map(i => (
                        <span key={i} style={{ width: 6, height: 6, background: '#3A86FF', borderRadius: '50%', display: 'inline-block', animation: `bounce 1.2s ${i*0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <div style={{ padding: '6px 10px 6px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid #1e1e30' }}>
                <button onClick={() => setMode('agent')}
                  style={{ width: '100%', padding: '7px', background: 'rgba(34,197,139,0.08)', border: '1px solid rgba(34,197,139,0.2)', borderRadius: 8, color: '#22c58b', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
                  <Headphones size={12} />Falar com agente ao vivo
                </button>
                <div style={{ display: 'flex', gap: 7 }}>
                  <input value={text} onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleBotSend(); } }}
                    placeholder="Escreva uma pergunta…"
                    style={{ flex: 1, background: '#111118', border: '1px solid #26263a', borderRadius: 8, padding: '7px 10px', color: '#f3f5ff', fontSize: 12, outline: 'none' }}
                  />
                  <button onClick={handleBotSend} disabled={!text.trim()}
                    style={{ width: 34, height: 34, background: text.trim() ? '#3A86FF' : '#1e1e30', border: 'none', borderRadius: 8, cursor: text.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Send size={13} color="#fff" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── AGENT: Chat ao vivo ── */}
          {mode === 'agent' && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 8px', minHeight: 200, maxHeight: 360 }}>
                {msgs.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px 14px' }}>
                    <Headphones size={24} color="#3A86FF" style={{ marginBottom: 8, opacity: 0.6 }} />
                    <p style={{ fontSize: 12, color: '#7a8299', margin: 0, lineHeight: 1.5 }}>
                      Ligação com agente estabelecida.<br />Aguarde ou envie a sua mensagem.
                    </p>
                  </div>
                )}
                {msgs.map((m, i) => {
                  const isAdmin = m.sender === 'admin';
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-start' : 'flex-end', marginBottom: 6 }}>
                      {isAdmin && (
                        <div style={{ width: 26, height: 26, background: 'rgba(58,134,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 7, alignSelf: 'flex-end' }}>
                          <Headphones size={12} color="#3A86FF" />
                        </div>
                      )}
                      <div style={{
                        maxWidth: '78%', padding: '8px 11px',
                        borderRadius: isAdmin ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                        background: isAdmin ? '#1e1e30' : '#3A86FF',
                        color: '#f3f5ff', fontSize: 12, lineHeight: 1.5,
                      }}>
                        {m.message}
                        <div style={{ fontSize: 9, color: isAdmin ? '#4a5068' : 'rgba(255,255,255,0.5)', marginTop: 3, textAlign: 'right' }}>
                          {fmtTime(m.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div style={{ borderTop: '1px solid #26263a', padding: '8px 10px', display: 'flex', gap: 7, background: '#0a0a18', flexShrink: 0 }}>
                <input value={text} onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAgentSend(); } }}
                  placeholder="Mensagem para o agente…"
                  style={{ flex: 1, background: '#111118', border: '1px solid #26263a', borderRadius: 8, padding: '8px 11px', color: '#f3f5ff', fontSize: 12, outline: 'none' }}
                />
                <button onClick={handleAgentSend} disabled={sending || !text.trim()}
                  style={{ width: 34, height: 34, background: text.trim() ? '#3A86FF' : '#1e1e30', border: 'none', borderRadius: 8, cursor: text.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Send size={13} color="#fff" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Botão flutuante */}
      <button data-testid="floating-chat-btn" onClick={() => setOpen(o => !o)}
        style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #2563eb, #3A86FF)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 24px rgba(58,134,255,0.5)', position: 'relative', transition: 'transform .15s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {open ? <X size={20} color="#fff" /> : <MessageCircle size={21} color="#fff" />}
        {!open && unread > 0 && (
          <div style={{ position: 'absolute', top: -2, right: -2, width: 18, height: 18, background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', border: '2px solid #0a0a0f' }}>
            {unread}
          </div>
        )}
      </button>

    </div>
  );
}
