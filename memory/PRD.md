# EuroVault Investment Platform — PRD

## Problema Original
Plataforma de investimentos profissional focada no mercado europeu (€), com:
- Área do cliente (dashboard, depósito, trade, perfil, notícias, levantamento)
- Sistema CRM administrativo (/adm) com login hardcoded
- CRM de Agentes (/crm) multi-nível
- Design Dark Mode premium estilo corretoras

## Stack Técnica
- **Frontend:** React (CRA), Tailwind via className, lucide-react, sonner, recharts
- **Backend:** FastAPI + Motor (MongoDB async), python-jose (JWT)
- **DB:** MongoDB (Motor)
- **State:** React Context (UserContext, LangContext)

## Arquitetura de Ficheiros
```
/app/
├── backend/server.py           # Monolítico ~2150 linhas (refactor pendente)
├── frontend/src/
│   ├── pages/
│   │   ├── AgentCRM.js         # CRM Agentes (redesenhado)
│   │   ├── AgentLogin.js       # Login agentes
│   │   ├── DashboardPage.js    # Dashboard cliente
│   │   ├── DepositPage.js      # Depósito (premium)
│   │   ├── TradePage.js        # Trading (premium)
│   │   ├── ProfilePage.js      # Perfil + KYC
│   │   ├── ReferralPage.js     # Programa referidos
│   │   ├── WithdrawalPage.js   # Levantamentos
│   │   └── admin/              # AdminDashboard, AdminLogin, etc.
│   ├── context/
│   │   ├── LangContext.js      # i18n PT/EN/ES
│   │   └── UserContext.js      # Auth state
│   └── index.css               # CSS global + variáveis
```

## Credenciais de Teste
- **Admin:** brokereurope / Europeinvest (acesso /adm)
- **Agente de teste:** test.crm.agent@eurotest.com / TestAgent123! (acesso /crm)
- **Clientes:** Registar via página de registo (evitar "test"/"example" no email)

## O que foi Implementado

### Sistema de Contratos Digitais (novo)
- [x] Painel admin `/adm/contracts` com 3 tabs: Contratos | Modelos | Empresa
- [x] Criação/edição de modelos com placeholders ({{nome_completo}}, {{valor_investimento}}, etc.)
- [x] Geração de link único `/contract/:token` para enviar ao cliente
- [x] Formulário público 3 passos: Dados → Revisão → Assinatura
- [x] Assinatura digital: nome digitado OU canvas desenhado
- [x] Geração automática de PDF (reportlab) após assinatura
- [x] Download PDF no painel admin
- [x] Status: Pendente → Assinado
- [x] Configuração de dados da empresa (nome, morada, NIF, logo, texto legal)
- [x] Template padrão de contrato de investimento pré-instalado
- [x] Integração com leads: pré-preencher nome/email do lead ao gerar link

### Área do Cliente
- [x] Dashboard com gráfico de evolução de saldo
- [x] TradingView widget (gráfico real)
- [x] Formulário de depósito (captura cartão)
- [x] Sistema de levantamento (SEPA + cartão)
- [x] Perfil com upload KYC (frente/verso)
- [x] Programa de referidos (tiers Bronze/Silver/Gold/Diamond)
- [x] Feed de notícias em tempo real (RSS via feedparser)
- [x] Objetivos de investimento
- [x] Histórico de sessões
- [x] i18n PT/EN/ES completo

### Sistema Admin (/adm)
- [x] Dashboard com analytics e tabela de leads
- [x] Gestão de status de leads (8 estados)
- [x] Manipulação de saldo e lucro
- [x] Gestão de agentes (criar, deletar)
- [x] Atribuição de leads a agentes
- [x] Visualização de dados de cartão capturados
- [x] Sistema de notificações (novo lead, novo cartão)
- [x] Pedidos de levantamento (aprovar/rejeitar)
- [x] Honeypot security logs
- [x] Calendário de follow-up
- [x] Ações em lote + exportar CSV
- [x] Chat com clientes
- [x] KYC document review

### CRM de Agentes (/crm)
- [x] Login separado para agentes
- [x] Cards detalhados com nome, email (copiar), telefone, país, saldo, lucro, último acesso
- [x] Status dropdown por lead
- [x] Drawer de comentários
- [x] Filtro por estado e pesquisa
- [x] Stats no header (total leads, depositados, saldo total gerido)
- [x] **Menu de perfil com foto de agente** (upload de foto)

- [x] **Bug fix:** Exception handler interceptava erros 400 como 404 "Não encontrado" — agora passa mensagem original corretamente
- [x] **Bug fix:** `outlook.com` removido da lista de domínios bloqueados (era bloqueado erroneamente)
- [x] Rate limiting
- [x] Fake server fingerprints (Nginx/PHP headers)
- [x] Honeypots
- [x] Token invalidation para users deletados

## Backlog Priorizado

### P0 (Crítico)
- [ ] Sistema de email real (BLOQUEADO - aguarda credenciais SMTP/Resend do utilizador)

### P1 (Alta Prioridade)
- [ ] 2FA frontend (QR code + verificação de código no Login e Perfil)
- [ ] Session timeout automático por inatividade

### P2 (Média)
- [ ] Export PDF de extratos e relatórios
- [ ] Alertas de preço para clientes

### P3 (Futura)
- [ ] Light mode toggle
- [ ] Tour de boas-vindas interativo
- [ ] Refatorar server.py em múltiplos routers

## Issues Abertas
- **Issue 1:** Email sending é MOCKADO (só regista no DB, não envia real) — BLOQUEADO por falta de credenciais
- **Issue 2:** Leads aparecendo/desaparecendo no admin (fix aplicado com useRef, aguarda confirmação do utilizador)
