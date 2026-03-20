import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FileText, Shield, RefreshCw, AlertCircle, ChevronLeft, ExternalLink, ChevronDown } from 'lucide-react';
import { useLang } from '../context/LangContext';

const COMPANY = { en: 'EuroVault Investments, S.A.', pt: 'EuroVault Investments, S.A.', es: 'EuroVault Investments, S.A.' };
const EMAIL   = 'legal@eurovault.eu';
const ADDRESS = {
  en: 'Av. Dom João II, No. 35, 7th Floor, Parque das Nações, 1990-095 Lisbon, Portugal',
  pt: 'Av. Dom João II, N.º 35, Piso 7C, Parque das Nações, 1990-095 Lisboa',
  es: 'Av. Dom João II, N.º 35, Piso 7C, Parque das Nações, 1990-095 Lisboa, Portugal',
};
const REG = {
  en: 'CMVM Reg. No. 327 · NIF 502 151 889 · Investment Firm Class 3',
  pt: 'Registo CMVM n.º 327 · NIF 502 151 889 · Empresa de Investimento Classe 3',
  es: 'Registro CMVM n.° 327 · NIF 502 151 889 · Empresa de Inversión Clase 3',
};
const UPDATED = { en: 'March 1, 2026', pt: '1 de Março de 2026', es: '1 de marzo de 2026' };

/* ─────────────────────────────────────────────────
   NAV ITEMS (translated labels)
───────────────────────────────────────────────── */
const NAV = {
  en: [
    { slug: 'terms',   label: 'Terms of Service',           icon: FileText    },
    { slug: 'privacy', label: 'Privacy Policy',              icon: Shield      },
    { slug: 'refund',  label: 'Refund Policy',               icon: RefreshCw   },
    { slug: 'aml',     label: 'AML Policy',                  icon: AlertCircle },
  ],
  pt: [
    { slug: 'terms',   label: 'Termos de Serviço',           icon: FileText    },
    { slug: 'privacy', label: 'Política de Privacidade',     icon: Shield      },
    { slug: 'refund',  label: 'Política de Reembolso',       icon: RefreshCw   },
    { slug: 'aml',     label: 'Política AML',                icon: AlertCircle },
  ],
  es: [
    { slug: 'terms',   label: 'Términos de Servicio',        icon: FileText    },
    { slug: 'privacy', label: 'Política de Privacidad',      icon: Shield      },
    { slug: 'refund',  label: 'Política de Reembolso',       icon: RefreshCw   },
    { slug: 'aml',     label: 'Política AML',                icon: AlertCircle },
  ],
};

