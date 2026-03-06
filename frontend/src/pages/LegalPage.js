import React from 'react';
import { Shield, Lock, FileText, Users, AlertCircle, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PAGES = {
  'termos': {
    title: 'Termos e Condições',
    icon: FileText,
    content: `
**1. Aceitação dos Termos**
Ao aceder e utilizar a plataforma EuroVault Investments, o Utilizador aceita integralmente os presentes Termos e Condições. Se não concordar com estes termos, deve cessar imediatamente a utilização da plataforma.

**2. Serviços Disponibilizados**
A EuroVault Investments oferece acesso a plataformas de negociação de instrumentos financeiros, incluindo divisas (Forex), índices, ações, matérias-primas e criptomoedas, através de Contratos por Diferença (CFDs).

**3. Elegibilidade**
Para utilizar os serviços da EuroVault, o Utilizador deve: ter 18 anos ou mais; não ser residente em jurisdições onde a negociação de CFDs seja proibida; ter capacidade legal para celebrar contratos vinculativos.

**4. Risco e Aviso**
A negociação de CFDs envolve riscos significativos de perda de capital. Os CFDs são instrumentos complexos. Avalie cuidadosamente se compreende o funcionamento dos CFDs e se pode suportar o risco de perder o seu capital.

**5. Proteção de Fundos**
Os fundos dos clientes são mantidos em contas segregadas, em conformidade com os requisitos regulatórios da CySEC e da MiFID II. Os fundos elegíveis estão protegidos pelo Fundo de Compensação dos Investidores (ICF) até €20.000.

**6. Política de Execução de Ordens**
A EuroVault compromete-se a executar as ordens dos clientes nas melhores condições possíveis, tendo em conta preço, custo, rapidez e probabilidade de execução.

**7. Rescisão**
A EuroVault reserva-se o direito de suspender ou encerrar contas que violem estes Termos e Condições, sem aviso prévio.

**8. Lei Aplicável**
Estes Termos são regidos pela legislação cipriota e pela legislação da União Europeia aplicável.
    `,
  },
  'privacidade': {
    title: 'Política de Privacidade',
    icon: Lock,
    content: `
**1. Responsável pelo Tratamento**
A EuroVault Investments Ltd. é responsável pelo tratamento dos seus dados pessoais, em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD) — Regulamento (UE) 2016/679.

**2. Dados Recolhidos**
Recolhemos os seguintes dados: Dados de identificação (nome, data de nascimento, documento de identidade); Dados de contacto (e-mail, telefone, morada); Dados financeiros (informações bancárias, histórico de transações); Dados de utilização (logs de acesso, preferências, comportamento na plataforma).

**3. Finalidade do Tratamento**
Os seus dados são tratados para: prestação dos nossos serviços de investimento; cumprimento de obrigações regulatórias (KYC/AML); prevenção de fraude e branqueamento de capitais; melhoria dos nossos serviços; comunicações de marketing (com o seu consentimento).

**4. Prazo de Conservação**
Os dados são conservados pelo período mínimo exigido por lei (geralmente 5-7 anos após o encerramento da conta) ou enquanto for necessário para a finalidade que justificou a recolha.

**5. Direitos do Titular**
Tem o direito de: aceder aos seus dados; corrigir dados inexatos; solicitar o apagamento dos dados; opor-se ao tratamento; portabilidade dos dados; apresentar reclamação à autoridade de controlo.

**6. Segurança**
Implementamos medidas técnicas e organizativas adequadas para proteger os seus dados, incluindo encriptação SSL de 256 bits e certificação PCI DSS.
    `,
  },
  'cookies': {
    title: 'Política de Cookies',
    icon: Shield,
    content: `
**O que são Cookies?**
Cookies são pequenos ficheiros de texto armazenados no seu dispositivo quando visita o nosso website. Utilizamos cookies para melhorar a sua experiência de navegação e para fins analíticos.

**Tipos de Cookies que Utilizamos:**

**Cookies Essenciais** — Necessários para o funcionamento básico da plataforma (autenticação, segurança). Não podem ser desativados.

**Cookies de Desempenho** — Recolhem informações anónimas sobre como os utilizadores interagem com a plataforma, permitindo-nos melhorar a sua performance.

**Cookies Funcionais** — Lembram as suas preferências (idioma, configurações) para personalizar a sua experiência.

**Cookies Analíticos** — Utilizamos Google Analytics para compreender como o nosso site é utilizado. Estas informações são agregadas e anónimas.

**Gestão de Cookies**
Pode gerir as suas preferências de cookies nas definições do browser. Desativar cookies essenciais pode afetar a funcionalidade da plataforma.

**Contacto**
Para questões sobre cookies, contacte-nos: privacy@eurovault-investments.eu
    `,
  },
  'aml': {
    title: 'Política AML/KYC',
    icon: Shield,
    content: `
**Política Anti-Branqueamento de Capitais e Conheça o seu Cliente**

**1. Enquadramento Legal**
A EuroVault Investments implementa procedimentos rigorosos de AML/CFT (Anti-Money Laundering/Counter Financing of Terrorism) em conformidade com: Diretiva (UE) 2018/843 (5ª Diretiva AML); Lei cipriota 188(I)/2007; Regulamentos da CySEC.

**2. Identificação do Cliente (KYC)**
Para abrir uma conta, todos os clientes devem fornecer: Documento de identificação válido (BI, CC ou Passaporte); Comprovativo de morada (emitido nos últimos 3 meses); Declaração da origem dos fundos para depósitos acima de €10.000.

**3. Monitorização de Transações**
Monitorizamos continuamente as transações dos clientes para identificar padrões suspeitos. Transações invulgares podem ser reportadas às autoridades competentes.

**4. Obrigação de Reporte**
Somos obrigados por lei a reportar suspeitas de branqueamento de capitais à Unidade de Inteligência Financeira cipriota (MOKAS).

**5. Congelamento de Fundos**
Reservamo-nos o direito de congelar fundos ou suspender contas em caso de suspeita de atividade ilícita, sem necessidade de aviso prévio.

**6. Atualização de Dados**
Os clientes são obrigados a manter os seus dados KYC atualizados. A não atualização pode resultar na restrição de serviços.
    `,
  },
  'conflitos': {
    title: 'Conflitos de Interesse',
    icon: AlertCircle,
    content: `
**Política de Gestão de Conflitos de Interesse**

**1. Identificação de Conflitos**
A EuroVault Investments identificou as seguintes situações potenciais de conflito de interesse: situações em que a empresa ou os seus colaboradores possam ter um interesse financeiro que conflitue com os interesses do cliente; situações em que a empresa atue simultaneamente como contraparte nas operações do cliente.

**2. Medidas de Gestão**
Para gerir conflitos de interesse, implementamos: separação funcional entre departamentos; políticas de remuneração que não incentivem comportamentos contrários aos interesses dos clientes; formação regular dos colaboradores; arquivo de operações pessoais dos colaboradores.

**3. Divulgação**
Quando as medidas implementadas não sejam suficientes para prevenir prejuízo para o cliente, divulgaremos a natureza geral e as fontes do conflito de interesse antes de prestar o serviço.

**4. Revisão**
Esta política é revista anualmente ou sempre que se verifiquem alterações relevantes na organização ou nos serviços prestados.

**Contacto**
compliance@eurovault-investments.eu
    `,
  },
};

function renderContent(content) {
  return content.trim().split('\n\n').map((block, i) => {
    if (block.startsWith('**') && block.endsWith('**') && !block.slice(2).includes('**')) {
      return <h3 key={i} style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#f3f5ff', margin: '20px 0 8px' }}>{block.replace(/\*\*/g,'')}</h3>;
    }
    const html = block
      .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#f3f5ff">$1</strong>')
      .replace(/\n/g, '<br/>');
    return <p key={i} style={{ fontSize: 13, color: 'hsl(215,16%,68%)', lineHeight: 1.75, margin: '0 0 12px' }} dangerouslySetInnerHTML={{ __html: html }} />;
  });
}

export default function LegalPage() {
  const navigate = useNavigate();
  const page = new URLSearchParams(window.location.search).get('page') || 'termos';
  const data = PAGES[page] || PAGES['termos'];
  const Icon = data.icon;

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(240,33%,5%)', color: '#f3f5ff', padding: '0 0 60px' }}>
      {/* Topbar */}
      <header style={{ background: 'hsl(240,26%,8%)', borderBottom: '1px solid hsl(240,16%,18%)', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <img src="/logo-eurovault.png" alt="EuroVault" style={{ width: 36, height: 36, objectFit: 'contain' }} />
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>EuroVault Investments</div>
          <div style={{ fontSize: 10, color: 'hsl(46,100%,52%)', fontWeight: 700, letterSpacing: '0.1em' }}>INVESTMENTS</div>
        </div>
        <button onClick={() => navigate(-1)}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'transparent', border: '1px solid hsl(240,16%,24%)', borderRadius: 9, color: 'hsl(215,16%,65%)', fontSize: 13, cursor: 'pointer' }}>
          <ChevronLeft size={14} />Voltar
        </button>
      </header>

      {/* Navegação lateral */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px', display: 'flex', gap: 32, alignItems: 'flex-start' }} className="legal-layout">
        <nav style={{ width: 220, flexShrink: 0, position: 'sticky', top: 24 }} className="legal-nav">
          {Object.entries(PAGES).map(([key, p]) => {
            const PIcon = p.icon;
            const active = key === page;
            return (
              <a key={key} href={`/legal?page=${key}`}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 9, textDecoration: 'none', marginBottom: 4, background: active ? 'rgba(58,134,255,0.12)' : 'transparent', border: `1px solid ${active ? 'rgba(58,134,255,0.25)' : 'transparent'}`, color: active ? '#3A86FF' : 'hsl(215,16%,65%)', fontSize: 13, fontWeight: active ? 700 : 500, transition: 'all 0.15s' }}>
                <PIcon size={14} />{p.title.split(' ')[0]}
              </a>
            );
          })}
        </nav>

        {/* Conteúdo */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, background: 'rgba(58,134,255,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} color="#3A86FF" />
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, margin: 0, color: '#f3f5ff' }}>{data.title}</h1>
          </div>
          <div style={{ background: 'hsl(240,26%,8%)', border: '1px solid hsl(240,16%,18%)', borderRadius: 16, padding: '28px 32px' }}>
            {renderContent(data.content)}
          </div>
          <p style={{ fontSize: 11, color: 'hsl(215,16%,40%)', marginTop: 16, textAlign: 'center' }}>
            EuroVault Investments Ltd. · Licença CySEC 409/22 · Última actualização: Março 2025
          </p>
        </div>
      </div>
    </div>
  );
}