/* ─────────────────────────────────────────────────
   LEGAL CONTENT DATA
───────────────────────────────────────────────── */
const CONTENT = {

  /* ══════════════════════════════════ TERMS ═══════════════════════════════ */
  terms: {
    en: { title: 'Terms of Service', sections: [
      { n:1, title:'Acceptance of Terms', body:[
        {t:'p', v:`By accessing or using the EuroVault Platform ("Platform"), a cloud-based data analytics and financial market intelligence SaaS operated by EuroVault Investments, S.A., you agree to be bound by these Terms of Service. If you do not agree, you may not access or use the Platform.`},
        {t:'p', v:`These Terms constitute a legally binding agreement. By creating an account or otherwise accessing the Platform, you represent that you have read, understood, and accept these Terms in their entirety.`},
      ]},
      { n:2, title:'Description of Service', body:[
        {t:'p', v:`The EuroVault Platform is a subscription-based SaaS product providing access to real-time and historical financial market data, analytical tools, data visualisation dashboards, portfolio simulation environments, and market intelligence reports for research and analytical purposes only.`},
        {t:'p', v:`The Platform is strictly a data analysis tool. It does not constitute:`},
        {t:'ul', v:['Investment advice, financial planning, or portfolio management services','A brokerage, exchange, or trading platform for actual financial instruments','Any regulated financial service requiring licensure under applicable securities laws','A recommendation to buy, sell, or hold any security, currency, or financial instrument']},
      ]},
      { n:3, title:'Eligibility and Account Registration', body:[
        {t:'p', v:`To access the Platform, you must: (a) be at least 18 years of age; (b) have legal capacity to enter into a binding contract; (c) not be prohibited from using the Platform under applicable law; and (d) provide accurate and complete registration information.`},
        {t:'p', v:`You are responsible for maintaining confidentiality of your credentials and all activities under your account. Notify us immediately of any unauthorised use at ${EMAIL}.`},
      ]},
      { n:4, title:'Subscriptions and Payment', body:[
        {t:'p', v:`Access requires a valid subscription. Fees are charged in advance monthly or annually in Euros (€), exclusive of applicable taxes. Subscriptions auto-renew unless cancelled at least 48 hours before renewal. We reserve the right to change pricing with 30 days' notice.`},
      ]},
      { n:5, title:'Intellectual Property', body:[
        {t:'p', v:`The Platform and all its components are the exclusive intellectual property of EuroVault Investments, S.A. and its licensors. You receive a limited, non-exclusive, non-transferable, revocable licence to use the Platform solely for internal analytical purposes.`},
        {t:'p', v:`You may not copy, modify, distribute, sell, reverse-engineer, or use the Platform to build a competing product.`},
      ]},
      { n:6, title:'Acceptable Use', body:[
        {t:'p', v:`You shall not use the Platform to:`},
        {t:'ul', v:['Violate any applicable law or regulation','Transmit malicious code or spam','Attempt unauthorised access to any part of the Platform','Engage in market manipulation, insider trading, or financial fraud','Reproduce or commercially exploit Platform content without written authorisation']},
      ]},
      { n:7, title:'Disclaimer of Warranties', body:[
        {t:'p', v:`THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT WARRANT UNINTERRUPTED OR ERROR-FREE SERVICE, ACCURACY OF MARKET DATA, OR FITNESS FOR ANY PARTICULAR PURPOSE. MARKET DATA IS SOURCED FROM THIRD-PARTY PROVIDERS AND MAY BE SUBJECT TO DELAYS OR INACCURACIES.`},
      ]},
      { n:8, title:'Limitation of Liability', body:[
        {t:'p', v:`TO THE MAXIMUM EXTENT PERMITTED BY LAW, EUROVAULT TECHNOLOGIES LTD. SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR AGGREGATE LIABILITY SHALL NOT EXCEED FEES PAID BY YOU IN THE PRECEDING 12 MONTHS.`},
      ]},
      { n:9, title:'Governing Law', body:[
        {t:'p', v:`These Terms are governed by the laws of the Republic of Cyprus. Any dispute shall be subject to the exclusive jurisdiction of the courts of Limassol, Cyprus, after a 30-day good-faith negotiation period.`},
      ]},
      { n:10, title:'Modifications', body:[
        {t:'p', v:`We may modify these Terms at any time with 14 days' advance notice for material changes. Continued use constitutes acceptance of the revised Terms. The current version is always available at this URL.`},
      ]},
    ]},

    pt: { title: 'Termos de Serviço', sections: [
      { n:1, title:'Aceitação dos Termos', body:[
        {t:'p', v:`Ao aceder ou utilizar a Plataforma EuroVault ("Plataforma"), um serviço SaaS de análise de dados financeiros operado pela EuroVault Investments, S.A., o utilizador aceita integralmente os presentes Termos de Serviço. Se não concordar com estes termos, deve cessar imediatamente a utilização da Plataforma.`},
        {t:'p', v:`Estes Termos constituem um acordo juridicamente vinculativo. Ao criar uma conta ou aceder à Plataforma, declara ter lido, compreendido e aceite estes Termos na sua totalidade.`},
      ]},
      { n:2, title:'Descrição do Serviço', body:[
        {t:'p', v:`A Plataforma EuroVault é um produto SaaS por subscrição que fornece acesso a dados de mercados financeiros em tempo real e históricos, ferramentas analíticas, dashboards de visualização de dados, ambientes de simulação de carteiras e relatórios de inteligência de mercado, exclusivamente para fins de investigação e análise.`},
        {t:'p', v:`A Plataforma é estritamente uma ferramenta de análise de dados. Não constitui:`},
        {t:'ul', v:['Aconselhamento de investimento, planeamento financeiro ou gestão de carteiras','Uma plataforma de corretagem, câmbio ou negociação de instrumentos financeiros reais','Qualquer serviço financeiro regulado que exija licenciamento nos termos da legislação aplicável','Uma recomendação para comprar, vender ou manter qualquer valor mobiliário, divisa ou instrumento financeiro']},
      ]},
      { n:3, title:'Elegibilidade e Registo de Conta', body:[
        {t:'p', v:`Para aceder à Plataforma, deve: (a) ter pelo menos 18 anos de idade; (b) ter capacidade legal para celebrar um contrato vinculativo; (c) não estar proibido de utilizar a Plataforma pela legislação aplicável; e (d) fornecer informações de registo precisas e completas.`},
        {t:'p', v:`É responsável pela confidencialidade das suas credenciais e por todas as atividades realizadas na sua conta. Notifique-nos imediatamente de qualquer utilização não autorizada para ${EMAIL}.`},
      ]},
      { n:4, title:'Subscrições e Pagamento', body:[
        {t:'p', v:`O acesso requer uma subscrição válida. As taxas são cobradas antecipadamente mensal ou anualmente em Euros (€), excluindo impostos aplicáveis. As subscrições renovam-se automaticamente, salvo cancelamento com pelo menos 48 horas de antecedência. Reservamo-nos o direito de alterar preços com aviso prévio de 30 dias.`},
      ]},
      { n:5, title:'Propriedade Intelectual', body:[
        {t:'p', v:`A Plataforma e todos os seus componentes são propriedade intelectual exclusiva da EuroVault Investments, S.A. e dos seus licenciadores. O utilizador recebe uma licença limitada, não exclusiva, intransmissível e revogável para utilizar a Plataforma exclusivamente para fins analíticos internos.`},
        {t:'p', v:`Não pode copiar, modificar, distribuir, vender, efetuar engenharia inversa ou utilizar a Plataforma para desenvolver um produto concorrente.`},
      ]},
      { n:6, title:'Utilização Aceitável', body:[
        {t:'p', v:`Não deve utilizar a Plataforma para:`},
        {t:'ul', v:['Violar qualquer lei ou regulamentação aplicável','Transmitir código malicioso ou spam','Tentar acesso não autorizado a qualquer parte da Plataforma','Praticar manipulação de mercado, negociação com informação privilegiada ou fraude financeira','Reproduzir ou explorar comercialmente o conteúdo da Plataforma sem autorização escrita']},
      ]},
      { n:7, title:'Exclusão de Garantias', body:[
        {t:'p', v:`A PLATAFORMA É FORNECIDA "TAL COMO ESTÁ" E "CONFORME DISPONÍVEL" SEM GARANTIAS DE QUALQUER TIPO. NÃO GARANTIMOS SERVIÇO ININTERRUPTO OU SEM ERROS, EXATIDÃO DOS DADOS DE MERCADO, OU ADEQUAÇÃO A QUALQUER FIM ESPECÍFICO. OS DADOS DE MERCADO SÃO FORNECIDOS POR TERCEIROS E PODEM ESTAR SUJEITOS A ATRASOS OU IMPRECISÕES.`},
      ]},
      { n:8, title:'Limitação de Responsabilidade', body:[
        {t:'p', v:`NA MÁXIMA EXTENSÃO PERMITIDA PELA LEI, A EUROVAULT TECHNOLOGIES LDA. NÃO SERÁ RESPONSÁVEL POR DANOS INDIRETOS, INCIDENTAIS, ESPECIAIS, CONSEQUENCIAIS OU PUNITIVOS. A NOSSA RESPONSABILIDADE TOTAL NÃO EXCEDERÁ AS TAXAS PAGAS NOS 12 MESES ANTERIORES.`},
      ]},
      { n:9, title:'Lei Aplicável', body:[
        {t:'p', v:`Estes Termos são regidos pela lei da República do Chipre. Qualquer litígio ficará sujeito à jurisdição exclusiva dos tribunais de Limassol, Chipre, após um período de negociação de boa-fé de 30 dias.`},
      ]},
      { n:10, title:'Modificações', body:[
        {t:'p', v:`Podemos modificar estes Termos a qualquer momento com 14 dias de aviso prévio para alterações materiais. A utilização continuada constitui aceitação dos Termos revistos. A versão atual encontra-se sempre disponível neste endereço.`},
      ]},
    ]},

    es: { title: 'Términos de Servicio', sections: [
      { n:1, title:'Aceptación de los Términos', body:[
        {t:'p', v:`Al acceder o utilizar la Plataforma EuroVault ("Plataforma"), un servicio SaaS de análisis de datos financieros operado por EuroVault Investments, S.A., usted acepta íntegramente estos Términos de Servicio. Si no está de acuerdo, debe cesar inmediatamente el uso de la Plataforma.`},
        {t:'p', v:`Estos Términos constituyen un acuerdo legalmente vinculante. Al crear una cuenta o acceder a la Plataforma, declara haber leído, comprendido y aceptado estos Términos en su totalidad.`},
      ]},
      { n:2, title:'Descripción del Servicio', body:[
        {t:'p', v:`La Plataforma EuroVault es un producto SaaS por suscripción que proporciona acceso a datos de mercados financieros en tiempo real e históricos, herramientas analíticas, paneles de visualización de datos, entornos de simulación de carteras e informes de inteligencia de mercado, exclusivamente para fines de investigación y análisis.`},
        {t:'p', v:`La Plataforma es estrictamente una herramienta de análisis de datos. No constituye:`},
        {t:'ul', v:['Asesoramiento de inversión, planificación financiera o gestión de carteras','Una plataforma de corretaje, intercambio o negociación de instrumentos financieros reales','Cualquier servicio financiero regulado que requiera licencia bajo la legislación aplicable','Una recomendación para comprar, vender o mantener cualquier valor, divisa o instrumento financiero']},
      ]},
      { n:3, title:'Elegibilidad y Registro de Cuenta', body:[
        {t:'p', v:`Para acceder a la Plataforma debe: (a) tener al menos 18 años; (b) tener capacidad legal para celebrar un contrato vinculante; (c) no estar prohibido de usar la Plataforma por la legislación aplicable; y (d) proporcionar información de registro precisa y completa.`},
      ]},
      { n:4, title:'Suscripciones y Pago', body:[
        {t:'p', v:`El acceso requiere una suscripción válida. Las tarifas se cobran por adelantado mensual o anualmente en Euros (€), excluyendo los impuestos aplicables. Las suscripciones se renuevan automáticamente salvo cancelación con al menos 48 horas de antelación.`},
      ]},
      { n:5, title:'Propiedad Intelectual', body:[
        {t:'p', v:`La Plataforma y todos sus componentes son propiedad intelectual exclusiva de EuroVault Investments, S.A. y sus licenciantes. Usted recibe una licencia limitada, no exclusiva, intransferible y revocable para usar la Plataforma exclusivamente para fines analíticos internos.`},
      ]},
      { n:6, title:'Uso Aceptable', body:[
        {t:'p', v:`No debe usar la Plataforma para:`},
        {t:'ul', v:['Violar cualquier ley o regulación aplicable','Transmitir código malicioso o spam','Intentar acceso no autorizado a cualquier parte de la Plataforma','Practicar manipulación de mercado, negociación con información privilegiada o fraude financiero']},
      ]},
      { n:7, title:'Exclusión de Garantías', body:[
        {t:'p', v:`LA PLATAFORMA SE PROPORCIONA "TAL CUAL" Y "SEGÚN DISPONIBILIDAD" SIN GARANTÍAS DE NINGÚN TIPO. NO GARANTIZAMOS SERVICIO ININTERRUMPIDO, EXACTITUD DE LOS DATOS DE MERCADO O IDONEIDAD PARA UN FIN ESPECÍFICO.`},
      ]},
      { n:8, title:'Limitación de Responsabilidad', body:[
        {t:'p', v:`EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY, EUROVAULT TECHNOLOGIES S.L. NO SERÁ RESPONSABLE DE DAÑOS INDIRECTOS, INCIDENTALES, ESPECIALES, CONSECUENTES O PUNITIVOS. NUESTRA RESPONSABILIDAD TOTAL NO EXCEDERÁ LAS TARIFAS PAGADAS EN LOS 12 MESES ANTERIORES.`},
      ]},
      { n:9, title:'Ley Aplicable', body:[
        {t:'p', v:`Estos Términos se rigen por la ley de la República de Chipre. Cualquier disputa estará sujeta a la jurisdicción exclusiva de los tribunales de Limassol, Chipre.`},
      ]},
      { n:10, title:'Modificaciones', body:[
        {t:'p', v:`Podemos modificar estos Términos en cualquier momento con 14 días de aviso previo para cambios materiales. El uso continuado constituye aceptación de los Términos revisados.`},
      ]},
    ]},
  },

  /* ══════════════════════════════════ PRIVACY ═══════════════════════════════ */
  privacy: {
    en: { title: 'Privacy Policy', sections: [
      { n:1, title:'Introduction and Data Controller', body:[
        {t:'p', v:`EuroVault Investments, S.A. is the data controller for personal data processed through the EuroVault Platform. We are committed to protecting your privacy in accordance with GDPR (EU) 2016/679. Contact our Data Protection Officer at ${EMAIL}.`},
      ]},
      { n:2, title:'Personal Data We Collect', body:[
        {t:'ul', v:['Identity Data: full name, date of birth, government-issued ID number','Contact Data: email address, telephone number, postal address','Account Data: username, encrypted password, subscription status','Financial Data: tokenised payment card details, billing address, transaction history','Technical Data: IP address, browser type, device identifiers, operating system','Usage Data: pages visited, features accessed, session duration, clickstream data']},
      ]},
      { n:3, title:'Legal Basis and Purposes', body:[
        {t:'ul', v:['Contractual Necessity (Art. 6(1)(b)): to provide subscription services and process payments','Legal Obligation (Art. 6(1)(c)): to comply with AML/KYC and tax regulations','Legitimate Interests (Art. 6(1)(f)): fraud prevention, security, analytics, service improvement','Consent (Art. 6(1)(a)): marketing communications and non-essential cookies']},
      ]},
      { n:4, title:'Data Sharing', body:[
        {t:'p', v:`We share data only with: payment processors (PCI DSS compliant), cloud infrastructure providers, analytics providers (pseudonymised data), legal/regulatory authorities when required by law, and professional advisors under confidentiality obligations. We do not sell your data.`},
      ]},
      { n:5, title:'Data Retention', body:[
        {t:'ul', v:['Account Data: subscription duration plus 7 years after closure','Financial/Transaction Records: minimum 7 years','Technical/Usage Data: up to 24 months','Support Communications: 3 years from last interaction']},
      ]},
      { n:6, title:'Your Rights (GDPR)', body:[
        {t:'ul', v:['Right of Access (Art. 15): receive a copy of your data','Right to Rectification (Art. 16): correct inaccurate data','Right to Erasure (Art. 17): deletion in certain circumstances','Right to Restriction (Art. 18): restrict processing in specific situations','Right to Data Portability (Art. 20): receive data in machine-readable format','Right to Object (Art. 21): object to legitimate interests processing']},
        {t:'p', v:`Submit requests to ${EMAIL}. We respond within 30 days. You may lodge a complaint with the Cyprus Commissioner for Personal Data Protection.`},
      ]},
      { n:7, title:'Cookies', body:[
        {t:'ul', v:['Strictly Necessary: essential for Platform operation (cannot be disabled)','Performance: anonymous usage statistics','Functional: remember preferences such as language and currency','Analytical: understand user interaction patterns']},
      ]},
      { n:8, title:'Security', body:[
        {t:'ul', v:['TLS 1.3 for all data in transit','AES-256 encryption at rest','Multi-factor authentication for administrative access','Regular penetration testing and security audits','Role-based access control with least-privilege principle']},
      ]},
    ]},

    pt: { title: 'Política de Privacidade', sections: [
      { n:1, title:'Introdução e Responsável pelo Tratamento', body:[
        {t:'p', v:`A EuroVault Investments, S.A. é o responsável pelo tratamento dos dados pessoais processados através da Plataforma EuroVault. Estamos empenhados em proteger a sua privacidade de acordo com o RGPD (UE) 2016/679. Contacte o nosso Encarregado de Proteção de Dados em ${EMAIL}.`},
      ]},
      { n:2, title:'Dados Pessoais que Recolhemos', body:[
        {t:'ul', v:['Dados de Identificação: nome completo, data de nascimento, número de identificação emitido pelo governo','Dados de Contacto: endereço de e-mail, número de telefone, morada postal','Dados de Conta: nome de utilizador, palavra-passe encriptada, estado da subscrição','Dados Financeiros: dados do cartão de pagamento tokenizados, morada de faturação, histórico de transações','Dados Técnicos: endereço IP, tipo de browser, identificadores de dispositivo, sistema operativo','Dados de Utilização: páginas visitadas, funcionalidades acedidas, duração da sessão']},
      ]},
      { n:3, title:'Base Legal e Finalidades', body:[
        {t:'ul', v:['Necessidade Contratual (Art. 6.º(1)(b)): para prestar serviços de subscrição e processar pagamentos','Obrigação Legal (Art. 6.º(1)(c)): para cumprir regulamentação AML/KYC e fiscal','Interesses Legítimos (Art. 6.º(1)(f)): prevenção de fraude, segurança e melhoria do serviço','Consentimento (Art. 6.º(1)(a)): comunicações de marketing e cookies não essenciais']},
      ]},
      { n:4, title:'Partilha de Dados', body:[
        {t:'p', v:`Partilhamos dados apenas com: processadores de pagamento (conformes com PCI DSS), fornecedores de infraestrutura cloud, fornecedores de análise (dados pseudonimizados), autoridades legais/regulatórias quando exigido por lei, e consultores profissionais sob obrigações de confidencialidade. Não vendemos os seus dados.`},
      ]},
      { n:5, title:'Conservação de Dados', body:[
        {t:'ul', v:['Dados de Conta: duração da subscrição acrescida de 7 anos após encerramento','Registos Financeiros/de Transações: mínimo de 7 anos','Dados Técnicos/de Utilização: até 24 meses','Comunicações de Suporte: 3 anos a partir da última interação']},
      ]},
      { n:6, title:'Os Seus Direitos (RGPD)', body:[
        {t:'ul', v:['Direito de Acesso (Art. 15.º): receber uma cópia dos seus dados','Direito de Retificação (Art. 16.º): corrigir dados inexatos','Direito ao Apagamento (Art. 17.º): eliminação em determinadas circunstâncias','Direito à Limitação (Art. 18.º): restringir o tratamento em situações específicas','Direito à Portabilidade (Art. 20.º): receber dados em formato legível por máquina','Direito de Oposição (Art. 21.º): opor-se ao tratamento com base em interesses legítimos']},
        {t:'p', v:`Envie os seus pedidos para ${EMAIL}. Respondemos no prazo de 30 dias. Pode apresentar reclamação à Comissão Nacional de Proteção de Dados (CNPD).`},
      ]},
      { n:7, title:'Cookies', body:[
        {t:'ul', v:['Estritamente Necessários: essenciais para o funcionamento da Plataforma (não podem ser desativados)','De Desempenho: estatísticas de utilização anónimas','Funcionais: memorizam preferências como idioma e moeda','Analíticos: compreendem os padrões de interação dos utilizadores']},
      ]},
      { n:8, title:'Segurança', body:[
        {t:'ul', v:['TLS 1.3 para todos os dados em trânsito','Encriptação AES-256 em repouso','Autenticação multifator para acesso administrativo','Testes de penetração e auditorias de segurança regulares','Controlo de acesso baseado em funções com princípio de privilégio mínimo']},
      ]},
    ]},

    es: { title: 'Política de Privacidad', sections: [
      { n:1, title:'Introducción y Responsable del Tratamiento', body:[
        {t:'p', v:`EuroVault Investments, S.A. es el responsable del tratamiento de datos personales procesados a través de la Plataforma EuroVault. Estamos comprometidos con la protección de su privacidad de conformidad con el RGPD (UE) 2016/679. Contacte a nuestro Delegado de Protección de Datos en ${EMAIL}.`},
      ]},
      { n:2, title:'Datos Personales que Recopilamos', body:[
        {t:'ul', v:['Datos de Identidad: nombre completo, fecha de nacimiento, número de identificación oficial','Datos de Contacto: dirección de correo electrónico, número de teléfono, dirección postal','Datos de Cuenta: nombre de usuario, contraseña cifrada, estado de suscripción','Datos Financieros: datos de tarjeta de pago tokenizados, dirección de facturación','Datos Técnicos: dirección IP, tipo de navegador, identificadores de dispositivo','Datos de Uso: páginas visitadas, funciones accedidas, duración de sesión']},
      ]},
      { n:3, title:'Base Legal y Finalidades', body:[
        {t:'ul', v:['Necesidad Contractual (Art. 6(1)(b)): para prestar servicios de suscripción y procesar pagos','Obligación Legal (Art. 6(1)(c)): para cumplir la normativa AML/KYC y fiscal','Intereses Legítimos (Art. 6(1)(f)): prevención de fraude, seguridad y mejora del servicio','Consentimiento (Art. 6(1)(a)): comunicaciones de marketing y cookies no esenciales']},
      ]},
      { n:4, title:'Compartir Datos', body:[
        {t:'p', v:`Compartimos datos únicamente con: procesadores de pagos (conformes con PCI DSS), proveedores de infraestructura cloud, proveedores de análisis (datos seudonimizados), autoridades legales/regulatorias cuando lo exija la ley, y asesores profesionales bajo obligaciones de confidencialidad. No vendemos sus datos.`},
      ]},
      { n:5, title:'Conservación de Datos', body:[
        {t:'ul', v:['Datos de Cuenta: duración de la suscripción más 7 años tras el cierre','Registros Financieros/de Transacciones: mínimo 7 años','Datos Técnicos/de Uso: hasta 24 meses','Comunicaciones de Soporte: 3 años desde la última interacción']},
      ]},
      { n:6, title:'Sus Derechos (RGPD)', body:[
        {t:'ul', v:['Derecho de Acceso (Art. 15): recibir una copia de sus datos','Derecho de Rectificación (Art. 16): corregir datos inexactos','Derecho de Supresión (Art. 17): eliminación en determinadas circunstancias','Derecho a la Portabilidad (Art. 20): recibir datos en formato legible por máquina','Derecho de Oposición (Art. 21): oponerse al tratamiento basado en intereses legítimos']},
        {t:'p', v:`Envíe sus solicitudes a ${EMAIL}. Respondemos en 30 días. Puede presentar reclamación ante la Agencia Española de Protección de Datos (AEPD).`},
      ]},
      { n:7, title:'Cookies', body:[
        {t:'ul', v:['Estrictamente Necesarias: esenciales para el funcionamiento de la Plataforma','De Rendimiento: estadísticas de uso anónimas','Funcionales: recuerdan preferencias como idioma y moneda','Analíticas: comprenden los patrones de interacción de los usuarios']},
      ]},
      { n:8, title:'Seguridad', body:[
        {t:'ul', v:['TLS 1.3 para todos los datos en tránsito','Cifrado AES-256 en reposo','Autenticación multifactor para acceso administrativo','Pruebas de penetración y auditorías de seguridad regulares']},
      ]},
    ]},
  },

  /* ══════════════════════════════════ REFUND ═══════════════════════════════ */
  refund: {
    en: { title: 'Refund Policy', sections: [
      { n:1, title:'Overview', body:[{t:'p', v:`This Refund Policy governs refund requests for subscriptions to the EuroVault Platform operated by EuroVault Investments, S.A. We are committed to fair billing practices. By subscribing, you agree to this Policy, which is incorporated by reference into our Terms of Service.`}]},
      { n:2, title:'Subscription Billing', body:[{t:'p', v:`The Platform is offered as a subscription service billed monthly or annually in advance. Given immediate access to all Platform features upon payment, specific conditions apply to refund eligibility.`}]},
      { n:3, title:'Refund Eligibility', body:[
        {t:'p', v:`14-Day Money-Back Guarantee: First-time subscribers may request a full refund within 14 calendar days of initial payment, provided the Platform was accessed for fewer than 3 cumulative hours. This applies once per account.`},
        {t:'p', v:`Service Disruption Credits: If monthly uptime falls below 99.0%, affected subscribers may request a pro-rata service credit applied to future billing cycles.`},
        {t:'p', v:`Billing Errors: Incorrect charges due to our billing error will be refunded within 10 business days of verification.`},
      ]},
      { n:4, title:'Non-Refundable Items', body:[
        {t:'ul', v:['Monthly renewals active for more than 72 hours','Annual subscriptions after the 14-day guarantee period','Partial months upon voluntary cancellation','Subscriptions via third-party resellers','Accounts terminated for Terms of Service violations','Promotional or discounted subscriptions']},
      ]},
      { n:5, title:'Requesting a Refund', body:[
        {t:'p', v:`Email our Billing Team at ${EMAIL} with subject "Refund Request — [Account Email]". Include: full name, transaction ID, charge date, reason, and supporting documentation. We acknowledge within 2 business days and respond within 10. Approved refunds process to the original payment method within 5–10 business days.`},
      ]},
      { n:6, title:'Cancellation', body:[{t:'p', v:`Cancel anytime through account settings. Access continues until the end of the current paid period. No refund for unused portions unless expressly provided above.`}]},
      { n:7, title:'Chargebacks', body:[{t:'p', v:`Contact us before initiating a chargeback. Initiating one without first seeking resolution may result in account suspension. For unauthorised charges, contact us immediately at ${EMAIL}.`}]},
    ]},

    pt: { title: 'Política de Reembolso', sections: [
      { n:1, title:'Visão Geral', body:[{t:'p', v:`Esta Política de Reembolso rege os pedidos de reembolso de subscrições da Plataforma EuroVault operada pela EuroVault Investments, S.A. Estamos empenhados em práticas de faturação justas. Ao subscrever, aceita esta Política, incorporada por referência nos nossos Termos de Serviço.`}]},
      { n:2, title:'Faturação de Subscrição', body:[{t:'p', v:`A Plataforma é oferecida como um serviço de subscrição faturado mensalmente ou anualmente com pagamento antecipado. Dado o acesso imediato a todas as funcionalidades da Plataforma após o pagamento, aplicam-se condições específicas à elegibilidade para reembolso.`}]},
      { n:3, title:'Elegibilidade para Reembolso', body:[
        {t:'p', v:`Garantia de Devolução de Dinheiro de 14 Dias: Os novos subscritores podem solicitar um reembolso total no prazo de 14 dias calendário após o pagamento inicial, desde que a Plataforma tenha sido acedida por menos de 3 horas cumulativas. Esta garantia aplica-se uma vez por conta.`},
        {t:'p', v:`Créditos por Interrupção do Serviço: Se a disponibilidade mensal for inferior a 99,0%, os subscritores afetados podem solicitar um crédito de serviço pro-rata aplicado a ciclos de faturação futuros.`},
        {t:'p', v:`Erros de Faturação: Cobranças incorretas resultantes de um erro da nossa parte serão reembolsadas no prazo de 10 dias úteis após verificação.`},
      ]},
      { n:4, title:'Itens Não Reembolsáveis', body:[
        {t:'ul', v:['Renovações mensais ativas há mais de 72 horas','Subscrições anuais após o período de garantia de 14 dias','Meses parciais após cancelamento voluntário','Subscrições adquiridas através de revendedores terceiros','Contas encerradas por violação dos Termos de Serviço','Subscrições promocionais ou com desconto']},
      ]},
      { n:5, title:'Como Solicitar Reembolso', body:[
        {t:'p', v:`Envie um e-mail para ${EMAIL} com o assunto "Pedido de Reembolso — [E-mail da Conta]". Inclua: nome completo, ID da transação, data da cobrança, motivo e documentação de suporte. Confirmamos o pedido em 2 dias úteis e respondemos em 10. Os reembolsos aprovados são processados para o método de pagamento original em 5 a 10 dias úteis.`},
      ]},
      { n:6, title:'Cancelamento', body:[{t:'p', v:`Cancele a qualquer momento nas definições da conta. O acesso continua até ao final do período pago atual. Não há reembolso por períodos não utilizados, salvo o expressamente previsto acima.`}]},
      { n:7, title:'Estornos', body:[{t:'p', v:`Contacte-nos antes de iniciar um estorno junto da sua instituição bancária. Iniciar um processo sem primeiro tentar a resolução através do nosso suporte pode resultar na suspensão da conta. Para cobranças não autorizadas, contacte-nos imediatamente para ${EMAIL}.`}]},
    ]},

    es: { title: 'Política de Reembolso', sections: [
      { n:1, title:'Descripción General', body:[{t:'p', v:`Esta Política de Reembolso rige las solicitudes de reembolso de suscripciones a la Plataforma EuroVault operada por EuroVault Investments, S.A. Estamos comprometidos con prácticas de facturación justas.`}]},
      { n:2, title:'Facturación de Suscripción', body:[{t:'p', v:`La Plataforma se ofrece como servicio de suscripción facturado mensual o anualmente por adelantado. Dado el acceso inmediato a todas las funciones tras el pago, se aplican condiciones específicas a la elegibilidad de reembolso.`}]},
      { n:3, title:'Elegibilidad para Reembolso', body:[
        {t:'p', v:`Garantía de Devolución de 14 Días: Los nuevos suscriptores pueden solicitar reembolso total en 14 días calendario desde el pago inicial, siempre que la Plataforma haya sido accedida menos de 3 horas acumuladas. Aplica una vez por cuenta.`},
        {t:'p', v:`Créditos por Interrupción del Servicio: Si la disponibilidad mensual cae por debajo del 99,0%, los suscriptores afectados pueden solicitar un crédito de servicio prorrateado.`},
      ]},
      { n:4, title:'Elementos No Reembolsables', body:[
        {t:'ul', v:['Renovaciones mensuales activas más de 72 horas','Suscripciones anuales tras el período de garantía de 14 días','Meses parciales tras cancelación voluntaria','Suscripciones adquiridas a través de terceros','Cuentas suspendidas por violación de los Términos']},
      ]},
      { n:5, title:'Cómo Solicitar Reembolso', body:[
        {t:'p', v:`Envíe un correo a ${EMAIL} con el asunto "Solicitud de Reembolso — [Correo de Cuenta]". Incluya: nombre completo, ID de transacción, fecha del cargo, motivo y documentación. Confirmamos en 2 días hábiles y respondemos en 10. Los reembolsos aprobados se procesan en 5-10 días hábiles.`},
      ]},
      { n:6, title:'Cancelación', body:[{t:'p', v:`Cancele en cualquier momento desde la configuración de cuenta. El acceso continúa hasta el fin del período pagado actual.`}]},
      { n:7, title:'Contracargos', body:[{t:'p', v:`Contáctenos antes de iniciar un contracargo. Iniciar uno sin buscar resolución previa puede resultar en la suspensión de la cuenta.`}]},
    ]},
  },

  /* ══════════════════════════════════ AML ═══════════════════════════════ */
  aml: {
    en: { title: 'Anti-Money Laundering (AML) Policy', sections: [
      { n:1, title:'Introduction', body:[{t:'p', v:`EuroVault Investments, S.A. is committed to the highest standards of AML and counter-terrorism financing (CTF) compliance. This Policy sets out our obligations to detect, prevent, and report money laundering and terrorism financing activities. It applies to all employees, contractors, and third parties acting on our behalf.`}]},
      { n:2, title:'Regulatory Framework', body:[
        {t:'ul', v:['Directive (EU) 2018/843 — 5th Anti-Money Laundering Directive (5AMLD)','Directive (EU) 2015/849 — 4th Anti-Money Laundering Directive (4AMLD)','Cyprus Law 188(I)/2007 on Prevention and Suppression of Money Laundering','CySEC Circular C374 — AML/CFT Obligations','FATF Recommendations 2023','EU Sanctions Regulation and applicable OFAC guidance']},
      ]},
      { n:3, title:'Customer Due Diligence (CDD)', body:[
        {t:'p', v:`We apply a risk-based approach to CDD. Standard measures include:`},
        {t:'ul', v:['Verification of full legal name, date of birth, and residential address','Government-issued photo identification (passport, national ID, or driving licence)','Proof of address dated within 90 days','Screening against applicable sanctions lists (OFAC, EU Consolidated List, UN)','Assessment of source of funds where required']},
        {t:'p', v:`CDD is ongoing. We may request updated documentation at any time.`},
      ]},
      { n:4, title:'Enhanced Due Diligence (EDD)', body:[
        {t:'p', v:`EDD applies to higher-risk users including:`},
        {t:'ul', v:['Politically Exposed Persons (PEPs) and their close associates','Users from high-risk jurisdictions (FATF or EU list)','Users with complex beneficial ownership structures','Accounts with activity deviating significantly from expected behaviour']},
      ]},
      { n:5, title:'Transaction Monitoring', body:[
        {t:'p', v:`Our systems flag suspicious indicators including:`},
        {t:'ul', v:['Unusually large or frequent payments inconsistent with user profile','Payments from multiple cards registered to different identities','Connection from high-risk IPs or anonymisation services','Activity inconsistent with stated purpose of use']},
      ]},
      { n:6, title:'Suspicious Activity Reporting', body:[{t:'p', v:`Where we have reasonable suspicion of money laundering or terrorism financing, we are legally obligated to file a Suspicious Activity Report (SAR) with the Cyprus Financial Intelligence Unit (MOKAS) without delay and without tipping off the subject. Internal reports must be submitted to our MLRO at ${EMAIL}.`}]},
      { n:7, title:'Record Keeping', body:[
        {t:'ul', v:['Customer identification documents: minimum 5 years from account closure','Transaction records: minimum 5 years from transaction date','SAR and supporting documentation: minimum 5 years from filing','Compliance training records: minimum 5 years']},
      ]},
      { n:8, title:'Sanctions Compliance', body:[{t:'p', v:`We maintain zero tolerance for business with sanctioned individuals or entities. We screen all users against EU, OFAC, UN, and HM Treasury sanctions lists at onboarding and on an ongoing basis. Confirmed matches result in account suspension and notification to competent authorities.`}]},
      { n:9, title:'Training', body:[{t:'p', v:`All staff with access to user data receive mandatory AML/CTF training upon hire and annually thereafter. This Policy is reviewed at least annually and updated to reflect regulatory changes.`}]},
      { n:10, title:'Contact', body:[{t:'p', v:`Report concerns to our MLRO confidentially at ${EMAIL}. Whistleblowers acting in good faith are protected under applicable law. Retaliation is strictly prohibited.`}]},
    ]},

    pt: { title: 'Política Anti-Branqueamento de Capitais (AML)', sections: [
      { n:1, title:'Introdução', body:[{t:'p', v:`A EuroVault Investments, S.A. está empenhada nos mais elevados padrões de conformidade com as obrigações de prevenção do branqueamento de capitais (AML) e financiamento do terrorismo (CTF). Esta Política define as nossas obrigações para detetar, prevenir e comunicar atividades de branqueamento de capitais e financiamento do terrorismo.`}]},
      { n:2, title:'Enquadramento Regulatório', body:[
        {t:'ul', v:['Diretiva (UE) 2018/843 — 5.ª Diretiva AML (5AMLD)','Diretiva (UE) 2015/849 — 4.ª Diretiva AML (4AMLD)','Lei n.º 188(I)/2007 do Chipre sobre Prevenção do Branqueamento de Capitais','Circular C374 da CySEC — Obrigações AML/CFT','Recomendações do GAFI 2023','Regulamento de Sanções da UE e orientações OFAC aplicáveis']},
      ]},
      { n:3, title:'Diligência Devida do Cliente (CDD)', body:[
        {t:'p', v:`Aplicamos uma abordagem baseada no risco à Diligência Devida do Cliente. As medidas padrão incluem:`},
        {t:'ul', v:['Verificação do nome legal completo, data de nascimento e morada','Documento de identificação com fotografia emitido pelo governo (passaporte, BI/CC ou carta de condução)','Comprovativo de morada com data dos últimos 90 dias','Verificação contra listas de sanções aplicáveis (OFAC, Lista Consolidada da UE, ONU)','Avaliação da origem dos fundos quando exigida']},
      ]},
      { n:4, title:'Diligência Devida Reforçada (EDD)', body:[
        {t:'p', v:`A EDD aplica-se a utilizadores de maior risco, incluindo:`},
        {t:'ul', v:['Pessoas Politicamente Expostas (PEP) e os seus associados próximos','Utilizadores de jurisdições de risco elevado (lista GAFI ou UE)','Utilizadores com estruturas societárias complexas','Contas com atividade que se desvia significativamente do comportamento esperado']},
      ]},
      { n:5, title:'Monitorização de Transações', body:[
        {t:'p', v:`Os nossos sistemas identificam indicadores suspeitos, incluindo:`},
        {t:'ul', v:['Pagamentos invulgarmente elevados ou frequentes inconsistentes com o perfil do utilizador','Pagamentos com múltiplos cartões registados em diferentes identidades','Ligações a partir de IPs de risco elevado ou serviços de anonimização','Atividade inconsistente com a finalidade de utilização declarada']},
      ]},
      { n:6, title:'Comunicação de Atividade Suspeita', body:[{t:'p', v:`Quando tivermos suspeita razoável de branqueamento de capitais ou financiamento do terrorismo, somos legalmente obrigados a apresentar uma Comunicação de Operação Suspeita (COS) ao MOKAS (Unidade de Informação Financeira do Chipre) sem demora e sem alertar o visado. Os relatórios internos devem ser submetidos ao nosso Responsável pelo Controlo do Branqueamento de Capitais (RCBC) em ${EMAIL}.`}]},
      { n:7, title:'Conservação de Registos', body:[
        {t:'ul', v:['Documentos de identificação de clientes: mínimo de 5 anos após encerramento da conta','Registos de transações: mínimo de 5 anos a partir da data da transação','COS e documentação de suporte: mínimo de 5 anos após apresentação','Registos de formação em conformidade: mínimo de 5 anos']},
      ]},
      { n:8, title:'Conformidade com Sanções', body:[{t:'p', v:`Mantemos uma política de tolerância zero relativamente a negócios com indivíduos ou entidades sujeitos a sanções aplicáveis. Verificamos todos os utilizadores contra as listas de sanções da UE, OFAC, ONU e HM Treasury no momento da integração e de forma contínua.`}]},
      { n:9, title:'Formação', body:[{t:'p', v:`Todos os colaboradores com acesso a dados de utilizadores recebem formação obrigatória em AML/CTF aquando da admissão e anualmente. Esta Política é revista pelo menos uma vez por ano.`}]},
      { n:10, title:'Contacto', body:[{t:'p', v:`Comunique preocupações ao nosso RCBC de forma confidencial para ${EMAIL}. Os denunciantes que atuem de boa-fé estão protegidos pela legislação aplicável. Qualquer retaliação é expressamente proibida.`}]},
    ]},

    es: { title: 'Política Antilavado de Dinero (AML)', sections: [
      { n:1, title:'Introducción', body:[{t:'p', v:`EuroVault Investments, S.A. está comprometida con los más altos estándares de cumplimiento AML y financiación del terrorismo (CTF). Esta Política establece nuestras obligaciones para detectar, prevenir e informar actividades de lavado de dinero y financiación del terrorismo.`}]},
      { n:2, title:'Marco Regulatorio', body:[
        {t:'ul', v:['Directiva (UE) 2018/843 — 5.ª Directiva AML (5AMLD)','Directiva (UE) 2015/849 — 4.ª Directiva AML (4AMLD)','Ley chipriota 188(I)/2007 sobre Prevención del Blanqueo de Capitales','Circular C374 de CySEC — Obligaciones AML/CFT','Recomendaciones del GAFI 2023']},
      ]},
      { n:3, title:'Diligencia Debida del Cliente (DDC)', body:[
        {t:'p', v:`Aplicamos un enfoque basado en el riesgo. Las medidas estándar incluyen:`},
        {t:'ul', v:['Verificación de nombre completo, fecha de nacimiento y domicilio','Documento de identidad con fotografía emitido por el gobierno','Justificante de domicilio con fecha de los últimos 90 días','Verificación contra listas de sanciones aplicables (OFAC, Lista Consolidada UE, ONU)']},
      ]},
      { n:4, title:'Diligencia Debida Reforzada (DDR)', body:[
        {t:'ul', v:['Personas Políticamente Expuestas (PEP) y sus asociados cercanos','Usuarios de jurisdicciones de alto riesgo (lista GAFI o UE)','Usuarios con estructuras societarias complejas','Cuentas con actividad que se desvía significativamente del comportamiento esperado']},
      ]},
      { n:5, title:'Monitoreo de Transacciones', body:[
        {t:'ul', v:['Pagos inusualmente grandes o frecuentes inconsistentes con el perfil del usuario','Pagos con múltiples tarjetas registradas en distintas identidades','Conexiones desde IPs de alto riesgo o servicios de anonimización']},
      ]},
      { n:6, title:'Reporte de Actividad Sospechosa', body:[{t:'p', v:`Cuando tengamos sospecha razonable de lavado de dinero o financiación del terrorismo, estamos legalmente obligados a presentar un Reporte de Actividad Sospechosa (RAS) ante la Unidad de Inteligencia Financiera de Chipre (MOKAS) sin demora. Los reportes internos deben enviarse a nuestro RCBC en ${EMAIL}.`}]},
      { n:7, title:'Conservación de Registros', body:[
        {t:'ul', v:['Documentos de identificación: mínimo 5 años desde el cierre de cuenta','Registros de transacciones: mínimo 5 años','RAS y documentación de soporte: mínimo 5 años desde la presentación']},
      ]},
      { n:8, title:'Cumplimiento de Sanciones', body:[{t:'p', v:`Mantenemos tolerancia cero ante negocios con personas o entidades sancionadas. Verificamos todos los usuarios contra las listas de sanciones de la UE, OFAC, ONU y HM Treasury al incorporarse y de forma continua.`}]},
      { n:9, title:'Formación', body:[{t:'p', v:`Todo el personal con acceso a datos de usuarios recibe formación obligatoria en AML/CTF al incorporarse y anualmente. Esta Política se revisa al menos una vez al año.`}]},
      { n:10, title:'Contacto', body:[{t:'p', v:`Reporte preocupaciones a nuestro RCBC confidencialmente en ${EMAIL}. Los denunciantes que actúen de buena fe están protegidos por la ley aplicable.`}]},
    ]},
  },
};

/* ─────────────────────────────────────────────────
   CONTENT RENDERER
───────────────────────────────────────────────── */
function RenderSection({ section }) {
  return (
    <section style={{ marginBottom: '2.2rem' }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0d1b2a', marginBottom: '0.7rem',
                   display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#3A86FF', minWidth: 24,
                       background: 'rgba(58,134,255,0.08)', padding: '2px 6px',
                       borderRadius: 5, textAlign: 'center', flexShrink: 0 }}>{section.n}</span>
        {section.title}
      </h2>
      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.8, paddingLeft: 34 }}>
        {section.body.map((b, i) => b.t === 'p'
          ? <p key={i} style={{ margin: '0 0 0.7rem' }}>{b.v}</p>
          : <ul key={i} style={{ margin: '0.3rem 0 0.7rem', paddingLeft: '1.4rem' }}>
              {b.v.map((item, j) => <li key={j} style={{ marginBottom: '0.3rem' }}>{item}</li>)}
            </ul>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────── */
export default function LegalPage() {
  const { slug }   = useParams();
  const navigate   = useNavigate();
  const { lang }   = useLang();
  const l          = ['pt','en','es'].includes(lang) ? lang : 'en';

  const [isMobile, setIsMobile] = useState(false); // layout handled via CSS classes

  const currentSlug = CONTENT[slug] ? slug : 'terms';

  useEffect(() => {
    window.scrollTo(0, 0);
    if (slug && !CONTENT[slug]) navigate('/legal/terms', { replace: true });
  }, [slug, navigate]);

  const pageContent = CONTENT[currentSlug][l] || CONTENT[currentSlug]['en'];
  const navItems    = NAV[l] || NAV['en'];
  const currentNav  = navItems.find(n => n.slug === currentSlug);

  const labels = {
    en: { back: 'Back', platform: 'DATA ANALYTICS PLATFORM', docs: 'LEGAL DOCUMENTS',
          company_info: 'Company Information', questions: 'Questions? Contact us at', related: 'Related:',
          updated: 'Last Updated:' },
    pt: { back: 'Voltar', platform: 'PLATAFORMA DE ANÁLISE DE DADOS', docs: 'DOCUMENTOS LEGAIS',
          company_info: 'Informações da Empresa', questions: 'Dúvidas? Contacte-nos em', related: 'Relacionado:',
          updated: 'Última Actualização:' },
    es: { back: 'Volver', platform: 'PLATAFORMA DE ANÁLISIS DE DATOS', docs: 'DOCUMENTOS LEGALES',
          company_info: 'Información de la Empresa', questions: '¿Preguntas? Contáctenos en', related: 'Relacionado:',
          updated: 'Última Actualización:' },
  };
  const tx = labels[l] || labels['en'];

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'var(--font-body)' }}>

      {/* ── Top bar ── */}
      <div style={{ background: '#0A1628', borderBottom: '3px solid #C9A84C' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '12px 16px' : '14px 28px',
                      display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <img src="/logo-eurovault.png" alt="EuroVault" style={{ width: 34, height: 34, objectFit: 'contain' }} />
            {!isMobile && (
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 800, color: '#fff' }}>EuroVault</div>
                <div style={{ fontSize: 8, color: '#C9A84C', fontWeight: 700, letterSpacing: '0.12em' }}>{tx.platform}</div>
              </div>
            )}
          </a>
          <div style={{ flex: 1 }} />
          <button onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.08)',
                     border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '7px 12px',
                     color: '#CBD5E1', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
            <ChevronLeft size={14} />{tx.back}
          </button>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="legal-hero" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #1E3A5F 100%)',
                    padding: '40px 28px 32px', textAlign: 'center' }}>
        <div style={{ width: 46, height: 46, background: 'rgba(201,168,76,0.15)', border: '2px solid rgba(201,168,76,0.35)',
                      borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 12px' }}>
          {currentNav && <currentNav.icon size={20} color="#C9A84C" />}
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: isMobile ? 22 : 26, fontWeight: 900,
                     color: '#fff', margin: '0 0 7px', letterSpacing: '-0.02em' }}>
          {pageContent.title}
        </h1>
        <p style={{ color: '#94A3B8', fontSize: 12, margin: 0 }}>
          {COMPANY[l]} &bull; {tx.updated} {UPDATED[l]}
        </p>
      </div>

      {/* ── Mobile tab strip ── */}
      <div className="legal-mobile-tabs">
        {navItems.map(({ slug: s, label, icon: Icon }) => {
          const isActive = currentSlug === s;
          return (
            <Link key={s} to={`/legal/${s}`}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                       padding: '10px 14px', textDecoration: 'none', fontSize: 10, fontWeight: isActive ? 700 : 500,
                       color: isActive ? '#3A86FF' : '#6B7280', whiteSpace: 'nowrap',
                       borderBottom: `2px solid ${isActive ? '#3A86FF' : 'transparent'}`,
                       transition: 'all .15s' }}>
              <Icon size={14} />
              {label}
            </Link>
          );
        })}
      </div>

      {/* ── Main layout ── */}
      <div className="legal-grid-wrapper">

        {/* Desktop sidebar */}
        <nav className="legal-sidebar-nav">
          <div style={{ padding: '10px 14px', background: '#0A1628', fontSize: 9, fontWeight: 800,
                        color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {tx.docs}
          </div>
          {navItems.map(({ slug: s, label, icon: Icon }) => {
            const isActive = currentSlug === s;
            return (
              <Link key={s} to={`/legal/${s}`}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                         textDecoration: 'none', fontSize: 12.5, fontWeight: isActive ? 700 : 500,
                         color: isActive ? '#3A86FF' : '#6B7280', background: isActive ? 'rgba(58,134,255,0.06)' : 'transparent',
                         borderLeft: `3px solid ${isActive ? '#3A86FF' : 'transparent'}`, transition: 'all .15s' }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.color = '#374151'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280'; } }}>
                <Icon size={13} style={{ flexShrink: 0 }} />
                <span style={{ lineHeight: 1.3 }}>{label}</span>
              </Link>
            );
          })}
          <div style={{ padding: '10px 14px', borderTop: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 10, color: '#9CA3AF', lineHeight: 1.5 }}>
              {tx.questions}<br />
              <a href={`mailto:${EMAIL}`} style={{ color: '#3A86FF', textDecoration: 'none', fontWeight: 600 }}>{EMAIL}</a>
            </div>
          </div>
        </nav>

        {/* Content */}
        <article className="legal-content-card">

          {/* Company info */}
          <div style={{ padding: '10px 14px', background: '#F0F9FF', border: '1px solid #BAE6FD',
                        borderRadius: 9, marginBottom: 24, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Shield size={13} color="#0284C7" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 11, color: '#0369A1', lineHeight: 1.6 }}>
              <strong>{COMPANY[l]}</strong> &bull; {ADDRESS[l]} &bull; {REG[l]}
            </div>
          </div>

          {/* Sections */}
          {pageContent.sections.map(section => (
            <RenderSection key={section.n} section={section} />
          ))}

          {/* Related links */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.2rem', borderTop: '1px solid #E5E7EB',
                        display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{tx.related}</span>
            {navItems.filter(n => n.slug !== currentSlug).map(({ slug: s, label }) => (
              <Link key={s} to={`/legal/${s}`}
                style={{ fontSize: 12, color: '#3A86FF', textDecoration: 'none', display: 'flex',
                         alignItems: 'center', gap: 4, fontWeight: 600 }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                {label} <ExternalLink size={10} />
              </Link>
            ))}
          </div>
        </article>
      </div>

      {/* ── Footer ── */}
      <div style={{ background: '#0A1628', borderTop: '1px solid rgba(255,255,255,0.08)',
                    padding: '14px 16px', textAlign: 'center' }}>
        <p style={{ fontSize: 10, color: '#4B5563', margin: 0 }}>
          &copy; {new Date().getFullYear()} {COMPANY[l]}. {l === 'pt' ? 'Todos os direitos reservados.' : l === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'} &bull; {REG[l]}
        </p>
      </div>
    </div>
  );
}
